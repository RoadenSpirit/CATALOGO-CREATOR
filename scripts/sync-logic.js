const fs = require('fs');
const path = require('path');
const { deepClean } = require('./workflow-manager-lib');

/**
 * Este script se encarga de organizar los flujos recibidos en la estructura de carpetas
 * inmutable que el usuario requiere.
 */
function organizeWorkflows(workflows, commitName = 'auto_backup') {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 16);
    const historyDir = path.join(__dirname, '..', 'flujos', 'history', `${timestamp}_${commitName.replace(/\s+/g, '_')}`);
    const activeDir = path.join(__dirname, '..', 'flujos', 'active');

    // Crear carpetas si no existen
    [historyDir, activeDir].forEach(dir => {
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    });

    workflows.forEach(wf => {
        const cleanWf = deepClean(wf);
        const fileName = `${wf.name.replace(/[^a-z0-9]/gi, '_')}.json`;
        
        // Guardar en Active (Sobrescribe para Git)
        fs.writeFileSync(path.join(activeDir, fileName), JSON.stringify(cleanWf, null, 2));
        
        // Guardar en History (Inmutable)
        fs.writeFileSync(path.join(historyDir, fileName), JSON.stringify(cleanWf, null, 2));
    });

    console.log(`✅ Sincronización completada.`);
    console.log(`📂 Historial guardado en: ${historyDir}`);
    console.log(`📂 Versión activa actualizada en: ${activeDir}`);
}

module.exports = { organizeWorkflows };
