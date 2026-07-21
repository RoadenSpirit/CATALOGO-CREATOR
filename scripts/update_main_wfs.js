const fs = require('fs');
const http = require('http');

const mcpConfig = JSON.parse(fs.readFileSync('mcp_config.json', 'utf8'));
const env = mcpConfig.mcpServers['n8n-mcp'].env;
const API_URL = env.N8N_API_URL;
const API_KEY = env.N8N_API_KEY;

const uploadWf = (wf) => {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify(wf);
    const options = {
      hostname: new URL(API_URL).hostname,
      port: new URL(API_URL).port,
      path: new URL(API_URL).pathname + '/workflows/' + wf.id,
      method: 'PUT',
      headers: {
        'X-N8N-API-KEY': API_KEY,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload)
      }
    };
    const req = http.request(options, res => {
      let data = '';
      res.on('data', c => data+=c);
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          console.log('Successfully updated workflow:', wf.name);
          resolve();
        } else {
          console.error('Failed to update workflow:', wf.name, res.statusCode, data);
          reject(new Error(data));
        }
      });
    });
    req.on('error', reject);
    req.write(payload);
    req.end();
  });
};

async function main() {
  const SUB_WF_ID = 'DkYpRRgW6JYIbGiD'; // Our newly created Universal Render Engine

  // --- DULCERIA WORKFLOW UPDATE ---
  const yourdulceria = JSON.parse(fs.readFileSync('flujos/backup_yourdulceria_api.json'));
  
  // Remove unused nodes
  const dKeepNodes = ['Manual Trigger', 'Listar Fotos YourDulceria', 'Lógica de Nombres y Precios', 'Loop'];
  let dNodes = yourdulceria.nodes.filter(n => dKeepNodes.includes(n.name));
  
  // Add Prepare Payload Node
  dNodes.push({
    id: 'prepare_payload_yourdulceria',
    name: 'Prepare Payload YourDulceria',
    type: 'n8n-nodes-base.code',
    typeVersion: 2,
    position: [1000, 0],
    parameters: {
      jsCode: `const item = $input.first().json;
return [{
  json: {
    ...item,
    marca: 'yourdulceria',
    logoPath: '/data/yourdulceria/logoYourDulceria.jpeg',
    productoPath: item.path,
    destinoPath: `/data/yourdulceria/productosProcesados/\${item.category}/\${item.displayName}.png`
  }
}];`
    }
  });

  // Add Execute Sub-Workflow Node
  dNodes.push({
    id: 'exec_motor_yourdulceria',
    name: 'Ejecutar Motor Render',
    type: 'n8n-nodes-base.executeWorkflow',
    typeVersion: 1,
    position: [1250, 0],
    parameters: {
      workflowId: SUB_WF_ID,
      mode: 'each'
    }
  });

  // Re-wire connections
  yourdulceria.nodes = dNodes;
  yourdulceria.connections = {
    'Manual Trigger': { main: [[{ node: 'Listar Fotos YourDulceria', type: 'main', index: 0 }]] },
    'Listar Fotos YourDulceria': { main: [[{ node: 'Lógica de Nombres y Precios', type: 'main', index: 0 }]] },
    'Lógica de Nombres y Precios': { main: [[{ node: 'Loop', type: 'main', index: 0 }]] },
    'Loop': { main: [[], [{ node: 'Prepare Payload YourDulceria', type: 'main', index: 0 }]] },
    'Prepare Payload YourDulceria': { main: [[{ node: 'Ejecutar Motor Render', type: 'main', index: 0 }]] },
    'Ejecutar Motor Render': { main: [[{ node: 'Loop', type: 'main', index: 0 }]] }
  };
  
  await uploadWf(yourdulceria);


  // --- YOURBRAND WORKFLOW UPDATE ---
  const yourbrand = JSON.parse(fs.readFileSync('flujos/backup_yourbrand_api.json'));

  // Keep all except PrepareBase64, RenderHTML, SaveResult
  const cRemoveNodes = ['PrepareBase64', 'RenderHTML', 'SaveResult'];
  let cNodes = yourbrand.nodes.filter(n => !cRemoveNodes.includes(n.name));
  
  // Actually, we don't need CargarLogo either because logoPath is handled, but let's keep it to avoid rewiring the start if it doesn't hurt.
  // Wait, ManualTrigger goes to SO_FindFiles and CargarLogo. It's safe to keep it, just ignore it.

  // Add Prepare Payload YourBrand
  cNodes.push({
    id: 'prepare_payload_yourbrand',
    name: 'Prepare Payload YourBrand',
    type: 'n8n-nodes-base.code',
    typeVersion: 2,
    position: [1600, 144],
    parameters: {
      jsCode: `const originalData = $('LoopNode').first().json;

const geminiData = $input.first().json;
let geminiText = '🚨 Visítanos antes que se agoten 🚨';

if (geminiData.content && geminiData.content.parts && geminiData.content.parts.length > 0) {
    geminiText = geminiData.content.parts[0].text;
} else if (geminiData.text) {
    geminiText = geminiData.text;
} else if (geminiData.message && geminiData.message.content) {
    geminiText = geminiData.message.content;
}

const productoPath = originalData.path;
const logoPath = '/data/logo2.jpeg';

if (!productoPath) {
  throw new Error('path is missing from LoopNode.');
}

const categoryRaw = originalData.categoryRaw || 'Resultados';
const fileName = originalData.fileName;

return [{
  json: {
    ...originalData,
    marca: 'yourbrand',
    logoPath: logoPath,
    productoPath: productoPath,
    destinoPath: `/data/fotosProcesadas/\${categoryRaw}/\${fileName}`,
    copyText: geminiText
  }
}];`
    }
  });

  // Add Execute Sub-Workflow Node
  cNodes.push({
    id: 'exec_motor_yourbrand',
    name: 'Ejecutar Motor Render',
    type: 'n8n-nodes-base.executeWorkflow',
    typeVersion: 1,
    position: [1800, 144],
    parameters: {
      workflowId: SUB_WF_ID,
      mode: 'each'
    }
  });

  yourbrand.nodes = cNodes;
  
  // Rewire GenerarCopy -> Prepare Payload YourBrand -> Ejecutar Motor Render -> LoopNode
  yourbrand.connections['GenerarCopy'] = { main: [[{ node: 'Prepare Payload YourBrand', type: 'main', index: 0 }]] };
  yourbrand.connections['Prepare Payload YourBrand'] = { main: [[{ node: 'Ejecutar Motor Render', type: 'main', index: 0 }]] };
  yourbrand.connections['Ejecutar Motor Render'] = { main: [[{ node: 'LoopNode', type: 'main', index: 0 }]] };

  // Delete connections for removed nodes
  delete yourbrand.connections['PrepareBase64'];
  delete yourbrand.connections['RenderHTML'];
  delete yourbrand.connections['SaveResult'];

  await uploadWf(yourbrand);

}

main().catch(console.error);