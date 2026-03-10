import sqlite3
import os

DB_PATH = "data/f1_telemetry.db"
if not os.path.exists(DB_PATH):
    print("No DB found")
else:
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute("SELECT session_id, count(*) FROM laps GROUP BY session_id")
    for row in c.fetchall():
        print(f"Session {row[0]}: {row[1]} laps")
