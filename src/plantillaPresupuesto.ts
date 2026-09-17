// ===== Plantilla de presupuesto con cuentas numeradas =====
// Basada en el machote profesional de presupuesto para cortometraje
// (sistema de cuentas de la industria mexicana)

export const PLANTILLA_PRESUPUESTO: { categoria: string; subcategorias: string[] }[] = [
  {
    categoria: '1000 · Personal de producción y dirección',
    subcategorias: [
      'Director/a / Guionista',
      'Productor/a',
      'Coordinación de producción',
      '1er asistente de dirección',
      'Continuista (script)',
      'Asistentes de producción',
    ],
  },
  {
    categoria: '1100 · Casting y extras',
    subcategorias: ['Elenco principal', 'Elenco secundario', 'Extras', 'Cuotas y prestaciones (ANDA)'],
  },
  {
    categoria: '1200 · Personal de fotografía',
    subcategorias: ['Director/a de fotografía', 'Asistentes de cámara', 'Gaffer', 'Staff / tramoya'],
  },
  {
    categoria: '1300 · Videoasist y data manager',
    subcategorias: ['Video assist', 'Data manager'],
  },
  {
    categoria: '1400 · Personal y materiales de sonido',
    subcategorias: ['Sonidista', 'Microfonista', 'Materiales de sonido'],
  },
  {
    categoria: '1500 · Personal de arte y vestuario',
    subcategorias: ['Dirección de arte', 'Utilería y props', 'Vestuario'],
  },
  {
    categoria: '1600 · Maquillaje y peinados',
    subcategorias: ['Maquillista', 'Peinados', 'Consumibles de maquillaje'],
  },
  {
    categoria: '1700 · Materiales y gastos de producción',
    subcategorias: ['Papelería y copias', 'Radios / comunicación', 'Expendables', 'Botiquín y médico'],
  },
  {
    categoria: '1800 · Prevención y seguridad',
    subcategorias: ['Seguridad en set', 'Protocolos y protección civil'],
  },
  {
    categoria: '1900 · Locaciones (personal y renta)',
    subcategorias: ['Renta de locaciones', 'Permisos', 'Limpieza', 'Gratificaciones'],
  },
  {
    categoria: '2000 · Equipo y materiales de fotografía',
    subcategorias: ['Cámara y lentes', 'Iluminación', 'Grip / dolly / grúa', 'Equipo especial'],
  },
  {
    categoria: '2100 · Materiales de data manager',
    subcategorias: ['Discos y almacenamiento'],
  },
  {
    categoria: '2200 · Transportación y picture cars',
    subcategorias: ['Vans y autos de producción', 'Picture cars (vehículos en cámara)', 'Taxis y traslados'],
  },
  {
    categoria: '2300 · Gasolinas y aditivos',
    subcategorias: ['Gasolina'],
  },
  {
    categoria: '2400 · Alimentación',
    subcategorias: ['Desayunos', 'Comidas', 'Snacks y café', 'Agua y craft service'],
  },
  {
    categoria: '2500 · Hospedaje y viáticos',
    subcategorias: ['Hotel', 'Viáticos'],
  },
  {
    categoria: '2600 · Edición',
    subcategorias: ['Editor/a', 'Isla / equipo de edición'],
  },
  {
    categoria: '3000 · Seguro fílmico',
    subcategorias: ['Seguro de rodaje'],
  },
  {
    categoria: '3100 · Auditoría y contabilidad',
    subcategorias: ['Contabilidad'],
  },
  {
    categoria: '4000 · Postproducción de imagen',
    subcategorias: ['Corrección de color', 'Efectos visuales (VFX)', 'Créditos y subtitulaje', 'DCP y deliveries'],
  },
  {
    categoria: '4100 · Postproducción de sonido y música',
    subcategorias: ['Diseño sonoro y mezcla', 'Música y derechos'],
  },
  {
    categoria: '5000 · Festival y distribución',
    subcategorias: ['Registro en festivales', 'Press kit y publicidad'],
  },
]

// Cuentas usadas por el importador de guion para crear partidas base
export const CTA_CASTING = PLANTILLA_PRESUPUESTO[1].categoria
export const CTA_LOCACIONES = PLANTILLA_PRESUPUESTO[9].categoria
export const CTA_ARTE = PLANTILLA_PRESUPUESTO[5].categoria

// Departamentos del módulo de equipamiento
export const DEPARTAMENTOS_EQUIPO = [
  'Cámara',
  'Iluminación / Eléctrico',
  'Sonido',
  'Arte / Utilería',
  'Vestuario / Maquillaje',
  'Transporte',
]
