import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  User, Phone, MapPin, Calendar, Users, ShieldCheck, X, Mail, CheckCircle
} from 'lucide-react';
import { useBreakpoints } from '../../hooks/useMediaQuery';
import { useSocket } from '../../hooks/useSocket';

const API_BASE = (import.meta as any).env?.VITE_API_URL || 'http://localhost:3000';

interface UserProfile {
  id_usuario: number;
  cedula?: string;
  nombre: string;
  apellido: string;
  email: string;
  telefono?: string;
  direccion?: string;
  fecha_nacimiento?: string;
  genero?: string;
  rol: string;
  estado: string;
}

interface Stats {
  totalAdmins: number;
  activeAdmins: number;
  sessionsToday: number;
}

interface Activity {
  action: string;
  time: string;
  color: string;
}

const ConfiguracionPanel: React.FC = () => {
  const { isMobile, isSmallScreen } = useBreakpoints();
  const [userData, setUserData] = useState<UserProfile | null>(null);
  const [fotoUrl, setFotoUrl] = useState<string | null>(null);
  const [showPhotoPreview, setShowPhotoPreview] = useState(false);
  const [isPhotoHovered, setIsPhotoHovered] = useState(false);
  const [stats, setStats] = useState<Stats>({
    totalAdmins: 0,
    activeAdmins: 0,
    sessionsToday: 0
  });
  const [recentActivity, setRecentActivity] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);

  // Cargar datos del usuario
  useEffect(() => {
    fetchUserData();
    loadFoto();
    loadStats();
    loadRecentActivity();
  }, []);

  // Listener WebSocket para actualización de foto en tiempo real
  useSocket({
    'profile_picture_updated': (data: any) => {
      if (data.id_usuario === userData?.id_usuario) {
        if (data.deleted) {
          setFotoUrl(null);
        } else if (data.foto_perfil_url) {
          setFotoUrl(data.foto_perfil_url);
        }
      }
    }
  }, userData?.id_usuario);

  const fetchUserData = async () => {
    try {
      const token = sessionStorage.getItem('auth_token');
      const response = await fetch(`${API_BASE}/api/auth/me`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setUserData(data);
      }
    } catch (error) {
      console.error('Error cargando datos:', error);
    }
  };

  const loadFoto = async () => {
    try {
      const token = sessionStorage.getItem('auth_token');
      const response = await fetch(`${API_BASE}/api/auth/me`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.foto_perfil) {
          setFotoUrl(data.foto_perfil);
          console.log('Foto cargada en ConfiguracionPanel:', data.foto_perfil);
        } else {
          setFotoUrl(null);
          console.log('No hay foto de perfil');
        }
      }
    } catch (error) {
      console.error('Error cargando foto:', error);
    }
  };

  const loadStats = async () => {
    try {
      const token = sessionStorage.getItem('auth_token');

      // Cargar total de admins
      const adminsRes = await fetch(`${API_BASE}/api/admins`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (adminsRes.ok) {
        const adminsData = await adminsRes.json();
        const total = adminsData.length;
        const active = adminsData.filter((a: any) => a.estado === 'activo').length;

        setStats(prev => ({
          ...prev,
          totalAdmins: total,
          activeAdmins: active
        }));
      }

      // Cargar sesiones de hoy (desde auditoría)
      const today = new Date().toISOString().split('T')[0];
      const auditRes = await fetch(`${API_BASE}/api/auditoria/historial-completo?fecha_inicio=${today}&fecha_fin=${today}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (auditRes.ok) {
        const auditData = await auditRes.json();
        const sessions = auditData.data?.auditorias?.filter((a: any) =>
          a.tabla_afectada === 'sesiones_usuario' && a.operacion === 'INSERT'
        ).length || 0;

        setStats(prev => ({
          ...prev,
          sessionsToday: sessions
        }));
      }


    } catch (error) {
      console.error('Error cargando estadísticas:', error);
    }
  };

  const loadRecentActivity = async () => {
    try {
      const token = sessionStorage.getItem('auth_token');
      const response = await fetch(`${API_BASE}/api/auditoria/historial-completo?limite=4`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        const activities = data.data?.auditorias?.map((audit: any) => {
          const timeAgo = getTimeAgo(audit.fecha_operacion);
          let action = audit.descripcion;
          let color = '#3b82f6';

          // Determinar color según la operación
          if (audit.operacion === 'INSERT') color = '#10b981';
          else if (audit.operacion === 'UPDATE') color = '#f59e0b';
          else if (audit.operacion === 'DELETE') color = '#ef4444';

          return {
            action,
            time: timeAgo,
            color
          };
        }) || [];

        setRecentActivity(activities);
      }
    } catch (error) {
      console.error('Error cargando actividad reciente:', error);
    } finally {
      setLoading(false);
    }
  };

  const getTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `Hace ${diffMins} minuto${diffMins !== 1 ? 's' : ''}`;
    if (diffHours < 24) return `Hace ${diffHours} hora${diffHours !== 1 ? 's' : ''}`;
    return `Hace ${diffDays} día${diffDays !== 1 ? 's' : ''}`;
  };

  const getInitials = () => {
    if (!userData) return 'SA';
    return `${userData.nombre.charAt(0)}${userData.apellido.charAt(0)}`.toUpperCase();
  };

  return (
    <div style={{
      minHeight: '100%',
      color: 'var(--superadmin-text-primary)',
    }}>
      {/* Header */}
      <div style={{ marginBottom: isMobile ? '0.75rem' : '1em' }}>
        <h2 style={{
          color: 'var(--superadmin-text-primary)',
          margin: '0 0 0.375rem 0',
          display: 'flex',
          alignItems: 'center',
          gap: '0.625rem',
          fontSize: isMobile ? '1.25rem' : '1.625rem',
          fontWeight: '700'
        }}>
          <User size={26} color="#ef4444" />
          Mi Perfil
        </h2>
        <p style={{
          color: 'var(--superadmin-text-muted)',
          margin: 0,
          fontSize: isMobile ? '0.75rem' : '0.85rem'
        }}>
          Información personal del Super Administrador
        </p>
      </div>

      {/* Estadísticas rápidas */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: isMobile ? '1fr' : (isSmallScreen ? 'repeat(2, 1fr)' : 'repeat(3, 1fr)'),
        gap: isMobile ? '0.75rem' : '1rem',
        marginBottom: isMobile ? '1rem' : '1.5rem'
      }}>
        <div style={{
          background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.1) 0%, rgba(220, 38, 38, 0.05) 100%)',
          border: '1px solid rgba(239, 68, 68, 0.2)',
          borderRadius: '1rem',
          padding: isMobile ? '1rem' : '1.25rem',
          display: 'flex',
          alignItems: 'center',
          gap: '1rem'
        }}>
          <div style={{
            width: '3rem',
            height: '3rem',
            borderRadius: '0.75rem',
            background: 'linear-gradient(135deg, #ef4444, #dc2626)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 12px rgba(239, 68, 68, 0.3)'
          }}>
            <Users size={20} color="#fff" />
          </div>
          <div>
            <p style={{ margin: 0, color: 'var(--superadmin-text-muted)', fontSize: '0.75rem' }}>Total Admins</p>
            <p style={{ margin: 0, color: 'var(--superadmin-text-primary)', fontSize: '1.5rem', fontWeight: '700' }}>
              {loading ? '...' : stats.totalAdmins}
            </p>
          </div>
        </div>

        <div style={{
          background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(37, 99, 235, 0.05) 100%)',
          border: '1px solid rgba(59, 130, 246, 0.2)',
          borderRadius: '1rem',
          padding: isMobile ? '1rem' : '1.25rem',
          display: 'flex',
          alignItems: 'center',
          gap: '1rem'
        }}>
          <div style={{
            width: '3rem',
            height: '3rem',
            borderRadius: '0.75rem',
            background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)'
          }}>
            <ShieldCheck size={20} color="#fff" />
          </div>
          <div>
            <p style={{ margin: 0, color: 'var(--superadmin-text-muted)', fontSize: '0.75rem' }}>Activos</p>
            <p style={{ margin: 0, color: 'var(--superadmin-text-primary)', fontSize: '1.5rem', fontWeight: '700' }}>
              {loading ? '...' : stats.activeAdmins}
            </p>
          </div>
        </div>

        <div style={{
          background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(5, 150, 105, 0.05) 100%)',
          border: '1px solid rgba(16, 185, 129, 0.2)',
          borderRadius: '1rem',
          padding: isMobile ? '1rem' : '1.25rem',
          display: 'flex',
          alignItems: 'center',
          gap: '1rem'
        }}>
          <div style={{
            width: '3rem',
            height: '3rem',
            borderRadius: '0.75rem',
            background: 'linear-gradient(135deg, #10b981, #059669)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)'
          }}>
            <CheckCircle size={20} color="#fff" />
          </div>
          <div>
            <p style={{ margin: 0, color: 'var(--superadmin-text-muted)', fontSize: '0.75rem' }}>Sesiones Hoy</p>
            <p style={{ margin: 0, color: 'var(--superadmin-text-primary)', fontSize: '1.5rem', fontWeight: '700' }}>
              {loading ? '...' : stats.sessionsToday}
            </p>
          </div>
        </div>


      </div>

      {/* Sección Perfil del SuperAdmin - Solo Lectura */}
      <div style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: isSmallScreen ? '1fr' : '1fr 2fr', gap: isMobile ? '0.75rem' : '1rem' }}>
          {/* Card de perfil (izquierda) */}
          <div style={{
            background: 'var(--superadmin-card-bg)',
            backdropFilter: 'blur(1.25rem)',
            border: '0.0625rem solid var(--superadmin-border)',
            borderRadius: '1.25rem',
            padding: isMobile ? '1.25rem' : '1.5rem',
            boxShadow: '0 0.5rem 1.5rem rgba(0, 0, 0, 0.3)',
            textAlign: 'center'
          }}>
            {/* Foto de perfil */}
            <div
              onClick={(e) => {
                e.stopPropagation();
                setShowPhotoPreview(true);
              }}
              style={{
                position: 'relative',
                width: '7.5rem',
                height: '7.5rem',
                borderRadius: '50%',
                background: fotoUrl ? 'transparent' : 'linear-gradient(135deg, #ef4444, #dc2626)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '2.5rem',
                fontWeight: '800',
                color: '#fff',
                overflow: 'hidden',
                cursor: 'pointer',
                margin: '0 auto 1rem',
                boxShadow: '0 0.5rem 1.5rem rgba(239, 68, 68, 0.4)',
                transition: 'all 0.3s ease',
                transform: 'scale(1) rotate(0deg)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'scale(1.08) rotate(5deg)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'scale(1) rotate(0deg)';
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
                <span>{getInitials()}</span>
              )}
            </div>

            <h3 style={{ color: 'var(--superadmin-text-primary)', fontSize: '1.125rem', fontWeight: '700', margin: '0 0 0.25rem 0' }}>
              {userData?.nombre} {userData?.apellido}
            </h3>
            <p style={{ color: 'var(--superadmin-text-muted)', fontSize: '0.8125rem', margin: '0 0 0.5rem 0' }}>
              @{userData?.email?.split('@')[0]}
            </p>

            <div style={{
              padding: '0.5rem 1rem',
              background: 'rgba(239, 68, 68, 0.15)',
              borderRadius: '0.625rem',
              color: '#ef4444',
              fontSize: '0.8125rem',
              fontWeight: '600',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              marginTop: '0.5rem'
            }}>
              <ShieldCheck size={16} color="#ef4444" />
              Super Administrador
            </div>

            <div style={{
              marginTop: '1.5rem',
              paddingTop: '1.5rem',
              borderTop: '1px solid var(--superadmin-border)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                <CheckCircle size={18} color={userData?.estado === 'activo' ? '#10b981' : '#ef4444'} />
                <div style={{ textAlign: 'left', flex: 1 }}>
                  <div style={{ color: 'var(--superadmin-text-muted)', fontSize: '0.75rem' }}>Estado</div>
                  <div style={{ color: 'var(--superadmin-text-primary)', fontSize: '0.875rem', fontWeight: '600', textTransform: 'capitalize' }}>
                    {userData?.estado}
                  </div>
                </div>
              </div>

              {userData?.cedula && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <User size={18} color='#ef4444' />
                  <div style={{ textAlign: 'left', flex: 1 }}>
                    <div style={{ color: 'var(--superadmin-text-muted)', fontSize: '0.75rem' }}>Identificación</div>
                    <div style={{ color: 'var(--superadmin-text-primary)', fontSize: '0.875rem', fontWeight: '600' }}>
                      {userData.cedula}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Información detallada (derecha) - Solo Lectura */}
          <div style={{
            background: 'var(--superadmin-card-bg)',
            backdropFilter: 'blur(1.25rem)',
            border: '0.0625rem solid var(--superadmin-border)',
            borderRadius: '1.25rem',
            padding: isMobile ? '1.25rem' : '1.5rem',
            boxShadow: '0 0.5rem 1.5rem rgba(0, 0, 0, 0.3)'
          }}>
            <h3 style={{
              color: 'var(--superadmin-text-primary)',
              fontSize: isMobile ? '0.875rem' : '1rem',
              fontWeight: '700',
              margin: '0 0 1.25rem 0',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              opacity: 0.9
            }}>
              INFORMACIÓN PERSONAL
            </h3>

            <div style={{
              display: 'grid',
              gridTemplateColumns: isSmallScreen ? '1fr' : 'repeat(2, 1fr)',
              gap: '1rem'
            }}>
              {/* Nombres */}
              <div>
                <label style={{ color: 'var(--superadmin-text-muted)', fontSize: '0.75rem', fontWeight: '600', display: 'block', marginBottom: '0.375rem' }}>
                  Nombres
                </label>
                <div style={{
                  padding: '0.625rem 0.875rem',
                  background: 'var(--superadmin-input-bg)',
                  border: '1px solid var(--superadmin-input-border)',
                  borderRadius: '0.625rem',
                  color: 'var(--superadmin-text-primary)',
                  fontSize: '0.875rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}>
                  <User size={16} color='var(--superadmin-text-muted)' />
                  {userData?.nombre || 'No especificado'}
                </div>
              </div>

              {/* Apellidos */}
              <div>
                <label style={{ color: 'var(--superadmin-text-muted)', fontSize: '0.75rem', fontWeight: '600', display: 'block', marginBottom: '0.375rem' }}>
                  Apellidos
                </label>
                <div style={{
                  padding: '0.625rem 0.875rem',
                  background: 'var(--superadmin-input-bg)',
                  border: '1px solid var(--superadmin-input-border)',
                  borderRadius: '0.625rem',
                  color: 'var(--superadmin-text-primary)',
                  fontSize: '0.875rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}>
                  <User size={16} color='var(--superadmin-text-muted)' />
                  {userData?.apellido || 'No especificado'}
                </div>
              </div>

              {/* Email */}
              <div>
                <label style={{ color: 'var(--superadmin-text-muted)', fontSize: '0.75rem', fontWeight: '600', display: 'block', marginBottom: '0.375rem' }}>
                  Email
                </label>
                <div style={{
                  padding: '0.625rem 0.875rem',
                  background: 'var(--superadmin-input-bg)',
                  border: '1px solid var(--superadmin-input-border)',
                  borderRadius: '0.625rem',
                  color: 'var(--superadmin-text-primary)',
                  fontSize: '0.875rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}>
                  <Mail size={16} color='var(--superadmin-text-muted)' />
                  {userData?.email || 'No especificado'}
                </div>
              </div>

              {/* Teléfono */}
              <div>
                <label style={{ color: 'var(--superadmin-text-muted)', fontSize: '0.75rem', fontWeight: '600', display: 'block', marginBottom: '0.375rem' }}>
                  Teléfono
                </label>
                <div style={{
                  padding: '0.625rem 0.875rem',
                  background: 'var(--superadmin-input-bg)',
                  border: '1px solid var(--superadmin-input-border)',
                  borderRadius: '0.625rem',
                  color: 'var(--superadmin-text-primary)',
                  fontSize: '0.875rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}>
                  <Phone size={16} color='var(--superadmin-text-muted)' />
                  {userData?.telefono || 'No especificado'}
                </div>
              </div>

              {/* Dirección */}
              <div style={{ gridColumn: isSmallScreen ? '1' : 'span 2' }}>
                <label style={{ color: 'var(--superadmin-text-muted)', fontSize: '0.75rem', fontWeight: '600', display: 'block', marginBottom: '0.375rem' }}>
                  Dirección
                </label>
                <div style={{
                  padding: '0.625rem 0.875rem',
                  background: 'var(--superadmin-input-bg)',
                  border: '1px solid var(--superadmin-input-border)',
                  borderRadius: '0.625rem',
                  color: 'var(--superadmin-text-primary)',
                  fontSize: '0.875rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}>
                  <MapPin size={16} color='var(--superadmin-text-muted)' />
                  {userData?.direccion || 'No especificado'}
                </div>
              </div>

              {/* Fecha de nacimiento */}
              {userData?.fecha_nacimiento && (
                <div>
                  <label style={{ color: 'var(--superadmin-text-muted)', fontSize: '0.75rem', fontWeight: '600', display: 'block', marginBottom: '0.375rem' }}>
                    Fecha de Nacimiento
                  </label>
                  <div style={{
                    padding: '0.625rem 0.875rem',
                    background: 'var(--superadmin-input-bg)',
                    border: '1px solid var(--superadmin-input-border)',
                    borderRadius: '0.625rem',
                    color: 'var(--superadmin-text-primary)',
                    fontSize: '0.875rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}>
                    <Calendar size={16} color='var(--superadmin-text-muted)' />
                    {new Date(userData.fecha_nacimiento).toLocaleDateString()}
                  </div>
                </div>
              )}

              {/* Género */}
              {userData?.genero && (
                <div>
                  <label style={{ color: 'var(--superadmin-text-muted)', fontSize: '0.75rem', fontWeight: '600', display: 'block', marginBottom: '0.375rem' }}>
                    Género
                  </label>
                  <div style={{
                    padding: '0.625rem 0.875rem',
                    background: 'var(--superadmin-input-bg)',
                    border: '1px solid var(--superadmin-input-border)',
                    borderRadius: '0.625rem',
                    color: 'var(--superadmin-text-primary)',
                    fontSize: '0.875rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}>
                    <Users size={16} color='var(--superadmin-text-muted)' />
                    {userData.genero.charAt(0).toUpperCase() + userData.genero.slice(1)}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Actividad Reciente */}
      <div style={{
        background: 'var(--superadmin-card-bg)',
        backdropFilter: 'blur(1.25rem)',
        border: '0.0625rem solid var(--superadmin-border)',
        borderRadius: '1.25rem',
        padding: isMobile ? '1.25rem' : '1.5rem',
        boxShadow: '0 0.5rem 1.5rem rgba(0, 0, 0, 0.3)'
      }}>
        <h3 style={{
          color: 'var(--superadmin-text-primary)',
          fontSize: isMobile ? '0.875rem' : '1rem',
          fontWeight: '700',
          margin: '0 0 1rem 0',
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
          opacity: 0.9,
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem'
        }}>
          <CheckCircle size={18} color="#ef4444" />
          ACTIVIDAD RECIENTE
        </h3>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--superadmin-text-muted)' }}>
              Cargando actividad...
            </div>
          ) : recentActivity.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--superadmin-text-muted)' }}>
              No hay actividad reciente
            </div>
          ) : (
            recentActivity.map((activity, index) => (
              <div key={index} style={{
                display: 'flex',
                alignItems: 'center',
                gap: '1rem',
                padding: '0.75rem',
                background: 'var(--superadmin-input-bg)',
                border: '1px solid var(--superadmin-input-border)',
                borderRadius: '0.625rem',
                transition: 'all 0.2s ease'
              }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'var(--superadmin-hover-bg)';
                  e.currentTarget.style.transform = 'translateX(4px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'var(--superadmin-input-bg)';
                  e.currentTarget.style.transform = 'translateX(0)';
                }}>
                <div style={{
                  width: '0.5rem',
                  height: '0.5rem',
                  borderRadius: '50%',
                  background: activity.color,
                  boxShadow: `0 0 8px ${activity.color}`
                }} />
                <div style={{ flex: 1 }}>
                  <p style={{ margin: 0, color: 'var(--superadmin-text-primary)', fontSize: '0.875rem', fontWeight: '500' }}>
                    {activity.action}
                  </p>
                  <p style={{ margin: 0, color: 'var(--superadmin-text-muted)', fontSize: '0.75rem' }}>
                    {activity.time}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Vista previa de foto - Pantalla completa con X */}
      {showPhotoPreview && createPortal(
        <div
          onClick={() => {
            setShowPhotoPreview(false);
          }}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            width: '100vw',
            height: '100vh',
            background: 'rgba(0, 0, 0, 0.85)',
            zIndex: 99999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            animation: 'photoPreviewFadeIn 0.3s ease-out',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
            overflowY: 'auto',
            overflowX: 'hidden',
            scrollBehavior: 'smooth',
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
              e.currentTarget.style.background = 'rgba(239, 68, 68, 0.9)';
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
              background: fotoUrl ? 'transparent' : 'linear-gradient(135deg, #ef4444, #dc2626)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '6rem',
              fontWeight: '700',
              color: '#fff',
              boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5), 0 0 0 4px rgba(255, 255, 255, 0.2)',
              border: '4px solid rgba(255, 255, 255, 0.15)',
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

export default ConfiguracionPanel;
