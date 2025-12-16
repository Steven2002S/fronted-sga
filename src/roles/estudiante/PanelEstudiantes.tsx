import { useState, useEffect } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import {
  BookOpen, UserCircle, Menu, Calendar, X, Award, FileText, TrendingUp
} from 'lucide-react';
import SchoolLogo from '../../components/SchoolLogo';
import ProfileMenu from '../../components/ProfileMenu';
import NotificationBell from '../../components/NotificationBell';
import { useNotifications } from '../../hooks/useNotifications';
import EstudianteThemeWrapper from '../../components/EstudianteThemeWrapper';
import CambiarPasswordModal from '../../components/CambiarPasswordModal';
import { useBreakpoints } from '../../hooks/useMediaQuery';
import '../../styles/responsive.css';

// Importar componentes modulares
import MiAula from './MiAula';
import Servicios from './Servicios';
import Perfil from './Perfil';
import Calificaciones from './Calificaciones';
import DetalleCursoEstudiante from './DetalleCursoEstudiante';
import MiHorario from './MiHorario';
import HistorialAcademico from './HistorialAcademico';

const API_BASE = (import.meta as any).env?.VITE_API_URL ? `${(import.meta as any).env.VITE_API_URL}/api` : 'http://localhost:3000/api';

const PanelEstudiantes = () => {
  const navigate = useNavigate();
  const { isMobile, isSmallScreen } = useBreakpoints();
  const [activeTab, setActiveTab] = useState('mi-aula');
  const [darkMode, setDarkMode] = useState(() => {
    // Cargar preferencia guardada o usar modo claro por defecto
    const saved = localStorage.getItem('estudiante-dark-mode');
    return saved !== null ? JSON.parse(saved) : false;
  });
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    const saved = localStorage.getItem('estudiante-sidebar-collapsed');
    return saved !== null ? JSON.parse(saved) : false;
  });
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Estados para modal de cambio de contraseña
  const [showPasswordResetModal, setShowPasswordResetModal] = useState(false);
  const [isRequiredPasswordChange, setIsRequiredPasswordChange] = useState(false);
  const [isFirstLogin, setIsFirstLogin] = useState(true);
  const [userData, setUserData] = useState<{
    nombres?: string;
    apellidos?: string;
    nombre?: string;
    apellido?: string;
    apellido_paterno?: string;
    nombre_completo?: string;
    id_usuario?: number;
  } | null>(null);

  // Hook de notificaciones con WebSocket
  const {
    notificaciones,
    marcarTodasLeidas
  } = useNotifications('estudiante');

  // Guardar preferencia de modo cuando cambie
  useEffect(() => {
    localStorage.setItem('estudiante-dark-mode', JSON.stringify(darkMode));
  }, [darkMode]);

  // Guardar preferencia de sidebar cuando cambie
  useEffect(() => {
    localStorage.setItem('estudiante-sidebar-collapsed', JSON.stringify(sidebarCollapsed));
  }, [sidebarCollapsed]);

  useEffect(() => {
    checkPasswordReset();
    fetchUserData();
  }, []);

  // Obtener datos del usuario
  const fetchUserData = async () => {
    try {
      const token = sessionStorage.getItem('auth_token');
      if (!token) return;

      const response = await fetch(`${API_BASE}/auth/me`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setUserData(data);
      }
    } catch (error) {
      console.error('Error obteniendo datos del usuario:', error);
    }
  };

  // Verificar si necesita cambiar contraseña en primer ingreso
  const checkPasswordReset = async () => {
    try {
      const token = sessionStorage.getItem('auth_token');
      if (!token) return;

      const response = await fetch(`${API_BASE}/auth/me`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.needs_password_reset) {
          setShowPasswordResetModal(true);
          setIsRequiredPasswordChange(true);
          setIsFirstLogin(data.is_first_login !== false); // true si es undefined o true
        }
      }
    } catch (error) {
      console.error('Error verificando estado de contraseña:', error);
    }
  };

  // Manejar cierre del modal de contraseña
  const handleClosePasswordModal = () => {
    // Solo permitir cerrar si NO es cambio obligatorio
    if (!isRequiredPasswordChange) {
      setShowPasswordResetModal(false);
    }
  };

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
        background: 'linear-gradient(135deg, #000 0%, #1a1a1a 50%, #000 100%)',
        sidebarBg: 'linear-gradient(135deg, rgba(0,0,0,0.95) 0%, rgba(26,26,26,0.95) 100%)',
        navbarBg: 'linear-gradient(135deg, rgba(251, 191, 36, 0.15), rgba(245, 158, 11, 0.1))',
        contentBg: 'linear-gradient(135deg, rgba(0,0,0,0.9) 0%, rgba(26,26,26,0.9) 100%)',
        textPrimary: '#fff',
        textSecondary: 'rgba(255,255,255,0.8)',
        textMuted: 'rgba(255,255,255,0.7)',
        border: 'rgba(251, 191, 36, 0.2)',
        accent: '#fbbf24'
      };
    } else {
      return {
        background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 50%, #cbd5e1 100%)',
        sidebarBg: 'linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(248,250,252,0.95) 100%)',
        navbarBg: 'linear-gradient(135deg, rgba(251, 191, 36, 0.08), rgba(245, 158, 11, 0.05))',
        contentBg: 'linear-gradient(135deg, rgba(255,255,255,0.9) 0%, rgba(248,250,252,0.9) 100%)',
        textPrimary: '#1e293b',
        textSecondary: 'rgba(30,41,59,0.8)',
        textMuted: 'rgba(30,41,59,0.7)',
        border: 'rgba(251, 191, 36, 0.2)',
        accent: '#fbbf24'
      };
    }
  };

  const theme = getThemeColors();

  const tabs = [
    { id: 'mi-aula', name: 'Mi Aula', icon: BookOpen },
    { id: 'mi-horario', name: 'Mi Horario', icon: Calendar },
    { id: 'calificaciones', name: 'Calificaciones', icon: Award },
    { id: 'servicios', name: 'Servicios', icon: FileText },
    { id: 'historial', name: 'Historial Académico', icon: TrendingUp },
    { id: 'perfil', name: 'Mi Perfil', icon: UserCircle }
  ];

  return (
    <>
      {/* Variables CSS globales para el tema */}
      <style>{`
        :root {
          --estudiante-bg-primary: ${theme.background};
          --estudiante-bg-secondary: ${theme.contentBg};
          --estudiante-text-primary: ${theme.textPrimary};
          --estudiante-text-secondary: ${theme.textSecondary};
          --estudiante-text-muted: ${theme.textMuted};
          --estudiante-border: ${theme.border};
          --estudiante-accent: ${theme.accent};
          --estudiante-input-bg: ${darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)'};
          --estudiante-input-border: ${darkMode ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.15)'};
          --estudiante-hover-bg: ${darkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'};
          --estudiante-modal-bg: ${darkMode ? 'rgba(0,0,0,0.6)' : 'rgba(0,0,0,0.4)'};
          }
          
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
          
          .estudiante-panel input,
          .estudiante-panel textarea,
          .estudiante-panel select {
            background: var(--estudiante-input-bg) !important;
            border: 0.0625rem solid var(--estudiante-input-border) !important;
            color: var(--estudiante-text-primary) !important;
          }
      `}</style>

      <div
        className="estudiante-panel"
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
          transition: 'all 0.3s ease',
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
                background: darkMode ? 'rgba(251, 191, 36, 0.1)' : 'rgba(251, 191, 36, 0.08)',
                color: theme.accent,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.3s ease',
                zIndex: 10
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(251, 191, 36, 0.2)';
                e.currentTarget.style.transform = sidebarCollapsed ? 'translateX(50%) scale(1.05)' : 'scale(1.05)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = darkMode ? 'rgba(251, 191, 36, 0.1)' : 'rgba(251, 191, 36, 0.08)';
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
                background: darkMode ? 'rgba(251, 191, 36, 0.1)' : 'rgba(251, 191, 36, 0.08)',
                color: theme.accent,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.3s ease',
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
                    // Siempre volver a la ruta base del panel al cambiar de sección
                    navigate('/panel/estudiante');
                    setActiveTab(tab.id);
                    if (isSmallScreen) setMobileMenuOpen(false);
                    // Forzar scroll al inicio al cambiar de sección
                    window.scrollTo({ top: 0, behavior: 'smooth' });
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
                      'linear-gradient(135deg, #f59e0b, #d97706)' :
                      'transparent',
                    color: activeTab === tab.id ? '#fff' : theme.textMuted,
                    fontSize: '0.75rem',
                    fontWeight: '500',
                    letterSpacing: '0.05em',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    textAlign: 'left',
                    boxShadow: activeTab === tab.id ? '0 0.5rem 1.25rem rgba(245, 158, 11, 0.3)' : 'none',
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
          marginLeft: isSmallScreen ? '0' : (sidebarCollapsed ? '4.75rem' : '16.25rem'),
          flex: 1,
          padding: isMobile ? '0.75em' : '0.875rem',
          minHeight: '100vh',
          transition: 'margin-left 0.3s ease',
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
                  background: darkMode ? 'rgba(251, 191, 36, 0.1)' : 'rgba(251, 191, 36, 0.08)',
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
                background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 0.5rem 1.25rem rgba(245, 158, 11, 0.3)',
                flexShrink: 0
              }}>
                {(() => {
                  const activeTabData = tabs.find(t => t.id === activeTab);
                  const IconComponent = activeTabData?.icon || BookOpen;
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
                  Panel Estudiante
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
                bellColor="linear-gradient(135deg, #f59e0b, #d97706)"
              />

              <ProfileMenu
                darkMode={darkMode}
                toggleDarkMode={toggleDarkMode}
                theme={theme}
                userData={userData}
                avatarColor="linear-gradient(135deg, #f59e0b, #d97706)"
              />
            </div>

          </div>

          {/* Contenido de la sección activa */}
          <div style={{
            background: theme.contentBg,
            backdropFilter: 'blur(1.25rem)',
            border: `0.0625rem solid ${theme.border}`,
            borderRadius: '1.25rem',
            padding: isMobile ? '1em' : '2em',
            minHeight: '37.5rem',
            boxShadow: darkMode ? '0 0.5rem 2rem rgba(0, 0, 0, 0.3)' : '0 0.5rem 2rem rgba(0, 0, 0, 0.1)'
          }}>
            <Routes>
              <Route
                index
                element={
                  <>
                    {activeTab === 'mi-aula' && <EstudianteThemeWrapper darkMode={darkMode}><MiAula darkMode={darkMode} onNavigate={setActiveTab} /></EstudianteThemeWrapper>}
                    {activeTab === 'mi-horario' && <EstudianteThemeWrapper darkMode={darkMode}><MiHorario darkMode={darkMode} /></EstudianteThemeWrapper>}
                    {activeTab === 'historial' && <EstudianteThemeWrapper darkMode={darkMode}><HistorialAcademico darkMode={darkMode} /></EstudianteThemeWrapper>}
                    {activeTab === 'calificaciones' && <EstudianteThemeWrapper darkMode={darkMode}><Calificaciones darkMode={darkMode} /></EstudianteThemeWrapper>}
                    {activeTab === 'servicios' && <EstudianteThemeWrapper darkMode={darkMode}><Servicios darkMode={darkMode} /></EstudianteThemeWrapper>}
                    {activeTab === 'perfil' && <EstudianteThemeWrapper darkMode={darkMode}><Perfil darkMode={darkMode} /></EstudianteThemeWrapper>}
                  </>
                }
              />
              <Route path="curso/:id" element={<EstudianteThemeWrapper darkMode={darkMode}><DetalleCursoEstudiante darkMode={darkMode} /></EstudianteThemeWrapper>} />
            </Routes>
          </div>
        </div>

        {/* Modal de Cambiar Contraseña con EstudianteThemeWrapper */}
        <EstudianteThemeWrapper darkMode={darkMode}>
          <CambiarPasswordModal
            isOpen={showPasswordResetModal}
            onClose={handleClosePasswordModal}
            isRequired={isRequiredPasswordChange}
            isFirstLogin={isFirstLogin}
            rol="estudiante"
          />
        </EstudianteThemeWrapper>
      </div>
    </>
  );
};

export default PanelEstudiantes;