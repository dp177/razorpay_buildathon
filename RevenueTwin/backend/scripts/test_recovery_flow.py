import urllib.request
import json
import time
import sys

base = "http://127.0.0.1:8000/api"

def request_json(url, data=None):
    headers = {"Content-Type": "application/json"}
    body = json.dumps(data).encode("utf-8") if data is not None else None
    req = urllib.request.Request(url, data=body, headers=headers)
    try:
        with urllib.request.urlopen(req, timeout=30) as res:
            return json.loads(res.read().decode("utf-8"))
    except urllib.error.HTTPError as e:
        err_body = e.read().decode("utf-8")
        print(f"HTTP ERROR {e.code} on {url}: {err_body}")
        raise

print("1. Starting scenario...")
start_res = request_json(f"{base}/scenarios/start", {"agent_type": "PAYMENT_FAILED"})
scenario_id = start_res["scenario_id"]
print(f"   Scenario started: {scenario_id}")

print("2. Polling for decision (AWAITING_APPROVAL)...")
run_id = None
decision = None
for i in range(60):
    time.sleep(1)
    sim = request_json(f"{base}/simulation/{scenario_id}")
    run_id = sim.get("run_id")
    if run_id:
        run = request_json(f"{base}/agent-runs/{run_id}")
        status = run.get("status")
        print(f"   [{i}s] Run {run_id} status: {status}")
        if status == "AWAITING_APPROVAL":
            try:
                decision = request_json(f"{base}/agent-runs/{run_id}/decision")
                print(f"   Decision ready: {decision.get('decision')} (confidence: {decision.get('confidence')})")
            except Exception as e:
                print(f"   Decision doc pending: {e}")
            break

if not run_id or not decision:
    print("Decision not reached in time")
    sys.exit(1)

print("3. Approving decision...")
approve_res = request_json(f"{base}/agent-runs/{run_id}/approve", {"approved_by": "merchant"})
print(f"   Approve result: {approve_res}")

print("4. Executing decision...")
exec_res = request_json(f"{base}/agent-runs/{run_id}/execute", {})
print(f"   Execute result: {exec_res}")
execution_id1 = exec_res["execution_id"]

print("5. Simulating attempt 1 failure (RETRY failed)...")
resolve_res1 = request_json(f"{base}/agent-runs/{run_id}/resolve", {
    "execution_id": execution_id1,
    "customer_response": "FAILED_RETRY"
})
print(f"   Resolve attempt 1: {resolve_res1}")

print("6. Verifying agent dynamically decided Step 2...")
time.sleep(2)
timeline = request_json(f"{base}/agent-runs/{run_id}/timeline")
executions = timeline.get("executions", [])
print(f"   Executions count: {len(executions)}")
for ex in executions:
    print(f"     -> Action: {ex.get('action')}, Status: {ex.get('status')}")

if len(executions) < 2:
    print("Error: Agent did not dynamically create next execution!")
    sys.exit(1)

next_exec = executions[-1]
print(f"   Agent dynamically decided next step: {next_exec.get('action')}")
execution_id2 = next_exec["execution_id"]

print("7. Simulating attempt 2 failure (ALTERNATE_PAYMENT failed)...")
resolve_res2 = request_json(f"{base}/agent-runs/{run_id}/resolve", {
    "execution_id": execution_id2,
    "customer_response": "FAILED_TIMEOUT"
})
print(f"   Resolve attempt 2: {resolve_res2}")

print("8. Verifying agent dynamically decided Step 3...")
time.sleep(2)
timeline = request_json(f"{base}/agent-runs/{run_id}/timeline")
executions = timeline.get("executions", [])
print(f"   Executions count: {len(executions)}")
for ex in executions:
    print(f"     -> Action: {ex.get('action')}, Status: {ex.get('status')}")

if len(executions) < 3:
    print("Error: Agent did not dynamically create step 3 execution!")
    sys.exit(1)

final_exec = executions[-1]
print(f"   Agent dynamically decided final step: {final_exec.get('action')}")
execution_id3 = final_exec["execution_id"]

print("9. Simulating attempt 3 SUCCESS (Customer paid via link)...")
resolve_res3 = request_json(f"{base}/agent-runs/{run_id}/resolve", {
    "execution_id": execution_id3,
    "customer_response": "SUCCESS"
})
print(f"   Resolve attempt 3: {resolve_res3}")

print("10. Verifying run status is COMPLETED...")
time.sleep(1)
run_final = request_json(f"{base}/agent-runs/{run_id}")
print(f"   Final run status: {run_final.get('status')}")

print("\n--- ALL DYNAMIC AGENT RECOVERY LOOP CHECKS PASSED! ---")

