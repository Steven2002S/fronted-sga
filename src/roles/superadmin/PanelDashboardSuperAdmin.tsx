import { useState, useEffect, useMemo } from 'react';
import {
  Server,
  Database,
  Activity,
  HardDrive,
  Cpu,
  Zap,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Users,
  FileText,
  TrendingUp,
  BarChart3
} from 'lucide-react';
import { useBreakpoints } from '../../hooks/useMediaQuery';
import LoadingModal from '../../components/LoadingModal';
import '../../styles/responsive.css';

const PanelDashboardSuperAdmin = () => {
  const { isMobile } = useBreakpoints();
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('superadmin-dark-mode');
    return saved !== null ? JSON.parse(saved) : true;
  });
  const [systemMetrics, setSystemMetrics] = useState({
    uptime: '0h 0m',
    cpuUsage: 0,
    memoryUsage: 0,
    activeConnections: 0,
    requestsPerMinute: 0,
    errorRate: 0
  });
  const [dbMetrics, setDbMetrics] = useState({
    totalConnections: 0,
    activeQueries: 0,
    dbSize: '0 MB',
    slowQueries: 0,
    connectionPool: { active: 0, idle: 0, total: 10 }
  });
  const [recentLogs, setRecentLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showLoadingModal, setShowLoadingModal] = useState(false);
  const API_BASE = (import.meta as any).env?.VITE_API_URL ? `${(import.meta as any).env.VITE_API_URL}/api` : 'http://localhost:3000/api';

  // Sincronizar darkMode (MISMO que admin)
  useEffect(() => {
    const syncDarkMode = () => {
      const saved = localStorage.getItem('superadmin-dark-mode');
      setDarkMode(saved !== null ? JSON.parse(saved) : true);
    };

    const interval = setInterval(syncDarkMode, 150);
    window.addEventListener('storage', syncDarkMode);
    return () => {
      clearInterval(interval);
      window.removeEventListener('storage', syncDarkMode);
    };
  }, []);

  // Tema EXACTO del admin
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
    chartBarColor: darkMode ? 'linear-gradient(180deg, #ef4444, #dc2626)' : 'linear-gradient(180deg, #ef4444, #f87171)',
    chartLabelColor: darkMode ? 'rgba(255,255,255,0.75)' : '#4b5563',
    emptyText: darkMode ? 'rgba(255,255,255,0.5)' : '#6b7280',
    terminalBg: darkMode ? 'rgba(0,0,0,0.3)' : 'rgba(0,0,0,0.03)',
    terminalText: darkMode ? '#22c55e' : '#059669'
  }), [darkMode]);

  // Cargar métricas del sistema
  const loadSystemMetrics = async () => {
    try {
      const token = sessionStorage.getItem('auth_token') || localStorage.getItem('auth_token');
      if (!token) return;

      const headers = { Authorization: `Bearer ${token}` };

      // Cargar métricas del sistema (CPU, RAM, etc.)
      const metricsRes = await fetch(`${API_BASE}/sistema/metrics`, { headers });
      if (metricsRes.ok) {
        const metricsData = await metricsRes.json();
        setSystemMetrics(metricsData);
      }

      // Cargar métricas de la base de datos
      const dbRes = await fetch(`${API_BASE}/sistema/database-metrics`, { headers });
      if (dbRes.ok) {
        const dbData = await dbRes.json();
        setDbMetrics(dbData);
      }

      // Cargar logs del sistema
      const logsRes = await fetch(`${API_BASE}/sistema/logs?limit=10`, { headers });
      if (logsRes.ok) {
        const logsData = await logsRes.json();
        setRecentLogs(logsData);
      }
    } catch (error) {
      console.error('Error loading system metrics:', error);
    }
  };

  useEffect(() => {
    let isMounted = true;

    const loadData = async () => {
      try {
        setLoading(true);
        setShowLoadingModal(true);
        await loadSystemMetrics();
      } catch (error) {
        console.error('Error:', error);
      } finally {
        if (isMounted) {
          setLoading(false);
          setTimeout(() => setShowLoadingModal(false), 300);
        }
      }
    };

    loadData();

    // Actualizar métricas cada 30 segundos
    const interval = setInterval(loadSystemMetrics, 30000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  const getStatusColor = (value: number, threshold: number) => {
    if (value < threshold * 0.6) return '#22c55e';
    if (value < threshold * 0.8) return '#f59e0b';
    return '#ef4444';
  };

  const getLogIcon = (level: string) => {
    switch (level) {
      case 'error': return <AlertTriangle size={14} color="#ef4444" />;
      case 'warn': return <AlertTriangle size={14} color="#f59e0b" />;
      default: return <CheckCircle2 size={14} color="#22c55e" />;
    }
  };

  const systemTiles = [
    {
      key: 'cpu',
      title: 'Uso de CPU',
      value: `${systemMetrics.cpuUsage}%`,
      icon: Cpu,
      iconColor: '#3b82f6',
      accentRgb: '59, 130, 246',
      progress: systemMetrics.cpuUsage
    },
    {
      key: 'memory',
      title: 'Uso de Memoria',
      value: `${systemMetrics.memoryUsage}%`,
      icon: HardDrive,
      iconColor: '#10b981',
      accentRgb: '16, 185, 129',
      progress: systemMetrics.memoryUsage
    },
    {
      key: 'connections',
      title: 'Conexiones Activas',
      value: systemMetrics.activeConnections,
      icon: Zap,
      iconColor: '#f59e0b',
      accentRgb: '245, 158, 11'
    },
    {
      key: 'uptime',
      title: 'Tiempo Activo',
      value: systemMetrics.uptime,
      icon: Clock,
      iconColor: '#22c55e',
      accentRgb: '34, 197, 94'
    },
    {
      key: 'requests',
      title: 'Peticiones/Min',
      value: systemMetrics.requestsPerMinute,
      icon: Activity,
      iconColor: '#8b5cf6',
      accentRgb: '139, 92, 246'
    },
    {
      key: 'errors',
      title: 'Tasa de Errores',
      value: `${systemMetrics.errorRate.toFixed(2)}%`,
      icon: AlertTriangle,
      iconColor: systemMetrics.errorRate > 1 ? '#ef4444' : '#22c55e',
      accentRgb: systemMetrics.errorRate > 1 ? '239, 68, 68' : '34, 197, 94'
    }
  ];

  return (
    <div data-dark={darkMode ? 'true' : 'false'} style={{ background: theme.pageBg, padding: isMobile ? '0.5rem' : '1rem', borderRadius: '1rem' }}>
      {/* Métricas del Sistema - MISMO GRID que admin */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fit, minmax(min(15rem, 90vw), 1fr))',
        gap: isMobile ? '0.75em' : '0.875em',
        marginBottom: isMobile ? '1em' : '1.125em'
      }}>
        {systemTiles.map(({ key, title, value, icon: Icon, iconColor, accentRgb, progress }) => (
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
              <h3 style={{ color: theme.textPrimary, margin: 0, fontSize: isMobile ? '0.7rem' : '0.75rem', fontWeight: 600 }}>{title}</h3>
            </div>
            <p style={{ color: theme.valueText, fontSize: isMobile ? '1.375rem' : '1.5rem', fontWeight: '700', margin: '0 0 0.375em 0', lineHeight: '1', letterSpacing: '-0.02em' }}>
              {loading ? '...' : value}
            </p>
            {progress !== undefined && (
              <div style={{ width: '100%', height: '4px', background: darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)', borderRadius: '2px', overflow: 'hidden' }}>
                <div style={{
                  width: `${progress}%`,
                  height: '100%',
                  background: getStatusColor(progress, 100),
                  transition: 'width 0.3s ease'
                }} />
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Database Metrics - MISMO ESTILO que contenedores del admin */}
      <div style={{
        background: theme.containerBg,
        border: `0.0625rem solid ${theme.containerBorder}`,
        borderRadius: '0.875em',
        padding: '1.125em',
        marginBottom: '1.25em',
        boxShadow: darkMode ? '0 20px 40px rgba(0,0,0,0.35)' : '0 16px 32px rgba(239,68,68,0.12)'
      }}>
        <h3 style={{ color: theme.textPrimary, marginBottom: '1em', display: 'flex', alignItems: 'center', gap: '0.5em' }}>
          <Database size={isMobile ? 17 : 19} color="#ef4444" />
          Estado de la Base de Datos
        </h3>

        <div style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fit, minmax(min(11.25rem, 90vw), 1fr))',
          gap: isMobile ? '0.625em' : '0.75em',
          marginBottom: '1em'
        }}>
          {[{
            label: 'Conexiones Totales',
            value: dbMetrics.totalConnections,
            color: '#3b82f6',
            rgb: '59, 130, 246'
          }, {
            label: 'Consultas Activas',
            value: dbMetrics.activeQueries,
            color: '#10b981',
            rgb: '16, 185, 129'
          }, {
            label: 'Tamaño de BD',
            value: dbMetrics.dbSize,
            color: '#8b5cf6',
            rgb: '139, 92, 246'
          }, {
            label: 'Consultas Lentas',
            value: dbMetrics.slowQueries,
            color: dbMetrics.slowQueries > 0 ? '#ef4444' : '#22c55e',
            rgb: dbMetrics.slowQueries > 0 ? '239, 68, 68' : '34, 197, 94'
          }].map(({ label, value, color, rgb }) => (
            <div
              key={label}
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
              <p style={{ color: theme.textMuted, fontSize: '0.65em', margin: 0 }}>{label}</p>
              <p style={{ color, fontSize: '1.4em', fontWeight: '700', margin: '0.25em 0 0 0' }}>{value}</p>
            </div>
          ))}
        </div>

        <div style={{ padding: '1rem', background: theme.terminalBg, borderRadius: '0.5rem', border: `1px solid ${theme.containerBorder}` }}>
          <p style={{ color: theme.textMuted, margin: '0 0 0.5rem 0', fontSize: '0.75rem', fontWeight: 600 }}>Estado del Pool de Conexiones</p>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <div style={{ flex: 1, height: '8px', background: darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)', borderRadius: '4px', overflow: 'hidden' }}>
              <div style={{
                width: `${(dbMetrics.connectionPool.active / dbMetrics.connectionPool.total) * 100}%`,
                height: '100%',
                background: 'linear-gradient(90deg, #3b82f6, #2563eb)',
                transition: 'width 0.3s ease'
              }} />
            </div>
            <span style={{ color: theme.textPrimary, fontSize: '0.875rem', fontFamily: 'monospace', fontWeight: 600 }}>
              {dbMetrics.connectionPool.active}/{dbMetrics.connectionPool.total}
            </span>
          </div>
          <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
            <span style={{ color: theme.textSecondary, fontSize: '0.75rem' }}>Activas: {dbMetrics.connectionPool.active}</span>
            <span style={{ color: theme.textSecondary, fontSize: '0.75rem' }}>Inactivas: {dbMetrics.connectionPool.idle}</span>
          </div>
        </div>
      </div>

      {/* System Logs - MISMO ESTILO que actividad reciente del admin */}
      <div style={{
        background: theme.containerBg,
        border: `0.0625rem solid ${theme.containerBorder}`,
        borderRadius: '0.875em',
        padding: '1.125em',
        boxShadow: darkMode ? '0 20px 40px rgba(0,0,0,0.35)' : '0 16px 32px rgba(239,68,68,0.12)'
      }}>
        <h3 style={{ color: theme.textPrimary, marginBottom: '1em', display: 'flex', alignItems: 'center', gap: '0.5em' }}>
          <FileText size={isMobile ? 17 : 19} color="#ef4444" />
          Registros del Sistema
        </h3>

        <div style={{ display: 'grid', gap: '0.75em' }}>
          {recentLogs.map((log, index) => {
            const rgbColor = log.level === 'error' ? '239, 68, 68' : log.level === 'warn' ? '245, 158, 11' : '34, 197, 94';
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
                  {getLogIcon(log.level)}
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ color: theme.textPrimary, fontSize: '0.75em', fontWeight: '500', margin: '0 0 0.1875em 0', fontFamily: 'monospace' }}>
                    {log.message}
                  </p>
                  <p style={{ color: theme.textMuted, fontSize: '0.65em', margin: 0 }}>
                    {new Date(log.timestamp).toLocaleTimeString()}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <LoadingModal
        isOpen={showLoadingModal}
        message="Cargando métricas del sistema..."
        darkMode={darkMode}
        duration={500}
        onComplete={() => setShowLoadingModal(false)}
        colorTheme="red"
      />
    </div>
  );
};

export default PanelDashboardSuperAdmin;
