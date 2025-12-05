import { useState, useEffect } from 'react';
import { BookOpen, Calendar, Award, Clock, CheckCircle, TrendingUp, User, BarChart3 } from 'lucide-react';
import toast from 'react-hot-toast';
import '../../styles/responsive.css';

const API_BASE = (import.meta as any).env?.VITE_API_URL ? `${(import.meta as any).env.VITE_API_URL}/api` : 'http://localhost:3000/api';

interface Curso {
  id_curso: number;
  codigo_curso: string;
  nombre: string;
  fecha_inicio: string;
  fecha_fin: string;
  estado: string;
  tipo_curso: string;
  progreso: number;
  calificacion: number;
  tareasPendientes: number;
  estado_matricula: string;
  fecha_matricula: string;
  docente: {
    nombre_completo: string | null;
    titulo: string | null;
  };
  aula: {
    nombre: string | null;
    ubicacion: string | null;
  };
  horario: {
    hora_inicio: string | null;
    hora_fin: string | null;
    dias: string | null;
  };
}

interface HistorialAcademicoProps {
  darkMode: boolean;
}

const HistorialAcademico: React.FC<HistorialAcademicoProps> = ({ darkMode }) => {
  const [cursosActivos, setCursosActivos] = useState<Curso[]>([]);
  const [cursosFinalizados, setCursosFinalizados] = useState<Curso[]>([]);
  const [loading, setLoading] = useState(true);
  const [vistaActual, setVistaActual] = useState<'activos' | 'finalizados'>('activos');

  const theme = {
    cardBg: darkMode ? 'rgba(0,0,0,0.6)' : 'rgba(255,255,255,0.8)',
    textPrimary: darkMode ? '#fff' : '#1e293b',
    textSecondary: darkMode ? 'rgba(255,255,255,0.8)' : 'rgba(30,41,59,0.8)',
    textMuted: darkMode ? 'rgba(255,255,255,0.6)' : 'rgba(30,41,59,0.6)',
    border: darkMode ? 'rgba(251, 191, 36, 0.2)' : 'rgba(251, 191, 36, 0.3)',
    accent: '#fbbf24',
    success: darkMode ? '#10b981' : '#059669',
    warning: darkMode ? '#f59e0b' : '#d97706',
  };

  useEffect(() => {
    fetchHistorial();
  }, []);

  const fetchHistorial = async () => {
    try {
      setLoading(true);
      const token = sessionStorage.getItem('auth_token');

      const response = await fetch(`${API_BASE}/estudiantes/historial-academico`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setCursosActivos(data.activos || []);
        setCursosFinalizados(data.finalizados || []);
      } else {
        toast.error('Error al cargar el historial académico');
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error de conexión');
    } finally {
      setLoading(false);
    }
  };

  const formatearFecha = (fecha: string) => {
    return new Date(fecha).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const calcularDuracion = (fechaInicio: string, fechaFin: string) => {
    const inicio = new Date(fechaInicio);
    const fin = new Date(fechaFin);
    const meses = Math.round((fin.getTime() - inicio.getTime()) / (1000 * 60 * 60 * 24 * 30));
    return `${meses} ${meses === 1 ? 'mes' : 'meses'}`;
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '3.75em 1.25em' }}>
        <div style={{
          width: '3.75rem',
          height: '3.75rem',
          border: `0.25rem solid ${theme.textMuted}`,
          borderTop: `0.25rem solid ${theme.accent}`,
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
          margin: '0 auto 1.25em'
        }} />
        <p style={{ color: theme.textSecondary, fontSize: '1.1rem' }}>Cargando historial...</p>
      </div>
    );
  }

  const cursosAMostrar = vistaActual === 'activos' ? cursosActivos : cursosFinalizados;

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
          Historial Académico
        </h2>
        <p style={{ color: theme.textMuted, fontSize: '0.8125rem', margin: 0 }}>
          Revisa tu progreso y cursos completados
        </p>
      </div>

      {/* Tabs */}
      <div style={{
        display: 'flex',
        gap: '0.5rem',
        marginBottom: '1rem',
        borderBottom: `1px solid ${theme.border}`,
        paddingBottom: '0.75rem'
      }}>
        <button
          onClick={() => setVistaActual('activos')}
          style={{
            padding: '0.5rem 1rem',
            background: vistaActual === 'activos'
              ? 'linear-gradient(135deg, #fbbf24, #f59e0b)'
              : darkMode
                ? 'rgba(255, 255, 255, 0.05)'
                : 'rgba(0, 0, 0, 0.05)',
            border: 'none',
            borderRadius: '0.5rem',
            color: vistaActual === 'activos' ? '#fff' : theme.textSecondary,
            cursor: 'pointer',
            fontSize: '0.9rem',
            fontWeight: '600',
            transition: 'all 0.2s ease',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}
          onMouseEnter={(e) => {
            if (vistaActual !== 'activos') {
              e.currentTarget.style.background = darkMode
                ? 'rgba(255, 255, 255, 0.1)'
                : 'rgba(0, 0, 0, 0.1)';
            }
          }}
          onMouseLeave={(e) => {
            if (vistaActual !== 'activos') {
              e.currentTarget.style.background = darkMode
                ? 'rgba(255, 255, 255, 0.05)'
                : 'rgba(0, 0, 0, 0.05)';
            }
          }}
        >
          <BookOpen size={16} />
          Cursos Activos ({cursosActivos.length})
        </button>

        <button
          onClick={() => setVistaActual('finalizados')}
          style={{
            padding: '0.5rem 1rem',
            background: vistaActual === 'finalizados'
              ? 'linear-gradient(135deg, #fbbf24, #f59e0b)'
              : darkMode
                ? 'rgba(255, 255, 255, 0.05)'
                : 'rgba(0, 0, 0, 0.05)',
            border: 'none',
            borderRadius: '0.5rem',
            color: vistaActual === 'finalizados' ? '#fff' : theme.textSecondary,
            cursor: 'pointer',
            fontSize: '0.9rem',
            fontWeight: '600',
            transition: 'all 0.2s ease',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}
          onMouseEnter={(e) => {
            if (vistaActual !== 'finalizados') {
              e.currentTarget.style.background = darkMode
                ? 'rgba(255, 255, 255, 0.1)'
                : 'rgba(0, 0, 0, 0.1)';
            }
          }}
          onMouseLeave={(e) => {
            if (vistaActual !== 'finalizados') {
              e.currentTarget.style.background = darkMode
                ? 'rgba(255, 255, 255, 0.05)'
                : 'rgba(0, 0, 0, 0.05)';
            }
          }}
        >
          <Award size={16} />
          Cursos Finalizados ({cursosFinalizados.length})
        </button>
      </div>

      {/* Lista de Cursos */}
      {cursosAMostrar.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: '3em 1em',
          background: theme.cardBg,
          border: `0.0625rem solid ${theme.border}`,
          borderRadius: '1em',
          backdropFilter: 'blur(1.25rem)',
          boxShadow: darkMode ? '0 1.25rem 2.5rem rgba(0, 0, 0, 0.3)' : '0 1.25rem 2.5rem rgba(0, 0, 0, 0.1)'
        }}>
          {vistaActual === 'activos' ? <BookOpen size={48} style={{ margin: '0 auto 1em', color: theme.textMuted, opacity: 0.5 }} /> : <Award size={48} style={{ margin: '0 auto 1em', color: theme.textMuted, opacity: 0.5 }} />}
          <h3 style={{ color: theme.textPrimary, margin: '0 0 0.5em 0' }}>
            {vistaActual === 'activos'
              ? 'No tienes cursos activos'
              : 'No tienes cursos finalizados'}
          </h3>
          <p style={{ color: theme.textMuted, margin: 0 }}>
            {vistaActual === 'activos'
              ? 'Tus cursos activos aparecerán aquí'
              : 'Tus cursos finalizados aparecerán aquí'}
          </p>
        </div>
      ) : (
        <div className="responsive-grid-auto" style={{ gap: '1.25em' }}>
          {cursosAMostrar.map((curso, index) => {
            const esFinalizado = vistaActual === 'finalizados';
            // Variantes de dorado para todos los cursos (activos y finalizados)
            const coloresGradiente = [
              ['#fbbf24', '#f59e0b'], // Dorado brillante
              ['#f59e0b', '#d97706'], // Dorado medio
              ['#d97706', '#b45309'], // Dorado oscuro
              ['#fbbf24', '#d97706'], // Dorado brillante a oscuro
              ['#f59e0b', '#b45309'], // Dorado medio a muy oscuro
              ['#fcd34d', '#f59e0b']  // Dorado claro a medio
            ];
            const [color1, color2] = coloresGradiente[index % coloresGradiente.length];

            return (
              <div
                key={`curso-${curso.id_curso}-${index}`}
                style={{
                  background: theme.cardBg,
                  border: `0.0625rem solid ${theme.border}`,
                  borderRadius: '1em',
                  overflow: 'hidden',
                  transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                  cursor: 'pointer',
                  position: 'relative'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-0.5rem)';
                  e.currentTarget.style.boxShadow = darkMode
                    ? `0 1.25rem 2.5rem ${color1}40`
                    : `0 1.25rem 2.5rem ${color1}30`;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                {/* Header con gradiente */}
                <div style={{
                  background: `linear-gradient(135deg, ${color1}, ${color2})`,
                  padding: '1em',
                  position: 'relative',
                  overflow: 'hidden'
                }}>
                  {/* Patrón de fondo */}
                  <div style={{
                    position: 'absolute',
                    top: 0,
                    right: 0,
                    width: '6.25rem',
                    height: '6.25rem',
                    background: 'rgba(255,255,255,0.1)',
                    borderRadius: '50%',
                    transform: 'translate(30%, -30%)'
                  }} />

                  <div style={{ position: 'relative', zIndex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '0.75em' }}>
                      <div style={{
                        background: 'rgba(255,255,255,0.2)',
                        backdropFilter: 'blur(0.625rem)',
                        padding: '0.25em 0.625em',
                        borderRadius: '0.75em',
                        fontSize: '0.65rem',
                        fontWeight: '700',
                        color: '#fff'
                      }}>
                        {curso.codigo_curso}
                      </div>
                      <div style={{
                        background: esFinalizado ? 'rgba(251, 191, 36, 0.4)' : 'rgba(16, 185, 129, 0.3)',
                        backdropFilter: 'blur(0.625rem)',
                        padding: '0.25em 0.625em',
                        borderRadius: '0.75em',
                        fontSize: '0.65rem',
                        fontWeight: '700',
                        color: '#fff',
                        textTransform: 'uppercase',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.25em'
                      }}>
                        {esFinalizado ? <Award size={12} /> : <CheckCircle size={12} />}
                        {esFinalizado ? 'Finalizado' : 'En Curso'}
                      </div>
                    </div>

                    <h3 style={{
                      fontSize: '1.1rem',
                      fontWeight: '700',
                      color: '#fff',
                      margin: '0 0 0.25em 0',
                      lineHeight: '1.3'
                    }}>
                      {curso.nombre}
                    </h3>
                    <p style={{
                      fontSize: '0.75rem',
                      color: 'rgba(255,255,255,0.9)',
                      margin: 0
                    }}>
                      {curso.tipo_curso}
                    </p>
                  </div>
                </div>

                {/* Contenido */}
                <div style={{ padding: '1em' }}>
                  {/* Fechas */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5em',
                    marginBottom: '0.75em',
                    padding: '0.625em',
                    background: darkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
                    borderRadius: '0.5em'
                  }}>
                    <Calendar size={14} color={theme.accent} style={{ flexShrink: 0 }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{
                        fontSize: '0.7rem',
                        color: theme.textMuted,
                        margin: '0 0 0.25em 0',
                        textTransform: 'uppercase',
                        fontWeight: '600'
                      }}>
                        Período
                      </p>
                      <p style={{
                        fontSize: '0.75rem',
                        color: theme.textPrimary,
                        margin: 0,
                        fontWeight: '600'
                      }}>
                        {formatearFecha(curso.fecha_inicio)} - {formatearFecha(curso.fecha_fin)}
                      </p>
                      <p style={{
                        fontSize: '0.65rem',
                        color: theme.textMuted,
                        margin: '0.25em 0 0 0'
                      }}>
                        Duración: {calcularDuracion(curso.fecha_inicio, curso.fecha_fin)}
                      </p>
                    </div>
                  </div>

                  {/* Docente */}
                  {curso.docente.nombre_completo && (
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5em',
                      marginBottom: '0.75em',
                      padding: '0.625em',
                      background: darkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
                      borderRadius: '0.5em'
                    }}>
                      <User size={14} color={theme.accent} style={{ flexShrink: 0 }} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{
                          fontSize: '0.7rem',
                          color: theme.textMuted,
                          margin: '0 0 0.25em 0',
                          textTransform: 'uppercase',
                          fontWeight: '600'
                        }}>
                          Docente
                        </p>
                        <p style={{
                          fontSize: '0.75rem',
                          color: theme.textPrimary,
                          margin: 0,
                          fontWeight: '600',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap'
                        }}>
                          {curso.docente.nombre_completo}
                        </p>
                        {curso.docente.titulo && (
                          <p style={{
                            fontSize: '0.65rem',
                            color: theme.textMuted,
                            margin: '0.25em 0 0 0',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap'
                          }}>
                            {curso.docente.titulo}
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Horario */}
                  {curso.horario.hora_inicio && (
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5em',
                      marginBottom: '0.75em',
                      padding: '0.625em',
                      background: darkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
                      borderRadius: '0.5em'
                    }}>
                      <Clock size={14} color={theme.accent} style={{ flexShrink: 0 }} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{
                          fontSize: '0.7rem',
                          color: theme.textMuted,
                          margin: '0 0 0.25em 0',
                          textTransform: 'uppercase',
                          fontWeight: '600'
                        }}>
                          Horario
                        </p>
                        <p style={{
                          fontSize: '0.75rem',
                          color: theme.textPrimary,
                          margin: 0,
                          fontWeight: '600'
                        }}>
                          {curso.horario.hora_inicio} - {curso.horario.hora_fin}
                        </p>
                        {curso.horario.dias && (
                          <p style={{
                            fontSize: '0.65rem',
                            color: theme.textMuted,
                            margin: '0.25em 0 0 0'
                          }}>
                            {curso.horario.dias}
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Estadísticas */}
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: esFinalizado ? 'repeat(2, 1fr)' : 'repeat(3, 1fr)',
                    gap: '0.5em',
                    paddingTop: '0.75em',
                    borderTop: `1px solid ${theme.border}`
                  }}>
                    <div style={{
                      textAlign: 'center',
                      padding: '0.5em',
                      background: darkMode ? 'rgba(251, 191, 36, 0.1)' : 'rgba(251, 191, 36, 0.05)',
                      borderRadius: '0.5em'
                    }}>
                      <div style={{
                        fontSize: '1.25rem',
                        fontWeight: '700',
                        color: theme.accent,
                        marginBottom: '0.25em'
                      }}>
                        {curso.progreso}%
                      </div>
                      <div style={{
                        fontSize: '0.65rem',
                        color: theme.textMuted,
                        textTransform: 'uppercase',
                        fontWeight: '600'
                      }}>
                        Progreso
                      </div>
                    </div>

                    <div style={{
                      textAlign: 'center',
                      padding: '0.5em',
                      background: curso.calificacion >= 7
                        ? (darkMode ? 'rgba(16, 185, 129, 0.1)' : 'rgba(16, 185, 129, 0.05)')
                        : (darkMode ? 'rgba(245, 158, 11, 0.1)' : 'rgba(245, 158, 11, 0.05)'),
                      borderRadius: '0.5em'
                    }}>
                      <div style={{
                        fontSize: '1.25rem',
                        fontWeight: '700',
                        color: curso.calificacion >= 7 ? theme.success : theme.warning,
                        marginBottom: '0.25em'
                      }}>
                        {curso.calificacion != null ? Number(curso.calificacion).toFixed(1) : '0.0'}
                      </div>
                      <div style={{
                        fontSize: '0.65rem',
                        color: theme.textMuted,
                        textTransform: 'uppercase',
                        fontWeight: '600'
                      }}>
                        Calificación
                      </div>
                    </div>

                    {!esFinalizado && (
                      <div style={{
                        textAlign: 'center',
                        padding: '0.5em',
                        background: curso.tareasPendientes > 0
                          ? (darkMode ? 'rgba(245, 158, 11, 0.1)' : 'rgba(245, 158, 11, 0.05)')
                          : (darkMode ? 'rgba(16, 185, 129, 0.1)' : 'rgba(16, 185, 129, 0.05)'),
                        borderRadius: '0.5em'
                      }}>
                        <div style={{
                          fontSize: '1.25rem',
                          fontWeight: '700',
                          color: curso.tareasPendientes > 0 ? theme.warning : theme.success,
                          marginBottom: '0.25em'
                        }}>
                          {curso.tareasPendientes}
                        </div>
                        <div style={{
                          fontSize: '0.65rem',
                          color: theme.textMuted,
                          textTransform: 'uppercase',
                          fontWeight: '600'
                        }}>
                          Pendientes
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default HistorialAcademico;
