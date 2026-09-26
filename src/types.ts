// ===== Tipos de datos de toda la aplicación =====

export type EstadoProyecto = 'En Preproducción' | 'En Rodaje' | 'En Postproducción' | 'Entregado'
export type IntExt = 'INT' | 'EXT' | 'INT/EXT'
export type Momento = 'DÍA' | 'NOCHE' | 'TARDE' | 'MAÑANA' | 'AMANECER' | 'ATARDECER' | 'DÍA/NOCHE'
export type EstadoEscena = 'Sin filmar' | 'Filmada' | 'Aprobada'

// Una escena del desglose de guión
export interface Escena {
  id: string
  numero: string
  intExt: IntExt
  locacionId: string // referencia al catálogo de locaciones (o vacío)
  locacionTexto: string // texto libre si la locación no está en el catálogo
  momento: Momento
  sinopsis: string
  personajeIds: string[] // ids de personas del elenco
  props: string[]
  vestuario: string
  maquillaje: string
  vehiculos: string
  sonido: string
  notas: string
  paginas: number // páginas de guión estimadas
  estado: EstadoEscena
}

// Una línea del presupuesto (como en los machotes profesionales:
// cantidad × multiplicador × tarifa = subtotal, + IVA opcional)
export interface LineaPresupuesto {
  id: string
  categoria: string
  subcategoria: string
  descripcion: string
  cantidad: number
  unidad: string
  por: number // multiplicador (p. ej. 2 personas × 5 días)
  personas?: number // cuánta gente cubre esta línea (para catering, radios, transporte)
  tarifa: number // costo unitario estimado
  iva: boolean // si la línea causa IVA (16%)
  real: number // total real gastado
  proveedor: string
  notas: string // notas / número de factura
}

// Un día (jornada) del plan de rodaje
export interface DiaRodaje {
  id: string
  fecha: string // aaaa-mm-dd
  locacionId: string
  escenaIds: string[]
  paginas: string // páginas estimadas a cubrir
  horaInicio: string
  horaFin: string
  notas: string
}

export type TipoPersona = 'elenco' | 'tecnico'
export type EstadoContrato = 'Sin confirmar' | 'Confirmado' | 'Firmado'

// Persona del proyecto: elenco o equipo técnico
export interface Persona {
  id: string
  tipo: TipoPersona
  nombre: string
  personaje: string // solo elenco
  categoria: string // solo elenco: Principal / Secundario / Extra
  rol: string // solo técnico: rol / departamento
  telefono: string
  correo: string
  tarifa: number
  unidadTarifa: string
  contrato: EstadoContrato
  tallas: string // solo elenco: tallas de vestuario y notas de maquillaje
  restricciones: string // solo elenco: alergias, condiciones físicas
  notas: string
}

export type TipoLocacion = 'Interior' | 'Exterior' | 'Mixto'
export type EstadoPermiso = 'Sí' | 'No' | 'En trámite'

export interface Locacion {
  id: string
  nombre: string
  direccion: string
  tipo: TipoLocacion
  contactoNombre: string
  contactoTelefono: string
  contactoCorreo: string
  costo: number
  unidadCosto: string // por día / por jornada
  permiso: EstadoPermiso
  notas: string // acceso, parqueo, restricciones
  fotos: string[] // imágenes guardadas como dataURL
}

export type EstadoEquipo = 'Por confirmar' | 'Confirmado' | 'En set' | 'Devuelto'

export interface Equipo {
  id: string
  departamento: string
  nombre: string
  marcaModelo: string
  propiedad: 'Propio' | 'Rentado'
  proveedor: string
  costo: number
  unidadCosto: string // por día / total
  fechaInicio: string
  fechaFin: string
  responsable: string
  estado: EstadoEquipo
}

// Datos extra de la hoja de llamado de un día de rodaje
// (campos tomados del machote profesional de llamado)
// Estado de trabajo del actor en el día, como se marca en la industria:
// SW = empieza, W = trabaja, SWF = empieza y termina el mismo día,
// F = último día, H = contratado pero no se le usa hoy
export type EstadoActor = 'SW' | 'W' | 'SWF' | 'F' | 'H'

