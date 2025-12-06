import { useState, useEffect } from 'react';
import { useNavigate, Routes, Route } from 'react-router-dom';
import { BookOpen, Users, Calendar, BarChart3, UserCircle, Menu, ClipboardList, Award, X } from 'lucide-react';
import SchoolLogo from '../../components/SchoolLogo';
import ProfileMenu from '../../components/ProfileMenu';
import NotificationBell from '../../components/NotificationBell';
import AdminThemeWrapper from '../../components/AdminThemeWrapper';
import CambiarPasswordModal from '../../components/CambiarPasswordModal';
import { useBreakpoints } from '../../hooks/useMediaQuery';
import { useNotifications } from '../../hooks/useNotifications';
import '../../styles/responsive.css';

// Importar componentes modulares
import DocenteDashboard from './DocenteDashboard';
import MisCursos from './MisCursos';
import MisEstudiantes from './MisEstudiantes';
import MiHorario from './MiHorario';
import MiPerfil from './MiPerfil';
import DetalleCursoDocente from './DetalleCursoDocente';
import TomarAsistencia from './TomarAsistencia';
import AnalisisEntregas from './AnalisisEntregas';
import CalificacionesCurso from './CalificacionesCurso';
import Calificaciones from './Calificaciones';

const API_BASE = (import.meta as any).env?.VITE_API_URL || 'http://localhost:3000';

