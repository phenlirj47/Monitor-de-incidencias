import React, { useState, useEffect } from 'react';
import {
  X,
  MapPin,
  ExternalLink,
  Search,
  Check,
  Compass,
  AlertTriangle,
  Send,
  Loader2,
} from 'lucide-react';
import { IncidentRecord } from '../types';

interface MapsGroundingModalProps {
  isOpen: boolean;
  onClose: () => void;
  record: IncidentRecord | null;
  onApplyReferenceToRecord?: (recordId: string, referenceText: string) => void;
}

export const MapsGroundingModal: React.FC<MapsGroundingModalProps> = ({
  isOpen,
  onClose,
  record,
  onApplyReferenceToRecord,
}) => {
  const [address, setAddress] = useState('');
  const [notes, setNotes] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [analysisText, setAnalysisText] = useState<string | null>(null);
  const [mapLinks, setMapLinks] = useState<Array<{ uri: string; title: string }>>([]);
  const [error, setError] = useState<string | null>(null);
  const [applied, setApplied] = useState(false);

  useEffect(() => {
    if (record) {
      setAddress(record.direccionOriginal || '');
      setNotes(`Orden ${record.venta} - Subestado: ${record.subestado}`);
      setAnalysisText(null);
      setMapLinks([]);
      setError(null);
      setApplied(false);
    }
  }, [record]);

  if (!isOpen) return null;

  const handleConsultMaps = async () => {
    if (!address.trim()) return;
    setIsLoading(true);
    setError(null);
    setAnalysisText(null);
    setMapLinks([]);

    try {
      const res = await fetch('/api/gemini/maps-grounding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          address: address.trim(),
          notes: notes.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Error al consultar Google Maps con Gemini');
      }

      setAnalysisText(data.text);
      setMapLinks(data.mapLinks || []);
    } catch (err: any) {
      console.error(err);
      setError(err?.message || 'Error al conectar con el servicio de Google Maps');
    } finally {
      setIsLoading(false);
    }
  };

  const handleApplyToComment = () => {
    if (!record || !analysisText) return;
    // Extract a concise recommendation
    const firstParagraph = analysisText.split('\n\n')[0] || analysisText;
    const cleanNote = `Ref. Maps: ${firstParagraph.replace(/\*\*/g, '').substring(0, 150)}...`;

    if (onApplyReferenceToRecord) {
      onApplyReferenceToRecord(record.id, cleanNote);
      setApplied(true);
      setTimeout(() => setApplied(false), 2000);
    }
  };

  const standardMapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    address || ''
  )}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
              <Compass className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-slate-100">
                  Verificación de Dirección con Google Maps Grounding
                </h2>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-emerald-950 border border-emerald-600/40 text-emerald-300">
                  gemini-3.8-flash
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Grounded en datos oficiales de Google Maps para resolver entregas dudosas
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
          {/* Address input */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
              <span>Dirección a verificar:</span>
              <a
                href={standardMapsUrl}
                target="_blank"
                rel="noreferrer"
                className="text-[11px] text-blue-400 hover:text-blue-300 inline-flex items-center gap-1"
              >
                <span>Abrir directo en Google Maps</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </label>
            <textarea
              rows={2}
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Ingresa la calle, número, colonia, alcaldía o código postal..."
              className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300">
              Observaciones o dudas reportadas:
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ej. Mensajero dice que el número no existe o calle cerrada..."
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="flex items-center justify-between pt-1">
            <button
              onClick={handleConsultMaps}
              disabled={isLoading || !address.trim()}
              className="inline-flex items-center gap-2 text-xs font-semibold px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white shadow-md cursor-pointer transition-colors"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Consultando Google Maps...</span>
                </>
              ) : (
                <>
                  <Search className="w-4 h-4" />
                  <span>Auditar Dirección con Maps Grounding</span>
                </>
              )}
            </button>
          </div>

          {/* Error notice */}
          {error && (
            <div className="p-3 rounded-lg bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Results section */}
          {analysisText && (
            <div className="space-y-3 pt-2 border-t border-slate-800">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-emerald-400" />
                  <span>Diagnóstico Geográfico & Puntos de Referencia:</span>
                </span>
                {record && onApplyReferenceToRecord && (
                  <button
                    onClick={handleApplyToComment}
                    className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-emerald-300 border border-emerald-500/30 cursor-pointer"
                  >
                    {applied ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span>¡Insertado en la orden!</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-3.5 h-3.5" />
                        <span>Copiar resumen al comentario</span>
                      </>
                    )}
                  </button>
                )}
              </div>

              <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 text-xs text-slate-300 whitespace-pre-line leading-relaxed max-h-60 overflow-y-auto">
                {analysisText}
              </div>

              {/* Grounded URLs */}
              {mapLinks.length > 0 && (
                <div className="space-y-1.5">
                  <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                    Enlaces oficiales de Google Maps detectados:
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {mapLinks.map((link, idx) => (
                      <a
                        key={idx}
                        href={link.uri}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-xs text-emerald-300 hover:text-emerald-200 bg-emerald-950/50 border border-emerald-500/30 px-2.5 py-1 rounded-md transition-colors"
                      >
                        <MapPin className="w-3 h-3 text-emerald-400" />
                        <span>{link.title || 'Ver ubicación en Maps'}</span>
                        <ExternalLink className="w-3 h-3 ml-0.5 text-slate-400" />
                      </a>
                    ))}
                  </div>
                </div>
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
