import React, { useState } from 'react';
import {
  X,
  Camera,
  Upload,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Loader2,
} from 'lucide-react';
import { IncidentRecord, SemaforoValue } from '../types';

interface EvidenceAuditModalProps {
  isOpen: boolean;
  onClose: () => void;
  record: IncidentRecord | null;
  onApplyAuditResult: (
    recordId: string,
    updates: {
      semaforo?: SemaforoValue;
      comentarioMonitoreo?: string;
      retroalimentacionMensajeria?: string;
      observacionIncidencia?: string;
    }
  ) => void;
}

export const EvidenceAuditModal: React.FC<EvidenceAuditModalProps> = ({
  isOpen,
  onClose,
  record,
  onApplyAuditResult,
}) => {
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [mimeType, setMimeType] = useState<string>('image/jpeg');
  const [isLoading, setIsLoading] = useState(false);
  const [auditResult, setAuditResult] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleImageFile = (file: File) => {
    setMimeType(file.type || 'image/jpeg');
    const reader = new FileReader();
    reader.onload = (e) => {
      setImagePreview(e.target?.result as string);
      setAuditResult(null);
      setError(null);
    };
    reader.readAsDataURL(file);
  };

  const handleAnalyze = async () => {
    if (!imagePreview) return;
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/gemini/analyze-evidence', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          base64Image: imagePreview,
          mimeType,
          contextInfo: record
            ? {
                venta: record.venta,
                mensajero: record.mensajero,
                subestado: record.subestado,
                direccion: record.direccionOriginal,
              }
            : undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Error al analizar la imagen con Gemini');
      }

      setAuditResult(data.result);
    } catch (err: any) {
      console.error(err);
      setError(err?.message || 'Error al procesar la auditoría visual');
    } finally {
      setIsLoading(false);
    }
  };

  const handleApply = () => {
    if (!record || !auditResult) return;

    onApplyAuditResult(record.id, {
      semaforo: auditResult.semaforoSugerido as SemaforoValue,
      comentarioMonitoreo: auditResult.comentarioMonitoreo,
      retroalimentacionMensajeria: auditResult.retroalimentacion,
      observacionIncidencia: auditResult.observacionIncidencia,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center border border-indigo-500/30">
              <Camera className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-slate-100">
                  Auditoría Visual de Evidencia de Entrega
                </h2>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-indigo-950 border border-indigo-600/40 text-indigo-300">
                  gemini-4-argon
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Verifica fotos de fachada, manifiestos o capturas de WhatsApp con IA
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 p-1.5 rounded-lg hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1">
          {record && (
            <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800 text-xs flex items-center justify-between">
              <div>
                <span className="text-slate-400">Orden / Venta:</span>{' '}
                <strong className="text-blue-400">{record.venta}</strong>
              </div>
              <div>
                <span className="text-slate-400">Mensajero:</span>{' '}
                <span className="text-slate-200 font-medium">{record.mensajero}</span>
              </div>
              <div>
                <span className="text-slate-400">Subestado:</span>{' '}
                <span className="text-amber-300">{record.subestado}</span>
              </div>
            </div>
          )}

          {/* Upload or Drop Area */}
          <div className="flex flex-col items-center justify-center border-2 border-dashed border-slate-700 hover:border-slate-600 rounded-xl p-4 bg-slate-950/40 relative">
            {imagePreview ? (
              <div className="relative w-full max-h-64 flex items-center justify-center overflow-hidden rounded-lg">
                <img
                  src={imagePreview}
                  alt="Evidencia cargada"
                  className="max-h-60 object-contain rounded-lg"
                />
                <button
                  onClick={() => {
                    setImagePreview(null);
                    setAuditResult(null);
                  }}
                  className="absolute top-2 right-2 bg-slate-900/80 hover:bg-slate-900 text-white p-1.5 rounded-full border border-slate-700"
                  title="Cambiar foto"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center cursor-pointer py-6 w-full">
                <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center text-slate-300 mb-2">
                  <Upload className="w-5 h-5" />
                </div>
                <span className="text-xs font-semibold text-slate-200">
                  Subir o tomar foto de evidencia
                </span>
                <span className="text-[11px] text-slate-400 mt-1">
                  JPG, PNG o WEBP (Foto de fachada, nota de llamada, chat WhatsApp)
                </span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    if (e.target.files?.[0]) handleImageFile(e.target.files[0]);
                  }}
                  className="hidden"
                />
              </label>
            )}
          </div>

          {imagePreview && (
            <div className="flex justify-end">
              <button
                onClick={handleAnalyze}
                disabled={isLoading}
                className="inline-flex items-center gap-2 text-xs font-semibold px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white shadow-md cursor-pointer transition-colors"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Auditando con gemini-4-argon...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Analizar Evidencia con IA</span>
                  </>
                )}
              </button>
            </div>
          )}

          {error && (
            <div className="p-3 rounded-lg bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Analysis output */}
          {auditResult && (
            <div className="space-y-3 pt-3 border-t border-slate-800">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-indigo-400" />
                  <span>Resultado del Dictamen de Auditoría:</span>
                </span>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs text-slate-400">Semáforo Sugerido:</span>
                  <span
                    className={`text-xs font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1 ${
                      auditResult.semaforoSugerido === 1
                        ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/40'
                        : auditResult.semaforoSugerido === 2
                        ? 'bg-amber-950 text-amber-300 border border-amber-500/40'
                        : 'bg-rose-950 text-rose-300 border border-rose-500/40'
                    }`}
                  >
                    Semáforo {auditResult.semaforoSugerido}
                  </span>
                </div>
              </div>

              <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-2 text-xs text-slate-300">
                <p>
                  <strong className="text-slate-200">Tipo de Evidencia:</strong>{' '}
                  {auditResult.tipoEvidencia}
                </p>
                <p>
                  <strong className="text-slate-200">Fachada / Número Visible:</strong>{' '}
                  {auditResult.tieneFachadaVisible ? 'Sí' : 'No'}{' '}
                  {auditResult.numeroVisible ? `(${auditResult.numeroVisible})` : ''}
                </p>
                <p>
                  <strong className="text-slate-200">Comentario Monitoreo:</strong>{' '}
                  <span className="text-slate-100 italic">
                    "{auditResult.comentarioMonitoreo}"
                  </span>
                </p>
                <p>
                  <strong className="text-slate-200">Retroalimentación:</strong>{' '}
                  <span className="text-slate-100 italic">
                    "{auditResult.retroalimentacion}"
                  </span>
                </p>
              </div>

              {record && (
                <button
                  onClick={handleApply}
                  className="w-full inline-flex items-center justify-center gap-2 text-xs font-bold px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-md cursor-pointer transition-all"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Aplicar este dictamen a la orden {record.venta}</span>
                </button>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-950 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="text-xs px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
