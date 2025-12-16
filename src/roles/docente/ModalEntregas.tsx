import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import {
  X, Download, Users, Clock, FileCheck, Award, Search, FileText, CheckCircle, BarChart3, AlertCircle, User, Calendar, Maximize2, Minimize2
} from 'lucide-react';
import axios from 'axios';
import { showToast } from '../../config/toastConfig';
import { useSocket } from '../../hooks/useSocket';

const API_BASE = (import.meta as any).env?.VITE_API_URL || 'http://localhost:3000';

interface ModalEntregasProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  id_tarea: number;
  nombre_tarea: string;
  nota_maxima: number;
  ponderacion: number;
  darkMode: boolean;
}

interface Entrega {
  id_entrega: number;
  id_estudiante: number;
  estudiante_nombre: string;
  estudiante_apellido: string;
  estudiante_identificacion?: string;
  archivo_nombre?: string;
  archivo_url?: string; // URL de Cloudinary
  archivo_public_id?: string; // Public ID de Cloudinary
  fecha_entrega: string;
  estado: string;
  calificacion?: number;
  comentario?: string;
  fecha_calificacion?: string;
}

const ModalEntregas: React.FC<ModalEntregasProps> = ({
  isOpen,
  onClose,
  onSuccess,
  id_tarea,
  nombre_tarea,
  nota_maxima,
  ponderacion,
  darkMode
}) => {
  const navigate = useNavigate();
  const [entregas, setEntregas] = useState<Entrega[]>([]);
  const [loading, setLoading] = useState(false);
  const [notaInput, setNotaInput] = useState<string>('');
  const [comentarioInput, setComentarioInput] = useState<string>('');
  const [entregaSeleccionada, setEntregaSeleccionada] = useState<Entrega | null>(null);
  const [showCalificarModal, setShowCalificarModal] = useState(false);
  const [archivoPreview, setArchivoPreview] = useState<{
    entrega: Entrega;
    url: string;
    tipo: string;
  } | null>(null);
  const [isPreviewFullscreen, setIsPreviewFullscreen] = useState(false);
  const [filtro, setFiltro] = useState<'todas' | 'pendientes' | 'calificadas'>('todas');
  const [busqueda, setBusqueda] = useState('');
  const [filteredEntregas, setFilteredEntregas] = useState<Entrega[]>([]);
  const [calificando, setCalificando] = useState<number | null>(null);

  const fetchEntregas = async () => {
    try {
      setLoading(true);
      const token = sessionStorage.getItem('auth_token');
      const response = await axios.get(`${API_BASE}/api/entregas/tarea/${id_tarea}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = response.data;

      const entregasConEstado = data.entregas.map((entrega: any) => ({
        ...entrega,
        estado: entrega.calificacion !== undefined && entrega.calificacion !== null ? 'calificado' : 'pendiente'
      }));

      setEntregas(entregasConEstado);
    } catch (error) {
      console.error('Error fetching entregas:', error);
      showToast.error('Error al cargar las entregas', darkMode);
    } finally {
      setLoading(false);
    }
  };

  useSocket({
    'tarea_entregada_docente': (data: any) => {
      if (data.id_tarea === id_tarea) {
        const nombreEstudiante = data.estudiante_nombre || 'Un estudiante';
        showToast.success(`Nueva entrega de ${nombreEstudiante}`, darkMode);
        fetchEntregas();
      }
    },
    'tarea_calificada': (data: any) => {
      if (data.id_tarea === id_tarea) {
        fetchEntregas();
      }
    }
  });

  useEffect(() => {
    console.log('ModalEntregas - isOpen:', isOpen, 'id_tarea:', id_tarea);
    if (isOpen && id_tarea) {
      fetchEntregas();
    }
  }, [isOpen, id_tarea]);

  useEffect(() => {
    // Aplicar filtros y búsqueda
    let result = [...entregas];

    // Aplicar filtro
    if (filtro === 'pendientes') {
      result = result.filter(e => e.calificacion === undefined || e.calificacion === null);
    } else if (filtro === 'calificadas') {
      result = result.filter(e => e.calificacion !== undefined && e.calificacion !== null);
    }

    // Aplicar búsqueda
    if (busqueda) {
      const term = busqueda.toLowerCase();
      result = result.filter(e =>
        e.estudiante_nombre.toLowerCase().includes(term) ||
        e.estudiante_apellido.toLowerCase().includes(term)
      );
    }

    setFilteredEntregas(result);
  }, [entregas, filtro, busqueda]);

  const handleCalificar = async (id_entrega: number) => {
    const nota = parseFloat(notaInput || '0');
    const comentario = comentarioInput || '';

    if (isNaN(nota) || nota < 0 || nota > nota_maxima) {
      showToast.error(`La nota debe estar entre 0 y ${nota_maxima}`, darkMode);
      return;
    }

    try {
      setCalificando(id_entrega);
      const token = sessionStorage.getItem('auth_token');

      await axios.post(`${API_BASE}/api/entregas/${id_entrega}/calificar`, {
        nota,
        comentario_docente: comentario
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      // Cerrar modal de calificación primero
      setShowCalificarModal(false);
      setEntregaSeleccionada(null);
      setNotaInput('');
      setComentarioInput('');

      // Cerrar también el modal principal de entregas
      onClose();

      // Actualizar datos y mostrar notificación después de cerrar
      fetchEntregas();
      onSuccess();

      setTimeout(() => {
        showToast.success('Tarea calificada exitosamente', darkMode);
      }, 150);
    } catch (error: any) {
      console.error('Error calificando:', error);
      // Cerrar modales también en caso de error
      setShowCalificarModal(false);
      onClose();
      setTimeout(() => {
        showToast.error(error.response?.data?.error || 'Error al calificar', darkMode);
      }, 150);
    } finally {
      setCalificando(null);
    }
  };

  const handleDescargar = async (entrega: Entrega) => {
    try {
      // Si tiene URL de Cloudinary, descargar directamente
      if (entrega.archivo_url) {
        const link = document.createElement('a');
        link.href = entrega.archivo_url;
        // Usar archivo_nombre si existe, sino extraer de la URL
        const nombreArchivo = entrega.archivo_nombre || entrega.archivo_url.split('/').pop() || 'entrega';
        link.setAttribute('download', nombreArchivo);
        link.setAttribute('target', '_blank');
        document.body.appendChild(link);
        link.click();
        link.remove();

        onClose();
        setTimeout(() => {
          showToast.success('Archivo descargado exitosamente', darkMode);
        }, 200);
      } else {
        throw new Error('No hay archivo disponible');
      }
    } catch (error) {
      console.error('Error descargando archivo:', error);
      onClose();
      setTimeout(() => {
        showToast.error('Error al descargar el archivo', darkMode);
      }, 200);
    }
  };

  const handleVerArchivo = async (entrega: Entrega) => {
    try {
      // Si tiene URL de Cloudinary, usar directamente
      if (entrega.archivo_url) {
        // Determinar tipo de archivo por extensión
        // Extraer de archivo_nombre o desde la URL de Cloudinary
        const nombreArchivo = entrega.archivo_nombre || entrega.archivo_url;
        const extension = nombreArchivo?.split('.').pop()?.toLowerCase();
        let tipo = 'application/octet-stream';

        if (['jpg', 'jpeg', 'png', 'webp', 'gif'].includes(extension || '')) {
          tipo = `image/${extension === 'jpg' ? 'jpeg' : extension}`;
        } else if (extension === 'pdf') {
          tipo = 'application/pdf';
        }

        setArchivoPreview({
          entrega,
          url: entrega.archivo_url,
          tipo
        });
      } else {
        throw new Error('No hay archivo disponible');
      }
    } catch (error) {
      console.error('Error cargando archivo:', error);
      showToast.error('Error al cargar el archivo', darkMode);
    }
  };

  const handleDescargarDesdePreview = async () => {
    if (!archivoPreview) return;

    try {
      const { entrega } = archivoPreview;

      // Limpiar nombres: quitar espacios, acentos y caracteres especiales
      const limpiarNombre = (texto: string) => {
        return texto
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '') // Quitar acentos
          .replace(/[^a-zA-Z0-9]/g, '_')    // Reemplazar caracteres especiales por _
          .replace(/_+/g, '_')               // Reemplazar múltiples _ por uno solo
          .replace(/^_|_$/g, '');            // Quitar _ al inicio y final
      };

      const apellidoLimpio = limpiarNombre(entrega.estudiante_apellido);
      const nombreLimpio = limpiarNombre(entrega.estudiante_nombre);
      const tareaLimpia = limpiarNombre(nombre_tarea);

      // Obtener extensión del archivo original
      // Prioridad: archivo_nombre > extraer de URL > usar mime type
      let extension = 'jpg';
      if (entrega.archivo_nombre && entrega.archivo_nombre !== 'undefined' && entrega.archivo_nombre !== 'undefined (1).jpg') {
        extension = entrega.archivo_nombre.split('.').pop() || 'jpg';
      } else if (entrega.archivo_url) {
        // Intentar extraer extensión desde la URL de Cloudinary
        const urlExtension = entrega.archivo_url.split('.').pop()?.toLowerCase();
        if (urlExtension && ['jpg', 'jpeg', 'png', 'webp', 'gif', 'pdf', 'doc', 'docx'].includes(urlExtension)) {
          extension = urlExtension;
        } else {
          // Determinar extensión desde el mime type
          const mimeToExt: { [key: string]: string } = {
            'image/jpeg': 'jpg',
            'image/jpg': 'jpg',
            'image/png': 'png',
            'image/webp': 'webp',
            'image/gif': 'gif',
            'application/pdf': 'pdf',
            'application/msword': 'doc',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx'
          };
          extension = mimeToExt[archivoPreview.tipo] || 'jpg';
        }
      } else {
        // Determinar extensión desde el mime type
        const mimeToExt: { [key: string]: string } = {
          'image/jpeg': 'jpg',
          'image/jpg': 'jpg',
          'image/png': 'png',
          'image/webp': 'webp',
          'image/gif': 'gif',
          'application/pdf': 'pdf',
          'application/msword': 'doc',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx'
        };
        extension = mimeToExt[archivoPreview.tipo] || 'jpg';
      }

      const nombrePersonalizado = `${apellidoLimpio}_${nombreLimpio}_${tareaLimpia}.${extension}`;

      // Usar URL de Cloudinary directamente
      if (!entrega.archivo_url) {
        throw new Error('No hay archivo disponible');
      }

      // Crear link y forzar descarga con el nombre correcto
      const a = document.createElement('a');
      a.href = entrega.archivo_url;
      a.download = nombrePersonalizado;

      document.body.appendChild(a);
      a.click();

      // Cleanup
      setTimeout(() => {
        document.body.removeChild(a);
      }, 150);

      // Cerrar modal de preview primero
      setArchivoPreview(null);

      // Esperar un momento antes de cerrar el modal principal
      setTimeout(() => {
        onClose();

        // Mostrar notificación después de cerrar ambos modales
        setTimeout(() => {
          showToast.success('Archivo descargado exitosamente', darkMode);
        }, 200);
      }, 100);
    } catch (error) {
      console.error('Error descargando archivo:', error);
      // Cerrar ambos modales también en caso de error
      setArchivoPreview(null);
      setTimeout(() => {
        onClose();
        setTimeout(() => {
          showToast.error('Error al descargar el archivo', darkMode);
        }, 200);
      }, 100);
    }
  };

  const abrirModalCalificar = (entrega: Entrega) => {
    setEntregaSeleccionada(entrega);
    setNotaInput(entrega.calificacion?.toString() || '');
    setComentarioInput(entrega.comentario || '');
    setShowCalificarModal(true);
  };

  const calcularEstadisticas = () => {
    const total = entregas.length;
    const calificadas = entregas.filter(e => e.calificacion !== undefined && e.calificacion !== null).length;
    const pendientes = total - calificadas;
    const porcentaje = total > 0 ? Math.round((calificadas / total) * 100) : 0;

    return { total, calificadas, pendientes, porcentaje };
  };

  if (!isOpen) {
    console.log('Modal cerrado, no se renderiza');
    return null;
  }

  console.log('Renderizando modal con entregas:', entregas.length);

  const theme = {
    bg: 'rgba(0,0,0,0.75)',
    modalBg: darkMode ? '#1a1a2e' : '#ffffff',
    textPrimary: darkMode ? '#fff' : '#1e293b',
    textSecondary: darkMode ? 'rgba(255,255,255,0.7)' : 'rgba(30,41,59,0.7)',
    textMuted: darkMode ? 'rgba(255,255,255,0.5)' : 'rgba(30,41,59,0.5)',
    border: darkMode ? 'rgba(255,255,255,0.1)' : '#e5e7eb',
    inputBg: darkMode ? 'rgba(255,255,255,0.05)' : '#f9fafb',
    inputBorder: darkMode ? 'rgba(255,255,255,0.1)' : '#d1d5db',
    rowHover: darkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)'
  };

  const stats = calcularEstadisticas();

  const modalContent = (
    <div
      className="modal-overlay"
      onClick={onClose}
      style={{
        zIndex: 999999
      }}>
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: '75rem'
        }}>
        {/* Header */}
        <div style={{
          padding: '1rem 1.5rem',
          borderBottom: `1px solid ${theme.border}`,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{
              width: '2.5rem',
              height: '2.5rem',
              background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
              borderRadius: '0.75rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <FileText size={20} color="#fff" />
            </div>
            <div>
              <h2 style={{ color: theme.textPrimary, fontSize: '1.25rem', fontWeight: '700', margin: 0, lineHeight: '1.2' }}>
                Entregas de Tarea
              </h2>
              <p style={{ color: theme.textSecondary, fontSize: '0.875rem', margin: '0.25rem 0 0 0', lineHeight: '1.2' }}>
                {nombre_tarea}
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.5em', alignItems: 'center' }}>
            {/* Botón Ver Análisis Completo */}
            <button
              onClick={() => {
                console.log('Navegando a análisis completo, id_tarea:', id_tarea);
                onClose(); // Cerrar el modal primero
                navigate(`/panel/docente/analisis-entregas/${id_tarea}`);
              }}
              style={{
                background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                border: 'none',
                borderRadius: '0.5em',
                padding: '0.625em 1em',
                color: '#fff',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5em',
                fontWeight: '600',
                fontSize: '0.875rem',
                boxShadow: '0 2px 8px rgba(59, 130, 246, 0.3)',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(59, 130, 246, 0.4)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 2px 8px rgba(59, 130, 246, 0.3)';
              }}
            >
              <BarChart3 size={18} />
              Ver Análisis Completo
            </button>

            {/* Botón Cerrar */}
            <button
              onClick={onClose}
              style={{
                background: 'transparent',
                border: 'none',
                color: theme.textSecondary,
                cursor: 'pointer',
                padding: '0.5em',
                borderRadius: '0.5em',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent';
              }}
            >
              <X size={24} />
            </button>
          </div>
        </div>

        {/* Estadísticas */}
        <div style={{
          margin: '0 1.25rem 1rem 1.25rem',
          padding: '1.5rem',
          borderRadius: '0.75rem',
          background: darkMode ? 'rgba(59, 130, 246, 0.05)' : 'rgba(59, 130, 246, 0.03)',
          boxShadow: darkMode
            ? '0 4px 6px rgba(0, 0, 0, 0.3)'
            : '0 4px 6px rgba(0, 0, 0, 0.05)'
        }}>
          <h3 style={{
            color: theme.textPrimary,
            fontSize: '1rem',
            fontWeight: '700',
            margin: '0 0 1rem 0',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            <BarChart3 size={20} style={{ color: '#3b82f6' }} />
            Resumen de Entregas
          </h3>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
            gap: '1rem'
          }}>
            {/* Total */}
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              padding: '0.75rem',
              background: darkMode ? 'rgba(59, 130, 246, 0.1)' : 'rgba(59, 130, 246, 0.05)',
              borderRadius: '0.75rem',
              border: `1px solid rgba(59, 130, 246, 0.2)`,
              transition: 'all 0.2s ease',
              cursor: 'default'
            }}>
              <div style={{
                width: '2rem',
                height: '2rem',
                background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '0.5rem'
              }}>
                <Users size={16} color="#fff" />
              </div>
              <div style={{
                color: '#3b82f6',
                fontSize: '1.25rem',
                fontWeight: '800',
                marginBottom: '0.125rem'
              }}>
                {stats.total}
              </div>
              <div style={{
                color: theme.textSecondary,
                fontSize: '0.7rem',
                fontWeight: '600',
                textAlign: 'center'
              }}>
                Total
              </div>
            </div>

            {/* Pendientes */}
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              padding: '0.75rem',
              background: darkMode ? 'rgba(251, 191, 36, 0.1)' : 'rgba(251, 191, 36, 0.05)',
              borderRadius: '0.75rem',
              border: `1px solid rgba(251, 191, 36, 0.2)`,
              transition: 'all 0.2s ease',
              cursor: 'default'
            }}>
              <div style={{
                width: '2rem',
                height: '2rem',
                background: 'linear-gradient(135deg, #fbbf24, #f59e0b)',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '0.5rem'
              }}>
                <Clock size={16} color="#fff" />
              </div>
              <div style={{
                color: '#fbbf24',
                fontSize: '1.25rem',
                fontWeight: '800',
                marginBottom: '0.125rem'
              }}>
                {stats.pendientes}
              </div>
              <div style={{
                color: theme.textSecondary,
                fontSize: '0.7rem',
                fontWeight: '600',
                textAlign: 'center'
              }}>
                Pendientes
              </div>
            </div>

            {/* Calificadas */}
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              padding: '0.75rem',
              background: darkMode ? 'rgba(16, 185, 129, 0.1)' : 'rgba(16, 185, 129, 0.05)',
              borderRadius: '0.75rem',
              border: `1px solid rgba(16, 185, 129, 0.2)`,
              transition: 'all 0.2s ease',
              cursor: 'default'
            }}>
              <div style={{
                width: '2rem',
                height: '2rem',
                background: 'linear-gradient(135deg, #10b981, #059669)',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '0.5rem'
              }}>
                <FileCheck size={16} color="#fff" />
              </div>
              <div style={{
                color: '#10b981',
                fontSize: '1.25rem',
                fontWeight: '800',
                marginBottom: '0.125rem'
              }}>
                {stats.calificadas}
              </div>
              <div style={{
                color: theme.textSecondary,
                fontSize: '0.7rem',
                fontWeight: '600',
                textAlign: 'center'
              }}>
                Calificadas
              </div>
            </div>

            {/* Completado */}
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              padding: '0.75rem',
              background: darkMode ? 'rgba(16, 185, 129, 0.15)' : 'rgba(16, 185, 129, 0.1)',
              borderRadius: '0.75rem',
              border: `1px solid rgba(16, 185, 129, 0.3)`,
              transition: 'all 0.2s ease',
              cursor: 'default'
            }}>
              <div style={{
                width: '2rem',
                height: '2rem',
                background: 'linear-gradient(135deg, #10b981, #059669)',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '0.5rem'
              }}>
                <Award size={16} color="#fff" />
              </div>
              <div style={{
                color: '#10b981',
                fontSize: '1.25rem',
                fontWeight: '800',
                marginBottom: '0.125rem'
              }}>
                {stats.porcentaje}%
              </div>
              <div style={{
                color: theme.textSecondary,
                fontSize: '0.7rem',
                fontWeight: '600',
                textAlign: 'center'
              }}>
                Completado
              </div>
            </div>
          </div>
        </div>

        {/* Controles de filtro y búsqueda */}
        <div style={{
          padding: '1em 1.25em',
          display: 'flex',
          gap: '1em',
          flexWrap: 'wrap',
          alignItems: 'center'
        }}>
          <div style={{ position: 'relative', flex: '1', minWidth: '200px' }}>
            <Search size={18} style={{
              position: 'absolute',
              left: '0.75em',
              top: '50%',
              transform: 'translateY(-50%)',
              color: theme.textSecondary
            }} />
            <input
              type="text"
              placeholder="Buscar estudiante..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              style={{
                width: '100%',
                padding: '0.625em 0.625em 0.625em 2.5em',
                background: theme.inputBg,
                border: `1px solid ${theme.inputBorder}`,
                borderRadius: '0.5em',
                color: theme.textPrimary,
                fontSize: '0.875rem'
              }}
            />
          </div>

          <div style={{ display: 'flex', gap: '0.5em' }}>
            <button
              onClick={() => setFiltro('todas')}
              style={{
                padding: '0.625em 1em',
                background: filtro === 'todas'
                  ? darkMode ? 'rgba(59, 130, 246, 0.3)' : 'rgba(59, 130, 246, 0.2)'
                  : 'transparent',
                border: `1px solid ${filtro === 'todas' ? '#3b82f6' : theme.inputBorder}`,
                borderRadius: '0.5em',
                color: filtro === 'todas' ? '#3b82f6' : theme.textSecondary,
                cursor: 'pointer',
                fontSize: '0.875rem',
                fontWeight: '600',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5em'
              }}
            >
              <FileText size={16} />
              Todas
            </button>

            <button
              onClick={() => setFiltro('pendientes')}
              style={{
                padding: '0.625em 1em',
                background: filtro === 'pendientes'
                  ? darkMode ? 'rgba(251, 191, 36, 0.2)' : 'rgba(251, 191, 36, 0.1)'
                  : 'transparent',
                border: `1px solid ${filtro === 'pendientes' ? '#fbbf24' : theme.inputBorder}`,
                borderRadius: '0.5em',
                color: filtro === 'pendientes' ? '#fbbf24' : theme.textSecondary,
                cursor: 'pointer',
                fontSize: '0.875rem',
                fontWeight: '600',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5em'
              }}
            >
              <AlertCircle size={16} />
              Pendientes
            </button>

            <button
              onClick={() => setFiltro('calificadas')}
              style={{
                padding: '0.625em 1em',
                background: filtro === 'calificadas'
                  ? darkMode ? 'rgba(16, 185, 129, 0.2)' : 'rgba(16, 185, 129, 0.1)'
                  : 'transparent',
                border: `1px solid ${filtro === 'calificadas' ? '#10b981' : theme.inputBorder}`,
                borderRadius: '0.5em',
                color: filtro === 'calificadas' ? '#10b981' : theme.textSecondary,
                cursor: 'pointer',
                fontSize: '0.875rem',
                fontWeight: '600',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5em'
              }}
            >
              <CheckCircle size={16} />
              Calificadas
            </button>
          </div>
        </div>

        {/* Tabla de entregas */}
        <div style={{
          margin: '0 1.25rem 1.25rem 1.25rem',
          maxHeight: 'calc(90vh - 20rem)',
          overflowY: 'auto'
        }}>
          {loading ? (
            <div style={{
              textAlign: 'center',
              padding: '3em',
              color: theme.textPrimary,
              fontSize: '1rem',
              fontWeight: '500'
            }}>
              <div style={{
                width: '40px',
                height: '40px',
                border: '3px solid rgba(59, 130, 246, 0.2)',
                borderTop: '3px solid #3b82f6',
                borderRadius: '50%',
                margin: '0 auto 1em',
                animation: 'spin 1s linear infinite'
              }}></div>
              Cargando entregas...
            </div>
          ) : filteredEntregas.length === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: '3em 1em',
              color: theme.textSecondary,
              fontSize: '1rem',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '1rem'
            }}>
              <FileText size={48} style={{ opacity: 0.3, color: theme.textMuted }} />
              <div>No hay entregas que coincidan con los filtros</div>
            </div>
          ) : (
            <div style={{
              overflowX: 'auto',
              maxHeight: '60vh',
              overflowY: 'auto',
              borderRadius: '0.75rem',
              boxShadow: darkMode
                ? '0 4px 6px rgba(0, 0, 0, 0.3)'
                : '0 4px 6px rgba(0, 0, 0, 0.05)',
              background: theme.modalBg
            }}>
              <table style={{
                width: '100%',
                borderCollapse: 'separate',
                borderSpacing: 0,
                fontSize: '0.875rem',
                borderRadius: '0.75rem',
                overflow: 'hidden'
              }}>
                <thead style={{
                  position: 'sticky',
                  top: 0,
                  zIndex: 10
                }}>
                  <tr style={{
                    background: darkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)'
                  }}>
                    <th style={{
                      padding: '1em',
                      textAlign: 'left',
                      color: theme.textPrimary,
                      fontWeight: '700'
                    }}>
                      Estudiante
                    </th>
                    <th style={{
                      padding: '1em',
                      textAlign: 'left',
                      color: theme.textPrimary,
                      fontWeight: '700'
                    }}>
                      Fecha Entrega
                    </th>
                    <th style={{
                      padding: '1em',
                      textAlign: 'left',
                      color: theme.textPrimary,
                      fontWeight: '700'
                    }}>
                      Archivo
                    </th>
                    <th style={{
                      padding: '1em',
                      textAlign: 'center',
                      color: theme.textPrimary,
                      fontWeight: '700'
                    }}>
                      Estado
                    </th>
                    <th style={{
                      padding: '1em',
                      textAlign: 'center',
                      color: theme.textPrimary,
                      fontWeight: '700'
                    }}>
                      Calificación
                    </th>
                    <th style={{
                      padding: '1em',
                      textAlign: 'center',
                      color: theme.textPrimary,
                      fontWeight: '700'
                    }}>
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredEntregas.map((entrega) => (
                    <tr
                      key={entrega.id_entrega}
                      style={{
                        background: darkMode ? 'transparent' : '#fff',
                        transition: 'background 0.2s ease'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = theme.rowHover;
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = darkMode ? 'transparent' : '#fff';
                      }}
                    >
                      <td style={{
                        padding: '1em',
                        color: theme.textPrimary,
                        fontWeight: '600'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75em' }}>
                          <div style={{
                            width: '2rem',
                            height: '2rem',
                            borderRadius: '50%',
                            background: darkMode ? 'rgba(59, 130, 246, 0.2)' : 'rgba(59, 130, 246, 0.1)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#3b82f6',
                            fontWeight: '700'
                          }}>
                            <User size={16} />
                          </div>
                          <div>
                            <div>
                              {entrega.estudiante_apellido}, {entrega.estudiante_nombre}
                            </div>
                            <div style={{
                              fontSize: '0.75rem',
                              color: theme.textSecondary,
                              fontWeight: '400'
                            }}>
                              CI: {entrega.estudiante_identificacion || entrega.id_estudiante}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td style={{
                        padding: '1em',
                        color: theme.textSecondary
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5em' }}>
                          <Calendar size={16} color={darkMode ? '#94a3b8' : '#64748b'} />
                          {new Date(entrega.fecha_entrega).toLocaleDateString('es-ES')}
                        </div>
                      </td>
                      <td style={{
                        padding: '1em',
                        color: theme.textSecondary
                      }}>
                        <button
                          onClick={() => handleVerArchivo(entrega)}
                          style={{
                            background: '#3b82f6',
                            border: 'none',
                            padding: '0.45em 1.1em',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.6em',
                            color: '#fff',
                            borderRadius: '0.5em',
                            fontWeight: 600,
                            fontSize: '0.98em',
                            boxShadow: '0 2px 8px rgba(59,130,246,0.08)',
                            transition: 'background 0.18s'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = '#2563eb';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = '#3b82f6';
                          }}
                        >
                          <Search size={18} />
                          <span>Ver tarea</span>
                        </button>
                      </td>
                      <td style={{
                        padding: '1em',
                        textAlign: 'center'
                      }}>
                        {entrega.calificacion !== undefined && entrega.calificacion !== null ? (
                          <div style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.5em',
                            padding: '0.375em 0.75em',
                            borderRadius: '9999px',
                            background: darkMode ? 'rgba(16, 185, 129, 0.15)' : 'rgba(16, 185, 129, 0.1)',
                            color: '#10b981',
                            fontWeight: '600',
                            fontSize: '0.75rem'
                          }}>
                            <CheckCircle size={14} />
                            Calificada
                          </div>
                        ) : (
                          <div style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.5em',
                            padding: '0.375em 0.75em',
                            borderRadius: '9999px',
                            background: darkMode ? 'rgba(251, 191, 36, 0.15)' : 'rgba(251, 191, 36, 0.1)',
                            color: '#fbbf24',
                            fontWeight: '600',
                            fontSize: '0.75rem'
                          }}>
                            <AlertCircle size={14} />
                            Pendiente
                          </div>
                        )}
                      </td>
                      <td style={{
                        padding: '1em',
                        textAlign: 'center'
                      }}>
                        {entrega.calificacion !== undefined && entrega.calificacion !== null ? (
                          <div style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.25em',
                            padding: '0.375em 0.75em',
                            borderRadius: '0.5em',
                            background: darkMode ? 'rgba(16, 185, 129, 0.2)' : 'rgba(16, 185, 129, 0.1)',
                            color: '#10b981',
                            fontWeight: '700'
                          }}>
                            <Award size={14} />
                            {entrega.calificacion}/{nota_maxima}
                          </div>
                        ) : (
                          <div style={{
                            color: theme.textSecondary,
                            fontStyle: 'italic'
                          }}>
                            Sin calificar
                          </div>
                        )}
                      </td>
                      <td style={{
                        padding: '1em',
                        textAlign: 'center'
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5em' }}>
                          {/* Botón Calificar */}
                          <button
                            onClick={() => abrirModalCalificar(entrega)}
                            style={{
                              padding: '0.5em',
                              background: entrega.calificacion !== undefined && entrega.calificacion !== null
                                ? darkMode ? 'rgba(59, 130, 246, 0.15)' : 'rgba(59, 130, 246, 0.1)'
                                : darkMode ? 'rgba(16, 185, 129, 0.15)' : 'rgba(16, 185, 129, 0.1)',
                              border: `1px solid ${entrega.calificacion !== undefined && entrega.calificacion !== null ? '#3b82f6' : '#10b981'}`,
                              borderRadius: '0.5em',
                              color: entrega.calificacion !== undefined && entrega.calificacion !== null ? '#3b82f6' : '#10b981',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              transition: 'all 0.2s ease'
                            }}
                            title={entrega.calificacion !== undefined && entrega.calificacion !== null ? "Editar calificación" : "Calificar tarea"}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.transform = 'scale(1.1)';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.transform = 'scale(1)';
                            }}
                          >
                            {entrega.calificacion !== undefined && entrega.calificacion !== null ? (
                              <CheckCircle size={18} />
                            ) : (
                              <Award size={18} />
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  // Modal de calificación
  const modalCalificar = showCalificarModal && entregaSeleccionada && (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        animation: 'fadeIn 0.2s ease-out',
        background: 'rgba(0, 0, 0, 0.65)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000000,
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)'
      }}
      onClick={() => setShowCalificarModal(false)}
    >
      <div
        style={{
          background: darkMode
            ? 'rgba(15, 23, 42, 0.95)'
            : 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          borderRadius: '0.75em',
          width: '90%',
          maxWidth: '30rem',
          padding: '1.5em',
          border: `1px solid ${darkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`,
          boxShadow: darkMode
            ? '0 1rem 3rem rgba(0, 0, 0, 0.5)'
            : '0 1rem 3rem rgba(0, 0, 0, 0.15)',
          animation: 'scaleIn 0.2s ease-out'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '1.5em'
        }}>
          <h3 style={{
            color: theme.textPrimary,
            fontSize: '1.25rem',
            fontWeight: '700',
            margin: 0
          }}>
            {entregaSeleccionada.calificacion !== undefined && entregaSeleccionada.calificacion !== null
              ? 'Editar Calificación'
              : 'Calificar Tarea'}
          </h3>
          <button
            onClick={() => setShowCalificarModal(false)}
            style={{
              background: 'transparent',
              border: 'none',
              color: theme.textSecondary,
              cursor: 'pointer',
              padding: '0.25em',
              borderRadius: '0.25em',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <X size={20} />
          </button>
        </div>

        <div style={{ marginBottom: '1.5em' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.75em',
            marginBottom: '1em'
          }}>
            <div style={{
              width: '2.5rem',
              height: '2.5rem',
              borderRadius: '50%',
              background: darkMode ? 'rgba(59, 130, 246, 0.2)' : 'rgba(59, 130, 246, 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#3b82f6'
            }}>
              <User size={20} />
            </div>
            <div>
              <div style={{
                color: theme.textPrimary,
                fontWeight: '600'
              }}>
                {entregaSeleccionada.estudiante_nombre} {entregaSeleccionada.estudiante_apellido}
              </div>
              <div style={{
                color: theme.textSecondary,
                fontSize: '0.875rem'
              }}>
                CI: {entregaSeleccionada.estudiante_identificacion || entregaSeleccionada.id_estudiante} •
                Entregado: {new Date(entregaSeleccionada.fecha_entrega).toLocaleDateString('es-ES')}
              </div>
            </div>
          </div>

          <div style={{
            background: darkMode ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
            border: `1px solid ${theme.inputBorder}`,
            borderRadius: '0.5em',
            padding: '1em',
            marginBottom: '1em'
          }}>
            <div style={{
              color: theme.textSecondary,
              fontSize: '0.875rem',
              marginBottom: '0.5em'
            }}>
              Archivo entregado:
            </div>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5em',
              color: theme.textPrimary,
              fontWeight: '500'
            }}>
              <FileText size={16} color={darkMode ? '#94a3b8' : '#64748b'} />
              {entregaSeleccionada.archivo_nombre}
            </div>
          </div>

          <div style={{ marginBottom: '1em' }}>
            <label style={{
              display: 'block',
              color: theme.textPrimary,
              fontWeight: '600',
              marginBottom: '0.5em'
            }}>
              Nota (0 - {nota_maxima})
            </label>
            <input
              type="number"
              min="0"
              max={nota_maxima}
              step="0.1"
              value={notaInput}
              onChange={(e) => {
                const value = e.target.value;
                // Permitir campo vacío o valores válidos
                if (value === '' || (parseFloat(value) >= 0 && parseFloat(value) <= nota_maxima)) {
                  setNotaInput(value);
                } else if (parseFloat(value) > nota_maxima) {
                  // Si excede, establecer el máximo
                  setNotaInput(nota_maxima.toString());
                  showToast.error(`La nota máxima es ${nota_maxima}`, darkMode);
                }
              }}
              onBlur={(e) => {
                // Al perder el foco, validar y ajustar si es necesario
                const value = parseFloat(e.target.value);
                if (!isNaN(value)) {
                  if (value > nota_maxima) {
                    setNotaInput(nota_maxima.toString());
                  } else if (value < 0) {
                    setNotaInput('0');
                  }
                }
              }}
              style={{
                width: '100%',
                padding: '0.75em',
                background: theme.inputBg,
                border: `1px solid ${theme.inputBorder}`,
                borderRadius: '0.5em',
                color: theme.textPrimary,
                fontSize: '0.875rem'
              }}
            />

            {/* Mostrar cálculo del aporte ponderado */}
            {notaInput && parseFloat(notaInput) >= 0 && (
              <div style={{
                marginTop: '0.75em',
                padding: '0.75em',
                background: darkMode
                  ? 'linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(37, 99, 235, 0.1) 100%)'
                  : 'linear-gradient(135deg, rgba(59, 130, 246, 0.05) 0%, rgba(37, 99, 235, 0.05) 100%)',
                border: `1px solid ${darkMode ? 'rgba(59, 130, 246, 0.3)' : 'rgba(59, 130, 246, 0.2)'}`,
                borderRadius: '0.5em'
              }}>
                <div style={{
                  color: '#3b82f6',
                  fontSize: '0.75rem',
                  fontWeight: '600',
                  marginBottom: '0.25em',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.375rem'
                }}>
                  <BarChart3 size={14} />
                  Aporte Ponderado
                </div>
                <div style={{
                  color: theme.textPrimary,
                  fontSize: '1.125rem',
                  fontWeight: '700',
                  fontFamily: 'Montserrat, sans-serif'
                }}>
                  {parseFloat(notaInput)}/{nota_maxima} × {ponderacion}pts = {' '}
                  <span style={{ color: '#3b82f6' }}>
                    {((parseFloat(notaInput) / nota_maxima) * ponderacion).toFixed(2)} puntos
                  </span>
                </div>
                <div style={{
                  color: theme.textSecondary,
                  fontSize: '0.75rem',
                  marginTop: '0.25em'
                }}>
                  Este es el aporte de esta tarea al promedio del módulo
                </div>
              </div>
            )}
          </div>

          <div>
            <label style={{
              display: 'block',
              color: theme.textPrimary,
              fontWeight: '600',
              marginBottom: '0.5em'
            }}>
              Comentario (opcional)
            </label>
            <textarea
              value={comentarioInput}
              onChange={(e) => setComentarioInput(e.target.value)}
              placeholder="Escribe un comentario sobre la entrega..."
              style={{
                width: '100%',
                minHeight: '6rem',
                padding: '0.75em',
                background: theme.inputBg,
                border: `1px solid ${theme.inputBorder}`,
                borderRadius: '0.5em',
                color: theme.textPrimary,
                fontSize: '0.875rem',
                resize: 'vertical'
              }}
            />
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.75em', justifyContent: 'flex-end' }}>
          <button
            onClick={() => setShowCalificarModal(false)}
            style={{
              padding: '0.625em 1.25em',
              background: 'transparent',
              border: `1px solid ${theme.inputBorder}`,
              borderRadius: '0.5em',
              color: theme.textPrimary,
              cursor: 'pointer',
              fontWeight: '600'
            }}
          >
            Cancelar
          </button>
          <button
            onClick={() => handleCalificar(entregaSeleccionada.id_entrega)}
            disabled={!!calificando}
            style={{
              padding: '0.625em 1.25em',
              background: calificando
                ? darkMode ? 'rgba(59, 130, 246, 0.5)' : 'rgba(59, 130, 246, 0.3)'
                : 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
              border: 'none',
              borderRadius: '0.5em',
              color: '#fff',
              cursor: calificando ? 'not-allowed' : 'pointer',
              fontWeight: '600',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5em'
            }}
          >
            {calificando ? (
              <>
                <div style={{
                  width: '1rem',
                  height: '1rem',
                  border: '2px solid rgba(255,255,255,0.3)',
                  borderTop: '2px solid #fff',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite'
                }} />
                Calificando...
              </>
            ) : (
              <>
                <Award size={16} />
                {entregaSeleccionada.calificacion !== undefined && entregaSeleccionada.calificacion !== null
                  ? 'Actualizar'
                  : 'Calificar'}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );

  console.log('Creando portal en document.body');
  console.log('document.body existe:', !!document.body);

  // Crear un div específico para el modal si no existe
  let modalRoot = document.getElementById('modal-root');
  if (!modalRoot) {
    modalRoot = document.createElement('div');
    modalRoot.id = 'modal-root';
    modalRoot.style.position = 'fixed';
    modalRoot.style.top = '0';
    modalRoot.style.left = '0';
    modalRoot.style.width = '100%';
    modalRoot.style.height = '100%';
    modalRoot.style.zIndex = '999999';
    modalRoot.style.pointerEvents = 'none';
    document.body.appendChild(modalRoot);
  }

  // Habilitar pointer events solo para el contenido del modal
  const modalWithPointerEvents = (
    <>
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes fadeIn {
          0% { opacity: 0; }
          100% { opacity: 1; }
        }
        @keyframes scaleIn {
          0% { 
            opacity: 0;
            transform: scale(0.9) translateY(-10px);
          }
          100% { 
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }
      `}</style>
      <div style={{ pointerEvents: 'auto' }}>
        {modalContent}
        {modalCalificar}

        {/* Modal de Previsualización de Archivo */}
        {archivoPreview && createPortal(
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.85)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999999,
            padding: isPreviewFullscreen ? '0' : '2em',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            animation: 'fadeIn 0.2s ease-out'
          }}>
            <div style={{
              background: darkMode
                ? 'rgba(15, 23, 42, 0.95)'
                : 'rgba(255, 255, 255, 0.95)',
              backdropFilter: 'blur(16px)',
              WebkitBackdropFilter: 'blur(16px)',
              borderRadius: isPreviewFullscreen ? '0' : '0.75rem',
              padding: isPreviewFullscreen ? '1rem' : '1.5rem',
              maxWidth: isPreviewFullscreen ? '100%' : '50rem', // Más ancho por defecto
              width: isPreviewFullscreen ? '100%' : '90%',
              height: isPreviewFullscreen ? '100vh' : 'auto',
              maxHeight: isPreviewFullscreen ? '100vh' : '90vh',
              display: 'flex',
              flexDirection: 'column',
              overflowY: 'hidden', // Evitar scroll en el contenedor principal
              border: isPreviewFullscreen ? 'none' : `1px solid ${darkMode ? 'rgba(59, 130, 246, 0.2)' : 'rgba(59, 130, 246, 0.1)'}`,
              boxShadow: darkMode
                ? '0 10px 30px rgba(0, 0, 0, 0.4)'
                : '0 10px 30px rgba(0, 0, 0, 0.1)',
              animation: 'scaleIn 0.2s ease-out',
              transition: 'all 0.3s ease'
            }}>
              {/* Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexShrink: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <div style={{
                    width: '2rem',
                    height: '2rem',
                    background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
                    borderRadius: '0.5rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <FileText size={16} color="#fff" />
                  </div>
                  <div>
                    <h3 style={{ color: theme.textPrimary, fontSize: '1rem', fontWeight: '700', margin: 0 }}>
                      Vista Previa del Archivo
                    </h3>
                    <p style={{ color: theme.textSecondary, fontSize: '0.75rem', margin: 0 }}>
                      {archivoPreview.entrega.estudiante_apellido} {archivoPreview.entrega.estudiante_nombre}
                    </p>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  {/* Botón Pantalla Completa */}
                  <button
                    onClick={() => setIsPreviewFullscreen(!isPreviewFullscreen)}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: theme.textSecondary,
                      cursor: 'pointer',
                      padding: '0.5rem',
                      borderRadius: '0.5rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: 'all 0.2s ease'
                    }}
                    title={isPreviewFullscreen ? "Salir de pantalla completa" : "Pantalla completa"}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'transparent';
                    }}
                  >
                    {isPreviewFullscreen ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
                  </button>

                  <button
                    onClick={() => {
                      window.URL.revokeObjectURL(archivoPreview.url);
                      setArchivoPreview(null);
                      setIsPreviewFullscreen(false); // Reset al cerrar
                    }}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: theme.textSecondary,
                      cursor: 'pointer',
                      padding: '0.5rem',
                      borderRadius: '0.5rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: 'all 0.2s ease'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'transparent';
                    }}
                  >
                    <X size={18} />
                  </button>
                </div>
              </div>

              {/* Información del archivo (Ocultar en pantalla completa para dar más espacio) */}
              {!isPreviewFullscreen && (
                <div style={{
                  background: darkMode ? 'rgba(59, 130, 246, 0.1)' : 'rgba(59, 130, 246, 0.05)',
                  border: '1px solid rgba(59, 130, 246, 0.2)',
                  borderRadius: '0.5rem',
                  padding: '0.75rem',
                  marginBottom: '1rem',
                  flexShrink: 0
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <FileText size={18} color="#3b82f6" />
                    <div>
                      <p style={{ color: theme.textPrimary, fontSize: '0.875rem', fontWeight: '600', margin: 0 }}>
                        {archivoPreview.entrega.archivo_nombre}
                      </p>
                      <p style={{ color: theme.textMuted, fontSize: '0.75rem', margin: 0 }}>
                        {new Date(archivoPreview.entrega.fecha_entrega).toLocaleDateString('es-ES')} {new Date(archivoPreview.entrega.fecha_entrega).toLocaleTimeString('es-EC', { hour: '2-digit', minute: '2-digit', hour12: false })}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Vista previa */}
              <div style={{
                background: darkMode ? 'rgba(0,0,0,0.2)' : 'rgba(0,0,0,0.03)',
                borderRadius: '0.5rem',
                padding: '0.75rem',
                marginBottom: '1rem',
                flexGrow: 1, // Ocupar espacio restante
                minHeight: isPreviewFullscreen ? '0' : '25rem', // Altura min base
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden'
              }}>
                {archivoPreview.tipo.startsWith('image/') ? (
                  // Vista previa de imagen
                  <img
                    src={archivoPreview.url}
                    alt="Preview"
                    style={{
                      maxWidth: '100%',
                      maxHeight: '100%', // Ajustar al contenedor
                      borderRadius: '0.375rem',
                      objectFit: 'contain'
                    }}
                  />
                ) : archivoPreview.tipo === 'application/pdf' ? (
                  // Vista previa de PDF
                  <iframe
                    src={archivoPreview.url}
                    style={{
                      width: '100%',
                      height: '100%',
                      border: 'none',
                      borderRadius: '0.5em'
                    }}
                    title="PDF Preview"
                  />
                ) : (
                  // Icono para otros tipos de archivo
                  <div style={{ textAlign: 'center' }}>
                    <FileText size={80} color={theme.textMuted} />
                    <p style={{ color: theme.textMuted, marginTop: '1em' }}>
                      No se puede previsualizar este tipo de archivo
                    </p>
                  </div>
                )}
              </div>

              {/* Botones */}
              <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                <button
                  onClick={() => {
                    window.URL.revokeObjectURL(archivoPreview.url);
                    setArchivoPreview(null);
                  }}
                  style={{
                    background: 'transparent',
                    border: `1px solid ${theme.border}`,
                    borderRadius: '0.5rem',
                    padding: '0.5rem 1rem',
                    color: theme.textSecondary,
                    fontWeight: '600',
                    cursor: 'pointer',
                    fontSize: '0.875rem',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = darkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'transparent';
                  }}
                >
                  Cerrar
                </button>
                <button
                  onClick={() => {
                    // Cerrar la vista previa y abrir el modal de calificación
                    const entrega = archivoPreview.entrega;
                    setArchivoPreview(null);
                    abrirModalCalificar(entrega);
                  }}
                  style={{
                    background: archivoPreview.entrega.calificacion !== undefined && archivoPreview.entrega.calificacion !== null
                      ? darkMode
                        ? 'linear-gradient(135deg, rgba(59, 130, 246, 0.2) 0%, rgba(37, 99, 235, 0.2) 100%)'
                        : 'linear-gradient(135deg, rgba(59, 130, 246, 0.15) 0%, rgba(37, 99, 235, 0.15) 100%)'
                      : 'linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)',
                    border: archivoPreview.entrega.calificacion !== undefined && archivoPreview.entrega.calificacion !== null
                      ? `1px solid ${darkMode ? 'rgba(59, 130, 246, 0.4)' : 'rgba(59, 130, 246, 0.3)'}`
                      : 'none',
                    borderRadius: '0.5rem',
                    padding: '0.5rem 1rem',
                    color: archivoPreview.entrega.calificacion !== undefined && archivoPreview.entrega.calificacion !== null
                      ? '#3b82f6'
                      : '#fff',
                    fontWeight: '600',
                    cursor: 'pointer',
                    fontSize: '0.875rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    boxShadow: archivoPreview.entrega.calificacion !== undefined && archivoPreview.entrega.calificacion !== null
                      ? '0 2px 4px rgba(59, 130, 246, 0.2)'
                      : '0 2px 4px rgba(6, 182, 212, 0.25)',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-1px)';
                    if (archivoPreview.entrega.calificacion !== undefined && archivoPreview.entrega.calificacion !== null) {
                      e.currentTarget.style.boxShadow = '0 4px 8px rgba(59, 130, 246, 0.3)';
                    } else {
                      e.currentTarget.style.boxShadow = '0 4px 8px rgba(6, 182, 212, 0.3)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    if (archivoPreview.entrega.calificacion !== undefined && archivoPreview.entrega.calificacion !== null) {
                      e.currentTarget.style.boxShadow = '0 2px 4px rgba(59, 130, 246, 0.2)';
                    } else {
                      e.currentTarget.style.boxShadow = '0 2px 4px rgba(6, 182, 212, 0.25)';
                    }
                  }}
                >
                  <Award size={16} />
                  {archivoPreview.entrega.calificacion !== undefined && archivoPreview.entrega.calificacion !== null
                    ? 'Editar Calificación'
                    : 'Calificar'}
                </button>
                <button
                  onClick={handleDescargarDesdePreview}
                  style={{
                    background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                    border: 'none',
                    borderRadius: '0.5rem',
                    padding: '0.5rem 1rem',
                    color: '#fff',
                    fontWeight: '600',
                    cursor: 'pointer',
                    fontSize: '0.875rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    boxShadow: '0 2px 4px rgba(59, 130, 246, 0.25)',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-1px)';
                    e.currentTarget.style.boxShadow = '0 4px 8px rgba(59, 130, 246, 0.3)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 2px 4px rgba(59, 130, 246, 0.25)';
                  }}
                >
                  <Download size={16} />
                  Descargar
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
      </div>
    </>
  );

  return (
    <>
      {createPortal(modalWithPointerEvents, modalRoot)}
    </>
  );
};

export default ModalEntregas;