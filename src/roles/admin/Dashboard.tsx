import { useState, useEffect, useMemo } from 'react';
import {
  BookOpen, Award, TrendingUp,
  Target, PieChart, BarChart3,
  Activity, Shield, GraduationCap, Users, CheckCircle, Clock,
  UserPlus, DollarSign, UserCheck
} from 'lucide-react';
import { useBreakpoints } from '../../hooks/useMediaQuery';
import { useSocket } from '../../hooks/useSocket';
import LoadingModal from '../../components/LoadingModal';
import '../../styles/responsive.css';

const Dashboard = () => {
  const { isMobile, isTablet, isSmallScreen } = useBreakpoints();
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('admin-dark-mode');
    return saved !== null ? JSON.parse(saved) : true;
  });
  const [stats, setStats] = useState({
    totalAdministradores: 0,
    totalEstudiantes: 0,
    totalDocentes: 0,
    cursosActivos: 0,
    matriculasAceptadas: 0,
    matriculasPendientes: 0,
    porcentajeAdministradores: 0,
    porcentajeEstudiantes: 0,
    porcentajeDocentes: 0,
    porcentajeCursos: 0,
    porcentajeMatriculasAceptadas: 0,
    porcentajeMatriculasPendientes: 0
  });
  const [matriculasPorMes, setMatriculasPorMes] = useState([]);
  const [actividadReciente, setActividadReciente] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showLoadingModal, setShowLoadingModal] = useState(false);
  const API_BASE = (import.meta as any).env?.VITE_API_URL ? `${(import.meta as any).env.VITE_API_URL}/api` : 'http://localhost:3000/api';

  useEffect(() => {
    const syncDarkMode = () => {
      const saved = localStorage.getItem('admin-dark-mode');
      setDarkMode(saved !== null ? JSON.parse(saved) : true);
    };

    const interval = setInterval(syncDarkMode, 150);
    window.addEventListener('storage', syncDarkMode);
    return () => {
      clearInterval(interval);
      window.removeEventListener('storage', syncDarkMode);
    };
  }, []);

  const theme = useMemo(() => ({
    pageBg: darkMode
      ? 'linear-gradient(180deg, rgba(12,12,18,1) 0%, rgba(9,9,12,1) 100%)'
      : 'linear-gradient(180deg, rgba(255,255,255,0.94) 0%, rgba(255,246,246,0.92) 100%)',
    statCardBg: darkMode
      ? 'linear-gradient(135deg, rgba(20,20,28,0.92) 0%, rgba(30,30,38,0.92) 100%)'
      : 'linear-gradient(135deg, rgba(255,255,255,0.96) 0%, rgba(255,244,244,0.92) 100%)',
    statCardBorder: darkMode ? 'rgba(239,68,68,0.18)' : 'rgba(239,68,68,0.22)',
    statIconBg: (rgb: string) => (darkMode ? `rgba(${rgb}, 0.24)` : `rgba(${rgb}, 0.16)`),
    statIconBorder: (rgb: string) => (darkMode ? `1px solid rgba(${rgb}, 0.35)` : `1px solid rgba(${rgb}, 0.25)`),
    textPrimary: darkMode ? 'rgba(255,255,255,0.92)' : '#1f2937',
    textSecondary: darkMode ? 'rgba(255,255,255,0.7)' : '#4b5563',
    textMuted: darkMode ? 'rgba(255,255,255,0.55)' : '#6b7280',
    valueText: darkMode ? '#fff' : '#111827',
    containerBg: darkMode
      ? 'linear-gradient(135deg, rgba(15,15,20,0.85) 0%, rgba(30,30,35,0.85) 100%)'
      : 'linear-gradient(135deg, rgba(255,255,255,0.96) 0%, rgba(255,238,238,0.9) 100%)',
    containerBorder: darkMode ? 'rgba(239,68,68,0.18)' : 'rgba(239,68,68,0.25)',
    badgeBg: (color: string) => (darkMode ? `${color}25` : `${color}22`),
    chartBarColor: darkMode ? 'linear-gradient(180deg, #ef4444, #dc2626)' : 'linear-gradient(180deg, #ef4444, #f87171)',
    chartLabelColor: darkMode ? 'rgba(255,255,255,0.75)' : '#4b5563',
    emptyText: darkMode ? 'rgba(255,255,255,0.5)' : '#6b7280',
    overlayBg: darkMode ? 'rgba(0,0,0,0.7)' : 'rgba(0,0,0,0.45)'
  }), [darkMode]);

  const loadAllData = async () => {
    try {
      const token = sessionStorage.getItem('auth_token') || sessionStorage.getItem('token') || localStorage.getItem('auth_token') || localStorage.getItem('token');

      if (!token) {
        console.log('No hay token disponible');
        return;
      }

      const headers = { Authorization: `Bearer ${token}` };

      const [statsRes, matriculasRes, actividadRes] = await Promise.all([
        fetch(`${API_BASE}/users/admin-stats`, { headers }),
        fetch(`${API_BASE}/dashboard/matriculas-por-mes`, { headers }),
        fetch(`${API_BASE}/dashboard/actividad-reciente`, { headers })
      ]);

      if (statsRes.ok) {
        const data = await statsRes.json();
        setStats(data);
      }

      if (matriculasRes.ok) {
        const data = await matriculasRes.json();
        setMatriculasPorMes(data);
      }

      if (actividadRes.ok) {
        const data = await actividadRes.json();
        setActividadReciente(data);
      }
    } catch (error) {
      console.error('Error cargando datos del dashboard:', error);
    }
  };

  useSocket({
    'nueva_solicitud': () => {
      console.log('Nueva solicitud - Actualizando dashboard');
      loadAllData();
    },
    'solicitud_actualizada': () => {
      console.log('Solicitud actualizada - Actualizando dashboard');
      loadAllData();
    },
    'matricula_aprobada': () => {
      console.log('Matrícula aprobada - Actualizando dashboard');
      loadAllData();
    },
    'nuevo_pago': () => {
      console.log('Nuevo pago - Actualizando dashboard');
      loadAllData();
    },
    'pago_verificado': () => {
      console.log('Pago verificado - Actualizando dashboard');
      loadAllData();
    }
  });

  useEffect(() => {
    let isMounted = true;

    const loadStats = async () => {
      try {
        setLoading(true);
        setShowLoadingModal(true);
        await loadAllData();
      } catch (error) {
        console.error('Error cargando estadísticas:', error);
      } finally {
        if (isMounted) {
          setLoading(false);
          setTimeout(() => setShowLoadingModal(false), 300);
        }
      }
    };

    loadStats();

    return () => {
      isMounted = false;
    };
  }, []);

  const getIconComponent = (iconName) => {
    const icons = {
      UserPlus,
      DollarSign,
      Award,
      BookOpen,
      UserCheck
    };
    return icons[iconName] || Activity;
  };

  const statTiles = [
    {
      key: 'admins',
      title: 'Total Administradores',
      value: stats.totalAdministradores,
      percentage: stats.porcentajeAdministradores,
      icon: Shield,
      iconColor: '#ef4444',
      accentRgb: '239, 68, 68'
    },
    {
      key: 'cursos',
      title: 'Cursos Activos',
      value: stats.cursosActivos,
      percentage: stats.porcentajeCursos,
      icon: BookOpen,
      iconColor: '#10b981',
      accentRgb: '16, 185, 129'
    },
    {
      key: 'estudiantes',
      title: 'Total Estudiantes',
      value: stats.totalEstudiantes,
      percentage: stats.porcentajeEstudiantes,
      icon: GraduationCap,
      iconColor: '#3b82f6',
      accentRgb: '59, 130, 246'
    },
    {
      key: 'docentes',
      title: 'Total Docentes',
      value: stats.totalDocentes,
      percentage: stats.porcentajeDocentes,
      icon: Users,
      iconColor: '#f59e0b',
      accentRgb: '245, 158, 11'
    },
    {
      key: 'matriculasAceptadas',
      title: 'Matrículas Aceptadas',
      value: stats.matriculasAceptadas,
      percentage: stats.porcentajeMatriculasAceptadas,
      icon: CheckCircle,
      iconColor: '#22c55e',
      accentRgb: '34, 197, 94'
    },
    {
      key: 'matriculasPendientes',
      title: 'Matrículas Pendientes',
      value: stats.matriculasPendientes,
      percentage: stats.porcentajeMatriculasPendientes,
      icon: Clock,
      iconColor: '#fbbf24',
      accentRgb: '251, 191, 36'
    }
  ];

  return (
    <div data-dark={darkMode ? 'true' : 'false'} style={{ background: theme.pageBg, padding: isMobile ? '0.5rem' : '1rem', borderRadius: '1rem' }}>
      <div style={{
        display: 'grid',
        gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fit, minmax(min(15rem, 90vw), 1fr))',
        gap: isMobile ? '0.75em' : '0.875em',
        marginBottom: isMobile ? '1em' : '1.125em'
      }}>
        {statTiles.map(({ key, title, value, percentage, icon: Icon, iconColor, accentRgb }) => {
          const trendColor = percentage >= 0 ? '#22c55e' : '#ef4444';
          const formattedPercentage = loading ? '...' : `${percentage >= 0 ? '+' : ''}${percentage}%`;
          return (
            <div
              key={key}
              style={{
                background: theme.statCardBg,
                border: `0.0625rem solid ${theme.statCardBorder}`,
                borderRadius: '0.75em',
                padding: '0.625em',
                transition: 'all 0.2s ease',
                display: 'flex',
                flexDirection: 'column',
                boxShadow: darkMode ? '0 12px 24px rgba(0,0,0,0.25)' : '0 10px 20px rgba(239,68,68,0.08)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5em', marginBottom: '0.5em' }}>
                <div style={{
                  background: theme.statIconBg(accentRgb),
                  border: theme.statIconBorder(accentRgb),
                  borderRadius: '0.5em',
                  padding: '0.35em',
                  width: isMobile ? '2.1rem' : '2.25rem',
                  height: isMobile ? '2.1rem' : '2.25rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}>
                  <Icon size={14} color={iconColor} strokeWidth={2.25} />
                </div>
                <h3 style={{ color: theme.textPrimary, margin: 0, fontSize: '0.75rem', fontWeight: 600 }}>{title}</h3>
              </div>
              <p style={{ color: theme.valueText, fontSize: '1.5rem', fontWeight: '700', margin: '0 0 0.375em 0', lineHeight: '1', letterSpacing: '-0.02em' }}>
                {loading ? '...' : value.toLocaleString()}
              </p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.25em' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.2em' }}>
                  <TrendingUp size={10} color={trendColor} strokeWidth={2} />
                  <span style={{ color: trendColor, fontSize: '0.7rem', fontWeight: '700' }}>
                    {formattedPercentage}
                  </span>
                </div>
                <span style={{ color: theme.textMuted, fontSize: '0.7rem', fontWeight: '500' }}>vs mes anterior</span>
              </div>
            </div>
          );
        })}
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fit, minmax(min(11.25rem, 90vw), 1fr))',
        gap: isMobile ? '0.625em' : '0.75em',
        marginBottom: isMobile ? '1em' : '1.125em'
      }}>
        {[{
          key: 'aprobacion',
          title: 'Tasa de Aprobación',
          value: '94%',
          subtitle: 'Último mes',
          icon: Target,
          color: '#ef4444',
          rgb: '239, 68, 68'
        }, {
          key: 'graduacion',
          title: 'Tasa de Graduación',
          value: '87%',
          subtitle: 'Último semestre',
          icon: Award,
          color: '#8b5cf6',
          rgb: '139, 92, 246'
        }, {
          key: 'ocupacion',
          title: 'Ocupación Cursos',
          value: '73%',
          subtitle: 'Promedio general',
          icon: PieChart,
          color: '#06b6d4',
          rgb: '6, 182, 212'
        }].map(({ key, title, value, subtitle, icon: Icon, color, rgb }) => (
          <div
            key={key}
            style={{
              background: darkMode
                ? `linear-gradient(135deg, rgba(${rgb},0.18), rgba(${rgb},0.08))`
                : `linear-gradient(135deg, rgba(${rgb},0.12), rgba(${rgb},0.05))`,
              border: `0.0625rem solid rgba(${rgb}, ${darkMode ? 0.35 : 0.28})`,
              borderRadius: '0.75em',
              padding: '0.75em',
              boxShadow: darkMode ? '0 14px 28px rgba(0,0,0,0.3)' : '0 12px 24px rgba(148,163,184,0.16)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4em', marginBottom: '0.4em' }}>
              <Icon size={isMobile ? 13 : 15} color={color} />
              <h4 style={{ color: theme.textPrimary, fontSize: '0.65em', fontWeight: 600, margin: 0 }}>{title}</h4>
            </div>
            <p style={{ color, fontSize: '1.4em', fontWeight: '700', margin: 0 }}>{value}</p>
            <p style={{ color: theme.textMuted, fontSize: '0.625em', margin: '0.25em 0 0 0' }}>{subtitle}</p>
          </div>
        ))}
      </div>

      <div style={{
        background: theme.containerBg,
        border: `0.0625rem solid ${theme.containerBorder}`,
        borderRadius: '0.875em',
        padding: '1.125em',
        marginBottom: '1.25em',
        boxShadow: darkMode ? '0 20px 40px rgba(0,0,0,0.35)' : '0 16px 32px rgba(239,68,68,0.12)'
      }}>
        <h3 style={{ color: theme.textPrimary, marginBottom: '1em', display: 'flex', alignItems: 'center', gap: '0.5em' }}>
          <BarChart3 size={isMobile ? 17 : 19} color="#ef4444" />
          Matrículas por Mes (Últimos 6 meses)
        </h3>

        <div style={{ display: 'flex', alignItems: 'end', gap: '0.75em', height: '10rem', padding: '0 0.75em' }}>
          {matriculasPorMes.length > 0 ? matriculasPorMes.map((item, index) => (
            <div key={index} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1 }}>
              <div style={{
                width: '100%',
                height: item.altura,
                background: theme.chartBarColor,
                borderRadius: '0.375em 0.375em 0.1875em 0.1875em',
                marginBottom: '0.5em',
                display: 'flex',
                alignItems: 'start',
                justifyContent: 'center',
                paddingTop: '0.375em',
                color: '#fff',
                fontSize: '0.7em',
                fontWeight: '600',
                minHeight: item.valor === 0 ? '0.5em' : 'auto',
                boxShadow: darkMode ? '0 10px 18px rgba(239,68,68,0.28)' : '0 10px 18px rgba(239,68,68,0.2)'
              }}>
                {item.valor > 0 ? item.valor : ''}
              </div>
              <span style={{ color: theme.chartLabelColor, fontSize: '0.7em', fontWeight: '600' }}>
                {item.mes}
              </span>
            </div>
          )) : (
            <div style={{ width: '100%', textAlign: 'center', color: theme.emptyText, padding: '2em' }}>
              No hay datos de matrículas
            </div>
          )}
        </div>
      </div>

      <div style={{
        background: theme.containerBg,
        border: `0.0625rem solid ${theme.containerBorder}`,
        borderRadius: '0.875em',
        padding: '1.125em',
        boxShadow: darkMode ? '0 20px 40px rgba(0,0,0,0.35)' : '0 16px 32px rgba(239,68,68,0.12)'
      }}>
        <h3 style={{ color: theme.textPrimary, marginBottom: '1em', display: 'flex', alignItems: 'center', gap: '0.5em' }}>
          <Activity size={isMobile ? 17 : 19} color="#ef4444" />
          Actividad Reciente
        </h3>

        <div style={{ display: 'grid', gap: '0.75em' }}>
          {actividadReciente.length > 0 ? actividadReciente.map((actividad, index) => {
            const IconComponent = getIconComponent(actividad.icono);
            const rgbColor = actividad.color === '#10b981'
              ? '16, 185, 129'
              : actividad.color === '#f59e0b'
                ? '245, 158, 11'
                : actividad.color === '#a855f7'
                  ? '168, 85, 247'
                  : actividad.color === '#3b82f6'
                    ? '59, 130, 246'
                    : '239, 68, 68';
            return (
              <div
                key={index}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75em',
                  padding: '0.75em',
                  background: darkMode ? 'rgba(255,255,255,0.02)' : 'rgba(255,255,255,0.85)',
                  borderRadius: '0.625em',
                  border: darkMode ? '0.0625rem solid rgba(255,255,255,0.05)' : '0.0625rem solid rgba(239,68,68,0.12)',
                  boxShadow: darkMode ? '0 10px 20px rgba(0,0,0,0.25)' : '0 10px 20px rgba(148,163,184,0.18)'
                }}
              >
                <div style={{
                  background: darkMode ? `rgba(${rgbColor},0.22)` : `rgba(${rgbColor},0.12)`,
                  borderRadius: '0.5em',
                  padding: '0.5em',
                  border: darkMode ? `1px solid rgba(${rgbColor},0.35)` : `1px solid rgba(${rgbColor},0.24)`
                }}>
                  <IconComponent size={isMobile ? 16 : 17} color={actividad.color} />
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ color: theme.textPrimary, fontSize: '0.75em', fontWeight: '500', margin: '0 0 0.1875em 0' }}>
                    {actividad.texto}
                  </p>
                  <p style={{ color: theme.textMuted, fontSize: '0.65em', margin: 0 }}>
                    {actividad.tiempo}
                  </p>
                </div>
              </div>
            );
          }) : (
            <div style={{ textAlign: 'center', color: theme.emptyText, padding: '2em' }}>
              No hay actividad reciente
            </div>
          )}
        </div>
      </div>

      <LoadingModal
        isOpen={showLoadingModal}
        message="Actualizando estadísticas..."
        darkMode={darkMode}
        duration={500}
        onComplete={() => setShowLoadingModal(false)}
        colorTheme="red"
      />
    </div>
  );
};

export default Dashboard;
