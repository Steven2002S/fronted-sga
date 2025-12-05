import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { showToast } from '../../config/toastConfig';
import {
  BookOpen,
  Calendar,
  Users,
  Clock,
  MapPin,
  Award,
  ChevronRight,
  FileText,
  Eye,
  Upload,
  Target,
  Play,
  GraduationCap,
  AlertCircle,
  CheckCircle,
  Star
} from 'lucide-react';
import { FaHandPaper } from 'react-icons/fa';
import { useBreakpoints } from '../../hooks/useMediaQuery';
import { useSocket } from '../../hooks/useSocket';
import '../../styles/responsive.css';

interface MiAulaProps {
  darkMode: boolean;
  onNavigate?: (tab: string) => void;
}

interface Curso {
  id_curso: number;
  codigo_curso: string;
  nombre: string;
  fecha_inicio: string;
  fecha_fin: string;
  estado: string;
  capacidad_maxima: number;
  progreso: number;
  calificacion: number;
  tareasPendientes: number;
  proximaClase: string;
  aula?: {
    codigo: string;
    nombre: string;
    ubicacion: string;
  };
  horario?: {
    hora_inicio: string;
    hora_fin: string;
    dias: string;
  };
  docente?: {
    nombres: string;
    apellidos: string;
    titulo: string;
    nombre_completo: string;
  };
}

interface UserData {
  id_usuario: number;
  nombre: string;
  apellido: string;
  nombres?: string;
  apellidos?: string;
  email: string;
  rol: string;
}

const API_BASE = (import.meta as any).env?.VITE_API_URL ? `${(import.meta as any).env.VITE_API_URL}/api` : 'http://localhost:3000/api';

