import socket
import threading
import sqlite3
import os
import struct
import time
from datetime import datetime
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# Configurar la zona horaria a Madrid
os.environ['TZ'] = 'Europe/Madrid'
try:
    time.tzset()
except AttributeError:
    pass # tzset no está disponible en Windows, pero en Docker (Linux) sí funcionará

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

DB_PATH = "data/f1_telemetry.db"

# Mapa de IDs de circuitos de F1 a los IDs de nuestro frontend
TRACK_MAP = {
    0: 'australia', 1: 'france', 2: 'china', 3: 'bahrain', 4: 'spain', 5: 'monaco',
    6: 'canada', 7: 'uk', 8: 'germany', 9: 'hungary', 10: 'belgium', 11: 'italy',
    12: 'singapore', 13: 'japan', 14: 'abudhabi', 15: 'usa', 16: 'brazil', 
    17: 'austria', 18: 'russia', 19: 'mexico', 20: 'azerbaijan', 21: 'bahrain_short',
    22: 'uk_short', 23: 'usa_short', 24: 'japan_short', 25: 'hanoi', 26: 'zandvoort',
    27: 'imola', 28: 'portimao', 29: 'saudi', 30: 'miami', 31: 'vegas', 32: 'qatar'
}

# Tipos de neumáticos visuales (Packet 7)
TYRE_MAP = {
    16: 'Soft', 17: 'Medium', 18: 'Hard', 7: 'Inter', 8: 'Wet',
    9: 'Dry', 10: 'Wet', 11: 'Super Soft', 12: 'Soft', 13: 'Medium', 14: 'Hard', 15: 'Wet'
}


def init_db():
    os.makedirs("data", exist_ok=True)
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute('''CREATE TABLE IF NOT EXISTS sessions (id TEXT PRIMARY KEY, track_id TEXT, date TEXT, type TEXT, best_lap TEXT, total_laps INTEGER, condition TEXT)''')
    c.execute('''CREATE TABLE IF NOT EXISTS laps (id INTEGER PRIMARY KEY AUTOINCREMENT, session_id TEXT, lap_number INTEGER, s1 REAL, s2 REAL, s3 REAL, total REAL, compound TEXT, wear REAL)''')
    conn.commit()
    conn.close()

