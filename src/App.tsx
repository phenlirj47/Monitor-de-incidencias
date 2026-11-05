/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import {
  IncidentRecord,
  SemaforoValue,
  SupervisorMapping,
  CommentTemplate,
} from './types';
import { DEFAULT_SUPERVISOR_CATALOG, DEFAULT_TEMPLATES } from './utils/constants';
import { SAMPLE_INCIDENTS } from './utils/sampleData';
import { parseDispatchExcel, findSupervisorForMessenger } from './utils/excelParser';
import { exportToExcel } from './utils/excelExporter';
import { Header } from './components/Header';
import { UploadSection } from './components/UploadSection';
import { TableFilters } from './components/TableFilters';
import { IncidentsTable } from './components/IncidentsTable';
import { SupervisorCatalogModal } from './components/SupervisorCatalogModal';
import { TemplatesDrawer } from './components/TemplatesDrawer';
import { CheckCircle2, AlertCircle, Info, BookOpen } from 'lucide-react';

const STORAGE_KEY_CATALOG = 'cv_directo_supervisores';
const STORAGE_KEY_TEMPLATES = 'cv_comment_templates';

function getInitialSupervisorCatalog(): SupervisorMapping[] {
  try {
    const saved =
      localStorage.getItem(STORAGE_KEY_CATALOG) ||
      localStorage.getItem('cv_supervisores_catalog') ||
      localStorage.getItem('cv_supervisor_catalog');

    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        // Ensure it's saved under the exact key
        localStorage.setItem(STORAGE_KEY_CATALOG, JSON.stringify(parsed));
        return parsed;
      }
    }
  } catch (e) {
    console.warn('Error al leer catálogo de localStorage:', e);
  }

  // Auto-seed default catalog into localStorage on startup
  try {
    localStorage.setItem(STORAGE_KEY_CATALOG, JSON.stringify(DEFAULT_SUPERVISOR_CATALOG));
  } catch (e) {
    console.warn('Error al guardar catálogo por defecto en localStorage:', e);
  }

  return DEFAULT_SUPERVISOR_CATALOG;
}

