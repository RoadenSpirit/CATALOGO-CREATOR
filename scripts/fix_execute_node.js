const fs = require('fs');

const wfPath = 'flujos/yourbrand_batch_evolved_v1.json';
const wf = JSON.parse(fs.readFileSync(wfPath, 'utf8'));

// Find the ExecuteRenderMotor node
const node = wf.nodes.find(n => n.name === 'ExecuteRenderMotor');

if (node) {
  node.parameters.workflowId = {
    "__rl": true,
    "mode": "id",
    "value": "DkYpRRgW6JYIbGiD"
  };
  
  // Update expressions to use explicit node reference for safety in loops
  node.parameters.parameters.parameter = [
    { "name": "marca", "value": "yourbrand" },
    { "name": "logoPath", "value": "/data/logo2.jpeg" },
    { "name": "productoPath", "value": "={{ $('LoopNode').item.json.path }}" },
    { "name": "destinoPath", "value": "=/data/fotosProcesadas/{{ $('LoopNode').item.json.categoryRaw || 'Resultados' }}/{{ $('LoopNode').item.json.fileName }}" },
    { "name": "productId", "value": "={{ $('LoopNode').item.json.productId }}" },
    { "name": "usdPrice", "value": "={{ $('LoopNode').item.json.usdFormatted }}" },
    { "name": "cupPrice", "value": "={{ $('LoopNode').item.json.cupFormatted }}" }
  ];
}

fs.writeFileSync(wfPath, JSON.stringify(wf, null, 2));
console.log('ExecuteRenderMotor node fixed with ID DkYpRRgW6JYIbGiD and safe expressions.');
