import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, BookOpen, Upload, CheckCircle, Clock,
  AlertCircle, FileText, Award, Download,
  ChevronDown, ChevronUp, Edit3, Trash2, X, FileCheck
} from 'lucide-react';
import axios from 'axios';
import { showToast } from '../../config/toastConfig';
// import { useBreakpoints } from '../../hooks/useMediaQuery';
import '../../styles/responsive.css';

const API_BASE = (import.meta as any).env?.VITE_API_URL ? `${(import.meta as any).env.VITE_API_URL}/api` : 'http://localhost:3000/api';

interface Tarea {
  id_tarea: number;
  titulo: string;
  descripcion: string;
  instrucciones: string;
  fecha_limite: string;
  nota_maxima: number;
  nota_minima_aprobacion: number;
  modulo_nombre: string;
  modulo_orden: number;
  estado_estudiante: 'pendiente' | 'entregado' | 'calificado';
  id_entrega: number | null;
  fecha_entrega: string | null;
  nota: number | null;
  resultado: string | null;
  comentario_docente: string | null;
  archivo_url?: string;
  archivo_public_id?: string;
}

interface ModuloAgrupado {
  nombre: string;
  orden: number;
  tareas: Tarea[];
}

interface Curso {
  nombre: string;
  codigo_curso: string;
}

interface TareasEstudianteProps {
  darkMode?: boolean;
}

