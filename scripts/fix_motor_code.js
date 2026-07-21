const fs = require('fs');

const motorPath = 'flujos/motor_render_universal_v2.json';
const motor = JSON.parse(fs.readFileSync(motorPath, 'utf8'));

// Find the Read Files node and improve its robustness
const node = motor.nodes.find(n => n.name === 'Read Files & Base64');

if (node) {
  node.parameters.jsCode = `const fs = require('fs');
const path = require('path');

// n8n v1: parameters from Execute Workflow usually come in the first item
const item = $input.first().json;

// VALIDATION: Check for required paths
const required = ['logoPath', 'productoPath', 'destinoPath'];
for (const key of required) {
  if (!item[key]) {
    throw new Error('Falta el parámetro requerido: ' + key + '. Recibido: ' + JSON.stringify(item));
  }
}

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
  throw new Error('Error en el Motor de Render: ' + e.message);
}`;
}

fs.writeFileSync(motorPath, JSON.stringify(motor, null, 2));
console.log('Read Files & Base64 node updated with robustness and validation.');
