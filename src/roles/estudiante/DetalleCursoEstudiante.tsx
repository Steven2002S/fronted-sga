import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, BookOpen, Calendar, FileText, Upload, Send,
  CheckCircle, ChevronDown, ChevronUp, Edit, Trash2, AlertTriangle, X, FileType, Maximize2, Minimize2, Award, Clock
} from 'lucide-react';
import axios from 'axios';
import { showToast } from '../../config/toastConfig';
import { useSocket } from '../../hooks/useSocket';
import { useBreakpoints } from '../../hooks/useMediaQuery';
import '../../styles/responsive.css';

const API_BASE = (import.meta as any).env?.VITE_API_URL ? `${(import.meta as any).env.VITE_API_URL}/api` : 'http://localhost:3000/api';

interface Modulo {
  id_modulo: number;
  nombre: string;
  descripcion: string;
  estado: string;
  total_tareas: number;
}

interface Tarea {
  id_tarea: number;
  titulo: string;
  descripcion: string;
  fecha_limite: string;
  nota_maxima: number;
  ponderacion: number;
  permite_archivo: boolean;
  formatos_permitidos: string;
  tamano_maximo_mb: number;
  estado: string;
  entrega?: {
    id_entrega: number;
    archivo_nombre: string;
    calificacion?: number;
    comentarios?: string;
    fecha_calificacion?: string;
    calificador_nombres?: string;
    calificador_apellidos?: string;
    estado: string;
    fecha_entrega: string;
  };
  id_categoria?: number;
  categoria_nombre?: string;
  categoria_ponderacion?: number;
}

interface DetalleCursoEstudianteProps {
  darkMode: boolean;
}

