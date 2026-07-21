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

async function listAllWorkflows() {
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

listAllWorkflows().then(wfs => {
  console.log('--- WORKFLOWS DISPONIBLES EN N8N ---');
  wfs.forEach(w => {
    console.log(`- NOMBRE: "${w.name}" | ID: "${w.id}"`);
  });
}).catch(err => console.error(err.message));