// Llamados escalonados de un actor (el orden real de un rodaje)
export interface LlamadoActor {
  pickUp: string // hora en que lo pasan a recoger
  enLocacion: string // llega a maquillaje / peinado / vestuario
  onSet: string // listo en el set
  estado: EstadoActor
  camarin: string
  notas: string
}

// Una comida del día, con cuánta gente y a qué hora está lista
export interface Comida {
  personas: string
  hora: string
}

// Extras (atmósfera) del día
export interface ExtraDia {
  id: string
  descripcion: string // "transeúntes"
  cantidad: string
  enLocacion: string
  onSet: string
  escenas: string
}

export interface CallSheet {
  llamadoGeneral: string
  desayuno: string // horario del desayuno de cortesía
  listosPrimerTiro: string // "listos para 1er tiro"
  oficinaProduccion: string // dirección y teléfono de la oficina
  llamados: Record<string, { llamado: string; camarin: string }> // crew: hora de llamado
  llamadosActores: Record<string, LlamadoActor> // elenco: pick up / maquillaje / set
  extras: ExtraDia[]
  comidas: Record<string, Comida> // desayuno, café, snack fuerte, comida, snack ligero, cena
  salidaSol: string
  puestaSol: string
  clima: string
  tempMin: string
  tempMax: string
  hospital: string // hospital más cercano a la locación
  estacionamiento: string
  catering: string
  emergencias: string
  radios: string // canales asignados por departamento
  notasSeguridad: string // reglamento en set / notas preventivas
  notasProduccion: string
}

// Reporte diario de producción (horarios reales del día,
// como en el machote de reporte de producción)
export interface ReporteDia {
  llamado: string // llamado general real
  primeraToma: string // hora de la 1a toma
  corteComer: string
  regresoComer: string
  primeraTomaRegreso: string
  corteSet: string
  corteLocacion: string
  notas: string // tomas, incidencias, pendientes
}

// ---- Control de gastos (basado en los formatos de contabilidad de producción) ----

export type EstadoSolicitud = 'Solicitada' | 'Autorizada' | 'Pagada' | 'Comprobada'

// Solicitud de recursos / transferencia (check request)
export interface Solicitud {
  id: string
  folio: string
  fecha: string
  departamento: string
  solicitante: string
  proveedor: string
  concepto: string
  cuenta: string // cuenta presupuestal a la que pertenece
  subtotal: number
  iva: boolean // si causa IVA (16%)
  urgente: boolean
  comprobar: boolean // ¿gastos a comprobar?
  estado: EstadoSolicitud
  notas: string
}

// Comprobación de un gasto (ticket / factura)
export interface Gasto {
  id: string
  fecha: string
  cuenta: string
  proveedor: string
  concepto: string
  factura: string // número de factura o ticket
  deducible: boolean
  importe: number // subtotal
  iva: number // monto de IVA del comprobante
  solicitudId: string // folio de solicitud relacionado (opcional)
  notas: string
}

// Reporte de daños y pérdidas
export interface Dano {
  id: string
  fecha: string
  diaId: string // día de rodaje (opcional)
  locacionId: string
  descripcion: string
  valor: number
  comentarios: string
}

// El proyecto completo (todo se guarda junto en localStorage)
export interface Proyecto {
  id: string
  nombre: string
  director: string
  productor: string
  primerAD: string
  logo?: string // logotipo de la producción, para las hojas de llamado y reportes
  inicioRodaje: string
  finRodaje: string
  estado: EstadoProyecto
  creado: string
  modificado?: string // último cambio (para saber si hace falta respaldar)
  escenas: Escena[]
  presupuesto: LineaPresupuesto[]
  diasRodaje: DiaRodaje[]
  personas: Persona[]
  locaciones: Locacion[]
  equipos: Equipo[]
  solicitudes: Solicitud[]
  gastos: Gasto[]
  danos: Dano[]
  callSheets: Record<string, CallSheet> // por id de día de rodaje
  reporteDiario: Record<string, ReporteDia | string> // string = formato viejo (solo notas)
}
