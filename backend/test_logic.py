import sqlite3

# Test the exact logic used in backend.py
recorded_laps = set()
session_state = {}

def process_lap(current_lap_num, last_lap_time_ms, s1_time, s2_time, session_uid):
    if current_lap_num not in session_state:
        session_state[current_lap_num] = {'s1': 0, 's2': 0}
    
    if s1_time > 0:
        session_state[current_lap_num]['s1'] = s1_time
    if s2_time > 0:
        session_state[current_lap_num]['s2'] = s2_time

    completed_lap_num = current_lap_num - 1
    if completed_lap_num > 0 and completed_lap_num not in recorded_laps and last_lap_time_ms > 0:
        lap_time_sec = last_lap_time_ms / 1000.0
        
        s1 = session_state.get(completed_lap_num, {}).get('s1', 0)
        s2 = session_state.get(completed_lap_num, {}).get('s2', 0)
        s3 = lap_time_sec - s1 - s2 if (s1 > 0 and s2 > 0) else 0
        
        minutes = int(lap_time_sec // 60)
        seconds = lap_time_sec % 60
        lap_str = f"{minutes}:{seconds:06.3f}"
        
        print(f"[*] Vuelta {completed_lap_num} completada! Tiempo: {lap_str} (S1: {s1:.3f}, S2: {s2:.3f}, S3: {s3:.3f})")
        recorded_laps.add(completed_lap_num)

# Simulate lap 1 in progress
process_lap(1, 0, 25.1, 0, "123")
process_lap(1, 0, 25.1, 30.2, "123")
# Lap 1 finishes! We enter lap 2. last_lap_time is 85000 ms = 85s
process_lap(2, 85000, 0, 0, "123")
# Lap 2 in progress
process_lap(2, 85000, 24.9, 0, "123")
process_lap(2, 85000, 24.9, 29.8, "123")
# Lap 2 finishes! We enter lap 3. last_lap_time is 84000 ms = 84s
process_lap(3, 84000, 0, 0, "123")
# Lap 3 in progress
process_lap(3, 84000, 25.0, 0, "123")

print("Done recording loops.")
