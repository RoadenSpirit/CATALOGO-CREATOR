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

// Propiedades que el API de n8n acepta
const ALLOWED_TOP_LEVEL = ['name', 'nodes', 'connections', 'settings', 'staticData'];

function sanitizeWorkflow(wf) {
  const out = {};
  for (const key of ALLOWED_TOP_LEVEL) {
    if (wf[key] !== undefined) out[key] = wf[key];
  }
  return out;
}

async function rebuildAll() {
  console.log('--- INICIANDO RECONSTRUCCIÓN TOTAL (STRICT) ---');
  
  // 1. Find and Delete old Motor (if exists)
  const wfs = await request('/workflows', 'GET');
  const oldMotor = (wfs.data || wfs).find(w => w.name.includes('Motor Render Universal') || w.name === 'MOTOR_RENDER_OFFICIAL_V1');
  if (oldMotor) {
    console.log(`Borrando motor antiguo [ID: ${oldMotor.id}]...`);
    try { await request(`/workflows/${oldMotor.id}`, 'DELETE'); } catch(e) { console.log('Aviso: ' + e.message); }
  }

  // 2. Create new Motor
  console.log('Creando motor nuevo...');
  const motorJson = JSON.parse(fs.readFileSync('flujos/motor_render_universal_v2.json', 'utf8'));
  motorJson.name = "MOTOR_RENDER_OFFICIAL_V1"; 
  
  const createdMotor = await request('/workflows', 'POST', sanitizeWorkflow(motorJson));
  const NEW_MOTOR_ID = createdMotor.id;
  console.log(`Motor creado con éxito. NUEVO ID: ${NEW_MOTOR_ID}`);

  // 3. Update YourBrand Batch locally
  console.log('Actualizando flujo YourBrand Batch localmente...');
  const yourbrandPath = 'flujos/yourbrand_batch_evolved_v1.json';
  const yourbrandJson = JSON.parse(fs.readFileSync(yourbrandPath, 'utf8'));
  
  const executeNode = yourbrandJson.nodes.find(n => n.name === 'ExecuteRenderMotor');
  if (executeNode) {
    executeNode.parameters.workflowId = {
      "__rl": true,
      "value": NEW_MOTOR_ID,
      "mode": "id"
    };
  }
  fs.writeFileSync(yourbrandPath, JSON.stringify(yourbrandJson, null, 2));

  // 4. Update YourBrand Batch in n8n
  console.log('Subiendo YourBrand Batch actualizado...');
  const yourbrandId = (wfs.data || wfs).find(w => w.name.includes('YourBrand Batch'))?.id || 'YOUR_WORKFLOW_ID';
  
  await request(`/workflows/${yourbrandId}`, 'PUT', sanitizeWorkflow(yourbrandJson));
  
  console.log('--- RECONSTRUCCIÓN COMPLETADA CON ÉXITO ---');
  console.log(`Nuevo ID Motor: ${NEW_MOTOR_ID}`);
  console.log(`ID YourBrand: ${yourbrandId}`);
}

rebuildAll().catch(err => console.error('ERROR FATAL:', err.message));
