const fs = require('fs');
const wf = JSON.parse(fs.readFileSync('flujos/workflow.json', 'utf8'));

// Delete all old image related nodes
const nodesToKeep = new Set([
    'Manual Trigger',
    'Leer Carpetas de Fotos (Comando Nivel SO)',
    'Convertir Lista a Items',
    'Google Sheets',
    'Limpiar precios (Code)',
    'Unir producto + imagen (por categoría)',
    'Loop',
    'Guardar en fotos_procesadas'
]);

wf.nodes = wf.nodes.filter(n => nodesToKeep.has(n.name));

// Reset connections cleanly
wf.connections = {
    'Manual Trigger': {
        main: [
            [
                { node: 'Google Sheets', type: 'main', index: 0 },
                { node: 'Leer Carpetas de Fotos (Comando Nivel SO)', type: 'main', index: 0 }
            ]
        ]
    },
    'Google Sheets': {
        main: [
            [{ node: 'Limpiar precios (Code)', type: 'main', index: 0 }]
        ]
    },
    'Leer Carpetas de Fotos (Comando Nivel SO)': {
        main: [
            [{ node: 'Convertir Lista a Items', type: 'main', index: 0 }]
        ]
    },
    'Convertir Lista a Items': {
        main: [
            [],
            [{ node: 'Unir producto + imagen (por categoría)', type: 'main', index: 1 }]
        ]
    },
    'Limpiar precios (Code)': {
        main: [
            [{ node: 'Unir producto + imagen (por categoría)', type: 'main', index: 0 }]
        ]
    },
    'Unir producto + imagen (por categoría)': {
        main: [
            [{ node: 'Loop', type: 'main', index: 0 }]
        ]
    },
    'Loop': {
        main: [
            [],  // done branch
            [{ node: 'Render HTML to Image', type: 'main', index: 0 }] // loop branch
        ]
    },
    'Render HTML to Image': {
        main: [
            [{ node: 'Guardar en fotos_procesadas', type: 'main', index: 0 }]
        ]
    },
    'Guardar en fotos_procesadas': {
        main: [
            [{ node: 'Loop', type: 'main', index: 0 }]
        ]
    }
};

const htmlTemplate = `<!DOCTYPE html>
<html style="margin: 0; padding: 0; background-color: #6d1e68;">
  <head>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@800&family=Open+Sans:wght@700&display=swap" rel="stylesheet">
    <style>
      body, html {
        margin: 0; padding: 0; width: 1200px; height: 1200px; background-color: #6d1e68; display: flex; flex-direction: column; overflow: hidden;
      }
      .logo {
        position: absolute; top: 30px; left: 40px; width: 110px; height: 110px;
        border-radius: 50%; object-fit: contain; box-shadow: 0px 4px 15px rgba(0,0,0,0.3); background-color: white;
      }
      .product-container {
        margin-top: 120px; width: 1200px; height: 840px;
        display: flex; justify-content: center; align-items: center;
      }
      .product-container img {
        max-width: 800px; max-height: 800px; object-fit: contain;
      }
      .footer {
        width: 1200px; height: 240px; background-color: white; box-sizing: border-box; padding: 0 60px;
        display: flex; flex-direction: column; justify-content: center; align-items: flex-start;
      }
      .name {
        font-family: 'Open Sans', sans-serif; color: #000000; font-size: 48px; margin: 0 0 5px 0; max-height: 120px; overflow: hidden;
      }
      .price-row {
        display: flex; align-items: baseline; gap: 25px; width: 100%;
      }
      .price-current {
        font-family: 'Montserrat', sans-serif; color: #6d1e68; font-size: 64px; margin: 0; font-weight: 800;
      }
      .sale-info {
        display: flex; flex-direction: column; align-items: flex-start; gap: 2px;
      }
      .savings-badge {
        background-color: #ff8c00; color: white; font-family: 'Montserrat', sans-serif; font-size: 24px; padding: 4px 12px; border-radius: 8px; font-weight: 800;
      }
      .price-old {
        font-family: 'Montserrat', sans-serif; color: #888888; font-size: 36px; text-decoration: line-through; margin: 0;
      }
    </style>
  </head>
  <body>
    <img src="file:///data/logo.png" class="logo">
    
    <div class="product-container">
      <img src="file://{{ $('Loop').item.json.path }}">
    </div>

    <div class="footer">
      <h1 class="name">{{ $('Loop').item.json.productId }}</h1>
      <div class="price-row">
        <h2 class="price-current">{{ $('Loop').item.json.cupFormatted }} / {{ $('Loop').item.json.usdFormatted }}</h2>
        
        {{#if $('Loop').item.json.isSale}}
        <div class="sale-info">
          <div class="savings-badge">{{ $('Loop').item.json.savingsLabel }}</div>
          <h3 class="price-old">{{ $('Loop').item.json.oldCupFormatted }} / {{ $('Loop').item.json.oldUsdFormatted }}</h3>
        </div>
        {{/if}}
      </div>
    </div>
  </body>
</html>`;

wf.nodes.push({
    "parameters": {
        "html": htmlTemplate
    },
    "id": "render-html",
    "name": "Render HTML to Image",
    "type": "n8n-nodes-html2image.html2image",
    "typeVersion": 1,
    "position": [1550, 144]
});

// Update pos
const fixPos = (name, x, y) => { const n = wf.nodes.find(n => n.name === name); if (n) n.position = [x, y]; };
fixPos('Guardar en fotos_procesadas', 1800, 144);
fixPos('Loop', 1312, 144);
fixPos('Unir producto + imagen (por categoría)', 1104, 144);

// The 'Guardar' node needs to be adjusted back to use 'data' instead of 'bg'
const g = wf.nodes.find(n => n.name === 'Guardar en fotos_procesadas');
if (g) {
    g.parameters.dataPropertyName = 'data';
    g.parameters.options = {};
}

fs.writeFileSync('flujos/workflow-puppeteer.json', JSON.stringify(wf, null, 2));
console.log('Done!');
