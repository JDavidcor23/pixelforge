# AI Copilot & PixelLab Integration

El sistema de AI permite generar sprites completos a partir de prompts de texto. 

## Flujo de Trabajo
1. **Prompt**: El usuario escribe una descripción (ej: "A cute slime").
2. **API Call**: Se llama a `/api/ai/pixellab` con el prompt y la resolución deseada (32x32, 64x64, etc.).
3. **Generación**: La API de PixelLab genera una imagen PNG y la devuelve en formato **Base64**.
4. **Conversión**: Usamos `pixellab-utils.ts` para transformar ese Base64 en una matriz de píxeles (RGBA) que el editor puede manipular.
5. **Aplicación**: El store (`overwriteWithPixels`) limpia el canvas actual y aplica el nuevo sprite, ajustando las dimensiones automáticamente.

## Utilidades Clave (`pixellab-utils.ts`)
- `generateSpriteWithPixelLab`: Maneja la comunicación con el backend.
- `base64ToPixels`: El "mago" que convierte una imagen visual en datos puros para el editor.

## Historial
Las generaciones se guardan en el `localStorage` del navegador. Esto permite al usuario recuperar sprites generados anteriormente sin gastar créditos de API adicionales.

## Requisitos
- **API Key**: Se necesita `PIXELLAB_API_KEY` configurada en el entorno para que la generación funcione en producción.
