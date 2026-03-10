import socket
import struct

UDP_IP = "0.0.0.0"
UDP_PORT = 20777
HEADER_FMT = '<HBBBBBQfIIBB'
HEADER_SIZE = struct.calcsize(HEADER_FMT)

sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
sock.bind((UDP_IP, UDP_PORT))
print(f"Listening on port {UDP_PORT}...")

packets_seen = set()

while True:
    data, addr = sock.recvfrom(4096)
    if len(data) < HEADER_SIZE:
        continue
    
    header = struct.unpack_from(HEADER_FMT, data, 0)
    packet_id = header[5]
    
    if packet_id == 2 and packet_id not in packets_seen:
        packets_seen.add(packet_id)
        print(f"Packet ID 2 (LapData) total length: {len(data)}")
        print(f"Without header (29 bytes): {len(data) - HEADER_SIZE}")
        print(f"Divided by 22 cars: {(len(data) - HEADER_SIZE) / 22}")
        print(f"Divided by 20 cars: {(len(data) - HEADER_SIZE) / 20}")
        break
