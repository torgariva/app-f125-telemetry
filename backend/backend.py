import socket
import threading
import sqlite3
import os
import struct
import time
import logging
from contextlib import asynccontextmanager
from datetime import datetime
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

# ─── Logging ─────────────────────────────────────────────────────────────────
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s [%(levelname)s] %(message)s',
    datefmt='%Y-%m-%d %H:%M:%S'
)
log = logging.getLogger(__name__)

# ─── Timezone ────────────────────────────────────────────────────────────────
os.environ['TZ'] = 'Europe/Madrid'
try:
    time.tzset()
except AttributeError:
    pass  # Not available on Windows; works correctly in Docker/Linux

# ─── FastAPI app ─────────────────────────────────────────────────────────────
@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    t = threading.Thread(target=udp_listener, daemon=True)
    t.start()
    log.info("UDP listener thread started.")
    yield
    log.info("Shutting down.")

app = FastAPI(lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── Database ─────────────────────────────────────────────────────────────────
DB_PATH = "data/f1_telemetry.db"

def get_conn():
    conn = sqlite3.connect(DB_PATH, check_same_thread=False)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    os.makedirs("data", exist_ok=True)
    conn = get_conn()
    c = conn.cursor()
    c.execute('''
        CREATE TABLE IF NOT EXISTS sessions (
            id        TEXT PRIMARY KEY,
            track_id  TEXT,
            date      TEXT,
            type      TEXT,
            best_lap  TEXT,
            total_laps INTEGER,
            condition TEXT
        )
    ''')
    c.execute('''
        CREATE TABLE IF NOT EXISTS laps (
            id         INTEGER PRIMARY KEY AUTOINCREMENT,
            session_id TEXT,
            lap_number INTEGER,
            s1         REAL,
            s2         REAL,
            s3         REAL,
            total      REAL,
            compound   TEXT,
            wear       REAL,
            pit        INTEGER DEFAULT 0,
            invalid    INTEGER DEFAULT 0
        )
    ''')
    # Migrations: add new columns to existing DBs without breaking them
    for col, defn in [('pit', 'INTEGER DEFAULT 0'), ('invalid', 'INTEGER DEFAULT 0')]:
        try:
            c.execute(f'ALTER TABLE laps ADD COLUMN {col} {defn}')
            log.info(f"Migration: added column '{col}' to laps.")
        except sqlite3.OperationalError:
            pass  # Column already exists
    conn.commit()
    conn.close()
    log.info("Database initialised at %s", DB_PATH)

# ─── F1 25 Protocol Mappings ─────────────────────────────────────────────────

# Track IDs → frontend route IDs  (F1 25 official spec)
TRACK_MAP = {
    0:  'australia',
    2:  'china',
    3:  'bahrain',
    4:  'spain',
    5:  'monaco',
    6:  'canada',
    7:  'uk',
    9:  'hungary',
    10: 'belgium',
    11: 'italy',
    12: 'singapore',
    13: 'japan',
    14: 'abudhabi',
    15: 'usa',
    16: 'brazil',
    17: 'austria',
    19: 'mexico',
    20: 'azerbaijan',
    21: 'saudi',
    24: 'miami',
    26: 'imola',
    27: 'netherlands',   # FIX: was wrongly 31:'imola' and 27:'saudi'
    28: 'vegas',
    29: 'qatar',
    31: 'bahrain',       # Outer circuit variant → fallback bahrain
}

# Session type IDs → human-readable
SESSION_TYPE_MAP = {
    0:  'Unknown',
    1:  'Practice 1',
    2:  'Practice 2',
    3:  'Practice 3',
    4:  'Short Practice',
    5:  'Qualifying 1',
    6:  'Qualifying 2',
    7:  'Qualifying 3',
    8:  'Short Qualifying',
    9:  'One-Shot Qualifying',
    10: 'Race',
    11: 'Race 2',
    12: 'Race 3',
    13: 'Time Trial',
}

# Visual tyre compound IDs → labels  (m_visualTyreCompound)
VISUAL_TYRE_MAP = {
    16: 'Soft',
    17: 'Medium',
    18: 'Hard',
    7:  'Inter',
    8:  'Wet',
    19: 'Wet',   # F1 25 alternate wet id
}

# Actual compound → label (fallback)
ACTUAL_TYRE_MAP = {
    22: 'Soft',   # C6 (F1 25 new)
    16: 'Soft',   # C5
    17: 'Medium', # C4
    18: 'Medium', # C3
    19: 'Hard',   # C2
    20: 'Hard',   # C1
    21: 'Hard',   # C0
    7:  'Inter',
    8:  'Wet',
}

# ─── Shared in-memory state (protected by a lock) ─────────────────────────────
_lock = threading.Lock()

# session_uid → dict with 'tyre_compound', 'tyre_visual'
tyre_state: dict = {}

# session_uid → dict with 'pit_lap' set (lap numbers where pit occurred)
pit_state: dict = {}

# ─── UDP Listener ──────────────────────────────────────────────────────────────
HEADER_FMT = '<HBBBBBQfIIBB'  # 29 bytes
HEADER_SIZE = struct.calcsize(HEADER_FMT)  # = 29

LAP_DATA_SIZE = 57            # bytes per car in Packet ID 2
CAR_STATUS_SIZE = 55          # bytes per car in Packet ID 7

def udp_listener():
    UDP_IP   = "0.0.0.0"
    UDP_PORT = 20777
    sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    sock.bind((UDP_IP, UDP_PORT))
    log.info("Listening for F1 25 telemetry on UDP port %d ...", UDP_PORT)

    current_session_uid = None
    current_track_id    = 'bahrain'
    last_lap_num        = 0
    session_state: dict = {}  # lap_num -> {'s1': float, 's2': float}

    while True:
        try:
            data, _ = sock.recvfrom(4096)
            if len(data) < HEADER_SIZE:
                continue

            header         = struct.unpack_from(HEADER_FMT, data, 0)
            packet_id      = header[5]
            session_uid    = str(header[6])
            player_car_idx = header[10]

            if session_uid == "0":
                continue  # Main menu — ignore

            # ── Packet ID 1: Session Data ──────────────────────────────────
            if packet_id == 1:
                if len(data) < HEADER_SIZE + 8:
                    continue
                # Offsets relative to end of header (F1 23/24/25 typical structure):
                # +0 = weather (uint8)
                # +1 = trackTemp (int8)
                # +2 = airTemp (int8)
                # +3 = totalLaps (uint8)
                # +4 = trackLength (uint16)
                # +6 = sessionType (uint8)
                # +7 = trackId (int8)
                weather_id    = struct.unpack_from('<B', data, HEADER_SIZE + 0)[0]
                session_type  = struct.unpack_from('<B', data, HEADER_SIZE + 6)[0]
                track_id_int  = struct.unpack_from('<b', data, HEADER_SIZE + 7)[0]

                current_track_id  = TRACK_MAP.get(track_id_int, 'bahrain')
                session_type_str  = SESSION_TYPE_MAP.get(session_type, 'Unknown')
                condition_str     = 'Wet' if weather_id >= 3 else 'Dry'

                if current_session_uid:
                    conn = get_conn()
                    c = conn.cursor()
                    c.execute(
                        "UPDATE sessions SET track_id=?, type=?, condition=? WHERE id=?",
                        (current_track_id, session_type_str, condition_str, current_session_uid)
                    )
                    conn.commit()
                    conn.close()

            # ── New session detection ──────────────────────────────────────
            if session_uid != current_session_uid:
                current_session_uid = session_uid
                last_lap_num        = 0
                session_state       = {}
                with _lock:
                    tyre_state[session_uid] = {'compound': 'Unknown', 'visual': 'Unknown'}
                    pit_state[session_uid]  = set()

                current_time = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
                conn = get_conn()
                c = conn.cursor()
                c.execute(
                    "INSERT OR IGNORE INTO sessions (id, track_id, date, type, best_lap, total_laps, condition) VALUES (?, ?, ?, ?, ?, ?, ?)",
                    (session_uid, current_track_id, current_time, 'Unknown', '--:--.---', 0, 'Dry')
                )
                conn.commit()
                conn.close()
                log.info("New session detected: %s on %s at %s", session_uid, current_track_id, current_time)

            # ── Packet ID 7: Car Status Data ──────────────────────────────
            if packet_id == 7:
                offset = HEADER_SIZE + (player_car_idx * CAR_STATUS_SIZE)
                if len(data) < offset + 7:
                    continue
                actual_tyre  = struct.unpack_from('<B', data, offset + 5)[0]
                visual_tyre  = struct.unpack_from('<B', data, offset + 6)[0]
                compound     = ACTUAL_TYRE_MAP.get(actual_tyre, 'Unknown')
                visual       = VISUAL_TYRE_MAP.get(visual_tyre, compound)
                with _lock:
                    tyre_state[session_uid] = {'compound': compound, 'visual': visual}

            # ── Packet ID 2: Lap Data ─────────────────────────────────────
            if packet_id == 2:
                offset = HEADER_SIZE + (player_car_idx * LAP_DATA_SIZE)
                if len(data) < offset + LAP_DATA_SIZE:
                    continue

                last_lap_time_ms = struct.unpack_from('<I', data, offset + 0)[0]
                sector1_ms       = struct.unpack_from('<H', data, offset + 8)[0]
                sector1_min      = struct.unpack_from('<B', data, offset + 10)[0]
                sector2_ms       = struct.unpack_from('<H', data, offset + 11)[0]
                sector2_min      = struct.unpack_from('<B', data, offset + 13)[0]

                # Offsets for F1 24/25 specification
                current_lap_num  = struct.unpack_from('<B', data, offset + 30)[0]
                pit_status       = struct.unpack_from('<B', data, offset + 31)[0]
                lap_invalid      = struct.unpack_from('<B', data, offset + 34)[0]

                s1_time = sector1_min * 60.0 + sector1_ms / 1000.0
                s2_time = sector2_min * 60.0 + sector2_ms / 1000.0

                # Track sector times mid-lap
                if current_lap_num not in session_state:
                    session_state[current_lap_num] = {'s1': 0.0, 's2': 0.0, 'invalid': 0}
                if s1_time > 0:
                    session_state[current_lap_num]['s1'] = s1_time
                if s2_time > 0:
                    session_state[current_lap_num]['s2'] = s2_time
                if lap_invalid:
                    session_state[current_lap_num]['invalid'] = 1

                # Track pit-stop laps
                if pit_status in (1, 2):  # 1=pitting, 2=in pit area
                    with _lock:
                        if session_uid in pit_state:
                            pit_state[session_uid].add(current_lap_num)

                # Lap completed when lap number increments
                if current_lap_num > last_lap_num and last_lap_num > 0 and last_lap_time_ms > 0:
                    lap_time_sec = last_lap_time_ms / 1000.0
                    prev_state   = session_state.get(last_lap_num, {})
                    s1           = prev_state.get('s1', 0.0)
                    s2           = prev_state.get('s2', 0.0)
                    s3           = round(lap_time_sec - s1 - s2, 3) if (s1 > 0 and s2 > 0) else 0.0
                    is_invalid   = prev_state.get('invalid', 0)

                    with _lock:
                        ts = tyre_state.get(session_uid, {})
                        compound = ts.get('visual', 'Unknown')
                        pitted   = 1 if last_lap_num in pit_state.get(session_uid, set()) else 0

                    minutes   = int(lap_time_sec // 60)
                    seconds   = lap_time_sec % 60
                    lap_str   = f"{minutes}:{seconds:06.3f}"

                    log.info(
                        "Lap %d done | %s | S1:%.3f S2:%.3f S3:%.3f | %s%s",
                        last_lap_num, lap_str, s1, s2, s3, compound,
                        ' [INVALID]' if is_invalid else ''
                    )

                    conn = get_conn()
                    c = conn.cursor()
                    c.execute(
                        "INSERT INTO laps (session_id, lap_number, s1, s2, s3, total, compound, wear, pit, invalid) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
                        (session_uid, last_lap_num, s1, s2, s3, lap_time_sec, compound, 0.0, pitted, is_invalid)
                    )

                    # Update session best lap (only valid laps)
                    if not is_invalid:
                        c.execute("SELECT best_lap FROM sessions WHERE id = ?", (session_uid,))
                        row = c.fetchone()
                        current_best = row['best_lap'] if row else '--:--.---'
                        is_new_best  = False
                        if current_best == '--:--.---':
                            is_new_best = True
                        else:
                            best_parts = current_best.split(':')
                            best_sec   = float(best_parts[0]) * 60 + float(best_parts[1])
                            if lap_time_sec < best_sec:
                                is_new_best = True
                        new_best_str = lap_str if is_new_best else current_best
                        c.execute(
                            "UPDATE sessions SET total_laps=?, best_lap=? WHERE id=?",
                            (last_lap_num, new_best_str, session_uid)
                        )

                    conn.commit()
                    conn.close()

                last_lap_num = current_lap_num

        except Exception as e:
            log.warning("UDP parse error: %s", e)

# ─── API Endpoints ────────────────────────────────────────────────────────────

@app.get("/api/sessions/summary")
def get_sessions_summary():
    conn = get_conn()
    c = conn.cursor()
    c.execute("SELECT track_id, COUNT(*) as cnt FROM sessions GROUP BY track_id")
    rows = c.fetchall()
    conn.close()
    return {r['track_id']: r['cnt'] for r in rows}


# IMPORTANT: /sessions/detail/{id} MUST come before /sessions/{track_id}
# FastAPI matches routes in registration order — if {track_id} were first,
# the word "detail" would be interpreted as a track_id param.
@app.get("/api/sessions/detail/{session_id}")
def get_session_detail(session_id: str):
    conn = get_conn()
    c = conn.cursor()
    c.execute("SELECT * FROM sessions WHERE id = ?", (session_id,))
    row = c.fetchone()
    conn.close()
    if row is None:
        raise HTTPException(status_code=404, detail="Session not found")
    return {
        "id":        row["id"],
        "trackId":   row["track_id"],
        "type":      row["type"],
        "date":      row["date"],
        "bestLap":   row["best_lap"],
        "laps":      row["total_laps"],
        "condition": row["condition"],
    }


@app.get("/api/sessions/{track_id}")
def get_sessions(track_id: str):
    conn = get_conn()
    c = conn.cursor()
    c.execute(
        "SELECT * FROM sessions WHERE track_id = ? ORDER BY date DESC",
        (track_id,)
    )
    rows = c.fetchall()
    conn.close()
    return [
        {
            "id":       r["id"],
            "type":     r["type"],
            "date":     r["date"],
            "bestLap":  r["best_lap"],
            "laps":     r["total_laps"],
            "condition": r["condition"],
        }
        for r in rows
    ]


@app.get("/api/laps/{session_id}")
def get_laps(session_id: str):
    conn = get_conn()
    c = conn.cursor()
    c.execute(
        "SELECT * FROM laps WHERE session_id = ? ORDER BY lap_number ASC",
        (session_id,)
    )
    rows = c.fetchall()
    conn.close()
    return [
        {
            "lap":      r["lap_number"],
            "s1":       r["s1"],
            "s2":       r["s2"],
            "s3":       r["s3"],
            "total":    r["total"],
            "compound": r["compound"],
            "wear":     r["wear"],
            "pit":      r["pit"],
            "invalid":  r["invalid"],
        }
        for r in rows
    ]


@app.delete("/api/sessions/{session_id}")
def delete_session(session_id: str):
    conn = get_conn()
    c = conn.cursor()
    c.execute("DELETE FROM sessions WHERE id = ?", (session_id,))
    c.execute("DELETE FROM laps WHERE session_id = ?", (session_id,))
    conn.commit()
    conn.close()
    return {"status": "success"}


@app.get("/api/debug/sessions")
def debug_sessions():
    conn = get_conn()
    c = conn.cursor()
    c.execute("SELECT * FROM sessions ORDER BY date DESC LIMIT 50")
    rows = c.fetchall()
    conn.close()
    return [dict(r) for r in rows]

@app.get("/api/debug/laps")
def debug_laps():
    conn = get_conn()
    c = conn.cursor()
    c.execute("SELECT * FROM laps ORDER BY id DESC LIMIT 100")
    rows = c.fetchall()
    conn.close()
    return [dict(r) for r in rows]


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
