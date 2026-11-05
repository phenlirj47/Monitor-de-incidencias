import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json({ limit: '50mb' }));

// Server-side initialization of Gemini client with recommended telemetry header
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    hasApiKey: Boolean(process.env.GEMINI_API_KEY),
    timestamp: new Date().toISOString(),
  });
});

// 1. Google Maps Grounding endpoint using gemini-3.8-flash
app.post('/api/gemini/maps-grounding', async (req, res) => {
  try {
    const { address, notes, lat, lng } = req.body;
    if (!address) {
      return res.status(400).json({ error: 'La dirección es obligatoria.' });
    }

    const prompt = `Analiza la siguiente dirección de entrega para monitoreo de paquetería e incidencias en México.
Dirección: "${address}"
${notes ? `Detalles adicionales / observaciones: "${notes}"` : ''}

Por favor realiza:
1. Verificación geográfica del domicilio (colonia, municipio/alcaldía, código postal y referencias visibles en Google Maps).
2. Puntos de referencia cercanos y vialidades principales para asistir al mensajero en la entrega.
3. Recomendación práctica para el monitor de incidencias (ej. si la numeración es ambigua o zona de difícil acceso).`;

    const toolConfig: any = {};
    if (typeof lat === 'number' && typeof lng === 'number') {
      toolConfig.retrievalConfig = {
        latLng: {
          latitude: lat,
          longitude: lng,
        },
      };
    }

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        tools: [{ googleMaps: {} }],
        ...(Object.keys(toolConfig).length > 0 ? { toolConfig } : {}),
      },
    });

    const groundingChunks =
      response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    const text = response.text || '';

    // Extract map URLs
    const mapLinks: Array<{ uri: string; title: string }> = [];
    for (const chunk of groundingChunks as any[]) {
      if (chunk.maps?.uri) {
        mapLinks.push({
          uri: chunk.maps.uri,
          title: chunk.maps.title || 'Ver en Google Maps',
        });
      }
    }

    res.json({
      text,
      mapLinks,
      groundingChunks,
    });
  } catch (error: any) {
    console.error('Error en maps-grounding:', error);
    res.status(500).json({
      error: error?.message || 'Error al consultar Google Maps con Gemini.',
    });
  }
});

// 2. Multimodal Image Analysis endpoint using gemini-4-argon
app.post('/api/gemini/analyze-evidence', async (req, res) => {
  try {
    const { base64Image, mimeType = 'image/jpeg', contextInfo } = req.body;
    if (!base64Image) {
      return res.status(400).json({ error: 'La imagen en base64 es requerida.' });
    }

    const prompt = `Actúa como especialista en auditoría de paquetería y logística de entrega de última milla para CV Directo.
Analiza esta fotografía que el mensajero adjuntó como evidencia de entrega o intento de entrega.
${contextInfo ? `Contexto del envío: ${JSON.stringify(contextInfo)}` : ''}

Determina de forma objetiva:
1. ¿Qué se observa en la foto? (¿Fachada de inmueble con número visible? ¿Nota de no localizado? ¿Manifiesto? ¿Puerta cerrada? ¿Pantallazo de chat WhatsApp? ¿Vehículo?)
2. Clasificación de Semáforo tentativa:
   - Semáforo 1 (Verde): Si se muestra evidencia clara de haber acudido a la fachada / domicilio con número exterior o entrega efectiva.
   - Semáforo 2 (Amarillo): Si el manifiesto indicaba llamar antes o hay intento de contacto documentado / reprogramación justificada.
   - Semáforo 3 (Rojo): Si no hay evidencia contundente, no concuerda el domicilio, o no se gestionó la ruta correctamente.
3. Propuesta de texto breve para "COMENTARIO MONITOREO".
4. Propuesta de texto para "RETROALIMENTACION A MENSAJERIA".

Responde en formato JSON estrictamente válido con los campos:
{
  "tipoEvidencia": "...",
  "tieneFachadaVisible": true/false,
  "numeroVisible": "...",
  "semaforoSugerido": 1 | 2 | 3,
  "razonSemaforo": "...",
  "comentarioMonitoreo": "...",
  "retroalimentacion": "...",
  "observacionIncidencia": "..."
}`;

    let response;
    try {
      // Primary model: gemini-4-argon as specified
      response = await ai.models.generateContent({
        model: 'gemini-4-argon',
        contents: {
          parts: [
            {
              inlineData: {
                mimeType,
                data: base64Image.replace(/^data:[a-zA-Z0-9/+-]+;base64,/, ''),
              },
            },
            { text: prompt },
          ],
        },
        config: {
          responseMimeType: 'application/json',
        },
      });
    } catch (modelErr: any) {
      console.warn('Fallback de gemini-4-argon a gemini-3.8-flash para análisis de imagen:', modelErr?.message);
      response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: {
          parts: [
            {
              inlineData: {
                mimeType,
                data: base64Image.replace(/^data:[a-zA-Z0-9/+-]+;base64,/, ''),
              },
            },
            { text: prompt },
          ],
        },
        config: {
          responseMimeType: 'application/json',
        },
      });
    }

    const text = response.text || '{}';
    let parsed = {};
    try {
      parsed = JSON.parse(text);
    } catch {
      parsed = { rawText: text };
    }

    res.json({ result: parsed, raw: text });
  } catch (error: any) {
    console.error('Error en analyze-evidence:', error);
    res.status(500).json({
      error: error?.message || 'Error al analizar la imagen de evidencia.',
    });
  }
});

