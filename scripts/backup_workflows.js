const fs = require('fs');
const http = require('http');
const path = require('path');

function loadEnv() {
  const envFile = '.env';
  if (!fs.existsSync(envFile)) return {};
  return fs.readFileSync(envFile, 'utf8').split('\n').reduce((acc, line) => {
    const parts = line.split('=');
    if (parts.length >= 2) acc[parts[0].trim()] = parts.slice(1).join('=').trim().replace(/^["']|["']$/g, '');
    return acc;
  }, {});
}

const env = loadEnv();
const API_URL = env.N8N_API_URL;
const API_KEY = env.N8N_API_KEY;

function request(urlPath) {
  const url = new URL(API_URL + urlPath);
  return new Promise((resolve, reject) => {
    http.get({
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      headers: { 'X-N8N-API-KEY': API_KEY }
    }, (res) => {
      let data = '';
      res.on('data', d => data += d);
      res.on('end', () => resolve(JSON.parse(data)));
    }).on('error', reject);
  });
}

async function backup() {
  console.log('Listing workflows...');
  const list = await request('/workflows');
  const workflows = list.data || list;
  
  if (!fs.existsSync('workflows')) fs.mkdirSync('workflows');

  for (const wf of workflows) {
    console.log(`Backing up: ${wf.name} (${wf.id})`);
    const fullWf = await request(`/workflows/${wf.id}`);
    const safeName = wf.name.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    fs.writeFileSync(path.join('workflows', `${safeName}.json`), JSON.stringify(fullWf.data || fullWf, null, 2));
  }
  console.log('Backup complete.');
}

backup().catch(console.error);
