const fs = require('fs');

const motorPath = 'flujos/motor_render_universal_v2.json';
const motor = JSON.parse(fs.readFileSync(motorPath, 'utf8'));

const node = motor.nodes.find(n => n.name === 'Read Files & Base64');

if (node) {
  node.parameters.jsCode = `const fs = require('fs');
const path = require('path');

// THE SAFEST POSSIBLE PARSING STRATEGY
let item;
try {
  // First attempt: n8n standard
  item = $input.first().json;
} catch(e) {
  throw new Error('No se pudo acceder a $input.first().json');
}

if (!item) {
  throw new Error('El objeto json recibido está vacío.');
}

// In some n8n execution contexts (especially when called via "Execute Workflow" parameter mode),
// the item might be serialized as a string instead of an object.
let rawItem = item;
if (typeof item === 'string') {
  try {
    rawItem = JSON.parse(item);
  } catch (e) {
    throw new Error('Se recibió un string que no es JSON válido: ' + item.substring(0, 100));
  }
}

// Log incoming keys for deep debugging
const incomingKeys = Object.keys(rawItem);

// Extraction strategy: Check root, then $json, then parameter array
let logoPath = rawItem.logoPath;
let productoPath = rawItem.productoPath;
let destinoPath = rawItem.destinoPath;

if (!logoPath && rawItem.$json) {
   logoPath = rawItem.$json.logoPath;
   productoPath = rawItem.$json.productoPath;
   destinoPath = rawItem.$json.destinoPath;
}

// NEW STRATEGY: If n8n wrapped it inside 'parameter' array
if (!logoPath && Array.isArray(rawItem.parameter)) {
    const getParam = (name) => {
        const p = rawItem.parameter.find(x => x.name === name);
        return p ? p.value : undefined;
    };
    logoPath = getParam('logoPath');
    productoPath = getParam('productoPath');
    destinoPath = getParam('destinoPath');
}

// If we STILL don't have it, let's dump the entire structure safely
if (!logoPath || !productoPath || !destinoPath) {
    const dump = JSON.stringify(rawItem, null, 2).substring(0, 1000);
    throw new Error(
      'Faltan rutas.\\n' +
      'logoPath: ' + logoPath + '\\n' +
      'productoPath: ' + productoPath + '\\n' +
      'destinoPath: ' + destinoPath + '\\n' +
      'JSON Recibido:\\n' + dump
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

  return [{\n    json: {\n      ...rawItem,\n      logoPath,\n      productoPath,\n      destinoPath,\n      logoMime: getMime(logoPath),\n      productoMime: getMime(productoPath),\n      logoBase64: logoBuffer.toString('base64'),\n      productoBase64: productoBuffer.toString('base64')\n    }\n  }];
} catch (e) {
  throw new Error('Fallo al leer archivos del disco (¿Ruta correcta?). ' + e.message);
}`;
}

fs.writeFileSync(motorPath, JSON.stringify(motor, null, 2));
console.log('Read Files & Base64 updated with absolute string/object parsing logic.');
