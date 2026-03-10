import sqlite3

conn = sqlite3.connect('data/f1_telemetry.db')
c = conn.cursor()

c.execute("SELECT * FROM sessions")
sessions = c.fetchall()
print(f"Total Sessions: {len(sessions)}")
c.execute("SELECT * FROM laps")
laps = c.fetchall()
print(f"Total Laps: {len(laps)}")

if laps:
    print(f"First lap: {laps[0]}")
    print(f"Last lap: {laps[-1]}")