const DetalleCursoEstudiante: React.FC<DetalleCursoEstudianteProps> = ({ darkMode: darkModeProp }) => {
  const { id } = useParams<{ id: string }>();
  const { isMobile, isSmallScreen } = useBreakpoints();
  const navigate = useNavigate();

  // Obtener darkMode del localStorage o usar el prop (igual que docente)
  const [darkMode, setDarkMode] = useState(() => {
    if (darkModeProp !== undefined) return darkModeProp;
    const saved = localStorage.getItem('estudiante-dark-mode');
    return saved !== null ? JSON.parse(saved) : false;
  });

  const [curso, setCurso] = useState<any>(null);
  const [modulos, setModulos] = useState<Modulo[]>([]);
  const [tareasPorModulo, setTareasPorModulo] = useState<{ [key: number]: Tarea[] }>({});
  const [modulosExpandidos, setModulosExpandidos] = useState<{ [key: number]: boolean }>({});
  const [loading, setLoading] = useState(true);
  const [uploadingTarea, setUploadingTarea] = useState<number | null>(null);
  const [archivoPreview, setArchivoPreview] = useState<{
    file: File;
    id_tarea: number;
    preview?: string;
    tipo: 'entregar' | 'editar';
    id_entrega?: number;
    id_modulo?: number;
  } | null>(null);
  const [isPreviewFullscreen, setIsPreviewFullscreen] = useState(false);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [deleteData, setDeleteData] = useState<{ id_entrega: number; id_modulo: number } | null>(null);

  // Escuchar cambios en el tema (igual que docente)
  useEffect(() => {
    const handleStorageChange = () => {
      const saved = localStorage.getItem('estudiante-dark-mode');
      setDarkMode(saved !== null ? JSON.parse(saved) : false);
    };

    window.addEventListener('storage', handleStorageChange);

    // También escuchar cambios directos en el mismo tab
    const interval = setInterval(() => {
      const saved = localStorage.getItem('estudiante-dark-mode');
      const currentMode = saved !== null ? JSON.parse(saved) : false;
      setDarkMode(currentMode);
    }, 100);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(interval);
    };
  }, []);

  const theme = {
    textPrimary: darkMode ? '#fff' : '#1e293b',
    textSecondary: darkMode ? 'rgba(255,255,255,0.8)' : 'rgba(30,41,59,0.8)',
    textMuted: darkMode ? 'rgba(255,255,255,0.6)' : 'rgba(30,41,59,0.6)',
    border: darkMode ? 'rgba(251, 191, 36, 0.2)' : 'rgba(251, 191, 36, 0.3)',
    cardBg: darkMode ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.8)',
    accent: '#fbbf24'
  };

  const fetchTareasModulo = async (id_modulo: number) => {
    try {
      const token = sessionStorage.getItem('auth_token');
      const response = await axios.get(`${API_BASE}/tareas/modulo/${id_modulo}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      // El backend retorna { success: true, tareas: [...] }
      const tareasData = Array.isArray(response.data.tareas) ? response.data.tareas :
        Array.isArray(response.data) ? response.data : [];
      setTareasPorModulo(prev => ({
        ...prev,
        [id_modulo]: tareasData
      }));
    } catch (error) {
      console.error('Error fetching tareas:', error);
      setTareasPorModulo(prev => ({
        ...prev,
        [id_modulo]: []
      }));
    }
  };

  const fetchModulos = async () => {
    try {
      setLoading(true);
      const token = sessionStorage.getItem('auth_token');
      const response = await axios.get(`${API_BASE}/modulos/curso/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      // El backend retorna { success: true, modulos: [...] }
      const modulosData = Array.isArray(response.data.modulos) ? response.data.modulos :
        Array.isArray(response.data) ? response.data : [];
      setModulos(modulosData);

      // Cargar tareas de cada módulo
      modulosData.forEach((modulo: Modulo) => {
        fetchTareasModulo(modulo.id_modulo);
      });
    } catch (error) {
      console.error('Error fetching modulos:', error);
      setModulos([]); // Establecer array vacío en caso de error
    } finally {
      setLoading(false);
    }
  };

  const fetchCursoData = async () => {
    try {
      const token = sessionStorage.getItem('auth_token');
      const response = await axios.get(`${API_BASE}/cursos/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCurso(response.data);
    } catch (error) {
      console.error('Error fetching curso:', error);
      showToast.error('Error al cargar el curso', darkMode);
    }
  };

  // Función para refrescar todos los datos
  const refreshAllData = async () => {
    if (id) {
      await fetchCursoData();
      await fetchModulos();
    }
  };

  useSocket({
    'nuevo_modulo': (data: any) => {
      // Solo mostrar notificación si es del curso actual
      if (data.id_curso === parseInt(id || '0')) {
        showToast.success(`Nuevo módulo disponible: ${data.nombre_modulo}`, darkMode);
        fetchModulos();
      }
    },
    'nueva_tarea': (data: any) => {
      // Mostrar notificación con información completa
      showToast.success(`Nueva tarea: ${data.titulo_tarea} - ${data.curso_nombre}`, darkMode);

      // Recargar módulos para actualizar contador
      fetchModulos();

      // Si el módulo está expandido, recargar tareas
      if (data.id_modulo && modulosExpandidos[data.id_modulo]) {
        fetchTareasModulo(data.id_modulo);
      }
    },
    'tarea_calificada': (data: any) => {
      // Obtener el ID del usuario actual desde sessionStorage
      const authData = sessionStorage.getItem('auth_data');
      if (authData) {
        try {
          const userData = JSON.parse(authData);
          const currentUserId = userData.id_usuario;

          // Solo mostrar notificación si es para este estudiante
          if (data.id_estudiante === currentUserId) {
            showToast.success(`🎓 Tu tarea ha sido calificada: ${data.nota} puntos`, darkMode);
          }
        } catch (error) {
          console.error('Error al parsear auth_data:', error);
        }
      }

      // Recargar módulos y tareas expandidas
      fetchModulos();
      Object.keys(modulosExpandidos).forEach(id_modulo => {
        if (modulosExpandidos[parseInt(id_modulo)]) {
          fetchTareasModulo(parseInt(id_modulo));
        }
      });
    },
    'modulo_cerrado': (data: any) => {
      // Solo procesar si es del curso actual
      if (data.id_curso === parseInt(id || '0')) {
        showToast.info(`Módulo "${data.nombre}" ha sido cerrado`, darkMode);

        // Recargar módulos para actualizar el estado
        fetchModulos();
      }
    },
    'modulo_reabierto': (data: any) => {
      // Solo procesar si es del curso actual
      if (data.id_curso === parseInt(id || '0')) {
        showToast.success(`Módulo "${data.nombre}" ha sido reabierto`, darkMode);

        // Recargar módulos para actualizar el estado
        fetchModulos();
      }
    }
  }, undefined, id ? [parseInt(id)] : []);

  // Cargar datos iniciales
  useEffect(() => {
    if (id) {
      fetchCursoData();
      fetchModulos();
    }
  }, [id]);



  const toggleModulo = (id_modulo: number) => {
    setModulosExpandidos(prev => ({
      ...prev,
      [id_modulo]: !prev[id_modulo]
    }));
  };

  const handleFileUpload = async (id_tarea: number, file: File) => {
    try {
      setUploadingTarea(id_tarea);
      const token = sessionStorage.getItem('auth_token');

      const formData = new FormData();
      formData.append('archivo', file);
      formData.append('id_tarea', id_tarea.toString());

      await axios.post(`${API_BASE}/entregas`, formData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });

      showToast.success('¡Archivo entregado exitosamente!', darkMode);

      // Recargar todas las tareas para actualizar el estado
      await Promise.all(modulos.map(modulo => fetchTareasModulo(modulo.id_modulo)));
    } catch (error: any) {
      console.error('Error uploading file:', error);
      showToast.error(error.response?.data?.error || 'Error al subir el archivo', darkMode);
    } finally {
      setUploadingTarea(null);
    }
  };

  const handleDeleteEntrega = async () => {
    if (!deleteData) return;

    try {
      const token = sessionStorage.getItem('auth_token');
      await axios.delete(`${API_BASE}/entregas/${deleteData.id_entrega}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      showToast.success('Entrega eliminada exitosamente', darkMode);
      await fetchTareasModulo(deleteData.id_modulo);
      setShowConfirmDelete(false);
      setDeleteData(null);
    } catch (error: any) {
      console.error('Error deleting entrega:', error);
      showToast.error(error.response?.data?.error || 'Error al eliminar la entrega', darkMode);
      setShowConfirmDelete(false);
      setDeleteData(null);
    }
  };

  const openDeleteConfirm = (id_entrega: number, id_modulo: number) => {
    setDeleteData({ id_entrega, id_modulo });
    setShowConfirmDelete(true);
  };

  const handleEditEntrega = async (id_entrega: number, id_modulo: number, file: File) => {
    try {
      setUploadingTarea(id_entrega);
      const token = sessionStorage.getItem('auth_token');

      const formData = new FormData();
      formData.append('archivo', file);

      await axios.put(`${API_BASE}/entregas/${id_entrega}`, formData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });

      showToast.success('Entrega actualizada exitosamente', darkMode);
      await fetchTareasModulo(id_modulo);
    } catch (error: any) {
      console.error('Error updating entrega:', error);
      showToast.error(error.response?.data?.error || 'Error al actualizar la entrega', darkMode);
    } finally {
      setUploadingTarea(null);
    }
  };

  // Función para manejar la previsualización del archivo
  const handleFileSelect = (file: File, id_tarea: number, tipo: 'entregar' | 'editar', id_entrega?: number, id_modulo?: number) => {
    // Crear preview para imágenes y PDFs
    const reader = new FileReader();
    reader.onloadend = () => {
      setArchivoPreview({
        file,
        id_tarea,
        preview: reader.result as string,
        tipo,
        id_entrega,
        id_modulo
      });
    };
    reader.readAsDataURL(file);
  };

  // Función para confirmar la subida después de la previsualización
  const confirmarSubida = async () => {
    if (!archivoPreview) return;

    if (archivoPreview.tipo === 'entregar') {
      await handleFileUpload(archivoPreview.id_tarea, archivoPreview.file);
    } else if (archivoPreview.tipo === 'editar' && archivoPreview.id_entrega && archivoPreview.id_modulo) {
      await handleEditEntrega(archivoPreview.id_entrega, archivoPreview.id_modulo, archivoPreview.file);
    }

    setArchivoPreview(null);
  };

  // Función para verificar si una entrega es atrasada
  const esEntregaAtrasada = (fecha_entrega: string, fecha_limite: string) => {
    return new Date(fecha_entrega) > new Date(fecha_limite);
  };

  // Función para verificar si aún se puede entregar
  const puedeEntregar = (fecha_limite: string) => {
    return new Date() <= new Date(fecha_limite);
  };

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '25em',
        color: theme.textPrimary
      }}>
        Cargando...
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100%',
      backgroundColor: 'transparent',
      color: darkMode ? '#fff' : '#1f2937',
      padding: '0',
      paddingBottom: '1.5rem',
    }}>
      {/* Botón Volver */}
      <div style={{ marginBottom: '1rem' }}>
        <button
          onClick={() => navigate('/panel/estudiante')}
          style={{
            background: darkMode ? 'rgba(251, 191, 36, 0.15)' : 'rgba(251, 191, 36, 0.2)',
            border: 'none',
            color: darkMode ? '#fbbf24' : '#f59e0b',
            cursor: 'pointer',
            fontSize: '0.875rem',
            fontWeight: '700',
            padding: '0.5rem 1rem',
            borderRadius: '0.625rem',
            transition: 'all 0.2s ease',
            boxShadow: '0 2px 6px rgba(251, 191, 36, 0.2)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = darkMode ? 'rgba(251, 191, 36, 0.25)' : 'rgba(251, 191, 36, 0.3)';
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = '0 4px 12px rgba(251, 191, 36, 0.3)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = darkMode ? 'rgba(251, 191, 36, 0.15)' : 'rgba(251, 191, 36, 0.2)';
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 2px 6px rgba(251, 191, 36, 0.2)';
          }}
        >
          <ArrowLeft size={16} strokeWidth={2.5} color={darkMode ? '#fbbf24' : '#f59e0b'} />
          Volver a Mis Cursos
        </button>
      </div>

      {/* Header */}
      <div style={{ marginBottom: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem', marginBottom: '0.25rem' }}>
          <div style={{
            width: '3rem',
            height: '3rem',
            background: 'linear-gradient(135deg, #fbbf24, #f59e0b)',
            borderRadius: '0.875rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 12px rgba(251, 191, 36, 0.3)'
          }}>
            <BookOpen size={24} strokeWidth={2.5} color="#fff" />
          </div>
          <div>
            <h1 style={{ fontSize: isMobile ? '1.1rem' : '1.25rem', fontWeight: '800', margin: 0, color: darkMode ? '#fff' : '#1f2937' }}>
              {curso?.nombre}
            </h1>
            <p style={{ fontSize: isMobile ? '0.7rem' : '0.75rem', color: darkMode ? 'rgba(255,255,255,0.7)' : '#6b7280', margin: 0 }}>
              Código: {curso?.codigo_curso}
            </p>
          </div>
        </div>
      </div>

      {/* Lista de Módulos */}
      {modulos.length === 0 ? (
        <div style={{
          background: theme.cardBg,
          border: `0.0625rem solid ${theme.border}`,
          borderRadius: '1em',
          padding: '3em',
          textAlign: 'center'
        }}>
          <BookOpen size={48} style={{ color: theme.textMuted, margin: '0 auto 1em' }} />
          <p style={{ color: theme.textMuted }}>
            No hay módulos disponibles en este curso
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75em' }}>
          {modulos.map((modulo) => (
            <div
              key={modulo.id_modulo}
              style={{
                background: darkMode ? 'rgba(255,255,255,0.02)' : '#ffffff',
                border: darkMode ? '0.0625rem solid rgba(255,255,255,0.06)' : '0.0625rem solid #e5e7eb',
                borderRadius: '0.75em',
                overflow: 'hidden',
                transition: 'all 0.2s ease'
              }}
            >
              {/* Header del Módulo */}
              <div
                style={{
                  padding: '1em 1.25em',
                  cursor: 'pointer',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  transition: 'background 0.2s ease'
                }}
                onClick={() => toggleModulo(modulo.id_modulo)}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = darkMode ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.01)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent';
                }}
              >
                <div style={{ flex: 1 }}>
                  <h3 style={{
                    color: theme.textPrimary,
                    fontSize: '0.9rem', // Reduced from 1rem
                    fontWeight: '600',
                    margin: '0 0 0.15em 0', // Reduced margin
                    letterSpacing: '-0.01em'
                  }}>
                    {modulo.nombre}
                  </h3>
                  <p style={{ color: theme.textMuted, fontSize: '0.75rem', margin: 0 }}>
                    {modulo.total_tareas} {modulo.total_tareas === 1 ? 'tarea' : 'tareas'}
                  </p>
                </div>
                {modulosExpandidos[modulo.id_modulo] ? (
                  <ChevronUp size={16} style={{ color: theme.textMuted }} />
                ) : (
                  <ChevronDown size={16} style={{ color: theme.textMuted }} />
                )}
              </div>

              {/* Lista de Tareas */}
              {modulosExpandidos[modulo.id_modulo] && (
                <div style={{ padding: '0 1em 1em' }}>
                  {!tareasPorModulo[modulo.id_modulo] || tareasPorModulo[modulo.id_modulo].length === 0 ? (
                    <p style={{ color: theme.textMuted, textAlign: 'center', padding: '1.25em' }}>
                      No hay tareas en este módulo
                    </p>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25em' }}>
                      {/* Agrupar tareas por categoría */}
                      {(() => {
                        const tareas = tareasPorModulo[modulo.id_modulo] || [];
                        const tareasPorCategoria = tareas.reduce((acc, tarea) => {
                          const categoriaKey = tarea.categoria_nombre
                            ? `${tarea.categoria_nombre}|${tarea.categoria_ponderacion}`
                            : 'Sin Categoría|0';
                          if (!acc[categoriaKey]) {
                            acc[categoriaKey] = [];
                          }
                          acc[categoriaKey].push(tarea);
                          return acc;
                        }, {} as Record<string, typeof tareas>);

                        // Ordenar categorías (opcional, por ahora alfabético o como vengan)
                        return Object.entries(tareasPorCategoria).map(([key, tareasDeCategoria]) => {
                          const [nombreCat, ponderacionCat] = key.split('|');

                          return (
                            <div key={key}>
                              {nombreCat !== 'Sin Categoría' && (
                                <div style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '0.75rem',
                                  marginBottom: '1rem',
                                  marginTop: '1.5rem',
                                  padding: '0.75rem 1rem',
                                  background: darkMode ? 'rgba(251, 191, 36, 0.1)' : 'rgba(251, 191, 36, 0.05)',
                                  borderLeft: `4px solid ${theme.accent}`,
                                  borderRadius: '0 0.5rem 0.5rem 0',
                                  boxShadow: darkMode ? 'none' : '0 2px 4px rgba(0,0,0,0.05)',
                                }}>
                                  <Award size={20} color={theme.accent} />
                                  <h5 style={{
                                    margin: 0,
                                    fontSize: '1rem',
                                    fontWeight: '800',
                                    color: theme.textPrimary,
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.05em',
                                    flex: 1
                                  }}>
                                    {nombreCat}
                                  </h5>
                                  <div style={{
                                    background: theme.accent,
                                    color: '#000',
                                    padding: '0.25rem 0.75rem',
                                    borderRadius: '1rem',
                                    fontSize: '0.75rem',
                                    fontWeight: '700',
                                    boxShadow: '0 2px 4px rgba(251, 191, 36, 0.3)'
                                  }}>
                                    {ponderacionCat} pts
                                  </div>
                                </div>
                              )}

                              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625em' }}>
                                {tareasDeCategoria.map((tarea) => (
                                  <div
                                    key={tarea.id_tarea}
                                    style={{
                                      background: darkMode
                                        ? 'linear-gradient(145deg, rgba(40, 40, 45, 0.6), rgba(30, 30, 35, 0.8))'
                                        : 'linear-gradient(145deg, #ffffff, #f8fafc)',
                                      border: `0.0625rem solid ${darkMode ? 'rgba(255,255,255,0.06)' : 'rgba(226, 232, 240, 0.8)'}`,
                                      borderRadius: '0.625rem',
                                      padding: '0.75em 1em',
                                      boxShadow: darkMode
                                        ? '0 1px 3px -1px rgba(0, 0, 0, 0.2), 0 1px 2px -1px rgba(0, 0, 0, 0.1)'
                                        : '0 1px 3px -1px rgba(226, 232, 240, 0.5), 0 1px 2px -1px rgba(226, 232, 240, 0.3)',
                                      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                      position: 'relative',
                                      overflow: 'hidden'
                                    }}
                                    onMouseEnter={(e) => {
                                      e.currentTarget.style.transform = 'translateY(-1px)';
                                      e.currentTarget.style.boxShadow = darkMode
                                        ? '0 4px 6px -1px rgba(0, 0, 0, 0.3), 0 2px 4px -1px rgba(0, 0, 0, 0.2)'
                                        : '0 4px 6px -1px rgba(226, 232, 240, 0.8), 0 2px 4px -1px rgba(226, 232, 240, 0.4)';
                                      e.currentTarget.style.borderColor = theme.accent;
                                    }}
                                    onMouseLeave={(e) => {
                                      e.currentTarget.style.transform = 'translateY(0)';
                                      e.currentTarget.style.boxShadow = darkMode
                                        ? '0 1px 3px -1px rgba(0, 0, 0, 0.2), 0 1px 2px -1px rgba(0, 0, 0, 0.1)'
                                        : '0 1px 3px -1px rgba(226, 232, 240, 0.5), 0 1px 2px -1px rgba(226, 232, 240, 0.3)';
                                      e.currentTarget.style.borderColor = darkMode ? 'rgba(255,255,255,0.06)' : 'rgba(226, 232, 240, 0.8)';
                                    }}
                                  >
                                    <div style={{
                                      display: 'flex',
                                      justifyContent: 'space-between',
                                      alignItems: 'flex-start',
                                      marginBottom: '0.5em',
                                      gap: '0.625rem'
                                    }}>
                                      <div style={{ flex: 1 }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', marginBottom: '0.25rem' }}>
                                          <span style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '0.2em',
                                            fontSize: '0.6rem',
                                            color: theme.textMuted,
                                            background: darkMode ? 'rgba(255,255,255,0.03)' : '#f1f5f9',
                                            padding: '0.1em 0.35em',
                                            borderRadius: '0.25em'
                                          }}>
                                            <FileText size={9} />
                                            Nota Máx: {Number(tarea.nota_maxima).toFixed(2)}
                                          </span>
                                        </div>

                                        <h4 style={{
                                          color: theme.textPrimary,
                                          fontSize: '0.85rem',
                                          fontWeight: '700',
                                          margin: '0 0 0.15em 0',
                                          letterSpacing: '-0.01em',
                                          lineHeight: '1.2'
                                        }}>
                                          {tarea.titulo}
                                        </h4>

                                        {tarea.descripcion && (
                                          <p style={{
                                            color: theme.textMuted,
                                            fontSize: '0.7rem',
                                            margin: '0 0 0.5em 0',
                                            lineHeight: '1.4',
                                            maxWidth: '95%'
                                          }}>
                                            {tarea.descripcion}
                                          </p>
                                        )}

                                        <div style={{ display: 'flex', gap: '0.5em', fontSize: '0.65rem', color: theme.textMuted, flexWrap: 'wrap', alignItems: 'center' }}>
                                          <span style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '0.25em',
                                            color: esEntregaAtrasada(new Date().toISOString(), tarea.fecha_limite) ? '#ef4444' : theme.textMuted
                                          }}>
                                            <Calendar size={11} />
                                            <span style={{ fontWeight: '500' }}>Vence:</span>
                                            {new Date(tarea.fecha_limite).toLocaleDateString('es-ES', { weekday: 'short', day: '2-digit', month: 'short' })} •
                                            {new Date(tarea.fecha_limite).toLocaleTimeString('es-EC', { hour: '2-digit', minute: '2-digit', hour12: false })}
                                          </span>
                                        </div>
                                      </div>

                                      {/* Estado de la entrega Badge */}
                                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.2rem' }}>
                                        {tarea.entrega ? (
                                          <div style={{
                                            background: tarea.entrega.calificacion
                                              ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.15), rgba(6, 95, 70, 0.15))'
                                              : 'linear-gradient(135deg, rgba(245, 158, 11, 0.15), rgba(180, 83, 9, 0.15))',
                                            border: `1px solid ${tarea.entrega.calificacion ? 'rgba(16, 185, 129, 0.3)' : 'rgba(245, 158, 11, 0.3)'}`,
                                            borderRadius: '0.4em',
                                            padding: '0.2em 0.5em',
                                            fontSize: '0.6rem',
                                            fontWeight: '700',
                                            color: tarea.entrega.calificacion ? '#10b981' : '#f59e0b',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '0.25em',
                                            boxShadow: `0 1px 2px ${tarea.entrega.calificacion ? 'rgba(16, 185, 129, 0.1)' : 'rgba(245, 158, 11, 0.1)'}`
                                          }}>
                                            {tarea.entrega.calificacion ? <CheckCircle size={10} strokeWidth={3} /> : <Clock size={10} strokeWidth={3} />}
                                            {tarea.entrega.calificacion ? 'CALIFICADO' : 'ENTREGADO'}
                                          </div>
                                        ) : (
                                          <div style={{
                                            background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.1), rgba(153, 27, 27, 0.1))',
                                            border: '1px solid rgba(239, 68, 68, 0.2)',
                                            borderRadius: '0.4em',
                                            padding: '0.2em 0.5em',
                                            fontSize: '0.6rem',
                                            fontWeight: '700',
                                            color: '#ef4444',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '0.25em'
                                          }}>
                                            <AlertTriangle size={10} strokeWidth={2.5} />
                                            PENDIENTE
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                    {/* Subir archivo */}
                                    {tarea.permite_archivo && !tarea.entrega && (
                                      <div style={{ marginTop: '0.625em', paddingTop: '0.625em', borderTop: `0.0625rem solid ${darkMode ? 'rgba(255,255,255,0.04)' : '#e5e7eb'}` }}>
                                        {/* Mensaje si el módulo está cerrado */}
                                        {modulo.estado === 'finalizado' ? (
                                          <div style={{
                                            background: 'rgba(156, 163, 175, 0.1)',
                                            border: '1px solid rgba(156, 163, 175, 0.3)',
                                            borderRadius: '0.5em',
                                            padding: '0.75em',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '0.5em'
                                          }}>
                                            <AlertTriangle size={16} color="#9ca3af" />
                                            <span style={{ color: '#9ca3af', fontSize: '0.75rem', fontWeight: '600' }}>
                                              Módulo cerrado exitosamente - No se permiten más entregas
                                            </span>
                                          </div>
                                        ) : (
                                          <>
                                            {/* Advertencia si pasó la fecha límite */}
                                            {!puedeEntregar(tarea.fecha_limite) && (
                                              <div style={{
                                                background: 'rgba(239, 68, 68, 0.1)',
                                                border: '1px solid rgba(239, 68, 68, 0.3)',
                                                borderRadius: '0.5em',
                                                padding: '0.5em 0.75em',
                                                marginBottom: '0.5em',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '0.5em'
                                              }}>
                                                <AlertTriangle size={16} color="#ef4444" />
                                                <span style={{ color: '#ef4444', fontSize: '0.75rem', fontWeight: '600' }}>
                                                  Fecha límite vencida - La entrega será marcada como atrasada
                                                </span>
                                              </div>
                                            )}

                                            <input
                                              type="file"
                                              accept={tarea.formatos_permitidos.split(',').map(f => `.${f}`).join(',')}
                                              onChange={(e) => {
                                                const file = e.target.files?.[0];
                                                if (file) {
                                                  if (file.size > tarea.tamano_maximo_mb * 1024 * 1024) {
                                                    showToast.error(`El archivo no debe superar ${tarea.tamano_maximo_mb}MB`, darkMode);
                                                    return;
                                                  }
                                                  handleFileSelect(file, tarea.id_tarea, 'entregar', undefined, modulo.id_modulo);
                                                }
                                                e.target.value = ''; // Limpiar input
                                              }}
                                              style={{ display: 'none' }}
                                              id={`file-${tarea.id_tarea}`}
                                            />
                                            <label
                                              htmlFor={`file-${tarea.id_tarea}`}
                                              style={{
                                                background: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)',
                                                border: 'none',
                                                borderRadius: '0.4375em',
                                                padding: '0.5em 0.875em',
                                                color: darkMode ? '#000' : '#fff',
                                                cursor: uploadingTarea === tarea.id_tarea ? 'not-allowed' : 'pointer',
                                                display: 'inline-flex',
                                                alignItems: 'center',
                                                gap: '0.375em',
                                                fontWeight: '600',
                                                fontSize: '0.8125rem',
                                                opacity: uploadingTarea === tarea.id_tarea ? 0.6 : 1,
                                                boxShadow: '0 0.125rem 0.375rem rgba(251, 191, 36, 0.25)',
                                                transition: 'all 0.2s ease'
                                              }}
                                              onMouseEnter={(e) => {
                                                if (uploadingTarea !== tarea.id_tarea) {
                                                  e.currentTarget.style.transform = 'translateY(-0.0625rem)';
                                                  e.currentTarget.style.boxShadow = '0 0.25rem 0.625rem rgba(251, 191, 36, 0.3)';
                                                }
                                              }}
                                              onMouseLeave={(e) => {
                                                e.currentTarget.style.transform = 'translateY(0)';
                                                e.currentTarget.style.boxShadow = '0 0.125rem 0.375rem rgba(251, 191, 36, 0.25)';
                                              }}
                                            >
                                              <Send size={15} color={darkMode ? '#000' : '#fff'} />
                                              {uploadingTarea === tarea.id_tarea ? 'Subiendo...' : 'Entregar Tarea'}
                                            </label>
                                            <p style={{ color: theme.textMuted, fontSize: '0.6875rem', margin: '0.375em 0 0 0' }}>
                                              Formatos: {tarea.formatos_permitidos.toUpperCase()} • Máx: {tarea.tamano_maximo_mb}MB
                                            </p>
                                          </>
                                        )}
                                      </div>
                                    )}
                                    {/* Archivo entregado */}
                                    {tarea.entrega && (
                                      <div style={{
                                        background: darkMode ? 'rgba(217, 119, 6, 0.1)' : 'rgba(217, 119, 6, 0.05)',
                                        border: '0.0625rem solid rgba(217, 119, 6, 0.2)',
                                        borderRadius: '0.5em',
                                        padding: '0.75em',
                                        marginTop: '0.75em'
                                      }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: tarea.entrega.calificacion ? '0.5em' : '0' }}>
                                          <div style={{ flex: 1 }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5em', marginBottom: '0.25em' }}>
                                              <p style={{ color: theme.textPrimary, fontSize: '0.875rem', fontWeight: '600', margin: 0 }}>
                                                {tarea.entrega.archivo_nombre}
                                              </p>
                                              {/* Badge ATRASADA */}
                                              {esEntregaAtrasada(tarea.entrega.fecha_entrega, tarea.fecha_limite) && (
                                                <span style={{
                                                  background: 'rgba(239, 68, 68, 0.1)',
                                                  border: '1px solid rgba(239, 68, 68, 0.3)',
                                                  borderRadius: '0.25em',
                                                  padding: '0.125em 0.5em',
                                                  fontSize: '0.65rem',
                                                  fontWeight: '700',
                                                  color: '#ef4444',
                                                  textTransform: 'uppercase'
                                                }}>
                                                  ATRASADA
                                                </span>
                                              )}
                                            </div>
                                            <p style={{ color: theme.textMuted, fontSize: '0.75rem', margin: 0 }}>
                                              Entregado: {new Date(tarea.entrega.fecha_entrega).toLocaleDateString('es-ES')} {new Date(tarea.entrega.fecha_entrega).toLocaleTimeString('es-EC', { hour: '2-digit', minute: '2-digit', hour12: false })}
                                            </p>
                                          </div>
                                          <CheckCircle size={20} color={tarea.entrega.calificacion ? '#10b981' : '#d97706'} />
                                        </div>

                                        {/* Botones Editar y Eliminar (solo si NO está calificada Y módulo NO está cerrado) */}
                                        {!tarea.entrega.calificacion && modulo.estado !== 'finalizado' && (
                                          <div style={{ display: 'flex', gap: '0.5em', marginTop: '0.5em', paddingTop: '0.5em', borderTop: `1px solid ${darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}` }}>
                                            {/* Botón Editar */}
                                            <div>
                                              <input
                                                type="file"
                                                accept={tarea.formatos_permitidos.split(',').map(f => `.${f}`).join(',')}
                                                onChange={(e) => {
                                                  const file = e.target.files?.[0];
                                                  if (file) {
                                                    if (file.size > tarea.tamano_maximo_mb * 1024 * 1024) {
                                                      showToast.error(`El archivo no debe superar ${tarea.tamano_maximo_mb}MB`, darkMode);
                                                      return;
                                                    }
                                                    handleFileSelect(file, tarea.id_tarea, 'editar', tarea.entrega!.id_entrega, modulo.id_modulo);
                                                  }
                                                  e.target.value = ''; // Limpiar input
                                                }}
                                                style={{ display: 'none' }}
                                                id={`edit-file-${tarea.id_tarea}`}
                                              />
                                              <label
                                                htmlFor={`edit-file-${tarea.id_tarea}`}
                                                style={{
                                                  background: darkMode ? 'rgba(245, 158, 11, 0.1)' : 'rgba(245, 158, 11, 0.08)',
                                                  border: '1px solid rgba(245, 158, 11, 0.3)',
                                                  borderRadius: '0.375em',
                                                  padding: '0.375em 0.75em',
                                                  color: '#f59e0b',
                                                  cursor: 'pointer',
                                                  display: 'inline-flex',
                                                  alignItems: 'center',
                                                  gap: '0.375em',
                                                  fontWeight: '600',
                                                  fontSize: '0.75rem',
                                                  transition: 'all 0.2s ease'
                                                }}
                                                onMouseEnter={(e) => {
                                                  e.currentTarget.style.background = 'rgba(245, 158, 11, 0.15)';
                                                }}
                                                onMouseLeave={(e) => {
                                                  e.currentTarget.style.background = darkMode ? 'rgba(245, 158, 11, 0.1)' : 'rgba(245, 158, 11, 0.08)';
                                                }}
                                              >
                                                <Edit size={14} color="#f59e0b" />
                                                Editar
                                              </label>
                                            </div>

                                            {/* Botón Eliminar */}
                                            <button
                                              onClick={() => openDeleteConfirm(tarea.entrega!.id_entrega, modulo.id_modulo)}
                                              style={{
                                                background: darkMode ? 'rgba(239, 68, 68, 0.1)' : 'rgba(239, 68, 68, 0.08)',
                                                border: '1px solid rgba(239, 68, 68, 0.3)',
                                                borderRadius: '0.375em',
                                                padding: '0.375em 0.75em',
                                                color: '#ef4444',
                                                cursor: 'pointer',
                                                display: 'inline-flex',
                                                alignItems: 'center',
                                                gap: '0.375em',
                                                fontWeight: '600',
                                                fontSize: '0.75rem',
                                                transition: 'all 0.2s ease'
                                              }}
                                              onMouseEnter={(e) => {
                                                e.currentTarget.style.background = 'rgba(239, 68, 68, 0.15)';
                                              }}
                                              onMouseLeave={(e) => {
                                                e.currentTarget.style.background = darkMode ? 'rgba(239, 68, 68, 0.1)' : 'rgba(239, 68, 68, 0.08)';
                                              }}
                                            >
                                              <Trash2 size={14} color="#ef4444" />
                                              Eliminar
                                            </button>
                                          </div>
                                        )}

                                        {/* Mostrar calificación si existe */}
                                        {tarea.entrega.calificacion !== undefined && tarea.entrega.calificacion !== null && (
                                          <div style={{
                                            borderTop: '0.0625rem solid rgba(217, 119, 6, 0.2)',
                                            paddingTop: '0.5em',
                                            marginTop: '0.5em'
                                          }}>
                                            <p style={{ color: '#d97706', fontSize: '0.875rem', fontWeight: '700', margin: '0 0 0.25em 0' }}>
                                              Calificación: {tarea.entrega.calificacion}/{tarea.nota_maxima}
                                            </p>
                                            {tarea.entrega.comentarios && (
                                              <p style={{ color: theme.textSecondary, fontSize: '0.8125rem', margin: '0 0 0.25em 0', fontStyle: 'italic' }}>
                                                "{tarea.entrega.comentarios}"
                                              </p>
                                            )}
                                            <p style={{ color: theme.textMuted, fontSize: '0.75rem', margin: 0 }}>
                                              {tarea.entrega.calificador_nombres && tarea.entrega.calificador_apellidos ? (
                                                <>
                                                  Calificado por <strong>{tarea.entrega.calificador_nombres} {tarea.entrega.calificador_apellidos}</strong>
                                                  {tarea.entrega.fecha_calificacion && ` el ${new Date(tarea.entrega.fecha_calificacion).toLocaleDateString('es-ES')}`}
                                                </>
                                              ) : tarea.entrega.fecha_calificacion ? (
                                                `Calificado el ${new Date(tarea.entrega.fecha_calificacion).toLocaleDateString('es-ES')}`
                                              ) : null}
                                            </p>
                                          </div>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          );
                        });
                      })()}
                    </div>
                  )
                  }
                </div>
              )}
            </div>
          ))}
        </div>
      )
      }

      {/* Modal de Previsualización */}
      {
        archivoPreview && createPortal(
          <>
            {/* Overlay */}
            <div
              onClick={() => setArchivoPreview(null)}
              style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                width: '100vw',
                height: '100vh',
                background: 'rgba(0, 0, 0, 0.65)',
                backdropFilter: 'blur(8px)',
                WebkitBackdropFilter: 'blur(8px)',
                zIndex: 99998,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                animation: 'fadeIn 0.3s ease-out'
              }}
            >
              <style>{`
              @keyframes fadeIn {
                from { opacity: 0; }
                to { opacity: 1; }
              }
              @keyframes scaleIn {
                from {
                  opacity: 0;
                  transform: scale(0.9);
                }
                to {
                  opacity: 1;
                  transform: scale(1);
                }
              }
              @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
              }
            `}</style>

              {/* Modal */}
              <div
                onClick={(e) => e.stopPropagation()}
                style={{
                  background: darkMode
                    ? 'rgba(15, 23, 42, 0.95)'
                    : 'rgba(255, 255, 255, 0.95)',
                  backdropFilter: 'blur(20px)',
                  WebkitBackdropFilter: 'blur(20px)',
                  borderRadius: isPreviewFullscreen ? '0' : '12px',
                  padding: isPreviewFullscreen ? '1rem' : '1.25rem',
                  maxWidth: isPreviewFullscreen ? '100%' : '50rem',
                  width: isPreviewFullscreen ? '100%' : '90%',
                  height: isPreviewFullscreen ? '100%' : 'auto',
                  maxHeight: isPreviewFullscreen ? '100%' : '85vh',
                  overflowY: 'hidden',
                  display: 'flex',
                  flexDirection: 'column',
                  border: isPreviewFullscreen ? 'none' : `1px solid ${darkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`,
                  boxShadow: darkMode
                    ? '0 20px 60px -12px rgba(0, 0, 0, 0.5)'
                    : '0 20px 60px -12px rgba(0, 0, 0, 0.15)',
                  zIndex: 99999,
                  animation: 'scaleIn 0.3s ease-out',
                  transition: 'all 0.3s ease-in-out'
                }}>
                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', flexShrink: 0 }}>
                  <h3 style={{ color: theme.textPrimary, fontSize: '1rem', fontWeight: '700', margin: 0 }}>
                    Vista Previa del Archivo
                  </h3>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setIsPreviewFullscreen(!isPreviewFullscreen);
                      }}
                      style={{
                        background: 'var(--estudiante-input-bg, rgba(255, 255, 255, 0.05))',
                        border: '1px solid var(--estudiante-border, rgba(255, 255, 255, 0.1))',
                        borderRadius: '8px',
                        padding: '0.5rem',
                        color: 'var(--estudiante-text-primary, #fff)',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'all 0.2s ease'
                      }}
                      title={isPreviewFullscreen ? "Salir de pantalla completa" : "Pantalla completa"}
                    >
                      {isPreviewFullscreen ? <Minimize2 size={20} /> : <Maximize2 size={20} />}
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setArchivoPreview(null);
                        setIsPreviewFullscreen(false);
                      }}
                      style={{
                        background: 'var(--estudiante-input-bg, rgba(255, 255, 255, 0.05))',
                        border: '1px solid var(--estudiante-border, rgba(255, 255, 255, 0.1))',
                        borderRadius: '8px',
                        padding: '0.5rem',
                        color: 'var(--estudiante-text-primary, #fff)',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'all 0.2s ease'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'var(--estudiante-hover-bg, rgba(255, 255, 255, 0.1))';
                        e.currentTarget.style.transform = 'rotate(90deg)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'var(--estudiante-input-bg, rgba(255, 255, 255, 0.05))';
                        e.currentTarget.style.transform = 'rotate(0deg)';
                      }}
                    >
                      <X size={20} />
                    </button>
                  </div>
                </div>

                {/* Información del archivo - Ocultar en fullscreen */}
                {!isPreviewFullscreen && (
                  <div style={{
                    background: darkMode ? 'rgba(251, 191, 36, 0.1)' : 'rgba(251, 191, 36, 0.05)',
                    border: '1px solid rgba(251, 191, 36, 0.3)',
                    borderRadius: '0.5rem',
                    padding: '0.75rem',
                    marginBottom: '0.75rem',
                    flexShrink: 0
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                      <FileText size={20} color="#fbbf24" />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ color: theme.textPrimary, fontSize: '0.875rem', fontWeight: '600', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {archivoPreview.file.name}
                        </p>
                        <p style={{ color: theme.textMuted, fontSize: '0.75rem', margin: 0 }}>
                          Tamaño: {(archivoPreview.file.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Vista previa */}
                <div style={{
                  background: darkMode ? 'rgba(0,0,0,0.3)' : 'rgba(0,0,0,0.05)',
                  borderRadius: '0.5rem',
                  padding: isPreviewFullscreen ? '0' : '0.75rem',
                  marginBottom: '0.75rem',
                  flex: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  overflow: 'hidden',
                  minHeight: 0
                }}>
                  {archivoPreview.file.type.startsWith('image/') ? (
                    // Vista previa de imagen
                    <img
                      src={archivoPreview.preview}
                      alt="Preview"
                      style={{
                        maxWidth: '100%',
                        maxHeight: '100%',
                        borderRadius: isPreviewFullscreen ? '0' : '0.5rem',
                        objectFit: 'contain'
                      }}
                    />
                  ) : archivoPreview.file.type === 'application/pdf' ? (
                    // Vista previa de PDF
                    <iframe
                      src={archivoPreview.preview}
                      style={{
                        width: '100%',
                        height: '100%',
                        border: 'none',
                        borderRadius: isPreviewFullscreen ? '0' : '0.5rem'
                      }}
                      title="PDF Preview"
                    />
                  ) : (
                    // Icono para otros tipos de archivo
                    <div style={{ textAlign: 'center' }}>
                      <FileType size={80} color={theme.textMuted} />
                      <p style={{ color: theme.textMuted, marginTop: '1em' }}>
                        No se puede previsualizar este tipo de archivo
                      </p>
                    </div>
                  )}
                </div>

                {/* Botones */}
                <div style={{ display: 'flex', gap: '0.625rem', justifyContent: 'flex-end', flexShrink: 0 }}>
                  <button
                    onClick={() => setArchivoPreview(null)}
                    style={{
                      background: darkMode ? 'rgba(255,255,255,0.05)' : '#fff',
                      border: darkMode ? '1px solid rgba(255,255,255,0.1)' : '1px solid #e5e7eb',
                      borderRadius: '0.5rem',
                      padding: '0.625rem 1.25rem',
                      color: darkMode ? '#fff' : '#64748b',
                      fontWeight: '600',
                      cursor: 'pointer',
                      fontSize: '0.875rem',
                      transition: 'all 0.2s ease'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = darkMode ? 'rgba(255,255,255,0.2)' : '#cbd5e1';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = darkMode ? 'rgba(255,255,255,0.1)' : '#e5e7eb';
                    }}
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={confirmarSubida}
                    disabled={uploadingTarea !== null}
                    style={{
                      background: uploadingTarea !== null
                        ? 'rgba(251, 191, 36, 0.6)'
                        : 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)',
                      border: 'none',
                      borderRadius: '0.5rem',
                      padding: '0.625rem 1.25rem',
                      color: darkMode ? '#000' : '#fff',
                      fontWeight: '700',
                      cursor: uploadingTarea !== null ? 'not-allowed' : 'pointer',
                      fontSize: '0.875rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      boxShadow: '0 4px 12px rgba(251, 191, 36, 0.3)',
                      transition: 'all 0.2s ease',
                      opacity: uploadingTarea !== null ? 0.6 : 1
                    }}
                    onMouseEnter={(e) => {
                      if (uploadingTarea === null) {
                        e.currentTarget.style.transform = 'translateY(-2px)';
                        e.currentTarget.style.boxShadow = '0 6px 16px rgba(251, 191, 36, 0.4)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = '0 4px 12px rgba(251, 191, 36, 0.3)';
                    }}
                  >
                    {uploadingTarea !== null ? (
                      <>
                        <div style={{
                          width: '16px',
                          height: '16px',
                          border: '2px solid rgba(0,0,0,0.3)',
                          borderTop: '2px solid #000',
                          borderRadius: '50%',
                          animation: 'spin 1s linear infinite'
                        }} />
                        Subiendo...
                      </>
                    ) : (
                      <>
                        <Upload size={18} />
                        {archivoPreview.tipo === 'entregar' ? 'Confirmar y Entregar' : 'Confirmar y Actualizar'}
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </>,
          document.body
        )
      }

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
                <AlertTriangle size={24} color="#ef4444" />
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
                    setDeleteData(null);
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
                  onClick={handleDeleteEntrega}
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

export default DetalleCursoEstudiante;
