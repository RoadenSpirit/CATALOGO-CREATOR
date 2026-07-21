const fs = require('fs');

const motorPath = 'flujos/motor_render_universal_v2.json';
const motor = JSON.parse(fs.readFileSync(motorPath, 'utf8'));

const node = motor.nodes.find(n => n.name === 'Read Files & Base64');

if (node) {
  node.parameters.jsCode = `const fs = require('fs');
const path = require('path');

let item;
try {
  item = $input.first().json;
} catch(e) {
  throw new Error('No se pudo acceder a $input.first().json');
}

if (!item) {
  throw new Error('El objeto json recibido está vacío.');
}

let rawItem = item;
if (typeof item === 'string') {
  try {
    rawItem = JSON.parse(item);
  } catch (e) {
    throw new Error('Se recibió un string que no es JSON válido: ' + item.substring(0, 100));
  }
}

if (Array.isArray(rawItem) && rawItem.length > 0) {
  rawItem = rawItem[0];
}

let logoPath = rawItem.logoPath;
let productoPath = rawItem.productoPath || rawItem.path;
let destinoPath = rawItem.destinoPath;

if (!logoPath && rawItem.$json) {
   logoPath = rawItem.$json.logoPath;
   productoPath = rawItem.$json.productoPath || rawItem.$json.path;
   destinoPath = rawItem.$json.destinoPath;
}

if (!logoPath && Array.isArray(rawItem.parameter)) {
    const getParam = (name) => {
        const p = rawItem.parameter.find(x => x.name === name);
        return p ? p.value : undefined;
    };
    logoPath = getParam('logoPath');
    productoPath = getParam('productoPath');
    destinoPath = getParam('destinoPath');
}

if (!productoPath && rawItem.path) productoPath = rawItem.path;
if (!destinoPath && rawItem.fileName && rawItem.categoryRaw) {
    destinoPath = \`/data/fotosProcesadas/\${rawItem.categoryRaw}/\${rawItem.fileName}\`;
}
if (!logoPath) {
    logoPath = '/data/logo2.jpeg';
}

if (!logoPath || !productoPath || !destinoPath) {
    throw new Error('Faltan rutas. logoPath: ' + logoPath + ', productoPath: ' + productoPath + ', destinoPath: ' + destinoPath);
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

  // THE FIX IS HERE: WE MUST RETURN BINARY DATA PROPERLY FOR THE GEMINI NODE
  return [{
    json: {
      ...rawItem,
      logoPath,
      productoPath,
      destinoPath,
      logoMime: getMime(logoPath),
      productoMime: getMime(productoPath),
      logoBase64: logoBuffer.toString('base64'),
      productoBase64: productoBuffer.toString('base64'),
      marca: rawItem.marca || 'yourbrand'
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

fs.writeFileSync(motorPath, JSON.stringify(motor, null, 2));
console.log('Read Files updated to explicitly return "dataProducto" binary object.');
