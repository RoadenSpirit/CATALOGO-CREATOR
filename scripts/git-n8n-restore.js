const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

/**
 * Script para restaurar el estado de n8n desde los archivos de la rama actual.
 */
function restoreN8nState() {
    console.log('🔄 Restaurando flujos de n8n desde los archivos de esta rama...');
    
    try {
        const backupFile = 'flujos/backup_db_state.json';
        
        if (!fs.existsSync(backupFile)) {
            console.log('⚠️ No se encontró backup_db_state.json en esta rama. Saltando restauración.');
            return;
        }

        // Comando para importar flujos dentro del contenedor
        // n8n import:workflow --input=/data/flujos/backup_db_state.json
        const importCommand = 'docker exec n8n-app n8n import:workflow --input=/data/flujos/backup_db_state.json';
        
        console.log('📡 Inyectando flujos en la base de datos de n8n...');
        execSync(importCommand, { stdio: 'inherit' });
        
        console.log('✅ n8n sincronizado con el estado de la rama Git.');
    } catch (error) {
        console.error('❌ Error al restaurar estado de n8n:', error.message);
        // No salimos con error aquí para no bloquear el checkout de git si n8n está apagado
    }
}

restoreN8nState();
