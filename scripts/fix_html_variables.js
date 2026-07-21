const fs = require('fs');

const motorPath = 'flujos/motor_render_universal_v2.json';
const motor = JSON.parse(fs.readFileSync(motorPath, 'utf8'));

const yourbrandNode = motor.nodes.find(n => n.name === 'Set HTML YourBrand');

if (yourbrandNode) {
  // THE PROBLEM: The HTML string was defined exactly as literal text with {{ }} instead of resolving the variables inside JS
  // OR the n8n expressions were not parsing it because it's set via Code node.
  // When inside a Code node, you MUST inject the variables using JavaScript template literals \`\${variable}\` OR return the html string with {{}} and let a SUBSEQUENT node evaluate it, but HTML nodes don't evaluate inner expressions usually unless specifically told to.
  // Actually, the best way in a Code node is to inject the actual values directly!

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
        }
        .layout { width: 1080px; height: 1080px; display: flex; flex-direction: column; }
        
        .header { height: 180px; display: flex; align-items: center; padding: 0 55px; justify-content: flex-start; }
        .logo { height: 130px; width: 130px; object-fit: cover; border-radius: 50%; box-shadow: 0px 8px 15px rgba(0,0,0,0.5); }

        .product-zone { 
            flex: 1; 
            display: flex; 
            justify-content: center; 
            align-items: center; 
            padding: 10px 40px; 
        }
        
        .product-img { 
            width: 100%; 
            height: 100%; 
            max-height: 560px;
            object-fit: contain; 
            filter: drop-shadow(0px 15px 25px rgba(0,0,0,0.4));
        }

        .info-zone { 
            height: 340px;
            background: #ffffff; 
            border-top: 6px solid #6d1e68; 
            padding: 30px 40px; 
            display: flex; 
            flex-direction: column; 
            justify-content: center; 
            align-items: center; 
            gap: 25px;
            text-align: center;
        }
        
        .product-name { 
            font-size: 38px; 
            font-weight: 800; 
            color: #222222; 
            text-transform: uppercase; 
            line-height: 1.1; 
            letter-spacing: 0.5px;
        }
        
        .price-row { 
            display: flex; 
            align-items: baseline; 
            justify-content: center; 
            gap: 15px; 
        }
        
        .price-val { font-size: 55px; font-weight: 800; color: #e87b04; line-height: 1; letter-spacing: -1px; }
        .price-separator { font-size: 50px; font-weight: 300; color: #aaaaaa; margin: 0 5px; }
        
        .cta { 
            font-size: 26px; 
            font-weight: 800; 
            background: linear-gradient(90deg, #BF953F, #FCF6BA, #B38728, #FBF5B7, #AA771C);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
            text-transform: uppercase; 
            letter-spacing: 0.5px; 
            line-height: 1.2; 
            padding: 0 10px;
            font-family: 'Arial Black', "Noto Color Emoji", sans-serif;
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

// Do the same for YourDulceria just in case
const yourdulceriaNode = motor.nodes.find(n => n.name === 'Set HTML YourDulceria');
if (yourdulceriaNode) {
  yourdulceriaNode.parameters.jsCode = `
const item = $input.first().json;

const logoMime = item.logoMime || 'image/jpeg';
const logoBase64 = item.logoBase64 || '';
const productoMime = item.productoMime || 'image/jpeg';
const productoBase64 = item.productoBase64 || '';
const productId = item.productId || item.displayName || 'PRODUCTO';
const cupPrice = item.cupFormatted || (item.cupPrice ? item.cupPrice + ' CUP' : '0 CUP');

const html = \`<style>
  @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@800;900&family=Open+Sans:wght@700;800&display=swap');
  
  body, html { margin: 0; padding: 0; width: 1200px; height: 1200px; overflow: hidden; }
  
  .main { 
    background-color: #600000; 
    width: 1200px; 
    height: 1200px; 
    position: relative; 
    font-family: 'Open Sans', sans-serif; 
    display: flex; 
    flex-direction: column; 
  }

  .logo { 
    position: absolute; 
    top: 40px; 
    left: 40px; 
    width: 180px; 
    height: 180px; 
    border-radius: 50%; 
    border: 6px solid #C5A059; 
    background-color: #600000; 
    background-size: auto 165%; 
    background-position: center center; 
    background-repeat: no-repeat; 
    z-index: 10; 
    box-shadow: 0 10px 20px rgba(0,0,0,0.4);
  }

  .product-box { 
    flex: 1; 
    display: flex; 
    justify-content: center; 
    align-items: center; 
    padding-bottom: 250px;
    padding-top: 30px; 
  }

  .product-img { 
    max-width: 1000px; 
    max-height: 950px;
    object-fit: contain; 
    filter: drop-shadow(0 25px 50px rgba(0,0,0,0.8)); 
  }

  .footer { 
    position: absolute; 
    bottom: 0; 
    width: 100%; 
    height: 280px; 
    background: linear-gradient(180deg, #C5A059 0%, #A68648 100%); 
    display: flex; 
    flex-direction: column; 
    justify-content: center; 
    align-items: center; 
    text-align: center;
    box-sizing: border-box; 
    border-top: 10px solid #3d0000; 
    padding: 0 40px;
  }

  .product-name { 
    color: #600000; 
    font-size: 54px; 
    font-weight: 800; 
    margin: 0 0 5px 0; 
    text-transform: uppercase; 
    font-family: 'Montserrat', sans-serif; 
  }

  .product-price { 
    color: #000000; 
    font-size: 90px; 
    font-weight: 900; 
    margin: 0; 
    font-family: 'Montserrat', sans-serif; 
  }
</style>

<div class="main">
  <div class="logo" style="background-image: url('data:\${logoMime};base64,\${logoBase64}');"></div>
  <div class="product-box">
    <img src="data:\${productoMime};base64,\${productoBase64}" class="product-img">
  </div>
  <div class="footer">
    <p class="product-name">\${productId}</p>
    <p class="product-price">\${cupPrice}</p>
  </div>
</div>\`;

return [{ json: { ...item, html } }];
`;
}

fs.writeFileSync(motorPath, JSON.stringify(motor, null, 2));
console.log('HTML templates updated to properly interpolate variables inside the Code node.');