// 3. Image Generation with Aspect Ratio using gemini-nano-banana-2.1
app.post('/api/gemini/generate-card', async (req, res) => {
  try {
    const { prompt, aspectRatio = '1:1', imageSize = '1K' } = req.body;
    if (!prompt) {
      return res.status(400).json({ error: 'El prompt para la imagen es obligatorio.' });
    }

    // Supported aspect ratios in nano banana: "1:1", "3:4", "4:3", "9:16", "16:9", "1:4", "1:8", "4:1", "8:1"
    // Map non-native ratios like 2:3 -> 3:4, 3:2 -> 4:3, 21:9 -> 16:9
    const validRatios: Record<string, string> = {
      '1:1': '1:1',
      '2:3': '3:4',
      '3:2': '4:3',
      '3:4': '3:4',
      '4:3': '4:3',
      '9:16': '9:16',
      '16:9': '16:9',
      '21:9': '16:9',
    };
    const mappedRatio = validRatios[aspectRatio] || '1:1';

    let response;
    try {
      response = await ai.models.generateContent({
        model: 'gemini-nano-banana-2.1',
        contents: {
          parts: [
            {
              text: `Professional corporate graphic for delivery logistics incident report: ${prompt}. Clean, high quality, vector/isometric style with delivery icons and status indicators.`,
            },
          ],
        },
        config: {
          imageConfig: {
            aspectRatio: mappedRatio as any,
            imageSize: (imageSize === '2K' || imageSize === '4K' ? imageSize : '1K') as any,
          },
        },
      });
    } catch (nanoErr: any) {
      console.warn('Fallback to gemini-3.1-flash-lite-image:', nanoErr?.message);
      // Fallback to flash-lite-image
      const flashValidRatios: Record<string, string> = {
        '1:1': '1:1',
        '3:4': '3:4',
        '4:3': '4:3',
        '9:16': '9:16',
        '16:9': '16:9',
      };
      const flashRatio = flashValidRatios[aspectRatio] || '1:1';
      response = await ai.models.generateContent({
        model: 'gemini-3.1-flash-lite-image',
        contents: {
          parts: [
            {
              text: `Professional graphic for delivery logistics report: ${prompt}`,
            },
          ],
        },
        config: {
          imageConfig: {
            aspectRatio: flashRatio as any,
          },
        },
      });
    }

    let imageUrl = null;
    let descriptionText = '';

    for (const part of response.candidates?.[0]?.content?.parts ?? []) {
      if (part.inlineData?.data) {
        const mime = part.inlineData.mimeType || 'image/png';
        imageUrl = `data:${mime};base64,${part.inlineData.data}`;
      } else if (part.text) {
        descriptionText += part.text;
      }
    }

    if (!imageUrl) {
      return res.status(500).json({ error: 'No se generó imagen en la respuesta.' });
    }

    res.json({
      imageUrl,
      aspectRatioSelected: aspectRatio,
      effectiveRatio: mappedRatio,
      description: descriptionText,
    });
  } catch (error: any) {
    console.error('Error en generate-card:', error);
    res.status(500).json({
      error: error?.message || 'Error al generar la imagen.',
    });
  }
});

// Configure Vite middleware or static serving
async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Monitor de Incidencias CV Directo escuchando en http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Fallo al iniciar el servidor:', err);
  process.exit(1);
});
