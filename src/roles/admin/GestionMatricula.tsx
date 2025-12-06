import { useState, useEffect, type CSSProperties } from 'react';
import { createPortal } from 'react-dom';
import {
  Search, GraduationCap, Eye, X, Check, XCircle, Download, FileText, IdCard, Clock, CheckCircle2, AlertCircle, ChevronLeft, ChevronRight, Lock, Sheet, RefreshCcw
} from 'lucide-react';
import { showToast } from '../../config/toastConfig';
import { StyledSelect } from '../../components/StyledSelect';
import { RedColorPalette } from '../../utils/colorMapper';
import { useBreakpoints } from '../../hooks/useMediaQuery';
import { useSocket } from '../../hooks/useSocket';
import LoadingModal from '../../components/LoadingModal';
import AdminSectionHeader from '../../components/AdminSectionHeader';
import '../../styles/responsive.css';
import '../../utils/modalScrollHelper';
type Solicitud = {
  id_solicitud: number;
  codigo_solicitud: string;
  identificacion_solicitante?: string;
  nombre_solicitante: string;
  apellido_solicitante: string;
  telefono_solicitante?: string;
  email_solicitante: string;
  fecha_nacimiento_solicitante?: string | null;
  direccion_solicitante?: string | null;
  genero_solicitante?: string | null;
  horario_preferido?: 'matutino' | 'vespertino';
  id_curso: number;
  monto_matricula: number;
  metodo_pago: 'transferencia' | 'efectivo' | 'payphone';
  numero_comprobante?: string;
  banco_comprobante?: string;
  fecha_transferencia?: string;
  id_estudiante_existente?: number | null;
  estado: 'pendiente' | 'aprobado' | 'rechazado' | 'observaciones';
  fecha_solicitud: string;
  comprobante_pago_url?: string;
  documento_identificacion_url?: string;
  documento_estatus_legal_url?: string;
  certificado_cosmetologia_url?: string;
};

const API_BASE = (import.meta as any).env?.VITE_API_URL || 'http://localhost:3000';

