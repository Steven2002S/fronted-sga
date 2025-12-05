import React, { useState, useEffect, useMemo } from 'react';
import {
  FileText,
  Download,
  Filter,
  Search,
  Calendar,
  ChevronDown,
  Users,
  DollarSign,
  BookOpen,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Clock,
  ArrowRight,
  Loader2,
  FileSpreadsheet,
  BarChart3,
  History,
  Eye,
  User,
  Award,
  Target,
  ArrowUp,
  ArrowDown,
  ArrowUpDown
} from 'lucide-react';
import { showToast } from '../../config/toastConfig';
import AdminSectionHeader from '../../components/AdminSectionHeader';
import { useBreakpoints } from '../../hooks/useMediaQuery';
import '../../styles/responsive.css';

const API_BASE = (import.meta as any).env?.VITE_API_URL ? `${(import.meta as any).env.VITE_API_URL}/api` : 'http://localhost:3000/api';

// Tipos
type Curso = {
  id_curso: number;
  codigo_curso: string;
  nombre: string;
  horario: string;
  fecha_inicio: string;
  fecha_fin: string;
  tipo_curso: string;
};

type Periodo = {
  inicio: string;
  fin: string;
  key: string;
};

type DatosReporte = any[];
type Estadisticas = any;

interface ReportesProps {
  darkMode?: boolean;
}

