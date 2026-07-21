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
  const client = http; // n8n is at localhost:5678 (http)
  
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

async function inspectNode() {
  try {
    const nodeTypes = await request('/node-types', 'GET');
    const executeWorkflowNode = nodeTypes.find(n => n.name === 'n8n-nodes-base.executeWorkflow');
    if (executeWorkflowNode) {
      console.log('NODE TYPE: ' + executeWorkflowNode.name);
      console.log('VERSIONS: ' + JSON.stringify(executeWorkflowNode.version));
      // In n8n v1+, version is usually an array or a number
      // We can't see the full schema here easily but we see the versions.
    } else {
      console.log('Node type not found');
    }
  } catch (err) {
    console.error('Error:', err.message);
  }
}

inspectNode();
