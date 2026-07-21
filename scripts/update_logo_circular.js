const fs = require('fs');
const http = require('http');

const mcpConfig = JSON.parse(fs.readFileSync('mcp_config.json', 'utf8'));
const env = mcpConfig.mcpServers['n8n-mcp'].env;
const API_KEY = env.N8N_API_KEY;
const API_URL = env.N8N_API_URL;

const filePath = 'flujos/yourbrand_batch__im_genes___precios__operativo_v5_.json';
const wf = JSON.parse(fs.readFileSync(filePath, 'utf8'));

// 1. Actualizar el nodo CargarLogo
const cargarLogoNode = wf.nodes.find(n => n.name === 'CargarLogo');
if (cargarLogoNode) {
    cargarLogoNode.parameters.fileSelector = '/data/logo2.jpeg';
}

// 2. Actualizar el nodo PrepareBase64
const prepareNode = wf.nodes.find(n => n.name === 'PrepareBase64');
if (prepareNode) {
    prepareNode.parameters.jsCode = prepareNode.parameters.jsCode.replace(
        "const logoPath = '/data/logo.jpg';",
        "const logoPath = '/data/logo2.jpeg';"
    ).replace(
        "const logoPath = '/data/logoBlanco.jpg';",
        "const logoPath = '/data/logo2.jpeg';"
    );
}

// 3. Actualizar el nodo RenderHTML con el CSS para recorte circular
const renderNode = wf.nodes.find(n => n.name === 'RenderHTML');
if (renderNode && renderNode.parameters.html) {
    // Reemplazamos el estilo antiguo del logo
    const oldLogoCSS = '.logo { height: 130px; width: auto; max-width: 420px; object-fit: contain; }';
    const newLogoCSS = '.logo { height: 130px; width: 130px; object-fit: cover; border-radius: 50%; box-shadow: 0px 8px 15px rgba(0,0,0,0.5); }';
    
    renderNode.parameters.html = renderNode.parameters.html.replace(oldLogoCSS, newLogoCSS);
}

// Enviar solo los campos esenciales
const payload = {
    name: wf.name,
    nodes: wf.nodes,
    connections: wf.connections,
    settings: wf.settings || {}
};

const data = JSON.stringify(payload);

const url = new URL(`${API_URL}/workflows/${wf.id}`);
const options = {
    hostname: url.hostname,
    port: url.port,
    path: url.pathname,
    method: 'PUT',
    headers: {
        'X-N8N-API-KEY': API_KEY,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data)
    }
};

const req = http.request(options, (res) => {
    let resData = '';
    res.on('data', chunk => resData += chunk);
    res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
            console.log('✓ Flujo actualizado con Logo2 y recorte circular en n8n.');
            fs.writeFileSync(filePath, JSON.stringify(wf, null, 2));
            console.log('✓ Archivo local sincronizado.');
        } else {
            console.error(`Error ${res.statusCode}:`, resData);
        }
    });
});

req.on('error', (e) => console.error('Error:', e.message));
req.write(data);
req.end();