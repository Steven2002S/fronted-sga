import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { Search, Plus, Filter, MoreVertical, Edit, Trash2, X, Save, Shield, Mail, Phone, MapPin, Calendar, Lock, Eye, EyeOff, UserPlus, FileText, Users, GraduationCap, BarChart3, Settings, DollarSign, Database, Grid, List, Ban, CheckCircle2 } from 'lucide-react';
import { showToast } from '../../config/toastConfig';
import { StyledSelect } from '../../components/StyledSelect';
import GlassEffect from '../../components/GlassEffect';
import AdminSectionHeader from '../../components/AdminSectionHeader';
import { useBreakpoints } from '../../hooks/useMediaQuery';
import '../../styles/responsive.css';

// Tipos completos
interface Admin {
  id: number;
  nombre: string; // Nombre completo para lista
  firstName?: string;
  lastName?: string;
  cedula?: string;
  apellido?: string;
  email: string;
  telefono?: string;
  fechaCreacion?: string;
  fecha_nacimiento?: string;
  direccion?: string;
  genero?: string;
  foto_perfil?: string;
  ultimoAcceso?: string;
  estado: 'activo' | 'inactivo';
  permisos: string[];
  rol: string;
  rolId?: number;
}

// Permisos disponibles (del archivo original)
const permisosDisponibles = [
  { id: 'usuarios', nombre: 'Gestión de Usuarios', descripcion: 'Crear, editar y eliminar usuarios', icon: Users },
  { id: 'cursos', nombre: 'Gestión de Cursos', descripcion: 'Administrar cursos y programas', icon: GraduationCap },
  { id: 'reportes', nombre: 'Reportes y Estadísticas', descripcion: 'Acceso a reportes del sistema', icon: BarChart3 },
  { id: 'configuracion', nombre: 'Configuración del Sistema', descripcion: 'Cambiar configuraciones generales', icon: Settings },
  { id: 'pagos', nombre: 'Gestión de Pagos', descripcion: 'Administrar pagos y facturación', icon: DollarSign },
  { id: 'inventario', nombre: 'Control de Inventario', descripcion: 'Gestionar productos e inventario', icon: Database }
];

// Componente de Input reutilizable - FUERA del componente principal para evitar re-creación
const InputField = React.memo(({ label, type = 'text', value, onChange, placeholder = '', icon: Icon, error, themeColors, darkMode }: any) => (
  <div style={{ marginBottom: '0.5rem' }}>
    <label style={{ display: 'block', color: darkMode ? 'rgba(255,255,255,0.9)' : '#1e293b', marginBottom: '0.25rem', fontSize: '0.8rem', fontWeight: 600 }}>{label}</label>
    <div style={{ position: 'relative' }}>
      {Icon && <Icon size={18} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: darkMode ? 'rgba(255,255,255,0.5)' : '#64748b' }} />}
      <input
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        style={{
          width: '100%',
          padding: Icon ? '0.5rem 0.5rem 0.5rem 2.5rem' : '0.5rem',
          borderRadius: '0.625rem',
          background: darkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)',
          border: darkMode ? '1px solid rgba(255,255,255,0.12)' : '1px solid rgba(0,0,0,0.15)',
          color: darkMode ? 'rgba(255,255,255,0.9)' : '#1e293b',
          fontSize: '0.85rem'
        }}
      />
    </div>
    {error && <span style={{ color: '#ef4444', fontSize: '0.8rem', marginTop: '0.25rem', display: 'block' }}>{error}</span>}
  </div>
));

