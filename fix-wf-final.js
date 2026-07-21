const fs = require('fs');

let wf = JSON.parse(fs.readFileSync('flujos/workflow-puppeteer-fixed.json', 'utf8'));

// Correcciones definitivas para los nodos de archivo: 
// Para 'read' se DEBE usar 'fileSelector'.
let cargarLogo = wf.nodes.find(n => n.name === 'Cargar Logo');
cargarLogo.parameters = {
    operation: "read",
    fileSelector: "/data/logo.jpeg",
    options: {
        dataPropertyName: "dataLogo"
    }
};

let cargarImagen = wf.nodes.find(n => n.name === 'Cargar Imagen Producto');
cargarImagen.parameters = {
    operation: "read",
    fileSelector: "={{ $('Loop').item.json.path }}",
    options: {
        dataPropertyName: "dataProducto"
    }
};

// Modificamos el nodo Html para asegurar el prefijo = y las variables binarias
let renderHtml = wf.nodes.find(n => n.name === 'Render HTML to Image');

// Usamos el template limpio y le inyectamos las expresiones correctas
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
    <div class=\"card\">
        <div class=\"header\">
            <img src=\"data:{{ $('Cargar Logo').first().binary.dataLogo.mimeType }};base64,{{ $('Cargar Logo').first().binary.dataLogo.data }}\" class=\"logo\" />
            <div class=\"brand-text\">
                <h3>YourBrand</h3>
                <p>STORE</p>
            </div>
        </div>
        
        <div class=\"product-container\">
            <img src=\"data:{{ $binary.dataProducto.mimeType }};base64,{{ $binary.dataProducto.data }}\" />
        </div>

        <div class=\"footer\">
            <h1 class=\"product-name\">{{ $('Loop').item.json.productId }}</h1>
            <div class=\"pricing-box\">
                <p class=\"price-cup\">{{ $('Loop').item.json.cupFormatted }}</p>
                <p class=\"price-usd\">{{ $('Loop').item.json.usdFormatted }}</p>
            </div>
        </div>
    </div>
</body>
</html>`;

renderHtml.parameters.html = htmlTemplate;

fs.writeFileSync('flujos/workflow-puppeteer-final.json', JSON.stringify(wf, null, 2));
console.log('Fixed structure to workflow-puppeteer-final.json with fileSelector');