const MiAula: React.FC<MiAulaProps> = ({ darkMode, onNavigate }) => {
  const navigate = useNavigate();
  const { isMobile, isSmallScreen } = useBreakpoints();
  const [isVisible, setIsVisible] = useState(false);
  const [cursosMatriculados, setCursosMatriculados] = useState<Curso[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [userData, setUserData] = useState<UserData | null>(null);

  // Configurar eventos de WebSocket
  const socketEvents = {
    'nueva_tarea': (data: any) => {
      console.log('Nueva tarea asignada:', data);
      showToast.info(`Nueva tarea: ${data.titulo_tarea}`, darkMode);
      // Recargar cursos para actualizar contador de tareas pendientes
      fetchCursosMatriculados();
    },
    'nuevo_modulo': (data: any) => {
      console.log('Nuevo módulo disponible:', data);
      showToast.info(`Nuevo módulo: ${data.nombre_modulo}`, darkMode);
      // Recargar cursos para actualizar información
      fetchCursosMatriculados();
    },
    'tarea_calificada': (data: any) => {
      console.log('Tarea calificada:', data);
      showToast.success(`Tarea calificada con ${data.nota} puntos`, darkMode);
      // Recargar cursos para actualizar progreso y calificación
      fetchCursosMatriculados();
    },
    'progreso_actualizado': (data: any) => {
      console.log('Progreso actualizado:', data);
      // Recargar cursos
      fetchCursosMatriculados();
    },
    'tarea_entregada': (data: any) => {
      console.log('Tarea entregada:', data);
      // Recargar cursos
      fetchCursosMatriculados();
    }
  };

  // Inicializar WebSocket con userId del usuario actual
  useSocket(socketEvents, userData?.id_usuario);

  useEffect(() => {
    setIsVisible(true);
    fetchUserData();
    fetchCursosMatriculados();
  }, []);

  const fetchUserData = async () => {
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
        setUserData(data);
      }
    } catch (error) {
      console.error('Error obteniendo datos del usuario:', error);
    }
  };

  const fetchCursosMatriculados = async () => {
    try {
      setLoading(true);
      const token = sessionStorage.getItem('auth_token');

      if (!token) {
        setError('No hay token de autenticación');
        return;
      }

      const response = await fetch(`${API_BASE}/estudiantes/mis-cursos`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const cursos = await response.json();
        console.log('Cursos cargados:', cursos);
        setCursosMatriculados(cursos);
        setError('');
      } else {
        setError('Error al cargar los cursos');
      }
    } catch (error) {
      console.error('Error fetching cursos:', error);
      setError('Error de conexión');
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
        accent: '#fbbf24',
        success: '#10b981',
        warning: '#f59e0b',
        danger: '#ef4444'
      };
    } else {
      return {
        cardBg: 'rgba(255, 255, 255, 0.8)',
        textPrimary: '#1e293b',
        textSecondary: 'rgba(30,41,59,0.8)',
        textMuted: 'rgba(30,41,59,0.7)',
        border: 'rgba(251, 191, 36, 0.2)',
        accent: '#f59e0b',
        success: '#059669',
        warning: '#d97706',
        danger: '#dc2626'
      };
    }
  };

  const theme = getThemeColors();

  return (
    <div style={{
      transform: isVisible ? 'translateY(0)' : 'translateY(-1.875rem)',
      opacity: isVisible ? 1 : 0,
      transition: 'all 0.8s cubic-bezier(0.4, 0, 0.2, 1)',
      minHeight: '100%',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden'
    }}>
      {/* Header de Bienvenida */}
      <div style={{
        background: theme.cardBg,
        border: `0.0625rem solid ${theme.border}`,
        borderRadius: '1rem',
        padding: '1rem',
        marginBottom: '1rem',
        backdropFilter: 'blur(1.25rem)',
        boxShadow: darkMode ? '0 0.25rem 0.5rem rgba(0, 0, 0, 0.05)' : '0 0.25rem 0.5rem rgba(0, 0, 0, 0.02)'
      }}>
        <h1 style={{
          fontSize: '1.5rem',
          fontWeight: '700',
          color: theme.textPrimary,
          margin: '0 0 0.25rem 0',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem'
        }}>
          <FaHandPaper size={20} style={{ color: theme.textPrimary, transform: 'rotate(35deg)' }} />
          ¡Bienvenido{userData?.nombres ? `, ${userData.nombres} ${userData.apellidos || ''}` : (userData?.nombre ? `, ${userData.nombre} ${userData.apellido || ''}` : '')}!
        </h1>
        <p style={{
          color: theme.textSecondary,
          fontSize: '0.8125rem',
          margin: '0 0 0.5rem 0'
        }}>
          Continúa tu formación en Belleza y Estética
        </p>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '1rem',
          fontSize: '0.75rem',
          color: theme.textMuted
        }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', color: theme.textMuted }}>
            <Calendar size={14} color={theme.textMuted} strokeWidth={2} />
            {new Date().toLocaleDateString('es-ES')}
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', color: theme.textMuted }}>
            <Clock size={14} color={theme.textMuted} strokeWidth={2} />
            {new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
      </div>

      {/* Estadísticas rápidas - 4 tarjetas */}
      <div className="responsive-grid-4" style={{ gap: '0.75rem', marginBottom: '1rem' }}>
        <div style={{
          background: darkMode ? 'rgba(251, 191, 36, 0.1)' : 'rgba(251, 191, 36, 0.05)',
          border: `1px solid rgba(251, 191, 36, 0.4)`,
          borderRadius: '0.75rem',
          padding: '0.75rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.5rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Target size={16} color="#fbbf24" strokeWidth={2} />
            <span style={{ color: theme.textSecondary, fontSize: '0.75rem', fontWeight: '600' }}>Progreso General</span>
          </div>
          <span style={{ color: '#fbbf24', fontSize: '1.5rem', fontWeight: '800' }}>
            {cursosMatriculados.length > 0
              ? Math.round(cursosMatriculados.reduce((acc, curso) => acc + (curso.progreso || 0), 0) / cursosMatriculados.length) || 0
              : 0}%
          </span>
        </div>

        <div style={{
          background: darkMode ? 'rgba(59, 130, 246, 0.1)' : 'rgba(59, 130, 246, 0.05)',
          border: '1px solid rgba(59, 130, 246, 0.4)',
          borderRadius: '0.75rem',
          padding: '0.75rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.5rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <BookOpen size={16} color="#3b82f6" strokeWidth={2} />
            <span style={{ color: theme.textSecondary, fontSize: '0.75rem', fontWeight: '600' }}>Cursos Activos</span>
          </div>
          <span style={{ color: '#3b82f6', fontSize: '1.5rem', fontWeight: '800' }}>{cursosMatriculados.length}</span>
        </div>

        <div style={{
          background: darkMode ? 'rgba(16, 185, 129, 0.1)' : 'rgba(16, 185, 129, 0.05)',
          border: '1px solid rgba(16, 185, 129, 0.4)',
          borderRadius: '0.75rem',
          padding: '0.75rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.5rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Star size={16} color="#10b981" strokeWidth={2} />
            <span style={{ color: theme.textSecondary, fontSize: '0.75rem', fontWeight: '600' }}>Promedio</span>
          </div>
          <span style={{ color: '#10b981', fontSize: '1.5rem', fontWeight: '800' }}>
            {cursosMatriculados.length > 0 && cursosMatriculados.some(curso => curso.calificacion !== undefined && curso.calificacion !== null) ?
              (cursosMatriculados.reduce((acc, curso) => acc + (Number(curso.calificacion) || 0), 0) / cursosMatriculados.length).toFixed(1) : '0.0'}
          </span>
        </div>

        <div style={{
          background: darkMode ? 'rgba(139, 92, 246, 0.1)' : 'rgba(139, 92, 246, 0.05)',
          border: '1px solid rgba(139, 92, 246, 0.4)',
          borderRadius: '0.75rem',
          padding: '0.75rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.5rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Award size={16} color="#8b5cf6" strokeWidth={2} />
            <span style={{ color: theme.textSecondary, fontSize: '0.75rem', fontWeight: '600' }}>Tareas Pendientes</span>
          </div>
          <span style={{ color: '#8b5cf6', fontSize: '1.5rem', fontWeight: '800' }}>
            {cursosMatriculados.length > 0 ?
              cursosMatriculados.reduce((acc, curso) => acc + (curso.tareasPendientes || 0), 0) : 0}
          </span>
        </div>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: isSmallScreen ? '1fr' : '3fr 1fr',
        gap: '1em',
        flex: 1,
        overflow: 'hidden',
        minHeight: 0
      }}>
        {/* Panel principal - Cursos en progreso */}
        <div style={{
          background: theme.cardBg,
          border: `0.0625rem solid ${theme.border}`,
          borderRadius: '1.25rem',
          padding: '1em',
          backdropFilter: 'blur(1.25rem)',
          boxShadow: darkMode ? '0 0.25rem 0.5rem rgba(0, 0, 0, 0.05)' : '0 0.25rem 0.5rem rgba(0, 0, 0, 0.02)'
        }}>
          <h2 style={{
            fontSize: '1.125rem',
            fontWeight: '700',
            color: theme.textPrimary,
            margin: '0 0 0.5em 0'
          }}>
            Mis Cursos
          </h2>

          {loading && (
            <div style={{ textAlign: 'center', padding: '2.5em' }}>
              <div style={{
                fontSize: '1.1rem',
                color: theme.textSecondary,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.75em'
              }}>
                <div style={{
                  width: '1.25em',
                  height: '1.25em',
                  border: `0.125rem solid ${theme.textMuted}`,
                  borderTop: `0.125rem solid ${theme.accent}`,
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite'
                }} />
                Cargando cursos...
              </div>
            </div>
          )}

          {error && (
            <div style={{
              background: darkMode ? 'rgba(239, 68, 68, 0.1)' : 'rgba(239, 68, 68, 0.05)',
              border: '0.0625rem solid rgba(239, 68, 68, 0.3)',
              borderRadius: '0.75em',
              padding: '1.25em',
              textAlign: 'center'
            }}>
              <AlertCircle size={24} color={theme.danger} style={{ marginBottom: '0.5em' }} />
              <p style={{ color: theme.danger, margin: 0 }}>{error}</p>
              <button
                onClick={fetchCursosMatriculados}
                style={{
                  background: theme.danger,
                  color: '#fff',
                  border: 'none',
                  borderRadius: '0.5em',
                  padding: '0.5em 1em',
                  marginTop: '0.75em',
                  cursor: 'pointer'
                }}
              >
                Reintentar
              </button>
            </div>
          )}

          {!loading && !error && cursosMatriculados.length === 0 && (
            <div style={{
              background: theme.cardBg,
              border: `0.0625rem solid ${theme.border}`,
              borderRadius: '1em',
              padding: '2.5em',
              textAlign: 'center'
            }}>
              <BookOpen size={48} color={theme.textMuted} style={{ marginBottom: '1em' }} />
              <h3 style={{ color: theme.textPrimary, margin: '0 0 0.5em 0' }}>
                No tienes cursos activos
              </h3>
              <p style={{ color: theme.textMuted, margin: 0 }}>
                Una vez que seas aceptado en un curso, aparecerá aquí.
              </p>
            </div>
          )}

          <div style={{ display: 'grid', gap: '0.5em', overflowY: 'auto', flex: 1, paddingRight: '0.5em' }}>
            {cursosMatriculados.map((curso) => (
              <div
                key={curso.id_curso}
                onClick={() => navigate(`/panel/estudiante/curso/${curso.id_curso}`)}
                style={{
                  padding: '0.5em',
                  background: darkMode ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.02)',
                  borderRadius: '0.75em',
                  border: `0.0625rem solid ${theme.border}`,
                  transition: 'all 0.3s ease',
                  cursor: 'pointer'
                }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5em' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.625em', marginBottom: '0.375em' }}>
                      <div style={{
                        background: `${theme.accent}20`,
                        color: theme.accent,
                        padding: '0.1875em 0.625em',
                        borderRadius: '1em',
                        fontSize: '0.75rem',
                        fontWeight: '600'
                      }}>
                        {curso.codigo_curso || `CURSO-${curso.id_curso}`}
                      </div>
                      <span style={{ color: theme.textMuted, fontSize: '0.8rem' }}>
                        {curso.fecha_inicio ? `Inicio: ${new Date(curso.fecha_inicio).toLocaleDateString()}` : 'Fecha por definir'}
                      </span>
                    </div>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: '700', color: theme.textPrimary, margin: '0 0 0.5em 0' }}>
                      {curso.nombre || 'Curso sin nombre'}
                    </h3>
                  </div>

                  <div style={{ textAlign: 'right', marginLeft: '0.5em' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.3em', marginBottom: '0.2em' }}>
                      <Star size={12} color={theme.accent} strokeWidth={2} />
                      <span style={{ color: theme.accent, fontSize: '0.8rem', fontWeight: '600' }}>
                        {curso.calificacion !== undefined && curso.calificacion !== null && !isNaN(Number(curso.calificacion)) ? Number(curso.calificacion).toFixed(1) : '0.0'}/10
                      </span>
                    </div>
                    <div style={{ fontSize: '0.7rem', color: theme.textMuted }}>
                      Progreso: {curso.progreso !== undefined && curso.progreso !== null ? Math.round(curso.progreso) : 0}%
                    </div>
                  </div>
                </div>

                {/* Información del curso en grid profesional */}
                <div className="responsive-grid-3" style={{
                  gap: '0.5em',
                  marginBottom: '0.5em'
                }}>
                  {/* Docente */}
                  {curso.docente?.nombre_completo && (
                    <div style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.3em',
                      padding: '0.375em',
                      background: darkMode ? 'rgba(251, 191, 36, 0.08)' : 'rgba(251, 191, 36, 0.06)',
                      borderRadius: '0.5em',
                      border: `0.0625rem solid ${theme.accent}25`
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.25em' }}>
                        <GraduationCap size={12} color={theme.accent} />
                        <span style={{
                          background: theme.accent,
                          color: '#fff',
                          fontSize: '0.6rem',
                          fontWeight: '700',
                          textTransform: 'uppercase',
                          letterSpacing: '0.03em',
                          padding: '0.125em 0.35em',
                          borderRadius: '0.25em',
                          display: 'inline-block'
                        }}>
                          Docente
                        </span>
                      </div>
                      <div style={{ color: theme.textPrimary, fontSize: '0.75rem', fontWeight: '600', lineHeight: '1.3' }}>
                        {curso.docente.nombre_completo}
                      </div>
                      {curso.docente.titulo && (
                        <div style={{ color: theme.textMuted, fontSize: '0.7rem', fontStyle: 'italic' }}>
                          {curso.docente.titulo}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Aula */}
                  {curso.aula?.nombre && (
                    <div style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.3em',
                      padding: '0.375em',
                      background: darkMode ? 'rgba(245, 158, 11, 0.08)' : 'rgba(245, 158, 11, 0.06)',
                      borderRadius: '0.5em',
                      border: `0.0625rem solid rgba(245, 158, 11, 0.25)`
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.25em' }}>
                        <MapPin size={12} color="#f59e0b" />
                        <span style={{
                          background: '#f59e0b',
                          color: '#fff',
                          fontSize: '0.6rem',
                          fontWeight: '700',
                          textTransform: 'uppercase',
                          letterSpacing: '0.03em',
                          padding: '0.125em 0.35em',
                          borderRadius: '0.25em',
                          display: 'inline-block'
                        }}>
                          Aula
                        </span>
                      </div>
                      <div style={{ color: theme.textPrimary, fontSize: '0.75rem', fontWeight: '600' }}>
                        {curso.aula.nombre}
                      </div>
                      {curso.aula.ubicacion && (
                        <div style={{ color: theme.textMuted, fontSize: '0.7rem' }}>
                          {curso.aula.ubicacion}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Horario */}
                  {curso.horario?.hora_inicio && (
                    <div style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.3em',
                      padding: '0.375em',
                      background: darkMode ? 'rgba(217, 119, 6, 0.08)' : 'rgba(217, 119, 6, 0.06)',
                      borderRadius: '0.5em',
                      border: `0.0625rem solid rgba(217, 119, 6, 0.25)`
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.25em' }}>
                        <Clock size={12} color="#d97706" />
                        <span style={{
                          background: '#d97706',
                          color: '#fff',
                          fontSize: '0.6rem',
                          fontWeight: '700',
                          textTransform: 'uppercase',
                          letterSpacing: '0.03em',
                          padding: '0.125em 0.35em',
                          borderRadius: '0.25em',
                          display: 'inline-block'
                        }}>
                          Horario
                        </span>
                      </div>
                      <div style={{ color: theme.textPrimary, fontSize: '0.75rem', fontWeight: '600', marginBottom: '0.2em' }}>
                        {curso.horario.hora_inicio?.substring(0, 5)} - {curso.horario.hora_fin?.substring(0, 5)}
                      </div>
                      {curso.horario.dias && (
                        <div style={{
                          display: 'flex',
                          flexWrap: 'wrap',
                          gap: '0.25em'
                        }}>
                          {curso.horario.dias.split(',').map((dia: string, idx: number) => (
                            <span key={idx} style={{
                              padding: '0.15em 0.4em',
                              background: darkMode ? 'rgba(251, 191, 36, 0.15)' : 'rgba(251, 191, 36, 0.12)',
                              color: theme.accent,
                              fontSize: '0.65rem',
                              fontWeight: '600',
                              borderRadius: '0.25em',
                              border: `0.0625rem solid ${theme.accent}30`,
                              whiteSpace: 'nowrap'
                            }}>
                              {dia.trim()}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Progreso del curso y tareas */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3em', marginBottom: '0.5em' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4em' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.7rem', marginBottom: '0.2em' }}>
                        <span style={{ color: theme.textMuted, fontWeight: '500' }}>Progreso</span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4em' }}>
                          <span style={{ color: theme.textPrimary, fontWeight: '600', fontSize: '0.7rem' }}>
                            {curso.progreso !== undefined && curso.progreso !== null ? `${Math.round(curso.progreso)}%` : '0%'}
                          </span>
                          <span style={{
                            padding: '0.125em 0.35em',
                            background: darkMode ? 'rgba(251, 191, 36, 0.15)' : 'rgba(251, 191, 36, 0.12)',
                            borderRadius: '0.25em',
                            border: `0.0625rem solid ${theme.accent}30`,
                            color: theme.accent,
                            fontSize: '0.65rem',
                            fontWeight: '700'
                          }}>
                            {curso.calificacion !== undefined && curso.calificacion !== null && !isNaN(Number(curso.calificacion)) ? Number(curso.calificacion).toFixed(1) : '0.0'}
                          </span>
                        </div>
                      </div>
                      <div style={{
                        height: '0.4em',
                        background: darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
                        borderRadius: '0.2em',
                        overflow: 'hidden'
                      }}>
                        <div style={{
                          height: '100%',
                          width: `${curso.progreso !== undefined && curso.progreso !== null ? curso.progreso : 0}%`,
                          background: `linear-gradient(90deg, ${theme.accent}, #f59e0b)`,
                          borderRadius: '0.2em'
                        }} />
                      </div>
                    </div>
                  </div>

                  {/* Estado de tareas */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.3em', fontSize: '0.7rem' }}>
                    <CheckCircle size={11} color={curso.tareasPendientes === 0 ? '#f59e0b' : theme.warning} />
                    <span style={{
                      color: curso.tareasPendientes === 0 ? '#f59e0b' : theme.warning,
                      fontWeight: '600'
                    }}>
                      {curso.tareasPendientes === 0 ? 'Al día con las tareas' : `${curso.tareasPendientes} tareas pendientes`}
                    </span>
                  </div>
                </div>

                {/* Acciones */}
                <div className="responsive-button-group" style={{ justifyContent: 'flex-end', gap: '0.4em' }}>
                  {curso.tareasPendientes > 0 ? (
                    <button
                      onClick={() => {
                        console.log('Subir tarea para curso:', curso.nombre);
                      }}
                      style={{
                        background: `linear-gradient(135deg, ${theme.accent}, #f59e0b)`,
                        color: '#fff',
                        border: 'none',
                        borderRadius: '0.5em',
                        padding: '0.4em 0.75em',
                        fontSize: '0.8rem',
                        fontWeight: '600',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.4em',
                        transition: 'all 0.3s ease',
                        boxShadow: `0 0.25rem 0.5rem ${theme.accent}30`
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'translateY(-0.125em)';
                        e.currentTarget.style.boxShadow = `0 0.5rem 1rem ${theme.accent}40`;
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = `0 0.25rem 0.5rem ${theme.accent}30`;
                      }}
                    >
                      <Upload size={14} color={darkMode ? '#000' : '#fff'} />
                      Subir Tarea
                    </button>
                  ) : (
                    <button
                      style={{
                        background: `linear-gradient(135deg, ${theme.accent}, #f59e0b)`,
                        color: '#fff',
                        border: 'none',
                        borderRadius: '0.5em',
                        padding: '0.4em 0.75em',
                        fontSize: '0.8rem',
                        fontWeight: '600',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.4em',
                        transition: 'all 0.3s ease',
                        boxShadow: `0 0.25rem 0.5rem ${theme.accent}30`
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'translateY(-0.125em)';
                        e.currentTarget.style.boxShadow = `0 0.5rem 1rem ${theme.accent}40`;
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = `0 0.25rem 0.5rem ${theme.accent}30`;
                      }}
                    >
                      <Play size={14} color="#fff" strokeWidth={2} />
                      Continuar
                    </button>
                  )}

                  <button
                    onClick={() => navigate(`/panel/estudiante/curso/${curso.id_curso}`)}
                    style={{
                      background: 'transparent',
                      color: theme.accent,
                      border: `1px solid ${theme.accent}30`,
                      borderRadius: '0.5em',
                      padding: '0.4em 0.75em',
                      fontSize: '0.8rem',
                      fontWeight: '600',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.4em',
                      transition: 'all 0.3s ease'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = `${theme.accent}20`;
                      e.currentTarget.style.borderColor = theme.accent;
                      e.currentTarget.style.transform = 'translateY(-0.125em)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'transparent';
                      e.currentTarget.style.borderColor = `${theme.accent}30`;
                      e.currentTarget.style.transform = 'translateY(0)';
                    }}
                  >
                    <Eye size={14} color={theme.accent} strokeWidth={2} />
                    Ver Detalles
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Panel lateral */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1em' }}>
          {/* Próximas clases */}
          <div style={{
            background: theme.cardBg,
            border: `0.0625rem solid ${theme.border}`,
            borderRadius: '1em',
            padding: '0.75em',
            backdropFilter: 'blur(1.25rem)',
            boxShadow: darkMode ? '0 0.25rem 0.5rem rgba(0, 0, 0, 0.02)' : '0 0.25rem 0.5rem rgba(0, 0, 0, 0.01)'
          }}>
            <h3 style={{ fontSize: '1.125rem', fontWeight: '700', color: theme.textPrimary, margin: '0 0 0.5em 0' }}>
              Próximas Clases
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5em' }}>
              {cursosMatriculados.slice(0, 2).map((curso, index) => (
                <div key={curso.id_curso} style={{
                  padding: '0.5em',
                  background: darkMode ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.02)',
                  borderRadius: '0.625em',
                  border: `0.0625rem solid ${theme.border}`
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.375em', fontSize: '0.8rem', color: theme.textSecondary, whiteSpace: 'nowrap', overflow: 'hidden' }}>
                    <div style={{
                      width: '0.375em',
                      height: '0.375em',
                      borderRadius: '50%',
                      background: index === 0 ? theme.accent : theme.success,
                      flexShrink: 0
                    }} />
                    <span style={{ color: theme.textPrimary, fontWeight: '600', flexShrink: 0 }}>
                      {new Date(curso.proximaClase || curso.fecha_inicio).toLocaleDateString()}
                    </span>
                    <span style={{ color: theme.textMuted, flexShrink: 0 }}>·</span>
                    <span style={{ color: theme.textPrimary, fontWeight: '600', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {curso.nombre}
                    </span>
                    {curso.aula?.nombre && (
                      <>
                        <span style={{ color: theme.textMuted, flexShrink: 0 }}>·</span>
                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {curso.aula.nombre}{curso.aula.ubicacion && ` - ${curso.aula.ubicacion}`}
                        </span>
                      </>
                    )}
                  </div>
                </div>
              ))}

              {cursosMatriculados.length === 0 && (
                <div style={{
                  padding: '0.75em',
                  textAlign: 'center',
                  color: theme.textMuted,
                  fontSize: '0.85rem'
                }}>
                  No hay clases programadas
                </div>
              )}
            </div>
          </div>

          {/* Acceso rápido */}
          <div style={{
            background: theme.cardBg,
            border: `0.0625rem solid ${theme.border}`,
            borderRadius: '1.25rem',
            padding: '1em',
            backdropFilter: 'blur(1.25rem)',
            boxShadow: darkMode ? '0 0.25rem 0.5rem rgba(0, 0, 0, 0.02)' : '0 0.25rem 0.5rem rgba(0, 0, 0, 0.01)'
          }}>
            <h3 style={{ fontSize: '1.125rem', fontWeight: '700', color: theme.textPrimary, margin: '0 0 0.75em 0' }}>
              Acceso Rápido
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5em' }}>
              <button onClick={() => onNavigate?.('calificaciones')} style={{
                width: '100%',
                background: 'transparent',
                border: `0.0625rem solid ${theme.border}`,
                borderRadius: '0.5em',
                padding: '0.625em',
                color: theme.textMuted,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5em',
                fontSize: '0.85rem',
                fontWeight: '600',
                transition: 'all 0.3s ease'
              }}>
                <FileText size={14} color={theme.textMuted} strokeWidth={2} />
                Mis Calificaciones
                <ChevronRight size={14} color={theme.textMuted} strokeWidth={2} style={{ marginLeft: 'auto' }} />
              </button>

              <button onClick={() => onNavigate?.('mi-horario')} style={{
                background: 'transparent',
                border: `0.0625rem solid ${theme.border}`,
                borderRadius: '0.5em',
                padding: '0.625em',
                color: theme.textMuted,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5em',
                fontSize: '0.85rem',
                fontWeight: '600',
                transition: 'all 0.3s ease'
              }}>
                <Calendar size={14} color={theme.textMuted} strokeWidth={2} />
                Mi Horario
                <ChevronRight size={14} color={theme.textMuted} strokeWidth={2} style={{ marginLeft: 'auto' }} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MiAula;