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
  const { isMobile, isTablet } = useBreakpoints();
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('admin-dark-mode');
    return saved !== null ? JSON.parse(saved) : true;
  });
  const [stats, setStats] = useState({
    totalAdministradores: 0,
    totalEstudiantes: 0,
    estudiantesActivos: 0,
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
  const [matriculasPorMes, setMatriculasPorMes] = useState<Array<{ mes: string; valor: number; altura: string }>>([]);
  const [actividadReciente, setActividadReciente] = useState<Array<{ texto: string; tiempo: string; icono: string; color: string }>>([]);
  const [cursosTop, setCursosTop] = useState<Array<{ nombre_curso: string; total_matriculas: number; color: string }>>([]);
  const [ingresosMes, setIngresosMes] = useState({ ingresos_mes_actual: 0, porcentaje_cambio: 0 });
  const [estadisticasEstudiantes, setEstadisticasEstudiantes] = useState({
    estudiantes_activos: 0,
    estudiantes_inactivos: 0,
    porcentaje_activos: 0,
    tasa_retencion: 0,
    tasa_aprobacion: 0,
    tasa_graduacion: 0,
    tasa_ocupacion: 0
  });
  const [pagosPendientes, setPagosPendientes] = useState({ total_pendientes: 0 });
  const [proximosVencimientos, setProximosVencimientos] = useState<Array<{ id_pago: number; numero_cuota: number; monto: number; fecha_vencimiento: string; dias_restantes: number; nombre_estudiante: string; nombre_curso: string }>>([]);
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

      const [statsRes, matriculasRes, actividadRes, cursosTopRes, ingresosRes, estudiantesRes, pagosRes, vencimientosRes] = await Promise.all([
        fetch(`${API_BASE}/users/admin-stats`, { headers }),
        fetch(`${API_BASE}/dashboard/matriculas-por-mes`, { headers }),
        fetch(`${API_BASE}/dashboard/actividad-reciente`, { headers }),
        fetch(`${API_BASE}/dashboard/cursos-top-matriculas`, { headers }),
        fetch(`${API_BASE}/dashboard/ingresos-mes-actual`, { headers }),
        fetch(`${API_BASE}/dashboard/estadisticas-estudiantes`, { headers }),
        fetch(`${API_BASE}/dashboard/pagos-pendientes-verificacion`, { headers }),
        fetch(`${API_BASE}/dashboard/proximos-vencimientos`, { headers })
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

      if (cursosTopRes.ok) {
        const data = await cursosTopRes.json();
        setCursosTop(data);
      }

      if (ingresosRes.ok) {
        const data = await ingresosRes.json();
        setIngresosMes(data);
      }

      if (estudiantesRes.ok) {
        const data = await estudiantesRes.json();
        setEstadisticasEstudiantes(data);
      }

      if (pagosRes.ok) {
        const data = await pagosRes.json();
        setPagosPendientes(data);
      }

      if (vencimientosRes.ok) {
        const data = await vencimientosRes.json();
        setProximosVencimientos(data);
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

  const getIconComponent = (iconName: string) => {
    const icons: Record<string, any> = {
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
      key: 'activos',
      title: 'Estudiantes Activos',
      value: stats.estudiantesActivos || 0,
      percentage: stats.porcentajeEstudiantes,
      icon: UserCheck,
      iconColor: '#22c55e',
      accentRgb: '34, 197, 94'
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
          value: loading ? '...' : `${estadisticasEstudiantes.tasa_aprobacion}%`,
          subtitle: 'Global',
          icon: Target,
          color: '#ef4444',
          rgb: '239, 68, 68'
        }, {
          key: 'graduacion',
          title: 'Tasa de Graduación',
          value: loading ? '...' : `${estadisticasEstudiantes.tasa_graduacion}%`,
          subtitle: 'Histórico',
          icon: Award,
          color: '#8b5cf6',
          rgb: '139, 92, 246'
        }, {
          key: 'ocupacion',
          title: 'Ocupación Cursos',
          value: loading ? '...' : `${estadisticasEstudiantes.tasa_ocupacion}%`,
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
        display: 'grid',
        gridTemplateColumns: isMobile ? '1fr' : isTablet ? 'repeat(2, 1fr)' : 'repeat(3, 1fr)',
        gap: isMobile ? '0.625em' : '0.75em',
        marginBottom: isMobile ? '1em' : '1.125em'
      }}>
        {/* Ingresos del Mes */}
        <div style={{
          background: darkMode
            ? 'linear-gradient(135deg, rgba(34,197,94,0.18), rgba(34,197,94,0.08))'
            : 'linear-gradient(135deg, rgba(34,197,94,0.12), rgba(34,197,94,0.05))',
          border: `0.0625rem solid rgba(34,197,94, ${darkMode ? 0.35 : 0.28})`,
          borderRadius: '0.75em',
          padding: '0.75em',
          boxShadow: darkMode ? '0 14px 28px rgba(0,0,0,0.3)' : '0 12px 24px rgba(148,163,184,0.16)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4em', marginBottom: '0.4em' }}>
            <DollarSign size={isMobile ? 13 : 15} color="#22c55e" />
            <h4 style={{ color: theme.textPrimary, fontSize: '0.65em', fontWeight: 600, margin: 0 }}>Ingresos del Mes</h4>
          </div>
          <p style={{ color: '#22c55e', fontSize: '1.4em', fontWeight: '700', margin: 0 }}>
            ${loading ? '...' : ingresosMes.ingresos_mes_actual.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.25em', marginTop: '0.25em' }}>
            <TrendingUp size={10} color={ingresosMes.porcentaje_cambio >= 0 ? '#22c55e' : '#ef4444'} strokeWidth={2} />
            <span style={{ color: ingresosMes.porcentaje_cambio >= 0 ? '#22c55e' : '#ef4444', fontSize: '0.625em', fontWeight: '700' }}>
              {loading ? '...' : `${ingresosMes.porcentaje_cambio >= 0 ? '+' : ''}${ingresosMes.porcentaje_cambio}%`}
            </span>
            <span style={{ color: theme.textMuted, fontSize: '0.625em', margin: 0 }}>vs mes anterior</span>
          </div>
        </div>
        {/* Estudiantes Activos */}
        <div style={{
          background: darkMode
            ? 'linear-gradient(135deg, rgba(59,130,246,0.18), rgba(59,130,246,0.08))'
            : 'linear-gradient(135deg, rgba(59,130,246,0.12), rgba(59,130,246,0.05))',
          border: `0.0625rem solid rgba(59,130,246, ${darkMode ? 0.35 : 0.28})`,
          borderRadius: '0.75em',
          padding: '0.75em',
          boxShadow: darkMode ? '0 14px 28px rgba(0,0,0,0.3)' : '0 12px 24px rgba(148,163,184,0.16)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4em', marginBottom: '0.4em' }}>
            <Users size={isMobile ? 13 : 15} color="#3b82f6" />
            <h4 style={{ color: theme.textPrimary, fontSize: '0.65em', fontWeight: 600, margin: 0 }}>Estudiantes Activos</h4>
          </div>
          <p style={{ color: '#3b82f6', fontSize: '1.4em', fontWeight: '700', margin: 0 }}>
            {loading ? '...' : `${estadisticasEstudiantes.porcentaje_activos}%`}
          </p>
          <div style={{ marginTop: '0.5em' }}>
            <div style={{ width: '100%', height: '0.375em', background: darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)', borderRadius: '0.375em', overflow: 'hidden' }}>
              <div style={{ width: `${estadisticasEstudiantes.porcentaje_activos}%`, height: '100%', background: 'linear-gradient(90deg, #3b82f6, #60a5fa)', transition: 'width 0.3s ease' }} />
            </div>
            <p style={{ color: theme.textMuted, fontSize: '0.625em', margin: '0.25em 0 0 0' }}>
              {loading ? '...' : `${estadisticasEstudiantes.estudiantes_activos} de ${estadisticasEstudiantes.estudiantes_activos + estadisticasEstudiantes.estudiantes_inactivos} estudiantes`}
            </p>
          </div>
        </div>
        {/* Tasa de Retención */}
        <div style={{
          background: darkMode
            ? 'linear-gradient(135deg, rgba(139,92,246,0.18), rgba(139,92,246,0.08))'
            : 'linear-gradient(135deg, rgba(139,92,246,0.12), rgba(139,92,246,0.05))',
          border: `0.0625rem solid rgba(139,92,246, ${darkMode ? 0.35 : 0.28})`,
          borderRadius: '0.75em',
          padding: '0.75em',
          boxShadow: darkMode ? '0 14px 28px rgba(0,0,0,0.3)' : '0 12px 24px rgba(148,163,184,0.16)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4em', marginBottom: '0.4em' }}>
            <Award size={isMobile ? 13 : 15} color="#8b5cf6" />
            <h4 style={{ color: theme.textPrimary, fontSize: '0.65em', fontWeight: 600, margin: 0 }}>Tasa de Retención</h4>
          </div>
          <p style={{ color: '#8b5cf6', fontSize: '1.4em', fontWeight: '700', margin: 0 }}>
            {loading ? '...' : `${estadisticasEstudiantes.tasa_retencion}%`}
          </p>
          <p style={{ color: theme.textMuted, fontSize: '0.625em', margin: '0.25em 0 0 0' }}>Estudiantes que completan</p>
        </div>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: isMobile ? '1fr' : '0.6fr 1.4fr',
        gap: isMobile ? '1em' : '1.125em',
        marginBottom: isMobile ? '1em' : '1.125em'
      }}>
        {/* Gráfico Circular - Pagos Pendientes */}
        <div style={{
          background: theme.containerBg,
          border: `0.0625rem solid ${theme.containerBorder}`,
          borderRadius: '0.875em',
          padding: '1.125em',
          boxShadow: darkMode ? '0 20px 40px rgba(0,0,0,0.35)' : '0 16px 32px rgba(239,68,68,0.12)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <h3 style={{ color: theme.textPrimary, marginBottom: '1em', fontSize: '0.875em', fontWeight: 600, textAlign: 'center' }}>
            Pagos Pendientes Verificación
          </h3>

          {/* Gráfico de Dona Circular */}
          <div style={{ position: 'relative', width: '140px', height: '140px', marginBottom: '1em' }}>
            <svg width="140" height="140" viewBox="0 0 140 140" style={{ transform: 'rotate(-90deg)' }}>
              {/* Círculo de fondo */}
              <circle
                cx="70"
                cy="70"
                r="55"
                fill="none"
                stroke={darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}
                strokeWidth="18"
              />
              {/* Círculo de progreso */}
              <circle
                cx="70"
                cy="70"
                r="55"
                fill="none"
                stroke="url(#orangeGradient)"
                strokeWidth="18"
                strokeDasharray={`${Math.min((pagosPendientes.total_pendientes / 20) * 345, 345)} 345`}
                strokeLinecap="round"
                style={{ transition: 'stroke-dasharray 0.6s ease' }}
              />
              <defs>
                <linearGradient id="orangeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#fb923c" />
                  <stop offset="100%" stopColor="#f97316" />
                </linearGradient>
              </defs>
            </svg>
            {/* Número central */}
            <div style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              textAlign: 'center'
            }}>
              <div style={{ color: '#fb923c', fontSize: '2.5em', fontWeight: '700', lineHeight: '1' }}>
                {loading ? '...' : pagosPendientes.total_pendientes}
              </div>
              <div style={{ color: theme.textMuted, fontSize: '0.65em', marginTop: '0.25em' }}>pagos</div>
            </div>
          </div>

          <p style={{ color: theme.textSecondary, fontSize: '0.75em', textAlign: 'center', margin: 0 }}>
            Esperando aprobación del admin
          </p>
        </div>

        {/* Timeline - Próximos Vencimientos */}
        <div style={{
          background: theme.containerBg,
          border: `0.0625rem solid ${theme.containerBorder}`,
          borderRadius: '0.875em',
          padding: '1.125em',
          boxShadow: darkMode ? '0 20px 40px rgba(0,0,0,0.35)' : '0 16px 32px rgba(239,68,68,0.12)'
        }}>
          <h3 style={{ color: theme.textPrimary, marginBottom: '1em', fontSize: '0.875em', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5em' }}>
            <Clock size={18} color="#ef4444" />
            Próximos Vencimientos (7 días)
            {proximosVencimientos.length > 0 && (
              <span style={{
                background: 'rgba(239,68,68,0.1)',
                color: '#ef4444',
                fontSize: '0.75em',
                padding: '0.1em 0.6em',
                borderRadius: '1em',
                marginLeft: 'auto'
              }}>
                {proximosVencimientos.length} pendientes
              </span>
            )}
          </h3>

          {proximosVencimientos.length > 0 ? (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '0.75em',
              maxHeight: '320px',
              overflowY: 'auto',
              paddingRight: '0.5em',
              paddingLeft: '1em'
            }}>
              {proximosVencimientos.map((venc, index) => {
                const urgenciaColor = venc.dias_restantes <= 2 ? '#ef4444' : venc.dias_restantes <= 5 ? '#fb923c' : '#fbbf24';
                const urgenciaLabel = venc.dias_restantes === 0 ? 'HOY' : venc.dias_restantes === 1 ? 'MAÑANA' : `${venc.dias_restantes} días`;

                return (
                  <div key={index} style={{
                    position: 'relative',
                    paddingLeft: '2em',
                    paddingBottom: index < proximosVencimientos.length - 1 ? '0.75em' : '0',
                    borderLeft: index < proximosVencimientos.length - 1 ? `2px solid ${darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}` : 'none'
                  }}>
                    {/* Punto del timeline */}
                    <div style={{
                      position: 'absolute',
                      left: '-6px',
                      top: '4px',
                      width: '12px',
                      height: '12px',
                      borderRadius: '50%',
                      background: urgenciaColor,
                      boxShadow: `0 0 0 3px ${darkMode ? 'rgba(0,0,0,0.3)' : 'rgba(255,255,255,0.9)'}`,
                      border: `2px solid ${urgenciaColor}`
                    }} />

                    {/* Contenido */}
                    <div style={{
                      background: darkMode ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.02)',
                      borderRadius: '0.5em',
                      padding: '0.75em',
                      border: `1px solid ${darkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'}`,
                      borderLeft: `3px solid ${urgenciaColor}`
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '0.5em' }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ color: theme.textPrimary, fontSize: '0.8em', fontWeight: '600', marginBottom: '0.25em' }}>
                            {venc.nombre_estudiante}
                          </div>
                          <div style={{ color: theme.textSecondary, fontSize: '0.7em' }}>
                            {venc.nombre_curso}
                          </div>
                        </div>
                        <div style={{
                          background: `${urgenciaColor}20`,
                          color: urgenciaColor,
                          fontSize: '0.65em',
                          fontWeight: '700',
                          padding: '0.3em 0.6em',
                          borderRadius: '0.375em',
                          marginLeft: '0.5em',
                          whiteSpace: 'nowrap'
                        }}>
                          {urgenciaLabel}
                        </div>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ color: theme.textMuted, fontSize: '0.7em' }}>
                          Cuota #{venc.numero_cuota}
                        </span>
                        <span style={{ color: theme.textPrimary, fontSize: '0.8em', fontWeight: '600' }}>
                          ${venc.monto.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div style={{
              textAlign: 'center',
              color: theme.emptyText,
              padding: '3em 1em',
              fontSize: '0.8em',
              background: darkMode ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)',
              borderRadius: '0.5em'
            }}>
              <Clock size={32} color={theme.emptyText} style={{ marginBottom: '0.5em', opacity: 0.5 }} />
              <div>No hay pagos próximos a vencer</div>
            </div>
          )}
        </div>
      </div>
      <div style={{
        display: 'grid',
        gridTemplateColumns: isMobile ? '1fr' : '1.2fr 0.8fr',
        gap: isMobile ? '1em' : '1.125em',
        marginBottom: isMobile ? '1em' : '1.125em'
      }}>
        {/* Gráfico de Matrículas */}
        <div style={{
          background: theme.containerBg,
          border: `0.0625rem solid ${theme.containerBorder}`,
          borderRadius: '0.875em',
          padding: '1.125em',
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
        {/* Gráfico de Pastel - Cursos Top */}
        <div style={{
          background: theme.containerBg,
          border: `0.0625rem solid ${theme.containerBorder}`,
          borderRadius: '0.875em',
          padding: '1.125em',
          boxShadow: darkMode ? '0 20px 40px rgba(0,0,0,0.35)' : '0 16px 32px rgba(239,68,68,0.12)'
        }}>
          <h3 style={{ color: theme.textPrimary, marginBottom: '1em', display: 'flex', alignItems: 'center', gap: '0.5em' }}>
            <PieChart size={isMobile ? 17 : 19} color="#ef4444" />
            Cursos con Más Matrículas
          </h3>
          {cursosTop.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75em' }}>
              {cursosTop.map((curso, index) => {
                const total = cursosTop.reduce((sum, c) => sum + c.total_matriculas, 0);
                const porcentaje = total > 0 ? Math.round((curso.total_matriculas / total) * 100) : 0;
                return (
                  <div key={index} style={{ display: 'flex', alignItems: 'center', gap: '0.75em' }}>
                    <div style={{ width: '0.75em', height: '0.75em', borderRadius: '0.1875em', background: curso.color, flexShrink: 0 }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25em' }}>
                        <span style={{ color: theme.textPrimary, fontSize: '0.75em', fontWeight: '600', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {curso.nombre_curso}
                        </span>
                        <span style={{ color: theme.textSecondary, fontSize: '0.7em', fontWeight: '700', marginLeft: '0.5em', flexShrink: 0 }}>
                          {curso.total_matriculas}
                        </span>
                      </div>
                      <div style={{ width: '100%', height: '0.375em', background: darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)', borderRadius: '0.375em', overflow: 'hidden' }}>
                        <div style={{ width: `${porcentaje}%`, height: '100%', background: curso.color, transition: 'width 0.3s ease' }} />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div style={{ textAlign: 'center', color: theme.emptyText, padding: '2em' }}>
              No hay datos de cursos
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
