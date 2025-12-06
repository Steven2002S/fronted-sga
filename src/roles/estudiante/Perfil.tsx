import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Eye, EyeOff, CheckCircle, ShieldCheck, GraduationCap, User, Mail, Phone, MapPin, Cake, Users, X, Lock } from 'lucide-react';
import { showToast } from '../../config/toastConfig';
import { useBreakpoints } from '../../hooks/useMediaQuery';
import '../../styles/responsive.css';

const API_BASE = (import.meta as any).env?.VITE_API_URL || 'http://localhost:3000';

interface PerfilProps {
  darkMode: boolean;
}

interface EstudianteData {
  id_usuario: number;
  nombres: string;
  apellidos: string;
  nombre?: string;  // Alias alternativo
  apellido?: string;  // Alias alternativo
  identificacion: string;
  cedula?: string;  // Alias alternativo
  email?: string;
  telefono?: string;
  direccion?: string;
  fecha_nacimiento?: string;
  genero?: string;
  username: string;
  rol?: string;
  estado?: string;
  foto_perfil?: string; // Add this line
  contacto_emergencia?: string; // Add this line
}

const Perfil: React.FC<PerfilProps> = ({ darkMode }) => {
  const { isMobile, isSmallScreen } = useBreakpoints();
  const [activeTab, setActiveTab] = useState<'info' | 'password'>('info');
  const [estudiante, setEstudiante] = useState<EstudianteData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<Partial<EstudianteData>>({});
  const [fotoUrl, setFotoUrl] = useState<string | null>(null);
  const [showPhotoPreview, setShowPhotoPreview] = useState(false);
  const [isPhotoHovered, setIsPhotoHovered] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [passwordData, setPasswordData] = useState({
    password_actual: '',
    password_nueva: '',
    confirmar_password: ''
  });

  useEffect(() => {
    fetchPerfil();
  }, []);

  const fetchPerfil = async () => {
    try {
      setLoading(true);
      const token = sessionStorage.getItem('auth_token');

      if (!token) {
        console.error('No token found');
        setLoading(false);
        showToast.error('Sesión expirada. Por favor, inicia sesión nuevamente.', darkMode);
        return;
      }

      const response = await fetch(`${API_BASE}/api/auth/me`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Todas las propiedades:', Object.keys(data));
        setEstudiante(data);

        // La foto viene en base64 directamente desde el backend
        if (data.foto_perfil) {
          setFotoUrl(data.foto_perfil);
        } else {
          // Clear fotoUrl if no foto_perfil data
          setFotoUrl(null);
        }

        setFormData({
          nombres: data.nombres || data.nombre || '',
          apellidos: data.apellidos || data.apellido || '',
          email: data.email || '',
          telefono: data.telefono || '',
          direccion: data.direccion || '',
          fecha_nacimiento: data.fecha_nacimiento ? data.fecha_nacimiento.split('T')[0] : '',
          genero: data.genero || '',
          identificacion: data.identificacion || data.cedula || '',
          contacto_emergencia: data.contacto_emergencia || data.contactoEmergencia || data.telefono_emergencia || ''
        });
      } else {
        console.error('Failed to fetch profile:', response.status);
        showToast.error('Error al cargar el perfil', darkMode);
      }
    } catch (error) {
      console.error('Error:', error);
      showToast.error('Error al cargar datos del perfil', darkMode);
    } finally {
      setLoading(false);
    }
  };

  // Función eliminada - la foto ahora se carga directamente en fetchPerfil()


  const handleSave = async () => {
    try {
      const token = sessionStorage.getItem('auth_token');
      if (!token || !estudiante) return;

      // Limpiar datos: convertir undefined a null o cadena vacía
      const cleanedData = {
        nombres: formData.nombres || '',
        apellidos: formData.apellidos || '',
        email: formData.email || '',
        telefono: formData.telefono || '',
        direccion: formData.direccion || '',
        fecha_nacimiento: formData.fecha_nacimiento || null,
        genero: formData.genero || '',
        identificacion: formData.identificacion || '',
        contacto_emergencia: formData.contacto_emergencia || ''
      };

      console.log('Datos a enviar:', cleanedData);

      const response = await fetch(`${API_BASE}/api/usuarios/mi-perfil`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(cleanedData)
      });

      if (response.ok) {
        await fetchPerfil();
        setIsEditing(false);
        showToast.success('Perfil actualizado exitosamente', darkMode);
      } else {
        const err = await response.json().catch(() => ({}));
        throw new Error(err?.message || 'Error al actualizar');
      }
    } catch (error) {
      console.error('Error:', error);
      showToast.error('Error al actualizar el perfil', darkMode);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (passwordData.password_nueva !== passwordData.confirmar_password) {
      showToast.error('Las contraseñas no coinciden', darkMode);
      return;
    }

    if (passwordData.password_nueva.length < 8) {
      showToast.error('La contraseña debe tener al menos 8 caracteres', darkMode);
      return;
    }

    setLoading(true);

    try {
      const token = sessionStorage.getItem('auth_token');
      const response = await fetch(`${API_BASE}/api/usuarios/cambiar-password`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          password_actual: passwordData.password_actual,
          password_nueva: passwordData.password_nueva
        })
      });

      const data = await response.json();

      if (response.ok) {
        showToast.success('Contraseña actualizada correctamente', darkMode);
        setPasswordData({
          password_actual: '',
          password_nueva: '',
          confirmar_password: ''
        });
      } else {
        showToast.error(data.message || 'Error al cambiar contraseña', darkMode);
      }
    } catch (error) {
      console.error('Error:', error);
      showToast.error('Error al cambiar contraseña', darkMode);
    } finally {
      setLoading(false);
    }
  };

  const getThemeColors = () => {
    if (darkMode) {
      return {
        cardBg: 'rgba(255, 255, 255, 0.05)',
        textPrimary: '#fff',
        textSecondary: 'rgba(255,255,255,0.8)',
        textMuted: 'rgba(255,255,255,0.7)',
        border: 'rgba(251, 191, 36, 0.1)',
        inputBg: 'rgba(255,255,255,0.1)',
        inputBorder: 'rgba(251, 191, 36, 0.2)',
        accent: '#fbbf24',
        success: '#fbbf24'  // Amarillo consistente
      };
    } else {
      return {
        cardBg: 'rgba(255, 255, 255, 0.8)',
        textPrimary: '#1e293b',
        textSecondary: 'rgba(30,41,59,0.8)',
        textMuted: 'rgba(30,41,59,0.7)',
        border: 'rgba(251, 191, 36, 0.2)',
        inputBg: 'rgba(0,0,0,0.05)',
        inputBorder: 'rgba(251, 191, 36, 0.3)',
        accent: '#f59e0b',
        success: '#f59e0b'  // Ámbar consistente
      };
    }
  };

  const theme = getThemeColors();

  const getInitials = () => {
    if (!estudiante) return 'ES';
    const nombres = estudiante.nombres || estudiante.nombre || '';
    const apellidos = estudiante.apellidos || estudiante.apellido || '';
    if (!nombres && !apellidos) return 'ES';
    const primerNombre = nombres.trim().charAt(0).toUpperCase() || 'E';
    const primerApellido = apellidos.trim().charAt(0).toUpperCase() || 'S';
    return `${primerNombre}${primerApellido}`;
  };

  if (loading) {
    return (
      <div style={{
        textAlign: 'center',
        padding: '3.75rem',
        color: darkMode ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.7)'
      }}>
        Cargando perfil...
      </div>
    );
  }

  if (!estudiante) {
    return (
      <div style={{
        textAlign: 'center',
        padding: '3.75rem',
        color: darkMode ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.7)'
      }}>
        No se pudo cargar el perfil. Por favor, inicia sesión nuevamente.
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div style={{ marginBottom: '1.25em' }}>
        <h2 style={{
          fontSize: '1.5rem',
          fontWeight: '700',
          color: theme.textPrimary,
          margin: '0 0 0.375rem 0'
        }}>
          Mi Perfil
        </h2>
        <p style={{ color: theme.textMuted, fontSize: '0.8125rem', margin: 0 }}>
          Gestiona tu información personal y seguridad
        </p>
      </div>

      {/* Tabs */}
      <div style={{
        display: 'flex',
        gap: '0.5rem',
        marginBottom: '1rem',
        borderBottom: `1px solid ${theme.border}`
      }}>
        <button
          onClick={() => setActiveTab('info')}
          style={{
            padding: '0.625rem 1.25rem',
            background: 'transparent',
            border: 'none',
            borderBottom: activeTab === 'info' ? '2px solid #f59e0b' : '2px solid transparent',
            color: activeTab === 'info' ? theme.textPrimary : theme.textMuted,
            fontSize: '0.8125rem',
            fontWeight: '600',
            cursor: 'pointer',
            transition: 'all 0.2s',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
          <User size={14} color={activeTab === 'info' ? theme.textPrimary : theme.textMuted} />
          Información Personal
        </button>
        <button
          onClick={() => setActiveTab('password')}
          style={{
            padding: '0.625rem 1.25rem',
            background: 'transparent',
            border: 'none',
            borderBottom: activeTab === 'password' ? '2px solid #f59e0b' : '2px solid transparent',
            color: activeTab === 'password' ? theme.textPrimary : theme.textMuted,
            fontSize: '0.8125rem',
            fontWeight: '600',
            cursor: 'pointer',
            transition: 'all 0.2s',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
          <Lock size={14} color={activeTab === 'password' ? theme.textPrimary : theme.textMuted} />
          Cambiar Contraseña
        </button>
      </div>

      {/* Contenido de los tabs */}
      {activeTab === 'info' && (
        <form onSubmit={(e) => { e.preventDefault(); handleSave(); }}>
          <div style={{ display: 'grid', gridTemplateColumns: isSmallScreen ? '1fr' : '1fr 2fr', gap: isMobile ? '0.75rem' : '1rem', flex: 1 }}>
            {/* Card de perfil (izquierda) */}
            <div style={{
              background: theme.cardBg,
              border: `1px solid ${theme.border}`,
              borderRadius: '20px',
              padding: '24px',
              textAlign: 'center',
              backdropFilter: 'blur(20px)',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)'
            }}>
              {/* Foto de perfil */}
              <div
                onClick={() => setShowPhotoPreview(true)}
                style={{
                  width: '5.25rem',
                  height: '5.25rem',
                  borderRadius: '50%',
                  background: fotoUrl ? 'transparent' : `linear-gradient(135deg, ${theme.accent}, ${darkMode ? '#d97706' : '#f59e0b'})`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '2rem',
                  fontWeight: '800',
                  color: '#fff',
                  overflow: 'hidden',
                  cursor: 'pointer',
                  margin: '0 auto 0.75rem',
                  boxShadow: `0 0.5rem 1.5rem ${theme.accent}40`,
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'scale(1.05)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'scale(1)';
                }}>
                {fotoUrl ? (
                  <img
                    src={fotoUrl}
                    alt="Foto de perfil"
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover'
                    }}
                  />
                ) : (
                  <span>
                    {getInitials()}
                  </span>
                )}
              </div>

              <h3 style={{
                color: theme.textPrimary,
                fontSize: '1rem',
                fontWeight: '700',
                margin: '0 0 0.125rem 0'
              }}>
                {(estudiante.nombres || estudiante.nombre || 'Estudiante')} {(estudiante.apellidos || estudiante.apellido || '')}
              </h3>
              <p style={{
                color: theme.textMuted,
                fontSize: '0.8125rem',
                margin: '0 0 0.375rem 0'
              }}>
                {estudiante.username ? `@${estudiante.username}` : ''}
              </p>

              <div style={{
                padding: '0.375rem 0.75rem',
                background: `${theme.accent}20`,
                borderRadius: '0.5rem',
                color: theme.accent,
                fontSize: '0.75rem',
                fontWeight: '600',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.375rem',
                marginTop: '0.5rem'
              }}>
                <GraduationCap size={14} color='#fbbf24' />
                Estudiante
              </div>

              <div style={{
                marginTop: '1rem',
                paddingTop: '1rem',
                borderTop: `1px solid ${theme.border}`
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', marginBottom: '0.5rem' }}>
                  <CheckCircle size={16} color='#fbbf24' />
                  <div style={{ textAlign: 'left', flex: 1 }}>
                    <div style={{ color: theme.textMuted, fontSize: '0.7rem' }}>Estado</div>
                    <div style={{ color: theme.textPrimary, fontSize: '0.8125rem', fontWeight: '600', textTransform: 'capitalize' }}>
                      {estudiante?.estado || 'Activo'}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                  <User size={16} color='#fbbf24' />
                  <div style={{ textAlign: 'left', flex: 1 }}>
                    <div style={{ color: theme.textMuted, fontSize: '0.7rem' }}>Identificación</div>
                    <div style={{ color: theme.textPrimary, fontSize: '0.8125rem', fontWeight: '600' }}>
                      {estudiante.identificacion || estudiante.cedula || 'No especificado'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Botones Editar/Guardar */}
              <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: `1px solid ${theme.border}` }}>
                {!isEditing ? (
                  <button
                    type="button"
                    onClick={() => setIsEditing(true)}
                    style={{
                      width: '100%',
                      padding: '0.5rem 1rem',
                      background: `linear-gradient(135deg, ${theme.accent}, ${darkMode ? '#d97706' : '#f59e0b'})`,
                      color: '#fff',
                      border: 'none',
                      borderRadius: '0.5rem',
                      fontSize: '0.85rem',
                      fontWeight: '700',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.5rem',
                      transition: 'all 0.2s'
                    }}>
                    <User size={14} color="#fff" />
                    Editar Perfil
                  </button>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <button
                      type="submit"
                      disabled={loading}
                      style={{
                        width: '100%',
                        padding: '0.5rem 1rem',
                        background: `linear-gradient(135deg, ${theme.accent}, ${darkMode ? '#d97706' : '#f59e0b'})`,
                        color: '#fff',
                        border: 'none',
                        borderRadius: '0.5rem',
                        fontSize: '0.85rem',
                        fontWeight: '700',
                        cursor: loading ? 'not-allowed' : 'pointer',
                        opacity: loading ? 0.7 : 1,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.5rem',
                        transition: 'all 0.2s'
                      }}>
                      <CheckCircle size={14} color="#fff" />
                      {loading ? 'Guardando...' : 'Guardar'}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setIsEditing(false);
                        fetchPerfil();
                      }}
                      style={{
                        width: '100%',
                        padding: '0.5rem 1rem',
                        background: 'transparent',
                        color: theme.textSecondary,
                        border: `1px solid ${theme.border}`,
                        borderRadius: '0.5rem',
                        fontSize: '0.85rem',
                        fontWeight: '700',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.5rem',
                        transition: 'all 0.2s'
                      }}>
                      <X size={16} />
                      Cancelar
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Información detallada (derecha) */}
            <div style={{
              background: theme.cardBg,
              border: `1px solid ${theme.border}`,
              borderRadius: '20px',
              padding: '24px',
              backdropFilter: 'blur(20px)',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)'
            }}>
              <h3 style={{
                color: theme.textPrimary,
                fontSize: isMobile ? '0.8rem' : '0.875rem',
                fontWeight: '700',
                margin: '0 0 1rem 0',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                opacity: 0.9
              }}>
                INFORMACIÓN PERSONAL
              </h3>

              <div className="responsive-grid-2" style={{ gap: '0.75rem' }}>
                {/* Nombres */}
                <div>
                  <label style={{ color: theme.textMuted, fontSize: '0.75rem', fontWeight: '600', display: 'block', marginBottom: '0.25rem' }}>
                    Nombres
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={formData.nombres || ''}
                      onChange={(e) => setFormData({ ...formData, nombres: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '0.5rem 0.75rem',
                        background: theme.inputBg,
                        border: `1px solid ${theme.border}`,
                        borderRadius: '0.5rem',
                        color: theme.textPrimary,
                        fontSize: '0.8125rem'
                      }}
                      required
                    />
                  ) : (
                    <div style={{
                      padding: '0.5rem 0.75rem',
                      background: theme.inputBg,
                      border: `1px solid ${theme.border}`,
                      borderRadius: '0.5rem',
                      color: theme.textPrimary,
                      fontSize: '0.8125rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem'
                    }}>
                      <User size={14} color='#6b7280' />
                      {formData.nombres || 'No especificado'}
                    </div>
                  )}
                </div>

                {/* Apellidos */}
                <div>
                  <label style={{ color: theme.textMuted, fontSize: '0.75rem', fontWeight: '600', display: 'block', marginBottom: '0.25rem' }}>
                    Apellidos
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={formData.apellidos || ''}
                      onChange={(e) => setFormData({ ...formData, apellidos: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '0.5rem 0.75rem',
                        background: theme.inputBg,
                        border: `1px solid ${theme.border}`,
                        borderRadius: '0.5rem',
                        color: theme.textPrimary,
                        fontSize: '0.8125rem'
                      }}
                      required
                    />
                  ) : (
                    <div style={{
                      padding: '0.5rem 0.75rem',
                      background: theme.inputBg,
                      border: `1px solid ${theme.border}`,
                      borderRadius: '0.5rem',
                      color: theme.textPrimary,
                      fontSize: '0.8125rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem'
                    }}>
                      <User size={14} color='#6b7280' />
                      {formData.apellidos || 'No especificado'}
                    </div>
                  )}
                </div>

                {/* Email */}
                <div>
                  <label style={{ color: theme.textMuted, fontSize: '0.75rem', fontWeight: '600', display: 'block', marginBottom: '0.25rem' }}>
                    Email
                  </label>
                  {isEditing ? (
                    <input
                      type="email"
                      value={formData.email || ''}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '0.5rem 0.75rem',
                        background: theme.inputBg,
                        border: `1px solid ${theme.border}`,
                        borderRadius: '0.5rem',
                        color: theme.textPrimary,
                        fontSize: '0.8125rem'
                      }}
                      required
                    />
                  ) : (
                    <div style={{
                      padding: '0.5rem 0.75rem',
                      background: theme.inputBg,
                      border: `1px solid ${theme.border}`,
                      borderRadius: '0.5rem',
                      color: theme.textPrimary,
                      fontSize: '0.8125rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem'
                    }}>
                      <Mail size={14} color='#6b7280' />
                      {formData.email || 'No especificado'}
                    </div>
                  )}
                </div>

                {/* Teléfono */}
                <div>
                  <label style={{ color: theme.textMuted, fontSize: '0.75rem', fontWeight: '600', display: 'block', marginBottom: '0.25rem' }}>
                    Teléfono
                  </label>
                  {isEditing ? (
                    <input
                      type="tel"
                      value={formData.telefono || ''}
                      onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '0.5rem 0.75rem',
                        background: theme.inputBg,
                        border: `1px solid ${theme.border}`,
                        borderRadius: '0.5rem',
                        color: theme.textPrimary,
                        fontSize: '0.8125rem'
                      }}
                    />
                  ) : (
                    <div style={{
                      padding: '0.5rem 0.75rem',
                      background: theme.inputBg,
                      border: `1px solid ${theme.border}`,
                      borderRadius: '0.5rem',
                      color: theme.textPrimary,
                      fontSize: '0.8125rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem'
                    }}>
                      <Phone size={14} color='#6b7280' />
                      {formData.telefono || 'No especificado'}
                    </div>
                  )}
                </div>

                {/* Dirección */}
                <div>
                  <label style={{ color: theme.textMuted, fontSize: '0.75rem', fontWeight: '600', display: 'block', marginBottom: '0.25rem' }}>
                    Dirección
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={formData.direccion || ''}
                      onChange={(e) => setFormData({ ...formData, direccion: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '0.5rem 0.75rem',
                        background: theme.inputBg,
                        border: `1px solid ${theme.border}`,
                        borderRadius: '0.5rem',
                        color: theme.textPrimary,
                        fontSize: '0.8125rem'
                      }}
                    />
                  ) : (
                    <div style={{
                      padding: '0.5rem 0.75rem',
                      background: theme.inputBg,
                      border: `1px solid ${theme.border}`,
                      borderRadius: '0.5rem',
                      color: theme.textPrimary,
                      fontSize: '0.8125rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem'
                    }}>
                      <MapPin size={14} color='#6b7280' />
                      {formData.direccion || 'No especificado'}
                    </div>
                  )}
                </div>

                {/* Fecha de nacimiento */}
                {formData.fecha_nacimiento && (
                  <div>
                    <label style={{ color: theme.textMuted, fontSize: '0.75rem', fontWeight: '600', display: 'block', marginBottom: '0.25rem' }}>
                      Fecha de Nacimiento
                    </label>
                    <div style={{
                      padding: '0.5rem 0.75rem',
                      background: theme.inputBg,
                      border: `1px solid ${theme.border}`,
                      borderRadius: '0.5rem',
                      color: theme.textPrimary,
                      fontSize: '0.8125rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem'
                    }}>
                      <Cake size={14} color='#6b7280' />
                      {new Date(formData.fecha_nacimiento).toLocaleDateString()}
                    </div>
                  </div>
                )}

                {/* Contacto de Emergencia */}
                <div>
                  <label style={{ color: theme.textMuted, fontSize: '0.75rem', fontWeight: '600', display: 'block', marginBottom: '0.25rem' }}>
                    Contacto de Emergencia
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={formData.contacto_emergencia || ''}
                      onChange={(e) => setFormData({ ...formData, contacto_emergencia: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '0.5rem 0.75rem',
                        background: theme.inputBg,
                        border: `1px solid ${theme.border}`,
                        borderRadius: '0.5rem',
                        color: theme.textPrimary,
                        fontSize: '0.8125rem'
                      }}
                      placeholder="Teléfono de emergencia"
                    />
                  ) : (
                    <div style={{
                      padding: '0.5rem 0.75rem',
                      background: theme.inputBg,
                      border: `1px solid ${theme.border}`,
                      borderRadius: '0.5rem',
                      color: theme.textPrimary,
                      fontSize: '0.8125rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem'
                    }}>
                      <Phone size={14} color='#6b7280' />
                      {formData.contacto_emergencia || 'No especificado'}
                    </div>
                  )}
                </div>

                {/* Género */}
                <div>
                  <label style={{ color: theme.textMuted, fontSize: '0.75rem', fontWeight: '600', display: 'block', marginBottom: '0.25rem' }}>
                    Género
                  </label>
                  {isEditing ? (
                    <select
                      value={formData.genero || ''}
                      onChange={(e) => setFormData({ ...formData, genero: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '0.5rem 0.75rem',
                        background: theme.inputBg,
                        border: `1px solid ${theme.border}`,
                        borderRadius: '0.5rem',
                        color: theme.textPrimary,
                        fontSize: '0.8125rem'
                      }}
                    >
                      <option value="">Seleccionar...</option>
                      <option value="Masculino">Masculino</option>
                      <option value="Femenino">Femenino</option>
                      <option value="Otro">Otro</option>
                    </select>
                  ) : (
                    <div style={{
                      padding: '0.5rem 0.75rem',
                      background: theme.inputBg,
                      border: `1px solid ${theme.border}`,
                      borderRadius: '0.5rem',
                      color: theme.textPrimary,
                      fontSize: '0.8125rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem'
                    }}>
                      <Users size={14} color='#6b7280' />
                      {formData.genero ? (formData.genero.charAt(0).toUpperCase() + formData.genero.slice(1)) : 'No especificado'}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </form>
      )}

      {activeTab === 'password' && (
        <form onSubmit={handleChangePassword}>
          <div style={{
            maxWidth: '500px',
            margin: '0 auto',
            background: theme.cardBg,
            border: `1px solid ${theme.border}`,
            borderRadius: '20px',
            padding: '32px',
            backdropFilter: 'blur(20px)',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)'
          }}>
            <h3 style={{
              color: theme.textPrimary,
              fontSize: '0.875rem',
              fontWeight: '700',
              margin: '0 0 1rem 0',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              opacity: 0.9
            }}>
              CAMBIAR CONTRASEÑA
            </h3>

            {/* Contraseña Actual */}
            <div style={{ marginBottom: '0.875rem' }}>
              <label style={{ color: theme.textMuted, fontSize: '0.75rem', fontWeight: '600', display: 'block', marginBottom: '0.25rem' }}>
                Contraseña Actual
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showCurrentPassword ? 'text' : 'password'}
                  value={passwordData.password_actual}
                  onChange={(e) => setPasswordData({ ...passwordData, password_actual: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '0.5rem',
                    paddingRight: '2.5rem',
                    borderRadius: '0.375rem',
                    fontSize: '0.8125rem',
                    background: 'var(--estudiante-input-bg)',
                    border: '1px solid var(--estudiante-input-border)',
                    color: theme.textPrimary,
                    transition: 'all 0.2s'
                  }}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  style={{
                    position: 'absolute',
                    right: '0.5rem',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    color: 'var(--docente-text-muted)',
                    padding: '0.25rem',
                    display: 'flex',
                    alignItems: 'center'
                  }}>
                  {showCurrentPassword ? <EyeOff size={14} color="#9ca3af" /> : <Eye size={14} color="#9ca3af" />}
                </button>
              </div>
            </div>

            {/* Nueva Contraseña */}
            <div style={{ marginBottom: '0.875rem' }}>
              <label style={{ color: theme.textMuted, fontSize: '0.75rem', fontWeight: '600', display: 'block', marginBottom: '0.25rem' }}>
                Nueva Contraseña
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showNewPassword ? 'text' : 'password'}
                  value={passwordData.password_nueva}
                  onChange={(e) => setPasswordData({ ...passwordData, password_nueva: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '0.5rem',
                    paddingRight: '2.5rem',
                    borderRadius: '0.375rem',
                    fontSize: '0.8125rem',
                    background: 'var(--estudiante-input-bg)',
                    border: '1px solid var(--estudiante-input-border)',
                    color: theme.textPrimary,
                    transition: 'all 0.2s'
                  }}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  style={{
                    position: 'absolute',
                    right: '0.5rem',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    color: 'var(--docente-text-muted)',
                    padding: '0.25rem',
                    display: 'flex',
                    alignItems: 'center'
                  }}>
                  {showNewPassword ? <EyeOff size={14} color="#9ca3af" /> : <Eye size={14} color="#9ca3af" />}
                </button>
              </div>
              <p style={{ fontSize: '0.7rem', color: theme.textMuted, margin: '0.375rem 0 0 0', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                <CheckCircle size={12} color={passwordData.password_nueva.length >= 8 ? '#fbbf24' : '#9ca3af'} />
                Mínimo 8 caracteres
              </p>
            </div>

            {/* Confirmar Nueva Contraseña */}
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ color: theme.textMuted, fontSize: '0.75rem', fontWeight: '600', display: 'block', marginBottom: '0.25rem' }}>
                Confirmar Nueva Contraseña
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={passwordData.confirmar_password}
                  onChange={(e) => setPasswordData({ ...passwordData, confirmar_password: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '0.5rem',
                    paddingRight: '2.5rem',
                    borderRadius: '0.375rem',
                    fontSize: '0.8125rem',
                    background: 'var(--estudiante-input-bg)',
                    border: '1px solid var(--estudiante-input-border)',
                    color: theme.textPrimary,
                    transition: 'all 0.2s'
                  }}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  style={{
                    position: 'absolute',
                    right: '0.5rem',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    color: 'var(--docente-text-muted)',
                    padding: '0.25rem',
                    display: 'flex',
                    alignItems: 'center'
                  }}>
                  {showConfirmPassword ? <EyeOff size={14} color="#9ca3af" /> : <Eye size={14} color="#9ca3af" />}
                </button>
              </div>
              {passwordData.confirmar_password && (
                <p style={{ fontSize: '0.7rem', color: passwordData.password_nueva === passwordData.confirmar_password ? theme.accent : theme.accent, margin: '0.375rem 0 0 0', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                  <CheckCircle size={12} color="#fbbf24" />
                  {passwordData.password_nueva === passwordData.confirmar_password ? 'Las contraseñas coinciden' : 'Las contraseñas no coinciden'}
                </p>
              )}
            </div>

            {/* Botón Cambiar Contraseña */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
              <button
                type="submit"
                disabled={loading}
                style={{
                  padding: '0.625rem 0.875rem',
                  background: `linear-gradient(135deg, ${theme.accent}, ${darkMode ? '#d97706' : '#f59e0b'})`,
                  color: darkMode ? '#000' : '#fff',
                  border: 'none',
                  borderRadius: '0.5rem',
                  fontSize: '0.85rem',
                  fontWeight: '700',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  opacity: loading ? 0.7 : 1,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  transition: 'all 0.2s'
                }}>
                <ShieldCheck size={16} color="#fff" />
                {loading ? 'Actualizando...' : 'Cambiar Contraseña'}
              </button>
            </div>
          </div>
        </form>
      )}

      {/* Vista previa de foto - Pantalla completa con X */}
      {showPhotoPreview && createPortal(
        <div
          onClick={() => setShowPhotoPreview(false)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            width: '100vw',
            height: '100vh',
            background: 'rgba(0, 0, 0, 0.65)',
            zIndex: 99999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            animation: 'photoPreviewFadeIn 0.3s ease-out',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
            cursor: 'pointer'
          }}>
          <style>{`
            @keyframes photoPreviewFadeIn {
              from {
                opacity: 0;
              }
              to {
                opacity: 1;
              }
            }
            @keyframes photoScale {
              from {
                transform: translate(-50%, -50%) scale(0.85);
                opacity: 0;
              }
              to {
                transform: translate(-50%, -50%) scale(1);
                opacity: 1;
              }
            }
            @keyframes closeButtonAppear {
              from {
                opacity: 0;
                transform: scale(0.7) rotate(-90deg);
              }
              to {
                opacity: 1;
                transform: scale(1) rotate(0deg);
              }
            }
            @keyframes rotatePhoto {
              from {
                transform: translate(-50%, -50%) rotate(0deg);
              }
              to {
                transform: translate(-50%, -50%) rotate(360deg);
              }
            }
          `}</style>

          {/* Botón cerrar (X) */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowPhotoPreview(false);
            }}
            style={{
              position: 'fixed',
              top: '2rem',
              right: '2rem',
              width: '44px',
              height: '44px',
              borderRadius: '50%',
              background: 'rgba(255, 255, 255, 0.15)',
              border: '1px solid rgba(255, 255, 255, 0.3)',
              color: '#fff',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 100001,
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
              transition: 'all 0.2s ease',
              animation: 'closeButtonAppear 0.3s ease-out both',
              backdropFilter: 'blur(8px)',
              WebkitBackdropFilter: 'blur(8px)'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(245, 158, 11, 0.8)';
              e.currentTarget.style.transform = 'scale(1.1) rotate(90deg)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.15)';
              e.currentTarget.style.transform = 'scale(1) rotate(0deg)';
            }}>
            <X size={22} />
          </button>

          {/* Foto ampliada en el centro */}
          <div
            onClick={(e) => e.stopPropagation()}
            onMouseEnter={() => setIsPhotoHovered(true)}
            onMouseLeave={() => setIsPhotoHovered(false)}
            style={{
              position: 'fixed',
              left: '50%',
              top: '50%',
              width: '320px',
              height: '320px',
              borderRadius: '50%',
              background: fotoUrl ? 'transparent' : 'var(--estudiante-accent, linear-gradient(135deg, #f59e0b, #d97706))',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '6rem',
              fontWeight: '700',
              color: 'var(--estudiante-text-primary, #fff)',
              boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3), 0 0 0 4px var(--estudiante-border, rgba(255, 255, 255, 0.1))',
              border: '4px solid var(--estudiante-border, rgba(255, 255, 255, 0.15))',
              overflow: 'hidden',
              animation: isPhotoHovered
                ? 'photoScale 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) forwards, rotatePhoto 3s linear infinite'
                : 'photoScale 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) forwards',
              backdropFilter: 'blur(10px)',
              WebkitBackdropFilter: 'blur(10px)',
              cursor: 'default',
              transition: 'transform 0.3s ease'
            }}>
            {fotoUrl ? (
              <img
                src={fotoUrl}
                alt="Foto de perfil"
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover'
                }}
              />
            ) : (
              <span style={{
                filter: 'drop-shadow(0 0 20px rgba(255, 255, 255, 0.3))'
              }}>
                {getInitials()}
              </span>
            )}
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default Perfil;
