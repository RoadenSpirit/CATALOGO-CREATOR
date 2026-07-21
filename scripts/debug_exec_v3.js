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

async function debugExec() {
  try {
    const execs = await request('/executions?limit=3', 'GET');
    for (const e of (execs.data || [])) {
      if (e.status === 'error') {
        const detail = await request('/executions/' + e.id, 'GET');
        console.log(`================\nERROR EN EJECUCIÓN ${e.id}:\n================`);
        const resultData = detail.data?.data?.resultData || detail.data?.resultData;
        
        // n8n saves node execution info here
        if (resultData && resultData.error) {
          console.log(JSON.stringify(resultData.error, null, 2));
        } else if (detail.data && detail.data.data && detail.data.data.executionData) {
           const execData = detail.data.data.executionData;
           if (execData.error) {
              console.log(JSON.stringify(execData.error, null, 2));
           } else {
              console.log('Error information might be buried inside node execution results.');
              // Look at the last executed node
              const lastNode = Object.keys(execData.nodeExecutionStack).pop();
              console.log(`Last node executed: ${lastNode}`);
              console.log(JSON.stringify(execData.nodeExecutionStack[lastNode], null, 2));
           }
        } else {
            console.log('Dumping root info:');
            console.log(JSON.stringify(Object.keys(detail.data), null, 2));
        }
        break; // Solo mostrar la primera
      }
    }
  } catch (e) {
    console.error(e.message);
  }
}
debugExec();
