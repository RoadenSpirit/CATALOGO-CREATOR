const fs = require('fs');

const renameMap = {
  'ManualTrigger': '▶️ Inicio Manual',
  'CONFIG': '⚙️ Variables Globales',
  'CargarLogo': '🖼️ Leer Logo de Marca',
  'SO_FindFiles': '🔍 Buscar Fotos Locales',
  'SO_ParsePaths': '🧠 Identificar Variantes',
  'GoogleSheets': '📊 Leer Inventario Sheets',
  'LeerEstadoActual': '📋 Leer Estado de Progreso',
  'CleanPricing': '💲 Formatear Precios y Tallas',
  'If': '🔀 ¿Aplicar Tasa de Cambio?',
  'Process_CUP': '💱 Recalcular Precio CUP',
  'NormalizarEstado': '🧹 Limpiar Estado Previo',
  'Sync_AB': '⏳ Esperar Inventario',
  'Sync_ABC': '⏳ Esperar Sincronización',
  'PrepareGalleryData': '🧠 Motor de Decisión',
  'LoopNode': '🔁 Bucle de Procesamiento',
  'ExecuteRenderMotor': '🎨 Diseñar Foto',
  'MapeoCarpetas': '📂 Asignar Carpeta Destino',
  'If_Is_Gallery': '🔀 ¿Es una Galería?',
  'ReadBinary_Single': '💿 Cargar Foto Única',
  'DriveUpload_Single': '☁️ Subir Foto Única (Drive)',
  'SheetUpdate_Single': '📝 Marcar PROCESADA',
  'If_Is_First_Photo': '🔀 ¿Es la Foto Principal?',
  'DriveSearch_Folder_First': '🔍 Buscar Carpeta Antigua',
  'If_Folder_Exists': '🔀 ¿Existe Carpeta Antigua?',
  'DriveDelete_Folder': '🗑️ Borrar Carpeta Antigua',
  'DriveCreate_Folder': '📁 Crear Nueva Carpeta',
  'DriveSearch_Folder_Next': '🔍 Buscar Carpeta Actual',
  'ReadBinary_Gallery': '💿 Cargar Foto de Galería',
  'DriveUpload_Gallery': '☁️ Subir Variante a Carpeta',
  'SheetUpdate_Gallery': '📝 Progreso Galería (Sheet)'
};

