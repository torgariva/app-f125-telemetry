import socket
import struct

UDP_IP = "0.0.0.0"
UDP_PORT = 20777

sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
sock.bind((UDP_IP, UDP_PORT))
print("Listening for F1 25 telemetry...")

while True:
    data, addr = sock.recvfrom(2048)
    if len(data) < 29:
        continue
    
    header = struct.unpack_from('<HBBBBBQfIIBB', data, 0)
    packet_format = header[0]
    packet_id = header[5]
    player_car_index = header[10]
    
    if packet_id == 2:
        print(f"Packet Format: {packet_format}, Size: {len(data)}")
        
        # Try to find where the lap number is (usually 1, 2, 3...)
        # We'll dump the first 60 bytes of the player's lap data
        lap_size = (len(data) - 29) // 22
        print(f"Calculated lap_size: {lap_size}")
        
        offset = 29 + (player_car_index * lap_size)
        player_data = data[offset:offset+lap_size]
        
        print("Player Lap Data bytes:")
        for i in range(len(player_data)):
            print(f"{i}: {player_data[i]}")
            
        break
