"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Html2Image = void 0;
const node_html_to_image_1 = __importDefault(require("node-html-to-image"));
const puppeteer_1 = __importDefault(require("puppeteer"));
const Html2Image_node_options_1 = require("./Html2Image.node.options");

// 🚀 ESTRATEGIA EXPERTA V3: Singleton Browser (Robustez Máxima para Docker)
let cachedBrowser = null;
let isLaunching = false;

async function getPersistentBrowser() {
    if (cachedBrowser) {
        try {
            // Verificación de salud más estricta
            const pages = await cachedBrowser.pages();
            if (pages) return cachedBrowser;
        } catch (e) {
            console.log('Navegador cacheado detectado como zombie o cerrado, reiniciando...');
            try { await cachedBrowser.close(); } catch(err) {}
            cachedBrowser = null;
        }
    }

    if (isLaunching) {
        let attempts = 0;
        while (isLaunching && attempts < 30) {
            await new Promise(r => setTimeout(r, 1000));
            attempts++;
            if (cachedBrowser) return cachedBrowser;
        }
        isLaunching = false; // Timeout de espera, reset para intentar de nuevo
    }

    isLaunching = true;
    try {
        console.log('Iniciando instancia persistente de Chromium (V4 - Optimizada Docker)...');
        cachedBrowser = await puppeteer_1.default.launch({
            executablePath: '/usr/bin/chromium',
            headless: true,
            timeout: 90000, // Aumentado a 90s para dar margen en primer arranque
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-gpu',
                '--disable-software-rasterizer',
                '--disable-extensions',
                '--disable-features=IsolateOrigins,site-per-process',
                '--single-process', // 🛠️ FIX: Reduce consumo de memoria y procesos en Docker
                '--no-zygote',      // 🛠️ FIX: Evita procesos huérfanos
                '--remote-debugging-port=0'
            ]
        });
        console.log('Chromium persistente V4 conectado y listo.');
    } catch (e) {
        console.error('Error FATAL al lanzar Chromium:', e.message);
        cachedBrowser = null;
        throw e;
    } finally {
        isLaunching = false;
    }
    return cachedBrowser;
}

class Html2Image {
    constructor() {
        this.description = Html2Image_node_options_1.nodeDescription;
    }

    async execute() {
        const items = this.getInputData();
        let returnData = [];
        const browser = await getPersistentBrowser();

        for (let i = 0; i < items.length; i++) {
            const html = this.getNodeParameter('html', i);
            const newItem = {
                json: {},
                binary: {},
                pairedItem: { item: i },
            };

            try {
                // Usamos el navegador persistente para crear una nueva página
                const image = await (0, node_html_to_image_1.default)({
                    html,
                    puppeteerArgs: {
                        browser: browser
                    }
                });

                if (image instanceof Buffer) {
                    newItem.binary['data'] = await this.helpers.prepareBinaryData(
                        Buffer.from(image), 
                        undefined, 
                        'image/png'
                    );
                }
                returnData.push(newItem);
            } catch (e) {
                console.error(`Error en item ${i}:`, e.message);
                if (e.message.includes('Target closed') || e.message.includes('Session')) {
                    cachedBrowser = null;
                }
                throw new Error(`Fallo en RenderHTML: ${e.message}`);
            }
        }
        return this.prepareOutputData(returnData);
    }
}
exports.Html2Image = Html2Image;
//# sourceMappingURL=Html2Image.node.js.map