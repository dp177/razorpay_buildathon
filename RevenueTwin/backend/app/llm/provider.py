import os
import json
import asyncio
from typing import Any, Dict, Type
from pydantic import BaseModel, ValidationError
from app.llm.base import LLMProvider
import openai

class RetryableLLMError(Exception):
    pass


class OpenAIProvider(LLMProvider):
    def __init__(self):
        self.client = openai.AsyncOpenAI(
            api_key=os.environ.get("LLM_API_KEY", "dummy"),
        )
        self.model = os.environ.get("LLM_MODEL", "gpt-4o-mini")

    async def complete(self, prompt: str) -> str:
        res = await self.client.chat.completions.create(
            model=self.model,
            messages=[{"role": "user", "content": prompt}],
        )
        return res.choices[0].message.content

    async def structured_complete(self, prompt: str, schema: Type[BaseModel]) -> BaseModel:
        res = await self.client.beta.chat.completions.parse(
            model=self.model,
            messages=[{"role": "user", "content": prompt}],
            response_format=schema
        )
        return res.choices[0].message.parsed

    async def health_check(self) -> Dict[str, Any]:
        try:
            await self.client.models.list()
            return {"status": "healthy", "provider": "openai", "model": self.model}
        except Exception as e:
            return {"status": "unhealthy", "provider": "openai", "model": self.model, "error": str(e)}


def _lenient_parse(schema: Type[BaseModel], raw: dict) -> BaseModel:
    """
    Step 6 three-step fail-closed parse strategy:
    1. Validate directly
    2. Patch missing required fields with safe defaults
    3. Raise if still invalid (never execute an invalid LLM response)
    """
    try:
        return schema.model_validate(raw)
    except ValidationError:
        pass

    # Step 2: patch missing required fields with safe defaults
    patched = dict(raw)
    patched.setdefault("confidence", 0.60)
    patched.setdefault("reason_codes", ["LLM_PARTIAL_RESPONSE"])
    # Step 6 evidence format: {signal, importance, description}
    patched.setdefault("evidence", [{
        "signal": "LLM_PARTIAL",
        "importance": "LOW",
        "description": "Model returned incomplete response; safe defaults applied."
    }])
    patched.setdefault("rejected_actions", [])
    patched.setdefault("risk_flags", ["INCOMPLETE_LLM_OUTPUT"])
    patched.setdefault("next_step", "REQUEST_APPROVAL")
    patched.setdefault("rationale", "Partial LLM response — defaults applied.")
    patched.setdefault("observation_window_hours", 24)
    patched.setdefault("requires_approval", True)

    try:
        return schema.model_validate(patched)
    except ValidationError as e:
        # Step 3: fail closed — raise so the engine falls back to DETERMINISTIC_FALLBACK
        raise ValueError(f"LLM response failed schema validation after repair: {e}") from e


# OpenRouter retired several ":free" slugs; map them to the paid ids.
_MODEL_ALIASES = {
    "meta-llama/llama-4-scout:free": "meta-llama/llama-4-scout",
}

# Models to try when the primary model is rate-limited or unavailable
_FREE_FALLBACK_MODELS = [
    "nvidia/nemotron-3.5-lightning:free",
    "minimax/minimax-m2.7:free",
    "google/gemma-4-31b-it:free",
    "liquid/lfm-2.5-2.6b:free",
    "google/gemma-4-26b-a4b-it:free",
]


def _resolve_model(model: str) -> str:
    return _MODEL_ALIASES.get(model, model)


