const fs = require('fs');

// 1. ACTUALIZAR FLUJO PRINCIPAL
const wf1 = JSON.parse(fs.readFileSync('flujos/yourbrand_batch_optimized.json', 'utf8'));
const cleanNode = wf1.nodes.find(n => n.name === 'CleanPricing');

cleanNode.parameters.jsCode = `const items = $input.all();
const cleaned = [];

function normalizeName(str) {
  if (!str) return '';
  return String(str).normalize('NFD').replace(/[\\u0300-\\u036f]/g, '').toUpperCase().replace(/[^A-Z0-9]/g, '');
}

const formatUsd = (val) => '$' + val.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' USD';
const formatCup = (val) => '$' + val.toLocaleString('en-US', { maximumFractionDigits: 0 }) + ' CUP';

for (const item of items) {
  const row = item.json;
  const nombre = row['PRODUCTO'] ? String(row['PRODUCTO']).trim() : '';
  if (!nombre) continue;

  const actualUsd = parseFloat(row['ACTUAL USD']) || 0;
  const actualCup = parseFloat(row['ACTUAL CUP']) || 0;
  const maxUsd = parseFloat(row['MAX HIST USD']) || 0;
  const maxCup = parseFloat(row['MAX HIST CUP']) || 0;

  // Lógica de Descuento: Evaluamos ambas monedas
  const hasDiscount = (maxUsd > actualUsd) && (maxCup > actualCup);

  let discountData = {};
  if (hasDiscount) {
      const diffUsd = maxUsd - actualUsd;
      const diffCup = maxCup - actualCup;
      discountData = {
          maxUsdFormatted: formatUsd(maxUsd),
          maxCupFormatted: formatCup(maxCup),
          diffUsdFormatted: formatUsd(diffUsd),
          diffCupFormatted: formatCup(diffCup)
      };
  }

  // Soporte para nueva estructura de categorías
  const categoryRaw = row['CATEGORIA_AUTO'] || row['CATEGORIA'] || 'General';

  cleaned.push({
    json: {
      matchKey: normalizeName(nombre),
      productId: nombre,
      usdPrice: actualUsd,
      cupPrice: actualCup,
      usdFormatted: formatUsd(actualUsd),
      cupFormatted: formatCup(actualCup),
      hasDiscount: hasDiscount,
      ...discountData,
      categoryRaw: categoryRaw
    }
  });
}
return cleaned;`;

// Modificar el nodo ExecuteRenderMotor para pasar los parámetros de descuento
const execNode = wf1.nodes.find(n => n.name === 'ExecuteRenderMotor');
if (execNode && execNode.parameters.mode === 'parameter') {
    const pList = execNode.parameters.parameters.parameter;
    const ensureParam = (name, val) => {
        const exist = pList.find(p => p.name === name);
        if (!exist) pList.push({name, value: val});
        else exist.value = val;
    };
    ensureParam('hasDiscount', '={{ $json.hasDiscount }}');
    ensureParam('maxUsdFormatted', '={{ $json.maxUsdFormatted }}');
    ensureParam('maxCupFormatted', '={{ $json.maxCupFormatted }}');
    ensureParam('diffUsdFormatted', '={{ $json.diffUsdFormatted }}');
    ensureParam('diffCupFormatted', '={{ $json.diffCupFormatted }}');
}
fs.writeFileSync('flujos/yourbrand_batch_optimized.json', JSON.stringify(wf1, null, 2));

// 2. ACTUALIZAR SUB-FLUJO
const wf2 = JSON.parse(fs.readFileSync('flujos/motor_render_universal_v2.json', 'utf8'));
const htmlNode = wf2.nodes.find(n => n.name === 'SetHTMLYourBrand');

htmlNode.parameters.jsCode = `const item = $input.first().json;

var html = '<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8">';
html += '<link href="https://fonts.googleapis.com/css2?family=Open+Sans:wght@700&display=swap" rel="stylesheet">';
html += '<style>';
html += '* { margin: 0; padding: 0; box-sizing: border-box; } ';
html += 'body, html { width: 1080px; height: 1440px; overflow: hidden; background: #6d1e68; font-family: sans-serif; } ';
html += '.layout { width: 1080px; height: 1440px; display: flex; flex-direction: column; position: relative; } ';
html += '.header { position: absolute; top: 50px; left: 50px; z-index: 999; } ';
html += '.logo { height: 150px; width: auto; object-fit: contain; } ';
html += '.product-zone { height: 1060px; width: 1080px; display: flex; justify-content: center; align-items: center; padding: 20px; overflow: hidden; } ';
html += '.product-img { max-width: 1000px; max-height: 1000px; object-fit: contain; filter: drop-shadow(0px 40px 50px rgba(0,0,0,0.5)); } ';
html += '.footer { background: #ffffff; flex: 1; width: 1080px; padding: 20px 40px 30px 40px; display: flex; flex-direction: column; justify-content: space-between; position: relative; border-top: 2px solid rgba(0,0,0,0.05); } ';
html += '.product-name { font-family: "Open Sans", sans-serif; font-size: 34px; color: #333; text-transform: uppercase; text-decoration: underline; text-decoration-thickness: 2px; text-underline-offset: 4px; align-self: flex-start; letter-spacing: 1px; font-weight: 700; margin-top: 5px; } ';

// Layout Base de Precios
html += '.price-container { display: flex; align-items: center; justify-content: center; flex: 1; width: 100%; overflow: hidden; gap: 30px; } ';
html += '.current-price-box { font-size: 62px; color: #e87b04; font-weight: 600; letter-spacing: -1px; white-space: nowrap; } ';

// Layout de Descuento
html += '.discount-zone { display: flex; flex-direction: column; align-items: flex-end; justify-content: center; border-left: 3px solid #eee; padding-left: 30px; } ';
html += '.diff-price { font-size: 28px; color: #d32f2f; font-weight: 700; margin-bottom: 5px; background: rgba(211, 47, 47, 0.1); padding: 5px 15px; border-radius: 20px; } ';
html += '.old-price { font-size: 40px; color: #888; text-decoration: line-through; font-weight: 400; } ';

html += '.slogan-box { font-size: 34px; color: #444; align-self: center; text-align: center; font-weight: 600; letter-spacing: 0.5px; } ';
html += '</style></head><body><div class="layout">';
html += '<div class="header"><img src="data:' + item.logoMime + ';base64,' + item.logoBase64 + '" class="logo" /></div>';
html += '<div class="product-zone"><img src="data:' + item.productoMime + ';base64,' + item.productoBase64 + '" class="product-img" /></div>';
html += '<div class="footer"><h1 class="product-name">' + item.productId + '</h1>';

html += '<div class="price-container">';
html += '  <div class="current-price-box">' + item.cupFormatted + ' / ' + item.usdFormatted + '</div>';

// INYECCIÓN CONDICIONAL DE DISEÑO DE OFERTA
if (item.hasDiscount === true || item.hasDiscount === "true") {
    html += '  <div class="discount-zone">';
    html += '    <div class="diff-price">Ahorras: -' + item.diffCupFormatted + ' / -' + item.diffUsdFormatted + '</div>';
    html += '    <div class="old-price">' + item.maxCupFormatted + ' / ' + item.maxUsdFormatted + '</div>';
    html += '  </div>';
}

html += '</div>';

html += '<div class="slogan-box">' + item.copyText + '</div></div>';
html += '</div></body></html>';

return { ...item, html: html };`;
fs.writeFileSync('flujos/motor_render_universal_v2.json', JSON.stringify(wf2, null, 2));
console.log("✅ Flujos modificados exitosamente con lógica de descuentos.");