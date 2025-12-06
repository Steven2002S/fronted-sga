import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import ModalPromocion from '../components/ModalPromocion';

// Interfaces para tipado
interface CursoInfo {
  titulo: string;
  precio: number;
  duracion: string;
  imagen: string;
}

interface DetallesCursos {
  [key: string]: CursoInfo;
}

interface FormData {
  idCurso?: number;
  nombre: string;
  apellido: string;
  email: string;
  telefono: string;
  cedula: string;
  pasaporte?: string;
  tipoDocumento: '' | 'ecuatoriano' | 'extranjero';
  fechaNacimiento: string;
  direccion: string;
  genero: '' | 'masculino' | 'femenino' | 'otro';
  montoMatricula: number;
  horarioPreferido: '' | 'matutino' | 'vespertino';
  // Nuevo campo de contacto de emergencia
  contactoEmergencia: string;
}

interface FormErrors {
  nombre?: string;
  apellido?: string;
  cedula?: string;
  pasaporte?: string;
  telefono?: string;
  email?: string;
}

interface PaymentCardProps {
  title: string;
  icon: React.ReactNode;
  description: string;
  isSelected: boolean;
  onClick: () => void;
}
import {
  ArrowLeftCircle,
  CreditCard,
  QrCode,
  Upload,
  CheckCircle,
  AlertCircle,
  Calendar,
  User,
  FileImage,
  Shield,
  Globe,
  FileText,
  IdCard,
  Sunrise,
  Sunset,
  Users,
  X,
  Clock,
  Ban,
  BookOpen,
  Hash,
  Phone,
  Info,
  RefreshCcw,
  Lock,
  Lightbulb,
  ClipboardCheck
} from 'lucide-react';
import Footer from '../components/Footer';
import { useTheme } from '../context/ThemeContext';
import { useSocket } from '../hooks/useSocket';

// Backend API base (sin proxy de Vite)
const API_BASE = import.meta.env.VITE_API_URL ? `${import.meta.env.VITE_API_URL}/api` : 'http://localhost:3000/api';

type CacheBucket = 'cupos' | 'tiposCursos';

const CACHE_KEYS: Record<CacheBucket, string> = {
  cupos: 'pago_cupos_cache_v1',
  tiposCursos: 'pago_tipos_cursos_cache_v1'
};

const CACHE_TTL_MS: Record<CacheBucket, number> = {
  cupos: 5 * 1000, // 5 segundos para refrescar cursos casi en tiempo real
  tiposCursos: 60 * 1000 // 1 minuto para catálogo de tipos
};

type CacheEntry<T> = {
  data: T;
  timestamp: number;
};

const inMemoryCache: Partial<Record<CacheBucket, CacheEntry<any>>> = {};

const getSessionStorage = (): Storage | null => {
  try {
    if (typeof window === 'undefined') return null;
    return window.sessionStorage;
  } catch (error) {
    console.warn('Session storage no disponible:', error);
    return null;
  }
};

interface CacheResult<T> {
  data: T;
  fresh: boolean;
}

const readCacheEntry = <T,>(bucket: CacheBucket): CacheResult<T> | null => {
  const ttl = CACHE_TTL_MS[bucket];
  const now = Date.now();

  const normalize = (entry: CacheEntry<T> | null | undefined): CacheResult<T> | null => {
    if (!entry) return null;
    return {
      data: entry.data,
      fresh: now - entry.timestamp < ttl
    };
  };

  const memoryHit = normalize(inMemoryCache[bucket] as CacheEntry<T> | null);
  if (memoryHit) return memoryHit;

  const storage = getSessionStorage();
  if (!storage) return null;

  try {
    const raw = storage.getItem(CACHE_KEYS[bucket]);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CacheEntry<T>;
    inMemoryCache[bucket] = parsed;
    return normalize(parsed);
  } catch (error) {
    console.warn('Error leyendo caché:', error);
    return null;
  }
};

const writeCacheEntry = <T,>(bucket: CacheBucket, data: T) => {
  const entry: CacheEntry<T> = {
    data,
    timestamp: Date.now()
  };
  inMemoryCache[bucket] = entry;

  const storage = getSessionStorage();
  if (!storage) return;

  try {
    storage.setItem(CACHE_KEYS[bucket], JSON.stringify(entry));
  } catch (error) {
    console.warn('Error guardando caché:', error);
  }
};

// Datos reales de cursos con precios y modalidades actualizadas
const detallesCursos: DetallesCursos = {
  cosmetologia: {
    titulo: 'Cosmetología',
    precio: 90,
    duracion: '12 meses - $90 mensuales',
    imagen: 'https://res.cloudinary.com/dfczvdz7b/image/upload/v1758908042/cosme1_cjsu3k.jpg'
  },
  cosmiatria: {
    titulo: 'Cosmiatría',
    precio: 90,
    duracion: '7 meses - $90 mensuales',
    imagen: 'https://res.cloudinary.com/dfczvdz7b/image/upload/v1758901284/cosmeto_cy3e36.jpg'
  },
  integral: {
    titulo: 'Belleza Integral',
    precio: 90,
    duracion: '12 meses - $90 mensuales',
    imagen: 'https://res.cloudinary.com/dfczvdz7b/image/upload/v1758908293/cos2_se1xyb.jpg'
  },
  unas: {
    titulo: 'Técnica de Uñas',
    precio: 50,
    duracion: '16 clases - Matrícula $50 + $15.40/clase',
    imagen: 'https://res.cloudinary.com/dfczvdz7b/image/upload/v1758902047/una_yzabr3.jpg'
  },
  lashista: {
    titulo: 'Lashista Profesional',
    precio: 50,
    duracion: '6 clases - Matrícula $50 + $26/clase',
    imagen: 'https://res.cloudinary.com/dfczvdz7b/image/upload/v1758900822/lashi_vuiiiv.jpg'
  },
  maquillaje: {
    titulo: 'Maquillaje Profesional',
    precio: 90,
    duracion: '6 meses - $90 mensuales',
    imagen: 'https://res.cloudinary.com/dfczvdz7b/image/upload/v1758899626/eff_rxclz1.jpg'
  },
  facial: {
    titulo: 'Cosmetología',
    precio: 90,
    duracion: '12 meses - $90 mensuales',
    imagen: 'https://res.cloudinary.com/dfczvdz7b/image/upload/v1755893924/cursos_xrnjuu.png'
  },
  'alta-peluqueria': {
    titulo: 'Alta Peluquería',
    precio: 90,
    duracion: '8 meses - $90 mensuales',
    imagen: 'https://res.cloudinary.com/dfczvdz7b/image/upload/v1758920782/pelu_hvfyfn.png'
  },
  'moldin-queen': {
    titulo: 'Moldin Queen',
    precio: 100,
    duracion: 'Matrícula $50 + 2 pagos de $25 (Total $100)',
    imagen: 'https://res.cloudinary.com/dfczvdz7b/image/upload/v1758915245/mold_o5qksq.png'
  }
};

const formatCurrency = (valor: number | string) => {
  const number = typeof valor === 'string' ? parseFloat(valor) || 0 : valor || 0;
  return new Intl.NumberFormat('es-EC', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2
  }).format(number);
};

