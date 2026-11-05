import React, { useState } from 'react';
import {
  X,
  Copy,
  Check,
  Plus,
  Send,
  MessageSquareText,
  Bookmark,
  Sparkles,
} from 'lucide-react';
import { CommentTemplate, IncidentRecord, SemaforoValue } from '../types';

interface TemplatesDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  templates: CommentTemplate[];
  onAddCustomTemplate: (newTemplate: CommentTemplate) => void;
  activeRecord: IncidentRecord | null;
  onApplyTemplateToRecord: (
    recordId: string,
    field: 'comentarioMonitoreo' | 'comentarioMensajero' | 'retroalimentacionMensajeria' | 'observacionIncidencia',
    text: string,
    semaforoSugerido?: SemaforoValue
  ) => void;
}

export const TemplatesDrawer: React.FC<TemplatesDrawerProps> = ({
  isOpen,
  onClose,
  templates,
  onAddCustomTemplate,
  activeRecord,
  onApplyTemplateToRecord,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [targetField, setTargetField] = useState<
    'comentarioMonitoreo' | 'comentarioMensajero' | 'retroalimentacionMensajeria' | 'observacionIncidencia'
  >('comentarioMonitoreo');

  const [newTitle, setNewTitle] = useState('');
  const [newText, setNewText] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);

  if (!isOpen) return null;

  const categories = [
    { id: 'ALL', label: 'Todas' },
    { id: 'fachada', label: 'Fachada / Fotos' },
    { id: 'manifiesto', label: 'Manifiesto / Llamar' },
    { id: 'sin_gestion', label: 'Sin gestión de ruta' },
    { id: 'cliente', label: 'Cliente / Rechazo / Dinero' },
    { id: 'general', label: 'Generales / WhatsApp' },
  ];

  const filteredTemplates = templates.filter((t) =>
    selectedCategory === 'ALL' ? true : t.categoria === selectedCategory
  );

  const handleCopy = (t: CommentTemplate) => {
    navigator.clipboard.writeText(t.texto);
    setCopiedId(t.id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  const handleInsert = (t: CommentTemplate) => {
    if (activeRecord) {
      onApplyTemplateToRecord(
        activeRecord.id,
        targetField,
        t.texto,
        t.semaforoSugerido
      );
    } else {
      handleCopy(t);
    }
  };

  const handleCreateCustom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newText.trim()) return;

    onAddCustomTemplate({
      id: `custom-${Date.now()}`,
      titulo: newTitle.trim() || 'Plantilla rápida',
      texto: newText.trim(),
      categoria: 'general',
      semaforoSugerido: 2,
    });

    setNewTitle('');
    setNewText('');
    setShowAddForm(false);
  };

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-full max-w-md bg-slate-900 border-l border-slate-800 shadow-2xl flex flex-col animate-in slide-in-from-right duration-200">
      {/* Header */}
      <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/80">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center border border-indigo-500/30">
            <MessageSquareText className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-100">
              Plantillas de Comentarios Rápidos
            </h2>
            <p className="text-[11px] text-slate-400">
              Inserción a 1 clic para acelerar la auditoría
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

      {/* Target Record Context Banner */}
      <div className="px-5 py-3 bg-slate-950/60 border-b border-slate-800 text-xs">
        {activeRecord ? (
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-slate-400 font-medium">Insertando en:</span>
              <span className="font-bold text-blue-400">
                {activeRecord.venta} ({activeRecord.mensajero})
              </span>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[11px] text-slate-400">Campo destino:</span>
              <select
                value={targetField}
                onChange={(e) => setTargetField(e.target.value as any)}
                className="flex-1 text-[11px] bg-slate-900 border border-slate-700 text-slate-200 rounded px-2 py-1 focus:outline-none focus:border-indigo-500"
              >
                <option value="comentarioMonitoreo">COMENTARIO MONITOREO</option>
                <option value="comentarioMensajero">COMENTARIO MENSAJERO</option>
                <option value="retroalimentacionMensajeria">RETROALIMENTACION</option>
                <option value="observacionIncidencia">OBSERVACION WHATSAPP</option>
              </select>
            </div>
          </div>
        ) : (
          <p className="text-amber-400/90 flex items-center gap-1.5">
            <Bookmark className="w-3.5 h-3.5" />
            <span>Haz clic en cualquier fila para insertarle una plantilla directamente.</span>
          </p>
        )}
      </div>

      {/* Categories chips */}
      <div className="px-5 py-2.5 border-b border-slate-800 flex items-center gap-1.5 overflow-x-auto text-xs no-scrollbar">
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setSelectedCategory(cat.id)}
            className={`px-2.5 py-1 rounded-full whitespace-nowrap text-[11px] font-medium transition-colors cursor-pointer ${
              selectedCategory === cat.id
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'bg-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Templates List */}
      <div className="p-5 flex-1 overflow-y-auto space-y-3">
        {filteredTemplates.map((template) => (
          <div
            key={template.id}
            className="group relative p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 hover:border-indigo-500/50 hover:bg-slate-800/40 transition-all duration-150"
          >
            <div className="flex items-start justify-between gap-2 mb-1.5">
              <span className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                {template.semaforoSugerido === 1 && (
                  <span className="w-2 h-2 rounded-full bg-emerald-500" title="Semáforo 1 (Verde)" />
                )}
                {template.semaforoSugerido === 2 && (
                  <span className="w-2 h-2 rounded-full bg-amber-500" title="Semáforo 2 (Amarillo)" />
                )}
                {template.semaforoSugerido === 3 && (
                  <span className="w-2 h-2 rounded-full bg-rose-500" title="Semáforo 3 (Rojo)" />
                )}
                {template.titulo}
              </span>

              {template.semaforoSugerido && (
                <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
                  Sugerido: Sem. {template.semaforoSugerido}
                </span>
              )}
            </div>

            <p className="text-xs text-slate-300 leading-relaxed mb-3 italic">
              "{template.texto}"
            </p>

            <div className="flex items-center justify-end gap-2">
              <button
                onClick={() => handleCopy(template)}
                className="inline-flex items-center gap-1 text-[11px] text-slate-400 hover:text-slate-200 px-2 py-1 rounded bg-slate-800/80 hover:bg-slate-700 transition-colors cursor-pointer"
                title="Copiar texto al portapapeles"
              >
                {copiedId === template.id ? (
                  <>
                    <Check className="w-3 h-3 text-emerald-400" />
                    <span className="text-emerald-400">¡Copiado!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3" />
                    <span>Copiar</span>
                  </>
                )}
              </button>

              <button
                onClick={() => handleInsert(template)}
                className="inline-flex items-center gap-1 text-[11px] font-semibold text-white px-3 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 shadow-sm transition-colors cursor-pointer"
                title={
                  activeRecord
                    ? `Insertar en ${activeRecord.venta}`
                    : 'Copiar texto'
                }
              >
                <Send className="w-3 h-3" />
                <span>{activeRecord ? 'Insertar en fila' : 'Usar'}</span>
              </button>
            </div>
          </div>
        ))}

        {/* Add custom template section */}
        {showAddForm ? (
          <form
            onSubmit={handleCreateCustom}
            className="p-3.5 rounded-xl bg-slate-950 border border-indigo-500/40 space-y-2.5"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-200">
                Nueva plantilla personalizada
              </span>
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="text-slate-400 hover:text-slate-200"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
            <input
              type="text"
              placeholder="Título corto (ej. Dirección confusa)"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 text-xs text-slate-200 px-2.5 py-1.5 rounded focus:outline-none focus:border-indigo-500"
            />
            <textarea
              rows={2}
              placeholder="Texto completo que se insertará..."
              value={newText}
              onChange={(e) => setNewText(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 text-xs text-slate-200 p-2 rounded focus:outline-none focus:border-indigo-500 resize-none"
            />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="text-xs text-slate-400 px-2.5 py-1 rounded bg-slate-800"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={!newText.trim()}
                className="text-xs font-semibold text-white px-3 py-1 rounded bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50"
              >
                Guardar
              </button>
            </div>
          </form>
        ) : (
          <button
            onClick={() => setShowAddForm(true)}
            className="w-full py-2.5 rounded-xl border border-dashed border-slate-700 hover:border-slate-600 bg-slate-950/30 text-xs font-medium text-slate-400 hover:text-slate-200 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Agregar plantilla propia</span>
          </button>
        )}
      </div>
    </div>
  );
};
