import { useState, useEffect } from 'react';
import {
  BarChart3,
  Layers,
  NotebookPen,
  Gift,
  ClipboardCheck,
  GraduationCap,
  CreditCard,
  UserCog,
  ShieldCheck,
  Building2,
  MapPin,
  FilePieChart,
  Menu,
  UserCircle,
  X
} from 'lucide-react';
import AdminThemeWrapper from '../../components/AdminThemeWrapper';
import SchoolLogo from '../../components/SchoolLogo';
import ProfileMenu from '../../components/ProfileMenu';
import NotificationBell from '../../components/NotificationBell';
import { useNotifications } from '../../hooks/useNotifications';
import { useBreakpoints } from '../../hooks/useMediaQuery';
import '../../styles/responsive.css';

// Importar componentes modulares
import Dashboard from './Dashboard';
import GestionCursos from './GestionCursos';
import GestionPromociones from './GestionPromociones';
import GestionMatricula from './GestionMatricula';
import GestionEstudiantes from './GestionEstudiantes';
import GestionDocentes from './GestionDocentes';
import AsignacionAula from './AsignacionAula';
import GestionAulas from './GestionAulas';
import GestionPagosEstudiante from './GestionPagosEstudiante';
import Reportes from './Reportes';
import GestionTiposCurso from './GestionTiposCurso';
import ControlUsuarios from './ControlUsuarios';
import Perfil from './Perfil';

