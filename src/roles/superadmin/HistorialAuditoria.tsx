import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  Activity, Search, Filter, User, GraduationCap,
  BookOpen, DollarSign, FileText, Users, Building, Package,
  Clock, ChevronLeft, ChevronRight, X, Database, TrendingUp,
  Tag, Send, FileCheck, Star, Bell, LogIn, ClipboardList
} from 'lucide-react';
import LoadingModal from '../../components/LoadingModal';
import AdminSectionHeader from '../../components/AdminSectionHeader';
import { useBreakpoints } from '../../hooks/useMediaQuery';

interface Auditoria {
  id_auditoria: number;
  tabla_afectada: string;
  operacion: 'INSERT' | 'UPDATE' | 'DELETE';
  descripcion: string;
  detalles: string;
  usuario: {
    id: number;
    nombre: string;
    apellido: string;
    username: string;
    email: string;
    cedula: string;
    rol: string;
  };
  fecha_operacion: string;
  ip_address: string | null;
  user_agent: string | null;
}

interface Stats {
  total: number;
  hoy: number;
  porTabla: { tabla: string; cantidad: number }[];
  porUsuario: { usuario_id: number; nombre: string; apellido: string; cantidad: number }[];
}

const HistorialAuditoria: React.FC = () => {
  // ========== BREAKPOINTS ==========
  const { isMobile, isSmallScreen } = useBreakpoints();

  // ========== THEME - Sincronizado con PanelSuperAdmin ==========
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    const saved = localStorage.getItem('superadmin-dark-mode');
    return saved !== null ? JSON.parse(saved) : true;
  });

  useEffect(() => {
    const syncDarkMode = () => {
      const saved = localStorage.getItem('superadmin-dark-mode');
      const newMode = saved !== null ? JSON.parse(saved) : true;
      setDarkMode(prev => (prev === newMode ? prev : newMode));
    };
    const interval = setInterval(syncDarkMode, 150);
    window.addEventListener('storage', syncDarkMode);
    return () => {
      clearInterval(interval);
      window.removeEventListener('storage', syncDarkMode);
    };
  }, []);

  // Sistema de colores mejorado
  const theme = {
    pageBg: darkMode
      ? 'linear-gradient(135deg, #0a0a0f 0%, #0f0f15 50%, #0a0a0f 100%)'
      : 'linear-gradient(135deg, #f8f9fa 0%, #fff5f5 50%, #f8f9fa 100%)',
    cardBg: darkMode ? 'rgba(20, 20, 28, 0.95)' : '#ffffff',
    cardBorder: darkMode ? 'rgba(239, 68, 68, 0.2)' : 'rgba(239, 68, 68, 0.15)',
    cardShadow: darkMode
      ? '0 4px 12px rgba(0, 0, 0, 0.4), 0 2px 4px rgba(0, 0, 0, 0.3)'
      : '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    textPrimary: darkMode ? 'rgba(255, 255, 255, 0.95)' : '#111827',
    textSecondary: darkMode ? 'rgba(255, 255, 255, 0.75)' : '#4b5563',
    textMuted: darkMode ? 'rgba(255, 255, 255, 0.55)' : '#6b7280',
    inputBg: darkMode ? 'rgba(255, 255, 255, 0.05)' : '#ffffff',
    inputBorder: darkMode ? 'rgba(255, 255, 255, 0.15)' : '#d1d5db',
    inputBorderHover: darkMode ? 'rgba(239, 68, 68, 0.4)' : '#ef4444',
    recordBg: darkMode ? 'rgba(30, 30, 38, 0.8)' : '#f9fafb',
    recordBgHover: darkMode ? 'rgba(40, 40, 48, 0.9)' : '#f3f4f6',
    recordBorder: darkMode ? 'rgba(255, 255, 255, 0.08)' : '#e5e7eb',
    recordBorderHover: darkMode ? 'rgba(239, 68, 68, 0.3)' : '#d1d5db',
    iconBg: darkMode ? 'rgba(239, 68, 68, 0.15)' : 'rgba(239, 68, 68, 0.1)',
    modalBg: darkMode ? 'rgba(15, 15, 20, 0.98)' : '#ffffff',
    modalOverlay: darkMode ? 'rgba(0, 0, 0, 0.85)' : 'rgba(0, 0, 0, 0.6)',
    buttonSecondary: darkMode ? 'rgba(255, 255, 255, 0.1)' : '#f3f4f6',
    buttonSecondaryHover: darkMode ? 'rgba(255, 255, 255, 0.15)' : '#e5e7eb',
    buttonSecondaryText: darkMode ? 'rgba(255, 255, 255, 0.9)' : '#374151',
  };

  const pick = (light: string, dark: string) => (darkMode ? dark : light);

  // ========== ESTADOS ==========
  const [auditorias, setAuditorias] = useState<Auditoria[]>([]);
  const [stats, setStats] = useState<Stats>({
    total: 0,
    hoy: 0,
    porTabla: [],
    porUsuario: [],
  });
  const [loading, setLoading] = useState(false);
  const [loadingText, setLoadingText] = useState('Cargando...');

  // Filtros
  const [filtros, setFiltros] = useState({
    busqueda: '',
    tabla: '',
    operacion: '',
    rol: '',
    fecha_inicio: '',
    fecha_fin: '',
    usuario_id: '',
  });

  // Paginación
  const [paginaActual, setPaginaActual] = useState(1);
  const [totalPaginas, setTotalPaginas] = useState(1);
  const limite = 15;

  // Modal
  const [modalDetalle, setModalDetalle] = useState<Auditoria | null>(null);

  // ========== EFFECTS ==========
  useEffect(() => {
    cargarAuditorias();
  }, [paginaActual, filtros]);

  // ========== FUNCIONES DE CARGA ==========
  const cargarAuditorias = async () => {
    setLoading(true);
    setLoadingText('Cargando historial de auditoría...');

    try {
      const token = sessionStorage.getItem('auth_token');
      if (!token) {
        throw new Error('No hay sesión activa');
      }

      const params = new URLSearchParams({
        pagina: paginaActual.toString(),
        limite: limite.toString(),
      });

      if (filtros.busqueda) params.append('busqueda', filtros.busqueda);
      if (filtros.tabla) params.append('tabla', filtros.tabla);
      if (filtros.operacion) params.append('operacion', filtros.operacion);
      if (filtros.rol) params.append('rol', filtros.rol);
      if (filtros.fecha_inicio) params.append('fecha_inicio', filtros.fecha_inicio);
      if (filtros.fecha_fin) params.append('fecha_fin', filtros.fecha_fin);
      if (filtros.usuario_id) params.append('usuario_id', filtros.usuario_id);

      const response = await fetch(
        `${(import.meta.env.VITE_API_URL || 'http://localhost:3000')}/api/auditoria/historial-completo?${params}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error('Error al cargar el historial');
      }

      const data = await response.json();

      if (data.success) {
        setAuditorias(data.data.auditorias);
        setStats({
          total: data.data.total,
          hoy: data.data.hoy || 0,
          porTabla: data.data.porTabla || [],
          porUsuario: data.data.porUsuario || [],
        });
        setTotalPaginas(data.data.totalPaginas);
      }
    } catch (err: unknown) {
      console.error('Error al cargar auditorías:', err);
    } finally {
      setLoading(false);
    }
  };

  // ========== FUNCIONES AUXILIARES ==========
  const formatearFecha = (fecha: string) => {
    return new Date(fecha).toLocaleString('es-EC', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getTablaIcon = (tabla: string) => {
    const iconMap: Record<string, JSX.Element> = {
      cursos: <BookOpen size={18} />,
      tipos_cursos: <Package size={18} />,
      matriculas: <GraduationCap size={18} />,
      solicitudes_matricula: <ClipboardList size={18} />,
      pagos_mensuales: <DollarSign size={18} />,
      docentes: <Users size={18} />,
      estudiantes: <Users size={18} />,
      estudiante_curso: <GraduationCap size={18} />,
      estudiante_promocion: <Tag size={18} />,
      promociones: <Tag size={18} />,
      aulas: <Building size={18} />,
      asignaciones_aulas: <Clock size={18} />,
      modulos_curso: <Package size={18} />,
      usuarios: <User size={18} />,
      asistencias: <FileCheck size={18} />,
      calificaciones_tareas: <Star size={18} />,
      entregas_tareas: <Send size={18} />,
      tareas_modulo: <FileText size={18} />,
      sesiones_usuario: <LogIn size={18} />,
      notificaciones: <Bell size={18} />,
      reportes_generados: <FileText size={18} />,
      roles: <Users size={18} />,
      configuracion_sistema: <Database size={18} />,
    };
    return iconMap[tabla] || <Database size={18} />;
  };

  const getOperacionBadge = (operacion: string) => {
    const badges: Record<string, { bg: string; text: string; label: string }> = {
      INSERT: {
        bg: darkMode ? 'rgba(34, 197, 94, 0.2)' : '#d1fae5',
        text: darkMode ? '#4ade80' : '#047857',
        label: 'CREACIÓN'
      },
      UPDATE: {
        bg: darkMode ? 'rgba(59, 130, 246, 0.2)' : '#dbeafe',
        text: darkMode ? '#60a5fa' : '#1d4ed8',
        label: 'MODIFICACIÓN'
      },
      DELETE: {
        bg: darkMode ? 'rgba(239, 68, 68, 0.25)' : '#fee2e2',
        text: darkMode ? '#f87171' : '#b91c1c',
        label: 'ELIMINACIÓN'
      },
    };
    return badges[operacion] || {
      bg: darkMode ? 'rgba(255, 255, 255, 0.1)' : '#f3f4f6',
      text: darkMode ? 'rgba(255, 255, 255, 0.7)' : '#6b7280',
      label: operacion
    };
  };

  const limpiarFiltros = () => {
    setFiltros({
      busqueda: '',
      tabla: '',
      operacion: '',
      rol: '',
      fecha_inicio: '',
      fecha_fin: '',
      usuario_id: '',
    });
    setPaginaActual(1);
  };

  const renderDetalles = () => {
    if (!modalDetalle || !modalDetalle.detalles) return null;

    // Función para formatear nombres de campos
    const formatearNombreCampo = (campo: string) => {
      return campo
        .replace(/_/g, ' ')
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
    };

    // Función para formatear valores
    const formatearValor = (valor: any, key?: string) => {
      console.log('formatearValor:', { key, valor, type: typeof valor });
      if (typeof valor === 'boolean') {
        return valor ? 'Sí' : 'No';
      }
      if (typeof valor === 'number') {
        // Si parece un monto (tiene decimales o es un campo de dinero)
        if (valor % 1 !== 0 || String(valor).includes('.')) {
          return `$${valor.toFixed(2)}`;
        }
        return valor.toString();
      }
      if (valor === null || valor === undefined) {
        return 'N/A';
      }
      if (typeof valor === 'string') {
        // Formateo específico para días
        if (key && key.toLowerCase() === 'dias') {
          return valor
            .split(',')
            .map(d => d.trim())
            .map(d => d.charAt(0).toUpperCase() + d.slice(1).toLowerCase())
            .join(', ');
        }

        // Si es una fecha (formato ISO)
        if (/^\d{4}-\d{2}-\d{2}/.test(valor)) {
          try {
            return new Date(valor).toLocaleDateString('es-EC', {
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            });
          } catch {
            // Si falla, capitalizar la primera letra
            return valor.charAt(0).toUpperCase() + valor.slice(1);
          }
        }
        // Capitalizar la primera letra de strings
        if (valor.length > 0) {
          return valor.charAt(0).toUpperCase() + valor.slice(1);
        }
        return valor;
      }
      return String(valor);
    };

    // Asegurar que detalles sea un objeto (si viene como string JSON)
    let detallesObj = modalDetalle.detalles;
    if (typeof detallesObj === 'string') {
      try {
        detallesObj = JSON.parse(detallesObj);
      } catch (e) {
        console.error('Error al parsear detalles:', e);
        return <p style={{ color: '#fff' }}>{String(detallesObj)}</p>;
      }
    }

    // Filtrar campos que no queremos mostrar
    const camposIgnorados = ['id', 'id_curso', 'id_estudiante', 'id_docente', 'password', 'token'];
    const detallesFiltrados = Object.entries(detallesObj).filter(([key, value]) => {
      if (camposIgnorados.includes(key)) return false;
      if (key.startsWith('id_')) return false; // Ignorar IDs foráneos
      return true;
    });

    if (detallesFiltrados.length === 0) return null;

    return (
      <div style={{ marginTop: '1.5rem' }}>
        <h4 style={{
          margin: '0 0 1rem 0',
          fontSize: '1rem',
          fontWeight: '600',
          color: theme.textPrimary,
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem'
        }}>
          <FileText size={18} color="#ef4444" />
          Información Detallada
        </h4>
        <div
          style={{
            backgroundColor: darkMode ? 'rgba(0, 0, 0, 0.2)' : '#f9fafb',
            border: `1px solid ${theme.recordBorder}`,
            borderRadius: '10px',
            overflow: 'hidden',
          }}
        >
          {detallesFiltrados.map(([key, value], index) => (
            <div
              key={key}
              style={{
                padding: '0.875rem 1rem',
                borderBottom: index < detallesFiltrados.length - 1
                  ? `1px solid ${theme.recordBorder}`
                  : 'none',
                display: 'grid',
                gridTemplateColumns: '1fr 2fr',
                gap: '1rem',
                alignItems: 'start',
                transition: 'background-color 0.2s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = darkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.02)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              <p style={{
                margin: 0,
                fontSize: '0.8125rem',
                fontWeight: '500',
                color: theme.textMuted
              }}>
                {formatearNombreCampo(key)}
              </p>
              <p style={{
                margin: 0,
                fontSize: '0.875rem',
                fontWeight: '500',
                color: theme.textPrimary,
                wordBreak: 'break-word'
              }}>
                {formatearValor(value, key)}
              </p>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // ========== RENDER ==========
  return (
    <>
      <LoadingModal isOpen={loading} message={loadingText} />

      <div
        style={{
          minHeight: '100vh',
          background: theme.pageBg,
          padding: isMobile ? '1rem' : (isSmallScreen ? '1.5rem' : '2rem'),
          transition: 'all 0.3s ease',
        }}
      >
        {/* Header */}
        <AdminSectionHeader
          title="Historial de Auditoría"
          subtitle="Seguimiento completo de todas las operaciones del sistema"
        />

        {/* Estadísticas */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr' : (isSmallScreen ? 'repeat(2, 1fr)' : 'repeat(auto-fit, minmax(200px, 1fr))'),
            gap: isMobile ? '0.75rem' : '1rem',
            marginBottom: isMobile ? '1rem' : '1.5rem',
          }}
        >
          {/* Total de registros */}
          <div
            style={{
              backgroundColor: theme.cardBg,
              borderRadius: '10px',
              padding: '1rem',
              boxShadow: theme.cardShadow,
              border: `1px solid ${theme.cardBorder}`,
              backdropFilter: 'blur(10px)',
              transition: 'all 0.3s ease',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '10px',
                  backgroundColor: darkMode ? 'rgba(239, 68, 68, 0.2)' : 'rgba(239, 68, 68, 0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <Activity size={20} color="#ef4444" />
              </div>
              <div style={{ minWidth: 0, flex: 1 }}>
                <p style={{ margin: 0, fontSize: '0.75rem', color: theme.textMuted, lineHeight: 1.2 }}>
                  Total de Registros
                </p>
                <p style={{ margin: '0.25rem 0 0 0', fontSize: '1.5rem', fontWeight: '700', color: theme.textPrimary, lineHeight: 1.2 }}>
                  {stats.total.toLocaleString()}
                </p>
              </div>
            </div>
          </div>

          {/* Actividad hoy */}
          <div
            style={{
              backgroundColor: theme.cardBg,
              borderRadius: '10px',
              padding: '1rem',
              boxShadow: theme.cardShadow,
              border: `1px solid ${theme.cardBorder}`,
              backdropFilter: 'blur(10px)',
              transition: 'all 0.3s ease',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '10px',
                  backgroundColor: darkMode ? 'rgba(34, 197, 94, 0.2)' : 'rgba(34, 197, 94, 0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <TrendingUp size={20} color="#22c55e" />
              </div>
              <div style={{ minWidth: 0, flex: 1 }}>
                <p style={{ margin: 0, fontSize: '0.75rem', color: theme.textMuted, lineHeight: 1.2 }}>
                  Actividad Hoy
                </p>
                <p style={{ margin: '0.25rem 0 0 0', fontSize: '1.5rem', fontWeight: '700', color: theme.textPrimary, lineHeight: 1.2 }}>
                  {stats.hoy.toLocaleString()}
                </p>
              </div>
            </div>
          </div>

          {/* Tablas afectadas */}
          <div
            style={{
              backgroundColor: theme.cardBg,
              borderRadius: '10px',
              padding: '1rem',
              boxShadow: theme.cardShadow,
              border: `1px solid ${theme.cardBorder}`,
              backdropFilter: 'blur(10px)',
              transition: 'all 0.3s ease',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '10px',
                  backgroundColor: darkMode ? 'rgba(59, 130, 246, 0.2)' : 'rgba(59, 130, 246, 0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <Database size={20} color="#3b82f6" />
              </div>
              <div style={{ minWidth: 0, flex: 1 }}>
                <p style={{ margin: 0, fontSize: '0.75rem', color: theme.textMuted, lineHeight: 1.2 }}>
                  Tablas Afectadas
                </p>
                <p style={{ margin: '0.25rem 0 0 0', fontSize: '1.5rem', fontWeight: '700', color: theme.textPrimary, lineHeight: 1.2 }}>
                  {stats.porTabla.length}
                </p>
              </div>
            </div>
          </div>

          {/* Usuarios activos */}
          <div
            style={{
              backgroundColor: theme.cardBg,
              borderRadius: '10px',
              padding: '1rem',
              boxShadow: theme.cardShadow,
              border: `1px solid ${theme.cardBorder}`,
              backdropFilter: 'blur(10px)',
              transition: 'all 0.3s ease',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '10px',
                  backgroundColor: darkMode ? 'rgba(168, 85, 247, 0.2)' : 'rgba(168, 85, 247, 0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <Users size={20} color="#a855f7" />
              </div>
              <div style={{ minWidth: 0, flex: 1 }}>
                <p style={{ margin: 0, fontSize: '0.75rem', color: theme.textMuted, lineHeight: 1.2 }}>
                  Usuarios Activos
                </p>
                <p style={{ margin: '0.25rem 0 0 0', fontSize: '1.5rem', fontWeight: '700', color: theme.textPrimary, lineHeight: 1.2 }}>
                  {stats.porUsuario.length}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Filtros */}
        <div
          style={{
            backgroundColor: theme.cardBg,
            borderRadius: '10px',
            padding: '1.25rem',
            marginBottom: '1.5rem',
            boxShadow: theme.cardShadow,
            border: `1px solid ${theme.cardBorder}`,
            backdropFilter: 'blur(10px)',
            transition: 'all 0.3s ease',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Filter size={18} color="#ef4444" />
              <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: '600', color: theme.textPrimary }}>
                Filtros de Búsqueda
              </h3>
            </div>
            <button
              onClick={limpiarFiltros}
              style={{
                padding: '0.5rem 1rem',
                backgroundColor: theme.buttonSecondary,
                color: theme.buttonSecondaryText,
                border: 'none',
                borderRadius: '6px',
                fontSize: '0.8125rem',
                fontWeight: '500',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.375rem',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = theme.buttonSecondaryHover;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = theme.buttonSecondary;
              }}
            >
              <X size={14} />
              Limpiar Filtros
            </button>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: isMobile ? '1fr' : (isSmallScreen ? 'repeat(2, 1fr)' : 'repeat(auto-fit, minmax(180px, 1fr))'),
              gap: isMobile ? '0.75rem' : '0.875rem',
            }}
          >
            {/* Búsqueda */}
            <div>
              <label
                style={{
                  display: 'block',
                  marginBottom: '0.375rem',
                  fontSize: '0.75rem',
                  fontWeight: '500',
                  color: theme.textSecondary,
                }}
              >
                Buscar
              </label>
              <div style={{ position: 'relative' }}>
                <Search
                  size={16}
                  style={{
                    position: 'absolute',
                    left: '10px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: theme.textMuted,
                    pointerEvents: 'none',
                  }}
                />
                <input
                  type="text"
                  placeholder="Buscar en descripción..."
                  value={filtros.busqueda}
                  onChange={(e) => setFiltros({ ...filtros, busqueda: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '0.5rem 0.625rem 0.5rem 2.25rem',
                    border: `1px solid ${theme.inputBorder}`,
                    borderRadius: '6px',
                    fontSize: '0.8125rem',
                    backgroundColor: theme.inputBg,
                    color: theme.textPrimary,
                    outline: 'none',
                    transition: 'all 0.2s ease',
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = theme.inputBorderHover;
                    e.currentTarget.style.boxShadow = `0 0 0 3px ${darkMode ? 'rgba(239, 68, 68, 0.1)' : 'rgba(239, 68, 68, 0.05)'}`;
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = theme.inputBorder;
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                />
              </div>
            </div>

            {/* Tabla */}
            <div>
              <label
                style={{
                  display: 'block',
                  marginBottom: '0.375rem',
                  fontSize: '0.75rem',
                  fontWeight: '500',
                  color: theme.textSecondary,
                }}
              >
                Tabla
              </label>
              <select
                value={filtros.tabla}
                onChange={(e) => setFiltros({ ...filtros, tabla: e.target.value })}
                style={{
                  width: '100%',
                  padding: '0.5rem 0.625rem',
                  border: `1px solid ${theme.inputBorder}`,
                  borderRadius: '6px',
                  fontSize: '0.8125rem',
                  backgroundColor: theme.inputBg,
                  color: theme.textPrimary,
                  outline: 'none',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = theme.inputBorderHover;
                  e.currentTarget.style.boxShadow = `0 0 0 3px ${darkMode ? 'rgba(239, 68, 68, 0.1)' : 'rgba(239, 68, 68, 0.05)'}`;
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = theme.inputBorder;
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                <option value="">Todas las tablas</option>
                <optgroup label="Académico">
                  <option value="cursos">Cursos</option>
                  <option value="tipos_cursos">Tipos de Cursos</option>
                  <option value="modulos_curso">Módulos</option>
                  <option value="tareas_modulo">Tareas</option>
                  <option value="calificaciones_tareas">Calificaciones</option>
                  <option value="entregas_tareas">Entregas de Tareas</option>
                  <option value="asistencias">Asistencias</option>
                </optgroup>
                <optgroup label="Matrícula y Pagos">
                  <option value="solicitudes_matricula">Solicitudes de Matrícula</option>
                  <option value="matriculas">Matrículas</option>
                  <option value="pagos_mensuales">Pagos Mensuales</option>
                  <option value="promociones">Promociones</option>
                  <option value="estudiante_promocion">Estudiantes con Promoción</option>
                </optgroup>
                <optgroup label="Usuarios">
                  <option value="usuarios">Usuarios</option>
                  <option value="docentes">Docentes</option>
                  <option value="estudiantes">Estudiantes</option>
                  <option value="estudiante_curso">Inscripciones a Cursos</option>
                  <option value="sesiones_usuario">Sesiones</option>
                </optgroup>
                <optgroup label="Infraestructura">
                  <option value="aulas">Aulas</option>
                  <option value="asignaciones_aulas">Asignaciones de Aulas</option>
                </optgroup>
                <optgroup label="Sistema">
                  <option value="notificaciones">Notificaciones</option>
                  <option value="reportes_generados">Reportes Generados</option>
                  <option value="roles">Roles</option>
                  <option value="configuracion_sistema">Configuración del Sistema</option>
                </optgroup>
              </select>
            </div>

            {/* Operación */}
            <div>
              <label
                style={{
                  display: 'block',
                  marginBottom: '0.375rem',
                  fontSize: '0.75rem',
                  fontWeight: '500',
                  color: theme.textSecondary,
                }}
              >
                Operación
              </label>
              <select
                value={filtros.operacion}
                onChange={(e) => setFiltros({ ...filtros, operacion: e.target.value })}
                style={{
                  width: '100%',
                  padding: '0.5rem 0.625rem',
                  border: `1px solid ${theme.inputBorder}`,
                  borderRadius: '6px',
                  fontSize: '0.8125rem',
                  backgroundColor: theme.inputBg,
                  color: theme.textPrimary,
                  outline: 'none',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = theme.inputBorderHover;
                  e.currentTarget.style.boxShadow = `0 0 0 3px ${darkMode ? 'rgba(239, 68, 68, 0.1)' : 'rgba(239, 68, 68, 0.05)'}`;
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = theme.inputBorder;
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                <option value="">Todas las operaciones</option>
                <option value="INSERT">Creaciones</option>
                <option value="UPDATE">Modificaciones</option>
                <option value="DELETE">Eliminaciones</option>
              </select>
            </div>

            {/* Rol */}
            <div>
              <label
                style={{
                  display: 'block',
                  marginBottom: '0.375rem',
                  fontSize: '0.75rem',
                  fontWeight: '500',
                  color: theme.textSecondary,
                }}
              >
                Rol
              </label>
              <select
                value={filtros.rol}
                onChange={(e) => setFiltros({ ...filtros, rol: e.target.value })}
                style={{
                  width: '100%',
                  padding: '0.5rem 0.625rem',
                  border: `1px solid ${theme.inputBorder}`,
                  borderRadius: '6px',
                  fontSize: '0.8125rem',
                  backgroundColor: theme.inputBg,
                  color: theme.textPrimary,
                  outline: 'none',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = theme.inputBorderHover;
                  e.currentTarget.style.boxShadow = `0 0 0 3px ${darkMode ? 'rgba(239, 68, 68, 0.1)' : 'rgba(239, 68, 68, 0.05)'}`;
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = theme.inputBorder;
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                <option value="">Todos los roles</option>
                <option value="administrativo">Administrativo</option>
                <option value="docente">Docente</option>
                <option value="estudiante">Estudiante</option>
              </select>
            </div>

            {/* Fecha inicio */}
            <div>
              <label
                style={{
                  display: 'block',
                  marginBottom: '0.375rem',
                  fontSize: '0.75rem',
                  fontWeight: '500',
                  color: theme.textSecondary,
                }}
              >
                Fecha Inicio
              </label>
              <input
                type="date"
                value={filtros.fecha_inicio}
                onChange={(e) => setFiltros({ ...filtros, fecha_inicio: e.target.value })}
                style={{
                  width: '100%',
                  padding: '0.5rem 0.625rem',
                  border: `1px solid ${theme.inputBorder}`,
                  borderRadius: '6px',
                  fontSize: '0.8125rem',
                  backgroundColor: theme.inputBg,
                  color: theme.textPrimary,
                  outline: 'none',
                  transition: 'all 0.2s ease',
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = theme.inputBorderHover;
                  e.currentTarget.style.boxShadow = `0 0 0 3px ${darkMode ? 'rgba(239, 68, 68, 0.1)' : 'rgba(239, 68, 68, 0.05)'}`;
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = theme.inputBorder;
                  e.currentTarget.style.boxShadow = 'none';
                }}
              />
            </div>

            {/* Fecha fin */}
            <div>
              <label
                style={{
                  display: 'block',
                  marginBottom: '0.375rem',
                  fontSize: '0.75rem',
                  fontWeight: '500',
                  color: theme.textSecondary,
                }}
              >
                Fecha Fin
              </label>
              <input
                type="date"
                value={filtros.fecha_fin}
                onChange={(e) => setFiltros({ ...filtros, fecha_fin: e.target.value })}
                style={{
                  width: '100%',
                  padding: '0.5rem 0.625rem',
                  border: `1px solid ${theme.inputBorder}`,
                  borderRadius: '6px',
                  fontSize: '0.8125rem',
                  backgroundColor: theme.inputBg,
                  color: theme.textPrimary,
                  outline: 'none',
                  transition: 'all 0.2s ease',
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = theme.inputBorderHover;
                  e.currentTarget.style.boxShadow = `0 0 0 3px ${darkMode ? 'rgba(239, 68, 68, 0.1)' : 'rgba(239, 68, 68, 0.05)'}`;
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = theme.inputBorder;
                  e.currentTarget.style.boxShadow = 'none';
                }}
              />
            </div>
          </div>
        </div>

        {/* Lista de Auditorías */}
        <div
          style={{
            backgroundColor: theme.cardBg,
            borderRadius: '12px',
            padding: '1.5rem',
            boxShadow: theme.cardShadow,
            border: `1px solid ${theme.cardBorder}`,
            backdropFilter: 'blur(10px)',
            transition: 'all 0.3s ease',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '1.5rem',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
              <FileText size={20} color="#ef4444" />
              <h3 style={{ margin: 0, fontSize: '1.125rem', fontWeight: '600', color: theme.textPrimary }}>
                Registros de Auditoría
              </h3>
              <span
                style={{
                  padding: '0.25rem 0.75rem',
                  backgroundColor: darkMode ? 'rgba(239, 68, 68, 0.2)' : 'rgba(239, 68, 68, 0.1)',
                  color: '#ef4444',
                  borderRadius: '12px',
                  fontSize: '0.75rem',
                  fontWeight: '600',
                }}
              >
                {auditorias.length} registros
              </span>
            </div>
          </div>

          {/* Lista de auditorías */}
          {auditorias.length === 0 ? (
            <div
              style={{
                textAlign: 'center',
                padding: '3rem 1rem',
                color: theme.textMuted,
              }}
            >
              <Database size={48} style={{ margin: '0 auto 1rem', opacity: 0.5 }} />
              <p style={{ margin: 0, fontSize: '1rem' }}>No se encontraron registros de auditoría</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {auditorias.map((auditoria) => {
                return (
                  <div
                    key={auditoria.id_auditoria}
                    style={{
                      backgroundColor: theme.recordBg,
                      border: `1px solid ${theme.recordBorder}`,
                      borderRadius: '10px',
                      padding: '1.25rem',
                      transition: 'all 0.2s ease',
                      cursor: 'pointer',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = theme.recordBgHover;
                      e.currentTarget.style.borderColor = theme.recordBorderHover;
                      e.currentTarget.style.transform = 'translateY(-2px)';
                      e.currentTarget.style.boxShadow = darkMode
                        ? '0 4px 12px rgba(0, 0, 0, 0.3)'
                        : '0 4px 12px rgba(0, 0, 0, 0.1)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = theme.recordBg;
                      e.currentTarget.style.borderColor = theme.recordBorder;
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                    onClick={() => setModalDetalle(auditoria)}
                  >
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '1rem',
                        flexWrap: 'wrap',
                      }}
                    >
                      {/* Icono y descripción */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flex: '1' }}>
                        <div
                          style={{
                            width: '44px',
                            height: '44px',
                            borderRadius: '10px',
                            backgroundColor: theme.iconBg,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#ef4444',
                            flexShrink: 0,
                          }}
                        >
                          {getTablaIcon(auditoria.tabla_afectada)}
                        </div>
                        <div style={{ flex: '1', minWidth: 0 }}>
                          <p
                            style={{
                              margin: 0,
                              fontSize: '0.95rem',
                              fontWeight: '500',
                              color: theme.textPrimary,
                              lineHeight: '1.4',
                            }}
                          >
                            {auditoria.descripcion}
                          </p>
                          <div
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.75rem',
                              marginTop: '0.5rem',
                              flexWrap: 'wrap',
                            }}
                          >
                            <span
                              style={{
                                fontSize: '0.75rem',
                                color: theme.textMuted,
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.25rem',
                              }}
                            >
                              <User size={12} />
                              {auditoria.usuario.nombre} {auditoria.usuario.apellido}
                            </span>
                            {(() => {
                              const badge = getOperacionBadge(auditoria.operacion);
                              return (
                                <span
                                  style={{
                                    padding: '0.125rem 0.5rem',
                                    backgroundColor: badge.bg,
                                    color: badge.text,
                                    borderRadius: '4px',
                                    fontSize: '0.65rem',
                                    fontWeight: '600',
                                  }}
                                >
                                  {badge.label}
                                </span>
                              );
                            })()}
                            <span
                              style={{
                                padding: '0.125rem 0.5rem',
                                backgroundColor: darkMode ? 'rgba(255, 255, 255, 0.1)' : '#f3f4f6',
                                color: theme.textMuted,
                                borderRadius: '6px',
                                fontSize: '0.7rem',
                                fontWeight: '500',
                              }}
                            >
                              {auditoria.usuario.rol}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Fecha e IP */}
                      <div style={{ textAlign: 'right', flexShrink: 0 }}>
                        <p
                          style={{
                            margin: 0,
                            fontSize: '0.8rem',
                            color: theme.textSecondary,
                            fontWeight: '500',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.25rem',
                            justifyContent: 'flex-end',
                          }}
                        >
                          <Clock size={12} />
                          {formatearFecha(auditoria.fecha_operacion)}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Paginación */}
          {(totalPaginas > 1 || stats.total > 0) && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '1rem',
                marginTop: '2rem',
                padding: '1rem',
                backgroundColor: darkMode ? 'rgba(0, 0, 0, 0.2)' : 'rgba(0, 0, 0, 0.02)',
                borderRadius: '8px',
                flexWrap: 'wrap',
              }}
            >
              {/* Información a la izquierda */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                <span style={{ color: theme.textSecondary, fontSize: '0.8125rem' }}>
                  Página {paginaActual} de {totalPaginas}
                </span>
                <span style={{ color: theme.textMuted, fontSize: '0.8125rem' }}>
                  • Total: {stats.total} registros
                </span>
              </div>

              {/* Controles de paginación a la derecha */}
              {totalPaginas > 1 && (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.375rem',
                    flexWrap: 'wrap',
                  }}
                >
                  {/* Botón Anterior */}
                  <button
                    onClick={() => setPaginaActual(Math.max(1, paginaActual - 1))}
                    disabled={paginaActual === 1}
                    style={{
                      padding: '0.5rem 0.875rem',
                      backgroundColor: paginaActual === 1 ? theme.buttonSecondary : theme.buttonSecondary,
                      color: paginaActual === 1 ? theme.textMuted : theme.buttonSecondaryText,
                      border: 'none',
                      borderRadius: '6px',
                      fontSize: '0.8125rem',
                      fontWeight: '500',
                      cursor: paginaActual === 1 ? 'not-allowed' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.375rem',
                      opacity: paginaActual === 1 ? 0.5 : 1,
                      transition: 'all 0.2s ease',
                    }}
                    onMouseEnter={(e) => {
                      if (paginaActual !== 1) {
                        e.currentTarget.style.backgroundColor = theme.buttonSecondaryHover;
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (paginaActual !== 1) {
                        e.currentTarget.style.backgroundColor = theme.buttonSecondary;
                      }
                    }}
                  >
                    <ChevronLeft size={14} />
                    Anterior
                  </button>

                  {/* Botones de números de página */}
                  {Array.from({ length: totalPaginas }, (_, i) => i + 1).map((num) => {
                    const isActive = num === paginaActual;
                    return (
                      <button
                        key={num}
                        onClick={() => setPaginaActual(num)}
                        style={{
                          minWidth: '36px',
                          height: '36px',
                          padding: '0 0.5rem',
                          backgroundColor: isActive ? '#dc2626' : theme.buttonSecondary,
                          color: isActive ? '#ffffff' : theme.buttonSecondaryText,
                          border: 'none',
                          borderRadius: '6px',
                          fontSize: '0.8125rem',
                          fontWeight: '500',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                        onMouseEnter={(e) => {
                          if (!isActive) {
                            e.currentTarget.style.backgroundColor = theme.buttonSecondaryHover;
                          } else {
                            e.currentTarget.style.backgroundColor = '#ef4444';
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (!isActive) {
                            e.currentTarget.style.backgroundColor = theme.buttonSecondary;
                          } else {
                            e.currentTarget.style.backgroundColor = '#dc2626';
                          }
                        }}
                      >
                        {num}
                      </button>
                    );
                  })}

                  {/* Botón Siguiente */}
                  <button
                    onClick={() => setPaginaActual(Math.min(totalPaginas, paginaActual + 1))}
                    disabled={paginaActual === totalPaginas}
                    style={{
                      padding: '0.5rem 0.875rem',
                      backgroundColor: paginaActual === totalPaginas ? theme.buttonSecondary : theme.buttonSecondary,
                      color: paginaActual === totalPaginas ? theme.textMuted : theme.buttonSecondaryText,
                      border: 'none',
                      borderRadius: '6px',
                      fontSize: '0.8125rem',
                      fontWeight: '500',
                      cursor: paginaActual === totalPaginas ? 'not-allowed' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.375rem',
                      opacity: paginaActual === totalPaginas ? 0.5 : 1,
                      transition: 'all 0.2s ease',
                    }}
                    onMouseEnter={(e) => {
                      if (paginaActual !== totalPaginas) {
                        e.currentTarget.style.backgroundColor = theme.buttonSecondaryHover;
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (paginaActual !== totalPaginas) {
                        e.currentTarget.style.backgroundColor = theme.buttonSecondary;
                      }
                    }}
                  >
                    Siguiente
                    <ChevronRight size={14} />
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Modal de Detalle */}
      {modalDetalle &&
        createPortal(
          <div
            onClick={() => setModalDetalle(null)}
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: theme.modalOverlay,
              display: 'flex',
              alignItems: isMobile ? 'flex-start' : 'center',
              justifyContent: 'center',
              zIndex: 9999,
              padding: isMobile ? '0' : '1rem',
              backdropFilter: 'blur(4px)',
              overflowY: isMobile ? 'auto' : 'hidden',
            }}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              style={{
                backgroundColor: theme.modalBg,
                borderRadius: isMobile ? '0' : '12px',
                width: isMobile ? '100%' : '90%',
                maxWidth: isMobile ? '100%' : '600px',
                maxHeight: isMobile ? '100vh' : '85vh',
                minHeight: isMobile ? '100vh' : 'auto',
                overflow: 'auto',
                boxShadow: darkMode
                  ? '0 20px 25px -5px rgba(0, 0, 0, 0.5), 0 10px 10px -5px rgba(0, 0, 0, 0.2)'
                  : '0 20px 25px -5px rgba(0, 0, 0, 0.2), 0 10px 10px -5px rgba(0, 0, 0, 0.1)',
                border: isMobile ? 'none' : `1px solid ${theme.cardBorder}`,
                backdropFilter: 'blur(10px)',
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              {/* Header del modal */}
              <div
                style={{
                  padding: isMobile ? '1rem' : '1.25rem',
                  borderBottom: `1px solid ${theme.recordBorder}`,
                  display: 'flex',
                  alignItems: 'flex-start',
                  justifyContent: 'space-between',
                  backgroundColor: darkMode ? 'rgba(0, 0, 0, 0.2)' : '#f9fafb',
                  borderTopLeftRadius: isMobile ? '0' : '12px',
                  borderTopRightRadius: isMobile ? '0' : '12px',
                  position: isMobile ? 'sticky' : 'relative',
                  top: 0,
                  zIndex: 1,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '10px',
                      backgroundColor: darkMode ? 'rgba(239, 68, 68, 0.2)' : 'rgba(239, 68, 68, 0.1)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#ef4444',
                      flexShrink: 0,
                    }}
                  >
                    {getTablaIcon(modalDetalle.tabla_afectada)}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <h3 style={{ margin: 0, fontSize: isMobile ? '1rem' : '1.125rem', fontWeight: '700', color: theme.textPrimary, marginBottom: '0.375rem' }}>
                      Detalle de Auditoría
                    </h3>
                    <p style={{ margin: 0, fontSize: isMobile ? '0.75rem' : '0.8125rem', color: theme.textSecondary, lineHeight: 1.4 }}>
                      {modalDetalle.descripcion}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setModalDetalle(null)}
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: theme.textMuted,
                    padding: '0.375rem',
                    borderRadius: '6px',
                    transition: 'all 0.2s ease',
                    flexShrink: 0,
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = darkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)';
                    e.currentTarget.style.color = theme.textPrimary;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                    e.currentTarget.style.color = theme.textMuted;
                  }}
                >
                  <X size={20} />
                </button>
              </div>

              {/* Contenido del modal */}
              <div style={{ padding: isMobile ? '1rem' : '1.25rem', flex: 1 }}>
                {/* Información general */}
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)',
                    gap: isMobile ? '0.75rem' : '1rem',
                    marginBottom: isMobile ? '1rem' : '1.5rem',
                    padding: isMobile ? '0.875rem' : '1rem',
                    backgroundColor: darkMode ? 'rgba(0, 0, 0, 0.15)' : '#f9fafb',
                    borderRadius: '10px',
                    border: `1px solid ${theme.recordBorder}`,
                  }}
                >
                  <div>
                    <p style={{ margin: 0, fontSize: '0.6875rem', fontWeight: '600', color: theme.textMuted, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '0.375rem' }}>
                      Usuario
                    </p>
                    <p style={{ margin: 0, fontSize: '0.875rem', fontWeight: '600', color: theme.textPrimary, lineHeight: 1.3 }}>
                      {modalDetalle.usuario.nombre.toUpperCase()} {modalDetalle.usuario.apellido.toUpperCase()}
                    </p>
                    <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.75rem', color: theme.textMuted }}>
                      {modalDetalle.usuario.email}
                    </p>
                  </div>

                  <div>
                    <p style={{ margin: 0, fontSize: '0.6875rem', fontWeight: '600', color: theme.textMuted, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '0.375rem' }}>
                      Rol
                    </p>
                    <p style={{ margin: 0, fontSize: '0.875rem', fontWeight: '600', color: theme.textPrimary }}>
                      {modalDetalle.usuario.rol.charAt(0).toUpperCase() + modalDetalle.usuario.rol.slice(1).toLowerCase()}
                    </p>
                  </div>

                  <div>
                    <p style={{ margin: 0, fontSize: '0.6875rem', fontWeight: '600', color: theme.textMuted, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '0.375rem' }}>
                      Tipo de Acción
                    </p>
                    <p style={{ margin: 0, fontSize: '0.875rem', fontWeight: '600', color: theme.textPrimary }}>
                      {modalDetalle.operacion === 'INSERT' ? 'Creación' : modalDetalle.operacion === 'UPDATE' ? 'Modificación' : 'Eliminación'}
                    </p>
                  </div>

                  <div>
                    <p style={{ margin: 0, fontSize: '0.6875rem', fontWeight: '600', color: theme.textMuted, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '0.375rem' }}>
                      Fecha y Hora
                    </p>
                    <p style={{ margin: 0, fontSize: '0.875rem', fontWeight: '600', color: theme.textPrimary }}>
                      {formatearFecha(modalDetalle.fecha_operacion)}
                    </p>
                  </div>
                </div>

                {/* Detalles formateados */}
                {modalDetalle.detalles && (() => {
                  // Función para formatear nombres de campos
                  const formatearNombreCampo = (campo: string) => {
                    return campo
                      .replace(/_/g, ' ')
                      .split(' ')
                      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                      .join(' ');
                  };

                  // Función para formatear valores
                  const formatearValor = (valor: any) => {
                    if (typeof valor === 'boolean') {
                      return valor ? 'Sí' : 'No';
                    }
                    if (typeof valor === 'number') {
                      // Si parece un monto (tiene decimales o es un campo de dinero)
                      if (valor % 1 !== 0 || String(valor).includes('.')) {
                        return `$${valor.toFixed(2)}`;
                      }
                      return valor.toString();
                    }
                    if (valor === null || valor === undefined) {
                      return 'N/A';
                    }
                    // Si es una fecha (formato ISO)
                    if (typeof valor === 'string' && /^\d{4}-\d{2}-\d{2}/.test(valor)) {
                      try {
                        return new Date(valor).toLocaleDateString('es-EC', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        });
                      } catch {
                        return valor;
                      }
                    }
                    // Capitalizar primera letra de strings
                    if (typeof valor === 'string') {
                      const str = String(valor).trim();
                      if (str.length === 0) return 'N/A';
                      // Capitalizar primera letra y mantener el resto
                      return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
                    }
                    return String(valor);
                  };

                  // Asegurar que detalles sea un objeto (si viene como string JSON)
                  let detallesObj = modalDetalle.detalles;
                  if (typeof detallesObj === 'string') {
                    try {
                      detallesObj = JSON.parse(detallesObj);
                    } catch (e) {
                      console.error('Error al parsear detalles:', e);
                      // Si falla el parseo, mostrar como texto plano o manejar error
                      return <p style={{ color: '#fff' }}>{String(detallesObj)}</p>;
                    }
                  }

                  // Filtrar campos que no queremos mostrar
                  const camposIgnorados = ['id', 'id_curso', 'id_estudiante', 'id_docente', 'password', 'token'];
                  const detallesFiltrados = Object.entries(detallesObj).filter(([key, value]) => {
                    if (camposIgnorados.includes(key)) return false;
                    if (key.startsWith('id_')) return false; // Ignorar IDs foráneos
                    return true;
                  });

                  if (detallesFiltrados.length === 0) return null;

                  return (
                    <div>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        marginBottom: '1rem',
                        paddingBottom: '0.75rem',
                        borderBottom: `1px solid ${theme.recordBorder}`,
                      }}>
                        <div
                          style={{
                            width: '32px',
                            height: '32px',
                            borderRadius: '8px',
                            backgroundColor: theme.iconBg,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#ef4444',
                          }}
                        >
                          <FileText size={16} color="#ef4444" />
                        </div>
                        <h4 style={{
                          margin: 0,
                          fontSize: '0.9375rem',
                          fontWeight: '600',
                          color: theme.textPrimary,
                        }}>
                          Información Detallada
                        </h4>
                      </div>
                      <div
                        style={{
                          backgroundColor: darkMode ? 'rgba(0, 0, 0, 0.15)' : '#ffffff',
                          border: `1px solid ${theme.recordBorder}`,
                          borderRadius: '10px',
                          overflow: 'hidden',
                        }}
                      >
                        {detallesFiltrados.map(([key, value], index) => {
                          // Detectar si el campo es un nombre de usuario
                          const isNombreUsuario = key.toLowerCase().includes('nombre') ||
                            key.toLowerCase().includes('usuario') ||
                            key.toLowerCase().includes('solicitante') ||
                            key.toLowerCase().includes('estudiante') ||
                            key.toLowerCase().includes('docente') ||
                            key.toLowerCase().includes('creado') ||
                            key.toLowerCase().includes('eliminado');

                          return (
                            <div
                              key={key}
                              style={{
                                padding: '0.75rem 1rem',
                                borderBottom: index < detallesFiltrados.length - 1
                                  ? `1px solid ${theme.recordBorder}`
                                  : 'none',
                                display: 'grid',
                                gridTemplateColumns: '1fr 1.5fr',
                                gap: '1rem',
                                alignItems: 'center',
                                transition: 'all 0.2s ease',
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.backgroundColor = darkMode ? 'rgba(255, 255, 255, 0.05)' : '#f9fafb';
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.backgroundColor = 'transparent';
                              }}
                            >
                              <p style={{
                                margin: 0,
                                fontSize: '0.75rem',
                                fontWeight: '600',
                                color: theme.textMuted,
                                textTransform: 'uppercase',
                                letterSpacing: '0.3px',
                              }}>
                                {formatearNombreCampo(key)}
                              </p>
                              <p style={{
                                margin: 0,
                                fontSize: '0.8125rem',
                                fontWeight: '500',
                                color: theme.textPrimary,
                                wordBreak: 'break-word',
                                lineHeight: 1.4,
                                textTransform: isNombreUsuario ? 'uppercase' : 'none',
                              }}>
                                {isNombreUsuario && typeof value === 'string'
                                  ? value.toUpperCase()
                                  : formatearValor(value)}
                              </p>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>
          </div>,
          document.body
        )}
    </>
  );
};

export default HistorialAuditoria;
