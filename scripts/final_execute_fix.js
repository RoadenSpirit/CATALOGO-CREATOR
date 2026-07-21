const fs = require('fs');

const wfPath = 'flujos/yourbrand_batch_evolved_v1.json';
const wf = JSON.parse(fs.readFileSync(wfPath, 'utf8'));

// Configure ExecuteRenderMotor node to use the ID DkYpRRgW6JYIbGiD
const node = wf.nodes.find(n => n.name === 'ExecuteRenderMotor');

if (node) {
  // Reset the workflowId parameter to a clean object
  node.parameters.workflowId = {
    "__rl": true,
    "value": "DkYpRRgW6JYIbGiD",
    "mode": "id"
  };
  
  // Ensure the parameter mapping is ultra-clean
  node.parameters.parameters = {
    "parameter": [
      { "name": "marca", "value": "yourbrand" },
      { "name": "logoPath", "value": "/data/logo2.jpeg" },
      { "name": "productoPath", "value": "={{ $('LoopNode').item.json.path }}" },
      { "name": "destinoPath", "value": "=/data/fotosProcesadas/{{ $('LoopNode').item.json.categoryRaw || 'Resultados' }}/{{ $('LoopNode').item.json.fileName }}" },
      { "name": "productId", "value": "={{ $('LoopNode').item.json.productId }}" },
      { "name": "usdPrice", "value": "={{ $('LoopNode').item.json.usdFormatted }}" },
      { "name": "cupPrice", "value": "={{ $('LoopNode').item.json.cupFormatted }}" }
    ]
  };
}

fs.writeFileSync(wfPath, JSON.stringify(wf, null, 2));
console.log('ExecuteRenderMotor fixed with explicit ID DkYpRRgW6JYIbGiD and cleaned parameters.');
