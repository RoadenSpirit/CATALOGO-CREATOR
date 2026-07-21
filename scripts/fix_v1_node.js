const fs = require('fs');
const http = require('http');

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
  const client = http;
  
  return new Promise((resolve, reject) => {
    const opts = {
      hostname: url.hostname,
      port: url.port,
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

async function fixV1Node() {
  const MOTOR_ID = "OVcWRaCGB0aGve9L";
  const YOURBRAND_ID = "YOUR_WORKFLOW_ID";

  console.log('--- APLICANDO FORMATO PERFECTO V1 PARA N8N ---');
  
  const yourbrandPath = 'flujos/yourbrand_batch_evolved_v1.json';
  const yourbrandJson = JSON.parse(fs.readFileSync(yourbrandPath, 'utf8'));
  
  const executeNode = yourbrandJson.nodes.find(n => n.name === 'ExecuteRenderMotor');
  if (executeNode) {
    // EN N8N V1, el workflowId NO es un String en el nivel superior de parameters.
    // SE REQUIERE USAR EL OBJETO COMPLETO COMO ESPERA EL EDITOR O DECLARARLO COMO EXPRESIÓN
    
    executeNode.typeVersion = 1;
    executeNode.parameters = {
      "workflowId": MOTOR_ID, 
      "mode": "parameter",
      "options": {
        "waitForSubworkflow": true
      },
      "parameters": {
        "parameter": [
          { "name": "marca", "value": "yourbrand" },
          { "name": "logoPath", "value": "/data/logo2.jpeg" },
          { "name": "productoPath", "value": "={{ $('LoopNode').item.json.path }}" },
          { "name": "destinoPath", "value": "=/data/fotosProcesadas/{{ $('LoopNode').item.json.categoryRaw || 'Resultados' }}/{{ $('LoopNode').item.json.fileName }}" },
          { "name": "productId", "value": "={{ $('LoopNode').item.json.productId }}" },
          { "name": "usdPrice", "value": "={{ $('LoopNode').item.json.usdFormatted }}" },
          { "name": "cupPrice", "value": "={{ $('LoopNode').item.json.cupFormatted }}" }
        ]
      }
    };
    
    executeNode.executeOnce = false;

    console.log('Mapeo de datos (mode: parameter) restaurado.');
  }
  
  fs.writeFileSync(yourbrandPath, JSON.stringify(yourbrandJson, null, 2));
  await request(`/workflows/${YOURBRAND_ID}`, 'PUT', sanitizeWorkflow(yourbrandJson));
  
  console.log('--- LISTO ---');
}

fixV1Node().catch(err => console.error('ERROR:', err.message));
