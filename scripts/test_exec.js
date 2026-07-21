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

const env = loadEnv();
const API_URL = env.N8N_API_URL;
const API_KEY = env.N8N_API_KEY;

function request(path, method, body = null) {
  const url = new URL(API_URL + path);
  const client = url.protocol === 'https:' ? https : http;
  
  return new Promise((resolve, reject) => {
    const opts = {
      hostname: url.hostname,
      port: url.port || (url.protocol === 'https:' ? 443 : 80),
      path: url.pathname + url.search,
      method,
      headers: { 
        'X-N8N-API-KEY': API_KEY,
        'Content-Type': 'application/json'
      }
    };
    
    const req = client.request(opts, (res) => {
      let data = '';
      res.on('data', d => data += d);
      res.on('end', () => {
        try {
          const json = data ? JSON.parse(data) : {};
          if (res.statusCode >= 200 && res.statusCode < 300) resolve(json);
          else reject(new Error(`HTTP ${res.statusCode}: ${json.message || data}`));
        } catch(e) { reject(new Error(`HTTP ${res.statusCode}: ${data}`)); }
      });
    });
    
    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function runTest() {
  const YOURBRAND_ID = "YOUR_WORKFLOW_ID";
  console.log(`--- INICIANDO PRUEBA DE EJECUCIÓN PARA WORKFLOW ${YOURBRAND_ID} ---`);
  
  try {
    const execution = await request(`/workflows/${YOURBRAND_ID}/run`, 'POST');
    console.log('Ejecución iniciada con éxito.');
    console.log('ID de Ejecución:', execution.id);
    console.log('Estado:', execution.status);
    
    // Check execution status periodically
    let finished = false;
    let attempts = 0;
    while (!finished && attempts < 10) {
      await new Promise(r => setTimeout(r, 3000));
      const status = await request(`/executions/${execution.id}`, 'GET');
      console.log(`Intento ${attempts + 1}: Estado actual - ${status.status}`);
      if (status.status === 'success' || status.status === 'error' || status.status === 'crashed') {
        finished = true;
        if (status.status === 'error') {
          console.error('ERROR EN EJECUCIÓN:', JSON.stringify(status.data.resultData.error, null, 2));
        } else {
          console.log('Ejecución finalizada con éxito.');
        }
      }
      attempts++;
    }
  } catch (err) {
    console.error('Error al intentar ejecutar el workflow:', err.message);
  }
}

runTest();
