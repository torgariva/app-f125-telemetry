const dgram = require('dgram');
const server = dgram.createSocket('udp4');

server.on('message', (msg, rinfo) => {
  if (msg.length < 29) return;
  
  const packetFormat = msg.readUInt16LE(0);
  const packetId = msg.readUInt8(5);
  const playerCarIndex = msg.readUInt8(20); // wait, offset 20? Let's check header
  
  // Header:
  // 0: packetFormat (2)
  // 2: gameYear (1)
  // 3: gameMajorVersion (1)
  // 4: gameMinorVersion (1)
  // 5: packetVersion (1)
  // 6: packetId (1)
  // 7: sessionUID (8)
  // 15: sessionTime (4)
  // 19: frameIdentifier (4)
  // 23: overallFrameIdentifier (4)
  // 27: playerCarIndex (1)
  // 28: secondaryPlayerCarIndex (1)
  
  const pci = msg.readUInt8(27);
  
  if (packetId === 2) {
    console.log(`Format: ${packetFormat}, Length: ${msg.length}`);
    const lapSize = Math.floor((msg.length - 29) / 22);
    console.log(`Calculated Lap Size: ${lapSize}`);
    
    const offset = 29 + (pci * lapSize);
    console.log(`Player Car Index: ${pci}, Offset: ${offset}`);
    
    for (let i = 0; i < lapSize; i++) {
      console.log(`${i}: ${msg.readUInt8(offset + i)}`);
    }
    process.exit(0);
  }
});

server.bind(20777);
console.log("Listening on 20777...");
