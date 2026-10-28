# Spec: Rediseño de Descripción bajo Título y Regla de Prueba para "CHANCLETA DE BANO IPANEMA"

## 1. Contexto y Objetivos
- **Entorno Afectado:** EXCLUSIVAMENTE entorno TEST (`Generador IMG TEST` - ID `67y5jM3pXXAsSW9k` y `Motor Render TEST` - ID `UCDA3SEZLU9Etvxc`).
- **Producción:** Queda 100% INTACTA (`6FHeLxLFNFDoYyoh` y `RLVkKKWYAp51LXtL`).
- **Objetivos Técnicos:**
  1. Reubicar el bloque de **DESCRIPCIÓN** en la plantilla HTML YourBrand para que se sitúe en la cabecera del footer, justo debajo del nombre del producto y al lado o junto a la talla (`.top-left-block`).
  2. Eliminar la altura fija forzada de 150px (`SPEC_AREA = 150`) para que el espacio se ajuste dinámicamente según la longitud del texto.
  3. Modificar el nodo de filtrado en el flujo de prueba (`🌪️ Filtro de Cambios` en `Generador IMG TEST`) para que el producto **`CHANCLETA DE BANO IPANEMA`** siempre pase el filtro y se procese sin importar su estado previo ni sus precios.

---

## 2. Modificaciones en Detalle

### A. Sub-flujo: `Motor Render TEST` (`UCDA3SEZLU9Etvxc`)
**Nodo:** `🎨 Preparar HTML YourBrand`
1. **Extracción y Flag:**
   ```javascript
   const descripcion = (item.DESCRIPCION || item.DESCRIPCIÓN) ? String(item.DESCRIPCION || item.DESCRIPCIÓN).trim() : '';
   const hasSpecs = descripcion.length > 0;
   ```
2. **Ubicación en el DOM:**
   - Se crea el componente `descHtml`:
     ```javascript
     let descHtml = '';
     if (hasSpecs) {
       descHtml = '<div class="desc-tag"><span class="desc-val">' + descripcion + '</span></div>';
     }
     ```
   - Se inyecta dentro de `.top-left-block`:
     ```html
     <div class="top-left-block">
       <div class="name-tag">${productId}</div>
       ${tallaHtml}
       ${descHtml}
     </div>
     ```
   - Se retira `SPEC_AREA = 150` y el antiguo bloque `.spec-block` absoluto del centro del footer.
   - Ajuste de estilos CSS:
     - `.desc-tag`: `margin-top: 4px; max-width: 1020px; font-size: 24px; font-weight: 600; color: #444444; line-height: 1.25;`
     - `.divider-title`: Posicionamiento relativo o con margen para que el separador y la zona de precios respete la altura natural del bloque de cabecera.

### B. Flujo Principal TEST: `Generador IMG TEST (Copia Exacta)` (`67y5jM3pXXAsSW9k`)
**Nodo:** `🌪️ Filtro de Cambios`
- Se agrega una regla explícita:
  ```json
  {
    "leftValue": "={{ ($json.PRODUCTO || '').toString().toUpperCase() }}",
    "operator": { "operation": "contains", "type": "string" },
    "rightValue": "CHANCLETA DE BANO IPANEMA"
  }
  ```
- Al estar unidas por el combinador `OR`, si el producto es `CHANCLETA DE BANO IPANEMA`, pasará inmediatamente el filtro hacia la cola de diseño, garantizando las pruebas repetibles.

---

## 3. Plan de Verificación
1. Validar sintaxis y configuración JSON de ambos flujos en la base de datos de n8n.
2. Confirmar que el flujo de producción no tiene cambios en su versión ni fecha de actualización.
