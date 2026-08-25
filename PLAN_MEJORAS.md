# Plan de actualización y mejora

Este plan conserva el lenguaje visual del Fax —tipografía, color, movimiento y carácter gráfico— y concentra los
cambios de interfaz en claridad, jerarquía, respuesta táctil y prevención de solapamientos.

## Estado de la modernización

- Yarn 4 con un solo lockfile para todo el monorepo.
- Node 24 LTS como plataforma objetivo.
- Vite 8, Fastify 5, Sass, PostCSS, Autoprefixer, Prettier y herramientas de compilación actualizadas.
- TypeScript estricto en frontend y backend.
- Retiro de SQLite, TypeBox, ts-node, nodemon y Alquimia, que no participaban en el código ejecutado.
- USB se mantiene temporalmente en la última versión 2.x. La versión 3 cambia de implementación y requiere una
  prueba física de impresión antes de adoptarla.
- CI reproducible: instalación inmutable, formato, tipos y compilación.

## Prioridad 1: flujo esencial y composición adaptable

1. Convertir el recorrido en estados explícitos: esperando foto, procesando, vista previa, enviando, impreso y error.
2. Evitar que la cámara fija cubra el título o los controles. Mantenerla dentro del flujo en móvil y tableta; usar una
   vista flotante solo cuando el ancho disponible garantice que no se superpone.
3. Hacer que la vista previa nunca exceda el ancho ni el alto visibles, conservando su proporción.
4. Convertir seleccionar e imprimir en controles semánticos con áreas táctiles amplias, foco visible y mensajes de
   estado cercanos a la acción.
5. Permitir cambiar la foto y reintentar sin recargar la página. Confirmar claramente cuándo la impresión terminó.
6. Respetar `prefers-reduced-motion` sin eliminar el carácter animado para el resto de visitantes.

## Prioridad 2: impresión fiable y segura

1. Implementar una cola FIFO con un único trabajador USB.
2. Asignar un identificador e idempotency key a cada trabajo para impedir duplicados accidentales.
3. Recibir una imagen validada, no comandos ESC/POS arbitrarios, y generar ESC/POS en el servidor.
4. Limitar origen, tipo, ancho, alto y tamaño del cuerpo. El límite actual de 30 MB es excesivo para 384 px de ancho.
5. Exponer estados `en-cola`, `imprimiendo`, `terminado` y `falló` para que la interfaz dé información veraz.
6. Añadir cierre ordenado ante SIGTERM/SIGINT y pruebas del servidor sin depender de la impresora física.

## Prioridad 3: procesamiento de imagen

1. Corregir los bordes del tramado Atkinson para no propagar error entre filas equivocadas.
2. Aplicar orientación EXIF, validar formato y limitar dimensiones antes de decodificar imágenes grandes.
3. Mover el tramado a un Web Worker para que la interfaz siga respondiendo durante el cálculo.
4. Mantener una sola representación de la imagen y liberar explícitamente blobs, bitmaps y buffers.
5. Comparar el resultado impreso con una lámina de prueba antes de ofrecer filtros adicionales.

## Prioridad 4: cámara y rendimiento visual

1. Medir cuadros entregados, reconexiones, edad del último cuadro y memoria del navegador.
2. Suspender transmisión y animación cuando la pestaña no sea visible o durante tareas que no necesitan la cámara.
3. Adaptar resolución y FPS a la ventana sin acumular cuadros; conservar MJPEG hasta demostrar que otra arquitectura
   mejora la instalación real.
4. Escalar el canvas del fondo según densidad de píxel y limitar su trabajo en equipos lentos.
5. Probar de forma aislada fondo, cámara, selección, procesamiento e impresión en Chrome de escritorio y móvil.

## Prioridad 5: operación

1. Instalar rotación y retención de logs de PM2 antes de que vuelvan a ocupar varios gigabytes.
2. Añadir endpoints de salud separados para cámara e impresión y una comprobación automática posterior al despliegue.
3. Documentar copia restaurable, compilación, despliegue y reversión.
4. Actualizar Node 24 por parches LTS sin fijar la operación futura a una versión fuera de soporte.
5. Probar `usb@3` en una rama y sesión de hardware separadas; adoptar solo si enumeración, transferencia, corte,
   liberación y varias impresiones consecutivas pasan.

## Criterios de terminación

- No hay solapamientos entre 320 px y pantallas grandes.
- Toda acción tiene respuesta visible y accesible.
- Una ráfaga de solicitudes no produce impresiones mezcladas ni duplicadas.
- Cámara y servidor se recuperan de una desconexión sin intervención manual.
- El árbol instala de forma inmutable, pasa formato y tipos, compila y no reporta vulnerabilidades conocidas.
- Una sesión prolongada mantiene estable el navegador, la memoria, los procesos y el tamaño de logs.
