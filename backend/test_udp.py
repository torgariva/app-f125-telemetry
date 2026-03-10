import socket
import struct
import time

UDP_IP = "127.0.0.0"
UDP_PORT = 20777

sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)

# Create a mock Header (29 bytes)
# struct PacketHeader
# {
#     uint16    m_packetFormat;             // 2024
#     uint8     m_gameYear;                 // Game year - last two digits e.g. 24
#     uint8     m_gameMajorVersion;         // Game major version - "X.00"
#     uint8     m_gameMinorVersion;         // Game minor version - "1.XX"
#     uint8     m_packetVersion;            // Version of this packet type, all start from 1
#     uint8     m_packetId;                 // Identifier for the packet type, see below
#     uint64    m_sessionUID;               // Unique identifier for the session
#     float     m_sessionTime;              // Session timestamp
#     uint32    m_frameIdentifier;          // Identifier for the frame the data was retrieved on
#     uint32    m_overallFrameIdentifier;   // Overall identifier for the frame the data was retrieved on, doesn't go back after flashbacks
#     uint8     m_playerCarIndex;           // Index of player's car in the array
#     uint8     m_secondaryPlayerCarIndex;  // Index of secondary player's car in the array (splitscreen)
#                                           // 255 if no second player
# };
# Format: <HBBBBBQfIIBB = 2 + 1 + 1 + 1 + 1 + 1 + 8 + 4 + 4 + 4 + 1 + 1 = 29 bytes

header = struct.pack('<HBBBBBQfIIBB', 2024, 24, 1, 0, 1, 2, 123456789, 10.0, 100, 100, 0, 255)

# Create a mock LapData (57 bytes)
# We need to trigger the lap completion logic.
# The logic is:
# if current_lap_num > last_lap_num and last_lap_num > 0 and last_lap_time_ms > 0:

# Let's send Lap 1 data
# last_lap_time_ms = offset 0 (4 bytes, uint32)
# sector1_ms = offset 8 (2 bytes, uint16)
# sector1_min = offset 10 (1 byte, uint8)
# sector2_ms = offset 11 (2 bytes, uint16)
# sector2_min = offset 13 (1 byte, uint8)
# current_lap_num = offset 31 (1 byte, uint8)

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
    sock.sendto(packet, ("127.0.0.1", UDP_PORT))

# Send lap 1 in progress
send_lap_data(1, 0, 25000, 0, 30000, 0)
time.sleep(0.1)

# Send lap 2 in progress (which means lap 1 finished)
send_lap_data(2, 90000, 25000, 0, 30000, 0)

print("Mock packets sent.")
