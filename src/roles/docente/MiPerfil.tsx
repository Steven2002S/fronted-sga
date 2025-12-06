import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Calendar, Eye, EyeOff, CheckCircle, ShieldCheck, User, Mail, Phone, MapPin, Cake, Users, X, GraduationCap, BookOpen, Lock } from 'lucide-react';
import { showToast } from '../../config/toastConfig';
import { useBreakpoints } from '../../hooks/useMediaQuery';
import '../../styles/responsive.css';

const API_BASE = (import.meta as any).env?.VITE_API_URL || 'http://localhost:3000';

interface MiPerfilProps {
  darkMode: boolean;
}

interface DocenteData {
  id_usuario: number;
  nombres: string;
  apellidos: string;
  identificacion: string;
  email?: string;
  telefono?: string;
  direccion?: string;
  fecha_nacimiento?: string;
  genero?: string;
  titulo_profesional: string;
  experiencia_anos?: number;
  username: string;
  rol?: string;
  estado?: string;
}

const MiPerfil: React.FC<MiPerfilProps> = ({ darkMode }) => {
  const { isMobile, isSmallScreen } = useBreakpoints();
  const [activeTab, setActiveTab] = useState<'info' | 'password'>('info');
  const [docente, setDocente] = useState<DocenteData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<Partial<DocenteData>>({});
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
    loadFoto();
  }, []);

  const fetchPerfil = async () => {
    try {
      setLoading(true);
      const token = sessionStorage.getItem('auth_token');

      const response = await fetch(`${API_BASE}/api/auth/me`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setDocente(data);
        setFormData({
          nombres: data.nombres || '',
          apellidos: data.apellidos || '',
          email: data.email || '',
          telefono: data.telefono || '',
          direccion: data.direccion || '',
          fecha_nacimiento: data.fecha_nacimiento ? data.fecha_nacimiento.split('T')[0] : '',
          genero: data.genero || '',
          titulo_profesional: data.titulo_profesional || '',
          experiencia_anos: data.experiencia_anos || 0,
          identificacion: data.identificacion || ''
        });
      }
    } catch (error) {
      console.error('Error:', error);
      showToast.error('Error al cargar datos del perfil', darkMode);
    } finally {
      setLoading(false);
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
        // Usar directamente la URL de Cloudinary si existe
        if (data.foto_perfil) {
          setFotoUrl(data.foto_perfil);
        } else {
          setFotoUrl(null);
        }
      }
    } catch (error) {
      console.error('Error cargando foto:', error);
    }
  };

  const handleSave = async () => {
    try {
      const token = sessionStorage.getItem('auth_token');
      if (!token || !docente) return;

      let ident = ((formData.identificacion ?? docente.identificacion) || (docente as any).cedula || '').toString();
      const nombres = (formData.nombres ?? docente.nombres) as string;
      const apellidos = (formData.apellidos ?? docente.apellidos) as string;
      const fecha_nacimiento = (formData.fecha_nacimiento ?? docente.fecha_nacimiento) as string | undefined;
      const titulo_profesional = (formData.titulo_profesional ?? docente.titulo_profesional) as string;
      const experiencia_anos = (formData.experiencia_anos ?? docente.experiencia_anos ?? 0) as number;
      const estado = (formData as any).estado ?? (docente as any).estado ?? 'activo';

      let id_docente: number | null = null;
      let registro: any = null;
      const namesKey = `${docente.nombres} ${docente.apellidos}`.trim().toLowerCase();

      try {
        const res1 = await fetch(`${API_BASE}/api/docentes?search=${encodeURIComponent(ident)}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res1.ok) {
          const lista1 = await res1.json();
          if (Array.isArray(lista1)) {
            registro = lista1.find((d: any) => `${(d.identificacion || d.cedula || '').toString().trim()}` === ident.trim());
            id_docente = registro?.id_docente ?? null;
          }
        }
      } catch { }

      if (!id_docente && docente.username) {
        try {
          const res2 = await fetch(`${API_BASE}/api/docentes?search=${encodeURIComponent(docente.username)}`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (res2.ok) {
            const lista2 = await res2.json();
            if (Array.isArray(lista2)) {
              registro = lista2.find((d: any) => d.username === docente.username);
              id_docente = registro?.id_docente ?? null;
            }
          }
        } catch { }
      }

      if (!id_docente) {
        const res3 = await fetch(`${API_BASE}/api/docentes?limit=1000`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!res3.ok) throw new Error('No se pudo obtener la lista de docentes');
        const lista3 = await res3.json();
        if (Array.isArray(lista3)) {
          registro = lista3.find((d: any) => `${(d.identificacion || d.cedula || '').toString().trim()}` === ident.trim())
            || lista3.find((d: any) => (d.username || '').toString() === (docente.username || '').toString())
            || lista3.find((d: any) => `${(d.nombres || '').toString().trim().toLowerCase()} ${(d.apellidos || '').toString().trim().toLowerCase()}` === namesKey);
          id_docente = registro?.id_docente ?? null;
        }
      }

      if (!ident.trim() && registro?.identificacion) {
        ident = `${registro.identificacion}`;
      }
      if (!ident.trim()) {
        try {
          const resU = await fetch(`${API_BASE}/api/usuarios/${docente.id_usuario}`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (resU.ok) {
            const dataU = await resU.json();
            const ced = dataU?.usuario?.cedula || dataU?.usuario?.cedula?.toString?.();
            if (ced) ident = `${ced}`;
          }
        } catch { }
      }
      if (!ident.trim() && id_docente) {
        try {
          const resD = await fetch(`${API_BASE}/api/docentes/${id_docente}`);
          if (resD.ok) {
            const dataD = await resD.json();
            const identDoc = dataD?.docente?.identificacion || dataD?.identificacion;
            if (identDoc) ident = `${identDoc}`;
          }
        } catch { }
      }
      if (!ident.trim()) {
        throw new Error('La identificación es obligatoria');
      }
      if (!id_docente) throw new Error('No se encontró el ID del docente (verifica tu identificación)');

      const response = await fetch(`${API_BASE}/api/docentes/${id_docente}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          identificacion: ident.trim(),
          nombres,
          apellidos,
          fecha_nacimiento: fecha_nacimiento || null,
          titulo_profesional,
          experiencia_anos: Number(experiencia_anos) || 0,
          estado
        })
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

  const getInitials = () => {
    if (!docente) return 'DO';
    return `${docente.nombres.charAt(0)}${docente.apellidos.charAt(0)}`.toUpperCase();
  };

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '3.75rem', color: 'var(--docente-text-secondary)' }}>Cargando perfil...</div>;
  }

  if (!docente) {
    return <div style={{ textAlign: 'center', padding: '3.75rem', color: 'var(--docente-text-secondary)' }}>No se pudo cargar el perfil</div>;
  }

  return (
    <div style={{ minHeight: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header con ícono */}
      <div style={{ marginBottom: isMobile ? '0.75rem' : '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{
            color: 'var(--docente-text-primary)',
            margin: '0 0 0.375rem 0',
            fontSize: isMobile ? '1.25rem' : '1.5rem',
            fontWeight: '700'
          }}>
            Mi Perfil
          </h2>
          <p style={{ color: 'var(--docente-text-muted)', fontSize: isMobile ? '0.75rem' : '0.8125rem', margin: 0 }}>
            Gestiona tu información personal y seguridad
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div style={{
        display: 'flex',
        gap: '0.5rem',
        marginBottom: '1rem',
        borderBottom: '1px solid var(--docente-border)'
      }}>
        <button
          onClick={() => setActiveTab('info')}
          style={{
            padding: '0.625rem 1.25rem',
            background: 'transparent',
            border: 'none',
            borderBottom: activeTab === 'info' ? '2px solid #3b82f6' : '2px solid transparent',
            color: activeTab === 'info' ? 'var(--docente-text-primary)' : 'var(--docente-text-muted)',
            fontSize: '0.8125rem',
            fontWeight: '600',
            cursor: 'pointer',
            transition: 'all 0.2s',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
          <User size={14} />
          Información Personal
        </button>
        <button
          onClick={() => setActiveTab('password')}
          style={{
            padding: '0.625rem 1.25rem',
            background: 'transparent',
            border: 'none',
            borderBottom: activeTab === 'password' ? '2px solid #3b82f6' : '2px solid transparent',
            color: activeTab === 'password' ? 'var(--docente-text-primary)' : 'var(--docente-text-muted)',
            fontSize: '0.8125rem',
            fontWeight: '600',
            cursor: 'pointer',
            transition: 'all 0.2s',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
          <Lock size={14} />
          Cambiar Contraseña
        </button>
      </div>

      {/* Contenido de los tabs */}
      {activeTab === 'info' && (
        <form onSubmit={(e) => { e.preventDefault(); handleSave(); }}>
          <div style={{ display: 'grid', gridTemplateColumns: isSmallScreen ? '1fr' : '1fr 2fr', gap: '1rem', flex: 1 }}>
            {/* Card de perfil (izquierda) */}
            <div style={{
              background: 'var(--theme-card-bg)',
              border: '1px solid var(--theme-border)',
              borderRadius: '20px',
              padding: '24px',
              textAlign: 'center',
              backdropFilter: 'blur(20px)',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)'
            }}>
              {/* Foto de perfil */}
              <div
                onClick={(e) => {
                  e.stopPropagation();
                  setShowPhotoPreview(true);
                }}
                style={{
                  position: 'relative',
                  width: '5.25rem',
                  height: '5.25rem',
                  borderRadius: '50%',
                  background: fotoUrl ? 'transparent' : 'linear-gradient(135deg, #3b82f6, #2563eb)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '2rem',
                  fontWeight: '800',
                  color: '#fff',
                  overflow: 'hidden',
                  cursor: 'pointer',
                  margin: '0 auto 0.75rem',
                  boxShadow: '0 0.5rem 1.5rem rgba(59, 130, 246, 0.4)',
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
                  <span>
                    {getInitials()}
                  </span>
                )}
              </div>

              <h3 style={{ color: 'var(--docente-text-primary)', fontSize: '1rem', fontWeight: '700', margin: '0 0 0.125rem 0' }}>
                {docente.nombres} {docente.apellidos}
              </h3>
              <p style={{ color: 'var(--docente-text-muted)', fontSize: '0.8125rem', margin: '0 0 0.375rem 0' }}>
                {docente.username ? `@${docente.username}` : ''}
              </p>

              <div style={{
                padding: '0.375rem 0.75rem',
                background: 'rgba(59, 130, 246, 0.1)',
                borderRadius: '0.5rem',
                color: '#3b82f6',
                fontSize: '0.75rem',
                fontWeight: '600',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.375rem',
                marginTop: '0.5rem'
              }}>
                <BookOpen size={14} />
                Docente
              </div>

              <div style={{
                marginTop: '1rem',
                paddingTop: '1rem',
                borderTop: '1px solid var(--docente-border)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', marginBottom: '0.5rem' }}>
                  <CheckCircle size={16} color='#3b82f6' />
                  <div style={{ textAlign: 'left', flex: 1 }}>
                    <div style={{ color: 'var(--docente-text-muted)', fontSize: '0.7rem' }}>Estado</div>
                    <div style={{ color: 'var(--docente-text-primary)', fontSize: '0.8125rem', fontWeight: '600', textTransform: 'capitalize' }}>
                      {(docente as any).estado || 'Activo'}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                  <User size={16} color='#3b82f6' />
                  <div style={{ textAlign: 'left', flex: 1 }}>
                    <div style={{ color: 'var(--docente-text-muted)', fontSize: '0.7rem' }}>Identificación</div>
                    <div style={{ color: 'var(--docente-text-primary)', fontSize: '0.8125rem', fontWeight: '600' }}>
                      {docente.identificacion || 'No especificado'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Botones Editar/Guardar */}
              <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--docente-border)' }}>
                {!isEditing ? (
                  <button
                    type="button"
                    onClick={() => setIsEditing(true)}
                    style={{
                      width: '100%',
                      padding: '0.5rem 1rem',
                      background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
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
                    <User size={14} />
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
                        background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
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
                        color: 'var(--docente-text-secondary)',
                        border: '1px solid var(--docente-border)',
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
              background: 'var(--theme-card-bg)',
              border: '1px solid var(--theme-border)',
              borderRadius: '20px',
              padding: '24px',
              backdropFilter: 'blur(20px)',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)'
            }}>
              <h3 style={{
                color: 'var(--docente-text-primary)',
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
                  <label style={{ color: 'var(--docente-text-muted)', fontSize: '0.75rem', fontWeight: '600', display: 'block', marginBottom: '0.25rem' }}>
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
                        background: 'var(--docente-input-bg)',
                        border: '1px solid var(--docente-border)',
                        borderRadius: '0.5rem',
                        color: 'var(--docente-text-primary)',
                        fontSize: '0.8125rem'
                      }}
                      required
                    />
                  ) : (
                    <div style={{
                      padding: '0.5rem 0.75rem',
                      background: 'var(--docente-input-bg)',
                      border: '1px solid var(--docente-border)',
                      borderRadius: '0.5rem',
                      color: 'var(--docente-text-primary)',
                      fontSize: '0.8125rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem'
                    }}>
                      <User size={14} color='var(--docente-text-muted)' />
                      {formData.nombres || 'No especificado'}
                    </div>
                  )}
                </div>

                {/* Apellidos */}
                <div>
                  <label style={{ color: 'var(--docente-text-muted)', fontSize: '0.75rem', fontWeight: '600', display: 'block', marginBottom: '0.25rem' }}>
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
                        background: 'var(--docente-input-bg)',
                        border: '1px solid var(--docente-border)',
                        borderRadius: '0.5rem',
                        color: 'var(--docente-text-primary)',
                        fontSize: '0.8125rem'
                      }}
                      required
                    />
                  ) : (
                    <div style={{
                      padding: '0.5rem 0.75rem',
                      background: 'var(--docente-input-bg)',
                      border: '1px solid var(--docente-border)',
                      borderRadius: '0.5rem',
                      color: 'var(--docente-text-primary)',
                      fontSize: '0.8125rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem'
                    }}>
                      <User size={14} color='var(--docente-text-muted)' />
                      {formData.apellidos || 'No especificado'}
                    </div>
                  )}
                </div>

                {/* Email */}
                <div>
                  <label style={{ color: 'var(--docente-text-muted)', fontSize: '0.75rem', fontWeight: '600', display: 'block', marginBottom: '0.25rem' }}>
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
                        background: 'var(--docente-input-bg)',
                        border: '1px solid var(--docente-border)',
                        borderRadius: '0.5rem',
                        color: 'var(--docente-text-primary)',
                        fontSize: '0.8125rem'
                      }}
                      required
                    />
                  ) : (
                    <div style={{
                      padding: '0.5rem 0.75rem',
                      background: 'var(--docente-input-bg)',
                      border: '1px solid var(--docente-border)',
                      borderRadius: '0.5rem',
                      color: 'var(--docente-text-primary)',
                      fontSize: '0.8125rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem'
                    }}>
                      <Mail size={14} color='var(--docente-text-muted)' />
                      {formData.email || 'No especificado'}
                    </div>
                  )}
                </div>

                {/* Teléfono */}
                <div>
                  <label style={{ color: 'var(--docente-text-muted)', fontSize: '0.75rem', fontWeight: '600', display: 'block', marginBottom: '0.25rem' }}>
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
                        background: 'var(--docente-input-bg)',
                        border: '1px solid var(--docente-border)',
                        borderRadius: '0.5rem',
                        color: 'var(--docente-text-primary)',
                        fontSize: '0.8125rem'
                      }}
                    />
                  ) : (
                    <div style={{
                      padding: '0.5rem 0.75rem',
                      background: 'var(--docente-input-bg)',
                      border: '1px solid var(--docente-border)',
                      borderRadius: '0.5rem',
                      color: 'var(--docente-text-primary)',
                      fontSize: '0.8125rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem'
                    }}>
                      <Phone size={14} color='var(--docente-text-muted)' />
                      {formData.telefono || 'No especificado'}
                    </div>
                  )}
                </div>

                {/* Dirección */}
                <div>
                  <label style={{ color: 'var(--docente-text-muted)', fontSize: '0.75rem', fontWeight: '600', display: 'block', marginBottom: '0.25rem' }}>
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
                        background: 'var(--docente-input-bg)',
                        border: '1px solid var(--docente-border)',
                        borderRadius: '0.5rem',
                        color: 'var(--docente-text-primary)',
                        fontSize: '0.8125rem'
                      }}
                    />
                  ) : (
                    <div style={{
                      padding: '0.5rem 0.75rem',
                      background: 'var(--docente-input-bg)',
                      border: '1px solid var(--docente-border)',
                      borderRadius: '0.5rem',
                      color: 'var(--docente-text-primary)',
                      fontSize: '0.8125rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem'
                    }}>
                      <MapPin size={14} color='var(--docente-text-muted)' />
                      {formData.direccion || 'No especificado'}
                    </div>
                  )}
                </div>

                {/* Fecha de nacimiento */}
                <div>
                  <label style={{ color: 'var(--docente-text-muted)', fontSize: '0.75rem', fontWeight: '600', display: 'block', marginBottom: '0.25rem' }}>
                    Fecha de Nacimiento
                  </label>
                  {isEditing ? (
                    <input
                      type="date"
                      value={formData.fecha_nacimiento || ''}
                      onChange={(e) => setFormData({ ...formData, fecha_nacimiento: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '0.5rem 0.75rem',
                        background: 'var(--docente-input-bg)',
                        border: '1px solid var(--docente-border)',
                        borderRadius: '0.5rem',
                        color: 'var(--docente-text-primary)',
                        fontSize: '0.8125rem'
                      }}
                    />
                  ) : (
                    <div style={{
                      padding: '0.5rem 0.75rem',
                      background: 'var(--docente-input-bg)',
                      border: '1px solid var(--docente-border)',
                      borderRadius: '0.5rem',
                      color: 'var(--docente-text-primary)',
                      fontSize: '0.8125rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem'
                    }}>
                      <Cake size={14} color='var(--docente-text-muted)' />
                      {formData.fecha_nacimiento ? new Date(formData.fecha_nacimiento).toLocaleDateString() : 'No especificado'}
                    </div>
                  )}
                </div>

                {/* Género */}
                <div>
                  <label style={{ color: 'var(--docente-text-muted)', fontSize: '0.75rem', fontWeight: '600', display: 'block', marginBottom: '0.25rem' }}>
                    Género
                  </label>
                  {isEditing ? (
                    <select
                      value={formData.genero || ''}
                      onChange={(e) => setFormData({ ...formData, genero: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '0.5rem 0.75rem',
                        background: 'var(--docente-input-bg)',
                        border: '1px solid var(--docente-border)',
                        borderRadius: '0.5rem',
                        color: 'var(--docente-text-primary)',
                        fontSize: '0.8125rem'
                      }}
                    >
                      <option value="">Seleccionar</option>
                      <option value="masculino">Masculino</option>
                      <option value="femenino">Femenino</option>
                      <option value="otro">Otro</option>
                    </select>
                  ) : (
                    <div style={{
                      padding: '0.5rem 0.75rem',
                      background: 'var(--docente-input-bg)',
                      border: '1px solid var(--docente-border)',
                      borderRadius: '0.5rem',
                      color: 'var(--docente-text-primary)',
                      fontSize: '0.8125rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem'
                    }}>
                      <Users size={14} color='var(--docente-text-muted)' />
                      {formData.genero ? formData.genero.charAt(0).toUpperCase() + formData.genero.slice(1) : 'No especificado'}
                    </div>
                  )}
                </div>

                {/* Título Profesional */}
                <div>
                  <label style={{ color: 'var(--docente-text-muted)', fontSize: '0.75rem', fontWeight: '600', display: 'block', marginBottom: '0.25rem' }}>
                    Título Profesional
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={formData.titulo_profesional || ''}
                      onChange={(e) => setFormData({ ...formData, titulo_profesional: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '0.5rem 0.75rem',
                        background: 'var(--docente-input-bg)',
                        border: '1px solid var(--docente-border)',
                        borderRadius: '0.5rem',
                        color: 'var(--docente-text-primary)',
                        fontSize: '0.8125rem'
                      }}
                      required
                    />
                  ) : (
                    <div style={{
                      padding: '0.5rem 0.75rem',
                      background: 'var(--docente-input-bg)',
                      border: '1px solid var(--docente-border)',
                      borderRadius: '0.5rem',
                      color: 'var(--docente-text-primary)',
                      fontSize: '0.8125rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem'
                    }}>
                      <GraduationCap size={14} color='var(--docente-text-muted)' />
                      {formData.titulo_profesional || 'No especificado'}
                    </div>
                  )}
                </div>

                {/* Experiencia */}
                <div>
                  <label style={{ color: 'var(--docente-text-muted)', fontSize: '0.75rem', fontWeight: '600', display: 'block', marginBottom: '0.25rem' }}>
                    Años de Experiencia
                  </label>
                  {isEditing ? (
                    <input
                      type="number"
                      value={formData.experiencia_anos || 0}
                      onChange={(e) => setFormData({ ...formData, experiencia_anos: parseInt(e.target.value) || 0 })}
                      style={{
                        width: '100%',
                        padding: '0.5rem 0.75rem',
                        background: 'var(--docente-input-bg)',
                        border: '1px solid var(--docente-border)',
                        borderRadius: '0.5rem',
                        color: 'var(--docente-text-primary)',
                        fontSize: '0.8125rem'
                      }}
                      min="0"
                    />
                  ) : (
                    <div style={{
                      padding: '0.5rem 0.75rem',
                      background: 'var(--docente-input-bg)',
                      border: '1px solid var(--docente-border)',
                      borderRadius: '0.5rem',
                      color: 'var(--docente-text-primary)',
                      fontSize: '0.8125rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem'
                    }}>
                      <Calendar size={14} color='var(--docente-text-muted)' />
                      {formData.experiencia_anos || 0} años
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
            background: 'var(--theme-card-bg)',
            border: '1px solid var(--theme-border)',
            borderRadius: '20px',
            padding: '32px',
            backdropFilter: 'blur(20px)',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)'
          }}>
            <h3 style={{
              color: 'var(--docente-text-primary)',
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
              <label style={{ color: 'var(--docente-text-muted)', fontSize: '0.75rem', fontWeight: '600', display: 'block', marginBottom: '0.25rem' }}>
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
                    background: 'var(--docente-input-bg)',
                    border: '1px solid var(--docente-input-border)',
                    color: 'var(--docente-text-primary)',
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
              <label style={{ color: 'var(--docente-text-muted)', fontSize: '0.75rem', fontWeight: '600', display: 'block', marginBottom: '0.25rem' }}>
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
                    background: 'var(--docente-input-bg)',
                    border: '1px solid var(--docente-input-border)',
                    color: 'var(--docente-text-primary)',
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
              <p style={{ fontSize: '0.7rem', color: 'var(--docente-text-muted)', margin: '0.375rem 0 0 0', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                <CheckCircle size={12} color={passwordData.password_nueva.length >= 8 ? '#3b82f6' : '#9ca3af'} />
                Mínimo 8 caracteres
              </p>
            </div>

            {/* Confirmar Nueva Contraseña */}
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ color: 'var(--docente-text-muted)', fontSize: '0.75rem', fontWeight: '600', display: 'block', marginBottom: '0.25rem' }}>
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
                    background: 'var(--docente-input-bg)',
                    border: '1px solid var(--docente-input-border)',
                    color: 'var(--docente-text-primary)',
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
                <p style={{ fontSize: '0.7rem', color: '#3b82f6', margin: '0.375rem 0 0 0', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                  <CheckCircle size={12} color="#3b82f6" />
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
                  background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
                  color: '#fff',
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
              e.currentTarget.style.background = 'rgba(59, 130, 246, 0.8)';
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
              background: fotoUrl ? 'transparent' : 'var(--docente-card-bg, linear-gradient(135deg, #3b82f6, #2563eb))',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '6rem',
              fontWeight: '700',
              color: 'var(--docente-text-primary, #fff)',
              boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3), 0 0 0 4px var(--docente-border, rgba(255, 255, 255, 0.1))',
              border: '4px solid var(--docente-border, rgba(255, 255, 255, 0.15))',
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

export default MiPerfil;