const AdministradoresPanel: React.FC = () => {
  const { isMobile, isSmallScreen } = useBreakpoints();
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('superadmin-dark-mode');
    return saved !== null ? JSON.parse(saved) : true;
  });

  // Estados principales
  const [administradores, setAdministradores] = useState<Admin[]>([]);
  const [roles, setRoles] = useState<Array<{ id_rol: number; nombre_rol: string; descripcion?: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('todos');
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('cards');

  // Modales
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [selectedAdmin, setSelectedAdmin] = useState<Admin | null>(null);

  // Formularios con TODOS los campos
  const [formData, setFormData] = useState({
    cedula: '', nombre: '', apellido: '', email: '', telefono: '',
    fecha_nacimiento: '', direccion: '', genero: '', password: '', confirmPassword: '',
    rolId: '', permisos: [] as string[]
  });
  const [passwordData, setPasswordData] = useState({ newPassword: '', confirmPassword: '' });

  // Estados de UI para formularios
  const [showPwd, setShowPwd] = useState(false);
  const [showPwdConfirm, setShowPwdConfirm] = useState(false);
  const [cedulaError, setCedulaError] = useState<string | null>(null);

  const API_BASE = (import.meta as any).env?.VITE_API_URL ? `${(import.meta as any).env.VITE_API_URL}/api` : 'http://localhost:3000/api';

  // Sincronizar darkMode
  useEffect(() => {
    const syncDarkMode = () => {
      const saved = localStorage.getItem('superadmin-dark-mode');
      setDarkMode(saved !== null ? JSON.parse(saved) : true);
    };
    const interval = setInterval(syncDarkMode, 150);
    window.addEventListener('storage', syncDarkMode);
    return () => {
      clearInterval(interval);
      window.removeEventListener('storage', syncDarkMode);
    };
  }, []);

  // Tema de colores
  const themeColors = useMemo(() => ({
    textPrimary: darkMode ? 'rgba(255,255,255,0.95)' : '#1e293b',
    textSecondary: darkMode ? 'rgba(255,255,255,0.7)' : '#64748b',
    textMuted: darkMode ? 'rgba(255,255,255,0.5)' : '#94a3b8',
    controlBg: darkMode ? 'rgba(255,255,255,0.05)' : '#ffffff',
    controlBorder: darkMode ? 'rgba(255,255,255,0.1)' : '#e2e8f0',
    tableHeaderBg: darkMode ? 'rgba(239, 68, 68, 0.15)' : 'rgba(254, 226, 226, 0.5)',
    tableHeaderText: darkMode ? '#fca5a5' : '#b91c1c',
    tableRowHover: darkMode ? 'rgba(255,255,255,0.03)' : '#f8fafc',
    tableRowAltBg: darkMode ? 'rgba(255,255,255,0.02)' : '#fcfcfc',
    iconMuted: darkMode ? 'rgba(255,255,255,0.4)' : '#94a3b8',
    toggleGroupBg: darkMode ? 'rgba(0,0,0,0.2)' : '#f1f5f9',
    toggleActiveBg: darkMode ? 'rgba(255,255,255,0.1)' : '#ffffff',
    toggleActiveText: darkMode ? '#fff' : '#0f172a',
    toggleInactiveText: darkMode ? 'rgba(255,255,255,0.5)' : '#64748b',
    sectionSurface: darkMode ? 'rgba(20,20,25,0.6)' : '#ffffff',
    sectionBorder: darkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
  }), [darkMode]);

  const primaryActionButtonStyles = {
    base: 'linear-gradient(135deg, #ef4444, #dc2626)',
    hover: 'linear-gradient(135deg, #f87171, #ef4444)',
    text: '#ffffff',
    shadow: '0 4px 12px rgba(239, 68, 68, 0.25)'
  };

  // Validación de Cédula EC (Restaurada)
  const validateCedulaEC = (ced: string): { ok: boolean; reason?: string } => {
    if (!/^\d{10}$/.test(ced)) return { ok: false, reason: 'La cédula debe tener exactamente 10 dígitos' };
    if (/^(\d)\1{9}$/.test(ced)) return { ok: false, reason: 'La cédula es inválida (repetitiva)' };
    const prov = parseInt(ced.slice(0, 2), 10);
    if (prov < 1 || prov > 24) return { ok: false, reason: 'Código de provincia inválido (01-24)' };
    const digits = ced.split('').map(n => parseInt(n, 10));
    let sum = 0;
    for (let i = 0; i < 9; i++) {
      let val = digits[i];
      if ((i + 1) % 2 !== 0) {
        val = val * 2;
        if (val > 9) val -= 9;
      }
      sum += val;
    }
    const nextTen = Math.ceil(sum / 10) * 10;
    const verifier = (nextTen - sum) % 10;
    if (verifier !== digits[9]) return { ok: false, reason: 'Cédula incorrecta' };
    return { ok: true };
  };

  // Cargar datos
  const loadData = async () => {
    try {
      setLoading(true);
      const token = sessionStorage.getItem('auth_token') || localStorage.getItem('auth_token');
      if (!token) return;

      const headers = { Authorization: `Bearer ${token}` };

      // Cargar roles
      const rolesRes = await fetch(`${API_BASE}/roles`, { headers });
      if (rolesRes.ok) {
        const rolesData = await rolesRes.json();
        setRoles(Array.isArray(rolesData) ? rolesData : []);
      }

      // Cargar admins
      const adminsRes = await fetch(`${API_BASE}/admins`, { headers });
      if (adminsRes.ok) {
        const data = await adminsRes.json();
        if (Array.isArray(data)) {
          const mapped: Admin[] = data.map((d: any) => ({
            id: d.id || d.id_usuario || 0,
            nombre: d.nombre ? `${d.nombre}${d.apellido ? ' ' + d.apellido : ''}` : (d.nombre_completo || 'Sin nombre'),
            firstName: d.nombre || '',
            lastName: d.apellido || '',
            cedula: d.cedula || '',
            email: d.email || '',
            telefono: d.telefono || '',
            fechaCreacion: d.fecha_registro || '',
            fecha_nacimiento: d.fecha_nacimiento || '',
            direccion: d.direccion || '',
            genero: d.genero || '',
            foto_perfil: d.foto_perfil || '',
            ultimoAcceso: d.fecha_ultima_conexion || '',
            estado: (d.estado === 'activo' || d.estado === 'inactivo') ? d.estado : 'activo',
            permisos: Array.isArray(d.permisos) ? d.permisos : [],
            rol: d.rol?.nombre || d.nombre_rol || d.rol || 'Administrador',
            rolId: d.rol?.id_rol || d.id_rol || undefined
          }));
          setAdministradores(mapped);
        }
      }
    } catch (error) {
      console.error('Error cargando datos:', error);
      showToast.error('Error al cargar datos', darkMode);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Handlers
  const handleCreate = async () => {
    try {
      // Validaciones
      if (!formData.cedula || !formData.nombre || !formData.apellido || !formData.email || !formData.password) {
        showToast.error('Por favor completa los campos obligatorios', darkMode);
        return;
      }

      const cedRes = validateCedulaEC(formData.cedula);
      if (!cedRes.ok) {
        setCedulaError(cedRes.reason || 'Cédula inválida');
        showToast.error(cedRes.reason || 'Cédula inválida', darkMode);
        return;
      }

      if (formData.password !== formData.confirmPassword) {
        showToast.error('Las contraseñas no coinciden', darkMode);
        return;
      }
      if (formData.password.length < 6) {
        showToast.error('La contraseña debe tener al menos 6 caracteres', darkMode);
        return;
      }

      const token = sessionStorage.getItem('auth_token') || localStorage.getItem('auth_token');
      const fd = new FormData();
      Object.entries(formData).forEach(([key, value]) => {
        if (key !== 'confirmPassword' && key !== 'permisos' && value) fd.append(key, value as string);
      });
      // Permisos
      formData.permisos.forEach(p => fd.append('permisos[]', p));

      // Rol
      const roleName = 'administrativo';
      fd.append('roleName', roleName);

      const res = await fetch(`${API_BASE}/admins`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: fd
      });

      if (!res.ok) throw new Error(await res.text());

      showToast.success('Administrador creado exitosamente', darkMode);
      setShowCreateModal(false);
      setFormData({
        cedula: '', nombre: '', apellido: '', email: '', telefono: '',
        fecha_nacimiento: '', direccion: '', genero: '', password: '', confirmPassword: '',
        rolId: '', permisos: []
      });
      loadData();
    } catch (error: any) {
      showToast.error(error.message || 'Error al crear administrador', darkMode);
    }
  };

  const handleUpdate = async () => {
    try {
      if (!selectedAdmin) return;
      const token = sessionStorage.getItem('auth_token') || localStorage.getItem('auth_token');

      const roleName = 'administrativo';

      const payload = {
        nombre: formData.nombre,
        apellido: formData.apellido,
        email: formData.email,
        telefono: formData.telefono,
        fecha_nacimiento: formData.fecha_nacimiento,
        direccion: formData.direccion,
        genero: formData.genero,
        rolId: formData.rolId ? Number(formData.rolId) : undefined,
        roleName: roleName,
        permisos: formData.permisos
      };

      const res = await fetch(`${API_BASE}/admins/${selectedAdmin.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (!res.ok) throw new Error(await res.text());

      showToast.success('Administrador actualizado exitosamente', darkMode);
      setShowEditModal(false);
      loadData();
    } catch (error: any) {
      showToast.error(error.message || 'Error al actualizar', darkMode);
    }
  };

  const handleChangePassword = async () => {
    try {
      if (!selectedAdmin) return;
      if (passwordData.newPassword !== passwordData.confirmPassword) {
        showToast.error('Las contraseñas no coinciden', darkMode);
        return;
      }
      if (passwordData.newPassword.length < 6) {
        showToast.error('La contraseña debe tener al menos 6 caracteres', darkMode);
        return;
      }

      const token = sessionStorage.getItem('auth_token') || localStorage.getItem('auth_token');
      const res = await fetch(`${API_BASE}/admins/${selectedAdmin.id}/password`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ password: passwordData.newPassword })
      });

      if (!res.ok) throw new Error(await res.text());

      showToast.success('Contraseña actualizada exitosamente', darkMode);
      setShowPasswordModal(false);
      setPasswordData({ newPassword: '', confirmPassword: '' });
    } catch (error: any) {
      showToast.error(error.message || 'Error al cambiar contraseña', darkMode);
    }
  };

  const toggleStatus = async (admin: Admin) => {
    try {
      const newStatus = admin.estado === 'activo' ? 'inactivo' : 'activo';
      const token = sessionStorage.getItem('auth_token') || localStorage.getItem('auth_token');

      const res = await fetch(`${API_BASE}/admins/${admin.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ estado: newStatus })
      });

      if (!res.ok) throw new Error('Error actualizando estado');

      setAdministradores(prev => prev.map(a =>
        a.id === admin.id ? { ...a, estado: newStatus } : a
      ));

      showToast.success(`Administrador ${newStatus === 'activo' ? 'activado' : 'desactivado'}`, darkMode);
    } catch (error) {
      showToast.error('No se pudo cambiar el estado', darkMode);
    }
  };

  // Filtrado
  const filteredAdmins = administradores.filter(admin => {
    const matchesSearch = admin.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      admin.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      admin.cedula?.includes(searchTerm);
    const matchesFilter = filterStatus === 'todos' || admin.estado === filterStatus;
    return matchesSearch && matchesFilter;
  });

  // Renderizado de Modales con GlassEffect
  const renderModal = (title: string, icon: any, onClose: () => void, content: React.ReactNode, footer: React.ReactNode) => {
    const Icon = icon;
    return createPortal(
      <div style={{
        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
        background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)',
        zIndex: 9999, display: 'flex', alignItems: isMobile ? 'flex-start' : 'center', justifyContent: 'center',
        padding: isMobile ? '0' : '1rem',
        overflowY: isMobile ? 'auto' : 'hidden'
      }}>
        <div style={{
          background: darkMode
            ? 'linear-gradient(135deg, rgba(0,0,0,0.9) 0%, rgba(26,26,46,0.9) 100%)'
            : 'linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(248,250,252,0.95) 100%)',
          borderRadius: isMobile ? '0' : '12px',
          width: '100%', maxWidth: isMobile ? '100%' : '800px',
          maxHeight: isMobile ? '100vh' : '85vh',
          minHeight: isMobile ? '100vh' : 'auto',
          overflowY: 'auto',
          boxShadow: '0 20px 60px -12px rgba(0, 0, 0, 0.5)',
          border: isMobile ? 'none' : '1px solid rgba(239, 68, 68, 0.2)',
          display: 'flex',
          flexDirection: 'column'
        }}>
          <div style={{
            padding: isMobile ? '1rem' : '1rem 1.5rem',
            borderBottom: '1px solid rgba(239, 68, 68, 0.2)',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            position: isMobile ? 'sticky' : 'relative',
            top: 0,
            background: darkMode
              ? 'linear-gradient(135deg, rgba(0,0,0,0.95) 0%, rgba(26,26,46,0.95) 100%)'
              : 'linear-gradient(135deg, rgba(255,255,255,0.98) 0%, rgba(248,250,252,0.98) 100%)',
            zIndex: 1
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {Icon && <Icon size={isMobile ? 18 : 20} style={{ color: '#ef4444' }} />}
              <h3 style={{ margin: 0, fontSize: isMobile ? '0.95rem' : '1.1rem', fontWeight: 600, color: darkMode ? '#fff' : '#1e293b' }}>{title}</h3>
            </div>
            <button onClick={onClose} style={{
              background: darkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
              border: darkMode ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.15)',
              borderRadius: '8px', padding: '6px', cursor: 'pointer', color: '#ef4444', display: 'flex'
            }}>
              <X size={18} />
            </button>
          </div>
          <div style={{ padding: isMobile ? '1rem' : '1rem 1.5rem', flex: 1 }}>{content}</div>
          <div style={{
            padding: isMobile ? '1rem' : '1.25rem 1.5rem',
            borderTop: `1px solid ${darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`,
            display: 'flex',
            flexDirection: isMobile ? 'column' : 'row',
            justifyContent: 'flex-end',
            gap: isMobile ? '0.75rem' : '1rem',
            background: darkMode
              ? 'linear-gradient(135deg, rgba(0,0,0,0.95) 0%, rgba(26,26,46,0.95) 100%)'
              : 'linear-gradient(135deg, rgba(255,255,255,0.98) 0%, rgba(248,250,252,0.98) 100%)',
            position: isMobile ? 'sticky' : 'relative',
            bottom: 0,
            zIndex: 1
          }}>
            {footer}
          </div>
        </div>
      </div>,
      document.body
    );
  };

  return (
    <div>
      <AdminSectionHeader
        title="Gestión de Administrativos"
        subtitle="Administra los usuarios con permisos administrativos del sistema"
        marginBottom={isMobile ? '12px' : '1.125rem'}
      />

      {/* Controles */}
      <GlassEffect variant="card" tint="neutral" intensity="light" style={{ marginBottom: isMobile ? '12px' : '1rem' }}>
        <div className="responsive-filters" style={{
          display: 'flex',
          flexDirection: isMobile ? 'column' : 'row',
          gap: '0.75rem',
          alignItems: isMobile ? 'stretch' : 'center'
        }}>
          {/* Búsqueda y filtro */}
          <div style={{
            display: 'flex',
            flexDirection: isSmallScreen ? 'column' : 'row',
            gap: '0.75rem',
            flex: 1
          }}>
            <div style={{ position: 'relative', flex: 1 }}>
              <Search size={16} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: themeColors.iconMuted }} />
              <input
                type="text"
                placeholder="Buscar por nombre, email o cédula..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  width: '100%', padding: '0.625em 0.625em 0.625em 2.375em',
                  background: darkMode ? 'rgba(255,255,255,0.1)' : themeColors.controlBg,
                  border: `0.0625rem solid ${themeColors.controlBorder}`,
                  borderRadius: '0.625em',
                  color: themeColors.textPrimary
                }}
              />
            </div>
            <div style={{ minWidth: isSmallScreen ? 'auto' : '200px' }}>
              <StyledSelect
                name="filterStatus"
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                darkMode={darkMode}
                options={[
                  { value: 'todos', label: 'Todos los estados' },
                  { value: 'activo', label: 'Activos' },
                  { value: 'inactivo', label: 'Inactivos' }
                ]}
              />
            </div>
          </div>

          {/* Toggle de vista */}
          <div style={{
            display: 'flex',
            background: themeColors.toggleGroupBg,
            borderRadius: '0.65rem',
            padding: '0.25rem',
            gap: '0.25rem'
          }}>
            <button
              onClick={() => setViewMode('cards')}
              style={{
                flex: isMobile ? 1 : 'none',
                padding: isMobile ? '0.75em 1em' : '0.45em 0.8em',
                background: viewMode === 'cards' ? themeColors.toggleActiveBg : 'transparent',
                border: 'none',
                borderRadius: '0.5em',
                color: viewMode === 'cards' ? themeColors.toggleActiveText : themeColors.toggleInactiveText,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5em',
                fontSize: isMobile ? '0.9rem' : '1rem',
                fontWeight: viewMode === 'cards' ? 600 : 400,
                transition: 'all 0.2s ease'
              }}
            >
              <Grid size={isMobile ? 18 : 16} />
              {isMobile && <span>Tarjetas</span>}
            </button>
            <button
              onClick={() => setViewMode('table')}
              style={{
                flex: isMobile ? 1 : 'none',
                padding: isMobile ? '0.75em 1em' : '0.45em 0.8em',
                background: viewMode === 'table' ? themeColors.toggleActiveBg : 'transparent',
                border: 'none',
                borderRadius: '0.5em',
                color: viewMode === 'table' ? themeColors.toggleActiveText : themeColors.toggleInactiveText,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5em',
                fontSize: isMobile ? '0.9rem' : '1rem',
                fontWeight: viewMode === 'table' ? 600 : 400,
                transition: 'all 0.2s ease'
              }}
            >
              <List size={isMobile ? 18 : 16} />
              {isMobile && <span>Tabla</span>}
            </button>
          </div>

          {/* Botón Nuevo Admin */}
          <button
            onClick={() => {
              setFormData({
                cedula: '', nombre: '', apellido: '', email: '', telefono: '',
                fecha_nacimiento: '', direccion: '', genero: '', password: '', confirmPassword: '',
                rolId: '', permisos: []
              });
              setShowCreateModal(true);
            }} style={{
              padding: isMobile ? '0.75em 1em' : '0.75em 1.5em',
              background: primaryActionButtonStyles.base,
              border: 'none',
              borderRadius: '0.625em',
              color: '#fff',
              fontWeight: 600,
              cursor: 'pointer',
              boxShadow: primaryActionButtonStyles.shadow,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5em',
              fontSize: isMobile ? '0.9rem' : '1rem',
              whiteSpace: 'nowrap'
            }}
          >
            <UserPlus size={18} /> Nuevo Administrativo
          </button>
        </div>
      </GlassEffect>

      {/* Lista de Administradores */}
      {viewMode === 'cards' ? (
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fit, minmax(300px, 1fr))', gap: isMobile ? '0.75rem' : '1rem' }}>
          {filteredAdmins.map(admin => (
            <GlassEffect key={admin.id} variant="card" tint="neutral" intensity="light" hover>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                  <div style={{
                    width: '3rem', height: '3rem', borderRadius: '0.75rem',
                    background: admin.foto_perfil ? 'transparent' : 'linear-gradient(135deg, #ef4444, #dc2626)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: '#fff', fontWeight: 700, fontSize: '1.2rem',
                    overflow: 'hidden'
                  }}>
                    {admin.foto_perfil ? (
                      <img src={admin.foto_perfil} alt={admin.nombre} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      (admin.firstName && admin.lastName)
                        ? `${admin.firstName.charAt(0)}${admin.lastName.charAt(0)}`.toUpperCase()
                        : admin.nombre.substring(0, 2).toUpperCase()
                    )}
                  </div>
                  <div>
                    <h3 style={{ margin: 0, color: themeColors.textPrimary, fontSize: '1rem' }}>{admin.nombre}</h3>
                    <p style={{ margin: 0, color: themeColors.textSecondary, fontSize: '0.8rem' }}>{admin.email}</p>
                  </div>
                </div>
                <div style={{
                  padding: '0.25rem 0.75rem', borderRadius: '1rem', fontSize: '0.75rem', fontWeight: 600,
                  background: admin.estado === 'activo' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                  color: admin.estado === 'activo' ? '#10b981' : '#ef4444',
                  height: 'fit-content'
                }}>
                  {admin.estado.toUpperCase()}
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginBottom: '1rem', fontSize: '0.85rem' }}>
                <div><span style={{ color: themeColors.textMuted }}>Cédula:</span> <div style={{ color: themeColors.textPrimary }}>{admin.cedula || 'N/A'}</div></div>
                <div><span style={{ color: themeColors.textMuted }}>Teléfono:</span> <div style={{ color: themeColors.textPrimary }}>{admin.telefono || 'N/A'}</div></div>
                <div><span style={{ color: themeColors.textMuted }}>Rol:</span> <div style={{ color: themeColors.textPrimary }}>{admin.rol}</div></div>
              </div>

              <div style={{ display: 'flex', gap: '0.5rem', borderTop: `1px solid ${themeColors.controlBorder}`, paddingTop: '1rem' }}>
                <button
                  onClick={() => {
                    setSelectedAdmin(admin);
                    setFormData({
                      cedula: admin.cedula || '',
                      nombre: admin.firstName || '',
                      apellido: admin.lastName || '',
                      email: admin.email,
                      telefono: admin.telefono || '',
                      fecha_nacimiento: admin.fecha_nacimiento ? new Date(admin.fecha_nacimiento).toISOString().split('T')[0] : '',
                      direccion: admin.direccion || '',
                      genero: admin.genero || '',
                      password: '', confirmPassword: '',
                      rolId: admin.rolId ? String(admin.rolId) : '',
                      permisos: admin.permisos || []
                    });
                    setShowEditModal(true);
                  }}
                  style={{ flex: 1, padding: '0.5rem', borderRadius: '0.5rem', border: `1px solid ${themeColors.controlBorder}`, background: 'transparent', color: themeColors.textPrimary, cursor: 'pointer', display: 'flex', justifyContent: 'center', gap: '0.5rem' }}
                >
                  <Edit size={16} /> Editar
                </button>
                <button
                  onClick={() => {
                    setSelectedAdmin(admin);
                    setShowPasswordModal(true);
                  }}
                  style={{ padding: '0.5rem', borderRadius: '0.5rem', border: `1px solid ${themeColors.controlBorder}`, background: 'transparent', color: themeColors.textPrimary, cursor: 'pointer' }}
                  title="Cambiar Contraseña"
                >
                  <Lock size={16} />
                </button>
                <button
                  onClick={() => toggleStatus(admin)}
                  style={{
                    padding: '0.5rem', borderRadius: '0.5rem', border: 'none',
                    background: admin.estado === 'activo' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(16, 185, 129, 0.1)',
                    color: admin.estado === 'activo' ? '#ef4444' : '#10b981',
                    cursor: 'pointer'
                  }}
                  title={admin.estado === 'activo' ? 'Desactivar' : 'Activar'}
                >
                  {admin.estado === 'activo' ? <Ban size={16} /> : <CheckCircle2 size={16} />}
                </button>
              </div>
            </GlassEffect>
          ))}
        </div>
      ) : (
        <div className="responsive-table-container" style={{
          background: themeColors.sectionSurface,
          border: `1px solid ${themeColors.sectionBorder}`,
          borderRadius: '1rem',
          overflowX: 'auto',
          WebkitOverflowScrolling: 'touch'
        }}>
          <table style={{
            width: '100%',
            borderCollapse: 'collapse',
            minWidth: '800px'
          }}>
            <thead>
              <tr style={{ background: themeColors.tableHeaderBg }}>
                <th style={{ padding: '1rem', textAlign: 'left', color: themeColors.tableHeaderText }}>Administrativo</th>
                <th style={{ padding: '1rem', textAlign: 'left', color: themeColors.tableHeaderText }}>Contacto</th>
                <th style={{ padding: '1rem', textAlign: 'center', color: themeColors.tableHeaderText }}>Estado</th>
                <th style={{ padding: '1rem', textAlign: 'center', color: themeColors.tableHeaderText }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredAdmins.map((admin, idx) => (
                <tr key={admin.id} style={{ borderBottom: `1px solid ${themeColors.controlBorder}`, background: idx % 2 === 0 ? themeColors.tableRowAltBg : 'transparent' }}>
                  <td style={{ padding: '1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <div style={{
                        width: '2.5rem', height: '2.5rem', borderRadius: '0.5rem',
                        background: admin.foto_perfil ? 'transparent' : 'linear-gradient(135deg, #ef4444, #dc2626)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: '#fff', fontWeight: 700,
                        overflow: 'hidden'
                      }}>
                        {admin.foto_perfil ? (
                          <img src={admin.foto_perfil} alt={admin.nombre} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                          (admin.firstName && admin.lastName)
                            ? `${admin.firstName.charAt(0)}${admin.lastName.charAt(0)}`.toUpperCase()
                            : admin.nombre.substring(0, 2).toUpperCase()
                        )}
                      </div>
                      <div>
                        <div style={{ color: themeColors.textPrimary, fontWeight: 600 }}>{admin.nombre}</div>
                        <div style={{ color: themeColors.textMuted, fontSize: '0.8rem' }}>{admin.cedula}</div>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: '1rem' }}>
                    <div style={{ color: themeColors.textPrimary }}>{admin.email}</div>
                    <div style={{ color: themeColors.textSecondary, fontSize: '0.8rem' }}>{admin.telefono}</div>
                  </td>
                  <td style={{ padding: '1rem', textAlign: 'center' }}>
                    <span style={{
                      padding: '0.25rem 0.75rem', borderRadius: '1rem', fontSize: '0.75rem', fontWeight: 600,
                      background: admin.estado === 'activo' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                      color: admin.estado === 'activo' ? '#10b981' : '#ef4444'
                    }}>
                      {admin.estado.toUpperCase()}
                    </span>
                  </td>
                  <td style={{ padding: '1rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem' }}>
                      <button
                        onClick={() => {
                          setSelectedAdmin(admin);
                          setFormData({
                            cedula: admin.cedula || '',
                            nombre: admin.firstName || '',
                            apellido: admin.lastName || '',
                            email: admin.email,
                            telefono: admin.telefono || '',
                            fecha_nacimiento: admin.fecha_nacimiento ? new Date(admin.fecha_nacimiento).toISOString().split('T')[0] : '',
                            direccion: admin.direccion || '',
                            genero: admin.genero || '',
                            password: '', confirmPassword: '',
                            rolId: admin.rolId ? String(admin.rolId) : '',
                            permisos: admin.permisos || []
                          });
                          setShowEditModal(true);
                        }}
                        style={{ padding: '0.5rem', borderRadius: '0.5rem', border: `1px solid ${themeColors.controlBorder}`, background: 'transparent', color: themeColors.textPrimary, cursor: 'pointer' }}
                      >
                        <Edit size={16} />
                      </button>
                      <button
                        onClick={() => {
                          setSelectedAdmin(admin);
                          setShowPasswordModal(true);
                        }}
                        style={{ padding: '0.5rem', borderRadius: '0.5rem', border: `1px solid ${themeColors.controlBorder}`, background: 'transparent', color: themeColors.textPrimary, cursor: 'pointer' }}
                      >
                        <Lock size={16} />
                      </button>
                      <button
                        onClick={() => toggleStatus(admin)}
                        style={{
                          padding: '0.5rem', borderRadius: '0.5rem', border: 'none',
                          background: admin.estado === 'activo' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(16, 185, 129, 0.1)',
                          color: admin.estado === 'activo' ? '#ef4444' : '#10b981',
                          cursor: 'pointer'
                        }}
                        title={admin.estado === 'activo' ? 'Desactivar' : 'Activar'}
                      >
                        {admin.estado === 'activo' ? <Ban size={16} /> : <CheckCircle2 size={16} />}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal Crear - CON TODOS LOS CAMPOS */}
      {showCreateModal && renderModal(
        "Nuevo Administrativo",
        UserPlus,
        () => setShowCreateModal(false),
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fit, minmax(250px, 1fr))', gap: '0.5rem' }}>
          <InputField themeColors={themeColors} darkMode={darkMode} label="Cédula *" value={formData.cedula} onChange={(e: any) => {
            const val = e.target.value.replace(/\D/g, '').slice(0, 10);
            setFormData({ ...formData, cedula: val });
            if (val.length === 10) {
              const res = validateCedulaEC(val);
              setCedulaError(res.ok ? null : (res.reason || 'Cédula inválida'));
            } else {
              setCedulaError(null);
            }
          }} error={cedulaError} />
          {/* Rol input eliminado - se asigna por defecto 'administrativo' */}

          <InputField themeColors={themeColors} darkMode={darkMode} label="Nombres *" value={formData.nombre} onChange={(e: any) => setFormData({ ...formData, nombre: e.target.value.toUpperCase() })} />
          <InputField themeColors={themeColors} darkMode={darkMode} label="Apellidos *" value={formData.apellido} onChange={(e: any) => setFormData({ ...formData, apellido: e.target.value.toUpperCase() })} />
          <InputField themeColors={themeColors} darkMode={darkMode} label="Email *" type="email" value={formData.email} onChange={(e: any) => setFormData({ ...formData, email: e.target.value })} />
          <InputField themeColors={themeColors} darkMode={darkMode} label="Teléfono" type="tel" value={formData.telefono} onChange={(e: any) => setFormData({ ...formData, telefono: e.target.value.replace(/\D/g, '') })} icon={Phone} />

          <InputField themeColors={themeColors} darkMode={darkMode} label="Fecha de Nacimiento" type="date" value={formData.fecha_nacimiento} onChange={(e: any) => setFormData({ ...formData, fecha_nacimiento: e.target.value })} icon={Calendar} />

          <div style={{ marginBottom: '0.5rem' }}>
            <label style={{ display: 'block', color: darkMode ? 'rgba(255,255,255,0.9)' : '#1e293b', marginBottom: '0.25rem', fontSize: '0.8rem', fontWeight: 600 }}>Género</label>
            <select
              value={formData.genero}
              onChange={e => setFormData({ ...formData, genero: e.target.value })}
              style={{
                width: '100%', padding: '0.5rem', borderRadius: '0.625rem',
                background: darkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)',
                border: darkMode ? '1px solid rgba(255,255,255,0.12)' : '1px solid rgba(0,0,0,0.15)',
                color: darkMode ? 'rgba(255,255,255,0.9)' : '#1e293b', fontSize: '0.85rem'
              }}
            >
              <option value="">Seleccionar</option>
              <option value="masculino">Masculino</option>
              <option value="femenino">Femenino</option>
              <option value="otro">Otro</option>
            </select>
          </div>

          <div style={{ gridColumn: '1 / -1' }}>
            <div style={{ marginBottom: '0.5rem' }}>
              <label style={{ display: 'block', color: darkMode ? 'rgba(255,255,255,0.9)' : '#1e293b', marginBottom: '0.25rem', fontSize: '0.8rem', fontWeight: 600 }}>Dirección</label>
              <div style={{ position: 'relative' }}>
                <MapPin size={18} style={{ position: 'absolute', left: '0.75rem', top: '12px', color: darkMode ? 'rgba(255,255,255,0.5)' : '#64748b' }} />
                <textarea
                  value={formData.direccion}
                  onChange={(e) => setFormData({ ...formData, direccion: e.target.value.toUpperCase() })}
                  rows={3}
                  style={{
                    width: '100%',
                    padding: '0.5rem 0.5rem 0.5rem 2.5rem',
                    borderRadius: '0.625rem',
                    background: darkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)',
                    border: darkMode ? '1px solid rgba(255,255,255,0.12)' : '1px solid rgba(0,0,0,0.15)',
                    color: darkMode ? 'rgba(255,255,255,0.9)' : '#1e293b',
                    fontSize: '0.85rem',
                    resize: 'vertical',
                    minHeight: '80px',
                    fontFamily: 'inherit'
                  }}
                />
              </div>
            </div>
          </div>

          <div style={{ position: 'relative' }}>
            <InputField themeColors={themeColors} darkMode={darkMode} label="Contraseña *" type={showPwd ? 'text' : 'password'} value={formData.password} onChange={(e: any) => setFormData({ ...formData, password: e.target.value })} />
            <button onClick={() => setShowPwd(!showPwd)} style={{ position: 'absolute', right: '10px', top: '29px', background: 'none', border: 'none', color: themeColors.textSecondary, cursor: 'pointer' }}>
              {showPwd ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
          <div style={{ position: 'relative' }}>
            <InputField themeColors={themeColors} darkMode={darkMode} label="Confirmar *" type={showPwdConfirm ? 'text' : 'password'} value={formData.confirmPassword} onChange={(e: any) => setFormData({ ...formData, confirmPassword: e.target.value })} />
            <button onClick={() => setShowPwdConfirm(!showPwdConfirm)} style={{ position: 'absolute', right: '10px', top: '29px', background: 'none', border: 'none', color: themeColors.textSecondary, cursor: 'pointer' }}>
              {showPwdConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>

          <div style={{
            gridColumn: '1 / -1',
            background: darkMode ? 'rgba(59, 130, 246, 0.1)' : '#eff6ff',
            border: `1px solid ${darkMode ? 'rgba(59, 130, 246, 0.2)' : '#bfdbfe'}`,
            borderRadius: '0.5rem',
            padding: '0.75rem',
            display: 'flex',
            gap: '0.75rem',
            alignItems: 'start',
            marginTop: '0.5rem'
          }}>
            <Shield size={18} color={darkMode ? '#60a5fa' : '#3b82f6'} style={{ flexShrink: 0, marginTop: '2px' }} />
            <div style={{ fontSize: '0.8125rem', color: darkMode ? '#bfdbfe' : '#1e40af', lineHeight: '1.4' }}>
              <strong>Nota de Seguridad:</strong> La contraseña ingresada será enviada por correo al nuevo administrativo. El sistema le solicitará cambiarla obligatoriamente en su primer inicio de sesión.
            </div>
          </div>

          {/* Permisos Grid */}
          {/* Permisos section eliminado */}
        </div>,
        <>
          <button onClick={() => {
            setShowCreateModal(false);
            setFormData({
              cedula: '', nombre: '', apellido: '', email: '', telefono: '',
              fecha_nacimiento: '', direccion: '', genero: '', password: '', confirmPassword: '',
              rolId: '', permisos: []
            });
          }} style={{
            padding: '0.75rem 1.5rem',
            borderRadius: '0.5rem',
            border: 'none',
            background: darkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
            color: themeColors.textSecondary,
            cursor: 'pointer',
            width: isMobile ? '100%' : 'auto'
          }}>Cancelar</button>
          <button onClick={handleCreate} style={{
            padding: '0.75rem 1.5rem',
            borderRadius: '0.5rem',
            border: 'none',
            background: primaryActionButtonStyles.base,
            color: '#fff',
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem',
            width: isMobile ? '100%' : 'auto'
          }}><Save size={18} /> Crear Administrativo</button>
        </>
      )}

      {/* Modal Editar - CON TODOS LOS CAMPOS */}
      {showEditModal && renderModal(
        "Editar Administrativo",
        Edit,
        () => {
          setShowEditModal(false);
          setFormData({
            cedula: '', nombre: '', apellido: '', email: '', telefono: '',
            fecha_nacimiento: '', direccion: '', genero: '', password: '', confirmPassword: '',
            rolId: '', permisos: []
          });
        }, <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '0.5rem' }}>
        <div style={{ marginBottom: '0.5rem' }}>
          <label style={{ display: 'block', color: darkMode ? 'rgba(255,255,255,0.9)' : '#1e293b', marginBottom: '0.25rem', fontSize: '0.8rem', fontWeight: 600 }}>Cédula</label>
          <input value={formData.cedula} readOnly style={{
            width: '100%', padding: '0.5rem', borderRadius: '0.625rem',
            background: darkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)',
            border: darkMode ? '1px solid rgba(255,255,255,0.12)' : '1px solid rgba(0,0,0,0.15)',
            color: darkMode ? 'rgba(255,255,255,0.7)' : 'rgba(30,41,59,0.7)', fontSize: '0.85rem'
          }} />
        </div>

        {/* Rol input eliminado */}

        <InputField themeColors={themeColors} darkMode={darkMode} label="Nombres" value={formData.nombre} onChange={(e: any) => setFormData({ ...formData, nombre: e.target.value.toUpperCase() })} />
        <InputField themeColors={themeColors} darkMode={darkMode} label="Apellidos" value={formData.apellido} onChange={(e: any) => setFormData({ ...formData, apellido: e.target.value.toUpperCase() })} />
        <InputField themeColors={themeColors} darkMode={darkMode} label="Email" type="email" value={formData.email} onChange={(e: any) => setFormData({ ...formData, email: e.target.value })} />
        <InputField themeColors={themeColors} darkMode={darkMode} label="Teléfono" type="tel" value={formData.telefono} onChange={(e: any) => setFormData({ ...formData, telefono: e.target.value.replace(/\D/g, '') })} icon={Phone} />

        <InputField themeColors={themeColors} darkMode={darkMode} label="Fecha de Nacimiento" type="date" value={formData.fecha_nacimiento} onChange={(e: any) => setFormData({ ...formData, fecha_nacimiento: e.target.value })} icon={Calendar} />

        <div style={{ marginBottom: '0.5rem' }}>
          <label style={{ display: 'block', color: darkMode ? 'rgba(255,255,255,0.9)' : '#1e293b', marginBottom: '0.25rem', fontSize: '0.8rem', fontWeight: 600 }}>Género</label>
          <select
            value={formData.genero}
            onChange={e => setFormData({ ...formData, genero: e.target.value })}
            style={{
              width: '100%', padding: '0.5rem', borderRadius: '0.625rem',
              background: darkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)',
              border: darkMode ? '1px solid rgba(255,255,255,0.12)' : '1px solid rgba(0,0,0,0.15)',
              color: darkMode ? 'rgba(255,255,255,0.9)' : '#1e293b', fontSize: '0.85rem'
            }}
          >
            <option value="">Seleccionar</option>
            <option value="masculino">Masculino</option>
            <option value="femenino">Femenino</option>
            <option value="otro">Otro</option>
          </select>
        </div>

        <div style={{ gridColumn: '1 / -1' }}>
          <div style={{ marginBottom: '0.5rem' }}>
            <label style={{ display: 'block', color: darkMode ? 'rgba(255,255,255,0.9)' : '#1e293b', marginBottom: '0.25rem', fontSize: '0.8rem', fontWeight: 600 }}>Dirección</label>
            <div style={{ position: 'relative' }}>
              <MapPin size={18} style={{ position: 'absolute', left: '0.75rem', top: '12px', color: darkMode ? 'rgba(255,255,255,0.5)' : '#64748b' }} />
              <textarea
                value={formData.direccion}
                onChange={(e) => setFormData({ ...formData, direccion: e.target.value.toUpperCase() })}
                rows={3}
                style={{
                  width: '100%',
                  padding: '0.5rem 0.5rem 0.5rem 2.5rem',
                  borderRadius: '0.625rem',
                  background: darkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)',
                  border: darkMode ? '1px solid rgba(255,255,255,0.12)' : '1px solid rgba(0,0,0,0.15)',
                  color: darkMode ? 'rgba(255,255,255,0.9)' : '#1e293b',
                  fontSize: '0.85rem',
                  resize: 'vertical',
                  minHeight: '80px',
                  fontFamily: 'inherit'
                }}
              />
            </div>
          </div>
        </div>

        {/* Permisos Grid */}
        {/* Permisos section eliminado */}
      </div>,
        <>
          <button onClick={() => setShowEditModal(false)} style={{
            padding: '0.75rem 1.5rem',
            borderRadius: '0.5rem',
            border: 'none',
            background: darkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
            color: themeColors.textSecondary,
            cursor: 'pointer',
            width: isMobile ? '100%' : 'auto'
          }}>Cancelar</button>
          <button onClick={handleUpdate} style={{
            padding: '0.75rem 1.5rem',
            borderRadius: '0.5rem',
            border: 'none',
            background: primaryActionButtonStyles.base,
            color: '#fff',
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem',
            width: isMobile ? '100%' : 'auto'
          }}><Save size={18} /> Guardar Cambios</button>
        </>
      )}

      {/* Modal Password */}
      {showPasswordModal && renderModal(
        "Cambiar Contraseña",
        Lock,
        () => setShowPasswordModal(false),
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ position: 'relative' }}>
            <InputField themeColors={themeColors} darkMode={darkMode} label="Nueva Contraseña" type={showPwd ? 'text' : 'password'} value={passwordData.newPassword} onChange={(e: any) => setPasswordData({ ...passwordData, newPassword: e.target.value })} />
            <button onClick={() => setShowPwd(!showPwd)} style={{ position: 'absolute', right: '10px', top: '29px', background: 'none', border: 'none', color: themeColors.textSecondary, cursor: 'pointer' }}>
              {showPwd ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
          <div style={{ position: 'relative' }}>
            <InputField themeColors={themeColors} darkMode={darkMode} label="Confirmar Contraseña" type={showPwdConfirm ? 'text' : 'password'} value={passwordData.confirmPassword} onChange={(e: any) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })} />
            <button onClick={() => setShowPwdConfirm(!showPwdConfirm)} style={{ position: 'absolute', right: '10px', top: '29px', background: 'none', border: 'none', color: themeColors.textSecondary, cursor: 'pointer' }}>
              {showPwdConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>,
        <>
          <button onClick={() => setShowPasswordModal(false)} style={{
            padding: '0.75rem 1.5rem',
            borderRadius: '0.5rem',
            border: 'none',
            background: darkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
            color: themeColors.textSecondary,
            cursor: 'pointer',
            width: isMobile ? '100%' : 'auto'
          }}>Cancelar</button>
          <button onClick={handleChangePassword} style={{
            padding: '0.75rem 1.5rem',
            borderRadius: '0.5rem',
            border: 'none',
            background: primaryActionButtonStyles.base,
            color: '#fff',
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem',
            width: isMobile ? '100%' : 'auto'
          }}><Save size={18} /> Actualizar Contraseña</button>
        </>
      )}
    </div>
  );
};

export default AdministradoresPanel;