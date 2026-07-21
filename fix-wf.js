const fs = require('fs');
const path = require('path');

// Leer el baseline JSON 
let rawData = fs.readFileSync('C:/Users/A/.gemini/antigravity/brain/c62e4651-e5e3-4fb3-92dd-08722798cdb1/.system_generated/steps/2021/output.txt', 'utf8');
let dump = JSON.parse(rawData);
let wf = dump.data;

// Asegurarse de quitar IDs molestos y limpiar connections y nodes
let newNodes = [];

const htmlTemplate = `=<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;700;800&family=Open+Sans:wght@400;700&display=swap" rel="stylesheet">
    <style>
        body, html {
            margin: 0; 
            padding: 0; 
            width: 1080px; 
            height: 1080px; 
            overflow: hidden;
            font-family: 'Open Sans', sans-serif;
            background: linear-gradient(135deg, #81217b, #4d1549);
            display: flex;
            justify-content: center;
            align-items: center;
        }
        
        .card {
            width: 960px;
            height: 960px;
            background-color: #ffffff;
            border-radius: 40px;
            box-shadow: 0 20px 40px rgba(0,0,0,0.4);
            display: flex;
            flex-direction: column;
            position: relative;
            overflow: hidden;
        }

        .header {
            width: 100%;
            height: 140px;
            display: flex;
            align-items: center;
            padding: 0 40px;
            box-sizing: border-box;
            background: #ffffff;
        }

        .logo {
            width: 90px;
            height: 90px;
            border-radius: 50%;
            object-fit: cover;
            border: 2px solid #6d1e68;
        }

        .brand-text {
            margin-left: 20px;
            color: #6d1e68;
            font-family: 'Montserrat', sans-serif;
        }
        .brand-text h3 {
            margin: 0;
            font-size: 32px;
            font-weight: 800;
            letter-spacing: 1px;
            text-transform: uppercase;
        }
        .brand-text p {
            margin: 0;
            font-size: 16px;
            font-weight: 700;
            opacity: 0.8;
            letter-spacing: 4px;
        }

        .product-container {
            flex-grow: 1;
            width: 100%;
            display: flex;
            justify-content: center;
            align-items: center;
            background-color: #ffffff;
            padding: 10px 40px 30px 40px;
            box-sizing: border-box;
        }

        .product-container img {
            width: 100%;
            height: 100%;
            max-height: 520px;
            object-fit: contain;
        }

        .footer {
            height: 240px;
            background: #6d1e68;
            color: white;
            padding: 30px 50px;
            box-sizing: border-box;
            display: flex;
            flex-direction: column;
            justify-content: center;
        }

        .product-name {
            font-family: 'Montserrat', sans-serif;
            font-size: 40px;
            font-weight: 700;
            margin: 0 0 15px 0;
            line-height: 1.1;
            display: -webkit-box;
            -webkit-line-clamp: 2;
            -webkit-box-orient: vertical;
            overflow: hidden;
            text-overflow: ellipsis;
        }

        .pricing-box {
            display: flex;
            align-items: center;
            gap: 20px;
        }

        .price-cup {
            font-family: 'Montserrat', sans-serif;
            color: #ffb703;
            font-size: 56px;
            font-weight: 800;
            margin: 0;
        }

        .price-usd {
            font-family: 'Montserrat', sans-serif;
            font-size: 30px;
            color: #ffffff;
            font-weight: 700;
            margin: 0;
            background: rgba(0,0,0,0.25);
            padding: 8px 20px;
            border-radius: 20px;
        }
        
    </style>
</head>
<body>
    <div class="card">
        <div class="header">
            <!-- Logo base64 usando validacion n8n -->
            <img src="data:image/jpeg;base64,{{ $('Cargar Logo').first().binary.dataLogo.data }}" class="logo" />
            <div class="brand-text">
                <h3>YourBrand</h3>
                <p>STORE</p>
            </div>
        </div>
        
        <div class="product-container">
            <!-- Producto base64 -->
            <img src="data:image/jpeg;base64,{{ $binary.dataProducto.data }}" />
        </div>

        <div class="footer">
            <h1 class="product-name">{{ $('Loop').item.json.productId }}</h1>
            <div class="pricing-box">
                <p class="price-cup">{{ $('Loop').item.json.cupFormatted }}</p>
                <p class="price-usd">{{ $('Loop').item.json.usdFormatted }}</p>
            </div>
        </div>
    </div>
</body>
</html>`;

