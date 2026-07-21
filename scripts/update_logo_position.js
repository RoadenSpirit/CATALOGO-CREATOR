const fs = require('fs');

const motorPath = 'flujos/motor_render_universal_v2.json';
const motor = JSON.parse(fs.readFileSync(motorPath, 'utf8'));

const yourbrandNode = motor.nodes.find(n => n.name === 'Set HTML YourBrand');

if (yourbrandNode) {
  yourbrandNode.parameters.jsCode = `
const item = $input.first().json;

// Extract values safely
const logoMime = item.logoMime || 'image/jpeg';
const logoBase64 = item.logoBase64 || '';
const productoMime = item.productoMime || 'image/jpeg';
const productoBase64 = item.productoBase64 || '';
const productId = item.productId || 'PRODUCTO';
const cupPrice = item.cupFormatted || (item.cupPrice ? item.cupPrice + ' CUP' : '0 CUP');
const usdPrice = item.usdFormatted || (item.usdPrice ? item.usdPrice + ' USD' : '0 USD');
const copyText = item.copyText || '🚨 Visítanos antes que se agoten 🚨';

const html = \`<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body, html {
            width: 1080px;
            height: 1080px;
            overflow: hidden;
            background: linear-gradient(170deg, #6d1e68 0%, #4a1547 100%);
            font-family: 'Arial Black', 'Arial Bold', Arial, sans-serif;
            position: relative;
        }
        .layout { width: 1080px; height: 1080px; display: flex; flex-direction: column; }
        
        /* Logo posicionado de forma absoluta para liberarle espacio al producto y alinearlo bien a la izquierda */
        .header { position: absolute; top: 40px; left: 40px; z-index: 10; }
        .logo { height: 140px; width: 140px; object-fit: cover; border-radius: 50%; box-shadow: 0px 10px 20px rgba(0,0,0,0.6); border: 4px solid rgba(255,255,255,0.2); }

        .product-zone { 
            flex: 1; 
            display: flex; 
            justify-content: center; 
            align-items: center; 
            padding: 40px 40px 20px 40px; 
            margin-top: 20px; /* Un poco de margen para no chocar con el top si es muy alta */
        }
        
        .product-img { 
            width: 100%; 
            height: 100%; 
            max-height: 750px; /* ¡AUMENTADO SIGNIFICATIVAMENTE! (Antes 560px) */
            object-fit: contain; 
            filter: drop-shadow(0px 20px 35px rgba(0,0,0,0.6));
        }

        .info-zone { 
            height: 280px; /* Reducido para dar más protagonismo a la imagen */
            background: #ffffff; 
            border-top: 8px solid #6d1e68; 
            padding: 25px 40px; 
            display: flex; 
            flex-direction: column; 
            justify-content: center; 
            align-items: center; 
            gap: 15px;
            text-align: center;
            box-shadow: 0px -10px 25px rgba(0,0,0,0.3);
            z-index: 5;
        }
        
        .product-name { 
            font-size: 42px; /* Un poco más grande */
            font-weight: 900; 
            color: #222222; 
            text-transform: uppercase; 
            line-height: 1.1; 
            letter-spacing: -0.5px;
        }
        
        .price-row { 
            display: flex; 
            align-items: baseline; 
            justify-content: center; 
            gap: 15px; 
        }
        
        /* Sombras aplicadas a los textos amarillos/naranjas para alto contraste sobre blanco */
        .price-val { 
            font-size: 58px; 
            font-weight: 900; 
            color: #e87b04; 
            line-height: 1; 
            letter-spacing: -1px; 
            text-shadow: 1px 2px 4px rgba(0,0,0,0.3); /* SOMBRA AÑADIDA */
        }
        .price-separator { font-size: 50px; font-weight: 300; color: #888888; margin: 0 5px; }
        
        .cta { 
            font-size: 28px; 
            font-weight: 900; 
            background: linear-gradient(90deg, #BF953F, #FCF6BA, #B38728, #FBF5B7, #AA771C);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
            text-transform: uppercase; 
            letter-spacing: 0.5px; 
            line-height: 1.2; 
            padding: 0 10px;
            font-family: 'Arial Black', "Noto Color Emoji", sans-serif;
            filter: drop-shadow(1px 2px 3px rgba(0,0,0,0.3)); /* SOMBRA AÑADIDA (Usando filter por el text-clip) */
        }
    </style>
</head>
<body>
    <div class="layout">
        <div class="header">
            <img src="data:\${logoMime};base64,\${logoBase64}" class="logo" />
        </div>
        <div class="product-zone">
            <img src="data:\${productoMime};base64,\${productoBase64}" class="product-img" />
        </div>
        <div class="info-zone">
            <div class="product-name">\${productId}</div>
            <div class="price-row">
                <span class="price-val">\${cupPrice}</span>
                <span class="price-separator">/</span>
                <span class="price-val">\${usdPrice}</span>
            </div>
            <div class="cta">\${copyText}</div>
        </div>
    </div>
</body>
</html>\`;

return [{ json: { ...item, html } }];
`;
}

fs.writeFileSync(motorPath, JSON.stringify(motor, null, 2));
console.log('Diseño HTML de YourBrand actualizado con éxito.');
