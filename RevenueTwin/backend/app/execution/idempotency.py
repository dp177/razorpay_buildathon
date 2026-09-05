import hashlib
from uuid import UUID

class IdempotencyKeyGenerator:
    @staticmethod
    def generate(merchant_id: UUID, run_id: UUID, action: str) -> str:
        raw = f"{str(merchant_id)}:{str(run_id)}:{action}"
        return hashlib.sha256(raw.encode()).hexdigest()
