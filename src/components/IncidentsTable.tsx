import React, { useState } from 'react';
import {
  ExternalLink,
  MapPin,
  Trash2,
  Copy,
  Check,
  Maximize2,
  X,
  AlertCircle,
  Camera,
  Navigation,
  Sparkles,
  Compass,
} from 'lucide-react';
import { IncidentRecord, SemaforoValue, SupervisorMapping } from '../types';
import { buildSmartMapsData } from '../utils/mapsHelper';

export type CommentFieldKey =
  | 'comentarioMonitoreo'
  | 'comentarioMensajero'
  | 'retroalimentacionMensajeria'
  | 'observacionIncidencia';

interface IncidentsTableProps {
  records: IncidentRecord[];
  catalog: SupervisorMapping[];
  activeRecordId: string | null;
  onSelectRecord: (record: IncidentRecord) => void;
  onUpdateRecord: (id: string, updates: Partial<IncidentRecord>) => void;
  onDeleteRecord: (id: string) => void;
  onOpenMapsAudit?: (record: IncidentRecord) => void;
  onOpenPhotoAudit?: (record: IncidentRecord) => void;
}

const QUICK_CHIPS = [
  { label: 'Fachada', text: 'Si acudió al domicilio - comparte foto de la fachada', sem: 1 as SemaforoValue },
  { label: 'Labor', text: 'Incidencia en entrega (Labor)', sem: 1 as SemaforoValue },
  { label: 'Llamar antes', text: 'Manifiesto indica llamar antes de la entrega', sem: 2 as SemaforoValue },
  { label: 'Reprogramar', text: 'Cliente solicita reprogramar entrega', sem: 2 as SemaforoValue },
  { label: 'Cancelar', text: 'Cliente cancela el pedido', sem: 2 as SemaforoValue },
  { label: 'No contesta', text: 'El titular no contesta llamadas y no sale nadie en el domicilio', sem: 2 as SemaforoValue },
  { label: 'Sin dinero', text: 'Sin dinero', sem: 2 as SemaforoValue },
  { label: 'No lo quiere', text: 'No lo quiere', sem: 2 as SemaforoValue },
  { label: 'Ya lo recibió', text: 'Ya lo recibió', sem: 1 as SemaforoValue },
  { label: 'Evidencia borrosa', text: 'Foto de evidencia borrosa / no se aprecia fachada ni número oficial', sem: 3 as SemaforoValue },
  { label: 'Evidencia incorrecta', text: 'Evidencia no corresponde al domicilio asignado', sem: 3 as SemaforoValue },
  { label: 'Sin gestión', text: 'No gestionó ruta completa, por lo tanto no hay evidencia', sem: 3 as SemaforoValue },
];

const FIELD_LABELS: Record<CommentFieldKey, string> = {
  comentarioMonitoreo: 'Monitoreo',
  comentarioMensajero: 'Mensajero',
  retroalimentacionMensajeria: 'Retroalimentación',
  observacionIncidencia: 'Obs. WhatsApp',
};

