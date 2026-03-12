import sqlite3

conn = sqlite3.connect('data/f1_telemetry.db')
c = conn.cursor()
try:
    c.execute("ALTER TABLE sessions ADD COLUMN best_s1 REAL")
    c.execute("ALTER TABLE sessions ADD COLUMN best_s2 REAL")
    c.execute("ALTER TABLE sessions ADD COLUMN best_s3 REAL")
    c.execute("ALTER TABLE sessions ADD COLUMN best_lap_overall REAL")
except Exception as e:
    print(e)
conn.commit()
conn.close()
