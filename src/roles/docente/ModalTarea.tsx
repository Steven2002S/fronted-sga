import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Save, FileText, AlertTriangle, CheckCircle } from 'lucide-react';
import axios from 'axios';
import { showToast } from '../../config/toastConfig';

const API_BASE = (import.meta as any).env?.VITE_API_URL || 'http://localhost:3000';

interface ModalTareaProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  id_modulo: number;
  tareaEditar?: any;
  darkMode?: boolean;
}

interface FormData {
  titulo: string;
  descripcion: string;
  instrucciones: string;
  nota_maxima: string;
  nota_minima_aprobacion: string;
  ponderacion: string;
  fecha_limite: string;
  permite_archivo: boolean;
  tamano_maximo_mb: string;
  formatos_permitidos: string;
  estado: string;
  id_categoria: string;
}

const ModalTarea: React.FC<ModalTareaProps> = ({
  isOpen,
  onClose,
  onSuccess,
  id_modulo,
  tareaEditar,
  darkMode = true
}) => {
  const [formData, setFormData] = useState<FormData>({
    titulo: '',
    descripcion: '',
    instrucciones: '',
    nota_maxima: '10',
    nota_minima_aprobacion: '7',
    ponderacion: '1',
    fecha_limite: '',
    permite_archivo: true,
    tamano_maximo_mb: '5',
    formatos_permitidos: 'pdf,jpg,jpeg,png,webp',
    estado: 'activo',
    id_categoria: ''
  });
  const [loading, setLoading] = useState(false);
  const [sumaPonderaciones, setSumaPonderaciones] = useState(0);
  const [categorias, setCategorias] = useState<any[]>([]);
  const [tareasModulo, setTareasModulo] = useState<any[]>([]);

  // Recalcular suma cuando cambian tareas o categorías
  useEffect(() => {
    // 1. Suma de tareas individuales (que no tienen categoría)
    const sumaTareas = tareasModulo
      .filter((t: any) => (tareaEditar ? t.id_tarea !== tareaEditar.id_tarea : true) && !t.id_categoria)
      .reduce((acc: number, t: any) => acc + (parseFloat(t.ponderacion) || 0), 0);

    // 2. Suma de categorías (cada categoría cuenta una vez)
    const sumaCategorias = categorias.reduce((acc: number, c: any) => acc + (parseFloat(c.ponderacion) || 0), 0);

    setSumaPonderaciones(sumaTareas + sumaCategorias);
  }, [tareasModulo, categorias, tareaEditar]);

  // Cargar tareas del módulo para validar ponderaciones
  useEffect(() => {
    if (isOpen && id_modulo) {
      fetchTareasModulo();
      fetchCategoriasModulo();
    }
  }, [isOpen, id_modulo]);

  const fetchCategoriasModulo = async () => {
    try {
      const token = sessionStorage.getItem('auth_token');
      const response = await axios.get(`${API_BASE}/api/modulos/${id_modulo}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.success && response.data.modulo.categorias) {
        setCategorias(response.data.modulo.categorias);
      }
    } catch (error) {
      console.error('Error cargando categorías:', error);
    }
  };

  const fetchTareasModulo = async () => {
    try {
      const token = sessionStorage.getItem('auth_token');
      const response = await axios.get(`${API_BASE}/api/tareas/modulo/${id_modulo}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const tareas = response.data.tareas || [];
      setTareasModulo(tareas);
    } catch (error) {
      console.error('Error cargando tareas:', error);
    }
  };

  useEffect(() => {
    if (tareaEditar) {
      // Al editar, si la fecha existe, mantener la fecha pero poner hora 23:59 por defecto
      let fechaLimite = '';
      if (tareaEditar.fecha_limite) {
        const fecha = new Date(tareaEditar.fecha_limite);
        const year = fecha.getFullYear();
        const month = String(fecha.getMonth() + 1).padStart(2, '0');
        const day = String(fecha.getDate()).padStart(2, '0');
        // Siempre poner 23:59 como hora por defecto al editar
        fechaLimite = `${year}-${month}-${day}T23:59`;
      }

      setFormData({
        titulo: tareaEditar.titulo || '',
        descripcion: tareaEditar.descripcion || '',
        instrucciones: tareaEditar.instrucciones || '',
        nota_maxima: tareaEditar.nota_maxima?.toString() || '10',
        nota_minima_aprobacion: tareaEditar.nota_minima_aprobacion?.toString() || '7',
        ponderacion: tareaEditar.ponderacion?.toString() || '1',
        fecha_limite: fechaLimite,
        permite_archivo: tareaEditar.permite_archivo !== false,
        tamano_maximo_mb: tareaEditar.tamano_maximo_mb?.toString() || '5',
        formatos_permitidos: tareaEditar.formatos_permitidos || 'pdf,jpg,jpeg,png,webp',
        estado: tareaEditar.estado || 'activo',
        id_categoria: tareaEditar.id_categoria?.toString() || ''
      });
    } else {
      // Fecha por defecto: hoy a las 23:59 (Ecuador UTC-5)
      const hoy = new Date();
      // Convertir a hora local de Ecuador
      const year = hoy.getFullYear();
      const month = String(hoy.getMonth() + 1).padStart(2, '0');
      const day = String(hoy.getDate()).padStart(2, '0');
      const fechaDefault = `${year}-${month}-${day}T23:59`; // formato: YYYY-MM-DDTHH:mm

      setFormData({
        titulo: '',
        descripcion: '',
        instrucciones: '',
        nota_maxima: '10',
        nota_minima_aprobacion: '7',
        ponderacion: '1',
        fecha_limite: fechaDefault,
        permite_archivo: true,
        tamano_maximo_mb: '5',
        formatos_permitidos: 'pdf,jpg,jpeg,png,webp',
        estado: 'activo',
        id_categoria: ''
      });
    }
  }, [tareaEditar, isOpen]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;

    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData({
        ...formData,
        [name]: checked
      });
    } else {
      setFormData({
        ...formData,
        [name]: value
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.titulo.trim()) {
      showToast.error('El título de la tarea es obligatorio', darkMode);
      return;
    }

    if (!formData.fecha_limite) {
      showToast.error('La fecha límite es obligatoria', darkMode);
      return;
    }

    if (parseFloat(formData.nota_maxima) > 10) {
      showToast.error('La nota máxima no puede ser mayor a 10', darkMode);
      return;
    }

    // Si el módulo tiene categorías definidas, la categoría es OBLIGATORIA
    if (categorias.length > 0 && !formData.id_categoria) {
      showToast.error('Debes seleccionar una categoría. Este módulo tiene categorías de evaluación definidas.', darkMode);
      return;
    }

    // Validar suma de ponderaciones (Solo si NO hay categoría seleccionada)
    // Si hay categoría, la ponderación de la tarea es interna a la categoría y no suma al total del módulo directamente
    if (!formData.id_categoria) {
      const ponderacionActual = parseFloat(formData.ponderacion);
      const sumaTotal = sumaPonderaciones + ponderacionActual;

      if (sumaTotal > 10) {
        showToast.error(`La suma de ponderaciones (${sumaTotal.toFixed(2)}) excede el máximo de 10 puntos del módulo`, darkMode);
        return;
      }
    }

    // Validar que la fecha límite sea futura
    const fechaLimite = new Date(formData.fecha_limite);
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    if (fechaLimite < hoy && !tareaEditar) {
      showToast.error('La fecha límite debe ser futura', darkMode);
      return;
    }

    try {
      setLoading(true);
      const token = sessionStorage.getItem('auth_token');

      const dataToSend = {
        ...formData,
        id_modulo,
        nota_maxima: parseFloat(formData.nota_maxima),
        nota_minima_aprobacion: parseFloat(formData.nota_minima_aprobacion),
        ponderacion: formData.id_categoria ? 0 : parseFloat(formData.ponderacion),
        tamano_maximo_mb: 5,
        id_categoria: formData.id_categoria ? parseInt(formData.id_categoria) : null
      };

      if (tareaEditar) {
        await axios.put(`${API_BASE}/api/tareas/${tareaEditar.id_tarea}`, dataToSend, {
          headers: { Authorization: `Bearer ${token}` }
        });
        showToast.success('Tarea actualizada exitosamente', darkMode);
      } else {
        await axios.post(`${API_BASE}/api/tareas`, dataToSend, {
          headers: { Authorization: `Bearer ${token}` }
        });
        showToast.success('Tarea creada exitosamente', darkMode);
      }

      onSuccess();
      onClose();
    } catch (error: any) {
      console.error('Error saving tarea:', error);
      showToast.error(error.response?.data?.error || 'Error al guardar tarea', darkMode);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  // Estilos base adaptativos
  const inputStyle = {
    width: '100%',
    padding: '0.625em 0.75em',
    background: 'var(--docente-input-bg, rgba(255,255,255,0.05))',
    border: '1px solid var(--docente-border, rgba(255,255,255,0.1))',
    borderRadius: '0.5em',
    color: 'var(--docente-text-primary, #fff)',
    fontSize: '0.875rem',
    outline: 'none',
    transition: 'all 0.2s ease'
  };

  const labelStyle = {
    color: 'var(--docente-text-primary, rgba(255,255,255,0.9))',
    display: 'block',
    marginBottom: '0.375em',
    fontWeight: '600' as const,
    fontSize: '0.875rem'
  };

  return createPortal(
    <>
      {/* Overlay */}
      <div
        onClick={onClose}
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
        `}</style>

        {/* Modal */}
        <div
          className="responsive-modal"
          style={{
            background: darkMode
              ? 'rgba(15, 23, 42, 0.95)'
              : 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            borderRadius: '12px',
            boxShadow: darkMode
              ? '0 20px 60px -12px rgba(0, 0, 0, 0.5)'
              : '0 20px 60px -12px rgba(0, 0, 0, 0.15)',
            border: `1px solid ${darkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`,
            padding: '1.5rem',
            maxWidth: '55rem',
            width: '90%',
            maxHeight: 'calc(100vh - 4rem)',
            overflowY: 'auto',
            zIndex: 99999,
            animation: 'scaleIn 0.3s ease-out'
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '10px',
            paddingBottom: '8px',
            borderBottom: '1px solid var(--docente-border, rgba(59, 130, 246, 0.2))'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <FileText size={20} style={{ color: '#3b82f6' }} />
              <h3 style={{
                margin: 0,
                fontSize: '1.05rem',
                fontWeight: '600',
                letterSpacing: '-0.01em',
                color: 'var(--docente-text-primary, #fff)'
              }}>
                {tareaEditar ? 'Editar Tarea' : 'Nueva Tarea'}
              </h3>
            </div>
            <button
              onClick={onClose}
              style={{
                background: 'var(--docente-input-bg, rgba(255,255,255,0.05))',
                border: '1px solid var(--docente-border, rgba(255,255,255,0.1))',
                borderRadius: '8px',
                padding: '6px',
                color: 'var(--docente-text-primary, #fff)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(59, 130, 246, 0.2)';
                e.currentTarget.style.borderColor = 'rgba(59, 130, 246, 0.4)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)';
              }}
            >
              <X size={16} />
            </button>
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '0.75rem' }}>
            {/* Título - Ancho completo */}
            <div>
              <label style={labelStyle}>Título de la Tarea *</label>
              <input
                type="text"
                name="titulo"
                value={formData.titulo}
                onChange={handleChange}
                placeholder="Ej: Práctica de Maquillaje Social"
                required
                style={inputStyle}
                onFocus={(e) => e.currentTarget.style.borderColor = '#3b82f6'}
                onBlur={(e) => e.currentTarget.style.borderColor = darkMode ? 'rgba(255,255,255,0.1)' : '#e5e7eb'}
              />

            </div>

            {/* Categoría - Siempre visible */}
            <div>
              <label style={labelStyle}>Categoría *</label>
              <select
                name="id_categoria"
                value={formData.id_categoria}
                onChange={handleChange}
                style={inputStyle}
                required
              >
                <option value="">
                  {categorias.length > 0
                    ? 'Seleccione una categoría *'
                    : 'No hay categorías. Crea categorías en el módulo primero.'}
                </option>
                {categorias.map((cat: any) => (
                  <option key={cat.id_categoria} value={cat.id_categoria}>
                    {cat.nombre} ({cat.ponderacion} pts)
                  </option>
                ))}
              </select>
              {categorias.length === 0 && (
                <p style={{
                  color: '#f59e0b',
                  fontSize: '0.75rem',
                  marginTop: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}>
                  <AlertTriangle size={12} />
                  Debes crear categorías en el módulo antes de crear tareas.
                </p>
              )}
            </div>

            {/* Fila: Descripción e Instrucciones en 2 columnas */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              {/* Descripción */}
              <div>
                <label style={labelStyle}>Descripción Breve (opcional)</label>
                <textarea
                  name="descripcion"
                  value={formData.descripcion}
                  onChange={handleChange}
                  placeholder="Describe brevemente la tarea..."
                  style={{
                    ...inputStyle,
                    minHeight: '70px',
                    resize: 'vertical' as const
                  }}
                  onFocus={(e) => e.currentTarget.style.borderColor = '#3b82f6'}
                  onBlur={(e) => e.currentTarget.style.borderColor = darkMode ? 'rgba(255,255,255,0.1)' : '#e5e7eb'}
                />
              </div>

              {/* Instrucciones */}
              <div>
                <label style={labelStyle}>Instrucciones Detalladas (opcional)</label>
                <textarea
                  name="instrucciones"
                  value={formData.instrucciones}
                  onChange={handleChange}
                  placeholder="Instrucciones paso a paso para completar la tarea..."
                  style={{
                    ...inputStyle,
                    minHeight: '70px',
                    resize: 'vertical' as const
                  }}
                  onFocus={(e) => e.currentTarget.style.borderColor = '#3b82f6'}
                  onBlur={(e) => e.currentTarget.style.borderColor = darkMode ? 'rgba(255,255,255,0.1)' : '#e5e7eb'}
                />
              </div>
            </div>

            {/* Calificación y Ponderación */}
            <div style={{ display: 'grid', gridTemplateColumns: categorias.length > 0 ? '1fr 1fr' : '1fr 1fr 1fr', gap: '10px' }}>
              <div>
                <label style={labelStyle}>
                  Nota Máxima *
                </label>
                <input
                  type="number"
                  name="nota_maxima"
                  value={formData.nota_maxima}
                  onChange={handleChange}
                  min="1"
                  max="10"
                  step="0.01"
                  required
                  style={inputStyle}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = '#3b82f6';
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = darkMode ? 'rgba(255,255,255,0.1)' : '#e5e7eb';
                  }}
                />
                <p style={{ color: darkMode ? 'rgba(255,255,255,0.5)' : 'rgba(107,114,128,0.8)', fontSize: '0.7rem', marginTop: '4px' }}>
                  Sobre 10 puntos
                </p>
              </div>

              <div>
                <label style={labelStyle}>
                  Nota Mínima *
                </label>
                <input
                  type="number"
                  name="nota_minima_aprobacion"
                  value={formData.nota_minima_aprobacion}
                  onChange={handleChange}
                  min="1"
                  max="10"
                  step="0.01"
                  required
                  style={inputStyle}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = '#3b82f6';
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = darkMode ? 'rgba(255,255,255,0.1)' : '#e5e7eb';
                  }}
                />
                <p style={{ color: darkMode ? 'rgba(255,255,255,0.5)' : 'rgba(107,114,128,0.8)', fontSize: '0.7rem', marginTop: '4px' }}>
                  Para aprobar
                </p>
              </div>

              {/* Solo mostrar Ponderación si NO hay categorías en el módulo */}
              {categorias.length === 0 && (
                <div>
                  <label style={labelStyle}>
                    Ponderación *
                  </label>
                  <input
                    type="number"
                    name="ponderacion"
                    value={formData.ponderacion}
                    onChange={handleChange}
                    min="0.01"
                    max="10"
                    step="0.01"
                    required
                    style={inputStyle}
                    onFocus={(e) => {
                      e.currentTarget.style.borderColor = '#3b82f6';
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.borderColor = darkMode ? 'rgba(255,255,255,0.1)' : '#e5e7eb';
                    }}
                  />
                  <p style={{ color: darkMode ? 'rgba(255,255,255,0.5)' : 'rgba(107,114,128,0.8)', fontSize: '0.7rem', marginTop: '4px' }}>
                    Peso en puntos
                  </p>
                </div>
              )}
            </div>

            {/* Advertencia de suma de ponderaciones (Solo visible si NO hay categorías en el módulo) */}
            {categorias.length === 0 && formData.ponderacion && parseFloat(formData.ponderacion) > 0 && (
              <div style={{
                padding: '0.625em 0.75em',
                background: (sumaPonderaciones + parseFloat(formData.ponderacion)) > 10
                  ? darkMode ? 'rgba(239, 68, 68, 0.1)' : 'rgba(239, 68, 68, 0.05)'
                  : darkMode ? 'rgba(59, 130, 246, 0.1)' : 'rgba(59, 130, 246, 0.05)',
                borderRadius: '0.5em'
              }}>
                <div style={{
                  color: (sumaPonderaciones + parseFloat(formData.ponderacion)) > 10 ? '#ef4444' : '#3b82f6',
                  fontSize: '0.75rem',
                  fontWeight: '600',
                  marginBottom: '0.25em',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}>
                  {(sumaPonderaciones + parseFloat(formData.ponderacion)) > 10 ? (
                    <>
                      <AlertTriangle size={12} />
                      Advertencia
                    </>
                  ) : (
                    <>
                      <CheckCircle size={12} />
                      Suma de ponderaciones
                    </>
                  )}
                </div>
                <div style={{
                  color: darkMode ? '#fff' : '#1e293b',
                  fontSize: '0.875rem',
                  fontWeight: '600'
                }}>
                  Tareas existentes: {sumaPonderaciones.toFixed(2)} pts + Esta tarea: {parseFloat(formData.ponderacion).toFixed(2)} pts = {' '}
                  <span style={{
                    color: (sumaPonderaciones + parseFloat(formData.ponderacion)) > 10 ? '#ef4444' : '#10b981',
                    fontWeight: '700'
                  }}>
                    {(sumaPonderaciones + parseFloat(formData.ponderacion)).toFixed(2)}/10 pts
                  </span>
                </div>
                {(sumaPonderaciones + parseFloat(formData.ponderacion)) > 10 && (
                  <div style={{
                    color: '#ef4444',
                    fontSize: '0.75rem',
                    marginTop: '0.25em'
                  }}>
                    {sumaPonderaciones >= 10
                      ? '¡Las categorías de evaluación ya suman 10 puntos! Por favor, elige una categoría para esta tarea.'
                      : '¡La suma excede el máximo de 10 puntos! Reduce la ponderación.'}
                  </div>
                )}
              </div>
            )}

            {/* Mensaje informativo si hay categoría seleccionada */}
            {formData.id_categoria && (() => {
              const catSeleccionada = categorias.find(c => c.id_categoria.toString() === formData.id_categoria);
              return catSeleccionada ? (
                <div style={{
                  padding: '0.625em 0.75em',
                  background: darkMode ? 'rgba(16, 185, 129, 0.1)' : 'rgba(16, 185, 129, 0.05)',
                  borderRadius: '0.5em',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <CheckCircle size={16} color="#10b981" />
                  <div style={{ fontSize: '0.85rem', color: darkMode ? '#fff' : '#333' }}>
                    Esta tarea pertenece a la categoría <strong>{catSeleccionada.nombre}</strong> (Valor Total: {catSeleccionada.ponderacion} pts).
                    <div style={{ fontSize: '0.75rem', opacity: 0.8, marginTop: '2px' }}>
                      La nota de esta tarea se promediará autom&aacute;ticamente dentro de su categoría.
                    </div>
                  </div>
                </div>
              ) : null;
            })()}

            {/* Fila: Fecha y Configuración de Archivos en 2 columnas */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              {/* Fecha y Hora Límite */}
              <div>
                <label style={labelStyle}>Fecha y Hora Límite de Entrega *</label>
                <input
                  type="datetime-local"
                  name="fecha_limite"
                  value={formData.fecha_limite}
                  onChange={handleChange}
                  required
                  style={inputStyle}
                  onFocus={(e) => e.currentTarget.style.borderColor = '#3b82f6'}
                  onBlur={(e) => e.currentTarget.style.borderColor = darkMode ? 'rgba(255,255,255,0.1)' : '#e5e7eb'}
                />
              </div>

              {/* Configuración de Archivos */}
              <div>
                <div style={{
                  ...inputStyle,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.5rem',
                  padding: '0.625em 0.75em',
                  marginTop: '1.9em' // Espacio para alinear con el input de fecha (label + margin)
                }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      name="permite_archivo"
                      checked={formData.permite_archivo}
                      onChange={handleChange}
                      style={{ width: '14px', height: '14px', cursor: 'pointer' }}
                    />
                    <span style={{ fontSize: '0.875rem' }}>Permitir entrega de archivos</span>
                  </label>


                </div>
              </div>
            </div>

            {/* Botones */}
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '8px' }}>
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                style={{
                  background: darkMode ? 'rgba(255,255,255,0.05)' : '#fff',
                  border: darkMode ? '1px solid rgba(255,255,255,0.1)' : '1px solid #e5e7eb',
                  borderRadius: '8px',
                  padding: '8px 12px',
                  color: darkMode ? 'rgba(255,255,255,0.8)' : '#64748b',
                  fontWeight: '700',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  opacity: loading ? 0.5 : 1,
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  if (!loading) {
                    e.currentTarget.style.borderColor = darkMode ? 'rgba(255,255,255,0.2)' : '#cbd5e1';
                    e.currentTarget.style.background = darkMode ? 'rgba(255,255,255,0.08)' : '#f8fafc';
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = darkMode ? 'rgba(255,255,255,0.1)' : '#e5e7eb';
                  e.currentTarget.style.background = darkMode ? 'rgba(255,255,255,0.05)' : '#fff';
                }}
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading}
                style={{
                  background: loading
                    ? 'rgba(59, 130, 246, 0.6)'
                    : 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '8px 12px',
                  color: '#fff',
                  fontWeight: '800',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  boxShadow: loading ? 'none' : '0 3px 10px rgba(59, 130, 246, 0.25)',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  if (!loading) {
                    e.currentTarget.style.transform = 'translateY(-1px)';
                    e.currentTarget.style.boxShadow = '0 5px 14px rgba(59, 130, 246, 0.3)';
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 3px 10px rgba(59, 130, 246, 0.25)';
                }}
              >
                {loading ? (
                  <>
                    <div style={{
                      width: '16px',
                      height: '16px',
                      border: '2px solid rgba(255,255,255,0.3)',
                      borderTop: '2px solid #fff',
                      borderRadius: '50%',
                      animation: 'spin 1s linear infinite'
                    }} />
                    Guardando...
                  </>
                ) : (
                  <>
                    <Save size={16} />
                    {tareaEditar ? 'Actualizar' : 'Crear Tarea'}
                  </>
                )}
              </button>
            </div>
          </form>

          <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
        </div>
      </div>
    </>,
    document.body
  );
};

export default ModalTarea;
