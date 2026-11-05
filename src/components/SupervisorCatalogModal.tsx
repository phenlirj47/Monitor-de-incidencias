import React, { useState, useEffect } from 'react';
import {
  X,
  Plus,
  Trash2,
  RotateCcw,
  Check,
  UserCheck,
  Search,
  RefreshCw,
  Settings,
} from 'lucide-react';
import { SupervisorMapping } from '../types';
import { DEFAULT_SUPERVISOR_CATALOG } from '../utils/constants';

interface SupervisorCatalogModalProps {
  isOpen: boolean;
  onClose: () => void;
  catalog: SupervisorMapping[];
  onSaveCatalog: (newCatalog: SupervisorMapping[], applyToCurrentRows: boolean) => void;
  currentRowsCount?: number;
}

export const SupervisorCatalogModal: React.FC<SupervisorCatalogModalProps> = ({
  isOpen,
  onClose,
  catalog,
  onSaveCatalog,
  currentRowsCount = 0,
}) => {
  const [localCatalog, setLocalCatalog] = useState<SupervisorMapping[]>([]);
  const [searchFilter, setSearchFilter] = useState('');
  const [newMensajero, setNewMensajero] = useState('');
  const [newSupervisor, setNewSupervisor] = useState('');
  const [applyToCurrent, setApplyToCurrent] = useState(true);
  const [savedAlert, setSavedAlert] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setLocalCatalog([...catalog]);
      setSearchFilter('');
      setNewMensajero('');
      setNewSupervisor('');
    }
  }, [isOpen, catalog]);

  if (!isOpen) return null;

  const saveDirectlyToStorage = (updated: SupervisorMapping[]) => {
    try {
      localStorage.setItem('cv_directo_supervisores', JSON.stringify(updated));
    } catch (e) {
      console.warn('Error al guardar en localStorage:', e);
    }
  };

  const handleUpdate = (index: number, field: 'mensajero' | 'supervisor', value: string) => {
    const updated = [...localCatalog];
    updated[index] = { ...updated[index], [field]: value };
    setLocalCatalog(updated);
    saveDirectlyToStorage(updated);
  };

  const handleDelete = (index: number) => {
    const updated = localCatalog.filter((_, i) => i !== index);
    setLocalCatalog(updated);
    saveDirectlyToStorage(updated);
  };

  const handleAdd = () => {
    if (!newMensajero.trim()) return;
    const updated = [
      {
        mensajero: newMensajero.trim(),
        supervisor: newSupervisor.trim() || 'Por asignar',
      },
      ...localCatalog,
    ];
    setLocalCatalog(updated);
    saveDirectlyToStorage(updated);
    setNewMensajero('');
    setNewSupervisor('');
  };

  const handleResetDefaults = () => {
    if (
      window.confirm(
        '¿Deseas restablecer el catálogo de mensajeros a los 7 valores predeterminados (Alfonso Correa / Por asignar)?'
      )
    ) {
      setLocalCatalog([...DEFAULT_SUPERVISOR_CATALOG]);
      saveDirectlyToStorage([...DEFAULT_SUPERVISOR_CATALOG]);
    }
  };

  const handleSave = () => {
    saveDirectlyToStorage(localCatalog);
    onSaveCatalog(localCatalog, applyToCurrent);
    setSavedAlert(true);
    setTimeout(() => {
      setSavedAlert(false);
      onClose();
    }, 600);
  };

  const filteredCatalog = localCatalog.filter((item) => {
    if (!searchFilter.trim()) return true;
    const q = searchFilter.toLowerCase();
    return (
      item.mensajero.toLowerCase().includes(q) ||
      item.supervisor.toLowerCase().includes(q)
    );
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/80">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-sky-500/20 text-sky-400 flex items-center justify-center border border-sky-500/30">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-100">
                  Configuración: Catálogo de Supervisores
                </h2>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-sky-950 text-sky-300 border border-sky-600/30">
                  {localCatalog.length} pares registrados
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Asigna automáticamente el supervisor al cargar el archivo de Dispatch
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 p-1.5 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content list */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1">
          {/* Instructions banner */}
          <div className="bg-slate-950/70 p-3.5 rounded-xl border border-slate-800 text-xs text-slate-300 leading-relaxed">
            <p>
              El catálogo se guarda automáticamente en <code className="text-sky-300 bg-sky-950/50 px-1.5 py-0.5 rounded">localStorage</code> para tus próximas sesiones. Si un mensajero no aparece en esta lista, se asignará como{' '}
              <strong className="text-amber-300 font-semibold">"Por asignar"</strong> para que puedas editarlo manualmente.
            </p>
          </div>

          {/* Add New Row Box */}
          <div className="bg-slate-800/40 border border-slate-700/80 rounded-xl p-3.5 space-y-2">
            <span className="text-xs font-semibold text-slate-200 block">
              Agregar nuevo mensajero al catálogo:
            </span>
            <div className="flex flex-col sm:flex-row items-center gap-2">
              <input
                type="text"
                placeholder="Nombre Mensajero (ej. Correa Brian)"
                value={newMensajero}
                onChange={(e) => setNewMensajero(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
                className="flex-1 w-full bg-slate-950 border border-slate-700 text-xs text-slate-200 px-3 py-2 rounded-lg focus:outline-none focus:border-sky-500"
              />
              <input
                type="text"
                placeholder="Supervisor (ej. Alfonso Correa)"
                value={newSupervisor}
                onChange={(e) => setNewSupervisor(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
                className="flex-1 w-full bg-slate-950 border border-slate-700 text-xs text-slate-200 px-3 py-2 rounded-lg focus:outline-none focus:border-sky-500"
              />
              <button
                type="button"
                onClick={handleAdd}
                disabled={!newMensajero.trim()}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 text-xs font-semibold px-4 py-2 rounded-lg bg-sky-600 hover:bg-sky-500 disabled:opacity-50 text-white cursor-pointer transition-colors shadow-sm"
              >
                <Plus className="w-4 h-4" />
                <span>Agregar</span>
              </button>
            </div>
          </div>

          {/* Search bar inside catalog */}
          {localCatalog.length > 5 && (
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Buscar mensajero o supervisor en la lista..."
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-950 border border-slate-800 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:border-sky-500"
              />
            </div>
          )}

          {/* Table of mappings */}
          <div className="border border-slate-800 rounded-xl overflow-hidden shadow-inner">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950 text-slate-400 border-b border-slate-800 uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-2.5 px-3">Mensajero (Dispatch)</th>
                  <th className="py-2.5 px-3">Supervisor Asignado</th>
                  <th className="py-2.5 px-3 w-14 text-center">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 bg-slate-900/60">
                {filteredCatalog.map((row, index) => {
                  const actualIndex = localCatalog.findIndex(
                    (item) => item.mensajero === row.mensajero
                  );
                  const idxToUse = actualIndex !== -1 ? actualIndex : index;

                  return (
                    <tr key={idxToUse} className="hover:bg-slate-800/30">
                      <td className="p-2">
                        <input
                          type="text"
                          value={row.mensajero}
                          onChange={(e) =>
                            handleUpdate(idxToUse, 'mensajero', e.target.value)
                          }
                          className="w-full bg-slate-950/80 border border-slate-700/60 text-xs text-slate-200 px-2.5 py-1.5 rounded-lg focus:outline-none focus:border-sky-500"
                        />
                      </td>
                      <td className="p-2">
                        <input
                          type="text"
                          value={row.supervisor}
                          onChange={(e) =>
                            handleUpdate(idxToUse, 'supervisor', e.target.value)
                          }
                          className="w-full bg-slate-950/80 border border-slate-700/60 text-xs text-slate-200 px-2.5 py-1.5 rounded-lg focus:outline-none focus:border-sky-500"
                        />
                      </td>
                      <td className="p-2 text-center">
                        <button
                          type="button"
                          onClick={() => handleDelete(idxToUse)}
                          className="text-slate-400 hover:text-rose-400 p-1.5 rounded hover:bg-rose-500/10 transition-colors"
                          title="Eliminar del catálogo"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Option to apply to currently loaded rows */}
          {currentRowsCount > 0 && (
            <div className="flex items-center gap-2 p-2.5 bg-slate-950/60 rounded-lg border border-slate-800 text-xs text-slate-300">
              <input
                type="checkbox"
                id="applyToCurrent"
                checked={applyToCurrent}
                onChange={(e) => setApplyToCurrent(e.target.checked)}
                className="w-4 h-4 rounded text-sky-600 bg-slate-900 border-slate-700 focus:ring-0 cursor-pointer"
              />
              <label htmlFor="applyToCurrent" className="cursor-pointer">
                Actualizar automáticamente los supervisores en las {currentRowsCount} filas cargadas actualmente en la tabla.
              </label>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-slate-950 border-t border-slate-800 flex items-center justify-between">
          <button
            type="button"
            onClick={handleResetDefaults}
            className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 cursor-pointer transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Restablecer predeterminados</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="text-xs px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="inline-flex items-center gap-1.5 text-xs font-semibold px-4 py-2 rounded-lg bg-sky-600 hover:bg-sky-500 text-white transition-colors cursor-pointer shadow-md"
            >
              {savedAlert ? (
                <>
                  <Check className="w-4 h-4 text-emerald-300" />
                  <span>¡Guardado!</span>
                </>
              ) : (
                <span>Guardar Catálogo</span>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
