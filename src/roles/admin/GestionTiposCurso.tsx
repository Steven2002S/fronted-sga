import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import {
  Plus, Edit, Trash2, X, Save, Search, Grid, List, ChevronLeft, ChevronRight,
  FileText, Calendar, DollarSign, CreditCard, Hash, CheckCircle, BookOpen, AlertTriangle
} from 'lucide-react';
import { showToast } from '../../config/toastConfig';
import { StyledSelect } from '../../components/StyledSelect';
import GlassEffect from '../../components/GlassEffect';
import AdminSectionHeader from '../../components/AdminSectionHeader';
import { mapToRedScheme, RedColorPalette } from '../../utils/colorMapper';
import { useBreakpoints } from '../../hooks/useMediaQuery';
import '../../styles/responsive.css';
import '../../utils/modalScrollHelper';

type TipoCurso = {
  id_tipo_curso: number;
  nombre: string;
  descripcion?: string | null;
  duracion_meses?: number | null;
  precio_base?: number | null;
  modalidad_pago?: 'mensual' | 'clases';
  numero_clases?: number | null;
  precio_por_clase?: number | null;
  matricula_incluye_primera_clase?: boolean;
  estado?: 'activo' | 'inactivo';
};

const API_BASE = (import.meta as any).env?.VITE_API_URL || 'http://localhost:3000';

