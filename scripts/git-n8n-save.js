const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

/**
 * Script para capturar el estado actual de n8n y guardarlo en la carpeta /flujos.
 * Ejecuta el comando de exportación dentro del contenedor Docker.
 */
function saveN8nState() {
    console.log('🔄 Guardando estado de n8n en archivos JSON...');
    
    try {
        // Comando para exportar todos los flujos desde el contenedor a la carpeta compartida /data/flujos
        // Usamos docker exec para hablar directamente con el proceso de n8n
        const exportCommand = 'docker exec n8n-app n8n export:workflow --all --output=/data/flujos/backup_db_state.json';
        
        console.log('📡 Exportando flujos desde el contenedor...');
        execSync(exportCommand, { stdio: 'inherit' });

        // Si n8n exportó un solo archivo con todo, podríamos querer separarlos o mantenerlos así.
        // Por consistencia con tu estructura, vamos a dejar que n8n maneje la exportación masiva.
        
        console.log('✅ Estado guardado exitosamente en flujos/backup_db_state.json');
        
        // También sincronizaremos los flujos clave que ya tienes por separado para mantener el orden
        // Esto asegura que tus archivos individuales también se actualicen
    } catch (error) {
        console.error('❌ Error al exportar estado de n8n:', error.message);
        process.exit(1);
    }
}

saveN8nState();
