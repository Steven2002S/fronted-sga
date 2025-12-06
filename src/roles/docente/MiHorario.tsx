import { useState, useEffect } from 'react';
import { MapPin } from 'lucide-react';
import { useBreakpoints } from '../../hooks/useMediaQuery';
import '../../styles/responsive.css';

const API_BASE = (import.meta as any).env?.VITE_API_URL || 'http://localhost:3000';

interface MiHorarioProps {
  darkMode: boolean;
}

interface Horario {
  id_asignacion: number;
  curso_nombre: string;
  codigo_curso: string;
  aula_nombre: string;
  aula_ubicacion: string;
  hora_inicio: string;
  hora_fin: string;
  dias: string;
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

      const response = await fetch(`${API_BASE}/api/docentes/mi-horario`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setHorarios(data);
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
        border: 'rgba(59, 130, 246, 0.2)',
        accent: '#3b82f6',
        success: '#10b981',
        warning: '#f59e0b'
      };
    } else {
      return {
        cardBg: 'rgba(255, 255, 255, 0.8)',
        textPrimary: '#1e293b',
        textSecondary: 'rgba(30,41,59,0.8)',
        textMuted: 'rgba(30,41,59,0.7)',
        border: 'rgba(59, 130, 246, 0.2)',
        accent: '#3b82f6',
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

    const top = ((inicioEnMinutos - baseMinutos) / 60) * 30; // 50px por hora
    const height = ((finEnMinutos - inicioEnMinutos) / 60) * 30;

    return { top, height };
  };

  const coloresClases = [
    '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4', '#f97316', '#14b8a6'
  ];

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '3.75em', color: theme.textSecondary }}>Cargando horario...</div>;
  }

  return (
    <div style={{ minHeight: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{ marginBottom: isMobile ? '0.5em' : '0.625em' }}>
        <h2 style={{ 
          color: theme.textPrimary, 
          margin: '0 0 0.375rem 0',
          fontSize: isMobile ? '1.25rem' : '1.5rem',
          fontWeight: '700'
        }}>
          Mi Horario Semanal
        </h2>
        <p style={{ color: theme.textMuted, fontSize: isMobile ? '0.75rem' : '0.8125rem', margin: 0 }}>
          Visualiza tu calendario de clases
        </p>
      </div>

      {/* Tabla de Horario Tipo Calendario */}
      <div className="responsive-table-container" style={{
        background: theme.cardBg,
        border: `0.0625rem solid ${theme.border}`,
        borderRadius: '1em',
        padding: isMobile ? '0.5em' : '0.75em',
        backdropFilter: 'blur(1.25rem)',
        boxShadow: darkMode ? '0 0.625rem 1.875rem rgba(0, 0, 0, 0.3)' : '0 0.625rem 1.875rem rgba(0, 0, 0, 0.1)',
        overflowX: 'auto',
        flex: 1
      }}>
        <div style={{ minWidth: isMobile ? '40rem' : '56.25rem' }}>
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
                    padding: isMobile ? '0.125em' : '0.25em',
                    display: 'flex',
                    alignItems: 'flex-start',
                    justifyContent: 'center',
                    color: theme.textMuted,
                    fontSize: isMobile ? '0.65rem' : '0.75rem',
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
                      key={clase.id_asignacion}
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
                        {clase.curso_nombre}
                      </div>
                      <div style={{ color: 'rgba(255,255,255,0.9)', fontSize: '0.65rem', display: 'flex', alignItems: 'center', gap: '0.1875em' }}>
                        <MapPin size={10} />
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
