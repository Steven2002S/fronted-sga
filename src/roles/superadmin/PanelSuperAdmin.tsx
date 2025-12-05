import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  FileText,
  Settings,
  Users,
  Shield,
  Menu,
  X
} from 'lucide-react';
import AdminThemeWrapper from '../../components/AdminThemeWrapper';
import SchoolLogo from '../../components/SchoolLogo';
import ProfileMenu from '../../components/ProfileMenu';
import { useBreakpoints } from '../../hooks/useMediaQuery';

// Importar los nuevos componentes
import AdministradoresPanel from './AdministradoresPanel';
import ConfiguracionPanel from './ConfiguracionPanel';
import PanelDashboardSuperAdmin from './PanelDashboardSuperAdmin';
import HistorialAuditoria from './HistorialAuditoria';

const PanelSuperAdmin: React.FC = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('superadmin-dark-mode');
    return saved !== null ? JSON.parse(saved) : true;
  });
  const [userData, setUserData] = useState<any>(null);
  const { isMobile, isSmallScreen } = useBreakpoints();

  // Auto-colapsar sidebar en móvil
  useEffect(() => {
    if (isMobile) {
      setSidebarCollapsed(true);
      setMobileMenuOpen(false);
    }
  }, [isMobile]);

  useEffect(() => {
    localStorage.setItem('superadmin-dark-mode', JSON.stringify(darkMode));
  }, [darkMode]);

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    try {
      const token = sessionStorage.getItem('auth_token');
      if (!token) return;
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000/api'}/auth/me`, {
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

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
  };

  const toggleSidebar = () => {
    if (isMobile) {
      setMobileMenuOpen(!mobileMenuOpen);
    } else {
      setSidebarCollapsed(!sidebarCollapsed);
    }
  };

  // Funciones para obtener colores según el tema (igual que Admin)
  const getThemeColors = () => {
    if (darkMode) {
      return {
        background: 'linear-gradient(135deg, #0f0f23 0%, #1a1a2e 50%, #16213e 100%)',
        sidebarBg: 'linear-gradient(135deg, rgba(0,0,0,0.95) 0%, rgba(26,26,46,0.95) 100%)',
        navbarBg: 'linear-gradient(135deg, rgba(239, 68, 68, 0.15), rgba(220, 38, 38, 0.1))',
        contentBg: 'linear-gradient(135deg, rgba(0,0,0,0.9) 0%, rgba(26,26,46,0.9) 100%)',
        textPrimary: '#fff',
        textSecondary: 'rgba(255,255,255,0.8)',
        textMuted: 'rgba(255,255,255,0.7)',
        border: 'rgba(239, 68, 68, 0.2)',
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
    { id: 'administradores', name: 'Administradores', icon: Users },
    { id: 'auditoria', name: 'Historial de Auditoría', icon: Shield },
    { id: 'config', name: 'Configuración', icon: Settings },
  ];

  return (
    <>
      {/* Variables CSS globales para el tema */}
      <style>{`
        :root {
          --superadmin-bg-primary: ${theme.background};
          --superadmin-bg-secondary: ${theme.contentBg};
          --superadmin-text-primary: ${theme.textPrimary};
          --superadmin-text-secondary: ${theme.textSecondary};
          --superadmin-text-muted: ${theme.textMuted};
          --superadmin-border: ${theme.border};
          --superadmin-accent: ${theme.accent};
          --superadmin-input-bg: ${darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)'};
          --superadmin-input-border: ${darkMode ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.15)'};
          --superadmin-hover-bg: ${darkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'};
          --superadmin-modal-bg: ${darkMode ? 'rgba(0,0,0,0.6)' : 'rgba(0,0,0,0.4)'};
          --superadmin-card-bg: ${darkMode ? 'linear-gradient(135deg, rgba(0,0,0,0.9) 0%, rgba(26,26,26,0.9) 100%)' : 'linear-gradient(135deg, rgba(255,255,255,0.9) 0%, rgba(248,250,252,0.9) 100%)'};
        }
        
        /* Estilos globales para componentes hijos */
        .superadmin-panel * {
          --text-primary: ${theme.textPrimary};
          --text-secondary: ${theme.textSecondary};
          --text-muted: ${theme.textMuted};
          --bg-primary: ${theme.background};
          --bg-secondary: ${theme.contentBg};
          --border-color: ${theme.border};
        }
        
        /* Estilos automáticos para inputs y elementos comunes */
        .superadmin-panel input,
        .superadmin-panel textarea,
        .superadmin-panel select {
          background: var(--superadmin-input-bg) !important;
          border: 1px solid var(--superadmin-input-border) !important;
          color: var(--superadmin-text-primary) !important;
        }
        
        .superadmin-panel input::placeholder,
        .superadmin-panel textarea::placeholder {
          color: var(--superadmin-text-muted) !important;
        }
      `}</style>

      <div
        className="superadmin-panel"
        style={{
          minHeight: '100vh',
          background: theme.background,
          display: 'flex',
          fontSize: '0.8rem'
        }}
      >
        {/* Overlay para móvil */}
        {isMobile && mobileMenuOpen && (
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
          width: isMobile ? '16rem' : (sidebarCollapsed ? '4.5rem' : '16rem'),
          background: theme.sidebarBg,
          border: `0.0625rem solid ${theme.border}`,
          borderRadius: isMobile ? '0' : '0 1em 1em 0',
          padding: (isMobile || !sidebarCollapsed) ? '0.625em 1em 1.25em 1em' : '0.625em 0.375em 1.25em 0.375em',
          position: 'fixed',
          height: '100vh',
          left: isMobile ? (mobileMenuOpen ? '0' : '-16rem') : '0',
          top: 0,
          zIndex: 1000,
          boxShadow: darkMode ? '0.25rem 0 1.25rem rgba(0, 0, 0, 0.3)' : '0.25rem 0 1.25rem rgba(0, 0, 0, 0.1)',
          transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
          overflowY: isMobile ? 'auto' : 'hidden',
          overflowX: 'hidden',
          display: 'flex',
          flexDirection: 'column'
        }}>
          {/* Botón hamburguesa - Desktop */}
          {!isMobile && (
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
          {isMobile && (
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
            marginTop: (isMobile || !sidebarCollapsed) ? '0' : '3rem'
          }}>
            {(isMobile || !sidebarCollapsed) && <SchoolLogo size={140} darkMode={darkMode} />}
          </div>

          {/* Navegación del Sidebar */}
          <nav style={{
            marginBottom: '2em',
            flex: 1
          }}>
            {tabs.map((tab) => {
              const IconComponent = tab.icon;
              const showText = isMobile || !sidebarCollapsed;
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveTab(tab.id);
                    if (isMobile) setMobileMenuOpen(false);
                  }}
                  title={(!isMobile && sidebarCollapsed) ? tab.name : ''}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: showText ? 'flex-start' : 'center',
                    gap: '0.625em',
                    padding: showText ? '0.75em 1em' : '0.75em 0.5em',
                    marginBottom: '0.375em',
                    borderRadius: '0.75em',
                    border: 'none',
                    background: activeTab === tab.id ?
                      'linear-gradient(135deg, #ef4444, #dc2626)' :
                      'transparent',
                    color: activeTab === tab.id ? '#fff' : theme.textMuted,
                    fontSize: isMobile ? '0.875rem' : '0.75rem',
                    fontWeight: '500',
                    letterSpacing: '0.05em',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    textAlign: 'left',
                    boxShadow: activeTab === tab.id ? '0 0.5rem 1.25rem rgba(239, 68, 68, 0.3)' : 'none',
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
                  {showText && <span>{tab.name}</span>}
                </button>
              );
            })}
          </nav>

        </div>

        {/* Contenido Principal */}
        <div style={{
          marginLeft: isMobile ? '0' : (sidebarCollapsed ? '4.375rem' : '17.5rem'),
          flex: 1,
          padding: isMobile ? '0.75rem' : (isSmallScreen ? '1rem' : '1.25rem'),
          minHeight: '100vh',
          transition: 'margin-left 0.3s ease',
          width: 'auto',
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
            {/* Botón hamburguesa en móvil */}
            {isMobile && (
              <button
                onClick={toggleSidebar}
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
                  {isMobile ? 'Super Admin' : 'Panel Super Admin'}
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
              <ProfileMenu
                darkMode={darkMode}
                toggleDarkMode={toggleDarkMode}
                theme={theme}
                userData={userData}
                onChangePassword={() => { }}
                avatarColor="linear-gradient(135deg, #ef4444, #dc2626)"
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
            <AdminThemeWrapper darkMode={darkMode}>
              {activeTab === 'dashboard' && <PanelDashboardSuperAdmin />}
              {activeTab === 'administradores' && <AdministradoresPanel />}
              {activeTab === 'auditoria' && <HistorialAuditoria />}
              {activeTab === 'config' && <ConfiguracionPanel />}
            </AdminThemeWrapper>
          </div>
        </div>
      </div>
    </>
  );
};

export default PanelSuperAdmin;
