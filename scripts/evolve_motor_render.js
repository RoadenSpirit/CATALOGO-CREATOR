const fs = require('fs');

const motorPath = 'flujos/motor_render_universal.json';
const motor = JSON.parse(fs.readFileSync(motorPath, 'utf8'));

// 1. Add Gemini Node to the Motor Render
const geminiNode = {
  "parameters": {
    "resource": "image",
    "operation": "analyze",
    "modelId": {
      "__rl": true,
      "value": "models/gemini-flash-latest",
      "mode": "list",
      "cachedResultName": "models/gemini-flash-latest"
    },
    "text": "=Eres el copywriter de Your Brand, una tienda cubana de productos variados. Genera UN slogan publicitario corto (maximo 10 palabras) viendo EXCLUSIVAMENTE esta imagen de nuestro nuevo producto junto a sus datos.\\n\\nProducto: {{ $json.productId }}\\nPrecio: {{ $json.cupPrice }} CUP\\n\\nReglas:\\n- En español cubano o neutro.\\n- Usa 1-2 emojis relevantes a lo que ves en la imagen.\\n- Cero comillas, cero explicaciones.\\n- Solo el slogan directo.",
    "inputType": "binary",
    "binaryPropertyName": "dataProducto",
    "options": {}
  },
  "id": "gemini_copy_motor",
  "name": "GenerarCopy_AI",
  "type": "@n8n/n8n-nodes-langchain.googleGemini",
  "typeVersion": 1.1,
  "position": [
    300,
    -150
  ],
  "credentials": {
    "googlePalmApi": {
      "id": "SpJaeBzJ527901zx",
      "name": "Google Gemini(PaLM) Api account"
    }
  }
};
motor.nodes.push(geminiNode);

// 2. Add Code node to Extract Copy Text
const extractCopyNode = {
  "parameters": {
    "jsCode": "const geminiData = $input.first().json;\nlet geminiText = '🚨 Visítanos antes que se agoten 🚨';\n\nif (geminiData.content && geminiData.content.parts && geminiData.content.parts.length > 0) {\n    geminiText = geminiData.content.parts[0].text;\n} else if (geminiData.text) {\n    geminiText = geminiData.text;\n} else if (geminiData.message && geminiData.message.content) {\n    geminiText = geminiData.message.content;\n}\n\nreturn { ...$node[\"Read Files & Base64\"].json, copyText: geminiText };"
  },
  "id": "extract_copy_motor",
  "name": "ExtractCopy",
  "type": "n8n-nodes-base.code",
  "typeVersion": 2,
  "position": [
    500,
    -150
  ]
};
motor.nodes.push(extractCopyNode);

// 3. Update connections in Motor
// Current: Read Files -> Switch Marca
// New: Read Files -> GenerarCopy_AI -> ExtractCopy -> Switch Marca

const conn = motor.connections;

// Break Read Files -> Switch Marca
conn['Read Files & Base64'].main[0] = [
  {
    "node": "GenerarCopy_AI",
    "type": "main",
    "index": 0
  }
];

// GenerarCopy_AI -> ExtractCopy
conn['GenerarCopy_AI'] = {
  "main": [
    [
      {
        "node": "ExtractCopy",
        "type": "main",
        "index": 0
      }
    ]
  ]
};

// ExtractCopy -> Switch Marca
conn['ExtractCopy'] = {
  "main": [
    [
      {
        "node": "Switch Marca",
        "type": "main",
        "index": 0
      }
    ]
  ]
};

fs.writeFileSync('flujos/motor_render_universal_v2.json', JSON.stringify(motor, null, 2));
console.log('Motor Render Universal evolved with AI capability!');
