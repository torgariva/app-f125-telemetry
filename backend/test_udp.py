import socket
import struct
import time

UDP_IP = "127.0.0.1"
UDP_PORT = 20777

sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)

# Create a mock Header (29 bytes)
header = struct.pack('<HBBBBBQfIIBB', 2024, 24, 1, 0, 1, 2, 123456789, 10.0, 100, 100, 0, 255)

def send_lap_data(lap_num, last_lap_time_ms, s1_ms, s1_min, s2_ms, s2_min):
    lap_data = bytearray(57 * 22) # 22 cars
    
    # Pack for car 0
    struct.pack_into('<I', lap_data, 0, last_lap_time_ms)
    struct.pack_into('<H', lap_data, 8, s1_ms)
    struct.pack_into('<B', lap_data, 10, s1_min)
    struct.pack_into('<H', lap_data, 11, s2_ms)
    struct.pack_into('<B', lap_data, 13, s2_min)
    struct.pack_into('<B', lap_data, 31, lap_num)
    
    packet = header + lap_data
    sock.sendto(packet, (UDP_IP, UDP_PORT))

# Initialize session
print("Sending session start...")
sess_header = struct.pack('<HBBBBBQfIIBB', 2024, 24, 1, 0, 1, 1, 123456789, 10.0, 100, 100, 0, 255)
sess_data = bytearray(632) 
struct.pack_into('<b', sess_data, 36 - 29, 3) # bahrain
sock.sendto(sess_header + sess_data, (UDP_IP, UDP_PORT))
time.sleep(0.5)

# Lap 1
send_lap_data(1, 0, 25000, 0, 30000, 0)
time.sleep(0.1)
# Cross finish line, Lap 2 starts. last lap = 80s
send_lap_data(2, 80000, 25000, 0, 30000, 0)
time.sleep(0.1)
send_lap_data(2, 80000, 26000, 0, 31000, 0)
time.sleep(0.1)
# Cross finish line, Lap 3 starts. last lap = 82s
send_lap_data(3, 82000, 26000, 0, 31000, 0)
time.sleep(0.1)
send_lap_data(3, 82000, 24000, 0, 29000, 0)
time.sleep(0.1)
# Cross finish line, Lap 4 starts. last lap = 81s
send_lap_data(4, 81000, 24000, 0, 29000, 0)

print("Mock packets sent.")
