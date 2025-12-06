import React, { useState, useEffect } from 'react';
import type { CSSProperties } from 'react';
import { createPortal } from 'react-dom';
import { Users, UserCheck, Power, Shield, GraduationCap, Search, Eye, CheckCircle, Lock, Unlock, Clock, KeyRound, AlertCircle, X, UserCircle, Activity, BookOpen, Monitor, Globe, Calendar, XCircle, DollarSign, FileText, ChevronLeft, ChevronRight, User, History, Zap, ArrowLeftRight, Hash, CreditCard, Building, RefreshCcw, Tag, Mail, Phone, Paperclip, Star, MessageSquare, Timer, AlignLeft, Info, FileSignature, type LucideIcon } from 'lucide-react';
import { showToast } from '../../config/toastConfig';
import { RedColorPalette } from '../../utils/colorMapper';
import { useBreakpoints } from '../../hooks/useMediaQuery';
import LoadingModal from '../../components/LoadingModal';
import AdminSectionHeader from '../../components/AdminSectionHeader';
import '../../styles/responsive.css';
import '../../utils/modalScrollHelper';

type CSSPropertiesWithVars = CSSProperties & Record<string, string | number>;

const API_BASE = (import.meta as any).env?.VITE_API_URL ? `${(import.meta as any).env.VITE_API_URL}/api` : 'http://localhost:3000/api';

interface Usuario {
  id_usuario: number;
  cedula: string;
  nombre: string;
  apellido: string;
  email: string | null;
  username: string | null;
  telefono: string | null;
  estado: 'activo' | 'inactivo' | 'pendiente';
  fecha_ultima_conexion: string | null;
  fecha_registro: string;
  nombre_rol: string;
  foto_perfil?: string | null;
  // Trazabilidad
  creado_por?: string;
  fecha_creacion?: string;
  modificado_por?: string;
  fecha_modificacion?: string;
  // Información académica (estudiantes)
  cursos_matriculados?: number;
  pagos_pendientes?: number;
  pagos_completados?: number;
  // Información académica (docentes)
  cursos_asignados?: number;
  estudiantes_activos?: number;
  // Actividad del sistema
  matriculas_aprobadas?: number;
  pagos_verificados?: number;
  total_acciones?: number;
  // Bloqueo financiero
  cuenta_bloqueada?: boolean;
  motivo_bloqueo?: string | null;
  fecha_bloqueo?: string | null;
}

interface Sesion {
  id_sesion: string;
  user_agent: string;
  fecha_inicio: string;
  fecha_expiracion: string;
  fecha_cierre?: string;
  activa: boolean;
}

interface Accion {
  id_auditoria?: number;
  tabla_afectada?: string;
  operacion?: 'INSERT' | 'UPDATE' | 'DELETE';
  id_registro?: number;
  descripcion?: string;
  detalles?: string | any;
  fecha_operacion?: string;
  // Nuevo formato detallado
  tipo_accion?: string;
  fecha_hora?: string;
}

interface Stats {
  totalUsuarios: number;
  usuariosActivos: number;
  usuariosInactivos: number;
  totalAdministradores: number;
  totalDocentes: number;
  totalEstudiantes: number;
}

