const puppeteer = require('puppeteer');

console.log('Iniciando prueba directa de Puppeteer...');

async function run() {
  let browser;
  try {
    console.log('Lanzando el navegador...');
    browser = await puppeteer.launch({
      executablePath: '/usr/bin/chromium',
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--no-zygote'
      ]
    });
    console.log('Navegador lanzado correctamente. PID:', browser.process()?.pid);
    
    console.log('Abriendo nueva página...');
    const page = await browser.newPage();
    
    console.log('Navegando a HTML de prueba...');
    await page.setContent('<html><body><h1>Prueba Puppeteer Alpine</h1></body></html>');
    
    console.log('Tomando screenshot...');
    const buffer = await page.screenshot({ type: 'png' });
    
    console.log('Screenshot generado con éxito. Tamaño (bytes):', buffer.length);
  } catch (error) {
    console.error('Error durante la ejecución de Puppeteer:', error);
  } finally {
    if (browser) {
      console.log('Cerrando navegador...');
      await browser.close();
      console.log('Navegador cerrado.');
    }
  }
}

run().then(() => {
    console.log('Prueba finalizada.');
    process.exit(0);
});