const GestionMatricula = () => {
  const { isMobile, isSmallScreen } = useBreakpoints();

  const [darkMode, setDarkMode] = useState<boolean>(() => {
    const saved = localStorage.getItem('admin-dark-mode');
    return saved !== null ? JSON.parse(saved) : true;
  });

  useEffect(() => {
    const interval = setInterval(() => {
      const saved = localStorage.getItem('admin-dark-mode');
      const nextMode = saved !== null ? JSON.parse(saved) : true;
      setDarkMode(prev => (prev === nextMode ? prev : nextMode));
    }, 250);

    return () => clearInterval(interval);
  }, []);

  const pick = <T,>(light: T, dark: T): T => (darkMode ? dark : light);

  const theme = {
    pageBackground: pick(
      'linear-gradient(135deg, rgba(248,250,252,0.96) 0%, rgba(255,255,255,0.98) 100%)',
      'linear-gradient(135deg, rgba(0,0,0,0.92) 0%, rgba(17,17,25,0.92) 100%)'
    ),
    contentBackground: pick(
      'linear-gradient(135deg, rgba(255,255,255,0.98) 0%, rgba(248,250,252,0.94) 100%)',
      'linear-gradient(135deg, rgba(13,13,25,0.92) 0%, rgba(26,26,46,0.92) 100%)'
    ),
    surface: pick('rgba(255,255,255,0.94)', 'rgba(12,12,24,0.94)'),
    surfaceBorder: pick('rgba(15,23,42,0.08)', 'rgba(255,255,255,0.08)'),
    accentBorder: pick('rgba(239,68,68,0.18)', 'rgba(239,68,68,0.28)'),
    textPrimary: pick('#0f172a', 'rgba(255,255,255,0.95)'),
    textSecondary: pick('rgba(71,85,105,0.82)', 'rgba(226,232,240,0.74)'),
    textMuted: pick('rgba(100,116,139,0.65)', 'rgba(148,163,184,0.6)'),
    chipMutedBg: pick('rgba(15,23,42,0.06)', 'rgba(255,255,255,0.08)'),
    chipMutedBorder: pick('rgba(148,163,184,0.24)', 'rgba(148,163,184,0.28)'),
    chipMutedText: pick('rgba(71,85,105,0.7)', 'rgba(226,232,240,0.75)'),
    divider: pick('rgba(148,163,184,0.18)', 'rgba(255,255,255,0.1)'),
    inputBg: pick('rgba(255,255,255,0.96)', 'rgba(255,255,255,0.08)'),
    inputBorder: pick('rgba(148,163,184,0.32)', 'rgba(255,255,255,0.2)'),
    inputText: pick('#0f172a', '#f8fafc'),
    inputIcon: pick('rgba(71,85,105,0.55)', 'rgba(255,255,255,0.55)'),
    controlShadow: pick('0 18px 36px rgba(15,23,42,0.08)', '0 20px 40px rgba(0,0,0,0.45)'),
    paginationBackground: pick(
      'linear-gradient(135deg, rgba(255,255,255,0.98) 0%, rgba(248,250,252,0.94) 100%)',
      'linear-gradient(135deg, rgba(0,0,0,0.9) 0%, rgba(26,26,26,0.92) 100%)'
    ),
    paginationBorder: pick('rgba(15,23,42,0.08)', 'rgba(239,68,68,0.2)'),
    paginationText: pick('rgba(71,85,105,0.82)', 'rgba(226,232,240,0.74)'),
    paginationInactiveBg: pick('rgba(241,245,249,0.9)', 'rgba(255,255,255,0.08)'),
    paginationInactiveText: pick('rgba(148,163,184,0.65)', 'rgba(255,255,255,0.45)')
  };

  const estadoTokens: Record<Solicitud['estado'], { bg: string; border: string; text: string }> = {
    pendiente: {
      bg: pick('rgba(148,163,184,0.16)', 'rgba(148,163,184,0.18)'),
      border: pick('rgba(148,163,184,0.28)', 'rgba(148,163,184,0.32)'),
      text: pick('#0f172a', '#cbd5f5')
    },
    aprobado: {
      bg: pick('rgba(16,185,129,0.16)', 'rgba(16,185,129,0.18)'),
      border: pick('rgba(16,185,129,0.3)', 'rgba(16,185,129,0.35)'),
      text: pick('#0f766e', '#34d399')
    },
    rechazado: {
      bg: pick('rgba(239,68,68,0.14)', 'rgba(239,68,68,0.18)'),
      border: pick('rgba(239,68,68,0.32)', 'rgba(239,68,68,0.38)'),
      text: pick('#b91c1c', RedColorPalette.primary)
    },
    observaciones: {
      bg: pick('rgba(251,146,60,0.16)', 'rgba(249,115,22,0.2)'),
      border: pick('rgba(251,146,60,0.32)', 'rgba(249,115,22,0.38)'),
      text: pick('#b45309', '#fb923c')
    }
  };

  const counterTokens = {
    pendiente: estadoTokens.pendiente,
    aprobado: estadoTokens.aprobado,
    rechazado: estadoTokens.rechazado,
    observaciones: estadoTokens.observaciones
  } as const;

  const neutralBadgeTokens = {
    bg: theme.chipMutedBg,
    border: theme.chipMutedBorder,
    text: theme.chipMutedText
  };

  const excelButtonBackground = `linear-gradient(135deg, ${RedColorPalette.primary}, ${RedColorPalette.primaryDark})`;
  const excelButtonHoverBackground = `linear-gradient(135deg, ${RedColorPalette.primaryDark}, ${RedColorPalette.primary})`;
  const excelButtonTextColor = '#ffffff';

  const refreshButtonBackground = `linear-gradient(135deg, ${RedColorPalette.primary}, ${RedColorPalette.primaryDark})`;
  const refreshButtonHoverBackground = `linear-gradient(135deg, ${RedColorPalette.primaryDark}, ${RedColorPalette.primary})`;
  const refreshButtonDisabledBackground = pick('rgba(239,68,68,0.25)', 'rgba(239,68,68,0.3)');

  const emptyStateTokens = {
    background: pick(
      'linear-gradient(135deg, rgba(255,255,255,0.95), rgba(248,250,252,0.9))',
      'linear-gradient(135deg, rgba(17,24,39,0.88), rgba(15,23,42,0.92))'
    ),
    border: pick('rgba(148,163,184,0.35)', 'rgba(148,163,184,0.25)'),
    iconBg: pick('rgba(239,68,68,0.12)', 'rgba(239,68,68,0.22)'),
    iconColor: pick(RedColorPalette.primary, '#fca5a5'),
    shadow: pick('0 18px 40px rgba(148,163,184,0.18)', '0 18px 40px rgba(0,0,0,0.45)')
  } as const;

  const actionColors = {
    view: '#3b82f6',
    approve: '#10b981',
    reject: '#ef4444'
  } as const;

  const paginationActiveBg = pick('linear-gradient(135deg, #ef4444, #dc2626)', 'linear-gradient(135deg, #ef4444, #dc2626)');
  const paginationActiveText = pick('#fff', '#fff');

  const paginationButtonTokens = {
    defaultBg: pick('rgba(248,250,252,0.92)', 'rgba(255,255,255,0.08)'),
    border: theme.surfaceBorder,
    text: theme.textPrimary,
    disabledBg: pick('rgba(237,242,247,0.6)', 'rgba(255,255,255,0.05)'),
    disabledText: theme.paginationInactiveText,
    hoverBg: pick('rgba(255,255,255,0.98)', 'rgba(255,255,255,0.12)')
  };

  type CounterKey = keyof typeof counterTokens;

  const getEstadoTokens = (estado: Solicitud['estado']) => estadoTokens[estado] ?? estadoTokens.pendiente;

  const [solicitudes, setSolicitudes] = useState<Solicitud[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showLoadingModal, setShowLoadingModal] = useState(false);
  const [filterEstado, setFilterEstado] = useState<'todos' | Solicitud['estado']>('pendiente');
  const [tipos, setTipos] = useState<Array<{ id_tipo_curso: number; nombre: string; codigo?: string }>>([]);
  const [filterTipo, setFilterTipo] = useState<number | 'todos'>('todos');
  const [showModal, setShowModal] = useState(false);
  const [selected, setSelected] = useState<Solicitud | null>(null);
  const [decidiendo, setDecidiendo] = useState(false);
  const [showComprobanteModal, setShowComprobanteModal] = useState(false);
  const [comprobanteUrl, setComprobanteUrl] = useState<string>('');
  const [comprobanteNumero, setComprobanteNumero] = useState<string>('');
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [approvalData, setApprovalData] = useState<Solicitud | null>(null);
  const [generatedUsername, setGeneratedUsername] = useState<string>('');
  const [cursos, setCursos] = useState<Array<{ id_curso: number; nombre: string; estado: string }>>([]);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [counters, setCounters] = useState({ pendiente: 0, aprobado: 0, rechazado: 0, observaciones: 0 });

  useSocket({
    'nueva_solicitud_matricula': (data: any) => {
      showToast.success(`Nueva solicitud: ${data.nombre_solicitante} ${data.apellido_solicitante}`, darkMode);
      void fetchSolicitudes();
      void fetchCounters();
    },
    'solicitud_actualizada': (data: any) => {
      void fetchSolicitudes();
      void fetchCounters();
    }
  });

  const fetchCursos = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/cursos?limit=100`);
      if (!res.ok) return;
      const data = await res.json();
      const cursosList = Array.isArray(data) ? data : [];
      setCursos(cursosList.map((c: any) => ({
        id_curso: c.id_curso,
        nombre: c.nombre,
        estado: c.estado
      })));
    } catch { }
  };

  const fetchCounters = async () => {
    try {
      const params = new URLSearchParams();
      params.set('aggregate', 'by_estado');
      if (filterTipo !== 'todos') {
        params.set('tipo', String(filterTipo));
      }
      const res = await fetch(`${API_BASE}/api/solicitudes?${params.toString()}`);
      if (!res.ok) return;
      const data = await res.json();
      setCounters({
        pendiente: Number(data?.pendiente || 0),
        aprobado: Number(data?.aprobado || 0),
        rechazado: Number(data?.rechazado || 0),
        observaciones: Number(data?.observaciones || 0),
      });
    } catch { }
  };

  const fetchSolicitudes = async (): Promise<boolean> => {
    try {
      setLoading(true);
      setShowLoadingModal(true);
      setError(null);
      const params = new URLSearchParams();
      if (filterEstado !== 'todos') {
        params.set('estado', filterEstado);
      }
      params.set('limit', String(limit));
      params.set('page', String(page));
      if (filterTipo !== 'todos') {
        params.set('tipo', String(filterTipo));
      }
      const res = await fetch(`${API_BASE}/api/solicitudes?${params.toString()}`);
      if (!res.ok) throw new Error('No se pudo cargar solicitudes');
      const totalHeader = Number(res.headers.get('X-Total-Count') || 0);
      setTotalCount(Number.isFinite(totalHeader) ? totalHeader : 0);
      const data = await res.json();
      setSolicitudes(data);
      return true;
    } catch (e: any) {
      const message = e.message || 'Error cargando solicitudes';
      setError(message);
      showToast.error(message, darkMode);
      return false;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchSolicitudes();
    void fetchCursos();
  }, [filterEstado, filterTipo, page, limit]);

  useEffect(() => {
    fetchCounters();
  }, [filterTipo]);

  const fetchTipos = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/tipos-cursos?estado=activo&limit=200`);
      if (!res.ok) return;
      const data = await res.json();
      const list = Array.isArray(data) ? data : [];
      setTipos(list.map((t: any) => ({ id_tipo_curso: t.id_tipo_curso, nombre: t.nombre, codigo: t.codigo })));
    } catch { }
  };

  useEffect(() => { fetchTipos(); }, []);

  const openModal = async (id: number) => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE}/api/solicitudes/${id}`);
      if (!res.ok) throw new Error('No se pudo obtener la solicitud');
      const data = await res.json();
      setSelected(data);
      setShowModal(true);
    } catch (e: any) {
      setError(e.message || 'Error abriendo solicitud');
    } finally {
      setLoading(false);
    }
  };

  const openComprobanteModal = (url: string, numeroComprobante?: string) => {
    setComprobanteUrl(url);
    setComprobanteNumero(numeroComprobante || '');
    setShowComprobanteModal(true);
  };

  // Función para generar username automáticamente (versión simplificada)
  const generateUsername = (nombre: string, apellido: string): string => {
    try {
      // Extraer iniciales del nombre (todas las palabras)
      const nombreParts = nombre.trim().split(' ').filter(part => part.length > 0);
      const inicialesNombre = nombreParts.map(part => part.charAt(0).toLowerCase()).join('');

      // Extraer primer apellido
      const apellidoParts = apellido.trim().split(' ').filter(part => part.length > 0);
      const primerApellido = apellidoParts[0]?.toLowerCase() || '';

      // Crear username base
      const baseUsername = inicialesNombre + primerApellido;

      // Por ahora devolver el username base (luego implementaremos la validación en backend)
      return baseUsername;
    } catch (error) {
      console.error('Error generando username:', error);
      // Fallback en caso de error
      const inicialesNombre = nombre.charAt(0).toLowerCase();
      const primerApellido = apellido.split(' ')[0]?.toLowerCase() || '';
      return inicialesNombre + primerApellido;
    }
  };

  // Función para abrir modal de aprobación
  const openApprovalModal = (solicitud: Solicitud) => {
    console.log('Datos de la solicitud para aprobar:', solicitud);
    console.log('Campos específicos:', {
      nombre: solicitud.nombre_solicitante,
      apellido: solicitud.apellido_solicitante,
      telefono: solicitud.telefono_solicitante,
      email: solicitud.email_solicitante,
      identificacion: solicitud.identificacion_solicitante,
      fecha_nacimiento: solicitud.fecha_nacimiento_solicitante,
      horario: solicitud.horario_preferido,
      tipo_curso: (solicitud as any).tipo_curso_nombre
    });

    setApprovalData(solicitud);

    // Generar username automáticamente
    const username = generateUsername(solicitud.nombre_solicitante, solicitud.apellido_solicitante);
    setGeneratedUsername(username);

    setShowApprovalModal(true);
  };

  // Función para crear estudiante desde solicitud aprobada
  const handleCreateStudent = async () => {
    if (!approvalData) return;

    try {
      setDecidiendo(true);

      const token = sessionStorage.getItem('auth_token');
      if (!token) {
        throw new Error('No se encontró token de autenticación');
      }

      // Obtener el ID del usuario logueado
      let aprobadoPor = 1; // Fallback
      try {
        const userRaw = sessionStorage.getItem('auth_user');
        if (userRaw) {
          const user = JSON.parse(userRaw);
          if (user?.id_usuario) {
            aprobadoPor = user.id_usuario;
          }
        }
      } catch (e) {
        console.error('Error obteniendo usuario logueado:', e);
      }

      const response = await fetch(`${API_BASE}/api/estudiantes/crear-desde-solicitud`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          id_solicitud: approvalData.id_solicitud,
          aprobado_por: aprobadoPor
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error creando estudiante');
      }

      const data = await response.json();

      // Notificación de éxito - diferente según si es estudiante nuevo o existente
      if (approvalData?.id_estudiante_existente) {
        // CASO: Estudiante existente - Solo se creó matrícula
        // Usar los datos de approvalData ya que son los de la solicitud original
        showToast.success(
          `Matrícula aprobada para ${approvalData.nombre_solicitante} ${approvalData.apellido_solicitante}`,
          darkMode
        );
      } else {
        // CASO: Estudiante nuevo - Se creó usuario + matrícula
        const estudiante = data?.estudiante ?? {};
        const nombreCompleto = `${estudiante.nombre ?? ''} ${estudiante.apellido ?? ''}`.trim();
        showToast.success(
          `Estudiante creado: ${nombreCompleto || 'Nuevo estudiante'} | Usuario: ${estudiante.username ?? 'N/D'} | Contraseña temporal: ${estudiante.password_temporal ?? 'N/D'}`,
          darkMode
        );
      }

      // Cerrar modal y refrescar datos
      setShowApprovalModal(false);
      setApprovalData(null);
      setGeneratedUsername('');

      // Refrescar lista de solicitudes
      await fetchSolicitudes();
      await fetchCounters();

    } catch (error: any) {
      console.error('Error creando estudiante:', error);
      const message = error?.message ? `Error creando estudiante: ${error.message}` : 'Error creando estudiante';
      showToast.error(message, darkMode);
    } finally {
      setDecidiendo(false);
    }
  };

  const handleDecision = async (estado: 'aprobado' | 'rechazado' | 'observaciones', observaciones?: string, solicitudId?: number) => {
    const targetId = solicitudId || selected?.id_solicitud;
    if (!targetId) return;

    try {
      setDecidiendo(true);
      setError(null);

      // Obtener el ID del usuario logueado
      let verificadoPor = null;
      try {
        const userRaw = sessionStorage.getItem('auth_user');
        if (userRaw) {
          const user = JSON.parse(userRaw);
          verificadoPor = user?.id_usuario || null;
        }
      } catch (e) {
        console.error('Error obteniendo usuario logueado:', e);
      }

      const res = await fetch(`${API_BASE}/api/solicitudes/${targetId}/decision`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ estado, observaciones: observaciones || null, verificado_por: verificadoPor })
      });
      if (!res.ok) {
        const msg = await res.text();
        throw new Error(msg || 'No se pudo actualizar la solicitud');
      }

      // Solo cerrar modal si se actualizó desde el modal
      if (!solicitudId) {
        setShowModal(false);
        setSelected(null);
      }

      await fetchSolicitudes();
      await fetchCounters();

      // Notificación según el estado
      if (estado === 'aprobado') {
        showToast.success('Solicitud aprobada correctamente', darkMode);
      } else if (estado === 'rechazado') {
        showToast.error('Solicitud rechazada', darkMode);
      } else {
        showToast.info('Observaciones agregadas a la solicitud', darkMode);
      }
    } catch (e: any) {
      setError(e.message || 'Error actualizando estado');
      showToast.error(e.message || 'Error actualizando estado', darkMode);
    } finally {
      setDecidiendo(false);
    }
  };

  const solicitudesFiltradas = solicitudes
    .filter((s) => {
      const fullName = `${s.nombre_solicitante} ${s.apellido_solicitante}`.toLowerCase();
      const haystack = [
        fullName,
        s.email_solicitante?.toLowerCase?.() || '',
        s.identificacion_solicitante || '',
        (s as any).curso_nombre?.toLowerCase?.() || '',
        (s as any).tipo_curso_nombre?.toLowerCase?.() || ''
      ].join(' ');
      const matchesSearch = haystack.includes(searchTerm.toLowerCase());
      const matchesEstado = filterEstado === 'todos' || s.estado === filterEstado;
      return matchesSearch && matchesEstado;
    })
    .sort((a, b) => {
      // Ordenar por fecha de solicitud, más antiguos primero
      const dateA = new Date(a.fecha_solicitud).getTime();
      const dateB = new Date(b.fecha_solicitud).getTime();
      return dateA - dateB;
    });

  const totalPages = Math.ceil(solicitudesFiltradas.length / limit);
  const paginatedSolicitudes = solicitudesFiltradas.slice((page - 1) * limit, page * limit);

  // Los contadores ahora vienen del backend (counters)

  // Resetear página cuando cambian filtros principales
  useEffect(() => {
    setPage(1);
  }, [filterEstado, filterTipo]);

  const pageStyle = {
    background: theme.pageBackground,
    color: theme.textPrimary,
    minHeight: '100%',
    transition: 'background 0.3s ease, color 0.3s ease',
    '--admin-card-bg': theme.contentBackground,
    '--admin-bg-secondary': theme.contentBackground,
    '--admin-border': theme.surfaceBorder,
    '--admin-text-primary': theme.textPrimary,
    '--admin-text-secondary': theme.textSecondary,
    '--admin-text-muted': theme.textMuted,
    '--admin-divider': theme.divider,
    '--admin-chip-muted-bg': theme.chipMutedBg,
    '--admin-chip-muted-border': theme.chipMutedBorder,
    '--admin-chip-muted-text': theme.chipMutedText,
    '--admin-input-bg': theme.inputBg,
    '--admin-input-border': theme.inputBorder,
    '--admin-input-text': theme.inputText,
    '--admin-input-icon': theme.inputIcon
  } as CSSProperties;

  return (
    <div style={pageStyle}>
      <AdminSectionHeader
        title="Gestión de Matrículas"
        subtitle="Administra las matrículas y credenciales de acceso de los estudiantes"
      />

      {/* Controles */}
      <div
        style={{
          background: theme.contentBackground,
          border: `1px solid ${theme.accentBorder}`,
          borderRadius: isMobile ? '0.75em' : '1rem',
          padding: isMobile ? '0.75em' : '1rem',
          marginBottom: isMobile ? '0.75em' : '1rem',
          boxShadow: theme.controlShadow,
          color: theme.textPrimary,
          backdropFilter: darkMode ? 'blur(1.25rem)' : 'none',
          transition: 'background 0.3s ease, border 0.3s ease, box-shadow 0.3s ease'
        }}
      >
        <div className="responsive-filters">
          <div
            style={{
              position: 'relative',
              minWidth: isSmallScreen ? 'auto' : '17.5rem',
              width: isSmallScreen ? '100%' : 'auto'
            }}
          >
            <Search
              size={16}
              style={{
                position: 'absolute',
                left: '0.75rem',
                top: '50%',
                transform: 'translateY(-50%)',
                color: theme.inputIcon,
                transition: 'color 0.2s ease'
              }}
            />
            <input
              type="text"
              placeholder="Buscar por nombre, email o cédula..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 0.625rem 0.625rem 2.375rem',
                background: theme.inputBg,
                border: `1px solid ${theme.inputBorder}`,
                borderRadius: '0.625rem',
                color: theme.inputText,
                fontSize: '0.8rem',
                transition: 'border 0.2s ease, box-shadow 0.2s ease, background 0.2s ease'
              }}
              onFocus={(e) => {
                e.currentTarget.style.boxShadow = '0 0 0 4px rgba(239,68,68,0.08)';
                e.currentTarget.style.border = `1px solid ${theme.accentBorder}`;
              }}
              onBlur={(e) => {
                e.currentTarget.style.boxShadow = 'none';
                e.currentTarget.style.border = `1px solid ${theme.inputBorder}`;
              }}
            />
          </div>
          <div
            style={{
              display: 'flex',
              flexDirection: isSmallScreen ? 'column' : 'row',
              gap: '0.75rem',
              alignItems: isSmallScreen ? 'stretch' : 'center',
              flexWrap: 'wrap',
              width: '100%',
              flex: 1,
              minWidth: 0
            }}
          >
            <div style={{ minWidth: isSmallScreen ? 'auto' : 180, width: isSmallScreen ? '100%' : 'auto' }}>
              <StyledSelect
                name="filterEstado"
                value={filterEstado}
                onChange={(e) => setFilterEstado(e.target.value as any)}
                options={[
                  { value: 'todos', valueOf: undefined as any, label: 'Todos' } as any,
                  { value: 'pendiente', label: 'Pendiente' },
                  { value: 'aprobado', label: 'Aprobado' },
                  { value: 'rechazado', label: 'Rechazado' },
                  { value: 'observaciones', label: 'Observaciones' }
                ]}
              />
            </div>
            <div style={{ minWidth: isSmallScreen ? 'auto' : 220, width: isSmallScreen ? '100%' : 'auto' }}>
              <StyledSelect
                name="filterTipo"
                value={String(filterTipo)}
                onChange={(e) => setFilterTipo(e.target.value === 'todos' ? 'todos' : Number(e.target.value))}
                options={[
                  { value: 'todos', label: 'Todos los tipos' },
                  ...tipos.map(t => ({ value: t.id_tipo_curso, label: t.nombre }))
                ]}
              />
            </div>
            <div
              style={{
                display: 'flex',
                gap: '0.5rem',
                flexWrap: 'wrap',
                width: isSmallScreen ? '100%' : 'auto',
                justifyContent: isSmallScreen ? 'flex-start' : 'flex-end',
                marginLeft: isSmallScreen ? 0 : 'auto'
              }}
            >
              <button
                onClick={async () => {
                  try {
                    const response = await fetch(`${API_BASE}/api/solicitudes/reporte/excel`);
                    if (!response.ok) throw new Error('Error descargando reporte');
                    const blob = await response.blob();
                    const url = window.URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `Reporte_Matriculas_${new Date().toISOString().split('T')[0]}.xlsx`;
                    document.body.appendChild(a);
                    a.click();
                    window.URL.revokeObjectURL(url);
                    document.body.removeChild(a);
                    showToast.success('Reporte descargado correctamente', darkMode);
                  } catch (error) {
                    console.error('Error al descargar el reporte:', error);
                    showToast.error('Error al descargar el reporte', darkMode);
                  }
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  padding: isMobile ? '10px 1rem' : '12px 1.5rem',
                  background: excelButtonBackground,
                  border: 'none',
                  borderRadius: '0.625rem',
                  color: excelButtonTextColor,
                  fontSize: '0.8rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  boxShadow: '0 0.25rem 0.75rem rgba(239, 68, 68, 0.28)',
                  width: isSmallScreen ? '100%' : 'auto'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = excelButtonHoverBackground;
                  e.currentTarget.style.transform = 'translateY(-1px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = excelButtonBackground;
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                <Sheet size={16} color={excelButtonTextColor} />
                Descargar Excel
              </button>
              <button
                onClick={async () => {
                  if (loading) return;
                  const refreshed = await fetchSolicitudes();
                  if (refreshed) {
                    showToast.info('Solicitudes actualizadas', darkMode);
                  }
                }}
                disabled={loading}
                aria-label="Refrescar lista"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 0,
                  padding: '0.65rem',
                  background: loading ? refreshButtonDisabledBackground : refreshButtonBackground,
                  border: 'none',
                  borderRadius: '0.625rem',
                  color: '#fff',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  boxShadow: '0 0.25rem 0.75rem rgba(239, 68, 68, 0.3)',
                  width: '2.75rem',
                  height: '2.75rem',
                  transition: 'transform 0.2s ease, opacity 0.2s ease',
                  opacity: loading ? 0.8 : 1
                }}
                onMouseEnter={(e) => {
                  if (loading) return;
                  e.currentTarget.style.transform = 'translateY(-1px)';
                  e.currentTarget.style.background = refreshButtonHoverBackground;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.background = loading ? refreshButtonDisabledBackground : refreshButtonBackground;
                }}
              >
                <RefreshCcw size={18} color="#fff" style={{ opacity: loading ? 0.6 : 1 }} />
              </button>
            </div>
          </div>
        </div>
        {/* Counters + Pagination */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, marginTop: 10, flexWrap: 'wrap' }}>
          {/* Counters */}
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {([
              { key: 'pendiente', label: 'Pendiente' },
              { key: 'aprobado', label: 'Aprobado' },
              { key: 'rechazado', label: 'Rechazado' },
              { key: 'observaciones', label: 'Observaciones' }
            ] as const).map(({ key, label }) => {
              const token = counterTokens[key as CounterKey];
              return (
                <span
                  key={key}
                  style={{
                    padding: '4px 0.625rem',
                    borderRadius: '9999em',
                    fontSize: '0.7rem',
                    fontWeight: 700,
                    background: token.bg,
                    border: `1px solid ${token.border}`,
                    color: token.text,
                    textTransform: 'capitalize'
                  }}
                >
                  {label}: {counters[key as CounterKey]}
                </span>
              );
            })}
          </div>
          {/* Pagination */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ color: theme.textSecondary, fontSize: '0.75rem' }}>Por página:</span>
              <div style={{ minWidth: 100 }}>
                <StyledSelect
                  name="limit"
                  value={String(limit)}
                  onChange={(e) => setLimit(Number(e.target.value))}
                  options={[
                    { value: '10', label: '10' },
                    { value: '20', label: '20' },
                    { value: '50', label: '50' }
                  ]}
                />
              </div>
            </div>
            <span style={{ color: theme.textSecondary, fontSize: '0.75rem', marginLeft: 6 }}>Total: {totalCount}</span>
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              style={{
                padding: '7px 0.625rem',
                fontSize: '0.75rem',
                borderRadius: '0.5rem',
                border: `1px solid ${paginationButtonTokens.border}`,
                background: page === 1 ? paginationButtonTokens.disabledBg : paginationButtonTokens.defaultBg,
                color: page === 1 ? paginationButtonTokens.disabledText : paginationButtonTokens.text,
                cursor: page === 1 ? 'not-allowed' : 'pointer',
                fontWeight: 600,
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                if (page === 1) return;
                e.currentTarget.style.background = paginationButtonTokens.hoverBg;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = page === 1 ? paginationButtonTokens.disabledBg : paginationButtonTokens.defaultBg;
              }}
            >
              Anterior
            </button>
            <span style={{ color: theme.paginationText }}>Página {page}</span>
            <button
              onClick={() => setPage(p => p + 1)}
              disabled={(page * limit) >= totalCount}
              style={{
                padding: '0.5em 0.75rem',
                borderRadius: '0.625em',
                border: `0.0625rem solid ${paginationButtonTokens.border}`,
                background: (page * limit) >= totalCount ? paginationButtonTokens.disabledBg : paginationButtonTokens.defaultBg,
                color: (page * limit) >= totalCount ? paginationButtonTokens.disabledText : paginationButtonTokens.text,
                cursor: (page * limit) >= totalCount ? 'not-allowed' : 'pointer',
                fontWeight: 600,
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                if ((page * limit) >= totalCount) return;
                e.currentTarget.style.background = paginationButtonTokens.hoverBg;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = (page * limit) >= totalCount ? paginationButtonTokens.disabledBg : paginationButtonTokens.defaultBg;
              }}
            >
              Siguiente
            </button>
          </div>
        </div>
      </div>

      {/* Lista de Solicitudes */}
      <div style={{ display: 'grid', gap: isMobile ? '12px' : '1rem' }}>
        {loading && (<div style={{ color: theme.textSecondary, fontSize: '0.8rem' }}>Cargando...</div>)}
        {error && (<div style={{ color: RedColorPalette.primary, fontSize: '0.8rem' }}>{error}</div>)}
        {!loading && solicitudesFiltradas.length === 0 && (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.75rem',
              padding: isMobile ? '2.25rem 1.5rem' : '3rem 2.5rem',
              background: emptyStateTokens.background,
              border: `1px dashed ${emptyStateTokens.border}`,
              borderRadius: '1.25rem',
              boxShadow: emptyStateTokens.shadow,
              textAlign: 'center',
              backdropFilter: 'blur(14px)',
              WebkitBackdropFilter: 'blur(14px)',
              transition: 'background 0.3s ease, border 0.3s ease, box-shadow 0.3s ease'
            }}
          >
            <div
              style={{
                width: '3.25rem',
                height: '3.25rem',
                borderRadius: '1rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: emptyStateTokens.iconBg
              }}
            >
              <FileText size={26} color={emptyStateTokens.iconColor} />
            </div>
            <div style={{ fontSize: isMobile ? '1rem' : '1.05rem', fontWeight: 700, color: theme.textPrimary }}>
              No hay solicitudes registradas
            </div>
            <p
              style={{
                margin: 0,
                fontSize: '0.85rem',
                lineHeight: 1.6,
                color: theme.textSecondary,
                maxWidth: '28rem'
              }}
            >
              Cuando se generen nuevas solicitudes las verás aquí en tiempo real. Puedes usar el botón refrescar si estás esperando un registro reciente.
            </p>
          </div>
        )}
        {paginatedSolicitudes.map((sol) => {
          // Formatear fecha de solicitud
          const formatearFecha = (fechaString: string) => {
            const fecha = new Date(fechaString);
            const meses = [
              'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
              'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
            ];
            const dia = fecha.getDate();
            const mes = meses[fecha.getMonth()];
            const año = fecha.getFullYear();
            return `${dia}/${mes}/${año}`;
          };

          const estadoVisual = getEstadoTokens(sol.estado);
          const labelColor = theme.textSecondary;
          const valueColor = theme.textPrimary;
          const codeChipStyle = {
            background: neutralBadgeTokens.bg,
            border: `1px solid ${neutralBadgeTokens.border}`,
            color: neutralBadgeTokens.text
          } as CSSProperties;
          const fieldLabelStyle = {
            color: labelColor,
            fontSize: '0.65rem',
            marginBottom: '0.1875rem'
          } as CSSProperties;
          const fieldValueStyle = {
            color: valueColor,
            fontSize: '0.75rem',
            fontWeight: 600
          } as CSSProperties;

          return (
            <div
              key={sol.id_solicitud}
              style={{
                background: theme.contentBackground,
                border: `1px solid ${theme.surfaceBorder}`,
                borderRadius: '0.75rem',
                padding: '0.875rem',
                boxShadow: darkMode ? '0 0.25rem 0.75rem rgba(0, 0, 0, 0.25)' : '0 16px 32px rgba(15,23,42,0.08)',
                transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                backdropFilter: darkMode ? 'blur(1rem)' : 'none',
                color: theme.textPrimary
              }}
            >
              {/* Información Principal */}
              <div style={{ marginBottom: '0.875rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '0.375rem' }}>
                  <span
                    style={{
                      fontSize: '0.7rem',
                      padding: '3px 0.5rem',
                      borderRadius: '0.3125rem',
                      fontWeight: 600,
                      letterSpacing: '0.01em',
                      background: codeChipStyle.background,
                      border: codeChipStyle.border,
                      color: codeChipStyle.color
                    }}
                  >
                    {sol.codigo_solicitud}
                  </span>
                  <span
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.1875rem',
                      padding: '3px 0.5rem',
                      borderRadius: 6,
                      fontSize: '0.65rem',
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      background: estadoVisual.bg,
                      border: `1px solid ${estadoVisual.border}`,
                      color: estadoVisual.text
                    }}
                  >
                    {sol.estado}
                  </span>
                </div>
                <h3
                  style={{
                    color: theme.textPrimary,
                    margin: '0 0 0.5rem 0'
                  }}
                >
                  {sol.apellido_solicitante}, {sol.nombre_solicitante}
                </h3>
              </div>

              <div
                style={{
                  paddingTop: '0.625rem',
                  borderTop: `1px solid ${theme.divider}`,
                  marginBottom: '0.875rem'
                }}
              >

                {/* Primera fila - Información básica */}
                <div style={{
                  display: 'flex',
                  gap: '0.75rem',
                  marginBottom: '0.75rem',
                  flexWrap: 'wrap'
                }}>
                  <div style={{ flex: '1 1 200px' }}>
                    <div style={fieldLabelStyle}>Identificación</div>
                    <div style={fieldValueStyle}>{sol.identificacion_solicitante || '-'}</div>
                  </div>
                  <div style={{ flex: '1 1 200px' }}>
                    <div style={fieldLabelStyle}>Email</div>
                    <div style={fieldValueStyle}>{sol.email_solicitante}</div>
                  </div>
                  <div style={{ flex: '1 1 150px' }}>
                    <div style={fieldLabelStyle}>Fecha de Solicitud</div>
                    <div style={fieldValueStyle}>{formatearFecha(sol.fecha_solicitud)}</div>
                  </div>
                  {(sol as any).tipo_curso_nombre && (
                    <div style={{ flex: '1 1 150px' }}>
                      <div style={fieldLabelStyle}>Tipo de Curso</div>
                      <div style={fieldValueStyle}>{(sol as any).tipo_curso_nombre}</div>
                    </div>
                  )}
                </div>

                {/* Segunda fila - Número y Comprobante */}
                <div style={{
                  display: 'flex',
                  gap: '0.625rem',
                  flexWrap: 'wrap',
                  alignItems: 'start'
                }}>
                  {/* Número de comprobante - Campo separado */}
                  <div style={{ flex: '1 1 140px' }}>
                    <div style={fieldLabelStyle}>Número Comprobante</div>
                    {sol.numero_comprobante ? (
                      <div style={{
                        background: 'rgba(239, 68, 68, 0.1)',
                        border: '1px solid rgba(239, 68, 68, 0.3)',
                        color: '#ef4444',
                        padding: '4px 0.5rem',
                        borderRadius: '0.3125rem',
                        fontSize: '0.7rem',
                        fontWeight: '600',
                        textAlign: 'center'
                      }}>
                        {sol.numero_comprobante}
                      </div>
                    ) : (
                      <div style={{
                        background: neutralBadgeTokens.bg,
                        border: `1px solid ${neutralBadgeTokens.border}`,
                        color: neutralBadgeTokens.text,
                        padding: '4px 0.5rem',
                        borderRadius: '0.3125rem',
                        fontSize: '0.7rem',
                        textAlign: 'center',
                        fontStyle: 'italic'
                      }}>
                        {sol.metodo_pago === 'transferencia' ? 'Sin número' : 'N/A'}
                      </div>
                    )}
                  </div>

                  {/* Recibido por - Solo para efectivo */}
                  {sol.metodo_pago === 'efectivo' && (
                    <div style={{ flex: '1 1 140px' }}>
                      <div style={fieldLabelStyle}>Recibido por</div>
                      {(sol as any).recibido_por ? (
                        <div style={{
                          background: 'rgba(180, 83, 9, 0.1)',
                          border: '1px solid rgba(180, 83, 9, 0.3)',
                          color: '#b45309',
                          padding: '4px 0.5rem',
                          borderRadius: '0.3125rem',
                          fontSize: '0.7rem',
                          fontWeight: '600',
                          textAlign: 'center'
                        }}>
                          {(sol as any).recibido_por}
                        </div>
                      ) : (
                        <div style={{
                          background: neutralBadgeTokens.bg,
                          border: `1px solid ${neutralBadgeTokens.border}`,
                          color: neutralBadgeTokens.text,
                          padding: '4px 0.5rem',
                          borderRadius: '0.3125rem',
                          fontSize: '0.7rem',
                          textAlign: 'center',
                          fontStyle: 'italic'
                        }}>
                          Sin registro
                        </div>
                      )}
                    </div>
                  )}

                  {/* Comprobante - Solo botón */}
                  <div style={{ flex: '1 1 auto' }}>
                    <div style={fieldLabelStyle}>Comprobante</div>
                    <button
                      onClick={() => openComprobanteModal(sol.comprobante_pago_url || '', sol.numero_comprobante)}
                      style={{
                        background: 'rgba(16, 185, 129, 0.15)',
                        border: '1px solid rgba(16, 185, 129, 0.3)',
                        color: '#10b981',
                        padding: '6px 0.625rem',
                        borderRadius: '0.375rem',
                        cursor: 'pointer',
                        fontSize: '0.7rem',
                        fontWeight: '600',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.25rem',
                        whiteSpace: 'nowrap',
                        transition: 'all 0.2s ease'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'rgba(16, 185, 129, 0.25)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'rgba(16, 185, 129, 0.15)';
                      }}
                    >
                      <Download size={12} color={actionColors.approve} />
                      Ver Comprobante
                    </button>
                  </div>
                </div>
              </div>

              {/* Botones de Acción - Parte Inferior */}
              <div style={{
                display: 'flex',
                gap: '0.5rem',
                justifyContent: 'flex-end',
                borderTop: `1px solid ${theme.divider}`,
                paddingTop: '0.75rem',
                marginTop: '0.75rem'
              }}>
                <button
                  onClick={() => openModal(sol.id_solicitud)}
                  style={{
                    background: 'rgba(59, 130, 246, 0.1)',
                    border: '1px solid rgba(59, 130, 246, 0.3)',
                    color: actionColors.view,
                    padding: '6px 0.75rem',
                    borderRadius: '0.5rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.375rem',
                    fontSize: '0.75rem',
                    fontWeight: '600',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(59, 130, 246, 0.2)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(59, 130, 246, 0.1)';
                  }}
                >
                  <Eye size={14} color={actionColors.view} />
                  Ver
                </button>
                {sol.estado === 'pendiente' && (
                  <>
                    <button
                      onClick={() => openApprovalModal(sol)}
                      disabled={decidiendo}
                      style={{
                        background: 'rgba(16, 185, 129, 0.15)',
                        border: '0.0625rem solid rgba(16, 185, 129, 0.3)',
                        color: actionColors.approve,
                        padding: isMobile ? '0.625em 0.875rem' : '0.5em 0.75rem',
                        borderRadius: '0.5rem',
                        cursor: decidiendo ? 'not-allowed' : 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.375rem',
                        opacity: decidiendo ? 0.6 : 1,
                        fontSize: isMobile ? '0.85rem' : '0.75rem',
                        fontWeight: '500',
                        width: isSmallScreen ? '100%' : 'auto'
                      }}
                    >
                      <Check size={14} color={actionColors.approve} />
                      Aprobar
                    </button>
                    <button
                      onClick={() => handleDecision('rechazado', undefined, sol.id_solicitud)}
                      disabled={decidiendo}
                      style={{
                        background: 'rgba(239, 68, 68, 0.15)',
                        border: '0.0625rem solid rgba(239, 68, 68, 0.3)',
                        color: actionColors.reject,
                        padding: isMobile ? '0.625em 0.875rem' : '0.5em 0.75rem',
                        borderRadius: '0.5rem',
                        cursor: decidiendo ? 'not-allowed' : 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.375rem',
                        opacity: decidiendo ? 0.6 : 1,
                        fontSize: isMobile ? '0.85rem' : '0.75rem',
                        fontWeight: '500',
                        width: isSmallScreen ? '100%' : 'auto'
                      }}
                    >
                      <XCircle size={14} color={actionColors.reject} />
                      Rechazar
                    </button>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Paginación */}
      {!loading && solicitudesFiltradas.length > 0 && (
        <div
          className="pagination-container"
          style={{
            display: 'flex',
            flexDirection: isMobile ? 'column' : 'row',
            justifyContent: 'space-between',
            alignItems: isMobile ? 'stretch' : 'center',
            gap: isMobile ? '0.75rem' : '0',
            padding: isMobile ? '16px' : '20px 1.5rem',
            background: theme.paginationBackground,
            border: `1px solid ${theme.paginationBorder}`,
            borderRadius: '1rem',
            boxShadow: theme.controlShadow,
            transition: 'background 0.3s ease, border 0.3s ease'
          }}
        >
          <div style={{
            color: theme.paginationText,
            fontSize: isMobile ? '0.8rem' : '0.9rem',
            textAlign: isMobile ? 'center' : 'left'
          }}>
            Página {page} de {totalPages} • Total: {solicitudesFiltradas.length} solicitudes
          </div>
          <div style={{
            display: 'flex',
            gap: '0.5rem',
            flexWrap: 'wrap',
            justifyContent: isMobile ? 'center' : 'flex-start'
          }}>
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: isMobile ? '4px' : '0.375rem',
                padding: isMobile ? '8px 0.75rem' : '8px 1rem',
                background: page === 1 ? paginationButtonTokens.disabledBg : paginationButtonTokens.defaultBg,
                border: `1px solid ${paginationButtonTokens.border}`,
                borderRadius: '0.625rem',
                color: page === 1 ? paginationButtonTokens.disabledText : paginationButtonTokens.text,
                fontSize: isMobile ? '0.8rem' : '0.9rem',
                fontWeight: 600,
                cursor: page === 1 ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s ease',
                flex: isMobile ? '1' : 'initial'
              }}
              onMouseEnter={(e) => {
                if (page === 1) return;
                e.currentTarget.style.background = paginationButtonTokens.hoverBg;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = page === 1 ? paginationButtonTokens.disabledBg : paginationButtonTokens.defaultBg;
              }}
            >
              <ChevronLeft size={isMobile ? 14 : 16} />
              {!isMobile && 'Anterior'}
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(pageNum => (
              <button
                key={pageNum}
                onClick={() => setPage(pageNum)}
                style={{
                  padding: isMobile ? '8px 0.625rem' : '8px 0.875rem',
                  background: page === pageNum ? paginationActiveBg : paginationButtonTokens.defaultBg,
                  border: page === pageNum ? `1px solid ${RedColorPalette.primary}` : `1px solid ${paginationButtonTokens.border}`,
                  borderRadius: '0.625rem',
                  color: page === pageNum ? paginationActiveText : paginationButtonTokens.text,
                  fontSize: isMobile ? '0.8rem' : '0.9rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  minWidth: isMobile ? '36px' : '2.5rem',
                }}
                onMouseEnter={(e) => {
                  if (page === pageNum) return;
                  e.currentTarget.style.background = paginationButtonTokens.hoverBg;
                }}
                onMouseLeave={(e) => {
                  if (page === pageNum) return;
                  e.currentTarget.style.background = paginationButtonTokens.defaultBg;
                }}
              >
                {pageNum}
              </button>
            ))}
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: isMobile ? '4px' : '0.375rem',
                padding: isMobile ? '8px 0.75rem' : '8px 1rem',
                background: page === totalPages ? paginationButtonTokens.disabledBg : paginationButtonTokens.defaultBg,
                border: `1px solid ${paginationButtonTokens.border}`,
                borderRadius: '0.625rem',
                color: page === totalPages ? paginationButtonTokens.disabledText : paginationButtonTokens.text,
                fontSize: isMobile ? '0.8rem' : '0.9rem',
                fontWeight: 600,
                cursor: page === totalPages ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s ease',
                flex: isMobile ? '1' : 'initial'
              }}
              onMouseEnter={(e) => {
                if (page === totalPages) return;
                e.currentTarget.style.background = paginationButtonTokens.hoverBg;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = page === totalPages ? paginationButtonTokens.disabledBg : paginationButtonTokens.defaultBg;
              }}
            >
              {!isMobile && 'Siguiente'}
              <ChevronRight size={isMobile ? 14 : 16} />
            </button>
          </div>
        </div>
      )}

      {/* Modal Detalle Solicitud */}
      {showModal && selected && createPortal(
        <div
          className="modal-overlay"
          onClick={() => setShowModal(false)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            width: '100vw',
            height: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 99999,
            padding: isMobile ? '1rem' : '2rem',
            backdropFilter: 'blur(8px)',
            background: 'rgba(0, 0, 0, 0.65)',
            overflowY: 'auto',
            overflowX: 'hidden',
            scrollBehavior: 'smooth'
          }}
        >
          <div
            className="modal-content"
            onClick={(e) => e.stopPropagation()}
            style={{
              position: 'relative',
              background: 'var(--admin-card-bg, linear-gradient(135deg, rgba(0,0,0,0.9) 0%, rgba(26,26,46,0.9) 100%))',
              border: '1px solid rgba(239, 68, 68, 0.2)',
              borderRadius: '12px',
              width: isMobile ? '92vw' : '700px',
              maxWidth: isMobile ? '92vw' : '700px',
              maxHeight: '85vh',
              padding: isMobile ? '0.75rem 0.875rem' : '1rem 1.5rem',
              margin: 'auto',
              color: 'var(--admin-text-primary, #fff)',
              boxShadow: '0 20px 60px -12px rgba(0, 0, 0, 0.5)',
              overflowY: 'auto',
              overflowX: 'hidden',
              animation: 'scaleIn 0.3s ease-out'
            }}
          >
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: isMobile ? 12 : 14,
              paddingBottom: isMobile ? 8 : 10,
              borderBottom: '1px solid rgba(239, 68, 68, 0.2)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FileText size={isMobile ? 18 : 20} style={{ color: '#ef4444' }} />
                <h3 style={{ margin: 0, fontSize: isMobile ? '0.95rem' : '1.05rem', fontWeight: '600', letterSpacing: '-0.01em' }}>Solicitud {selected.codigo_solicitud}</h3>
              </div>
              <button
                onClick={() => setShowModal(false)}
                style={{
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '8px',
                  padding: '6px',
                  color: 'var(--admin-text-primary, #fff)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.2s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)';
                  e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.4)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
                  e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)';
                }}
              >
                <X size={16} />
              </button>
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
              gap: isMobile ? 8 : 10
            }}>
              <div>
                <div style={{ color: 'var(--admin-text-secondary, rgba(255,255,255,0.6))', fontSize: '0.75rem', marginBottom: 3 }}>Nombre Completo</div>
                <div style={{ color: 'var(--admin-text-primary, #fff)', fontWeight: '600', fontSize: '0.9rem' }}>{selected.apellido_solicitante}, {selected.nombre_solicitante}</div>
              </div>
              <div>
                <div style={{ color: 'var(--admin-text-secondary, rgba(255,255,255,0.6))', fontSize: '0.75rem', marginBottom: 3 }}>Identificación</div>
                <div style={{ color: 'var(--admin-text-primary, #fff)' }}>{selected.identificacion_solicitante || '-'}</div>
              </div>
              <div>
                <div style={{ color: 'var(--admin-text-secondary, rgba(255,255,255,0.6))', fontSize: '0.75rem', marginBottom: 3 }}>Email</div>
                <div style={{ color: 'var(--admin-text-primary, #fff)' }}>{selected.email_solicitante}</div>
              </div>
              <div>
                <div style={{ color: 'var(--admin-text-secondary, rgba(255,255,255,0.6))', fontSize: '0.75rem', marginBottom: 3 }}>Teléfono</div>
                <div style={{ color: 'var(--admin-text-primary, #fff)' }}>{selected.telefono_solicitante || '-'}</div>
              </div>
              {selected.fecha_nacimiento_solicitante && (
                <div>
                  <div style={{ color: 'var(--admin-text-secondary, rgba(255,255,255,0.6))', fontSize: '0.75rem', marginBottom: 3 }}>Fecha de Nacimiento</div>
                  <div style={{ color: 'var(--admin-text-primary, #fff)' }}>
                    {(() => {
                      const fecha = new Date(selected.fecha_nacimiento_solicitante);
                      const meses = [
                        'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
                        'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
                      ];
                      const dia = fecha.getDate();
                      const mes = meses[fecha.getMonth()];
                      const año = fecha.getFullYear();
                      return `${dia}/${mes}/${año}`;
                    })()}
                  </div>
                </div>
              )}
              {selected.genero_solicitante && (
                <div>
                  <div style={{ color: 'var(--admin-text-secondary, rgba(255,255,255,0.6))', fontSize: '0.75rem', marginBottom: 3 }}>Género</div>
                  <div style={{ color: 'var(--admin-text-primary, #fff)', textTransform: 'capitalize' }}>{selected.genero_solicitante}</div>
                </div>
              )}
              <div>
                <div style={{ color: 'var(--admin-text-secondary, rgba(255,255,255,0.6))', fontSize: '0.75rem', marginBottom: 3 }}>Dirección</div>
                <div style={{ color: 'var(--admin-text-primary, #fff)' }}>{selected.direccion_solicitante || '-'}</div>
              </div>
              {/* Added emergency contact display */}
              <div>
                <div style={{ color: 'var(--admin-text-secondary, rgba(255,255,255,0.6))', fontSize: '0.75rem', marginBottom: 3 }}>Contacto de Emergencia</div>
                <div style={{ color: 'var(--admin-text-primary, #fff)' }}>{(selected as any).contacto_emergencia || '-'}</div>
              </div>
              <div>
                <div style={{ color: 'var(--admin-text-secondary, rgba(255,255,255,0.6))', fontSize: '0.75rem', marginBottom: 3 }}>Fecha de Solicitud</div>
                <div style={{ color: 'var(--admin-text-primary, #fff)' }}>
                  {(() => {
                    const fecha = new Date(selected.fecha_solicitud);
                    const meses = [
                      'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
                      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
                    ];
                    const dia = fecha.getDate();
                    const mes = meses[fecha.getMonth()];
                    const año = fecha.getFullYear();
                    return `${dia}/${mes}/${año}`;
                  })()}
                </div>
              </div>
              {(selected as any).tipo_curso_nombre && (
                <div>
                  <div style={{ color: 'var(--admin-text-secondary, rgba(255,255,255,0.6))', fontSize: '0.75rem', marginBottom: 3 }}>Tipo de Curso</div>
                  <div style={{ color: 'var(--admin-text-primary, #fff)' }}>{(selected as any).tipo_curso_nombre}</div>
                </div>
              )}
              {selected.horario_preferido && (
                <div>
                  <div style={{ color: 'var(--admin-text-secondary, rgba(255,255,255,0.6))', fontSize: '0.75rem', marginBottom: 3 }}>Horario Preferido</div>
                  <div style={{
                    color: 'var(--admin-text-primary, #fff)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    textTransform: 'capitalize'
                  }}>
                    <Clock size={16} color="#ef4444" />
                    {selected.horario_preferido}
                  </div>
                </div>
              )}
              <div>
                <div style={{ color: 'var(--admin-text-secondary, rgba(255,255,255,0.6))', fontSize: '0.75rem', marginBottom: 3 }}>Monto de Matrícula</div>
                <div style={{ color: 'var(--admin-text-primary, #fff)', fontWeight: '600', fontSize: '1.1rem' }}>${selected.monto_matricula?.toLocaleString?.() || selected.monto_matricula}</div>
              </div>
              <div>
                <div style={{ color: 'var(--admin-text-secondary, rgba(255,255,255,0.6))', fontSize: '0.75rem', marginBottom: 3 }}>Método de Pago</div>
                <div style={{ color: 'var(--admin-text-primary, #fff)', textTransform: 'capitalize' }}>{selected.metodo_pago}</div>
              </div>

              {/* Información del comprobante - para transferencia */}
              {selected.metodo_pago === 'transferencia' && (
                <>
                  {selected.numero_comprobante && (
                    <div>
                      <div style={{ color: 'var(--admin-text-secondary, rgba(255,255,255,0.6))', fontSize: '0.75rem', marginBottom: 3 }}>Número de Comprobante</div>
                      <div style={{
                        color: '#ef4444',
                        fontWeight: '600',
                        fontSize: '0.95rem',
                        background: 'rgba(239, 68, 68, 0.1)',
                        padding: '4px 0.5rem',
                        borderRadius: '0.375rem',
                        border: '1px solid rgba(239, 68, 68, 0.3)'
                      }}>
                        {selected.numero_comprobante}
                      </div>
                    </div>
                  )}
                  {selected.banco_comprobante && (
                    <div>
                      <div style={{ color: 'var(--admin-text-secondary, rgba(255,255,255,0.6))', fontSize: '0.75rem', marginBottom: 3 }}>Banco</div>
                      <div style={{ color: 'var(--admin-text-primary, #fff)', textTransform: 'capitalize' }}>{selected.banco_comprobante}</div>
                    </div>
                  )}
                  {selected.fecha_transferencia && (
                    <div>
                      <div style={{ color: 'var(--admin-text-secondary, rgba(255,255,255,0.6))', fontSize: '0.75rem', marginBottom: 3 }}>Fecha de Transferencia</div>
                      <div style={{ color: 'var(--admin-text-primary, #fff)' }}>
                        {(() => {
                          const fecha = new Date(selected.fecha_transferencia);
                          const meses = [
                            'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
                            'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
                          ];
                          const dia = fecha.getDate();
                          const mes = meses[fecha.getMonth()];
                          const año = fecha.getFullYear();
                          return `${dia} de ${mes}, ${año}`;
                        })()}
                      </div>
                    </div>
                  )}
                </>
              )}

              {/* Información del comprobante - para efectivo */}
              {selected.metodo_pago === 'efectivo' && (
                <>
                  {selected.numero_comprobante && (
                    <div>
                      <div style={{ color: 'var(--admin-text-secondary, rgba(255,255,255,0.6))', fontSize: '0.75rem', marginBottom: 3 }}>Número de Comprobante</div>
                      <div style={{
                        color: '#ef4444',
                        fontWeight: '600',
                        fontSize: '0.95rem',
                        background: 'rgba(239, 68, 68, 0.1)',
                        padding: '4px 0.5rem',
                        borderRadius: '0.375rem',
                        border: '1px solid rgba(239, 68, 68, 0.3)'
                      }}>
                        {selected.numero_comprobante}
                      </div>
                    </div>
                  )}
                  {(selected as any).recibido_por && (
                    <div>
                      <div style={{ color: 'var(--admin-text-secondary, rgba(255,255,255,0.6))', fontSize: '0.75rem', marginBottom: 3 }}>Recibido por</div>
                      <div style={{
                        color: '#b45309',
                        fontWeight: '600',
                        fontSize: '0.95rem',
                        background: 'rgba(180, 83, 9, 0.1)',
                        padding: '4px 0.5rem',
                        borderRadius: '0.375rem',
                        border: '1px solid rgba(180, 83, 9, 0.3)'
                      }}>
                        {(selected as any).recibido_por}
                      </div>
                    </div>
                  )}
                </>
              )}

              <div>
                <div style={{ color: 'var(--admin-text-secondary, rgba(255,255,255,0.6))', fontSize: '0.75rem', marginBottom: 3 }}>Estado</div>
                <div style={{
                  display: 'inline-flex',
                  padding: '6px 0.75rem',
                  borderRadius: '9999px',
                  fontSize: '0.9rem',
                  fontWeight: '600',
                  textTransform: 'capitalize',
                  background: selected.estado === 'aprobado' ? 'rgba(16, 185, 129, 0.15)' :
                    selected.estado === 'rechazado' ? 'rgba(239, 68, 68, 0.15)' :
                      selected.estado === 'observaciones' ? 'rgba(239, 68, 68, 0.15)' :
                        'rgba(156, 163, 175, 0.15)',
                  border: selected.estado === 'aprobado' ? '1px solid rgba(16, 185, 129, 0.3)' :
                    selected.estado === 'rechazado' ? '1px solid rgba(239, 68, 68, 0.3)' :
                      selected.estado === 'observaciones' ? '1px solid rgba(239, 68, 68, 0.3)' :
                        '1px solid rgba(156, 163, 175, 0.3)',
                  color: selected.estado === 'aprobado' ? '#10b981' :
                    selected.estado === 'rechazado' ? '#ef4444' :
                      selected.estado === 'observaciones' ? '#ef4444' :
                        '#9ca3af'
                }}>
                  {selected.estado}
                </div>
              </div>
            </div>

            {/* Documentos - Botones con íconos claros */}
            <div style={{
              marginTop: 14,
              display: 'grid',
              gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fit, minmax(140px, 1fr))',
              gap: 10
            }}>
              {/* Comprobante */}
              <a
                href={selected.comprobante_pago_url || '#'}
                target="_blank"
                rel="noreferrer"
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                  padding: '10px 12px',
                  borderRadius: 8,
                  border: '1px solid rgba(16, 185, 129, 0.3)',
                  background: 'rgba(16, 185, 129, 0.08)',
                  textDecoration: 'none',
                  transition: 'all 0.2s ease',
                  cursor: 'pointer'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(16, 185, 129, 0.15)';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(16, 185, 129, 0.2)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(16, 185, 129, 0.08)';
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                <Download size={18} color="#10b981" />
                <span style={{
                  color: '#10b981',
                  fontSize: '0.8rem',
                  fontWeight: '600',
                  textAlign: 'center'
                }}>
                  Comprobante
                </span>
              </a>

              {/* Documentos */}
              {selected && (() => {
                const esEcuatoriano = selected.identificacion_solicitante && /^\d{10}$/.test(selected.identificacion_solicitante);

                if (esEcuatoriano) {
                  return (
                    <a
                      href={selected.documento_identificacion_url || '#'}
                      target="_blank"
                      rel="noreferrer"
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 6,
                        padding: '10px 12px',
                        borderRadius: 8,
                        border: '1px solid rgba(59, 130, 246, 0.3)',
                        background: 'rgba(59, 130, 246, 0.08)',
                        textDecoration: 'none',
                        transition: 'all 0.2s ease',
                        cursor: 'pointer'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'rgba(59, 130, 246, 0.15)';
                        e.currentTarget.style.transform = 'translateY(-2px)';
                        e.currentTarget.style.boxShadow = '0 4px 12px rgba(59, 130, 246, 0.2)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'rgba(59, 130, 246, 0.08)';
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = 'none';
                      }}
                    >
                      <IdCard size={18} color="#3b82f6" />
                      <span style={{
                        color: '#3b82f6',
                        fontSize: '0.8rem',
                        fontWeight: '600',
                        textAlign: 'center'
                      }}>
                        Identificación
                      </span>
                    </a>
                  );
                } else {
                  return (
                    <>
                      <a
                        href={selected.documento_identificacion_url || '#'}
                        target="_blank"
                        rel="noreferrer"
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: 6,
                          padding: '10px 12px',
                          borderRadius: 8,
                          border: '1px solid rgba(59, 130, 246, 0.3)',
                          background: 'rgba(59, 130, 246, 0.08)',
                          textDecoration: 'none',
                          transition: 'all 0.2s ease',
                          cursor: 'pointer'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = 'rgba(59, 130, 246, 0.15)';
                          e.currentTarget.style.transform = 'translateY(-2px)';
                          e.currentTarget.style.boxShadow = '0 4px 12px rgba(59, 130, 246, 0.2)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = 'rgba(59, 130, 246, 0.08)';
                          e.currentTarget.style.transform = 'translateY(0)';
                          e.currentTarget.style.boxShadow = 'none';
                        }}
                      >
                        <IdCard size={18} color="#3b82f6" />
                        <span style={{
                          color: '#3b82f6',
                          fontSize: '0.8rem',
                          fontWeight: '600',
                          textAlign: 'center'
                        }}>
                          Pasaporte
                        </span>
                      </a>
                      <a
                        href={selected.documento_estatus_legal_url || '#'}
                        target="_blank"
                        rel="noreferrer"
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: 6,
                          padding: '10px 12px',
                          borderRadius: 8,
                          border: '1px solid rgba(168, 85, 247, 0.3)',
                          background: 'rgba(168, 85, 247, 0.08)',
                          textDecoration: 'none',
                          transition: 'all 0.2s ease',
                          cursor: 'pointer'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = 'rgba(168, 85, 247, 0.15)';
                          e.currentTarget.style.transform = 'translateY(-2px)';
                          e.currentTarget.style.boxShadow = '0 4px 12px rgba(168, 85, 247, 0.2)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = 'rgba(168, 85, 247, 0.08)';
                          e.currentTarget.style.transform = 'translateY(0)';
                          e.currentTarget.style.boxShadow = 'none';
                        }}
                      >
                        <FileText size={18} color="#a855f7" />
                        <span style={{
                          color: '#a855f7',
                          fontSize: '0.8rem',
                          fontWeight: '600',
                          textAlign: 'center'
                        }}>
                          Estatus Legal
                        </span>
                      </a>
                    </>
                  );
                }
              })()}
              {selected && selected.certificado_cosmetologia_url && (
                <a
                  href={selected.certificado_cosmetologia_url}
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 6,
                    padding: '10px 12px',
                    borderRadius: 8,
                    border: '1px solid rgba(236, 72, 153, 0.3)',
                    background: 'rgba(236, 72, 153, 0.08)',
                    textDecoration: 'none',
                    transition: 'all 0.2s ease',
                    cursor: 'pointer'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(236, 72, 153, 0.15)';
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(236, 72, 153, 0.2)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(236, 72, 153, 0.08)';
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  <FileText size={18} color="#ec4899" />
                  <span style={{
                    color: '#ec4899',
                    fontSize: '0.8rem',
                    fontWeight: '600',
                    textAlign: 'center'
                  }}>
                    Certificado
                  </span>
                </a>
              )
              }
            </div>
            {(() => {
              const curso = cursos.find(c => c.id_curso === selected.id_curso);
              const cursoBlocked = curso?.estado === 'cancelado';

              if (cursoBlocked) {
                return (
                  <div style={{ marginTop: 24 }}>
                    <div style={{
                      background: 'rgba(239, 68, 68, 0.1)',
                      border: '1px solid rgba(239, 68, 68, 0.3)',
                      borderRadius: '0.75rem',
                      padding: '1rem',
                      marginBottom: '1rem'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                        <Lock size={20} />
                        <h4 style={{ color: '#ef4444', margin: 0, fontSize: '1rem', fontWeight: '600' }}>
                          Curso Bloqueado
                        </h4>
                      </div>
                      <p style={{ color: 'var(--admin-text-primary, rgba(255,255,255,0.8))', margin: 0, fontSize: '0.9rem' }}>
                        Este curso está temporalmente bloqueado. Las matrículas están suspendidas hasta que se reactive el curso.
                        Solo se pueden rechazar solicitudes pendientes.
                      </p>
                    </div>
                    <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
                      <button onClick={() => handleDecision('rechazado')} disabled={decidiendo} style={{ background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#ef4444', padding: '10px 1rem', borderRadius: 12, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                        <XCircle size={16} /> Rechazar
                      </button>
                    </div>
                  </div>
                );
              }

              // Solo mostrar botones si el estado es 'pendiente'
              if (selected.estado !== 'pendiente') {
                return (
                  <div style={{ marginTop: 24, textAlign: 'center' }}>
                    <div style={{
                      background: selected.estado === 'aprobado' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                      border: selected.estado === 'aprobado' ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid rgba(239, 68, 68, 0.3)',
                      borderRadius: '0.75rem',
                      padding: '1rem',
                      display: 'inline-block'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <span>
                          {selected.estado === 'aprobado' ? <CheckCircle2 size={28} color="#10b981" /> : selected.estado === 'rechazado' ? <XCircle size={28} color="#ef4444" /> : <AlertCircle size={28} color="#ef4444" />}
                        </span>
                        <div style={{ textAlign: 'left' }}>
                          <h4 style={{
                            color: selected.estado === 'aprobado' ? '#10b981' : '#ef4444',
                            margin: '0 0 0.25rem 0',
                            fontSize: '1rem',
                            fontWeight: '600',
                            textTransform: 'capitalize'
                          }}>
                            Solicitud {selected.estado}
                          </h4>
                          <p style={{ color: 'var(--admin-text-primary, rgba(255,255,255,0.7))', margin: 0, fontSize: '0.85rem' }}>
                            {selected.estado === 'aprobado'
                              ? 'Esta solicitud ya fue aprobada y el estudiante fue creado exitosamente.'
                              : selected.estado === 'rechazado'
                                ? 'Esta solicitud fue rechazada anteriormente.'
                                : 'Esta solicitud tiene observaciones pendientes.'}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              }

              return (
                <div style={{
                  display: 'flex',
                  flexDirection: isMobile ? 'column-reverse' : 'row',
                  gap: 12,
                  justifyContent: 'flex-end',
                  marginTop: isMobile ? 20 : 24
                }}>
                  <button
                    onClick={() => handleDecision('rechazado')}
                    disabled={decidiendo}
                    style={{
                      background: 'rgba(239, 68, 68, 0.15)',
                      border: '1px solid rgba(239, 68, 68, 0.3)',
                      color: '#ef4444',
                      padding: '12px 1.25rem',
                      borderRadius: 12,
                      cursor: decidiendo ? 'not-allowed' : 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 8,
                      opacity: decidiendo ? 0.6 : 1,
                      fontSize: '0.95rem',
                      fontWeight: '600',
                      width: isMobile ? '100%' : 'auto'
                    }}
                  >
                    <XCircle size={16} /> Rechazar
                  </button>
                  <button
                    onClick={() => {
                      setShowModal(false); // Cerrar modal de detalle
                      openApprovalModal(selected); // Abrir modal de aprobación
                    }}
                    disabled={decidiendo}
                    style={{
                      background: 'linear-gradient(135deg, #10b981, #059669)',
                      border: 'none',
                      color: '#fff',
                      padding: '12px 1.25rem',
                      borderRadius: 12,
                      cursor: decidiendo ? 'not-allowed' : 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 8,
                      opacity: decidiendo ? 0.6 : 1,
                      fontSize: '0.95rem',
                      fontWeight: '600',
                      width: isMobile ? '100%' : 'auto'
                    }}
                  >
                    <Check size={16} /> Aprobar
                  </button>
                </div>
              );
            })()}
            {/* Animaciones CSS */}
            <style>{`
            @keyframes scaleIn {
              from {
                opacity: 0;
                transform: scale(0.9);
              }
              to {
                opacity: 1;
                transform: scale(1);
              }
            }
          `}</style>
          </div>
        </div>,
        document.body
      )}

      {/* Modal Comprobante */}
      {showComprobanteModal && createPortal(
        <div
          className="modal-overlay"
          onClick={() => setShowComprobanteModal(false)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            width: '100vw',
            height: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 99999,
            padding: isMobile ? '1rem' : '2rem',
            backdropFilter: 'blur(8px)',
            background: 'rgba(0, 0, 0, 0.65)',
            overflowY: 'auto',
            overflowX: 'hidden',
            scrollBehavior: 'smooth'
          }}
        >
          <div
            className="modal-content"
            onClick={(e) => e.stopPropagation()}
            style={{
              position: 'relative',
              background: 'var(--admin-card-bg, linear-gradient(135deg, rgba(0,0,0,0.9) 0%, rgba(26,26,46,0.9) 100%))',
              border: '1px solid rgba(239, 68, 68, 0.2)',
              borderRadius: '12px',
              width: isMobile ? '92vw' : '600px',
              maxWidth: isMobile ? '92vw' : '600px',
              maxHeight: '85vh',
              padding: isMobile ? '0.75rem 0.875rem' : '1rem 1.5rem',
              margin: 'auto',
              color: 'var(--admin-text-primary, #fff)',
              boxShadow: '0 20px 60px -12px rgba(0, 0, 0, 0.5)',
              overflowY: 'auto',
              overflowX: 'hidden',
              animation: 'scaleIn 0.3s ease-out',
              display: 'flex',
              flexDirection: 'column'
            }}
          >
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: isMobile ? 12 : 14,
              paddingBottom: isMobile ? 8 : 10,
              borderBottom: '1px solid rgba(239, 68, 68, 0.2)',
            }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Download size={isMobile ? 18 : 20} style={{ color: '#10b981' }} />
                  <h3 style={{ margin: 0, color: '#10b981', fontSize: isMobile ? '0.95rem' : '1.05rem', fontWeight: '600', letterSpacing: '-0.01em' }}>
                    Comprobante de Pago
                  </h3>
                </div>
                {comprobanteNumero && (
                  <p style={{
                    margin: '6px 0 0 1.75rem',
                    color: '#ef4444',
                    fontSize: '0.85rem',
                    fontWeight: '600'
                  }}>
                    Número: {comprobanteNumero}
                  </p>
                )}
              </div>
              <button
                onClick={() => setShowComprobanteModal(false)}
                style={{
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '8px',
                  padding: '6px',
                  color: 'var(--admin-text-primary, #fff)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.2s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)';
                  e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.4)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
                  e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)';
                }}
              >
                <X size={18} />
              </button>
            </div>

            <div style={{
              flex: 1,
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              background: 'rgba(255,255,255,0.05)',
              borderRadius: '0.75rem',
              padding: '1rem',
              overflow: 'hidden'
            }}>
              <img
                src={comprobanteUrl}
                alt="Comprobante de pago"
                style={{
                  maxWidth: '100%',
                  maxHeight: '100%',
                  objectFit: 'contain',
                  borderRadius: '0.5rem'
                }}
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                  const errorDiv = document.createElement('div');
                  errorDiv.innerHTML = `
                    <div style="text-align: center; color: rgba(255,255,255,0.7);">
                      <p>No se pudo cargar la imagen del comprobante</p>
                      <a href="${comprobanteUrl}" target="_blank" style="color: #10b981; text-decoration: underline;">
                        Abrir en nueva pestaña
                      </a>
                    </div>
                  `;
                  (e.target as HTMLImageElement).parentNode?.appendChild(errorDiv);
                }}
              />
            </div>

            <div style={{
              marginTop: '1rem',
              display: 'flex',
              justifyContent: 'center',
              gap: '0.75rem'
            }}>
              <a
                href={comprobanteUrl}
                target="_blank"
                rel="noreferrer"
                style={{
                  background: 'rgba(16, 185, 129, 0.15)',
                  border: '1px solid rgba(16, 185, 129, 0.3)',
                  color: '#10b981',
                  padding: '10px 1rem',
                  borderRadius: '0.5rem',
                  textDecoration: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  fontSize: '0.9rem',
                  fontWeight: '500'
                }}
              >
                <Download size={16} />
                Descargar
              </a>
              <button
                onClick={() => setShowComprobanteModal(false)}
                style={{
                  background: 'rgba(156, 163, 175, 0.15)',
                  border: '1px solid rgba(156, 163, 175, 0.3)',
                  color: '#9ca3af',
                  padding: '10px 1rem',
                  borderRadius: '0.5rem',
                  cursor: 'pointer',
                  fontSize: '0.9rem',
                  fontWeight: '500'
                }}
              >
                Cerrar
              </button>
            </div>
            {/* Animaciones CSS */}
            <style>{`
              @keyframes scaleIn {
                from {
                  opacity: 0;
                  transform: scale(0.9);
                }
                to {
                  opacity: 1;
              transform: scale(1);
                }
              }
            `}</style>
          </div>
        </div>,
        document.body
      )}

      {/* Modal de Aprobación */}
      {showApprovalModal && approvalData && createPortal(
        <div
          className="modal-overlay"
          onClick={() => setShowApprovalModal(false)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            width: '100vw',
            height: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 99999,
            padding: isMobile ? '1rem' : '2rem',
            backdropFilter: 'blur(8px)',
            background: 'rgba(0, 0, 0, 0.65)',
            overflowY: 'auto',
            overflowX: 'hidden',
            scrollBehavior: 'smooth'
          }}
        >
          <div
            className="modal-content"
            onClick={(e) => e.stopPropagation()}
            style={{
              position: 'relative',
              background: 'var(--admin-card-bg, linear-gradient(135deg, rgba(0,0,0,0.9) 0%, rgba(26,26,46,0.9) 100%))',
              border: '1px solid rgba(239, 68, 68, 0.2)',
              borderRadius: '12px',
              width: isMobile ? '92vw' : '700px',
              maxWidth: isMobile ? '92vw' : '700px',
              maxHeight: '85vh',
              padding: isMobile ? '0.75rem 0.875rem' : '1rem 1.5rem',
              margin: 'auto',
              color: 'var(--admin-text-primary, #fff)',
              boxShadow: '0 20px 60px -12px rgba(0, 0, 0, 0.5)',
              overflowY: 'auto',
              overflowX: 'hidden',
              animation: 'scaleIn 0.3s ease-out'
            }}
          >
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: isMobile ? 12 : 14,
              paddingBottom: isMobile ? 8 : 10,
              borderBottom: '1px solid rgba(239, 68, 68, 0.2)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Check size={isMobile ? 18 : 20} style={{ color: '#10b981' }} />
                <h3 style={{ margin: 0, color: '#10b981', fontSize: isMobile ? '0.95rem' : '1.05rem', fontWeight: '600', letterSpacing: '-0.01em' }}>
                  {approvalData?.id_estudiante_existente ? 'Crear Matrícula' : 'Crear Estudiante'}
                </h3>
              </div>
              <button
                onClick={() => setShowApprovalModal(false)}
                style={{
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '8px',
                  padding: '6px',
                  color: 'var(--admin-text-primary, #fff)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.2s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)';
                  e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.4)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
                  e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)';
                }}
              >
                <X size={16} />
              </button>
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
              gap: isMobile ? 12 : 16
            }}>
              {/* Nombres - Siempre visible */}
              <div>
                <div style={{ color: 'var(--admin-text-secondary, rgba(255,255,255,0.6))', fontSize: '0.75rem', marginBottom: 3 }}>Nombres</div>
                <div style={{ color: 'var(--admin-text-primary, #fff)', fontWeight: '600' }}>
                  {(approvalData?.nombre_solicitante && approvalData.nombre_solicitante.trim()) || 'No especificado'}
                </div>
              </div>

              {/* Apellidos - Siempre visible */}
              <div>
                <div style={{ color: 'var(--admin-text-secondary, rgba(255,255,255,0.6))', fontSize: '0.75rem', marginBottom: 3 }}>Apellidos</div>
                <div style={{ color: 'var(--admin-text-primary, #fff)', fontWeight: '600' }}>
                  {(approvalData?.apellido_solicitante && approvalData.apellido_solicitante.trim()) || 'No especificado'}
                </div>
              </div>

              {/* Identificación - Siempre visible */}
              <div>
                <div style={{ color: 'var(--admin-text-secondary, rgba(255,255,255,0.6))', fontSize: '0.75rem', marginBottom: 3 }}>Identificación</div>
                <div style={{ color: 'var(--admin-text-primary, #fff)' }}>
                  {(approvalData?.identificacion_solicitante && approvalData.identificacion_solicitante.trim()) || 'No especificado'}
                </div>
              </div>

              {/* Email - Siempre visible */}
              <div>
                <div style={{ color: 'var(--admin-text-secondary, rgba(255,255,255,0.6))', fontSize: '0.75rem', marginBottom: 3 }}>Email</div>
                <div style={{ color: 'var(--admin-text-primary, #fff)' }}>
                  {(approvalData?.email_solicitante && approvalData.email_solicitante.trim()) || 'No especificado'}
                </div>
              </div>

              {/* Teléfono - Siempre visible */}
              <div>
                <div style={{ color: 'var(--admin-text-secondary, rgba(255,255,255,0.6))', fontSize: '0.75rem', marginBottom: 3 }}>Teléfono</div>
                <div style={{ color: 'var(--admin-text-primary, #fff)' }}>
                  {(approvalData?.telefono_solicitante && approvalData.telefono_solicitante.trim()) || 'No especificado'}
                </div>
              </div>

              {/* Fecha de Nacimiento - Siempre visible */}
              <div>
                <div style={{ color: 'var(--admin-text-secondary, rgba(255,255,255,0.6))', fontSize: '0.75rem', marginBottom: 3 }}>Fecha de Nacimiento</div>
                <div style={{ color: 'var(--admin-text-primary, #fff)' }}>
                  {(() => {
                    try {
                      if (approvalData?.fecha_nacimiento_solicitante && approvalData.fecha_nacimiento_solicitante.trim()) {
                        const fecha = new Date(approvalData.fecha_nacimiento_solicitante);
                        if (!isNaN(fecha.getTime())) {
                          const meses = [
                            'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
                            'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
                          ];
                          const dia = fecha.getDate();
                          const mes = meses[fecha.getMonth()];
                          const año = fecha.getFullYear();
                          return `${dia}/${mes}/${año}`;
                        }
                      }
                      return 'No especificado';
                    } catch (error) {
                      console.error('Error formateando fecha:', error);
                      return 'No especificado';
                    }
                  })()}
                </div>
              </div>

              {/* Tipo de Curso - Siempre visible */}
              <div>
                <div style={{ color: 'var(--admin-text-secondary, rgba(255,255,255,0.6))', fontSize: '0.75rem', marginBottom: 3 }}>Tipo de Curso</div>
                <div style={{ color: 'var(--admin-text-primary, #fff)' }}>
                  {((approvalData as any)?.tipo_curso_nombre && (approvalData as any).tipo_curso_nombre.trim()) || 'No especificado'}
                </div>
              </div>

              {/* Horario Preferido - Siempre visible */}
              <div>
                <div style={{ color: 'var(--admin-text-secondary, rgba(255,255,255,0.6))', fontSize: '0.75rem', marginBottom: 3 }}>Horario Preferido</div>
                <div style={{
                  color: 'var(--admin-text-primary, #fff)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  textTransform: 'capitalize'
                }}>
                  <Clock size={16} color="#ef4444" />
                  {(approvalData?.horario_preferido && approvalData.horario_preferido.trim()) || 'No especificado'}
                </div>
              </div>
            </div>

            {/* Usuario Generado - Solo mostrar si NO es estudiante existente */}
            {!approvalData?.id_estudiante_existente && (
              <div style={{ marginTop: 16, background: 'rgba(16, 185, 129, 0.05)', border: '1px solid rgba(16, 185, 129, 0.15)', borderRadius: 12, padding: 16 }}>
                <h4 style={{ margin: '0 0 0.75rem 0', color: 'var(--admin-text-primary, #fff)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <GraduationCap size={18} color="#10b981" />
                  Usuario Generado Automáticamente
                </h4>
                <div style={{
                  color: '#10b981',
                  fontSize: '1.2rem',
                  fontWeight: '700',
                  background: 'rgba(16, 185, 129, 0.1)',
                  padding: '8px 0.75rem',
                  borderRadius: '0.5rem',
                  border: '1px solid rgba(16, 185, 129, 0.2)',
                  marginBottom: '0.5rem'
                }}>
                  {generatedUsername}
                </div>
                <div style={{
                  color: 'rgba(255,255,255,0.7)',
                  fontSize: '0.85rem'
                }}>
                  Generado a partir de las iniciales del nombre + primer apellido
                </div>
              </div>
            )}

            {/* Alerta para estudiante existente */}
            {approvalData?.id_estudiante_existente && (
              <div style={{
                marginTop: 16,
                background: 'rgba(59, 130, 246, 0.1)',
                border: '1px solid rgba(59, 130, 246, 0.3)',
                borderRadius: 12,
                padding: 16
              }}>
                <h4 style={{ margin: '0 0 0.5rem 0', color: '#3b82f6', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <CheckCircle2 size={18} color="#3b82f6" />
                  Estudiante Existente
                </h4>
                <div style={{
                  color: 'rgba(255,255,255,0.8)',
                  fontSize: '0.9rem',
                  lineHeight: '1.5'
                }}>
                  Este estudiante ya está registrado en el sistema. Solo se creará la matrícula para el nuevo curso.
                  <br />
                  <strong style={{ color: '#3b82f6' }}>No se generarán nuevas credenciales.</strong>
                </div>
              </div>
            )}

            {/* Botones de Acción */}
            <div style={{
              display: 'flex',
              flexDirection: isMobile ? 'column-reverse' : 'row',
              gap: '0.75rem',
              justifyContent: 'flex-end',
              marginTop: isMobile ? '16px' : '1.25rem'
            }}>
              <button
                onClick={() => setShowApprovalModal(false)}
                style={{
                  background: 'rgba(156, 163, 175, 0.15)',
                  border: '1px solid rgba(156, 163, 175, 0.3)',
                  color: '#9ca3af',
                  padding: '10px 1.25rem',
                  borderRadius: '0.5rem',
                  cursor: 'pointer',
                  fontSize: '0.9rem',
                  fontWeight: '500',
                  width: isMobile ? '100%' : 'auto'
                }}
              >
                Cancelar
              </button>
              <button
                onClick={() => handleCreateStudent()}
                disabled={decidiendo}
                style={{
                  background: decidiendo ? 'rgba(156, 163, 175, 0.15)' : 'rgba(16, 185, 129, 0.15)',
                  border: decidiendo ? '1px solid rgba(156, 163, 175, 0.3)' : '1px solid rgba(16, 185, 129, 0.3)',
                  color: decidiendo ? '#9ca3af' : '#10b981',
                  padding: '10px 1.25rem',
                  borderRadius: '0.5rem',
                  cursor: decidiendo ? 'not-allowed' : 'pointer',
                  fontSize: '0.9rem',
                  fontWeight: '500',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.375rem',
                  opacity: decidiendo ? 0.7 : 1,
                  width: isMobile ? '100%' : 'auto'
                }}
              >
                <Check size={16} />
                {decidiendo ? 'Procesando...' : (approvalData?.id_estudiante_existente ? 'Crear Matrícula' : 'Crear Estudiante')}
              </button>
            </div>
            {/* Animaciones CSS */}
            <style>{`
              @keyframes scaleIn {
                from {
                  opacity: 0;
                  transform: scale(0.9);
                }
                to {
                  opacity: 1;
                  transform: scale(1);
                }
              }
            `}</style>
          </div>
        </div>,
        document.body
      )}

      {/* Modal de carga */}
      <LoadingModal
        isOpen={showLoadingModal}
        message="Actualizando datos..."
        darkMode={darkMode}
        duration={500}
        onComplete={() => setShowLoadingModal(false)}
        colorTheme="red"
      />
    </div>
  );
};

export default GestionMatricula;



