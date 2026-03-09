import socket
import threading
import sqlite3
import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

# Permitir peticiones desde el frontend en React
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # En producción, limitar a la IP de tu frontend
    allow_methods=["*"],
    allow_headers=["*"],
)

DB_PATH = "data/f1_telemetry.db"

def init_db():
    os.makedirs("data", exist_ok=True)
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    # Tablas básicas
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
    
    while True:
        try:
            data, addr = sock.recvfrom(2048)
            # Aquí va la lógica de decodificación del paquete binario de F1 25.
            # Dependiendo del packet_id (0=Motion, 2=LapData, 6=Telemetry, etc.)
            # se procesa y se guarda en SQLite.
        except Exception as e:
            print(f"Error procesando paquete: {e}")

@app.on_event("startup")
def startup_event():
    init_db()
    # Iniciar el listener UDP en un hilo en segundo plano
    threading.Thread(target=udp_listener, daemon=True).start()

@app.get("/api/sessions/{track_id}")
def get_sessions(track_id: str):
    # Ejemplo de consulta a la BD
    # conn = sqlite3.connect(DB_PATH)
    # ... fetch data ...
    return []

@app.get("/api/laps/{session_id}")
def get_laps(session_id: str):
    return []

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