const Pago: React.FC = () => {
  const { theme } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const params = new URLSearchParams(location.search);
  const cursoKey = params.get('curso') || 'facial';
  // Detección automática de similitud entre nombres de cursos y cards
  const getMatchingTipoCurso = (cursoKey: string, tiposCursos: any[]) => {
    // Nombres base de las cards para comparación automática
    const cardNames: Record<string, string[]> = {
      maquillaje: ['maquillaje', 'makeup', 'make up'],
      unas: ['uñas', 'unas', 'manicure', 'pedicure', 'nail'],
      cosmetologia: ['cosmetología', 'cosmetologia', 'depilación', 'depilacion'],
      facial: ['facial', 'faciales', 'rostro', 'cara'],
      cosmiatria: ['cosmiatría', 'cosmiatria', 'masajes', 'massage'],
      integral: ['integral', 'belleza', 'peluquería', 'peluqueria', 'estilismo', 'hair'],
      lashista: ['pestañas', 'pestanas', 'lashes', 'extensiones', 'lash'],
      'alta-peluqueria': ['alta peluquería', 'peluquería', 'peluqueria', 'cortes', 'tintes', 'colorimetría', 'balayage', 'hair'],
      'moldin-queen': ['moldin', 'modelado', 'estilizado', 'queen', 'molding']
    };

    // Función para calcular similitud entre strings
    const calculateSimilarity = (str1: string, str2: string): number => {
      const s1 = str1.toLowerCase().trim();
      const s2 = str2.toLowerCase().trim();

      // Coincidencia exacta
      if (s1 === s2) return 1.0;

      // Contiene la palabra completa
      if (s1.includes(s2) || s2.includes(s1)) return 0.8;

      // Similitud por palabras comunes
      const words1 = s1.split(/\s+/);
      const words2 = s2.split(/\s+/);
      const commonWords = words1.filter(w => words2.some(w2 => w2.includes(w) || w.includes(w2)));

      if (commonWords.length > 0) {
        return commonWords.length / Math.max(words1.length, words2.length) * 0.6;
      }

      return 0;
    };

    let bestMatch: any = null;
    let bestScore = 0;

    // Buscar el mejor match para cada curso
    tiposCursos.forEach((tc: any) => {
      const nombreCurso = tc.nombre;

      // Comparar con nombres base de la card
      const cardKeywords = cardNames[cursoKey] || [cursoKey];

      cardKeywords.forEach(keyword => {
        const score = calculateSimilarity(nombreCurso, keyword);
        if (score > bestScore && score > 0.3) { // Umbral mínimo de similitud
          bestScore = score;
          bestMatch = tc;
        }
      });

      // También comparar directamente con el nombre de la card
      const directScore = calculateSimilarity(nombreCurso, cursoKey);
      if (directScore > bestScore && directScore > 0.3) {
        bestScore = directScore;
        bestMatch = tc;
      }
    });

    console.log(`Mejor match para card '${cursoKey}':`, bestMatch?.nombre, `(score: ${bestScore.toFixed(2)})`);
    return bestMatch;
  };
  // Eliminamos la referencia al mapeo estático ya que ahora es dinámico
  const [tipoCursoId, setTipoCursoId] = useState<number>(0);
  const curso = detallesCursos[cursoKey];
  // Cursos cuyo campo de monto se mantiene en solo lectura con un valor fijo.
  const CURSOS_MONTO_FIJO: Record<string, number> = {
    unas: 50,
    lashista: 50,
    cosmetologia: 90,
    cosmiatria: 90,
    integral: 90,
    maquillaje: 90,
    facial: 90,
    'alta-peluqueria': 90,
    'moldin-queen': 50
  };
  const montoFijoCurso = CURSOS_MONTO_FIJO[cursoKey];
  const esCursoMontoFijo = typeof montoFijoCurso === 'number';
  const montoPredeterminado = esCursoMontoFijo ? montoFijoCurso : curso.precio;

  const [selectedPayment, setSelectedPayment] = useState<'transferencia' | 'efectivo'>('transferencia');
  const [isVisible, setIsVisible] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [documentoIdentificacion, setDocumentoIdentificacion] = useState<File | null>(null);
  const [documentoEstatusLegal, setDocumentoEstatusLegal] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [certificadoCosmetologia, setCertificadoCosmetologia] = useState<File | null>(null);
  const [submitAlert, setSubmitAlert] = useState<null | { type: 'error' | 'info' | 'success'; text: string }>(null);
  const [alertAnimatingOut, setAlertAnimatingOut] = useState(false);
  const [tipoCursoBackend, setTipoCursoBackend] = useState<any | null>(null);
  const [tiposCursosDisponibles, setTiposCursosDisponibles] = useState<any[]>([]);
  const [cuposDisponibles, setCuposDisponibles] = useState<any[]>([]);
  const [isRefreshingCupos, setIsRefreshingCupos] = useState(false);
  const lastFetchRef = useRef<number>(0);
  const [lastCuposCount, setLastCuposCount] = useState<number>(0);
  const [formData, setFormData] = useState<FormData>({
    nombre: '',
    apellido: '',
    email: '',
    telefono: '',
    cedula: '',
    tipoDocumento: '',
    fechaNacimiento: '',
    direccion: '',
    genero: '',
    montoMatricula: montoPredeterminado,
    horarioPreferido: '',
    // Inicialización del contacto de emergencia
    contactoEmergencia: ''
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [showSuccess, setShowSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [codigoSolicitud, setCodigoSolicitud] = useState<string | null>(null);
  const [showMontoAlert, setShowMontoAlert] = useState(false);

  // Estados para datos del comprobante
  const [numeroComprobante, setNumeroComprobante] = useState('');
  const [bancoComprobante, setBancoComprobante] = useState('');
  const [fechaTransferencia, setFechaTransferencia] = useState('');

  // Estados para pago en efectivo
  const [numeroComprobanteEfectivo, setNumeroComprobanteEfectivo] = useState('');
  const [recibidoPor, setRecibidoPor] = useState('');

  // Establecer fecha de hoy automáticamente cuando se selecciona transferencia
  useEffect(() => {
    if (selectedPayment === 'transferencia') {
      // Obtener fecha actual en zona horaria de Ecuador (UTC-5)
      const now = new Date();
      // Convertir a hora de Ecuador usando toLocaleString
      const ecuadorDate = new Date(now.toLocaleString('en-US', { timeZone: 'America/Guayaquil' }));
      const year = ecuadorDate.getFullYear();
      const month = String(ecuadorDate.getMonth() + 1).padStart(2, '0');
      const day = String(ecuadorDate.getDate()).padStart(2, '0');
      const today = `${year}-${month}-${day}`;
      setFechaTransferencia(today);
      console.log('Fecha Ecuador establecida:', today);
    }
  }, [selectedPayment]);

  // Estados para estudiante existente
  const [estudianteExistente, setEstudianteExistente] = useState<any>(null);
  const [verificandoEstudiante, setVerificandoEstudiante] = useState(false);

  // Estados para solicitudes pendientes
  const [solicitudPendiente, setSolicitudPendiente] = useState<any>(null);
  const [tieneSolicitudPendiente, setTieneSolicitudPendiente] = useState(false);

  // Estados para el modal de promociones
  const [showPromoModal, setShowPromoModal] = useState(false);
  const [promocionesDisponibles, setPromocionesDisponibles] = useState<any[]>([]);
  const [loadingPromo, setLoadingPromo] = useState(false);
  const [solicitudCreada, setSolicitudCreada] = useState<any>(null); // Guardar datos de la solicitud creada
  const [promocionSeleccionadaId, setPromocionSeleccionadaId] = useState<number | null>(null); // ID de la promoción aceptada
  const revalidateTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const autoRefreshIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const loadCuposDisponiblesRef = useRef<null | ((forceRefresh?: boolean, showToast?: boolean, isPolling?: boolean) => Promise<any>)>(null);

  // Validador estricto de cédula ecuatoriana
  const validateCedulaEC = (ced: string): { ok: boolean; reason?: string } => {
    if (!/^\d{10}$/.test(ced)) return { ok: false, reason: 'Cédula incorrecta: Por favor verifique y corrija el número ingresado' };
    // Rechazar repetitivas (0000000000, 1111111111, ...)
    if (/^(\d)\1{9}$/.test(ced)) return { ok: false, reason: 'Cédula incorrecta: Por favor verifique y corrija el número ingresado' };
    const prov = parseInt(ced.slice(0, 2), 10);
    if (prov < 1 || prov > 24) return { ok: false, reason: 'Cédula incorrecta: Por favor verifique y corrija el número ingresado' };
    const digits = ced.split('').map(n => parseInt(n, 10));
    let sum = 0;
    for (let i = 0; i < 9; i++) {
      let val = digits[i];
      if ((i + 1) % 2 !== 0) { // posiciones impares 1,3,5,7,9
        val = val * 2;
        if (val > 9) val -= 9;
      }
      sum += val;
    }
    const nextTen = Math.ceil(sum / 10) * 10;
    const verifier = (nextTen - sum) % 10; // si es 10, queda 0
    if (verifier !== digits[9]) return { ok: false, reason: 'Cédula incorrecta: Por favor verifique y corrija el número ingresado' };
    return { ok: true };
  };

  useEffect(() => {
    if (esCursoMontoFijo && formData.montoMatricula !== montoPredeterminado) {
      setFormData(prev => ({ ...prev, montoMatricula: montoPredeterminado }));
      setShowMontoAlert(false);
    }
  }, [esCursoMontoFijo, formData.montoMatricula, montoPredeterminado]);


  // Función para verificar solicitudes pendientes
  const verificarSolicitudPendiente = async (identificacion: string) => {
    if (!identificacion || identificacion.trim().length < 6) return;

    try {
      const response = await fetch(
        `${API_BASE}/solicitudes?estado=pendiente&limit=100`
      );

      if (response.ok) {
        const solicitudes = await response.json();

        // Buscar si tiene solicitud pendiente con esta identificación
        const solicitudPendienteEncontrada = solicitudes.find(
          (sol: any) => sol.identificacion_solicitante?.toUpperCase() === identificacion.trim().toUpperCase()
        );

        if (solicitudPendienteEncontrada) {
          setSolicitudPendiente(solicitudPendienteEncontrada);
          setTieneSolicitudPendiente(true);
          return true;
        } else {
          setSolicitudPendiente(null);
          setTieneSolicitudPendiente(false);
          return false;
        }
      }
    } catch (error) {
      console.error('Error verificando solicitudes pendientes:', error);
    }
    return false;
  };

  // Función para verificar si estudiante ya existe en el sistema
  const verificarEstudianteExistente = async (identificacion: string) => {
    if (!identificacion || identificacion.trim().length < 6) return;

    setVerificandoEstudiante(true);

    try {
      // PRIMERO: Verificar si tiene solicitud pendiente
      const tienePendiente = await verificarSolicitudPendiente(identificacion);

      if (tienePendiente) {
        setVerificandoEstudiante(false);
        return; // Detener aquí si tiene solicitud pendiente
      }

      // SEGUNDO: Verificar si es estudiante existente
      const response = await fetch(
        `${API_BASE}/estudiantes/verificar?identificacion=${encodeURIComponent(identificacion.trim().toUpperCase())}`
      );

      if (response.ok) {
        const data = await response.json();

        if (data.existe) {
          // Estudiante YA existe en el sistema
          setEstudianteExistente(data.estudiante);

          // Pre-llenar campos con datos existentes
          setFormData(prev => ({
            ...prev,
            nombre: data.estudiante.nombre || '',
            apellido: data.estudiante.apellido || '',
            email: data.estudiante.email || '',
            telefono: data.estudiante.telefono || '',
            fechaNacimiento: data.estudiante.fecha_nacimiento || '',
            direccion: data.estudiante.direccion || '',
            genero: data.estudiante.genero || ''
          }));

          // Toast eliminado - ya se muestra la alerta verde fija en el formulario

          // Mostrar cursos matriculados si existen
          if (data.cursos_matriculados && data.cursos_matriculados.length > 0) {
            // VALIDAR CURSO DUPLICADO: Verificar si ya está inscrito en este curso
            const yaInscritoEnEsteCurso = data.cursos_matriculados.some(
              (curso: any) => curso.id_tipo_curso === tipoCursoId
            );

            if (yaInscritoEnEsteCurso) {
              const cursoActual = data.cursos_matriculados.find(
                (curso: any) => curso.id_tipo_curso === tipoCursoId
              );

              toast.error(
                `⚠️ Ya estás inscrito en este curso\n\nActualmente cursas: ${cursoActual?.tipo_curso_nombre || 'este curso'}.\nNo puedes inscribirte dos veces en el mismo curso.`,
                {
                  duration: 7000,
                  icon: '🚫',
                  style: {
                    background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.15) 0%, rgba(220, 38, 38, 0.1) 100%)',
                    border: '2px solid rgba(239, 68, 68, 0.4)',
                    color: '#ef4444',
                    backdropFilter: 'blur(10px)',
                    maxWidth: '600px',
                    fontSize: '0.95rem',
                    padding: '20px 24px',
                    whiteSpace: 'pre-line'
                  }
                }
              );

              // Bloquear formulario marcando como si tuviera solicitud pendiente
              setTieneSolicitudPendiente(true);
              setSolicitudPendiente({
                tipo_curso_nombre: cursoActual?.tipo_curso_nombre || 'Este curso',
                codigo_solicitud: 'YA-INSCRITO',
                fecha_solicitud: cursoActual?.fecha_matricula || new Date(),
                estado: 'Ya inscrito'
              });

              return; // Detener aquí
            }
          }
        } else {
          // Estudiante NO existe - formulario normal
          setEstudianteExistente(null);
        }
      }
    } catch (error) {
      console.error('Error verificando estudiante:', error);
    } finally {
      setVerificandoEstudiante(false);
    }
  };


  useEffect(() => {
    setIsVisible(true);

    // Asegurar que existe la meta tag viewport
    if (!document.querySelector('meta[name="viewport"]')) {
      const meta = document.createElement('meta');
      meta.name = 'viewport';
      meta.content = 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no';
      document.getElementsByTagName('head')[0].appendChild(meta);
    }
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const poll = () => {
      loadCuposDisponiblesRef.current?.(true, false, true);
    };

    // ⚡ OPTIMIZADO: Polling cada 30 segundos (reducido de 20s)
    autoRefreshIntervalRef.current = window.setInterval(poll, 30000);

    return () => {
      if (autoRefreshIntervalRef.current) {
        clearInterval(autoRefreshIntervalRef.current);
        autoRefreshIntervalRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    return () => {
      if (revalidateTimeoutRef.current) {
        clearTimeout(revalidateTimeoutRef.current);
        revalidateTimeoutRef.current = null;
      }
    };
  }, []);


  // Cargar tipos de cursos disponibles con caché ligera
  useEffect(() => {
    let cancelled = false;

    const resolveTipoCurso = (tiposCursos: any[]) => {
      if (cancelled) return;

      console.log('=== RESOLUCIÓN TIPO ===');
      console.log('Card (query ?curso=):', cursoKey);
      console.log('Tipos disponibles:', tiposCursos.map((tc: any) => `${tc.card_key || '-'} | ${tc.nombre}`));

      const byCardKey = tiposCursos.find((tc: any) =>
        (tc.card_key || '').toLowerCase() === String(cursoKey).toLowerCase()
      );

      if (byCardKey) {
        console.log('Tipo resuelto por card_key:', byCardKey);
        setTipoCursoId(byCardKey.id_tipo_curso);
      } else {
        const tipoCursoEncontrado = getMatchingTipoCurso(cursoKey, tiposCursos);
        if (tipoCursoEncontrado) {
          console.log('Tipo detectado por similitud:', tipoCursoEncontrado);
          setTipoCursoId(tipoCursoEncontrado.id_tipo_curso);
        } else {
          console.log('No se pudo resolver el tipo para card:', cursoKey);
        }
      }
      console.log('============================');
    };

    const loadTiposCursos = async () => {
      if (cancelled) return;

      const cached = readCacheEntry<any[]>('tiposCursos');
      if (cached) {
        console.log('Tipos de curso desde caché', cached);
        setTiposCursosDisponibles(cached.data);
        resolveTipoCurso(cached.data);
        if (cached.fresh) return;
      }

      try {
        const resTipo = await fetch(`${API_BASE}/tipos-cursos?estado=activo`);
        if (!resTipo.ok) return;
        const tiposCursos = await resTipo.json();
        if (cancelled) return;
        setTiposCursosDisponibles(tiposCursos);
        writeCacheEntry('tiposCursos', tiposCursos);
        resolveTipoCurso(tiposCursos);
      } catch (error) {
        console.error('Error cargando tipos de cursos:', error);
      }
    };

    loadTiposCursos();
    return () => { cancelled = true; };
  }, [cursoKey]);

  // Función para cargar cupos (reutilizable)
  const loadCuposDisponibles = async (forceRefresh = false, showToast = true, isPolling = false) => {
    if (!forceRefresh) {
      const cached = readCacheEntry<any[]>('cupos');
      if (cached) {
        console.log(`Cupos desde caché (${cached.fresh ? 'vigente' : 'caducado - refrescando'})`);
        setCuposDisponibles(cached.data);
        setLastCuposCount(cached.data.length);
        if (cached.fresh) {
          if (!revalidateTimeoutRef.current && typeof window !== 'undefined') {
            revalidateTimeoutRef.current = window.setTimeout(() => {
              revalidateTimeoutRef.current = null;
              loadCuposDisponibles(true, false, true);
            }, 0);
          }
          return cached.data;
        }
      }
    }

    const now = Date.now();

    if (!forceRefresh && now - lastFetchRef.current < 2000) {
      console.log('Rate limit: esperando...');
      return cuposDisponibles;
    }
    lastFetchRef.current = now;

    const loadingToast = showToast ? toast.loading('Cargando cupos disponibles...', {
      duration: 5000,
      style: {
        background: '#1f2937',
        color: '#fff',
        borderRadius: '12px',
        padding: '16px',
        fontFamily: 'Montserrat, sans-serif'
      }
    }) : null;

    try {
      console.log('Cargando cupos desde:', `${API_BASE}/cursos/disponibles`);
      const res = await fetch(`${API_BASE}/cursos/disponibles`);

      if (!res.ok) {
        console.error('-Error en respuesta de cupos:', res.status);
        if (loadingToast) toast.error('Error al cargar cupos disponibles', { id: loadingToast });
        return cuposDisponibles;
      }

      const cupos = await res.json();

      // DETECTAR CAMBIOS (nuevos cursos agregados)
      const previousCount = lastCuposCount;
      const newCount = cupos.length;

      if (isPolling && previousCount > 0 && newCount > previousCount) {
        // ¡Nuevos cursos detectados!
        const diff = newCount - previousCount;
        toast.success(`🎉 ${diff} nuevo${diff > 1 ? 's' : ''} curso${diff > 1 ? 's' : ''} disponible${diff > 1 ? 's' : ''}!`, {
          duration: 3000,
          style: {
            background: 'linear-gradient(135deg, #10b981, #059669)',
            color: '#fff',
            borderRadius: '12px',
            padding: '16px',
            fontFamily: 'Montserrat, sans-serif',
            fontWeight: 600
          }
        });
      }

      setLastCuposCount(newCount);

      setCuposDisponibles(cupos);
      writeCacheEntry('cupos', cupos);
      console.log('Cupos disponibles cargados:', cupos);
      console.log('Total de registros:', cupos.length);

      // TOAST DE ÉXITO (solo si showToast es true)
      if (loadingToast) {
        toast.dismiss(loadingToast);
      }

      return cupos;
    } catch (err) {
      console.error('Error cargando cupos:', err);
      if (loadingToast) toast.error('Error de conexión con el servidor', { id: loadingToast });
      return cuposDisponibles;
    }
  };

  loadCuposDisponiblesRef.current = loadCuposDisponibles;

  // ========================================
  // WEBSOCKET - ACTUALIZACIÓN EN TIEMPO REAL
  // ⚡ OPTIMIZADO: Debounce de 500ms para evitar múltiples recargas
  // ========================================
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const debouncedReload = () => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    debounceTimerRef.current = setTimeout(() => {
      loadCuposDisponibles(true, false, false);
      loadTipoCurso();
      debounceTimerRef.current = null;
    }, 500); // 500ms debounce
  };

  useSocket({
    'cupos_actualizados': (data: any) => {
      console.log('Cupos actualizados (WS) - Refrescando datos (debounced)', data);
      debouncedReload();
    },
    'matricula_aprobada': (data: any) => {
      console.log('Matrícula aprobada - Actualizando cupos y disponibilidad (debounced)', data);
      debouncedReload();
    },
    'solicitud_actualizada': (data: any) => {
      console.log('Solicitud actualizada - Actualizando cupos y disponibilidad (debounced)', data);
      debouncedReload();
    },
    'nueva_solicitud': (data: any) => {
      console.log('Nueva solicitud - Actualizando cupos y disponibilidad (debounced)', data);
      debouncedReload();
    }
  });

  // Cargar cupos SOLO al montar (sin polling)
  useEffect(() => {
    let cancelled = false;

    const init = async () => {
      if (cancelled) return;
      await loadCuposDisponibles(false, false, false); // Evitar toast en la carga inicial
    };

    init();
    return () => {
      cancelled = true;
    };
  }, []);

  // Recargar cupos cuando el usuario interactúa con el formulario
  const reloadCuposOnInteraction = async () => {
    const now = Date.now();
    // Solo recargar si han pasado más de 10 segundos desde la última carga
    if (now - lastFetchRef.current > 10000) {
      await loadCuposDisponibles(true, false, true);
    }
  };

  // Función para refrescar manualmente
  const handleRefreshCupos = async () => {
    setIsRefreshingCupos(true);
    await loadCuposDisponibles(true, true, false); // Forzar con toast
    setIsRefreshingCupos(false);
  };

  // Función para cargar datos del tipo de curso (reutilizable)
  const loadTipoCurso = async () => {
    if (!tipoCursoId) return;
    try {
      // Encontrar el tipo de curso en los datos ya cargados
      const tipoCurso = tiposCursosDisponibles.find((tc: any) =>
        tc.id_tipo_curso === tipoCursoId
      );

      if (tipoCurso) {
        // Verificar todos los cursos de este tipo (activos, planificados, cancelados)
        const resCursos = await fetch(`${API_BASE}/cursos?tipo=${tipoCursoId}`);
        if (resCursos.ok) {
          const todosCursos = await resCursos.json();

          // Contar cursos por estado
          const cursosActivos = todosCursos.filter((c: any) =>
            c.estado === 'activo' && Number(c.cupos_disponibles || 0) > 0
          );
          const cursosPlanificados = todosCursos.filter((c: any) =>
            c.estado === 'planificado'
          );
          const cursosCancelados = todosCursos.filter((c: any) =>
            c.estado === 'cancelado'
          );

          // Hay disponibilidad si hay cursos activos con cupos O cursos planificados
          const hayDisponibles = cursosActivos.length > 0 || cursosPlanificados.length > 0;

          setTipoCursoBackend({
            ...tipoCurso,
            disponible: hayDisponibles,
            cursosActivos: cursosActivos.length,
            cursosPlanificados: cursosPlanificados.length,
            cursosCancelados: cursosCancelados.length,
            totalCursos: todosCursos.length
          });
        } else {
          // Si no se pueden cargar los cursos, asumir no disponible
          setTipoCursoBackend({
            ...tipoCurso,
            disponible: false,
            cursosActivos: 0,
            cursosPlanificados: 0,
            cursosCancelados: 0,
            totalCursos: 0
          });
        }
      }
    } catch { }
  };

  // Cargar datos del tipo de curso específico y verificar disponibilidad
  useEffect(() => {
    if (!tipoCursoId) return;
    let cancelled = false;

    const loadWithCancel = async () => {
      if (cancelled) return;
      await loadTipoCurso();
    };

    // Carga inicial
    loadWithCancel();

    // Recargar cuando la pestaña recupere foco o visibilidad
    const onFocus = () => loadWithCancel();
    const onVisibility = () => {
      if (document.visibilityState === 'visible') loadWithCancel();
    };
    window.addEventListener('focus', onFocus);
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      cancelled = true;
      window.removeEventListener('focus', onFocus);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [tipoCursoId, tiposCursosDisponibles]);

  // Verificar estudiante cuando se ingresa cédula/pasaporte completo
  useEffect(() => {
    const identificacion = formData.tipoDocumento === 'ecuatoriano'
      ? formData.cedula
      : formData.pasaporte;

    if (identificacion && identificacion.trim().length >= 6) {
      // Debounce: esperar 800ms después de que el usuario deje de escribir
      const timer = setTimeout(() => {
        verificarEstudianteExistente(identificacion);
      }, 800);

      return () => clearTimeout(timer);
    } else {
      // Limpiar si borra la identificación
      setEstudianteExistente(null);
    }
  }, [formData.cedula, formData.pasaporte, formData.tipoDocumento]);

  // Bloqueo también si no se resolvió el tipo/curso (no existe)
  const notFoundOrNoCourse = !tipoCursoId || !tipoCursoBackend;
  const isBlocked = notFoundOrNoCourse || (!!tipoCursoBackend && (!tipoCursoBackend.disponible || tipoCursoBackend.estado !== 'activo'));

  // Debug: mostrar estado del tipo de curso
  console.log('=== DEBUG BLOQUEO ===');
  console.log('cursoKey:', cursoKey);
  console.log('cursoKey:', cursoKey);
  console.log('tipoCursoId:', tipoCursoId);
  console.log('tipoCursoBackend:', tipoCursoBackend);
  console.log('isBlocked:', isBlocked);
  if (tipoCursoBackend) {
    console.log(`Cursos - Activos: ${tipoCursoBackend.cursosActivos}, Planificados: ${tipoCursoBackend.cursosPlanificados}, Cancelados: ${tipoCursoBackend.cursosCancelados}`);
    console.log('Disponible:', tipoCursoBackend.disponible);
    console.log('Estado tipo curso:', tipoCursoBackend.estado);
  }
  console.log('=====================');

  if (!curso) {
    return (
      <div style={{
        paddingTop: 120,
        textAlign: 'center',
        color: '#fbbf24',
        minHeight: '100vh',
        background: theme === 'dark'
          ? 'linear-gradient(135deg, #000 0%, #1a1a1a 50%, #000 100%)'
          : 'linear-gradient(135deg, #ffffff 0%, #f3f4f6 50%, #ffffff 100%)'
      }}>
        <h2>Curso no encontrado</h2>
        <Link to="/cursos" style={{
          background: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)',
          color: '#000',
          padding: '12px 32px',
          borderRadius: '30px',
          textDecoration: 'none',
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          fontWeight: '700'
        }}>
          Ver Cursos
        </Link>
        <Footer />
      </div>
    );
  }

  const handleFileUpload = (file: File | null) => {
    if (isBlocked) return; // bloquear interacción
    if (!file) {
      setUploadedFile(null);
      setNumeroComprobante('');
      return;
    }
    const allowed = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'];
    const maxBytes = 5 * 1024 * 1024; // 5MB
    if (!allowed.includes(file.type)) {
      alert('Formato no permitido. Usa PDF, JPG, PNG o WEBP.');
      return;
    }
    if (file.size > maxBytes) {
      alert('El archivo supera 5MB. Por favor, sube un archivo más pequeño.');
      return;
    }
    setUploadedFile(file);
  };

  const handleDocumentoIdentificacionUpload = (file: File | null) => {
    if (isBlocked) return;
    if (!file) { setDocumentoIdentificacion(null); return; }
    const allowed = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'];
    const maxBytes = 5 * 1024 * 1024; // 5MB
    if (!allowed.includes(file.type)) {
      alert('Formato no permitido. Usa PDF, JPG, PNG o WEBP.');
      return;
    }
    if (file.size > maxBytes) {
      alert('El archivo supera 5MB. Por favor, sube un archivo más pequeño.');
      return;
    }
    setDocumentoIdentificacion(file);
  };

  const handleDocumentoEstatusLegalUpload = (file: File | null) => {
    if (isBlocked) return;
    if (!file) { setDocumentoEstatusLegal(null); return; }
    const allowed = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'];
    const maxBytes = 5 * 1024 * 1024; // 5MB
    if (!allowed.includes(file.type)) {
      alert('Formato no permitido. Usa PDF, JPG, PNG o WEBP.');
      return;
    }
    if (file.size > maxBytes) {
      alert('El archivo supera 5MB. Por favor, sube un archivo más pequeño.');
      return;
    }
    setDocumentoEstatusLegal(file);
  };

  const handleCertificadoCosmetologiaUpload = (file: File | null) => {
    if (isBlocked) return;
    if (!file) { setCertificadoCosmetologia(null); return; }
    const allowed = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'];
    const maxBytes = 5 * 1024 * 1024;
    if (!allowed.includes(file.type)) {
      alert('Formato no permitido. Usa PDF, JPG, PNG o WEBP.');
      return;
    }
    if (file.size > maxBytes) {
      alert('El archivo supera 5MB. Por favor, sube un archivo más pequeño.');
      return;
    }
    setCertificadoCosmetologia(file);
  };

  const handleDrag = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (isBlocked) return;
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (isBlocked) return;
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  // Función para limpiar el número de comprobante al quitar archivo
  const limpiarDatosComprobante = () => {
    setNumeroComprobante('');
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    // Bloqueo por estado/cupos desde backend
    if (isBlocked) {
      alert(notFoundOrNoCourse
        ? 'No existe cursos disponibles.'
        : 'La matrícula para este curso está cerrada o no hay cupos disponibles.'
      );
      setIsSubmitting(false);
      return;
    }
    if (!formData.tipoDocumento) {
      alert('Selecciona el tipo de documento (Cédula o Pasaporte).');
      setIsSubmitting(false);
      return;
    }
    if (!formData.horarioPreferido) {
      alert('Selecciona el horario preferido (Matutino o Vespertino).');
      setIsSubmitting(false);
      return;
    }

    // VALIDAR SI HAY CUPOS DISPONIBLES PARA EL HORARIO SELECCIONADO
    const cuposParaHorario = cuposDisponibles.find(
      (c: any) => c.id_tipo_curso === tipoCursoId && c.horario === formData.horarioPreferido
    );

    if (!cuposParaHorario || cuposParaHorario.cupos_totales === 0) {
      alert(`No hay cupos disponibles para el horario ${formData.horarioPreferido}. Por favor, selecciona otro horario o espera a que se abra un nuevo curso.`);
      setIsSubmitting(false);
      return;
    }
    if (!estudianteExistente && !documentoIdentificacion) {
      alert(`Por favor, sube la copia de ${formData.tipoDocumento === 'ecuatoriano' ? 'cédula' : 'pasaporte'}.`);
      setIsSubmitting(false);
      return;
    }
    if (!estudianteExistente && formData.tipoDocumento === 'extranjero' && !documentoEstatusLegal) {
      alert('Por favor, sube el documento de estatus legal (visa de estudiante o permiso de residencia).');
      setIsSubmitting(false);
      return;
    }
    // Validaciones mínimas - SOLO si NO es estudiante existente
    if (!estudianteExistente) {
      if (!formData.apellido) {
        alert('Apellido es obligatorio');
        setIsSubmitting(false);
        return;
      }
      // Email formato básico
      const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(formData.email);
      if (!emailOk) {
        setErrors((prev) => ({ ...prev, email: 'Ingresa un correo válido' }));
        alert('Correo electrónico inválido.');
        setIsSubmitting(false);
        return;
      }
    }
    // Documento: validar según tipo seleccionado
    const isEcuatoriano = formData.tipoDocumento === 'ecuatoriano';
    const documento = isEcuatoriano ? formData.cedula : (formData.pasaporte || '');
    if (isEcuatoriano) {
      if (!/^\d{10}$/.test(documento)) {
        alert('La cédula debe tener exactamente 10 dígitos.');
        setIsSubmitting(false);
        return;
      }
    } else {
      // Pasaporte: alfanumérico 6-20, mayúsculas
      if (!/^[A-Z0-9]{6,20}$/.test(documento.toUpperCase())) {
        setErrors((prev) => ({ ...prev, pasaporte: 'Pasaporte inválido (use 6-20 caracteres alfanuméricos)' }));
        alert('Pasaporte inválido. Use 6-20 caracteres alfanuméricos.');
        setIsSubmitting(false);
        return;
      }
    }
    // Teléfono Ecuador: 10 dígitos iniciando con 09
    if (!/^09\d{8}$/.test(formData.telefono)) {
      alert('El teléfono debe tener 10 dígitos y comenzar con 09 (formato Ecuador).');
      setIsSubmitting(false);
      return;
    }
    if (selectedPayment === 'transferencia' || selectedPayment === 'efectivo') {
      // Validar campos del comprobante para transferencia
      if (selectedPayment === 'transferencia') {
        if (!numeroComprobante.trim()) {
          setSubmitAlert({
            type: 'error',
            text: 'Por favor, ingresa el número de comprobante.'
          });
          setIsSubmitting(false);
          return;
        }
        if (!bancoComprobante) {
          setSubmitAlert({
            type: 'error',
            text: 'Por favor, selecciona el banco.'
          });
          setIsSubmitting(false);
          return;
        }
        if (!fechaTransferencia) {
          setSubmitAlert({
            type: 'error',
            text: 'Por favor, ingresa la fecha de transferencia.'
          });
          setIsSubmitting(false);
          return;
        }
      }

      // Validar campos del comprobante para efectivo
      if (selectedPayment === 'efectivo') {
        if (!numeroComprobanteEfectivo.trim()) {
          setSubmitAlert({
            type: 'error',
            text: 'Por favor, ingresa el número de comprobante/factura.'
          });
          setIsSubmitting(false);
          return;
        }
        if (!recibidoPor.trim()) {
          setSubmitAlert({
            type: 'error',
            text: 'Por favor, ingresa el nombre de quien recibió el pago.'
          });
          setIsSubmitting(false);
          return;
        }
      }

      if (!uploadedFile) {
        setSubmitAlert({
          type: 'error',
          text:
            selectedPayment === 'transferencia'
              ? 'Por favor, suba el comprobante de la transferencia realizada para validar su solicitud.'
              : 'Por favor, suba el comprobante o la factura entregada en nuestras oficinas para validar su solicitud.'
        });
        console.log('ALERTA ACTIVADA:', selectedPayment, uploadedFile);
        // Auto-ocultar después de 3 segundos con animación de salida
        setAlertAnimatingOut(false);
        setTimeout(() => {
          setAlertAnimatingOut(true);
          setTimeout(() => {
            setSubmitAlert(null);
            setAlertAnimatingOut(false);
          }, 350);
        }, 7000);
        setIsSubmitting(false);
        return;
      }
      const allowed = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'];
      if (!allowed.includes(uploadedFile.type)) {
        setSubmitAlert({ type: 'error', text: 'Formato de archivo no permitido. Usa PDF, JPG, PNG o WEBP.' });
        setAlertAnimatingOut(false);
        setTimeout(() => {
          setAlertAnimatingOut(true);
          setTimeout(() => { setSubmitAlert(null); setAlertAnimatingOut(false); }, 350);
        }, 7000);
        setIsSubmitting(false);
        return;
      }
      if (uploadedFile.size > 5 * 1024 * 1024) {
        setSubmitAlert({ type: 'error', text: 'El archivo supera 5MB. Por favor, sube un archivo más pequeño.' });
        setAlertAnimatingOut(false);
        setTimeout(() => {
          setAlertAnimatingOut(true);
          setTimeout(() => { setSubmitAlert(null); setAlertAnimatingOut(false); }, 350);
        }, 7000);
        setIsSubmitting(false);
        return;
      }
    }

    try {
      let response: Response;
      let debugInfo: any = {};

      if (selectedPayment === 'transferencia' || selectedPayment === 'efectivo') {
        const body = new FormData();
        body.append('identificacion_solicitante', documento.toUpperCase());
        body.append('nombre_solicitante', formData.nombre);
        body.append('apellido_solicitante', formData.apellido);
        body.append('telefono_solicitante', formData.telefono);
        body.append('email_solicitante', formData.email);
        if (formData.fechaNacimiento) body.append('fecha_nacimiento_solicitante', formData.fechaNacimiento);
        if (formData.direccion) body.append('direccion_solicitante', formData.direccion);
        if (formData.genero) body.append('genero_solicitante', formData.genero);
        body.append('horario_preferido', formData.horarioPreferido);
        body.append('id_tipo_curso', String(tipoCursoId));
        if (formData.idCurso) body.append('id_curso', String(formData.idCurso));
        body.append('monto_matricula', String(formData.montoMatricula));
        body.append('metodo_pago', selectedPayment);
        // Nuevos campos del comprobante (transferencia)
        if (selectedPayment === 'transferencia') {
          if (numeroComprobante) body.append('numero_comprobante', numeroComprobante);
          if (bancoComprobante) body.append('banco_comprobante', bancoComprobante);
          if (fechaTransferencia) body.append('fecha_transferencia', fechaTransferencia);
        }
        // Nuevos campos del comprobante (efectivo)
        if (selectedPayment === 'efectivo') {
          if (numeroComprobanteEfectivo) body.append('numero_comprobante', numeroComprobanteEfectivo);
          if (recibidoPor) body.append('recibido_por', recibidoPor);
        }
        // Validar certificado para cosmiatría
        if (cursoKey === 'cosmiatria' && !estudianteExistente && !certificadoCosmetologia) {
          toast.error('Por favor, sube tu certificado de cosmetóloga para Cosmiatría.');
          setIsSubmitting(false);
          return;
        }
        if (uploadedFile) body.append('comprobante', uploadedFile);
        if (documentoIdentificacion) body.append('documento_identificacion', documentoIdentificacion);
        if (documentoEstatusLegal) body.append('documento_estatus_legal', documentoEstatusLegal);
        if (certificadoCosmetologia) body.append('certificado_cosmetologia', certificadoCosmetologia);
        // Si es estudiante existente, enviar su ID
        if (estudianteExistente) {
          body.append('id_estudiante_existente', String(estudianteExistente.id_usuario));
        }

        // Agregar contacto de emergencia
        if (formData.contactoEmergencia) body.append('contacto_emergencia', formData.contactoEmergencia);

        // Agregar promoción seleccionada si existe
        if (promocionSeleccionadaId) {
          body.append('id_promocion_seleccionada', String(promocionSeleccionadaId));
          console.log('Enviando promoción seleccionada:', promocionSeleccionadaId);
        }

        // Para debug - convertir FormData a objeto
        debugInfo = {
          identificacion_solicitante: documento.toUpperCase(),
          nombre_solicitante: formData.nombre,
          apellido_solicitante: formData.apellido,
          telefono_solicitante: formData.telefono,
          email_solicitante: formData.email,
          fecha_nacimiento_solicitante: formData.fechaNacimiento,
          direccion_solicitante: formData.direccion,
          genero_solicitante: formData.genero,
          horario_preferido: formData.horarioPreferido,
          id_tipo_curso: tipoCursoId,
          monto_matricula: formData.montoMatricula,
          metodo_pago: selectedPayment,
          comprobante: uploadedFile ? 'Archivo adjunto' : 'Sin archivo',
          documento_identificacion: documentoIdentificacion ? 'Archivo adjunto' : 'Sin archivo',
          documento_estatus_legal: documentoEstatusLegal ? 'Archivo adjunto' : 'Sin archivo'
        };

        response = await fetch(`${API_BASE}/solicitudes`, {
          method: 'POST',
          body
        });
      } else {
        const montoFinal = formData.montoMatricula;
        debugInfo = {
          identificacion_solicitante: documento.toUpperCase(),
          nombre_solicitante: formData.nombre,
          apellido_solicitante: formData.apellido,
          telefono_solicitante: formData.telefono,
          email_solicitante: formData.email,
          fecha_nacimiento_solicitante: formData.fechaNacimiento || null,
          direccion_solicitante: formData.direccion || null,
          genero_solicitante: formData.genero || null,
          horario_preferido: formData.horarioPreferido,
          id_tipo_curso: tipoCursoId,
          ...(formData.idCurso && { id_curso: formData.idCurso }),
          monto_matricula: montoFinal,
          metodo_pago: selectedPayment
        };

        // Si es estudiante existente, enviar su ID
        if (estudianteExistente) {
          debugInfo.id_estudiante_existente = estudianteExistente.id_usuario;
        }

        // Agregar contacto de emergencia a los datos enviados
        debugInfo.contacto_emergencia = formData.contactoEmergencia;

        // Agregar promoción seleccionada si existe
        if (promocionSeleccionadaId) {
          debugInfo.id_promocion_seleccionada = promocionSeleccionadaId;
          console.log('Enviando promoción seleccionada (JSON):', promocionSeleccionadaId);
        }

        response = await fetch(`${API_BASE}/solicitudes`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(debugInfo)
        });
      }

      if (!response.ok) {
        const errText = await response.text();
        console.error('=== ERROR 400 DEBUG ===');
        console.error('Status:', response.status);
        console.error('Error del servidor:', errText);
        console.error('Datos enviados:', debugInfo);
        console.error('tipoCursoId:', tipoCursoId);
        console.error('selectedPayment:', selectedPayment);
        console.error('=======================');

        // Manejo especial para error de comprobante duplicado
        let errorObj;
        try {
          errorObj = JSON.parse(errText);
        } catch {
          errorObj = { error: errText };
        }

        if (errorObj.error && errorObj.error.includes('número de comprobante ya fue utilizado')) {
          // Determinar qué número mostrar según el método de pago
          const numComp = selectedPayment === 'efectivo' ? numeroComprobanteEfectivo : numeroComprobante;

          // Alerta profesional para comprobante duplicado
          setSubmitAlert({
            type: 'error',
            text: `COMPROBANTE DUPLICADO DETECTADO

El número de comprobante ${numComp} ya fue registrado anteriormente en nuestro sistema.

POR FAVOR, VERIFICA:
 Que no hayas enviado esta solicitud antes
 Que el comprobante sea de una transferencia nueva
 Que el número esté correcto

POLÍTICA DE SEGURIDAD:
Cada comprobante debe ser único para garantizar la transparencia y evitar pagos duplicados. Esta medida protege tanto a estudiantes como a la institución.

SOLUCIÓN:
Realiza una nueva transferencia o verifica si ya tienes una solicitud previa registrada.`
          });
          setIsSubmitting(false);
          return;
        }


        throw new Error(errText || 'Error al enviar la solicitud');
      }
      const data = await response.json();
      if (data?.codigo_solicitud) setCodigoSolicitud(data.codigo_solicitud);

      // Guardar datos de la solicitud creada
      setSolicitudCreada(data);

      // Verificar si hay promociones disponibles para este tipo de curso
      try {
        const promosResponse = await fetch(`${API_BASE}/promociones/activas`);
        console.log('Response promociones:', promosResponse.status);

        if (promosResponse.ok) {
          const todasPromos = await promosResponse.json();
          console.log('Total promociones activas:', todasPromos.length, todasPromos);

          // Filtrar promociones que apliquen al tipo de curso actual
          // Las promociones ahora tienen id_curso_principal (el que el estudiante paga)
          const cursosResponse = await fetch(`${API_BASE}/cursos?tipo=${tipoCursoId}`);
          console.log('Response cursos del tipo:', cursosResponse.status);

          if (cursosResponse.ok) {
            const cursosDelTipo = await cursosResponse.json();
            console.log('Cursos del tipo', tipoCursoId, ':', cursosDelTipo);

            const idsCursos = cursosDelTipo
              .filter((c: any) => c.estado === 'activo')
              .map((c: any) => c.id_curso);

            console.log('IDs de cursos activos:', idsCursos);

            // Filtrar promociones cuyo id_curso_principal esté en la lista
            const promosAplicables = todasPromos.filter((promo: any) => {
              const aplica = idsCursos.includes(promo.id_curso_principal);
              console.log(`  🔍 Promo "${promo.nombre_promocion}" (id_curso_principal: ${promo.id_curso_principal}) → ${aplica ? '✅ APLICA' : '❌ NO APLICA'}`);
              return aplica;
            });

            console.log('Promociones aplicables:', promosAplicables.length, promosAplicables);

            if (promosAplicables.length > 0) {
              setPromocionesDisponibles(promosAplicables);
              setShowPromoModal(true);
              console.log('showPromoModal establecido a TRUE');
              // NO mostrar success ni redirigir aún
              return;
            } else {
              console.log(' No hay promociones aplicables para este tipo de curso');
            }
          }
        }
      } catch (promoError) {
        console.error('Error al verificar promociones:', promoError);
        // Si falla la verificación de promos, continuar normal
      }

      // Si no hay promociones o hubo error, mostrar success
      setIsSubmitting(false);
      setShowSuccess(true);
      setTimeout(() => {
        navigate('/cursos');
      }, 3000);
    } catch (error) {
      setIsSubmitting(false);
      console.error(error);
      alert('No se pudo enviar la solicitud. Intenta nuevamente.');
    }
  };

  // Manejar cuando el estudiante acepta una promoción
  const handleAceptarPromocion = async (id_promocion: number) => {
    if (!solicitudCreada) {
      toast.error('Error: no se encontró la solicitud creada');
      return;
    }

    setLoadingPromo(true);

    try {
      const promoSeleccionada = promocionesDisponibles.find(p => p.id_promocion === id_promocion);

      // Guardar el ID de la promoción seleccionada
      setPromocionSeleccionadaId(id_promocion);
      console.log('Promoción guardada en estado:', id_promocion);

      // ACTUALIZAR LA SOLICITUD EN EL BACKEND
      const id_solicitud = solicitudCreada.id_solicitud || solicitudCreada.insertId;

      const response = await fetch(`${API_BASE}/solicitudes/${id_solicitud}/promocion`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id_promocion_seleccionada: id_promocion })
      });

      if (!response.ok) {
        let errorMessage = 'No se pudo actualizar la promoción en la solicitud';
        try {
          const errorBody = await response.json();
          if (errorBody?.error) {
            errorMessage = errorBody.error;
          }
        } catch (parseErr) {
          console.error('No se pudo parsear el error de promoción:', parseErr);
        }
        throw new Error(errorMessage);
      }

      console.log(' Solicitud actualizada con promoción en el backend');

      // Mostrar mensaje de éxito
      console.log('Promoción seleccionada:', {
        id_promocion,
        id_solicitud: solicitudCreada.id_solicitud || solicitudCreada.codigo_solicitud,
        nombre_promocion: promoSeleccionada?.nombre_promocion
      });

      const beneficioTexto = promoSeleccionada?.modalidad_pago === 'clases'
        ? `${promoSeleccionada?.clases_gratis} ${promoSeleccionada?.clases_gratis === 1 ? 'clase gratis' : 'clases gratis'}`
        : `${promoSeleccionada?.meses_gratis} ${promoSeleccionada?.meses_gratis === 1 ? 'mes gratis' : 'meses gratis'}`;

      toast.success(
        `¡Genial! Has seleccionado la promoción "${promoSeleccionada?.nombre_promocion}". ` +
        `Cuando tu solicitud sea aprobada, se aplicarán ${beneficioTexto} automáticamente.`,
        { duration: 6000 }
      );

      // Cerrar modal y mostrar success
      setShowPromoModal(false);
      setShowSuccess(true);
      setTimeout(() => {
        navigate('/cursos');
      }, 3000);
    } catch (error: any) {
      console.error('Error al procesar promoción:', error);
      toast.error(error.message || 'No se pudo procesar la promoción');
    } finally {
      setLoadingPromo(false);
    }
  };

  // Manejar cuando el estudiante rechaza las promociones
  const handleRechazarPromocion = () => {
    toast('Continuando sin promoción', { icon: 'ℹ️' });
    setShowPromoModal(false);
    setShowSuccess(true);
    setTimeout(() => {
      navigate('/cursos');
    }, 3000);
  };

  const PaymentCard: React.FC<PaymentCardProps> = ({ title, icon, description, isSelected, onClick }) => (
    <div
      onClick={onClick}
      className="payment-method-card"
      style={{
        padding: '24px',
        borderRadius: '20px',
        border: isSelected ? '2px solid #fbbf24' : '2px solid rgba(255, 255, 255, 0.1)',
        background: isSelected
          ? 'rgba(251, 191, 36, 0.1)'
          : 'rgba(255, 255, 255, 0.05)',
        backdropFilter: 'blur(20px)',
        cursor: 'pointer',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        transform: isSelected ? 'scale(1.02)' : 'scale(1)',
        boxShadow: isSelected
          ? '0 12px 40px rgba(251, 191, 36, 0.3)'
          : '0 8px 32px rgba(0, 0, 0, 0.2)'
      }}
    >
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '16px',
        marginBottom: '12px'
      }}>
        <div style={{
          width: '50px',
          height: '50px',
          borderRadius: '50%',
          background: isSelected
            ? 'linear-gradient(135deg, #fbbf24, #f59e0b)'
            : 'rgba(255, 255, 255, 0.1)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: isSelected ? '#000' : '#fbbf24'
        }}>
          {icon}
        </div>
        <div>
          <h3 style={{
            color: isSelected ? '#fbbf24' : (theme === 'dark' ? '#fff' : '#1f2937'),
            fontSize: '1.3rem',
            fontWeight: '700',
            margin: 0
          }}>
            {title}
          </h3>
        </div>
      </div>
      <p style={{
        color: theme === 'dark' ? 'rgba(255, 255, 255, 0.7)' : 'rgba(31, 41, 55, 0.7)',
        fontSize: '1rem',
        margin: 0,
        lineHeight: 1.5
      }}>
        {description}
      </p>
    </div>
  );

  if (showSuccess) {
    return (
      <div style={{
        minHeight: '100vh',
        background: theme === 'dark'
          ? 'linear-gradient(135deg, #000 0%, #1a1a1a 50%, #000 100%)'
          : 'linear-gradient(135deg, #ffffff 0%, #f3f4f6 50%, #ffffff 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        paddingTop: 110
      }}>
        <div style={{
          background: theme === 'dark'
            ? 'linear-gradient(135deg, rgba(0,0,0,0.92), rgba(26,26,26,0.92))'
            : 'rgba(255, 255, 255, 0.97)',
          borderRadius: '32px',
          padding: '60px',
          textAlign: 'center',
          maxWidth: '500px',
          margin: '0 24px',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(251, 191, 36, 0.3)',
          boxShadow: '0 25px 60px rgba(0, 0, 0, 0.6)'
        }}>
          <div style={{
            width: '80px',
            height: '80px',
            background: 'linear-gradient(135deg, #10b981, #059669)',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 24px',
            animation: 'pulse 2s infinite'
          }}>
            <CheckCircle size={40} color="#fff" />
          </div>
          <h2 style={{
            fontSize: '2rem',
            fontWeight: '800',
            color: theme === 'dark' ? '#fff' : '#1f2937',
            marginBottom: '16px'
          }}>
            ¡Pago Procesado!
          </h2>
          {codigoSolicitud && (
            <p style={{
              color: '#fbbf24',
              fontWeight: 700,
              marginTop: -8,
              marginBottom: 16
            }}>
              Código de solicitud: {codigoSolicitud}
            </p>
          )}
          <p style={{
            color: theme === 'dark' ? 'rgba(255, 255, 255, 0.8)' : 'rgba(31, 41, 55, 0.8)',
            fontSize: '1.1rem',
            marginBottom: '32px',
            lineHeight: 1.6
          }}>
            Hemos recibido tu solicitud de inscripción para <strong>{curso.titulo}</strong>.
            Te contactaremos pronto para confirmar tu matrícula.
          </p>
          <div style={{
            background: 'rgba(251, 191, 36, 0.1)',
            padding: '20px',
            borderRadius: '16px',
            marginBottom: '24px'
          }}>
            <p style={{
              color: '#b45309',
              fontWeight: '600',
              margin: 0
            }}>
              Redirigiendo a cursos en 3 segundos...
            </p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <>
      <style>
        {`
          @keyframes pulse {
            0%, 100% { transform: scale(1); }
            50% { transform: scale(1.05); }
          }
          
          @keyframes fadeInUp {
            from {
              opacity: 0;
              transform: translateY(30px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
          @keyframes scaleFade {
            from {
              opacity: 0;
              transform: scale(0.98);
            }
            to {
              opacity: 1;
              transform: scale(1);
            }
          }
          @keyframes alertSlideIn {
            from {
              opacity: 0;
              transform: translateY(-20px) scale(0.95);
            }
            to {
              opacity: 1;
              transform: translateY(0) scale(1);
            }
          }
          @keyframes alertFadeOut {
            from {
              opacity: 1;
              transform: translateY(0) scale(1);
            }
            to {
              opacity: 0;
              transform: translateY(-10px) scale(0.98);
            }
          }
          
          @keyframes slideInUp {
            from {
              opacity: 0;
              transform: translateY(20px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
          
          .floating-particles {
            position: absolute;
            width: 100%;
            height: 100%;
            overflow: hidden;
            pointer-events: none;
          }
          
          .particle {
            position: absolute;
            background: #fbbf24;
            border-radius: 50%;
            opacity: 0.1;
            animation: float 6s ease-in-out infinite;
          }
          
          @keyframes float {
            0%, 100% {
              transform: translateY(0px) rotate(0deg);
              opacity: 0.1;
            }
            50% {
              transform: translateY(-20px) rotate(180deg);
              opacity: 0.3;
            }
          }

          /* ========================================
             ESTILOS RESPONSIVOS MEJORADOS
             ======================================== */
          
          /* Tablet grande y escritorio pequeño */
          @media (max-width: 1200px) {
            .payment-grid {
              gap: 40px !important;
            }
          }
          
          /* Tablet */
          @media (max-width: 1024px) {
            .payment-grid {
              grid-template-columns: 1fr !important;
              gap: 32px !important;
            }
            
            .payment-title {
              font-size: 2.5rem !important;
            }
          }

          /* Tablet pequeño y móvil grande */
          @media (max-width: 768px) {
            /* CONTENEDOR PRINCIPAL */
            .payment-container {
              padding: 0 16px !important;
              max-width: 100% !important;
            }
            
            /* GRID PRINCIPAL - FORZAR 1 COLUMNA */
            .payment-grid {
              display: flex !important;
              flex-direction: column !important;
              gap: 24px !important;
              width: 100% !important;
            }
            
            /* TÍTULO PRINCIPAL */
            .payment-title {
              font-size: 2rem !important;
              text-align: center !important;
              margin-bottom: 20px !important;
              padding: 0 12px !important;
              line-height: 1.3 !important;
            }
            
            /* BOTÓN VOLVER */
            .payment-container > button:first-of-type {
              margin: 16px auto 24px auto !important;
              width: auto !important;
              max-width: 90% !important;
            }
            
            /* CARD DEL CURSO */
            .curso-card {
              width: 100% !important;
              max-width: 100% !important;
              padding: 20px 16px !important;
              margin-bottom: 20px !important;
              box-sizing: border-box !important;
            }
            
            .curso-card > div:first-child {
              display: flex !important;
              flex-direction: column !important;
              align-items: center !important;
              text-align: center !important;
              gap: 16px !important;
            }
            
            .curso-card h3 {
              font-size: 1.3rem !important;
              text-align: center !important;
            }
            
            .curso-image {
              width: 80px !important;
              height: 80px !important;
              margin: 0 auto 12px auto !important;
            }
            
            .curso-price {
              font-size: 1.6rem !important;
              margin-top: 12px !important;
              text-align: center !important;
            }
            
            /* BADGES DE CUPOS */
            .curso-card > div:first-child > div > div:last-child {
              flex-direction: column !important;
              align-items: center !important;
              gap: 8px !important;
            }
            
            .curso-card > div:first-child > div > div:last-child > div {
              width: 100% !important;
              max-width: 280px !important;
              justify-content: center !important;
            }
            
            /* SECCIONES DEL FORMULARIO */
            .form-section {
              width: 100% !important;
              max-width: 100% !important;
              padding: 20px 16px !important;
              margin-bottom: 20px !important;
              box-sizing: border-box !important;
            }
            
            .modalidad-info {
              width: 100% !important;
              max-width: 100% !important;
              padding: 16px 12px !important;
              margin-bottom: 16px !important;
              box-sizing: border-box !important;
            }
            
            /* FORMULARIO - FILAS A COLUMNAS */
            .form-row {
              display: flex !important;
              flex-direction: column !important;
              gap: 16px !important;
              width: 100% !important;
              grid-template-columns: 1fr !important;
            }
            
            /* TABS DE DOCUMENTO */
            .document-tabs {
              display: grid !important;
              grid-template-columns: 1fr !important;
              gap: 10px !important;
              width: 100% !important;
            }
            
            .document-tab {
              width: 100% !important;
              padding: 14px 16px !important;
              font-size: 0.95rem !important;
              text-align: center !important;
              box-sizing: border-box !important;
            }
            
            /* INPUTS Y CONTROLES */
            .form-input, 
            input, 
            select, 
            textarea,
            input[type="text"], 
            input[type="email"], 
            input[type="tel"], 
            input[type="date"],
            input[type="number"] {
              width: 100% !important;
              max-width: 100% !important;
              font-size: 16px !important;
              padding: 14px 16px !important;
              box-sizing: border-box !important;
              margin: 0 !important;
            }
            
            .form-label {
              font-size: 0.95rem !important;
              margin-bottom: 8px !important;
              display: block !important;
            }
            
            /* MÉTODOS DE PAGO */
            .payment-methods {
              display: flex !important;
              flex-direction: column !important;
              gap: 12px !important;
              width: 100% !important;
            }
            
            .payment-method-card {
              width: 100% !important;
              padding: 16px 12px !important;
              box-sizing: border-box !important;
            }
            
            .payment-method-card > div:first-child {
              flex-direction: row !important;
              align-items: center !important;
              justify-content: flex-start !important;
            }
            
            /* ========================================
               DATOS DEL COMPROBANTE - RESPONSIVO
               ======================================== */
            
            /* Contenedor de datos bancarios con QR */
            .payment-container div[style*="display: flex"][style*="gap: 24px"] {
              flex-direction: column !important;
              gap: 16px !important;
            }
            
            /* QR Code en móvil */
            .payment-container div[style*="width: 220px"][style*="height: 220px"] {
              width: 100% !important;
              max-width: 200px !important;
              height: 200px !important;
              margin: 0 auto !important;
            }
            
            /* Grid de Banco y Fecha - FORZAR COLUMNA */
            .payment-container div[style*="gridTemplateColumns: '1fr 1fr'"] {
              display: flex !important;
              flex-direction: column !important;
              gap: 16px !important;
              grid-template-columns: 1fr !important;
            }
            
            /* Asegurar que los divs hijos también sean responsivos */
            .payment-container div[style*="gridTemplateColumns: '1fr 1fr'"] > div {
              width: 100% !important;
              max-width: 100% !important;
            }
            
            /* ÁREA DE CARGA */
            .upload-area {
              width: 100% !important;
              padding: 20px 12px !important;
              min-height: 100px !important;
              box-sizing: border-box !important;
            }
            
            /* BOTÓN SUBMIT */
            .submit-button {
              width: 100% !important;
              max-width: 100% !important;
              padding: 16px 20px !important;
              font-size: 1.05rem !important;
              box-sizing: border-box !important;
            }
            
            /* TÍTULOS DE SECCIÓN */
            .section-title {
              font-size: 1.2rem !important;
              text-align: left !important;
            }
            
            .modalidad-title {
              font-size: 0.95rem !important;
            }
            
            .modalidad-list {
              font-size: 0.85rem !important;
              padding-left: 20px !important;
              line-height: 1.7 !important;
            }
            
            /* ALERTAS Y NOTIFICACIONES */
            .payment-container > div > div > div[style*="slideInUp"] {
              padding: 20px 16px !important;
              margin-bottom: 24px !important;
            }
            
            /* BOX-SIZING GLOBAL PARA PAYMENT */
            .payment-container * {
              box-sizing: border-box !important;
            }
            
            /* CONTENEDORES PRINCIPALES */
            .payment-container,
            .payment-container > *,
            .payment-grid,
            .payment-grid > * {
              width: 100% !important;
              max-width: 100% !important;
              box-sizing: border-box !important;
            }
            
            /* TEXTOS - PREVENIR OVERFLOW */
            .payment-container h1, 
            .payment-container h2, 
            .payment-container h3, 
            .payment-container h4, 
            .payment-container h5, 
            .payment-container h6, 
            .payment-container p, 
            .payment-container span, 
            .payment-container div {
              word-wrap: break-word !important;
              overflow-wrap: break-word !important;
              max-width: 100% !important;
            }
            
            /* BOTONES RESPONSIVOS */
            .payment-container button {
              max-width: 100% !important;
              box-sizing: border-box !important;
            }
            
            /* IMÁGENES RESPONSIVAS */
            .payment-container img {
              max-width: 100% !important;
              height: auto !important;
            }
          }

          /* MÓVIL PEQUEÑO */
          @media (max-width: 480px) {
            .payment-container {
              padding: 0 12px !important;
            }
            
            .payment-title {
              font-size: 1.75rem !important;
              padding: 0 8px !important;
            }
            
            .curso-card {
              padding: 16px 12px !important;
            }
            
            .curso-card h3 {
              font-size: 1.2rem !important;
            }
            
            .curso-image {
              width: 70px !important;
              height: 70px !important;
            }
            
            .curso-price {
              font-size: 1.5rem !important;
            }
            
            .form-section {
              padding: 16px 12px !important;
              margin-bottom: 16px !important;
            }
            
            .modalidad-info {
              padding: 12px 10px !important;
            }
            
            .payment-method-card {
              padding: 12px 10px !important;
            }
            
            .form-input, 
            input, 
            select, 
            textarea {
              padding: 12px 14px !important;
              font-size: 16px !important;
            }
            
            .upload-area {
              padding: 16px 10px !important;
              min-height: 80px !important;
            }
            
            .submit-button {
              padding: 14px 16px !important;
              font-size: 1rem !important;
            }
            
            .section-title {
              font-size: 1.1rem !important;
            }
            
            .modalidad-title {
              font-size: 0.9rem !important;
            }
            
            .modalidad-list {
              font-size: 0.8rem !important;
              line-height: 1.6 !important;
            }
            
            .document-tab {
              padding: 12px 14px !important;
              font-size: 0.9rem !important;
            }
          }
          
          /* MÓVIL MUY PEQUEÑO */
          @media (max-width: 360px) {
            .payment-container {
              padding: 0 10px !important;
            }
            
            .payment-title {
              font-size: 1.6rem !important;
            }
            
            .curso-card {
              padding: 14px 10px !important;
            }
            
            .form-section {
              padding: 14px 10px !important;
            }
            
            .modalidad-info {
              padding: 10px 8px !important;
            }
            
            .payment-method-card {
              padding: 10px 8px !important;
            }
            
            .form-input, 
            input, 
            select, 
            textarea {
              padding: 11px 12px !important;
            }
            
            .submit-button {
              padding: 13px 14px !important;
              font-size: 0.95rem !important;
            }
          }
        `}
      </style>

      <div style={{
        minHeight: '100vh',
        background: theme === 'dark'
          ? 'linear-gradient(135deg, #000 0%, #1a1a1a 50%, #000 100%)'
          : 'linear-gradient(135deg, #ffffff 0%, #f3f4f6 50%, #ffffff 100%)',
        position: 'relative',
        overflow: 'hidden',
        paddingTop: 110,
        paddingBottom: 0
      }}>
        {/* Partículas flotantes */}
        <div className="floating-particles">
          {[...Array(15)].map((_, i) => (
            <div
              key={i}
              className="particle"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                width: `${Math.random() * 4 + 1}px`,
                height: `${Math.random() * 4 + 1}px`,
                animationDelay: `${Math.random() * 6}s`,
                animationDuration: `${Math.random() * 3 + 4}s`
              }}
            />
          ))}
        </div>

        <div className="payment-container" style={{
          maxWidth: '1200px',
          margin: '0 auto',
          padding: '0 24px',
          position: 'relative',
          zIndex: 1
        }}>
          {/* Botón volver */}
          <button
            onClick={() => navigate(-1)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              background: theme === 'dark' ? 'rgba(0,0,0,0.8)' : 'rgba(255,255,255,0.95)',
              border: '1px solid rgba(251, 191, 36, 0.3)',
              borderRadius: '50px',
              padding: '12px 24px',
              cursor: 'pointer',
              boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
              color: '#fbbf24',
              margin: '24px 0 40px 0',
              backdropFilter: 'blur(10px)',
              transition: 'all 0.3s ease',
              fontWeight: '600',
              fontSize: '1.1rem'
            }}
            onMouseEnter={(e) => {
              const target = e.currentTarget as HTMLElement;
              target.style.transform = 'translateX(-5px)';
              target.style.boxShadow = '0 12px 40px rgba(251, 191, 36, 0.2)';
            }}
            onMouseLeave={(e) => {
              const target = e.currentTarget as HTMLElement;
              target.style.transform = 'translateX(0)';
              target.style.boxShadow = '0 8px 32px rgba(0,0,0,0.3)';
            }}
          >
            <ArrowLeftCircle size={24} />
            Volver
          </button>

          <div className="payment-grid" style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '60px',
            alignItems: 'start'
          }}>
            {/* Panel izquierdo - Información del curso */}
            <div style={{
              transform: isVisible ? 'translateY(0)' : 'translateY(30px)',
              opacity: isVisible ? 1 : 0,
              transition: 'all 0.8s cubic-bezier(0.4, 0, 0.2, 1)'
            }}>
              <h1 className="payment-title" style={{
                fontSize: '3rem',
                fontWeight: '800',
                background: 'linear-gradient(135deg, #fbbf24, #f59e0b)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                marginBottom: '24px',
                lineHeight: 1.2
              }}>
                Finalizar Inscripción
              </h1>

              <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '16px' }}>
                <button
                  onClick={handleRefreshCupos}
                  disabled={isRefreshingCupos}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    borderRadius: '999px',
                    border: '1px solid rgba(251, 191, 36, 0.3)',
                    padding: '0.4rem 1rem',
                    background: theme === 'dark' ? 'rgba(251, 191, 36, 0.08)' : 'rgba(251, 191, 36, 0.15)',
                    color: theme === 'dark' ? '#fef3c7' : '#92400e',
                    fontWeight: 600,
                    fontSize: '0.85rem',
                    cursor: isRefreshingCupos ? 'wait' : 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <RefreshCcw size={16} />
                  {isRefreshingCupos ? 'Actualizando…' : 'Actualizar lista de cursos'}
                </button>
              </div>

              {/* Card del curso */}
              <div className="curso-card" style={{
                background: theme === 'dark'
                  ? 'linear-gradient(135deg, rgba(0,0,0,0.9), rgba(26,26,26,0.9))'
                  : 'rgba(255, 255, 255, 0.97)',
                borderRadius: '24px',
                padding: '32px',
                marginBottom: '40px',
                backdropFilter: 'blur(20px)',
                border: '1px solid rgba(251, 191, 36, 0.2)',
                boxShadow: '0 20px 50px rgba(0, 0, 0, 0.5)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
                  <img
                    src={curso.imagen}
                    alt={curso.titulo}
                    className="curso-image"
                    style={{
                      width: '100px',
                      height: '100px',
                      borderRadius: '16px',
                      objectFit: 'cover',
                      boxShadow: '0 8px 24px rgba(251, 191, 36, 0.2)'
                    }}
                  />
                  <div>
                    <h3 style={{
                      fontSize: '1.5rem',
                      fontWeight: '700',
                      color: theme === 'dark' ? '#fff' : '#1f2937',
                      marginBottom: '8px'
                    }}>
                      {curso.titulo}
                    </h3>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '16px',
                      marginBottom: '12px'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Calendar size={16} color="#fbbf24" />
                        <span style={{ color: theme === 'dark' ? 'rgba(255, 255, 255, 0.7)' : 'rgba(31, 41, 55, 0.7)' }}>{curso.duracion}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        {notFoundOrNoCourse ? (
                          <span style={{
                            padding: '4px 10px',
                            borderRadius: '9999px',
                            background: 'rgba(239, 68, 68, 0.15)',
                            border: '1px solid rgba(239, 68, 68, 0.3)',
                            color: '#ef4444',
                            fontWeight: 700,
                            fontSize: '0.8rem'
                          }}>
                            No existe cursos disponibles
                          </span>
                        ) : (
                          !tipoCursoBackend!.disponible || tipoCursoBackend!.estado !== 'activo' ? (
                            <span style={{
                              padding: '4px 10px',
                              borderRadius: '9999px',
                              background: 'rgba(239, 68, 68, 0.15)',
                              border: '1px solid rgba(239, 68, 68, 0.3)',
                              color: '#ef4444',
                              fontWeight: 700,
                              fontSize: '0.8rem'
                            }}>
                              Matrícula cerrada
                            </span>
                          ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                              {/* Mostrar cupos por horario */}
                              {(() => {
                                console.log(' Filtrando cupos para tipoCursoId:', tipoCursoId);
                                console.log(' Cupos disponibles:', cuposDisponibles);
                                console.log(' Detalle de cada cupo:', cuposDisponibles.map((c: any) => ({
                                  id_tipo_curso: c.id_tipo_curso,
                                  tipo: typeof c.id_tipo_curso,
                                  nombre: c.tipo_curso_nombre,
                                  horario: c.horario,
                                  cupos: c.cupos_totales
                                })));
                                const cuposFiltrados = cuposDisponibles.filter((c: any) => c.id_tipo_curso === tipoCursoId);
                                console.log('Cupos filtrados:', cuposFiltrados);
                                console.log('Comparación:', cuposDisponibles.map((c: any) => `${c.id_tipo_curso} === ${tipoCursoId} ? ${c.id_tipo_curso === tipoCursoId}`));

                                if (cuposFiltrados.length === 0) {
                                  return (
                                    <span style={{
                                      padding: '4px 10px',
                                      borderRadius: '9999px',
                                      background: 'rgba(16, 185, 129, 0.15)',
                                      border: '1px solid rgba(16, 185, 129, 0.3)',
                                      color: '#10b981',
                                      fontWeight: 700,
                                      fontSize: '0.8rem'
                                    }}>
                                      {tipoCursoBackend!.cursosActivos > 0 ? `Activos: ${tipoCursoBackend!.cursosActivos}` :
                                        tipoCursoBackend!.cursosPlanificados > 0 ? `Planificados: ${tipoCursoBackend!.cursosPlanificados}` :
                                          'Disponible'}
                                    </span>
                                  );
                                }

                                return cuposFiltrados.filter((c: any) => c.cupos_totales > 0).map((c: any) => {
                                  const cuposMostrar = Math.max(Number(c.cupos_totales) || 0, 0);
                                  const tieneCupos = cuposMostrar > 0;
                                  const promoLimitadaActiva = (c.promociones_con_limite || 0) > 0;
                                  const promoSinCupos = promoLimitadaActiva && (c.cupos_promocion_restantes || 0) <= 0;
                                  const porcentajeOcupado = Math.min(Math.max(((c.capacidad_total - cuposMostrar) / c.capacidad_total) * 100, 0), 100);
                                  const Icon = c.horario === 'matutino' ? Sunrise : Sunset;

                                  const slotColors = tieneCupos
                                    ? {
                                      background: theme === 'dark'
                                        ? 'linear-gradient(135deg, rgba(251,191,36,0.25), rgba(248,113,113,0.15))'
                                        : 'linear-gradient(135deg, rgba(251,191,36,0.16), rgba(253,230,138,0.4))',
                                      border: '1.5px solid rgba(251,191,36,0.45)',
                                      text: theme === 'dark' ? '#fde68a' : '#92400e',
                                      accent: '#d97706',
                                      shadow: theme === 'dark'
                                        ? '0 6px 18px rgba(251,191,36,0.25)'
                                        : '0 8px 22px rgba(251,191,36,0.2)'
                                    }
                                    : {
                                      background: theme === 'dark'
                                        ? 'linear-gradient(135deg, rgba(239,68,68,0.25), rgba(190,24,93,0.2))'
                                        : 'linear-gradient(135deg, rgba(254,226,226,0.9), rgba(254,215,215,0.8))',
                                      border: '1.5px solid rgba(239,68,68,0.35)',
                                      text: theme === 'dark' ? '#fecdd3' : '#7f1d1d',
                                      accent: '#dc2626',
                                      shadow: theme === 'dark'
                                        ? '0 6px 18px rgba(239,68,68,0.2)'
                                        : '0 8px 22px rgba(239,68,68,0.18)'
                                    };

                                  return (
                                    <div
                                      key={c.horario}
                                      style={{
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: '8px',
                                        padding: '10px 18px',
                                        borderRadius: '16px',
                                        background: slotColors.background,
                                        border: slotColors.border,
                                        boxShadow: slotColors.shadow,
                                        transition: 'all 0.3s ease',
                                        cursor: 'default'
                                      }}
                                      onMouseEnter={(e) => {
                                        e.currentTarget.style.transform = 'translateY(-2px)';
                                        e.currentTarget.style.boxShadow = tieneCupos
                                          ? '0 10px 26px rgba(251,191,36,0.32)'
                                          : '0 10px 26px rgba(239,68,68,0.28)';
                                      }}
                                      onMouseLeave={(e) => {
                                        e.currentTarget.style.transform = 'translateY(0)';
                                        e.currentTarget.style.boxShadow = slotColors.shadow;
                                      }}
                                    >
                                      <Icon
                                        size={16}
                                        color={slotColors.accent}
                                        style={{ flexShrink: 0 }}
                                      />
                                      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                        <span style={{
                                          color: slotColors.text,
                                          fontWeight: 700,
                                          fontSize: '0.75rem',
                                          textTransform: 'capitalize',
                                          lineHeight: 1
                                        }}>
                                          {c.horario}
                                        </span>
                                        <span style={{
                                          color: slotColors.text,
                                          fontWeight: 600,
                                          fontSize: '0.7rem',
                                          lineHeight: 1
                                        }}>
                                          {`${cuposMostrar}/${c.capacidad_total} cupos`}
                                        </span>
                                        {promoLimitadaActiva && (
                                          <span style={{
                                            marginTop: '2px',
                                            color: promoSinCupos ? '#f87171' : slotColors.accent,
                                            fontSize: '0.65rem',
                                            fontWeight: 600
                                          }}>
                                            {promoSinCupos
                                              ? 'Promoción sin cupos disponibles'
                                              : cuposRegalados > 0
                                                ? `Incluye ${cuposRegalados} cupo${cuposRegalados === 1 ? '' : 's'} por promo`
                                                : `Cupos reservados para promo (${c.cupos_promocion_restantes} restantes)`}
                                          </span>
                                        )}
                                      </div>
                                      {/* Barra de progreso */}
                                      <div style={{
                                        width: '40px',
                                        height: '4px',
                                        background: 'rgba(0,0,0,0.2)',
                                        borderRadius: '2px',
                                        overflow: 'hidden',
                                        marginLeft: '4px'
                                      }}>
                                        <div style={{
                                          width: `${porcentajeOcupado}%`,
                                          height: '100%',
                                          background: tieneCupos
                                            ? 'linear-gradient(90deg, #fde68a, #fbbf24)'
                                            : 'linear-gradient(90deg, #fecdd3, #e11d48)',
                                          transition: 'width 0.3s ease'
                                        }} />
                                      </div>
                                    </div>
                                  );
                                });
                              })()}
                            </div>
                          )
                        )}
                      </div>
                    </div>
                    <div className="curso-price" style={{
                      fontSize: '2rem',
                      fontWeight: '800',
                      background: 'linear-gradient(135deg, #fbbf24, #f59e0b)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent'
                    }}>
                      ${curso.precio.toLocaleString()}
                    </div>
                  </div>
                </div>
              </div>

              {/* Información de modalidades de pago */}
              <div className="modalidad-info" style={{
                background: 'rgba(251, 191, 36, 0.1)',
                border: '1px solid rgba(251, 191, 36, 0.3)',
                borderRadius: '16px',
                padding: '24px',
                marginBottom: '24px'
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  marginBottom: '16px'
                }}>
                  <Calendar size={24} color="#fbbf24" />
                  <span style={{
                    color: '#fbbf24',
                    fontWeight: '700',
                    fontSize: '1.2rem'
                  }}>
                    Modalidad de Pago
                  </span>
                </div>

                {/* Información específica por curso */}
                {cursoKey === 'unas' && (
                  <div style={{ marginBottom: '16px' }}>
                    <h4 className="modalidad-title" style={{ color: theme === 'dark' ? '#fff' : '#1f2937', fontSize: '1rem', fontWeight: '600', marginBottom: '8px' }}>
                      Técnica de Uñas - Modalidad por Clases
                    </h4>
                    <ul className="modalidad-list" style={{ color: theme === 'dark' ? 'rgba(255, 255, 255, 0.8)' : 'rgba(31, 41, 55, 0.8)', fontSize: '0.9rem', lineHeight: 1.6, margin: 0, paddingLeft: '20px' }}>
                      <li><strong>Primer pago:</strong> $50 USD para iniciar</li>
                      <li><strong>Total de clases:</strong> 16 clases</li>
                      <li><strong>Clases restantes:</strong> $15.40 USD cada una (15 clases)</li>
                      <li><strong>Frecuencia:</strong> 2 clases por semana</li>
                      <li><strong>Duración:</strong> 8 semanas aproximadamente</li>
                    </ul>
                  </div>
                )}

                {cursoKey === 'lashista' && (
                  <div style={{ marginBottom: '16px' }}>
                    <h4 className="modalidad-title" style={{ color: theme === 'dark' ? '#fff' : '#1f2937', fontSize: '1rem', fontWeight: '600', marginBottom: '8px' }}>
                      Lashista Profesional - Modalidad por Clases
                    </h4>
                    <ul className="modalidad-list" style={{ color: theme === 'dark' ? 'rgba(255, 255, 255, 0.8)' : 'rgba(31, 41, 55, 0.8)', fontSize: '0.9rem', lineHeight: 1.6, margin: 0, paddingLeft: '20px' }}>
                      <li><strong>Primer pago:</strong> $50 USD para iniciar</li>
                      <li><strong>Total de clases:</strong> 6 clases</li>
                      <li><strong>Clases restantes:</strong> $26 USD cada una (5 clases)</li>
                      <li><strong>Frecuencia:</strong> 1 clase por semana</li>
                      <li><strong>Duración:</strong> 6 semanas</li>
                    </ul>
                  </div>
                )}

                {['cosmetologia', 'cosmiatria', 'integral', 'maquillaje', 'facial'].includes(cursoKey) && (
                  <div style={{ marginBottom: '16px' }}>
                    <h4 className="modalidad-title" style={{ color: theme === 'dark' ? '#fff' : '#1f2937', fontSize: '1rem', fontWeight: '600', marginBottom: '8px' }}>
                      {curso.titulo} - Modalidad Mensual
                    </h4>
                    <ul className="modalidad-list" style={{ color: theme === 'dark' ? 'rgba(255, 255, 255, 0.8)' : 'rgba(31, 41, 55, 0.8)', fontSize: '0.9rem', lineHeight: 1.6, margin: 0, paddingLeft: '20px' }}>
                      <li><strong>Modalidad:</strong> Pago mensual únicamente</li>
                      <li><strong>Valor mensual:</strong> $90 USD cada mes</li>
                      <li><strong>Duración:</strong> {cursoKey === 'cosmiatria' ? '7 meses' : cursoKey === 'maquillaje' ? '6 meses' : '12 meses'}</li>
                      <li><strong>Incluye:</strong> Materiales, productos y certificación</li>
                      {cursoKey === 'cosmiatria' && <li><strong>Requisito:</strong> Ser Cosmetóloga Graduada</li>}
                    </ul>
                  </div>
                )}

                <div style={{
                  background: theme === 'dark'
                    ? 'linear-gradient(135deg, rgba(251,191,36,0.2), rgba(248,113,113,0.12))'
                    : 'linear-gradient(135deg, rgba(253,230,138,0.85), rgba(251,191,36,0.65))',
                  borderRadius: '14px',
                  padding: '14px',
                  marginTop: '16px',
                  border: theme === 'dark'
                    ? '1px solid rgba(251,191,36,0.5)'
                    : '1px solid rgba(217,119,6,0.45)',
                  boxShadow: theme === 'dark'
                    ? '0 10px 26px rgba(251,191,36,0.25)'
                    : '0 12px 28px rgba(217,119,6,0.18)'
                }}>
                  <p style={{
                    color: theme === 'dark' ? '#fde68a' : '#92400e',
                    fontSize: '0.9rem',
                    margin: 0,
                    fontWeight: '700',
                    textAlign: 'center',
                    letterSpacing: 0.3
                  }}>
                    ✨ Con tu primer pago ya inicias tus clases ✨
                  </p>
                </div>
              </div>

              {/* Información de seguridad */}
              <div style={{
                background: theme === 'dark'
                  ? 'linear-gradient(135deg, rgba(37,99,235,0.18), rgba(14,165,233,0.2))'
                  : 'linear-gradient(135deg, rgba(191,219,254,0.9), rgba(125,211,252,0.9))',
                border: theme === 'dark'
                  ? '1px solid rgba(96,165,250,0.45)'
                  : '1px solid rgba(37,99,235,0.35)',
                borderRadius: '20px',
                padding: '22px',
                marginBottom: '32px',
                boxShadow: theme === 'dark'
                  ? '0 15px 40px rgba(37,99,235,0.25)'
                  : '0 18px 42px rgba(14,165,233,0.22)'
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  marginBottom: '12px'
                }}>
                  <Shield size={24} color={theme === 'dark' ? '#93c5fd' : '#1d4ed8'} />
                  <span style={{
                    color: theme === 'dark' ? '#bfdbfe' : '#1d4ed8',
                    fontWeight: '700',
                    fontSize: '1.1rem'
                  }}>
                    Pago Seguro
                  </span>
                </div>
                <p style={{
                  color: theme === 'dark' ? 'rgba(226,232,240,0.95)' : 'rgba(30,58,138,0.9)',
                  fontSize: '0.9rem',
                  margin: 0,
                  lineHeight: 1.5
                }}>
                  Todos los pagos son procesados de forma segura. Tu información está protegida.
                </p>
              </div>
            </div>

            {/* Panel derecho - Formulario de pago */}
            <div style={{
              transform: isVisible ? 'translateY(0)' : 'translateY(30px)',
              opacity: isVisible ? 1 : 0,
              transition: 'all 0.8s cubic-bezier(0.4, 0, 0.2, 1)',
              transitionDelay: '200ms',
              position: 'relative'
            }}>
              {isBlocked && (
                <div style={{
                  position: 'absolute',
                  inset: 0,
                  background: 'rgba(0,0,0,0.6)',
                  zIndex: 5,
                  borderRadius: '24px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  textAlign: 'center',
                  color: theme === 'dark' ? '#fff' : '#1f2937',
                  fontWeight: 800,
                  letterSpacing: 0.5
                }}>
                  Matrícula cerrada temporalmente
                </div>
              )}
              <form onSubmit={handleSubmit}>
                <fieldset disabled={isBlocked} style={{ border: 'none', padding: 0, margin: 0 }}>
                  {/* Información personal */}
                  <div className="form-section" style={{
                    background: theme === 'dark'
                      ? 'linear-gradient(135deg, rgba(0,0,0,0.9), rgba(26,26,26,0.9))'
                      : 'rgba(255, 255, 255, 0.97)',
                    borderRadius: '24px',
                    padding: '32px',
                    marginBottom: '32px',
                    backdropFilter: 'blur(20px)',
                    border: '1px solid rgba(251, 191, 36, 0.2)',
                    boxShadow: '0 20px 50px rgba(0, 0, 0, 0.5)'
                  }}>
                    <h3 className="section-title" style={{
                      fontSize: '1.4rem',
                      fontWeight: '700',
                      color: theme === 'dark' ? '#fff' : '#1f2937',
                      marginBottom: '24px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      animation: 'fadeInUp 1s ease-in-out'
                    }}>
                      <User size={24} color="#fbbf24" />
                      Información Personal
                    </h3>

                    {/* SPINNER DE CARGA - Verificando */}
                    {verificandoEstudiante && (
                      <div className="flex flex-col items-center justify-center py-8 px-4 mb-6 rounded-2xl" style={{
                        background: 'transparent',
                        border: 'none'
                      }}>
                        <div className="relative">
                          <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-500 rounded-full animate-spin"></div>
                          <div className="absolute inset-0 w-16 h-16 border-4 border-transparent border-t-blue-400 rounded-full animate-spin" style={{ animationDuration: '1.5s', animationDirection: 'reverse' }}></div>
                        </div>
                        <p className="mt-4 text-lg font-semibold" style={{ color: theme === 'dark' ? '#60a5fa' : '#3b82f6' }}>
                          Verificando información...
                        </p>
                        <p className="mt-2 text-sm" style={{ color: theme === 'dark' ? 'rgba(255,255,255,0.6)' : 'rgba(30,41,59,0.6)' }}>
                          Por favor espera un momento
                        </p>
                      </div>
                    )}

                    {/* ALERTA DE BLOQUEO - Solicitud Pendiente o Ya Inscrito */}
                    {!verificandoEstudiante && tieneSolicitudPendiente && solicitudPendiente && (
                      <div style={{
                        position: 'relative',
                        background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.15) 0%, rgba(220, 38, 38, 0.1) 100%)',
                        border: '2px solid rgba(239, 68, 68, 0.4)',
                        borderRadius: '16px',
                        padding: '24px',
                        marginBottom: '32px',
                        backdropFilter: 'blur(10px)',
                        animation: 'slideInUp 0.5s ease-out'
                      }}>
                        {/* Botón X para cerrar */}
                        <button
                          onClick={() => {
                            setTieneSolicitudPendiente(false);
                            setSolicitudPendiente(null);
                            setEstudianteExistente(null);
                            window.location.reload();
                          }}
                          style={{
                            position: 'absolute',
                            top: '12px',
                            right: '12px',
                            background: 'transparent',
                            border: 'none',
                            cursor: 'pointer',
                            padding: 0,
                            zIndex: 10
                          }}
                          className="transition-all duration-300 hover:scale-125 hover:rotate-90"
                          title="Cerrar"
                        >
                          <span style={{
                            color: '#ef4444',
                            fontSize: '1.5rem',
                            fontWeight: 'bold',
                            display: 'block'
                          }}>×</span>
                        </button>

                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '12px',
                          marginBottom: '16px',
                          paddingRight: '32px'
                        }}>
                          {solicitudPendiente.codigo_solicitud === 'YA-INSCRITO' ? (
                            <Ban size={32} color="#ef4444" />
                          ) : (
                            <Clock size={32} color="#ef4444" />
                          )}
                          <h3 style={{
                            color: '#ef4444',
                            fontSize: '1.4rem',
                            fontWeight: '700',
                            margin: 0
                          }}>
                            {solicitudPendiente.codigo_solicitud === 'YA-INSCRITO' ? 'Ya Inscrito en este Curso' : 'Solicitud en Revisión'}
                          </h3>
                        </div>

                        <p style={{
                          color: theme === 'dark' ? 'rgba(255,255,255,0.9)' : '#1e293b',
                          fontSize: '1.05rem',
                          lineHeight: '1.6',
                          margin: '0 0 16px 0'
                        }}>
                          {solicitudPendiente.codigo_solicitud === 'YA-INSCRITO'
                            ? 'Ya estás cursando este programa. Para inscribirte en otro curso, selecciónalo desde la página de cursos.'
                            : 'Tu solicitud está siendo revisada por nuestro equipo. Te notificaremos cuando sea aprobada.'}
                        </p>

                        <div className="rounded-xl p-4 mb-4" style={{
                          background: theme === 'dark' ? 'rgba(0,0,0,0.4)' : 'rgba(255,255,255,0.7)',
                          border: `1px solid ${theme === 'dark' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(239, 68, 68, 0.15)'}`
                        }}>
                          <p className="my-2" style={{ color: theme === 'dark' ? '#fff' : '#1e293b' }}>
                            <strong className="text-red-400">📚 Curso:</strong> {solicitudPendiente.tipo_curso_nombre || 'N/A'}
                          </p>
                          {solicitudPendiente.codigo_solicitud !== 'YA-INSCRITO' && (
                            <>
                              <p className="my-2" style={{ color: theme === 'dark' ? '#fff' : '#1e293b' }}>
                                <strong className="text-red-400">🔖 Código:</strong> {solicitudPendiente.codigo_solicitud}
                              </p>
                              <p className="my-2" style={{ color: theme === 'dark' ? '#fff' : '#1e293b' }}>
                                <strong className="text-red-400">📅 Fecha:</strong> {new Date(solicitudPendiente.fecha_solicitud).toLocaleDateString('es-EC')}
                              </p>
                              <p className="my-2" style={{ color: theme === 'dark' ? '#fff' : '#1e293b' }}>
                                <strong className="text-red-400">⏳ Estado:</strong> En revisión
                              </p>
                            </>
                          )}
                        </div>
                      </div>
                    )}

                    {/* ALERTA INFORMATIVA - Estudiante Existente (solo si NO está inscrito en este curso) */}
                    {estudianteExistente && !tieneSolicitudPendiente && (
                      <div style={{
                        position: 'relative',
                        background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(5, 150, 105, 0.1) 100%)',
                        border: '2px solid rgba(16, 185, 129, 0.4)',
                        borderRadius: '16px',
                        padding: '24px',
                        marginBottom: '32px',
                        backdropFilter: 'blur(10px)',
                        animation: 'slideInUp 0.5s ease-out'
                      }}>
                        {/* Botón X para cerrar */}
                        <button
                          onClick={() => {
                            setEstudianteExistente(null);
                            window.location.reload();
                          }}
                          style={{
                            position: 'absolute',
                            top: '12px',
                            right: '12px',
                            background: 'transparent',
                            border: 'none',
                            cursor: 'pointer',
                            padding: 0,
                            zIndex: 10
                          }}
                          className="transition-all duration-300 hover:scale-125 hover:rotate-90"
                          title="Cerrar"
                        >
                          <span style={{
                            color: '#10b981',
                            fontSize: '1.5rem',
                            fontWeight: 'bold',
                            display: 'block'
                          }}>×</span>
                        </button>

                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '12px',
                          marginBottom: '16px',
                          paddingRight: '32px'
                        }}>
                          <CheckCircle size={32} color="#10b981" />
                          <h3 style={{
                            color: '#10b981',
                            fontSize: '1.4rem',
                            fontWeight: '700',
                            margin: 0
                          }}>
                            ¡Bienvenido de nuevo, {estudianteExistente.nombre}!
                          </h3>
                        </div>

                        <p style={{
                          color: theme === 'dark' ? 'rgba(255,255,255,0.9)' : '#1e293b',
                          fontSize: '1.05rem',
                          lineHeight: '1.6',
                          margin: '0 0 16px 0'
                        }}>
                          Ya estás registrado en nuestro sistema con identificación <strong>{estudianteExistente.identificacion}</strong>.
                          Para inscribirte a este nuevo curso, solo necesitas:
                        </p>

                        <ul style={{
                          color: theme === 'dark' ? 'rgba(255,255,255,0.8)' : '#475569',
                          fontSize: '1rem',
                          lineHeight: '1.8',
                          marginTop: '12px',
                          marginBottom: '12px',
                          paddingLeft: '24px'
                        }}>
                          <li>✅ Seleccionar tu horario preferido</li>
                          <li>✅ Elegir método de pago</li>
                          <li>✅ Subir comprobante de pago</li>
                        </ul>

                        <div style={{
                          margin: '16px 0',
                          padding: '14px 18px',
                          borderRadius: '12px',
                          border: '1px solid rgba(245, 158, 11, 0.35)',
                          background: 'rgba(245, 158, 11, 0.08)'
                        }}>
                          <p style={{
                            margin: 0,
                            color: theme === 'dark' ? '#fde68a' : '#92400e',
                            fontWeight: 600,
                            fontSize: '0.95rem',
                            lineHeight: 1.5
                          }}>
                            💲 Pago requerido ahora: <strong>{formatCurrency(esCursoMontoFijo ? montoPredeterminado : (formData.montoMatricula || curso?.precio || 0))}</strong>.{' '}
                            {esCursoMontoFijo
                              ? `Este curso solo admite un pago inicial fijo de ${formatCurrency(montoPredeterminado)}; cuando confirmemos tu matrícula podrás cancelar el resto del curso.`
                              : 'Si deseas adelantar más meses, modifica el monto directamente en el campo “Monto a pagar”.'}
                          </p>
                        </div>

                        <div style={{
                          marginTop: '16px',
                          padding: '12px 16px',
                          background: 'rgba(59, 130, 246, 0.1)',
                          borderRadius: '8px',
                          border: '1px solid rgba(59, 130, 246, 0.3)'
                        }}>
                          <p style={{
                            color: '#3b82f6',
                            fontSize: '0.9rem',
                            margin: 0,
                            fontWeight: '600'
                          }}>
                            💡 Tip: Usarás las mismas credenciales de acceso que ya tienes
                          </p>
                        </div>
                      </div>
                    )}

                    {/* CAMPOS PERSONALES - Solo mostrar si NO es estudiante existente Y NO tiene solicitud pendiente */}
                    {!estudianteExistente && !tieneSolicitudPendiente && (
                      <>
                        {/* Tipo de documento - control segmentado estilizado (compacto) */}
                        <div style={{ marginBottom: '16px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                            <span style={{ fontWeight: 700, letterSpacing: 0.3, fontSize: '0.95rem', color: theme === 'dark' ? '#fff' : '#1f2937' }}>Tipo de documento</span>
                          </div>
                          <div role="tablist" aria-label="Tipo de documento" className="document-tabs" style={{
                            display: 'grid',
                            gridTemplateColumns: '1fr 1fr',
                            gap: '10px'
                          }}>
                            <button
                              type="button"
                              role="tab"
                              aria-selected={formData.tipoDocumento === 'ecuatoriano'}
                              onClick={() => {
                                setFormData({
                                  nombre: '',
                                  apellido: '',
                                  email: '',
                                  telefono: '',
                                  cedula: '',
                                  pasaporte: '',
                                  tipoDocumento: 'ecuatoriano',
                                  fechaNacimiento: '',
                                  direccion: '',
                                  genero: '',
                                  montoMatricula: montoPredeterminado,
                                  horarioPreferido: '',
                                  contactoEmergencia: ''
                                });
                                setErrors({});
                                setDocumentoIdentificacion(null);
                                setDocumentoEstatusLegal(null);
                              }}
                              className="document-tab"
                              style={{
                                padding: '12px 14px',
                                borderRadius: 12,
                                border: formData.tipoDocumento === 'ecuatoriano' ? '2px solid #fbbf24' : '2px solid rgba(251, 191, 36, 0.2)',
                                background: formData.tipoDocumento === 'ecuatoriano' ? 'rgba(251, 191, 36, 0.12)' : 'rgba(255,255,255,0.05)',
                                color: formData.tipoDocumento === 'ecuatoriano' ? '#fbbf24' : 'rgba(255,255,255,0.85)',
                                fontWeight: 700,
                                fontSize: '0.95rem',
                                cursor: 'pointer',
                                boxShadow: formData.tipoDocumento === 'ecuatoriano' ? '0 10px 24px rgba(251,191,36,0.12)' : '0 6px 18px rgba(0,0,0,0.3)',
                                transition: 'all .25s ease',
                                backdropFilter: 'blur(10px)'
                              }}
                              onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-2px)'; }}
                              onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(0)'; }}
                            >
                              <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                                <User size={16} />
                                Ecuatoriano (Cédula)
                              </span>
                            </button>

                            <button
                              type="button"
                              role="tab"
                              aria-selected={formData.tipoDocumento === 'extranjero'}
                              onClick={() => {
                                setFormData({
                                  nombre: '',
                                  apellido: '',
                                  email: '',
                                  telefono: '',
                                  cedula: '',
                                  pasaporte: '',
                                  tipoDocumento: 'extranjero',
                                  fechaNacimiento: '',
                                  direccion: '',
                                  genero: '',
                                  montoMatricula: montoPredeterminado,
                                  horarioPreferido: '',
                                  contactoEmergencia: ''
                                });
                                setErrors({});
                                setDocumentoIdentificacion(null);
                                setDocumentoEstatusLegal(null);
                              }}
                              style={{
                                padding: '12px 14px',
                                borderRadius: 12,
                                border: formData.tipoDocumento === 'extranjero' ? '2px solid #fbbf24' : '2px solid rgba(251, 191, 36, 0.2)',
                                background: formData.tipoDocumento === 'extranjero' ? 'rgba(251, 191, 36, 0.12)' : 'rgba(255,255,255,0.05)',
                                color: formData.tipoDocumento === 'extranjero' ? '#fbbf24' : 'rgba(255,255,255,0.85)',
                                fontWeight: 700,
                                fontSize: '0.95rem',
                                cursor: 'pointer',
                                boxShadow: formData.tipoDocumento === 'extranjero' ? '0 10px 24px rgba(251,191,36,0.12)' : '0 6px 18px rgba(0,0,0,0.3)',
                                transition: 'all .25s ease',
                                backdropFilter: 'blur(10px)'
                              }}
                              onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-2px)'; }}
                              onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(0)'; }}
                            >
                              <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                                <Globe size={16} />
                                Extranjero (Pasaporte)
                              </span>
                            </button>
                          </div>
                        </div>

                        {formData.tipoDocumento === '' && (
                          <div style={{
                            background: 'rgba(251, 191, 36, 0.08)',
                            border: '1px solid rgba(251, 191, 36, 0.25)',
                            color: '#fbbf24',
                            borderRadius: 12,
                            padding: '14px 16px',
                            marginBottom: 16,
                            fontWeight: 600
                          }}>
                            Selecciona el tipo de documento para continuar.
                          </div>
                        )}



                        {!estudianteExistente && formData.tipoDocumento !== '' && (
                          <div key={formData.tipoDocumento} style={{ animation: 'fadeInUp 1s ease-in-out' }}>
                            {/* Documento primero */}
                            <div style={{ marginBottom: '20px', animation: 'scaleFade 1s ease-in-out' }}>
                              {formData.tipoDocumento === 'ecuatoriano' ? (
                                <>
                                  <label className="form-label" style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: theme === 'dark' ? '#fff' : '#1f2937' }}>
                                    Cédula *
                                  </label>
                                  <input
                                    type="text"
                                    required
                                    inputMode="numeric"
                                    pattern="^[0-9]{10}$"
                                    maxLength={10}
                                    minLength={10}
                                    title="Ingrese exactamente 10 dígitos de cédula ecuatoriana"
                                    value={formData.cedula}
                                    className="form-input"
                                    onChange={(e) => {
                                      const val = (e.target as HTMLInputElement).value;
                                      const filtered = val.replace(/\D/g, '');
                                      setFormData({ ...formData, cedula: filtered });
                                      let msg: string | undefined = undefined;
                                      if (val !== filtered) {
                                        msg = 'Este dato es solo numérico';
                                      } else if (filtered.length === 10) {
                                        const res = validateCedulaEC(filtered);
                                        if (!res.ok) msg = res.reason || 'Cédula inválida';
                                      } else if (filtered.length > 0 && filtered.length < 10) {
                                        msg = 'Debe tener 10 dígitos';
                                      }
                                      setErrors((prev) => ({ ...prev, cedula: msg }));
                                    }}
                                    onInvalid={(e) => {
                                      (e.target as HTMLInputElement).setCustomValidity('La cédula debe tener exactamente 10 dígitos numéricos');
                                    }}
                                    onInput={(e) => {
                                      (e.target as HTMLInputElement).setCustomValidity('');
                                    }}
                                    style={{
                                      width: '100%',
                                      padding: '12px 16px',
                                      border: errors.cedula ? '2px solid #ef4444' : '2px solid rgba(251, 191, 36, 0.2)',
                                      borderRadius: '12px',
                                      fontSize: '1rem',
                                      transition: 'border-color 0.3s ease',
                                      background: theme === 'dark' ? 'rgba(0, 0, 0, 0.4)' : '#ffffff',
                                      color: theme === 'dark' ? '#fff' : '#1f2937'
                                    }}
                                    onFocus={(e) => (e.target as HTMLInputElement).style.borderColor = '#fbbf24'}
                                    onBlur={(e) => (e.target as HTMLInputElement).style.borderColor = 'rgba(251, 191, 36, 0.2)'}
                                  />
                                  {errors.cedula && (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8 }}>
                                      <AlertCircle size={16} color="#ef4444" />
                                      <span style={{ color: '#ef4444', fontSize: '0.9rem' }}>{errors.cedula}</span>
                                    </div>
                                  )}
                                </>
                              ) : (
                                <>
                                  <label className="form-label" style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: theme === 'dark' ? '#fff' : '#1f2937' }}>
                                    Pasaporte *
                                  </label>
                                  <input
                                    type="text"
                                    required
                                    inputMode="text"
                                    pattern="^[A-Za-z0-9]{6,20}$"
                                    maxLength={20}
                                    title="Pasaporte: 6 a 20 caracteres alfanuméricos"
                                    value={formData.pasaporte || ''}
                                    className="form-input"
                                    onChange={(e) => {
                                      const val = (e.target as HTMLInputElement).value;
                                      const filtered = val.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
                                      setFormData({ ...formData, pasaporte: filtered });
                                      let msg: string | undefined = undefined;
                                      if (filtered && !/^[A-Z0-9]{6,20}$/.test(filtered)) {
                                        msg = 'Pasaporte inválido (6-20 alfanumérico)';
                                      }
                                      setErrors((prev) => ({ ...prev, pasaporte: msg }));
                                    }}
                                    style={{
                                      width: '100%',
                                      padding: '12px 16px',
                                      border: errors.pasaporte ? '2px solid #ef4444' : '2px solid rgba(251, 191, 36, 0.2)',
                                      borderRadius: '12px',
                                      fontSize: '1rem',
                                      transition: 'border-color 0.3s ease',
                                      background: theme === 'dark' ? 'rgba(0, 0, 0, 0.4)' : '#ffffff',
                                      color: theme === 'dark' ? '#fff' : '#1f2937'
                                    }}
                                    onFocus={(e) => (e.target as HTMLInputElement).style.borderColor = '#fbbf24'}
                                    onBlur={(e) => (e.target as HTMLInputElement).style.borderColor = 'rgba(251, 191, 36, 0.2)'}
                                  />
                                  {errors.pasaporte && (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8 }}>
                                      <AlertCircle size={16} color="#ef4444" />
                                      <span style={{ color: '#ef4444', fontSize: '0.9rem' }}>{errors.pasaporte}</span>
                                    </div>
                                  )}
                                </>
                              )}
                            </div>

                            {/* Luego Nombre y Apellido */}
                            <div className="form-row" style={{
                              display: 'grid',
                              gridTemplateColumns: '1fr 1fr',
                              gap: '20px',
                              marginBottom: '20px',
                              animation: 'scaleFade 1s ease-in-out'
                            }}>
                              <div style={{ animation: 'scaleFade 1s ease-in-out', animationDelay: '0ms' }}>
                                <label className="form-label" style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: theme === 'dark' ? '#fff' : '#1f2937' }}>
                                  Nombres completos *
                                </label>
                                <input
                                  type="text"
                                  required
                                  value={formData.nombre}
                                  className="form-input"
                                  onChange={(e) => {
                                    const val = (e.target as HTMLInputElement).value;
                                    const removedInvalid = val.replace(/[^A-Za-zÁÉÍÓÚáéíóúÑñ\s]/g, '');
                                    const filtered = removedInvalid.toUpperCase();
                                    setFormData({ ...formData, nombre: filtered });
                                    const hadInvalid = removedInvalid.length !== val.length;
                                    setErrors((prev) => ({ ...prev, nombre: hadInvalid ? 'Este dato es solo letras' : undefined }));
                                  }}
                                  style={{
                                    width: '100%',
                                    padding: '12px 16px',
                                    border: errors.nombre ? '2px solid #ef4444' : '2px solid rgba(251, 191, 36, 0.2)',
                                    borderRadius: '12px',
                                    fontSize: '1rem',
                                    transition: 'border-color 0.3s ease',
                                    background: theme === 'dark' ? 'rgba(0, 0, 0, 0.4)' : '#ffffff',
                                    color: theme === 'dark' ? '#fff' : '#1f2937'
                                  }}
                                  onFocus={(e) => (e.target as HTMLInputElement).style.borderColor = '#fbbf24'}
                                  onBlur={(e) => (e.target as HTMLInputElement).style.borderColor = 'rgba(251, 191, 36, 0.2)'}
                                />
                                {errors.nombre && (
                                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8 }}>
                                    <AlertCircle size={16} color="#ef4444" />
                                    <span style={{ color: '#ef4444', fontSize: '0.9rem' }}>{errors.nombre}</span>
                                  </div>
                                )}
                              </div>
                              <div style={{ animation: 'scaleFade 1s ease-in-out', animationDelay: '80ms' }}>
                                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: theme === 'dark' ? '#fff' : '#1f2937' }}>
                                  Apellidos completos *
                                </label>
                                <input
                                  type="text"
                                  required
                                  value={formData.apellido}
                                  onChange={(e) => {
                                    const val = (e.target as HTMLInputElement).value;
                                    const removedInvalid = val.replace(/[^A-Za-zÁÉÍÓÚáéíóúÑñ\s]/g, '');
                                    const filtered = removedInvalid.toUpperCase();
                                    setFormData({ ...formData, apellido: filtered });
                                    const hadInvalid = removedInvalid.length !== val.length;
                                    setErrors((prev) => ({ ...prev, apellido: hadInvalid ? 'Este dato es solo letras' : undefined }));
                                  }}
                                  style={{
                                    width: '100%',
                                    padding: '12px 16px',
                                    border: errors.apellido ? '2px solid #ef4444' : '2px solid rgba(251, 191, 36, 0.2)',
                                    borderRadius: '12px',
                                    fontSize: '1rem',
                                    transition: 'border-color 0.3s ease',
                                    background: theme === 'dark' ? 'rgba(0, 0, 0, 0.4)' : '#ffffff',
                                    color: theme === 'dark' ? '#fff' : '#1f2937'
                                  }}
                                  onFocus={(e) => (e.target as HTMLInputElement).style.borderColor = '#fbbf24'}
                                  onBlur={(e) => (e.target as HTMLInputElement).style.borderColor = 'rgba(251, 191, 36, 0.2)'}
                                />
                                {errors.apellido && (
                                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8 }}>
                                    <AlertCircle size={16} color="#ef4444" />
                                    <span style={{ color: '#ef4444', fontSize: '0.9rem' }}>{errors.apellido}</span>
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Fecha de Nacimiento */}
                            <div style={{ marginBottom: '20px', animation: 'scaleFade 1s ease-in-out', animationDelay: '120ms' }}>
                              <label style={{
                                display: 'block',
                                marginBottom: '8px',
                                fontWeight: '600',
                                color: theme === 'dark' ? '#fff' : '#1f2937'
                              }}>
                                Fecha de Nacimiento *
                              </label>
                              <input
                                type="date"
                                required
                                value={formData.fechaNacimiento}
                                onChange={(e) => setFormData({ ...formData, fechaNacimiento: (e.target as HTMLInputElement).value })}
                                onFocus={(e) => (e.target as HTMLInputElement).style.borderColor = '#fbbf24'}
                                onBlur={(e) => {
                                  const el = e.target as HTMLInputElement;
                                  const val = el.value.trim();
                                  const m1 = val.match(/^(\d{2})[\/\-](\d{2})[\/\-](\d{4})$/);
                                  if (m1) {
                                    const [_, dd, mm, yyyy] = m1;
                                    const norm = `${yyyy}-${mm}-${dd}`;
                                    setFormData(prev => ({ ...prev, fechaNacimiento: norm }));
                                    el.value = norm;
                                    el.setCustomValidity('');
                                    el.style.borderColor = 'rgba(251, 191, 36, 0.2)';
                                    return;
                                  }
                                  if (!/^\d{4}-\d{2}-\d{2}$/.test(val)) {
                                    el.setCustomValidity('Formato de fecha inválido. Usa el selector o escribe DD/MM/AAAA.');
                                  } else {
                                    el.setCustomValidity('');
                                  }
                                  el.style.borderColor = 'rgba(251, 191, 36, 0.2)';
                                }}
                                onInvalid={(e) => {
                                  (e.target as HTMLInputElement).setCustomValidity('Formato de fecha inválido. Usa el selector o escribe DD/MM/AAAA.');
                                }}
                                onInput={(e) => {
                                  (e.target as HTMLInputElement).setCustomValidity('');
                                }}
                                style={{
                                  width: '100%',
                                  padding: '12px 16px',
                                  border: '2px solid rgba(251, 191, 36, 0.2)',
                                  borderRadius: '12px',
                                  fontSize: '1rem',
                                  transition: 'border-color 0.3s ease',
                                  background: theme === 'dark' ? 'rgba(0, 0, 0, 0.4)' : '#ffffff',
                                  color: theme === 'dark' ? '#fff' : '#1f2937'
                                }}
                              />
                            </div>
                          </div>
                        )}

                        {formData.tipoDocumento !== '' && (
                          <>
                            <div style={{ marginBottom: '20px', animation: 'scaleFade 1.2s ease-in-out', animationDelay: '160ms' }}>
                              <label style={{
                                display: 'block',
                                marginBottom: '8px',
                                fontWeight: '600',
                                color: theme === 'dark' ? '#fff' : '#1f2937'
                              }}>
                                Dirección
                              </label>
                              <textarea
                                required
                                value={formData.direccion}
                                onChange={(e) => setFormData({ ...formData, direccion: (e.target as HTMLTextAreaElement).value.toUpperCase() })}
                                style={{
                                  width: '100%',
                                  padding: '12px 16px',
                                  border: '2px solid rgba(251, 191, 36, 0.2)',
                                  borderRadius: '12px',
                                  fontSize: '1rem',
                                  transition: 'border-color 0.3s ease',
                                  background: theme === 'dark' ? 'rgba(0, 0, 0, 0.4)' : '#ffffff',
                                  color: theme === 'dark' ? '#fff' : '#1f2937',
                                  minHeight: '90px'
                                }}
                                onFocus={(e) => (e.target as HTMLTextAreaElement).style.borderColor = '#fbbf24'}
                                onBlur={(e) => (e.target as HTMLTextAreaElement).style.borderColor = 'rgba(251, 191, 36, 0.2)'}
                              />
                            </div>

                            {/* Primera fila: Género y Email */}
                            <div className="form-row" style={{
                              display: 'grid',
                              gridTemplateColumns: '1fr 1fr',
                              gap: '20px',
                              marginBottom: '20px',
                              animation: 'scaleFade 1.2s ease-in-out',
                              animationDelay: '200ms'
                            }}>
                              <div style={{ animation: 'scaleFade 1.2s ease-in-out', animationDelay: '200ms' }}>
                                <label style={{
                                  display: 'block',
                                  marginBottom: '8px',
                                  fontWeight: '600',
                                  color: theme === 'dark' ? '#fff' : '#1f2937'
                                }}>
                                  Género *
                                </label>
                                <select
                                  required
                                  value={formData.genero}
                                  onChange={(e) => setFormData({ ...formData, genero: (e.target as HTMLSelectElement).value as FormData['genero'] })}
                                  style={{
                                    width: '100%',
                                    padding: '12px 16px',
                                    border: '2px solid rgba(251, 191, 36, 0.2)',
                                    borderRadius: '12px',
                                    fontSize: '1rem',
                                    transition: 'border-color 0.3s ease',
                                    background: theme === 'dark' ? 'rgba(0, 0, 0, 0.4)' : '#ffffff',
                                    color: theme === 'dark' ? '#fff' : '#1f2937'
                                  }}
                                  onFocus={(e) => (e.target as HTMLSelectElement).style.borderColor = '#fbbf24'}
                                  onBlur={(e) => (e.target as HTMLSelectElement).style.borderColor = 'rgba(251, 191, 36, 0.2)'}
                                >
                                  <option value="" disabled>Seleccionar</option>
                                  <option value="masculino">Masculino</option>
                                  <option value="femenino">Femenino</option>
                                  <option value="otro">Otro</option>
                                </select>
                              </div>
                              <div style={{ animation: 'scaleFade 1.2s ease-in-out', animationDelay: '240ms' }}>
                                <label style={{
                                  display: 'block',
                                  marginBottom: '8px',
                                  fontWeight: '600',
                                  color: theme === 'dark' ? '#fff' : '#1f2937'
                                }}>
                                  Email *
                                </label>
                                <input
                                  type="email"
                                  required
                                  inputMode="email"
                                  pattern="[^\s@]+@[^\s@]+\.[^\s@]{2,}"
                                  title="Ingresa un correo válido (ej: usuario@dominio.com)"
                                  value={formData.email}
                                  onChange={(e) => {
                                    const raw = (e.target as HTMLInputElement).value;
                                    const val = raw.toLowerCase();
                                    const ok = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(val);
                                    setFormData({ ...formData, email: val });
                                    setErrors((prev) => ({ ...prev, email: ok || val === '' ? undefined : 'Ingresa un correo válido' }));
                                  }}
                                  style={{
                                    width: '100%',
                                    padding: '12px 16px',
                                    border: errors.email ? '2px solid #ef4444' : '2px solid rgba(251, 191, 36, 0.2)',
                                    borderRadius: '12px',
                                    fontSize: '1rem',
                                    transition: 'border-color 0.3s ease',
                                    background: theme === 'dark' ? 'rgba(0, 0, 0, 0.4)' : '#ffffff',
                                    color: theme === 'dark' ? '#fff' : '#1f2937'
                                  }}
                                  onFocus={(e) => (e.target as HTMLInputElement).style.borderColor = '#fbbf24'}
                                  onBlur={(e) => (e.target as HTMLInputElement).style.borderColor = 'rgba(251, 191, 36, 0.2)'}
                                />
                                {errors.email && (
                                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8 }}>
                                    <AlertCircle size={16} color="#ef4444" />
                                    <span style={{ color: '#ef4444', fontSize: '0.9rem' }}>{errors.email}</span>
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Segunda fila: Teléfono y Contacto de Emergencia */}
                            <div className="form-row" style={{
                              display: 'grid',
                              gridTemplateColumns: '1fr 1fr',
                              gap: '20px',
                              marginBottom: '20px',
                              animation: 'scaleFade 1.2s ease-in-out',
                              animationDelay: '280ms'
                            }}>
                              <div style={{ animation: 'scaleFade 1.2s ease-in-out', animationDelay: '280ms' }}>
                                <label style={{
                                  display: 'block',
                                  marginBottom: '8px',
                                  fontWeight: '600',
                                  color: theme === 'dark' ? '#fff' : '#1f2937'
                                }}>
                                  Teléfono *
                                </label>
                                <input
                                  type="tel"
                                  required
                                  inputMode="numeric"
                                  pattern="^09[0-9]{8}$"
                                  maxLength={10}
                                  minLength={10}
                                  title="Formato Ecuador: 10 dígitos y empieza con 09"
                                  value={formData.telefono}
                                  onChange={(e) => {
                                    const val = (e.target as HTMLInputElement).value;
                                    const filtered = val.replace(/\D/g, '');
                                    setFormData({ ...formData, telefono: filtered });
                                    let msg: string | undefined = undefined;
                                    if (val !== filtered) {
                                      msg = 'Este dato es solo numérico';
                                    } else if (filtered && !filtered.startsWith('09')) {
                                      msg = 'El teléfono debe empezar con 09';
                                    }
                                    setErrors((prev) => ({ ...prev, telefono: msg }));
                                  }}
                                  onInvalid={(e) => {
                                    (e.target as HTMLInputElement).setCustomValidity('Formato Ecuador: debe empezar con 09 y tener 10 dígitos');
                                  }}
                                  onInput={(e) => {
                                    const el = e.target as HTMLInputElement;
                                    const v = el.value;
                                    if (v && !/^09/.test(v)) {
                                      el.setCustomValidity('El teléfono debe empezar con 09');
                                    } else {
                                      el.setCustomValidity('');
                                    }
                                  }}
                                  style={{
                                    width: '100%',
                                    padding: '12px 16px',
                                    border: errors.telefono ? '2px solid #ef4444' : '2px solid rgba(251, 191, 36, 0.2)',
                                    borderRadius: '12px',
                                    fontSize: '1rem',
                                    transition: 'border-color 0.3s ease',
                                    background: theme === 'dark' ? 'rgba(0, 0, 0, 0.4)' : '#ffffff',
                                    color: theme === 'dark' ? '#fff' : '#1f2937'
                                  }}
                                  onFocus={(e) => (e.target as HTMLInputElement).style.borderColor = '#fbbf24'}
                                  onBlur={(e) => (e.target as HTMLInputElement).style.borderColor = 'rgba(251, 191, 36, 0.2)'}
                                />
                                {errors.telefono && (
                                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8 }}>
                                    <AlertCircle size={16} color="#ef4444" />
                                    <span style={{ color: '#ef4444', fontSize: '0.9rem' }}>{errors.telefono}</span>
                                  </div>
                                )}
                              </div>
                              <div style={{ animation: 'scaleFade 1.2s ease-in-out', animationDelay: '320ms' }}>
                                <label style={{
                                  display: 'block',
                                  marginBottom: '8px',
                                  fontWeight: '600',
                                  color: theme === 'dark' ? '#fff' : '#1f2937'
                                }}>
                                  Contacto de Emergencia *
                                </label>
                                <input
                                  type="tel"
                                  required
                                  inputMode="tel"
                                  pattern="^09[0-9]{8}$"
                                  maxLength={10}
                                  minLength={10}
                                  title="Teléfono de contacto de emergencia: 10 dígitos y empieza con 09"
                                  value={formData.contactoEmergencia}
                                  onChange={(e) => {
                                    const val = (e.target as HTMLInputElement).value;
                                    const filtered = val.replace(/\D/g, '');
                                    setFormData({ ...formData, contactoEmergencia: filtered });
                                  }}
                                  style={{
                                    width: '100%',
                                    padding: '12px 16px',
                                    border: '2px solid rgba(251, 191, 36, 0.2)',
                                    borderRadius: '12px',
                                    fontSize: '1rem',
                                    transition: 'border-color 0.3s ease',
                                    background: theme === 'dark' ? 'rgba(0, 0, 0, 0.4)' : '#ffffff',
                                    color: theme === 'dark' ? '#fff' : '#1f2937'
                                  }}
                                  onFocus={(e) => (e.target as HTMLInputElement).style.borderColor = '#fbbf24'}
                                  onBlur={(e) => (e.target as HTMLInputElement).style.borderColor = 'rgba(251, 191, 36, 0.2)'}
                                />
                                {/* Validación de contacto de emergencia */}
                                {formData.contactoEmergencia && formData.contactoEmergencia === formData.telefono && (
                                  <div style={{
                                    background: 'rgba(239, 68, 68, 0.1)',
                                    border: '1px solid rgba(239, 68, 68, 0.3)',
                                    borderRadius: '8px',
                                    padding: '12px',
                                    marginTop: '8px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '10px',
                                    animation: 'shake 0.5s ease-in-out'
                                  }}>
                                    <AlertCircle size={18} color="#ef4444" />
                                    <p style={{
                                      color: '#ef4444',
                                      fontSize: '0.85rem',
                                      margin: 0,
                                      fontWeight: '500',
                                      lineHeight: '1.4'
                                    }}>
                                      ⚠️ El contacto de emergencia no puede ser igual a tu número de teléfono.
                                      <br />
                                      <span style={{ fontSize: '0.8rem', opacity: 0.9 }}>Por favor ingresa un número diferente para emergencias.</span>
                                    </p>
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Fila del Monto a Pagar */}
                            <div className="form-row" style={{
                              display: 'grid',
                              gridTemplateColumns: '1fr 1fr',
                              gap: '20px',
                              marginBottom: '20px',
                              animation: 'scaleFade 1.2s ease-in-out',
                              animationDelay: '340ms'
                            }}>
                              {/* Campo Monto a Pagar */}
                              <div style={{ animation: 'scaleFade 1.2s ease-in-out', animationDelay: '360ms' }}>
                                <label style={{
                                  display: 'block',
                                  marginBottom: '8px',
                                  fontWeight: '600',
                                  color: theme === 'dark' ? '#fff' : '#1f2937'
                                }}>
                                  Monto a pagar (USD) *
                                </label>
                                <input
                                  type="number"
                                  required
                                  min={esCursoMontoFijo ? String(montoPredeterminado) : (tipoCursoBackend?.modalidad_pago === 'mensual' ? '90' : '1')}
                                  step={esCursoMontoFijo ? String(montoPredeterminado) : (tipoCursoBackend?.modalidad_pago === 'mensual' ? '90' : '0.01')}
                                  value={formData.montoMatricula}
                                  readOnly={esCursoMontoFijo}
                                  onChange={(e) => {
                                    if (esCursoMontoFijo) {
                                      toast.error(`Este curso tiene un monto fijo de ${formatCurrency(montoPredeterminado)}.`);
                                      return;
                                    }
                                    const valor = e.target.value;
                                    const newMonto = parseFloat(valor) || 0;

                                    // VALIDACIÓN DE MÚLTIPLOS DE 90 PARA CURSOS MENSUALES
                                    if (tipoCursoBackend?.modalidad_pago === 'mensual') {
                                      const MONTO_BASE = 90;

                                      // Si está vacío o es 0, permitir (para que pueda borrar)
                                      if (valor === '' || newMonto === 0) {
                                        setFormData({ ...formData, montoMatricula: newMonto });
                                        return;
                                      }

                                      // Solo permitir múltiplos de 90
                                      if (newMonto % MONTO_BASE === 0 && newMonto >= MONTO_BASE) {
                                        setFormData({ ...formData, montoMatricula: newMonto });

                                        // Mostrar alerta si el monto es diferente al precio original del curso
                                        const precioOriginal = curso?.precio || 0;
                                        setShowMontoAlert(newMonto !== precioOriginal);
                                      } else {
                                        // No actualizar el estado si no es múltiplo de 90
                                        const mesesPagados = Math.floor(newMonto / MONTO_BASE);
                                        const montoSugerido = mesesPagados * MONTO_BASE;
                                        const montoSiguiente = (mesesPagados + 1) * MONTO_BASE;

                                        toast.warning(
                                          `Solo múltiplos de $${MONTO_BASE}. Puedes pagar: $${montoSugerido} o $${montoSiguiente}`,
                                          { duration: 3000 }
                                        );
                                      }
                                    } else {
                                      // Para cursos por clases, permitir cualquier valor
                                      setFormData({ ...formData, montoMatricula: newMonto });

                                      // Mostrar alerta si el monto es diferente al precio original del curso
                                      const precioOriginal = curso?.precio || 0;
                                      setShowMontoAlert(newMonto !== precioOriginal);
                                    }
                                  }}
                                  onBlur={(e) => {
                                    // Cambiar color del borde
                                    (e.target as HTMLInputElement).style.borderColor = 'rgba(251, 191, 36, 0.2)';
                                    if (esCursoMontoFijo) {
                                      return;
                                    }

                                    // Al perder el foco, si está vacío o es inválido, restaurar al precio del curso
                                    if (tipoCursoBackend?.modalidad_pago === 'mensual') {
                                      const numero = parseFloat(e.target.value);
                                      if (!numero || numero < 90 || numero % 90 !== 0) {
                                        setFormData({ ...formData, montoMatricula: montoPredeterminado });
                                        setShowMontoAlert(false);
                                        toast.error('Monto inválido. Se restauró al valor del curso.', { duration: 3000 });
                                      }
                                    }
                                  }}
                                  style={{
                                    width: '100%',
                                    padding: '12px 16px',
                                    border: '2px solid rgba(251, 191, 36, 0.2)',
                                    borderRadius: '12px',
                                    fontSize: '1rem',
                                    transition: 'border-color 0.3s ease',
                                    background: theme === 'dark' ? 'rgba(0, 0, 0, 0.4)' : '#ffffff',
                                    color: theme === 'dark' ? '#fff' : '#1f2937',
                                    fontWeight: '600',
                                    opacity: esCursoMontoFijo ? 0.8 : 1,
                                    cursor: esCursoMontoFijo ? 'not-allowed' : 'text'
                                  }}
                                  onFocus={(e) => (e.target as HTMLInputElement).style.borderColor = '#fbbf24'}
                                />

                                {esCursoMontoFijo && (
                                  <p style={{
                                    marginTop: '8px',
                                    fontSize: '0.75rem',
                                    color: theme === 'dark' ? '#fef3c7' : '#92400e',
                                    fontWeight: 600
                                  }}>
                                    Este curso solo acepta pagos iniciales de {formatCurrency(montoPredeterminado)}. Una vez aprobada tu matrícula, podrás completar el resto del valor cuando lo desees.
                                  </p>
                                )}



                                {/* Alerta motivacional cuando se edita el monto - SOLO para montos inválidos */}
                                {showMontoAlert && tipoCursoBackend?.modalidad_pago === 'mensual' && formData.montoMatricula % 90 !== 0 && (
                                  <div style={{
                                    display: 'flex',
                                    alignItems: 'flex-start',
                                    gap: 12,
                                    marginTop: 12,
                                    padding: '16px',
                                    background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.1), rgba(220, 38, 38, 0.05))',
                                    border: '1px solid rgba(239, 68, 68, 0.3)',
                                    borderRadius: '12px',
                                    animation: 'slideInUp 0.3s ease-out'
                                  }}>
                                    <AlertCircle size={20} color="#ef4444" style={{ flexShrink: 0, marginTop: 2 }} />
                                    <div>
                                      <div style={{
                                        color: '#ef4444',
                                        fontSize: '0.95rem',
                                        fontWeight: '700',
                                        marginBottom: '6px'
                                      }}>
                                        💡 ¡Recordatorio importante!
                                      </div>
                                      <div style={{
                                        color: '#fca5a5',
                                        fontSize: '0.9rem',
                                        lineHeight: '1.5'
                                      }}>
                                        Con solo <strong>${curso?.precio}</strong> puedes inscribirte al curso de <strong>{curso?.titulo}</strong>.
                                        ¡No pierdas esta oportunidad de transformar tu futuro profesional!
                                        <span style={{ color: '#fbbf24', fontWeight: '600' }}>
                                          ✨ Tu carrera en belleza te está esperando.
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                )}

                                {/* Mensaje de confirmación para pagos adelantados válidos */}
                                {tipoCursoBackend?.modalidad_pago === 'mensual' && formData.montoMatricula > 90 && formData.montoMatricula % 90 === 0 && (
                                  <div style={{
                                    display: 'flex',
                                    alignItems: 'flex-start',
                                    gap: 12,
                                    marginTop: 12,
                                    padding: '16px',
                                    background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.12), rgba(5, 150, 105, 0.08))',
                                    border: '1px solid rgba(16, 185, 129, 0.3)',
                                    borderRadius: '12px',
                                    animation: 'slideInUp 0.3s ease-out'
                                  }}>
                                    <CheckCircle size={20} color="#10b981" style={{ flexShrink: 0, marginTop: 2 }} />
                                    <div>
                                      <div style={{
                                        color: '#10b981',
                                        fontSize: '0.95rem',
                                        fontWeight: '700',
                                        marginBottom: '6px'
                                      }}>
                                        ✅ ¡Excelente decisión!
                                      </div>
                                      <div style={{
                                        color: theme === 'dark' ? '#6ee7b7' : '#047857',
                                        fontSize: '0.9rem',
                                        lineHeight: '1.5'
                                      }}>
                                        Estás pagando <strong>{formData.montoMatricula / 90} meses adelantados</strong> (${formData.montoMatricula}).
                                        Esto te permitirá enfocarte en tu aprendizaje sin preocupaciones.
                                        <span style={{ color: '#fbbf24', fontWeight: '600' }}>
                                          🎓 ¡Tu compromiso con tu futuro es admirable!
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          </>
                        )}

                        {/* Sección de Documentos - Solo para nuevos estudiantes */}
                        {!estudianteExistente && formData.tipoDocumento !== '' && (
                          <div style={{
                            background: 'rgba(59, 130, 246, 0.1)',
                            border: '1px solid rgba(59, 130, 246, 0.3)',
                            borderRadius: '16px',
                            padding: '24px',
                            marginTop: '24px',
                            animation: 'scaleFade 1.2s ease-in-out',
                            animationDelay: '400ms'
                          }}>
                            <h4 style={{
                              fontSize: '1.2rem',
                              fontWeight: '700',
                              color: theme === 'dark' ? '#fff' : '#1f2937',
                              marginBottom: '20px',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '12px'
                            }}>
                              <FileText size={24} color="#3b82f6" />
                              Documentos Requeridos
                            </h4>

                            {/* Documento de Identificación */}
                            <div style={{ marginBottom: '24px' }}>
                              <label style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                marginBottom: '12px',
                                fontWeight: '600',
                                color: theme === 'dark' ? '#fff' : '#1f2937'
                              }}>
                                <IdCard size={18} color="#3b82f6" />
                                {formData.tipoDocumento === 'ecuatoriano' ? 'Copia de Cédula *' : 'Copia de Pasaporte *'}
                              </label>

                              <div
                                onDragEnter={handleDrag}
                                onDragLeave={handleDrag}
                                onDragOver={handleDrag}
                                onDrop={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  if (isBlocked) return;
                                  setDragActive(false);
                                  if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                                    handleDocumentoIdentificacionUpload(e.dataTransfer.files[0]);
                                  }
                                }}
                                style={{
                                  border: `2px dashed ${dragActive || documentoIdentificacion ? '#3b82f6' : 'rgba(59, 130, 246, 0.3)'}`,
                                  borderRadius: '12px',
                                  padding: '20px',
                                  textAlign: 'center',
                                  background: dragActive
                                    ? 'rgba(59, 130, 246, 0.1)'
                                    : (theme === 'dark' ? 'rgba(0, 0, 0, 0.4)' : 'rgba(255, 255, 255, 0.9)'),
                                  transition: 'all 0.3s ease',
                                  cursor: 'pointer'
                                }}
                                onClick={() => document.getElementById('documentoIdentificacionInput')?.click()}
                              >
                                <input
                                  id="documentoIdentificacionInput"
                                  type="file"
                                  accept=".pdf,image/jpeg,image/png,image/webp"
                                  onChange={(e) => handleDocumentoIdentificacionUpload(e.target.files?.[0] || null)}
                                  style={{ display: 'none' }}
                                />

                                {documentoIdentificacion ? (
                                  <div>
                                    <div style={{
                                      width: '50px',
                                      height: '50px',
                                      background: 'linear-gradient(135deg, #10b981, #059669)',
                                      borderRadius: '50%',
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      margin: '0 auto 12px'
                                    }}>
                                      <CheckCircle size={24} color="#fff" />
                                    </div>
                                    <p style={{
                                      color: '#10b981',
                                      fontWeight: '600',
                                      fontSize: '1rem',
                                      marginBottom: '6px'
                                    }}>
                                      ¡Documento subido!
                                    </p>
                                    <p style={{
                                      color: theme === 'dark' ? 'rgba(255, 255, 255, 0.7)' : 'rgba(31, 41, 55, 0.7)',
                                      fontSize: '0.85rem',
                                      marginBottom: '12px'
                                    }}>
                                      {documentoIdentificacion?.name} ({((documentoIdentificacion?.size || 0) / 1024 / 1024).toFixed(2)} MB)
                                    </p>
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setDocumentoIdentificacion(null);
                                      }}
                                      style={{
                                        background: 'rgba(239, 68, 68, 0.1)',
                                        border: '1px solid rgba(239, 68, 68, 0.3)',
                                        borderRadius: '6px',
                                        padding: '6px 12px',
                                        color: '#dc2626',
                                        cursor: 'pointer',
                                        fontSize: '0.8rem',
                                        fontWeight: '500'
                                      }}
                                    >
                                      Cambiar
                                    </button>
                                  </div>
                                ) : (
                                  <div>
                                    <div style={{
                                      width: '50px',
                                      height: '50px',
                                      background: 'rgba(59, 130, 246, 0.2)',
                                      borderRadius: '50%',
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      margin: '0 auto 12px'
                                    }}>
                                      <IdCard size={24} color="#3b82f6" />
                                    </div>
                                    <p style={{
                                      color: theme === 'dark' ? '#fff' : '#1f2937',
                                      fontWeight: '600',
                                      fontSize: '1rem',
                                      marginBottom: '6px'
                                    }}>
                                      Subir {formData.tipoDocumento === 'ecuatoriano' ? 'cédula' : 'pasaporte'}
                                    </p>
                                    <p style={{
                                      color: theme === 'dark' ? 'rgba(255, 255, 255, 0.7)' : 'rgba(31, 41, 55, 0.7)',
                                      fontSize: '0.85rem',
                                      marginBottom: '12px'
                                    }}>
                                      Arrastra y suelta o haz clic para seleccionar
                                    </p>
                                    <p style={{
                                      color: theme === 'dark' ? '#9ca3af' : '#4b5563',
                                      fontSize: '0.75rem'
                                    }}>
                                      PDF, JPG, PNG, WEBP (Máx. 5MB)
                                    </p>
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Documento de Estatus Legal - Solo para extranjeros */}
                            {formData.tipoDocumento === 'extranjero' && (
                              <div style={{ marginBottom: '16px' }}>
                                <label style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '8px',
                                  marginBottom: '12px',
                                  fontWeight: '600',
                                  color: theme === 'dark' ? '#fff' : '#1f2937'
                                }}>
                                  <FileText size={18} color="#3b82f6" />
                                  Documento de Estatus Legal *
                                </label>

                                <div style={{
                                  background: 'rgba(251, 191, 36, 0.1)',
                                  border: '1px solid rgba(251, 191, 36, 0.3)',
                                  borderRadius: '8px',
                                  padding: '12px',
                                  marginBottom: '12px'
                                }}>
                                  <p style={{
                                    color: '#fbbf24',
                                    fontSize: '0.85rem',
                                    margin: 0,
                                    fontWeight: '600'
                                  }}>
                                    📋 Documentos aceptados:
                                  </p>
                                  <ul style={{
                                    color: theme === 'dark' ? 'rgba(255, 255, 255, 0.8)' : 'rgba(31, 41, 55, 0.8)',
                                    fontSize: '0.8rem',
                                    margin: '8px 0 0 0',
                                    paddingLeft: '16px'
                                  }}>
                                    <li>Visa de estudiante vigente</li>
                                    <li>Permiso de residencia válido</li>
                                  </ul>
                                </div>

                                <div
                                  onDragEnter={handleDrag}
                                  onDragLeave={handleDrag}
                                  onDragOver={handleDrag}
                                  onDrop={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    if (isBlocked) return;
                                    setDragActive(false);
                                    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                                      handleDocumentoEstatusLegalUpload(e.dataTransfer.files[0]);
                                    }
                                  }}
                                  style={{
                                    border: `2px dashed ${dragActive || documentoEstatusLegal ? '#3b82f6' : 'rgba(59, 130, 246, 0.3)'}`,
                                    borderRadius: '12px',
                                    padding: '20px',
                                    textAlign: 'center',
                                    background: dragActive
                                      ? 'rgba(59, 130, 246, 0.1)'
                                      : (theme === 'dark' ? 'rgba(0, 0, 0, 0.4)' : 'rgba(255, 255, 255, 0.9)'),
                                    transition: 'all 0.3s ease',
                                    cursor: 'pointer'
                                  }}
                                  onClick={() => document.getElementById('documentoEstatusLegalInput')?.click()}
                                >
                                  <input
                                    id="documentoEstatusLegalInput"
                                    type="file"
                                    accept=".pdf,image/jpeg,image/png,image/webp"
                                    onChange={(e) => handleDocumentoEstatusLegalUpload(e.target.files?.[0] || null)}
                                    style={{ display: 'none' }}
                                  />

                                  {documentoEstatusLegal ? (
                                    <div>
                                      <div style={{
                                        width: '50px',
                                        height: '50px',
                                        background: 'linear-gradient(135deg, #10b981, #059669)',
                                        borderRadius: '50%',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        margin: '0 auto 12px'
                                      }}>
                                        <CheckCircle size={24} color="#fff" />
                                      </div>
                                      <p style={{
                                        color: '#10b981',
                                        fontWeight: '600',
                                        fontSize: '1rem',
                                        marginBottom: '6px'
                                      }}>
                                        ¡Documento subido!
                                      </p>
                                      <p style={{
                                        color: theme === 'dark' ? 'rgba(255, 255, 255, 0.7)' : 'rgba(31, 41, 55, 0.7)',
                                        fontSize: '0.85rem',
                                        marginBottom: '12px'
                                      }}>
                                        {documentoEstatusLegal?.name} ({((documentoEstatusLegal?.size || 0) / 1024 / 1024).toFixed(2)} MB)
                                      </p>
                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setDocumentoEstatusLegal(null);
                                        }}
                                        style={{
                                          background: 'rgba(239, 68, 68, 0.1)',
                                          border: '1px solid rgba(239, 68, 68, 0.3)',
                                          borderRadius: '6px',
                                          padding: '6px 12px',
                                          color: '#dc2626',
                                          cursor: 'pointer',
                                          fontSize: '0.8rem',
                                          fontWeight: '500'
                                        }}
                                      >
                                        Cambiar
                                      </button>
                                    </div>
                                  ) : (
                                    <div>
                                      <div style={{
                                        width: '50px',
                                        height: '50px',
                                        background: 'rgba(59, 130, 246, 0.2)',
                                        borderRadius: '50%',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        margin: '0 auto 12px'
                                      }}>
                                        <FileText size={24} color="#3b82f6" />
                                      </div>
                                      <p style={{
                                        color: theme === 'dark' ? '#fff' : '#1f2937',
                                        fontWeight: '600',
                                        fontSize: '1rem',
                                        marginBottom: '6px'
                                      }}>
                                        Subir documento de estatus legal
                                      </p>
                                      <p style={{
                                        color: theme === 'dark' ? 'rgba(255, 255, 255, 0.7)' : 'rgba(31, 41, 55, 0.7)',
                                        fontSize: '0.85rem',
                                        marginBottom: '12px'
                                      }}>
                                        Arrastra y suelta o haz clic para seleccionar
                                      </p>
                                      <p style={{
                                        color: theme === 'dark' ? '#9ca3af' : '#4b5563',
                                        fontSize: '0.75rem'
                                      }}>
                                        PDF, JPG, PNG, WEBP (Máx. 5MB)
                                      </p>
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </>
                    )}

                    {/* Horario Preferido - Solo mostrar si NO tiene solicitud pendiente */}
                    {!tieneSolicitudPendiente && (
                      <div style={{ marginTop: '32px', marginBottom: '24px', animation: 'scaleFade 1.2s ease-in-out' }}>
                        <label style={{
                          display: 'block',
                          marginBottom: '8px',
                          fontWeight: '600',
                          color: theme === 'dark' ? '#fff' : '#1f2937'
                        }}>
                          Horario Preferido *
                        </label>
                        <select
                          required
                          value={formData.idCurso || ''}
                          onChange={(e) => {
                            const selectedIdCurso = parseInt(e.target.value);
                            const selectedCurso = cuposDisponibles.find((c: any) => c.id_curso === selectedIdCurso);
                            setFormData({
                              ...formData,
                              idCurso: selectedIdCurso,
                              horarioPreferido: selectedCurso?.horario || ''
                            });
                          }}
                          style={{
                            width: '100%',
                            padding: '12px 16px',
                            border: '2px solid rgba(251, 191, 36, 0.2)',
                            borderRadius: '12px',
                            fontSize: '1rem',
                            transition: 'border-color 0.3s ease',
                            background: theme === 'dark' ? 'rgba(0, 0, 0, 0.4)' : '#ffffff',
                            color: theme === 'dark' ? '#fff' : '#1f2937'
                          }}
                          onFocus={(e) => (e.target as HTMLSelectElement).style.borderColor = '#fbbf24'}
                          onBlur={(e) => (e.target as HTMLSelectElement).style.borderColor = 'rgba(251, 191, 36, 0.2)'}
                        >
                          <option value="" disabled>Seleccionar horario y fecha</option>
                          {cuposDisponibles
                            .filter((c: any) => c.id_tipo_curso === tipoCursoId && c.cupos_totales > 0)
                            .map((c: any) => (
                              <option key={c.id_curso} value={c.id_curso}>
                                {c.horario.charAt(0).toUpperCase() + c.horario.slice(1)} - Inicio: {new Date(c.fecha_inicio).toLocaleDateString('es-EC')} ({c.cupos_totales} cupos)
                              </option>
                            ))
                          }
                        </select>

                        {/* Mostrar disponibilidad de cupos por horario */}
                        {formData.horarioPreferido && (
                          <div style={{ marginTop: '12px' }}>
                            {(() => {
                              const cuposHorario = cuposDisponibles.find(
                                (c: any) => c.id_curso === formData.idCurso
                              );

                              if (!cuposHorario || cuposHorario.cupos_totales === 0) {
                                return (
                                  <div style={{
                                    padding: '12px 16px',
                                    background: 'rgba(239, 68, 68, 0.1)',
                                    border: '1px solid rgba(239, 68, 68, 0.3)',
                                    borderRadius: '12px',
                                    color: '#ef4444',
                                    fontSize: '0.9rem',
                                    fontWeight: '600',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px'
                                  }}>
                                    <span style={{ fontSize: '1.2rem' }}>⚠️</span>
                                    No hay cupos disponibles para este horario. Por favor, selecciona otro horario o espera a que se abra un nuevo curso.
                                  </div>
                                );
                              }

                              return (
                                <div style={{
                                  padding: '12px 16px',
                                  background: 'rgba(16, 185, 129, 0.1)',
                                  border: '1px solid rgba(16, 185, 129, 0.3)',
                                  borderRadius: '12px',
                                  color: '#10b981',
                                  fontSize: '0.9rem',
                                  fontWeight: '600',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '8px'
                                }}>
                                  <span style={{ fontSize: '1.2rem' }}>✅</span>
                                  Cupos disponibles: {cuposHorario.cupos_totales}/{cuposHorario.capacidad_total}
                                </div>
                              );
                            })()}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Certificado Cosmetóloga - Solo Cosmiatría */}
                    {cursoKey === 'cosmiatria' && !tieneSolicitudPendiente && (<div style={{
                      background: 'rgba(251, 191, 36, 0.1)',
                      border: '1px solid rgba(251, 191, 36, 0.3)',
                      borderRadius: '16px',
                      padding: '24px',
                      marginTop: '24px'
                    }}>
                      <h4 style={{
                        fontSize: '1.2rem',
                        fontWeight: '700',
                        color: theme === 'dark' ? '#fff' : '#1f2937',
                        marginBottom: '20px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px'
                      }}>
                        <FileText size={24} color="#fbbf24" />
                        Certificado de Cosmetóloga
                      </h4>

                      <div style={{
                        background: 'rgba(251, 191, 36, 0.15)',
                        border: '1px solid rgba(251, 191, 36, 0.4)',
                        borderRadius: '12px',
                        padding: '16px',
                        marginBottom: '20px'
                      }}>
                        <p style={{
                          color: '#fbbf24',
                          fontSize: '0.95rem',
                          margin: 0,
                          fontWeight: '600'
                        }}>
                          📋 Requisito obligatorio para Cosmiatría
                        </p>
                        <p style={{
                          color: theme === 'dark' ? 'rgba(255, 255, 255, 0.8)' : 'rgba(31, 41, 55, 0.8)',
                          fontSize: '0.85rem',
                          margin: '12px 0 0 0'
                        }}>
                          Debes adjuntar tu certificado de cosmetóloga.
                        </p>
                      </div>

                      <div
                        onDragEnter={handleDrag}
                        onDragLeave={handleDrag}
                        onDragOver={handleDrag}
                        onDrop={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          if (isBlocked) return;
                          setDragActive(false);
                          if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                            handleCertificadoCosmetologiaUpload(e.dataTransfer.files[0]);
                          }
                        }}
                        style={{
                          border: `2px dashed ${dragActive || certificadoCosmetologia ? '#fbbf24' : 'rgba(251, 191, 36, 0.3)'}`,
                          borderRadius: '12px',
                          padding: '20px',
                          textAlign: 'center',
                          background: dragActive ? 'rgba(251, 191, 36, 0.1)' : (theme === 'dark' ? 'rgba(0, 0, 0, 0.4)' : 'rgba(255, 255, 255, 0.9)'),
                          transition: 'all 0.3s ease',
                          cursor: 'pointer'
                        }}
                        onClick={() => document.getElementById('certificadoCosmetologiaInput')?.click()}
                      >
                        <input
                          id="certificadoCosmetologiaInput"
                          type="file"
                          accept=".pdf,image/jpeg,image/png,image/webp"
                          onChange={(e) => handleCertificadoCosmetologiaUpload(e.target.files?.[0] || null)}
                          style={{ display: 'none' }}
                        />

                        {certificadoCosmetologia ? (
                          <div>
                            <div style={{
                              width: '50px',
                              height: '50px',
                              background: 'linear-gradient(135deg, #10b981, #059669)',
                              borderRadius: '50%',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              margin: '0 auto 12px'
                            }}>
                              <CheckCircle size={24} color="#fff" />
                            </div>
                            <p style={{
                              color: '#10b981',
                              fontWeight: '600',
                              fontSize: '1rem',
                              marginBottom: '6px'
                            }}>
                              ¡Certificado subido!
                            </p>
                            <p style={{
                              color: theme === 'dark' ? 'rgba(255, 255, 255, 0.7)' : 'rgba(31, 41, 55, 0.7)',
                              fontSize: '0.85rem',
                              marginBottom: '12px'
                            }}>
                              {certificadoCosmetologia.name} ({((certificadoCosmetologia.size || 0) / 1024 / 1024).toFixed(2)} MB)
                            </p>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setCertificadoCosmetologia(null);
                              }}
                              style={{
                                background: 'rgba(239, 68, 68, 0.1)',
                                border: '1px solid rgba(239, 68, 68, 0.3)',
                                borderRadius: '6px',
                                padding: '6px 12px',
                                color: '#dc2626',
                                cursor: 'pointer',
                                fontSize: '0.8rem',
                                fontWeight: '500'
                              }}
                            >
                              Cambiar
                            </button>
                          </div>
                        ) : (
                          <div>
                            <div style={{
                              width: '50px',
                              height: '50px',
                              background: 'rgba(251, 191, 36, 0.2)',
                              borderRadius: '50%',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              margin: '0 auto 12px'
                            }}>
                              <FileText size={24} color="#fbbf24" />
                            </div>
                            <p style={{
                              color: theme === 'dark' ? '#fff' : '#1f2937',
                              fontWeight: '600',
                              fontSize: '1rem',
                              marginBottom: '6px'
                            }}>
                              Subir Certificado de Cosmetóloga
                            </p>
                            <p style={{
                              color: theme === 'dark' ? 'rgba(255, 255, 255, 0.7)' : 'rgba(31, 41, 55, 0.7)',
                              fontSize: '0.85rem',
                              marginBottom: '12px'
                            }}>
                              Arrastra y suelta o haz clic
                            </p>
                            <p style={{
                              color: theme === 'dark' ? '#9ca3af' : '#4b5563',
                              fontSize: '0.75rem'
                            }}>
                              PDF, JPG, PNG, WEBP (Máx. 5MB)
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                    )}


                  </div>

                  {/* Métodos de pago - Solo mostrar si NO tiene solicitud pendiente */}
                  {!tieneSolicitudPendiente && (
                    <div style={{
                      background: theme === 'dark'
                        ? 'linear-gradient(135deg, rgba(0,0,0,0.9), rgba(26,26,26,0.9))'
                        : 'rgba(255, 255, 255, 0.97)',
                      borderRadius: '24px',
                      padding: '32px',
                      marginBottom: '32px',
                      backdropFilter: 'blur(20px)',
                      border: '1px solid rgba(251, 191, 36, 0.2)',
                      boxShadow: '0 20px 50px rgba(0, 0, 0, 0.5)'
                    }}>
                      {/* MÉTODOS DE PAGO - Solo mostrar si NO tiene solicitud pendiente */}
                      {!tieneSolicitudPendiente && (
                        <>
                          <h3 className="section-title" style={{
                            fontSize: '1.4rem',
                            fontWeight: '700',
                            color: theme === 'dark' ? '#fff' : '#1f2937',
                            marginBottom: '24px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px'
                          }}>
                            <CreditCard size={24} color="#fbbf24" />
                            Método de Pago
                          </h3>

                          <div className="payment-methods" style={{
                            display: 'grid',
                            gridTemplateColumns: '1fr',
                            gap: '16px',
                            marginBottom: '24px'
                          }}>
                            <PaymentCard
                              title="Transferencia Bancaria"
                              icon={<QrCode size={24} />}
                              description="Transfiere directamente a nuestra cuenta bancaria"
                              isSelected={selectedPayment === 'transferencia'}
                              onClick={() => setSelectedPayment('transferencia')}
                            />

                            <PaymentCard
                              title="Efectivo"
                              icon={<CreditCard size={24} />}
                              description="Pago en efectivo en oficina. Sube el comprobante/factura entregado."
                              isSelected={selectedPayment === 'efectivo'}
                              onClick={() => setSelectedPayment('efectivo')}
                            />
                          </div>



                          {/* Contenido específico según método seleccionado */}
                          {selectedPayment === 'transferencia' && (
                            <div style={{
                              padding: '24px',
                              background: 'rgba(251, 191, 36, 0.1)',
                              borderRadius: '16px',
                              border: '1px solid rgba(251, 191, 36, 0.3)'
                            }}>
                              <h4 style={{
                                color: '#b45309',
                                fontSize: '1.2rem',
                                fontWeight: '700',
                                marginBottom: '16px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px'
                              }}>
                                <QrCode size={20} />
                                Datos para Transferencia
                              </h4>

                              {/* QR Code placeholder */}
                              <div style={{
                                display: 'flex',
                                gap: '24px',
                                marginBottom: '24px'
                              }}>
                                <div style={{
                                  width: '220px',
                                  height: '220px',
                                  background: theme === 'dark' ? 'rgba(0, 0, 0, 0.6)' : '#fef3c7',
                                  borderRadius: '12px',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  boxShadow: '0 8px 24px rgba(0, 0, 0, 0.4)',
                                  flexShrink: 0,
                                  overflow: 'hidden'
                                }}>
                                  {bancoComprobante === 'pichincha' ? (
                                    <img
                                      src="https://res.cloudinary.com/di090ggjn/image/upload/v1764906337/sutkifytxyh6co1radby.jpg"
                                      alt="QR Banco Pichincha"
                                      style={{
                                        width: '100%',
                                        height: '100%',
                                        objectFit: 'cover'
                                      }}
                                    />
                                  ) : bancoComprobante === 'pacifico' ? (
                                    <img
                                      src="https://res.cloudinary.com/di090ggjn/image/upload/v1764906371/wbohej8ytmanqzkrhkbv.jpg"
                                      alt="QR Banco del Pacífico"
                                      style={{
                                        width: '100%',
                                        height: '100%',
                                        objectFit: 'cover'
                                      }}
                                    />
                                  ) : (
                                    <QrCode size={100} color={theme === 'dark' ? '#f9fafb' : '#1f2937'} />
                                  )}
                                </div>
                                <div style={{ flex: 1 }}>
                                  <div style={{
                                    background: theme === 'dark' ? 'rgba(0, 0, 0, 0.6)' : 'rgba(255, 255, 255, 0.95)',
                                    padding: '16px',
                                    borderRadius: '12px',
                                    marginBottom: '12px'
                                  }}>
                                    <div style={{ marginBottom: '8px' }}>
                                      <strong style={{ color: theme === 'dark' ? '#fff' : '#1f2937' }}>Banco:</strong>
                                      <span style={{ color: theme === 'dark' ? 'rgba(255, 255, 255, 0.7)' : 'rgba(31, 41, 55, 0.7)', marginLeft: '8px' }}>
                                        {bancoComprobante === 'pichincha' ? 'Banco Pichincha' :
                                          bancoComprobante === 'pacifico' ? 'Banco del Pacífico' :
                                            bancoComprobante === 'produbanco' ? 'Produbanco' :
                                              'Selecciona un banco'}
                                      </span>
                                    </div>
                                    <div style={{ marginBottom: '8px' }}>
                                      <strong style={{ color: theme === 'dark' ? '#fff' : '#1f2937' }}>Cuenta:</strong>
                                      <span style={{ color: theme === 'dark' ? 'rgba(255, 255, 255, 0.7)' : 'rgba(31, 41, 55, 0.7)', marginLeft: '8px' }}>
                                        {bancoComprobante === 'pichincha' ? '2203141379 (Cuenta de ahorros)' :
                                          bancoComprobante === 'pacifico' ? '00000-000 (Cuenta corriente)' :
                                            bancoComprobante === 'produbanco' ? '12060263933 (Cuenta de ahorros)' :
                                              'Selecciona un banco primero'}
                                      </span>
                                    </div>
                                    <div style={{ marginBottom: '8px' }}>
                                      <strong style={{ color: theme === 'dark' ? '#fff' : '#1f2937' }}>Titular:</strong>
                                      <span style={{ color: theme === 'dark' ? 'rgba(255, 255, 255, 0.7)' : 'rgba(31, 41, 55, 0.7)', marginLeft: '8px' }}>
                                        {bancoComprobante === 'produbanco' ? 'RICARDO XAVIER PILAGUANO' : 'JÉSSICA VELEZ'}
                                      </span>
                                    </div>
                                    <div>
                                      <strong style={{ color: theme === 'dark' ? '#fff' : '#1f2937' }}>Monto:</strong>
                                      <span style={{
                                        color: '#fbbf24',
                                        marginLeft: '8px',
                                        fontWeight: '700',
                                        fontSize: '1.1rem'
                                      }}>
                                        ${curso.precio.toLocaleString()}
                                      </span>
                                    </div>
                                  </div>
                                  <p style={{
                                    color: theme === 'dark' ? 'rgba(255, 255, 255, 0.7)' : 'rgba(31, 41, 55, 0.7)',
                                    fontSize: '0.9rem',
                                    margin: 0,
                                    fontStyle: 'italic'
                                  }}>
                                    Escanea el QR o usa los datos bancarios para realizar la transferencia
                                  </p>
                                </div>
                              </div>

                              {/* Información del comprobante */}
                              <div style={{ marginBottom: '24px' }}>
                                <h5 style={{
                                  color: '#b45309',
                                  fontSize: '1.1rem',
                                  fontWeight: '600',
                                  marginBottom: '16px',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '8px'
                                }}>
                                  <FileText size={18} />
                                  Datos del Comprobante *
                                </h5>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                                  {/* Banco */}
                                  <div>
                                    <label style={{
                                      display: 'block',
                                      color: theme === 'dark' ? 'rgba(255, 255, 255, 0.8)' : 'rgba(31, 41, 55, 0.8)',
                                      fontSize: '0.9rem',
                                      marginBottom: '8px',
                                      fontWeight: '500'
                                    }}>
                                      Banco *
                                    </label>
                                    <select
                                      value={bancoComprobante}
                                      onChange={(e) => setBancoComprobante(e.target.value)}
                                      required
                                      style={{
                                        width: '100%',
                                        padding: '12px 16px',
                                        borderRadius: '12px',
                                        border: '1px solid rgba(255, 255, 255, 0.2)',
                                        background: theme === 'dark' ? 'rgba(0, 0, 0, 0.3)' : '#ffffff',
                                        color: theme === 'dark' ? '#fff' : '#1f2937',
                                        fontSize: '1rem'
                                      }}
                                    >
                                      <option value="">Selecciona el banco</option>
                                      <option value="pichincha">Banco Pichincha</option>
                                      <option value="pacifico">Banco del Pacífico</option>
                                      <option value="produbanco">Produbanco</option>
                                    </select>
                                  </div>

                                  {/* Fecha de transferencia */}
                                  <div>
                                    <label style={{
                                      display: 'block',
                                      color: theme === 'dark' ? 'rgba(255, 255, 255, 0.8)' : 'rgba(31, 41, 55, 0.8)',
                                      fontSize: '0.9rem',
                                      marginBottom: '8px',
                                      fontWeight: '500'
                                    }}>
                                      Fecha de transferencia *
                                    </label>
                                    <input
                                      type="date"
                                      value={fechaTransferencia}
                                      onChange={(e) => setFechaTransferencia(e.target.value)}
                                      required
                                      min={(() => {
                                        const now = new Date();
                                        const ecuadorDate = new Date(now.toLocaleString('en-US', { timeZone: 'America/Guayaquil' }));
                                        const year = ecuadorDate.getFullYear();
                                        const month = String(ecuadorDate.getMonth() + 1).padStart(2, '0');
                                        const day = String(ecuadorDate.getDate()).padStart(2, '0');
                                        return `${year}-${month}-${day}`;
                                      })()}
                                      max={(() => {
                                        const now = new Date();
                                        const ecuadorDate = new Date(now.toLocaleString('en-US', { timeZone: 'America/Guayaquil' }));
                                        const year = ecuadorDate.getFullYear();
                                        const month = String(ecuadorDate.getMonth() + 1).padStart(2, '0');
                                        const day = String(ecuadorDate.getDate()).padStart(2, '0');
                                        return `${year}-${month}-${day}`;
                                      })()}
                                      readOnly
                                      style={{
                                        width: '100%',
                                        padding: '12px 16px',
                                        borderRadius: '12px',
                                        border: '1px solid rgba(255, 255, 255, 0.2)',
                                        background: theme === 'dark' ? 'rgba(0, 0, 0, 0.3)' : '#ffffff',
                                        color: theme === 'dark' ? '#ffffff !important' : '#1f2937',
                                        fontSize: '1rem',
                                        cursor: 'not-allowed',
                                        opacity: 1,
                                        WebkitTextFillColor: theme === 'dark' ? '#ffffff' : '#1f2937',
                                        colorScheme: theme === 'dark' ? 'dark' : 'light'
                                      }}
                                    />
                                    <p style={{
                                      fontSize: '0.75rem',
                                      color: theme === 'dark' ? 'rgba(255, 255, 255, 0.5)' : 'rgba(31, 41, 55, 0.5)',
                                      marginTop: '4px',
                                      fontStyle: 'italic'
                                    }}>
                                      La fecha se establece automáticamente al día de hoy
                                    </p>
                                  </div>
                                </div>

                                {/* Número de comprobante */}
                                <div>
                                  <label style={{
                                    display: 'block',
                                    color: theme === 'dark' ? 'rgba(255, 255, 255, 0.8)' : 'rgba(31, 41, 55, 0.8)',
                                    fontSize: '0.9rem',
                                    marginBottom: '8px',
                                    fontWeight: '500'
                                  }}>
                                    Número de comprobante *
                                  </label>
                                  <input
                                    type="text"
                                    value={numeroComprobante}
                                    onChange={(e) => {
                                      // Solo permitir números
                                      const value = e.target.value.replace(/\D/g, '');
                                      setNumeroComprobante(value);
                                    }}
                                    onKeyPress={(e) => {
                                      // Prevenir entrada de caracteres no numéricos
                                      if (!/[0-9]/.test(e.key)) {
                                        e.preventDefault();
                                      }
                                    }}
                                    placeholder="Ej: 123456789"
                                    required
                                    style={{
                                      width: '100%',
                                      padding: '12px 16px',
                                      borderRadius: '12px',
                                      border: '1px solid rgba(255, 255, 255, 0.2)',
                                      background: theme === 'dark' ? 'rgba(0, 0, 0, 0.3)' : '#ffffff',
                                      color: theme === 'dark' ? '#fff' : '#1f2937',
                                      fontSize: '1rem',
                                      fontFamily: 'monospace'
                                    }}
                                  />
                                  <p style={{
                                    color: theme === 'dark' ? 'rgba(255, 255, 255, 0.6)' : 'rgba(55, 65, 81, 0.7)',
                                    fontSize: '0.8rem',
                                    margin: '8px 0 0 0',
                                    lineHeight: 1.4
                                  }}>
                                    Ingresa el número de referencia/transacción que aparece en tu comprobante bancario.
                                  </p>
                                </div>
                              </div>

                              {/* Subida de comprobante */}
                              <div>
                                <h5 style={{
                                  color: '#b45309',
                                  fontSize: '1.1rem',
                                  fontWeight: '600',
                                  marginBottom: '16px',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '8px'
                                }}>
                                  <Upload size={18} />
                                  Subir Comprobante de Pago *
                                </h5>

                                <div
                                  className="upload-area"
                                  onDragEnter={handleDrag}
                                  onDragLeave={handleDrag}
                                  onDragOver={handleDrag}
                                  onDrop={handleDrop}
                                  style={{
                                    border: `2px dashed ${dragActive || uploadedFile ? '#fbbf24' : 'rgba(251, 191, 36, 0.3)'}`,
                                    borderRadius: '16px',
                                    padding: '32px',
                                    textAlign: 'center',
                                    background: dragActive
                                      ? 'rgba(251, 191, 36, 0.1)'
                                      : (theme === 'dark' ? 'rgba(0, 0, 0, 0.4)' : 'rgba(255, 255, 255, 0.92)'),
                                    transition: 'all 0.3s ease',
                                    cursor: 'pointer',
                                    position: 'relative'
                                  }}
                                  onClick={() => document.getElementById('fileInput')?.click()}
                                >
                                  <input
                                    id="fileInput"
                                    type="file"
                                    accept=".pdf,image/jpeg,image/png,image/webp"
                                    onChange={(e) => handleFileUpload(e.target.files?.[0] || null)}
                                    style={{ display: 'none' }}
                                  />

                                  {uploadedFile ? (
                                    <div>
                                      <div style={{
                                        width: '60px',
                                        height: '60px',
                                        background: 'linear-gradient(135deg, #10b981, #059669)',
                                        borderRadius: '50%',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        margin: '0 auto 16px'
                                      }}>
                                        <CheckCircle size={30} color="#fff" />
                                      </div>
                                      <p style={{
                                        color: '#10b981',
                                        fontWeight: '600',
                                        fontSize: '1.1rem',
                                        marginBottom: '8px'
                                      }}>
                                        ¡Archivo subido correctamente!
                                      </p>
                                      <p style={{
                                        color: theme === 'dark' ? 'rgba(255, 255, 255, 0.7)' : 'rgba(31, 41, 55, 0.7)',
                                        fontSize: '0.9rem',
                                        marginBottom: '16px'
                                      }}>
                                        {uploadedFile?.name} ({((uploadedFile?.size || 0) / 1024 / 1024).toFixed(2)} MB)
                                      </p>
                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setUploadedFile(null);
                                        }}
                                        style={{
                                          background: 'rgba(239, 68, 68, 0.1)',
                                          border: '1px solid rgba(239, 68, 68, 0.3)',
                                          borderRadius: '8px',
                                          padding: '8px 16px',
                                          color: '#dc2626',
                                          cursor: 'pointer',
                                          fontSize: '0.9rem',
                                          fontWeight: '500'
                                        }}
                                      >
                                        Cambiar archivo
                                      </button>
                                    </div>
                                  ) : (
                                    <div>
                                      <div style={{
                                        width: '60px',
                                        height: '60px',
                                        background: 'rgba(251, 191, 36, 0.2)',
                                        borderRadius: '50%',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        margin: '0 auto 16px'
                                      }}>
                                        <FileImage size={30} color="#fbbf24" />
                                      </div>
                                      <p style={{
                                        color: theme === 'dark' ? '#fff' : '#1f2937',
                                        fontWeight: '600',
                                        fontSize: '1.1rem',
                                        marginBottom: '8px'
                                      }}>
                                        Arrastra y suelta tu comprobante aquí
                                      </p>
                                      <p style={{
                                        color: theme === 'dark' ? 'rgba(255, 255, 255, 0.7)' : 'rgba(31, 41, 55, 0.7)',
                                        fontSize: '0.9rem',
                                        marginBottom: '16px'
                                      }}>
                                        o haz clic para seleccionar archivo
                                      </p>
                                      <p style={{
                                        color: theme === 'dark' ? '#9ca3af' : '#4b5563',
                                        fontSize: '0.8rem'
                                      }}>
                                        Formatos: PDF, JPG, PNG, WEBP (Máx. 5MB)
                                      </p>
                                    </div>
                                  )}
                                </div>

                                <div style={{
                                  background: 'rgba(59, 130, 246, 0.1)',
                                  border: '1px solid rgba(59, 130, 246, 0.3)',
                                  borderRadius: '12px',
                                  padding: '16px',
                                  marginTop: '16px'
                                }}>
                                  <div style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                    marginBottom: '8px'
                                  }}>
                                    <AlertCircle size={18} color="#3b82f6" />
                                    <span style={{
                                      color: '#3b82f6',
                                      fontWeight: '600',
                                      fontSize: '0.9rem'
                                    }}>
                                      Importante
                                    </span>
                                  </div>
                                  <p style={{
                                    color: theme === 'dark' ? 'rgba(255, 255, 255, 0.7)' : 'rgba(31, 41, 55, 0.7)',
                                    fontSize: '0.85rem',
                                    margin: 0,
                                    lineHeight: 1.4
                                  }}>
                                    Asegúrate de que el comprobante sea legible y muestre claramente el monto,
                                    fecha y datos de la transferencia. Revisaremos tu pago en máximo 24 horas.
                                  </p>
                                </div>
                              </div>
                            </div>
                          )}

                          {selectedPayment === 'efectivo' && (
                            <div style={{
                              padding: '24px',
                              background: 'rgba(251, 191, 36, 0.1)',
                              borderRadius: '16px',
                              border: '1px solid rgba(251, 191, 36, 0.3)'
                            }}>
                              <h4 style={{
                                color: '#b45309',
                                fontSize: '1.2rem',
                                fontWeight: '700',
                                marginBottom: '16px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px'
                              }}>
                                <Upload size={20} />
                                Pago en Efectivo
                              </h4>
                              <p style={{
                                color: theme === 'dark' ? 'rgba(255, 255, 255, 0.8)' : 'rgba(31, 41, 55, 0.8)',
                                marginBottom: '16px',
                                lineHeight: 1.6
                              }}>
                                Realiza el pago en efectivo en nuestras oficinas. Te entregaremos un comprobante o factura.
                                Por favor, súbelo a continuación para validar tu solicitud.
                              </p>

                              {/* Subida de comprobante (Efectivo) */}
                              <div>
                                <h5 style={{
                                  color: '#b45309',
                                  fontSize: '1.1rem',
                                  fontWeight: '600',
                                  marginBottom: '16px',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '8px'
                                }}>
                                  <Upload size={18} />
                                  Subir Comprobante/Factura *
                                </h5>

                                <div
                                  onDragEnter={handleDrag}
                                  onDragLeave={handleDrag}
                                  onDragOver={handleDrag}
                                  onDrop={handleDrop}
                                  style={{
                                    border: `2px dashed ${dragActive || uploadedFile ? '#fbbf24' : 'rgba(251, 191, 36, 0.3)'}`,
                                    borderRadius: '16px',
                                    padding: '32px',
                                    textAlign: 'center',
                                    background: dragActive
                                      ? 'rgba(251, 191, 36, 0.1)'
                                      : (theme === 'dark' ? 'rgba(0, 0, 0, 0.4)' : 'rgba(255, 255, 255, 0.92)'),
                                    transition: 'all 0.3s ease',
                                    cursor: 'pointer',
                                    position: 'relative'
                                  }}
                                  onClick={() => document.getElementById('fileInputEfectivo')?.click()}
                                >
                                  <input
                                    id="fileInputEfectivo"
                                    type="file"
                                    accept=".pdf,image/jpeg,image/png,image/webp"
                                    onChange={(e) => handleFileUpload((e.target as HTMLInputElement).files?.[0] || null)}
                                    style={{ display: 'none' }}
                                  />

                                  {uploadedFile ? (
                                    <div>
                                      <div style={{
                                        width: '60px',
                                        height: '60px',
                                        background: 'linear-gradient(135deg, #10b981, #059669)',
                                        borderRadius: '50%',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        margin: '0 auto 16px'
                                      }}>
                                        <CheckCircle size={30} color="#fff" />
                                      </div>
                                      <p style={{
                                        color: '#10b981',
                                        fontWeight: '600',
                                        fontSize: '1.1rem',
                                        marginBottom: '8px'
                                      }}>
                                        ¡Archivo subido correctamente!
                                      </p>
                                      <p style={{
                                        color: theme === 'dark' ? 'rgba(255, 255, 255, 0.7)' : 'rgba(31, 41, 55, 0.7)',
                                        fontSize: '0.9rem',
                                        marginBottom: '16px'
                                      }}>
                                        {uploadedFile?.name} ({((uploadedFile?.size || 0) / 1024 / 1024).toFixed(2)} MB)
                                      </p>
                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setUploadedFile(null);
                                        }}
                                        style={{
                                          background: 'rgba(239, 68, 68, 0.1)',
                                          border: '1px solid rgba(239, 68, 68, 0.3)',
                                          borderRadius: '8px',
                                          padding: '8px 16px',
                                          color: '#dc2626',
                                          cursor: 'pointer',
                                          fontSize: '0.9rem',
                                          fontWeight: '500'
                                        }}
                                      >
                                        Cambiar archivo
                                      </button>
                                    </div>
                                  ) : (
                                    <div>
                                      <div style={{
                                        width: '60px',
                                        height: '60px',
                                        background: 'rgba(251, 191, 36, 0.2)',
                                        borderRadius: '50%',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        margin: '0 auto 16px'
                                      }}>
                                        <FileImage size={30} color="#fbbf24" />
                                      </div>
                                      <p style={{
                                        color: theme === 'dark' ? '#fff' : '#1f2937',
                                        fontWeight: '600',
                                        fontSize: '1.1rem',
                                        marginBottom: '8px'
                                      }}>
                                        Arrastra y suelta tu comprobante aquí
                                      </p>
                                      <p style={{
                                        color: theme === 'dark' ? 'rgba(255, 255, 255, 0.7)' : 'rgba(31, 41, 55, 0.7)',
                                        fontSize: '0.9rem',
                                        marginBottom: '16px'
                                      }}>
                                        o haz clic para seleccionar archivo
                                      </p>
                                      <p style={{
                                        color: theme === 'dark' ? '#9ca3af' : '#4b5563',
                                        fontSize: '0.8rem'
                                      }}>
                                        Formatos: PDF, JPG, PNG, WEBP (Máx. 5MB)
                                      </p>
                                    </div>
                                  )}
                                </div>
                              </div>

                              {/* Campos adicionales para efectivo */}
                              <div style={{
                                marginTop: '32px',
                                padding: '24px',
                                background: 'rgba(180, 83, 9, 0.1)',
                                borderRadius: '16px',
                                border: '1px solid rgba(180, 83, 9, 0.3)'
                              }}>
                                <h5 style={{
                                  color: '#b45309',
                                  fontSize: '1.1rem',
                                  fontWeight: '700',
                                  marginBottom: '20px',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '8px'
                                }}>
                                  <FileText size={20} />
                                  Información del Comprobante
                                </h5>

                                <div style={{
                                  display: 'flex',
                                  flexDirection: 'column',
                                  gap: '16px'
                                }}>
                                  {/* Número de comprobante/factura */}
                                  <div>
                                    <label style={{
                                      display: 'block',
                                      marginBottom: '8px',
                                      color: '#b45309',
                                      fontWeight: 600,
                                      fontSize: '0.95rem'
                                    }}>
                                      Número de Comprobante/Factura *
                                    </label>
                                    <input
                                      type="text"
                                      value={numeroComprobanteEfectivo}
                                      onChange={(e) => {
                                        // Solo permitir números
                                        const value = e.target.value.replace(/\D/g, '');
                                        setNumeroComprobanteEfectivo(value);
                                      }}
                                      onKeyPress={(e) => {
                                        // Prevenir entrada de caracteres no numéricos
                                        if (!/[0-9]/.test(e.key)) {
                                          e.preventDefault();
                                        }
                                      }}
                                      placeholder="Ej: 123456789"
                                      required
                                      style={{
                                        width: '100%',
                                        padding: '14px 16px',
                                        borderRadius: '12px',
                                        border: '1.5px solid rgba(251, 191, 36, 0.3)',
                                        background: theme === 'dark' ? 'rgba(0,0,0,0.4)' : 'rgba(255,255,255,0.9)',
                                        color: theme === 'dark' ? '#fff' : '#1f2937',
                                        fontSize: '1rem',
                                        fontFamily: 'Montserrat, sans-serif',
                                        transition: 'all 0.3s ease',
                                        outline: 'none'
                                      }}
                                      onFocus={(e) => e.target.style.borderColor = '#fbbf24'}
                                      onBlur={(e) => e.target.style.borderColor = 'rgba(251, 191, 36, 0.3)'}
                                    />
                                  </div>

                                  {/* Recibido por */}
                                  <div>
                                    <label style={{
                                      display: 'block',
                                      marginBottom: '8px',
                                      color: '#b45309',
                                      fontWeight: 600,
                                      fontSize: '0.95rem'
                                    }}>
                                      Recibido por *
                                    </label>
                                    <input
                                      type="text"
                                      value={recibidoPor}
                                      onChange={(e) => setRecibidoPor(e.target.value.toUpperCase())}
                                      placeholder="Nombre de quien recibió el pago"
                                      required
                                      style={{
                                        width: '100%',
                                        padding: '14px 16px',
                                        borderRadius: '12px',
                                        border: '1.5px solid rgba(251, 191, 36, 0.3)',
                                        background: theme === 'dark' ? 'rgba(0,0,0,0.4)' : 'rgba(255,255,255,0.9)',
                                        color: theme === 'dark' ? '#fff' : '#1f2937',
                                        fontSize: '1rem',
                                        fontFamily: 'Montserrat, sans-serif',
                                        transition: 'all 0.3s ease',
                                        outline: 'none'
                                      }}
                                      onFocus={(e) => e.target.style.borderColor = '#fbbf24'}
                                      onBlur={(e) => e.target.style.borderColor = 'rgba(251, 191, 36, 0.3)'}
                                    />
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Alerta de validación al enviar */}
                          {submitAlert && (
                            <div style={{
                              background: theme === 'dark'
                                ? (submitAlert.type === 'error' ? 'rgba(239, 68, 68, 0.1)' : submitAlert.type === 'success' ? 'rgba(16,185,129,0.1)' : 'rgba(59,130,246,0.1)')
                                : (submitAlert.type === 'error' ? 'rgba(254, 202, 202, 0.9)' : submitAlert.type === 'success' ? 'rgba(167,243,208,0.9)' : 'rgba(191,219,254,0.9)'),
                              border: '1px solid rgba(251, 191, 36, 0.3)',
                              borderRadius: 12,
                              padding: '20px 24px',
                              marginBottom: 24,
                              animation: alertAnimatingOut
                                ? 'alertFadeOut 0.35s ease-in forwards'
                                : 'alertSlideIn 0.6s cubic-bezier(0.22, 0.61, 0.36, 1)',
                              maxWidth: '100%',
                              boxShadow: '0 8px 32px rgba(0,0,0,0.3)'
                            }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16 }}>
                                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, flex: 1 }}>
                                  <AlertCircle
                                    size={24}
                                    color={submitAlert.type === 'error' ? '#ef4444' : submitAlert.type === 'success' ? '#10b981' : '#3b82f6'}
                                    style={{ marginTop: '2px', flexShrink: 0 }}
                                  />
                                  <div style={{
                                    color: theme === 'dark' ? 'rgba(255,255,255,0.95)' : 'rgba(31, 41, 55, 0.95)',
                                    fontSize: '0.95rem',
                                    fontWeight: '500',
                                    lineHeight: 1.6,
                                    whiteSpace: 'pre-line',
                                    flex: 1
                                  }}>
                                    {submitAlert.text}
                                  </div>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => setSubmitAlert(null)}
                                  style={{
                                    background: theme === 'dark' ? 'rgba(255,255,255,0.15)' : 'rgba(31, 41, 55, 0.15)',
                                    border: theme === 'dark' ? '1px solid rgba(255,255,255,0.3)' : '1px solid rgba(31, 41, 55, 0.3)',
                                    color: theme === 'dark' ? 'rgba(255,255,255,0.9)' : 'rgba(31, 41, 55, 0.9)',
                                    borderRadius: 8,
                                    padding: '10px 14px',
                                    fontWeight: 600,
                                    cursor: 'pointer',
                                    fontSize: '0.9rem',
                                    alignSelf: 'flex-start',
                                    flexShrink: 0,
                                    transition: 'all 0.2s ease'
                                  }}
                                  onMouseEnter={(e) => (e.target as HTMLButtonElement).style.background = theme === 'dark' ? 'rgba(255,255,255,0.25)' : 'rgba(31, 41, 55, 0.25)'}
                                  onMouseLeave={(e) => (e.target as HTMLButtonElement).style.background = theme === 'dark' ? 'rgba(255,255,255,0.15)' : 'rgba(31, 41, 55, 0.15)'}
                                >
                                  Entendido
                                </button>
                              </div>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  )}

                  {/* Botón de envío - Deshabilitado si tiene solicitud pendiente */}
                  <button
                    type="submit"
                    disabled={isBlocked || tieneSolicitudPendiente || isSubmitting}
                    className="submit-button"
                    style={{
                      width: '100%',
                      background: (isBlocked || tieneSolicitudPendiente || isSubmitting) ? 'rgba(156,163,175,0.4)' : 'linear-gradient(135deg, #fbbf24, #f59e0b)', color: (isBlocked || tieneSolicitudPendiente || isSubmitting) ? 'rgba(255,255,255,0.5)' : '#000',
                      padding: '16px 24px',
                      borderRadius: '16px',
                      border: 'none',
                      fontWeight: 800,
                      fontSize: '1.1rem',
                      cursor: (isBlocked || tieneSolicitudPendiente || isSubmitting) ? 'not-allowed' : 'pointer',
                      boxShadow: (isBlocked || tieneSolicitudPendiente || isSubmitting) ? 'none' : '0 12px 40px rgba(251, 191, 36, 0.25)',
                      opacity: (isBlocked || tieneSolicitudPendiente || isSubmitting) ? 0.6 : 1,
                      transition: 'all 0.3s ease'
                    }}
                    title={tieneSolicitudPendiente ? 'No puedes inscribirte mientras tengas una solicitud pendiente' : ''}
                  >
                    {tieneSolicitudPendiente ? '🔒 Inscripción Bloqueada' : isSubmitting ? '⏳ Enviando solicitud...' : 'Confirmar Inscripción'}                  </button>

                  <p style={{
                    textAlign: 'center',
                    color: 'rgba(255, 255, 255, 0.6)',
                    fontSize: '0.9rem',
                    marginTop: '20px',
                    lineHeight: 1.5
                  }}>
                    Al proceder con el pago, aceptas nuestros términos y condiciones.
                    <br />
                    Recibirás un email de confirmación una vez procesado el pago.
                  </p>
                </fieldset>
              </form>
            </div>
          </div>
        </div>

        <Footer />
      </div>

      {/* Modal de Promociones - se muestra después de crear la solicitud exitosamente */}
      <ModalPromocion
        isOpen={showPromoModal}
        onClose={() => { }} // No permitir cerrar con X, debe decidir
        promociones={promocionesDisponibles}
        onAceptar={handleAceptarPromocion}
        onRechazar={handleRechazarPromocion}
        loading={loadingPromo}
      />
    </>
  );
};

export default Pago;