const fs = require('fs');
const path = require('path');

/**
 * DEEP CLEANING FUNCTION
 * Recursively removes all n8n metadata that causes "Read-only" errors.
 */
function deepClean(obj) {
    if (Array.isArray(obj)) {
        return obj.map(deepClean);
    } else if (obj !== null && typeof obj === 'object') {
        const cleanObj = {};
        const forbidden = [
            'id', 'createdAt', 'updatedAt', 'active', 'isArchived', 
            'versionId', 'activeVersionId', 'triggerCount', 'shared', 
            'authors', 'projectId', 'project'
        ];
        
        for (const [key, value] of Object.entries(obj)) {
            if (!forbidden.includes(key)) {
                cleanObj[key] = deepClean(value);
            }
        }
        return cleanObj;
    }
    return obj;
}

async function runBackup(commitMessage = 'manual_sync') {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 16);
    const historyDir = path.join(__dirname, '..', 'flujos', 'history', `${timestamp}_${commitMessage.replace(/\s+/g, '_')}`);
    const activeDir = path.join(__dirname, '..', 'flujos', 'active');

    [historyDir, activeDir].forEach(dir => {
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    });

    console.log(`📦 Creating immutable backup in: ${historyDir}`);
    
    // Note: The actual fetching from n8n will be done by the Gemini Agent 
    // using MCP and passed to this script via temporary JSON or stdin.
    // For now, this script expects a list of workflows in a 'temp_sync.json'
}

module.exports = { deepClean };
