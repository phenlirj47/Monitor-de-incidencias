import * as XLSX from 'xlsx';
import { IncidentRecord } from '../types';

export const EXPORT_COLUMNS = [
  'SUPERVISOR',
  'MENSAJERO',
  'SEMAFORO',
  'VENTA',
  'SUBESTADO',
  'FECHA',
  'COMENTARIO MONITOREO',
  'COMENTARIO MENSAJERO',
  'RETROALIMENTACION A MENSAJERIA',
  'OBSERVACION DE INCIDENCIA DE ENTREGA, REPORTADAS POR MEDIO DE WHATSAPP',
] as const;

export function exportToExcel(records: IncidentRecord[], customFilename?: string): void {
  // Convert records to 2D array with exact columns in exact order
  const data = records.map((r) => [
    r.supervisor || 'Por asignar',
    r.mensajero || '',
    r.semaforo || 2,
    r.venta || '',
    r.subestado || '',
    r.fecha || '',
    r.comentarioMonitoreo || '',
    r.comentarioMensajero || '',
    r.retroalimentacionMensajeria || '',
    r.observacionIncidencia || '',
  ]);

  // Prepend headers
  const aoa = [EXPORT_COLUMNS as unknown as string[], ...data];

  const worksheet = XLSX.utils.aoa_to_sheet(aoa);

  // Column width configuration for readable layout
  worksheet['!cols'] = [
    { wch: 22 }, // SUPERVISOR
    { wch: 24 }, // MENSAJERO
    { wch: 12 }, // SEMAFORO
    { wch: 18 }, // VENTA
    { wch: 20 }, // SUBESTADO
    { wch: 15 }, // FECHA
    { wch: 42 }, // COMENTARIO MONITOREO
    { wch: 40 }, // COMENTARIO MENSAJERO
    { wch: 40 }, // RETROALIMENTACION A MENSAJERIA
    { wch: 75 }, // OBSERVACION DE INCIDENCIA DE ENTREGA, REPORTADAS POR MEDIO DE WHATSAPP
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Monitoreo Incidencias');

  // Generate filename: Reporte_Monitoreo_Incidencias_YYYY-MM-DD.xlsx
  const today = new Date().toISOString().split('T')[0];
  const filename = customFilename || `Reporte_Monitoreo_Incidencias_${today}.xlsx`;

  XLSX.writeFile(workbook, filename);
}