def udp_listener():
    UDP_IP = "0.0.0.0"
    UDP_PORT = 20777
    sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    sock.bind((UDP_IP, UDP_PORT))
    print(f"[*] Escuchando telemetría F1 en el puerto UDP {UDP_PORT}...")
    
    current_session_uid = None
    current_track_id = 'bahrain'
    recorded_laps = set()
    session_state = {} # lap_num -> {'s1': 0, 's2': 0}
    current_weather = 'Dry'
    current_tyre = 'Soft'
    current_tyre_wear = 0.0

    while True:
        try:
            data, addr = sock.recvfrom(2048)
            if len(data) < 29:
                continue

            # Decodificar Cabecera (Header) - 29 bytes
            header = struct.unpack_from('<HBBBBBQfIIBB', data, 0)
            packet_format = header[0]
            packet_id = header[5]
            session_uid = str(header[6])
            player_car_index = header[10]

            if session_uid == "0":
                continue # Menú principal

            # Packet ID 1: Session Data
            if packet_id == 1:
                # Extraemos el clima del offset 29 (1 byte unsigned char)
                weather_id = struct.unpack_from('<B', data, 29)[0]
                if weather_id in [3, 4, 5]:  # 3=light rain, 4=heavy rain, 5=storm
                    current_weather = 'Wet'
                else:  # 0=clear, 1=light cloud, 2=overcast
                    current_weather = 'Dry'
                
                track_id_int = struct.unpack_from('<b', data, 36)[0]
                new_track_id = TRACK_MAP.get(track_id_int, f'unknown_{track_id_int}')
                
                # Actualizar la base de datos solo si el circuito cambia
                if current_session_uid and current_track_id != new_track_id:
                    current_track_id = new_track_id
                    try:
                        conn = sqlite3.connect(DB_PATH)
                        c = conn.cursor()
                        c.execute("UPDATE sessions SET track_id = ? WHERE id = ?", (current_track_id, current_session_uid))
                        conn.commit()
                        conn.close()
                    except sqlite3.OperationalError:
                        pass # Ignore lock, we'll try later or next session update
                else:
                    current_track_id = new_track_id

            # Inicializar nueva sesión en BD
            if session_uid != current_session_uid:
                current_session_uid = session_uid
                recorded_laps = set()
                session_state = {}
                current_time = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
                conn = sqlite3.connect(DB_PATH)
                c = conn.cursor()
                c.execute("INSERT OR IGNORE INTO sessions (id, track_id, date, type, best_lap, total_laps, condition) VALUES (?, ?, ?, ?, ?, ?, ?)",
                          (session_uid, current_track_id, current_time, 'Time Trial', '--:--.---', 0, current_weather))
                conn.commit()
                conn.close()
                print(f"[*] Nueva sesión detectada: {session_uid} en {current_track_id} a las {current_time} con Clima: {current_weather}")

            # Packet ID 7: Car Status
            elif packet_id == 7:
                try:
                    # Dynamically calculate offset for status size
                    status_size = (len(data) - 29) // 22
                    status_data_offset = 29 + (player_car_index * status_size)
                    
                    visual_tyre_byte = struct.unpack_from('<B', data, status_data_offset + 26)[0]
                    current_tyre = TYRE_MAP.get(visual_tyre_byte, f'C{visual_tyre_byte}')
                except Exception as e:
                    print(f"[!] Error extrayendo neumático en Packet 7: {e}")

            # Packet ID 10: Car Damage
            elif packet_id == 10:
                try:
                    damage_size = (len(data) - 29) // 22
                    damage_data_offset = 29 + (player_car_index * damage_size)
                    
                    # Extract 4 floats (tyresWear[4])
                    tyres_wear = struct.unpack_from('<ffff', data, damage_data_offset)
                    current_tyre_wear = sum(tyres_wear) / 4.0
                except Exception as e:
                    print(f"[!] Error extrayendo desgaste en Packet 10: {e}")

            # Packet ID 2: Lap Data
            elif packet_id == 2:
                if packet_format == 2023:
                    lap_size = 43
                    lap_data_offset = 29 + (player_car_index * lap_size)
                    last_lap_time_ms = struct.unpack_from('<I', data, lap_data_offset)[0]
                    sector1_ms = struct.unpack_from('<H', data, lap_data_offset + 8)[0]
                    sector2_ms = struct.unpack_from('<H', data, lap_data_offset + 10)[0]
                    current_lap_num = struct.unpack_from('<B', data, lap_data_offset + 25)[0]
                    s1_time = sector1_ms / 1000.0
                    s2_time = sector2_ms / 1000.0
                else:
                    # F1 24/25
                    lap_size = (len(data) - 29) // 22
                    lap_data_offset = 29 + (player_car_index * lap_size)
                    
                    last_lap_time_ms = struct.unpack_from('<I', data, lap_data_offset)[0]
                    sector1_ms = struct.unpack_from('<H', data, lap_data_offset + 8)[0]
                    sector1_min = struct.unpack_from('<B', data, lap_data_offset + 10)[0]
                    sector2_ms = struct.unpack_from('<H', data, lap_data_offset + 11)[0]
                    sector2_min = struct.unpack_from('<B', data, lap_data_offset + 13)[0]
                    
                    # En F1 24/25 m_currentLapNum está en el offset 33 de LapData (revisado por documentación UDP F1 25)
                    current_lap_num = struct.unpack_from('<B', data, lap_data_offset + 33)[0]
                    
                    # Print debug info once per session or lap
                    if current_lap_num not in session_state:
                        print(f"[DEBUG] Packet 2 length: {len(data)}, calculated lap_size: {lap_size}")
                    
                    if current_lap_num > 150: # Invalid lap number, probably wrong offset
                        # Let's search for the lap number (usually 1, 2, 3...)
                        if current_lap_num not in session_state:
                            bytes_str = " ".join([f"{b:02x}" for b in data[lap_data_offset:lap_data_offset+lap_size]])
                            print(f"[DEBUG] Wrong lap num {current_lap_num}. Bytes: {bytes_str}")
                    
                    s1_time = sector1_min * 60 + sector1_ms / 1000.0
                    s2_time = sector2_min * 60 + sector2_ms / 1000.0

                # Guardar los sectores mientras la vuelta está en progreso
                if current_lap_num not in session_state:
                    session_state[current_lap_num] = {'s1': 0, 's2': 0}
                
                if s1_time > 0:
                    session_state[current_lap_num]['s1'] = s1_time
                if s2_time > 0:
                    session_state[current_lap_num]['s2'] = s2_time

                # Si el número de vuelta cambia, hemos completado una vuelta
                completed_lap_num = current_lap_num - 1
                
                # Check ALL previous laps to ensure missed transitions are marked
                for lap_to_check in range(1, current_lap_num):
                    if lap_to_check not in recorded_laps:
                        if lap_to_check == completed_lap_num and last_lap_time_ms > 0:
                            lap_time_sec = last_lap_time_ms / 1000.0
                            
                            s1 = session_state.get(lap_to_check, {}).get('s1', 0)
                            s2 = session_state.get(lap_to_check, {}).get('s2', 0)
                            s3 = lap_time_sec - s1 - s2 if (s1 > 0 and s2 > 0) else 0
                            
                            minutes = int(lap_time_sec // 60)
                            seconds = lap_time_sec % 60
                            lap_str = f"{minutes}:{seconds:06.3f}"
                            
                            try:
                                conn = sqlite3.connect(DB_PATH, timeout=5.0) # Explicit wait up to 5s
                                c = conn.cursor()
                                
                                c.execute("INSERT INTO laps (session_id, lap_number, s1, s2, s3, total, compound, wear) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
                                          (session_uid, lap_to_check, s1, s2, s3, lap_time_sec, current_tyre, round(current_tyre_wear, 2)))
                                
                                c.execute("SELECT best_lap FROM sessions WHERE id = ?", (session_uid,))
                                row = c.fetchone()
                                current_best = row[0] if row else '--:--.---'
                                
                                is_new_best = False
                                if current_best == '--:--.---':
                                    is_new_best = True
                                else:
                                    best_parts = current_best.split(':')
                                    if len(best_parts) == 2:
                                        best_sec = float(best_parts[0]) * 60 + float(best_parts[1])
                                        if lap_time_sec < best_sec:
                                            is_new_best = True
                                            
                                new_best_str = lap_str if is_new_best else current_best
                                
                                c.execute("UPDATE sessions SET total_laps = ?, best_lap = ? WHERE id = ?", 
                                          (len(recorded_laps) + 1, new_best_str, session_uid))
                                
                                conn.commit()
                                conn.close()
                                
                                print(f"[*] Vuelta {lap_to_check} completada y registrada! Tiempo: {lap_str}")
                                recorded_laps.add(lap_to_check)
                            except Exception as e:
                                print(f"[!] Error guardando vuelta {lap_to_check} en DB: {e}")
                                # No añadimos a recorded_laps para reintentar en el próximo frame
                        elif lap_to_check < completed_lap_num:
                            # We completely bypassed this lap (e.g. invalid lap = 0 ms or flashback bug)
                            # Mark it recorded so we don't hold the queue
                            recorded_laps.add(lap_to_check)

            # Packet ID 11: Session History
            elif packet_id == 11:
                if len(data) < 36:
                    continue
                car_idx = struct.unpack_from('<B', data, 29)[0]
                if car_idx == player_car_index:
                    num_laps = struct.unpack_from('<B', data, 30)[0]
                    
                    for i in range(num_laps):
                        lap_num = i + 1
                        if lap_num not in recorded_laps:
                            offset = 36 + (i * 14)
                            if len(data) < offset + 14:
                                break
                            
                            lap_time_ms = struct.unpack_from('<I', data, offset)[0]
                            
                            if lap_time_ms > 0:
                                s1_ms = struct.unpack_from('<H', data, offset + 4)[0]
                                s1_min = struct.unpack_from('<B', data, offset + 6)[0]
                                s2_ms = struct.unpack_from('<H', data, offset + 7)[0]
                                s2_min = struct.unpack_from('<B', data, offset + 9)[0]
                                s3_ms = struct.unpack_from('<H', data, offset + 10)[0]
                                s3_min = struct.unpack_from('<B', data, offset + 12)[0]
                                
                                s1_time = s1_min * 60 + s1_ms / 1000.0
                                s2_time = s2_min * 60 + s2_ms / 1000.0
                                s3_time = s3_min * 60 + s3_ms / 1000.0
                                lap_time_sec = lap_time_ms / 1000.0
                                
                                minutes = int(lap_time_sec // 60)
                                seconds = lap_time_sec % 60
                                lap_str = f"{minutes}:{seconds:06.3f}"
                                
                                try:
                                    conn = sqlite3.connect(DB_PATH, timeout=5.0)
                                    c = conn.cursor()
                                    
                                    c.execute("INSERT INTO laps (session_id, lap_number, s1, s2, s3, total, compound, wear) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
                                              (session_uid, lap_num, s1_time, s2_time, s3_time, lap_time_sec, current_tyre, round(current_tyre_wear, 2)))
                                    
                                    c.execute("SELECT best_lap FROM sessions WHERE id = ?", (session_uid,))
                                    row = c.fetchone()
                                    current_best = row[0] if row else '--:--.---'
                                    
                                    is_new_best = False
                                    if current_best == '--:--.---':
                                        is_new_best = True
                                    else:
                                        best_parts = current_best.split(':')
                                        if len(best_parts) == 2:
                                            best_sec = float(best_parts[0]) * 60 + float(best_parts[1])
                                            if lap_time_sec < best_sec:
                                                is_new_best = True
                                                
                                    new_best_str = lap_str if is_new_best else current_best
                                    
                                    c.execute("UPDATE sessions SET total_laps = ?, best_lap = ? WHERE id = ?", 
                                              (len(recorded_laps) + 1, new_best_str, session_uid))
                                    
                                    conn.commit()
                                    conn.close()
                                    
                                    print(f"[*] Vuelta {lap_num} completada y registrada (Historial)! Tiempo: {lap_str}")
                                    recorded_laps.add(lap_num)
                                except Exception as e:
                                    print(f"[!] Error guardando vuelta {lap_num} en DB: {e}")

        except Exception as e:
            import traceback
            print(f"ERROR procesando UDP: {e}")
            traceback.print_exc()


@app.on_event("startup")
def startup_event():
    init_db()
    threading.Thread(target=udp_listener, daemon=True).start()

@app.get("/api/sessions/summary")
def get_sessions_summary():
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute("SELECT track_id, COUNT(*) FROM sessions GROUP BY track_id")
    rows = c.fetchall()
    conn.close()
    
    result = {}
    for r in rows:
        result[r[0]] = r[1]
    return result

@app.get("/api/sessions/{track_id}")
def get_sessions(track_id: str):
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    c = conn.cursor()
    c.execute("SELECT * FROM sessions WHERE track_id = ? ORDER BY date DESC", (track_id,))
    rows = c.fetchall()
    conn.close()
    
    result = []
    for r in rows:
        result.append({
            "id": r["id"],
            "type": r["type"],
            "date": r["date"],
            "bestLap": r["best_lap"],
            "laps": r["total_laps"],
            "condition": r["condition"]
        })
    return result

@app.get("/api/sessions/single/{session_id}")
def get_session(session_id: str):
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    c = conn.cursor()
    c.execute("SELECT * FROM sessions WHERE id = ?", (session_id,))
    row = c.fetchone()
    conn.close()
    
    if row:
        return {
            "id": row["id"],
            "track_id": row["track_id"],
            "type": row["type"],
            "date": row["date"],
            "bestLap": row["best_lap"],
            "laps": row["total_laps"],
            "condition": row["condition"]
        }
    return {"error": "Session not found"}

@app.get("/api/laps/{session_id}")
def get_laps(session_id: str):
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    c = conn.cursor()
    c.execute("SELECT * FROM laps WHERE session_id = ? ORDER BY lap_number ASC", (session_id,))
    rows = c.fetchall()
    conn.close()
    
    result = []
    for r in rows:
        result.append({
            "lap": r["lap_number"],
            "s1": r["s1"],
            "s2": r["s2"],
            "s3": r["s3"],
            "total": r["total"],
            "compound": r["compound"],
            "wear": r["wear"]
        })
    return result

@app.delete("/api/sessions/{session_id}")
def delete_session(session_id: str):
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute("DELETE FROM sessions WHERE id = ?", (session_id,))
    c.execute("DELETE FROM laps WHERE session_id = ?", (session_id,))
    conn.commit()
    conn.close()
    return {"status": "success"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
