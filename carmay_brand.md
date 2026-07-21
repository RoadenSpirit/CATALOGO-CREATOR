# Brand Guidelines & Business Rules: Your Brand

## 1. Brand Identity & Positioning
- **Core Concept:** A seamless mix of trend-setting fashion and high-end technology.
- **Brand Promise:** "The best of fashion and technology at your fingertips." We eliminate speculation by offering fair prices and durable products.
- **Tone & Voice:** Accessible yet premium, highly professional, innovative, and inspiring. 

## 2. Visual Identity & Assets
- **Primary Corporate Color:** YourBrand Purple (`#6d1e68`). This color represents elegance and distinction. It must be used as the primary background or dominant accent in product showcases.
- **Logo Placement:** Always positioned in the Top-Left corner of product images to maintain a consistent premium catalog look.
- **Typography/Text:** Clean, modern, and highly legible. 

## 3. Pricing Display Rules
- All automated product images must display dual pricing.
- **Currency 1:** USD (United States Dollar).
- **Currency 2:** CUP (Cuban Peso).
- The pricing text must be clearly visible, contrasting with the background, and formatted professionally (e.g., "$50.00 USD | 15,000 CUP").

## 4. Workflow: fotos crudas por categoría
- **Carpeta base:** `your-photos-folder/` con una subcarpeta por categoría (ej. Accesorios, Carteras, Ropa, Tecnologia, Zapatos). Opcional: variable de entorno `YOUR_PHOTOS_PATH` con la ruta absoluta.
- **Emparejado por categoría:** Cada producto se busca solo en la carpeta de su categoría. La categoría del producto se toma de la hoja de cálculo (filas tipo `--- ACCESORIOS ---`, `--- ZAPATOS ---`, etc.). Los nombres de sección deben coincidir con los nombres de carpeta (normalizados: minúsculas, sin espacios).
- **Nombres de imagen:** El nombre del archivo (sin extensión) se normaliza y se empareja con el NOMBRE del producto en la hoja (mismo criterio de normalización). Ej.: `TENIS NIKE AIR.jpg` en `Zapatos/` ↔ producto "TENIS NIKE AIR" en sección "--- ZAPATOS ---".