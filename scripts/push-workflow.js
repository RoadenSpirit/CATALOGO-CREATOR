/**
 * Sube/actualiza el workflow en n8n cada vez que edites el JSON.
 * Usa N8N_API_URL y N8N_API_KEY del .env (raíz del proyecto).
 *
 * Mantiene las configuraciones del servidor: credenciales (OAuth, etc.),
 * para no tener que volver a configurar Google Sheets u otros nodos.
 *
 * Uso:
 *   node scripts/push-workflow.js
 *   node scripts/push-workflow.js flujos/workflow.json
 *   node scripts/push-workflow.js --verbose   (o -v) para ver qué se modificó
 *
 * .env: N8N_API_URL, N8N_API_KEY, N8N_WORKFLOW_ID (ID o URL, ej. k5UjvBYNSsvRHGLn o
 *       http://localhost:5678/workflow/k5UjvBYNSsvRHGLn). Opcional: N8N_PUSH_VERBOSE=1
 */

const fs = require('fs');
const path = require('path');
const http = require('http');
const https = require('https');

const ROOT = path.resolve(__dirname, '..');
const DEFAULT_WORKFLOW = path.join(ROOT, 'flujos', 'workflow.json');
const ENV_FILE = path.join(ROOT, '.env');

let VERBOSE = false;

function log(...args) {
  if (VERBOSE) console.log(...args);
}

function logSection(title) {
  if (!VERBOSE) return;
  const line = '─'.repeat(60);
  console.log('\n' + line);
  console.log('  ' + title);
  console.log(line);
}

function loadEnv() {
  if (!fs.existsSync(ENV_FILE)) {
    throw new Error(`Falta .env en ${ENV_FILE}. Añade N8N_API_URL y N8N_API_KEY.`);
  }
  const env = {};
  for (const line of fs.readFileSync(ENV_FILE, 'utf8').split('\n')) {
    const t = line.trim();
    if (!t || t.startsWith('#')) continue;
    const eq = t.indexOf('=');
    if (eq === -1) continue;
    const k = t.slice(0, eq).trim();
    const v = t.slice(eq + 1).trim().replace(/^["']|["']$/g, '');
    env[k] = v;
  }
  if (env.N8N_PUSH_VERBOSE === '1' || env.N8N_PUSH_VERBOSE === 'true') VERBOSE = true;
  return env;
}

/** Extrae el ID del workflow desde .env: acepta ID suelto o URL (ej. http://localhost:5678/workflow/k5UjvBYNSsvRHGLn). */
function resolveWorkflowIdFromEnv(value) {
  if (!value || typeof value !== 'string') return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  const match = trimmed.match(/\/workflow\/([a-zA-Z0-9_-]+)\/?$/);
  if (match) return match[1];
  if (/^[a-zA-Z0-9_-]+$/.test(trimmed)) return trimmed;
  return null;
}

// Propiedades que el API de n8n acepta en PUT /workflows/:id (no enviar más).
const ALLOWED_TOP_LEVEL = ['name', 'nodes', 'connections', 'settings', 'staticData', 'shared'];

// Dentro de settings el API solo acepta estas claves (binaryMode, availableInMCP, etc. dan 400).
const ALLOWED_SETTINGS = [
  'executionOrder', 'errorWorkflow', 'timezone', 'saveManualExecutions',
  'saveDataSuccessExecution', 'saveDataErrorExecution', 'saveExecutionProgress',
  'callerPolicy', 'retryOnFail'
];

function sanitizeSettings(settings) {
  if (!settings || typeof settings !== 'object') return undefined;
  const out = {};
  for (const key of ALLOWED_SETTINGS) {
    if (settings[key] !== undefined) out[key] = settings[key];
  }
  return Object.keys(out).length ? out : undefined;
}

function sanitizePayload(workflow) {
  const out = {};
  for (const key of ALLOWED_TOP_LEVEL) {
    if (workflow[key] === undefined) continue;
    if (key === 'settings') {
      const cleaned = sanitizeSettings(workflow.settings);
      if (cleaned !== undefined) out.settings = cleaned;
    } else {
      out[key] = workflow[key];
    }
  }
  return out;
}

function request(apiUrl, apiKey, pathname, method, body) {
  const normalizedUrl = apiUrl.replace(/(:\d+)(api\/)/i, '$1/$2');
  const url = new URL(normalizedUrl);
  url.pathname = pathname;
  const opts = {
    hostname: url.hostname,
    port: url.port || (url.protocol === 'https:' ? 443 : 80),
    path: url.pathname + url.search,
    method,
    headers: {
      'X-N8N-API-KEY': apiKey,
    },
  };
  if (body) {
    opts.headers['Content-Type'] = 'application/json';
    opts.headers['Content-Length'] = Buffer.byteLength(body);
  }
  const client = url.protocol === 'https:' ? https : http;
  return new Promise((resolve, reject) => {
    const req = client.request(opts, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try {
          const json = data ? JSON.parse(data) : {};
          if (res.statusCode >= 200 && res.statusCode < 300) resolve(json);
          else reject(new Error(`HTTP ${res.statusCode}: ${json.message || data || res.statusMessage}`));
        } catch {
          reject(new Error(`HTTP ${res.statusCode}: ${data || res.statusMessage}`));
        }
      });
    });
    req.on('error', reject);
    if (body) req.write(body);
    req.end();
  });
}

