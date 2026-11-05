import React from 'react';
import { Search, Filter, X, RotateCcw } from 'lucide-react';
import { SemaforoValue } from '../types';

interface TableFiltersProps {
  searchTerm: string;
  onSearchChange: (val: string) => void;
  selectedSupervisor: string;
  onSupervisorChange: (val: string) => void;
  selectedMensajero: string;
  onMensajeroChange: (val: string) => void;
  selectedSemaforo: SemaforoValue | 'ALL';
  onSemaforoChange: (val: SemaforoValue | 'ALL') => void;
  selectedSubestado: string;
  onSubestadoChange: (val: string) => void;
  availableSupervisores: string[];
  availableMensajeros: string[];
  availableSubestados: string[];
  onResetFilters: () => void;
  totalFiltered: number;
}

export const TableFilters: React.FC<TableFiltersProps> = ({
  searchTerm,
  onSearchChange,
  selectedSupervisor,
  onSupervisorChange,
  selectedMensajero,
  onMensajeroChange,
  selectedSemaforo,
  onSemaforoChange,
  selectedSubestado,
  onSubestadoChange,
  availableSupervisores,
  availableMensajeros,
  availableSubestados,
  onResetFilters,
  totalFiltered,
}) => {
  const hasActiveFilters =
    searchTerm !== '' ||
    selectedSupervisor !== 'ALL' ||
    selectedMensajero !== 'ALL' ||
    selectedSemaforo !== 'ALL' ||
    selectedSubestado !== 'ALL';

  return (
    <div className="bg-slate-900 rounded-xl border border-slate-800 p-3.5 space-y-3 shadow-md">
      <div className="flex flex-col lg:flex-row gap-3 items-stretch lg:items-center justify-between">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Buscar por orden VENTA, mensajero, cliente o dirección..."
            className="w-full pl-9 pr-8 py-2 text-xs rounded-lg bg-slate-950 border border-slate-700/80 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/40"
          />
          {searchTerm && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Filter Dropdowns */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Mensajero */}
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-medium text-slate-400 hidden sm:inline">
              Mensajero:
            </span>
            <select
              value={selectedMensajero}
              onChange={(e) => onMensajeroChange(e.target.value)}
              className="text-xs bg-slate-950 border border-slate-700/80 text-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-blue-500"
            >
              <option value="ALL">Todos los mensajeros</option>
              {availableMensajeros.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>

          {/* Supervisor */}
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-medium text-slate-400 hidden sm:inline">
              Supervisor:
            </span>
            <select
              value={selectedSupervisor}
              onChange={(e) => onSupervisorChange(e.target.value)}
              className="text-xs bg-slate-950 border border-slate-700/80 text-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-blue-500"
            >
              <option value="ALL">Todos los supervisores</option>
              {availableSupervisores.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          {/* Semáforo */}
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-medium text-slate-400 hidden sm:inline">
              Semáforo:
            </span>
            <div className="inline-flex rounded-lg border border-slate-700/80 p-0.5 bg-slate-950">
              <button
                onClick={() => onSemaforoChange('ALL')}
                className={`text-[11px] px-2 py-1 rounded font-medium transition-colors cursor-pointer ${
                  selectedSemaforo === 'ALL'
                    ? 'bg-slate-700 text-white'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Todos
              </button>
              <button
                onClick={() => onSemaforoChange(1)}
                className={`text-[11px] px-2 py-1 rounded font-medium flex items-center gap-1 transition-colors cursor-pointer ${
                  selectedSemaforo === 1
                    ? 'bg-emerald-600/30 text-emerald-300 font-bold'
                    : 'text-slate-400 hover:text-emerald-400'
                }`}
                title="Semáforo 1 - Verde"
              >
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <span>1</span>
              </button>
              <button
                onClick={() => onSemaforoChange(2)}
                className={`text-[11px] px-2 py-1 rounded font-medium flex items-center gap-1 transition-colors cursor-pointer ${
                  selectedSemaforo === 2
                    ? 'bg-amber-600/30 text-amber-300 font-bold'
                    : 'text-slate-400 hover:text-amber-400'
                }`}
                title="Semáforo 2 - Amarillo"
              >
                <span className="w-2 h-2 rounded-full bg-amber-500" />
                <span>2</span>
              </button>
              <button
                onClick={() => onSemaforoChange(3)}
                className={`text-[11px] px-2 py-1 rounded font-medium flex items-center gap-1 transition-colors cursor-pointer ${
                  selectedSemaforo === 3
                    ? 'bg-rose-600/30 text-rose-300 font-bold'
                    : 'text-slate-400 hover:text-rose-400'
                }`}
                title="Semáforo 3 - Rojo"
              >
                <span className="w-2 h-2 rounded-full bg-rose-500" />
                <span>3</span>
              </button>
            </div>
          </div>

          {/* Subestado */}
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-medium text-slate-400 hidden sm:inline">
              Subestado:
            </span>
            <select
              value={selectedSubestado}
              onChange={(e) => onSubestadoChange(e.target.value)}
              className="text-xs bg-slate-950 border border-slate-700/80 text-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-blue-500"
            >
              <option value="ALL">Todos los subestados</option>
              {availableSubestados.map((sub) => (
                <option key={sub} value={sub}>
                  {sub}
                </option>
              ))}
            </select>
          </div>

          {/* Reset Filters */}
          {hasActiveFilters && (
            <button
              onClick={onResetFilters}
              className="inline-flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors cursor-pointer"
              title="Restablecer todos los filtros"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Limpiar filtros</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