const PanelDocentes = () => {
  const navigate = useNavigate();
  const { isMobile, isSmallScreen } = useBreakpoints();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('docente-dark-mode');
    return saved !== null ? JSON.parse(saved) : true;
  });
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    const saved = localStorage.getItem('docente-sidebar-collapsed');
    return saved !== null ? JSON.parse(saved) : false;
  });
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Hook de notificaciones con WebSocket
  const { 
    notificaciones,
    marcarTodasLeidas
  } = useNotifications('docente');

  // Estados para modal de cambio de contraseña
  const [showPasswordResetModal, setShowPasswordResetModal] = useState(false);
  const [isRequiredPasswordChange, setIsRequiredPasswordChange] = useState(false);
  const [isFirstLogin, setIsFirstLogin] = useState(true);
  const [userData, setUserData] = useState<{ nombres?: string; apellidos?: string } | null>(null);

  // Obtener datos del usuario
  const fetchUserData = async () => {
    try {
      const token = sessionStorage.getItem('auth_token');
      if (!token) return;

      const response = await fetch(`${API_BASE}/api/auth/me`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        // Handle both nombre/nombres and apellido/apellidos for compatibility
        const userDataWithNames = {
          ...data,
          nombres: data.nombres || data.nombre || '',
          apellidos: data.apellidos || data.apellido || ''
        };
        setUserData(userDataWithNames);
      }
    } catch (error) {
      console.error('Error obteniendo datos del usuario:', error);
    }
  };

  // Obtener datos del usuario al montar
  useEffect(() => {
    fetchUserData();
  }, []);

  // Guardar preferencia de modo cuando cambie
  useEffect(() => {
    localStorage.setItem('docente-dark-mode', JSON.stringify(darkMode));
  }, [darkMode]);

  // Guardar preferencia de sidebar cuando cambie
  useEffect(() => {
    localStorage.setItem('docente-sidebar-collapsed', JSON.stringify(sidebarCollapsed));
  }, [sidebarCollapsed]);

  useEffect(() => {
    checkPasswordReset();
  }, []);


  // Verificar si necesita cambiar contraseña en primer ingreso
  const checkPasswordReset = async () => {
    try {
      const token = sessionStorage.getItem('auth_token');
      if (!token) return;

      const response = await fetch(`${API_BASE}/api/auth/me`, {
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

  const getThemeColors = () => {
    if (darkMode) {
      return {
        background: 'linear-gradient(135deg, #0f0f23 0%, #1a1a2e 50%, #16213e 100%)',
        sidebarBg: 'linear-gradient(135deg, rgba(0,0,0,0.95) 0%, rgba(26,26,46,0.95) 100%)',
        navbarBg: 'linear-gradient(135deg, rgba(59, 130, 246, 0.15), rgba(37, 99, 235, 0.1))',
        contentBg: 'linear-gradient(135deg, rgba(0,0,0,0.9) 0%, rgba(26,26,46,0.9) 100%)',
        textPrimary: '#fff',
        textSecondary: 'rgba(255,255,255,0.8)',
        textMuted: 'rgba(255,255,255,0.7)',
        border: 'rgba(59, 130, 246, 0.2)',
        accent: '#3b82f6'
      };
    } else {
      return {
        background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 50%, #cbd5e1 100%)',
        sidebarBg: 'linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(248,250,252,0.95) 100%)',
        navbarBg: 'linear-gradient(135deg, rgba(59, 130, 246, 0.08), rgba(37, 99, 235, 0.05))',
        contentBg: 'linear-gradient(135deg, rgba(255,255,255,0.9) 0%, rgba(248,250,252,0.9) 100%)',
        textPrimary: '#1e293b',
        textSecondary: 'rgba(30,41,59,0.8)',
        textMuted: 'rgba(30,41,59,0.7)',
        border: 'rgba(59, 130, 246, 0.2)',
        accent: '#3b82f6'
      };
    }
  };

  const theme = getThemeColors();

  const tabs = [
    { id: 'dashboard', name: 'Mi Aula', icon: BarChart3 },
    { id: 'cursos', name: 'Mis Cursos', icon: BookOpen },
    { id: 'estudiantes', name: 'Mis Estudiantes', icon: Users },
    { id: 'asistencia', name: 'Asistencia', icon: ClipboardList },
    { id: 'calificaciones', name: 'Calificaciones', icon: Award },
    { id: 'horario', name: 'Mi Horario', icon: Calendar },
    { id: 'perfil', name: 'Mi Perfil', icon: UserCircle }
  ];

  return (
    <>
      {/* Variables CSS globales */}
      <style>{`
        :root {
          --docente-bg-primary: ${theme.background};
          --docente-bg-secondary: ${theme.contentBg};
          --docente-text-primary: ${theme.textPrimary};
          --docente-text-secondary: ${theme.textSecondary};
          --docente-text-muted: ${theme.textMuted};
          --docente-border: ${theme.border};
          --docente-accent: ${theme.accent};
          --docente-input-bg: ${darkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'};
          --docente-input-border: ${darkMode ? 'rgba(255,255,255,0.1)' : '#e5e7eb'};
          --docente-card-bg: ${darkMode ? 'linear-gradient(135deg, rgba(0,0,0,0.9) 0%, rgba(26,26,46,0.9) 100%)' : 'linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(248,250,252,0.95) 100%)'};
          --docente-hover-bg: ${darkMode ? 'rgba(59, 130, 246, 0.08)' : 'rgba(0,0,0,0.05)'};
        }
        
        .docente-panel input,
        .docente-panel textarea,
        .docente-panel select {
          background: var(--docente-input-bg) !important;
          border: 0.0625rem solid var(--docente-input-border) !important;
          color: var(--docente-text-primary) !important;
          color-scheme: ${darkMode ? 'dark' : 'light'};
        }
        
        .docente-panel input[type="date"],
        .docente-panel input[type="datetime-local"] {
          color-scheme: ${darkMode ? 'dark' : 'light'};
        }
        
        .docente-panel select {
          color-scheme: ${darkMode ? 'dark' : 'light'};
        }
        
        .docente-panel select option {
          background: ${darkMode ? '#1a1a2e' : '#fff'} !important;
          color: ${darkMode ? '#fff' : '#1e293b'} !important;
        }
      `}</style>

      <div
        className="docente-panel"
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
                background: darkMode ? 'rgba(59, 130, 246, 0.1)' : 'rgba(59, 130, 246, 0.08)',
                color: theme.accent,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.15s cubic-bezier(0.4, 0, 0.2, 1)',
                zIndex: 10
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(59, 130, 246, 0.2)';
                e.currentTarget.style.transform = sidebarCollapsed ? 'translateX(50%) scale(1.05)' : 'scale(1.05)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = darkMode ? 'rgba(59, 130, 246, 0.1)' : 'rgba(59, 130, 246, 0.08)';
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
                background: darkMode ? 'rgba(59, 130, 246, 0.1)' : 'rgba(59, 130, 246, 0.08)',
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
                    if (tab.id === 'calificaciones') {
                      navigate('/panel/docente/calificaciones');
                    } else {
                      navigate('/panel/docente');
                    }
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
                      'linear-gradient(135deg, #3b82f6, #2563eb)' :
                      'transparent',
                    color: activeTab === tab.id ? '#fff' : theme.textMuted,
                    fontSize: '0.75rem',
                    fontWeight: '500',
                    letterSpacing: '0.05em',
                    cursor: 'pointer',
                    transition: 'background 0.12s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.12s cubic-bezier(0.4, 0, 0.2, 1)',
                    textAlign: 'left',
                    boxShadow: activeTab === tab.id ? '0 0.25rem 0.75rem rgba(59, 130, 246, 0.15)' : 'none',
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
                  background: darkMode ? 'rgba(59, 130, 246, 0.1)' : 'rgba(59, 130, 246, 0.08)',
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
                background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 0.5rem 1.25rem rgba(59, 130, 246, 0.3)',
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
                  Panel Docente
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
              <NotificationBell
                notificaciones={notificaciones}
                onMarcarTodasLeidas={marcarTodasLeidas}
                darkMode={darkMode}
                bellColor="linear-gradient(135deg, #3b82f6, #2563eb)"
              />
              <ProfileMenu
                darkMode={darkMode}
                toggleDarkMode={toggleDarkMode}
                theme={theme}
                userData={userData}
                onPhotoUpdated={() => fetchUserData()}
                avatarColor="linear-gradient(135deg, #3b82f6, #2563eb)"
              />
            </div>
          </div>

          {/* Contenido del Tab Activo o Rutas */}
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
              <Route path="/" element={
                <>
                  {activeTab === 'dashboard' && <DocenteDashboard darkMode={darkMode} />}
                  {activeTab === 'cursos' && <MisCursos darkMode={darkMode} />}
                  {activeTab === 'estudiantes' && <MisEstudiantes darkMode={darkMode} />}
                  {activeTab === 'asistencia' && <TomarAsistencia darkMode={darkMode} />}
                  {activeTab === 'calificaciones' && <Calificaciones darkMode={darkMode} />}
                  {activeTab === 'horario' && <MiHorario darkMode={darkMode} />}
                  {activeTab === 'perfil' && <MiPerfil darkMode={darkMode} />}
                </>
              } />
              <Route path="/estudiantes" element={<MisEstudiantes darkMode={darkMode} />} />
              <Route path="/horario" element={<MiHorario darkMode={darkMode} />} />
              <Route path="/curso/:id" element={<DetalleCursoDocente darkMode={darkMode} />} />
              <Route path="/analisis-entregas/:id_tarea" element={<AnalisisEntregas />} />
              <Route path="/calificaciones" element={<Calificaciones darkMode={darkMode} />} />
              <Route path="/calificaciones/:id" element={<CalificacionesCurso darkMode={darkMode} />} />
            </Routes>
          </div>
        </div>
      </div>

      {/* Modal de Cambiar Contraseña con AdminThemeWrapper */}
      <AdminThemeWrapper darkMode={darkMode}>
        <CambiarPasswordModal
          isOpen={showPasswordResetModal}
          onClose={handleClosePasswordModal}
          isRequired={isRequiredPasswordChange}
          isFirstLogin={isFirstLogin}
          rol="docente"
        />
      </AdminThemeWrapper>
    </>
  );
};

export default PanelDocentes;
