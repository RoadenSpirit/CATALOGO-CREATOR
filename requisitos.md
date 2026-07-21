# Requisitos del Proyecto n8nYourBrand

## Características Pendientes
- [ ] Implementar el paquete `auto skills` de `midu dev`.
- [ ] Corregir error de sintaxis JS en la expresión del parámetro `jsonBody` en el nodo `"📱 Notif: Inicio"` del flujo `6FHeLxLFNFDoYyoh` (removiendo los escapes incorrectos de comillas como `\'` y `\\`).
- [ ] Corregir error de sintaxis similar en el nodo `"📱 Notif: Error Diseño"`.
- [ ] Investigar la causa del crash por posible falta de memoria (Out of Memory) en el sub-flujo `"🎨 Diseñar Foto"` (Motor Render Universal).

## Características Completadas
- [x] Analizar el estado inicial del directorio del proyecto (identificado como vacío).
- [x] Identificar las habilidades (skills) y herramientas nativas a disposición del asistente.
- [x] Solicitar y obtener permisos pre-aprobados para comandos esenciales de terminal (`which` y `ps`).
- [x] Validar si n8n está en ejecución y establecer conexión via MCP con la instancia.
- [x] Revisar y diagnosticar las últimas ejecuciones del flujo `6FHeLxLFNFDoYyoh` (identificando fallos por sintaxis en notificaciones y crashes en el renderizado).