function getWorkflow(apiUrl, apiKey, id) {
  const normalizedUrl = apiUrl.replace(/(:\d+)(api\/)/i, '$1/$2');
  const url = new URL(normalizedUrl);
  const pathname = url.pathname.replace(/\/?$/, '') + '/workflows/' + id;
  return request(apiUrl, apiKey, pathname, 'GET');
}

function mergeWithServer(fileWorkflow, serverWorkflow) {
  const serverNodes = (serverWorkflow.nodes || []);
  const byId = new Map(serverNodes.map((n) => [n.id, n]));
  const byName = new Map(serverNodes.map((n) => [n.name, n]));
  const fileNodeIds = new Set((fileWorkflow.nodes || []).map((n) => n.id));
  const fileNodeNames = new Set((fileWorkflow.nodes || []).map((n) => n.name));

  const report = {
    nodes: [],
    credentialsPreserved: [],
    credentialsNotOnServer: [],
    nodesOnlyOnServer: [],
    settingsSource: null,
    connectionsFromFile: true,
  };

  const nodes = (fileWorkflow.nodes || []).map((fileNode) => {
    const node = { ...fileNode };
    const serverNode = byId.get(fileNode.id) || byName.get(fileNode.name);
    const matchBy = serverNode ? (byId.has(fileNode.id) ? 'id' : 'name') : null;

    report.nodes.push({
      name: fileNode.name,
      id: fileNode.id,
      type: fileNode.type,
      matched: !!serverNode,
      matchBy,
      hadCredentialsOnServer: !!(serverNode && serverNode.credentials && Object.keys(serverNode.credentials).length > 0),
    });

    if (serverNode && serverNode.credentials && Object.keys(serverNode.credentials).length > 0) {
      node.credentials = serverNode.credentials;
      report.credentialsPreserved.push({
        node: fileNode.name,
        credentialTypes: Object.keys(serverNode.credentials),
      });
    } else if (fileNode.credentials && Object.keys(fileNode.credentials).length > 0) {
      const credIds = Object.keys(fileNode.credentials).map((k) => fileNode.credentials[k].id || fileNode.credentials[k].name || '');
      const hasPlaceholder = credIds.some((c) => /replace|placeholder|xxx|poner|configurar/i.test(String(c)));
      report.credentialsNotOnServer.push({
        node: fileNode.name,
        note: 'El archivo tiene credenciales pero el servidor no; se enviarán las del archivo (pueden ser placeholders).',
        placeholderDetected: hasPlaceholder,
      });
    }
    return node;
  });

  (serverWorkflow.nodes || []).forEach((sn) => {
    if (!fileNodeIds.has(sn.id) && !fileNodeNames.has(sn.name)) {
      report.nodesOnlyOnServer.push({ name: sn.name, id: sn.id, type: sn.type });
    }
  });

  report.settingsSource =
    serverWorkflow.settings != null && Object.keys(serverWorkflow.settings || {}).length > 0
      ? 'servidor'
      : 'archivo';

  const merged = {
    name: fileWorkflow.name,
    nodes,
    connections: fileWorkflow.connections || {},
    settings: serverWorkflow.settings != null ? serverWorkflow.settings : fileWorkflow.settings,
    staticData: fileWorkflow.staticData,
    shared: fileWorkflow.shared,
  };

  return { merged, report };
}