class OpenRouterProvider(LLMProvider):
    """OpenRouter through its OpenAI-compatible Chat Completions endpoint."""

    def __init__(self):
        api_key = os.environ.get("OPENROUTER_API_KEY")
        if not api_key:
            raise RuntimeError("OPENROUTER_API_KEY is required when LLM_PROVIDER=openrouter")
        self.client = openai.AsyncOpenAI(
            base_url="https://openrouter.ai/api/v1",
            api_key=api_key,
            timeout=8.0,
            default_headers={
                "HTTP-Referer": os.environ.get("OPENROUTER_SITE_URL", "http://localhost:5173"),
                "X-OpenRouter-Title": "RevenueTwin",
            },
        )
        _BLOCKED_MODELS = {
            "z-ai/glm-5.2:free",
            "nvidia/nemotron-3-nano-30b-a3b",
            "mistralai/mistral-7b-instruct:free",
        }
        _DEFAULT_MODEL = "meta-llama/llama-4-scout"
        raw_model = os.environ.get("OPENROUTER_MODEL", _DEFAULT_MODEL)
        chosen = _DEFAULT_MODEL if raw_model in _BLOCKED_MODELS else raw_model
        self.model = _resolve_model(chosen)
        self.reasoning_enabled = os.environ.get("OPENROUTER_REASONING", "false").lower() == "true"
        print(f"[OpenRouterProvider] model={self.model!r}  reasoning={self.reasoning_enabled}  (raw_env={raw_model!r})")

    def _get_fallback_models(self) -> list[str]:
        """Return fallback models excluding the primary one."""
        resolved = [_resolve_model(m) for m in _FREE_FALLBACK_MODELS]
        seen = {self.model}
        out = []
        for m in resolved:
            if m not in seen:
                seen.add(m)
                out.append(m)
        return out

    async def _call_with_retry(self, call_fn, model: str, max_retries: int = 0):
        """Execute call_fn(model); on failure, try 1 fallback model then fail fast to local engine."""
        RETRYABLE_EXCEPTIONS = (
            openai.RateLimitError,
            openai.APITimeoutError,
            openai.APIConnectionError,
            openai.InternalServerError,
            RetryableLLMError,
            asyncio.TimeoutError,
        )
        try:
            return await call_fn(model)
        except (openai.NotFoundError, *RETRYABLE_EXCEPTIONS) as e:
            print(f"[OpenRouter] Primary model {model} failed ({type(e).__name__}): {e}. Trying fast fallback...")

        for fallback in self._get_fallback_models()[:1]:
            try:
                print(f"[OpenRouter] Trying fast fallback model: {fallback}")
                return await call_fn(fallback)
            except (openai.NotFoundError, *RETRYABLE_EXCEPTIONS) as e:
                print(f"[OpenRouter] Fallback {fallback} also failed: {e}")

        raise RuntimeError("OpenRouter primary & fallback unavailable — switching to local reasoning engine.")

    async def complete(self, prompt: str) -> str:
        async def _do_call(model: str) -> str:
            kwargs = dict(
                model=model,
                messages=[{"role": "user", "content": prompt}],
            )
            if self.reasoning_enabled:
                kwargs["extra_body"] = {"reasoning": {"enabled": True}}
            res = await self.client.chat.completions.create(**kwargs)
            return res.choices[0].message.content or ""

        return await self._call_with_retry(_do_call, self.model)

    async def structured_complete(self, prompt: str, schema: Type[BaseModel]) -> BaseModel:
        """
        Step 6 hardened JSON parsing:
        1. Parse JSON from LLM response
        2. Attempt lenient repair if validation fails
        3. Retry once on JSON decode error
        4. Fail closed (raise) if all attempts fail
        """
        schema_json = json.dumps(schema.model_json_schema(), indent=2)
        from typing import get_args
        allowed_actions = get_args(schema.model_fields["decision"].annotation)
        allowed_str = ", ".join(f"'{a}'" for a in allowed_actions)

        augmented_prompt = (
            f"{prompt}\n\n"
            "CRITICAL: Respond with ONLY a valid JSON object. No markdown fences, no prose.\n"
            "You MUST include ALL of the following keys in your JSON:\n"
            "  decision, confidence, evidence, rationale, observation_window_hours,\n"
            "  requires_approval, reason_codes, rejected_actions, risk_flags, next_step\n\n"
            f"CRITICAL: The 'decision' field MUST exactly match one of these values: {allowed_str}\n"
            "DO NOT INVENT ACTIONS (e.g. do not output 'WAIT').\n\n"
            "evidence items must be: {\"signal\": \"...\", \"importance\": \"HIGH|MEDIUM|LOW\", \"description\": \"...\"}\n\n"
            f"JSON Schema:\n{schema_json}"
        )

        _parse_attempt = [0]  # mutable for closure

        async def _do_call(model: str) -> BaseModel:
            kwargs = dict(
                model=model,
                messages=[{"role": "user", "content": augmented_prompt}],
                response_format={"type": "json_object"},
            )
            if self.reasoning_enabled:
                kwargs["extra_body"] = {"reasoning": {"enabled": True}}

            try:
                res = await asyncio.wait_for(self.client.chat.completions.create(**kwargs), timeout=8.0)
            except asyncio.TimeoutError as te:
                raise RetryableLLMError(f"OpenRouter timeout after 8s on {model}") from te
            content = res.choices[0].message.content
            if not content:
                raise ValueError("OpenRouter returned no decision content")

            # Strip accidental markdown code fences
            content = content.strip()
            if content.startswith("```"):
                content = content.split("```")[1]
                if content.startswith("json"):
                    content = content[4:]
                content = content.strip()

            try:
                raw = json.loads(content)
            except json.JSONDecodeError as je:
                _parse_attempt[0] += 1
                if _parse_attempt[0] <= 1:
                    # Retry once — some models produce trailing commas or truncated JSON
                    raise RetryableLLMError(f"JSON parse error (will retry): {je}")
                raise ValueError(f"LLM returned invalid JSON after retry: {je}") from je

            return _lenient_parse(schema, raw)

        return await self._call_with_retry(_do_call, self.model)

    async def health_check(self) -> Dict[str, Any]:
        """Lightweight health probe — does not consume decision quota."""
        try:
            res = await self.client.chat.completions.create(
                model=self.model,
                messages=[{"role": "user", "content": "ping"}],
                max_tokens=5,
            )
            return {
                "status": "healthy",
                "provider": "openrouter",
                "model": self.model,
                "response": res.choices[0].message.content,
            }
        except Exception as e:
            return {
                "status": "unhealthy",
                "provider": "openrouter",
                "model": self.model,
                "error": str(e),
            }
