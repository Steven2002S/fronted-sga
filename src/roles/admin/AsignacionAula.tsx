import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  Search, Plus, Edit, X, MapPin, Save, Calendar, Clock, Users, AlertCircle, Grid, List, ChevronLeft, ChevronRight
} from 'lucide-react';
import { StyledSelect } from '../../components/StyledSelect';
import SearchableSelect from '../../components/SearchableSelect';
import GlassEffect from '../../components/GlassEffect';
import AdminSectionHeader from '../../components/AdminSectionHeader';
import { RedColorPalette } from '../../utils/colorMapper';
import { useBreakpoints } from '../../hooks/useMediaQuery';
import { showToast } from '../../config/toastConfig';
import '../../styles/responsive.css';
import '../../utils/modalScrollHelper';

const API_BASE = (import.meta as any).env?.VITE_API_URL || 'http://localhost:3000';

type EstadoAsignacion = 'activa' | 'inactiva' | 'cancelada';
type EstadoFiltro = 'todas' | EstadoAsignacion;

interface Asignacion {
  id_asignacion: number;
  id_aula: number;
  id_curso: number;
  id_docente: number;
  hora_inicio: string;
  hora_fin: string;
  dias: string;
  estado: EstadoAsignacion;
  observaciones?: string;
  // Datos relacionados
  codigo_aula: string;
  aula_nombre: string;
  ubicacion?: string;
  codigo_curso: string;
  curso_nombre: string;
  fecha_inicio: string;
  fecha_fin: string;
  capacidad_maxima: number;
  tipo_curso_nombre: string;
  docente_nombres: string;
  docente_apellidos: string;
  estudiantes_matriculados: number;
  porcentaje_ocupacion: number;
}

interface Aula {
  id_aula: number;
  codigo_aula: string;
  nombre: string;
  ubicacion?: string;
  estado: string;
}

interface Curso {
  id_curso: number;
  codigo_curso: string;
  nombre: string;
  horario: string;
  fecha_inicio: string;
  fecha_fin: string;
  capacidad_maxima: number;
  estado: string;
}

interface Docente {
  id_docente: number;
  identificacion: string;
  nombres: string;
  apellidos: string;
  estado: string;
}

interface AsignacionAulaProps {
  darkMode?: boolean;
}

