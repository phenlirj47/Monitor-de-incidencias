export type SemaforoValue = 1 | 2 | 3;

export interface DispatchRow {
  identificadorRuta?: string;
  identificador?: string;
  ordenCvDirecto: string; // VENTA
  fechaEstimada?: string;
  fechaLlegada?: string;
  fecha: string; // Used in report
  estado: string;
  subestado: string;
  usuarioMovil: string; // MENSAJERO
  telefonoUsuario?: string;
  idCliente?: string;
  nombreCliente?: string;
  direccionCliente: string;
  comentarioOriginal?: string;
}

export interface IncidentRecord {
  id: string; // internal UUID or row id
  supervisor: string;
  mensajero: string;
  semaforo: SemaforoValue;
  venta: string;
  subestado: string;
  fecha: string;
  comentarioMonitoreo: string;
  comentarioMensajero: string;
  retroalimentacionMensajeria: string;
  observacionIncidencia: string;
  // Metadata from Beetrack for UI assistance and enhanced Maps search
  direccionOriginal: string;
  clienteNombre: string;
  clienteTelefono?: string;
  estadoOriginal: string;
  esEntregada: boolean;
  referenciasBeetrack?: string;
  latitud?: number | null;
  longitud?: number | null;
  fotoFachadaUrl?: string;
}

export interface SupervisorMapping {
  mensajero: string;
  supervisor: string;
}

export interface CommentTemplate {
  id: string;
  titulo: string;
  texto: string;
  categoria: 'fachada' | 'manifiesto' | 'sin_gestion' | 'cliente' | 'general';
  semaforoSugerido?: SemaforoValue;
}