function printReport(report, fileWorkflow, serverWorkflow, merged, workflowPath, apiUrl, id, idSource) {
  logSection('CONFIGURACIÓN');
  log('  Archivo local:', workflowPath);
  log('  API base:', apiUrl);
  log('  Workflow ID:', id, '← origen:', idSource || '—');
  log('  Nombre (archivo):', fileWorkflow.name);
  log('  Nombre (servidor):', serverWorkflow.name || '(no existía)');

  logSection('NODOS');
  log('  Total en archivo:', (fileWorkflow.nodes || []).length);
  log('  Total en servidor:', (serverWorkflow.nodes || []).length);
  log('  Total en merge (a enviar):', (merged.nodes || []).length);
  log('');
  report.nodes.forEach((n, i) => {
    const cred = n.hadCredentialsOnServer ? ' [credenciales preservadas]' : '';
    const match = n.matched ? ` (match por ${n.matchBy})` : ' [solo en archivo]';
    log(`  ${i + 1}. ${n.name} | type: ${n.type}${match}${cred}`);
  });

  if (report.nodesOnlyOnServer.length > 0) {
    logSection('NODOS SOLO EN SERVIDOR (se eliminarán en el PUT)');
    report.nodesOnlyOnServer.forEach((n) => log('  -', n.name, '|', n.type));
  }

  logSection('CREDENCIALES');
  if (report.credentialsPreserved.length > 0) {
    log('  Preservadas desde servidor (no se sobrescriben):');
    report.credentialsPreserved.forEach((c) => {
      log('    ·', c.node, '→', c.credentialTypes.join(', '));
    });
  } else {
    log('  Ninguna credencial preservada del servidor.');
  }
  if (report.credentialsNotOnServer.length > 0) {
    log('  Atención (archivo tiene credenciales, servidor no):');
    report.credentialsNotOnServer.forEach((c) => {
      const warn = c.placeholderDetected ? ' ⚠ Posible placeholder en el archivo' : '';
      log('    ·', c.node, '–', c.note + warn);
    });
  }

  logSection('SETTINGS');
  log('  Origen:', report.settingsSource);
  const settings = merged.settings || {};
  const keys = Object.keys(settings);
  if (keys.length > 0) {
    keys.forEach((k) => log('    ', k + ':', JSON.stringify(settings[k])));
  } else {
    log('    (vacío o no definido)');
  }
  log('  Claves permitidas por API (tras sanitizar):', ALLOWED_SETTINGS.join(', '));

  logSection('CONEXIONES');
  const conn = merged.connections || {};
  const connKeys = Object.keys(conn);
  log('  Nodos con conexiones salientes:', connKeys.length);
  connKeys.forEach((nodeName) => {
    const outs = conn[nodeName].main || [];
    const total = outs.reduce((acc, arr) => acc + (arr ? arr.length : 0), 0);
    log('    ', nodeName, '→', total, 'conexión(es)');
  });

  const payload = sanitizePayload(merged);
  const payloadSize = Buffer.byteLength(JSON.stringify(payload));
  logSection('PAYLOAD FINAL (resumen)');
  log('  name:', payload.name);
  log('  nodes:', (payload.nodes || []).length);
  log('  connections: sí');
  log('  settings (claves):', payload.settings ? Object.keys(payload.settings).join(', ') || 'ninguna' : 'no enviado');
  log('  Tamaño JSON:', (payloadSize / 1024).toFixed(2), 'KB');
  log('');
}

