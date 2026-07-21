const fs = require('fs');
const http = require('http');
const https = require('https');

function loadEnv() {
  const envFile = '.env';
  if (!fs.existsSync(envFile)) return {};
  return fs.readFileSync(envFile, 'utf8').split('\n').reduce((acc, line) => {
    const parts = line.split('=');
    if (parts.length >= 2) acc[parts[0].trim()] = parts.slice(1).join('=').trim().replace(/^["']|["']$/g, '');
    return acc;
  }, {});
}

async function getWorkflows() {
  const env = loadEnv();
  const url = new URL(env.N8N_API_URL + '/workflows');
  const client = url.protocol === 'https:' ? https : http;

  return new Promise((resolve, reject) => {
    client.get({
      hostname: url.hostname,
      port: url.port || (url.protocol === 'https:' ? 443 : 80),
      path: url.pathname + url.search,
      headers: { 'X-N8N-API-KEY': env.N8N_API_KEY }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          resolve(json.data || json);
        } catch(e) { reject(e); }
      });
    }).on('error', reject);
  });
}

getWorkflows().then(wfs => {
  const motor = wfs.find(w => w.name.includes('Motor Render Universal'));
  const yourbrand = wfs.find(w => w.name.includes('YourBrand Batch'));
  if (motor) console.log('MOTOR_ID=' + motor.id);
  if (yourbrand) console.log('YOURBRAND_ID=' + yourbrand.id);
}).catch(err => console.error(err.message));
