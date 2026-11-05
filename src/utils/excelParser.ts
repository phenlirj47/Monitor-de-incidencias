import * as XLSX from 'xlsx';
import { IncidentRecord, SemaforoValue, SupervisorMapping } from '../types';

// Helper to normalize strings for comparison
function normalizeKey(str: string): string {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '');
}

export function determineTentativeSemaforo(
  comentario: string,
  subestado: string,
  estado: string,
  hasFotoFachada?: boolean
): SemaforoValue {
  const normComentario = (comentario || '').toLowerCase();
  const normSub = (subestado || '').toLowerCase();
  const normEstado = (estado || '').toLowerCase();

  // Rule 3 (Rojo): La EVIDENCIA ESTÁ MAL (foto borrosa, incorrecta, no corresponde, o no gestionó / sin evidencia)
  if (
    normComentario.includes('borros') ||
    normComentario.includes('no corresponde') ||
    normComentario.includes('foto incorrecta') ||
    normComentario.includes('evidencia incorrecta') ||
    normComentario.includes('evidencia mal') ||
    normComentario.includes('no gestiono') ||
    normComentario.includes('no gestionó') ||
    normComentario.includes('sin evidencia') ||
    normComentario.includes('no acudio') ||
    normComentario.includes('no acudió') ||
    normComentario.includes('fuera de ruta')
  ) {
    return 3;
  }

  // Rule 1 (Verde): El mensajero SÍ ACUDIÓ al domicilio (hay evidencia de que fue)
  // - Subestado "Labor" indica que acudió y realizó labor
  // - O hay foto de fachada registrada en Beetrack
  // - O el comentario indica foto de fachada / sí acudió / entrega
  if (
    normSub.includes('labor') ||
    hasFotoFachada ||
    normComentario.includes('fachada') ||
    normComentario.includes('si acudio') ||
    normComentario.includes('sí acudió') ||
    normComentario.includes('foto de fachada') ||
    normComentario.includes('evidencia de foto') ||
    normComentario.includes('comprobante') ||
    normComentario.includes('ya lo recibio') ||
    normComentario.includes('ya lo recibió') ||
    (normEstado.includes('entregad') && !normEstado.includes('no'))
  ) {
    return 1;
  }

  // Rule 2 (Amarillo/Naranja): Hubo INCIDENCIAS en la entrega (reprogramado, cancelado, no estaba, no contestó, sin dinero, etc.)
  if (
    normSub.includes('reprogram') ||
    normSub.includes('cancel') ||
    normComentario.includes('no estaba') ||
    normComentario.includes('no contesta') ||
    normComentario.includes('sin dinero') ||
    normComentario.includes('no lo quiere') ||
    normComentario.includes('llamar antes') ||
    normComentario.includes('manifiesto')
  ) {
    return 2;
  }

  // Default fallback is 2 (Incidencia en entrega)
  return 2;
}

export function findSupervisorForMessenger(
  messenger: string,
  catalog: SupervisorMapping[]
): string {
  if (!messenger || !messenger.trim()) return 'Por asignar';

  const normMessenger = normalizeKey(messenger);

  // Exact normalized match or substring
  for (const item of catalog) {
    const normCatalog = normalizeKey(item.mensajero);
    if (
      normMessenger === normCatalog ||
      normMessenger.includes(normCatalog) ||
      normCatalog.includes(normMessenger)
    ) {
      return item.supervisor || 'Por asignar';
    }
  }

  // Word-by-word match (e.g. "Brian Correa" vs "Correa Brian")
  const messengerWords = messenger
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .split(/\s+/)
    .filter((w) => w.length > 2);

  for (const item of catalog) {
    const catalogWords = item.mensajero
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .split(/\s+/)
      .filter((w) => w.length > 2);

    if (
      catalogWords.length > 0 &&
      catalogWords.every((cw) => normMessenger.includes(cw))
    ) {
      return item.supervisor || 'Por asignar';
    }
  }

  return 'Por asignar';
}

function formatDateValue(val: any): string {
  if (!val) {
    return new Date().toISOString().split('T')[0];
  }

  if (val instanceof Date) {
    return val.toISOString().split('T')[0];
  }

  if (typeof val === 'number') {
    // Excel date serial number
    const date = new Date(Math.round((val - 25569) * 86400 * 1000));
    return isNaN(date.getTime()) ? new Date().toISOString().split('T')[0] : date.toISOString().split('T')[0];
  }

  const str = String(val).trim();
  // If formatted like DD/MM/YYYY or YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}/.test(str)) {
    return str.substring(0, 10);
  }
  if (/^\d{1,2}\/\d{1,2}\/\d{4}/.test(str)) {
    const parts = str.split('/');
    const d = parts[0].padStart(2, '0');
    const m = parts[1].padStart(2, '0');
    const y = parts[2].substring(0, 4);
    return `${y}-${m}-${d}`;
  }

  return str.substring(0, 10);
}

