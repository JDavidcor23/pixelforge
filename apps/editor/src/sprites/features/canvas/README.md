# Canvas System (Konva.js + Zustand)

Este es el corazón del editor. Usamos un patrón de **Infinite Canvas** que permite al usuario trabajar con sprites de cualquier tamaño mientras mantiene una experiencia fluida.

## Stack Tecnológico
- **Konva.js**: Motor de renderizado basado en Canvas 2D. Maneja las capas, el zoom y la interacción táctil/ratón.
- **Zustand**: Gestión de estado ultra-rápida. El canvas se sincroniza con el store de forma reactiva.

## Arquitectura
- **Infinite Canvas**: El `<canvas>` real ocupa el 100% de su contenedor padre (`CanvasArea`). El posicionamiento de los píxeles es independiente del scroll, lo que permite hacer zoom estable.
- **Sincronización de Capas**: Cada capa de Konva representa una capa del sprite. El renderizado es selectivo: solo se redibuja lo que cambia.
- **Pixel-Perfect**: Usamos `imageSmoothingEnabled={false}` en todos los contextos para asegurar que el arte pixelado se vea nítido y retro, sin borrosidad.

## Gotchas y Consejos
- **ResizeObserver**: El canvas detecta automáticamente cambios en el tamaño de la ventana para ajustarse.
- **Coordinate System**: (0,0) es siempre la esquina superior izquierda del sprite, independientemente del zoom actual.
- **Performance**: Evitamos crear miles de objetos rectangulares. Para sprites grandes (128px+), usamos el renderizado por textura de canvas nativo (`base64ToPixels` -> texture).
