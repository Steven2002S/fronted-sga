import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { AlertCircle, CheckCircle, Eye, XCircle, CreditCard, Gift, Calendar, Clock, FileText, Sparkles } from 'lucide-react';
import { showToast } from '../../config/toastConfig';
import ModalPagoMensualidad from './ModalPagoMensualidad';
import { useBreakpoints } from '../../hooks/useMediaQuery';
import { useSocket } from '../../hooks/useSocket';
import '../../styles/responsive.css';

const API_BASE = (import.meta as any).env?.VITE_API_URL || 'http://localhost:3000';

interface CursoConPagos {
  id_matricula: number;
  codigo_matricula: string;
  curso_nombre: string;
  codigo_curso: string;
  tipo_curso_nombre: string;
  total_cuotas: number;
  cuotas_pendientes: number;
  cuotas_vencidas: number;
  proxima_fecha_vencimiento: string;
  monto_pendiente: number;
  monto_matricula: number;
  es_curso_promocional: boolean;
  id_promocion?: number;
  nombre_promocion?: string;
  meses_gratis?: number;
  fecha_inicio_cobro?: string;
  meses_gratis_aplicados?: number;
  estado_pago?: 'pendiente' | 'al-dia';
  decision_estudiante?: 'pendiente' | 'continuar' | 'rechazar';
  fecha_decision?: string | null;
}

interface Cuota {
  id_pago: number;
  numero_cuota: number;
  monto: number;
  fecha_vencimiento: string;
  fecha_pago: string | null;
  numero_comprobante: string | null;
  estado: 'pendiente' | 'pagado' | 'verificado' | 'vencido';
  observaciones: string | null;
  curso_nombre: string;
  tipo_curso_nombre: string;
  modalidad_pago?: 'mensual' | 'clases';
  numero_clases?: number;
  precio_por_clase?: number;
  meses_duracion?: number;
}

interface ResumenPagos {
  total_cuotas: number;
  cuotas_pagadas: number;
  cuotas_pendientes: number;
  cuotas_vencidas: number;
  cuotas_verificadas: number;
  monto_total: number;
  monto_pagado: number;
  monto_pendiente: number;
}

interface PagosMenualesProps {
  darkMode?: boolean;
}

