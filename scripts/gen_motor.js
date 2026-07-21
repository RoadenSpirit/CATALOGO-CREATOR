const fs = require('fs');
const yourbrand = JSON.parse(fs.readFileSync('flujos/backup_yourbrand_api.json'));
const yourdulceria = JSON.parse(fs.readFileSync('flujos/backup_yourdulceria_api.json'));

const htmlYourBrand = yourbrand.nodes.find(n => n.name === 'RenderHTML').parameters.html;
const htmlYourDulceria = yourdulceria.nodes.find(n => n.name === 'Render HTML to Image').parameters.html;

const subWf = {
  name: 'Motor Render Universal (Sub-Workflow)',
  nodes: [
    {
      id: 'trigger',
      name: 'Execute Workflow Trigger',
      type: 'n8n-nodes-base.executeWorkflowTrigger',
      typeVersion: 1,
      position: [0, 0],
      parameters: {}
    },
    {
      id: 'read_files',
      name: 'Read Files & Base64',
      type: 'n8n-nodes-base.code',
      typeVersion: 2,
      position: [200, 0],
      parameters: {
        jsCode: `const fs = require('fs');
const path = require('path');
const item = $input.first().json;

try {
  const targetDir = path.dirname(item.destinoPath);
  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }

  const logoBuffer = fs.readFileSync(item.logoPath);
  const productoBuffer = fs.readFileSync(item.productoPath);
  
  const getMime = (p) => {
    const ext = path.extname(p).toLowerCase();
    if (ext === '.png') return 'image/png';
    if (ext === '.webp') return 'image/webp';
    return 'image/jpeg';
  };

  return [{
    json: {
      ...item,
      logoMime: getMime(item.logoPath),
      productoMime: getMime(item.productoPath),
      logoBase64: logoBuffer.toString('base64'),
      productoBase64: productoBuffer.toString('base64')
    }
  }];
} catch (e) {
  throw new Error('Error en Read Files: ' + e.message);
}`
      }
    },
    {
      id: 'switch_marca',
      name: 'Switch Marca',
      type: 'n8n-nodes-base.switch',
      typeVersion: 1,
      position: [400, 0],
      parameters: {
        dataType: 'string',
        value1: '={{ $json.marca }}',
        rules: {
          rules: [
            { operation: 'equal', value2: 'yourbrand' },
            { operation: 'equal', value2: 'yourdulceria' }
          ]
        }
      }
    },
    {
      id: 'set_html_yourbrand',
      name: 'Set HTML YourBrand',
      type: 'n8n-nodes-base.code',
      typeVersion: 2,
      position: [600, -100],
      parameters: {
        jsCode: `const html = ${JSON.stringify(htmlYourBrand.replace(/^=/, ''))};\nreturn [{ json: { ...$input.first().json, html } }];`
      }
    },
    {
      id: 'set_html_yourdulceria',
      name: 'Set HTML YourDulceria',
      type: 'n8n-nodes-base.code',
      typeVersion: 2,
      position: [600, 100],
      parameters: {
        jsCode: `const html = ${JSON.stringify(htmlYourDulceria.replace(/^=/, ''))};\nreturn [{ json: { ...$input.first().json, html } }];`
      }
    },
    {
      id: 'render_html',
      name: 'Render HTML to Image',
      type: 'n8n-nodes-html2image.html2image',
      typeVersion: 1,
      position: [800, 0],
      parameters: {
        html: '={{ $json.html }}'
      }
    },
    {
      id: 'save_file',
      name: 'Save Result',
      type: 'n8n-nodes-base.readWriteFile',
      typeVersion: 1,
      position: [1000, 0],
      parameters: {
        operation: 'write',
        fileName: '={{ $json.destinoPath }}',
        options: { appendToFile: false }
      }
    }
  ],
  connections: {
    'Execute Workflow Trigger': { main: [[{ node: 'Read Files & Base64', type: 'main', index: 0 }]] },
    'Read Files & Base64': { main: [[{ node: 'Switch Marca', type: 'main', index: 0 }]] },
    'Switch Marca': { main: [
      [{ node: 'Set HTML YourBrand', type: 'main', index: 0 }],
      [{ node: 'Set HTML YourDulceria', type: 'main', index: 0 }]
    ] },
    'Set HTML YourBrand': { main: [[{ node: 'Render HTML to Image', type: 'main', index: 0 }]] },
    'Set HTML YourDulceria': { main: [[{ node: 'Render HTML to Image', type: 'main', index: 0 }]] },
    'Render HTML to Image': { main: [[{ node: 'Save Result', type: 'main', index: 0 }]] }
  }
};

fs.writeFileSync('flujos/motor_render_universal.json', JSON.stringify(subWf, null, 2));
console.log('Sub-workflow generated.');