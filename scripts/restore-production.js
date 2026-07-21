const fs = require('fs');
const path = require('path');
const { deepClean } = require('./workflow-manager-lib');

function restoreWorkflows(tempFile, historyPath) {
    const workflows = JSON.parse(fs.readFileSync(tempFile, 'utf8'));
    const activeDir = path.join(__dirname, '..', 'flujos', 'active');
    const historyDir = path.join(__dirname, '..', 'flujos', 'history', historyPath);

    [historyDir, activeDir].forEach(dir => {
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    });

    workflows.forEach(wf => {
        const cleanWf = deepClean(wf);
        const fileName = `${wf.name.replace(/[^a-z0-9]/gi, '_')}.json`;
        
        // Guardar en Active
        fs.writeFileSync(path.join(activeDir, fileName), JSON.stringify(cleanWf, null, 2));
        
        // Guardar en History
        fs.writeFileSync(path.join(historyDir, fileName), JSON.stringify(cleanWf, null, 2));
        
        console.log(`✅ Procesado: ${wf.name}`);
    });

    console.log(`\n🚀 Restauración completada en: ${historyDir}`);
}

const tempFile = path.join(__dirname, '..', 'temp_sync.json');
const historyPath = '20260401_1200_Restauracion_Total';

restoreWorkflows(tempFile, historyPath);
