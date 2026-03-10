const dgram = require('dgram');
const client = dgram.createSocket('udp4');

const header = Buffer.alloc(29);
header.writeUInt16LE(2024, 0); // m_packetFormat
header.writeUInt8(24, 2); // m_gameYear
header.writeUInt8(1, 3); // m_gameMajorVersion
header.writeUInt8(0, 4); // m_gameMinorVersion
header.writeUInt8(1, 5); // m_packetVersion
header.writeUInt8(2, 6); // m_packetId (Lap Data)
header.writeBigUInt64LE(123456789n, 7); // m_sessionUID
header.writeFloatLE(10.0, 15); // m_sessionTime
header.writeUInt32LE(100, 19); // m_frameIdentifier
header.writeUInt32LE(100, 23); // m_overallFrameIdentifier
header.writeUInt8(0, 27); // m_playerCarIndex
header.writeUInt8(255, 28); // m_secondaryPlayerCarIndex

function sendLapData(lapNum, lastLapTimeMs, s1Ms, s1Min, s2Ms, s2Min) {
    const lapData = Buffer.alloc(57 * 22);
    lapData.writeUInt32LE(lastLapTimeMs, 0); // lastLapTimeInMS
    lapData.writeUInt16LE(s1Ms, 8); // sector1MS
    lapData.writeUInt8(s1Min, 10); // sector1Minutes
    lapData.writeUInt16LE(s2Ms, 11); // sector2MS
    lapData.writeUInt8(s2Min, 13); // sector2Minutes
    lapData.writeUInt8(lapNum, 31); // currentLapNum
    
    const packet = Buffer.concat([header, lapData]);
    client.send(packet, 20777, '127.0.0.1', (err) => {
        if (err) console.error(err);
    });
}

// Send lap 1 in progress
sendLapData(1, 0, 25000, 0, 30000, 0);
setTimeout(() => {
    // Send lap 2 in progress (lap 1 finished)
    sendLapData(2, 90000, 25000, 0, 30000, 0);
    setTimeout(() => client.close(), 100);
}, 100);
