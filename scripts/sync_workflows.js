const fs = require('fs');
const http = require('http');
const path = require('path');

const mcpConfig = JSON.parse(fs.readFileSync('mcp_config.json', 'utf8'));
const env = mcpConfig.mcpServers['n8n-mcp'].env;
const API_KEY = env.N8N_API_KEY;
const API_URL = env.N8N_API_URL; // http://localhost:5678/api/v1

async function getWorkflows() {
    const url = `${API_URL}/workflows`;
    return new Promise((resolve, reject) => {
        const req = http.get(url, {
            headers: { 'X-N8N-API-KEY': API_KEY }
        }, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => resolve(JSON.parse(data)));
        });
        req.on('error', reject);
    });
}

async function sync() {
    try {
        const { data: workflows } = await getWorkflows();
        const localFolder = 'flujos';
        if (!fs.existsSync(localFolder)) fs.mkdirSync(localFolder);

        const localFiles = fs.readdirSync(localFolder);
        
        console.log(`Encontrados ${workflows.length} flujos en n8n.`);

        for (const wf of workflows) {
            const fileName = `${wf.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.json`;
            const filePath = path.join(localFolder, fileName);

            console.log(`- Flujo: ${wf.name} (ID: ${wf.id}) -> Sugerencia archivo: ${fileName}`);

            if (!localFiles.includes(fileName)) {
                fs.writeFileSync(filePath, JSON.stringify(wf, null, 2));
                console.log(`  [NUEVO] Guardado en ${filePath}`);
            } else {
                console.log(`  [EXISTE] Ya está en la carpeta flujos.`);
            }
        }
    } catch (error) {
        console.error('Error sincronizando:', error.message);
    }
}

sync();