const GestionTiposCurso: React.FC = () => {
  const { isMobile, isSmallScreen } = useBreakpoints();
  const [tipos, setTipos] = useState<TipoCurso[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState<'create' | 'edit'>('create');
  const [selected, setSelected] = useState<TipoCurso | null>(null);
  const [tipoToDelete, setTipoToDelete] = useState<TipoCurso | null>(null);

  // Detectar modo oscuro desde localStorage (mismo que usa PanelAdministrativos)
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('admin-dark-mode');
    return saved !== null ? JSON.parse(saved) : true;
  });

  // Escuchar cambios en el modo oscuro
  useEffect(() => {
    const handleStorageChange = () => {
      const saved = localStorage.getItem('admin-dark-mode');
      setDarkMode(saved !== null ? JSON.parse(saved) : true);
    };

    window.addEventListener('storage', handleStorageChange);
    // También escuchar cambios locales
    const interval = setInterval(() => {
      const saved = localStorage.getItem('admin-dark-mode');
      const newMode = saved !== null ? JSON.parse(saved) : true;
      if (newMode !== darkMode) {
        setDarkMode(newMode);
      }
    }, 100);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(interval);
    };
  }, [darkMode]);

  const theme = useMemo(() => ({
    cardBg: darkMode
      ? 'var(--admin-bg-secondary, linear-gradient(135deg, rgba(0,0,0,0.9) 0%, rgba(26,26,26,0.9) 100%))'
      : 'linear-gradient(135deg, rgba(255,255,255,0.96) 0%, rgba(255,245,245,0.92) 100%)',
    cardBorder: darkMode ? 'var(--admin-border, rgba(239, 68, 68, 0.2))' : 'rgba(239, 68, 68, 0.25)',
    textPrimary: darkMode ? '#fff' : '#1f2937',
    textSecondary: darkMode ? 'rgba(255,255,255,0.7)' : '#384152',
    textMuted: darkMode ? 'rgba(255,255,255,0.6)' : '#6b7280',
    pillBg: darkMode ? 'rgba(255,255,255,0.05)' : 'rgba(239,68,68,0.12)',
    pillText: darkMode ? 'rgba(255,255,255,0.6)' : '#b91c1c',
    infoText: darkMode ? 'rgba(255,255,255,0.7)' : '#4b5563',
    inputBg: darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(248,113,113,0.08)',
    inputBorder: darkMode ? 'rgba(255,255,255,0.2)' : 'rgba(248,113,113,0.35)',
    inputIcon: darkMode ? 'rgba(255,255,255,0.6)' : '#9ca3af',
    toggleContainerBg: darkMode ? 'rgba(255,255,255,0.06)' : '#eef2f7',
    toggleContainerBorder: 'none',
    toggleInactive: darkMode ? 'rgba(255,255,255,0.65)' : '#94a3b8',
    toggleActiveBg: darkMode ? 'rgba(239,68,68,0.18)' : '#ffffff',
    toggleActiveBorder: 'none',
    toggleActiveShadow: 'none',
    toggleInactiveBg: 'transparent',
    toggleInactiveBorder: 'none',
    tableHeaderBg: darkMode ? 'rgba(248, 113, 113, 0.15)' : 'rgba(248, 113, 113, 0.08)',
    tableHeaderText: darkMode ? '#fff' : '#1f2937',
    tableRowAlt: darkMode ? 'rgba(255,255,255,0.02)' : 'rgba(248,113,113,0.08)',
    tableRowHover: darkMode ? 'rgba(248,113,113,0.08)' : 'rgba(248,113,113,0.18)',
    tableText: darkMode ? 'rgba(255,255,255,0.9)' : '#1f2937',
    tableMuted: darkMode ? 'rgba(255,255,255,0.8)' : '#4b5563',
    emptyStateBg: darkMode
      ? 'var(--admin-bg-secondary, linear-gradient(135deg, rgba(0,0,0,0.9) 0%, rgba(26,26,26,0.9) 100%))'
      : 'linear-gradient(135deg, rgba(255,255,255,0.96) 0%, rgba(254,242,242,0.92) 100%)',
    emptyStateText: darkMode ? 'rgba(255,255,255,0.6)' : '#6b7280',
    paginationBg: darkMode ? 'rgba(255,255,255,0.08)' : 'rgba(248,113,113,0.12)',
    paginationBorder: darkMode ? 'rgba(239, 68, 68, 0.2)' : 'rgba(239, 68, 68, 0.25)',
    modalBg: darkMode
      ? 'linear-gradient(135deg, rgba(0,0,0,0.9) 0%, rgba(26,26,46,0.9) 100%)'
      : 'linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(248,250,252,0.95) 100%)',
    modalText: darkMode ? '#fff' : '#1e293b',
    modalInputBg: darkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)',
    modalInputBorder: darkMode ? '1px solid rgba(255,255,255,0.12)' : '1px solid rgba(0,0,0,0.12)',
    divider: 'rgba(239, 68, 68, 0.2)',
    priceText: darkMode ? mapToRedScheme('#10b981') : '#047857',
    statusActiveBg: darkMode ? mapToRedScheme('rgba(16,185,129,0.15)') : 'rgba(16,185,129,0.12)',
    statusActiveText: darkMode ? mapToRedScheme('#10b981') : '#047857',
    statusInactiveBg: darkMode ? 'rgba(239,68,68,0.15)' : 'rgba(239,68,68,0.12)',
    statusInactiveText: darkMode ? RedColorPalette.primary : '#b91c1c',
  }), [darkMode]);

  // Estados para búsqueda, vista y paginación
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 4;

  // Helper: formato de precio consistente
  const formatPrice = (v?: number | null) => {
    if (v === null || v === undefined || isNaN(Number(v))) return '-';
    return new Intl.NumberFormat('es-EC', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(Number(v));
  };

  // Filtrado y paginación
  const filteredTipos = useMemo(() => {
    if (!searchTerm.trim()) return tipos;
    const term = searchTerm.toLowerCase();
    return tipos.filter(t =>
      t.nombre.toLowerCase().includes(term) ||
      (t.descripcion && t.descripcion.toLowerCase().includes(term))
    );
  }, [tipos, searchTerm]);

  const totalPages = Math.ceil(filteredTipos.length / itemsPerPage);
  const paginatedTipos = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredTipos.slice(start, start + itemsPerPage);
  }, [filteredTipos, currentPage, itemsPerPage]);

  // Reset página al buscar
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  const fetchTipos = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`${API_BASE}/api/tipos-cursos?limit=200`);
      if (!res.ok) throw new Error('No se pudo cargar tipos de curso');
      const data = await res.json();
      const list = Array.isArray(data)
        ? data
        : Array.isArray((data as any)?.data)
          ? (data as any).data
          : Array.isArray((data as any)?.rows)
            ? (data as any).rows
            : [];
      setTipos(list);
    } catch (e: any) {
      const message = e.message || 'Error cargando tipos de curso';
      setError(message);
      showToast.error(message, darkMode);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTipos();
  }, []);

  const openCreate = () => {
    setSelected(null);
    setModalType('create');
    setShowModal(true);
  };
  const openEdit = (t: TipoCurso) => {
    setSelected(t);
    setModalType('edit');
    setShowModal(true);
  };

  const requestDelete = (tipo: TipoCurso) => {
    setTipoToDelete(tipo);
  };

  const handleConfirmDelete = async () => {
    if (!tipoToDelete) return;
    const { id_tipo_curso: id, nombre } = tipoToDelete;
    const deletedName = nombre;
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`${API_BASE}/api/tipos-cursos/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('No se pudo eliminar el tipo de curso');
      // Actualizar lista local inmediatamente sin recargar
      setTipos((prev) => prev.filter((t) => t.id_tipo_curso !== id));
      showToast.deleted(
        deletedName
          ? `Tipo de curso "${deletedName}" eliminado`
          : 'Tipo de curso eliminado',
        darkMode
      );
      setTipoToDelete(null);
    } catch (e: any) {
      const message = e.message || 'Error eliminando tipo de curso';
      setError(message);
      showToast.error(message, darkMode);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const payload = {
      nombre: String(fd.get('nombre') || '').trim(),
      descripcion: String(fd.get('descripcion') || ''),
      duracion_meses: fd.get('duracion_meses') ? Number(fd.get('duracion_meses')) : null,
      precio_base: fd.get('precio_base') ? Number(fd.get('precio_base')) : null,
      modalidad_pago: String(fd.get('modalidad_pago') || 'mensual'),
      numero_clases: fd.get('numero_clases') ? Number(fd.get('numero_clases')) : null,
      precio_por_clase: fd.get('precio_por_clase') ? Number(fd.get('precio_por_clase')) : null,
      matricula_incluye_primera_clase: true, // Siempre true por defecto
      estado: String(fd.get('estado') || 'activo'),
    } as Record<string, any>;

    if (!payload.nombre) {
      const message = 'El nombre es obligatorio';
      setError(message);
      showToast.error(message, darkMode);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      if (modalType === 'create') {
        const res = await fetch(`${API_BASE}/api/tipos-cursos`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error('No se pudo crear el tipo de curso');
        const newTipo = await res.json();
        // Agregar el nuevo tipo a la lista inmediatamente
        setTipos(prev => [newTipo, ...prev]);
        showToast.success('Tipo de curso creado correctamente', darkMode);
      } else if (modalType === 'edit' && selected) {
        const res = await fetch(`${API_BASE}/api/tipos-cursos/${selected.id_tipo_curso}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error('No se pudo actualizar el tipo de curso');
        const updatedTipo = await res.json();
        // Actualizar el tipo en la lista inmediatamente
        setTipos(prev => prev.map(t =>
          t.id_tipo_curso === selected.id_tipo_curso
            ? { ...t, ...updatedTipo }
            : t
        ));
        showToast.success('Tipo de curso actualizado correctamente', darkMode);
      }
      setShowModal(false);
    } catch (e: any) {
      const message = e.message || 'Error guardando tipo de curso';
      setError(message);
      showToast.error(message, darkMode);
    } finally {
      setLoading(false);
    }
  };

  const placeholderColor = darkMode ? 'rgba(255,255,255,0.6)' : '#9ca3af';
  const textareaPlaceholderColor = darkMode ? 'rgba(255,255,255,0.55)' : '#94a3b8';
  const editActionColor = darkMode ? '#3b82f6' : '#1d4ed8';
  const deleteActionColor = darkMode ? RedColorPalette.primaryDeep : '#b91c1c';
  const cardsTabColor = viewMode === 'cards' ? RedColorPalette.primary : theme.toggleInactive;
  const tableTabColor = viewMode === 'table' ? RedColorPalette.primary : theme.toggleInactive;

  return (
    <div className="gestion-tipos-curso" data-dark={darkMode ? 'true' : 'false'}>
      <style>{`
        .gestion-tipos-curso[data-dark="true"] input::placeholder,
        .gestion-tipos-curso[data-dark="true"] textarea::placeholder {
          color: ${placeholderColor};
        }
        .gestion-tipos-curso[data-dark="false"] input::placeholder {
          color: ${placeholderColor};
        }
        .gestion-tipos-curso[data-dark="false"] textarea::placeholder {
          color: ${textareaPlaceholderColor};
        }
      `}</style>
      {/* Header */}
      <AdminSectionHeader
        title="Gestión de Tipos de Curso"
        subtitle="Administra los tipos de curso antes de crear cursos."
        marginBottom={isMobile ? '12px' : '1.125rem'}
      />

      {/* Controles */}
      <GlassEffect
        variant="card"
        tint="neutral"
        intensity="light"
        style={{
          marginBottom: isMobile ? '12px' : '1rem',
          background: theme.cardBg,
          border: `1px solid ${theme.cardBorder}`,
          color: theme.textPrimary,
        }}
      >
        <div className="responsive-filters">
          <div style={{ display: 'flex', flexDirection: isSmallScreen ? 'column' : 'row', gap: '0.75rem', alignItems: isSmallScreen ? 'stretch' : 'center', flex: 1, width: isSmallScreen ? '100%' : 'auto' }}>
            {/* Búsqueda */}
            <div style={{ position: 'relative', minWidth: isSmallScreen ? 'auto' : '17.5rem', width: isSmallScreen ? '100%' : 'auto' }}>
              <Search
                size={16}
                style={{
                  position: 'absolute',
                  left: '0.75rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: theme.inputIcon,
                }}
              />
              <input
                type="text"
                placeholder="Buscar por nombre o descripción..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 0.625rem 0.625rem 2.375rem',
                  background: theme.inputBg,
                  border: `1px solid ${theme.inputBorder}`,
                  borderRadius: '0.625rem',
                  color: theme.textPrimary,
                  fontSize: '0.8rem'
                }}
              />
            </div>

            {/* Toggle Vista */}
            <div
              style={{
                display: 'flex',
                gap: '0.375rem',
                background: theme.toggleContainerBg,
                borderRadius: '0.875rem',
                padding: '0.1875rem',
                width: isSmallScreen ? '100%' : 'auto',
                border: theme.toggleContainerBorder,
                boxShadow: 'none',
              }}
            >
              <button
                onClick={() => setViewMode('cards')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.3125rem',
                  padding: isMobile ? '7px 0.875rem' : '7px 1rem',
                  background: viewMode === 'cards' ? theme.toggleActiveBg : theme.toggleInactiveBg,
                  border: viewMode === 'cards' ? theme.toggleActiveBorder : theme.toggleInactiveBorder,
                  borderRadius: '0.6875rem',
                  color: cardsTabColor,
                  cursor: 'pointer',
                  fontSize: isMobile ? '0.75rem' : '0.9rem',
                  fontWeight: 600,
                  transition: 'all 0.2s ease',
                  flex: isSmallScreen ? 1 : 'initial',
                  boxShadow: viewMode === 'cards' ? theme.toggleActiveShadow : 'none'
                }}
              >
                <Grid size={16} color={cardsTabColor} /> {!isMobile && 'Tarjetas'}
              </button>
              <button
                onClick={() => setViewMode('table')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.375rem',
                  padding: isMobile ? '7px 0.875rem' : '8px 1.0625rem',
                  background: viewMode === 'table' ? theme.toggleActiveBg : theme.toggleInactiveBg,
                  border: viewMode === 'table' ? theme.toggleActiveBorder : theme.toggleInactiveBorder,
                  borderRadius: '0.6875rem',
                  color: tableTabColor,
                  cursor: 'pointer',
                  fontSize: isMobile ? '0.75rem' : '0.9rem',
                  fontWeight: 600,
                  transition: 'all 0.2s ease',
                  flex: isSmallScreen ? 1 : 'initial',
                  boxShadow: viewMode === 'table' ? theme.toggleActiveShadow : 'none'
                }}
              >
                <List size={16} color={tableTabColor} /> {!isMobile && 'Tabla'}
              </button>
            </div>
          </div>

          {/* Botón Crear */}
          <button
            onClick={openCreate}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              padding: isMobile ? '10px 1rem' : '12px 1.5rem',
              background: `linear-gradient(135deg, ${RedColorPalette.primary}, ${RedColorPalette.primaryDark})`,
              border: 'none',
              borderRadius: '0.625rem',
              color: '#fff',
              fontSize: '0.8rem',
              fontWeight: '600',
              cursor: 'pointer',
              boxShadow: '0 0.25rem 0.75rem rgba(239, 68, 68, 0.3)',
              width: isSmallScreen ? '100%' : 'auto'
            }}
          >
            <Plus size={16} />
            Nuevo Tipo
          </button>
        </div>

        {/* Info de resultados */}
        <div style={{ color: theme.infoText, fontSize: '0.75rem', marginTop: '0.75rem' }}>
          {searchTerm ? `${filteredTipos.length} de ${tipos.length} tipos` : `Total: ${tipos.length} tipos`}
        </div>
      </GlassEffect>

      {/* Vista Cards */}
      {viewMode === 'cards' && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: isMobile ? '12px' : '1rem',
          marginBottom: isMobile ? '12px' : '1.125rem'
        }}>
          {paginatedTipos.map((t) => (
            <div
              key={t.id_tipo_curso}
              style={{
                background: theme.cardBg,
                border: `1px solid ${theme.cardBorder}`,
                borderRadius: '0.75rem',
                padding: '0.875rem',
                transition: 'all 0.3s ease',
                cursor: 'pointer',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-4px)';
                e.currentTarget.style.boxShadow = darkMode
                  ? '0 0.5rem 1.5rem rgba(239, 68, 68, 0.24)'
                  : '0 12px 28px rgba(239, 68, 68, 0.12)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              <div style={{ marginBottom: '0.75rem' }}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'start',
                  marginBottom: '0.375rem'
                }}>
                  <span
                    style={{
                      color: theme.pillText,
                      fontSize: '0.7rem',
                      background: theme.pillBg,
                      padding: '3px 0.375rem',
                      borderRadius: '0.3125rem',
                      border: darkMode ? '1px solid transparent' : '1px solid rgba(239,68,68,0.25)',
                    }}
                  >
                    TC-{String(t.id_tipo_curso).padStart(3, '0')}
                  </span>
                  <span
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.1875rem',
                      padding: '3px 0.5rem',
                      borderRadius: 6,
                      background: t.estado === 'activo' ? theme.statusActiveBg : theme.statusInactiveBg,
                      color: t.estado === 'activo' ? theme.statusActiveText : theme.statusInactiveText,
                      border: t.estado === 'activo' ? '1px solid rgba(16,185,129,0.3)' : '1px solid rgba(239,68,68,0.3)',
                      fontWeight: 700,
                      fontSize: '0.65rem',
                      textTransform: 'uppercase'
                    }}
                  >
                    {t.estado || 'activo'}
                  </span>
                </div>
                <h3 style={{
                  color: theme.textPrimary,
                  margin: '0 0 0.5rem 0'
                }}>
                  {t.nombre}
                </h3>
              </div>

              <div
                style={{
                  paddingTop: '0.625rem',
                  borderTop: `1px solid ${darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(248,113,113,0.2)'}`,
                  marginBottom: '0.875rem',
                }}
              >
                <p style={{
                  color: theme.textSecondary,
                  fontSize: '0.7rem',
                  margin: 0,
                  lineHeight: 1.5,
                  minHeight: '2.1rem'
                }}>
                  {t.descripcion || 'Sin descripción'}
                </p>
              </div>

              <div style={{
                display: 'flex',
                gap: '0.75rem',
                marginBottom: '0.75rem'
              }}>
                <div style={{ flex: 1 }}>
                  <div style={{ color: theme.textMuted, fontSize: '0.65rem', marginBottom: '0.1875rem' }}>
                    Duración
                  </div>
                  <div style={{ color: darkMode ? 'rgba(255,255,255,0.95)' : theme.textPrimary, fontSize: '0.75rem', fontWeight: 600 }}>
                    {t.duracion_meses != null ? `${t.duracion_meses} meses` : '-'}
                  </div>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ color: theme.textMuted, fontSize: '0.65rem', marginBottom: '0.1875rem' }}>
                    Precio
                  </div>
                  <div style={{ color: theme.priceText, fontSize: '0.8rem', fontWeight: 700 }}>
                    {formatPrice(t.precio_base ?? null)}
                  </div>
                </div>
              </div>

              {/* Información de modalidad de pago */}
              {t.modalidad_pago === 'clases' && (
                <div style={{
                  marginBottom: '0.75rem',
                  padding: '0.5rem',
                  background: 'rgba(59, 130, 246, 0.08)',
                  border: '1px solid rgba(59, 130, 246, 0.2)',
                  borderRadius: '0.375rem'
                }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.375rem',
                    marginBottom: '0.25rem'
                  }}>
                    <div style={{
                      width: '0.3125rem',
                      height: '0.3125rem',
                      borderRadius: '50%',
                      background: '#3b82f6'
                    }} />
                    <span style={{
                      color: '#3b82f6',
                      fontSize: '0.65rem',
                      fontWeight: 600
                    }}>
                      Modalidad por Clases
                    </span>
                  </div>
                  <div style={{
                    display: 'flex',
                    gap: '0.75rem',
                    fontSize: '0.65rem',
                    color: theme.textSecondary
                  }}>
                    <span>
                      <strong>{t.numero_clases || 0}</strong> clases total
                    </span>
                    <span>
                      <strong>{formatPrice(t.precio_por_clase ?? null)}</strong> por clase
                    </span>
                  </div>
                </div>
              )}

              <div
                style={{
                  display: 'flex',
                  gap: '0.5rem',
                  borderTop: `1px solid ${darkMode ? 'rgba(255,255,255,0.08)' : 'rgba(248,113,113,0.2)'}`,
                  paddingTop: '0.75rem',
                  marginTop: '0.75rem',
                }}
              >
                <button
                  onClick={() => openEdit(t)}
                  style={{
                    flex: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.375rem',
                    padding: '6px 0.75rem',
                    background: darkMode ? 'rgba(59, 130, 246, 0.14)' : 'rgba(59,130,246,0.18)',
                    border: '1px solid rgba(59, 130, 246, 0.3)',
                    borderRadius: '0.5rem',
                    color: editActionColor,
                    fontSize: '0.7rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = darkMode ? 'rgba(59,130,246,0.24)' : 'rgba(59,130,246,0.26)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = darkMode ? 'rgba(59,130,246,0.14)' : 'rgba(59,130,246,0.18)';
                  }}
                >
                  <Edit size={12} color={editActionColor} /> Editar
                </button>
                <button
                  onClick={() => requestDelete(t)}
                  style={{
                    flex: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.375rem',
                    padding: '6px 0.75rem',
                    background: darkMode ? 'rgba(239, 68, 68, 0.12)' : 'rgba(239,68,68,0.18)',
                    border: '1px solid rgba(239, 68, 68, 0.3)',
                    borderRadius: '0.5rem',
                    color: deleteActionColor,
                    fontSize: '0.7rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = darkMode ? 'rgba(239,68,68,0.24)' : 'rgba(239,68,68,0.28)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = darkMode ? 'rgba(239,68,68,0.12)' : 'rgba(239,68,68,0.18)';
                  }}
                >
                  <Trash2 size={12} color={deleteActionColor} /> Eliminar
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Vista Tabla */}
      {viewMode === 'table' && (
        <>
          {/* Indicador de scroll en móvil */}
          {isSmallScreen && (
            <div style={{
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              borderRadius: '0.5rem',
              padding: '8px 0.75rem',
              marginBottom: '0.75rem',
              color: '#ef4444',
              fontSize: '0.75rem',
              textAlign: 'center',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.375rem'
            }}>
              <span>👉</span>
              <span>Desliza horizontalmente para ver toda la tabla</span>
              <span>👈</span>
            </div>
          )}

          <div
            className="responsive-table-container"
            style={{
              background: theme.cardBg,
              border: `1px solid ${theme.cardBorder}`,
              borderRadius: isMobile ? 12 : 16,
              overflow: 'auto',
              marginBottom: isMobile ? '12px' : '1.5rem',
              WebkitOverflowScrolling: 'touch',
              position: 'relative'
            }}
          >
            <table style={{
              width: '100%',
              borderCollapse: 'collapse',
              minWidth: isSmallScreen ? '700px' : 'auto'
            }}>
              <thead>
                <tr style={{
                  background: theme.tableHeaderBg,
                  borderBottom: '1px solid rgba(248, 113, 113, 0.3)'
                }}>
                  <th style={{ padding: '10px 0.75rem', color: theme.tableHeaderText, textAlign: 'left', fontWeight: 600, fontSize: '0.75rem', textTransform: 'uppercase', width: '35%' }}>
                    NOMBRE
                  </th>
                  <th style={{ padding: '10px 0.75rem', color: theme.tableHeaderText, textAlign: 'center', fontWeight: 600, fontSize: '0.75rem', textTransform: 'uppercase', width: '15%' }}>
                    Duración
                  </th>
                  <th style={{ padding: '10px 0.75rem', color: theme.tableHeaderText, textAlign: 'right', fontWeight: 600, fontSize: '0.75rem', textTransform: 'uppercase', width: '20%' }}>
                    Precio
                  </th>
                  <th style={{ padding: '10px 0.75rem', color: theme.tableHeaderText, textAlign: 'center', fontWeight: 600, fontSize: '0.75rem', textTransform: 'uppercase', width: '15%' }}>
                    Estado
                  </th>
                  <th style={{ padding: '10px 0.75rem', color: theme.tableHeaderText, textAlign: 'center', fontWeight: 600, fontSize: '0.75rem', textTransform: 'uppercase', width: '15%' }}>
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody>
                {paginatedTipos.map((t, index) => (
                  <tr
                    key={t.id_tipo_curso}
                    style={{
                      borderBottom: `1px solid ${darkMode ? 'rgba(255,255,255,0.05)' : 'rgba(248,113,113,0.15)'}`,
                      background: index % 2 === 0 ? theme.tableRowAlt : 'transparent',
                      transition: 'all 0.2s ease',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = theme.tableRowHover;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = index % 2 === 0 ? theme.tableRowAlt : 'transparent';
                    }}
                  >
                    <td className="table-nombre-uppercase" style={{ padding: '0.75rem', color: theme.tableText, fontWeight: 600, fontSize: '0.8rem' }}>
                      {t.nombre}
                    </td>
                    <td style={{ padding: '0.75rem', color: theme.tableMuted, textAlign: 'center', fontSize: '0.75rem' }}>
                      {t.duracion_meses != null ? `${t.duracion_meses} meses` : '-'}
                    </td>
                    <td style={{ padding: '0.75rem', color: theme.tableText, textAlign: 'right', fontWeight: 600, fontSize: '0.8rem' }}>
                      {formatPrice(t.precio_base ?? null)}
                    </td>
                    <td style={{ padding: '0.75rem', textAlign: 'center' }}>
                      <span
                        style={{
                          display: 'inline-block',
                          padding: '4px 0.625rem',
                          borderRadius: 8,
                          background: t.estado === 'activo' ? theme.statusActiveBg : theme.statusInactiveBg,
                          border: t.estado === 'activo'
                            ? `1px solid ${RedColorPalette.success}`
                            : '1px solid rgba(156,163,175,0.3)',
                          color: t.estado === 'activo' ? theme.statusActiveText : theme.statusInactiveText,
                          fontWeight: 700,
                          fontSize: '0.7rem',
                          textTransform: 'uppercase',
                        }}
                      >
                        {t.estado || 'activo'}
                      </span>
                    </td>
                    <td style={{ padding: '0.75rem' }}>
                      <div style={{ display: 'flex', gap: 6, justifyContent: 'center' }}>
                        <button
                          onClick={() => openEdit(t)}
                          style={{
                            background: darkMode ? 'rgba(59,130,246,0.12)' : 'rgba(59,130,246,0.16)',
                            border: '1px solid rgba(59,130,246,0.4)',
                            color: editActionColor,
                            padding: '6px 0.625rem',
                            borderRadius: 8,
                            cursor: 'pointer',
                            fontSize: '0.75rem',
                            fontWeight: '600',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.25rem',
                            transition: 'all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
                            transform: 'translateZ(0)',
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = darkMode ? 'rgba(59,130,246,0.22)' : 'rgba(59,130,246,0.24)';
                            e.currentTarget.style.transform = 'scale(1.05) translateY(-1px)';
                            e.currentTarget.style.boxShadow = `0 0.25rem 0.75rem ${darkMode ? 'rgba(59,130,246,0.35)' : 'rgba(59,130,246,0.25)'}`;
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = darkMode ? 'rgba(59,130,246,0.12)' : 'rgba(59,130,246,0.16)';
                            e.currentTarget.style.transform = 'scale(1) translateY(0)';
                            e.currentTarget.style.boxShadow = 'none';
                          }}
                        >
                          <Edit size={12} color={editActionColor} />
                          Editar
                        </button>
                        <button
                          onClick={() => requestDelete(t)}
                          style={{
                            background: darkMode ? 'rgba(239,68,68,0.14)' : 'rgba(239,68,68,0.22)',
                            border: `1px solid ${darkMode ? RedColorPalette.primaryDeep : 'rgba(239,68,68,0.4)'}`,
                            color: deleteActionColor,
                            padding: '6px 0.625rem',
                            borderRadius: 8,
                            cursor: 'pointer',
                            fontSize: '0.75rem',
                            fontWeight: '600',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.25rem',
                            transition: 'all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
                            transform: 'translateZ(0)',
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = darkMode ? 'rgba(239,68,68,0.24)' : 'rgba(239,68,68,0.32)';
                            e.currentTarget.style.transform = 'scale(1.05) translateY(-1px)';
                            e.currentTarget.style.boxShadow = `0 0.25rem 0.75rem ${darkMode ? RedColorPalette.primaryDeep : 'rgba(239,68,68,0.25)'}`;
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = darkMode ? 'rgba(239,68,68,0.14)' : 'rgba(239,68,68,0.22)';
                            e.currentTarget.style.transform = 'scale(1) translateY(0)';
                            e.currentTarget.style.boxShadow = 'none';
                          }}
                        >
                          <Trash2 size={12} color={deleteActionColor} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* Estados vacíos y errores */}
      {!loading && filteredTipos.length === 0 && (
        <div
          style={{
            color: theme.emptyStateText,
            padding: '60px 1.25rem',
            textAlign: 'center',
            fontSize: '1rem',
            background: theme.emptyStateBg,
            border: `1px solid ${theme.cardBorder}`,
            borderRadius: '1rem',
            marginBottom: '1.5rem',
          }}
        >
          {searchTerm ? 'No se encontraron tipos de curso' : 'No hay tipos de curso registrados'}
        </div>
      )}
      {loading && (
        <div
          style={{
            color: theme.emptyStateText,
            padding: '60px 1.25rem',
            textAlign: 'center',
            fontSize: '1rem',
            background: theme.emptyStateBg,
            border: `1px solid ${theme.cardBorder}`,
            borderRadius: '1rem',
            marginBottom: '1.5rem',
          }}
        >
          Cargando tipos de curso...
        </div>
      )}
      {error && (
        <div style={{
          color: '#ef4444',
          padding: '1.25rem',
          textAlign: 'center',
          background: 'rgba(239, 68, 68, 0.1)',
          border: '1px solid rgba(239, 68, 68, 0.3)',
          borderRadius: '1rem',
          fontSize: '0.85rem',
          marginBottom: '1.5rem'
        }}>
          {error}
        </div>
      )}

      {/* Paginación */}
      {!loading && filteredTipos.length > 0 && (
        <div className="pagination-container" style={{
          display: 'flex',
          flexDirection: isMobile ? 'column' : 'row',
          justifyContent: 'space-between',
          alignItems: isMobile ? 'stretch' : 'center',
          gap: isMobile ? '0.75rem' : '0',
          padding: isMobile ? '16px' : '20px 1.5rem',
          background: theme.cardBg,
          border: `1px solid ${theme.paginationBorder}`,
          borderRadius: '1rem',
        }}>
          <div style={{
            color: theme.infoText,
            fontSize: isMobile ? '0.8rem' : '0.9rem',
            textAlign: isMobile ? 'center' : 'left'
          }}>
            Página {currentPage} de {totalPages} • Total: {filteredTipos.length} tipos de curso
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', justifyContent: isMobile ? 'center' : 'flex-start' }}>
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: isMobile ? '4px' : '0.375rem',
                padding: isMobile ? '8px 0.75rem' : '8px 1rem',
                background: currentPage === 1
                  ? (darkMode ? 'rgba(255,255,255,0.05)' : '#f9fafb')
                  : (darkMode ? 'rgba(255,255,255,0.1)' : '#f3f4f6'),
                border: darkMode ? '1px solid rgba(255,255,255,0.2)' : '1px solid #e5e7eb',
                borderRadius: '0.625rem',
                color: currentPage === 1 ? (darkMode ? 'rgba(255,255,255,0.3)' : '#d1d5db') : theme.textPrimary,
                fontSize: isMobile ? '0.8rem' : '0.9rem',
                fontWeight: 600,
                cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s ease',
                flex: isMobile ? '1' : 'initial'
              }}
            >
              <ChevronLeft size={isMobile ? 14 : 16} />
              {!isMobile && 'Anterior'}
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                style={{
                  padding: isMobile ? '8px 0.625rem' : '8px 0.875rem',
                  background: currentPage === page
                    ? 'linear-gradient(135deg, #ef4444, #dc2626)'
                    : (darkMode ? 'rgba(255,255,255,0.08)' : '#f3f4f6'),
                  border: currentPage === page
                    ? '1px solid #ef4444'
                    : (darkMode ? '1px solid rgba(255,255,255,0.15)' : '1px solid #e5e7eb'),
                  borderRadius: '0.625rem',
                  color: currentPage === page ? '#fff' : theme.textPrimary,
                  fontSize: isMobile ? '0.8rem' : '0.9rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  minWidth: isMobile ? '36px' : '2.5rem',
                }}
              >
                {page}
              </button>
            ))}
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: isMobile ? '4px' : '0.375rem',
                padding: isMobile ? '8px 0.75rem' : '8px 1rem',
                background: currentPage === totalPages
                  ? (darkMode ? 'rgba(255,255,255,0.05)' : '#f9fafb')
                  : (darkMode ? 'rgba(255,255,255,0.1)' : '#f3f4f6'),
                border: darkMode ? '1px solid rgba(255,255,255,0.2)' : '1px solid #e5e7eb',
                borderRadius: '0.625rem',
                color: currentPage === totalPages ? (darkMode ? 'rgba(255,255,255,0.3)' : '#d1d5db') : theme.textPrimary,
                fontSize: isMobile ? '0.8rem' : '0.9rem',
                fontWeight: 600,
                cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s ease',
                flex: isMobile ? '1' : 'initial'
              }}
            >
              {!isMobile && 'Siguiente'}
              <ChevronRight size={isMobile ? 14 : 16} />
            </button>
          </div>
        </div>
      )}

      {showModal && createPortal(
        <div
          className="modal-overlay"
          onClick={() => setShowModal(false)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            width: '100vw',
            height: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 99999,
            padding: isMobile ? '1rem' : '2rem',
            backdropFilter: 'blur(8px)',
            background: 'rgba(0, 0, 0, 0.65)',
            overflowY: 'auto',
            overflowX: 'hidden',
            scrollBehavior: 'smooth'
          }}
        >
          <div
            className="modal-content"
            onClick={(e) => e.stopPropagation()}
            style={{
              position: 'relative',
              background: darkMode
                ? 'linear-gradient(135deg, rgba(0,0,0,0.9) 0%, rgba(26,26,46,0.9) 100%)'
                : 'linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(248,250,252,0.95) 100%)',
              border: '1px solid rgba(239, 68, 68, 0.2)',
              borderRadius: '12px',
              width: isMobile ? '92vw' : '60vw',
              maxWidth: isMobile ? '92vw' : '60vw',
              maxHeight: '85vh',
              padding: isMobile ? '0.75rem 0.875rem' : '1rem 1.5rem',
              margin: 'auto',
              color: darkMode ? '#fff' : '#1e293b',
              boxShadow: '0 20px 60px -12px rgba(0, 0, 0, 0.5)',
              overflowY: 'auto',
              overflowX: 'hidden',
              animation: 'scaleIn 0.3s ease-out'
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: isMobile ? 12 : 14,
                paddingBottom: isMobile ? 8 : 10,
                borderBottom: '1px solid rgba(239, 68, 68, 0.2)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <BookOpen size={isMobile ? 18 : 20} />
                <h3 style={{ margin: 0, fontSize: isMobile ? '0.95rem' : '1.05rem', fontWeight: '600', letterSpacing: '-0.01em', color: darkMode ? '#fff' : '#1e293b' }}>
                  {modalType === 'create' ? 'Nuevo Tipo de Curso' : 'Editar Tipo de Curso'}
                </h3>
              </div>
              <button
                onClick={() => setShowModal(false)}
                style={{
                  background: darkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
                  border: darkMode ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.15)',
                  borderRadius: '8px',
                  padding: '6px',
                  color: darkMode ? '#fff' : '#1e293b',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.2s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)';
                  e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.4)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = darkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)';
                  e.currentTarget.style.borderColor = darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.15)';
                }}
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div style={{ display: 'grid', gridTemplateColumns: isSmallScreen ? '1fr' : 'repeat(3, 1fr)', gap: isMobile ? 10 : 12, columnGap: isSmallScreen ? 0 : 16 }}>
                {/* Nombre - 2 columnas */}
                <div style={{ gridColumn: isSmallScreen ? '1 / -1' : 'span 2' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: 5, color: darkMode ? 'rgba(255,255,255,0.9)' : '#1e293b', fontWeight: 500, fontSize: '0.8rem' }}>
                    <FileText size={14} />
                    Nombre del tipo
                  </label>
                  <input
                    name="nombre"
                    placeholder="Ej. Cosmetología, Maquillaje Profesional"
                    defaultValue={selected?.nombre || ''}
                    required
                    style={{
                      width: '100%',
                      padding: '7px 10px',
                      background: darkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)',
                      border: darkMode ? '1px solid rgba(255,255,255,0.12)' : '1px solid rgba(0,0,0,0.15)',
                      borderRadius: 6,
                      color: darkMode ? '#fff' : '#1e293b',
                      fontSize: '0.8rem',
                      transition: 'all 0.2s ease',
                    }}
                    onFocus={(e) => {
                      e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.5)';
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.borderColor = darkMode ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.15)';
                    }}
                  />
                </div>

                {/* Estado - 1 columna */}
                <div>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: 5, color: darkMode ? 'rgba(255,255,255,0.9)' : '#1e293b', fontWeight: 500, fontSize: '0.8rem' }}>
                    <CheckCircle size={14} />
                    Estado
                  </label>
                  <StyledSelect
                    name="estado"
                    defaultValue={selected?.estado || 'activo'}
                    options={[
                      { value: 'activo', label: 'Activo' },
                      { value: 'inactivo', label: 'Inactivo' },
                    ]}
                    darkMode={darkMode}
                    style={{
                      padding: '7px 10px',
                      fontSize: '0.8rem',
                      borderRadius: 6
                    }}
                  />
                </div>

                {/* Descripción - ancho completo, más compacta */}
                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: 5, color: darkMode ? 'rgba(255,255,255,0.9)' : '#1e293b', fontWeight: 500, fontSize: '0.8rem' }}>
                    <FileText size={14} />
                    Descripción (opcional)
                  </label>
                  <textarea
                    name="descripcion"
                    defaultValue={selected?.descripcion || ''}
                    placeholder="Resumen del programa, objetivos y beneficios."
                    rows={2}
                    style={{
                      width: '100%',
                      padding: '8px 10px',
                      background: darkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)',
                      border: darkMode ? '1px solid rgba(255,255,255,0.12)' : '1px solid rgba(0,0,0,0.15)',
                      borderRadius: 6,
                      color: darkMode ? '#fff' : '#1e293b',
                      fontSize: '0.75rem',
                      resize: 'vertical',
                      minHeight: '50px'
                    }}
                  />
                </div>

                {/* Separador */}
                <div style={{ gridColumn: '1 / -1', height: 1, background: 'rgba(239, 68, 68, 0.2)', margin: '6px 0' }} />

                {/* Modalidad de Pago */}
                <div style={{ gridColumn: isSmallScreen ? '1 / -1' : 'span 2' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: 5, color: darkMode ? 'rgba(255,255,255,0.9)' : '#1e293b', fontWeight: 500, fontSize: '0.8rem' }}>
                    <CreditCard size={14} />
                    Modalidad de Pago
                  </label>
                  <StyledSelect
                    name="modalidad_pago"
                    defaultValue={selected?.modalidad_pago || 'mensual'}
                    options={[
                      { value: 'mensual', label: 'Mensual - Cuotas por meses' },
                      { value: 'clases', label: 'Por Clases - Pago individual por clase' },
                    ]}
                    darkMode={darkMode}
                    style={{
                      padding: '7px 10px',
                      fontSize: '0.8rem',
                      borderRadius: 6
                    }}
                    onChange={(e) => {
                      const isClases = e.target.value === 'clases';
                      const numeroClasesDiv = document.querySelector('[data-field="numero_clases"]') as HTMLDivElement;
                      const precioPorClaseDiv = document.querySelector('[data-field="precio_por_clase"]') as HTMLDivElement;
                      if (numeroClasesDiv && precioPorClaseDiv) {
                        numeroClasesDiv.style.display = isClases ? 'block' : 'none';
                        precioPorClaseDiv.style.display = isClases ? 'block' : 'none';
                      }
                    }}
                  />
                </div>

                {/* Duración */}
                <div>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: 5, color: darkMode ? 'rgba(255,255,255,0.9)' : '#1e293b', fontWeight: 500, fontSize: '0.8rem' }}>
                    <Calendar size={14} />
                    Duración (meses)
                  </label>
                  <input
                    type="number"
                    min={1}
                    name="duracion_meses"
                    placeholder="Ej. 6"
                    defaultValue={selected?.duracion_meses ?? ''}
                    style={{
                      width: '100%',
                      padding: '7px 10px',
                      background: darkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)',
                      border: darkMode ? '1px solid rgba(255,255,255,0.12)' : '1px solid rgba(0,0,0,0.15)',
                      borderRadius: 6,
                      color: darkMode ? '#fff' : '#1e293b',
                      fontSize: '0.8rem',
                    }}
                  />
                </div>

                {/* Precio base */}
                <div>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: 5, color: darkMode ? 'rgba(255,255,255,0.9)' : '#1e293b', fontWeight: 500, fontSize: '0.8rem' }}>
                    <DollarSign size={14} />
                    Precio base (USD)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min={0}
                    name="precio_base"
                    placeholder="Ej. 2500"
                    defaultValue={selected?.precio_base ?? ''}
                    style={{
                      width: '100%',
                      padding: '7px 10px',
                      background: darkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)',
                      border: darkMode ? '1px solid rgba(255,255,255,0.12)' : '1px solid rgba(0,0,0,0.15)',
                      borderRadius: 6,
                      color: darkMode ? '#fff' : '#1e293b',
                      fontSize: '0.8rem',
                    }}
                  />
                </div>

                {/* Campos específicos para modalidad "clases" */}
                <div data-field="numero_clases" style={{ display: selected?.modalidad_pago === 'clases' ? 'block' : 'none' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: 5, color: darkMode ? 'rgba(255,255,255,0.9)' : '#1e293b', fontWeight: 500, fontSize: '0.8rem' }}>
                    <Hash size={14} />
                    Número de Clases
                  </label>
                  <input
                    type="number"
                    min={1}
                    name="numero_clases"
                    placeholder="Ej. 16"
                    defaultValue={selected?.numero_clases ?? ''}
                    style={{
                      width: '100%',
                      padding: '7px 10px',
                      background: darkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)',
                      border: darkMode ? '1px solid rgba(255,255,255,0.12)' : '1px solid rgba(0,0,0,0.15)',
                      borderRadius: 6,
                      color: darkMode ? '#fff' : '#1e293b',
                      fontSize: '0.8rem',
                    }}
                  />
                </div>

                <div data-field="precio_por_clase" style={{ display: selected?.modalidad_pago === 'clases' ? 'block' : 'none' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: 5, color: darkMode ? 'rgba(255,255,255,0.9)' : '#1e293b', fontWeight: 500, fontSize: '0.8rem' }}>
                    <DollarSign size={14} />
                    Precio por Clase (USD)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min={0}
                    name="precio_por_clase"
                    placeholder="Ej. 15.40"
                    defaultValue={selected?.precio_por_clase ?? ''}
                    style={{
                      width: '100%',
                      padding: '7px 10px',
                      background: darkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)',
                      border: darkMode ? '1px solid rgba(255,255,255,0.12)' : '1px solid rgba(0,0,0,0.15)',
                      borderRadius: 6,
                      color: darkMode ? '#fff' : '#1e293b',
                      fontSize: '0.8rem',
                    }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: isSmallScreen ? 'column-reverse' : 'row', gap: isMobile ? 10 : 12, marginTop: isMobile ? 16 : 24, justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  style={{
                    padding: isMobile ? '10px 1rem' : '12px 1.5rem',
                    background: darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
                    border: darkMode ? '1px solid rgba(255,255,255,0.2)' : '1px solid rgba(0,0,0,0.15)',
                    borderRadius: isMobile ? 10 : 12,
                    color: darkMode ? 'rgba(255,255,255,0.7)' : 'rgba(30,41,59,0.8)',
                    cursor: 'pointer',
                    fontSize: isMobile ? '0.9rem' : '1rem',
                    width: isSmallScreen ? '100%' : 'auto'
                  }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                    padding: isMobile ? '10px 1rem' : '12px 1.5rem',
                    background: 'linear-gradient(135deg, #ef4444, #dc2626)',
                    border: 'none',
                    borderRadius: isMobile ? 10 : 12,
                    color: '#fff',
                    fontWeight: 600,
                    cursor: 'pointer',
                    fontSize: isMobile ? '0.9rem' : '1rem',
                    width: isSmallScreen ? '100%' : 'auto'
                  }}
                >
                  <Save size={16} />
                  {modalType === 'create' ? 'Crear' : 'Guardar'}
                </button>
              </div>
            </form>
          </div>

          {/* Animaciones CSS */}
          <style>{`
            @keyframes slideUp {
              from {
                opacity: 0;
                transform: translateY(100%);
              }
              to {
                opacity: 1;
                transform: translateY(0);
              }
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
        </div>,
        document.body
      )}

      {tipoToDelete && createPortal(
        <div
          onClick={() => !loading && setTipoToDelete(null)}
          style={{
            position: 'fixed',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(0,0,0,0.65)',
            backdropFilter: 'blur(10px)',
            zIndex: 99990,
            padding: isMobile ? '1.25rem' : '2rem'
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: '100%',
              maxWidth: isMobile ? '360px' : '420px',
              background: darkMode
                ? 'linear-gradient(135deg, rgba(31,31,31,0.95) 0%, rgba(60,16,16,0.92) 100%)'
                : 'linear-gradient(135deg, rgba(255,255,255,0.96) 0%, rgba(255,228,228,0.92) 100%)',
              borderRadius: '1rem',
              border: `1px solid ${darkMode ? 'rgba(239,68,68,0.35)' : 'rgba(239,68,68,0.45)'}`,
              boxShadow: darkMode
                ? '0 24px 48px rgba(239,68,68,0.22)'
                : '0 24px 48px rgba(239,68,68,0.18)',
              padding: isMobile ? '1.25rem' : '1.75rem',
              color: darkMode ? '#fff' : '#1f2937',
              display: 'flex',
              flexDirection: 'column',
              gap: '1.25rem'
            }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div
                style={{
                  width: '3rem',
                  height: '3rem',
                  borderRadius: '9999px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: darkMode ? 'rgba(239,68,68,0.18)' : 'rgba(239,68,68,0.15)',
                  border: darkMode ? '1px solid rgba(239,68,68,0.35)' : '1px solid rgba(239,68,68,0.35)'
                }}
              >
                <AlertTriangle size={26} color={darkMode ? '#f87171' : '#dc2626'} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                <h4 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700 }}>
                  ¿Eliminar tipo de curso?
                </h4>
                <p style={{ margin: 0, fontSize: '0.9rem', color: darkMode ? 'rgba(255,255,255,0.75)' : '#4b5563', lineHeight: 1.5 }}>
                  Esta acción eliminará permanentemente el tipo de curso
                  <strong> "{tipoToDelete.nombre}"</strong> y no podrá deshacerse.
                </p>
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: '0.75rem' }}>
              <button
                onClick={() => setTipoToDelete(null)}
                disabled={loading}
                style={{
                  flex: 1,
                  padding: '0.75rem 1rem',
                  borderRadius: '0.75rem',
                  border: darkMode ? '1px solid rgba(255,255,255,0.18)' : '1px solid rgba(239,68,68,0.2)',
                  background: darkMode ? 'rgba(255,255,255,0.05)' : '#fff',
                  color: darkMode ? 'rgba(255,255,255,0.85)' : '#1f2937',
                  fontWeight: 600,
                  cursor: loading ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s ease'
                }}
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmDelete}
                disabled={loading}
                style={{
                  flex: 1,
                  padding: '0.75rem 1rem',
                  borderRadius: '0.75rem',
                  border: 'none',
                  background: loading
                    ? 'linear-gradient(135deg, rgba(239,68,68,0.6), rgba(220,38,38,0.6))'
                    : 'linear-gradient(135deg, #ef4444, #dc2626)',
                  color: '#fff',
                  fontWeight: 700,
                  cursor: loading ? 'not-allowed' : 'pointer',
                  boxShadow: '0 12px 24px rgba(239,68,68,0.32)',
                  transition: 'all 0.2s ease'
                }}
              >
                Sí, eliminar
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default GestionTiposCurso;



