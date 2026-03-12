FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY backend.py .

# Crear directorio para la base de datos SQLite
RUN mkdir -p data

# Exponer el puerto de la API (8000) y el de Telemetría UDP (20777)
EXPOSE 8000
EXPOSE 20777/udp

CMD ["python", "backend.py"]
