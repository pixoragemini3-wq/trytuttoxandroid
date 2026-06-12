const https = require('https');

https.get('https://www.scuolainforma.it/2024/05/20/gps-2024-2026-valutazione-titoli-culturali-e-di-servizio-le-tabelle.html', (res) => {
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  res.on('end', () => {
    console.log(data.substring(0, 5000));
  });
}).on('error', (err) => {
  console.log('Error: ' + err.message);
});