newNodes = [
    {
        "parameters": {},
        "id": "trigger-manual",
        "name": "Manual Trigger",
        "position": [0, 144],
        "type": "n8n-nodes-base.manualTrigger",
        "typeVersion": 1
    },
    {
        "parameters": {
            "operation": "read",
            "fileName": "/data/logo.jpeg",
            "dataPropertyName": "dataLogo"
        },
        "id": "cargar-logo",
        "name": "Cargar Logo",
        "position": [180, 144],
        "type": "n8n-nodes-base.readWriteFile",
        "typeVersion": 1
    },
    {
        "parameters": {
            "command": "find /data/your-photos-folder -mindepth 2 -type f -not -path \"*/.*\""
        },
        "id": "execute-find-command",
        "name": "Leer Carpetas de Fotos (Comando Nivel SO)",
        "position": [400, -32],
        "type": "n8n-nodes-base.executeCommand",
        "typeVersion": 1
    },
    {
        "parameters": {
            "jsCode": wf.nodes.find(n => n.name === 'Convertir Lista a Items').parameters.jsCode
        },
        "id": "code-parse-paths",
        "name": "Convertir Lista a Items",
        "position": [608, -32],
        "type": "n8n-nodes-base.code",
        "typeVersion": 2
    },
    {
        "parameters": wf.nodes.find(n => n.name === 'Google Sheets').parameters,
        "id": "google-sheets",
        "name": "Google Sheets",
        "position": [400, 272],
        "type": "n8n-nodes-base.googleSheets",
        "typeVersion": 4.5,
        "credentials": wf.nodes.find(n => n.name === 'Google Sheets').credentials
    },
    {
        "parameters": {
            "jsCode": wf.nodes.find(n => n.name === 'Limpiar precios (Code)').parameters.jsCode
        },
        "id": "code-clean-pricing",
        "name": "Limpiar precios (Code)",
        "position": [608, 272],
        "type": "n8n-nodes-base.code",
        "typeVersion": 2
    },
    {
        "parameters": {
            "mode": "combine",
            "fieldsToMatchString": "matchKey",
            "options": {}
        },
        "id": "merge-data",
        "name": "Unir producto + imagen (por categoría)",
        "position": [900, 144],
        "type": "n8n-nodes-base.merge",
        "typeVersion": 3
    },
    {
        "parameters": { "options": {} },
        "id": "loop",
        "name": "Loop",
        "type": "n8n-nodes-base.splitInBatches",
        "typeVersion": 3,
        "position": [1150, 144]
    },
    {
        "parameters": {
            "operation": "read",
            "fileName": "={{ $('Loop').item.json.path }}",
            "dataPropertyName": "dataProducto"
        },
        "id": "cargar-imagen",
        "name": "Cargar Imagen Producto",
        "type": "n8n-nodes-base.readWriteFile",
        "typeVersion": 1,
        "position": [1350, 120]
    },
    {
        "parameters": {
            "html": htmlTemplate
        },
        "id": "render-html",
        "name": "Render HTML to Image",
        "type": "n8n-nodes-html2image.html2image",
        "typeVersion": 1,
        "position": [1550, 120]
    },
    {
        "parameters": {
            "operation": "write",
            "fileName": "=/data/fotosProcesadas/{{ $('Loop').item.json.categoryRaw || 'Resultados' }}/{{ $('Loop').item.json.fileName }}",
            "options": {},
            "dataPropertyName": "data"
        },
        "id": "guardar",
        "name": "Guardar en fotos_procesadas",
        "type": "n8n-nodes-base.readWriteFile",
        "typeVersion": 1,
        "position": [1750, 120]
    }
];

let newConnections = {
    "Manual Trigger": {
        "main": [
            [
                { "node": "Cargar Logo", "type": "main", "index": 0 }
            ]
        ]
    },
    "Cargar Logo": {
        "main": [
            [
                { "node": "Google Sheets", "type": "main", "index": 0 },
                { "node": "Leer Carpetas de Fotos (Comando Nivel SO)", "type": "main", "index": 0 }
            ]
        ]
    },
    "Google Sheets": {
        "main": [
            [{ "node": "Limpiar precios (Code)", "type": "main", "index": 0 }]
        ]
    },
    "Leer Carpetas de Fotos (Comando Nivel SO)": {
        "main": [
            [{ "node": "Convertir Lista a Items", "type": "main", "index": 0 }]
        ]
    },
    "Convertir Lista a Items": {
        "main": [
            [],
            [{ "node": "Unir producto + imagen (por categoría)", "type": "main", "index": 1 }]
        ]
    },
    "Limpiar precios (Code)": {
        "main": [
            [{ "node": "Unir producto + imagen (por categoría)", "type": "main", "index": 0 }]
        ]
    },
    "Unir producto + imagen (por categoría)": {
        "main": [
            [{ "node": "Loop", "type": "main", "index": 0 }]
        ]
    },
    "Loop": {
        "main": [
            [],
            [{ "node": "Cargar Imagen Producto", "type": "main", "index": 0 }]
        ]
    },
    "Cargar Imagen Producto": {
        "main": [
            [{ "node": "Render HTML to Image", "type": "main", "index": 0 }]
        ]
    },
    "Render HTML to Image": {
        "main": [
            [{ "node": "Guardar en fotos_procesadas", "type": "main", "index": 0 }]
        ]
    },
    "Guardar en fotos_procesadas": {
        "main": [
            [{ "node": "Loop", "type": "main", "index": 0 }]
        ]
    }
};

let resolvedWorkflow = {
    ...wf,
    nodes: newNodes,
    connections: newConnections
};

fs.writeFileSync('d:/proyectos/n8nYourBrand/flujos/workflow-puppeteer-fixed.json', JSON.stringify(resolvedWorkflow, null, 2));
console.log('Script generado exitosamente!');
