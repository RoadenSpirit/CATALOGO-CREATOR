# Sistema de Diseño y Tipografía - YourBrand

Este documento registra los parámetros exactos de diseño (fuentes, tamaños y colores) extraídos de la paleta oficial de diseño (referencia `@Paleta.jpeg`), para garantizar la consistencia visual en todas las imágenes renderizadas por el Motor de Render de n8n.

## 1. Cabecera y Nombre del Producto

| Elemento | Fuente | Tamaño | Color | Estilo |
| :--- | :--- | :--- | :--- | :--- |
| **ID del Producto** | `Open Sans` | 30px | `#2c2c2c` | Bold (700) + Subrayado (`text-decoration: underline`) |

## 2. Sección de Tallas (Refuerzo Visual)

| Elemento | Fuente | Tamaño | Color | Estilo |
| :--- | :--- | :--- | :--- | :--- |
| **Etiqueta "Talla:"** | `Open Sans` | 30px | `#333333` | Bold (700) |
| **Valores numéricos** | `Open Sans` | 28px | `#555555` | Bold (700) |

## 3. Precios (Sección Principal)

| Elemento | Fuente | Tamaño | Color | Estilo |
| :--- | :--- | :--- | :--- | :--- |
| **Precio Actual** | `Archivo Black` | 50px | `#e87b04` | Ultra-Bold (Display) |
| **Precio Viejo (Original)** | `Open Sans` | 26px | `#999999` | Tachado Natural (`text-decoration: line-through`) |
| **Ahorro (Descuento)** | `Open Sans` | 22px | `#d32f2f` | Bold (700) |

## 4. Slogan y Separadores

| Elemento | Fuente | Tamaño | Color | Estilo |
| :--- | :--- | :--- | :--- | :--- |
| **Slogan (Ganchos)** | `Open Sans` | 34px | `#444444` | Semi-Bold (600) |
| **Separador (/)** | `Open Sans` | 40px | `#eeeeee` | Light (200) |

---
**Nota Técnica:** Estas fuentes se importan dinámicamente desde Google Fonts en el HTML generado por Puppeteer.
```css
@import url('https://fonts.googleapis.com/css2?family=Archivo+Black&family=Open+Sans:wght@200;400;600;700&display=swap');
```