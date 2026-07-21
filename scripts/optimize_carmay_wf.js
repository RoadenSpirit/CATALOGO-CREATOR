const fs = require('fs');

const wfPath = 'flujos/yourbrand_batch__im_genes___precios__operativo_v5_.json';
const wf = JSON.parse(fs.readFileSync(wfPath, 'utf8'));

// 1. Remove heavy nodes
const nodesToRemove = ['LoadProductImage', 'PrepareBase64', 'RenderHTML', 'SaveResult'];
wf.nodes = wf.nodes.filter(n => !nodesToRemove.includes(n.name));

// 2. Add ExtractCopyText node
const extractCopyNode = {
  "parameters": {
    "jsCode": "const geminiData = $input.first().json;\nlet geminiText = '🚨 Visítanos antes que se agoten 🚨';\n\nif (geminiData.content && geminiData.content.parts && geminiData.content.parts.length > 0) {\n    geminiText = geminiData.content.parts[0].text;\n} else if (geminiData.text) {\n    geminiText = geminiData.text;\n} else if (geminiData.message && geminiData.message.content) {\n    geminiText = geminiData.message.content;\n}\n\nreturn { copyText: geminiText };"
  },
  "id": "ExtractCopyText",
  "name": "ExtractCopyText",
  "type": "n8n-nodes-base.code",
  "typeVersion": 2,
  "position": [
    1792,
    64
  ]
};
wf.nodes.push(extractCopyNode);

// 3. Add ExecuteRenderMotor node
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
            { "name": "productoPath", "value": "={{ $('LoopNode').item.json.path }}" },
            { "name": "destinoPath", "value": "=/data/fotosProcesadas/{{ $('LoopNode').item.json.categoryRaw || 'Resultados' }}/{{ $('LoopNode').item.json.fileName }}" },
            { "name": "productId", "value": "={{ $('LoopNode').item.json.productId }}" },
            { "name": "usdPrice", "value": "={{ $('LoopNode').item.json.usdFormatted }}" },
            { "name": "cupPrice", "value": "={{ $('LoopNode').item.json.cupFormatted }}" },
            { "name": "copyText", "value": "={{ $json.copyText }}" }
        ]
    }
  },
  "id": "ExecuteRenderMotor",
  "name": "ExecuteRenderMotor",
  "type": "n8n-nodes-base.executeWorkflow",
  "typeVersion": 1,
  "position": [
    2000,
    64
  ]
};
wf.nodes.push(executeMotorNode);

// 4. Update connections
// LoopNode -> LoadProductImage was original. Now LoopNode -> GenerarCopy (Wait, GenerarCopy was after LoadProductImage)
// Current connections in file:
// LoopNode [1] -> LoadProductImage
// LoadProductImage -> GenerarCopy
// GenerarCopy -> PrepareBase64
// PrepareBase64 -> RenderHTML
// RenderHTML -> SaveResult
// SaveResult -> LoopNode [0]

// NEW CONNECTIONS:
// LoopNode [1] -> GenerarCopy
// GenerarCopy -> ExtractCopyText
// ExtractCopyText -> ExecuteRenderMotor
// ExecuteRenderMotor -> LoopNode [0]

const conn = wf.connections;
// Delete old connections from/to removed nodes
delete conn['LoadProductImage'];
delete conn['PrepareBase64'];
delete conn['RenderHTML'];
delete conn['SaveResult'];

// Update LoopNode output
conn['LoopNode'].main[1] = [
    {
        "index": 0,
        "node": "GenerarCopy",
        "type": "main"
    }
];

// Update GenerarCopy output
conn['GenerarCopy'].main[0] = [
    {
        "index": 0,
        "node": "ExtractCopyText",
        "type": "main"
    }
];

// Add ExtractCopyText output
conn['ExtractCopyText'] = {
    "main": [
        [
            {
                "index": 0,
                "node": "ExecuteRenderMotor",
                "type": "main"
            }
        ]
    ]
};

// Add ExecuteRenderMotor output back to Loop
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

wf.name = "YourBrand Batch: Imágenes + Precios (OPTIMIZADO V1)";
fs.writeFileSync('flujos/yourbrand_batch_optimized.json', JSON.stringify(wf, null, 2));
console.log('Workflow optimized successfully!');
