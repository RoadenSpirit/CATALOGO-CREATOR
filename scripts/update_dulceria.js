const fs = require('fs');

const motorPath = 'flujos/motor_render_universal_v2.json';
const motor = JSON.parse(fs.readFileSync(motorPath, 'utf8'));

// 1. UPDATE "Read Files & Base64" node to NOT hardcode destinoPath but to calculate it dynamically
// using the new standard: /data/fotosProcesadas/[marca]/[categoria]/[fileName]
const readNode = motor.nodes.find(n => n.name === 'Read Files & Base64');

if (readNode) {
  readNode.parameters.jsCode = `const fs = require('fs');
const path = require('path');

let item;
try { item = $input.first().json; } catch(e) { throw new Error('No se pudo acceder a $input.first().json'); }
if (!item) { throw new Error('El objeto json recibido está vacío.'); }

let rawItem = item;
if (typeof item === 'string') {
  try { rawItem = JSON.parse(item); } catch (e) { throw new Error('Se recibió un string que no es JSON válido.'); }
}
if (Array.isArray(rawItem) && rawItem.length > 0) { rawItem = rawItem[0]; }

// Extraer parámetros básicos
let logoPath = rawItem.logoPath;
let productoPath = rawItem.productoPath || rawItem.path;
const marca = rawItem.marca || 'yourbrand';

if (!logoPath && rawItem.$json) {
   logoPath = rawItem.$json.logoPath;
   productoPath = rawItem.$json.productoPath || rawItem.$json.path;
}

if (!logoPath && Array.isArray(rawItem.parameter)) {
    const getParam = (name) => {
        const p = rawItem.parameter.find(x => x.name === name);
        return p ? p.value : undefined;
    };
    logoPath = getParam('logoPath');
    productoPath = getParam('productoPath');
}

// Fallbacks
if (!productoPath && rawItem.path) productoPath = rawItem.path;
if (!logoPath) logoPath = '/data/logo2.jpeg';

if (!logoPath || !productoPath) {
    throw new Error('Faltan rutas de origen. logoPath: ' + logoPath + ', productoPath: ' + productoPath);
}

// =====================================================================
// NUEVO ESTÁNDAR DE RUTAS: /data/fotosProcesadas/[marca]/[categoria]/[fileName]
// =====================================================================
const category = rawItem.categoryRaw || 'Sin_Categoria';
const fileName = rawItem.fileName || path.basename(productoPath);
const destinoPathStandard = \`/data/fotosProcesadas/\${marca}/\${category}/\${fileName}\`;

try {
  // Asegurarnos de que el directorio exacto existe antes de continuar
  const targetDir = path.dirname(destinoPathStandard);
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
      ...rawItem,
      logoPath,
      productoPath,
      destinoPath: destinoPathStandard, // Inyectamos la ruta estandarizada en el JSON
      logoMime: getMime(logoPath),
      productoMime: getMime(productoPath),
      logoBase64: logoBuffer.toString('base64'),
      productoBase64: productoBuffer.toString('base64'),
      marca
    },
    binary: {
      "dataProducto": {
        data: productoBuffer.toString('base64'),
        mimeType: getMime(productoPath),
        fileName: path.basename(productoPath)
      }
    }
  }];
} catch (e) {
  throw new Error('Fallo al leer archivos: ' + e.message);
}`;
}

// 2. VERIFY "Save Result" node
const saveNode = motor.nodes.find(n => n.name === 'Save Result');
if (saveNode) {
  saveNode.parameters = {
    "operation": "write",
    "fileName": "={{ $json.destinoPath }}", // Ahora siempre existirá y estará formateada
    "dataPropertyName": "data",
    "options": {
      "appendToFile": false
    }
  };
}

fs.writeFileSync(motorPath, JSON.stringify(motor, null, 2));
console.log('Sub-workflow actualizado con el estándar corporativo de carpetas.');