function putWorkflow(apiUrl, apiKey, workflow, workflowIdOverride) {
  const id = workflowIdOverride || workflow?.id;
  if (!id) throw new Error('Indica el ID del workflow (en el JSON o como argumento).');

  const normalizedUrl = apiUrl.replace(/(:\d+)(api\/)/i, '$1/$2');
  const url = new URL(normalizedUrl);
  const pathname = url.pathname.replace(/\/?$/, '') + '/workflows/' + id;

  const payload = sanitizePayload(workflow);
  const body = JSON.stringify(payload);
  return request(apiUrl, apiKey, pathname, 'PUT', body);
}

function main() {
  const argv = process.argv.slice(2);
  if (argv[0] === '--verbose' || argv[0] === '-v') {
    VERBOSE = true;
    argv.shift();
  }
  const workflowPath = argv[0] || DEFAULT_WORKFLOW;
  const workflowIdArg = argv[1];

  if (!fs.existsSync(workflowPath)) {
    console.error('No se encontró el archivo:', workflowPath);
    process.exit(1);
  }

  const env = loadEnv();
  if (env.N8N_PUSH_VERBOSE === '1' || env.N8N_PUSH_VERBOSE === 'true') VERBOSE = true;
  const apiUrl = env.N8N_API_URL;
  const apiKey = env.N8N_API_KEY;
  const envWorkflowId = resolveWorkflowIdFromEnv(env.N8N_WORKFLOW_ID);
  if (!apiUrl || !apiKey) {
    console.error('Faltan N8N_API_URL o N8N_API_KEY en .env');
    process.exit(1);
  }

  let workflow;
  try {
    workflow = JSON.parse(fs.readFileSync(workflowPath, 'utf8'));
  } catch (e) {
    console.error('JSON inválido:', e.message);
    process.exit(1);
  }

  const id = workflowIdArg || envWorkflowId || workflow.id;
  const idSource = workflowIdArg
    ? 'argumento CLI'
    : envWorkflowId
      ? 'N8N_WORKFLOW_ID (.env)'
      : workflow.id
        ? 'workflow.json'
        : 'ninguno';
  if (!id) {
    console.error('Falta el ID del workflow. Pon N8N_WORKFLOW_ID en .env o pásalo como argumento.');
    process.exit(1);
  }

  if (VERBOSE) {
    console.log('\n[VERBOSE] ID del workflow:', id, '(', idSource, ')');
    console.log('[VERBOSE] Obteniendo workflow actual del servidor (GET)...');
  }

  const startTime = Date.now();

  getWorkflow(apiUrl, apiKey, id)
    .then((serverWorkflow) => {
      if (VERBOSE) console.log('[VERBOSE] Workflow encontrado. Fusionando con archivo local...');
      const { merged, report } = mergeWithServer(workflow, serverWorkflow);
      printReport(report, workflow, serverWorkflow, merged, workflowPath, apiUrl, id, idSource);
      if (VERBOSE) console.log('[VERBOSE] Enviando PUT al servidor...');
      return putWorkflow(apiUrl, apiKey, merged, id);
    })
    .catch((err) => {
      if (err.message.startsWith('HTTP 404')) {
        if (VERBOSE) {
          logSection('CREACIÓN (workflow no existía en servidor)');
          log('  Se enviará el workflow íntegro desde el archivo (sin merge).');
          log('  Las credenciales del archivo se usarán tal cual.');
          log('');
        }
        return putWorkflow(apiUrl, apiKey, workflow, id);
      }
      throw err;
    })
    .then((result) => {
      const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);
      const baseUrl = (apiUrl.replace(/\/api\/v1\/?$/, '') || apiUrl);
      console.log('Workflow actualizado correctamente.');
      console.log('Nombre:', result.name || workflow.name);
      console.log('ID:', result.id || id, '| Origen:', idSource);
      console.log('URL:', baseUrl + '/workflow/' + (result.id || id));
      if (VERBOSE) {
        console.log('Tiempo:', elapsed, 's');
        console.log('\n[VERBOSE] Finalizado.\n');
      }
    })
    .catch((err) => {
      console.error('Error:', err.message);
      process.exit(1);
    });
}

main();
