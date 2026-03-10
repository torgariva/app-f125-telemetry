import sqlite3
conn = sqlite3.connect('backend/data/f1_telemetry.db')
c = conn.cursor()
c.execute("SELECT * FROM laps")
print(c.fetchall())
conn.close()
