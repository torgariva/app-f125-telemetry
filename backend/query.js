const res = await fetch('https://api.github.com/search/code?q=PacketLapData+repo:GeertHofman/F1-Telemetry-Client', {
  headers: { 'User-Agent': 'Node.js', 'Authorization': 'Bearer ' + process.env.GITHUB_TOKEN }
});
const data = await res.json();
console.log(JSON.stringify(data, null, 2));