export const IncidentsTable: React.FC<IncidentsTableProps> = ({
  records,
  catalog,
  activeRecordId,
  onSelectRecord,
  onUpdateRecord,
  onDeleteRecord,
}) => {
  const [copiedVentaId, setCopiedVentaId] = useState<string | null>(null);
  const [copiedQueryId, setCopiedQueryId] = useState<string | null>(null);

  const handleCopyQuery = (queryText: string, id: string) => {
    navigator.clipboard.writeText(queryText);
    setCopiedQueryId(id);
    setTimeout(() => setCopiedQueryId(null), 1600);
  };

  // Tracks which of the 4 comment fields is currently active for each row (defaults to 'comentarioMonitoreo')
  const [rowActiveField, setRowActiveField] = useState<Record<string, CommentFieldKey>>({});

  // Expanded modal for full 4-comment editing on a single row
  const [expandedRecord, setExpandedRecord] = useState<IncidentRecord | null>(null);

  // Photo viewer modal state
  const [previewPhotoUrl, setPreviewPhotoUrl] = useState<string | null>(null);

  // Unique supervisors for dropdown suggestions
  const supervisorOptions = Array.from(
    new Set(catalog.map((c) => c.supervisor).filter(Boolean))
  );
  if (!supervisorOptions.includes('Alfonso Correa')) {
    supervisorOptions.unshift('Alfonso Correa');
  }
  if (!supervisorOptions.includes('Por asignar')) {
    supervisorOptions.push('Por asignar');
  }

  const handleCopyVenta = (venta: string, id: string) => {
    navigator.clipboard.writeText(venta);
    setCopiedVentaId(id);
    setTimeout(() => setCopiedVentaId(null), 1500);
  };

  const getSubestadoBadgeClass = (subestado: string) => {
    const s = (subestado || '').toLowerCase();
    if (s.includes('cancel')) {
      return 'bg-rose-950/70 text-rose-300 border-rose-600/40';
    }
    if (s.includes('reprogram')) {
      return 'bg-amber-950/70 text-amber-300 border-amber-600/40';
    }
    if (s.includes('labor')) {
      return 'bg-blue-950/70 text-blue-300 border-blue-600/40';
    }
    if (s.includes('entregad')) {
      return 'bg-emerald-950/70 text-emerald-300 border-emerald-600/40';
    }
    return 'bg-slate-800 text-slate-300 border-slate-700';
  };

  const handleApplyChip = (
    record: IncidentRecord,
    chip: typeof QUICK_CHIPS[number]
  ) => {
    const targetField = rowActiveField[record.id] || 'comentarioMonitoreo';
    const currentVal = record[targetField] || '';
    const newVal = currentVal ? `${currentVal}. ${chip.text}` : chip.text;

    const updates: Partial<IncidentRecord> = {
      [targetField]: newVal,
    };

    // If writing into comentarioMonitoreo, also adjust semaforo to the suggested rule
    if (targetField === 'comentarioMonitoreo') {
      updates.semaforo = chip.sem;
    }

    onUpdateRecord(record.id, updates);
  };

  if (records.length === 0) {
    return (
      <div className="bg-slate-900 rounded-2xl border border-slate-800 p-12 text-center shadow-lg">
        <div className="w-14 h-14 rounded-2xl bg-slate-800 text-slate-400 flex items-center justify-center mx-auto mb-3">
          <AlertCircle className="w-7 h-7" />
        </div>
        <h3 className="text-base font-semibold text-slate-200">
          No hay registros para mostrar
        </h3>
        <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
          Carga un archivo Excel de Beetrack arriba o pulsa el botón{' '}
          <strong className="text-blue-400">"Cargar datos de ejemplo"</strong> para comenzar a
          trabajar inmediatamente.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-slate-900 rounded-2xl border border-slate-800 shadow-xl overflow-hidden">
      {/* Table container with horizontal & vertical scroll */}
      <div className="overflow-x-auto max-h-[750px] relative">
        <table className="w-full text-left text-xs border-collapse">
          {/* Sticky Header with exact 10 columns + row number and actions */}
          <thead className="bg-slate-950 text-slate-300 uppercase text-[10px] tracking-wider font-semibold sticky top-0 z-20 border-b border-slate-800 shadow-xs">
            <tr>
              <th className="py-3.5 px-2 text-center w-12">#</th>
              <th className="py-3.5 px-3.5 min-w-[210px] max-w-[270px]">MENSAJERO / CLIENTE</th>
              <th className="py-3.5 px-3 min-w-[190px]">SUPERVISOR</th>
              <th className="py-3.5 px-3 min-w-[175px] text-center">SEMÁFORO</th>
              <th className="py-3.5 px-3 min-w-[130px]">VENTA</th>
              <th className="py-3.5 px-3 min-w-[140px]">SUBESTADO</th>
              <th className="py-3.5 px-2.5 min-w-[130px]">FECHA</th>
              <th className="py-3.5 px-3.5 min-w-[340px] max-w-[440px]">DIRECCIÓN / MAPS</th>
              <th className="py-3.5 px-3 min-w-[310px]">COMENTARIO MONITOREO</th>
              <th className="py-3.5 px-3 min-w-[270px]">COMENTARIO MENSAJERO</th>
              <th className="py-3.5 px-3 min-w-[270px]">RETROALIMENTACION</th>
              <th className="py-3.5 px-3 min-w-[290px]">OBSERVACION WHATSAPP</th>
              <th className="py-3.5 px-2 min-w-[90px] text-center">ACCIONES</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-800 text-slate-200">
            {records.map((r, index) => {
              const isActive = r.id === activeRecordId;
              const activeTargetField = rowActiveField[r.id] || 'comentarioMonitoreo';

              // Construct intelligent Maps queries using smartMaps helper
              const smartMaps = buildSmartMapsData(
                r.direccionOriginal,
                r.referenciasBeetrack,
                r.latitud,
                r.longitud
              );

              // Row background styling according to Semáforo
              // 1 = Verde (Sí acudió)
              // 2 = Amarillo/Naranja (Incidencia)
              // 3 = Rojo (Evidencia mal / sin evidencia)
              let rowBgClass = 'bg-slate-900 hover:bg-slate-800/60';
              let borderIndicator = 'border-l-4 border-l-transparent';

              if (r.semaforo === 3) {
                rowBgClass = 'bg-rose-950/20 hover:bg-rose-950/30';
                borderIndicator = 'border-l-4 border-l-rose-500';
              } else if (r.semaforo === 1) {
                rowBgClass = 'bg-emerald-950/15 hover:bg-emerald-950/25';
                borderIndicator = 'border-l-4 border-l-emerald-500';
              } else if (r.semaforo === 2) {
                rowBgClass = 'bg-amber-950/15 hover:bg-amber-950/25';
                borderIndicator = 'border-l-4 border-l-amber-500';
              }

              if (isActive) {
                rowBgClass += ' ring-1 ring-inset ring-blue-500/50';
              }

              return (
                <tr
                  key={r.id}
                  onClick={() => onSelectRecord(r)}
                  className={`transition-colors duration-100 ${rowBgClass} ${borderIndicator}`}
                >
                  {/* Row Index */}
                  <td className="py-3 px-2 text-center text-slate-400 font-mono text-[11px] align-top">
                    {index + 1}
                  </td>

                  {/* 1. MENSAJERO / CLIENTE (Full visible name, no truncation) */}
                  <td className="py-3 px-3.5 align-top">
                    <div className="font-bold text-slate-100 text-xs">{r.mensajero}</div>
                    {r.clienteNombre && (
                      <div className="mt-1 text-[11px] text-slate-300 font-normal leading-snug break-words">
                        <span className="text-slate-400 font-semibold">Cliente: </span>
                        <span className="text-slate-200">{r.clienteNombre}</span>
                      </div>
                    )}
                    {r.clienteTelefono && (
                      <div className="mt-0.5 text-[10px] text-amber-300/90 font-mono">
                        📞 Tel: {r.clienteTelefono}
                      </div>
                    )}
                  </td>

                  {/* 2. SUPERVISOR (Editable) */}
                  <td className="py-3 px-3 align-top">
                    <div className="space-y-1.5">
                      <input
                        type="text"
                        value={r.supervisor}
                        onChange={(e) =>
                          onUpdateRecord(r.id, { supervisor: e.target.value })
                        }
                        className="w-full bg-slate-950 border border-slate-700/80 rounded px-2.5 py-1 text-xs text-slate-200 focus:outline-none focus:border-sky-500"
                        placeholder="Supervisor..."
                      />
                      <select
                        value={r.supervisor}
                        onChange={(e) =>
                          onUpdateRecord(r.id, { supervisor: e.target.value })
                        }
                        className="w-full bg-slate-950/80 text-[10px] text-slate-400 border border-slate-800 rounded px-1.5 py-1 focus:outline-none"
                      >
                        <option value={r.supervisor}>Sugerir: {r.supervisor}</option>
                        {supervisorOptions.map((opt) => (
                          <option key={opt} value={opt}>
                            {opt}
                          </option>
                        ))}
                      </select>
                    </div>
                  </td>

                  {/* 3. SEMAFORO (1=Sí acudió, 2=Incidencia, 3=Evidencia mal) */}
                  <td className="py-3 px-3 text-center align-top">
                    <div className="flex flex-col items-center gap-1.5">
                      <select
                        value={r.semaforo}
                        onChange={(e) =>
                          onUpdateRecord(r.id, {
                            semaforo: Number(e.target.value) as SemaforoValue,
                          })
                        }
                        className={`text-xs font-bold rounded-lg px-2.5 py-1.5 border transition-all cursor-pointer ${
                          r.semaforo === 1
                            ? 'bg-emerald-950 border-emerald-500 text-emerald-300 shadow-sm shadow-emerald-900/40'
                            : r.semaforo === 2
                            ? 'bg-amber-950 border-amber-500 text-amber-300 shadow-sm shadow-amber-900/40'
                            : 'bg-rose-950 border-rose-500 text-rose-300 shadow-sm shadow-rose-900/40'
                        }`}
                      >
                        <option value={1}>1 - Verde (Sí acudió)</option>
                        <option value={2}>2 - Amarillo (Incidencia)</option>
                        <option value={3}>3 - Rojo (Evidencia mal)</option>
                      </select>
                      <span className="text-[10px] font-medium tracking-tight">
                        {r.semaforo === 1 && <span className="text-emerald-400">✓ Sí acudió</span>}
                        {r.semaforo === 2 && <span className="text-amber-400">⚠ Incidencia</span>}
                        {r.semaforo === 3 && <span className="text-rose-400">✕ Evidencia mal</span>}
                      </span>
                    </div>
                  </td>

                  {/* 4. VENTA */}
                  <td className="py-3 px-3 align-top">
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono font-bold text-slate-100 text-xs">
                        {r.venta}
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCopyVenta(r.venta, r.id);
                        }}
                        className="text-slate-400 hover:text-slate-200 p-0.5 cursor-pointer"
                        title="Copiar número de venta"
                      >
                        {copiedVentaId === r.id ? (
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                    {r.esEntregada && (
                      <span className="inline-block mt-1 text-[9px] uppercase px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-600/30">
                        Entregada
                      </span>
                    )}
                  </td>

                  {/* 5. SUBESTADO */}
                  <td className="py-3 px-3 align-top">
                    <span
                      className={`inline-block text-[11px] font-medium px-2 py-0.5 rounded-md border ${getSubestadoBadgeClass(
                        r.subestado
                      )}`}
                    >
                      {r.subestado || 'Sin subestado'}
                    </span>
                  </td>

                  {/* 6. FECHA */}
                  <td className="py-3 px-2.5 align-top">
                    <input
                      type="date"
                      value={r.fecha}
                      onChange={(e) =>
                        onUpdateRecord(r.id, { fecha: e.target.value })
                      }
                      className="bg-slate-950 border border-slate-700/80 rounded px-2 py-1 text-[11px] text-slate-200 focus:outline-none focus:border-blue-500"
                    />
                  </td>

                  {/* DIRECCIÓN / MAPS (Intelligent Search with Address + References + Cross-streets) */}
                  <td className="py-3 px-3.5 align-top">
                    <div className="space-y-2.5">
                      {/* Original Address box */}
                      <div>
                        <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-1">
                          Dirección de entrega:
                        </div>
                        <div className="text-[11px] text-slate-100 font-medium leading-relaxed break-words bg-slate-950/70 p-2.5 rounded-lg border border-slate-800">
                          {r.direccionOriginal || 'Sin dirección registrada'}
                        </div>
                      </div>

                      {/* Prominent Observaciones / Referencias box (very visible for Jaqui) */}
                      {r.referenciasBeetrack ? (
                        <div className="bg-amber-950/40 border border-amber-500/50 rounded-lg p-2.5 space-y-1 shadow-xs">
                          <div className="flex items-center gap-1.5 text-amber-300 font-bold text-[10px] uppercase tracking-wider">
                            <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                            <span>Observaciones / Referencias clave:</span>
                          </div>
                          <p className="text-[11px] text-amber-100 font-semibold leading-relaxed break-words">
                            {r.referenciasBeetrack}
                          </p>
                        </div>
                      ) : (
                        <div className="text-[10px] text-slate-500 italic px-1">
                          Sin observaciones o referencias adicionales
                        </div>
                      )}

                      {/* Action buttons: Smart Maps Search, Exact GPS, Copy query, and View photo */}
                      <div className="flex flex-wrap items-center gap-1.5 pt-1">
                        {/* 1. Primary Intelligent Search (Address + References) */}
                        <a
                          href={smartMaps.smartMapsUrl}
                          target="_blank"
                          rel="noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="inline-flex items-center gap-1.5 text-[10px] font-bold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 px-3 py-1.5 rounded-lg transition-all shadow-sm hover:shadow-blue-500/20"
                          title={`Búsqueda Inteligente en Google Maps: "${smartMaps.combinedQuery}"`}
                        >
                          <Compass className="w-3.5 h-3.5 text-blue-200" />
                          <span>Búsqueda Inteligente Maps</span>
                          <ExternalLink className="w-2.5 h-2.5 text-blue-200" />
                        </a>

                        {/* 2. Direct GPS if coordinates are present */}
                        {smartMaps.hasGps && smartMaps.gpsUrl && (
                          <a
                            href={smartMaps.gpsUrl}
                            target="_blank"
                            rel="noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="inline-flex items-center gap-1.5 text-[10px] font-bold text-emerald-300 hover:text-emerald-200 bg-emerald-950/80 border border-emerald-500/50 px-2.5 py-1.5 rounded-lg transition-colors shadow-xs"
                            title={`Ubicación satelital exacta por coordenadas GPS (${r.latitud}, ${r.longitud})`}
                          >
                            <Navigation className="w-3 h-3 text-emerald-400" />
                            <span>GPS Exacto</span>
                            <ExternalLink className="w-2.5 h-2.5" />
                          </a>
                        )}

                        {/* 3. Copy query text button */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCopyQuery(smartMaps.combinedQuery, r.id);
                          }}
                          className="inline-flex items-center gap-1 text-[10px] font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 px-2 py-1.5 rounded-lg transition-colors cursor-pointer"
                          title={`Copiar búsqueda inteligente: "${smartMaps.combinedQuery}"`}
                        >
                          {copiedQueryId === r.id ? (
                            <>
                              <Check className="w-3 h-3 text-emerald-400" />
                              <span className="text-emerald-400 font-bold">¡Copiada!</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3 h-3 text-slate-400" />
                              <span>Copiar búsqueda</span>
                            </>
                          )}
                        </button>

                        {/* 4. Foto de fachada button */}
                        {r.fotoFachadaUrl && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setPreviewPhotoUrl(r.fotoFachadaUrl || null);
                            }}
                            className="inline-flex items-center gap-1.5 text-[10px] font-bold text-teal-300 hover:text-teal-200 bg-teal-950/80 border border-teal-500/50 px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer"
                            title="Ver fotografía de fachada / evidencia de entrega"
                          >
                            <Camera className="w-3.5 h-3.5 text-teal-400" />
                            <span>Ver foto</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </td>

                  {/* 7. COMENTARIO MONITOREO */}
                  <td className="py-3 px-3 align-top">
                    <div className="space-y-1.5">
                      <div className="relative">
                        <textarea
                          rows={3}
                          value={r.comentarioMonitoreo}
                          onFocus={() =>
                            setRowActiveField((prev) => ({
                              ...prev,
                              [r.id]: 'comentarioMonitoreo',
                            }))
                          }
                          onChange={(e) =>
                            onUpdateRecord(r.id, {
                              comentarioMonitoreo: e.target.value,
                            })
                          }
                          className={`w-full bg-slate-950 border rounded-lg p-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none resize-y min-h-[70px] ${
                            activeTargetField === 'comentarioMonitoreo'
                              ? 'border-indigo-500 ring-1 ring-indigo-500/30'
                              : 'border-slate-700'
                          }`}
                          placeholder="Comentario de monitoreo..."
                        />
                      </div>

                      {/* Quick Chips row with destination field badge */}
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-[10px] text-slate-400">
                          <span>
                            Insertar en:{' '}
                            <strong className="text-sky-300">
                              {FIELD_LABELS[activeTargetField]}
                            </strong>
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {QUICK_CHIPS.map((chip, idx) => (
                            <button
                              key={idx}
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleApplyChip(r, chip);
                              }}
                              className="text-[9px] bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700/60 px-1.5 py-0.5 rounded transition-colors cursor-pointer"
                              title={`Insertar en ${FIELD_LABELS[activeTargetField]}: "${chip.text}"`}
                            >
                              +{chip.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* 8. COMENTARIO MENSAJERO (real Beetrack mobile driver comment) */}
                  <td className="py-3 px-3 align-top">
                    <textarea
                      rows={3}
                      value={r.comentarioMensajero}
                      onFocus={() =>
                        setRowActiveField((prev) => ({
                          ...prev,
                          [r.id]: 'comentarioMensajero',
                        }))
                      }
                      onChange={(e) =>
                        onUpdateRecord(r.id, {
                          comentarioMensajero: e.target.value,
                        })
                      }
                      className={`w-full bg-slate-950 border rounded-lg p-2.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none resize-y min-h-[70px] ${
                        activeTargetField === 'comentarioMensajero'
                          ? 'border-indigo-500 ring-1 ring-indigo-500/30'
                          : 'border-slate-700/80'
                      }`}
                      placeholder="Reporte del mensajero en Beetrack..."
                    />
                  </td>

                  {/* 9. RETROALIMENTACION A MENSAJERIA */}
                  <td className="py-3 px-3 align-top">
                    <textarea
                      rows={3}
                      value={r.retroalimentacionMensajeria}
                      onFocus={() =>
                        setRowActiveField((prev) => ({
                          ...prev,
                          [r.id]: 'retroalimentacionMensajeria',
                        }))
                      }
                      onChange={(e) =>
                        onUpdateRecord(r.id, {
                          retroalimentacionMensajeria: e.target.value,
                        })
                      }
                      className={`w-full bg-slate-950 border rounded-lg p-2.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none resize-y min-h-[70px] ${
                        activeTargetField === 'retroalimentacionMensajeria'
                          ? 'border-indigo-500 ring-1 ring-indigo-500/30'
                          : 'border-slate-700/80'
                      }`}
                      placeholder="Retroalimentación a mensajería..."
                    />
                  </td>

                  {/* 10. OBSERVACION DE INCIDENCIA DE ENTREGA (WHATSAPP) */}
                  <td className="py-3 px-3 align-top">
                    <textarea
                      rows={3}
                      value={r.observacionIncidencia}
                      onFocus={() =>
                        setRowActiveField((prev) => ({
                          ...prev,
                          [r.id]: 'observacionIncidencia',
                        }))
                      }
                      onChange={(e) =>
                        onUpdateRecord(r.id, {
                          observacionIncidencia: e.target.value,
                        })
                      }
                      className={`w-full bg-slate-950 border rounded-lg p-2.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none resize-y min-h-[70px] ${
                        activeTargetField === 'observacionIncidencia'
                          ? 'border-indigo-500 ring-1 ring-indigo-500/30'
                          : 'border-slate-700/80'
                      }`}
                      placeholder="Observaciones de WhatsApp..."
                    />
                  </td>

                  {/* ACCIONES: Cleaned up with Maximize / Delete */}
                  <td className="py-3 px-2 text-center align-top">
                    <div className="flex items-center justify-center gap-1.5 pt-1">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setExpandedRecord(r);
                        }}
                        className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors cursor-pointer"
                        title="Ver y editar los 4 comentarios en panel ampliado"
                      >
                        <Maximize2 className="w-3.5 h-3.5" />
                      </button>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteRecord(r.id);
                        }}
                        className="p-2 rounded-lg bg-slate-800 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 transition-colors cursor-pointer"
                        title="Descartar esta fila del reporte"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Expanded Modal for editing all 4 comments comfortably */}
      {expandedRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
          <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950">
              <div>
                <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                  <span>Edición Ampliada de Comentarios:</span>
                  <span className="text-blue-400 font-mono">
                    {expandedRecord.venta}
                  </span>
                  <span className="text-slate-400 text-xs font-normal">
                    ({expandedRecord.mensajero})
                  </span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  {expandedRecord.direccionOriginal}
                </p>
                {expandedRecord.referenciasBeetrack && (
                  <p className="text-[11px] text-amber-300/90 mt-1">
                    <span className="font-semibold text-amber-200">Referencias:</span>{' '}
                    {expandedRecord.referenciasBeetrack}
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={() => setExpandedRecord(null)}
                className="text-slate-400 hover:text-slate-200 p-1.5 rounded-lg hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4 flex-1">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-200">
                  7. COMENTARIO MONITOREO
                </label>
                <textarea
                  rows={3}
                  value={expandedRecord.comentarioMonitoreo}
                  onChange={(e) => {
                    const val = e.target.value;
                    setExpandedRecord({ ...expandedRecord, comentarioMonitoreo: val });
                    onUpdateRecord(expandedRecord.id, { comentarioMonitoreo: val });
                  }}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-xs text-slate-100 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-200">
                  8. COMENTARIO MENSAJERO (Beetrack)
                </label>
                <textarea
                  rows={2}
                  value={expandedRecord.comentarioMensajero}
                  onChange={(e) => {
                    const val = e.target.value;
                    setExpandedRecord({ ...expandedRecord, comentarioMensajero: val });
                    onUpdateRecord(expandedRecord.id, { comentarioMensajero: val });
                  }}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-200">
                  9. RETROALIMENTACION A MENSAJERIA
                </label>
                <textarea
                  rows={2}
                  value={expandedRecord.retroalimentacionMensajeria}
                  onChange={(e) => {
                    const val = e.target.value;
                    setExpandedRecord({ ...expandedRecord, retroalimentacionMensajeria: val });
                    onUpdateRecord(expandedRecord.id, { retroalimentacionMensajeria: val });
                  }}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-200">
                  10. OBSERVACION DE INCIDENCIA DE ENTREGA, REPORTADAS POR MEDIO DE WHATSAPP
                </label>
                <textarea
                  rows={2}
                  value={expandedRecord.observacionIncidencia}
                  onChange={(e) => {
                    const val = e.target.value;
                    setExpandedRecord({ ...expandedRecord, observacionIncidencia: val });
                    onUpdateRecord(expandedRecord.id, { observacionIncidencia: val });
                  }}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <div className="px-6 py-3 bg-slate-950 border-t border-slate-800 flex justify-end">
              <button
                type="button"
                onClick={() => setExpandedRecord(null)}
                className="text-xs font-semibold px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white cursor-pointer"
              >
                Listo
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Instant Photo Viewer Modal */}
      {previewPhotoUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-xs">
          <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-5 py-3.5 border-b border-slate-800 flex items-center justify-between bg-slate-950">
              <div className="flex items-center gap-2 text-slate-200 font-semibold text-xs">
                <Camera className="w-4 h-4 text-emerald-400" />
                <span>Foto de Fachada / Evidencia Beetrack</span>
              </div>
              <div className="flex items-center gap-2">
                <a
                  href={previewPhotoUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs text-sky-400 hover:text-sky-300 inline-flex items-center gap-1 bg-slate-800 px-2.5 py-1 rounded"
                >
                  <span>Abrir original</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
                <button
                  type="button"
                  onClick={() => setPreviewPhotoUrl(null)}
                  className="text-slate-400 hover:text-slate-200 p-1 rounded hover:bg-slate-800"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-4 flex-1 flex items-center justify-center overflow-auto bg-slate-950">
              <img
                src={previewPhotoUrl}
                alt="Evidencia fachada Beetrack"
                className="max-h-[70vh] w-auto max-w-full object-contain rounded-lg shadow-lg"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
