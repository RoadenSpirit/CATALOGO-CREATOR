const fs = require('fs');

const motorPath = 'flujos/motor_render_universal_v2.json';
const motor = JSON.parse(fs.readFileSync(motorPath, 'utf8'));

// Find the Read Files node
const node = motor.nodes.find(n => n.name === 'Read Files & Base64');

if (node) {
  node.parameters.jsCode = `const fs = require('fs');
const path = require('path');

// Try to get data safely
let item;
try {
  item = $input.first().json;
} catch(e) {
  throw new Error('No se pudo leer $input.first().json. Error: ' + e.message);
}

if (!item) {
  throw new Error('El item recibido es null o undefined.');
}

// Log incoming keys for debugging
const incomingKeys = Object.keys(item);

// Manejo seguro de parámetros, revisando si vienen dentro de $json o en la raíz
let logoPath = item.logoPath;
let productoPath = item.productoPath;
let destinoPath = item.destinoPath;

// Si no están en la raíz, busquemos dentro del sub-objeto $json (que a veces n8n anida)
if (!logoPath && item.$json) {
   logoPath = item.$json.logoPath;
   productoPath = item.$json.productoPath;
   destinoPath = item.$json.destinoPath;
}

// VALIDATION
if (!logoPath || !productoPath || !destinoPath) {
    throw new Error(
      'Faltan rutas. ' +
      'logoPath: ' + (logoPath || 'FALTA') + ', ' +
      'productoPath: ' + (productoPath || 'FALTA') + ', ' +
      'destinoPath: ' + (destinoPath || 'FALTA') + '. ' +
      'Estructura recibida (keys): ' + JSON.stringify(incomingKeys) + '. ' +
      'Data bruta: ' + JSON.stringify(item).substring(0, 150) + '...'
    );
}

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
  throw new Error('Error al leer archivos físicos. Path fallido: ' + e.message);
}`;
}

fs.writeFileSync(motorPath, JSON.stringify(motor, null, 2));
console.log('Read Files & Base64 node updated with extreme defensive parsing.');