export async function parseDispatchExcel(
  file: File,
  catalog: SupervisorMapping[]
): Promise<{ records: IncidentRecord[]; totalRawRows: number; error?: string }> {
  return new Promise((resolve) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array', cellDates: true });

        const firstSheetName = workbook.SheetNames[0];
        if (!firstSheetName) {
          resolve({ records: [], totalRawRows: 0, error: 'El archivo Excel no contiene hojas.' });
          return;
        }

        const worksheet = workbook.Sheets[firstSheetName];
        const rawJson: any[] = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

        if (!rawJson || rawJson.length === 0) {
          resolve({ records: [], totalRawRows: 0, error: 'La hoja de Excel está vacía.' });
          return;
        }

        const records: IncidentRecord[] = [];

        rawJson.forEach((row, index) => {
          // Flexible key lookup
          const rowNormalized: Record<string, any> = {};
          for (const key of Object.keys(row)) {
            rowNormalized[normalizeKey(key)] = row[key];
          }

          // Beetrack column mappings
          const venta =
            rowNormalized['ordencvdirecto'] ||
            rowNormalized['orden'] ||
            rowNormalized['numerodeorden'] ||
            rowNormalized['noorden'] ||
            rowNormalized['venta'] ||
            rowNormalized['identificador'] ||
            `V-${index + 1}`;

          const mensajero =
            rowNormalized['usuariomovil'] ||
            rowNormalized['mensajero'] ||
            rowNormalized['chofer'] ||
            rowNormalized['conductor'] ||
            rowNormalized['repartidor'] ||
            rowNormalized['usuario'] ||
            'Sin Mensajero';

          const estado = String(
            rowNormalized['estado'] ||
            rowNormalized['status'] ||
            rowNormalized['estadodeentrega'] ||
            ''
          ).trim();

          const subestado = String(
            rowNormalized['subestado'] ||
            rowNormalized['substatus'] ||
            rowNormalized['motivo'] ||
            ''
          ).trim();

          const rawFecha =
            rowNormalized['fechallegada'] ||
            rowNormalized['fechaestimada'] ||
            rowNormalized['fechasalida'] ||
            rowNormalized['fecha'] ||
            rowNormalized['fechadeentrega'] ||
            '';
          const fecha = formatDateValue(rawFecha);

          const direccionCliente = String(
            rowNormalized['direccioncliente'] ||
            rowNormalized['direccion'] ||
            rowNormalized['domicilio'] ||
            rowNormalized['destino'] ||
            ''
          ).trim();

          const clienteNombre = String(
            rowNormalized['nombrecliente'] ||
            rowNormalized['cliente'] ||
            rowNormalized['destinatario'] ||
            rowNormalized['nombre'] ||
            ''
          ).trim();

          const clienteTelefono = String(
            rowNormalized['telefonousuario'] ||
            rowNormalized['telefonocliente'] ||
            rowNormalized['telefono'] ||
            rowNormalized['celular'] ||
            rowNormalized['tel'] ||
            ''
          ).trim();

          // Beetrack Observations / References for delivery & Maps enhancement
          const entreCalles = String(
            rowNormalized['entrecalles'] ||
            rowNormalized['entrecalle'] ||
            rowNormalized['cruces'] ||
            rowNormalized['cruce'] ||
            ''
          ).trim();

          const rawObservaciones = String(
            rowNormalized['observaciones'] ||
            rowNormalized['observacion'] ||
            rowNormalized['referencias'] ||
            rowNormalized['referencia'] ||
            rowNormalized['referenciasdomicilio'] ||
            rowNormalized['notas'] ||
            rowNormalized['observacionescliente'] ||
            ''
          ).trim();

          // Combine cross-streets and references cleanly
          const referenciasParts: string[] = [];
          if (entreCalles) {
            referenciasParts.push(`Entre calles: ${entreCalles}`);
          }
          if (rawObservaciones) {
            referenciasParts.push(rawObservaciones);
          }
          const referenciasBeetrack = referenciasParts.join('. ').trim();

          // Beetrack Mobile Driver Comment (real comment from mobile app)
          const comentarioMensajero = String(
            rowNormalized['comentarionosalecliente'] ||
            rowNormalized['nosaleclientenocontesta'] ||
            rowNormalized['nosalecliente'] ||
            rowNormalized['comentarionocontesta'] ||
            rowNormalized['comentariochofer'] ||
            rowNormalized['comentariomovil'] ||
            rowNormalized['comentariorepartidor'] ||
            rowNormalized['comentariomensajero'] ||
            rowNormalized['comentarioentrega'] ||
            rowNormalized['motivonoentrega'] ||
            rowNormalized['comentario'] ||
            rowNormalized['comentarios'] ||
            ''
          ).trim();

          // Beetrack Coordinates (Latitude & Longitude)
          let latitud: number | null = null;
          let longitud: number | null = null;

          const rawLat =
            rowNormalized['latitud'] ??
            rowNormalized['lat'] ??
            rowNormalized['latitude'];
          const rawLng =
            rowNormalized['longitud'] ??
            rowNormalized['long'] ??
            rowNormalized['lng'] ??
            rowNormalized['lon'] ??
            rowNormalized['longitude'];

          if (rawLat !== undefined && rawLat !== null && String(rawLat).trim() !== '') {
            const pLat = parseFloat(String(rawLat).trim());
            if (!isNaN(pLat) && pLat !== 0) latitud = pLat;
          }

          if (rawLng !== undefined && rawLng !== null && String(rawLng).trim() !== '') {
            const pLng = parseFloat(String(rawLng).trim());
            if (!isNaN(pLng) && pLng !== 0) longitud = pLng;
          }

          // Beetrack Photo / Evidence URL
          const fotoFachadaUrl = String(
            rowNormalized['fotofachada'] ||
            rowNormalized['foto'] ||
            rowNormalized['urlfoto'] ||
            rowNormalized['urlimagen'] ||
            rowNormalized['linkfoto'] ||
            rowNormalized['evidencia'] ||
            rowNormalized['urlevidencia'] ||
            rowNormalized['fotografia'] ||
            rowNormalized['fotodomicilio'] ||
            rowNormalized['evidenciafotografica'] ||
            ''
          ).trim();

          const supervisor = findSupervisorForMessenger(mensajero, catalog);
          const semaforo = determineTentativeSemaforo(
            comentarioMensajero,
            subestado,
            estado,
            Boolean(fotoFachadaUrl)
          );

          const esEntregada =
            normalizeKey(estado).includes('entregad') &&
            !normalizeKey(estado).includes('noentregad');

          // Initialize default comment for monitoring based on subestado
          let comentarioMonitoreo = '';
          const normSubestado = normalizeKey(subestado);

          if (normSubestado.includes('reprogram')) {
            comentarioMonitoreo = 'Cliente solicita reprogramar entrega';
          } else if (normSubestado.includes('cancel')) {
            comentarioMonitoreo = 'Cliente cancela el pedido';
          } else if (normSubestado.includes('labor')) {
            comentarioMonitoreo = 'Incidencia en entrega (Labor)';
          } else if (comentarioMensajero) {
            comentarioMonitoreo = `Reporte: ${comentarioMensajero}`;
          } else {
            comentarioMonitoreo = esEntregada ? 'Entrega concluida' : 'En seguimiento de monitoreo de ruta';
          }

          records.push({
            id: `row-${Date.now()}-${index}`,
            supervisor,
            mensajero,
            semaforo,
            venta: String(venta).trim(),
            subestado: subestado || (esEntregada ? 'Entregado' : 'Sin subestado'),
            fecha,
            comentarioMonitoreo,
            comentarioMensajero: comentarioMensajero || '', // Real value from Beetrack or empty
            retroalimentacionMensajeria: '',               // Empty for Jaqui
            observacionIncidencia: '',                     // Empty for Jaqui
            direccionOriginal: direccionCliente,
            clienteNombre,
            clienteTelefono: clienteTelefono || undefined,
            estadoOriginal: estado,
            esEntregada,
            referenciasBeetrack: referenciasBeetrack || undefined,
            latitud,
            longitud,
            fotoFachadaUrl: fotoFachadaUrl || undefined,
          });
        });

        resolve({ records, totalRawRows: rawJson.length });
      } catch (err: any) {
        console.error('Error al procesar Excel:', err);
        resolve({
          records: [],
          totalRawRows: 0,
          error: `Error al leer el archivo Excel: ${err?.message || 'Formato no reconocido'}`,
        });
      }
    };

    reader.onerror = () => {
      resolve({ records: [], totalRawRows: 0, error: 'Error al abrir el archivo en el navegador.' });
    };

    reader.readAsArrayBuffer(file);
  });
}
