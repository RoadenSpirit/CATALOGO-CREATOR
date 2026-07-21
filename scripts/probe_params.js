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
      path: url.pathname,
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

async function probeWithParams() {
  const MOTOR_ID = "OVcWRaCGB0aGve9L";
  
  const testWorkflow = {
    name: "PROBE_PARAMS",
    nodes: [
      {
        parameters: {},
        name: "Start",
        type: "n8n-nodes-base.manualTrigger",
        typeVersion: 1,
        position: [0, 0]
      },
      {
        parameters: {
          workflowId: MOTOR_ID,
          mode: "parameter",
          parameters: {
            parameter: [
              { name: "test", value: "val" }
            ]
          }
        },
        name: "Execute",
        type: "n8n-nodes-base.executeWorkflow",
        typeVersion: 1,
        position: [250, 0]
      }
    ],
    connections: {
      "Start": {
        "main": [[{ "node": "Execute", "type": "main", "index": 0 }]]
      }
    },
    settings: { executionOrder: "v1" }
  };

  try {
    const created = await request('/workflows', 'POST', testWorkflow);
    const wf = await request(`/workflows/${created.id}`, 'GET');
    const node = wf.nodes.find(n => n.name === 'Execute');
    console.log(JSON.stringify(node, null, 2));
    await request(`/workflows/${created.id}`, 'DELETE');
  } catch (err) {
    console.error('Error:', err.message);
  }
}

probeWithParams();
