import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Save, FileText, AlertTriangle } from 'lucide-react';
import axios from 'axios';
import { showToast } from '../../config/toastConfig';

const API_BASE = (import.meta as any).env?.VITE_API_URL || 'http://localhost:3000';

interface Modulo {
  id_modulo: number;
  nombre: string;
  descripcion: string;
  fecha_inicio: string | null;
  fecha_fin: string | null;
  estado: string;
  categorias?: { id?: string | number; nombre: string; ponderacion: number | string }[];
}

interface ModuloFormData {
  nombre: string;
  descripcion: string;
  fecha_inicio: string;
  fecha_fin: string;
  estado: string;
  categorias: { id?: string; nombre: string; ponderacion: number | string }[];
}

interface ModalModuloProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  id_curso: string | number;
  moduloEditar?: Modulo | null;
  modulosExistentes?: string[];
  darkMode?: boolean;
}

const ModalModulo: React.FC<ModalModuloProps> = ({
  isOpen,
  onClose,
  onSuccess,
  id_curso,
  moduloEditar,
  modulosExistentes = [],
  darkMode = false,
}) => {
  const [formData, setFormData] = useState<ModuloFormData>({
    nombre: "",
    descripcion: "",
    fecha_inicio: "",
    fecha_fin: "",
    estado: "activo",
    categorias: [
      { id: crypto.randomUUID(), nombre: "", ponderacion: "" }
    ]
  });
  const [loading, setLoading] = useState(false);
  const [errorNombreDuplicado, setErrorNombreDuplicado] = useState(false);

  useEffect(() => {
    const loadModuleData = async () => {
      if (moduloEditar) {
        try {
          const token = sessionStorage.getItem('auth_token');
          const response = await axios.get(`${API_BASE}/api/modulos/${moduloEditar.id_modulo}`, {
            headers: { Authorization: `Bearer ${token}` }
          });

          const modulo = response.data.modulo;

          setFormData({
            nombre: modulo.nombre || '',
            descripcion: modulo.descripcion || '',
            fecha_inicio: modulo.fecha_inicio ? modulo.fecha_inicio.split('T')[0] : '',
            fecha_fin: modulo.fecha_fin ? modulo.fecha_fin.split('T')[0] : '',
            estado: modulo.estado || 'activo',
            categorias: modulo.categorias && modulo.categorias.length > 0
              ? modulo.categorias.map((cat: any) => ({
                ...cat,
                id: (cat.id && !String(cat.id).includes('-')) ? Number(cat.id) : cat.id
              }))
              : [{ id: crypto.randomUUID(), nombre: '', ponderacion: '' }]
          });
        } catch (error) {
          console.error('Error loading module data:', error);
          showToast.error('Error cargando datos del módulo', darkMode);
        }
      } else {
        setFormData({
          nombre: '',
          descripcion: '',
          fecha_inicio: '',
          fecha_fin: '',
          estado: 'activo',
          categorias: [
            { id: crypto.randomUUID(), nombre: '', ponderacion: '' }
          ]
        });
      }
      setErrorNombreDuplicado(false);
    };

    if (isOpen) {
      loadModuleData();
    }
  }, [moduloEditar, isOpen, darkMode]);

  // Validar duplicados en tiempo real
  useEffect(() => {
    if (formData.nombre.trim()) {
      const nombreNormalizado = formData.nombre.trim().toLowerCase();
      // Verificamos si existe en la lista de modulosExistentes
      // Si estamos editando, permitimos que el nombre sea igual al nombre actual del módulo
      const esDuplicado = modulosExistentes.some(m =>
        m.toLowerCase() === nombreNormalizado &&
        (!moduloEditar || m.toLowerCase() !== moduloEditar.nombre.toLowerCase())
      );
      setErrorNombreDuplicado(esDuplicado);
    } else {
      setErrorNombreDuplicado(false);
    }
  }, [formData.nombre, modulosExistentes, moduloEditar]);


  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    // Convertir a mayúsculas solo el nombre del módulo
    const finalValue = name === 'nombre' ? value.toUpperCase() : value;
    setFormData({
      ...formData,
      [name]: finalValue
    });
  };

  const handleCategoriaChange = (index: number, field: string, value: string) => {
    const newCategorias = [...formData.categorias];
    // Convertir a mayúsculas el nombre de la categoría
    const finalValue = field === 'nombre' ? value.toUpperCase() : (field === 'ponderacion' ? (value === '' ? '' : parseFloat(value)) : value);
    (newCategorias[index] as any)[field] = finalValue;
    setFormData({ ...formData, categorias: newCategorias });
  };

  const addCategoria = () => {
    if (totalPonderacion >= 10) {
      showToast.error('Las categorías ya suman 10 puntos. Por favor, disminuye puntos en otra categoría si deseas crear otra categoría', darkMode);
      return;
    }
    setFormData({
      ...formData,
      categorias: [...formData.categorias, { id: crypto.randomUUID(), nombre: '', ponderacion: '' }]
    });
  };

  const removeCategoria = (index: number) => {
    const newCategorias = formData.categorias.filter((_, i) => i !== index);
    setFormData({ ...formData, categorias: newCategorias });
  };

  const totalPonderacion = formData.categorias.reduce((sum, cat) => sum + (Number(cat.ponderacion) || 0), 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.nombre.trim()) {
      showToast.error('El nombre del módulo es obligatorio', darkMode);
      return;
    }

    if (errorNombreDuplicado) {
      showToast.error('Ya existe un módulo con este nombre en el curso', darkMode);
      return;
    }

    if (Math.abs(totalPonderacion - 10) > 0.1) {
      showToast.error(`La suma de ponderaciones debe ser 10. Actual: ${totalPonderacion}`, darkMode);
      return;
    }

    try {
      setLoading(true);
      const token = sessionStorage.getItem('auth_token');

      const dataToSend = {
        ...formData,
        id_curso: typeof id_curso === 'string' ? parseInt(id_curso) : id_curso
      };

      if (moduloEditar) {
        await axios.put(`${API_BASE}/api/modulos/${moduloEditar.id_modulo}`, dataToSend, {
          headers: { Authorization: `Bearer ${token}` }
        });
        showToast.success('Módulo actualizado exitosamente', darkMode);
      } else {
        await axios.post(`${API_BASE}/api/modulos`, dataToSend, {
          headers: { Authorization: `Bearer ${token}` }
        });
        showToast.success('Módulo creado exitosamente', darkMode);
      }

      onSuccess();
      onClose();
    } catch (error: any) {
      console.error('Error saving modulo:', error);
      showToast.error(error.response?.data?.error || 'Error al guardar módulo', darkMode);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

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
                {moduloEditar ? 'Editar Módulo' : 'Nuevo Módulo'}
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
            {/* Nombre */}
            <div>
              <label style={labelStyle}>Nombre del Módulo *</label>
              <input
                type="text"
                name="nombre"
                value={formData.nombre}
                onChange={handleChange}
                placeholder="Ej: Parcial 1, Unidad Básica, Módulo Introductorio"
                required
                style={{
                  ...inputStyle,
                  border: `1px solid ${errorNombreDuplicado ? '#ef4444' : 'var(--docente-border, rgba(255,255,255,0.1))'}`
                }}
                onFocus={(e) =>
                  !errorNombreDuplicado && (e.target.style.borderColor = "#3b82f6")
                }
                onBlur={(e) =>
                  !errorNombreDuplicado && (e.target.style.borderColor = 'var(--docente-border, rgba(255,255,255,0.1))')
                }
              />
              {errorNombreDuplicado && (
                <span style={{ color: '#ef4444', fontSize: '0.85rem', marginTop: '0.25rem', display: 'block' }}>
                  ⚠️ Ya existe un módulo con este nombre en el curso.
                </span>
              )}
            </div>

            {/* Descripción */}
            <div>
              <label style={labelStyle}>Descripción (opcional)</label>
              <textarea
                name="descripcion"
                value={formData.descripcion}
                onChange={handleChange}
                placeholder="Describe brevemente el contenido de este módulo..."
                style={{
                  ...inputStyle,
                  minHeight: '70px',
                  resize: 'vertical' as const
                }}
                onFocus={(e) => e.currentTarget.style.borderColor = '#3b82f6'}
                onBlur={(e) => e.currentTarget.style.borderColor = 'var(--docente-border, rgba(255,255,255,0.1))'}
              />
            </div>

            {/* Fechas */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <label style={labelStyle}>Fecha Inicio (opcional)</label>
                <input
                  type="date"
                  name="fecha_inicio"
                  value={formData.fecha_inicio}
                  onChange={handleChange}
                  style={inputStyle}
                  onFocus={(e) => e.currentTarget.style.borderColor = '#3b82f6'}
                  onBlur={(e) => e.currentTarget.style.borderColor = darkMode ? 'rgba(255,255,255,0.1)' : '#e5e7eb'}
                />
              </div>

              <div>
                <label style={labelStyle}>Fecha Fin (opcional)</label>
                <input
                  type="date"
                  name="fecha_fin"
                  value={formData.fecha_fin}
                  onChange={handleChange}
                  style={inputStyle}
                  onFocus={(e) => e.currentTarget.style.borderColor = '#3b82f6'}
                  onBlur={(e) => e.currentTarget.style.borderColor = darkMode ? 'rgba(255,255,255,0.1)' : '#e5e7eb'}
                />
              </div>
            </div>

            {/* Categorías de Evaluación */}
            <div style={{ marginTop: '0.5rem' }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                marginBottom: '8px'
              }}>
                <label style={{ ...labelStyle, marginBottom: 0 }}>Categorías de Evaluación</label>
                <div style={{
                  fontSize: '0.75rem',
                  color: Math.abs(totalPonderacion - 10) < 0.1 ? '#10b981' : '#f59e0b',
                  background: Math.abs(totalPonderacion - 10) < 0.1 ? 'rgba(16, 185, 129, 0.1)' : 'rgba(245, 158, 11, 0.1)',
                  padding: '2px 8px',
                  borderRadius: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}>
                  <AlertTriangle size={12} />
                  <span>Suma obligatoria: 10 pts</span>
                </div>
              </div>

              <div style={{ display: 'grid', gap: '8px' }}>
                {formData.categorias.map((cat, index) => (
                  <div key={index} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr auto', gap: '8px', alignItems: 'center' }}>
                    <input
                      type="text"
                      placeholder="Nombre Categoría"
                      value={cat.nombre}
                      onChange={(e) => handleCategoriaChange(index, 'nombre', e.target.value)}
                      required
                      style={inputStyle}
                    />
                    <input
                      type="number"
                      placeholder="Puntos"
                      value={cat.ponderacion}
                      onChange={(e) => handleCategoriaChange(index, 'ponderacion', e.target.value)}
                      required
                      step="0.01"
                      min="0"
                      max="10"
                      style={inputStyle}
                    />
                    <button
                      type="button"
                      onClick={() => removeCategoria(index)}
                      style={{
                        background: 'rgba(239, 68, 68, 0.1)',
                        border: '1px solid rgba(239, 68, 68, 0.2)',
                        color: '#ef4444',
                        borderRadius: '0.5em',
                        padding: '0.625em',
                        cursor: 'pointer'
                      }}
                    >
                      <X size={16} />
                    </button>
                  </div>
                ))}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px' }}>
                  <button
                    type="button"
                    onClick={addCategoria}
                    style={{
                      background: 'none',
                      border: '1px dashed var(--docente-border, rgba(255,255,255,0.2))',
                      color: '#3b82f6',
                      borderRadius: '0.5em',
                      padding: '0.5em',
                      cursor: 'pointer',
                      fontSize: '0.85rem'
                    }}
                  >
                    + Agregar Categoría
                  </button>
                  <span style={{
                    fontWeight: 'bold',
                    color: Math.abs(totalPonderacion - 10) < 0.1 ? '#10b981' : '#ef4444'
                  }}>
                    Total: {totalPonderacion.toFixed(2)} / 10
                  </span>
                </div>
              </div>
            </div>

            {/* Botones */}
            <div style={{ display: 'flex', gap: '0.5em', justifyContent: 'flex-end', marginTop: '0.5em' }}>
              <button
                type="button"
                onClick={onClose}
                style={{
                  background: 'var(--docente-input-bg, rgba(255,255,255,0.05))',
                  border: '1px solid var(--docente-border, rgba(255,255,255,0.1))',
                  borderRadius: '0.5em',
                  padding: '0.5em 0.75em',
                  color: 'var(--docente-text-primary, #fff)',
                  fontWeight: '600',
                  cursor: 'pointer',
                  fontSize: '0.85rem',
                  transition: 'all 0.2s ease'
                }}
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading || Math.abs(totalPonderacion - 10) > 0.1 || errorNombreDuplicado}
                style={{
                  background: (loading || Math.abs(totalPonderacion - 10) > 0.1 || errorNombreDuplicado)
                    ? 'rgba(59, 130, 246, 0.6)'
                    : 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                  border: 'none',
                  borderRadius: '0.5em',
                  padding: '0.5em 0.75em',
                  color: '#fff',
                  fontWeight: '800',
                  cursor: (loading || Math.abs(totalPonderacion - 10) > 0.1 || errorNombreDuplicado) ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5em',
                  boxShadow: (loading || Math.abs(totalPonderacion - 10) > 0.1) ? 'none' : '0 0.1875rem 0.625rem rgba(59, 130, 246, 0.25)',
                  fontSize: '0.85rem',
                  transition: 'all 0.2s ease',
                  opacity: (Math.abs(totalPonderacion - 10) > 0.1) ? 0.7 : 1
                }}
                onMouseEnter={(e) => {
                  if (!loading) {
                    e.currentTarget.style.transform = 'translateY(-0.0625rem)';
                    e.currentTarget.style.boxShadow = '0 0.3125rem 0.875rem rgba(59, 130, 246, 0.3)';
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 0.1875rem 0.625rem rgba(59, 130, 246, 0.25)';
                }}
              >
                {loading ? (
                  <>
                    <div style={{
                      width: '1rem',
                      height: '1rem',
                      border: '0.125rem solid rgba(255,255,255,0.3)',
                      borderTop: '0.125rem solid #fff',
                      borderRadius: '50%',
                      animation: 'spin 1s linear infinite'
                    }} />
                    Guardando...
                  </>
                ) : (
                  <>
                    <Save size={16} />
                    {moduloEditar ? 'Actualizar' : 'Crear Módulo'}
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

export default ModalModulo;
