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

const ALLOWED_TOP_LEVEL = ['name', 'nodes', 'connections', 'settings', 'staticData'];

function sanitizeWorkflow(wf) {
  const out = {};
  for (const key of ALLOWED_TOP_LEVEL) {
    if (wf[key] !== undefined) out[key] = wf[key];
  }
  return out;
}

async function fixAndPush() {
  const MOTOR_ID = "OVcWRaCGB0aGve9L";
  const YOURBRAND_ID = "YOUR_WORKFLOW_ID";

  // 1. Update ExecuteRenderMotor in YourBrand Batch
  console.log('Aplicando correcciones al nodo ExecuteRenderMotor...');
  const yourbrandPath = 'flujos/yourbrand_batch_evolved_v1.json';
  const yourbrandJson = JSON.parse(fs.readFileSync(yourbrandPath, 'utf8'));
  
  const executeNode = yourbrandJson.nodes.find(n => n.name === 'ExecuteRenderMotor');
  if (executeNode) {
    executeNode.parameters.workflowId = {
      "__rl": true,
      "value": `http://localhost:5678/workflow/${MOTOR_ID}`,
      "mode": "url"
    };
    
    // Ensure it executes once for each item
    // In n8n, this is usually controlled by the input data or node settings
    // We'll make sure it's set correctly
    executeNode.parameters.mode = "parameter";
    
    // Keep parameters clean
    executeNode.parameters.parameters = {
      "parameter": [
        { "name": "marca", "value": "yourbrand" },
        { "name": "logoPath", "value": "/data/logo2.jpeg" },
        { "name": "productoPath", "value": "={{ $('LoopNode').item.json.path }}" },
        { "name": "destinoPath", "value": "=/data/fotosProcesadas/{{ $('LoopNode').item.json.categoryRaw || 'Resultados' }}/{{ $('LoopNode').item.json.fileName }}" },
        { "name": "productId", "value": "={{ $('LoopNode').item.json.productId }}" },
        { "name": "usdPrice", "value": "={{ $('LoopNode').item.json.usdFormatted }}" },
        { "name": "cupPrice", "value": "={{ $('LoopNode').item.json.cupFormatted }}" }
      ]
    };
    
    console.log('ExecuteRenderMotor configurado con URL y mapeo de ítems.');
  }
  
  fs.writeFileSync(yourbrandPath, JSON.stringify(yourbrandJson, null, 2));

  // 2. Push YourBrand Batch
  console.log('Subiendo YourBrand Batch actualizado a n8n...');
  await request(`/workflows/${YOURBRAND_ID}`, 'PUT', sanitizeWorkflow(yourbrandJson));
  
  // 3. Optional: Verify Motor Trigger (ensure it's passthrough)
  const motorPath = 'flujos/motor_render_universal_v2.json';
  const motorJson = JSON.parse(fs.readFileSync(motorPath, 'utf8'));
  const triggerNode = motorJson.nodes.find(n => n.type === 'n8n-nodes-base.executeWorkflowTrigger');
  if (triggerNode) {
    triggerNode.parameters = { "inputSource": "passthrough" };
  }
  fs.writeFileSync(motorPath, JSON.stringify(motorJson, null, 2));
  
  console.log('Subiendo MOTOR_RENDER_OFFICIAL_V1 actualizado...');
  await request(`/workflows/${MOTOR_ID}`, 'PUT', sanitizeWorkflow(motorJson));

  console.log('--- CAMBIOS APLICADOS ---');
  console.log(`URL Sub-flujo: http://localhost:5678/workflow/${MOTOR_ID}`);
}

fixAndPush().catch(err => console.error('ERROR:', err.message));
