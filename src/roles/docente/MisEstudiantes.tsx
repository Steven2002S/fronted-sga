import { useState, useEffect } from 'react';
import { Users, Award, Star, Calendar, BookOpen, ChevronLeft, ChevronRight, Grid, List } from 'lucide-react';
import { useBreakpoints } from '../../hooks/useMediaQuery';
import '../../styles/responsive.css';

const API_BASE = (import.meta as any).env?.VITE_API_URL || 'http://localhost:3000';

interface MisEstudiantesProps {
  darkMode: boolean;
}

interface Estudiante {
  id_usuario: number;
  nombre: string;
  apellido: string;
  cedula: string;
  email: string;
  telefono?: string;
  curso_nombre: string;
  codigo_curso: string;
  promedio?: number;
  fecha_inicio_curso?: string;
  fecha_fin_curso?: string;
  estado_curso?: 'activo' | 'finalizado' | 'planificado' | 'cancelado';
  // Add fields that might be available from the current API
  fecha_matricula?: string;
}

const MisEstudiantes: React.FC<MisEstudiantesProps> = ({ darkMode }) => {
  const { isMobile } = useBreakpoints();
  const [estudiantes, setEstudiantes] = useState<Estudiante[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [cursoFiltro, setCursoFiltro] = useState<string>('');
  const [estadoFiltro, setEstadoFiltro] = useState<'todos' | 'activos' | 'finalizados'>('todos');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('cards');

  useEffect(() => {
    fetchEstudiantes();
  }, []);

  const fetchEstudiantes = async () => {
    try {
      setLoading(true);
      const token = sessionStorage.getItem('auth_token');

      if (!token) {
        console.error('No hay token de autenticación');
        return;
      }

      const response = await fetch(`${API_BASE}/api/docentes/mis-estudiantes`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();

        // Sort students alphabetically by apellido
        const sortedData = [...data].sort((a: Estudiante, b: Estudiante) => {
          const apellidoA = (a.apellido || '').trim().toUpperCase();
          const apellidoB = (b.apellido || '').trim().toUpperCase();
          return apellidoA.localeCompare(apellidoB, 'es');
        });
        setEstudiantes(sortedData);
      } else {
        console.error('Error al cargar estudiantes');
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
        warning: '#f59e0b',
        danger: '#ef4444'
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
        warning: '#d97706',
        danger: '#dc2626'
      };
    }
  };

  const theme = getThemeColors();

  // Get unique courses for filter dropdown
  const cursosUnicos = Array.from(new Set(estudiantes.map(e => `${e.codigo_curso}||${e.curso_nombre}`)))
    .map(k => ({ codigo: k.split('||')[0], nombre: k.split('||')[1] }));

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, cursoFiltro, estadoFiltro]);

  // Filter students based on search, course, and status filters
  const estudiantesFiltrados = estudiantes.filter(est => {
    const matchTexto =
      est.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      est.apellido.toLowerCase().includes(searchTerm.toLowerCase()) ||
      est.cedula.includes(searchTerm) ||
      est.curso_nombre.toLowerCase().includes(searchTerm.toLowerCase());

    const matchCurso = !cursoFiltro || est.codigo_curso === cursoFiltro;

    const studentEstado = est.estado_curso || 'activo';

    const matchEstado = estadoFiltro === 'todos' ||
      (estadoFiltro === 'activos' && studentEstado === 'activo') ||
      (estadoFiltro === 'finalizados' && studentEstado === 'finalizado');

    return matchTexto && matchCurso && matchEstado;
  }).sort((a, b) => {
    const apellidoA = (a.apellido || '').trim().toUpperCase();
    const apellidoB = (b.apellido || '').trim().toUpperCase();
    return apellidoA.localeCompare(apellidoB, 'es');
  });

  // Pagination logic
  const totalPages = Math.ceil(estudiantesFiltrados.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const estudiantesPaginados = estudiantesFiltrados.slice(startIndex, endIndex);

  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  // Format date for display
  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES');
  };

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '3.75em', color: theme.textSecondary }}>Cargando estudiantes...</div>;
  }

  return (
    <div style={{ minHeight: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{ marginBottom: '1em' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: '700', color: theme.textPrimary, margin: '0 0 0.375rem 0' }}>
          Mis Estudiantes
        </h2>
        <p style={{ color: theme.textMuted, fontSize: '0.8125rem', margin: 0 }}>
          Gestiona y monitorea el progreso de tus estudiantes
        </p>
      </div>

      {/* Estadísticas (ultra-compactas, una sola línea) */}
      <div className="responsive-grid-4" style={{ gap: '0.375em', marginBottom: '0.75em' }}>
        <div style={{ background: `linear-gradient(135deg, #3b82f6, #2563eb)`, borderRadius: '0.625em', padding: '0.375em' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.375em', whiteSpace: 'nowrap', color: '#fff' }}>
            <Users size={12} />
            <span style={{ fontSize: '0.7rem', fontWeight: '700' }}>Total:</span>
            <span style={{ fontSize: '0.9rem', fontWeight: '800' }}>{estudiantesFiltrados.length}</span>
          </div>
        </div>
        <div style={{ background: `linear-gradient(135deg, #10b981, #059669)`, borderRadius: '0.625em', padding: '0.375em' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.375em', whiteSpace: 'nowrap', color: '#fff' }}>
            <Award size={12} />
            <span style={{ fontSize: '0.7rem', fontWeight: '700' }}>Destacados:</span>
            <span style={{ fontSize: '0.9rem', fontWeight: '800' }}>{estudiantesFiltrados.filter(e => e.promedio && e.promedio >= 8).length}</span>
          </div>
        </div>
        <div style={{ background: `linear-gradient(135deg, #f59e0b, #d97706)`, borderRadius: '0.625em', padding: '0.375em' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.375em', whiteSpace: 'nowrap', color: '#fff' }}>
            <Star size={12} />
            <span style={{ fontSize: '0.7rem', fontWeight: '700' }}>Promedio:</span>
            <span style={{ fontSize: '0.9rem', fontWeight: '800' }}>{estudiantesFiltrados.length > 0 ? (estudiantesFiltrados.reduce((acc, e) => acc + (e.promedio || 0), 0) / estudiantesFiltrados.length).toFixed(1) : '0.0'}</span>
          </div>
        </div>
        <div style={{ background: `linear-gradient(135deg, #8b5cf6, #7c3aed)`, borderRadius: '0.625em', padding: '0.375em' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.375em', whiteSpace: 'nowrap', color: '#fff' }}>
            <BookOpen size={12} />
            <span style={{ fontSize: '0.7rem', fontWeight: '700' }}>Cursos:</span>
            <span style={{ fontSize: '0.9rem', fontWeight: '800' }}>{cursosUnicos.length}</span>
          </div>
        </div>
      </div>

      {/* Filtros y Toggle de vista en una sola línea */}
      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
        <input
          type="text"
          placeholder="Buscar por nombre, cédula o curso..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{
            flex: '1 1 auto',
            minWidth: '200px',
            padding: '0.5rem 0.75rem',
            background: darkMode ? 'rgba(255,255,255,0.05)' : '#fff',
            border: `1px solid ${theme.border}`,
            borderRadius: '0.5rem',
            color: theme.textPrimary,
            fontSize: '0.875rem',
            outline: 'none',
            transition: 'border-color 0.3s ease'
          }}
          onFocus={(e) => e.currentTarget.style.borderColor = theme.accent}
          onBlur={(e) => e.currentTarget.style.borderColor = theme.border}
        />
        <select
          value={cursoFiltro}
          onChange={(e) => setCursoFiltro(e.target.value)}
          style={{
            flex: '0 1 auto',
            minWidth: '150px',
            padding: '0.5rem 0.75rem',
            background: darkMode ? 'rgba(255,255,255,0.05)' : '#fff',
            border: `1px solid ${theme.border}`,
            borderRadius: '0.5rem',
            color: theme.textPrimary,
            fontSize: '0.875rem',
            outline: 'none',
            cursor: 'pointer',
            transition: 'border-color 0.3s ease'
          }}
          onFocus={(e) => e.currentTarget.style.borderColor = theme.accent}
          onBlur={(e) => e.currentTarget.style.borderColor = theme.border}
        >
          <option value="">Todos los cursos</option>
          {cursosUnicos.map(c => (
            <option key={c.codigo} value={c.codigo}>{c.codigo} - {c.nombre}</option>
          ))}
        </select>
        <select
          value={estadoFiltro}
          onChange={(e) => setEstadoFiltro(e.target.value as 'todos' | 'activos' | 'finalizados')}
          style={{
            flex: '0 1 auto',
            minWidth: '150px',
            padding: '0.5rem 0.75rem',
            background: darkMode ? 'rgba(255,255,255,0.05)' : '#fff',
            border: `1px solid ${theme.border}`,
            borderRadius: '0.5rem',
            color: theme.textPrimary,
            fontSize: '0.875rem',
            outline: 'none',
            cursor: 'pointer',
            transition: 'border-color 0.3s ease'
          }}
          onFocus={(e) => e.currentTarget.style.borderColor = theme.accent}
          onBlur={(e) => e.currentTarget.style.borderColor = theme.border}
        >
          <option value="todos">Todos los estados</option>
          <option value="activos">Cursos Activos</option>
          <option value="finalizados">Cursos Finalizados</option>
        </select>

        {/* Toggle de vista */}
        <button
          onClick={() => setViewMode('cards')}
          style={{
            padding: '0.5rem 1rem',
            background: viewMode === 'cards'
              ? `linear-gradient(135deg, ${theme.accent}, #2563eb)`
              : (darkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'),
            border: `1px solid ${viewMode === 'cards' ? theme.accent : theme.border}`,
            borderRadius: '0.5rem',
            color: viewMode === 'cards' ? '#fff' : theme.textPrimary,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            fontSize: '0.875rem',
            fontWeight: '600',
            transition: 'all 0.2s ease'
          }}
        >
          <Grid size={16} />
          Tarjetas
        </button>
        <button
          onClick={() => setViewMode('table')}
          style={{
            padding: '0.5rem 1rem',
            background: viewMode === 'table'
              ? `linear-gradient(135deg, ${theme.accent}, #2563eb)`
              : (darkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'),
            border: `1px solid ${viewMode === 'table' ? theme.accent : theme.border}`,
            borderRadius: '0.5rem',
            color: viewMode === 'table' ? '#fff' : theme.textPrimary,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            fontSize: '0.875rem',
            fontWeight: '600',
            transition: 'all 0.2s ease'
          }}
        >
          <List size={16} />
          Tabla
        </button>
      </div>

      <div style={{ flex: 1 }}>
        {estudiantesFiltrados.length === 0 ? (
          <div style={{
            padding: '3.75em 1.25em',
            textAlign: 'center'
          }}>
            <Users size={64} color={theme.textMuted} style={{ marginBottom: '1em', opacity: 0.5 }} />
            <h3 style={{ color: theme.textPrimary, margin: '0 0 0.5em 0' }}>
              {searchTerm || cursoFiltro || estadoFiltro !== 'todos'
                ? 'No se encontraron estudiantes'
                : 'No tienes estudiantes asignados'}
            </h3>
            <p style={{ color: theme.textMuted, margin: 0 }}>
              {searchTerm || cursoFiltro || estadoFiltro !== 'todos'
                ? 'Intenta con otros términos de búsqueda'
                : 'Los estudiantes aparecerán aquí cuando se matriculen en tus cursos'}
            </p>
          </div>
        ) : viewMode === 'table' ? (
          <div style={{
            overflowX: 'auto',
            background: darkMode ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)',
            borderRadius: '0.75rem',
            boxShadow: darkMode
              ? '0 2px 12px rgba(0, 0, 0, 0.3)'
              : '0 2px 12px rgba(0, 0, 0, 0.08)'
          }}>
            {/* Header de la tabla mejorado */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '2fr 1fr 1.5fr 1fr 1fr 1fr',
              gap: '0.75rem',
              padding: '0.75rem 1rem',
              background: darkMode ? 'rgba(59, 130, 246, 0.15)' : 'rgba(59, 130, 246, 0.1)',
              borderBottom: `1px solid ${theme.border}`,
              fontWeight: '700',
              fontSize: '0.7rem',
              color: darkMode ? theme.accent : '#1e40af',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              minWidth: '800px'
            }}>
              <div>Estudiante</div>
              <div>Cédula</div>
              <div>Curso</div>
              <div>Estado</div>
              <div>Inicio</div>
              <div>Fin</div>
            </div>

            {/* Filas de estudiantes */}
            <div style={{ display: 'grid', gap: '0', padding: '0.5rem 1rem 1rem 1rem', minWidth: '800px' }}>
              {estudiantesPaginados.map((estudiante) => {
                // Determine status color
                let statusColor = theme.textMuted;
                let statusBg = 'rgba(156, 163, 175, 0.2)';
                let statusText = 'Desconocido';

                const studentEstado = estudiante.estado_curso || 'activo';

                switch (studentEstado) {
                  case 'activo':
                    statusColor = theme.success;
                    statusBg = 'rgba(16, 185, 129, 0.2)';
                    statusText = 'Activo';
                    break;
                  case 'finalizado':
                    statusColor = theme.textMuted;
                    statusBg = 'rgba(156, 163, 175, 0.2)';
                    statusText = 'Finalizado';
                    break;
                  case 'planificado':
                    statusColor = theme.warning;
                    statusBg = 'rgba(245, 158, 11, 0.2)';
                    statusText = 'Planificado';
                    break;
                  case 'cancelado':
                    statusColor = theme.danger;
                    statusBg = 'rgba(239, 68, 68, 0.2)';
                    statusText = 'Cancelado';
                    break;
                  default:
                    statusText = studentEstado || 'Activo (asumido)';
                }

                return (
                  <div
                    key={`${estudiante.id_usuario}-${estudiante.codigo_curso}`}
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '2fr 1fr 1.5fr 1fr 1fr 1fr',
                      gap: '0.75rem',
                      padding: '0.75rem 0.5rem',
                      background: estudiantesPaginados.indexOf(estudiante) % 2 === 0
                        ? (darkMode ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.025)')
                        : (darkMode ? 'rgba(255,255,255,0.01)' : 'rgba(0,0,0,0.01)'),
                      borderRadius: '0.375rem',
                      alignItems: 'center',
                      transition: 'all 0.2s ease',
                      cursor: 'pointer'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = darkMode ? 'rgba(59, 130, 246, 0.15)' : 'rgba(59, 130, 246, 0.08)';
                    }}
                    onMouseLeave={(e) => {
                      const index = estudiantesPaginados.indexOf(estudiante);
                      e.currentTarget.style.background = index % 2 === 0
                        ? (darkMode ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.025)')
                        : (darkMode ? 'rgba(255,255,255,0.01)' : 'rgba(0,0,0,0.01)');
                    }}
                  >
                    {/* Columna: Estudiante */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.625em', minWidth: 0 }}>
                      <div style={{
                        width: '1.75rem',
                        height: '1.75rem',
                        borderRadius: '50%',
                        background: `linear-gradient(135deg, ${theme.accent}, ${theme.accent}dd)`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#fff',
                        fontSize: '0.8rem',
                        fontWeight: '800',
                        flexShrink: 0
                      }}>
                        {estudiante.nombre.charAt(0)}{estudiante.apellido.charAt(0)}
                      </div>
                      <div style={{ overflow: 'hidden', color: theme.textPrimary, fontSize: '0.85rem', fontWeight: '700', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {estudiante.apellido}, {estudiante.nombre}
                      </div>
                    </div>

                    {/* Columna: Cédula */}
                    <div style={{ color: theme.textSecondary, fontSize: '0.8rem', whiteSpace: 'nowrap' }}>
                      {estudiante.cedula}
                    </div>

                    {/* Columna: Curso */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5em', overflow: 'hidden', minWidth: 0 }}>
                      <span style={{
                        background: `${theme.accent}20`,
                        color: theme.accent,
                        padding: '0.1875em 0.5em',
                        borderRadius: '0.625em',
                        fontSize: '0.7rem',
                        fontWeight: '700',
                        flexShrink: 0
                      }}>
                        {estudiante.codigo_curso}
                      </span>
                      <span style={{
                        color: theme.textPrimary,
                        fontSize: '0.85rem',
                        fontWeight: '600',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}>
                        {estudiante.curso_nombre}
                      </span>
                    </div>

                    {/* Columna: Estado */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.375em' }}>
                      <span style={{
                        background: statusBg,
                        color: statusColor,
                        padding: '0.1875em 0.5em',
                        borderRadius: '0.625em',
                        fontSize: '0.7rem',
                        fontWeight: '700',
                        whiteSpace: 'nowrap'
                      }}>
                        {statusText}
                      </span>
                    </div>

                    {/* Columna: Fecha Inicio */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.375em' }}>
                      <Calendar size={12} color={theme.textMuted} />
                      <span style={{ color: theme.textSecondary, fontSize: '0.75rem' }}>
                        {formatDate(estudiante.fecha_inicio_curso)}
                      </span>
                    </div>

                    {/* Columna: Fecha Fin */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.375em' }}>
                      <Calendar size={12} color={theme.textMuted} />
                      <span style={{ color: theme.textSecondary, fontSize: '0.75rem' }}>
                        {formatDate(estudiante.fecha_fin_curso)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Paginación */}
            {totalPages > 1 && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingTop: '1rem',
                borderTop: `1px solid ${theme.border}`,
                marginTop: '1rem'
              }}>
                <div style={{ color: theme.textMuted, fontSize: '0.875rem' }}>
                  Mostrando {startIndex + 1}-{Math.min(endIndex, estudiantesFiltrados.length)} de {estudiantesFiltrados.length} estudiantes
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <button
                    onClick={() => goToPage(currentPage - 1)}
                    disabled={currentPage === 1}
                    style={{
                      padding: '0.5rem',
                      background: currentPage === 1
                        ? (darkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)')
                        : (darkMode ? 'rgba(59, 130, 246, 0.15)' : 'rgba(59, 130, 246, 0.1)'),
                      border: `1px solid ${theme.border}`,
                      borderRadius: '0.5rem',
                      cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      opacity: currentPage === 1 ? 0.5 : 1,
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <ChevronLeft size={18} color={theme.textPrimary} />
                  </button>

                  {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                    let page;
                    if (totalPages <= 5) {
                      page = i + 1;
                    } else if (currentPage <= 3) {
                      page = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      page = totalPages - 4 + i;
                    } else {
                      page = currentPage - 2 + i;
                    }
                    return (
                      <button
                        key={page}
                        onClick={() => goToPage(page)}
                        style={{
                          padding: '0.5rem 0.75rem',
                          background: page === currentPage
                            ? `linear-gradient(135deg, ${theme.accent}, #2563eb)`
                            : (darkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'),
                          border: `1px solid ${page === currentPage ? theme.accent : theme.border}`,
                          borderRadius: '0.5rem',
                          color: page === currentPage ? '#fff' : theme.textPrimary,
                          cursor: 'pointer',
                          fontSize: '0.875rem',
                          fontWeight: page === currentPage ? '700' : '600',
                          transition: 'all 0.2s ease',
                          minWidth: '2.5rem'
                        }}
                        onMouseEnter={(e) => {
                          if (page !== currentPage) {
                            e.currentTarget.style.background = darkMode ? 'rgba(59, 130, 246, 0.15)' : 'rgba(59, 130, 246, 0.1)';
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (page !== currentPage) {
                            e.currentTarget.style.background = darkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)';
                          }
                        }}
                      >
                        {page}
                      </button>
                    );
                  })}

                  <button
                    onClick={() => goToPage(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    style={{
                      padding: '0.5rem',
                      background: currentPage === totalPages
                        ? (darkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)')
                        : (darkMode ? 'rgba(59, 130, 246, 0.15)' : 'rgba(59, 130, 246, 0.1)'),
                      border: `1px solid ${theme.border}`,
                      borderRadius: '0.5rem',
                      cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      opacity: currentPage === totalPages ? 0.5 : 1,
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <ChevronRight size={18} color={theme.textPrimary} />
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          /* Vista de Cards */
          <div>
            <div style={{ display: 'grid', gap: '0.75rem', marginBottom: '1rem' }}>
              {estudiantesPaginados.map((estudiante) => {
                // Determine status color
                let statusColor = theme.textMuted;
                let statusBg = 'rgba(156, 163, 175, 0.2)';
                let statusText = 'Desconocido';

                const studentEstado = estudiante.estado_curso || 'activo';

                switch (studentEstado) {
                  case 'activo':
                    statusColor = theme.success;
                    statusBg = 'rgba(34, 197, 94, 0.2)';
                    statusText = 'Activo';
                    break;
                  case 'finalizado':
                    statusColor = theme.textMuted;
                    statusBg = 'rgba(156, 163, 175, 0.2)';
                    statusText = 'Finalizado';
                    break;
                  case 'planificado':
                    statusColor = theme.warning;
                    statusBg = 'rgba(245, 158, 11, 0.2)';
                    statusText = 'Planificado';
                    break;
                  case 'cancelado':
                    statusColor = theme.danger;
                    statusBg = 'rgba(239, 68, 68, 0.2)';
                    statusText = 'Cancelado';
                    break;
                  default:
                    statusText = studentEstado || 'Activo (asumido)';
                }

                return (
                  <div
                    key={`${estudiante.id_usuario}-${estudiante.codigo_curso}`}
                    style={{
                      background: darkMode ? 'rgba(255,255,255,0.05)' : '#fff',
                      border: darkMode ? '1px solid rgba(255,255,255,0.1)' : '1px solid #e5e7eb',
                      borderRadius: '0.5rem',
                      padding: '0.75rem',
                      transition: 'all 0.2s ease',
                      cursor: 'pointer'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-2px)';
                      e.currentTarget.style.boxShadow = darkMode
                        ? '0 4px 12px rgba(59, 130, 246, 0.2)'
                        : '0 4px 12px rgba(0, 0, 0, 0.1)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                  >
                    {/* Header: Avatar, Nombre y Estado */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.625rem' }}>
                      <div style={{
                        width: '2rem',
                        height: '2rem',
                        borderRadius: '50%',
                        background: `linear-gradient(135deg, ${theme.accent}, #2563eb)`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#fff',
                        fontSize: '0.75rem',
                        fontWeight: '800',
                        flexShrink: 0
                      }}>
                        {estudiante.nombre.charAt(0)}{estudiante.apellido.charAt(0)}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ color: theme.textPrimary, fontSize: '0.875rem', fontWeight: '700' }}>
                          {estudiante.apellido}, {estudiante.nombre}
                        </div>
                        <div style={{ color: theme.textMuted, fontSize: '0.7rem' }}>
                          {estudiante.cedula}
                        </div>
                      </div>
                      <span style={{
                        background: statusBg,
                        color: statusColor,
                        padding: '0.2rem 0.5rem',
                        borderRadius: '0.375rem',
                        fontSize: '0.65rem',
                        fontWeight: '700',
                        whiteSpace: 'nowrap'
                      }}>
                        {statusText}
                      </span>
                    </div>

                    {/* Fila integrada: Curso, Inicio y Fin */}
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.75rem',
                      padding: '0.5rem',
                      background: darkMode ? 'rgba(59, 130, 246, 0.08)' : 'rgba(59, 130, 246, 0.04)',
                      borderRadius: '0.375rem',
                      fontSize: '0.7rem'
                    }}>
                      {/* Curso */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', flex: 1, minWidth: 0 }}>
                        <BookOpen size={14} color={theme.accent} />
                        <span style={{
                          background: `${theme.accent}30`,
                          color: theme.accent,
                          padding: '0.1rem 0.4rem',
                          borderRadius: '0.25rem',
                          fontSize: '0.65rem',
                          fontWeight: '700',
                          flexShrink: 0
                        }}>
                          {estudiante.codigo_curso}
                        </span>
                        <span style={{
                          color: theme.textPrimary,
                          fontSize: '0.75rem',
                          fontWeight: '600',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap'
                        }}>
                          {estudiante.curso_nombre}
                        </span>
                      </div>

                      {/* Separador */}
                      <div style={{ width: '1px', height: '1.5rem', background: theme.border, flexShrink: 0 }} />

                      {/* Inicio */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', flexShrink: 0 }}>
                        <Calendar size={12} color={theme.textMuted} />
                        <div>
                          <div style={{ color: theme.textMuted, fontSize: '0.6rem' }}>Inicio</div>
                          <div style={{ color: theme.textPrimary, fontWeight: '600', fontSize: '0.7rem' }}>
                            {formatDate(estudiante.fecha_inicio_curso)}
                          </div>
                        </div>
                      </div>

                      {/* Separador */}
                      <div style={{ width: '1px', height: '1.5rem', background: theme.border, flexShrink: 0 }} />

                      {/* Fin */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', flexShrink: 0 }}>
                        <Calendar size={12} color={theme.textMuted} />
                        <div>
                          <div style={{ color: theme.textMuted, fontSize: '0.6rem' }}>Fin</div>
                          <div style={{ color: theme.textPrimary, fontWeight: '600', fontSize: '0.7rem' }}>
                            {formatDate(estudiante.fecha_fin_curso)}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Paginación para cards */}
            {totalPages > 1 && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingTop: '1rem',
                borderTop: `1px solid ${theme.border}`,
                marginTop: '1rem'
              }}>
                <div style={{ color: theme.textMuted, fontSize: '0.875rem' }}>
                  Mostrando {startIndex + 1}-{Math.min(endIndex, estudiantesFiltrados.length)} de {estudiantesFiltrados.length} estudiantes
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <button
                    onClick={() => goToPage(currentPage - 1)}
                    disabled={currentPage === 1}
                    style={{
                      padding: '0.5rem',
                      background: currentPage === 1
                        ? (darkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)')
                        : (darkMode ? 'rgba(59, 130, 246, 0.15)' : 'rgba(59, 130, 246, 0.1)'),
                      border: `1px solid ${theme.border}`,
                      borderRadius: '0.5rem',
                      cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      opacity: currentPage === 1 ? 0.5 : 1,
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <ChevronLeft size={18} color={theme.textPrimary} />
                  </button>

                  {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                    let page;
                    if (totalPages <= 5) {
                      page = i + 1;
                    } else if (currentPage <= 3) {
                      page = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      page = totalPages - 4 + i;
                    } else {
                      page = currentPage - 2 + i;
                    }
                    return (
                      <button
                        key={page}
                        onClick={() => goToPage(page)}
                        style={{
                          padding: '0.5rem 0.75rem',
                          background: page === currentPage
                            ? `linear-gradient(135deg, ${theme.accent}, #2563eb)`
                            : (darkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'),
                          border: `1px solid ${page === currentPage ? theme.accent : theme.border}`,
                          borderRadius: '0.5rem',
                          color: page === currentPage ? '#fff' : theme.textPrimary,
                          cursor: 'pointer',
                          fontSize: '0.875rem',
                          fontWeight: page === currentPage ? '700' : '600',
                          transition: 'all 0.2s ease',
                          minWidth: '2.5rem'
                        }}
                        onMouseEnter={(e) => {
                          if (page !== currentPage) {
                            e.currentTarget.style.background = darkMode ? 'rgba(59, 130, 246, 0.15)' : 'rgba(59, 130, 246, 0.1)';
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (page !== currentPage) {
                            e.currentTarget.style.background = darkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)';
                          }
                        }}
                      >
                        {page}
                      </button>
                    );
                  })}

                  <button
                    onClick={() => goToPage(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    style={{
                      padding: '0.5rem',
                      background: currentPage === totalPages
                        ? (darkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)')
                        : (darkMode ? 'rgba(59, 130, 246, 0.15)' : 'rgba(59, 130, 246, 0.1)'),
                      border: `1px solid ${theme.border}`,
                      borderRadius: '0.5rem',
                      cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      opacity: currentPage === totalPages ? 0.5 : 1,
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <ChevronRight size={18} color={theme.textPrimary} />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default MisEstudiantes;
