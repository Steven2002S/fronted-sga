import { useState, useEffect } from 'react';
import { MapPin, Clock } from 'lucide-react';
import { useBreakpoints } from '../../hooks/useMediaQuery';
import '../../styles/responsive.css';

const API_BASE = (import.meta as any).env?.VITE_API_URL ? `${(import.meta as any).env.VITE_API_URL}/api` : 'http://localhost:3000/api';

interface MiHorarioProps {
  darkMode: boolean;
}

interface Horario {
  id_curso: number;
  nombre: string;
  codigo_curso: string;
  aula_nombre: string;
  aula_ubicacion: string;
  hora_inicio: string;
  hora_fin: string;
  dias: string;
  docente_nombre: string;
}

const MiHorario: React.FC<MiHorarioProps> = ({ darkMode }) => {
  const { isMobile, isSmallScreen } = useBreakpoints();
  const [horarios, setHorarios] = useState<Horario[]>([]);
  const [loading, setLoading] = useState(true);

  const diasSemana = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

  useEffect(() => {
    fetchHorario();
  }, []);

  const fetchHorario = async () => {
    try {
      setLoading(true);
      const token = sessionStorage.getItem('auth_token');

      if (!token) {
        console.error('No hay token de autenticación');
        return;
      }

      const response = await fetch(`${API_BASE}/estudiantes/mis-cursos`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        // Filtrar solo cursos con horario definido
        const cursosConHorario = data.filter((curso: any) =>
          curso.horario?.hora_inicio && curso.horario?.hora_fin && curso.horario?.dias
        );
        // Mapear al formato de horario
        const horariosFormateados = cursosConHorario.map((curso: any) => ({
          id_curso: curso.id_curso,
          nombre: curso.nombre,
          codigo_curso: curso.codigo_curso,
          aula_nombre: curso.aula?.nombre || 'Sin aula asignada',
          aula_ubicacion: curso.aula?.ubicacion || '',
          hora_inicio: curso.horario.hora_inicio,
          hora_fin: curso.horario.hora_fin,
          dias: curso.horario.dias,
          docente_nombre: curso.docente?.nombre_completo || 'Sin docente asignado'
        }));
        console.log('Horario del estudiante:', horariosFormateados);
        setHorarios(horariosFormateados);
      } else {
        console.error('Error al cargar horario');
      }
    } catch (error) {
      console.error('Error:', error);
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
        border: 'rgba(251, 191, 36, 0.2)', // Dorado para estudiantes
        accent: '#fbbf24', // Dorado principal para estudiantes
        success: '#10b981',
        warning: '#f59e0b'
      };
    } else {
      return {
        cardBg: 'rgba(255, 255, 255, 0.8)',
        textPrimary: '#1e293b',
        textSecondary: 'rgba(30,41,59,0.8)',
        textMuted: 'rgba(30,41,59,0.7)',
        border: 'rgba(251, 191, 36, 0.2)', // Dorado para estudiantes
        accent: '#fbbf24', // Dorado principal para estudiantes
        success: '#059669',
        warning: '#d97706'
      };
    }
  };

  const theme = getThemeColors();

  const diasAbreviados = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

  // Generar horas del día (7 AM - 7 PM)
  const horasDelDia = Array.from({ length: 13 }, (_, i) => i + 7); // 7 a 19

  // Organizar horarios por día
  const horariosPorDia = diasSemana.map((dia, index) => ({
    dia,
    diaAbreviado: diasAbreviados[index],
    clases: horarios.filter(h => h.dias.split(',').map(d => d.trim()).includes(dia))
  }));

  // Función para calcular la posición y altura de una clase en la grilla
  const getClasePosition = (horaInicio: string, horaFin: string) => {
    const [horaI, minI] = horaInicio.split(':').map(Number);
    const [horaF, minF] = horaFin.split(':').map(Number);

    const inicioEnMinutos = (horaI * 60) + minI;
    const finEnMinutos = (horaF * 60) + minF;
    const baseMinutos = 7 * 60; // 7 AM

    const top = ((inicioEnMinutos - baseMinutos) / 60) * 30; // 30px por hora
    const height = ((finEnMinutos - inicioEnMinutos) / 60) * 30;

    return { top, height };
  };

  // Colores específicos para estudiantes (tonos dorados)
  const coloresClases = [
    '#fbbf24', '#f59e0b', '#d97706', '#b45309', '#92400e',
    '#fcd34d', '#fde68a', '#fef3c7', '#ffedd5', '#fdf2d1'
  ];

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '3.75em', color: theme.textSecondary }}>Cargando horario...</div>;
  }

  if (horarios.length === 0) {
    return (
      <div style={{
        textAlign: 'center',
        padding: '3.75em',
        color: theme.textSecondary,
        background: theme.cardBg,
        border: `0.0625rem solid ${theme.border}`,
        borderRadius: '1em',
        backdropFilter: 'blur(1.25rem)'
      }}>
        <Clock size={48} style={{ margin: '0 auto 1rem', color: theme.accent }} />
        <h3 style={{ color: theme.textPrimary, marginBottom: '0.5rem' }}>No tienes clases programadas</h3>
        <p>Consulta con tu coordinador académico para más información.</p>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{ marginBottom: '0.625em' }}>
        <h2 style={{
          fontSize: '1.5rem',
          fontWeight: '700',
          color: theme.textPrimary,
          margin: '0 0 0.375rem 0'
        }}>
          Mi Horario Semanal
        </h2>
        <p style={{ color: theme.textMuted, fontSize: '0.8125rem', margin: 0 }}>
          Visualiza tu calendario de clases
        </p>
      </div>

      {/* Tabla de Horario Tipo Calendario */}
      <div style={{
        background: theme.cardBg,
        border: `0.0625rem solid ${theme.border}`,
        borderRadius: '1em',
        padding: '0.75em',
        backdropFilter: 'blur(1.25rem)',
        boxShadow: darkMode ? '0 0.625rem 1.875rem rgba(0, 0, 0, 0.3)' : '0 0.625rem 1.875rem rgba(0, 0, 0, 0.1)',
        overflowX: 'auto',
        flex: 1
      }}>
        <div style={{ minWidth: '56.25rem' }}>
          {/* Header con días de la semana */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? '3rem repeat(7, 1fr)' : '5rem repeat(7, 1fr)',
            gap: '0.125em',
            marginBottom: '0.125em'
          }}>
            <div style={{ padding: '1em 0.5em' }}></div>
            {horariosPorDia.map(({ dia, diaAbreviado }) => (
              <div
                key={dia}
                style={{
                  padding: '0.625em 0.375em',
                  background: `linear-gradient(135deg, ${theme.accent}15, ${theme.accent}08)`,
                  borderRadius: '0.625em 0.625em 0 0',
                  textAlign: 'center',
                  border: `0.0625rem solid ${theme.border}`,
                  borderBottom: 'none'
                }}
              >
                <div style={{
                  color: theme.accent,
                  fontSize: '0.7rem',
                  fontWeight: '600',
                  textTransform: 'uppercase',
                  letterSpacing: '0.03125em',
                  marginBottom: '0.125em'
                }}>
                  {diaAbreviado}
                </div>
                <div style={{ color: theme.textPrimary, fontSize: '0.95rem', fontWeight: '700' }}>
                  {dia}
                </div>
              </div>
            ))}
          </div>

          {/* Grid de horarios */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? '3rem repeat(7, 1fr)' : '5rem repeat(7, 1fr)',
            gap: '0.125em',
            position: 'relative'
          }}>
            {/* Columna de horas */}
            <div>
              {horasDelDia.map(hora => (
                <div
                  key={hora}
                  style={{
                    height: '1.875rem',
                    padding: '0.25em',
                    display: 'flex',
                    alignItems: 'flex-start',
                    justifyContent: 'center',
                    color: theme.textMuted,
                    fontSize: '0.75rem',
                    fontWeight: '600'
                  }}
                >
                  {hora.toString().padStart(2, '0')}:00
                </div>
              ))}
            </div>

            {/* Columnas de días */}
            {horariosPorDia.map(({ dia, clases }, diaIndex) => (
              <div
                key={dia}
                style={{
                  position: 'relative',
                  background: darkMode ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.01)',
                  border: `0.0625rem solid ${theme.border}`,
                  borderRadius: diaIndex === 0 ? '0 0 0 0.75em' : diaIndex === 6 ? '0 0 0.75em 0' : '0'
                }}
              >
                {/* Líneas de hora */}
                {horasDelDia.map((hora, index) => (
                  <div
                    key={hora}
                    style={{
                      position: 'absolute',
                      top: `${index * 1.875}rem`,
                      left: 0,
                      right: 0,
                      height: '1.875rem',
                      borderBottom: `0.0625rem dashed ${darkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'}`
                    }}
                  />
                ))}

                {/* Bloques de clases */}
                {clases.map((clase, index) => {
                  const { top, height } = getClasePosition(clase.hora_inicio, clase.hora_fin);
                  const color = coloresClases[index % coloresClases.length];

                  return (
                    <div
                      key={clase.id_curso}
                      style={{
                        position: 'absolute',
                        top: `${top}px`,
                        left: '0.25em',
                        right: '0.25em',
                        height: `${height - 8}px`,
                        background: `linear-gradient(135deg, ${color}dd, ${color}bb)`,
                        borderRadius: '0.375em',
                        padding: '0.375em',
                        overflow: 'hidden',
                        boxShadow: `0 0.25rem 0.75rem ${color}40`,
                        border: `0.0625rem solid ${color}`,
                        cursor: 'pointer',
                        transition: 'all 0.3s ease'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'scale(1.02)';
                        e.currentTarget.style.zIndex = '10';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'scale(1)';
                        e.currentTarget.style.zIndex = '1';
                      }}
                    >
                      <div style={{ color: '#fff', fontSize: '0.65rem', fontWeight: '700', marginBottom: '0.125em' }}>
                        {clase.hora_inicio.substring(0, 5)} - {clase.hora_fin.substring(0, 5)}
                      </div>
                      <div style={{ color: '#fff', fontSize: '0.8rem', fontWeight: '700', lineHeight: 1.1, marginBottom: '0.125em' }}>
                        {clase.nombre}
                      </div>
                      <div style={{ color: 'rgba(255,255,255,0.9)', fontSize: '0.65rem', display: 'flex', alignItems: 'center', gap: '0.1875em' }}>
                        <MapPin size={10} color="rgba(255,255,255,0.9)" strokeWidth={2} />
                        {clase.aula_nombre}
                      </div>
                      <div style={{
                        marginTop: '0.125em',
                        padding: '0.125em 0.25em',
                        background: 'rgba(255,255,255,0.2)',
                        borderRadius: '0.1875em',
                        fontSize: '0.6rem',
                        fontWeight: '600',
                        color: '#fff',
                        display: 'inline-block'
                      }}>
                        {clase.codigo_curso}
                      </div>
                      <div style={{
                        color: 'rgba(255,255,255,0.85)',
                        fontSize: '0.55rem',
                        marginTop: '0.125em',
                        fontWeight: '600',
                        fontStyle: 'italic'
                      }}>
                        {clase.docente_nombre}
                      </div>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MiHorario;