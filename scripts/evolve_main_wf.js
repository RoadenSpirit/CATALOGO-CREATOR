const fs = require('fs');

const wfPath = 'flujos/yourbrand_batch__im_genes___precios__operativo_v5_.json';
const wf = JSON.parse(fs.readFileSync(wfPath, 'utf8'));

// 1. Remove ALL heavy nodes (including Gemini and binary loaders)
const nodesToRemove = ['LoadProductImage', 'GenerarCopy', 'PrepareBase64', 'RenderHTML', 'SaveResult'];
wf.nodes = wf.nodes.filter(n => !nodesToRemove.includes(n.name));

// 2. Add THE ONLY necessary node: ExecuteRenderMotor
const executeMotorNode = {
  "parameters": {
    "workflowId": {
        "__rl": true,
        "mode": "name",
        "value": "Motor Render Universal (Sub-Workflow)"
    },
    "options": {
        "waitForSubworkflow": true
    },
    "mode": "parameter",
    "parameters": {
        "parameter": [
            { "name": "marca", "value": "yourbrand" },
            { "name": "logoPath", "value": "/data/logo2.jpeg" },
            { "name": "productoPath", "value": "={{ $json.path }}" },
            { "name": "destinoPath", "value": "=/data/fotosProcesadas/{{ $json.categoryRaw || 'Resultados' }}/{{ $json.fileName }}" },
            { "name": "productId", "value": "={{ $json.productId }}" },
            { "name": "usdPrice", "value": "={{ $json.usdFormatted }}" },
            { "name": "cupPrice", "value": "={{ $json.cupFormatted }}" }
        ]
    }
  },
  "id": "ExecuteRenderMotor",
  "name": "ExecuteRenderMotor",
  "type": "n8n-nodes-base.executeWorkflow",
  "typeVersion": 1,
  "position": [
    1456,
    64
  ]
};
wf.nodes.push(executeMotorNode);

// 3. Update connections
const conn = wf.connections;
delete conn['LoadProductImage'];
delete conn['GenerarCopy'];
delete conn['PrepareBase64'];
delete conn['RenderHTML'];
delete conn['SaveResult'];

// LoopNode [1] -> ExecuteRenderMotor
conn['LoopNode'].main[1] = [
    {
        "index": 0,
        "node": "ExecuteRenderMotor",
        "type": "main"
    }
];

// ExecuteRenderMotor -> LoopNode [0]
conn['ExecuteRenderMotor'] = {
    "main": [
        [
            {
                "index": 0,
                "node": "LoopNode",
                "type": "main"
            }
        ]
    ]
};

wf.name = "YourBrand Batch: (EVOLUCIONADO V1 - FULL SUBFLOW)";
fs.writeFileSync('flujos/yourbrand_batch_evolved_v1.json', JSON.stringify(wf, null, 2));
console.log('Main workflow evolved successfully to ultra-light version!');
