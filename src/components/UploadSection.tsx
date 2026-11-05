import React, { useRef, useState } from 'react';
import {
  UploadCloud,
  FileCheck2,
  Sparkles,
  RefreshCw,
  AlertCircle,
  HelpCircle,
  ToggleLeft,
  ToggleRight,
  Trash2,
} from 'lucide-react';

interface UploadSectionProps {
  onFileUpload: (file: File) => void;
  onLoadSampleData: () => void;
  onClearAll: () => void;
  includeDelivered: boolean;
  onToggleIncludeDelivered: (val: boolean) => void;
  totalRawRows: number;
  incidentRowsCount: number;
  fileName: string | null;
  isLoading: boolean;
}

export const UploadSection: React.FC<UploadSectionProps> = ({
  onFileUpload,
  onLoadSampleData,
  onClearAll,
  includeDelivered,
  onToggleIncludeDelivered,
  totalRawRows,
  incidentRowsCount,
  fileName,
  isLoading,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      if (
        file.name.endsWith('.xlsx') ||
        file.name.endsWith('.xls') ||
        file.name.endsWith('.csv')
      ) {
        onFileUpload(file);
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onFileUpload(e.target.files[0]);
    }
  };

  return (
    <section className="bg-slate-900/90 rounded-2xl border border-slate-800 p-5 shadow-lg">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-center">
        {/* Drop Zone */}
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`lg:col-span-7 border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition-all duration-200 flex flex-col items-center justify-center min-h-[140px] ${
            isDragging
              ? 'border-blue-500 bg-blue-500/10'
              : 'border-slate-700 hover:border-slate-600 bg-slate-950/40 hover:bg-slate-950/70'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx, .xls, .csv"
            onChange={handleFileChange}
            className="hidden"
          />

          <div className="w-12 h-12 rounded-full bg-blue-600/15 border border-blue-500/30 flex items-center justify-center text-blue-400 mb-2.5">
            {isLoading ? (
              <RefreshCw className="w-6 h-6 animate-spin text-blue-400" />
            ) : (
              <UploadCloud className="w-6 h-6" />
            )}
          </div>

          <h3 className="text-sm font-semibold text-slate-200">
            {fileName ? (
              <span className="text-emerald-400 flex items-center gap-1.5 justify-center">
                <FileCheck2 className="w-4 h-4" />
                Archivo cargado: {fileName}
              </span>
            ) : (
              'Subir Excel de Beetrack ("Reporte Rutas y Entregas")'
            )}
          </h3>

          <p className="text-xs text-slate-400 mt-1 max-w-md">
            Arrastra tu archivo aquí o haz clic para seleccionarlo (.xlsx, .xls).
            Se procesan automáticamente órdenes, mensajeros, comentarios reales del chofer, coordenadas GPS y fotos.
          </p>
        </div>

        {/* Controls & Quick Actions */}
        <div className="lg:col-span-5 flex flex-col justify-between space-y-4">
          {/* Status Counter indicator */}
          <div className="bg-slate-950/60 rounded-xl p-3.5 border border-slate-800">
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="text-slate-400 font-medium">Estado del Procesamiento:</span>
              <span className="text-slate-500 text-[11px]">Beetrack → Monitoreo</span>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="text-lg font-bold text-slate-100">
                  {totalRawRows > 0 ? (
                    <>
                      <span className="text-blue-400">{totalRawRows}</span>
                      <span className="text-slate-500 text-xs font-normal ml-1">
                        filas en origen
                      </span>
                    </>
                  ) : (
                    <span className="text-slate-500 text-sm">Sin datos aún</span>
                  )}
                </p>
              </div>

              <div className="text-right">
                <p className="text-lg font-bold text-slate-100">
                  {incidentRowsCount > 0 ? (
                    <>
                      <span className="text-rose-400">{incidentRowsCount}</span>
                      <span className="text-slate-500 text-xs font-normal ml-1">
                        incidencias activas
                      </span>
                    </>
                  ) : (
                    <span className="text-slate-500 text-xs text-slate-400">
                      Esperando archivo
                    </span>
                  )}
                </p>
              </div>
            </div>
          </div>

          {/* Toggle "Incluir entregadas" */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950/40 border border-slate-800/80">
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-slate-300">
                Incluir entregadas con observaciones
              </span>
              <span
                className="text-slate-500 hover:text-slate-400 cursor-help"
                title="Por defecto se muestran solo 'No entregado', 'Reprogramado', 'Cancelado' o 'Labor'. Activa esto para auditar también órdenes entregadas."
              >
                <HelpCircle className="w-3.5 h-3.5" />
              </span>
            </div>

            <button
              onClick={() => onToggleIncludeDelivered(!includeDelivered)}
              className="flex items-center text-xs font-semibold gap-1.5 px-2.5 py-1 rounded-lg border transition-all cursor-pointer"
              style={{
                backgroundColor: includeDelivered
                  ? 'rgba(59, 130, 246, 0.15)'
                  : 'rgba(51, 65, 85, 0.3)',
                borderColor: includeDelivered
                  ? 'rgba(59, 130, 246, 0.4)'
                  : 'rgba(71, 85, 105, 0.4)',
                color: includeDelivered ? '#93c5fd' : '#94a3b8',
              }}
            >
              {includeDelivered ? (
                <>
                  <ToggleRight className="w-4 h-4 text-blue-400" />
                  <span>Incluidas</span>
                </>
              ) : (
                <>
                  <ToggleLeft className="w-4 h-4 text-slate-400" />
                  <span>Solo Incidencias</span>
                </>
              )}
            </button>
          </div>

          {/* Secondary Buttons: Sample Data & Clear */}
          <div className="flex items-center gap-2.5">
            <button
              onClick={onLoadSampleData}
              className="flex-1 inline-flex items-center justify-center gap-2 text-xs font-medium px-3.5 py-2 rounded-xl bg-blue-600/15 hover:bg-blue-600/25 text-blue-300 border border-blue-500/30 transition-colors shadow-sm cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-blue-400" />
              <span>Cargar datos de ejemplo</span>
            </button>

            {incidentRowsCount > 0 && (
              <button
                onClick={onClearAll}
                className="inline-flex items-center justify-center gap-1.5 text-xs font-medium px-3 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 transition-colors cursor-pointer"
                title="Limpiar todos los datos cargados"
              >
                <Trash2 className="w-4 h-4" />
                <span>Limpiar</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};
