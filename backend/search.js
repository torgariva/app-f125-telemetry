const https = require('https');

https.get('https://api.github.com/search/code?q=PacketLapData+repo:GeertHofman/F1-Telemetry-Client', {
  headers: { 'User-Agent': 'Node.js' }
}, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => console.log(data));
});
