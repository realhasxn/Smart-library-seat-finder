import concurrent.futures
import json
import time
import urllib.request

SUPABASE_URL = "https://bsqfixokaqhvbxzhsjui.supabase.co"
SUPABASE_ANON_KEY = "sb_publishable_EOW8eQXhU3jQhyRntuhp4w_K2bCmQth"
TARGET_SEAT = "F1-S01"

def attempt_booking(student_id: int) -> bool:
    url = f"{SUPABASE_URL}/rest/v1/rpc/book_seat_atomic"
    payload = json.dumps({
        "p_seat_id": TARGET_SEAT,
        "p_reg_no": f"12615{student_id:03d}",
        "p_expires_at": int(time.time() * 1000) + 300000,
    }).encode("utf-8")

    req = urllib.request.Request(
        url,
        data=payload,
        headers={
            "apikey": SUPABASE_ANON_KEY,
            "Authorization": f"Bearer {SUPABASE_ANON_KEY}",
            "Content-Type": "application/json",
        },
        method="POST",
    )
    try:
        with urllib.request.urlopen(req) as resp:
            return json.loads(resp.read().decode()) is True
    except Exception:
        return False

if __name__ == "__main__":
    print(f"Firing 50 simultaneous booking requests at {TARGET_SEAT}...")
    start = time.time()
    with concurrent.futures.ThreadPoolExecutor(max_workers=50) as executor:
        results = list(executor.map(attempt_booking, range(1, 51)))

    winners = sum(1 for r in results if r)
    blocked = sum(1 for r in results if not r)
    elapsed_ms = (time.time() - start) * 1000

    print(f"\nCompleted in {elapsed_ms:.1f} ms")
    print(f"Successful bookings : {winners}  (MUST BE 1)")
    print(f"Blocked duplicates  : {blocked}  (MUST BE 49)")