const Reportes: React.FC<ReportesProps> = ({ darkMode: inheritedDarkMode }) => {
  const { isMobile, isSmallScreen } = useBreakpoints();
  const [darkMode, setDarkMode] = useState(() => {
    if (inheritedDarkMode !== undefined) {
      return inheritedDarkMode;
    }
    const saved = localStorage.getItem('admin-dark-mode');
    return saved !== null ? JSON.parse(saved) : true;
  });

  useEffect(() => {
    if (inheritedDarkMode !== undefined) {
      setDarkMode(inheritedDarkMode);
    }
  }, [inheritedDarkMode]);

  useEffect(() => {
    if (inheritedDarkMode !== undefined) {
      return;
    }

    const interval = setInterval(() => {
      const saved = localStorage.getItem('admin-dark-mode');
      const newMode = saved !== null ? JSON.parse(saved) : true;
      setDarkMode((prev) => (prev === newMode ? prev : newMode));
    }, 250);

    return () => clearInterval(interval);
  }, [inheritedDarkMode]);

  const themeColors = useMemo(() => ({
    textPrimary: darkMode ? '#f8fafc' : '#1f2937',
    textSecondary: darkMode ? 'rgba(248,250,252,0.85)' : 'rgba(30,41,59,0.9)',
    textMuted: darkMode ? 'rgba(248,250,252,0.7)' : 'rgba(71,85,105,0.85)',
    panelBg: darkMode
      ? 'linear-gradient(135deg, rgba(0,0,0,0.9) 0%, rgba(26,26,26,0.9) 100%)'
      : 'linear-gradient(135deg, rgba(255,255,255,0.98) 0%, rgba(241,245,249,0.98) 100%)',
    panelBorder: darkMode ? 'rgba(239, 68, 68, 0.25)' : 'rgba(239, 68, 68, 0.14)',
    softCardBg: darkMode ? 'rgba(255,255,255,0.07)' : 'rgba(15,23,42,0.04)',
    softCardHover: darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(15,23,42,0.08)',
    softCardBorder: darkMode ? 'rgba(255,255,255,0.12)' : 'rgba(15,23,42,0.12)',
    tabInactive: darkMode ? 'rgba(255,255,255,0.7)' : 'rgba(71,85,105,0.8)',
    inputBg: darkMode ? 'rgba(255,255,255,0.08)' : 'rgba(15,23,42,0.05)',
    inputBorder: darkMode ? 'rgba(255,255,255,0.2)' : 'rgba(15,23,42,0.15)',
    pdfText: darkMode ? '#fbbf24' : '#b45309',
    pdfBg: darkMode ? 'rgba(245, 158, 11, 0.2)' : 'rgba(253, 230, 138, 0.6)',
    pdfBgDisabled: darkMode ? 'rgba(245, 158, 11, 0.1)' : 'rgba(253, 230, 138, 0.35)',
    pdfBorder: darkMode ? 'rgba(245, 158, 11, 0.35)' : 'rgba(217, 119, 6, 0.35)',
    excelText: darkMode ? '#10b981' : '#047857',
    excelBg: darkMode ? 'rgba(16, 185, 129, 0.2)' : 'rgba(209, 250, 229, 0.64)',
    excelBgDisabled: darkMode ? 'rgba(16, 185, 129, 0.1)' : 'rgba(209, 250, 229, 0.36)',
    excelBorder: darkMode ? 'rgba(16, 185, 129, 0.3)' : 'rgba(5, 150, 105, 0.35)',
    shadow: darkMode ? '0 0.125rem 0.75rem rgba(0,0,0,0.35)' : '0 0.25rem 0.75rem rgba(15,23,42,0.1)'
  }), [darkMode]);

  const baseSelectStyle: React.CSSProperties = {
    padding: '8px 0.75rem',
    background: themeColors.inputBg,
    border: `1px solid ${themeColors.inputBorder}`,
    borderRadius: '0.5rem',
    color: themeColors.textPrimary,
    fontSize: '0.9rem'
  };

  const baseInputStyle: React.CSSProperties = {
    background: themeColors.inputBg,
    border: `1px solid ${themeColors.inputBorder}`,
    borderRadius: '0.5rem',
    color: themeColors.textPrimary,
    fontSize: '0.85rem'
  };

  const getToggleButtonStyle = (active: boolean): React.CSSProperties => ({
    padding: '8px 0.75rem',
    background: active
      ? (darkMode ? 'rgba(239, 68, 68, 0.22)' : 'rgba(239, 68, 68, 0.12)')
      : themeColors.inputBg,
    border: active ? '1px solid rgba(239, 68, 68, 0.45)' : `1px solid ${themeColors.inputBorder}`,
    borderRadius: '0.5rem',
    color: themeColors.textPrimary,
    fontSize: '0.8rem',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '0.375rem',
    fontWeight: active ? 600 : 400,
    transition: 'background 0.2s ease, border 0.2s ease'
  });

  const tabButtonStyle = (active: boolean): React.CSSProperties => ({
    padding: '10px 0.875rem',
    background: 'transparent',
    border: 'none',
    borderBottom: active ? '2px solid #ef4444' : '2px solid transparent',
    color: active ? '#ef4444' : themeColors.tabInactive,
    fontSize: '0.78rem',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'color 0.2s ease, border-bottom-color 0.2s ease',
    display: 'flex',
    alignItems: 'center',
    gap: '0.35rem'
  });

  const hexToRgb = (hex: string) => {
    const sanitized = hex.replace('#', '');
    const bigint = parseInt(sanitized, 16);
    return {
      r: (bigint >> 16) & 255,
      g: (bigint >> 8) & 255,
      b: bigint & 255
    };
  };

  const buildMetricCardStyle = (accent: string): React.CSSProperties => {
    const { r, g, b } = hexToRgb(accent);
    return {
      background: darkMode
        ? `linear-gradient(135deg, rgba(${r}, ${g}, ${b}, 0.18) 0%, rgba(${r}, ${g}, ${b}, 0.08) 100%)`
        : `linear-gradient(135deg, rgba(${r}, ${g}, ${b}, 0.12) 0%, rgba(255,255,255,0.95) 100%)`,
      border: `1px solid rgba(${r}, ${g}, ${b}, 0.28)`,
      borderRadius: '0.625rem',
      padding: '0.875rem',
      display: 'flex',
      alignItems: 'center',
      gap: '0.75rem',
      boxShadow: themeColors.shadow
    };
  };

  const metricValueStyle = (accent?: string): React.CSSProperties => ({
    fontSize: '1.5rem',
    fontWeight: 700,
    color: accent ?? themeColors.textPrimary
  });

  const metricLabelStyle: React.CSSProperties = {
    fontSize: '0.75rem',
    color: themeColors.textMuted
  };

  // Estilos para scrollbar horizontal
  const scrollbarStyles = `
    .metricas-scroll {
      -webkit-overflow-scrolling: touch;
      scrollbar-width: thin;
      scrollbar-color: rgba(239, 68, 68, 0.5) rgba(255, 255, 255, 0.05);
    }
    
    .metricas-scroll::-webkit-scrollbar {
      height: 0.375rem;
    }
    .metricas-scroll::-webkit-scrollbar-track {
      background: rgba(255, 255, 255, 0.05);
      border-radius: 0.625rem;
    }
    .metricas-scroll::-webkit-scrollbar-thumb {
      background: rgba(239, 68, 68, 0.5);
      border-radius: 0.625rem;
    }
    .metricas-scroll::-webkit-scrollbar-thumb:hover {
      background: rgba(239, 68, 68, 0.7);
    }
    
    /* Forzar que las tarjetas no se envuelvan */
    .metricas-scroll > div {
      flex-shrink: 0 !important;
      min-width: 9.375rem !important;
    }
  `;

  const colorNormalizationStyles = `
    .reportes-admin-wrapper [data-keep-color="true"],
    .reportes-admin-wrapper [data-keep-color="true"] * {
      color: #fff !important;
      stroke: #fff !important;
    }

    .reportes-admin-wrapper[data-dark="false"] [style*="color: #fff"]:not([data-keep-color="true"]) {
      color: ${themeColors.textPrimary} !important;
    }

    .reportes-admin-wrapper[data-dark="false"] [style*="color:#fff"]:not([data-keep-color="true"]) {
      color: ${themeColors.textPrimary} !important;
    }

    .reportes-admin-wrapper[data-dark="false"] [style*="color: rgb(255, 255, 255)"]:not([data-keep-color="true"]) {
      color: ${themeColors.textPrimary} !important;
    }

    .reportes-admin-wrapper[data-dark="false"] [style*="rgba(255,255,255,0.9)"]:not([data-keep-color="true"]) ,
    .reportes-admin-wrapper[data-dark="false"] [style*="rgba(255, 255, 255, 0.9)"]:not([data-keep-color="true"]) {
      color: ${themeColors.textPrimary} !important;
    }

    .reportes-admin-wrapper[data-dark="false"] [style*="rgba(255,255,255,0.8)"]:not([data-keep-color="true"]) ,
    .reportes-admin-wrapper[data-dark="false"] [style*="rgba(255, 255, 255, 0.8)"]:not([data-keep-color="true"]) ,
    .reportes-admin-wrapper[data-dark="false"] [style*="rgba(255,255,255,0.7)"]:not([data-keep-color="true"]) ,
    .reportes-admin-wrapper[data-dark="false"] [style*="rgba(255, 255, 255, 0.7)"]:not([data-keep-color="true"]) ,
    .reportes-admin-wrapper[data-dark="false"] [style*="rgba(255,255,255,0.6)"]:not([data-keep-color="true"]) ,
    .reportes-admin-wrapper[data-dark="false"] [style*="rgba(255, 255, 255, 0.6)"]:not([data-keep-color="true"]) {
      color: ${themeColors.textSecondary} !important;
    }

    .reportes-admin-wrapper[data-dark="false"] [style*="rgba(255,255,255,0.5)"]:not([data-keep-color="true"]) ,
    .reportes-admin-wrapper[data-dark="false"] [style*="rgba(255, 255, 255, 0.5)"]:not([data-keep-color="true"]) {
      color: ${themeColors.textMuted} !important;
    }
  `;

  // Estados principales
  const [tipoReporte, setTipoReporte] = useState<'estudiantes' | 'cursos' | 'financiero'>('estudiantes');
  const [periodosSeleccionados, setPeriodosSeleccionados] = useState({
    estudiantes: 'todos',
    cursos: 'todos',
    financiero: 'todos'
  });
  const [periodosDisponibles, setPeriodosDisponibles] = useState<Periodo[]>([]);
  const [fechaInicio, setFechaInicio] = useState('2025-01-01');
  const [fechaFin, setFechaFin] = useState('2025-12-31');

  // Filtros específicos por tipo de reporte
  const [filtroEstadoEstudiante, setFiltroEstadoEstudiante] = useState('todos');
  const [filtroCurso, setFiltroCurso] = useState('');
  const [filtroEstadoPago, setFiltroEstadoPago] = useState('todos');

  // Nuevos filtros para cursos
  const [filtroEstadoCursoReporte, setFiltroEstadoCursoReporte] = useState('todos');
  const [filtroOcupacionCurso, setFiltroOcupacionCurso] = useState('todos');
  const [filtroHorarioCurso, setFiltroHorarioCurso] = useState('todos');

  // Nuevos filtros para financiero
  const [filtroMetodoPago, setFiltroMetodoPago] = useState('todos');
  const [filtroCursoFinanciero, setFiltroCursoFinanciero] = useState('');
  const [filtroEstadoCursoFinanciero, setFiltroEstadoCursoFinanciero] = useState('todos');
  const [filtroHorarioFinanciero, setFiltroHorarioFinanciero] = useState('todos');

  // Estados de datos
  const [datosReporte, setDatosReporte] = useState<DatosReporte | null>(null);
  const [estadisticas, setEstadisticas] = useState<Estadisticas | null>(null);
  const [cursosDisponibles, setCursosDisponibles] = useState<Curso[]>([]);
  const [cursosFiltrados, setCursosFiltrados] = useState<Curso[]>([]);

  // Estados de UI
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [descargando, setDescargando] = useState(false);

  // Estados para Historial
  const [vistaActual, setVistaActual] = useState<'generar' | 'historial'>('generar');
  const [historialReportes, setHistorialReportes] = useState<any[]>([]);
  const [loadingHistorial, setLoadingHistorial] = useState(false);
  const [filtroTipoHistorial, setFiltroTipoHistorial] = useState('todos');

  // Nuevos estados para mejoras
  const [filtroHorario, setFiltroHorario] = useState<'todos' | 'matutino' | 'vespertino'>('todos');
  const [busquedaRapida, setBusquedaRapida] = useState('');
  const [ordenamiento, setOrdenamiento] = useState<'nombre' | 'fecha' | 'monto' | 'capacidad'>('fecha');
  const [ordenAscendente, setOrdenAscendente] = useState(false);
  const [paginaActualFinanciero, setPaginaActualFinanciero] = useState(1);
  const ITEMS_POR_PAGINA_FINANCIERO = 10;
  const [tarjetasExpandidas, setTarjetasExpandidas] = useState<Set<string>>(new Set());
  const [paginaActualCursos, setPaginaActualCursos] = useState(1);
  const ITEMS_POR_PAGINA_CURSOS = 12;
  const [busquedaCursos, setBusquedaCursos] = useState('');
  const [paginaActualEstudiantes, setPaginaActualEstudiantes] = useState(1);
  const ITEMS_POR_PAGINA_ESTUDIANTES = 12;
  const [paginaActualHistorial, setPaginaActualHistorial] = useState(1);
  const ITEMS_POR_PAGINA_HISTORIAL = 5;

  const reportesDisponibles = [
    {
      id: 'estudiantes',
      titulo: 'Reporte de Estudiantes',
      descripcion: 'Estadísticas de inscripciones y rendimiento académico',
      icono: Users,
      color: '#ef4444'
    },
    {
      id: 'cursos',
      titulo: 'Reporte de Cursos',
      descripcion: 'Análisis de popularidad y ocupación de cursos',
      icono: BookOpen,
      color: '#ef4444'
    },
    {
      id: 'financiero',
      titulo: 'Reporte Financiero',
      descripcion: 'Ingresos, pagos y estado financiero',
      icono: DollarSign,
      color: '#ef4444'
    }
  ];

  // Cargar datos iniciales
  useEffect(() => {
    const token = sessionStorage.getItem('auth_token');
    console.log('Token disponible:', !!token);
    if (token) {
      cargarCursosParaFiltro();
      cargarPeriodosDisponibles();
    } else {
      console.error('No hay token disponible');
    }
  }, []);

  // Actualizar fechas cuando cambia el período seleccionado
  // Actualizar fechas cuando cambia el período seleccionado del reporte actual
  // Actualizar fechas cuando cambia el período seleccionado del reporte actual
  useEffect(() => {
    const periodoActual = periodosSeleccionados[tipoReporte];

    if (periodoActual === 'todos') {
      // Obtener rango dinámico desde el backend
      const fetchRangoDinamico = async () => {
        try {
          const token = sessionStorage.getItem('auth_token');
          if (!token) return;

          const response = await fetch(`${API_BASE}/reportes/rango-fechas`, {
            headers: { Authorization: `Bearer ${token}` }
          });

          if (response.ok) {
            const data = await response.json();
            if (data.success) {
              setFechaInicio(data.data.fechaInicio);
              setFechaFin(data.data.fechaFin);
            } else {
              // Fallback si falla
              setFechaInicio('2020-01-01');
              setFechaFin('2050-12-31');
            }
          } else {
            // Fallback si falla
            setFechaInicio('2020-01-01');
            setFechaFin('2050-12-31');
          }
        } catch (error) {
          console.error('Error obteniendo rango dinámico:', error);
          // Fallback si falla
          setFechaInicio('2020-01-01');
          setFechaFin('2050-12-31');
        }
      };

      fetchRangoDinamico();
    } else if (periodoActual !== '') {
      const [inicio, fin] = periodoActual.split('|');
      setFechaInicio(inicio);
      setFechaFin(fin);
    }
  }, [periodosSeleccionados, tipoReporte]);

  // Cargar períodos disponibles desde cursos
  const cargarPeriodosDisponibles = async () => {
    try {
      console.log('Iniciando carga de períodos...');
      const token = sessionStorage.getItem('auth_token');
      if (!token) {
        console.error('No hay token disponible para cargar períodos');
        return;
      }

      console.log('Llamando a:', `${API_BASE}/reportes/cursos-filtro`);
      const response = await fetch(`${API_BASE}/reportes/cursos-filtro`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      console.log('Status de respuesta:', response.status);

      if (response.status === 401) {
        console.error('-Token inválido o expirado al cargar períodos');
        return;
      }

      const data = await response.json();
      console.log('Cursos recibidos para períodos:', data);
      console.log('Cantidad de cursos:', data.data?.length || 0);

      if (data.success && data.data.length > 0) {
        // Extraer períodos únicos de los cursos
        const periodosUnicos = new Set<string>();
        data.data.forEach((curso: Curso) => {
          if (curso.fecha_inicio && curso.fecha_fin) {
            const inicio = curso.fecha_inicio.split('T')[0];
            const fin = curso.fecha_fin.split('T')[0];
            periodosUnicos.add(`${inicio}|${fin}`);
          }
        });

        console.log('Períodos únicos encontrados:', Array.from(periodosUnicos));

        // Convertir a array y ordenar por fecha más reciente
        const periodosArray: Periodo[] = Array.from(periodosUnicos)
          .map((periodo) => {
            const [inicio, fin] = periodo.split('|');
            return { inicio, fin, key: periodo };
          })
          .sort((a, b) => new Date(b.inicio).getTime() - new Date(a.inicio).getTime());

        setPeriodosDisponibles(periodosArray);

        // Establecer período por defecto: TODOS
        // Establecer período por defecto: TODOS (ya está inicializado en el estado)
        // setPeriodosSeleccionados se mantiene con los valores iniciales 'todos'
      } else {
        // Si no hay cursos, usar año actual
        const hoy = new Date();
        const añoActual = hoy.getFullYear();
        setFechaInicio(`${añoActual}-01-01`);
        setFechaFin(`${añoActual}-12-31`);
      }
    } catch (error) {
      console.error('Error cargando períodos:', error);
      // Fallback al año actual
      const hoy = new Date();
      const añoActual = hoy.getFullYear();
      setFechaInicio(`${añoActual}-01-01`);
      setFechaFin(`${añoActual}-12-31`);
    }
  };

  const cargarCursosParaFiltro = async () => {
    try {
      const token = sessionStorage.getItem('auth_token');
      if (!token) {
        console.log('No hay token disponible');
        return;
      }

      const response = await fetch(`${API_BASE}/reportes/cursos-filtro`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (response.status === 401) {
        console.error('Token inválido o expirado');
        return;
      }

      const data = await response.json();
      console.log('Cursos recibidos para filtro:', data);

      if (data.success) {
        console.log('Cursos disponibles:', data.data);
        setCursosDisponibles(data.data);
        setCursosFiltrados(data.data); // Inicialmente mostrar todos
      } else {
        console.error('Error en respuesta de cursos:', data);
      }
    } catch (error) {
      console.error('Error cargando cursos:', error);
    }
  };

  // Cargar historial de reportes
  const cargarHistorial = async () => {
    setLoadingHistorial(true);
    try {
      const token = sessionStorage.getItem('auth_token');
      if (!token) {
        showToast.error('Sesión expirada', darkMode);
        return;
      }

      const response = await fetch(`${API_BASE}/reportes/historial?limite=50`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setHistorialReportes(data.data || []);
      } else {
        showToast.error('Error al cargar historial', darkMode);
      }
    } catch (error) {
      console.error('Error cargando historial:', error);
      showToast.error('Error al cargar historial', darkMode);
    } finally {
      setLoadingHistorial(false);
    }
  };

  // Cargar historial cuando se cambia a esa vista
  useEffect(() => {
    if (vistaActual === 'historial') {
      cargarHistorial();
    }
  }, [vistaActual]);

  // Resetear página del historial cuando cambia el filtro
  useEffect(() => {
    setPaginaActualHistorial(1);
  }, [filtroTipoHistorial]);

  // Filtrar cursos según el período seleccionado
  // Filtrar cursos según el período seleccionado
  useEffect(() => {
    const periodoActual = periodosSeleccionados[tipoReporte];
    console.log('Filtrando cursos');
    console.log('Período seleccionado:', periodoActual);
    console.log('Cursos disponibles:', cursosDisponibles.length);

    if (periodoActual === 'todos') {
      console.log('Mostrando todos los cursos');
      setCursosFiltrados(cursosDisponibles);
    } else {
      const periodo = periodosDisponibles.find(p => p.key === periodoActual);
      console.log('Período encontrado:', periodo);

      if (periodo) {
        const cursosFiltradosPorPeriodo = cursosDisponibles.filter(curso => {
          // Normalizar fechas para comparar solo YYYY-MM-DD
          const cursoInicio = curso.fecha_inicio?.split('T')[0] || curso.fecha_inicio;
          const cursoFin = curso.fecha_fin?.split('T')[0] || curso.fecha_fin;
          const periodoInicio = periodo.inicio?.split('T')[0] || periodo.inicio;
          const periodoFin = periodo.fin?.split('T')[0] || periodo.fin;

          const coincide = cursoInicio === periodoInicio && cursoFin === periodoFin;
          console.log(`Curso ${curso.nombre}: inicio=${cursoInicio} vs ${periodoInicio}, fin=${cursoFin} vs ${periodoFin} → ${coincide ? 'Mostrando' : 'Ocultando'}`);
          return coincide;
        });
        console.log('Cursos filtrados:', cursosFiltradosPorPeriodo.length);
        setCursosFiltrados(cursosFiltradosPorPeriodo);
      }
    }
    // Resetear el curso seleccionado cuando cambia el período
    setFiltroCurso('');
  }, [periodosSeleccionados, tipoReporte, cursosDisponibles, periodosDisponibles]);

  // Generar reporte (vista previa)
  const generarReporte = async () => {
    setLoading(true);
    setError('');
    setPaginaActualFinanciero(1);
    setPaginaActualCursos(1);
    setPaginaActualEstudiantes(1);

    try {
      // Validar que las fechas estén disponibles
      if (!fechaInicio || !fechaFin) {
        setError('Por favor espera a que se carguen los períodos disponibles');
        setLoading(false);
        return;
      }

      console.log('Generando reporte con:', { fechaInicio, fechaFin, tipoReporte });

      let url = '';
      let params = new URLSearchParams({
        fechaInicio,
        fechaFin
      });

      // Construir URL y parámetros según tipo de reporte
      switch (tipoReporte) {
        case 'estudiantes':
          url = `${API_BASE}/reportes/estudiantes`;
          if (filtroEstadoEstudiante !== 'todos') params.append('estado', filtroEstadoEstudiante);
          if (filtroCurso) params.append('idCurso', filtroCurso);
          if (filtroHorario !== 'todos') params.append('horario', filtroHorario);
          console.log('Filtros estudiantes:', { estado: filtroEstadoEstudiante, curso: filtroCurso, horario: filtroHorario });
          break;
        case 'cursos':
          url = `${API_BASE}/reportes/cursos`;
          if (filtroEstadoCursoReporte !== 'todos') params.append('estado', filtroEstadoCursoReporte);
          if (filtroOcupacionCurso !== 'todos') params.append('ocupacion', filtroOcupacionCurso);
          if (filtroHorarioCurso !== 'todos') params.append('horario', filtroHorarioCurso);
          console.log('Filtros cursos:', {
            estado: filtroEstadoCursoReporte,
            ocupacion: filtroOcupacionCurso,
            horario: filtroHorarioCurso
          });
          break;
        case 'financiero':
          url = `${API_BASE}/reportes/financiero`;
          if (filtroCursoFinanciero) params.append('idCurso', filtroCursoFinanciero);
          if (filtroEstadoCursoFinanciero !== 'todos') params.append('estadoCurso', filtroEstadoCursoFinanciero);
          if (filtroEstadoPago !== 'todos') params.append('estadoPago', filtroEstadoPago);
          if (filtroMetodoPago !== 'todos') params.append('metodoPago', filtroMetodoPago);
          if (filtroHorarioFinanciero !== 'todos') params.append('horario', filtroHorarioFinanciero);
          console.log('Filtros financiero:', {
            curso: filtroCursoFinanciero,
            estadoCurso: filtroEstadoCursoFinanciero,
            estadoPago: filtroEstadoPago,
            metodoPago: filtroMetodoPago,
            horario: filtroHorarioFinanciero
          });
          break;
        default:
          throw new Error('Tipo de reporte no válido');
      }

      console.log('URL completa:', `${url}?${params}`);

      const response = await fetch(`${url}?${params}`, {
        headers: {
          Authorization: `Bearer ${sessionStorage.getItem('auth_token') || ''}`
        }
      });

      console.log('Status de respuesta:', response.status);

      const data = await response.json();
      console.log('Datos recibidos:', data);

      if (response.status === 401) {
        setError('Sesión expirada. Por favor, vuelve a iniciar sesión.');
        setTimeout(() => {
          sessionStorage.removeItem('auth_token');
          sessionStorage.removeItem('auth_user');
          window.location.href = '/aula-virtual';
        }, 2000);
        return;
      }

      if (data.success) {
        console.log('Datos del reporte:', data.data.datos.length, 'registros');
        console.log('Estadísticas:', data.data.estadisticas);
        setDatosReporte(data.data.datos);
        setEstadisticas(data.data.estadisticas);
      } else {
        throw new Error(data.message || 'Error al generar el reporte');
      }
    } catch (error: any) {
      console.error(' Error generando reporte:', error);
      setError(error.message || 'Error al generar el reporte');
    } finally {
      setLoading(false);
    }
  };
  // Toggle expandir/colapsar tarjeta financiera
  const toggleTarjetaFinanciera = (cedula: string) => {
    setTarjetasExpandidas(prev => {
      const nuevo = new Set(prev);
      if (nuevo.has(cedula)) {
        nuevo.delete(cedula);
      } else {
        nuevo.add(cedula);
      }
      return nuevo;
    });
  };

  // Descargar archivo
  const descargarArchivo = async (formato: string) => {
    setDescargando(true);
    try {
      let url = '';
      let params = new URLSearchParams({ fechaInicio, fechaFin });

      switch (tipoReporte) {
        case 'estudiantes':
          // Usar ruta v2 para Excel (con historial), ruta normal para PDF
          url = formato === 'excel'
            ? `${API_BASE}/reportes/estudiantes/excel-v2`
            : `${API_BASE}/reportes/estudiantes/${formato}`;
          if (filtroEstadoEstudiante !== 'todos') params.append('estado', filtroEstadoEstudiante);
          if (filtroCurso) params.append('idCurso', filtroCurso);
          if (filtroHorario !== 'todos') params.append('horario', filtroHorario);
          break;
        case 'cursos':
          // Usar ruta v2 para Excel (con historial), ruta normal para PDF
          url = formato === 'excel'
            ? `${API_BASE}/reportes/cursos/excel-v2`
            : `${API_BASE}/reportes/cursos/${formato}`;
          if (filtroEstadoCursoReporte !== 'todos') params.append('estado', filtroEstadoCursoReporte);
          if (filtroOcupacionCurso !== 'todos') params.append('ocupacion', filtroOcupacionCurso);
          if (filtroHorarioCurso !== 'todos') params.append('horario', filtroHorarioCurso);
          break;
        case 'financiero':
          // Usar ruta v2 para Excel (con historial), ruta normal para PDF
          url = formato === 'excel'
            ? `${API_BASE}/reportes/financiero/excel-v2`
            : `${API_BASE}/reportes/financiero/${formato}`;
          if (filtroCursoFinanciero) params.append('idCurso', filtroCursoFinanciero);
          if (filtroEstadoCursoFinanciero !== 'todos') params.append('estadoCurso', filtroEstadoCursoFinanciero);
          if (filtroEstadoPago !== 'todos') params.append('estadoPago', filtroEstadoPago);
          if (filtroMetodoPago !== 'todos') params.append('metodoPago', filtroMetodoPago);
          if (filtroHorarioFinanciero !== 'todos') params.append('horario', filtroHorarioFinanciero);
          break;
        default:
          alert(`${formato.toUpperCase()} no disponible para este tipo de reporte`);
          return;
      }

      const token = sessionStorage.getItem('auth_token');
      if (!token) {
        alert('Sesión expirada. Por favor, vuelve a iniciar sesión.');
        return;
      }

      const response = await fetch(`${url}?${params}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      // Obtener nombre del archivo desde el header Content-Disposition del servidor
      const contentDisposition = response.headers.get('Content-Disposition');
      let nombreArchivo = `Reporte_${tipoReporte}_${Date.now()}.${formato === 'pdf' ? 'pdf' : 'xlsx'}`;

      console.log('📥 Content-Disposition recibido:', contentDisposition);

      if (contentDisposition) {
        // Intentar varios patrones de extracción
        const filenameRegex = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/;
        const matches = filenameRegex.exec(contentDisposition);

        if (matches != null && matches[1]) {
          nombreArchivo = matches[1].replace(/['"]/g, '').trim();
          console.log('✅ Nombre extraído del header:', nombreArchivo);
        } else {
          // Intentar con filename*=UTF-8''
          const utf8Regex = /filename\*=UTF-8''([^;\n]*)/;
          const utf8Matches = utf8Regex.exec(contentDisposition);
          if (utf8Matches != null && utf8Matches[1]) {
            nombreArchivo = decodeURIComponent(utf8Matches[1]);
            console.log('✅ Nombre extraído (UTF-8):', nombreArchivo);
          }
        }
      } else {
        console.warn('⚠️ No se recibió Content-Disposition del servidor');
      }

      const blob = await response.blob();
      const urlBlob = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = urlBlob;
      link.download = nombreArchivo;
      console.log('📥 Descargando archivo como:', nombreArchivo);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(urlBlob);

      // Mostrar mensaje de éxito con trazabilidad
      if (formato === 'excel') {
        showToast.success('Reporte descargado y guardado en historial', darkMode);
      } else {
        showToast.success('Reporte descargado exitosamente', darkMode);
      }
    } catch (error) {
      console.error(`Error descargando ${formato}:`, error);
      showToast.error(`Error al descargar el ${formato.toUpperCase()}`, darkMode);
    } finally {
      setDescargando(false);
    }
  };

  // Procesar y filtrar datos con useMemo para optimizar (solo búsqueda y ordenamiento)
  const datosProcesados = useMemo(() => {
    if (!datosReporte) return [];

    let datos = [...datosReporte];

    // Aplicar búsqueda rápida (solo en frontend)
    if (busquedaRapida.trim()) {
      const busqueda = busquedaRapida.toLowerCase();
      datos = datos.filter((item: any) => {
        const nombre = `${item.nombre || item.nombre_estudiante || item.nombre_curso || ''} ${item.apellido || item.apellido_estudiante || ''}`.toLowerCase();
        const curso = (item.nombre_curso || '').toLowerCase();
        return nombre.includes(busqueda) || curso.includes(busqueda);
      });
    }

    // Aplicar ordenamiento (solo en frontend)
    datos.sort((a: any, b: any) => {
      let comparacion = 0;

      if (ordenamiento === 'nombre') {
        const nombreA = `${a.nombre || a.nombre_estudiante || a.nombre_curso || ''} ${a.apellido || a.apellido_estudiante || ''}`;
        const nombreB = `${b.nombre || b.nombre_estudiante || b.nombre_curso || ''} ${b.apellido || b.apellido_estudiante || ''}`;
        comparacion = nombreA.localeCompare(nombreB);
      } else if (ordenamiento === 'fecha') {
        const fechaA = new Date(a.fecha_inscripcion || a.fecha_pago || a.fecha_vencimiento || a.fecha_inicio || 0).getTime();
        const fechaB = new Date(b.fecha_inscripcion || b.fecha_pago || b.fecha_vencimiento || b.fecha_inicio || 0).getTime();
        comparacion = fechaB - fechaA; // Más reciente primero por defecto
      } else if (ordenamiento === 'monto' && tipoReporte === 'financiero') {
        comparacion = parseFloat(b.monto || 0) - parseFloat(a.monto || 0); // Mayor primero por defecto
      } else if (ordenamiento === 'capacidad' && tipoReporte === 'cursos') {
        comparacion = parseInt(b.capacidad_maxima || 0) - parseInt(a.capacidad_maxima || 0); // Mayor primero por defecto
      }

      return ordenAscendente ? -comparacion : comparacion;
    });

    return datos;
  }, [datosReporte, busquedaRapida, ordenamiento, ordenAscendente, tipoReporte]);

  // Calcular estadísticas mejoradas
  const estadisticasCalculadas = useMemo(() => {
    if (!datosProcesados || datosProcesados.length === 0) return null;

    if (tipoReporte === 'estudiantes') {
      // Get unique students
      const uniqueStudents = new Set(datosProcesados.map((e: any) => e.id_usuario));
      const total = uniqueStudents.size;

      // Helper to count unique students by condition
      const countUniqueByCondition = (condition: (e: any) => boolean) => {
        const matchingStudents = new Set();
        datosProcesados.forEach((e: any) => {
          if (condition(e)) {
            matchingStudents.add(e.id_usuario);
          }
        });
        return matchingStudents.size;
      };

      // Aprobados: estado 'aprobado', 'graduado' o nota >= 7
      const aprobados = countUniqueByCondition((e: any) =>
        e.estado_academico === 'aprobado' ||
        e.estado_academico === 'graduado' ||
        (e.nota_final && parseFloat(e.nota_final) >= 7)
      );

      const tasaAprobacion = total > 0 ? ((aprobados / total) * 100).toFixed(1) : '0';

      return {
        total,
        aprobados,
        tasaAprobacion,
        // En curso: 'inscrito' o 'activo' y que no estén aprobados/graduados
        enCurso: countUniqueByCondition((e: any) =>
          (!e.estado_academico || ['inscrito', 'activo'].includes(e.estado_academico)) &&
          (!e.nota_final || parseFloat(e.nota_final) < 7)
        ),
        reprobados: countUniqueByCondition((e: any) => e.estado_academico === 'reprobado')
      };
    } else if (tipoReporte === 'financiero') {
      const total = datosProcesados.length;
      const ingresoTotal = datosProcesados.reduce((sum: number, p: any) => sum + parseFloat(p.monto || 0), 0);
      const promedio = total > 0 ? ingresoTotal / total : 0;
      const verificados = datosProcesados.filter((p: any) => p.estado === 'verificado').length;

      return {
        total,
        ingresoTotal,
        promedio,
        verificados,
        pendientes: datosProcesados.filter((p: any) => p.estado === 'pendiente' || p.estado === 'pagado').length
      };
    } else if (tipoReporte === 'cursos') {
      const total = datosProcesados.length;
      const capacidadTotal = datosProcesados.reduce((sum: number, c: any) => sum + parseInt(c.capacidad_maxima || 0), 0);
      const capacidadPromedio = total > 0 ? Math.round(capacidadTotal / total) : 0;
      const activos = datosProcesados.filter((c: any) => c.estado === 'activo').length;
      const finalizados = datosProcesados.filter((c: any) => c.estado === 'finalizado').length;

      return {
        total,
        capacidadPromedio,
        activos,
        finalizados,
        cancelados: datosProcesados.filter((c: any) => c.estado === 'cancelado').length
      };
    }

    return null;
  }, [datosProcesados, tipoReporte]);

  // Renderizar filtros específicos
  const renderFiltrosEspecificos = () => {
    if (tipoReporte === 'estudiantes') {
      return (
        <>
          <div style={{
            display: 'flex',
            flexDirection: isMobile ? 'column' : 'row',
            alignItems: isMobile ? 'stretch' : 'center',
            gap: '0.5rem',
            flex: isMobile ? '1' : 'initial'
          }}>
            <label style={{ color: themeColors.textSecondary, fontSize: '0.9rem' }}>Curso:</label>
            <select
              value={filtroCurso}
              onChange={(e) => setFiltroCurso(e.target.value)}
              style={{
                ...baseSelectStyle,
                minWidth: isMobile ? 'auto' : '18.75rem',
                width: isMobile ? '100%' : 'auto'
              }}
            >
              <option value="">Todos los cursos</option>
              {cursosFiltrados.map((curso: Curso) => {
                // Formatear fechas al estilo: (13 Oct 2025 - 13 Dic 2025)
                const formatearFecha = (fecha: string): string => {
                  if (!fecha) return '';
                  // Extraer año, mes, día directamente del string YYYY-MM-DD
                  const [año, mes, dia] = fecha.split('T')[0].split('-');
                  const meses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
                  const mesNombre = meses[parseInt(mes) - 1];
                  return `${parseInt(dia)} ${mesNombre} ${año}`;
                };

                const fechaInicio = formatearFecha(curso.fecha_inicio);
                const fechaFin = formatearFecha(curso.fecha_fin);
                const periodo = fechaInicio && fechaFin ? ` (${fechaInicio} - ${fechaFin})` : '';

                // Agregar horario al nombre si existe
                const horario = curso.horario ? ` - ${curso.horario.charAt(0).toUpperCase() + curso.horario.slice(1)}` : '';

                return (
                  <option key={curso.id_curso} value={curso.id_curso}>
                    {curso.nombre}{horario}{periodo}
                  </option>
                );
              })}
            </select>
          </div>
          <div style={{
            display: 'flex',
            flexDirection: isMobile ? 'column' : 'row',
            alignItems: isMobile ? 'stretch' : 'center',
            gap: '0.5rem',
            flex: isMobile ? '1' : 'initial'
          }}>
            <label style={{ color: themeColors.textSecondary, fontSize: '0.9rem' }}>Estado:</label>
            <select
              value={filtroEstadoEstudiante}
              onChange={(e) => setFiltroEstadoEstudiante(e.target.value)}
              style={{
                ...baseSelectStyle,
                width: isMobile ? '100%' : 'auto'
              }}
            >
              <option value="todos">Todos</option>
              <option value="activo">Activos</option>
              <option value="inactivo">Inactivos</option>
              <option value="graduado">Graduados</option>
            </select>
          </div>

          <div style={{
            display: 'flex',
            flexDirection: isMobile ? 'column' : 'row',
            alignItems: isMobile ? 'stretch' : 'center',
            gap: '0.5rem',
            flex: isMobile ? '1' : 'initial'
          }}>
            <label style={{ color: themeColors.textSecondary, fontSize: '0.9rem' }}>Horario:</label>
            <select
              value={filtroHorario}
              onChange={(e) => setFiltroHorario(e.target.value as 'todos' | 'matutino' | 'vespertino')}
              style={{
                ...baseSelectStyle,
                width: isMobile ? '100%' : 'auto'
              }}
            >
              <option value="todos">Todos</option>
              <option value="matutino">Matutino</option>
              <option value="vespertino">Vespertino</option>
            </select>
          </div>
        </>
      );
    }

    if (tipoReporte === 'cursos') {
      return (
        <>
          <div style={{
            display: 'flex',
            flexDirection: isMobile ? 'column' : 'row',
            alignItems: isMobile ? 'stretch' : 'center',
            gap: '0.5rem',
            flex: isMobile ? '1' : 'initial'
          }}>
            <label style={{ color: themeColors.textSecondary, fontSize: '0.9rem' }}>Estado:</label>
            <select
              value={filtroEstadoCursoReporte}
              onChange={(e) => setFiltroEstadoCursoReporte(e.target.value)}
              style={{
                ...baseSelectStyle,
                width: isMobile ? '100%' : 'auto'
              }}
            >
              <option value="todos">Todos los estados</option>
              <option value="activo">Activos</option>
              <option value="finalizado">Finalizados</option>
            </select>
          </div>

          <div style={{
            display: 'flex',
            flexDirection: isMobile ? 'column' : 'row',
            alignItems: isMobile ? 'stretch' : 'center',
            gap: '0.5rem',
            flex: isMobile ? '1' : 'initial'
          }}>
            <label style={{ color: themeColors.textSecondary, fontSize: '0.9rem' }}>Ocupación:</label>
            <select
              value={filtroOcupacionCurso}
              onChange={(e) => setFiltroOcupacionCurso(e.target.value)}
              style={{
                ...baseSelectStyle,
                width: isMobile ? '100%' : 'auto'
              }}
            >
              <option value="todos">Todas las ocupaciones</option>
              <option value="lleno">Llenos (80-100%)</option>
              <option value="medio">Media ocupación (40-79%)</option>
              <option value="bajo">Baja ocupación (0-39%)</option>
            </select>
          </div>

          <div style={{
            display: 'flex',
            flexDirection: isMobile ? 'column' : 'row',
            alignItems: isMobile ? 'stretch' : 'center',
            gap: '0.5rem',
            flex: isMobile ? '1' : 'initial'
          }}>
            <label style={{ color: themeColors.textSecondary, fontSize: '0.9rem' }}>Horario:</label>
            <select
              value={filtroHorarioCurso}
              onChange={(e) => setFiltroHorarioCurso(e.target.value)}
              style={{
                ...baseSelectStyle,
                width: isMobile ? '100%' : 'auto'
              }}
            >
              <option value="todos">Todos los horarios</option>
              <option value="matutino">Matutino</option>
              <option value="vespertino">Vespertino</option>
            </select>
          </div>
        </>
      );
    }

    if (tipoReporte === 'financiero') {
      return (
        <>
          <div style={{
            display: 'flex',
            flexDirection: isMobile ? 'column' : 'row',
            alignItems: isMobile ? 'stretch' : 'center',
            gap: '0.5rem',
            flex: isMobile ? '1' : 'initial'
          }}>
            <label style={{ color: themeColors.textSecondary, fontSize: '0.9rem' }}>Estado Curso:</label>
            <select
              value={filtroEstadoCursoFinanciero}
              onChange={(e) => {
                setFiltroEstadoCursoFinanciero(e.target.value);
                setPaginaActualFinanciero(1);
              }} style={{
                ...baseSelectStyle,
                width: isMobile ? '100%' : 'auto'
              }}
            >
              <option value="todos">Todos los estados</option>
              <option value="activo">Activos</option>
              <option value="finalizado">Finalizados</option>
            </select>
          </div>

          <div style={{
            display: 'flex',
            flexDirection: isMobile ? 'column' : 'row',
            alignItems: isMobile ? 'stretch' : 'center',
            gap: '0.5rem',
            flex: isMobile ? '1' : 'initial'
          }}>
            <label style={{ color: themeColors.textSecondary, fontSize: '0.9rem' }}>Curso:</label>
            <select
              value={filtroCursoFinanciero}
              onChange={(e) => {
                setFiltroCursoFinanciero(e.target.value);
                setPaginaActualFinanciero(1);
              }} style={{
                ...baseSelectStyle,
                minWidth: isMobile ? 'auto' : '18.75rem',
                width: isMobile ? '100%' : 'auto'
              }}
            >
              <option value="">Todos los cursos</option>
              {cursosFiltrados.map((curso: Curso) => {
                const formatearFecha = (fecha: string): string => {
                  if (!fecha) return '';
                  const [año, mes, dia] = fecha.split('T')[0].split('-');
                  const meses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
                  const mesNombre = meses[parseInt(mes) - 1];
                  return `${parseInt(dia)} ${mesNombre} ${año}`;
                };

                const fechaInicio = formatearFecha(curso.fecha_inicio);
                const fechaFin = formatearFecha(curso.fecha_fin);
                const periodo = fechaInicio && fechaFin ? ` (${fechaInicio} - ${fechaFin})` : '';
                const horario = curso.horario ? ` - ${curso.horario.charAt(0).toUpperCase() + curso.horario.slice(1)}` : '';

                return (
                  <option key={curso.id_curso} value={curso.id_curso}>
                    {curso.nombre}{horario}{periodo}
                  </option>
                );
              })}
            </select>
          </div>

          <div style={{
            display: 'flex',
            flexDirection: isMobile ? 'column' : 'row',
            alignItems: isMobile ? 'stretch' : 'center',
            gap: '0.5rem',
            flex: isMobile ? '1' : 'initial'
          }}>
            <label style={{ color: themeColors.textSecondary, fontSize: '0.9rem' }}>Estado Pago:</label>
            <select
              value={filtroEstadoPago}
              onChange={(e) => {
                setFiltroEstadoPago(e.target.value);
                setPaginaActualFinanciero(1);
              }} style={{
                ...baseSelectStyle,
                width: isMobile ? '100%' : 'auto'
              }}
            >
              <option value="todos">Todos los estados</option>
              <option value="verificado">Verificados</option>
              <option value="pagado">Pagados</option>
              <option value="pendiente">Pendientes</option>
              <option value="vencido">Vencidos</option>
            </select>
          </div>

          <div style={{
            display: 'flex',
            flexDirection: isMobile ? 'column' : 'row',
            alignItems: isMobile ? 'stretch' : 'center',
            gap: '0.5rem',
            flex: isMobile ? '1' : 'initial'
          }}>
            <label style={{ color: themeColors.textSecondary, fontSize: '0.9rem' }}>Método:</label>
            <select
              value={filtroMetodoPago}
              onChange={(e) => {
                setFiltroMetodoPago(e.target.value);
                setPaginaActualFinanciero(1);
              }} style={{
                ...baseSelectStyle,
                width: isMobile ? '100%' : 'auto'
              }}
            >
              <option value="todos">Todos los métodos</option>
              <option value="efectivo">Efectivo</option>
              <option value="transferencia">Transferencia</option>
            </select>
          </div>

          <div style={{
            display: 'flex',
            flexDirection: isMobile ? 'column' : 'row',
            alignItems: isMobile ? 'stretch' : 'center',
            gap: '0.5rem',
            flex: isMobile ? '1' : 'initial'
          }}>
            <label style={{ color: themeColors.textSecondary, fontSize: '0.9rem' }}>Horario:</label>
            <select
              value={filtroHorarioFinanciero}
              onChange={(e) => {
                setFiltroHorarioFinanciero(e.target.value);
                setPaginaActualFinanciero(1);
              }} style={{
                ...baseSelectStyle,
                width: isMobile ? '100%' : 'auto'
              }}
            >
              <option value="todos">Todos los horarios</option>
              <option value="matutino">Matutino</option>
              <option value="vespertino">Vespertino</option>
            </select>
          </div>
        </>
      );
    }

    return null;
  };

  // Renderizar tarjetas de resumen
  const renderTarjetasResumen = () => {
    if (!estadisticasCalculadas) return null;

    if (tipoReporte === 'estudiantes' && 'tasaAprobacion' in estadisticasCalculadas) {
      const { total, tasaAprobacion, enCurso } = estadisticasCalculadas;
      return (
        <div style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '0.75rem',
          marginBottom: '1rem'
        }}>
          <div style={buildMetricCardStyle('#ef4444')}>
            <Users size={28} color="#ef4444" />
            <div>
              <div style={metricValueStyle(themeColors.textPrimary)}>{total}</div>
              <div style={metricLabelStyle}>Total Estudiantes</div>
            </div>
          </div>

          <div style={buildMetricCardStyle('#10b981')}>
            <CheckCircle2 size={28} color="#10b981" />
            <div>
              <div style={metricValueStyle('#10b981')}>{tasaAprobacion}%</div>
              <div style={metricLabelStyle}>Tasa Aprobación</div>
            </div>
          </div>

          <div style={buildMetricCardStyle('#3b82f6')}>
            <Target size={28} color="#3b82f6" />
            <div>
              <div style={metricValueStyle('#3b82f6')}>{enCurso}</div>
              <div style={metricLabelStyle}>Estudiantes Activos</div>
            </div>
          </div>
        </div>
      );
    } else if (tipoReporte === 'financiero' && 'ingresoTotal' in estadisticasCalculadas) {
      const {
        ingresoTotal = 0,
        promedio = 0,
        total
      } = estadisticasCalculadas;

      return (
        <div style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '0.75rem',
          marginBottom: '1rem'
        }}>
          <div style={buildMetricCardStyle('#10b981')}>
            <DollarSign size={28} color="#10b981" />
            <div>
              <div style={metricValueStyle('#10b981')}>${ingresoTotal.toFixed(2)}</div>
              <div style={metricLabelStyle}>Ingresos Totales</div>
            </div>
          </div>

          <div style={buildMetricCardStyle('#ef4444')}>
            <BarChart3 size={28} color="#ef4444" />
            <div>
              <div style={metricValueStyle(themeColors.textPrimary)}>{total}</div>
              <div style={metricLabelStyle}>Total Pagos</div>
            </div>
          </div>

          <div style={buildMetricCardStyle('#3b82f6')}>
            <Award size={28} color="#3b82f6" />
            <div>
              <div style={metricValueStyle('#3b82f6')}>${promedio.toFixed(2)}</div>
              <div style={metricLabelStyle}>Promedio</div>
            </div>
          </div>
        </div>
      );
    } else if (tipoReporte === 'cursos' && 'capacidadPromedio' in estadisticasCalculadas) {
      const {
        total,
        capacidadPromedio = 0,
        activos = 0
      } = estadisticasCalculadas;

      return (
        <div style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '0.75rem',
          marginBottom: '1rem'
        }}>
          <div style={buildMetricCardStyle('#ef4444')}>
            <BookOpen size={28} color="#ef4444" />
            <div>
              <div style={metricValueStyle(themeColors.textPrimary)}>{total}</div>
              <div style={metricLabelStyle}>Total Cursos</div>
            </div>
          </div>

          <div style={buildMetricCardStyle('#10b981')}>
            <CheckCircle2 size={28} color="#10b981" />
            <div>
              <div style={metricValueStyle('#10b981')}>{activos}</div>
              <div style={metricLabelStyle}>Cursos Activos</div>
            </div>
          </div>

          <div style={buildMetricCardStyle('#3b82f6')}>
            <Users size={28} color="#3b82f6" />
            <div>
              <div style={metricValueStyle('#3b82f6')}>{capacidadPromedio}</div>
              <div style={metricLabelStyle}>Capacidad Promedio</div>
            </div>
          </div>
        </div>
      );
    }

    return null;
  };

  const renderEstadisticas = () => {
    if (!datosReporte || !estadisticas) {
      return (
        <div style={{ textAlign: 'center', padding: '60px 1.25rem', color: 'rgba(255,255,255,0.5)' }}>
          <BarChart3 size={64} style={{ margin: '0 auto 1rem', opacity: 0.3 }} />
          <p style={{ fontSize: '1.1rem', margin: 0 }}>
            Selecciona un tipo de reporte y haz clic en "Ver Reporte" para visualizar las estadísticas
          </p>
        </div>
      );
    }

    if (tipoReporte === 'estudiantes') {
      // Mostrar mensaje si no hay datos
      if (datosReporte && datosReporte.length === 0) {
        return (
          <div style={{ textAlign: 'center', padding: '60px 1.25rem' }}>
            <AlertCircle size={64} color="#f59e0b" style={{ margin: '0 auto 1rem', opacity: 0.5 }} />
            <h3 style={{ color: themeColors.textPrimary, marginBottom: '0.5rem', fontSize: '1.2rem' }}>No hay estudiantes en este período</h3>
            <p style={{ color: themeColors.textMuted, fontSize: '1rem' }}>
              Intenta seleccionar otro período o curso, o verifica que haya estudiantes matriculados.
            </p>
          </div>
        );
      }

      return (
        <div style={{
          display: 'grid',
          gap: isMobile ? '16px' : '1.5rem',
          width: '100%',
          maxWidth: '100%'
        }}>
          {/* Tarjetas de resumen */}
          {renderTarjetasResumen()}

          {/* Controles de búsqueda y ordenamiento */}
          {datosReporte.length > 0 && (
            <div style={{
              display: 'flex',
              flexDirection: isMobile ? 'column' : 'row',
              gap: '0.75rem',
              marginBottom: '1rem',
              alignItems: isMobile ? 'stretch' : 'center'
            }}>
              {/* Búsqueda rápida */}
              <div style={{ position: 'relative', flex: 1, minWidth: isMobile ? 'auto' : '250px' }}>
                <Search size={16} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: themeColors.textMuted }} />
                <input
                  type="text"
                  placeholder="Buscar por nombre o curso..."
                  value={busquedaRapida}
                  onChange={(e) => setBusquedaRapida(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 0.75rem 8px 2.5rem',
                    ...baseInputStyle
                  }}
                />
              </div>

              {/* Ordenamiento */}
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                <button
                  onClick={() => {
                    if (ordenamiento === 'nombre') {
                      setOrdenAscendente(!ordenAscendente);
                    } else {
                      setOrdenamiento('nombre');
                      setOrdenAscendente(true);
                    }
                  }}
                  style={getToggleButtonStyle(ordenamiento === 'nombre')}
                >
                  {ordenamiento === 'nombre' ? (ordenAscendente ? <ArrowUp size={14} /> : <ArrowDown size={14} />) : <ArrowUpDown size={14} />}
                  Nombre
                </button>

                <button
                  onClick={() => {
                    if (ordenamiento === 'fecha') {
                      setOrdenAscendente(!ordenAscendente);
                    } else {
                      setOrdenamiento('fecha');
                      setOrdenAscendente(false);
                    }
                  }}
                  style={getToggleButtonStyle(ordenamiento === 'fecha')}
                >
                  {ordenamiento === 'fecha' ? (ordenAscendente ? <ArrowUp size={14} /> : <ArrowDown size={14} />) : <ArrowUpDown size={14} />}
                  Fecha
                </button>

              </div>
            </div>
          )}

          {/* Lista de estudiantes */}
          {(() => {
            // 1. Agrupar estudiantes por ID
            const estudiantesMap = new Map();
            datosReporte.forEach((item: any) => {
              if (!estudiantesMap.has(item.id_usuario)) {
                estudiantesMap.set(item.id_usuario, {
                  ...item,
                  cursos: []
                });
              }
              // Evitar duplicados de cursos si el backend devuelve filas repetidas
              const cursoExistente = estudiantesMap.get(item.id_usuario).cursos.find((c: any) => c.codigo_curso === item.codigo_curso);
              if (!cursoExistente) {
                estudiantesMap.get(item.id_usuario).cursos.push({
                  nombre_curso: item.nombre_curso,
                  codigo_curso: item.codigo_curso,
                  estado_academico: item.estado_academico,
                  fecha_inscripcion: item.fecha_inscripcion,
                  nota_final: item.nota_final
                });
              }
            });
            const estudiantesAgrupados = Array.from(estudiantesMap.values());

            // 2. Filtrar
            const filtrados = estudiantesAgrupados.filter((est: any) => {
              if (!busquedaRapida) return true;
              const term = busquedaRapida.toLowerCase();
              const nombreCompleto = `${est.nombre} ${est.apellido}`.toLowerCase();
              const cursosMatch = est.cursos.some((c: any) => c.nombre_curso.toLowerCase().includes(term));
              return nombreCompleto.includes(term) || cursosMatch;
            });

            // 3. Ordenar
            const datosProcesados = filtrados.sort((a: any, b: any) => {
              if (ordenamiento === 'nombre') {
                const nombreA = `${a.nombre} ${a.apellido}`.toLowerCase();
                const nombreB = `${b.nombre} ${b.apellido}`.toLowerCase();
                return ordenAscendente ? nombreA.localeCompare(nombreB) : nombreB.localeCompare(nombreA);
              } else {
                const fechaA = new Date(a.fecha_inscripcion).getTime();
                const fechaB = new Date(b.fecha_inscripcion).getTime();
                return ordenAscendente ? fechaA - fechaB : fechaB - fechaA;
              }
            });
            // 4. Calcular paginación
            const totalPaginasEstudiantes = Math.ceil(datosProcesados.length / ITEMS_POR_PAGINA_ESTUDIANTES);
            const indiceInicioEstudiantes = (paginaActualEstudiantes - 1) * ITEMS_POR_PAGINA_ESTUDIANTES;
            const indiceFinEstudiantes = indiceInicioEstudiantes + ITEMS_POR_PAGINA_ESTUDIANTES;
            const estudiantesPaginados = datosProcesados.slice(indiceInicioEstudiantes, indiceFinEstudiantes);

            return datosProcesados.length > 0 && (
              <div style={{
                maxHeight: isMobile ? 'auto' : '60vh',
                overflowY: isMobile ? 'visible' : 'auto',
                paddingRight: isMobile ? '0' : '0.5rem'
              }}>
                <h4 style={{
                  color: themeColors.textPrimary,
                  fontSize: '0.95rem',
                  fontWeight: '700',
                  marginBottom: '0.75rem',
                  textShadow: darkMode ? '0 0.125rem 0.25rem rgba(0,0,0,0.35)' : 'none'
                }}>
                  Estudiantes Matriculados ({datosProcesados.length})
                </h4>

                {/* Indicador de scroll en móvil */}
                {isSmallScreen && (
                  <div style={{
                    background: darkMode ? 'rgba(239, 68, 68, 0.12)' : 'rgba(239, 68, 68, 0.08)',
                    border: darkMode ? '1px solid rgba(239, 68, 68, 0.3)' : '1px solid rgba(239, 68, 68, 0.18)',
                    borderRadius: '0.5rem',
                    padding: '0.5rem',
                    marginBottom: '0.75rem',
                    color: '#ef4444',
                    fontSize: '0.7rem',
                    textAlign: 'center',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.375rem'
                  }}>
                    <TrendingUp size={14} />
                    Desplazate
                  </div>
                )}

                {/* Cards en grid compacto */}
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fit, minmax(240px, 1fr))',
                    gap: '0.5rem'
                  }}
                >
                  {estudiantesPaginados.map((estudiante: any, idx: number) => {
                    const numeroGlobal = indiceInicioEstudiantes + idx + 1;
                    return (
                      <div key={idx} style={{
                        background: darkMode
                          ? 'linear-gradient(135deg, rgba(239, 68, 68, 0.18) 0%, rgba(220, 38, 38, 0.08) 100%)'
                          : 'linear-gradient(135deg, rgba(239, 68, 68, 0.08) 0%, rgba(248, 250, 252, 0.95) 100%)',
                        border: darkMode ? '1px solid rgba(239, 68, 68, 0.32)' : '1px solid rgba(239, 68, 68, 0.18)',
                        borderRadius: '0.5rem',
                        padding: '0.625rem 0.75rem',
                        transition: 'all 0.2s ease',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.5rem'
                      }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.borderColor = darkMode ? 'rgba(239, 68, 68, 0.5)' : 'rgba(239, 68, 68, 0.28)';
                          e.currentTarget.style.background = darkMode
                            ? 'linear-gradient(135deg, rgba(239, 68, 68, 0.24) 0%, rgba(220, 38, 38, 0.12) 100%)'
                            : 'linear-gradient(135deg, rgba(239, 68, 68, 0.12) 0%, rgba(255, 255, 255, 0.98) 100%)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.borderColor = darkMode ? 'rgba(239, 68, 68, 0.32)' : 'rgba(239, 68, 68, 0.18)';
                          e.currentTarget.style.background = darkMode
                            ? 'linear-gradient(135deg, rgba(239, 68, 68, 0.18) 0%, rgba(220, 38, 38, 0.08) 100%)'
                            : 'linear-gradient(135deg, rgba(239, 68, 68, 0.08) 0%, rgba(248, 250, 252, 0.95) 100%)';
                        }}
                      >
                        {/* Número y Nombre */}
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem'
                        }}>
                          <div style={{
                            fontSize: '0.9rem',
                            fontWeight: '800',
                            color: darkMode ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.1)',
                            minWidth: '24px',
                            textAlign: 'center'
                          }}>
                            #{numeroGlobal}
                          </div>
                          <div style={{
                            color: themeColors.textPrimary,
                            fontSize: '0.8125rem',
                            fontWeight: '600',
                            lineHeight: '1.2',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            flex: 1
                          }}>
                            {estudiante.apellido} {estudiante.nombre}
                          </div>
                        </div>

                        {/* Lista de Cursos */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
                          {estudiante.cursos.map((curso: any, cIdx: number) => (
                            <div key={cIdx} style={{
                              display: 'flex',
                              flexDirection: 'column',
                              gap: '0.125rem',
                              padding: '0.25rem 0',
                              borderTop: cIdx > 0 ? `1px solid ${darkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'}` : 'none'
                            }}>
                              <div style={{
                                color: themeColors.textMuted,
                                fontSize: '0.7rem',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.375rem',
                                overflow: 'hidden'
                              }}>
                                <BookOpen size={11} color={themeColors.textMuted} />
                                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                  {curso.nombre_curso}
                                </span>
                              </div>

                              <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                gap: '0.5rem'
                              }}>
                                <div style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  padding: '0.125rem 0.375rem',
                                  borderRadius: '0.25rem',
                                  fontSize: '0.625rem',
                                  fontWeight: '700',
                                  background: curso.estado_academico === 'aprobado' ? 'rgba(16, 185, 129, 0.15)' :
                                    curso.estado_academico === 'reprobado' ? 'rgba(239, 68, 68, 0.15)' :
                                      'rgba(239, 68, 68, 0.1)',
                                  border: curso.estado_academico === 'aprobado' ? '1px solid rgba(16, 185, 129, 0.3)' :
                                    curso.estado_academico === 'reprobado' ? '1px solid rgba(239, 68, 68, 0.3)' :
                                      '1px solid rgba(239, 68, 68, 0.2)',
                                  color: curso.estado_academico === 'aprobado' ? '#10b981' :
                                    curso.estado_academico === 'reprobado' ? '#ef4444' :
                                      '#ef4444',
                                  whiteSpace: 'nowrap'
                                }}>
                                  {curso.estado_academico?.toUpperCase() || 'ACTIVO'}
                                </div>
                                <div style={{
                                  color: themeColors.textMuted,
                                  fontSize: '0.65rem',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '0.25rem',
                                  whiteSpace: 'nowrap'
                                }}>
                                  <Calendar size={10} color={themeColors.textMuted} />
                                  {new Date(curso.fecha_inscripcion).toLocaleDateString('es-ES', {
                                    day: '2-digit',
                                    month: '2-digit',
                                    year: '2-digit'
                                  })}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
                {/* Controles de Paginación */}
                {totalPaginasEstudiantes > 1 && (
                  <div style={{
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    gap: '0.5rem',
                    marginTop: '1.5rem',
                    paddingTop: '1rem',
                    borderTop: darkMode ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.1)'
                  }}>
                    <button
                      onClick={() => setPaginaActualEstudiantes(prev => Math.max(1, prev - 1))}
                      disabled={paginaActualEstudiantes === 1}
                      style={{
                        padding: '0.5rem 0.75rem',
                        background: paginaActualEstudiantes === 1
                          ? (darkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)')
                          : (darkMode ? 'rgba(239, 68, 68, 0.2)' : 'rgba(239, 68, 68, 0.1)'),
                        border: `1px solid ${paginaActualEstudiantes === 1 ? (darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)') : 'rgba(239, 68, 68, 0.3)'}`,
                        borderRadius: '0.5rem',
                        color: paginaActualEstudiantes === 1 ? themeColors.textMuted : '#ef4444',
                        cursor: paginaActualEstudiantes === 1 ? 'not-allowed' : 'pointer',
                        fontSize: '0.85rem',
                        fontWeight: '600'
                      }}
                    >
                      Anterior
                    </button>

                    <span style={{
                      padding: '0.5rem 1rem',
                      background: darkMode ? 'rgba(239, 68, 68, 0.15)' : 'rgba(239, 68, 68, 0.08)',
                      border: '1px solid rgba(239, 68, 68, 0.3)',
                      borderRadius: '0.5rem',
                      color: themeColors.textPrimary,
                      fontSize: '0.85rem',
                      fontWeight: '600'
                    }}>
                      Página {paginaActualEstudiantes} de {totalPaginasEstudiantes}
                    </span>

                    <button
                      onClick={() => setPaginaActualEstudiantes(prev => Math.min(totalPaginasEstudiantes, prev + 1))}
                      disabled={paginaActualEstudiantes === totalPaginasEstudiantes}
                      style={{
                        padding: '0.5rem 0.75rem',
                        background: paginaActualEstudiantes === totalPaginasEstudiantes
                          ? (darkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)')
                          : (darkMode ? 'rgba(239, 68, 68, 0.2)' : 'rgba(239, 68, 68, 0.1)'),
                        border: `1px solid ${paginaActualEstudiantes === totalPaginasEstudiantes ? (darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)') : 'rgba(239, 68, 68, 0.3)'}`,
                        borderRadius: '0.5rem',
                        color: paginaActualEstudiantes === totalPaginasEstudiantes ? themeColors.textMuted : '#ef4444',
                        cursor: paginaActualEstudiantes === totalPaginasEstudiantes ? 'not-allowed' : 'pointer',
                        fontSize: '0.85rem',
                        fontWeight: '600'
                      }}
                    >
                      Siguiente
                    </button>
                  </div>
                )}
              </div>
            );
          })()}
        </div>
      );
    }

    if (tipoReporte === 'financiero') {
      return (
        <div style={{
          display: 'grid',
          gap: isMobile ? '16px' : '1.5rem',
          width: '100%',
          maxWidth: '100%'
        }}>
          {/* Lista de pagos agrupados por estudiante */}
          {(() => {
            // 1. Agrupar pagos por Cédula
            const pagosMap = new Map();
            datosReporte.forEach((pago: any) => {
              const key = pago.cedula_estudiante;
              if (!pagosMap.has(key)) {
                pagosMap.set(key, {
                  nombre: pago.nombre_estudiante,
                  apellido: pago.apellido_estudiante,
                  cedula: pago.cedula_estudiante,
                  email: pago.email_estudiante,
                  pagos: [],
                  cursos: new Set(),
                  totalPagado: 0,
                  totalPendiente: 0
                });
              }
              const estudiante = pagosMap.get(key);
              estudiante.pagos.push(pago);
              estudiante.cursos.add(pago.nombre_curso);

              const monto = parseFloat(pago.monto) || 0;
              if (pago.estado_pago === 'pagado' || pago.estado_pago === 'verificado') {
                estudiante.totalPagado += monto;
              } else if (pago.estado_pago === 'pendiente') {
                estudiante.totalPendiente += monto;
              }
            });

            const estudiantesFinanciero = Array.from(pagosMap.values()).sort((a: any, b: any) => {
              const nombreA = `${a.apellido} ${a.nombre}`.toLowerCase();
              const nombreB = `${b.apellido} ${b.nombre}`.toLowerCase();
              return nombreA.localeCompare(nombreB);
            });

            // Aplicar búsqueda
            const estudiantesFiltrados = busquedaRapida
              ? estudiantesFinanciero.filter((est: any) => {
                const searchTerm = busquedaRapida.toLowerCase();
                const nombreCompleto = `${est.apellido} ${est.nombre}`.toLowerCase();
                const cedulaStr = est.cedula.toString();
                const cursosStr = Array.from(est.cursos).join(' ').toLowerCase();

                return nombreCompleto.includes(searchTerm) ||
                  cedulaStr.includes(searchTerm) ||
                  cursosStr.includes(searchTerm);
              })
              : estudiantesFinanciero;

            // Calcular paginación
            const totalPaginas = Math.ceil(estudiantesFiltrados.length / ITEMS_POR_PAGINA_FINANCIERO);
            const indiceInicio = (paginaActualFinanciero - 1) * ITEMS_POR_PAGINA_FINANCIERO;
            const indiceFin = indiceInicio + ITEMS_POR_PAGINA_FINANCIERO;
            const estudiantesPaginados = estudiantesFiltrados.slice(indiceInicio, indiceFin);

            return estudiantesFinanciero.length > 0 && (
              <div style={{
                maxHeight: '65vh',
                overflowY: 'auto',
                paddingRight: '0.5rem'
              }}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '1rem'
                }}>
                  <h4 style={{ color: themeColors.textPrimary, fontSize: '1rem', fontWeight: '700', margin: 0 }}>
                    Resumen Financiero por Estudiante
                  </h4>
                  <span style={{
                    fontSize: '0.75rem',
                    color: themeColors.textMuted,
                    background: darkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
                    padding: '4px 8px',
                    borderRadius: '6px'
                  }}>
                    {busquedaRapida ? `${estudiantesFiltrados.length} de ${estudiantesFinanciero.length}` : `${estudiantesFinanciero.length}`} estudiantes
                  </span>
                </div>
                {/* Campo de búsqueda */}
                <div style={{
                  marginBottom: '1rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  background: darkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
                  padding: '0.75rem',
                  borderRadius: '0.5rem',
                  border: `1px solid ${darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`
                }}>
                  <Search size={18} color={themeColors.textMuted} />
                  <input
                    type="text"
                    placeholder="Buscar por nombre, apellido, cédula o curso..."
                    value={busquedaRapida}
                    onChange={(e) => {
                      setBusquedaRapida(e.target.value);
                      setPaginaActualFinanciero(1);
                    }}
                    style={{
                      flex: 1,
                      background: 'transparent',
                      border: 'none',
                      outline: 'none',
                      color: themeColors.textPrimary,
                      fontSize: '0.85rem',
                      padding: '0.25rem'
                    }}
                  />
                  {busquedaRapida && (
                    <button
                      onClick={() => {
                        setBusquedaRapida('');
                        setPaginaActualFinanciero(1);
                      }}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        cursor: 'pointer',
                        color: themeColors.textMuted,
                        padding: '0.25rem',
                        display: 'flex',
                        alignItems: 'center'
                      }}
                    >
                      <XCircle size={16} />
                    </button>
                  )}
                </div>
                {/* Cards en grid */}
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr',
                    gap: '1.25rem'
                  }}
                >
                  {estudiantesPaginados.map((estudiante: any, idx: number) => {
                    const numeroGlobal = indiceInicio + idx + 1;                    // Agrupar pagos por curso internamente
                    const pagosPorCurso: Record<string, any[]> = {};
                    estudiante.pagos.forEach((pago: any) => {
                      if (!pagosPorCurso[pago.nombre_curso]) {
                        pagosPorCurso[pago.nombre_curso] = [];
                      }
                      pagosPorCurso[pago.nombre_curso].push(pago);
                    });

                    return (
                      <div key={idx} style={{
                        background: darkMode ? '#1e293b' : '#ffffff',
                        border: darkMode ? '1px solid #334155' : '1px solid #e2e8f0',
                        borderRadius: '1rem',
                        overflow: 'hidden',
                        boxShadow: darkMode ? '0 4px 6px -1px rgba(0, 0, 0, 0.3)' : '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
                        transition: 'transform 0.2s ease, box-shadow 0.2s ease'
                      }}>
                        {/* Cabecera de la Tarjeta del Estudiante */}
                        <div
                          onClick={() => toggleTarjetaFinanciera(estudiante.cedula)}
                          style={{
                            padding: isMobile ? '1rem' : '1.25rem',
                            borderBottom: darkMode ? '1px solid #334155' : '1px solid #f1f5f9',
                            display: 'flex',
                            flexDirection: isMobile ? 'column' : 'row',
                            justifyContent: 'space-between',
                            alignItems: isMobile ? 'stretch' : 'center',
                            gap: isMobile ? '0.75rem' : '0',
                            background: darkMode ? 'rgba(255,255,255,0.02)' : 'rgba(248,250,252,0.5)',
                            cursor: 'pointer'
                          }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? '0.75rem' : '1rem', flex: 1, minWidth: 0 }}>                            {/* Número de índice */}
                            <div style={{
                              fontSize: '1.25rem',
                              fontWeight: '800',
                              color: darkMode ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.1)',
                              minWidth: '30px',
                              textAlign: 'center'
                            }}>
                              #{numeroGlobal}
                            </div>

                            <div style={{
                              width: '40px',
                              height: '40px',
                              borderRadius: '50%',
                              background: darkMode ? 'linear-gradient(135deg, #3b82f6, #2563eb)' : 'linear-gradient(135deg, #eff6ff, #dbeafe)',
                              color: darkMode ? '#fff' : '#2563eb',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontWeight: '700',
                              fontSize: '1rem'
                            }}>
                              {estudiante.nombre.charAt(0)}{estudiante.apellido.charAt(0)}
                            </div>
                            <div>
                              <div style={{ fontSize: '1rem', fontWeight: '700', color: themeColors.textPrimary }}>
                                {estudiante.apellido} {estudiante.nombre}
                              </div>
                              <div style={{
                                fontSize: isMobile ? '0.75rem' : '0.8rem',
                                color: themeColors.textMuted,
                                display: 'flex',
                                flexDirection: isMobile ? 'column' : 'row',
                                alignItems: isMobile ? 'flex-start' : 'center',
                                gap: isMobile ? '0.25rem' : '0.5rem'
                              }}>
                                <span>CI: {estudiante.cedula}</span>
                                {estudiante.email && (
                                  <>
                                    {!isMobile && <span style={{ width: '3px', height: '3px', borderRadius: '50%', background: 'currentColor' }}></span>}
                                    <span style={{
                                      overflow: 'hidden',
                                      textOverflow: 'ellipsis',
                                      whiteSpace: 'nowrap'
                                    }}>{estudiante.email}</span>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Totales Resumen */}
                          <div style={{
                            display: 'flex',
                            gap: isMobile ? '1rem' : '1.5rem',
                            textAlign: 'right',
                            justifyContent: isMobile ? 'space-between' : 'flex-end',
                            width: isMobile ? '100%' : 'auto'
                          }}>                            <div>
                              <div style={{ fontSize: '0.7rem', color: themeColors.textMuted, textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: '600' }}>Pagado</div>
                              <div style={{ fontSize: '1.1rem', fontWeight: '700', color: '#10b981' }}>
                                ${estudiante.totalPagado.toFixed(2)}
                              </div>
                            </div>
                            {estudiante.totalPendiente > 0 && (
                              <div>
                                <div style={{ fontSize: '0.7rem', color: themeColors.textMuted, textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: '600' }}>Pendiente</div>
                                <div style={{ fontSize: '1.1rem', fontWeight: '700', color: '#f59e0b' }}>
                                  ${estudiante.totalPendiente.toFixed(2)}
                                </div>
                              </div>
                            )}
                          </div>
                          {/* Indicador de expandir/colapsar */}
                          <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            color: '#ef4444',
                            fontSize: '0.75rem',
                            fontWeight: '600',
                            gap: '0.25rem'
                          }}>
                            <ChevronDown
                              size={20}
                              style={{
                                transform: tarjetasExpandidas.has(estudiante.cedula) ? 'rotate(180deg)' : 'rotate(0deg)',
                                transition: 'transform 0.3s ease'
                              }}
                            />
                          </div>
                        </div>

                        {/* Cuerpo: Lista de Pagos Agrupada por Curso */}
                        {tarjetasExpandidas.has(estudiante.cedula) && (
                          <div style={{ padding: '0', maxHeight: '350px', overflowY: 'auto' }}>
                            {Object.entries(pagosPorCurso).map(([curso, pagos], cIdx) => (
                              <div key={cIdx} style={{
                                borderBottom: cIdx === Object.keys(pagosPorCurso).length - 1 ? 'none' : (darkMode ? '1px solid #334155' : '1px solid #e2e8f0')
                              }}>
                                {/* Cabecera del Curso */}
                                <div style={{
                                  padding: '0.75rem 1.25rem',
                                  background: darkMode ? 'rgba(255,255,255,0.03)' : '#f1f5f9',
                                  fontSize: '0.8rem',
                                  fontWeight: '700',
                                  color: themeColors.textPrimary,
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '0.5rem'
                                }}>
                                  <BookOpen size={14} color={themeColors.textMuted} />
                                  {curso}
                                </div>

                                {pagos.map((pago: any, pIdx: number) => (
                                  <div key={pIdx} style={{
                                    display: 'grid',
                                    gridTemplateColumns: '1fr 1fr 1fr',
                                    padding: '0.75rem 1.25rem',
                                    borderTop: darkMode ? '1px solid rgba(255,255,255,0.05)' : '1px solid #f8fafc',
                                    alignItems: 'center',
                                    fontSize: '0.85rem',
                                    transition: 'background 0.15s ease'
                                  }}
                                    onMouseEnter={(e) => e.currentTarget.style.background = darkMode ? 'rgba(255,255,255,0.03)' : '#f8fafc'}
                                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                                  >
                                    <div style={{ display: 'flex', flexDirection: 'column', fontSize: '0.75rem', color: themeColors.textMuted }}>
                                      <span style={{ fontWeight: '600', color: themeColors.textPrimary }}>Cuota {pago.numero_cuota}</span>
                                      <span>{new Date(pago.fecha_pago || pago.fecha_vencimiento).toLocaleDateString()}</span>
                                    </div>

                                    <div style={{ textAlign: 'center' }}>
                                      <span style={{
                                        display: 'inline-block',
                                        padding: '0.25rem 0.625rem',
                                        borderRadius: '9999px',
                                        fontSize: '0.7rem',
                                        fontWeight: '700',
                                        background: pago.estado_pago === 'verificado' ? 'rgba(16, 185, 129, 0.15)' :
                                          pago.estado_pago === 'pagado' ? 'rgba(59, 130, 246, 0.15)' :
                                            'rgba(239, 68, 68, 0.15)',
                                        color: pago.estado_pago === 'verificado' ? '#10b981' :
                                          pago.estado_pago === 'pagado' ? '#3b82f6' :
                                            '#ef4444',
                                        border: `1px solid ${pago.estado_pago === 'verificado' ? 'rgba(16, 185, 129, 0.2)' :
                                          pago.estado_pago === 'pagado' ? 'rgba(59, 130, 246, 0.2)' :
                                            'rgba(239, 68, 68, 0.2)'
                                          }`
                                      }}>
                                        {pago.estado_pago?.toUpperCase()}
                                      </span>
                                    </div>

                                    <div style={{ textAlign: 'right', fontWeight: '700', color: themeColors.textPrimary }}>
                                      ${parseFloat(pago.monto).toFixed(2)}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            ))}

                            {/* Footer de Alerta si hay deuda */}
                            {estudiante.totalPendiente > 0 && (
                              <div style={{
                                padding: '0.75rem 1.25rem',
                                background: darkMode ? 'rgba(245, 158, 11, 0.1)' : '#fffbeb',
                                borderTop: darkMode ? '1px solid rgba(245, 158, 11, 0.2)' : '1px solid #fcd34d',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem',
                                color: '#d97706',
                                fontSize: '0.8rem',
                                fontWeight: '600'
                              }}>
                                <AlertCircle size={16} />
                                <span>Este estudiante tiene un saldo pendiente de <strong>${estudiante.totalPendiente.toFixed(2)}</strong></span>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}

                </div>
                {/* Controles de Paginación */}
                {totalPaginas > 1 && (
                  <div style={{
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    gap: '0.5rem',
                    marginTop: '1.5rem',
                    paddingTop: '1rem',
                    borderTop: darkMode ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.1)'
                  }}>
                    <button
                      onClick={() => setPaginaActualFinanciero(prev => Math.max(1, prev - 1))}
                      disabled={paginaActualFinanciero === 1}
                      style={{
                        padding: '0.5rem 0.75rem',
                        background: paginaActualFinanciero === 1
                          ? (darkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)')
                          : (darkMode ? 'rgba(239, 68, 68, 0.2)' : 'rgba(239, 68, 68, 0.1)'),
                        border: `1px solid ${paginaActualFinanciero === 1 ? (darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)') : 'rgba(239, 68, 68, 0.3)'}`,
                        borderRadius: '0.5rem',
                        color: paginaActualFinanciero === 1 ? themeColors.textMuted : '#ef4444',
                        cursor: paginaActualFinanciero === 1 ? 'not-allowed' : 'pointer',
                        fontSize: '0.85rem',
                        fontWeight: '600'
                      }}
                    >
                      Anterior
                    </button>

                    <span style={{
                      padding: '0.5rem 1rem',
                      background: darkMode ? 'rgba(239, 68, 68, 0.15)' : 'rgba(239, 68, 68, 0.08)',
                      border: '1px solid rgba(239, 68, 68, 0.3)',
                      borderRadius: '0.5rem',
                      color: themeColors.textPrimary,
                      fontSize: '0.85rem',
                      fontWeight: '600'
                    }}>
                      Página {paginaActualFinanciero} de {totalPaginas}
                    </span>

                    <button
                      onClick={() => setPaginaActualFinanciero(prev => Math.min(totalPaginas, prev + 1))}
                      disabled={paginaActualFinanciero === totalPaginas}
                      style={{
                        padding: '0.5rem 0.75rem',
                        background: paginaActualFinanciero === totalPaginas
                          ? (darkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)')
                          : (darkMode ? 'rgba(239, 68, 68, 0.2)' : 'rgba(239, 68, 68, 0.1)'),
                        border: `1px solid ${paginaActualFinanciero === totalPaginas ? (darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)') : 'rgba(239, 68, 68, 0.3)'}`,
                        borderRadius: '0.5rem',
                        color: paginaActualFinanciero === totalPaginas ? themeColors.textMuted : '#ef4444',
                        cursor: paginaActualFinanciero === totalPaginas ? 'not-allowed' : 'pointer',
                        fontSize: '0.85rem',
                        fontWeight: '600'
                      }}
                    >
                      Siguiente
                    </button>
                  </div>
                )}
              </div>
            );
          })()}
        </div>
      );
    }

    if (tipoReporte === 'cursos') {
      return (
        <div style={{
          display: 'grid',
          gap: isMobile ? '12px' : '1rem',
          width: '100%',
          maxWidth: '100%'
        }}>
          {/* Lista de cursos */}
          {datosReporte.length > 0 && (
            <div style={{
              maxHeight: isMobile ? 'auto' : '60vh',
              overflowY: isMobile ? 'visible' : 'auto',
              paddingRight: isMobile ? '0' : '0.5rem'
            }}>
              <h4 style={{ color: themeColors.textPrimary, fontSize: '0.95rem', fontWeight: '700', marginBottom: '0.75rem' }}>
                Cursos Disponibles ({busquedaCursos ? `${(() => {
                  const filtrados = datosReporte.filter((c: any) => {
                    const term = busquedaCursos.toLowerCase();
                    return (c.nombre_curso?.toLowerCase() || '').includes(term) ||
                      (c.docente?.toLowerCase() || '').includes(term) ||
                      (c.horario?.toLowerCase() || '').includes(term);
                  });
                  return filtrados.length;
                })()} de ${datosReporte.length}` : datosReporte.length})              </h4>
              {/* Campo de búsqueda */}
              <div style={{
                marginBottom: '1rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                background: darkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
                padding: '0.75rem',
                borderRadius: '0.5rem',
                border: `1px solid ${darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`
              }}>
                <Search size={18} color={themeColors.textMuted} />
                <input
                  type="text"
                  placeholder="Buscar por nombre, docente u horario..."
                  value={busquedaCursos}
                  onChange={(e) => {
                    setBusquedaCursos(e.target.value);
                    setPaginaActualCursos(1);
                  }}
                  style={{
                    flex: 1,
                    background: 'transparent',
                    border: 'none',
                    outline: 'none',
                    color: themeColors.textPrimary,
                    fontSize: '0.85rem',
                    padding: '0.25rem'
                  }}
                />
                {busquedaCursos && (
                  <button
                    onClick={() => {
                      setBusquedaCursos('');
                      setPaginaActualCursos(1);
                    }}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      cursor: 'pointer',
                      color: themeColors.textMuted,
                      padding: '0.25rem',
                      display: 'flex',
                      alignItems: 'center'
                    }}
                  >
                    <XCircle size={16} />
                  </button>
                )}
              </div>
              <div style={{ display: 'grid', gap: '0.75rem' }}>
                {(() => {
                  // 1. Aplicar búsqueda
                  const cursosFiltrados = busquedaCursos
                    ? datosReporte.filter((curso: any) => {
                      const searchTerm = busquedaCursos.toLowerCase();
                      const nombreCurso = curso.nombre_curso?.toLowerCase() || '';
                      const docente = curso.docente?.toLowerCase() || '';
                      const horario = curso.horario?.toLowerCase() || '';

                      return nombreCurso.includes(searchTerm) ||
                        docente.includes(searchTerm) ||
                        horario.includes(searchTerm);
                    })
                    : datosReporte;

                  // 2. Ordenar por fecha de inicio (más recientes primero)
                  const cursosOrdenados = [...cursosFiltrados].sort((a: any, b: any) => {
                    const fechaA = new Date(a.fecha_inicio || 0).getTime();
                    const fechaB = new Date(b.fecha_inicio || 0).getTime();
                    return fechaB - fechaA; // Descendente (más recientes primero)
                  });

                  // 3. Calcular paginación
                  const totalPaginasCursos = Math.ceil(cursosOrdenados.length / ITEMS_POR_PAGINA_CURSOS);
                  const indiceInicioCursos = (paginaActualCursos - 1) * ITEMS_POR_PAGINA_CURSOS;
                  const indiceFinCursos = indiceInicioCursos + ITEMS_POR_PAGINA_CURSOS;
                  const cursosPaginados = cursosOrdenados.slice(indiceInicioCursos, indiceFinCursos);

                  return cursosPaginados.map((curso, idx) => (
                    <div key={idx} style={{
                      background: darkMode ? 'rgba(16, 185, 129, 0.16)' : 'rgba(16, 185, 129, 0.08)',
                      border: darkMode ? '1px solid rgba(16, 185, 129, 0.28)' : '1px solid rgba(16, 185, 129, 0.18)',
                      borderRadius: '0.625rem',
                      padding: '0.75rem'
                    }}>
                      <div style={{
                        display: 'flex',
                        flexDirection: isMobile ? 'column' : 'row',
                        justifyContent: 'space-between',
                        alignItems: isMobile ? 'flex-start' : 'center',
                        marginBottom: '0.375rem',
                        gap: isMobile ? '4px' : '0'
                      }}>
                        <div style={{ color: themeColors.textPrimary, fontSize: isMobile ? '0.8rem' : '0.85rem', fontWeight: '600' }}>
                          {curso.nombre_curso}
                        </div>
                        <div style={{ color: '#10b981', fontSize: isMobile ? '0.8rem' : '0.85rem', fontWeight: '700' }}>
                          {curso.porcentaje_ocupacion}% ocupación
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                        <div style={{ flex: 1, background: darkMode ? 'rgba(255,255,255,0.12)' : 'rgba(15,23,42,0.08)', borderRadius: '0.5rem', height: '0.5rem' }}>
                          <div style={{
                            background: '#10b981',
                            height: '100%',
                            borderRadius: '0.5rem',
                            width: `${curso.porcentaje_ocupacion}%`
                          }} />
                        </div>
                        <div style={{ color: themeColors.textSecondary, fontSize: '0.9rem' }}>
                          {curso.total_estudiantes}/{curso.capacidad_maxima}
                        </div>
                      </div>
                      <div style={{
                        display: 'flex',
                        flexDirection: isMobile ? 'column' : 'row',
                        gap: isMobile ? '4px' : '1rem',
                        fontSize: isMobile ? '0.75rem' : '0.85rem',
                        color: themeColors.textMuted
                      }}>
                        <span>Horario: {curso.horario}</span>
                        <span>Docente: {curso.docente_apellidos} {curso.docente_nombres}</span>
                      </div>
                    </div>
                  ));
                })()}
              </div>
              {/* Controles de Paginación */}
              {(() => {
                const cursosFiltrados = busquedaCursos
                  ? datosReporte.filter((c: any) => {
                    const term = busquedaCursos.toLowerCase();
                    return (c.nombre_curso?.toLowerCase() || '').includes(term) ||
                      (c.docente?.toLowerCase() || '').includes(term) ||
                      (c.horario?.toLowerCase() || '').includes(term);
                  })
                  : datosReporte;

                const totalPaginasCursos = Math.ceil(cursosFiltrados.length / ITEMS_POR_PAGINA_CURSOS);

                return totalPaginasCursos > 1 && (
                  <div style={{
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    gap: '0.5rem',
                    marginTop: '1.5rem',
                    paddingTop: '1rem',
                    borderTop: darkMode ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.1)'
                  }}>
                    <button
                      onClick={() => setPaginaActualCursos(prev => Math.max(1, prev - 1))}
                      disabled={paginaActualCursos === 1}
                      style={{
                        padding: '0.5rem 0.75rem',
                        background: paginaActualCursos === 1
                          ? (darkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)')
                          : (darkMode ? 'rgba(239, 68, 68, 0.2)' : 'rgba(239, 68, 68, 0.1)'),
                        border: `1px solid ${paginaActualCursos === 1 ? (darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)') : 'rgba(239, 68, 68, 0.3)'}`,
                        borderRadius: '0.5rem',
                        color: paginaActualCursos === 1 ? themeColors.textMuted : '#ef4444',
                        cursor: paginaActualCursos === 1 ? 'not-allowed' : 'pointer',
                        fontSize: '0.85rem',
                        fontWeight: '600'
                      }}
                    >
                      Anterior
                    </button>

                    <span style={{
                      padding: '0.5rem 1rem',
                      background: darkMode ? 'rgba(239, 68, 68, 0.15)' : 'rgba(239, 68, 68, 0.08)',
                      border: '1px solid rgba(239, 68, 68, 0.3)',
                      borderRadius: '0.5rem',
                      color: themeColors.textPrimary,
                      fontSize: '0.85rem',
                      fontWeight: '600'
                    }}>
                      Página {paginaActualCursos} de {totalPaginasCursos}
                    </span>

                    <button
                      onClick={() => setPaginaActualCursos(prev => Math.min(totalPaginasCursos, prev + 1))}
                      disabled={paginaActualCursos === totalPaginasCursos}
                      style={{
                        padding: '0.5rem 0.75rem',
                        background: paginaActualCursos === totalPaginasCursos
                          ? (darkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)')
                          : (darkMode ? 'rgba(239, 68, 68, 0.2)' : 'rgba(239, 68, 68, 0.1)'),
                        border: `1px solid ${paginaActualCursos === totalPaginasCursos ? (darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)') : 'rgba(239, 68, 68, 0.3)'}`,
                        borderRadius: '0.5rem',
                        color: paginaActualCursos === totalPaginasCursos ? themeColors.textMuted : '#ef4444',
                        cursor: paginaActualCursos === totalPaginasCursos ? 'not-allowed' : 'pointer',
                        fontSize: '0.85rem',
                        fontWeight: '600'
                      }}
                    >
                      Siguiente
                    </button>
                  </div>
                );
              })()}
            </div>
          )}
        </div>
      );
    }

    return (
      <div style={{ textAlign: 'center', padding: '60px 1.25rem', color: themeColors.textMuted }}>
        <AlertCircle size={64} style={{ margin: '0 auto 1rem', opacity: 0.3 }} />
        <p style={{ fontSize: '1.1rem', margin: 0 }}>
          Visualización de estadísticas en desarrollo para este tipo de reporte
        </p>
      </div>
    );
  };

  return (
    <>
      <style>{scrollbarStyles + colorNormalizationStyles}</style>
      <div
        className="reportes-admin-wrapper"
        data-dark={darkMode ? 'true' : 'false'}
        style={{ color: themeColors.textPrimary }}
      >
        <div style={{
          width: '100%',
          maxWidth: '100%',
          overflowX: 'hidden',
          overflowY: 'auto'
        }}>
          <AdminSectionHeader
            title="Reportes y Estadísticas"
            subtitle="Análisis detallado del rendimiento académico y financiero"
          />

          {/* Pestañas: Generar / Historial */}
          <div style={{
            display: 'flex',
            gap: '0.5rem',
            marginBottom: '0.75rem',
            borderBottom: darkMode ? '2px solid rgba(239, 68, 68, 0.3)' : '2px solid rgba(239, 68, 68, 0.18)'
          }}>
            <button
              onClick={() => setVistaActual('generar')}
              style={tabButtonStyle(vistaActual === 'generar')}
            >
              <BarChart3 size={14} color={vistaActual === 'generar' ? '#ef4444' : themeColors.tabInactive} />
              Generar Reporte
            </button>
            <button
              onClick={() => setVistaActual('historial')}
              style={tabButtonStyle(vistaActual === 'historial')}
            >
              <History size={14} color={vistaActual === 'historial' ? '#ef4444' : themeColors.tabInactive} />
              Historial
            </button>
          </div>

          {/* Vista: Generar Reporte */}
          {vistaActual === 'generar' && (
            <>
              {/* Selector de Tipo de Reporte */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fit, minmax(180px, 1fr))',
                gap: '0.625rem',
                marginBottom: '1rem'
              }}>
                {reportesDisponibles.map(reporte => {
                  const isSelected = tipoReporte === reporte.id;
                  const IconComponent = reporte.icono;
                  const accentColor = isSelected ? '#fff' : reporte.color;

                  return (
                    <div
                      key={reporte.id}
                      onClick={() => {
                        setTipoReporte(reporte.id as 'estudiantes' | 'cursos' | 'financiero');
                        setDatosReporte(null);
                        setEstadisticas(null);
                        // Resetear filtros específicos
                        setFiltroEstadoCursoReporte('todos');
                        setFiltroOcupacionCurso('todos');
                        setFiltroHorarioCurso('todos');
                        setFiltroMetodoPago('todos');
                        setFiltroEstadoEstudiante('todos');
                        setFiltroCurso('');
                        setFiltroEstadoPago('todos');
                        setFiltroCursoFinanciero('');
                        setFiltroEstadoCursoFinanciero('todos');
                        setFiltroHorarioFinanciero('todos');
                        setBusquedaRapida('');
                      }}
                      style={{
                        background: isSelected
                          ? (darkMode
                            ? 'linear-gradient(135deg, rgba(248, 113, 113, 0.35) 0%, rgba(239, 68, 68, 0.25) 100%)'
                            : 'linear-gradient(135deg, #ef4444 0%, #f87171 100%)')
                          : themeColors.softCardBg,
                        border: isSelected
                          ? (darkMode ? '2px solid rgba(248, 113, 113, 0.4)' : '2px solid #ef4444')
                          : `1px solid ${themeColors.softCardBorder}`,
                        borderRadius: '0.625rem',
                        padding: isMobile ? '0.75rem' : '0.875rem',
                        cursor: 'pointer',
                        textAlign: 'left',
                        transition: 'all 0.2s ease',
                        boxShadow: isSelected
                          ? (darkMode ? '0 0.25rem 1rem rgba(248, 113, 113, 0.15)' : '0 0.25rem 1rem rgba(239, 68, 68, 0.35)')
                          : themeColors.shadow,
                        position: 'relative',
                        overflow: 'hidden',
                        color: isSelected ? '#fff' : undefined
                      }}
                      onMouseEnter={(e) => {
                        if (!isSelected) {
                          e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.45)';
                          e.currentTarget.style.transform = 'translateY(-2px)';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!isSelected) {
                          e.currentTarget.style.borderColor = themeColors.softCardBorder;
                          e.currentTarget.style.transform = 'translateY(0)';
                        }
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.375rem' }}>
                        <span
                          data-keep-color={isSelected ? 'true' : undefined}
                          style={{ color: accentColor, display: 'flex', alignItems: 'center' }}
                        >
                          <IconComponent size={20} />
                        </span>
                        <div
                          data-keep-color={isSelected ? 'true' : undefined}
                          style={{
                            color: accentColor,
                            fontSize: '0.875rem',
                            fontWeight: '600',
                            lineHeight: '1.2'
                          }}
                        >
                          {reporte.titulo}
                        </div>
                      </div>
                      <div
                        data-keep-color={isSelected ? 'true' : undefined}
                        style={{
                          color: isSelected ? '#fff' : themeColors.textMuted,
                          fontSize: '0.75rem',
                          lineHeight: '1.3'
                        }}
                      >
                        {reporte.descripcion}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Controles de Filtro */}
              <div style={{
                background: themeColors.panelBg,
                backdropFilter: 'blur(1.25rem)',
                border: `1px solid ${themeColors.panelBorder}`,
                borderRadius: isMobile ? '12px' : '1rem',
                padding: isMobile ? '12px' : '1rem',
                marginBottom: '1rem'
              }}>
                <div style={{
                  display: 'flex',
                  flexDirection: isMobile ? 'column' : 'row',
                  flexWrap: 'wrap',
                  gap: '0.75rem',
                  alignItems: isMobile ? 'stretch' : 'center',
                  justifyContent: 'space-between'
                }}>
                  <div style={{
                    display: 'flex',
                    flexDirection: isMobile ? 'column' : 'row',
                    gap: '0.75rem',
                    alignItems: isMobile ? 'stretch' : 'center',
                    flex: 1,
                    flexWrap: 'wrap'
                  }}>
                    {/* Selector de Período */}
                    <div style={{ minWidth: isMobile ? 'auto' : 200, flex: isMobile ? '1' : 'initial' }}>
                      <select
                        value={periodosSeleccionados[tipoReporte]}
                        onChange={(e) => setPeriodosSeleccionados(prev => ({
                          ...prev,
                          [tipoReporte]: e.target.value
                        }))}
                        style={{
                          ...baseSelectStyle,
                          padding: '10px 0.75rem',
                          fontSize: '0.8rem',
                          minWidth: '15.625rem'
                        }}
                      >
                        <option value="todos" style={{ background: darkMode ? '#1a1a1a' : '#fff', color: darkMode ? '#f8fafc' : '#1f2937' }}>Todos los períodos</option>
                        {periodosDisponibles.map((periodo, idx) => {
                          const formatearFecha = (fecha: string): string => {
                            if (!fecha) return '';
                            const [año, mes, dia] = fecha.split('T')[0].split('-');
                            const meses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
                            const mesNombre = meses[parseInt(mes) - 1];
                            return `${parseInt(dia)} ${mesNombre} ${año}`;
                          };

                          const fechaInicio = formatearFecha(periodo.inicio);
                          const fechaFin = formatearFecha(periodo.fin);

                          return (
                            <option
                              key={idx}
                              value={periodo.key}
                              style={{ background: darkMode ? '#1a1a1a' : '#fff', color: darkMode ? '#f8fafc' : '#1f2937' }}
                            >
                              {fechaInicio} - {fechaFin}
                            </option>
                          );
                        })}
                      </select>
                    </div>

                    {/* Filtros específicos */}
                    {renderFiltrosEspecificos()}

                  </div>

                  {/* Botón Ver Reporte */}
                  <button
                    data-keep-color="true"
                    onClick={generarReporte}
                    disabled={loading || descargando}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.5rem',
                      padding: isMobile ? '10px 1rem' : '12px 1.5rem',
                      background: loading
                        ? (darkMode ? 'rgba(239, 68, 68, 0.32)' : 'rgba(239, 68, 68, 0.22)')
                        : (darkMode
                          ? 'linear-gradient(135deg, #ef4444, #dc2626)'
                          : 'linear-gradient(135deg, #ef4444, #f87171)'),
                      border: 'none',
                      borderRadius: '0.625rem',
                      fontSize: '0.8rem',
                      fontWeight: '600',
                      cursor: loading ? 'not-allowed' : 'pointer',
                      boxShadow: darkMode ? '0 0.25rem 0.75rem rgba(239, 68, 68, 0.3)' : '0 0.25rem 0.6rem rgba(239, 68, 68, 0.22)',
                      width: isSmallScreen ? '100%' : 'auto'
                    }}
                  >
                    {loading ? (
                      <span data-keep-color="true" style={{ display: 'flex', alignItems: 'center' }}>
                        <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />
                      </span>
                    ) : (
                      <span data-keep-color="true" style={{ display: 'flex', alignItems: 'center' }}>
                        <Eye size={16} />
                      </span>
                    )}
                    <span data-keep-color="true">{loading ? 'Generando...' : 'Ver Reporte'}</span>
                  </button>
                </div>
              </div>

              {/* Botones de Exportación */}
              <div style={{
                display: 'flex',
                flexDirection: isMobile ? 'column' : 'row',
                gap: '0.75rem',
                marginBottom: '1rem',
                justifyContent: isMobile ? 'stretch' : 'flex-end'
              }}>
                <button
                  onClick={() => descargarArchivo('pdf')}
                  disabled={!datosReporte || descargando || loading}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem',
                    padding: '10px 1.25rem',
                    background: (!datosReporte || descargando || loading) ? themeColors.pdfBgDisabled : themeColors.pdfBg,
                    border: `1px solid ${themeColors.pdfBorder}`,
                    borderRadius: '0.5rem',
                    color: themeColors.pdfText,
                    fontSize: '0.8rem',
                    fontWeight: '600',
                    cursor: (!datosReporte || descargando || loading) ? 'not-allowed' : 'pointer',
                    opacity: (!datosReporte || descargando || loading) ? 0.55 : 1,
                    width: isMobile ? '100%' : 'auto'
                  }}
                >
                  {descargando
                    ? <Loader2 size={16} color={themeColors.pdfText} style={{ animation: 'spin 1s linear infinite' }} />
                    : <Download size={16} color={themeColors.pdfText} />}
                  <span style={{ color: themeColors.pdfText }}>Exportar PDF</span>
                </button>
                <button
                  onClick={() => descargarArchivo('excel')}
                  disabled={!datosReporte || descargando || loading}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem',
                    padding: '10px 1.25rem',
                    background: (!datosReporte || descargando || loading) ? themeColors.excelBgDisabled : themeColors.excelBg,
                    border: `1px solid ${themeColors.excelBorder}`,
                    borderRadius: '0.5rem',
                    color: themeColors.excelText,
                    fontSize: '0.8rem',
                    fontWeight: '600',
                    cursor: (!datosReporte || descargando || loading) ? 'not-allowed' : 'pointer',
                    opacity: (!datosReporte || descargando || loading) ? 0.55 : 1,
                    width: isMobile ? '100%' : 'auto'
                  }}
                >
                  {descargando
                    ? <Loader2 size={16} color={themeColors.excelText} style={{ animation: 'spin 1s linear infinite' }} />
                    : <FileSpreadsheet size={16} color={themeColors.excelText} />}
                  <span style={{ color: themeColors.excelText }}>Exportar Excel</span>
                </button>
              </div>

              {/* Contenido del Reporte */}
              <div style={{
                background: themeColors.panelBg,
                backdropFilter: 'blur(1.25rem)',
                border: `1px solid ${themeColors.panelBorder}`,
                borderRadius: isMobile ? '12px' : '1.25rem',
                padding: isMobile ? '12px' : '2rem',
                overflow: 'visible',
                width: '100%',
                boxSizing: 'border-box'
              }}>
                <div style={{ marginBottom: '1rem' }}>
                  <h3 style={{
                    color: themeColors.textPrimary,
                    fontSize: isMobile ? '0.95rem' : '1.1rem',
                    fontWeight: '700',
                    margin: '0 0 0.375rem 0'
                  }}>
                    {reportesDisponibles.find(r => r.id === tipoReporte)?.titulo}
                  </h3>
                  <p style={{
                    color: themeColors.textMuted,
                    margin: 0,
                    fontSize: isMobile ? '0.7rem' : '0.75rem',
                    wordBreak: 'break-word'
                  }}>
                    Período: {fechaInicio} - {fechaFin}
                  </p>
                </div>

                {error && (
                  <div style={{
                    background: darkMode ? 'rgba(239, 68, 68, 0.12)' : 'rgba(239, 68, 68, 0.08)',
                    border: darkMode ? '1px solid rgba(239, 68, 68, 0.3)' : '1px solid rgba(239, 68, 68, 0.18)',
                    borderRadius: isMobile ? '10px' : '0.75rem',
                    padding: isMobile ? '12px' : '1rem',
                    marginBottom: '1.5rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    color: '#ef4444'
                  }}>
                    <AlertCircle size={20} />
                    <span>{error}</span>
                  </div>
                )}

                {renderEstadisticas()}
              </div>
            </>
          )}

          {/* Vista: Historial */}
          {vistaActual === 'historial' && (
            <div style={{
              background: themeColors.panelBg,
              backdropFilter: 'blur(1.25rem)',
              border: `1px solid ${themeColors.panelBorder}`,
              borderRadius: '0.75rem',
              padding: '1rem'
            }}>
              <div style={{ marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h3 style={{ color: themeColors.textPrimary, margin: '0 0 0.25rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <History size={22} color="#ef4444" />
                    Historial de Reportes
                  </h3>
                  <p style={{ color: themeColors.textMuted, margin: 0, fontSize: '0.75rem' }}>
                    Últimos 50 reportes generados
                  </p>
                </div>
                <select
                  value={filtroTipoHistorial}
                  onChange={(e) => setFiltroTipoHistorial(e.target.value)}
                  style={{
                    ...baseSelectStyle,
                    padding: '8px 0.75rem',
                    fontSize: '0.8rem'
                  }}
                >
                  <option value="todos" style={{ background: darkMode ? '#1a1a1a' : '#fff', color: darkMode ? '#f8fafc' : '#1f2937' }}>Todos los tipos</option>
                  <option value="1" style={{ background: darkMode ? '#1a1a1a' : '#fff', color: darkMode ? '#f8fafc' : '#1f2937' }}>Estudiantes</option>
                  <option value="2" style={{ background: darkMode ? '#1a1a1a' : '#fff', color: darkMode ? '#f8fafc' : '#1f2937' }}>Financiero</option>
                  <option value="3" style={{ background: darkMode ? '#1a1a1a' : '#fff', color: darkMode ? '#f8fafc' : '#1f2937' }}>Cursos</option>
                </select>
              </div>

              {loadingHistorial ? (
                <div style={{ textAlign: 'center', padding: '40px 1.25rem' }}>
                  <Loader2 size={36} color="#ef4444" style={{ animation: 'spin 1s linear infinite', margin: '0 auto 0.75rem' }} />
                  <p style={{ color: themeColors.textMuted, fontSize: '0.85rem' }}>Cargando historial...</p>
                </div>
              ) : historialReportes.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px 1.25rem' }}>
                  <History size={48} color={darkMode ? 'rgba(255,255,255,0.3)' : 'rgba(15,23,42,0.25)'} style={{ margin: '0 auto 0.75rem' }} />
                  <p style={{ color: themeColors.textMuted, fontSize: '0.85rem' }}>No hay reportes generados aún</p>
                </div>
              ) : (
                (() => {
                  // Filtrar reportes
                  const reportesFiltrados = historialReportes.filter(r =>
                    filtroTipoHistorial === 'todos' || r.id_tipo_reporte === parseInt(filtroTipoHistorial)
                  );

                  // Calcular paginación
                  const totalPaginasHistorial = Math.ceil(reportesFiltrados.length / ITEMS_POR_PAGINA_HISTORIAL);
                  const indiceInicioHistorial = (paginaActualHistorial - 1) * ITEMS_POR_PAGINA_HISTORIAL;
                  const indiceFinHistorial = indiceInicioHistorial + ITEMS_POR_PAGINA_HISTORIAL;
                  const reportesPaginados = reportesFiltrados.slice(indiceInicioHistorial, indiceFinHistorial);

                  return (
                    <>
                      <div style={{ display: 'grid', gap: '0.75rem' }}>
                        {reportesPaginados.map((reporte, idx) => {
                          const tipoIcono = reporte.id_tipo_reporte === 1 ? Users : reporte.id_tipo_reporte === 2 ? DollarSign : BookOpen;
                          const tipoColor = reporte.id_tipo_reporte === 1 ? '#3b82f6' : reporte.id_tipo_reporte === 2 ? '#f59e0b' : '#10b981';

                          // Verificar si hay datos relevantes para mostrar en el snapshot
                          const hasSnapshotData = reporte.snapshot && (
                            (reporte.id_tipo_reporte === 1 && Number(reporte.snapshot.total_estudiantes || 0) > 0) ||
                            (reporte.id_tipo_reporte === 2 && (Number(reporte.snapshot.monto_total || 0) > 0 || Number(reporte.snapshot.total_transacciones || 0) > 0)) ||
                            (reporte.id_tipo_reporte === 3 && Number(reporte.snapshot.total_cursos || 0) > 0)
                          );

                          return (
                            <div key={idx} style={{
                              background: darkMode ? 'rgba(255,255,255,0.05)' : 'rgba(15,23,42,0.05)',
                              border: darkMode ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(15,23,42,0.12)',
                              borderRadius: '0.625rem',
                              padding: isMobile ? '10px' : '0.75rem',
                              transition: 'all 0.3s ease',
                              cursor: 'pointer'
                            }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.background = darkMode ? 'rgba(255,255,255,0.08)' : 'rgba(15,23,42,0.08)';
                                e.currentTarget.style.borderColor = tipoColor;
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.background = darkMode ? 'rgba(255,255,255,0.05)' : 'rgba(15,23,42,0.05)';
                                e.currentTarget.style.borderColor = darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(15,23,42,0.12)';
                              }}
                            >
                              <div style={{
                                display: 'flex',
                                flexDirection: isMobile ? 'column' : 'row',
                                gap: isMobile ? '10px' : '0.875rem',
                                alignItems: isMobile ? 'stretch' : 'start'
                              }}>
                                <div style={{
                                  background: `${tipoColor}20`,
                                  border: `2px solid ${tipoColor}`,
                                  borderRadius: '0.625rem',
                                  padding: isMobile ? '8px' : '0.625rem',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  alignSelf: isMobile ? 'center' : 'flex-start'
                                }}>
                                  {React.createElement(tipoIcono, { size: isMobile ? 18 : 20, color: tipoColor })}
                                </div>

                                <div style={{ flex: 1 }}>
                                  <div style={{
                                    display: 'flex',
                                    flexDirection: isMobile ? 'column' : 'row',
                                    justifyContent: 'space-between',
                                    alignItems: isMobile ? 'flex-start' : 'start',
                                    marginBottom: '0.5rem',
                                    gap: isMobile ? '6px' : '0'
                                  }}>
                                    <div>
                                      <h4 style={{
                                        color: themeColors.textPrimary,
                                        fontSize: isMobile ? '0.85rem' : '0.9rem',
                                        fontWeight: '600',
                                        margin: '0 0 0.1875rem 0',
                                        wordBreak: 'break-word'
                                      }}>
                                        {reporte.nombre_reporte}
                                      </h4>
                                      <p style={{
                                        color: themeColors.textMuted,
                                        fontSize: isMobile ? '0.7rem' : '0.75rem',
                                        margin: 0,
                                        wordBreak: 'break-all'
                                      }}>
                                        {reporte.archivo_generado}
                                      </p>
                                    </div>
                                    <span style={{
                                      padding: '3px 0.625rem',
                                      background: `${tipoColor}20`,
                                      border: `1px solid ${tipoColor}`,
                                      borderRadius: '0.3125rem',
                                      color: tipoColor,
                                      fontSize: '0.7rem',
                                      fontWeight: '600',
                                      textTransform: 'uppercase'
                                    }}>
                                      {reporte.formato_generado}
                                    </span>
                                  </div>

                                  <div style={{
                                    display: 'flex',
                                    flexDirection: isMobile ? 'column' : 'row',
                                    gap: isMobile ? '4px' : '1rem',
                                    fontSize: isMobile ? '0.7rem' : '0.75rem',
                                    color: themeColors.textMuted
                                  }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.3125rem' }}>
                                      <User size={isMobile ? 10 : 12} />
                                      <span>{reporte.generado_por}</span>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.3125rem' }}>
                                      <Clock size={isMobile ? 10 : 12} />
                                      <span>{new Date(reporte.fecha_generacion).toLocaleString('es-ES', {
                                        day: '2-digit',
                                        month: 'short',
                                        year: 'numeric',
                                        hour: '2-digit',
                                        minute: '2-digit'
                                      })}</span>
                                    </div>
                                  </div>

                                  {/* SNAPSHOT DATA DISPLAY */}
                                  {hasSnapshotData && (
                                    <div style={{
                                      marginTop: '0.5rem',
                                      padding: '0.5rem',
                                      background: darkMode ? 'rgba(0,0,0,0.2)' : 'rgba(0,0,0,0.03)',
                                      borderRadius: '0.375rem',
                                      fontSize: '0.75rem',
                                      display: 'flex',
                                      flexWrap: 'wrap',
                                      gap: '0.75rem',
                                      borderLeft: `2px solid ${tipoColor}`
                                    }}>
                                      {/* Reporte Estudiantes */}
                                      {reporte.id_tipo_reporte === 1 && (
                                        <>
                                          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                            <Users size={12} color={themeColors.textSecondary} />
                                            <span style={{ fontWeight: 600, color: themeColors.textPrimary }}>{reporte.snapshot.total_estudiantes || 0}</span> estudiantes
                                          </span>
                                          {reporte.snapshot.nuevos_inscritos > 0 && (
                                            <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#10b981' }}>
                                              <TrendingUp size={12} />
                                              +{reporte.snapshot.nuevos_inscritos} nuevos
                                            </span>
                                          )}
                                        </>
                                      )}

                                      {/* Reporte Financiero */}
                                      {reporte.id_tipo_reporte === 2 && (
                                        <>
                                          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                            <DollarSign size={12} color="#10b981" />
                                            <span style={{ fontWeight: 700, color: '#10b981' }}>${reporte.snapshot.monto_total || '0.00'}</span>
                                          </span>
                                          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                            <FileText size={12} color={themeColors.textSecondary} />
                                            {reporte.snapshot.total_transacciones || 0} pagos
                                          </span>
                                        </>
                                      )}

                                      {/* Reporte Cursos */}
                                      {reporte.id_tipo_reporte === 3 && (
                                        <>
                                          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                            <BookOpen size={12} color={themeColors.textSecondary} />
                                            <span style={{ fontWeight: 600, color: themeColors.textPrimary }}>{reporte.snapshot.total_cursos || 0}</span> cursos
                                          </span>
                                          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                            <BarChart3 size={12} color={themeColors.textSecondary} />
                                            {reporte.snapshot.promedio_ocupacion || '0'}% ocupación
                                          </span>
                                        </>
                                      )}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {/* Controles de Paginación */}
                      {(() => {
                        const reportesFiltrados = historialReportes.filter(r =>
                          filtroTipoHistorial === 'todos' || r.id_tipo_reporte === parseInt(filtroTipoHistorial)
                        );
                        const totalPaginasHistorial = Math.ceil(reportesFiltrados.length / ITEMS_POR_PAGINA_HISTORIAL);

                        return totalPaginasHistorial > 1 && (
                          <div style={{
                            display: 'flex',
                            justifyContent: 'center',
                            alignItems: 'center',
                            gap: '0.5rem',
                            marginTop: '1.5rem',
                            paddingTop: '1rem',
                            borderTop: darkMode ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.1)'
                          }}>
                            <button
                              onClick={() => setPaginaActualHistorial(prev => Math.max(1, prev - 1))}
                              disabled={paginaActualHistorial === 1}
                              style={{
                                padding: '0.5rem 0.75rem',
                                background: paginaActualHistorial === 1
                                  ? (darkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)')
                                  : (darkMode ? 'rgba(239, 68, 68, 0.2)' : 'rgba(239, 68, 68, 0.1)'),
                                border: `1px solid ${paginaActualHistorial === 1 ? (darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)') : 'rgba(239, 68, 68, 0.3)'}`,
                                borderRadius: '0.5rem',
                                color: paginaActualHistorial === 1 ? themeColors.textMuted : '#ef4444',
                                cursor: paginaActualHistorial === 1 ? 'not-allowed' : 'pointer',
                                fontSize: '0.85rem',
                                fontWeight: '600'
                              }}
                            >
                              Anterior
                            </button>

                            <span style={{
                              padding: '0.5rem 1rem',
                              background: darkMode ? 'rgba(239, 68, 68, 0.15)' : 'rgba(239, 68, 68, 0.08)',
                              border: '1px solid rgba(239, 68, 68, 0.3)',
                              borderRadius: '0.5rem',
                              color: themeColors.textPrimary,
                              fontSize: '0.85rem',
                              fontWeight: '600'
                            }}>
                              Página {paginaActualHistorial} de {totalPaginasHistorial}
                            </span>

                            <button
                              onClick={() => setPaginaActualHistorial(prev => Math.min(totalPaginasHistorial, prev + 1))}
                              disabled={paginaActualHistorial === totalPaginasHistorial}
                              style={{
                                padding: '0.5rem 0.75rem',
                                background: paginaActualHistorial === totalPaginasHistorial
                                  ? (darkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)')
                                  : (darkMode ? 'rgba(239, 68, 68, 0.2)' : 'rgba(239, 68, 68, 0.1)'),
                                border: `1px solid ${paginaActualHistorial === totalPaginasHistorial ? (darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)') : 'rgba(239, 68, 68, 0.3)'}`,
                                borderRadius: '0.5rem',
                                color: paginaActualHistorial === totalPaginasHistorial ? themeColors.textMuted : '#ef4444',
                                cursor: paginaActualHistorial === totalPaginasHistorial ? 'not-allowed' : 'pointer',
                                fontSize: '0.85rem',
                                fontWeight: '600'
                              }}
                            >
                              Siguiente
                            </button>
                          </div>
                        );
                      })()}
                    </>
                  );
                })()
              )}
            </div>
          )}

          <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>

        </div>
      </div>
    </>
  );
};

export default Reportes;