const TareasEstudiante: React.FC<TareasEstudianteProps> = ({ darkMode = false }) => {
  const { id_curso } = useParams<{ id_curso: string }>();
  const navigate = useNavigate();
  // const { isMobile } = useBreakpoints();
  const [curso, setCurso] = useState<Curso | null>(null);
  const [tareas, setTareas] = useState<Tarea[]>([]);
  const [modulosAgrupados, setModulosAgrupados] = useState<ModuloAgrupado[]>([]);
  const [modulosExpandidos, setModulosExpandidos] = useState<{ [key: number]: boolean }>({});
  const [loading, setLoading] = useState(true);
  const [showModalEntrega, setShowModalEntrega] = useState(false);
  const [tareaSeleccionada, setTareaSeleccionada] = useState<Tarea | null>(null);
  const [archivo, setArchivo] = useState<File | null>(null);
  const [comentario, setComentario] = useState('');
  const [uploading, setUploading] = useState(false);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [entregaToDelete, setEntregaToDelete] = useState<number | null>(null);

  useEffect(() => {
    fetchCursoData();
    fetchTareas();
  }, [id_curso]);

  useEffect(() => {
    // Agrupar tareas por módulo
    const agrupados: { [key: string]: ModuloAgrupado } = {};

    tareas.forEach(tarea => {
      const key = `${tarea.modulo_orden}-${tarea.modulo_nombre}`;
      if (!agrupados[key]) {
        agrupados[key] = {
          nombre: tarea.modulo_nombre,
          orden: tarea.modulo_orden,
          tareas: []
        };
      }
      agrupados[key].tareas.push(tarea);
    });

    const modulosArray = Object.values(agrupados).sort((a, b) => a.orden - b.orden);
    setModulosAgrupados(modulosArray);

    // Expandir el primer módulo por defecto
    if (modulosArray.length > 0) {
      setModulosExpandidos({ [modulosArray[0].orden]: true });
    }
  }, [tareas]);

  const fetchCursoData = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_BASE}/cursos/${id_curso}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCurso(response.data);
    } catch (error) {
      console.error('Error fetching curso:', error);
      showToast.error('Error cargando información del curso', darkMode);
    }
  };

  const fetchTareas = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_BASE}/tareas/estudiante/curso/${id_curso}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setTareas(response.data.tareas || []);
    } catch (error) {
      console.error('Error fetching tareas:', error);
      showToast.error('Error cargando tareas', darkMode);
    } finally {
      setLoading(false);
    }
  };

  const toggleModulo = (orden: number) => {
    setModulosExpandidos(prev => ({
      ...prev,
      [orden]: !prev[orden]
    }));
  };

  const handleEntregarTarea = (tarea: Tarea) => {
    setTareaSeleccionada(tarea);
    setShowModalEntrega(true);
    setArchivo(null);
    setComentario('');
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const maxSize = 5 * 1024 * 1024; // 5MB

      if (file.size > maxSize) {
        showToast.error('El archivo no debe superar 5MB', darkMode);
        return;
      }

      const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        showToast.error('Solo se permiten archivos PDF, JPG, PNG, WEBP', darkMode);
        return;
      }

      setArchivo(file);
    }
  };

  const handleSubmitEntrega = async () => {
    if (!archivo && !tareaSeleccionada?.id_entrega) {
      showToast.error('Debes seleccionar un archivo', darkMode);
      return;
    }

    try {
      setUploading(true);
      const token = localStorage.getItem('token');
      const formData = new FormData();
      formData.append('id_tarea', tareaSeleccionada!.id_tarea.toString());
      formData.append('comentario_estudiante', comentario);
      if (archivo) {
        formData.append('archivo', archivo);
      }

      if (tareaSeleccionada?.id_entrega) {
        // Actualizar entrega existente
        await axios.put(`${API_BASE}/entregas/${tareaSeleccionada.id_entrega}`, formData, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        });
        showToast.success('Entrega actualizada exitosamente', darkMode);
      } else {
        // Crear nueva entrega
        await axios.post(`${API_BASE}/entregas`, formData, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        });
        showToast.success('Tarea entregada exitosamente', darkMode);
      }

      setShowModalEntrega(false);
      fetchTareas();
    } catch (error: any) {
      console.error('Error submitting entrega:', error);
      showToast.error(error.response?.data?.error || 'Error al entregar tarea', darkMode);
    } finally {
      setUploading(false);
    }
  };

  const handleEliminarEntrega = async () => {
    if (!entregaToDelete) return;

    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API_BASE}/entregas/${entregaToDelete}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      showToast.success('Entrega eliminada exitosamente', darkMode);
      fetchTareas();
      setShowConfirmDelete(false);
      setEntregaToDelete(null);
    } catch (error: any) {
      console.error('Error eliminando entrega:', error);
      showToast.error(error.response?.data?.error || 'Error al eliminar entrega', darkMode);
      setShowConfirmDelete(false);
      setEntregaToDelete(null);
    }
  };

  const openDeleteConfirm = (id_entrega: number) => {
    setEntregaToDelete(id_entrega);
    setShowConfirmDelete(true);
  };

  const getEstadoColor = (estado: string) => {
    switch (estado) {
      case 'pendiente':
        return { bg: 'rgba(251, 191, 36, 0.1)', text: '#fbbf24', border: 'rgba(251, 191, 36, 0.3)' };
      case 'entregado':
        return { bg: 'rgba(245, 158, 11, 0.1)', text: '#f59e0b', border: 'rgba(245, 158, 11, 0.3)' };
      case 'calificado':
        return { bg: 'rgba(217, 119, 6, 0.1)', text: '#d97706', border: 'rgba(217, 119, 6, 0.3)' };
      default:
        return { bg: 'rgba(156, 163, 175, 0.1)', text: '#9ca3af', border: 'rgba(156, 163, 175, 0.3)' };
    }
  };

  const getEstadoIcon = (estado: string) => {
    switch (estado) {
      case 'pendiente': return <Clock size={18} />;
      case 'entregado': return <Upload size={18} />;
      case 'calificado': return <CheckCircle size={18} />;
      default: return <AlertCircle size={18} />;
    }
  };

  const getEstadoTexto = (estado: string) => {
    switch (estado) {
      case 'pendiente': return 'Pendiente';
      case 'entregado': return 'Entregado';
      case 'calificado': return 'Calificado';
      default: return 'Desconocido';
    }
  };

  const calcularPromedioGeneral = () => {
    const tareasCalificadas = tareas.filter(t => t.nota !== null);
    if (tareasCalificadas.length === 0) return null;
    const suma = tareasCalificadas.reduce((acc, t) => acc + (t.nota || 0), 0);
    return (suma / tareasCalificadas.length).toFixed(2);
  };

  const calcularEstadisticas = () => {
    const total = tareas.length;
    const pendientes = tareas.filter(t => t.estado_estudiante === 'pendiente').length;
    const entregadas = tareas.filter(t => t.estado_estudiante === 'entregado').length;
    const calificadas = tareas.filter(t => t.estado_estudiante === 'calificado').length;
    return { total, pendientes, entregadas, calificadas };
  };

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f0f23 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#fff'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: '3.125rem',
            height: '3.125rem',
            border: '0.25rem solid rgba(251, 146, 60, 0.3)',
            borderTop: '0.25rem solid #fb923c',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 1.25em'
          }} />
          <p style={{ fontSize: '1.1rem', color: 'rgba(255,255,255,0.8)' }}>Cargando tareas...</p>
        </div>
      </div>
    );
  }

  const stats = calcularEstadisticas();
  const promedioGeneral = calcularPromedioGeneral();

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f0f23 100%)',
      padding: '2.5em 1.25em'
    }}>
      <div style={{ maxWidth: '87.5rem', margin: '0 auto' }}>
        {/* Header */}
        <div style={{
          background: 'linear-gradient(135deg, rgba(251, 146, 60, 0.1) 0%, rgba(249, 115, 22, 0.05) 100%)',
          backdropFilter: 'blur(0.625rem)',
          borderRadius: '1.25em',
          padding: '1.875em',
          marginBottom: '1.875em',
          border: '0.0625rem solid rgba(251, 146, 60, 0.2)'
        }}>
          <button
            onClick={() => navigate('/panel/estudiante')}
            style={{
              background: 'rgba(251, 146, 60, 0.1)',
              border: '0.0625rem solid rgba(251, 146, 60, 0.3)',
              borderRadius: '0.75em',
              padding: '0.625em 1.25em',
              color: '#fb923c',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5em',
              marginBottom: '1.25em',
              cursor: 'pointer',
              transition: 'all 0.3s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(251, 146, 60, 0.2)';
              e.currentTarget.style.transform = 'translateX(-0.3125em)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(251, 146, 60, 0.1)';
              e.currentTarget.style.transform = 'translateX(0)';
            }}
          >
            <ArrowLeft size={20} />
            Volver a Mis Cursos
          </button>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1.25em' }}>
            <div>
              <h1 style={{
                fontSize: '2rem',
                fontWeight: '700',
                color: '#fff',
                marginBottom: '0.625em',
                display: 'flex',
                alignItems: 'center',
                gap: '0.9375em'
              }}>
                <BookOpen size={32} style={{ color: '#fb923c' }} />
                {curso?.nombre}
              </h1>
              <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '1rem' }}>
                Código: {curso?.codigo_curso}
              </p>
            </div>

            {promedioGeneral && (
              <div style={{
                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                borderRadius: '0.9375em',
                padding: '1.25em 1.875em',
                textAlign: 'center',
                boxShadow: '0 0.25rem 0.9375rem rgba(16, 185, 129, 0.3)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.625em', marginBottom: '0.3125em' }}>
                  <Award size={24} style={{ color: '#fff' }} />
                  <span style={{ color: '#fff', fontSize: '0.9rem', fontWeight: '500' }}>Promedio General</span>
                </div>
                <div style={{ fontSize: '2.5rem', fontWeight: '700', color: '#fff' }}>
                  {promedioGeneral}
                </div>
              </div>
            )}
          </div>

          {/* Estadísticas */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(12.5rem, 90vw), 1fr))', gap: '0.9375em', marginTop: '1.5625em' }}>
            <div style={{
              background: 'rgba(255,255,255,0.05)',
              borderRadius: '0.75em',
              padding: '0.9375em',
              border: '0.0625rem solid rgba(255,255,255,0.1)'
            }}>
              <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.85rem', marginBottom: '0.3125em' }}>Total Tareas</div>
              <div style={{ color: '#fff', fontSize: '1.8rem', fontWeight: '700' }}>{stats.total}</div>
            </div>
            <div style={{
              background: 'rgba(251, 191, 36, 0.1)',
              borderRadius: '0.75em',
              padding: '0.9375em',
              border: '0.0625rem solid rgba(251, 191, 36, 0.2)'
            }}>
              <div style={{ color: '#fbbf24', fontSize: '0.85rem', marginBottom: '0.3125em' }}>Pendientes</div>
              <div style={{ color: '#fbbf24', fontSize: '1.8rem', fontWeight: '700' }}>{stats.pendientes}</div>
            </div>
            <div style={{
              background: 'rgba(245, 158, 11, 0.1)',
              borderRadius: '0.75em',
              padding: '0.9375em',
              border: '0.0625rem solid rgba(245, 158, 11, 0.2)'
            }}>
              <div style={{ color: '#f59e0b', fontSize: '0.85rem', marginBottom: '0.3125em' }}>Entregadas</div>
              <div style={{ color: '#f59e0b', fontSize: '1.8rem', fontWeight: '700' }}>{stats.entregadas}</div>
            </div>
            <div style={{
              background: 'rgba(217, 119, 6, 0.1)',
              borderRadius: '0.75em',
              padding: '0.9375em',
              border: '0.0625rem solid rgba(217, 119, 6, 0.2)'
            }}>
              <div style={{ color: '#d97706', fontSize: '0.85rem', marginBottom: '0.3125em' }}>Calificadas</div>
              <div style={{ color: '#d97706', fontSize: '1.8rem', fontWeight: '700' }}>{stats.calificadas}</div>
            </div>
          </div>
        </div>

        {/* Lista de Módulos con Tareas */}
        {modulosAgrupados.length === 0 ? (
          <div style={{
            background: 'rgba(255,255,255,0.05)',
            backdropFilter: 'blur(0.625rem)',
            borderRadius: '1.25em',
            padding: '3.75em 1.875em',
            textAlign: 'center',
            border: '0.0625rem solid rgba(255,255,255,0.1)'
          }}>
            <FileText size={64} style={{ color: 'rgba(255,255,255,0.3)', margin: '0 auto 1.25em' }} />
            <h3 style={{ color: '#fff', fontSize: '1.5rem', marginBottom: '0.625em' }}>
              No hay tareas disponibles
            </h3>
            <p style={{ color: 'rgba(255,255,255,0.6)' }}>
              Tu docente aún no ha creado tareas para este curso
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25em' }}>
            {modulosAgrupados.map((modulo) => (
              <div
                key={modulo.orden}
                style={{
                  background: 'rgba(255,255,255,0.05)',
                  backdropFilter: 'blur(0.625rem)',
                  borderRadius: '1.25em',
                  border: '0.0625rem solid rgba(255,255,255,0.1)',
                  overflow: 'hidden'
                }}
              >
                {/* Header del Módulo */}
                <div
                  style={{
                    padding: '1.5625em 1.875em',
                    background: 'linear-gradient(135deg, rgba(251, 146, 60, 0.1) 0%, rgba(249, 115, 22, 0.05) 100%)',
                    borderBottom: '0.0625rem solid rgba(255,255,255,0.1)',
                    cursor: 'pointer'
                  }}
                  onClick={() => toggleModulo(modulo.orden)}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.9375em' }}>
                      <span style={{
                        background: 'linear-gradient(135deg, #fb923c 0%, #f97316 100%)',
                        color: '#fff',
                        padding: '0.375em 0.75em',
                        borderRadius: '0.5em',
                        fontSize: '0.9rem',
                        fontWeight: '600'
                      }}>
                        #{modulo.orden}
                      </span>
                      <h3 style={{ color: '#fff', fontSize: '1.3rem', fontWeight: '600', margin: 0 }}>
                        {modulo.nombre}
                      </h3>
                      <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.9rem' }}>
                        ({modulo.tareas.length} tareas)
                      </span>
                    </div>

                    {modulosExpandidos[modulo.orden] ? (
                      <ChevronUp size={24} style={{ color: '#fb923c' }} />
                    ) : (
                      <ChevronDown size={24} style={{ color: '#fb923c' }} />
                    )}
                  </div>
                </div>

                {/* Lista de Tareas */}
                {modulosExpandidos[modulo.orden] && (
                  <div style={{ padding: '1.25em 1.875em' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.9375em' }}>
                      {modulo.tareas.map((tarea) => {
                        const estadoColor = getEstadoColor(tarea.estado_estudiante);
                        const isVencida = new Date(tarea.fecha_limite) < new Date() && tarea.estado_estudiante === 'pendiente';

                        return (
                          <div
                            key={tarea.id_tarea}
                            style={{
                              background: 'rgba(255,255,255,0.03)',
                              border: `0.0625rem solid ${isVencida ? 'rgba(239, 68, 68, 0.3)' : 'rgba(255,255,255,0.1)'}`,
                              borderRadius: '0.75em',
                              padding: '1.25em',
                              transition: 'all 0.3s ease'
                            }}
                          >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1.25em', flexWrap: 'wrap' }}>
                              <div style={{ flex: 1 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.625em', marginBottom: '0.625em', flexWrap: 'wrap' }}>
                                  <h4 style={{ color: '#fff', fontSize: '1.1rem', fontWeight: '600', margin: 0 }}>
                                    {tarea.titulo}
                                  </h4>
                                  <span style={{
                                    background: estadoColor.bg,
                                    color: estadoColor.text,
                                    border: `0.0625rem solid ${estadoColor.border}`,
                                    padding: '0.25em 0.75em',
                                    borderRadius: '0.5em',
                                    fontSize: '0.8rem',
                                    fontWeight: '500',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.3125em'
                                  }}>
                                    {getEstadoIcon(tarea.estado_estudiante)}
                                    {getEstadoTexto(tarea.estado_estudiante)}
                                  </span>
                                  {isVencida && (
                                    <span style={{
                                      background: 'rgba(239, 68, 68, 0.1)',
                                      color: '#ef4444',
                                      border: '0.0625rem solid rgba(239, 68, 68, 0.3)',
                                      padding: '0.25em 0.75em',
                                      borderRadius: '0.5em',
                                      fontSize: '0.8rem',
                                      fontWeight: '500'
                                    }}>
                                      Vencida
                                    </span>
                                  )}
                                </div>

                                {tarea.descripcion && (
                                  <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.9rem', marginBottom: '0.75em' }}>
                                    {tarea.descripcion}
                                  </p>
                                )}

                                <div style={{ display: 'flex', gap: '1.25em', fontSize: '0.85rem', flexWrap: 'wrap' }}>
                                  <span style={{ color: 'rgba(255,255,255,0.5)', display: 'flex', alignItems: 'center', gap: '0.3125em' }}>
                                    <Clock size={14} />
                                    Límite: {new Date(tarea.fecha_limite).toLocaleDateString()}
                                  </span>
                                  <span style={{ color: '#fb923c', display: 'flex', alignItems: 'center', gap: '0.3125em' }}>
                                    <Award size={14} />
                                    Nota máx: {tarea.nota_maxima}
                                  </span>
                                  {tarea.fecha_entrega && (
                                    <span style={{ color: '#f59e0b', display: 'flex', alignItems: 'center', gap: '0.3125em' }}>
                                      <Upload size={14} />
                                      Entregado: {new Date(tarea.fecha_entrega).toLocaleDateString()}
                                    </span>
                                  )}
                                </div>

                                {/* Calificación */}
                                {tarea.estado_estudiante === 'calificado' && tarea.nota !== null && (
                                  <div style={{
                                    marginTop: '0.9375em',
                                    padding: '0.9375em',
                                    background: tarea.nota >= tarea.nota_minima_aprobacion
                                      ? 'rgba(16, 185, 129, 0.1)'
                                      : 'rgba(239, 68, 68, 0.1)',
                                    border: `0.0625rem solid ${tarea.nota >= tarea.nota_minima_aprobacion
                                      ? 'rgba(16, 185, 129, 0.3)'
                                      : 'rgba(239, 68, 68, 0.3)'}`,
                                    borderRadius: '0.625em'
                                  }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.9375em', marginBottom: '0.625em' }}>
                                      <div>
                                        <div style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.6)', marginBottom: '0.3125em' }}>
                                          Tu Calificación
                                        </div>
                                        <div style={{
                                          fontSize: '2rem',
                                          fontWeight: '700',
                                          color: tarea.nota >= tarea.nota_minima_aprobacion ? '#d97706' : '#ef4444'
                                        }}>
                                          {tarea.nota}/{tarea.nota_maxima}
                                        </div>
                                      </div>
                                      <div style={{
                                        padding: '0.5em 1em',
                                        borderRadius: '0.5em',
                                        background: tarea.resultado === 'aprobado'
                                          ? 'rgba(16, 185, 129, 0.2)'
                                          : 'rgba(239, 68, 68, 0.2)',
                                        color: tarea.resultado === 'aprobado' ? '#10b981' : '#ef4444',
                                        fontWeight: '600',
                                        fontSize: '0.9rem'
                                      }}>
                                        {tarea.resultado === 'aprobado' ? '✓ APROBADO' : '✗ REPROBADO'}
                                      </div>
                                    </div>
                                    {tarea.comentario_docente && (
                                      <div>
                                        <div style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.6)', marginBottom: '0.3125em' }}>
                                          Comentario del docente:
                                        </div>
                                        <p style={{ color: '#fff', fontSize: '0.9rem', margin: 0 }}>
                                          {tarea.comentario_docente}
                                        </p>
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>

                              {/* Botones de acción */}
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625em' }}>
                                {tarea.estado_estudiante === 'pendiente' && (
                                  <button
                                    onClick={() => handleEntregarTarea(tarea)}
                                    style={{
                                      background: 'linear-gradient(135deg, #fb923c 0%, #f97316 100%)',
                                      border: 'none',
                                      borderRadius: '0.625em',
                                      padding: '0.625em 1.25em',
                                      color: '#fff',
                                      fontWeight: '600',
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: '0.5em',
                                      cursor: 'pointer',
                                      transition: 'all 0.3s ease',
                                      boxShadow: '0 0.25rem 0.9375rem rgba(251, 146, 60, 0.3)'
                                    }}
                                    onMouseEnter={(e) => {
                                      e.currentTarget.style.transform = 'translateY(-0.125rem)';
                                      e.currentTarget.style.boxShadow = '0 0.375rem 1.25rem rgba(251, 146, 60, 0.4)';
                                    }}
                                    onMouseLeave={(e) => {
                                      e.currentTarget.style.transform = 'translateY(0)';
                                      e.currentTarget.style.boxShadow = '0 0.25rem 0.9375rem rgba(251, 146, 60, 0.3)';
                                    }}
                                  >
                                    <Upload size={18} />
                                    Entregar
                                  </button>
                                )}

                                {(tarea.estado_estudiante === 'entregado' || tarea.estado_estudiante === 'calificado') && tarea.id_entrega && (
                                  <>
                                    <button
                                      onClick={() => {
                                        if (tarea.archivo_url) {
                                          window.open(tarea.archivo_url, '_blank');
                                        } else {
                                          showToast.error('No hay archivo adjunto', darkMode);
                                        }
                                      }}
                                      style={{
                                        background: 'rgba(245, 158, 11, 0.1)',
                                        border: '0.0625rem solid rgba(245, 158, 11, 0.3)',
                                        borderRadius: '0.625em',
                                        padding: '0.625em 1.25em',
                                        color: '#f59e0b',
                                        fontWeight: '600',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '0.5em',
                                        cursor: 'pointer',
                                        transition: 'all 0.3s ease'
                                      }}
                                      onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(245, 158, 11, 0.2)'}
                                      onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(245, 158, 11, 0.1)'}
                                    >
                                      <Download size={18} />
                                      Ver Entrega
                                    </button>
                                    {tarea.estado_estudiante === 'entregado' && (
                                      <>
                                        <button
                                          onClick={() => handleEntregarTarea(tarea)}
                                          style={{
                                            background: 'rgba(251, 191, 36, 0.1)',
                                            border: '0.0625rem solid rgba(251, 191, 36, 0.3)',
                                            borderRadius: '0.625em',
                                            padding: '0.625em 1.25em',
                                            color: '#fbbf24',
                                            fontWeight: '600',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '0.5em',
                                            cursor: 'pointer',
                                            transition: 'all 0.3s ease'
                                          }}
                                          onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(251, 191, 36, 0.2)'}
                                          onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(251, 191, 36, 0.1)'}
                                        >
                                          <Edit3 size={18} />
                                          Editar
                                        </button>
                                        <button
                                          onClick={() => openDeleteConfirm(tarea.id_entrega!)}
                                          style={{
                                            background: 'rgba(239, 68, 68, 0.1)',
                                            border: '0.0625rem solid rgba(239, 68, 68, 0.3)',
                                            borderRadius: '0.625em',
                                            padding: '0.625em 1.25em',
                                            color: '#ef4444',
                                            fontWeight: '600',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '0.5em',
                                            cursor: 'pointer',
                                            transition: 'all 0.3s ease'
                                          }}
                                          onMouseEnter={(e) => {
                                            e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)';
                                            e.currentTarget.style.transform = 'scale(1.05)';
                                          }}
                                          onMouseLeave={(e) => {
                                            e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)';
                                            e.currentTarget.style.transform = 'scale(1)';
                                          }}
                                        >
                                          <Trash2 size={18} />
                                          Eliminar
                                        </button>
                                      </>
                                    )}
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal de Entrega - Diseño Mejorado */}
      {
        showModalEntrega && tareaSeleccionada && (
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(0,0,0,0.85)',
              backdropFilter: 'blur(8px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 1000,
              padding: '1.25em',
              animation: 'fadeIn 0.3s ease'
            }}
            onClick={() => setShowModalEntrega(false)}
          >
            <div
              style={{
                background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
                borderRadius: '1.5em',
                maxWidth: '42rem',
                width: '100%',
                maxHeight: '90vh',
                overflowY: 'auto',
                border: '1px solid rgba(251, 191, 36, 0.3)',
                boxShadow: '0 25px 50px rgba(0,0,0,0.5), 0 0 100px rgba(251, 191, 36, 0.1)',
                animation: 'slideUp 0.3s ease'
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header del Modal */}
              <div style={{
                background: 'linear-gradient(135deg, rgba(251, 191, 36, 0.15) 0%, rgba(249, 115, 22, 0.1) 100%)',
                borderBottom: '1px solid rgba(251, 191, 36, 0.2)',
                padding: '1.75em 2em',
                borderRadius: '1.5em 1.5em 0 0',
                position: 'relative'
              }}>
                <button
                  onClick={() => setShowModalEntrega(false)}
                  style={{
                    position: 'absolute',
                    top: '1.5em',
                    right: '1.5em',
                    background: 'rgba(239, 68, 68, 0.1)',
                    border: '1px solid rgba(239, 68, 68, 0.3)',
                    borderRadius: '0.5em',
                    width: '2.5em',
                    height: '2.5em',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    color: '#ef4444'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)';
                    e.currentTarget.style.transform = 'rotate(90deg) scale(1.1)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)';
                    e.currentTarget.style.transform = 'rotate(0deg) scale(1)';
                  }}
                >
                  <X size={20} />
                </button>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75em', marginBottom: '0.5em' }}>
                  <div style={{
                    background: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)',
                    borderRadius: '0.75em',
                    padding: '0.75em',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 8px 16px rgba(251, 191, 36, 0.3)'
                  }}>
                    <FileCheck size={24} style={{ color: '#fff' }} />
                  </div>
                  <h3 style={{
                    color: '#fff',
                    fontSize: '1.75rem',
                    fontWeight: '700',
                    margin: 0,
                    paddingRight: '3em'
                  }}>
                    {tareaSeleccionada.id_entrega ? 'Editar Entrega' : 'Entregar Tarea'}
                  </h3>
                </div>
                <p style={{
                  color: 'rgba(255,255,255,0.8)',
                  fontSize: '1.05rem',
                  margin: 0,
                  fontWeight: '500'
                }}>
                  {tareaSeleccionada.titulo}
                </p>
              </div>

              {/* Contenido del Modal */}
              <div style={{ padding: '2em' }}>
                {tareaSeleccionada.instrucciones && (
                  <div style={{
                    background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.1) 0%, rgba(217, 119, 6, 0.05) 100%)',
                    border: '1px solid rgba(245, 158, 11, 0.3)',
                    borderRadius: '1em',
                    padding: '1.25em',
                    marginBottom: '1.5em',
                    position: 'relative',
                    overflow: 'hidden'
                  }}>
                    <div style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '4px',
                      height: '100%',
                      background: 'linear-gradient(180deg, #f59e0b 0%, #d97706 100%)'
                    }} />
                    <div style={{
                      color: '#f59e0b',
                      fontSize: '0.95rem',
                      fontWeight: '700',
                      marginBottom: '0.75em',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5em'
                    }}>
                      <FileText size={18} />
                      Instrucciones de la Tarea
                    </div>
                    <p style={{
                      color: 'rgba(255,255,255,0.85)',
                      fontSize: '0.95rem',
                      margin: 0,
                      whiteSpace: 'pre-wrap',
                      lineHeight: '1.6'
                    }}>
                      {tareaSeleccionada.instrucciones}
                    </p>
                  </div>
                )}

                {/* Upload de Archivo */}
                <div style={{ marginBottom: '1.5em' }}>
                  <label style={{
                    color: '#fff',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5em',
                    marginBottom: '0.75em',
                    fontWeight: '700',
                    fontSize: '1rem'
                  }}>
                    <Upload size={18} style={{ color: '#fbbf24' }} />
                    Archivo de Entrega *
                  </label>
                  <div style={{
                    position: 'relative',
                    border: '2px dashed rgba(251, 191, 36, 0.4)',
                    borderRadius: '1em',
                    padding: '2em',
                    background: 'linear-gradient(135deg, rgba(251, 191, 36, 0.05) 0%, rgba(249, 115, 22, 0.02) 100%)',
                    textAlign: 'center',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    overflow: 'hidden'
                  }}>
                    <input
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png,.webp"
                      onChange={handleFileChange}
                      style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '100%',
                        opacity: 0,
                        cursor: 'pointer'
                      }}
                    />
                    {!archivo ? (
                      <div>
                        <div style={{
                          width: '4em',
                          height: '4em',
                          margin: '0 auto 1em',
                          background: 'linear-gradient(135deg, rgba(251, 191, 36, 0.2) 0%, rgba(249, 115, 22, 0.1) 100%)',
                          borderRadius: '50%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}>
                          <Upload size={28} style={{ color: '#fbbf24' }} />
                        </div>
                        <p style={{ color: '#fff', fontSize: '1rem', fontWeight: '600', marginBottom: '0.5em' }}>
                          Haz clic o arrastra tu archivo aquí
                        </p>
                        <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.85rem', margin: 0 }}>
                          PDF, JPG, PNG, WEBP (máx. 5MB)
                        </p>
                      </div>
                    ) : (
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '1em',
                        padding: '1em',
                        background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(5, 150, 105, 0.1) 100%)',
                        borderRadius: '0.75em',
                        border: '1px solid rgba(16, 185, 129, 0.3)'
                      }}>
                        <div style={{
                          background: 'rgba(16, 185, 129, 0.2)',
                          borderRadius: '0.5em',
                          padding: '0.75em',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}>
                          <FileCheck size={24} style={{ color: '#10b981' }} />
                        </div>
                        <div style={{ flex: 1, textAlign: 'left' }}>
                          <p style={{ color: '#10b981', fontSize: '1rem', fontWeight: '600', margin: 0, marginBottom: '0.25em' }}>
                            {archivo.name}
                          </p>
                          <p style={{ color: 'rgba(16, 185, 129, 0.8)', fontSize: '0.85rem', margin: 0 }}>
                            {(archivo.size / 1024).toFixed(2)} KB
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Comentario */}
                <div style={{ marginBottom: '2em' }}>
                  <label style={{
                    color: '#fff',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5em',
                    marginBottom: '0.75em',
                    fontWeight: '700',
                    fontSize: '1rem'
                  }}>
                    <FileText size={18} style={{ color: '#fbbf24' }} />
                    Comentario (Opcional)
                  </label>
                  <textarea
                    value={comentario}
                    onChange={(e) => setComentario(e.target.value)}
                    placeholder="Escribe un comentario sobre tu entrega..."
                    style={{
                      width: '100%',
                      minHeight: '7em',
                      padding: '1em',
                      background: 'rgba(255,255,255,0.05)',
                      border: '1px solid rgba(255,255,255,0.15)',
                      borderRadius: '0.75em',
                      color: '#fff',
                      fontSize: '0.95rem',
                      resize: 'vertical',
                      fontFamily: 'inherit',
                      transition: 'all 0.3s ease'
                    }}
                    onFocus={(e) => e.currentTarget.style.borderColor = 'rgba(251, 191, 36, 0.5)'}
                    onBlur={(e) => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)'}
                  />
                </div>

                {/* Botones de Acción */}
                <div style={{ display: 'flex', gap: '0.75em', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                  <button
                    onClick={() => setShowModalEntrega(false)}
                    disabled={uploading}
                    style={{
                      background: 'rgba(255,255,255,0.05)',
                      border: '1px solid rgba(255,255,255,0.15)',
                      borderRadius: '0.75em',
                      padding: '0.875em 1.75em',
                      color: '#fff',
                      fontWeight: '600',
                      fontSize: '1rem',
                      cursor: uploading ? 'not-allowed' : 'pointer',
                      opacity: uploading ? 0.5 : 1,
                      transition: 'all 0.3s ease'
                    }}
                    onMouseEnter={(e) => !uploading && (e.currentTarget.style.background = 'rgba(255,255,255,0.1)')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.05)')}
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleSubmitEntrega}
                    disabled={uploading || (!archivo && !tareaSeleccionada.id_entrega)}
                    style={{
                      background: uploading || (!archivo && !tareaSeleccionada.id_entrega)
                        ? 'rgba(251, 191, 36, 0.3)'
                        : 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)',
                      border: 'none',
                      borderRadius: '0.75em',
                      padding: '0.875em 2em',
                      color: '#fff',
                      fontWeight: '700',
                      fontSize: '1rem',
                      cursor: uploading || (!archivo && !tareaSeleccionada.id_entrega) ? 'not-allowed' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.625em',
                      boxShadow: uploading || (!archivo && !tareaSeleccionada.id_entrega)
                        ? 'none'
                        : '0 8px 16px rgba(251, 191, 36, 0.3)',
                      transition: 'all 0.3s ease'
                    }}
                    onMouseEnter={(e) => {
                      if (!uploading && (archivo || tareaSeleccionada.id_entrega)) {
                        e.currentTarget.style.transform = 'translateY(-2px)';
                        e.currentTarget.style.boxShadow = '0 12px 24px rgba(251, 191, 36, 0.4)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = uploading || (!archivo && !tareaSeleccionada.id_entrega)
                        ? 'none'
                        : '0 8px 16px rgba(251, 191, 36, 0.3)';
                    }}
                  >
                    {uploading ? (
                      <>
                        <div style={{
                          width: '1.125rem',
                          height: '1.125rem',
                          border: '2px solid rgba(255,255,255,0.3)',
                          borderTop: '2px solid #fff',
                          borderRadius: '50%',
                          animation: 'spin 1s linear infinite'
                        }} />
                        Subiendo...
                      </>
                    ) : (
                      <>
                        <Upload size={20} />
                        {tareaSeleccionada.id_entrega ? 'Actualizar Entrega' : 'Entregar Tarea'}
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )
      }

      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>

      {/* Modal de Confirmación de Eliminación */}
      {
        showConfirmDelete && createPortal(
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 99999,
            backdropFilter: 'blur(8px)',
            animation: 'fadeIn 0.2s ease-out'
          }}>
            <div style={{
              background: darkMode ? 'linear-gradient(135deg, rgba(0,0,0,0.95) 0%, rgba(26,26,46,0.95) 100%)' : 'linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(248,250,252,0.95) 100%)',
              borderRadius: '1rem',
              border: `1px solid ${darkMode ? 'rgba(239, 68, 68, 0.3)' : 'rgba(239, 68, 68, 0.2)'}`,
              padding: '1.5rem',
              width: '90%',
              maxWidth: '400px',
              boxShadow: darkMode ? '0 1rem 3rem rgba(0, 0, 0, 0.5)' : '0 1rem 3rem rgba(0, 0, 0, 0.2)',
              animation: 'scaleIn 0.2s ease-out'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                marginBottom: '1rem'
              }}>
                <AlertCircle size={24} color="#ef4444" />
                <h3 style={{
                  color: darkMode ? '#fff' : '#1e293b',
                  fontSize: '1.25rem',
                  fontWeight: '700',
                  margin: 0
                }}>
                  Confirmar Eliminación
                </h3>
              </div>
              <p style={{
                color: darkMode ? 'rgba(255,255,255,0.7)' : 'rgba(30,41,59,0.7)',
                fontSize: '0.95rem',
                lineHeight: '1.5',
                margin: '0 0 1.5rem 0'
              }}>
                ¿Estás seguro de eliminar esta entrega? Esta acción no se puede deshacer.
              </p>
              <div style={{
                display: 'flex',
                gap: '0.75rem',
                justifyContent: 'flex-end'
              }}>
                <button
                  onClick={() => {
                    setShowConfirmDelete(false);
                    setEntregaToDelete(null);
                  }}
                  style={{
                    padding: '0.625rem 1.25rem',
                    background: darkMode ? 'rgba(255,255,255,0.1)' : '#f1f5f9',
                    border: `1px solid ${darkMode ? 'rgba(255,255,255,0.2)' : '#e2e8f0'}`,
                    borderRadius: '0.5rem',
                    color: darkMode ? '#fff' : '#475569',
                    fontSize: '0.875rem',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                >
                  Cancelar
                </button>
                <button
                  onClick={handleEliminarEntrega}
                  style={{
                    padding: '0.625rem 1.25rem',
                    background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                    border: 'none',
                    borderRadius: '0.5rem',
                    color: '#fff',
                    fontSize: '0.875rem',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    boxShadow: '0 2px 8px rgba(239, 68, 68, 0.3)'
                  }}
                >
                  Eliminar
                </button>
              </div>
            </div>
          </div>,
          document.body
        )
      }
    </div >
  );
};

export default TareasEstudiante;
