import React, { useState } from 'react';
import {
  X,
  Image as ImageIcon,
  Sparkles,
  Download,
  Ratio,
  Loader2,
  AlertCircle,
  Copy,
  Check,
} from 'lucide-react';

interface VisualCardModalProps {
  isOpen: boolean;
  onClose: () => void;
  incidentsStats: {
    total: number;
    sem1: number;
    sem2: number;
    sem3: number;
  };
}

export const VisualCardModal: React.FC<VisualCardModalProps> = ({
  isOpen,
  onClose,
  incidentsStats,
}) => {
  const [selectedRatio, setSelectedRatio] = useState<string>('16:9');
  const [prompt, setPrompt] = useState<string>(
    `Executive logistics incident dashboard card for CV Directo with ${incidentsStats.total} total packages, ${incidentsStats.sem1} verified deliveries in green, ${incidentsStats.sem2} contacts in yellow, and ${incidentsStats.sem3} critical issues in red.`
  );
  const [isLoading, setIsLoading] = useState(false);
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const aspectRatios = [
    { label: '1:1 (Cuadrado)', value: '1:1' },
    { label: '2:3 (Vertical)', value: '2:3' },
    { label: '3:2 (Horizontal)', value: '3:2' },
    { label: '3:4 (Retrato)', value: '3:4' },
    { label: '4:3 (Estándar)', value: '4:3' },
    { label: '9:16 (Story/Móvil)', value: '9:16' },
    { label: '16:9 (Presentación)', value: '16:9' },
    { label: '21:9 (Ultrawide)', value: '21:9' },
  ];

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/gemini/generate-card', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: prompt.trim(),
          aspectRatio: selectedRatio,
          imageSize: '1K',
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Error al generar la imagen con Gemini');
      }

      setGeneratedImageUrl(data.imageUrl);
    } catch (err: any) {
      console.error(err);
      setError(err?.message || 'Error al generar la imagen.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownloadImage = () => {
    if (!generatedImageUrl) return;
    const a = document.createElement('a');
    a.href = generatedImageUrl;
    a.download = `Resumen_Incidencias_CVDirecto_${selectedRatio.replace(':', 'x')}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-purple-500/20 text-purple-400 flex items-center justify-center border border-purple-500/30">
              <ImageIcon className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-slate-100">
                  Generador de Gráfico / Resumen de Incidencias
                </h2>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-purple-950 border border-purple-600/40 text-purple-300">
                  gemini-nano-banana-2.1
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Crea banners de estatus logístico con control de relación de aspecto
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
          {/* Aspect Ratio selector */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
              <Ratio className="w-3.5 h-3.5 text-purple-400" />
              <span>Relación de Aspecto (Aspect Ratio):</span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {aspectRatios.map((item) => (
                <button
                  key={item.value}
                  type="button"
                  onClick={() => setSelectedRatio(item.value)}
                  className={`text-xs py-2 px-2.5 rounded-lg border text-left font-medium transition-all cursor-pointer ${
                    selectedRatio === item.value
                      ? 'bg-purple-600/20 border-purple-500 text-purple-300 shadow-sm'
                      : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                  }`}
                >
                  <span className="block font-bold text-white text-[11px]">
                    {item.value}
                  </span>
                  <span className="text-[10px] text-slate-400">{item.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Prompt */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300">
              Descripción del gráfico / tarjeta ejecutiva:
            </label>
            <textarea
              rows={2}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-xs text-slate-200 focus:outline-none focus:border-purple-500"
            />
          </div>

          <div className="flex justify-end">
            <button
              onClick={handleGenerate}
              disabled={isLoading || !prompt.trim()}
              className="inline-flex items-center gap-2 text-xs font-semibold px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white shadow-md cursor-pointer transition-colors"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Generando con gemini-nano-banana-2.1...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Generar Imagen ({selectedRatio})</span>
                </>
              )}
            </button>
          </div>

          {error && (
            <div className="p-3 rounded-lg bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Generated Image Preview */}
          {generatedImageUrl && (
            <div className="space-y-3 pt-3 border-t border-slate-800">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-200">
                  Gráfico Generado ({selectedRatio}):
                </span>
                <button
                  onClick={handleDownloadImage}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white shadow-sm cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Descargar PNG</span>
                </button>
              </div>

              <div className="bg-slate-950 p-2 rounded-xl border border-slate-800 flex items-center justify-center overflow-hidden">
                <img
                  src={generatedImageUrl}
                  alt="Gráfico generado de monitoreo"
                  className="max-h-80 w-auto object-contain rounded-lg shadow-lg"
                />
              </div>
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