export default function App() {
  // Main data state
  const [allRecords, setAllRecords] = useState<IncidentRecord[]>([]);
  const [totalRawRows, setTotalRawRows] = useState<number>(0);
  const [fileName, setFileName] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Business logic toggle: Include delivered packages
  const [includeDelivered, setIncludeDelivered] = useState<boolean>(false);

  // Supervisor catalog state (persisted in localStorage under cv_directo_supervisores)
  const [catalog, setCatalog] = useState<SupervisorMapping[]>(() => getInitialSupervisorCatalog());

  // Comment Templates state
  const [templates, setTemplates] = useState<CommentTemplate[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_TEMPLATES);
      return saved ? JSON.parse(saved) : DEFAULT_TEMPLATES;
    } catch {
      return DEFAULT_TEMPLATES;
    }
  });

  // Active / Selected record for templates drawer
  const [activeRecordId, setActiveRecordId] = useState<string | null>(null);

  // Filters state
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedSupervisor, setSelectedSupervisor] = useState<string>('ALL');
  const [selectedMensajero, setSelectedMensajero] = useState<string>('ALL');
  const [selectedSemaforo, setSelectedSemaforo] = useState<SemaforoValue | 'ALL'>('ALL');
  const [selectedSubestado, setSelectedSubestado] = useState<string>('ALL');

  // Modals state
  const [isCatalogOpen, setIsCatalogOpen] = useState(false);
  const [isTemplatesOpen, setIsTemplatesOpen] = useState(false);

  // Notification banner
  const [notification, setNotification] = useState<{
    type: 'success' | 'error' | 'info';
    message: string;
  } | null>(null);

  const showNotification = (
    type: 'success' | 'error' | 'info',
    message: string
  ) => {
    setNotification({ type, message });
    setTimeout(() => {
      setNotification((curr) => (curr?.message === message ? null : curr));
    }, 4500);
  };

  // Save catalog changes with optional auto-apply to loaded rows
  const handleSaveCatalog = (newCatalog: SupervisorMapping[], applyToCurrentRows: boolean) => {
    setCatalog(newCatalog);
    try {
      localStorage.setItem(STORAGE_KEY_CATALOG, JSON.stringify(newCatalog));
    } catch (e) {
      console.warn('No se pudo guardar en localStorage:', e);
    }

    if (applyToCurrentRows && allRecords.length > 0) {
      setAllRecords((prev) =>
        prev.map((rec) => ({
          ...rec,
          supervisor: findSupervisorForMessenger(rec.mensajero, newCatalog),
        }))
      );
      showNotification(
        'success',
        `Catálogo guardado en localStorage y supervisores actualizados en las ${allRecords.length} filas.`
      );
    } else {
      showNotification('success', 'Catálogo de supervisores actualizado y guardado en localStorage.');
    }
  };

  // Add custom template
  const handleAddCustomTemplate = (newTemplate: CommentTemplate) => {
    const updated = [newTemplate, ...templates];
    setTemplates(updated);
    try {
      localStorage.setItem(STORAGE_KEY_TEMPLATES, JSON.stringify(updated));
    } catch (e) {
      console.warn('No se pudo guardar plantillas en localStorage:', e);
    }
    showNotification('success', `Plantilla "${newTemplate.titulo}" guardada.`);
  };

  // File upload handler
  const handleFileUpload = async (file: File) => {
    setIsLoading(true);
    setFileName(file.name);

    try {
      const result = await parseDispatchExcel(file, catalog);
      if (result.error) {
        showNotification('error', result.error);
        setIsLoading(false);
        return;
      }

      setAllRecords(result.records);
      setTotalRawRows(result.totalRawRows);
      if (result.records.length > 0) {
        setActiveRecordId(result.records[0].id);
      }

      const incidenciasDefaultCount = result.records.filter((r) => {
        const est = (r.estadoOriginal || '').toLowerCase();
        const sub = (r.subestado || '').toLowerCase();
        return (
          est.includes('no entregad') ||
          sub.includes('reprogram') ||
          sub.includes('cancel') ||
          sub.includes('labor') ||
          !r.esEntregada
        );
      }).length;

      showNotification(
        'success',
        `Se procesaron ${result.totalRawRows} filas de "${file.name}". ${incidenciasDefaultCount} incidencias filtradas para monitoreo.`
      );
    } catch (err: any) {
      showNotification('error', `Error al leer archivo: ${err?.message || 'Error desconocido'}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Sample data loader
  const handleLoadSampleData = () => {
    setAllRecords([...SAMPLE_INCIDENTS]);
    setTotalRawRows(12);
    setFileName('Reporte_Rutas_y_Entregas_Ejemplo_Dispatch.xlsx');
    setActiveRecordId(SAMPLE_INCIDENTS[0].id);
    showNotification(
      'success',
      'Datos de ejemplo cargados con mensajeros reales y supervisores asignados según catálogo.'
    );
  };

  // Clear all
  const handleClearAll = () => {
    if (window.confirm('¿Deseas limpiar todos los registros actuales?')) {
      setAllRecords([]);
      setTotalRawRows(0);
      setFileName(null);
      setActiveRecordId(null);
      showNotification('info', 'Tabla y datos reiniciados.');
    }
  };

  // Row update handler
  const handleUpdateRecord = (id: string, updates: Partial<IncidentRecord>) => {
    setAllRecords((prev) =>
      prev.map((rec) => (rec.id === id ? { ...rec, ...updates } : rec))
    );
  };

  // Row delete handler
  const handleDeleteRecord = (id: string) => {
    setAllRecords((prev) => prev.filter((rec) => rec.id !== id));
  };

  // Apply template to record
  const handleApplyTemplateToRecord = (
    recordId: string,
    field:
      | 'comentarioMonitoreo'
      | 'comentarioMensajero'
      | 'retroalimentacionMensajeria'
      | 'observacionIncidencia',
    text: string,
    semaforoSugerido?: SemaforoValue
  ) => {
    setAllRecords((prev) =>
      prev.map((rec) => {
        if (rec.id === recordId) {
          const currentVal = rec[field] || '';
          const newVal = currentVal ? `${currentVal}. ${text}` : text;
          const updates: Partial<IncidentRecord> = { [field]: newVal };

          if (field === 'comentarioMonitoreo' && semaforoSugerido) {
            updates.semaforo = semaforoSugerido;
          }
          return { ...rec, ...updates };
        }
        return rec;
      })
    );
    showNotification('success', 'Texto de plantilla insertado correctamente.');
  };

  // Business Logic Filtering:
  // 1. By default, show only rows where Estado contains "No entregad" OR Subestado is "Reprogramado", "Cancelado" or "Labor"
  // 2. If includeDelivered is true, include all rows
  // 3. Plus UI search & dropdown filters
  const visibleRecords = useMemo(() => {
    return allRecords.filter((rec) => {
      // 1. Base Business Rule Filter
      if (!includeDelivered) {
        const est = (rec.estadoOriginal || '').toLowerCase();
        const sub = (rec.subestado || '').toLowerCase();
        const isIncidence =
          est.includes('no entregad') ||
          sub.includes('reprogram') ||
          sub.includes('cancel') ||
          sub.includes('labor') ||
          !rec.esEntregada;

        if (!isIncidence) return false;
      }

      // 2. Search query filter
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase();
        const match =
          (rec.venta || '').toLowerCase().includes(query) ||
          (rec.mensajero || '').toLowerCase().includes(query) ||
          (rec.supervisor || '').toLowerCase().includes(query) ||
          (rec.clienteNombre || '').toLowerCase().includes(query) ||
          (rec.direccionOriginal || '').toLowerCase().includes(query) ||
          (rec.referenciasBeetrack || '').toLowerCase().includes(query) ||
          (rec.comentarioMonitoreo || '').toLowerCase().includes(query) ||
          (rec.comentarioMensajero || '').toLowerCase().includes(query) ||
          (rec.retroalimentacionMensajeria || '').toLowerCase().includes(query) ||
          (rec.observacionIncidencia || '').toLowerCase().includes(query);

        if (!match) return false;
      }

      // 3. Supervisor filter
      if (selectedSupervisor !== 'ALL' && rec.supervisor !== selectedSupervisor) {
        return false;
      }

      // 4. Mensajero filter
      if (selectedMensajero !== 'ALL' && rec.mensajero !== selectedMensajero) {
        return false;
      }

      // 5. Semáforo filter
      if (selectedSemaforo !== 'ALL' && rec.semaforo !== selectedSemaforo) {
        return false;
      }

      // 6. Subestado filter
      if (selectedSubestado !== 'ALL' && rec.subestado !== selectedSubestado) {
        return false;
      }

      return true;
    });
  }, [
    allRecords,
    includeDelivered,
    searchTerm,
    selectedSupervisor,
    selectedMensajero,
    selectedSemaforo,
    selectedSubestado,
  ]);

  // Available dropdown options
  const availableSupervisores = useMemo(() => {
    return Array.from(new Set(allRecords.map((r) => r.supervisor).filter(Boolean)));
  }, [allRecords]);

  const availableMensajeros = useMemo(() => {
    return Array.from(new Set(allRecords.map((r) => r.mensajero).filter(Boolean)));
  }, [allRecords]);

  const availableSubestados = useMemo(() => {
    return Array.from(new Set(allRecords.map((r) => r.subestado).filter(Boolean)));
  }, [allRecords]);

  // Export to Excel handler (ONLY VISIBLE/FILTERED ROWS)
  const handleExport = () => {
    if (visibleRecords.length === 0) {
      showNotification('error', 'No hay registros visibles o filtrados para exportar.');
      return;
    }

    try {
      const today = new Date().toISOString().split('T')[0];
      const filename = `Reporte_Monitoreo_Incidencias_${today}.xlsx`;
      // Exactly the visible/filtered rows
      exportToExcel(visibleRecords, filename);
      showNotification(
        'success',
        `Reporte descargado exitosamente: ${visibleRecords.length} filas en 10 columnas oficiales.`
      );
    } catch (e: any) {
      console.error(e);
      showNotification('error', `Error al exportar Excel: ${e?.message || 'Error'}`);
    }
  };

  // Get current active record
  const currentActiveRecord = useMemo(() => {
    return (
      allRecords.find((r) => r.id === activeRecordId) ||
      visibleRecords[0] ||
      null
    );
  }, [allRecords, activeRecordId, visibleRecords]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-blue-600 selection:text-white">
      {/* App Header (Cleaned up: Plantillas, Supervisores, Descargar .xlsx) */}
      <Header
        records={allRecords}
        filteredCount={visibleRecords.length}
        onExport={handleExport}
        onOpenCatalog={() => setIsCatalogOpen(true)}
        onOpenTemplates={() => setIsTemplatesOpen(true)}
        onOpenMapsHelper={() => {}}
        onOpenCardGen={() => {}}
      />

      {/* Main Content Workspace */}
      <main className="flex-1 w-full max-w-[98%] 2xl:max-w-[1920px] mx-auto px-3 sm:px-6 lg:px-8 py-5 space-y-4">
        {/* Floating Notification */}
        {notification && (
          <div
            className={`p-3 rounded-xl border flex items-center justify-between text-xs shadow-lg animate-in fade-in slide-in-from-top-2 duration-200 ${
              notification.type === 'success'
                ? 'bg-emerald-950/90 border-emerald-500/40 text-emerald-200'
                : notification.type === 'error'
                ? 'bg-rose-950/90 border-rose-500/40 text-rose-200'
                : 'bg-blue-950/90 border-blue-500/40 text-blue-200'
            }`}
          >
            <div className="flex items-center gap-2">
              {notification.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
              {notification.type === 'error' && <AlertCircle className="w-4 h-4 text-rose-400" />}
              {notification.type === 'info' && <Info className="w-4 h-4 text-blue-400" />}
              <span className="font-medium">{notification.message}</span>
            </div>
            <button
              onClick={() => setNotification(null)}
              className="text-xs opacity-70 hover:opacity-100 px-1 font-bold cursor-pointer"
            >
              ✕
            </button>
          </div>
        )}

        {/* Upload & Setup Zone */}
        <UploadSection
          onFileUpload={handleFileUpload}
          onLoadSampleData={handleLoadSampleData}
          onClearAll={handleClearAll}
          includeDelivered={includeDelivered}
          onToggleIncludeDelivered={(val) => {
            setIncludeDelivered(val);
            showNotification(
              'info',
              val
                ? 'Mostrando todas las filas (incluidas entregadas).'
                : 'Filtrado activado: solo incidencias y no entregadas.'
            );
          }}
          totalRawRows={totalRawRows}
          incidentRowsCount={visibleRecords.length}
          fileName={fileName}
          isLoading={isLoading}
        />

        {/* Filters and search bar */}
        {allRecords.length > 0 && (
          <TableFilters
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            selectedSupervisor={selectedSupervisor}
            onSupervisorChange={setSelectedSupervisor}
            selectedMensajero={selectedMensajero}
            onMensajeroChange={setSelectedMensajero}
            selectedSemaforo={selectedSemaforo}
            onSemaforoChange={setSelectedSemaforo}
            selectedSubestado={selectedSubestado}
            onSubestadoChange={setSelectedSubestado}
            availableSupervisores={availableSupervisores}
            availableMensajeros={availableMensajeros}
            availableSubestados={availableSubestados}
            onResetFilters={() => {
              setSearchTerm('');
              setSelectedSupervisor('ALL');
              setSelectedMensajero('ALL');
              setSelectedSemaforo('ALL');
              setSelectedSubestado('ALL');
            }}
            totalFiltered={visibleRecords.length}
          />
        )}

        {/* Main Incidents Table */}
        <section className="space-y-2">
          <div className="flex items-center justify-between text-xs px-1 text-slate-400">
            <span className="font-semibold text-slate-300">
              Tabla de Monitoreo ({visibleRecords.length} filas visibles listas para exportar)
            </span>
            <span className="hidden sm:inline text-slate-500">
              Haz clic en cualquier campo de comentario para escribir o usar los chips rápidos
            </span>
          </div>

          <IncidentsTable
            records={visibleRecords}
            catalog={catalog}
            activeRecordId={activeRecordId}
            onSelectRecord={(rec) => setActiveRecordId(rec.id)}
            onUpdateRecord={handleUpdateRecord}
            onDeleteRecord={handleDeleteRecord}
          />
        </section>

        {/* Instructions footer note for Jaqui */}
        <footer className="bg-slate-900/60 rounded-xl border border-slate-800/80 p-4 text-xs text-slate-400 space-y-1.5">
          <div className="flex items-center gap-2 font-semibold text-slate-300">
            <BookOpen className="w-4 h-4 text-blue-400" />
            <span>Guía de uso para Jaqui:</span>
          </div>
          <ol className="list-decimal list-inside space-y-1 text-slate-400 pl-1">
            <li>
              Sube el archivo Excel de <strong>Dispatch</strong> ("Reporte Rutas y Entregas") o pulsa <strong>"Cargar datos de ejemplo"</strong> para probarlo.
            </li>
            <li>
              La app filtra automáticamente las no entregadas (`No entregado`, `Reprogramado`, `Cancelado`, `Labor`). Si necesitas revisar también las entregadas, activa el switch superior.
            </li>
            <li>
              Los <strong>Supervisores</strong> se asignan según el catálogo persistente en tu navegador. Puedes configurarlo en el botón <strong>"Supervisores"</strong> del encabezado.
            </li>
            <li>
              Los <strong>cuatro campos de comentarios</strong> son editables directamente. Los chips rápidos (`+Fachada`, `+Llamar antes`, etc.) se insertan en el comentario que tengas enfocado.
            </li>
            <li>
              Usa <strong>"Búsqueda Inteligente Maps"</strong> en cualquier fila para ubicar domicilios difíciles. Combina automáticamente la dirección con las observaciones y referencias (ej. esquinas, entre calles, anuncios como Tecate). Si hay coordenadas, puedes abrir <strong>"GPS Exacto"</strong>.
            </li>
            <li>
              Al pulsar <strong>"Descargar .xlsx"</strong> se exportan únicamente las filas visibles/filtradas con las 10 columnas en el orden oficial.
            </li>
          </ol>
        </footer>
      </main>

      {/* Modals & Drawers */}
      <SupervisorCatalogModal
        isOpen={isCatalogOpen}
        onClose={() => setIsCatalogOpen(false)}
        catalog={catalog}
        onSaveCatalog={handleSaveCatalog}
        currentRowsCount={allRecords.length}
      />

      <TemplatesDrawer
        isOpen={isTemplatesOpen}
        onClose={() => setIsTemplatesOpen(false)}
        templates={templates}
        onAddCustomTemplate={handleAddCustomTemplate}
        activeRecord={currentActiveRecord}
        onApplyTemplateToRecord={handleApplyTemplateToRecord}
      />
    </div>
  );
}
