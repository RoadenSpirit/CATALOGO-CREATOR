const fs = require('fs');
const path = require('path');

// Logic from our library
function deepClean(obj) {
    if (Array.isArray(obj)) return obj.map(deepClean);
    if (obj !== null && typeof obj === 'object') {
        const cleanObj = {};
        const forbidden = [
            'id', 'createdAt', 'updatedAt', 'active', 'isArchived', 
            'versionId', 'activeVersionId', 'triggerCount', 'shared', 
            'authors', 'projectId', 'project', 'meta'
        ];
        for (const [key, value] of Object.entries(obj)) {
            if (!forbidden.includes(key)) cleanObj[key] = deepClean(value);
        }
        return cleanObj;
    }
    return obj;
}

function processFullBackup(filePath, commitMsg) {
    const raw = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    const workflows = Array.isArray(raw) ? raw : [raw];
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 16);
    const historyDirName = `${timestamp}_${commitMsg.replace(/[^a-z0-9]/gi, '_')}`;
    const historyDir = path.join('flujos', 'history', historyDirName);
    const activeDir = path.join('flujos', 'active');

    if (!fs.existsSync(historyDir)) fs.mkdirSync(historyDir, { recursive: true });
    if (!fs.existsSync(activeDir)) fs.mkdirSync(activeDir, { recursive: true });

    workflows.forEach(wf => {
        const cleaned = deepClean(wf);
        const fileName = `${wf.name.replace(/[^a-z0-9]/gi, '_')}.json`;
        
        fs.writeFileSync(path.join(activeDir, fileName), JSON.stringify(cleaned, null, 2));
        fs.writeFileSync(path.join(historyDir, fileName), JSON.stringify(cleaned, null, 2));
        console.log(`✅ Procesado: ${wf.name}`);
    });
}

const [,, backupPath, message] = process.argv;
processFullBackup(backupPath, message || 'sync');
