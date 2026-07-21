const fs = require('fs');

const motorPath = 'flujos/motor_render_universal_v2.json';
const motor = JSON.parse(fs.readFileSync(motorPath, 'utf8'));

// Find the Read Files node
const node = motor.nodes.find(n => n.name === 'Read Files & Base64');

if (node) {
  node.parameters.jsCode = `const fs = require('fs');
const path = require('path');

// Try to get data from multiple possible n8n v1/v2 paths
const item = $input.first().json;

// Check if we are receiving data at all
if (!item || Object.keys(item).length === 0) {
  throw new Error('El sub-workflow no recibió datos. Verifica que el nodo Execute Workflow esté pasando los parámetros correctamente.');
}

// Map parameters from either direct properties or $json (n8n expression artifacts)
const logoPath = item.logoPath || item.$json?.logoPath;
const productoPath = item.productoPath || item.$json?.productoPath;
const destinoPath = item.destinoPath || item.$json?.destinoPath;

// VALIDATION: Detailed check
if (!logoPath) throw new Error('Falta logoPath. Datos recibidos: ' + JSON.stringify(item));
if (!productoPath) throw new Error('Falta productoPath. Datos recibidos: ' + JSON.stringify(item));
if (!destinoPath) throw new Error('Falta destinoPath. Datos recibidos: ' + JSON.stringify(item));

try {
  const targetDir = path.dirname(destinoPath);
  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }

  const logoBuffer = fs.readFileSync(logoPath);
  const productoBuffer = fs.readFileSync(productoPath);
  
  const getMime = (p) => {
    const ext = path.extname(p).toLowerCase();
    if (ext === '.png') return 'image/png';
    if (ext === '.webp') return 'image/webp';
    return 'image/jpeg';
  };

  return [{
    json: {
      ...item,
      logoPath,
      productoPath,
      destinoPath,
      logoMime: getMime(logoPath),
      productoMime: getMime(productoPath),
      logoBase64: logoBuffer.toString('base64'),
      productoBase64: productoBuffer.toString('base64')
    }
  }];
} catch (e) {
  throw new Error('Error de sistema en Motor de Render: ' + e.message + ' | Paths: ' + JSON.stringify({logoPath, productoPath, destinoPath}));
}`;
}

fs.writeFileSync(motorPath, JSON.stringify(motor, null, 2));
console.log('Read Files & Base64 node updated with deeper parameter inspection.');