const ControlUsuarios = () => {
  const { isMobile, isSmallScreen } = useBreakpoints();

  const [darkMode, setDarkMode] = useState<boolean>(() => {
    const saved = localStorage.getItem('admin-dark-mode');
    return saved !== null ? JSON.parse(saved) : true;
  });

  useEffect(() => {
    const interval = setInterval(() => {
      const saved = localStorage.getItem('admin-dark-mode');
      const newMode = saved !== null ? JSON.parse(saved) : true;
      setDarkMode(prev => (prev === newMode ? prev : newMode));
    }, 250);

    return () => clearInterval(interval);
  }, []);

  const pick = (light: string, dark: string) => (darkMode ? dark : light);

  const textPrimaryColor = pick('#0f172a', 'rgba(255,255,255,0.98)');
  const textSecondaryColor = pick('rgba(71,85,105,0.85)', 'rgba(226,232,240,0.7)');
  const textMutedColor = pick('rgba(100,116,139,0.7)', 'rgba(148,163,184,0.65)');

  const statsCardBg = pick(
    'linear-gradient(135deg, rgba(255,255,255,0.94) 0%, rgba(248,250,252,0.9) 100%)',
    'rgba(255,255,255,0.03)'
  );
  const statsCardBorder = pick('rgba(15,23,42,0.08)', 'rgba(255,255,255,0.08)');

  const filterInputBg = pick('rgba(255,255,255,0.96)', 'rgba(255,255,255,0.1)');
  const filterInputBorder = pick('rgba(226,232,240,0.75)', 'rgba(255,255,255,0.18)');
  const filterInputText = pick('#0f172a', 'rgba(255,255,255,0.95)');
  const filterIconColor = pick('rgba(100,116,139,0.6)', 'rgba(226,232,240,0.6)');

  const tableContainerBg = pick(
    'linear-gradient(135deg, rgba(255,255,255,0.96) 0%, rgba(248,250,252,0.96) 100%)',
    'linear-gradient(135deg, rgba(0,0,0,0.9) 0%, rgba(26,26,26,0.9) 100%)'
  );
  const tableBorder = pick('rgba(239,68,68,0.18)', 'rgba(239,68,68,0.2)');
  const tableHeaderBg = pick('rgba(248,113,113,0.12)', 'rgba(248,113,113,0.15)');
  const tableHeaderBorder = pick('rgba(248,113,113,0.18)', 'rgba(248,113,113,0.3)');
  const tableHeaderText = pick('#9f1239', '#ffffff');
  const tableRowDivider = pick('rgba(15,23,42,0.06)', 'rgba(255,255,255,0.05)');
  const tableRowHover = pick('rgba(248,113,113,0.1)', 'rgba(248,113,113,0.08)');

  const paginationSurface = pick(
    'linear-gradient(135deg, rgba(255,255,255,0.96) 0%, rgba(248,250,252,0.96) 100%)',
    'linear-gradient(135deg, rgba(0,0,0,0.9) 0%, rgba(26,26,26,0.9) 100%)'
  );
  const paginationBorder = pick('rgba(239,68,68,0.14)', 'rgba(239,68,68,0.25)');
  const paginationText = pick('rgba(30,41,59,0.85)', 'rgba(226,232,240,0.8)');
  const paginationButtonBg = pick('rgba(255,255,255,0.95)', 'rgba(255,255,255,0.1)');
  const paginationButtonBorder = pick('rgba(226,232,240,0.75)', 'rgba(255,255,255,0.2)');
  const paginationButtonText = pick('rgba(30,41,59,0.85)', '#f8fafc');
  const paginationButtonDisabledBg = pick('rgba(226,232,240,0.6)', 'rgba(255,255,255,0.05)');
  const paginationButtonDisabledText = pick('rgba(148,163,184,0.6)', 'rgba(255,255,255,0.3)');
  const activePageBg = pick(
    `linear-gradient(135deg, ${RedColorPalette.primaryLight} 0%, ${RedColorPalette.primary} 100%)`,
    `linear-gradient(135deg, ${RedColorPalette.primary} 0%, ${RedColorPalette.primaryDark} 100%)`
  );
  const activePageBorder = pick('rgba(239,68,68,0.3)', 'rgba(239,68,68,0.4)');
  const inactivePageBg = pick('rgba(226,232,240,0.9)', 'rgba(255,255,255,0.08)');
  const inactivePageBorder = pick('rgba(148,163,184,0.45)', 'rgba(255,255,255,0.15)');

  const rootStyles: CSSPropertiesWithVars = {
    color: textPrimaryColor,
    '--admin-text-primary': textPrimaryColor,
    '--admin-text-secondary': textSecondaryColor,
    '--admin-text-muted': textMutedColor,
    '--admin-input-bg': filterInputBg,
    '--admin-input-border': filterInputBorder,
    '--admin-input-text': filterInputText,
    '--admin-card-bg': tableContainerBg,
    '--admin-border': pick('rgba(15,23,42,0.1)', 'rgba(255,255,255,0.08)')
  };

  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [stats, setStats] = useState<Stats>({
    totalUsuarios: 0,
    usuariosActivos: 0,
    usuariosInactivos: 0,
    totalAdministradores: 0,
    totalDocentes: 0,
    totalEstudiantes: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Filtros
  const [search, setSearch] = useState('');
  const [rolFilter, setRolFilter] = useState('todos');
  const [estadoFilter, setEstadoFilter] = useState('todos');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Modal de detalle
  const [showModal, setShowModal] = useState(false);
  const [usuarioSeleccionado, setUsuarioSeleccionado] = useState<Usuario | null>(null);
  const [tabActiva, setTabActiva] = useState<'info' | 'sesiones' | 'acciones'>('info');
  const [sesiones, setSesiones] = useState<Sesion[]>([]);
  const [acciones, setAcciones] = useState<Accion[]>([]);
  const [, setPagos] = useState<any[]>([]);
  const [, setDeberes] = useState<any[]>([]);
  const [loadingModal, setLoadingModal] = useState(false);
  const [showLoadingModal, setShowLoadingModal] = useState(false);

  // Modal de confirmación
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [accionConfirmar, setAccionConfirmar] = useState<{ tipo: 'activar' | 'desactivar' | 'resetear' | 'bloquear' | 'desbloquear' | 'desbloqueo-temporal', usuario: Usuario } | null>(null); const [motivoBloqueo, setMotivoBloqueo] = useState('');

  // Modal de credenciales
  const [showCredencialesModal, setShowCredencialesModal] = useState(false);
  const [credenciales, setCredenciales] = useState<{ username: string, password_temporal: string } | null>(null);

  useEffect(() => {
    cargarUsuarios();
    cargarStats();
  }, [search, rolFilter, estadoFilter, page]);

  const cargarUsuarios = async () => {
    try {
      setLoading(true);
      setShowLoadingModal(true);
      setError('');
      const token = sessionStorage.getItem('auth_token');
      const response = await fetch(
        `${API_BASE}/usuarios?search=${search}&rol=${rolFilter}&estado=${estadoFilter}&page=${page}&limit=10`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Error ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      // Obtener ID del usuario logueado
      let idUsuarioLogueado = null;
      try {
        const meResponse = await fetch(`${API_BASE}/auth/me`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (meResponse.ok) {
          const meData = await meResponse.json();
          idUsuarioLogueado = meData.id_usuario;
        }
      } catch (err) {
        console.error('Error obteniendo usuario logueado:', err);
      }

      // SEGURIDAD: Filtrar SuperAdmin Y Administrativo y el admin logueado - no deben aparecer en Control de Usuarios
      const usuariosFiltrados = (data.usuarios || []).filter(
        (usuario: Usuario) =>
          usuario.nombre_rol?.toLowerCase() !== 'superadmin' &&
          usuario.nombre_rol?.toLowerCase() !== 'administrativo' &&
          usuario.id_usuario !== idUsuarioLogueado
      );

      setUsuarios(usuariosFiltrados);
      setTotalPages(data.totalPages || 1);
    } catch (err: any) {
      console.error('Error al cargar usuarios:', err);
      setError(err.message || 'Error al cargar usuarios');
    } finally {
      setLoading(false);
      // Cerrar modal después de un pequeño delay para que se vea
      setTimeout(() => setShowLoadingModal(false), 300);
    }
  };

  const cargarStats = async () => {
    try {
      const token = sessionStorage.getItem('auth_token');
      const response = await fetch(`${API_BASE}/usuarios/stats`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) throw new Error('Error al cargar estadísticas');

      const data = await response.json();
      setStats(data.stats);
    } catch (err: any) {
      console.error('Error al cargar stats:', err);
    }
  };

  const formatFecha = (fecha: string | null) => {
    if (!fecha) return 'Nunca';
    return new Date(fecha).toLocaleString('es-EC', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getRolColor = (rol: string) => {
    switch (rol) {
      case 'administrativo':
      case 'superadmin':
        return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'docente':
        return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'estudiante':
        return 'bg-green-500/20 text-green-400 border-green-500/30';
      default:
        return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  const getEstadoColor = (estado: string) => {
    switch (estado) {
      case 'activo':
        return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'inactivo':
        return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'pendiente':
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      default:
        return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };


  const verDetalle = async (usuario: Usuario) => {
    setShowModal(true);
    setTabActiva('info');

    setLoadingModal(true);
    try {
      const token = sessionStorage.getItem('auth_token');

      // Cargar datos completos del usuario (incluye info académica para docentes)
      try {
        const usuarioRes = await fetch(`${API_BASE}/usuarios/${usuario.id_usuario}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (usuarioRes.ok) {
          const usuarioData = await usuarioRes.json();
          console.log('?? Usuario completo recibido:', usuarioData);
          setUsuarioSeleccionado(usuarioData.usuario);
        } else {
          console.error('? Error al cargar usuario:', usuarioRes.status);
          setUsuarioSeleccionado(usuario); // Fallback al usuario de la lista
        }
      } catch (err) {
        console.error('? Error en fetch de usuario:', err);
        setUsuarioSeleccionado(usuario); // Fallback al usuario de la lista
      }

      // Cargar sesiones desde la tabla sesiones_usuario
      try {
        const sesionesRes = await fetch(`${API_BASE}/usuarios/${usuario.id_usuario}/sesiones?limit=10`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (sesionesRes.ok) {
          const sesionesData = await sesionesRes.json();
          console.log('?? Sesiones recibidas:', sesionesData);
          setSesiones(sesionesData.sesiones || []);
        } else {
          console.error('? Error al cargar sesiones:', sesionesRes.status);
          setSesiones([]);
        }
      } catch (err) {
        console.error('? Error en fetch de sesiones:', err);
        setSesiones([]);
      }

      // Cargar historial detallado desde auditoria (administrativas y académicas)
      try {
        const historialRes = await fetch(`${API_BASE}/auditoria/usuario/${usuario.id_usuario}/historial-detallado?tipo=todas&limite=50`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (historialRes.ok) {
          const historialData = await historialRes.json();
          console.log('Historial detallado recibido:', historialData);
          setAcciones(historialData.data?.acciones || []);
        } else {
          console.error('Error al cargar historial:', historialRes.status);
          setAcciones([]);
        }
      } catch (err) {
        console.error('Error en fetch de historial:', err);
        setAcciones([]);
      }

      // Cargar pagos si es estudiante
      if (usuario.nombre_rol?.toLowerCase() === 'estudiante') {
        try {
          const pagosRes = await fetch(`${API_BASE}/usuarios-actividad/${usuario.id_usuario}/pagos?limite=10`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (pagosRes.ok) {
            const pagosData = await pagosRes.json();
            console.log('?? Pagos recibidos:', pagosData);
            setPagos(pagosData.pagos || []);
          } else {
            console.error('? Error al cargar pagos:', pagosRes.status);
            setPagos([]);
          }
        } catch (err) {
          console.error('? Error en fetch de pagos:', err);
          setPagos([]);
        }

        // Cargar deberes si es estudiante
        try {
          const deberesRes = await fetch(`${API_BASE}/usuarios-actividad/${usuario.id_usuario}/deberes?limite=10`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (deberesRes.ok) {
            const deberesData = await deberesRes.json();
            console.log('?? Deberes recibidos:', deberesData);
            setDeberes(deberesData.deberes || []);
          } else {
            console.error('? Error al cargar deberes:', deberesRes.status);
            setDeberes([]);
          }
        } catch (err) {
          console.error('? Error en fetch de deberes:', err);
          setDeberes([]);
        }
      } else {
        setPagos([]);
        setDeberes([]);
      }
    } catch (err) {
      console.error('Error al cargar datos del modal:', err);
      setSesiones([]);
      setAcciones([]);
      setPagos([]);
      setDeberes([]);
    } finally {
      setLoadingModal(false);
    }
  };

  const cargarAccionesDetalladas = async (tipo: 'todas' | 'administrativas' | 'academicas') => {
    if (!usuarioSeleccionado) return;

    try {
      const token = sessionStorage.getItem('auth_token');
      const historialRes = await fetch(`${API_BASE}/auditoria/usuario/${usuarioSeleccionado.id_usuario}/historial-detallado?tipo=${tipo}&limite=50`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (historialRes.ok) {
        const historialData = await historialRes.json();
        console.log('Historial detallado recibido:', historialData);

        const accionesParsed = (historialData.data?.acciones || []).map((accion: any) => {
          if (typeof accion.detalles === 'string') {
            try {
              accion.detalles = JSON.parse(accion.detalles);
            } catch (e) {
              console.warn('No se pudo parsear detalles:', accion.detalles);
            }
          }
          return accion;
        });

        setAcciones(accionesParsed);
      } else {
        console.error('Error al cargar historial:', historialRes.status);
        setAcciones([]);
      }
    } catch (err) {
      console.error('Error en fetch de historial:', err);
      setAcciones([]);
    }
  };

  const confirmarCambioEstado = (usuario: Usuario) => {
    const nuevoEstado = usuario.estado === 'activo' ? 'desactivar' : 'activar';
    setAccionConfirmar({ tipo: nuevoEstado, usuario });
    setShowConfirmModal(true);
  };

  const confirmarBloqueo = (usuario: Usuario) => {
    setAccionConfirmar({ tipo: 'bloquear', usuario });
    setMotivoBloqueo('');
    setShowConfirmModal(true);
  };

  const confirmarDesbloqueo = (usuario: Usuario) => {
    setAccionConfirmar({ tipo: 'desbloquear', usuario });
    setShowConfirmModal(true);
  };

  const confirmarDesbloqueoTemporal = (usuario: Usuario) => {
    setAccionConfirmar({ tipo: 'desbloqueo-temporal', usuario });
    setShowConfirmModal(true);
  };

  const ejecutarAccion = async () => {
    if (!accionConfirmar) return;

    try {
      const token = sessionStorage.getItem('auth_token');
      let response;

      if (accionConfirmar.tipo === 'bloquear') {
        response = await fetch(`${API_BASE}/usuarios/${accionConfirmar.usuario.id_usuario}/bloquear`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ motivo: motivoBloqueo || 'Bloqueo manual por administrador' })
        });
      } else if (accionConfirmar.tipo === 'desbloquear') {
        response = await fetch(`${API_BASE}/usuarios/${accionConfirmar.usuario.id_usuario}/desbloquear`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
      } else if (accionConfirmar.tipo === 'desbloqueo-temporal') {
        response = await fetch(`${API_BASE}/usuarios/${accionConfirmar.usuario.id_usuario}/desbloqueo-temporal`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
      } else if (accionConfirmar.tipo === 'activar' || accionConfirmar.tipo === 'desactivar') {
        const nuevoEstado = accionConfirmar.tipo === 'activar' ? 'activo' : 'inactivo';
        response = await fetch(`${API_BASE}/usuarios/${accionConfirmar.usuario.id_usuario}/estado`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ estado: nuevoEstado })
        });
      } else if (accionConfirmar.tipo === 'resetear') {
        // Este caso se maneja en ejecutarResetearPassword, pero por seguridad lo dejamos aquí también o lo ignoramos
        return;
      }

      if (response && !response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error al ejecutar acción');
      }

      await cargarUsuarios();
      await cargarStats();
      setShowConfirmModal(false);
      setAccionConfirmar(null);
      setMotivoBloqueo('');
      showToast.success('Acción realizada correctamente', darkMode);
    } catch (err: any) {
      showToast.error(err?.message || 'Error al ejecutar acción', darkMode);
    }
  };

  const resetearPassword = (usuario: Usuario) => {
    setAccionConfirmar({ tipo: 'resetear', usuario });
    setShowConfirmModal(true);
  };

  const ejecutarResetearPassword = async () => {
    if (!accionConfirmar || accionConfirmar.tipo !== 'resetear') return;

    try {
      const token = sessionStorage.getItem('auth_token');
      const response = await fetch(`${API_BASE}/usuarios/${accionConfirmar.usuario.id_usuario}/reset-password`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) throw new Error('Error al resetear contraseña');

      const data = await response.json();
      setCredenciales(data.credenciales);
      setShowConfirmModal(false);
      setAccionConfirmar(null);
      setShowCredencialesModal(true);
      showToast.success('Contraseña reseteada correctamente', darkMode);
    } catch (err: any) {
      showToast.error(err?.message || 'Error al resetear contraseña', darkMode);
      setShowConfirmModal(false);
      setAccionConfirmar(null);
    }
  };

  return (
    <div style={rootStyles}>
      {/* Header */}
      <AdminSectionHeader
        title="Control de Usuarios"
        subtitle="Gestiona todos los usuarios del sistema"
      />

      {/* Estadísticas - Compactas y horizontales */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(6, 1fr)',
        gap: isMobile ? '0.5rem' : '0.625rem',
        marginBottom: isMobile ? '1rem' : '1.125rem'
      }}>
        {/* Total Usuarios */}
        <div style={{
          background: statsCardBg,
          border: `1px solid ${statsCardBorder}`,
          borderRadius: '0.625rem',
          padding: isMobile ? '0.625rem' : '0.5rem 0.75rem',
          transition: 'all 0.2s ease',
          display: 'flex',
          alignItems: 'center',
          gap: '0.625rem'
        }}>
          <div style={{
            background: 'rgba(239, 68, 68, 0.12)',
            borderRadius: '0.375rem',
            padding: '0.375rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}>
            <Users size={16} color="#ef4444" strokeWidth={2.5} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ color: textMutedColor, fontSize: '0.65rem', fontWeight: '500', marginBottom: '0.125rem', textTransform: 'uppercase', letterSpacing: '0.02em' }}>Total</div>
            <div style={{ color: textPrimaryColor, fontSize: '1.375rem', fontWeight: '700', lineHeight: '1', letterSpacing: '-0.02em' }}>
              {loading ? '...' : stats.totalUsuarios}
            </div>
          </div>
        </div>

        {/* Activos */}
        <div style={{
          background: statsCardBg,
          border: `1px solid ${statsCardBorder}`,
          borderRadius: '0.625rem',
          padding: isMobile ? '0.625rem' : '0.5rem 0.75rem',
          transition: 'all 0.2s ease',
          display: 'flex',
          alignItems: 'center',
          gap: '0.625rem'
        }}>
          <div style={{
            background: 'rgba(16, 185, 129, 0.12)',
            borderRadius: '0.375rem',
            padding: '0.375rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}>
            <UserCheck size={16} color="#10b981" strokeWidth={2.5} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ color: textMutedColor, fontSize: '0.65rem', fontWeight: '500', marginBottom: '0.125rem', textTransform: 'uppercase', letterSpacing: '0.02em' }}>Activos</div>
            <div style={{ color: textPrimaryColor, fontSize: '1.375rem', fontWeight: '700', lineHeight: '1', letterSpacing: '-0.02em' }}>
              {loading ? '...' : stats.usuariosActivos}
            </div>
          </div>
        </div>

        {/* Inactivos */}
        <div style={{
          background: statsCardBg,
          border: `1px solid ${statsCardBorder}`,
          borderRadius: '0.625rem',
          padding: isMobile ? '0.625rem' : '0.5rem 0.75rem',
          transition: 'all 0.2s ease',
          display: 'flex',
          alignItems: 'center',
          gap: '0.625rem'
        }}>
          <div style={{
            background: 'rgba(239, 68, 68, 0.12)',
            borderRadius: '0.375rem',
            padding: '0.375rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}>
            <Power size={16} color="#ef4444" strokeWidth={2.5} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ color: textMutedColor, fontSize: '0.65rem', fontWeight: '500', marginBottom: '0.125rem', textTransform: 'uppercase', letterSpacing: '0.02em' }}>Inactivos</div>
            <div style={{ color: textPrimaryColor, fontSize: '1.375rem', fontWeight: '700', lineHeight: '1', letterSpacing: '-0.02em' }}>
              {loading ? '...' : stats.usuariosInactivos}
            </div>
          </div>
        </div>

        {/* Admins */}
        <div style={{
          background: statsCardBg,
          border: `1px solid ${statsCardBorder}`,
          borderRadius: '0.625rem',
          padding: isMobile ? '0.625rem' : '0.5rem 0.75rem',
          transition: 'all 0.2s ease',
          display: 'flex',
          alignItems: 'center',
          gap: '0.625rem'
        }}>
          <div style={{
            background: 'rgba(239, 68, 68, 0.12)',
            borderRadius: '0.375rem',
            padding: '0.375rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}>
            <Shield size={16} color="#ef4444" strokeWidth={2.5} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ color: textMutedColor, fontSize: '0.65rem', fontWeight: '500', marginBottom: '0.125rem', textTransform: 'uppercase', letterSpacing: '0.02em' }}>Admins</div>
            <div style={{ color: textPrimaryColor, fontSize: '1.375rem', fontWeight: '700', lineHeight: '1', letterSpacing: '-0.02em' }}>
              {loading ? '...' : stats.totalAdministradores}
            </div>
          </div>
        </div>

        {/* Docentes */}
        <div style={{
          background: statsCardBg,
          border: `1px solid ${statsCardBorder}`,
          borderRadius: '0.625rem',
          padding: isMobile ? '0.625rem' : '0.5rem 0.75rem',
          transition: 'all 0.2s ease',
          display: 'flex',
          alignItems: 'center',
          gap: '0.625rem'
        }}>
          <div style={{
            background: 'rgba(59, 130, 246, 0.12)',
            borderRadius: '0.375rem',
            padding: '0.375rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}>
            <UserCheck size={16} color="#3b82f6" strokeWidth={2.5} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ color: textMutedColor, fontSize: '0.65rem', fontWeight: '500', marginBottom: '0.125rem', textTransform: 'uppercase', letterSpacing: '0.02em' }}>Docentes</div>
            <div style={{ color: textPrimaryColor, fontSize: '1.375rem', fontWeight: '700', lineHeight: '1', letterSpacing: '-0.02em' }}>
              {loading ? '...' : stats.totalDocentes}
            </div>
          </div>
        </div>

        {/* Estudiantes */}
        <div style={{
          background: statsCardBg,
          border: `1px solid ${statsCardBorder}`,
          borderRadius: '0.625rem',
          padding: isMobile ? '0.625rem' : '0.5rem 0.75rem',
          transition: 'all 0.2s ease',
          display: 'flex',
          alignItems: 'center',
          gap: '0.625rem'
        }}>
          <div style={{
            background: 'rgba(34, 197, 94, 0.12)',
            borderRadius: '0.375rem',
            padding: '0.375rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}>
            <GraduationCap size={16} color="#22c55e" strokeWidth={2.5} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ color: textMutedColor, fontSize: '0.65rem', fontWeight: '500', marginBottom: '0.125rem', textTransform: 'uppercase', letterSpacing: '0.02em' }}>Estudiantes</div>
            <div style={{ color: textPrimaryColor, fontSize: '1.375rem', fontWeight: '700', lineHeight: '1', letterSpacing: '-0.02em' }}>
              {loading ? '...' : stats.totalEstudiantes}
            </div>
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div style={{ marginBottom: isMobile ? '1.25rem' : '2rem' }}>
        <div style={{
          display: 'flex',
          flexDirection: isMobile ? 'column' : 'row',
          gap: isMobile ? '0.75rem' : '1rem',
          flexWrap: 'wrap'
        }}>
          <div style={{
            flex: isMobile ? 'none' : '1',
            minWidth: isMobile ? 'auto' : '18.75rem',
            position: 'relative'
          }}>
            <Search style={{
              position: 'absolute',
              left: '0.75rem',
              top: '50%',
              transform: 'translateY(-50%)',
              width: '1.25rem',
              height: '1.25rem',
              color: filterIconColor
            }} />
            <input
              type="text"
              placeholder={isMobile ? "Buscar..." : "Buscar por nombre, username o email..."}
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              style={{
                width: '100%',
                padding: '0.625em 0.75em 0.625em 2.5em',
                borderRadius: '0.5em',
                border: `0.0625rem solid ${filterInputBorder}`,
                backgroundColor: filterInputBg,
                fontSize: '0.9rem',
                color: filterInputText
              }}
            />
          </div>

          <select
            value={rolFilter}
            onChange={(e) => {
              setRolFilter(e.target.value);
              setPage(1);
            }}
            style={{
              padding: '0.625em 1em',
              borderRadius: '0.5em',
              border: `0.0625rem solid ${filterInputBorder}`,
              backgroundColor: filterInputBg,
              fontSize: '0.9rem',
              cursor: 'pointer',
              color: filterInputText,
              width: isMobile ? '100%' : 'auto'
            }}
          >
            <option value="todos">Todos los roles</option>

            <option value="docente">Docente</option>
            <option value="estudiante">Estudiante</option>
          </select>

          <select
            value={estadoFilter}
            onChange={(e) => {
              setEstadoFilter(e.target.value);
              setPage(1);
            }}
            style={{
              padding: '0.625em 1em',
              borderRadius: '0.5em',
              border: `0.0625rem solid ${filterInputBorder}`,
              backgroundColor: filterInputBg,
              fontSize: '0.9rem',
              color: filterInputText,
              cursor: 'pointer',
              width: isMobile ? '100%' : 'auto'
            }}
          >
            <option value="todos">Todos los estados</option>
            <option value="activo">Activo</option>
            <option value="inactivo">Inactivo</option>
            <option value="bloqueado">Bloqueado</option>
          </select>
        </div>
      </div >

      {/* Tabla de usuarios */}
      {
        loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-red-500 border-t-transparent"></div>
            <p className="mt-4 opacity-70">Cargando usuarios...</p>
          </div>
        ) : error ? (
          <div className="text-center py-12 text-red-500">
            <AlertCircle className="w-12 h-12 mx-auto mb-4" />
            <p>{error}</p>
          </div>
        ) : usuarios.length === 0 ? (
          <div className="text-center py-12 opacity-70">
            <Users className="w-12 h-12 mx-auto mb-4" />
            <p>No se encontraron usuarios</p>
          </div>
        ) : (
          <>
            {/* Indicador de scroll en móvil */}
            {isSmallScreen && (
              <div style={{
                background: pick('rgba(254,226,226,0.9)', 'rgba(239,68,68,0.12)'),
                border: `1px solid ${pick('rgba(248,113,113,0.35)', 'rgba(248,113,113,0.4)')}`,
                borderRadius: '0.5rem',
                padding: '8px 0.75rem',
                marginBottom: '0.75rem',
                color: pick('rgba(153,27,27,0.85)', 'rgba(248,250,252,0.85)'),
                fontSize: '0.75rem',
                textAlign: 'center',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.375rem'
              }}>
                <ArrowLeftRight size={16} strokeWidth={2.25} />
                <span>Desliza horizontalmente para ver toda la tabla</span>
                <ArrowLeftRight size={16} strokeWidth={2.25} />
              </div>
            )}

            <div className="responsive-table-container" style={{
              overflowX: 'auto',
              borderRadius: isMobile ? '12px' : '1rem',
              border: `1px solid ${tableBorder}`,
              background: tableContainerBg,
              marginBottom: isMobile ? '12px' : '1.5rem'
            }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead style={{
                  borderBottom: `1px solid ${tableHeaderBorder}`,
                  background: tableHeaderBg
                }}>
                  <tr>
                    <th style={{ textAlign: 'left', padding: '10px 0.75rem', fontWeight: '600', color: tableHeaderText, fontSize: '0.75rem', textTransform: 'uppercase' }}>Usuario</th>
                    <th style={{ textAlign: 'left', padding: '10px 0.75rem', fontWeight: '600', color: tableHeaderText, fontSize: '0.75rem', textTransform: 'uppercase' }}>Nombre Completo</th>
                    <th style={{ textAlign: 'left', padding: '10px 0.75rem', fontWeight: '600', color: tableHeaderText, fontSize: '0.75rem', textTransform: 'uppercase' }}>Rol</th>
                    <th style={{ textAlign: 'left', padding: '10px 0.75rem', fontWeight: '600', color: tableHeaderText, fontSize: '0.75rem', textTransform: 'uppercase' }}>Email</th>
                    <th style={{ textAlign: 'center', padding: '10px 0.75rem', fontWeight: '600', color: tableHeaderText, fontSize: '0.75rem', textTransform: 'uppercase' }}>Estado</th>
                    <th style={{ textAlign: 'left', padding: '10px 0.75rem', fontWeight: '600', color: tableHeaderText, fontSize: '0.75rem', textTransform: 'uppercase' }}>Última Conexión</th>
                    <th style={{ textAlign: 'center', padding: '10px 0.75rem', fontWeight: '600', color: tableHeaderText, fontSize: '0.75rem', textTransform: 'uppercase' }}>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {usuarios.map((usuario) => (
                    <tr key={usuario.id_usuario} style={{
                      borderBottom: `1px solid ${tableRowDivider}`,
                      transition: 'all 0.2s ease'
                    }}
                      onMouseEnter={(e) => e.currentTarget.style.background = tableRowHover}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                    >
                      <td style={{ padding: '0.75rem' }}>
                        <div style={{ fontSize: '0.75rem', color: textPrimaryColor, fontWeight: 600 }}>
                          {usuario.username || usuario.email}
                        </div>
                      </td>
                      <td style={{ padding: '0.75rem' }}>
                        <div style={{ fontWeight: '600', color: textPrimaryColor, marginBottom: '0.1875rem', fontSize: '0.8rem' }}>
                          {usuario.apellido}, {usuario.nombre}
                        </div>
                        <div style={{ fontSize: '0.7rem', color: textMutedColor }}>{usuario.cedula}</div>
                      </td>
                      <td style={{ padding: '1rem' }}>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getRolColor(usuario.nombre_rol)}`}>
                          {usuario.nombre_rol}
                        </span>
                      </td>
                      <td style={{ padding: '0.75rem' }}>
                        <div style={{ fontSize: '0.75rem', color: textSecondaryColor }}>{usuario.email || '-'}</div>
                      </td>
                      <td style={{ padding: '1rem' }}>
                        {usuario.cuenta_bloqueada ? (
                          <span className="px-3 py-1 rounded-full text-xs font-medium border bg-red-600/20 text-red-500 border-red-600/30 flex items-center justify-center gap-1">
                            <Lock size={12} /> BLOQUEADO
                          </span>
                        ) : (
                          <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getEstadoColor(usuario.estado)}`}>
                            {usuario.estado.toUpperCase()}
                          </span>
                        )}
                      </td>
                      <td style={{ padding: '0.75rem' }}>
                        <div style={{ fontSize: '0.75rem', color: textSecondaryColor }}>{formatFecha(usuario.fecha_ultima_conexion)}</div>
                      </td>
                      <td style={{ padding: '1rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                          <button
                            onClick={() => verDetalle(usuario)}
                            style={{
                              padding: '0.5rem',
                              borderRadius: '0.5rem',
                              border: '1px solid #3b82f6',
                              backgroundColor: 'transparent',
                              color: '#3b82f6',
                              cursor: 'pointer',
                              transition: 'all 0.2s'
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.backgroundColor = '#3b82f6';
                              e.currentTarget.style.color = 'white';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.backgroundColor = 'transparent';
                              e.currentTarget.style.color = '#3b82f6';
                            }}
                            title="Ver detalle"
                          >
                            <Eye style={{ width: '1rem', height: '1rem' }} />
                          </button>
                          <button
                            onClick={() => confirmarCambioEstado(usuario)}
                            style={{
                              padding: '0.5rem',
                              borderRadius: '0.5rem',
                              border: `1px solid ${usuario.estado === 'activo' ? '#ef4444' : '#10b981'}`,
                              backgroundColor: 'transparent',
                              color: usuario.estado === 'activo' ? '#ef4444' : '#10b981',
                              cursor: 'pointer',
                              transition: 'all 0.2s'
                            }}
                            onMouseEnter={(e) => {
                              const color = usuario.estado === 'activo' ? '#ef4444' : '#10b981';
                              e.currentTarget.style.backgroundColor = color;
                              e.currentTarget.style.color = 'white';
                            }}
                            onMouseLeave={(e) => {
                              const color = usuario.estado === 'activo' ? '#ef4444' : '#10b981';
                              e.currentTarget.style.backgroundColor = 'transparent';
                              e.currentTarget.style.color = color;
                            }}
                            title={usuario.estado === 'activo' ? 'Desactivar usuario' : 'Activar usuario'}
                          >
                            {usuario.estado === 'activo' ? (
                              <Power style={{ width: '1rem', height: '1rem' }} />
                            ) : (
                              <CheckCircle style={{ width: '1rem', height: '1rem' }} />
                            )}
                          </button>

                          {/* Botón de Bloqueo Financiero */}
                          <button
                            onClick={() => usuario.cuenta_bloqueada ? confirmarDesbloqueo(usuario) : confirmarBloqueo(usuario)}
                            style={{
                              padding: '0.5rem',
                              borderRadius: '0.5rem',
                              border: `1px solid ${usuario.cuenta_bloqueada ? '#10b981' : '#ef4444'}`,
                              backgroundColor: 'transparent',
                              color: usuario.cuenta_bloqueada ? '#10b981' : '#ef4444',
                              cursor: 'pointer',
                              transition: 'all 0.2s'
                            }}
                            onMouseEnter={(e) => {
                              const color = usuario.cuenta_bloqueada ? '#10b981' : '#ef4444';
                              e.currentTarget.style.backgroundColor = color;
                              e.currentTarget.style.color = 'white';
                            }}
                            onMouseLeave={(e) => {
                              const color = usuario.cuenta_bloqueada ? '#10b981' : '#ef4444';
                              e.currentTarget.style.backgroundColor = 'transparent';
                              e.currentTarget.style.color = color;
                            }}
                            title={usuario.cuenta_bloqueada ? 'Desbloquear cuenta' : 'Bloquear cuenta'}
                          >
                            {usuario.cuenta_bloqueada ? (
                              <Unlock style={{ width: '1rem', height: '1rem' }} />
                            ) : (
                              <Lock style={{ width: '1rem', height: '1rem' }} />
                            )}
                          </button>
                          {usuario.cuenta_bloqueada && (
                            <button
                              onClick={() => confirmarDesbloqueoTemporal(usuario)}
                              style={{
                                padding: '0.5rem',
                                borderRadius: '0.5rem',
                                border: '1px solid #ff9800',
                                backgroundColor: 'transparent',
                                color: '#ff9800',
                                cursor: 'pointer',
                                transition: 'all 0.2s'
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.backgroundColor = '#ff9800';
                                e.currentTarget.style.color = 'white';
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.backgroundColor = 'transparent';
                                e.currentTarget.style.color = '#ff9800';
                              }}
                              title="Desbloqueo temporal (24h)"
                            >
                              <Clock style={{ width: '1rem', height: '1rem' }} />
                            </button>
                          )}
                          <button
                            onClick={() => resetearPassword(usuario)}
                            style={{
                              padding: '0.5rem',
                              borderRadius: '0.5rem',
                              border: '1px solid #f59e0b',
                              backgroundColor: 'transparent',
                              color: '#f59e0b',
                              cursor: 'pointer',
                              transition: 'all 0.2s'
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.backgroundColor = '#f59e0b';
                              e.currentTarget.style.color = 'white';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.backgroundColor = 'transparent';
                              e.currentTarget.style.color = '#f59e0b';
                            }}
                            title="Resetear contraseña"
                          >
                            <KeyRound style={{ width: '1rem', height: '1rem' }} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Paginación */}
            {totalPages > 0 && (
              <div className="pagination-container" style={{
                display: 'flex',
                flexDirection: isMobile ? 'column' : 'row',
                justifyContent: 'space-between',
                alignItems: isMobile ? 'stretch' : 'center',
                gap: isMobile ? '0.75rem' : '0',
                padding: isMobile ? '16px' : '20px 1.5rem',
                background: paginationSurface,
                border: `1px solid ${paginationBorder}`,
                borderRadius: '1rem',
              }}>
                <div style={{
                  color: paginationText,
                  fontSize: isMobile ? '0.8rem' : '0.9rem',
                  textAlign: isMobile ? 'center' : 'left'
                }}>
                  Página {page} de {totalPages} • Total: {usuarios.length} usuarios
                </div>
                <div style={{
                  display: 'flex',
                  gap: '0.5rem',
                  justifyContent: isMobile ? 'center' : 'flex-start',
                  flexWrap: 'wrap'
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
                      background: page === 1 ? paginationButtonDisabledBg : paginationButtonBg,
                      border: `1px solid ${paginationButtonBorder}`,
                      borderRadius: '0.625rem',
                      color: page === 1 ? paginationButtonDisabledText : paginationButtonText,
                      fontSize: isMobile ? '0.8rem' : '0.9rem',
                      fontWeight: 600,
                      cursor: page === 1 ? 'not-allowed' : 'pointer',
                      transition: 'all 0.2s ease',
                      flex: isMobile ? '1' : 'initial'
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
                        background: page === pageNum ? activePageBg : inactivePageBg,
                        border: page === pageNum ? `1px solid ${activePageBorder}` : `1px solid ${inactivePageBorder}`,
                        borderRadius: '0.625rem',
                        color: page === pageNum ? '#ffffff' : paginationButtonText,
                        fontSize: isMobile ? '0.8rem' : '0.9rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        minWidth: isMobile ? '36px' : '2.5rem',
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
                      background: page === totalPages ? paginationButtonDisabledBg : paginationButtonBg,
                      border: `1px solid ${paginationButtonBorder}`,
                      borderRadius: '0.625rem',
                      color: page === totalPages ? paginationButtonDisabledText : paginationButtonText,
                      fontSize: isMobile ? '0.8rem' : '0.9rem',
                      fontWeight: 600,
                      cursor: page === totalPages ? 'not-allowed' : 'pointer',
                      transition: 'all 0.2s ease',
                      flex: isMobile ? '1' : 'initial'
                    }}
                  >
                    {!isMobile && 'Siguiente'}
                    <ChevronRight size={isMobile ? 14 : 16} />
                  </button>
                </div>
              </div>
            )}
          </>
        )
      }

      {/* Modales */}
      <ModalDetalle
        show={showModal}
        usuario={usuarioSeleccionado}
        tabActiva={tabActiva}
        sesiones={sesiones}
        acciones={acciones}
        loadingModal={loadingModal}
        onClose={() => setShowModal(false)}
        onChangeTab={setTabActiva}
        onRecargarAcciones={cargarAccionesDetalladas}
        formatFecha={formatFecha}
        getRolColor={getRolColor}
        getEstadoColor={getEstadoColor}
        darkMode={darkMode}
      />

      <ModalConfirmacion
        show={showConfirmModal}
        accion={accionConfirmar}
        onConfirm={() => {
          if (accionConfirmar?.tipo === 'resetear') {
            ejecutarResetearPassword();
          } else {
            ejecutarAccion();
          }
        }}
        onCancel={() => {
          setShowConfirmModal(false);
          setAccionConfirmar(null);
          setMotivoBloqueo('');
        }}
        motivoBloqueo={motivoBloqueo}
        setMotivoBloqueo={setMotivoBloqueo}
      />

      <ModalCredenciales
        show={showCredencialesModal}
        credenciales={credenciales}
        onClose={() => {
          setShowCredencialesModal(false);
          setCredenciales(null);
        }}
      />

      {/* Modal de carga */}
      <LoadingModal
        isOpen={showLoadingModal}
        message="Actualizando datos..."
        darkMode={darkMode}
        duration={500}
        onComplete={() => setShowLoadingModal(false)}
        colorTheme="red"
      />
    </div >
  );
};

// ============================================
// COMPONENTES DE MODALES
// ============================================

interface ModalDetalleProps {
  show: boolean;
  usuario: Usuario | null;
  tabActiva: 'info' | 'sesiones' | 'acciones';
  sesiones: Sesion[];
  acciones: Accion[];
  loadingModal: boolean;
  onClose: () => void;
  onChangeTab: (tab: 'info' | 'sesiones' | 'acciones') => void;
  onRecargarAcciones: (tipo: 'todas' | 'administrativas' | 'academicas') => Promise<void>;
  formatFecha: (fecha: string | null) => string;
  getRolColor: (rol: string) => string;
  getEstadoColor: (estado: string) => string;
  darkMode: boolean;
}

const ModalDetalle = ({
  show,
  usuario,
  tabActiva,
  sesiones,
  acciones,
  loadingModal,
  onClose,
  onChangeTab,
  onRecargarAcciones,
  formatFecha,
  getRolColor,
  getEstadoColor,
  darkMode
}: ModalDetalleProps) => {
  // Estado local para filtro de acciones
  const [filtroAcciones, setFiltroAcciones] = React.useState<'todas' | 'administrativas' | 'academicas'>('todas');

  // Recargar acciones cuando cambie el filtro
  React.useEffect(() => {
    if (show && usuario) {
      onRecargarAcciones(filtroAcciones);
    }
  }, [filtroAcciones]);

  // Verificación temprana
  if (!show || !usuario) return null;

  const theme = {
    modalBackground: darkMode
      ? 'linear-gradient(135deg, rgba(15,16,28,0.96) 0%, rgba(26,28,44,0.96) 100%)'
      : 'linear-gradient(135deg, rgba(255,255,255,0.98) 0%, rgba(248,250,252,0.96) 100%)',
    modalBorder: darkMode ? 'rgba(239,68,68,0.24)' : 'rgba(248,113,113,0.32)',
    modalShadow: darkMode ? '0 20px 60px -12px rgba(0,0,0,0.6)' : '0 28px 48px -18px rgba(15,23,42,0.22)',
    textPrimary: darkMode ? 'rgba(255,255,255,0.95)' : '#0f172a',
    textSecondary: darkMode ? 'rgba(226,232,240,0.72)' : 'rgba(71,85,105,0.88)',
    textMuted: darkMode ? 'rgba(148,163,184,0.65)' : 'rgba(100,116,139,0.75)',
    divider: darkMode ? 'rgba(255,255,255,0.08)' : 'rgba(148,163,184,0.22)',
    surface: darkMode ? 'rgba(255,255,255,0.05)' : 'linear-gradient(135deg, rgba(255,255,255,0.98) 0%, rgba(248,250,252,0.94) 100%)',
    surfaceBorder: darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(148,163,184,0.22)',
    surfaceMuted: darkMode ? 'rgba(255,255,255,0.03)' : 'rgba(15,23,42,0.04)',
    accentRed: darkMode ? '#fca5a5' : '#dc2626',
    accentYellow: darkMode ? '#fbbf24' : '#b45309',
    accentYellowSoft: darkMode ? 'rgba(251,191,36,0.12)' : 'rgba(253,230,138,0.25)',
    accentRedSoft: darkMode ? 'rgba(248,113,113,0.16)' : 'rgba(254,202,202,0.6)',
    sessionActiveBorder: darkMode ? 'rgba(16,185,129,0.55)' : 'rgba(5,150,105,0.35)',
    sessionInactiveBorder: darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(203,213,225,0.5)',
    overlay: darkMode ? 'rgba(6,7,12,0.72)' : 'rgba(15,23,42,0.35)'
  };

  const baseCardStyle: CSSProperties = {
    background: theme.surface,
    padding: '0.75rem 0.9rem',
    borderRadius: '0.625rem',
    border: `1px solid ${theme.surfaceBorder}`
  };

  const tabItems: Array<{ id: 'info' | 'sesiones' | 'acciones'; label: string; icon: LucideIcon }> = [
    { id: 'info', label: 'Información General', icon: User },
    { id: 'sesiones', label: 'Últimas Sesiones', icon: History },
    { id: 'acciones', label: 'Últimas Acciones', icon: Zap }
  ];

  const labelStyle: CSSProperties = {
    fontSize: '0.65rem',
    color: theme.textSecondary,
    marginBottom: '0.25rem',
    fontWeight: '600',
    letterSpacing: '0.02em'
  };

  const valueStyle: CSSProperties = {
    fontSize: '0.75rem',
    color: theme.textPrimary,
    fontWeight: '500'
  };

  const metricValueStyle: CSSProperties = {
    fontSize: '1.1rem',
    fontWeight: '700',
    color: theme.accentRed,
    letterSpacing: '0.01em'
  };

  const chipTextStyle: CSSProperties = {
    fontSize: '0.75rem',
    fontWeight: 600,
    lineHeight: '1.2'
  };

  const filtroOptions: Array<{ key: 'todas' | 'administrativas' | 'academicas'; label: string; icon: LucideIcon; activeColor: string }> = [
    { key: 'todas', label: 'Todas', icon: Zap, activeColor: '#ef4444' },
    { key: 'administrativas', label: 'Administrativas', icon: Shield, activeColor: '#f59e0b' },
    { key: 'academicas', label: 'Académicas', icon: GraduationCap, activeColor: '#3b82f6' }
  ];

  const getAccionDescripcion = (accion: Accion) => {
    const detalles = accion.detalles && typeof accion.detalles === 'object' ? accion.detalles : {};
    switch (accion.tipo_accion) {
      case 'pago':
        if (detalles.curso) {
          const cuota = detalles.cuota ? ` #${detalles.cuota}` : '';
          return `Pago de cuota${cuota} - ${detalles.curso}`.trim();
        }
        return 'Registro de pago';
      case 'cambio_perfil':
        if (detalles.cambio_realizado) {
          return String(detalles.cambio_realizado);
        }
        return 'Actualización de perfil';
      case 'tarea_subida':
        if (detalles.tarea) {
          return `Entrega de tarea: ${detalles.tarea}`;
        }
        return 'Entrega de tarea';
      case 'calificacion':
        if (detalles.nota) {
          return `Calificación registrada: ${detalles.nota}/10${detalles.tarea ? ` - ${detalles.tarea}` : ''}`;
        }
        return 'Calificación registrada';
      case 'matricula':
        if (detalles.curso) {
          return `Matrícula en ${detalles.curso}`;
        }
        return 'Matrícula registrada';
      case 'modulo':
        if (detalles.modulo) {
          return `Actualización de módulo: ${detalles.modulo}`;
        }
        return 'Actualización de módulo';
      default:
        if (accion.descripcion) {
          return accion.descripcion;
        }
        return accion.tipo_accion ? accion.tipo_accion.replace(/_/g, ' ') : 'Acción registrada';
    }
  };

  const detalleConfig: Record<string, { label: string; icon: LucideIcon; accent?: string }> = {
    curso: { label: 'Curso', icon: BookOpen },
    codigo_curso: { label: 'Código', icon: Hash },
    cuota: { label: 'Cuota', icon: Hash },
    monto: { label: 'Monto', icon: DollarSign, accent: '#10b981' },
    metodo_pago: { label: 'Método de pago', icon: CreditCard },
    estado: { label: 'Estado', icon: AlertCircle },
    fecha_pago: { label: 'Fecha de pago', icon: Calendar },
    fecha_verificacion: { label: 'Verificación', icon: CheckCircle },
    fecha_vencimiento: { label: 'Fecha de vencimiento', icon: Timer },
    numero_comprobante: { label: 'Comprobante', icon: FileSignature },
    banco_comprobante: { label: 'Banco', icon: Building },
    cambio_realizado: { label: 'Cambio realizado', icon: RefreshCcw },
    tipo: { label: 'Categoría', icon: Tag },
    email_anterior: { label: 'Email anterior', icon: Mail },
    email_nuevo: { label: 'Email nuevo', icon: Mail },
    telefono_anterior: { label: 'Teléfono anterior', icon: Phone },
    telefono_nuevo: { label: 'Teléfono nuevo', icon: Phone },
    tarea: { label: 'Tarea', icon: FileText },
    modulo: { label: 'Módulo', icon: BookOpen },
    fecha_entrega: { label: 'Fecha de entrega', icon: Calendar },
    archivo: { label: 'Archivo', icon: Paperclip },
    nota: { label: 'Nota', icon: Star },
    comentario: { label: 'Comentario', icon: MessageSquare },
    fecha_calificacion: { label: 'Fecha de calificación', icon: Calendar },
    codigo_matricula: { label: 'Código matrícula', icon: Hash },
    monto_matricula: { label: 'Monto matrícula', icon: DollarSign, accent: '#10b981' },
    fecha_matricula: { label: 'Fecha matrícula', icon: Calendar },
    estudiante: { label: 'Estudiante', icon: User },
    fecha_limite: { label: 'Fecha límite', icon: Timer },
    descripcion: { label: 'Descripción', icon: AlignLeft },
    fecha_inicio: { label: 'Fecha de inicio', icon: Calendar }
  };

  return createPortal(
    <div
      onClick={onClose}
      className="modal-overlay"
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
        padding: '1rem',
        backdropFilter: 'blur(8px)',
        background: theme.overlay,
        overflowY: 'auto',
        overflowX: 'hidden',
        scrollBehavior: 'smooth'
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="modal-content"
        style={{
          position: 'relative',
          background: theme.modalBackground,
          border: `1px solid ${theme.modalBorder}`,
          borderRadius: '12px',
          width: '92vw',
          maxWidth: '1000px',
          maxHeight: '85vh',
          margin: 'auto',
          color: theme.textPrimary,
          boxShadow: theme.modalShadow,
          animation: 'scaleIn 0.3s ease-out',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '1rem 1.25rem',
          borderBottom: 'none'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
            <div style={{
              width: '2.5rem',
              height: '2.5rem',
              borderRadius: '50%',
              background: usuario.foto_perfil ? theme.surface : theme.accentRedSoft,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'hidden',
              border: usuario.foto_perfil ? `2px solid ${darkMode ? 'rgba(239,68,68,0.4)' : 'rgba(248,113,113,0.45)'}` : 'none'
            }}>
              {usuario.foto_perfil ? (
                <img
                  src={usuario.foto_perfil}
                  alt={`${usuario.nombre} ${usuario.apellido}`}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                    e.currentTarget.parentElement!.innerHTML = `<div style="width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; background: rgba(239, 68, 68, 0.15); color: #ef4444; font-weight: 700; font-size: 0.875rem;">${usuario.nombre.charAt(0)}${usuario.apellido.charAt(0)}</div>`;
                  }}
                />
              ) : (
                <div style={{ color: theme.accentRed, fontWeight: '700', fontSize: '0.875rem' }}>
                  {usuario.nombre.charAt(0)}{usuario.apellido.charAt(0)}
                </div>
              )}
            </div>
            <div>
              <h2 style={{
                fontSize: '1rem',
                fontWeight: '600',
                color: theme.textPrimary,
                margin: 0,
                marginBottom: '0.125rem',
                letterSpacing: '-0.01em'
              }}>
                {usuario.nombre} {usuario.apellido}
              </h2>
              <p style={{
                fontSize: '0.75rem',
                color: theme.textSecondary,
                margin: 0
              }}>
                {usuario.username || usuario.email}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: darkMode ? 'rgba(255,255,255,0.05)' : 'rgba(15,23,42,0.06)',
              border: `1px solid ${darkMode ? 'rgba(255,255,255,0.12)' : 'rgba(148,163,184,0.35)'}`,
              borderRadius: '0.5rem',
              padding: '0.375rem',
              color: theme.textPrimary,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = darkMode ? 'rgba(239,68,68,0.2)' : 'rgba(254,226,226,0.9)';
              e.currentTarget.style.borderColor = darkMode ? 'rgba(239,68,68,0.4)' : 'rgba(248,113,113,0.45)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = darkMode ? 'rgba(255,255,255,0.05)' : 'rgba(15,23,42,0.06)';
              e.currentTarget.style.borderColor = darkMode ? 'rgba(255,255,255,0.12)' : 'rgba(148,163,184,0.35)';
            }}
          >
            <X style={{ width: '1.125rem', height: '1.125rem' }} />
          </button>
        </div>

        {/* Tabs */}
        <div
          style={{
            display: 'flex',
            gap: '0.4rem',
            padding: '0.45rem',
            borderRadius: '0.9rem',
            backgroundColor: darkMode ? 'rgba(15,23,42,0.28)' : 'rgba(236,240,244,0.85)',
            border: 'none',
            boxShadow: 'none',
            marginInline: '1.25rem'
          }}
        >
          {tabItems.map(({ id, label, icon: Icon }) => {
            const isActive = tabActiva === id;
            return (
              <button
                key={id}
                onClick={() => onChangeTab(id)}
                style={{
                  flex: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.4rem',
                  padding: '0.6rem 0.85rem',
                  borderRadius: '0.65rem',
                  border: 'none',
                  backgroundColor: isActive
                    ? (darkMode ? 'rgba(255,255,255,0.12)' : '#ffffff')
                    : 'transparent',
                  color: isActive ? '#dc2626' : theme.textSecondary,
                  fontWeight: isActive ? 700 : 600,
                  fontSize: '0.78rem',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  boxShadow: 'none'
                }}
                onMouseEnter={(e) => {
                  if (!isActive) e.currentTarget.style.color = theme.textPrimary;
                }}
                onMouseLeave={(e) => {
                  if (!isActive) e.currentTarget.style.color = theme.textSecondary;
                }}
              >
                <Icon style={{ width: '0.95rem', height: '0.95rem', color: 'currentColor' }} />
                {label}
              </button>
            );
          })}
        </div>

        {/* Contenido */}
        <div style={{ padding: '1rem 1.3rem 1.25rem', overflowY: 'auto', flex: 1, backgroundColor: 'transparent' }}>
          {tabActiva === 'info' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {/* Información Básica */}
              <div style={{
                ...baseCardStyle,
                background: darkMode ? 'rgba(255,255,255,0.08)' : 'rgba(243,244,246,0.9)',
                border: `1px solid ${darkMode ? 'rgba(255,255,255,0.14)' : 'rgba(148,163,184,0.28)'}`
              }}>
                <h3 style={{
                  fontSize: '0.875rem',
                  fontWeight: '700',
                  color: theme.textSecondary,
                  marginBottom: '0.5rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}>
                  <UserCircle style={{ width: '1rem', height: '1rem', color: theme.textSecondary }} />
                  Información Básica
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.6rem' }}>
                  <div>
                    <div style={labelStyle}>CÉDULA</div>
                    <div style={valueStyle}>{usuario.cedula}</div>
                  </div>
                  <div>
                    <div style={labelStyle}>ROL</div>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium border ${getRolColor(usuario.nombre_rol)}`}
                      style={chipTextStyle}
                    >
                      {usuario.nombre_rol}
                    </span>
                  </div>
                  <div>
                    <div style={labelStyle}>EMAIL</div>
                    <div style={valueStyle}>{usuario.email || '-'}</div>
                  </div>
                  <div>
                    <div style={labelStyle}>TELÉFONO</div>
                    <div style={valueStyle}>{usuario.telefono || '-'}</div>
                  </div>
                  <div>
                    <div style={labelStyle}>ESTADO</div>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium border ${getEstadoColor(usuario.estado)}`}
                      style={chipTextStyle}
                    >
                      {usuario.estado}
                    </span>
                  </div>
                  <div>
                    <div style={labelStyle}>ÚLTIMA CONEXIÓN</div>
                    <div style={valueStyle}>{formatFecha(usuario.fecha_ultima_conexion)}</div>
                  </div>
                </div>
              </div>

              {/* Trazabilidad del Sistema */}
              <div style={{
                ...baseCardStyle,
                background: theme.accentYellowSoft,
                border: `1px solid ${darkMode ? 'rgba(251,191,36,0.28)' : 'rgba(217,119,6,0.28)'}`
              }}>
                <h3 style={{
                  fontSize: '0.875rem',
                  fontWeight: '700',
                  color: theme.accentYellow,
                  marginBottom: '0.5rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}>
                  <Shield style={{ width: '1rem', height: '1rem', color: theme.accentYellow }} />
                  Trazabilidad del Sistema
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.6rem' }}>
                  <div>
                    <div style={{ ...labelStyle, color: darkMode ? 'rgba(251,191,36,0.78)' : 'rgba(180,83,9,0.75)' }}>CREADO POR</div>
                    <div style={valueStyle}>
                      {usuario.creado_por || 'Sistema'}
                    </div>
                  </div>
                  <div>
                    <div style={{ ...labelStyle, color: darkMode ? 'rgba(251,191,36,0.78)' : 'rgba(180,83,9,0.75)' }}>FECHA DE CREACIÓN</div>
                    <div style={valueStyle}>
                      {formatFecha(usuario.fecha_creacion || usuario.fecha_registro)}
                    </div>
                  </div>
                  {usuario.modificado_por && (
                    <>
                      <div>
                        <div style={{ ...labelStyle, color: darkMode ? 'rgba(251,191,36,0.78)' : 'rgba(180,83,9,0.75)' }}>MODIFICADO POR</div>
                        <div style={valueStyle}>
                          {usuario.modificado_por}
                        </div>
                      </div>
                      <div>
                        <div style={{ ...labelStyle, color: darkMode ? 'rgba(251,191,36,0.78)' : 'rgba(180,83,9,0.75)' }}>ÚLTIMA MODIFICACIÓN</div>
                        <div style={valueStyle}>
                          {formatFecha(usuario.fecha_modificacion || null)}
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Información Académica - ESTUDIANTES */}
              {usuario.nombre_rol?.toLowerCase() === 'estudiante' && (
                <div style={{
                  ...baseCardStyle,
                  background: darkMode ? 'rgba(239,68,68,0.14)' : 'rgba(254,226,226,0.82)',
                  border: `1px solid ${darkMode ? 'rgba(239,68,68,0.32)' : 'rgba(248,113,113,0.3)'}`
                }}>
                  <h3 style={{
                    fontSize: '0.875rem',
                    fontWeight: '700',
                    color: theme.accentRed,
                    marginBottom: '0.5rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}>
                    <BookOpen style={{ width: '1rem', height: '1rem', color: theme.accentRed }} />
                    Información Académica
                  </h3>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.6rem' }}>
                    <div>
                      <div style={{ ...labelStyle, color: darkMode ? 'rgba(252,165,165,0.95)' : 'rgba(185,28,28,0.75)' }}>CURSOS MATRICULADOS</div>
                      <div style={metricValueStyle}>
                        {usuario.cursos_matriculados || 0}
                      </div>
                    </div>
                    <div>
                      <div style={{ ...labelStyle, color: darkMode ? 'rgba(252,165,165,0.95)' : 'rgba(21,128,61,0.8)' }}>PAGOS COMPLETADOS</div>
                      <div style={{ ...metricValueStyle, color: darkMode ? '#34d399' : '#047857' }}>
                        {usuario.pagos_completados ?? 0}
                      </div>
                    </div>
                    <div>
                      <div style={{ ...labelStyle, color: darkMode ? 'rgba(252,165,165,0.95)' : 'rgba(190,24,93,0.85)' }}>PAGOS PENDIENTES</div>
                      <div style={{ ...metricValueStyle, color: darkMode ? '#f97316' : '#be123c' }}>
                        {usuario.pagos_pendientes ?? 0}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Información Académica - DOCENTES */}
              {usuario.nombre_rol?.toLowerCase() === 'docente' && (
                <div style={{
                  ...baseCardStyle,
                  background: darkMode ? 'rgba(239,68,68,0.14)' : 'rgba(254,226,226,0.82)',
                  border: `1px solid ${darkMode ? 'rgba(239,68,68,0.32)' : 'rgba(248,113,113,0.3)'}`
                }}>
                  <h3 style={{
                    fontSize: '0.875rem',
                    fontWeight: '700',
                    color: theme.accentRed,
                    marginBottom: '0.5rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}>
                    <BookOpen style={{ width: '1rem', height: '1rem', color: theme.accentRed }} />
                    Información Académica
                  </h3>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.6rem' }}>
                    <div>
                      <div style={{ ...labelStyle, color: darkMode ? 'rgba(252,165,165,0.95)' : 'rgba(185,28,28,0.75)' }}>CURSOS ASIGNADOS</div>
                      <div style={metricValueStyle}>
                        {usuario.cursos_asignados ?? 0}
                      </div>
                    </div>
                    <div>
                      <div style={{ ...labelStyle, color: darkMode ? 'rgba(252,165,165,0.95)' : 'rgba(15,118,110,0.85)' }}>ESTUDIANTES ACTIVOS</div>
                      <div style={{ ...metricValueStyle, color: darkMode ? '#38bdf8' : '#0f766e' }}>
                        {usuario.estudiantes_activos ?? 0}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Actividad del Sistema - ADMIN */}
              {usuario.nombre_rol?.toLowerCase() === 'administrativo' && (
                <div style={{
                  ...baseCardStyle,
                  background: darkMode ? 'rgba(239,68,68,0.14)' : 'rgba(254,226,226,0.82)',
                  border: `1px solid ${darkMode ? 'rgba(239,68,68,0.32)' : 'rgba(248,113,113,0.3)'}`
                }}>
                  <h3 style={{
                    fontSize: '0.875rem',
                    fontWeight: '700',
                    color: theme.accentRed,
                    marginBottom: '0.5rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}>
                    <Activity style={{ width: '1rem', height: '1rem', color: theme.accentRed }} />
                    Actividad del Sistema
                  </h3>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.6rem' }}>
                    <div>
                      <div style={{ ...labelStyle, color: darkMode ? 'rgba(252,165,165,0.95)' : 'rgba(190,24,93,0.85)' }}>MATRÍCULAS APROBADAS</div>
                      <div style={{ ...metricValueStyle, color: darkMode ? '#f472b6' : '#be123c' }}>
                        {usuario.matriculas_aprobadas ?? 0}
                      </div>
                    </div>
                    <div>
                      <div style={{ ...labelStyle, color: darkMode ? 'rgba(252,165,165,0.95)' : 'rgba(22,101,52,0.85)' }}>PAGOS VERIFICADOS</div>
                      <div style={{ ...metricValueStyle, color: darkMode ? '#34d399' : '#15803d' }}>
                        {usuario.pagos_verificados ?? 0}
                      </div>
                    </div>
                    <div>
                      <div style={{ ...labelStyle, color: darkMode ? 'rgba(252,165,165,0.95)' : 'rgba(190,24,93,0.85)' }}>TOTAL ACCIONES</div>
                      <div style={{ ...metricValueStyle, color: darkMode ? '#f97316' : '#f97316' }}>
                        {usuario.total_acciones ?? 0}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {tabActiva === 'sesiones' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {loadingModal ? (
                <div style={{ textAlign: 'center', padding: '48px 0' }}>
                  <div style={{
                    display: 'inline-block',
                    width: '2rem',
                    height: '2rem',
                    border: '4px solid #fee2e2',
                    borderTop: '4px solid #ef4444',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite'
                  }}></div>
                </div>
              ) : sesiones.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '48px 0' }}>
                  <Clock style={{ width: '3rem', height: '3rem', margin: '0 auto 1rem', color: theme.textMuted }} />
                  <p style={{ color: theme.textSecondary, fontSize: '0.8rem' }}>No hay sesiones registradas para este usuario</p>
                  <p style={{ color: theme.textMuted, fontSize: '0.75rem', marginTop: '0.5rem' }}>Las sesiones aparecerán cuando el usuario inicie sesión</p>
                </div>
              ) : (
                sesiones.map((sesion) => {
                  // Detectar dispositivo y navegador del user agent
                  const userAgent = sesion.user_agent || '';
                  const esMovil = /Mobile|Android|iPhone|iPad/i.test(userAgent);
                  const navegador = userAgent.includes('Chrome') ? 'Chrome' :
                    userAgent.includes('Firefox') ? 'Firefox' :
                      userAgent.includes('Safari') ? 'Safari' :
                        userAgent.includes('Edge') ? 'Edge' : 'Otro';

                  return (
                    <div key={sesion.id_sesion} style={{
                      padding: '0.875rem',
                      borderRadius: '0.625rem',
                      border: `1px solid ${sesion.activa ? theme.sessionActiveBorder : theme.sessionInactiveBorder}`,
                      background: sesion.activa
                        ? (darkMode ? 'rgba(16,185,129,0.16)' : 'rgba(187,247,208,0.55)')
                        : theme.surface,
                      transition: 'all 0.3s ease'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'start', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                          <div style={{
                            width: '2rem',
                            height: '2rem',
                            borderRadius: '0.5rem',
                            backgroundColor: sesion.activa ? '#10b981' : (darkMode ? 'rgba(255,255,255,0.08)' : 'rgba(148,163,184,0.15)'),
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}>
                            {sesion.activa
                              ? <CheckCircle size={16} color="#fff" />
                              : <XCircle size={16} color={darkMode ? theme.accentRed : '#dc2626'} />}
                          </div>
                          <div>
                            <div style={{ fontSize: '0.75rem', fontWeight: '700', color: theme.textPrimary, marginBottom: '0.25rem' }}>
                              {sesion.activa ? 'Sesión Activa' : 'Sesión Finalizada'}
                            </div>
                            <div style={{ fontSize: '0.7rem', color: theme.textSecondary, display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                              {esMovil ? <Monitor size={14} /> : <Globe size={14} />}
                              <span>{esMovil ? 'Móvil' : 'Escritorio'} · {navegador}</span>
                            </div>
                          </div>
                        </div>
                        <span style={{
                          padding: '4px 0.75rem',
                          borderRadius: '0.375rem',
                          fontSize: '0.7rem',
                          fontWeight: '600',
                          backgroundColor: sesion.activa
                            ? (darkMode ? 'rgba(16,185,129,0.22)' : 'rgba(16,185,129,0.18)')
                            : (darkMode ? 'rgba(255,255,255,0.06)' : 'rgba(148,163,184,0.18)'),
                          color: sesion.activa ? '#047857' : theme.textSecondary
                        }}>
                          ID: {sesion.id_sesion.substring(0, 8)}...
                        </span>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', fontSize: '0.75rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', color: theme.textSecondary }}>
                          <Calendar size={14} color="#ef4444" />
                          <div>
                            <div style={{ fontSize: '0.625rem', color: theme.textMuted }}>Inicio de Sesión</div>
                            <div style={{ fontWeight: '600', color: theme.textPrimary, fontSize: '0.7rem' }}>{formatFecha(sesion.fecha_inicio)}</div>
                          </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', color: theme.textSecondary }}>
                          <Clock size={14} color={sesion.activa ? '#10b981' : '#ef4444'} />
                          <div>
                            <div style={{ fontSize: '0.625rem', color: theme.textMuted }}>
                              {sesion.activa ? 'Expira' : 'Cerró Sesión'}
                            </div>
                            <div style={{ fontWeight: '600', color: theme.textPrimary, fontSize: '0.7rem' }}>
                              {sesion.activa ? formatFecha(sesion.fecha_expiracion) : formatFecha(sesion.fecha_cierre || sesion.fecha_expiracion)}
                            </div>
                          </div>
                        </div>
                      </div>

                      <div style={{
                        marginTop: '0.5rem',
                        padding: '0.5rem',
                        borderRadius: '0.375rem',
                        backgroundColor: theme.surfaceMuted,
                        border: `1px solid ${theme.surfaceBorder}`
                      }}>
                        <div style={{ fontSize: '0.625rem', color: theme.textMuted, marginBottom: '0.25rem' }}>User Agent:</div>
                        <div style={{ fontSize: '0.65rem', color: theme.textSecondary, wordBreak: 'break-all', lineHeight: '1.3' }}>{sesion.user_agent}</div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}

          {tabActiva === 'acciones' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {loadingModal ? (
                <div style={{ textAlign: 'center', padding: '48px 0' }}>
                  <div style={{
                    display: 'inline-block',
                    width: '2rem',
                    height: '2rem',
                    border: '4px solid #fee2e2',
                    borderTop: '4px solid #ef4444',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite'
                  }}></div>
                </div>
              ) : (
                <>
                  {/* Filtro de Acciones */}
                  <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
                    {filtroOptions.map((option) => {
                      const isActive = filtroAcciones === option.key;
                      const borderColor = isActive
                        ? option.activeColor
                        : darkMode ? 'rgba(255,255,255,0.12)' : 'rgba(148,163,184,0.35)';
                      const backgroundColor = isActive
                        ? (darkMode ? `${option.activeColor}33` : `${option.activeColor}1f`)
                        : (darkMode ? 'rgba(255,255,255,0.04)' : 'rgba(15,23,42,0.04)');
                      const textColor = isActive ? option.activeColor : theme.textSecondary;

                      return (
                        <button
                          key={option.key}
                          onClick={() => setFiltroAcciones(option.key)}
                          style={{
                            padding: '0.45rem 0.85rem',
                            borderRadius: '0.5rem',
                            border: `1.5px solid ${borderColor}`,
                            background: backgroundColor,
                            color: textColor,
                            fontSize: '0.75rem',
                            fontWeight: '600',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.4rem'
                          }}
                        >
                          {React.createElement(option.icon, { size: 14, strokeWidth: 2.25 })}
                          {option.label}
                        </button>
                      );
                    })}
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {acciones.length === 0 ? (
                      <div style={{
                        padding: '2rem',
                        textAlign: 'center',
                        color: theme.textSecondary,
                        fontSize: '0.875rem'
                      }}>
                        No hay acciones registradas
                      </div>
                    ) : (
                      acciones.map((accion, index) => {
                        const detalles = accion.detalles && typeof accion.detalles === 'object' ? accion.detalles : {};
                        let iconoConfig = {
                          icono: Activity,
                          color: '#0ea5e9',
                          surface: darkMode ? 'rgba(14,165,233,0.18)' : 'rgba(191,219,254,0.55)',
                          border: darkMode ? 'rgba(14,165,233,0.34)' : 'rgba(59,130,246,0.25)',
                          badgeBg: darkMode ? 'rgba(14,165,233,0.22)' : 'rgba(191,219,254,0.32)',
                          label: 'Acción'
                        };

                        const tipoAccion = (accion.tipo_accion || '').toLowerCase();

                        if (tipoAccion.includes('contraseña') || tipoAccion.includes('password')) {
                          iconoConfig = {
                            icono: Lock,
                            color: '#f59e0b',
                            surface: darkMode ? 'rgba(245,158,11,0.22)' : 'rgba(253,230,138,0.55)',
                            border: darkMode ? 'rgba(245,158,11,0.32)' : 'rgba(251,191,36,0.35)',
                            badgeBg: darkMode ? 'rgba(245,158,11,0.18)' : 'rgba(253,230,138,0.5)',
                            label: 'Contraseña'
                          };
                        } else if (tipoAccion.includes('foto') || tipoAccion.includes('perfil')) {
                          iconoConfig = {
                            icono: UserCircle,
                            color: '#8b5cf6',
                            surface: darkMode ? 'rgba(139,92,246,0.22)' : 'rgba(221,214,254,0.55)',
                            border: darkMode ? 'rgba(139,92,246,0.28)' : 'rgba(167,139,250,0.35)',
                            badgeBg: darkMode ? 'rgba(139,92,246,0.2)' : 'rgba(196,181,253,0.45)',
                            label: 'Perfil'
                          };
                        } else if (tipoAccion.includes('pago')) {
                          iconoConfig = {
                            icono: DollarSign,
                            color: '#10b981',
                            surface: darkMode ? 'rgba(16,185,129,0.22)' : 'rgba(187,247,208,0.6)',
                            border: darkMode ? 'rgba(16,185,129,0.35)' : 'rgba(16,185,129,0.28)',
                            badgeBg: darkMode ? 'rgba(16,185,129,0.22)' : 'rgba(134,239,172,0.5)',
                            label: 'Pago'
                          };
                        } else if (tipoAccion.includes('tarea') || tipoAccion.includes('entrega')) {
                          iconoConfig = {
                            icono: FileText,
                            color: '#2563eb',
                            surface: darkMode ? 'rgba(37,99,235,0.2)' : 'rgba(191,219,254,0.55)',
                            border: darkMode ? 'rgba(37,99,235,0.32)' : 'rgba(37,99,235,0.24)',
                            badgeBg: darkMode ? 'rgba(37,99,235,0.22)' : 'rgba(191,219,254,0.45)',
                            label: 'Tarea'
                          };
                        } else if (tipoAccion.includes('calificación') || tipoAccion.includes('nota')) {
                          iconoConfig = {
                            icono: CheckCircle,
                            color: '#22c55e',
                            surface: darkMode ? 'rgba(34,197,94,0.22)' : 'rgba(187,247,208,0.6)',
                            border: darkMode ? 'rgba(34,197,94,0.28)' : 'rgba(134,239,172,0.35)',
                            badgeBg: darkMode ? 'rgba(34,197,94,0.2)' : 'rgba(187,247,208,0.45)',
                            label: 'Calificación'
                          };
                        } else if (tipoAccion.includes('módulo')) {
                          iconoConfig = {
                            icono: BookOpen,
                            color: '#f97316',
                            surface: darkMode ? 'rgba(249,115,22,0.22)' : 'rgba(254,215,170,0.6)',
                            border: darkMode ? 'rgba(249,115,22,0.32)' : 'rgba(248,153,102,0.35)',
                            badgeBg: darkMode ? 'rgba(249,115,22,0.2)' : 'rgba(254,215,170,0.45)',
                            label: 'Módulo'
                          };
                        } else if (tipoAccion.includes('matrícula') || tipoAccion.includes('inscripción')) {
                          iconoConfig = {
                            icono: GraduationCap,
                            color: '#8b5cf6',
                            surface: darkMode ? 'rgba(139,92,246,0.22)' : 'rgba(221,214,254,0.55)',
                            border: darkMode ? 'rgba(139,92,246,0.28)' : 'rgba(167,139,250,0.35)',
                            badgeBg: darkMode ? 'rgba(139,92,246,0.2)' : 'rgba(196,181,253,0.45)',
                            label: 'Matrícula'
                          };
                        }

                        const descripcion = getAccionDescripcion(accion);
                        const tipoAccionTexto = accion.tipo_accion ? accion.tipo_accion.replace(/_/g, ' ').toUpperCase() : null;

                        return (
                          <div key={`accion-${index}`} style={{
                            padding: '1.1rem',
                            borderRadius: '0.85rem',
                            border: `1.5px solid ${iconoConfig.border}`,
                            background: iconoConfig.surface,
                            transition: 'all 0.3s ease',
                            boxShadow: `0 12px 28px -18px ${iconoConfig.color}55`,
                            position: 'relative',
                            overflow: 'hidden'
                          }}>
                            <div style={{
                              position: 'absolute',
                              left: 0,
                              top: 0,
                              bottom: 0,
                              width: '4px',
                              backgroundColor: iconoConfig.color,
                              opacity: 0.85
                            }}></div>

                            <div style={{ display: 'flex', alignItems: 'start', justifyContent: 'space-between', marginBottom: '0.9rem' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1 }}>
                                <div style={{
                                  width: '2.6rem',
                                  height: '2.6rem',
                                  borderRadius: '0.7rem',
                                  backgroundColor: iconoConfig.color,
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  boxShadow: `0 10px 24px -16px ${iconoConfig.color}aa`
                                }}>
                                  {React.createElement(iconoConfig.icono, { size: 20, color: '#fff', strokeWidth: 2.5 })}
                                </div>
                                <div>
                                  <div style={{
                                    fontSize: '0.85rem',
                                    fontWeight: 700,
                                    color: theme.textPrimary,
                                    marginBottom: '0.3rem',
                                    letterSpacing: '0.015em'
                                  }}>
                                    {descripcion}
                                  </div>
                                  {tipoAccionTexto && (
                                    <div style={{
                                      fontSize: '0.7rem',
                                      color: theme.textSecondary,
                                      fontWeight: 500,
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: '0.45rem'
                                    }}>
                                      <span>{tipoAccionTexto}</span>
                                      {detalles?.tipo && (
                                        <span style={{ color: theme.textMuted }}>• {detalles.tipo}</span>
                                      )}
                                    </div>
                                  )}
                                </div>
                              </div>
                              <span style={{
                                padding: '0.45rem 0.85rem',
                                borderRadius: '0.5rem',
                                fontSize: '0.7rem',
                                fontWeight: 700,
                                background: iconoConfig.badgeBg,
                                color: iconoConfig.color,
                                textTransform: 'uppercase',
                                letterSpacing: '0.05em'
                              }}>
                                {iconoConfig.label}
                              </span>
                            </div>

                            {Object.keys(detalles).length > 0 && (
                              <div style={{
                                marginTop: '0.85rem',
                                padding: '0.9rem',
                                background: theme.surfaceMuted,
                                borderRadius: '0.6rem',
                                border: `1px solid ${theme.surfaceBorder}`
                              }}>
                                <div style={{
                                  fontSize: '0.7rem',
                                  fontWeight: 700,
                                  color: theme.textSecondary,
                                  textTransform: 'uppercase',
                                  letterSpacing: '0.08em',
                                  marginBottom: '0.65rem',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '0.45rem'
                                }}>
                                  <Activity size={14} color={theme.textSecondary} />
                                  Información Detallada
                                </div>
                                <div style={{
                                  display: 'grid',
                                  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                                  gap: '0.55rem'
                                }}>
                                  {Object.entries(detalles)
                                    .filter(([key]) => key !== 'password_changed' && key !== 'id' && key !== 'password')
                                    .map(([key, value]) => {
                                      const normalizedKey = key.toLowerCase();
                                      const config = detalleConfig[normalizedKey] || {
                                        label: key.replace(/_/g, ' '),
                                        icon: Info
                                      };

                                      if (value === null || value === undefined || value === '') {
                                        return null;
                                      }

                                      let displayValue: any = value;
                                      let valorColor = theme.textPrimary;

                                      if (typeof value === 'number' && normalizedKey.includes('monto')) {
                                        displayValue = `$${value.toFixed(2)}`;
                                        valorColor = darkMode ? '#34d399' : '#047857';
                                      } else if (normalizedKey.includes('fecha')) {
                                        displayValue = new Date(String(value)).toLocaleDateString('es-EC', {
                                          day: '2-digit',
                                          month: 'short',
                                          year: 'numeric',
                                          hour: String(value).includes('T') ? '2-digit' : undefined,
                                          minute: String(value).includes('T') ? '2-digit' : undefined
                                        });
                                        valorColor = theme.textPrimary;
                                      } else if (normalizedKey === 'nota') {
                                        const notaNum = Number(value);
                                        displayValue = `${notaNum}/10`;
                                        valorColor = notaNum >= 7 ? (darkMode ? '#34d399' : '#047857') : notaNum >= 5 ? '#f59e0b' : '#ef4444';
                                      } else if (normalizedKey === 'estado') {
                                        const estado = String(value).toLowerCase();
                                        if (['pagado', 'verificado', 'activa', 'completado'].includes(estado)) {
                                          valorColor = darkMode ? '#34d399' : '#047857';
                                        } else if (estado === 'pendiente') {
                                          valorColor = '#f59e0b';
                                        } else {
                                          valorColor = '#ef4444';
                                        }
                                      }

                                      return (
                                        <div
                                          key={key}
                                          style={{
                                            padding: '0.6rem 0.7rem',
                                            background: darkMode ? 'rgba(255,255,255,0.03)' : 'rgba(248,250,252,0.85)',
                                            borderRadius: '0.5rem',
                                            border: `1px solid ${theme.surfaceBorder}`,
                                            transition: 'all 0.2s ease'
                                          }}
                                          onMouseEnter={(e) => {
                                            e.currentTarget.style.background = darkMode ? 'rgba(255,255,255,0.06)' : 'rgba(248,250,252,0.96)';
                                            e.currentTarget.style.borderColor = darkMode ? 'rgba(255,255,255,0.16)' : 'rgba(148,163,184,0.45)';
                                          }}
                                          onMouseLeave={(e) => {
                                            e.currentTarget.style.background = darkMode ? 'rgba(255,255,255,0.03)' : 'rgba(248,250,252,0.85)';
                                            e.currentTarget.style.borderColor = theme.surfaceBorder;
                                          }}
                                        >
                                          <div style={{
                                            fontSize: '0.65rem',
                                            color: theme.textMuted,
                                            marginBottom: '0.3rem',
                                            fontWeight: 600,
                                            textTransform: 'uppercase',
                                            letterSpacing: '0.05em',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '0.3rem'
                                          }}>
                                            {React.createElement(config.icon, { size: 13, color: config.accent || theme.textSecondary })}
                                            {config.label}
                                          </div>
                                          <div style={{
                                            color: valorColor,
                                            fontWeight: 600,
                                            fontSize: '0.85rem',
                                            letterSpacing: '0.015em',
                                            wordBreak: 'break-word'
                                          }}>
                                            {typeof displayValue === 'object' ? JSON.stringify(displayValue) : String(displayValue)}
                                          </div>
                                        </div>
                                      );
                                    })
                                    .filter(Boolean)}
                                </div>
                              </div>
                            )}

                            <div style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.5rem',
                              fontSize: '0.75rem',
                              marginTop: '0.75rem',
                              color: theme.textSecondary
                            }}>
                              <Calendar size={16} color={theme.accentRed} />
                              <div>
                                <div style={{ fontSize: '0.65rem', color: theme.textMuted }}>Fecha</div>
                                <div style={{ fontWeight: 600, color: theme.textPrimary }}>
                                  {formatFecha(accion.fecha_hora || accion.fecha_operacion || '')}
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </>
              )}
            </div>
          )}
        </div>
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
    </div>,
    document.body
  );
};

interface ModalConfirmacionProps {
  show: boolean;
  accion: { tipo: 'activar' | 'desactivar' | 'resetear' | 'bloquear' | 'desbloquear' | 'desbloqueo-temporal', usuario: Usuario } | null; onConfirm: () => void;
  onCancel: () => void;
  motivoBloqueo?: string;
  setMotivoBloqueo?: (motivo: string) => void;
}

const ModalConfirmacion = ({ show, accion, onConfirm, onCancel, motivoBloqueo, setMotivoBloqueo }: ModalConfirmacionProps) => {
  if (!show || !accion) return null;

  const getTitulo = () => {
    switch (accion.tipo) {
      case 'activar': return 'Activar Usuario';
      case 'desactivar': return 'Desactivar Usuario';
      case 'resetear': return 'Resetear Contraseña';
      case 'bloquear': return 'Bloquear Usuario';
      case 'desbloquear': return 'Desbloquear Usuario';
      case 'desbloqueo-temporal': return 'Desbloqueo Temporal';
      default: return '';
    }
  };

  const getMensaje = () => {
    switch (accion.tipo) {
      case 'activar':
      case 'desactivar':
        return `¿Estás seguro de ${accion.tipo} a `;
      case 'resetear':
        return '¿Estás seguro de resetear la contraseña de ';
      case 'bloquear':
        return '¿Estás seguro de bloquear financieramente a ';
      case 'desbloquear':
        return '¿Estás seguro de desbloquear a ';
      case 'desbloqueo-temporal':
        return (
          <>
            <p>El estudiante <strong>{accion.usuario.nombre} {accion.usuario.apellido}</strong> tendrá <strong>24 horas</strong> para:</p>
            <ul style={{ textAlign: 'left', marginLeft: '20px', marginTop: '10px' }}>
              <li>Acceder al sistema</li>
              <li>Subir evidencia de pago</li>
            </ul>
            <p style={{ color: '#ff9800', fontWeight: 'bold', marginTop: '10px' }}>⚠️ Si no sube evidencia en 24 horas, se bloqueará automáticamente.</p>
          </>
        );
      default:
        return '';
    }
  };

  const getBotonTexto = () => {
    switch (accion.tipo) {
      case 'activar': return 'Activar';
      case 'desactivar': return 'Desactivar';
      case 'resetear': return 'Resetear';
      case 'bloquear': return 'Bloquear';
      case 'desbloquear': return 'Desbloquear';
      case 'desbloqueo-temporal': return 'Desbloquear Temporal';
      default: return 'Confirmar';
    }
  };

  return createPortal(
    <div
      onClick={onCancel}
      className="modal-overlay"
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
        padding: '1rem',
        backdropFilter: 'blur(8px)',
        background: 'rgba(0, 0, 0, 0.65)',
        overflowY: 'auto',
        overflowX: 'hidden',
        scrollBehavior: 'smooth'
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="modal-content"
        style={{
          position: 'relative',
          background: 'var(--admin-card-bg, linear-gradient(135deg, rgba(0,0,0,0.9) 0%, rgba(26,26,46,0.9) 100%))',
          border: '1px solid rgba(239, 68, 68, 0.2)',
          borderRadius: '12px',
          maxWidth: '31.25rem',
          padding: '1.5rem',
          margin: 'auto',
          color: 'var(--admin-text-primary, #fff)',
          boxShadow: '0 20px 60px -12px rgba(0, 0, 0, 0.5)',
          animation: 'scaleIn 0.3s ease-out'
        }}
      >
        <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: '600', letterSpacing: '-0.02em', marginBottom: '0.75rem' }}>
          {getTitulo()}
        </h3>
        <div style={{ marginBottom: '1.25rem', color: 'var(--admin-text-secondary, rgba(255,255,255,0.7))', fontSize: '0.95rem' }}>
          {getMensaje()}{accion.tipo !== 'desbloqueo-temporal' && <strong style={{ color: 'var(--admin-text-primary, #fff)' }}>{accion.usuario.nombre} {accion.usuario.apellido}</strong>}{accion.tipo !== 'desbloqueo-temporal' && '?'}
        </div>

        {/* Input para motivo de bloqueo */}
        {accion.tipo === 'bloquear' && setMotivoBloqueo && (
          <div style={{ marginBottom: '1.5rem', textAlign: 'left' }}>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: 'var(--admin-text-primary, #fff)', marginBottom: '0.5rem' }}>
              Motivo del bloqueo
            </label>
            <textarea
              value={motivoBloqueo}
              onChange={(e) => setMotivoBloqueo(e.target.value)}
              placeholder="Ej: Falta de pago cuota 2 y 3..."
              style={{
                width: '100%',
                padding: '0.75rem',
                borderRadius: '0.5rem',
                border: '1px solid var(--admin-border, rgba(255,255,255,0.2))',
                backgroundColor: 'var(--admin-input-bg, rgba(255,255,255,0.05))',
                color: 'var(--admin-text-primary, #fff)',
                fontSize: '0.9rem',
                resize: 'none',
                minHeight: '80px'
              }}
              rows={3}
            />
          </div>
        )}
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button
            onClick={onCancel}
            style={{
              flex: 1,
              padding: '10px 1rem',
              borderRadius: '0.5rem',
              border: '1px solid var(--admin-border, rgba(255,255,255,0.2))',
              background: 'rgba(255,255,255,0.05)',
              color: 'var(--admin-text-primary, #fff)',
              cursor: 'pointer',
              fontSize: '0.9rem',
              fontWeight: '600',
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            style={{
              flex: 1,
              padding: '10px 1rem',
              borderRadius: '0.5rem',
              border: 'none',
              background: 'linear-gradient(135deg, #ef4444, #dc2626)',
              color: '#fff',
              cursor: 'pointer',
              fontSize: '0.9rem',
              fontWeight: '600',
              transition: 'all 0.2s ease',
            }}
          >
            {getBotonTexto()}
          </button>
        </div>
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
    </div>,
    document.body
  );
};

interface ModalCredencialesProps {
  show: boolean;
  credenciales: { username: string, password_temporal: string } | null;
  onClose: () => void;
}

const ModalCredenciales = ({ show, credenciales, onClose }: ModalCredencialesProps) => {
  if (!show || !credenciales) return null;

  return createPortal(
    <div
      onClick={onClose}
      className="modal-overlay"
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
        padding: '1rem',
        backdropFilter: 'blur(8px)',
        background: 'rgba(0, 0, 0, 0.65)',
        overflowY: 'auto',
        overflowX: 'hidden',
        scrollBehavior: 'smooth'
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="modal-content"
        style={{
          position: 'relative',
          background: 'var(--admin-card-bg, linear-gradient(135deg, rgba(0,0,0,0.9) 0%, rgba(26,26,46,0.9) 100%))',
          border: '1px solid rgba(59, 130, 246, 0.3)',
          borderRadius: '12px',
          maxWidth: '31.25rem',
          padding: '1.5rem',
          margin: 'auto',
          color: 'var(--admin-text-primary, #fff)',
          boxShadow: '0 20px 60px -12px rgba(0, 0, 0, 0.5)',
          animation: 'scaleIn 0.3s ease-out'
        }}
      >
        <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: '600', letterSpacing: '-0.02em', marginBottom: '0.75rem' }}>
          🔐 Contraseña Reseteada
        </h3>
        <p style={{ marginBottom: '1rem', color: 'var(--admin-text-secondary, rgba(255,255,255,0.7))', fontSize: '0.95rem' }}>
          Las nuevas credenciales son:
        </p>
        <div style={{
          marginBottom: '1.25rem',
          padding: '1rem',
          borderRadius: '0.5rem',
          background: 'rgba(59, 130, 246, 0.1)',
          border: '1px solid rgba(59, 130, 246, 0.3)',
        }}>
          <div style={{ marginBottom: '0.75rem' }}>
            <div style={{ fontSize: '0.8rem', color: 'var(--admin-text-secondary, rgba(255,255,255,0.6))', marginBottom: '0.25rem' }}>Usuario</div>
            <div style={{ fontWeight: '700', color: '#3b82f6', fontSize: '1rem' }}>{credenciales.username}</div>
          </div >
          <div>
            <div style={{ fontSize: '0.8rem', color: 'var(--admin-text-secondary, rgba(255,255,255,0.6))', marginBottom: '0.25rem' }}>Contraseña Temporal</div>
            <div style={{ fontWeight: '700', color: '#3b82f6', fontSize: '1rem' }}>{credenciales.password_temporal}</div>
          </div>
        </div >
        <p style={{ fontSize: '0.85rem', color: 'var(--admin-text-secondary, rgba(255,255,255,0.7))', marginBottom: '1.25rem' }}>
          ⚠️ El usuario deberá cambiar esta contraseña en su primer inicio de sesión.
        </p>
        <button
          onClick={onClose}
          style={{
            width: '100%',
            padding: '10px 1rem',
            borderRadius: '0.5rem',
            border: 'none',
            background: 'linear-gradient(135deg, #ef4444, #dc2626)',
            color: '#fff',
            cursor: 'pointer',
            fontSize: '0.9rem',
            fontWeight: '600',
            transition: 'all 0.2s ease',
          }}
        >
          Cerrar
        </button>
      </div >
      {/* Animaciones CSS */}
      < style > {`
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
      `}</style >
    </div >,
    document.body
  );
};


export default ControlUsuarios;