const notesMap = {
  'ManualTrigger': 'Punto de entrada para ejecutar el procesamiento por lotes de forma manual.',
  'CONFIG': 'Define la tasa de cambio CUP actual y si se debe aplicar o no la conversión de monedas.',
  'CargarLogo': 'Carga el logo oficial de YourBrand desde el disco local para usarlo como marca de agua.',
  'SO_FindFiles': 'Escanea la carpeta "/your-photos-folder" para encontrar todas las imágenes pendientes por procesar.',
  'SO_ParsePaths': 'Analiza el nombre de cada foto para saber de qué producto es y si es la foto principal o una variante.',
  'GoogleSheets': 'Descarga la lista maestra de productos y precios desde Google Sheets.',
  'LeerEstadoActual': 'Lee la hoja de cálculo para saber qué productos ya fueron procesados anteriormente y evitar trabajo doble.',
  'CleanPricing': 'Limpia los números, calcula si hay descuentos activos y extrae las tallas disponibles (T1-T9).',
  'If': 'Decide si el precio en CUP debe ser recalculado basándose en el precio USD y la tasa global.',
  'Process_CUP': 'Multiplica el valor en USD por la tasa de cambio para obtener el nuevo precio en moneda nacional.',
  'NormalizarEstado': 'Organiza los datos del progreso anterior para que el sistema pueda compararlos fácilmente.',
  'Sync_AB': 'Espera que los precios y rutas locales terminen de leerse.',
  'Sync_ABC': 'Puntos de control: el sistema espera aquí hasta que las fotos, los precios y el estado estén cargados 100%.',
  'PrepareGalleryData': 'Cruza inventario con fotos, descarta lo ya procesado, agrupa galerías y pone las fotos en fila india para el bucle.',
  'LoopNode': 'Deja pasar una sola foto a la vez para que se le aplique el diseño gráfico sin saturar la memoria.',
  'ExecuteRenderMotor': 'Envía la foto cruda al Sub-flujo de Diseño Gráfico y espera a que regrese ya procesada y guardada en disco.',
  'MapeoCarpetas': 'Decide en qué carpeta de Google Drive debe guardarse la foto según su categoría.',
  'If_Is_Gallery': 'Evalúa si el producto actual tiene solo una foto o es parte de un grupo de varias imágenes.',
  'ReadBinary_Single': 'Lee la imagen única desde el disco local justo antes de subirla.',
  'DriveUpload_Single': 'Sube la foto directamente a la categoría general de Drive porque el producto solo tiene una imagen.',
  'SheetUpdate_Single': 'Actualiza el inventario indicando que la foto única se subió correctamente.',
  'If_Is_First_Photo': 'Dentro de una galería, decide si esta foto es la número 1 (portada) o una de las secundarias (2, 3...).',
  'DriveSearch_Folder_First': 'Revisa si el producto ya tenía una carpeta creada en Drive anteriormente.',
  'If_Folder_Exists': 'Decide si debe proceder a borrar una carpeta vieja antes de crear la nueva para evitar basura.',
  'DriveDelete_Folder': 'Elimina la carpeta obsoleta del producto en Drive para mantener el almacenamiento limpio.',
  'DriveCreate_Folder': 'Crea una carpeta exclusiva con el nombre del producto para guardar toda su galería.',
  'DriveSearch_Folder_Next': 'Si es la foto 2 o 3, busca la carpeta que se acaba de crear para subir las imágenes dentro de ella.',
  'ReadBinary_Gallery': 'Lee la imagen recién diseñada desde el disco local un instante antes de subirla a Drive.',
  'DriveUpload_Gallery': 'Guarda la foto actual dentro de la carpeta exclusiva del producto en Google Drive.',
  'SheetUpdate_Gallery': 'Escribe en el inventario que se subió una foto nueva (ej. "PROCESADA (2)") y enlaza la carpeta de Drive.'
};

const backupPath = 'flujos/history/2026-04-06T20-29_feat__fully_stabilized_Multi_Image_Gallery_architecture_with_Late_Binary_Fetching_and_Drive_Node_validations/YourBrand_Batch__Producci_n_Real__V3___RESTAURADO_.json';
let wfRaw = fs.readFileSync(backupPath, 'utf8');

// Replace references in expressions
wfRaw = wfRaw.replace(/\$\('CONFIG'\)/g, "$('⚙️ Variables Globales')");
wfRaw = wfRaw.replace(/\$\('MapeoCarpetas'\)/g, "$('📂 Asignar Carpeta Destino')");
wfRaw = wfRaw.replace(/\$node\['DriveCreate_Folder'\]/g, "$node['📁 Crear Nueva Carpeta']");
wfRaw = wfRaw.replace(/\$\('ExecuteRenderMotor'\)/g, "$('🎨 Diseñar Foto')");

let wf = JSON.parse(wfRaw);

// Rename nodes and add notes
for (let node of wf.nodes) {
  let originalName = node.name;
  if (renameMap[originalName]) {
    node.name = renameMap[originalName];
    node.notes = notesMap[originalName];
    node.notesInFlow = true;
  }
}

// Rename connections
const newConnections = {};
for (let [oldSource, targets] of Object.entries(wf.connections)) {
  let newSource = renameMap[oldSource] || oldSource;
  newConnections[newSource] = {};
  for (let [portName, branchTargets] of Object.entries(targets)) {
     newConnections[newSource][portName] = branchTargets.map(branch => {
       return branch.map(target => {
         return {
           ...target,
           node: renameMap[target.node] || target.node
         };
       });
     });
  }
}
wf.connections = newConnections;

fs.writeFileSync('flujos/temp_restored_wf.json', JSON.stringify(wf, null, 2));
console.log('JSON restaurado exitosamente');