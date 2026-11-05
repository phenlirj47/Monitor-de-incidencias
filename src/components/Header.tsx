import React from 'react';
import {
  FileSpreadsheet,
  Download,
  Users,
  MessageSquareText,
  Sparkles,
  MapPin,
  Image as ImageIcon,
} from 'lucide-react';
import { IncidentRecord } from '../types';

interface HeaderProps {
  records: IncidentRecord[];
  filteredCount: number;
  onExport: () => void;
  onOpenCatalog: () => void;
  onOpenTemplates: () => void;
  onOpenMapsHelper: () => void;
  onOpenCardGen: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  records,
  filteredCount,
  onExport,
  onOpenCatalog,
  onOpenTemplates,
  onOpenMapsHelper,
  onOpenCardGen,
}) => {
  const semaforo1Count = records.filter((r) => r.semaforo === 1).length;
  const semaforo2Count = records.filter((r) => r.semaforo === 2).length;
  const semaforo3Count = records.filter((r) => r.semaforo === 3).length;

  return (
    <header className="sticky top-0 z-30 bg-slate-900 border-b border-slate-800 shadow-md">
      <div className="w-full max-w-[98%] 2xl:max-w-[1920px] mx-auto px-3 sm:px-6 lg:px-8 py-3.5">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          {/* Brand & Title */}
          <div className="flex items-center space-x-3.5">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center text-white shadow-inner shadow-blue-400/30">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold text-slate-100 tracking-tight">
                  Monitor de Incidencias
                </h1>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-400/30">
                  CV Directo
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Automatización de reportes de monitoreo y control de entregas
              </p>
            </div>
          </div>

          {/* Quick stats badges */}
          <div className="flex items-center flex-wrap gap-2 text-xs">
            <div className="bg-slate-800/80 px-2.5 py-1.5 rounded-lg border border-slate-700 text-slate-300">
              <span className="text-slate-400">Total:</span>{' '}
              <strong className="text-white font-semibold">{records.length}</strong>
              {filteredCount !== records.length && (
                <span className="text-slate-400 ml-1">({filteredCount} visibles)</span>
              )}
            </div>

            <div
              className="flex items-center gap-1.5 bg-emerald-950/50 border border-emerald-600/40 px-2.5 py-1.5 rounded-lg text-emerald-300"
              title="Semáforo 1 (Verde): El mensajero SÍ acudió al domicilio (hay evidencia)"
            >
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block shadow-sm shadow-emerald-500/50" />
              <span>Sem. 1 (Sí acudió):</span>
              <strong className="font-bold text-emerald-200">{semaforo1Count}</strong>
            </div>

            <div
              className="flex items-center gap-1.5 bg-amber-950/50 border border-amber-600/40 px-2.5 py-1.5 rounded-lg text-amber-300"
              title="Semáforo 2 (Amarillo): Hubo incidencias en la entrega (no contesta, reprogramado, cancelado, etc.)"
            >
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block shadow-sm shadow-amber-500/50" />
              <span>Sem. 2 (Incidencia):</span>
              <strong className="font-bold text-amber-200">{semaforo2Count}</strong>
            </div>

            <div
              className="flex items-center gap-1.5 bg-rose-950/50 border border-rose-600/40 px-2.5 py-1.5 rounded-lg text-rose-300"
              title="Semáforo 3 (Rojo): La evidencia está mal (borrosa, incorrecta, no corresponde, o sin evidencia)"
            >
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block shadow-sm shadow-rose-500/50" />
              <span>Sem. 3 (Evidencia mal):</span>
              <strong className="font-bold text-rose-200">{semaforo3Count}</strong>
            </div>
          </div>

          {/* Top Actions: Cleaned up as requested */}
          <div className="flex items-center flex-wrap gap-2">
            <button
              onClick={onOpenTemplates}
              className="inline-flex items-center gap-1.5 text-xs font-semibold px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors shadow-sm cursor-pointer"
              title="Abrir panel de plantillas de comentarios rápidos"
            >
              <MessageSquareText className="w-4 h-4 text-indigo-400" />
              <span>Plantillas</span>
            </button>

            <button
              onClick={onOpenCatalog}
              className="inline-flex items-center gap-1.5 text-xs font-semibold px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors shadow-sm cursor-pointer"
              title="Configuración del catálogo de Mensajeros y Supervisores"
            >
              <Users className="w-4 h-4 text-sky-400" />
              <span>Supervisores</span>
            </button>

            <button
              onClick={onExport}
              disabled={records.length === 0}
              className="inline-flex items-center gap-2 text-xs font-bold px-4 py-2 rounded-lg bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-md shadow-emerald-950/40 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              title="Descargar Reporte Monitoreo Incidencias en Excel (.xlsx)"
            >
              <Download className="w-4 h-4" />
              <span>Descargar .xlsx</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