const AsignacionAula: React.FC<AsignacionAulaProps> = ({ darkMode: inheritedDarkMode }) => {
  const { isMobile, isSmallScreen } = useBreakpoints();

  const [darkMode, setDarkMode] = useState<boolean>(() => {
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

  const [asignaciones, setAsignaciones] = useState<Asignacion[]>([]);
  const [aulas, setAulas] = useState<Aula[]>([]);
  const [cursos, setCursos] = useState<Curso[]>([]);
  const [docentes, setDocentes] = useState<Docente[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [showModal, setShowModal] = useState<boolean>(false);
  const [modalType, setModalType] = useState<'create' | 'edit'>('create');
  const [selectedAsignacion, setSelectedAsignacion] = useState<Asignacion | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [filtroEstado, setFiltroEstado] = useState<EstadoFiltro>('activa');
  const [saving, setSaving] = useState(false);

  // Estados para paginación y vista
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');
  const [page, setPage] = useState(1);
  const limit = 5; // 5 asignaciones por página

  const diasSemana = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

  const pick = (light: string, dark: string) => (darkMode ? dark : light);

  const palette = {
    pageBg: `var(--theme-bg-content, ${pick('linear-gradient(135deg, rgba(255,255,255,0.96) 0%, rgba(248,250,252,0.92) 100%)', 'linear-gradient(135deg, rgba(10,10,10,0.95) 0%, rgba(23,23,23,0.95) 100%)')})`,
    cardBg: `var(--theme-card-bg, ${pick('linear-gradient(135deg, rgba(255,255,255,0.98) 0%, rgba(244,246,249,0.95) 100%)', 'linear-gradient(135deg, rgba(0,0,0,0.9) 0%, rgba(26,26,26,0.9) 100%)')})`,
    cardBorder: pick('rgba(239, 68, 68, 0.12)', 'rgba(248, 113, 113, 0.22)'),
    cardShadow: pick('0 0.25em 0.75em rgba(15, 23, 42, 0.12)', '0 0.25em 0.75em rgba(0, 0, 0, 0.3)'),
    cardHoverShadow: pick('0 0.45em 1.25em rgba(239, 68, 68, 0.18)', '0 0.5em 1.5em rgba(248, 113, 113, 0.3)'),
    cardHoverBorder: pick('rgba(239, 68, 68, 0.22)', 'rgba(248, 113, 113, 0.4)'),
    labelMuted: pick('rgba(71, 85, 105, 0.7)', 'rgba(226, 232, 240, 0.65)'),
    textSecondary: 'var(--admin-text-secondary, rgba(30,41,59,0.8))',
    textMuted: 'var(--admin-text-muted, rgba(100,116,139,0.75))',
    softSurface: pick('rgba(15, 23, 42, 0.05)', 'rgba(255, 255, 255, 0.05)'),
    softSurfaceBorder: pick('rgba(15, 23, 42, 0.08)', 'rgba(255, 255, 255, 0.12)'),
    occupancyTrack: pick('rgba(15, 23, 42, 0.08)', 'rgba(255, 255, 255, 0.1)'),
    emptyStateText: pick('rgba(100, 116, 139, 0.75)', 'rgba(226, 232, 240, 0.7)'),
    tableHeaderBg: pick('rgba(248, 113, 113, 0.12)', 'rgba(248, 113, 113, 0.15)'),
    tableHeaderBorder: pick('rgba(248, 113, 113, 0.18)', 'rgba(248, 113, 113, 0.3)'),
    tableRowAlt: pick('rgba(248, 250, 252, 0.65)', 'rgba(255, 255, 255, 0.02)'),
    tableDivider: pick('rgba(226, 232, 240, 0.5)', 'rgba(255, 255, 255, 0.05)'),
    tableHover: pick('rgba(248, 113, 113, 0.18)', 'rgba(248, 113, 113, 0.08)'),
    tableSubtext: pick('rgba(100, 116, 139, 0.75)', 'rgba(148, 163, 184, 0.75)'),
    tableIconBg: pick('rgba(239, 68, 68, 0.12)', 'rgba(248, 113, 113, 0.2)'),
    tableIconColor: pick('#ef4444', '#f87171'),
    tableActionBg: pick('rgba(245, 158, 11, 0.15)', 'rgba(245, 158, 11, 0.2)'),
    tableActionBorder: pick('rgba(245, 158, 11, 0.24)', 'rgba(245, 158, 11, 0.3)'),
    tableActionText: pick('#b45309', '#fbbf24'),
    statusActiveBg: pick('rgba(16, 185, 129, 0.2)', 'rgba(16, 185, 129, 0.3)'),
    statusActiveBorder: pick('rgba(16, 185, 129, 0.45)', 'rgba(16, 185, 129, 0.5)'),
    statusActiveText: pick('#047857', '#34d399'),
    statusInactiveBg: pick('rgba(148, 163, 184, 0.15)', 'rgba(148, 163, 184, 0.22)'),
    statusInactiveBorder: pick('rgba(148, 163, 184, 0.32)', 'rgba(148, 163, 184, 0.38)'),
    statusInactiveText: pick('#475569', '#cbd5f5'),
    statusCanceledBg: pick('rgba(239, 68, 68, 0.18)', 'rgba(239, 68, 68, 0.3)'),
    statusCanceledBorder: pick('rgba(239, 68, 68, 0.42)', 'rgba(239, 68, 68, 0.5)'),
    statusCanceledText: pick('#b91c1c', '#fca5a5'),
    cardStatusActiveBg: pick('linear-gradient(135deg, rgba(254, 226, 226, 0.95), rgba(254, 202, 202, 0.95))', 'linear-gradient(135deg, rgba(127, 29, 29, 0.55), rgba(127, 29, 29, 0.7))'),
    cardStatusActiveBorder: pick('rgba(244, 63, 94, 0.45)', 'rgba(244, 114, 182, 0.55)'),
    cardStatusActiveText: pick('#7f1d1d', '#fecaca'),
    blueChipBg: pick('rgba(59, 130, 246, 0.12)', 'rgba(59, 130, 246, 0.2)'),
    blueChipText: pick('#1d4ed8', '#60a5fa'),
    blueChipBorder: pick('rgba(59, 130, 246, 0.2)', 'rgba(59, 130, 246, 0.35)'),
    purpleChipBg: pick('rgba(139, 92, 246, 0.12)', 'rgba(139, 92, 246, 0.2)'),
    purpleChipText: pick('#6d28d9', '#a78bfa'),
    purpleChipBorder: pick('rgba(139, 92, 246, 0.2)', 'rgba(139, 92, 246, 0.35)'),
    toggleGroupBg: pick('rgba(148, 163, 184, 0.12)', 'rgba(255, 255, 255, 0.08)'),
    toggleInactiveText: pick('rgba(71, 85, 105, 0.75)', 'rgba(226, 232, 240, 0.7)'),
    toggleActiveBg: pick('rgba(248, 250, 252, 0.95)', 'rgba(255, 255, 255, 0.12)'),
    toggleActiveShadow: pick('0 0.75rem 1.5rem rgba(15, 23, 42, 0.12)', '0 0.75rem 1.8rem rgba(0, 0, 0, 0.4)'),
    toggleInactiveBorder: pick('rgba(148, 163, 184, 0.2)', 'rgba(148, 163, 184, 0.18)'),
    searchIcon: pick('rgba(100, 116, 139, 0.6)', 'rgba(226, 232, 240, 0.6)'),
    inputBg: 'var(--admin-input-bg, rgba(15,23,42,0.05))',
    inputBorder: 'var(--admin-input-border, rgba(15,23,42,0.1))',
    inputText: 'var(--admin-text-primary, #1f2937)',
    placeholder: pick('rgba(100, 116, 139, 0.6)', 'rgba(148, 163, 184, 0.65)'),
    paginationBg: pick('linear-gradient(135deg, rgba(255,255,255,0.96) 0%, rgba(248,250,252,0.96) 100%)', 'linear-gradient(135deg, rgba(0,0,0,0.9) 0%, rgba(26,26,26,0.9) 100%)'),
    paginationBorder: pick('rgba(239, 68, 68, 0.14)', 'rgba(239, 68, 68, 0.25)'),
    paginationText: pick('rgba(30, 41, 59, 0.85)', 'rgba(226, 232, 240, 0.9)'),
    paginationButtonBg: pick('rgba(248, 250, 252, 0.9)', 'rgba(255, 255, 255, 0.1)'),
    paginationButtonBorder: pick('rgba(226, 232, 240, 0.7)', 'rgba(255, 255, 255, 0.2)'),
    paginationButtonText: pick('rgba(30, 41, 59, 0.85)', '#fff'),
    paginationButtonDisabledBg: pick('rgba(226, 232, 240, 0.5)', 'rgba(255, 255, 255, 0.05)'),
    paginationButtonDisabledText: pick('rgba(148, 163, 184, 0.6)', 'rgba(255, 255, 255, 0.3)'),
    modalOverlay: pick('rgba(15, 23, 42, 0.3)', 'rgba(0, 0, 0, 0.65)'),
    modalSurface: `var(--admin-card-bg, ${pick('linear-gradient(135deg, rgba(255,255,255,0.98) 0%, rgba(245,247,250,0.96) 100%)', 'linear-gradient(135deg, rgba(17,24,39,0.95) 0%, rgba(15,23,42,0.95) 100%)')})`,
    modalBorder: pick('rgba(226, 232, 240, 0.9)', 'rgba(51, 65, 85, 0.7)'),
    modalTextPrimary: pick('#1f2937', '#f8fafc'),
    modalDivider: pick('rgba(226, 232, 240, 0.8)', 'rgba(148, 163, 184, 0.35)'),
    modalInputBg: pick('rgba(248, 250, 252, 0.95)', 'rgba(255, 255, 255, 0.06)'),
    modalInputBorder: pick('rgba(203, 213, 225, 0.9)', 'rgba(148, 163, 184, 0.25)'),
    modalInputText: pick('#1f2937', '#e2e8f0'),
    modalPlaceholder: pick('rgba(100, 116, 139, 0.6)', 'rgba(148, 163, 184, 0.6)'),
    modalNeutralButtonBg: pick('rgba(148, 163, 184, 0.15)', 'rgba(255, 255, 255, 0.08)'),
    modalNeutralButtonBorder: pick('rgba(148, 163, 184, 0.35)', 'rgba(148, 163, 184, 0.3)'),
    modalNeutralButtonText: pick('#475569', '#e2e8f0'),
    modalCloseBg: pick('rgba(148, 163, 184, 0.2)', 'rgba(255, 255, 255, 0.08)'),
    modalCloseBorder: pick('rgba(148, 163, 184, 0.35)', 'rgba(148, 163, 184, 0.25)'),
    modalCloseHoverBg: pick('rgba(239, 68, 68, 0.15)', 'rgba(239, 68, 68, 0.25)'),
    modalCloseHoverBorder: pick('rgba(239, 68, 68, 0.35)', 'rgba(239, 68, 68, 0.45)'),
    modalShadow: pick('0 1.5rem 5rem -1.25rem rgba(15, 23, 42, 0.3)', '0 1.5rem 5rem -1.25rem rgba(0, 0, 0, 0.6)')
  };

  const getStatusStyles = (estado: EstadoAsignacion) => {
    switch (estado) {
      case 'activa':
        return {
          background: palette.statusActiveBg,
          border: palette.statusActiveBorder,
          color: palette.statusActiveText
        };
      case 'cancelada':
        return {
          background: palette.statusCanceledBg,
          border: palette.statusCanceledBorder,
          color: palette.statusCanceledText
        };
      default:
        return {
          background: palette.statusInactiveBg,
          border: palette.statusInactiveBorder,
          color: palette.statusInactiveText
        };
    }
  };

  // Función para formatear fechas: 03/Oct/2025
  const formatearFecha = (fecha: string): string => {
    if (!fecha) return '';
    const meses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    const date = new Date(fecha);
    const dia = date.getDate().toString().padStart(2, '0');
    const mes = meses[date.getMonth()];
    const año = date.getFullYear();
    return `${dia}/${mes}/${año}`;
  };

  // Cargar datos iniciales
  useEffect(() => {
    loadData();
  }, [filtroEstado]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Cargar asignaciones
      const params = new URLSearchParams();
      if (filtroEstado !== 'todas') {
        params.set('estado', filtroEstado);
      }
      params.set('limit', '100');

      const token = sessionStorage.getItem('auth_token');
      const [asignacionesRes, aulasRes, cursosRes, docentesRes] = await Promise.all([
        fetch(`${API_BASE}/api/asignaciones-aulas?${params.toString()}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch(`${API_BASE}/api/aulas?limit=100`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch(`${API_BASE}/api/cursos?limit=100`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch(`${API_BASE}/api/docentes?limit=100`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })
      ]);

      if (!asignacionesRes.ok) throw new Error('Error cargando asignaciones');
      if (!aulasRes.ok) throw new Error('Error cargando aulas');
      if (!cursosRes.ok) throw new Error('Error cargando cursos');
      if (!docentesRes.ok) throw new Error('Error cargando docentes');

      const asignacionesData = await asignacionesRes.json();
      const aulasData = await aulasRes.json();
      const cursosData = await cursosRes.json();
      const docentesData = await docentesRes.json();

      // Manejar diferentes formatos de respuesta
      const asignacionesList = asignacionesData.asignaciones || [];
      const aulasList = aulasData.aulas || [];
      const cursosList = Array.isArray(cursosData) ? cursosData : (cursosData.cursos || []);
      const docentesList = Array.isArray(docentesData) ? docentesData : (docentesData.docentes || []);

      setAsignaciones(asignacionesList);
      setAulas(aulasList);
      setCursos(cursosList);
      setDocentes(docentesList);
    } catch (err: any) {
      console.error('Error cargando datos:', err);
      setError(err.message || 'Error cargando datos');
    } finally {
      setLoading(false);
    }
  };

  const asignacionesFiltradas = asignaciones.filter((asignacion: Asignacion) => {
    const matchesSearch = asignacion.aula_nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      asignacion.curso_nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      asignacion.docente_nombres.toLowerCase().includes(searchTerm.toLowerCase()) ||
      asignacion.docente_apellidos.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  // Paginación
  const totalCount = asignacionesFiltradas.length;
  const totalPages = Math.ceil(totalCount / limit);
  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + limit;
  const asignacionesPaginadas = asignacionesFiltradas.slice(startIndex, endIndex);

  const handleCreateAsignacion = () => {
    setSelectedAsignacion(null);
    setModalType('create');
    setShowModal(true);
  };

  const handleEditAsignacion = (asignacion: Asignacion) => {
    setSelectedAsignacion(asignacion);
    setModalType('edit');
    setShowModal(true);
  };

  const checkAvailability = (
    newDocenteId: number,
    newAulaId: number,
    newCursoId: number,
    newDias: string[],
    newHoraInicio: string,
    newHoraFin: string,
    excludeAsignacionId?: number
  ): { valid: boolean; error?: string } => {
    // Obtener fechas del curso seleccionado
    const cursoSeleccionado = cursos.find(c => c.id_curso === newCursoId);
    if (!cursoSeleccionado) return { valid: false, error: 'Curso no encontrado' };

    const newFechaInicio = new Date(cursoSeleccionado.fecha_inicio);
    const newFechaFin = new Date(cursoSeleccionado.fecha_fin);

    // Normalizar horas para comparación
    const [newInicioH, newInicioM] = newHoraInicio.split(':').map(Number);
    const [newFinH, newFinM] = newHoraFin.split(':').map(Number);
    const newMinutosInicio = newInicioH * 60 + newInicioM;
    const newMinutosFin = newFinH * 60 + newFinM;

    for (const asignacion of asignaciones) {
      // Excluir la propia asignación si estamos editando
      if (excludeAsignacionId && asignacion.id_asignacion === excludeAsignacionId) continue;

      // Solo validar contra asignaciones activas
      if (asignacion.estado !== 'activa') continue;

      // 1. Validar superposición de fechas
      const existingFechaInicio = new Date(asignacion.fecha_inicio);
      const existingFechaFin = new Date(asignacion.fecha_fin);

      // Si los rangos de fecha NO se superponen, no hay conflicto
      if (newFechaFin < existingFechaInicio || newFechaInicio > existingFechaFin) continue;

      // 2. Validar superposición de días
      const existingDias = asignacion.dias.split(',').map(d => d.trim());
      const diasOverlap = newDias.some(dia => existingDias.includes(dia));

      if (!diasOverlap) continue;

      // 3. Validar superposición de horas
      const [exInicioH, exInicioM] = asignacion.hora_inicio.split(':').map(Number);
      const [exFinH, exFinM] = asignacion.hora_fin.split(':').map(Number);
      const exMinutosInicio = exInicioH * 60 + exInicioM;
      const exMinutosFin = exFinH * 60 + exFinM;

      // Verificar si hay solapamiento de tiempo
      // (StartA < EndB) and (EndA > StartB)
      const tiempoOverlap = (newMinutosInicio < exMinutosFin) && (newMinutosFin > exMinutosInicio);

      if (tiempoOverlap) {
        // Si llegamos aquí, hay conflicto de Fecha + Día + Hora

        // Validar Docente
        if (asignacion.id_docente === newDocenteId) {
          return {
            valid: false,
            error: `El docente ${asignacion.docente_nombres} ${asignacion.docente_apellidos} ya tiene clase asignada en este horario (${asignacion.curso_nombre})`
          };
        }

        // Validar Aula
        if (asignacion.id_aula === newAulaId) {
          return {
            valid: false,
            error: `El aula ${asignacion.aula_nombre} ya está ocupada en este horario (${asignacion.curso_nombre})`
          };
        }
      }
    }

    return { valid: true };
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const diasSeleccionados = Array.from(formData.getAll('dias')) as string[];

    if (diasSeleccionados.length === 0) {
      showToast.error('Debe seleccionar al menos un día de clase', darkMode);
      return;
    }

    const horaInicio = String(formData.get('hora_inicio') || '');
    const horaFin = String(formData.get('hora_fin') || '');
    const idAula = Number(formData.get('id_aula'));
    const idCurso = Number(formData.get('id_curso'));
    const idDocente = Number(formData.get('id_docente'));

    // Validar que la hora de fin sea mayor que la hora de inicio
    const [inicioH, inicioM] = horaInicio.split(':').map(Number);
    const [finH, finM] = horaFin.split(':').map(Number);
    const minutosInicio = inicioH * 60 + inicioM;
    const minutosFin = finH * 60 + finM;

    if (minutosFin <= minutosInicio) {
      showToast.error('La hora de fin debe ser mayor que la hora de inicio', darkMode);
      return;
    }

    // Validar rango de horas permitido (08:00 - 18:00)
    const HORA_MINIMA = 8 * 60; // 08:00 (480 minutos)
    const HORA_MAXIMA = 18 * 60; // 18:00 (1080 minutos)

    if (minutosInicio < HORA_MINIMA || minutosFin > HORA_MAXIMA) {
      showToast.error('El horario de clases debe estar entre las 08:00 y las 18:00', darkMode);
      return;
    }

    // Validar disponibilidad
    const validation = checkAvailability(
      idDocente,
      idAula,
      idCurso,
      diasSeleccionados,
      horaInicio,
      horaFin,
      selectedAsignacion?.id_asignacion
    );

    if (!validation.valid) {
      showToast.error(validation.error || 'Conflicto de horario detectado', darkMode);
      return;
    }

    const asignacionData = {
      id_aula: idAula,
      id_curso: idCurso,
      id_docente: idDocente,
      hora_inicio: `${horaInicio}:00`,
      hora_fin: `${horaFin}:00`,
      dias: diasSeleccionados.join(','),
      observaciones: String(formData.get('observaciones') || '')
    };

    try {
      setSaving(true);

      if (modalType === 'create') {
        const token = sessionStorage.getItem('auth_token');
        const res = await fetch(`${API_BASE}/api/asignaciones-aulas`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(asignacionData)
        });

        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData.error || 'Error creando asignación');
        }

        showToast.success('Asignación creada exitosamente', darkMode);
      } else if (modalType === 'edit' && selectedAsignacion) {
        const token = sessionStorage.getItem('auth_token');
        const res = await fetch(`${API_BASE}/api/asignaciones-aulas/${selectedAsignacion.id_asignacion}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(asignacionData)
        });

        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData.error || 'Error actualizando asignación');
        }

        showToast.success('Asignación actualizada exitosamente', darkMode);
      }

      setShowModal(false);
      loadData();
    } catch (err: any) {
      console.error('Error guardando asignación:', err);
      showToast.error(err.message || 'Error guardando asignación', darkMode);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="asignacion-aula" style={{
      minHeight: '100%',
      background: palette.pageBg,
      color: 'var(--admin-text-primary, #1f2937)'
    }}>
      {/* Header */}
      <AdminSectionHeader
        title="Asignación de Aulas"
        subtitle="Gestiona la asignación de aulas, horarios y profesores"
      />

      {/* Controles */}
      <GlassEffect variant="card" tint="neutral" intensity="light" style={{ marginBottom: 16 }}>
        <div style={{
          display: 'flex',
          flexDirection: isMobile ? 'column' : 'row',
          flexWrap: 'wrap',
          gap: '0.75em',
          alignItems: isMobile ? 'stretch' : 'center',
          justifyContent: 'space-between'
        }}>
          <div style={{
            display: 'flex',
            flexDirection: isMobile ? 'column' : 'row',
            gap: '0.75em',
            alignItems: isMobile ? 'stretch' : 'center',
            flex: 1
          }}>
            {/* Búsqueda */}
            <div style={{ position: 'relative', minWidth: isMobile ? 'auto' : 'min(17.5rem, 30vw)', flex: isMobile ? '1' : 'initial' }}>
              <Search size={isMobile ? 14 : 16} style={{ position: 'absolute', left: '0.75em', top: '50%', transform: 'translateY(-50%)', color: palette.searchIcon, pointerEvents: 'none' }} />
              <input
                type="text"
                placeholder={isMobile ? "Buscar..." : "Buscar por aula, curso o profesor..."}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.625em 0.625em 0.625em 2.375em',
                  background: palette.inputBg,
                  border: `0.0625rem solid ${palette.inputBorder}`,
                  borderRadius: '0.625em',
                  color: palette.inputText,
                  fontSize: '0.875rem',
                  outline: 'none'
                }}
              />
            </div>

            {/* Filtros */}
            <div style={{ minWidth: isMobile ? 'auto' : 'min(12.5rem, 20vw)', flex: isMobile ? '1' : 'initial' }}>
              <StyledSelect
                name="filtroEstado"
                value={filtroEstado}
                onChange={(e) => setFiltroEstado(e.target.value as EstadoFiltro)}
                options={[
                  { value: 'todas', label: 'Todas' },
                  { value: 'activa', label: 'Activas' },
                  { value: 'inactiva', label: 'Inactivas' },
                ]}
              />
            </div>

            {/* Toggle Vista */}
            <div style={{
              display: 'flex',
              gap: '0.375em',
              background: palette.toggleGroupBg,
              borderRadius: '0.625em',
              padding: '0.1875em',
              width: isSmallScreen ? '100%' : 'auto'
            }}>
              <button
                onClick={() => setViewMode('cards')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.35em',
                  padding: isMobile ? '0.4em 0.6em' : '0.4em 0.85em',
                  background: viewMode === 'cards' ? palette.toggleActiveBg : 'transparent',
                  border: `0.0625rem solid ${viewMode === 'cards' ? palette.toggleInactiveBorder : 'transparent'}`,
                  borderRadius: '0.55em',
                  color: viewMode === 'cards' ? RedColorPalette.primary : palette.toggleInactiveText,
                  cursor: 'pointer',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  transition: 'all 0.2s ease',
                  flex: isSmallScreen ? 1 : 'initial',
                  boxShadow: viewMode === 'cards' ? palette.toggleActiveShadow : 'none'
                }}
              >
                <Grid size={16} color={viewMode === 'cards' ? RedColorPalette.primary : palette.toggleInactiveText} />
                {!isMobile && (
                  <span style={{ color: viewMode === 'cards' ? RedColorPalette.primary : palette.toggleInactiveText }}>
                    Tarjetas
                  </span>
                )}
              </button>
              <button
                onClick={() => setViewMode('table')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.35em',
                  padding: isMobile ? '0.4em 0.6em' : '0.5em 0.95em',
                  background: viewMode === 'table' ? palette.toggleActiveBg : 'transparent',
                  border: `0.0625rem solid ${viewMode === 'table' ? palette.toggleInactiveBorder : 'transparent'}`,
                  borderRadius: '0.55em',
                  color: viewMode === 'table' ? RedColorPalette.primary : palette.toggleInactiveText,
                  cursor: 'pointer',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  transition: 'all 0.2s ease',
                  flex: isSmallScreen ? 1 : 'initial',
                  boxShadow: viewMode === 'table' ? palette.toggleActiveShadow : 'none'
                }}
              >
                <List size={16} color={viewMode === 'table' ? RedColorPalette.primary : palette.toggleInactiveText} />
                {!isMobile && (
                  <span style={{ color: viewMode === 'table' ? RedColorPalette.primary : palette.toggleInactiveText }}>
                    Tabla
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* Botón Crear */}
          <button
            onClick={handleCreateAsignacion}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5em',
              padding: isMobile ? '0.625em 1em' : '0.75em 1.5em',
              background: `linear-gradient(135deg, ${RedColorPalette.primary}, ${RedColorPalette.primaryDark})`,
              border: 'none',
              borderRadius: '0.625em',
              color: 'var(--admin-text-primary, #1f2937)',
              width: isSmallScreen ? '100%' : 'auto',
              fontSize: '0.875rem',
              fontWeight: '600',
              cursor: 'pointer',
              boxShadow: '0 0.25rem 0.75em rgba(239, 68, 68, 0.3)'
            }}
          >
            <Plus size={16} />
            Nueva Asignación
          </button>
        </div>
      </GlassEffect>

      {/* Estados de carga y error */}
      {loading && (
        <div style={{ textAlign: 'center', padding: '2.5rem', color: palette.textSecondary }}>
          Cargando asignaciones...
        </div>
      )}

      {error && (
        <div style={{
          background: pick('rgba(239, 68, 68, 0.08)', 'rgba(239, 68, 68, 0.1)'),
          border: `0.0625rem solid ${pick('rgba(239, 68, 68, 0.2)', 'rgba(239, 68, 68, 0.3)')}`,
          borderRadius: '0.75rem', padding: '1rem', color: pick('#b91c1c', '#ef4444'),
          display: 'flex', alignItems: 'center', gap: '0.75rem'
        }}>
          <AlertCircle size={20} />
          {error}
        </div>
      )}

      {/* Vista Cards - Tarjetas Compactas */}
      {!loading && !error && viewMode === 'cards' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(17.5rem, 90vw), 1fr))', gap: '1em', marginBottom: '1.125em' }}>
          {asignacionesPaginadas.length === 0 ? (
            <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '1.875rem 1.25rem', color: palette.emptyStateText }}>
              <MapPin size={isMobile ? 28 : 32} style={{ marginBottom: '0.625rem', opacity: 0.5 }} />
              <div style={{ fontSize: '0.85rem', fontWeight: '600' }}>No se encontraron asignaciones</div>
            </div>
          ) : (
            asignacionesPaginadas.map(asignacion => {
              const baseStatus = getStatusStyles(asignacion.estado);
              const cardStatus = asignacion.estado === 'activa'
                ? {
                  ...baseStatus,
                  background: palette.cardStatusActiveBg,
                  border: palette.cardStatusActiveBorder,
                  color: palette.cardStatusActiveText
                }
                : baseStatus;

              return (
                <div key={asignacion.id_asignacion} style={{
                  background: palette.cardBg,
                  backdropFilter: 'blur(1.25rem)',
                  border: `0.0625rem solid ${palette.cardBorder}`,
                  borderRadius: '0.75em',
                  overflow: 'hidden',
                  boxShadow: palette.cardShadow,
                  transition: 'all 0.3s ease',
                }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-0.25em)';
                    e.currentTarget.style.boxShadow = palette.cardHoverShadow;
                    e.currentTarget.style.borderColor = palette.cardHoverBorder;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = palette.cardShadow;
                    e.currentTarget.style.borderColor = palette.cardBorder;
                  }}
                >
                  {/* Header */}
                  <div style={{
                    background: 'linear-gradient(135deg, #fca5a5 0%, #f87171 100%)',
                    padding: '0.75em 0.875em',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5em' }}>
                      <div style={{
                        width: '1.875em',
                        height: '1.875em',
                        borderRadius: '0.5em',
                        background: pick('rgba(255, 255, 255, 0.85)', 'rgba(255, 255, 255, 0.12)'),
                        border: `0.0625rem solid ${pick('rgba(255, 255, 255, 0.6)', 'rgba(255, 255, 255, 0.18)')}`,
                        color: pick('rgba(30, 41, 59, 0.85)', '#f8fafc'),
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        <MapPin size={isMobile ? 14 : 16} color="currentColor" />
                      </div>
                      <div>
                        <h3 style={{ color: pick('#1f2937', '#f8fafc'), margin: 0 }}>
                          {asignacion.aula_nombre}
                        </h3>
                        <div style={{ color: palette.textMuted, fontSize: '0.65em' }}>
                          {asignacion.codigo_aula}
                        </div>
                      </div>
                    </div>
                    <div style={{
                      background: cardStatus.background,
                      color: cardStatus.color,
                      padding: '0.3em 0.75em',
                      borderRadius: '0.9em',
                      fontSize: '0.65em',
                      fontWeight: '700',
                      textTransform: 'uppercase',
                      border: `0.0625rem solid ${cardStatus.border}`,
                      letterSpacing: '0.05em'
                    }}>
                      {asignacion.estado}
                    </div>
                  </div>

                  {/* Contenido */}
                  <div style={{ padding: '0.75em 0.875em' }}>
                    {/* Curso y Docente */}
                    <div style={{ marginBottom: '0.625rem' }}>
                      <div style={{ color: palette.labelMuted, fontSize: '0.65rem', marginBottom: '0.1875rem', display: 'flex', alignItems: 'center', gap: '0.1875rem' }}>
                        <Calendar size={isMobile ? 9 : 10} />
                        CURSO
                      </div>
                      <div style={{ color: 'var(--admin-text-primary, #1f2937)', fontSize: '0.8rem', fontWeight: '600' }}>
                        {asignacion.curso_nombre}
                      </div>
                    </div>

                    <div style={{ marginBottom: '0.625rem' }}>
                      <div style={{ color: palette.labelMuted, fontSize: '0.65rem', marginBottom: '0.1875rem', display: 'flex', alignItems: 'center', gap: '0.1875rem' }}>
                        <Users size={isMobile ? 9 : 10} />
                        DOCENTE
                      </div>
                      <div style={{ color: palette.textSecondary, fontSize: '0.75rem' }}>
                        {asignacion.docente_nombres} {asignacion.docente_apellidos}
                      </div>
                    </div>

                    {/* Horario y Período */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.625rem', marginBottom: '0.625rem' }}>
                      <div>
                        <div style={{ color: palette.labelMuted, fontSize: '0.65rem', marginBottom: '0.1875rem', display: 'flex', alignItems: 'center', gap: '0.1875rem' }}>
                          <Clock size={isMobile ? 9 : 10} />
                          HORARIO
                        </div>
                        <div style={{ color: 'var(--admin-text-primary, #1f2937)', fontSize: '0.7rem', fontWeight: '600' }}>
                          {asignacion.hora_inicio.substring(0, 5)} - {asignacion.hora_fin.substring(0, 5)}
                        </div>
                      </div>
                      <div>
                        <div style={{ color: palette.labelMuted, fontSize: '0.7rem', marginBottom: '0.25rem' }}>
                          PERÍODO
                        </div>
                        <div style={{ color: 'var(--admin-text-primary, #1f2937)', fontSize: '0.75rem' }}>
                          {formatearFecha(asignacion.fecha_inicio)}
                        </div>
                        <div style={{ color: palette.labelMuted, fontSize: '0.7rem' }}>
                          {formatearFecha(asignacion.fecha_fin)}
                        </div>
                      </div>
                    </div>

                    {/* Días */}
                    <div style={{ marginBottom: '0.875rem' }}>
                      <div style={{ color: palette.labelMuted, fontSize: '0.7rem', marginBottom: '0.375rem' }}>
                        DÍAS DE CLASE
                      </div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.375rem' }}>
                        {asignacion.dias.split(',').map((dia: string, idx: number) => (
                          <div key={idx} style={{
                            background: palette.blueChipBg,
                            color: palette.blueChipText,
                            padding: '0.25rem 0.5rem',
                            borderRadius: '0.375rem',
                            fontSize: '0.7rem',
                            fontWeight: '600',
                            border: `0.0625rem solid ${palette.blueChipBorder}`
                          }}>
                            {dia.trim()}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Ocupación */}
                    <div style={{
                      background: palette.softSurface,
                      borderRadius: '0.5rem',
                      padding: '0.625rem',
                      marginBottom: '0.75rem',
                      border: `0.0625rem solid ${palette.softSurfaceBorder}`
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.375rem' }}>
                        <div style={{ color: palette.labelMuted, fontSize: '0.7rem', fontWeight: '600' }}>
                          OCUPACIÓN
                        </div>
                        <div style={{ color: 'var(--admin-text-primary, #1f2937)', fontSize: '0.8rem', fontWeight: '700' }}>
                          {asignacion.estudiantes_matriculados}/{asignacion.capacidad_maxima}
                        </div>
                      </div>
                      <div style={{
                        width: '100%',
                        height: '0.375rem',
                        background: palette.occupancyTrack,
                        borderRadius: '0.625rem',
                        overflow: 'hidden'
                      }}>
                        <div style={{
                          width: `${asignacion.porcentaje_ocupacion}%`,
                          height: '100%',
                          background: asignacion.porcentaje_ocupacion > 80 ? 'linear-gradient(90deg, #ef4444, #dc2626)' :
                            asignacion.porcentaje_ocupacion > 50 ? 'linear-gradient(90deg, #f59e0b, #d97706)' :
                              'linear-gradient(90deg, #10b981, #059669)',
                          transition: 'width 0.3s ease'
                        }} />
                      </div>
                      <div style={{ color: palette.labelMuted, fontSize: '0.7rem', marginTop: '0.25rem', textAlign: 'right' }}>
                        {asignacion.porcentaje_ocupacion}% ocupado
                      </div>
                    </div>

                    {/* Botón */}
                    <button
                      onClick={() => handleEditAsignacion(asignacion)}
                      style={{
                        width: '100%',
                        padding: '0.625rem',
                        background: palette.tableActionBg,
                        border: `0.0625rem solid ${palette.tableActionBorder}`,
                        borderRadius: '0.5rem',
                        color: palette.tableActionText,
                        fontSize: '0.85rem',
                        fontWeight: '600',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.375rem',
                        transition: 'all 0.2s ease'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = pick('rgba(245, 158, 11, 0.22)', 'rgba(245, 158, 11, 0.3)');
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = palette.tableActionBg;
                      }}
                    >
                      <Edit size={isMobile ? 12 : 14} color={palette.tableActionText} />
                      Editar Asignación
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Vista Tabla Compacta */}
      {!loading && !error && viewMode === 'table' && (
        <div style={{
          background: palette.cardBg,
          backdropFilter: 'blur(1.25rem)',
          border: `0.0625rem solid ${palette.cardBorder}`,
          borderRadius: '1rem',
          overflow: 'hidden',
          marginBottom: '1.5rem',
          boxShadow: palette.cardShadow
        }}>
          {/* Indicador de scroll en móvil */}
          {isSmallScreen && (
            <div style={{
              background: pick('rgba(239, 68, 68, 0.08)', 'rgba(239, 68, 68, 0.1)'),
              border: `0.0625rem solid ${pick('rgba(239, 68, 68, 0.18)', 'rgba(239, 68, 68, 0.3)')}`,
              borderRadius: '0.5rem',
              padding: '0.5rem 0.75rem',
              margin: '0.75rem',
              color: pick('#b91c1c', '#ef4444'),
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

          {asignacionesPaginadas.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2.5rem 1.25rem', color: palette.emptyStateText }}>
              <MapPin size={isMobile ? 28 : 32} style={{ marginBottom: '0.75rem', opacity: 0.5 }} />
              <div style={{ fontSize: '0.95rem', fontWeight: '600' }}>No se encontraron asignaciones</div>
            </div>
          ) : (
            <div className="responsive-table-container" style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{
                    background: palette.tableHeaderBg,
                    borderBottom: `0.0625rem solid ${palette.tableHeaderBorder}`
                  }}>
                    <th style={{ padding: '0.625rem 0.75rem', textAlign: 'left', fontWeight: '600', color: 'var(--admin-text-primary, #1f2937)', fontSize: '0.75rem', letterSpacing: '0.02em', textTransform: 'uppercase' }}>Aula</th>
                    <th style={{ padding: '0.625rem 0.75rem', textAlign: 'left', fontWeight: '600', color: 'var(--admin-text-primary, #1f2937)', fontSize: '0.75rem', letterSpacing: '0.02em', textTransform: 'uppercase' }}>Curso</th>
                    <th style={{ padding: '0.625rem 0.75rem', textAlign: 'left', fontWeight: '600', color: 'var(--admin-text-primary, #1f2937)', fontSize: '0.75rem', letterSpacing: '0.02em', textTransform: 'uppercase' }}>Docente</th>
                    <th style={{ padding: '0.625rem 0.75rem', textAlign: 'left', fontWeight: '600', color: 'var(--admin-text-primary, #1f2937)', fontSize: '0.75rem', letterSpacing: '0.02em', textTransform: 'uppercase' }}>Horario</th>
                    <th style={{ padding: '0.625rem 0.75rem', textAlign: 'left', fontWeight: '600', color: 'var(--admin-text-primary, #1f2937)', fontSize: '0.75rem', letterSpacing: '0.02em', textTransform: 'uppercase' }}>Días</th>
                    <th style={{ padding: '0.625rem 0.75rem', textAlign: 'left', fontWeight: '600', color: 'var(--admin-text-primary, #1f2937)', fontSize: '0.75rem', letterSpacing: '0.02em', textTransform: 'uppercase' }}>Período</th>
                    <th style={{ padding: '0.625rem 0.75rem', textAlign: 'center', fontWeight: '600', color: 'var(--admin-text-primary, #1f2937)', fontSize: '0.75rem', letterSpacing: '0.02em', textTransform: 'uppercase' }}>Ocupación</th>
                    <th style={{ padding: '0.625rem 0.75rem', textAlign: 'center', fontWeight: '600', color: 'var(--admin-text-primary, #1f2937)', fontSize: '0.75rem', textTransform: 'uppercase' }}>Estado</th>
                    <th style={{ padding: '0.625rem 0.75rem', textAlign: 'center', fontWeight: '600', color: 'var(--admin-text-primary, #1f2937)', fontSize: '0.75rem', textTransform: 'uppercase' }}>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {asignacionesPaginadas.map((asignacion, index) => (
                    <tr
                      key={asignacion.id_asignacion}
                      style={{
                        borderBottom: `0.0625rem solid ${palette.tableDivider}`,
                        background: index % 2 === 0 ? palette.tableRowAlt : 'transparent',
                        transition: 'all 0.2s ease'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = palette.tableHover;
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = index % 2 === 0 ? palette.tableRowAlt : 'transparent';
                      }}
                    >
                      <td style={{ padding: '0.75rem' }}>
                        <div className="table-nombre-uppercase" style={{ color: 'var(--admin-text-primary, #1f2937)', fontWeight: '600', fontSize: '0.85rem', marginBottom: '0.15rem' }}>{asignacion.aula_nombre}</div>
                        <div style={{ color: palette.tableSubtext, fontSize: '0.7rem', letterSpacing: '0.015em' }}>{asignacion.codigo_aula}</div>
                      </td>
                      <td style={{ padding: '0.75rem' }}>
                        <div style={{ color: 'var(--admin-text-primary, #1f2937)', fontWeight: '600', fontSize: '0.8rem' }}>{asignacion.curso_nombre}</div>
                      </td>
                      <td style={{ padding: '0.75rem', color: palette.textSecondary, fontSize: '0.8rem' }}>
                        {asignacion.docente_nombres} {asignacion.docente_apellidos}
                      </td>
                      <td style={{ padding: '0.75rem' }}>
                        <div style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          background: palette.blueChipBg,
                          padding: '0.3rem 0.6rem',
                          borderRadius: '0.375rem',
                          border: `0.0625rem solid ${palette.blueChipBorder}`
                        }}>
                          <span style={{ color: palette.blueChipText, fontWeight: '600', fontSize: '0.75rem', letterSpacing: '0.015em' }}>
                            {asignacion.hora_inicio.substring(0, 5)} - {asignacion.hora_fin.substring(0, 5)}
                          </span>
                        </div>
                      </td>
                      <td style={{ padding: '0.75rem' }}>
                        <div style={{ display: 'flex', gap: '0.25rem', flexWrap: 'wrap' }}>
                          {asignacion.dias.split(',').map((dia, idx) => (
                            <span key={idx} style={{
                              background: palette.purpleChipBg,
                              color: palette.purpleChipText,
                              padding: '0.125rem 0.375rem',
                              borderRadius: '0.25rem',
                              fontSize: '0.65rem',
                              fontWeight: '600',
                              border: `0.0625rem solid ${palette.purpleChipBorder}`
                            }}>
                              {dia.trim()}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td style={{ padding: '0.75rem' }}>
                        <div style={{ color: 'var(--admin-text-primary, #1f2937)', fontSize: '0.75rem', fontWeight: '600' }}>
                          {formatearFecha(asignacion.fecha_inicio)}
                        </div>
                        <div style={{ color: palette.tableSubtext, fontSize: '0.7rem' }}>
                          {formatearFecha(asignacion.fecha_fin)}
                        </div>
                      </td>
                      <td style={{ padding: '0.75rem', textAlign: 'center' }}>
                        <div style={{ color: 'var(--admin-text-primary, #1f2937)', fontSize: '0.8rem', fontWeight: '700', marginBottom: '0.25rem' }}>
                          {asignacion.estudiantes_matriculados}/{asignacion.capacidad_maxima}
                        </div>
                        <div style={{ color: palette.tableSubtext, fontSize: '0.7rem' }}>
                          {asignacion.porcentaje_ocupacion}%
                        </div>
                      </td>
                      <td style={{ padding: '0.75rem', textAlign: 'center' }}>
                        <div style={{
                          background: getStatusStyles(asignacion.estado).background,
                          color: getStatusStyles(asignacion.estado).color,
                          padding: '0.25rem 0.75rem',
                          borderRadius: '0.625rem',
                          fontSize: '0.7rem',
                          fontWeight: '700',
                          display: 'inline-block',
                          textTransform: 'uppercase',
                          border: `0.0625rem solid ${getStatusStyles(asignacion.estado).border}`,
                          letterSpacing: '0.045em'
                        }}>
                          {asignacion.estado}
                        </div>
                      </td>
                      <td style={{ padding: '0.75rem', textAlign: 'center' }}>
                        <button
                          onClick={() => handleEditAsignacion(asignacion)}
                          style={{
                            padding: '0.375rem 0.625rem',
                            background: palette.tableActionBg,
                            border: `0.0625rem solid ${palette.tableActionBorder}`,
                            borderRadius: '0.375rem',
                            color: palette.tableActionText,
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.25rem',
                            fontSize: '0.75rem',
                            fontWeight: '600',
                            transition: 'all 0.2s ease'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = pick('rgba(245, 158, 11, 0.22)', 'rgba(245, 158, 11, 0.3)');
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = palette.tableActionBg;
                          }}
                        >
                          <Edit size={12} color={palette.tableActionText} />
                          Editar
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Paginación */}
      {!loading && asignacionesFiltradas.length > 0 && (
        <div className="pagination-container" style={{
          display: 'flex',
          flexDirection: isMobile ? 'column' : 'row',
          justifyContent: 'space-between',
          alignItems: isMobile ? 'stretch' : 'center',
          gap: isMobile ? '0.75rem' : '0',
          padding: isMobile ? '16px' : '20px 1.5rem',
          background: palette.paginationBg,
          border: `1px solid ${palette.paginationBorder}`,
          borderRadius: '1rem',
        }}>
          <div style={{
            color: palette.paginationText,
            fontSize: isMobile ? '0.8rem' : '0.9rem',
            textAlign: isMobile ? 'center' : 'left'
          }}>
            Página {page} de {totalPages} • Total: {totalCount} asignaciones
          </div>
          <div style={{
            display: 'flex',
            gap: '0.5rem',
            flexWrap: 'wrap',
            justifyContent: isMobile ? 'center' : 'flex-start'
          }}>
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: isMobile ? '4px' : '0.375rem',
                padding: isMobile ? '8px 0.75rem' : '8px 1rem',
                background: page === 1 ? palette.paginationButtonDisabledBg : palette.paginationButtonBg,
                border: `1px solid ${page === 1 ? palette.paginationButtonDisabledBg : palette.paginationButtonBorder}`,
                borderRadius: '0.625rem',
                color: page === 1 ? palette.paginationButtonDisabledText : palette.paginationButtonText,
                fontSize: isMobile ? '0.8rem' : '0.9rem',
                fontWeight: 600,
                cursor: page === 1 ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s ease',
                flex: isMobile ? '1' : 'initial'
              }}
            >
              <ChevronLeft size={isMobile ? 14 : 16} />
              {!isMobile && 'Anterior'}
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(pageNum => (
              <button
                key={pageNum}
                onClick={() => setPage(pageNum)}
                style={{
                  padding: isMobile ? '8px 0.625rem' : '8px 0.875rem',
                  background: page === pageNum ? 'linear-gradient(135deg, #ef4444, #dc2626)' : palette.paginationButtonBg,
                  border: page === pageNum ? '1px solid #ef4444' : `1px solid ${palette.paginationButtonBorder}`,
                  borderRadius: '0.625rem',
                  color: page === pageNum ? '#fff' : palette.paginationButtonText,
                  fontSize: isMobile ? '0.8rem' : '0.9rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  minWidth: isMobile ? '36px' : '2.5rem',
                }}
              >
                {pageNum}
              </button>
            ))}
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: isMobile ? '4px' : '0.375rem',
                padding: isMobile ? '8px 0.75rem' : '8px 1rem',
                background: page === totalPages ? palette.paginationButtonDisabledBg : palette.paginationButtonBg,
                border: `1px solid ${page === totalPages ? palette.paginationButtonDisabledBg : palette.paginationButtonBorder}`,
                borderRadius: '0.625rem',
                color: page === totalPages ? palette.paginationButtonDisabledText : palette.paginationButtonText,
                fontSize: isMobile ? '0.8rem' : '0.9rem',
                fontWeight: 600,
                cursor: page === totalPages ? 'not-allowed' : 'pointer',
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

      {/* Modal */}
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
            padding: '1rem',
            backdropFilter: 'blur(8px)',
            background: palette.modalOverlay,
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
              background: palette.modalSurface,
              border: `1px solid ${palette.modalBorder}`,
              borderRadius: '12px',
              width: '92vw',
              maxWidth: '700px',
              maxHeight: '85vh',
              margin: 'auto',
              padding: '1.5rem',
              color: palette.modalTextPrimary,
              boxShadow: palette.modalShadow,
              animation: 'scaleIn 0.3s ease-out',
              overflowY: 'auto'
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: isMobile ? 12 : 14,
                paddingBottom: isMobile ? 8 : 10,
                borderBottom: `1px solid ${palette.modalDivider}`,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <MapPin size={isMobile ? 18 : 20} style={{ color: RedColorPalette.primary }} />
                <h3 style={{ margin: 0, fontSize: isMobile ? '0.95rem' : '1.05rem', fontWeight: '600', letterSpacing: '-0.01em', color: palette.modalTextPrimary }}>
                  {modalType === 'create' ? 'Nueva Asignación' : 'Editar Asignación'}
                </h3>
              </div>
              <button
                onClick={() => setShowModal(false)}
                style={{
                  background: palette.modalCloseBg,
                  border: `1px solid ${palette.modalCloseBorder}`,
                  borderRadius: '8px',
                  padding: '6px',
                  color: palette.modalTextPrimary,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.2s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = palette.modalCloseHoverBg;
                  e.currentTarget.style.borderColor = palette.modalCloseHoverBorder;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = palette.modalCloseBg;
                  e.currentTarget.style.borderColor = String(palette.modalCloseBorder);
                }}
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'grid', gap: isMobile ? '1rem' : '1.25rem' }}>
              <div style={{
                display: 'grid',
                gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
                gap: isMobile ? '1rem' : '1rem'
              }}>
                <div>
                  <label style={{ color: palette.modalTextPrimary, fontSize: '0.8rem', fontWeight: '600', marginBottom: '0.5rem', display: 'block' }}>Aula</label>
                  <SearchableSelect
                    name="id_aula"
                    required
                    defaultValue={selectedAsignacion?.id_aula || ''}
                    placeholder="Buscar aula..."
                    options={aulas.filter(a => a.estado === 'activa').map(a => ({
                      value: a.id_aula,
                      label: `${a.nombre} - ${a.ubicacion || 'Sin ubicación'}`
                    }))}
                    darkMode={darkMode}
                  />
                </div>
                <div>
                  <label style={{ color: palette.modalTextPrimary, fontSize: '0.8rem', fontWeight: '600', marginBottom: '0.5rem', display: 'block' }}>Curso</label>
                  <SearchableSelect
                    name="id_curso"
                    required
                    defaultValue={selectedAsignacion?.id_curso || ''}
                    placeholder="Buscar curso..."
                    options={cursos.filter(c => {
                      // 1. Validar estado (whitelist)
                      const estadoValido = c.estado === 'activo' || c.estado === 'planificado';

                      // 2. Validar que no esté ya asignado (excepto si es la asignación que estamos editando)
                      const yaAsignado = asignaciones.some(a =>
                        a.id_curso === c.id_curso &&
                        a.estado === 'activa' && // Solo nos importa si la asignación está activa
                        (modalType === 'create' || a.id_asignacion !== selectedAsignacion?.id_asignacion)
                      );

                      return estadoValido && !yaAsignado;
                    }).map(c => {
                      const horario = c.horario ? ` - ${c.horario.charAt(0).toUpperCase() + c.horario.slice(1)}` : '';
                      return {
                        value: c.id_curso,
                        label: `${c.nombre}${horario} (${formatearFecha(c.fecha_inicio)} - ${formatearFecha(c.fecha_fin)})`
                      };
                    })}
                    darkMode={darkMode}
                  />
                </div>
              </div>

              <div>
                <label style={{ color: palette.modalTextPrimary, fontSize: '0.8rem', fontWeight: '600', marginBottom: '0.5rem', display: 'block' }}>
                  Docente {docentes.length > 0 && `(${docentes.filter(d => d.estado === 'activo').length} disponibles)`}
                </label>
                {docentes.length === 0 ? (
                  <div style={{
                    padding: '0.75rem',
                    background: 'rgba(239, 68, 68, 0.1)',
                    border: '0.0625rem solid rgba(239, 68, 68, 0.3)',
                    borderRadius: '0.5rem',
                    color: '#ef4444',
                    fontSize: '0.8rem'
                  }}>
                    No hay docentes disponibles. Por favor, cree docentes primero.
                  </div>
                ) : (
                  <SearchableSelect
                    name="id_docente"
                    required
                    defaultValue={selectedAsignacion?.id_docente || ''}
                    placeholder="Buscar docente..."
                    options={docentes.filter(d => d.estado === 'activo').map(d => ({
                      value: d.id_docente,
                      label: `${d.nombres} ${d.apellidos}`
                    }))}
                    darkMode={darkMode}
                  />
                )}
              </div>

              <div>
                <label style={{ color: palette.modalTextPrimary, fontSize: '0.8rem', fontWeight: '600', marginBottom: '0.75rem', display: 'block' }}>Días de Clase</label>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(3, 1fr)',
                  gap: '0.5rem'
                }}>
                  {diasSemana.map(dia => {
                    const diasArray = selectedAsignacion?.dias?.split(',') || [];
                    return (
                      <label key={dia} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: palette.modalTextPrimary, fontSize: '0.8rem' }}>
                        <input
                          type="checkbox" name="dias" value={dia}
                          defaultChecked={diasArray.includes(dia)}
                          style={{ accentColor: '#ef4444' }}
                        />
                        {dia}
                      </label>
                    );
                  })}
                </div>
              </div>

              <div style={{
                display: 'grid',
                gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
                gap: isMobile ? '16px' : '1rem'
              }}>
                <div>
                  <label style={{ color: palette.modalTextPrimary, fontSize: '0.8rem', fontWeight: '600', marginBottom: '0.5rem', display: 'block' }}>Hora Inicio</label>
                  <input
                    type="time" name="hora_inicio" required
                    defaultValue={selectedAsignacion?.hora_inicio?.substring(0, 5) || ''}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      background: palette.modalInputBg,
                      border: `0.0625rem solid ${palette.modalInputBorder}`,
                      borderRadius: '0.5rem',
                      color: palette.modalInputText,
                      fontSize: '0.8rem'
                    }}
                  />
                </div>
                <div>
                  <label style={{ color: palette.modalTextPrimary, fontSize: '0.8rem', fontWeight: '600', marginBottom: '0.5rem', display: 'block' }}>Hora Fin</label>
                  <input
                    type="time" name="hora_fin" required
                    defaultValue={selectedAsignacion?.hora_fin?.substring(0, 5) || ''}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      background: palette.modalInputBg,
                      border: `0.0625rem solid ${palette.modalInputBorder}`,
                      borderRadius: '0.5rem',
                      color: palette.modalInputText,
                      fontSize: '0.8rem'
                    }}
                  />
                </div>
              </div>

              <div>
                <label style={{ color: palette.modalTextPrimary, fontSize: '0.8rem', fontWeight: '600', marginBottom: '0.5rem', display: 'block' }}>Observaciones (opcional)</label>
                <textarea
                  name="observaciones"
                  rows={3}
                  defaultValue={selectedAsignacion?.observaciones || ''}
                  placeholder="Notas adicionales sobre la asignación..."
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    background: palette.modalInputBg,
                    border: `0.0625rem solid ${palette.modalInputBorder}`,
                    borderRadius: '0.5rem',
                    color: palette.modalInputText,
                    fontSize: '0.8rem',
                    resize: 'vertical'
                  }}
                />
              </div>

              <div style={{
                display: 'flex',
                flexDirection: isMobile ? 'column-reverse' : 'row',
                gap: '0.75rem',
                justifyContent: 'flex-end',
                marginTop: isMobile ? '1.25rem' : '1.5rem'
              }}>
                <button
                  type="button" onClick={() => setShowModal(false)}
                  style={{
                    padding: '0.75rem 1.5rem',
                    background: palette.modalNeutralButtonBg,
                    border: `0.0625rem solid ${palette.modalNeutralButtonBorder}`,
                    borderRadius: '0.5rem',
                    color: palette.modalNeutralButtonText,
                    cursor: 'pointer',
                    width: isMobile ? '100%' : 'auto',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = pick('rgba(148, 163, 184, 0.22)', 'rgba(255, 255, 255, 0.12)');
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = palette.modalNeutralButtonBg;
                  }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                    padding: '0.75rem 1.5rem', background: saving ? 'rgba(156, 163, 175, 0.5)' : 'linear-gradient(135deg, #ef4444, #dc2626)',
                    border: 'none', borderRadius: '0.5rem', color: '#fff', fontWeight: '600',
                    cursor: saving ? 'not-allowed' : 'pointer',
                    boxShadow: '0 0.25rem 0.75rem rgba(239, 68, 68, 0.3)',
                    opacity: saving ? 0.7 : 1,
                    width: isMobile ? '100%' : 'auto'
                  }}
                >
                  <Save size={16} />
                  {saving ? 'Guardando...' : (modalType === 'create' ? 'Crear Asignación' : 'Guardar Cambios')}
                </button>
              </div>
            </form>
          </div>
          {/* Animaciones CSS */}
          <style>{`
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
    </div>
  );
};

export default AsignacionAula;



