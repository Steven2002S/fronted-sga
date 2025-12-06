import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Camera, LogOut } from 'lucide-react';
import PerfilModal from './PerfilModal';
import { useBreakpoints } from '../hooks/useMediaQuery';
import { useSocket } from '../hooks/useSocket';

const API_BASE = (import.meta as any).env?.VITE_API_URL || 'http://localhost:3000';

interface ProfileMenuProps {
  darkMode: boolean;
  toggleDarkMode: () => void;
  theme: any;
  userData?: { 
    id_usuario?: number;
    nombre?: string; 
    apellido?: string; 
    nombres?: string; 
    apellidos?: string;
    email?: string;
    username?: string;
    foto_perfil?: string; // Add this line
  } | null;
  avatarColor?: string; // Opcional: color del avatar (default: rojo)
  onPhotoUpdated?: () => void; // Callback cuando se actualiza la foto
}

const ProfileMenu = ({ darkMode, toggleDarkMode, theme, userData, avatarColor = 'linear-gradient(135deg, #ef4444, #dc2626)', onPhotoUpdated }: ProfileMenuProps) => {
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showPerfilModal, setShowPerfilModal] = useState(false);
  const [currentFotoUrl, setCurrentFotoUrl] = useState<string | null>(null);
  const navigate = useNavigate();
  const { isMobile } = useBreakpoints();

  // Listener WebSocket para actualización de foto en tiempo real
  useSocket({
    'profile_picture_updated': (data: any) => {
      if (data.id_usuario === userData?.id_usuario) {
        if (data.deleted) {
          // Foto eliminada
          setCurrentFotoUrl(null);
        } else if (data.foto_perfil || data.foto_perfil_url) {
          // Foto actualizada - usar foto_perfil primero, luego foto_perfil_url como fallback
          const newPhotoUrl = data.foto_perfil || data.foto_perfil_url;
          setCurrentFotoUrl(newPhotoUrl);
        }
      }
    }
  }, userData?.id_usuario);

  // Cargar foto de perfil al montar y cuando userData cambie
  useEffect(() => {
    const loadFoto = async () => {
      if (userData?.id_usuario) {
        try {
          // First try to use foto_perfil from userData if available
          if (userData.foto_perfil) {
            setCurrentFotoUrl(userData.foto_perfil);
            return;
          }
          
          // Fetch user data to get Cloudinary URL
          const token = sessionStorage.getItem('auth_token');
          const response = await fetch(`${API_BASE}/api/auth/me`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          
          if (response.ok) {
            const data = await response.json();
            if (data.foto_perfil) {
              setCurrentFotoUrl(data.foto_perfil);
            } else {
              setCurrentFotoUrl(null);
            }
          } else {
            setCurrentFotoUrl(null);
          }
        } catch (error) {
          console.error('Error cargando foto:', error);
          if (userData.foto_perfil) {
            setCurrentFotoUrl(userData.foto_perfil);
          } else {
            setCurrentFotoUrl(null);
          }
        }
      } else if (userData?.foto_perfil) {
        // If we have userData but no id_usuario, still try to use foto_perfil
        setCurrentFotoUrl(userData.foto_perfil);
      } else {
        setCurrentFotoUrl(null);
      }
    };
    loadFoto();
  }, [userData?.id_usuario, userData?.foto_perfil]);

  // Función para recargar la foto cuando se actualiza
  const handlePhotoUpdate = async () => {
    // Notificar al componente padre PRIMERO para que actualice userData
    if (onPhotoUpdated) {
      await onPhotoUpdated();
    }
    
    // Luego recargar la foto local
    if (userData?.id_usuario) {
      try {
        const token = sessionStorage.getItem('auth_token');
        const response = await fetch(`${API_BASE}/api/auth/me`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (response.ok) {
          const data = await response.json();
          setCurrentFotoUrl(data.foto_perfil || null);
        }
      } catch (error) {
        console.error('Error recargando foto:', error);
      }
    }
  };

  // Función para obtener iniciales del usuario
  const getInitials = () => {
    // Priorizar nombres/apellidos (docentes) sobre nombre/apellido (admins)
    const firstName = userData?.nombres || userData?.nombre;
    const lastName = userData?.apellidos || userData?.apellido;
    
    if (!firstName || !lastName) return 'AD';
    
    const firstInitial = firstName.charAt(0).toUpperCase();
    const lastInitial = lastName.charAt(0).toUpperCase();
    return `${firstInitial}${lastInitial}`;
  };

  // Función para cerrar sesión
  const handleLogout = async () => {
    try {
      const token = sessionStorage.getItem('auth_token');
      
      // Llamar al endpoint de logout
      if (token) {
        await fetch(`${API_BASE}/api/auth/logout`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
      }
      
      // Limpiar sesión local
      sessionStorage.removeItem('auth_token');
      sessionStorage.removeItem('user_role');
      navigate('/aula-virtual');
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
      // Aunque falle el backend, cerrar sesión localmente
      sessionStorage.removeItem('auth_token');
      sessionStorage.removeItem('user_role');
      navigate('/aula-virtual');
    }
  };

  // Cerrar menú al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = () => {
      if (showProfileMenu) {
        setShowProfileMenu(false);
      }
    };

    if (showProfileMenu) {
      document.addEventListener('click', handleClickOutside);
    }

    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, [showProfileMenu]);

  return (
    <div style={{ position: 'relative' }}>
      {/* Avatar del usuario */}
      <div
        onClick={(e) => {
          e.stopPropagation();
          setShowProfileMenu(!showProfileMenu);
        }}
        style={{
          width: isMobile ? '2.25rem' : '2.75rem',
          height: isMobile ? '2.25rem' : '2.75rem',
          background: currentFotoUrl ? 'transparent' : avatarColor,
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          transition: 'all 0.3s ease',
          boxShadow: avatarColor.includes('#ef4444') 
            ? '0 4px 12px rgba(239, 68, 68, 0.3)' 
            : avatarColor.includes('#3b82f6')
            ? '0 4px 12px rgba(59, 130, 246, 0.3)'
            : '0 4px 12px rgba(0, 0, 0, 0.3)',
          fontWeight: '700',
          fontSize: '0.95rem',
          color: '#fff',
          letterSpacing: '0.5px',
          overflow: 'hidden'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'scale(1.05)';
          const shadowColor = avatarColor.includes('#ef4444') 
            ? 'rgba(239, 68, 68, 0.4)' 
            : avatarColor.includes('#3b82f6')
            ? 'rgba(59, 130, 246, 0.4)'
            : 'rgba(0, 0, 0, 0.4)';
          e.currentTarget.style.boxShadow = `0 6px 16px ${shadowColor}`;
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'scale(1)';
          const shadowColor = avatarColor.includes('#ef4444') 
            ? 'rgba(239, 68, 68, 0.3)' 
            : avatarColor.includes('#3b82f6')
            ? 'rgba(59, 130, 246, 0.3)'
            : 'rgba(0, 0, 0, 0.3)';
          e.currentTarget.style.boxShadow = `0 4px 12px ${shadowColor}`;
        }}>
        {currentFotoUrl ? (
          <img 
            src={currentFotoUrl} 
            alt="Foto de perfil" 
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover'
            }}
          />
        ) : (
          getInitials()
        )}
      </div>

      {/* Menú desplegable */}
      {showProfileMenu && (
        <div
          onClick={(e) => e.stopPropagation()}
          style={{
            position: 'absolute',
            top: '50px',
            right: '0px',
            background: darkMode ? theme.contentBg : '#ffffff',
            borderRadius: '12px',
            boxShadow: darkMode ? '0 8px 24px rgba(0, 0, 0, 0.2)' : '0 8px 24px rgba(0, 0, 0, 0.15)',
            border: `1px solid ${theme.border}`,
            minWidth: '250px',
            zIndex: 1001,
            animation: 'slideInDown 0.3s ease-out',
            backdropFilter: darkMode ? 'blur(20px)' : 'none'
          }}>
          {/* Header del menú */}
          <div style={{
            padding: '12px 16px',
            borderBottom: `1px solid ${theme.border}`,
            background: theme.navbarBg,
            borderRadius: '12px 12px 0 0'
          }}>
            <div style={{
              fontSize: '12px',
              fontWeight: '600',
              color: theme.textSecondary,
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              textAlign: 'center'
            }}>
              Mi Perfil
            </div>
          </div>

          {/* Opción 1: Cambiar foto */}
          <div
            onClick={(e) => {
              e.stopPropagation();
              setShowProfileMenu(false);
              setShowPerfilModal(true);
            }}
            style={{
              padding: '12px 16px',
              cursor: 'pointer',
              color: theme.textPrimary,
              fontSize: '14px',
              fontWeight: '500',
              transition: 'all 0.2s ease',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              borderBottom: `1px solid ${theme.border}`,
              background: 'transparent'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = darkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
            }}>
            <Camera size={18} color={theme.textSecondary} />
            <span>Cambiar foto de perfil</span>
          </div>

          {/* Opción 2: Modo Claro/Oscuro */}
          <div
            onClick={(e) => {
              e.stopPropagation();
              toggleDarkMode();
            }}
            style={{
              padding: '12px 16px',
              cursor: 'pointer',
              color: theme.textPrimary,
              fontSize: '14px',
              fontWeight: '500',
              transition: 'all 0.2s ease',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              borderBottom: `1px solid ${theme.border}`,
              background: 'transparent'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = darkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
            }}>
            {/* Icono mitad claro/oscuro */}
            <div style={{
              width: '18px',
              height: '18px',
              borderRadius: '50%',
              background: `linear-gradient(90deg, ${theme.textSecondary} 50%, transparent 50%)`,
              border: `2px solid ${theme.textSecondary}`,
              position: 'relative',
              overflow: 'hidden'
            }}>
              <div style={{
                position: 'absolute',
                right: 0,
                top: 0,
                width: '50%',
                height: '100%',
                background: darkMode ? '#1f2937' : '#f3f4f6'
              }} />
            </div>
            <span>{darkMode ? 'Modo Claro' : 'Modo Oscuro'}</span>
          </div>

          {/* Opción 3: Cerrar Sesión */}
          <div
            onClick={(e) => {
              e.stopPropagation();
              setShowProfileMenu(false);
              handleLogout();
            }}
            style={{
              padding: '12px 16px',
              cursor: 'pointer',
              color: '#ef4444',
              fontSize: '14px',
              fontWeight: '500',
              transition: 'all 0.2s ease',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              background: 'transparent'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = darkMode ? 'rgba(239, 68, 68, 0.1)' : 'rgba(239, 68, 68, 0.05)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
            }}>
            <LogOut size={18} color="#ef4444" />
            <span>Cerrar Sesión</span>
          </div>
        </div>
      )}

      {/* Estilos CSS para animaciones */}
      <style>{`
        @keyframes slideInDown {
          from {
            opacity: 0;
            transform: translateY(-10px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
      `}</style>

      {/* Modal de Perfil */}
      {userData?.id_usuario && (
        <PerfilModal
          isOpen={showPerfilModal}
          onClose={() => setShowPerfilModal(false)}
          darkMode={darkMode}
          theme={theme}
          userData={{
            id_usuario: userData.id_usuario,
            nombre: userData.nombre,
            apellido: userData.apellido,
            nombres: userData.nombres,
            apellidos: userData.apellidos,
            email: userData.email,
            username: userData.username
          }}
          onPhotoUpdated={handlePhotoUpdate}
        />
      )}
    </div>
  );
};

export default ProfileMenu;