const PagosMenuales: React.FC<PagosMenualesProps> = ({ darkMode = false }) => {
  const { isMobile } = useBreakpoints();
  const [cursosConPagos, setCursosConPagos] = useState<CursoConPagos[]>([]);
  const [resumenPagos, setResumenPagos] = useState<ResumenPagos | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userId, setUserId] = useState<number | undefined>(undefined);
  const [cursosHistoricos, setCursosHistoricos] = useState<CursoConPagos[]>([]);

  const storageKey = useMemo(() => userId ? `pagos-cursos-historicos-${userId}` : 'pagos-cursos-historicos', [userId]);

  // Estados para expandir cuotas inline
  const [cursoExpandido, setCursoExpandido] = useState<number | null>(null);
  const [showPagoModal, setShowPagoModal] = useState(false);
  const [selectedCuota, setSelectedCuota] = useState<Cuota | null>(null);
  const [cuotasPorCurso, setCuotasPorCurso] = useState<{ [key: number]: Cuota[] }>({});
  const [loadingCuotas, setLoadingCuotas] = useState<{ [key: number]: boolean }>({});
  const [decisionLoading, setDecisionLoading] = useState<number | null>(null);
  const [cursoConfirmacion, setCursoConfirmacion] = useState<CursoConPagos | null>(null);

  // Obtener userId del token al montar
  useEffect(() => {
    const token = sessionStorage.getItem('auth_token');
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        setUserId(payload.id_usuario);
      } catch (error) {
        console.error('Error decodificando token:', error);
      }
    }
  }, []);

  useSocket({
    'pago_verificado_estudiante': (data: any) => {
      showToast.success(`Tu pago de la cuota #${data.numero_cuota} ha sido verificado!`, darkMode);
      loadData();
      // Recargar cuotas si el curso está expandido
      if (cursoExpandido) {
        loadCuotasMatricula(cursoExpandido);
      }
    },
    'pago_verificado': (data: any) => {
      showToast.success('Tu pago ha sido verificado!', darkMode);
      loadData();
      // Recargar cuotas si el curso está expandido
      if (cursoExpandido) {
        loadCuotasMatricula(cursoExpandido);
      }
    },
    'pago_rechazado': (data: any) => {
      showToast.error(`Pago rechazado: ${data.observaciones}`, darkMode);
      loadData();
      // Recargar cuotas si el curso está expandido
      if (cursoExpandido) {
        loadCuotasMatricula(cursoExpandido);
      }
    }
  }, userId); // <-- Pasar userId como segundo parámetro

  useEffect(() => {
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        setCursosHistoricos(JSON.parse(stored));
      } else {
        setCursosHistoricos([]);
      }
    } catch (error) {
      console.error('Error cargando historial de cursos:', error);
      setCursosHistoricos([]);
    }
  }, [storageKey]);

  const loadCuotasMatricula = useCallback(async (id_matricula: number) => {
    try {
      setLoadingCuotas(prev => ({ ...prev, [id_matricula]: true }));
      const token = sessionStorage.getItem('auth_token');

      if (!token) {
        throw new Error('No hay token de autenticación');
      }

      const response = await fetch(`${API_BASE}/api/pagos-mensuales/cuotas/${id_matricula}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) {
        throw new Error('Error cargando cuotas');
      }

      const cuotas = await response.json();
      setCuotasPorCurso(prev => ({ ...prev, [id_matricula]: cuotas }));
    } catch (error) {
      console.error('Error cargando cuotas:', error);
      showToast.error('Error cargando cuotas', darkMode);
    } finally {
      setLoadingCuotas(prev => ({ ...prev, [id_matricula]: false }));
    }
  }, [darkMode]);

  const handleToggleCuotas = async (curso: CursoConPagos) => {
    if (cursoExpandido === curso.id_matricula) {
      // Si ya está expandido, colapsar
      setCursoExpandido(null);
    } else {
      // Expandir y cargar cuotas
      setCursoExpandido(curso.id_matricula);
      if (!cuotasPorCurso[curso.id_matricula]) {
        await loadCuotasMatricula(curso.id_matricula);
      }
    }
  };

  const handlePagarCuota = (cuota: Cuota) => {
    setSelectedCuota(cuota);
    setShowPagoModal(true);
  };

  const handleDecisionPromocion = async (curso: CursoConPagos, decision: 'continuar' | 'rechazar') => {
    try {
      setDecisionLoading(curso.id_matricula);
      const token = sessionStorage.getItem('auth_token');
      if (!token) {
        throw new Error('Tu sesión ha expirado, vuelve a iniciar sesión.');
      }

      const response = await fetch(`${API_BASE}/api/pagos-mensuales/cursos-promocionales/${curso.id_matricula}/decision`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ decision })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.error || 'No pudimos registrar tu decisión');
      }

      setCursosConPagos(prev => prev.map(item =>
        item.id_matricula === curso.id_matricula
          ? {
            ...item,
            decision_estudiante: data.decision,
            fecha_decision: data.fecha_decision
          }
          : item
      ));

      const mensaje = decision === 'continuar'
        ? '¡Perfecto! Deberás pagar las mensualidades del curso cuando termine tu beneficio promocional.'
        : 'Entendido. El curso se detendrá cuando finalice el período gratuito.';
      showToast.success(mensaje, darkMode);
    } catch (error) {
      showToast.error(error instanceof Error ? error.message : 'No pudimos guardar tu elección', darkMode);
    } finally {
      setDecisionLoading(null);
    }
  };

  const solicitarConfirmacionRechazo = (curso: CursoConPagos) => {
    setCursoConfirmacion(curso);
  };

  const confirmarRechazoPromocion = async () => {
    if (!cursoConfirmacion) return;
    await handleDecisionPromocion(cursoConfirmacion, 'rechazar');
    setCursoConfirmacion(null);
  };

  const cerrarModalConfirmacion = () => setCursoConfirmacion(null);

  const actualizarHistorialCursos = useCallback((cursosPendientes: CursoConPagos[]) => {
    setCursosHistoricos(prev => {
      const map = new Map<number, CursoConPagos>();
      prev.forEach(curso => map.set(curso.id_matricula, curso));
      cursosPendientes.forEach(curso => {
        map.set(curso.id_matricula, { ...curso, estado_pago: 'pendiente' });
      });
      map.forEach((curso, id) => {
        if (!cursosPendientes.some(c => c.id_matricula === id)) {
          map.set(id, {
            ...curso,
            estado_pago: 'al-dia',
            cuotas_pendientes: 0,
            cuotas_vencidas: 0,
            monto_pendiente: 0
          });
        }
      });
      const updated = Array.from(map.values()).sort((a, b) => b.id_matricula - a.id_matricula);
      try {
        localStorage.setItem(storageKey, JSON.stringify(updated));
      } catch (error) {
        console.warn('No se pudo guardar historial de cursos:', error);
      }
      return updated;
    });
  }, [storageKey]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = sessionStorage.getItem('auth_token');

      if (!token) {
        throw new Error('No hay token de autenticación');
      }

      // Cargar cursos con pagos pendientes
      const resCursos = await fetch(`${API_BASE}/api/pagos-mensuales/cursos-pendientes`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!resCursos.ok) {
        throw new Error('Error cargando cursos');
      }

      const cursos = await resCursos.json();
      setCursosConPagos(cursos);
      actualizarHistorialCursos(cursos);

      // Cargar resumen de pagos
      const resResumen = await fetch(`${API_BASE}/api/pagos-mensuales/resumen`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!resResumen.ok) {
        throw new Error('Error cargando resumen');
      }

      const resumen = await resResumen.json();
      setResumenPagos(resumen);

    } catch (error) {
      console.error('Error cargando datos:', error);
      setError(error instanceof Error ? error.message : 'Error cargando datos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const formatearMonto = (monto: number | string) => {
    const montoNumerico = typeof monto === 'string' ? parseFloat(monto) : monto;
    return `$${(montoNumerico || 0).toFixed(2)}`;
  };

  const cursosAlDia = useMemo(() => {
    const pendientesIds = new Set(cursosConPagos.map(curso => curso.id_matricula));
    return cursosHistoricos.filter(curso => curso.estado_pago === 'al-dia' && !pendientesIds.has(curso.id_matricula));
  }, [cursosConPagos, cursosHistoricos]);

  useEffect(() => {
    cursosAlDia.forEach(curso => {
      if (!cuotasPorCurso[curso.id_matricula] && !loadingCuotas[curso.id_matricula]) {
        loadCuotasMatricula(curso.id_matricula);
      }
    });
  }, [cursosAlDia, cuotasPorCurso, loadingCuotas, loadCuotasMatricula]);

  const obtenerMontoTotalPagado = useCallback((curso: CursoConPagos) => {
    const cuotas = cuotasPorCurso[curso.id_matricula];
    if (cuotas?.length) {
      return cuotas.reduce((total, cuota) => total + (Number(cuota.monto) || 0), 0);
    }
    if (curso.es_curso_promocional) {
      return 0;
    }
    return Number(curso.monto_matricula || 0);
  }, [cuotasPorCurso]);

  const renderDetalleCuotas = (curso: CursoConPagos) => {
    if (cursoExpandido !== curso.id_matricula) {
      return null;
    }

    // Filtrar cuotas según la decisión del estudiante en cursos promocionales
    let cuotasFiltradas = cuotasPorCurso[curso.id_matricula] || [];

    if (curso.es_curso_promocional && curso.decision_estudiante === 'rechazar' && curso.meses_gratis) {
      // Solo mostrar las cuotas del período gratuito (basadas en meses_gratis)
      cuotasFiltradas = cuotasFiltradas.filter(cuota => cuota.numero_cuota <= curso.meses_gratis!);
    }

    return (
      <div style={{
        marginTop: '0.75em',
        padding: '0.875em 1em',
        backgroundColor: darkMode ? 'rgba(255,255,255,0.05)' : '#f9fafb',
        borderRadius: '0.75em',
        border: darkMode ? '1px solid rgba(255,255,255,0.1)' : '1px solid #e5e7eb'
      }}>
        <h4 style={{
          fontSize: '0.9rem',
          fontWeight: '700',
          marginBottom: '0.75em',
          color: darkMode ? '#fff' : '#1f2937',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5em'
        }}>
          <FileText size={18} strokeWidth={2.5} color={darkMode ? '#fbbf24' : '#f59e0b'} />
          Cuotas de {curso.curso_nombre}
          {!!curso.es_curso_promocional && curso.decision_estudiante === 'rechazar' && (
            <span style={{
              fontSize: '0.7rem',
              color: darkMode ? 'rgba(255,255,255,0.6)' : '#6b7280',
              fontWeight: '400'
            }}>
              (Solo período gratuito)
            </span>
          )}
        </h4>

        {loadingCuotas[curso.id_matricula] ? (
          <div style={{
            textAlign: 'center',
            padding: '1.5em',
            color: darkMode ? 'rgba(255,255,255,0.7)' : '#6b7280'
          }}>
            Cargando cuotas...
          </div>
        ) : cuotasFiltradas.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '1.5em',
            color: darkMode ? 'rgba(255,255,255,0.7)' : '#6b7280'
          }}>
            <CheckCircle size={32} style={{ color: '#10b981', marginBottom: '0.5em' }} />
            <div>No hay cuotas registradas</div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5em' }}>
            {cuotasFiltradas.map((cuota) => (
              <div
                key={cuota.id_pago}
                style={{
                  backgroundColor: darkMode ? 'rgba(255,255,255,0.08)' : '#ffffff',
                  border: darkMode ? '0.0625rem solid rgba(255,255,255,0.15)' : '0.0625rem solid #e5e7eb',
                  borderRadius: '0.5em',
                  padding: '0.75em',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '0.5em'
                }}>
                <div style={{ flex: 1, minWidth: '180px' }}>
                  <div style={{
                    fontSize: '0.85rem',
                    fontWeight: '700',
                    color: darkMode ? '#fff' : '#1f2937',
                    marginBottom: '0.25em'
                  }}>
                    Cuota #{cuota.numero_cuota}
                    {cuota.modalidad_pago === 'clases' && (
                      <span style={{
                        fontSize: '0.75rem',
                        color: darkMode ? 'rgba(255,255,255,0.6)' : '#6b7280',
                        fontWeight: '400'
                      }}>
                        {' '}• Clase {cuota.numero_cuota} de {cuota.numero_clases}
                      </span>
                    )}
                  </div>
                  <div style={{
                    fontSize: '0.75rem',
                    color: darkMode ? 'rgba(255,255,255,0.7)' : '#6b7280'
                  }}>
                    Vence: {formatearFecha(cuota.fecha_vencimiento)}
                  </div>
                </div>

                <div style={{
                  fontSize: '0.9rem',
                  fontWeight: '800',
                  color: darkMode ? '#fff' : '#1f2937'
                }}>
                  {formatearMonto(cuota.monto)}
                </div>

                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5em'
                }}>
                  <span
                    style={{
                      padding: '0.25em 0.625em',
                      borderRadius: '0.375em',
                      fontSize: '0.75rem',
                      fontWeight: '700',
                      backgroundColor: getEstadoColor(cuota.estado) + '20',
                      color: getEstadoColor(cuota.estado)
                    }}
                  >
                    {getEstadoTexto(cuota.estado)}
                  </span>

                  {cuota.estado === 'pendiente' && (
                    <button
                      onClick={() => handlePagarCuota(cuota)}
                      style={{
                        padding: '0.5em 0.875em',
                        background: 'linear-gradient(135deg, #10b981, #059669)',
                        color: 'white',
                        border: 'none',
                        borderRadius: '0.5em',
                        fontSize: '0.75rem',
                        fontWeight: '700',
                        cursor: 'pointer',
                        whiteSpace: 'nowrap',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.375em',
                        boxShadow: '0 2px 6px rgba(16, 185, 129, 0.3)',
                        transition: 'all 0.2s ease'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'translateY(-2px)';
                        e.currentTarget.style.boxShadow = '0 4px 10px rgba(16, 185, 129, 0.4)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = '0 2px 6px rgba(16, 185, 129, 0.3)';
                      }}
                    >
                      <CreditCard size={14} strokeWidth={2.5} color="#fff" />
                      Pagar
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  const formatearFecha = (fechaString: string) => {
    const fecha = new Date(fechaString);
    return fecha.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });
  };

  const getEstadoColor = (estado: string) => {
    switch (estado) {
      case 'pagado': return '#10b981';
      case 'verificado': return '#3b82f6';
      case 'vencido': return '#ef4444';
      default: return '#f59e0b';
    }
  };

  const getEstadoTexto = (estado: string) => {
    switch (estado) {
      case 'pagado': return 'En Verificación';
      case 'verificado': return 'Verificado';
      case 'vencido': return 'Vencido';
      default: return 'Pendiente';
    }
  };

  if (loading) {
    return (
      <div style={{
        padding: '2.5em',
        textAlign: 'center',
        color: '#6b7280'
      }}>
        <div style={{ fontSize: '1.1rem' }}>Cargando pagos mensuales...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div
        style={{
          minHeight: '100vh',
          backgroundColor: '#f9fafb',
          color: '#1f2937',
          padding: '1.25em'
        }}
      >
        <AlertCircle size={48} style={{ marginBottom: '1em', color: '#ef4444' }} />
        <div style={{ fontSize: '1.1rem', marginBottom: '0.5em' }}>Error al cargar datos</div>
        <div style={{ fontSize: '0.9rem', opacity: 0.8 }}>{error}</div>
        <button
          onClick={loadData}
          style={{
            marginTop: '1em',
            padding: '0.5em 1em',
            backgroundColor: '#3b82f6',
            color: 'white',
            border: 'none',
            borderRadius: '0.375em',
            cursor: 'pointer'
          }}
        >
          Reintentar
        </button>
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: '100%',
        backgroundColor: 'transparent',
        color: darkMode ? '#fff' : '#1f2937',
        padding: '0',
        paddingBottom: '1.5rem',
        paddingTop: '0.75rem'
      }}
    >
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
            <CreditCard size={24} strokeWidth={2.5} color="#fff" />
          </div>
          <div>
            <h1 style={{ fontSize: isMobile ? '1.1rem' : '1.25rem', fontWeight: '800', margin: 0, color: darkMode ? '#fff' : '#1f2937' }}>
              Gestión de Pagos
            </h1>
            <p style={{ fontSize: isMobile ? '0.7rem' : '0.75rem', color: darkMode ? 'rgba(255,255,255,0.7)' : '#6b7280', margin: 0 }}>
              Gestiona y paga las mensualidades de tus cursos de forma rápida y segura
            </p>
          </div>
        </div>
      </div>

      {/* Info compacta */}
      <div style={{
        background: darkMode ? 'rgba(255,255,255,0.05)' : '#ffffff',
        border: darkMode ? '0.0625rem solid rgba(255,255,255,0.15)' : '0.0625rem solid #e5e7eb',
        borderRadius: '0.625em',
        padding: '0.75rem',
        marginBottom: '0.75rem',
        display: 'grid',
        gridTemplateColumns: '1fr auto',
        alignItems: 'center',
        gap: '0.375em'
      }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5em', alignItems: 'center', fontSize: '0.78rem' }}>
          <span style={{ fontWeight: 700, color: darkMode ? '#fff' : '#1f2937' }}>Disponible</span>
          <span style={{ color: darkMode ? 'rgba(255,255,255,0.7)' : '#6b7280' }}>Pagos online seguros</span>
          <span style={{ color: darkMode ? 'rgba(255,255,255,0.7)' : '#6b7280' }}>Historial de pagos</span>
          <span style={{ color: darkMode ? 'rgba(255,255,255,0.7)' : '#6b7280' }}>Múltiples métodos de pago</span>
          <span style={{ color: darkMode ? 'rgba(255,255,255,0.7)' : '#6b7280' }}>24/7 Online</span>
          <span style={{ color: darkMode ? '#fbbf24' : '#b45309' }}>pagos@sgabelleza.edu.ec</span>
        </div>
        <button
          onClick={() => {
            const el = document.getElementById('cursos-pagos');
            if (el) el.scrollIntoView({ behavior: 'smooth' });
          }}
          style={{
            background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
            color: '#fff',
            border: 'none',
            borderRadius: '0.5em',
            padding: '0.375em 0.625em',
            fontSize: '0.8rem',
            fontWeight: 700,
            cursor: 'pointer'
          }}
        >
          Gestionar Pagos
        </button>
      </div>

      {/* Resumen de pagos */}
      {resumenPagos && (
        <div className="responsive-grid-4" style={{
          gap: '0.5rem',
          marginBottom: '0.75rem'
        }}>
          <div style={{
            backgroundColor: darkMode ? 'rgba(255,255,255,0.08)' : '#ffffff',
            border: darkMode ? '0.0625rem solid rgba(255,255,255,0.2)' : '0.0625rem solid #e5e7eb',
            borderRadius: '0.5em',
            padding: '0.5rem',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '1.1rem', fontWeight: '700', color: '#3b82f6', marginBottom: '0.25rem' }}>
              {resumenPagos.total_cuotas}
            </div>
            <div style={{ fontSize: '0.7rem', color: darkMode ? 'rgba(255,255,255,0.7)' : '#6b7280' }}>Total Cuotas</div>
          </div>

          <div style={{
            backgroundColor: darkMode ? 'rgba(255,255,255,0.08)' : '#ffffff',
            border: darkMode ? '0.0625rem solid rgba(255,255,255,0.2)' : '0.0625rem solid #e5e7eb',
            borderRadius: '0.5em',
            padding: '0.5rem',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '1.1rem', fontWeight: '700', color: '#10b981', marginBottom: '0.25rem' }}>
              {resumenPagos.cuotas_verificadas}
            </div>
            <div style={{ fontSize: '0.7rem', color: darkMode ? 'rgba(255,255,255,0.7)' : '#6b7280' }}>Verificadas</div>
          </div>

          <div style={{
            backgroundColor: darkMode ? 'rgba(255,255,255,0.08)' : '#ffffff',
            border: darkMode ? '0.0625rem solid rgba(255,255,255,0.2)' : '0.0625rem solid #e5e7eb',
            borderRadius: '0.5em',
            padding: '0.5rem',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '1.1rem', fontWeight: '700', color: '#f59e0b', marginBottom: '0.25rem' }}>
              {resumenPagos.cuotas_pendientes}
            </div>
            <div style={{ fontSize: '0.7rem', color: darkMode ? 'rgba(255,255,255,0.7)' : '#6b7280' }}>Pendientes</div>
          </div>

          <div style={{
            backgroundColor: darkMode ? 'rgba(255,255,255,0.08)' : '#ffffff',
            border: darkMode ? '0.0625rem solid rgba(255,255,255,0.2)' : '0.0625rem solid #e5e7eb',
            borderRadius: '0.5em',
            padding: '0.5rem',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '1rem', fontWeight: '700', color: '#ef4444', marginBottom: '0.25rem' }}>
              {formatearMonto(resumenPagos.monto_pendiente)}
            </div>
            <div style={{ fontSize: '0.7rem', color: darkMode ? 'rgba(255,255,255,0.7)' : '#6b7280' }}>Monto Pendiente</div>
          </div>
        </div>
      )}

      {/* Cursos con pagos pendientes */}
      <div id="cursos-pagos" style={{ marginBottom: '0.75em' }}>
        <h2 style={{ fontSize: isMobile ? '0.95rem' : '1.05rem', fontWeight: '700', marginBottom: '0.75em', color: darkMode ? '#fff' : '#1f2937' }}>
          Cursos con Pagos Pendientes
        </h2>

        {cursosConPagos.length === 0 ? (
          <div style={{
            backgroundColor: darkMode ? 'rgba(255,255,255,0.1)' : '#ffffff',
            border: darkMode ? '0.0625rem solid rgba(255,255,255,0.2)' : '0.0625rem solid #e5e7eb',
            borderRadius: '0.75em',
            padding: '2.5em',
            textAlign: 'center'
          }}>
            <CheckCircle size={48} style={{ color: '#10b981', marginBottom: '1em' }} />
            <div style={{ fontSize: '1.1rem', color: darkMode ? '#fff' : '#1f2937', marginBottom: '0.5em' }}>
              ¡Excelente! No tienes pagos pendientes
            </div>
            <div style={{ fontSize: '0.9rem', color: darkMode ? 'rgba(255,255,255,0.7)' : '#6b7280' }}>
              Todas tus mensualidades están al día
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5em' }}>
            {cursosConPagos
              .filter(curso => curso.curso_nombre.toString() !== "0" && curso.curso_nombre.toString().trim() !== "")
              .map((curso) => {
                const fechaInicioCobro = curso.fecha_inicio_cobro ? new Date(curso.fecha_inicio_cobro) : null;
                const promocionTerminada = Boolean(fechaInicioCobro && fechaInicioCobro.getTime() <= Date.now());
                const decisionTomada = Boolean(curso.es_curso_promocional && curso.decision_estudiante && curso.decision_estudiante !== 'pendiente');
                const decisionStatus = curso.decision_estudiante === 'continuar'
                  ? {
                    texto: 'Continuarás una vez termine tu beneficio',
                    color: darkMode ? '#6ee7b7' : '#047857',
                    bg: darkMode ? 'rgba(16, 185, 129, 0.12)' : '#d1fae5'
                  }
                  : curso.decision_estudiante === 'rechazar'
                    ? {
                      texto: 'No continuarás después del período gratuito',
                      color: darkMode ? '#fecaca' : '#b91c1c',
                      bg: darkMode ? 'rgba(239, 68, 68, 0.12)' : '#fee2e2'
                    }
                    : null;
                const isDecisionLoading = decisionLoading === curso.id_matricula;

                return (
                  <div
                    key={curso.id_matricula}
                    style={{
                      backgroundColor: darkMode ? 'rgba(255,255,255,0.05)' : '#ffffff',
                      border: `1px solid ${darkMode ? 'rgba(251, 191, 36, 0.15)' : 'rgba(251, 191, 36, 0.2)'}`,
                      borderRadius: '1rem',
                      padding: '1.15em 1.25em',
                      backdropFilter: 'blur(10px)',
                      boxShadow: darkMode
                        ? '0 4px 20px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(251, 191, 36, 0.1)'
                        : '0 4px 20px rgba(0, 0, 0, 0.06), 0 0 0 1px rgba(251, 191, 36, 0.1)',
                      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', margin: 0, marginBottom: '0.75em' }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5em', flexWrap: 'wrap' }}>
                          <h3 style={{ fontSize: '0.95rem', fontWeight: '800', margin: 0, color: darkMode ? '#fff' : '#1f2937' }}>
                            {curso.curso_nombre.toString().replace(/[\s0]+$/, '').trim()}
                          </h3>
                          {!!curso.es_curso_promocional && (
                            <span style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.375em',
                              padding: '0.25em 0.625em',
                              background: 'linear-gradient(135deg, #10b981, #059669)',
                              color: 'white',
                              borderRadius: '0.5em',
                              fontSize: '0.7rem',
                              fontWeight: '700',
                              boxShadow: '0 2px 8px rgba(16, 185, 129, 0.3)'
                            }}>
                              <Gift size={12} strokeWidth={2.5} />
                              CURSO PROMOCIONAL
                            </span>
                          )}
                          {!!curso.es_curso_promocional && decisionStatus && (
                            <span style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.3em',
                              padding: '0.25em 0.55em',
                              background: decisionStatus.bg,
                              color: decisionStatus.color,
                              borderRadius: '999px',
                              fontSize: '0.68rem',
                              fontWeight: '700'
                            }}>
                              <CheckCircle size={13} strokeWidth={2.5} color={decisionStatus.color} />
                              {decisionStatus.texto}
                            </span>
                          )}
                        </div>
                        <div style={{ fontSize: '0.78rem', color: darkMode ? 'rgba(255,255,255,0.7)' : '#6b7280', marginTop: '0.25em' }}>
                          {curso.tipo_curso_nombre} {!curso.es_curso_promocional && curso.codigo_matricula && curso.codigo_matricula.toString() !== "0" && `• ${curso.codigo_matricula.toString().replace(/\s*0\s*$/, '')}`}
                        </div>
                        {!!curso.es_curso_promocional && curso.nombre_promocion && (
                          <div style={{
                            fontSize: '0.75rem',
                            color: '#10b981',
                            fontWeight: '600',
                            marginTop: '0.25em',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.375em',
                            flexWrap: 'wrap'
                          }}>
                            <Sparkles size={14} strokeWidth={2.5} />
                            <span>{curso.nombre_promocion} - {curso.meses_gratis} {curso.meses_gratis === 1 ? 'mes' : 'meses'} GRATIS</span>
                            {fechaInicioCobro && (
                              <span style={{ color: darkMode ? 'rgba(255,255,255,0.7)' : '#6b7280', fontWeight: '400' }}>
                                • Inicio de cobros: {fechaInicioCobro.toLocaleDateString('es-ES', { year: 'numeric', month: 'long' })}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                      <button
                        onClick={() => handleToggleCuotas(curso)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5em',
                          padding: '0.5em 0.875em',
                          background: cursoExpandido === curso.id_matricula
                            ? 'linear-gradient(135deg, #ef4444, #dc2626)'
                            : 'linear-gradient(135deg, #fbbf24, #f59e0b)',
                          color: 'white',
                          border: 'none',
                          borderRadius: '0.625em',
                          fontSize: '0.8rem',
                          fontWeight: '700',
                          cursor: 'pointer',
                          flexShrink: 0,
                          boxShadow: cursoExpandido === curso.id_matricula
                            ? '0 2px 8px rgba(239, 68, 68, 0.3)'
                            : '0 2px 8px rgba(251, 191, 36, 0.3)',
                          transition: 'all 0.2s ease'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.transform = 'translateY(-2px)';
                          e.currentTarget.style.boxShadow = cursoExpandido === curso.id_matricula
                            ? '0 4px 12px rgba(239, 68, 68, 0.4)'
                            : '0 4px 12px rgba(251, 191, 36, 0.4)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.transform = 'translateY(0)';
                          e.currentTarget.style.boxShadow = cursoExpandido === curso.id_matricula
                            ? '0 2px 8px rgba(239, 68, 68, 0.3)'
                            : '0 2px 8px rgba(251, 191, 36, 0.3)';
                        }}
                      >
                        {cursoExpandido === curso.id_matricula ? (
                          <>
                            <XCircle size={16} strokeWidth={2.5} color="#fff" />
                            Ocultar
                          </>
                        ) : (
                          <>
                            <Eye size={16} strokeWidth={2.5} color="#fff" />
                            Ver Cuotas
                          </>
                        )}
                      </button>
                    </div>

                    <div className="responsive-grid-auto" style={{ gap: '0.5em', marginTop: '0.25em' }}>
                      <div style={{
                        padding: '0.625em',
                        background: darkMode ? 'rgba(251, 191, 36, 0.08)' : 'rgba(251, 191, 36, 0.1)',
                        borderRadius: '0.625em',
                        border: `1px solid ${darkMode ? 'rgba(251, 191, 36, 0.15)' : 'rgba(251, 191, 36, 0.2)'}`
                      }}>
                        <div style={{ fontSize: '0.72rem', color: '#f59e0b', marginBottom: '0.375em', display: 'flex', alignItems: 'center', gap: '0.25em', fontWeight: '600' }}>
                          <Clock size={12} strokeWidth={2.5} color="#f59e0b" />
                          Cuotas Pendientes
                        </div>
                        <div style={{ fontSize: '1rem', fontWeight: '800', color: '#f59e0b' }}>
                          {curso.cuotas_pendientes > 0 ? curso.cuotas_pendientes : 1}
                        </div>
                      </div>

                      <div style={{
                        padding: '0.625em',
                        background: darkMode ? 'rgba(239, 68, 68, 0.08)' : 'rgba(239, 68, 68, 0.1)',
                        borderRadius: '0.625em',
                        border: `1px solid ${darkMode ? 'rgba(239, 68, 68, 0.15)' : 'rgba(239, 68, 68, 0.2)'}`
                      }}>
                        <div style={{ fontSize: '0.72rem', color: '#ef4444', marginBottom: '0.375em', display: 'flex', alignItems: 'center', gap: '0.25em', fontWeight: '600' }}>
                          <AlertCircle size={12} strokeWidth={2.5} color="#ef4444" />
                          Cuotas Vencidas
                        </div>
                        <div style={{ fontSize: '1rem', fontWeight: '800', color: '#ef4444' }}>
                          {curso.cuotas_vencidas > 0 ? curso.cuotas_vencidas : 0}
                        </div>
                      </div>

                      {!curso.es_curso_promocional && curso.proxima_fecha_vencimiento && (
                        <div style={{
                          padding: '0.625em',
                          background: darkMode ? 'rgba(59, 130, 246, 0.08)' : 'rgba(59, 130, 246, 0.1)',
                          borderRadius: '0.625em',
                          border: `1px solid ${darkMode ? 'rgba(59, 130, 246, 0.15)' : 'rgba(59, 130, 246, 0.2)'}`
                        }}>
                          <div style={{ fontSize: '0.72rem', color: '#3b82f6', marginBottom: '0.375em', display: 'flex', alignItems: 'center', gap: '0.25em', fontWeight: '600' }}>
                            <Calendar size={12} strokeWidth={2.5} color="#3b82f6" />
                            Próximo Vencimiento
                          </div>
                          <div style={{ fontSize: '0.85rem', fontWeight: '700', color: '#3b82f6' }}>
                            {formatearFecha(curso.proxima_fecha_vencimiento)}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Información y opciones para curso promocional */}
                    {!!curso.es_curso_promocional && (
                      <div style={{
                        marginTop: '0.5em',
                        padding: '0.875em 1em',
                        background: darkMode
                          ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.15), rgba(5, 150, 105, 0.1))'
                          : 'linear-gradient(135deg, #d1fae5, #a7f3d0)',
                        border: `1px solid ${darkMode ? 'rgba(16, 185, 129, 0.3)' : '#10b981'}`,
                        borderRadius: '0.75em',
                        boxShadow: darkMode
                          ? '0 4px 12px rgba(16, 185, 129, 0.1)'
                          : '0 4px 12px rgba(16, 185, 129, 0.15)'
                      }}>
                        <div style={{
                          fontSize: '0.875rem',
                          color: darkMode ? '#d1fae5' : '#065f46',
                          marginBottom: '0.625em',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5em',
                          fontWeight: '700'
                        }}>
                          <Gift size={16} strokeWidth={2.5} />
                          <strong>Beneficio Promocional:</strong>
                        </div>
                        <ul style={{
                          margin: 0,
                          paddingLeft: '1.5em',
                          fontSize: '0.8rem',
                          color: darkMode ? 'rgba(209, 250, 229, 0.9)' : '#047857',
                          lineHeight: '1.6'
                        }}>
                          <li>Este curso es completamente <strong>GRATIS</strong> por {curso.meses_gratis} {curso.meses_gratis === 1 ? 'mes' : 'meses'}</li>
                          {fechaInicioCobro && (
                            <li>Los cobros iniciarán en: <strong>{fechaInicioCobro.toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' })}</strong></li>
                          )}
                          <li>Puedes decidir si deseas continuar antes de que termine el período gratuito</li>
                        </ul>
                        <div style={{
                          marginTop: '0.65em',
                          padding: '0.65em',
                          borderRadius: '0.65em',
                          background: darkMode ? 'rgba(16, 185, 129, 0.08)' : 'rgba(16, 185, 129, 0.12)',
                          border: `1px solid ${darkMode ? 'rgba(16,185,129,0.25)' : 'rgba(16,185,129,0.3)'}`,
                          color: darkMode ? '#d1fae5' : '#065f46',
                          lineHeight: 1.5
                        }}>
                          {promocionTerminada ? (
                            <>
                              <strong style={{ display: 'block', marginBottom: '0.2em' }}>Tu beneficio ha finalizado.</strong>
                              <span>Para seguir con el curso deberás cancelar las mensualidades regulares. Confírmalo en “Quiero continuar”.</span>
                            </>
                          ) : (
                            <>
                              <strong style={{ display: 'block', marginBottom: '0.2em' }}>Beneficio activo.</strong>
                              <span>Disfruta del período gratuito. Te avisamos con tiempo para que decidas si continuarás pagando o prefieres detenerte.</span>
                            </>
                          )}
                        </div>

                        <div style={{
                          marginTop: '0.75em',
                          display: 'flex',
                          gap: '0.5em',
                          flexWrap: 'wrap'
                        }}>
                          <button
                            type="button"
                            disabled={decisionTomada || isDecisionLoading}
                            style={{
                              flex: 1,
                              minWidth: '150px',
                              padding: '0.625em 1em',
                              background: 'linear-gradient(135deg, #10b981, #059669)',
                              color: 'white',
                              border: 'none',
                              borderRadius: '0.625em',
                              fontSize: '0.85rem',
                              fontWeight: '700',
                              cursor: decisionTomada || isDecisionLoading ? 'not-allowed' : 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '0.5em',
                              boxShadow: '0 2px 8px rgba(16, 185, 129, 0.3)',
                              transition: 'all 0.2s ease',
                              opacity: decisionTomada || isDecisionLoading ? 0.6 : 1
                            }}
                            onClick={() => {
                              if (decisionTomada || isDecisionLoading) return;
                              handleDecisionPromocion(curso, 'continuar');
                            }}
                            onMouseEnter={(e) => {
                              if (decisionTomada || isDecisionLoading) return;
                              e.currentTarget.style.transform = 'translateY(-2px)';
                              e.currentTarget.style.boxShadow = '0 4px 12px rgba(16, 185, 129, 0.4)';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.transform = 'translateY(0)';
                              e.currentTarget.style.boxShadow = '0 2px 8px rgba(16, 185, 129, 0.3)';
                            }}
                          >
                            <CheckCircle size={16} strokeWidth={2.5} />
                            {isDecisionLoading ? 'Guardando...' : 'Quiero Continuar'}
                          </button>
                          <button
                            type="button"
                            disabled={decisionTomada || isDecisionLoading}
                            style={{
                              flex: 1,
                              minWidth: '150px',
                              padding: '0.625em 1em',
                              backgroundColor: darkMode ? 'rgba(239, 68, 68, 0.2)' : '#fee2e2',
                              color: darkMode ? '#fca5a5' : '#dc2626',
                              border: `1px solid ${darkMode ? 'rgba(239, 68, 68, 0.4)' : '#fca5a5'}`,
                              borderRadius: '0.625em',
                              fontSize: '0.85rem',
                              fontWeight: '700',
                              cursor: decisionTomada || isDecisionLoading ? 'not-allowed' : 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '0.5em',
                              transition: 'all 0.2s ease',
                              opacity: decisionTomada || isDecisionLoading ? 0.6 : 1
                            }}
                            onClick={() => {
                              if (decisionTomada || isDecisionLoading) return;
                              solicitarConfirmacionRechazo(curso);
                            }}
                            onMouseEnter={(e) => {
                              if (decisionTomada || isDecisionLoading) return;
                              e.currentTarget.style.transform = 'translateY(-2px)';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.transform = 'translateY(0)';
                            }}
                          >
                            <XCircle size={16} strokeWidth={2.5} />
                            {isDecisionLoading ? 'Guardando...' : 'No Continuaré'}
                          </button>
                        </div>

                        <div style={{
                          marginTop: '0.65em',
                          fontSize: '0.78rem',
                          color: darkMode ? 'rgba(209, 250, 229, 0.9)' : '#065f46',
                          background: darkMode ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.8)',
                          borderRadius: '0.65em',
                          padding: '0.65em',
                          border: `1px dashed ${darkMode ? 'rgba(16,185,129,0.4)' : '#34d399'}`
                        }}>
                          {decisionTomada && decisionStatus ? (
                            <>
                              <strong style={{ display: 'block', marginBottom: '0.15em' }}>Decisión registrada</strong>
                              <span>
                                {decisionStatus.texto}
                                {curso.fecha_decision && (
                                  <> el {formatearFecha(curso.fecha_decision)}.</>
                                )}
                                {curso.decision_estudiante === 'continuar' && (
                                  <> Deberás pagar las mensualidades regulares una vez finalice el período gratuito.</>
                                )}
                              </span>
                            </>
                          ) : (
                            <>
                              <strong style={{ display: 'block', marginBottom: '0.15em' }}>¿Tienes clara tu decisión?</strong>
                              <span>
                                Si eliges <strong>"Quiero Continuar"</strong>, deberás pagar el curso mensualmente una vez termine tu beneficio promocional.
                                Si eliges <strong>"No Continuaré"</strong>, el curso se detendrá cuando finalice el período gratuito.
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    )}

                    {renderDetalleCuotas(curso)}
                  </div>
                );
              })}
          </div>
        )}
      </div>

      {cursosAlDia.length > 0 && (
        <div style={{ marginTop: '1.5em' }}>
          <h2 style={{ fontSize: isMobile ? '0.95rem' : '1.05rem', fontWeight: '700', marginBottom: '0.25em', color: darkMode ? '#fff' : '#1f2937' }}>
            Cursos al día
          </h2>
          <p style={{ fontSize: '0.82rem', color: darkMode ? 'rgba(255,255,255,0.7)' : '#6b7280', marginBottom: '0.75em' }}>
            Estos cursos ya no tienen cuotas pendientes. Puedes consultar su historial de pagos cuando lo necesites. Si el equipo de administración detecta cualquier inconsistencia visual en las evidencias, divergencias en el número de comprobante o datos que no coincidan, el pago se rechazará de inmediato y el curso reaparecerá en la sección de pagos pendientes para que cargues la cuota nuevamente.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5em' }}>
            {cursosAlDia.map((curso) => (
              <div
                key={`al-dia-${curso.id_matricula}`}
                style={{
                  backgroundColor: darkMode ? 'rgba(16, 185, 129, 0.08)' : '#ecfdf5',
                  border: `1px solid ${darkMode ? 'rgba(16, 185, 129, 0.4)' : '#a7f3d0'}`,
                  borderRadius: '1rem',
                  padding: '1.1em 1.2em',
                  boxShadow: darkMode
                    ? '0 4px 20px rgba(13, 148, 136, 0.15)'
                    : '0 4px 12px rgba(16, 185, 129, 0.15)'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.75em', flexWrap: 'wrap' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5em', flexWrap: 'wrap' }}>
                      <h3 style={{ fontSize: '0.95rem', fontWeight: '800', margin: 0, color: darkMode ? '#d1fae5' : '#065f46' }}>
                        {curso.curso_nombre.toString().replace(/\s*0\s*$/, '')}
                      </h3>
                      <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.3em',
                        padding: '0.25em 0.6em',
                        borderRadius: '999px',
                        background: 'rgba(16, 185, 129, 0.15)',
                        color: '#059669',
                        fontSize: '0.72rem',
                        fontWeight: '700'
                      }}>
                        <CheckCircle size={14} strokeWidth={2.5} color="#059669" />
                        Pagos completados
                      </span>
                    </div>
                    <div style={{ fontSize: '0.78rem', color: darkMode ? 'rgba(209, 250, 229, 0.85)' : '#047857', marginTop: '0.2em' }}>
                      {curso.tipo_curso_nombre}
                      {curso.codigo_matricula && curso.codigo_matricula.toString() !== '0' && (
                        <>
                          {' '}• {curso.codigo_matricula.toString().replace(/\s*0\s*$/, '')}
                        </>
                      )}
                    </div>
                  </div>

                  <button
                    onClick={() => handleToggleCuotas(curso)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.4em',
                      padding: '0.45em 0.9em',
                      background: cursoExpandido === curso.id_matricula
                        ? 'linear-gradient(135deg, #047857, #065f46)'
                        : 'linear-gradient(135deg, #34d399, #10b981)',
                      color: 'white',
                      border: 'none',
                      borderRadius: '0.625em',
                      fontSize: '0.78rem',
                      fontWeight: '700',
                      cursor: 'pointer',
                      boxShadow: '0 2px 8px rgba(16, 185, 129, 0.3)'
                    }}
                  >
                    {cursoExpandido === curso.id_matricula ? (
                      <>
                        <XCircle size={16} strokeWidth={2.5} color="#fff" />
                        Ocultar historial
                      </>
                    ) : (
                      <>
                        <Eye size={16} strokeWidth={2.5} color="#fff" />
                        Ver historial
                      </>
                    )}
                  </button>
                </div>

                <div className="responsive-grid-auto" style={{ gap: '0.5em', marginTop: '0.75em' }}>
                  <div style={{
                    padding: '0.6em',
                    background: darkMode ? 'rgba(16, 185, 129, 0.12)' : '#d1fae5',
                    borderRadius: '0.65em',
                    border: `1px solid ${darkMode ? 'rgba(16,185,129,0.3)' : '#a7f3d0'}`
                  }}>
                    <div style={{ fontSize: '0.7rem', color: '#059669', marginBottom: '0.3em', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '0.25em' }}>
                      <CheckCircle size={12} strokeWidth={2.5} color="#059669" />
                      Cuotas pagadas
                    </div>
                    <div style={{ fontSize: '0.95rem', fontWeight: '800', color: '#059669' }}>
                      {curso.total_cuotas}
                    </div>
                  </div>

                  <div style={{
                    padding: '0.6em',
                    background: darkMode ? 'rgba(255,255,255,0.05)' : '#fff',
                    borderRadius: '0.65em',
                    border: `1px solid ${darkMode ? 'rgba(255,255,255,0.1)' : '#e5e7eb'}`
                  }}>
                    <div style={{ fontSize: '0.7rem', color: darkMode ? 'rgba(209,250,229,0.9)' : '#047857', marginBottom: '0.3em', fontWeight: '600' }}>
                      Monto total pagado
                    </div>
                    <div style={{ fontSize: '0.95rem', fontWeight: '800', color: darkMode ? '#d1fae5' : '#047857' }}>
                      {formatearMonto(obtenerMontoTotalPagado(curso))}
                    </div>
                  </div>

                  <div style={{
                    padding: '0.6em',
                    background: darkMode ? 'rgba(5, 150, 105, 0.18)' : 'rgba(16, 185, 129, 0.12)',
                    borderRadius: '0.65em',
                    border: `1px solid ${darkMode ? 'rgba(5,150,105,0.35)' : 'rgba(16,185,129,0.3)'}`
                  }}>
                    <div style={{ fontSize: '0.7rem', color: darkMode ? '#a7f3d0' : '#065f46', marginBottom: '0.3em', fontWeight: '600' }}>
                      Estado general
                    </div>
                    <div style={{ fontSize: '0.95rem', fontWeight: '800', color: darkMode ? '#a7f3d0' : '#065f46' }}>
                      Al día
                    </div>
                  </div>
                </div>

                {renderDetalleCuotas(curso)}
              </div>
            ))}
          </div>
        </div>
      )}

      {cursoConfirmacion && (
        <div
          role="dialog"
          aria-modal="true"
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.55)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '1rem'
          }}
        >
          <div
            style={{
              width: '100%',
              maxWidth: '420px',
              background: darkMode ? 'rgba(17,24,39,0.95)' : '#ffffff',
              borderRadius: '1rem',
              padding: '1.25rem',
              boxShadow: '0 20px 45px rgba(0,0,0,0.35)',
              border: `1px solid ${darkMode ? 'rgba(255,255,255,0.1)' : '#e5e7eb'}`
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.75rem' }}>
              <XCircle size={24} strokeWidth={2.5} color={darkMode ? '#fca5a5' : '#dc2626'} />
              <div>
                <h3 style={{ margin: 0, fontSize: '1rem', color: darkMode ? '#fff' : '#111827' }}>Confirmar decisión</h3>
                <p style={{ margin: 0, fontSize: '0.82rem', color: darkMode ? 'rgba(255,255,255,0.7)' : '#6b7280' }}>
                  {cursoConfirmacion.curso_nombre}
                </p>
              </div>
            </div>
            <p style={{ fontSize: '0.88rem', lineHeight: 1.6, color: darkMode ? 'rgba(255,255,255,0.85)' : '#374151' }}>
              ¿Seguro que no deseas continuar con este curso después del período gratuito? Esta acción avisará al equipo académico para detener el acceso cuando termine el beneficio.
            </p>
            <div style={{
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '0.75rem',
              marginTop: '1.25rem'
            }}>
              <button
                type="button"
                onClick={cerrarModalConfirmacion}
                style={{
                  padding: '0.55rem 1.2rem',
                  borderRadius: '0.65rem',
                  border: `1px solid ${darkMode ? 'rgba(255,255,255,0.15)' : '#d1d5db'}`,
                  background: 'transparent',
                  color: darkMode ? '#fff' : '#1f2937',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={confirmarRechazoPromocion}
                disabled={decisionLoading === cursoConfirmacion.id_matricula}
                style={{
                  padding: '0.55rem 1.25rem',
                  borderRadius: '0.65rem',
                  border: 'none',
                  background: 'linear-gradient(135deg, #ef4444, #dc2626)',
                  color: '#fff',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  cursor: decisionLoading === cursoConfirmacion.id_matricula ? 'not-allowed' : 'pointer',
                  opacity: decisionLoading === cursoConfirmacion.id_matricula ? 0.6 : 1
                }}
              >
                <XCircle size={18} strokeWidth={2.5} color="#fff" />
                {decisionLoading === cursoConfirmacion.id_matricula ? 'Enviando...' : 'Sí, no continuaré'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de pago */}
      {showPagoModal && selectedCuota && (
        <ModalPagoMensualidad
          cuota={selectedCuota}
          darkMode={darkMode}
          onClose={() => {
            setShowPagoModal(false);
            setSelectedCuota(null);
          }}
          onSuccess={() => {
            // Recargar datos después del pago exitoso
            loadData();
            // Recargar cuotas del curso expandido si existe
            if (cursoExpandido) {
              loadCuotasMatricula(cursoExpandido);
            }
          }}
        />
      )}
    </div>
  );
};

export default PagosMenuales;