const PanelAdministrativos = () => {
  const { isMobile, isSmallScreen } = useBreakpoints();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [darkMode, setDarkMode] = useState(() => {
    // Cargar preferencia guardada o usar modo oscuro por defecto
    const saved = localStorage.getItem('admin-dark-mode');
    return saved !== null ? JSON.parse(saved) : true;
  });
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    // Cargar preferencia guardada
    const saved = localStorage.getItem('admin-sidebar-collapsed');
    return saved !== null ? JSON.parse(saved) : false;
  });
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userData, setUserData] = useState<{ nombre?: string; apellido?: string; nombres?: string; apellidos?: string; id_usuario?: number; foto_perfil?: string } | null>(null);

  // Hook de notificaciones con WebSocket
  const {
    notificaciones,
    marcarTodasLeidas
  } = useNotifications('admin');

  // Función para obtener datos del usuario (reutilizable)
  const fetchUserData = async () => {
    try {
      const token = sessionStorage.getItem('auth_token');
      console.log('Token para obtener datos:', token ? 'Existe' : 'No existe');
      if (!token) return;

      const response = await fetch(`${(import.meta.env.VITE_API_URL || 'http://localhost:3000')}/api/auth/me`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      console.log('Status de /api/auth/me:', response.status);

      if (response.ok) {
        const data = await response.json();
        console.log('Datos del usuario recibidos:', data);
        // Handle both nombre/nombres and apellido/apellidos for compatibility
        const nombres = data.nombres || data.nombre || '';
        const apellidos = data.apellidos || data.apellido || '';
        console.log('Nombres:', nombres);
        console.log('Apellidos:', apellidos);
        console.log('Foto perfil:', data.foto_perfil);
        console.log('Todas las propiedades:', Object.keys(data));
        setUserData(data);
      } else {
        console.error('Error en respuesta:', response.status);
      }
    } catch (error) {
      console.error('Error obteniendo datos del usuario:', error);
    }
  };

  // Obtener datos del usuario al cargar
  useEffect(() => {
    fetchUserData();
  }, []);

  // Guardar preferencia de modo cuando cambie
  useEffect(() => {
    localStorage.setItem('admin-dark-mode', JSON.stringify(darkMode));
  }, [darkMode]);

  // Guardar preferencia de sidebar cuando cambie
  useEffect(() => {
    localStorage.setItem('admin-sidebar-collapsed', JSON.stringify(sidebarCollapsed));
  }, [sidebarCollapsed]);

  // Función para alternar sidebar
  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  // Función para alternar modo
  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
  };

  // Funciones para obtener colores según el tema
  const getThemeColors = () => {
    if (darkMode) {
      return {
        background: '#0a0a0a',
        sidebarBg: '#171717',
        navbarBg: '#262626',
        contentBg: '#171717',
        textPrimary: '#ffffff',
        textSecondary: '#e5e5e5',
        textMuted: '#a3a3a3',
        border: 'rgba(255, 255, 255, 0.1)',
        accent: '#ef4444'
      };
    } else {
      return {
        background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 50%, #cbd5e1 100%)',
        sidebarBg: 'linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(248,250,252,0.95) 100%)',
        navbarBg: 'linear-gradient(135deg, rgba(239, 68, 68, 0.08), rgba(220, 38, 38, 0.05))',
        contentBg: 'linear-gradient(135deg, rgba(255,255,255,0.9) 0%, rgba(248,250,252,0.9) 100%)',
        textPrimary: '#1e293b',
        textSecondary: 'rgba(30,41,59,0.8)',
        textMuted: 'rgba(30,41,59,0.7)',
        border: 'rgba(239, 68, 68, 0.2)',
        accent: '#ef4444'
      };
    }
  };

  const theme = getThemeColors();

  const tabs = [
    { id: 'dashboard', name: 'Dashboard', icon: BarChart3 },
    { id: 'tipos', name: 'Tipos de Curso', icon: Layers },
    { id: 'cursos', name: 'Gestión Cursos', icon: NotebookPen },
    { id: 'promociones', name: 'Promociones', icon: Gift },
    { id: 'matricula', name: 'Gestión Matrícula', icon: ClipboardCheck },
    { id: 'estudiantes', name: 'Gestión Estudiantes', icon: GraduationCap },
    { id: 'pagos', name: 'Gestión de Pagos', icon: CreditCard },
    { id: 'docentes', name: 'Gestión Docentes', icon: UserCog },
    { id: 'control-usuarios', name: 'Control de Usuarios', icon: ShieldCheck },
    { id: 'gestion-aulas', name: 'Gestión Aulas', icon: Building2 },
    { id: 'asignacion-aulas', name: 'Asignación Aula', icon: MapPin },
    { id: 'reportes', name: 'Reportes', icon: FilePieChart },
    { id: 'perfil', name: 'Mi Perfil', icon: UserCircle }
  ];

  return (
    <>
      {/* Variables CSS globales para el tema */}
      <style>{`
        :root {
          --admin-bg-primary: ${theme.background};
          --admin-bg-secondary: ${theme.contentBg};
          --admin-text-primary: ${theme.textPrimary};
          --admin-text-secondary: ${theme.textSecondary};
          --admin-text-muted: ${theme.textMuted};
          --admin-border: ${theme.border};
          --admin-accent: ${theme.accent};
          --admin-input-bg: ${darkMode ? '#262626' : 'rgba(0,0,0,0.05)'};
          --admin-input-border: ${darkMode ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0,0,0,0.15)'};
          --admin-hover-bg: ${darkMode ? 'rgba(239, 68, 68, 0.08)' : 'rgba(0,0,0,0.05)'};
          --admin-modal-bg: ${darkMode ? 'rgba(10, 10, 10, 0.95)' : 'rgba(0,0,0,0.4)'};
          --admin-card-bg: ${darkMode ? '#171717' : 'linear-gradient(135deg, rgba(255,255,255,0.9) 0%, rgba(248,250,252,0.9) 100%)'};
        }
        
        /* Estilos globales para componentes hijos */
        .admin-panel * {
          --text-primary: ${theme.textPrimary};
          --text-secondary: ${theme.textSecondary};
          --text-muted: ${theme.textMuted};
          --bg-primary: ${theme.background};
          --bg-secondary: ${theme.contentBg};
          --border-color: ${theme.border};
        }
        
        /* Estilos automáticos para inputs y elementos comunes */
        .admin-panel input,
        .admin-panel textarea,
        .admin-panel select {
          background: var(--admin-input-bg) !important;
          border: 0.0625rem solid var(--admin-input-border) !important;
          color: var(--admin-text-primary) !important;
        }
        
        .admin-panel input::placeholder,
        .admin-panel textarea::placeholder {
          color: var(--admin-text-muted) !important;
        }
      `}</style>

      <div
        className="admin-panel"
        style={{
          minHeight: '100vh',
          background: theme.background,
          display: 'flex',
          fontSize: '0.8rem'
        }}
      >
        {/* Overlay para móvil */}
        {isSmallScreen && mobileMenuOpen && (
          <div
            data-modal-overlay="true"
            onClick={() => setMobileMenuOpen(false)}
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 999,
              transition: 'opacity 0.3s ease'
            }}
          />
        )}

        {/* Sidebar */}
        <div style={{
          width: isSmallScreen ? '16rem' : (sidebarCollapsed ? '4.5rem' : '16rem'),
          background: theme.sidebarBg,
          border: `0.0625rem solid ${theme.border}`,
          borderRadius: isSmallScreen ? '0' : '0 1em 1em 0',
          padding: (isSmallScreen || !sidebarCollapsed) ? '0.625em 1em 1.25em 1em' : '0.625em 0.375em 1.25em 0.375em',
          position: 'fixed',
          height: '100vh',
          left: isSmallScreen ? (mobileMenuOpen ? '0' : '-16rem') : '0',
          top: 0,
          zIndex: 1000,
          boxShadow: darkMode ? '0.25rem 0 1.25rem rgba(0, 0, 0, 0.3)' : '0.25rem 0 1.25rem rgba(0, 0, 0, 0.1)',
          transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
          overflowY: isSmallScreen ? 'auto' : 'hidden',
          display: 'flex',
          flexDirection: 'column'
        }}>
          {/* Botón hamburguesa - Desktop */}
          {!isSmallScreen && (
            <button
              onClick={toggleSidebar}
              style={{
                position: 'absolute',
                top: '1rem',
                right: sidebarCollapsed ? '50%' : '1rem',
                transform: sidebarCollapsed ? 'translateX(50%)' : 'none',
                width: '2.25rem',
                height: '2.25rem',
                borderRadius: '0.5rem',
                border: `0.0625rem solid ${theme.border}`,
                background: darkMode ? 'rgba(239, 68, 68, 0.1)' : 'rgba(239, 68, 68, 0.08)',
                color: theme.accent,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.15s cubic-bezier(0.4, 0, 0.2, 1)',
                zIndex: 10
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)';
                e.currentTarget.style.transform = sidebarCollapsed ? 'translateX(50%) scale(1.05)' : 'scale(1.05)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = darkMode ? 'rgba(239, 68, 68, 0.1)' : 'rgba(239, 68, 68, 0.08)';
                e.currentTarget.style.transform = sidebarCollapsed ? 'translateX(50%)' : 'none';
              }}
            >
              <Menu size={20} />
            </button>
          )}

          {/* Botón cerrar - Móvil */}
          {isSmallScreen && (
            <button
              onClick={() => setMobileMenuOpen(false)}
              style={{
                position: 'absolute',
                top: '1rem',
                right: '1rem',
                width: '2.25rem',
                height: '2.25rem',
                borderRadius: '0.5rem',
                border: `0.0625rem solid ${theme.border}`,
                background: darkMode ? 'rgba(239, 68, 68, 0.1)' : 'rgba(239, 68, 68, 0.08)',
                color: theme.accent,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.15s cubic-bezier(0.4, 0, 0.2, 1)',
                zIndex: 10
              }}
            >
              <X size={20} />
            </button>
          )}

          {/* Header del Sidebar - Solo Logo */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            marginBottom: '0.5rem',
            paddingBottom: '0.25rem',
            borderBottom: `0.0625rem solid ${theme.border}`,
            paddingTop: '0',
            marginTop: (isSmallScreen || !sidebarCollapsed) ? '0' : '3rem'
          }}>
            {(isSmallScreen || !sidebarCollapsed) && <SchoolLogo size={140} darkMode={darkMode} />}
          </div>

          {/* Navegación del Sidebar */}
          <nav style={{
            marginBottom: '2em',
            flex: 1
          }}>
            {tabs.map((tab) => {
              const IconComponent = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveTab(tab.id);
                    if (isSmallScreen) setMobileMenuOpen(false);
                  }}
                  title={(sidebarCollapsed && !isSmallScreen) ? tab.name : ''}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: (sidebarCollapsed && !isSmallScreen) ? 'center' : 'flex-start',
                    gap: '0.625em',
                    padding: (sidebarCollapsed && !isSmallScreen) ? '0.75em 0.5em' : '0.75em 1em',
                    marginBottom: '0.375em',
                    borderRadius: '0.75em',
                    border: 'none',
                    background: activeTab === tab.id ?
                      'linear-gradient(135deg, #ef4444, #dc2626)' :
                      'transparent',
                    color: activeTab === tab.id ? '#fff' : theme.textMuted,
                    fontSize: '0.75rem',
                    fontWeight: '500',
                    letterSpacing: '0.05em',
                    cursor: 'pointer',
                    transition: 'background 0.12s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.12s cubic-bezier(0.4, 0, 0.2, 1)',
                    textAlign: 'left',
                    boxShadow: activeTab === tab.id ? '0 0.25rem 0.75rem rgba(239, 68, 68, 0.15)' : 'none',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden'
                  }}
                  onMouseEnter={(e) => {
                    if (activeTab !== tab.id) {
                      e.currentTarget.style.background = darkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)';
                      e.currentTarget.style.color = theme.textSecondary;
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (activeTab !== tab.id) {
                      e.currentTarget.style.background = 'transparent';
                      e.currentTarget.style.color = theme.textMuted;
                    }
                  }}
                >
                  <IconComponent size={18} style={{ flexShrink: 0 }} />
                  {(isSmallScreen || !sidebarCollapsed) && <span>{tab.name}</span>}
                </button>
              );
            })}
          </nav>

        </div>

        {/* Contenido Principal */}
        <div style={{
          marginLeft: isSmallScreen ? '0' : (sidebarCollapsed ? '4.375rem' : '17.5rem'),
          flex: 1,
          padding: isMobile ? '0.75em' : '1.25rem',
          minHeight: '100vh',
          transition: 'margin-left 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
          width: isSmallScreen ? '100%' : 'auto',
          maxWidth: '100%',
          overflowX: 'hidden',
          overflowY: 'auto'
        }}>
          {/* Navbar */}
          <div style={{
            background: theme.navbarBg,
            border: `0.0625rem solid ${theme.border}`,
            borderRadius: isMobile ? '0.875rem' : '1.25rem',
            padding: isMobile ? '0.75em 1em' : (isSmallScreen ? '0.875em 1.25em' : '1em 1.5em'),
            marginBottom: isMobile ? '0.75rem' : '1rem',
            backdropFilter: 'blur(1.25rem)',
            boxShadow: darkMode ? '0 0.5rem 1.5rem rgba(0, 0, 0, 0.2)' : '0 0.5rem 1.5rem rgba(0, 0, 0, 0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            position: 'relative',
            zIndex: 2,
            flexWrap: isMobile ? 'wrap' : 'nowrap',
            gap: isMobile ? '0.75rem' : '0'
          }}>
            {/* Botón hamburguesa móvil */}
            {isSmallScreen && (
              <button
                onClick={() => setMobileMenuOpen(true)}
                style={{
                  width: '2.5rem',
                  height: '2.5rem',
                  borderRadius: '0.5rem',
                  border: `0.0625rem solid ${theme.border}`,
                  background: darkMode ? 'rgba(239, 68, 68, 0.1)' : 'rgba(239, 68, 68, 0.08)',
                  color: theme.accent,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.2s ease',
                  flexShrink: 0
                }}
              >
                <Menu size={20} />
              </button>
            )}

            {/* Información del módulo activo */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: isMobile ? '0.625em' : '1em',
              flex: 1,
              minWidth: 0
            }}>
              <div style={{
                width: isMobile ? '2.5rem' : (isSmallScreen ? '2.5rem' : '3rem'),
                height: isMobile ? '2.5rem' : (isSmallScreen ? '2.5rem' : '3rem'),
                background: 'linear-gradient(135deg, #ef4444, #dc2626)',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 0.5rem 1.25rem rgba(239, 68, 68, 0.3)',
                flexShrink: 0
              }}>
                {(() => {
                  const activeTabData = tabs.find(t => t.id === activeTab);
                  const IconComponent = activeTabData?.icon || BarChart3;
                  return <IconComponent size={isMobile ? 18 : (isSmallScreen ? 18 : 22)} color="#fff" />;
                })()}
              </div>
              <div style={{ minWidth: 0, overflow: 'hidden' }}>
                <h1 style={{
                  fontSize: isMobile ? '0.95rem' : (isSmallScreen ? '1rem' : '1.2rem'),
                  fontWeight: '700',
                  color: theme.textPrimary,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  margin: 0,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis'
                }}>
                  Panel Administrativo
                </h1>
                {!isMobile && (
                  <p style={{
                    color: theme.textSecondary,
                    margin: 0,
                    fontSize: isSmallScreen ? '0.7rem' : '0.8rem',
                    marginTop: '0.125em',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                  }}>
                    Sistema de gestión académica
                  </p>
                )}
              </div>
            </div>

            {/* Iconos del lado derecho */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: isMobile ? '0.5em' : '0.75em',
              position: 'relative',
              flexShrink: 0
            }}>
              {/* Campana de notificaciones */}
              <NotificationBell
                notificaciones={notificaciones}
                onMarcarTodasLeidas={marcarTodasLeidas}
                darkMode={darkMode}
                bellColor="linear-gradient(135deg, #ef4444, #dc2626)"
              />

              <ProfileMenu
                darkMode={darkMode}
                toggleDarkMode={toggleDarkMode}
                theme={theme}
                userData={userData}
                onPhotoUpdated={fetchUserData}
              />
            </div>
          </div>

          {/* Contenido de la sección activa */}
          <div style={{
            background: theme.contentBg,
            backdropFilter: 'blur(1.25rem)',
            border: `0.0625rem solid ${theme.border}`,
            borderRadius: '1.25rem',
            padding: '2em',
            minHeight: '37.5rem',
            boxShadow: darkMode ? '0 0.5rem 2rem rgba(0, 0, 0, 0.3)' : '0 0.5rem 2rem rgba(0, 0, 0, 0.1)'
          }}>
            {activeTab === 'dashboard' && <AdminThemeWrapper darkMode={darkMode}><Dashboard /></AdminThemeWrapper>}
            {activeTab === 'tipos' && <AdminThemeWrapper darkMode={darkMode}><GestionTiposCurso /></AdminThemeWrapper>}
            {activeTab === 'estudiantes' && <AdminThemeWrapper darkMode={darkMode}><GestionEstudiantes /></AdminThemeWrapper>}
            {activeTab === 'cursos' && <AdminThemeWrapper darkMode={darkMode}><GestionCursos /></AdminThemeWrapper>}
            {activeTab === 'promociones' && <AdminThemeWrapper darkMode={darkMode}><GestionPromociones /></AdminThemeWrapper>}
            {activeTab === 'matricula' && <AdminThemeWrapper darkMode={darkMode}><GestionMatricula /></AdminThemeWrapper>}
            {activeTab === 'docentes' && <AdminThemeWrapper darkMode={darkMode}><GestionDocentes /></AdminThemeWrapper>}
            {activeTab === 'control-usuarios' && <AdminThemeWrapper darkMode={darkMode}><ControlUsuarios /></AdminThemeWrapper>}
            {activeTab === 'gestion-aulas' && <AdminThemeWrapper darkMode={darkMode}><GestionAulas /></AdminThemeWrapper>}
            {activeTab === 'asignacion-aulas' && <AdminThemeWrapper darkMode={darkMode}><AsignacionAula /></AdminThemeWrapper>}
            {activeTab === 'pagos' && <AdminThemeWrapper darkMode={darkMode}><GestionPagosEstudiante /></AdminThemeWrapper>}
            {activeTab === 'reportes' && <AdminThemeWrapper darkMode={darkMode}><Reportes darkMode={darkMode} /></AdminThemeWrapper>}
            {activeTab === 'perfil' && <AdminThemeWrapper darkMode={darkMode}><Perfil darkMode={darkMode} onPhotoUpdate={fetchUserData} /></AdminThemeWrapper>}
          </div>
        </div>
      </div>
    </>
  );
};

export default PanelAdministrativos;



