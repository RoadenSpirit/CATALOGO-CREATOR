const nodeHtmlToImage = require('node-html-to-image');

console.log('Iniciando prueba con node-html-to-image...');

async function run() {
  try {
    console.log('Llamando a la libreria...');
    const image = await nodeHtmlToImage({
      html: '<html><body><h1>Prueba node-html-to-image</h1></body></html>',
      puppeteerArgs: {
        executablePath: '/usr/bin/chromium',
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-gpu',
          '--font-render-hinting=none',
          '--disable-extensions'
        ]
      }
    });
    console.log('Imagen generada con exito. Tamano:', image.length);
  } catch (error) {
    console.error('Error durante la generacion:', error);
  }
}

run().then(() => {
    console.log('Prueba finalizada.');
    process.exit(0);
});
