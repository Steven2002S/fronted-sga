import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Upload, AlertCircle, CheckCircle, Info, CreditCard, Building } from 'lucide-react';
import EstudianteThemeWrapper from '../../components/EstudianteThemeWrapper';
import { useBreakpoints } from '../../hooks/useMediaQuery';
import { showToast } from '../../config/toastConfig';
import '../../styles/responsive.css';

const API_BASE = (import.meta as any).env?.VITE_API_URL || 'http://localhost:3000';

interface Cuota {
  id_pago: number;
  numero_cuota: number;
  monto: number;
  fecha_vencimiento: string;
  curso_nombre: string;
  tipo_curso_nombre: string;
  modalidad_pago?: 'mensual' | 'clases';
  meses_duracion?: number;
}

interface ModalPagoMensualidadProps {
  cuota: Cuota;
  onClose: () => void;
  onSuccess: () => void;
  darkMode?: boolean;
}

const ModalPagoMensualidad: React.FC<ModalPagoMensualidadProps> = ({ cuota, onClose, onSuccess, darkMode = false }) => {
  const { isMobile, isSmallScreen } = useBreakpoints();
  const [metodoPago, setMetodoPago] = useState<'transferencia' | 'efectivo'>('transferencia');
  const [montoPagar, setMontoPagar] = useState<string>(cuota.monto.toString());
  const [numeroComprobante, setNumeroComprobante] = useState('');
  const [bancoComprobante, setBancoComprobante] = useState('');
  // Inicializar con la fecha actual de Ecuador (UTC-5)
  const getFechaEcuador = () => {
    const now = new Date();
    const ecuadorOffset = -5 * 60; // Ecuador está en UTC-5
    const localOffset = now.getTimezoneOffset();
    const ecuadorTime = new Date(now.getTime() + (localOffset + ecuadorOffset) * 60000);
    return ecuadorTime.toISOString().split('T')[0];
  };
  const [fechaTransferencia, setFechaTransferencia] = useState(getFechaEcuador());
  const [recibidoPor, setRecibidoPor] = useState('');
  const [observaciones, setObservaciones] = useState('');
  const [archivoComprobante, setArchivoComprobante] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const montoPorClase = Number(cuota.monto);
  const pasoClases = !isNaN(montoPorClase) && montoPorClase > 0 ? montoPorClase.toFixed(2) : '0.01';

  const esMultiploDe = (valor: number, base: number) => {
    if (!base) return false;
    const ratio = valor / base;
    return Math.abs(ratio - Math.round(ratio)) < 0.0001;
  };

  const bancos = [
    'Banco Pichincha',
    'Banco del Guayaquil',
    'Banco del Pacífico',
    'Produbanco',
    'Banco Internacional',
    'Banco Bolivariano',
    'Banco de Machala',
    'Banco ProCredit',
    'Banco Solidario',
    'Banco Capital',
    'Banco Comercial de Manabí',
    'Banco Coopnacional',
    'Banco D-MIRO',
    'Banco Finca',
    'Banco General Rumiñahui',
    'Banco Loja',
    'Banco Procredit',
    'Banco VisionFund Ecuador'
  ];

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validar tipo de archivo
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'application/pdf'];
      if (!allowedTypes.includes(file.type)) {
        setError('Solo se permiten archivos JPG, PNG, WEBP o PDF');
        return;
      }

      // Validar tamaño (5MB máximo)
      if (file.size > 5 * 1024 * 1024) {
        setError('El archivo no puede ser mayor a 5MB');
        return;
      }

      setArchivoComprobante(file);
      setError('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Validaciones
      const montoNumerico = parseFloat(montoPagar);
      if (isNaN(montoNumerico) || montoNumerico <= 0) {
        throw new Error('El monto a pagar debe ser mayor a 0');
      }

      if (montoNumerico < cuota.monto) {
        throw new Error(`El monto mínimo a pagar es ${formatearMonto(cuota.monto)}`);
      }

      // VALIDACIÓN DE MÚLTIPLOS DE 90 PARA CURSOS MENSUALES
      if (cuota.modalidad_pago === 'mensual') {
        const MONTO_BASE = 90;

        // Verificar que sea múltiplo de 90
        if (montoNumerico % MONTO_BASE !== 0) {
          const mesesPagados = Math.floor(montoNumerico / MONTO_BASE);
          const montoSugerido = mesesPagados * MONTO_BASE;
          const montoSiguiente = (mesesPagados + 1) * MONTO_BASE;

          throw new Error(
            `Para cursos mensuales solo se permiten múltiplos de $${MONTO_BASE}.\n` +
            `Puedes pagar: $${montoSugerido} (${mesesPagados} ${mesesPagados === 1 ? 'mes' : 'meses'}) ` +
            `o $${montoSiguiente} (${mesesPagados + 1} meses)`
          );
        }

        // Verificar que no sea menor a 90
        if (montoNumerico < MONTO_BASE) {
          throw new Error(`El monto mínimo para cursos mensuales es $${MONTO_BASE} (1 mes)`);
        }

        // Verificar que no exceda el monto total del curso
        // NOTA: Calcular meses restantes desde la cuota actual
        const duracionCurso = cuota.meses_duracion || 12; // Por defecto 12 meses si no está definido
        const mesesRestantes = duracionCurso - cuota.numero_cuota + 1; // Desde la cuota actual hasta el final
        const montoTotalCurso = MONTO_BASE * mesesRestantes;

        if (montoNumerico > montoTotalCurso) {
          throw new Error(
            `El monto máximo para este curso es $${montoTotalCurso} (${mesesRestantes} ${mesesRestantes === 1 ? 'mes restante' : 'meses restantes'}).\n` +
            `Estás en la cuota ${cuota.numero_cuota} de ${duracionCurso}.`
          );
        }
      }

      if (cuota.modalidad_pago === 'clases') {
        if (montoNumerico < montoPorClase) {
          throw new Error(`El monto mínimo para este curso es ${formatearMonto(montoPorClase)} (1 clase)`);
        }

        if (!esMultiploDe(montoNumerico, montoPorClase)) {
          throw new Error(
            `Para este curso solo se permiten múltiplos de ${formatearMonto(montoPorClase)}.
` +
            `Ejemplos válidos: ${formatearMonto(montoPorClase)}, ${formatearMonto(montoPorClase * 2)}, ${formatearMonto(montoPorClase * 3)}...`
          );
        }
      }

      if (metodoPago === 'transferencia') {
        if (!numeroComprobante || !bancoComprobante || !fechaTransferencia) {
          throw new Error('Para transferencias se requiere: número de comprobante, banco y fecha');
        }
      }

      if (metodoPago === 'efectivo') {
        if (!numeroComprobante || !recibidoPor) {
          throw new Error('Para pagos en efectivo se requiere el número de factura y el nombre de quien recibió el pago');
        }
      }

      if (!archivoComprobante) {
        throw new Error('Debe subir el comprobante de pago');
      }

      // Crear FormData
      const formData = new FormData();
      formData.append('metodo_pago', metodoPago);
      formData.append('monto_pagado', montoNumerico.toFixed(2));
      formData.append('numero_comprobante', numeroComprobante);

      // Solo agregar banco y fecha si es transferencia
      if (metodoPago === 'transferencia') {
        formData.append('banco_comprobante', bancoComprobante);
        formData.append('fecha_transferencia', fechaTransferencia);
      } else {
        // Para efectivo, enviar valores por defecto y quien recibió
        formData.append('banco_comprobante', 'N/A');
        formData.append('fecha_transferencia', new Date().toISOString().split('T')[0]);
        formData.append('recibido_por', recibidoPor);
      }

      formData.append('observaciones', observaciones);
      formData.append('comprobante', archivoComprobante);

      const token = sessionStorage.getItem('auth_token');
      const response = await fetch(`${API_BASE}/api/pagos-mensuales/pagar/${cuota.id_pago}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al procesar el pago');
      }

      // Éxito - Mostrar notificación
      showToast.success('Pago registrado exitosamente. Pendiente de verificación', darkMode);
      onSuccess();
      onClose();

    } catch (error) {
      console.error('Error procesando pago:', error);
      setError(error instanceof Error ? error.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  };

  const formatearMonto = (monto: number | string) => {
    const montoNumerico = typeof monto === 'string' ? parseFloat(monto) : monto;
    return `$${(montoNumerico || 0).toFixed(2)}`;
  };

  const formatearFecha = (fechaString: string) => {
    const fecha = new Date(fechaString);
    return fecha.toLocaleDateString('es-ES', {
      month: 'long',
      year: 'numeric'
    });
  };

  // Colores según el tema
  const theme = {
    modalBg: darkMode
      ? 'rgba(15, 23, 42, 0.95)'
      : 'rgba(255, 255, 255, 0.95)',
    cardBg: darkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)',
    textPrimary: darkMode ? '#fff' : '#1e293b',
    textSecondary: darkMode ? 'rgba(255,255,255,0.8)' : 'rgba(30,41,59,0.8)',
    textMuted: darkMode ? 'rgba(255,255,255,0.6)' : 'rgba(30,41,59,0.6)',
    border: darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
    inputBg: darkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
    inputBorder: darkMode ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.15)',
    hoverBg: darkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)',
  };

  return createPortal(
    <EstudianteThemeWrapper darkMode={darkMode}>
      <div
        className="modal-overlay"
        onClick={onClose}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          width: '100vw',
          height: '100vh',
          backgroundColor: 'rgba(0, 0, 0, 0.65)',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 99999,
          animation: 'fadeIn 0.3s ease-out'
        }}>
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
          /* Forzar que los botones de incrementar/decrementar siempre sean visibles */
          input[type="number"]::-webkit-inner-spin-button,
          input[type="number"]::-webkit-outer-spin-button {
            opacity: 1 !important;
            -webkit-appearance: auto !important;
            height: auto !important;
          }
          input[type="number"] {
            -moz-appearance: textfield !important;
          }
          input[type="number"]::-webkit-inner-spin-button {
            -webkit-appearance: inner-spin-button !important;
            display: inline-block !important;
          }
        `}</style>
        <div
          className="modal-content responsive-modal"
          onClick={(e) => e.stopPropagation()}
          style={{
            background: theme.modalBg,
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            border: `1px solid ${darkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`,
            padding: isMobile ? '0.75rem 0.75rem 0' : '1.25rem',
            borderRadius: '0.75rem',
            width: isMobile ? '95%' : '520px',
            maxWidth: '520px',
            maxHeight: isMobile ? '95vh' : 'calc(100vh - 3rem)',
            display: 'flex',
            flexDirection: 'column',
            position: 'relative',
            boxShadow: darkMode
              ? '0 20px 60px -12px rgba(0, 0, 0, 0.5)'
              : '0 20px 60px -12px rgba(0, 0, 0, 0.15)',
            animation: 'scaleIn 0.3s ease-out'
          }}>
          {/* Botón cerrar */}
          <button
            onClick={onClose}
            style={{
              position: 'absolute',
              top: '1em',
              right: '1em',
              background: theme.hoverBg,
              border: `0.0625rem solid ${theme.border}`,
              borderRadius: '0.5em',
              color: theme.textPrimary,
              padding: '0.5em',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s ease',
              zIndex: 10
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = theme.inputBg}
            onMouseLeave={(e) => e.currentTarget.style.background = theme.hoverBg}
          >
            <X size={16} />
          </button>

          {/* Header */}
          <div style={{ marginBottom: isMobile ? '0.625rem' : '0.75rem', paddingRight: '2.5rem' }}>
            <h2 style={{
              color: theme.textPrimary,
              fontSize: isMobile ? '0.95rem' : '1rem',
              fontWeight: '700',
              margin: '0 0 0.375rem 0',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              <div style={{
                width: isMobile ? '1.75rem' : '2rem',
                height: isMobile ? '1.75rem' : '2rem',
                background: 'linear-gradient(135deg, #10b981, #059669)',
                borderRadius: '0.5rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}>
                <CreditCard size={isMobile ? 14 : 16} strokeWidth={2.5} color="#fff" />
              </div>
              Pagar Mensualidad
            </h2>
            <div style={{ color: theme.textMuted, fontSize: isMobile ? '0.7rem' : '0.75rem', fontWeight: '500', marginLeft: 0 }}>
              {cuota.curso_nombre} • Cuota {cuota.numero_cuota}
            </div>
          </div>

          {/* Información de la cuota */}
          <div style={{
            background: darkMode ? 'rgba(16, 185, 129, 0.1)' : 'rgba(16, 185, 129, 0.08)',
            border: `1px solid ${darkMode ? 'rgba(16, 185, 129, 0.3)' : 'rgba(16, 185, 129, 0.2)'}`,
            borderRadius: '0.625rem',
            padding: isMobile ? '0.625rem' : '0.75rem',
            marginBottom: isMobile ? '0.625rem' : '0.75rem'
          }}>
            <div style={{
              display: 'grid',
              gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)',
              gap: isMobile ? '0.625rem' : '0.75rem',
              marginBottom: isMobile ? '0.625rem' : '0.75rem'
            }}>
              <div>
                <div style={{ color: theme.textMuted, fontSize: '0.65rem', marginBottom: '0.25rem', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Monto a Pagar
                </div>
                <div style={{ color: '#10b981', fontSize: isMobile ? '1.25rem' : '1.5rem', fontWeight: '700' }}>
                  {formatearMonto(parseFloat(montoPagar) || cuota.monto)}
                </div>
              </div>
              <div>
                <div style={{ color: theme.textMuted, fontSize: '0.65rem', marginBottom: '0.25rem', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Vencimiento
                </div>
                <div style={{ color: theme.textPrimary, fontSize: isMobile ? '0.75rem' : '0.8rem', fontWeight: '600' }}>
                  {formatearFecha(cuota.fecha_vencimiento)}
                </div>
              </div>
            </div>

            {/* Campo editable de monto a pagar */}
            <div>
              <label style={{
                display: 'block',
                color: theme.textPrimary,
                fontSize: isMobile ? '0.7rem' : '0.75rem',
                fontWeight: '700',
                marginBottom: '0.375rem'
              }}>
                Monto a Pagar *
              </label>
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'stretch' }}>
                {/* Botón decrementar */}
                <button
                  type="button"
                  onClick={() => {
                    const montoActual = parseFloat(montoPagar) || 0;
                    const paso = cuota.modalidad_pago === 'mensual' ? 90 : (cuota.modalidad_pago === 'clases' ? montoPorClase : 0.01);
                    const nuevoMonto = Math.max(paso, montoActual - paso);
                    setMontoPagar(nuevoMonto.toFixed(2));
                  }}
                  style={{
                    flex: isMobile ? '1' : '0 0 3rem',
                    padding: '0.625em',
                    background: darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(16, 185, 129, 0.1)',
                    border: `1px solid ${darkMode ? 'rgba(16, 185, 129, 0.35)' : 'rgba(16, 185, 129, 0.3)'}`,
                    borderRadius: '0.5rem',
                    color: '#10b981',
                    fontSize: '1.25rem',
                    fontWeight: '700',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(16, 185, 129, 0.2)'}
                  onMouseLeave={(e) => e.currentTarget.style.background = darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(16, 185, 129, 0.1)'}
                >
                  −
                </button>

                {/* Input de monto */}
                <input
                  type="number"
                  step={cuota.modalidad_pago === 'mensual' ? '90' : (cuota.modalidad_pago === 'clases' ? pasoClases : '0.01')}
                  min={cuota.modalidad_pago === 'mensual' ? '90' : (cuota.modalidad_pago === 'clases' ? pasoClases : '0.01')}
                  max={cuota.modalidad_pago === 'mensual' ? (90 * ((cuota.meses_duracion || 12) - cuota.numero_cuota + 1)) : undefined}
                  value={montoPagar}
                  readOnly={false}
                  onChange={(e) => {
                    const valor = e.target.value;
                    const numero = parseFloat(valor);

                    if (valor === '' || numero === 0) {
                      setMontoPagar(valor);
                      return;
                    }

                    if (cuota.modalidad_pago === 'mensual') {
                      if (numero % 90 === 0 && numero >= 90) {
                        setMontoPagar(valor);
                      } else {
                        showToast.warning('Solo se permiten múltiplos de $90 (90, 180, 270, 360...)', darkMode);
                      }
                      return;
                    }

                    if (cuota.modalidad_pago === 'clases') {
                      if (numero >= montoPorClase && esMultiploDe(numero, montoPorClase)) {
                        setMontoPagar(valor);
                      } else {
                        showToast.warning(
                          `Solo se permiten múltiplos de ${formatearMonto(montoPorClase)} (por clase).`,
                          darkMode
                        );
                      }
                      return;
                    }

                    setMontoPagar(valor);
                  }}
                  onBlur={(e) => {
                    // Al perder el foco, si está vacío o es inválido, restaurar al monto de la cuota
                    if (cuota.modalidad_pago === 'mensual') {
                      const numero = parseFloat(e.target.value);
                      if (!numero || numero < 90 || numero % 90 !== 0) {
                        setMontoPagar(cuota.monto.toString());
                        showToast.error('Monto inválido. Se restauró al valor de la cuota.', darkMode);
                      }
                      return;
                    }

                    if (cuota.modalidad_pago === 'clases') {
                      const numero = parseFloat(e.target.value);
                      if (!numero || numero < montoPorClase || !esMultiploDe(numero, montoPorClase)) {
                        setMontoPagar(cuota.monto.toString());
                        showToast.error(`Monto inválido. Solo múltiplos de ${formatearMonto(montoPorClase)}.`, darkMode);
                      }
                      return;
                    }
                  }}
                  required
                  style={{
                    flex: 1,
                    padding: '0.625em 0.875em',
                    background: darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.9)',
                    border: `1px solid ${darkMode ? 'rgba(16, 185, 129, 0.35)' : 'rgba(16, 185, 129, 0.3)'}`,
                    borderRadius: '0.5rem',
                    color: theme.textPrimary,
                    fontSize: '0.8rem',
                    fontWeight: '600',
                    outline: 'none',
                    transition: 'all 0.2s ease',
                    textAlign: 'center'
                  }}
                />

                {/* Botón incrementar */}
                <button
                  type="button"
                  onClick={() => {
                    const montoActual = parseFloat(montoPagar) || 0;
                    const paso = cuota.modalidad_pago === 'mensual' ? 90 : (cuota.modalidad_pago === 'clases' ? montoPorClase : 0.01);
                    const maxMonto = cuota.modalidad_pago === 'mensual' ? (90 * ((cuota.meses_duracion || 12) - cuota.numero_cuota + 1)) : undefined;
                    const nuevoMonto = montoActual + paso;

                    if (maxMonto && nuevoMonto > maxMonto) {
                      showToast.warning(`El monto máximo es ${formatearMonto(maxMonto)}`, darkMode);
                      return;
                    }

                    setMontoPagar(nuevoMonto.toFixed(2));
                  }}
                  style={{
                    flex: isMobile ? '1' : '0 0 3rem',
                    padding: '0.625em',
                    background: darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(16, 185, 129, 0.1)',
                    border: `1px solid ${darkMode ? 'rgba(16, 185, 129, 0.35)' : 'rgba(16, 185, 129, 0.3)'}`,
                    borderRadius: '0.5rem',
                    color: '#10b981',
                    fontSize: '1.25rem',
                    fontWeight: '700',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(16, 185, 129, 0.2)'}
                  onMouseLeave={(e) => e.currentTarget.style.background = darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(16, 185, 129, 0.1)'}
                >
                  +
                </button>
              </div>
              <div style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '0.375em',
                color: darkMode ? 'rgba(16, 185, 129, 0.9)' : 'rgba(5, 150, 105, 0.9)',
                fontSize: '0.7rem',
                marginTop: '0.375em',
                lineHeight: '1.3'
              }}>
                <Info size={12} style={{ flexShrink: 0, marginTop: '0.0625em' }} />
                <span>
                  {cuota.modalidad_pago === 'mensual'
                    ? `Solo múltiplos de $90 (90, 180, 270...) hasta $${90 * ((cuota.meses_duracion || 12) - cuota.numero_cuota + 1)} máximo (${(cuota.meses_duracion || 12) - cuota.numero_cuota + 1} ${((cuota.meses_duracion || 12) - cuota.numero_cuota + 1) === 1 ? 'mes restante' : 'meses restantes'})`
                    : cuota.modalidad_pago === 'clases'
                      ? `Puedes pagar múltiplos de ${formatearMonto(montoPorClase)} (1 clase = ${formatearMonto(montoPorClase)}, 2 clases = ${formatearMonto(montoPorClase * 2)}, ...)`
                      : 'Puedes pagar más del monto de la cuota para adelantar pagos'}
                </span>
              </div>
            </div>
          </div>

          {/* Formulario */}
          <form onSubmit={handleSubmit}>
            {/* Método de pago */}
            <div style={{ marginBottom: isMobile ? '0.625rem' : '0.75rem' }}>
              <label style={{
                display: 'block',
                color: theme.textPrimary,
                fontSize: isMobile ? '0.7rem' : '0.75rem',
                fontWeight: '700',
                marginBottom: '0.5rem'
              }}>
                Método de Pago *
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)', gap: '0.625rem' }}>
                {[
                  { value: 'transferencia', label: 'Transferencia', icon: Building },
                  { value: 'efectivo', label: 'Efectivo', icon: CreditCard }
                ].map((metodo) => {
                  const Icon = metodo.icon;
                  const isSelected = metodoPago === metodo.value;
                  return (
                    <button
                      key={metodo.value}
                      type="button"
                      onClick={() => setMetodoPago(metodo.value as any)}
                      style={{
                        padding: isMobile ? '0.625rem' : '0.75rem',
                        background: isSelected
                          ? 'linear-gradient(135deg, #10b981, #059669)'
                          : theme.inputBg,
                        color: isSelected ? '#fff' : theme.textPrimary,
                        border: `1px solid ${isSelected ? '#10b981' : theme.inputBorder}`,
                        borderRadius: '0.5rem',
                        cursor: 'pointer',
                        fontSize: isMobile ? '0.8rem' : '0.85rem',
                        fontWeight: '700',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '0.375em',
                        transition: 'all 0.2s ease',
                        boxShadow: isSelected ? '0 0.25rem 0.5rem rgba(16, 185, 129, 0.25)' : 'none'
                      }}
                    >
                      <Icon size={20} strokeWidth={2.5} color={isSelected ? '#fff' : (darkMode ? 'rgba(255,255,255,0.7)' : '#1f2937')} />
                      {metodo.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Campos específicos para transferencia */}
            {metodoPago === 'transferencia' && (
              <>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.625em', marginBottom: '0.75em' }}>
                  {/* Banco */}
                  <div style={{ gridColumn: '1 / -1' }}>
                    <label style={{
                      display: 'block',
                      color: theme.textPrimary,
                      fontSize: '0.8rem',
                      fontWeight: '800',
                      marginBottom: '0.375em'
                    }}>
                      Banco *
                    </label>
                    <select
                      value={bancoComprobante}
                      onChange={(e) => setBancoComprobante(e.target.value)}
                      required
                      style={{
                        width: '100%',
                        padding: '0.625em 0.875em',
                        background: theme.inputBg,
                        border: `0.0625rem solid ${theme.inputBorder}`,
                        borderRadius: '0.5em',
                        color: theme.textPrimary,
                        fontSize: '0.8rem',
                        outline: 'none',
                        cursor: 'pointer'
                      }}
                    >
                      <option value="">Seleccionar banco...</option>
                      {bancos.map((banco) => (
                        <option key={banco} value={banco} style={{ background: darkMode ? '#1e293b' : '#ffffff', color: darkMode ? '#fff' : '#374151' }}>
                          {banco}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Número de comprobante */}
                  <div>
                    <label style={{
                      display: 'block',
                      color: theme.textPrimary,
                      fontSize: '0.8rem',
                      fontWeight: '800',
                      marginBottom: '0.375em'
                    }}>
                      Número de Comprobante *
                    </label>
                    <input
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      value={numeroComprobante}
                      onChange={(e) => {
                        const valor = e.target.value;
                        // Solo permitir números
                        if (/^\d*$/.test(valor)) {
                          setNumeroComprobante(valor);
                        }
                      }}
                      placeholder="Ej: 1234567890"
                      required
                      style={{
                        width: '100%',
                        padding: '0.625em 0.875em',
                        background: theme.inputBg,
                        border: `0.0625rem solid ${theme.inputBorder}`,
                        borderRadius: '0.5em',
                        color: theme.textPrimary,
                        fontSize: '0.8rem',
                        outline: 'none'
                      }}
                    />
                  </div>

                  {/* Fecha de transferencia */}
                  <div>
                    <label style={{
                      display: 'block',
                      color: theme.textPrimary,
                      fontSize: '0.8rem',
                      fontWeight: '800',
                      marginBottom: '0.375em'
                    }}>
                      Fecha de Transferencia *
                    </label>
                    <input
                      type="date"
                      value={fechaTransferencia}
                      readOnly
                      disabled
                      required
                      style={{
                        width: '100%',
                        padding: '0.625em 0.875em',
                        background: darkMode ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
                        border: `0.0625rem solid ${theme.inputBorder}`,
                        borderRadius: '0.5em',
                        color: theme.textMuted,
                        fontSize: '0.8rem',
                        outline: 'none',
                        cursor: 'not-allowed',
                        opacity: 0.7
                      }}
                    />
                  </div>
                </div>
              </>
            )}

            {/* Campos específicos para efectivo */}
            {metodoPago === 'efectivo' && (
              <div style={{ marginBottom: '1em' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.75em' }}>
                  {/* Número de factura */}
                  <div>
                    <label style={{
                      display: 'block',
                      color: theme.textPrimary,
                      fontSize: '0.8rem',
                      fontWeight: '800',
                      marginBottom: '0.375em'
                    }}>
                      Número de Factura *
                    </label>
                    <input
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9-]*"
                      value={numeroComprobante}
                      onChange={(e) => {
                        const valor = e.target.value;
                        // Solo permitir números y guiones para formato 001-001-0001234
                        if (/^[0-9-]*$/.test(valor)) {
                          setNumeroComprobante(valor);
                        }
                      }}
                      placeholder="Ej: 001-001-0001234"
                      required
                      style={{
                        width: '100%',
                        padding: '0.625em 0.875em',
                        background: theme.inputBg,
                        border: `0.0625rem solid ${theme.inputBorder}`,
                        borderRadius: '0.5em',
                        color: theme.textPrimary,
                        fontSize: '0.8rem',
                        outline: 'none'
                      }}
                    />
                  </div>

                  {/* Recibido por */}
                  <div>
                    <label style={{
                      display: 'block',
                      color: theme.textPrimary,
                      fontSize: '0.8rem',
                      fontWeight: '800',
                      marginBottom: '0.375em'
                    }}>
                      Recibido por *
                    </label>
                    <input
                      type="text"
                      value={recibidoPor}
                      onChange={(e) => {
                        // Convertir automáticamente a mayúsculas
                        setRecibidoPor(e.target.value.toUpperCase());
                      }}
                      placeholder="NOMBRE COMPLETO"
                      required
                      style={{
                        width: '100%',
                        padding: '0.625em 0.875em',
                        background: theme.inputBg,
                        border: `0.0625rem solid ${theme.inputBorder}`,
                        borderRadius: '0.5em',
                        color: theme.textPrimary,
                        fontSize: '0.8rem',
                        outline: 'none',
                        textTransform: 'uppercase'
                      }}
                    />
                  </div>
                </div>
                <div style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '0.375em',
                  color: darkMode ? 'rgba(59, 130, 246, 0.9)' : 'rgba(37, 99, 235, 0.9)',
                  fontSize: '0.7rem',
                  marginTop: '0.5em',
                  padding: '0.625em',
                  background: darkMode ? 'rgba(59, 130, 246, 0.1)' : 'rgba(59, 130, 246, 0.05)',
                  borderRadius: '0.5em',
                  border: `0.0625rem solid ${darkMode ? 'rgba(59, 130, 246, 0.2)' : 'rgba(59, 130, 246, 0.15)'}`,
                  lineHeight: '1.3'
                }}>
                  <Info size={12} style={{ flexShrink: 0, marginTop: '0.0625em' }} />
                  <span>Ingresa el número de factura y el nombre de la persona que te atendió en la escuela</span>
                </div>
              </div>
            )}

            {/* Subir comprobante */}
            <div style={{ marginBottom: '0.625em' }}>
              <label style={{
                display: 'block',
                color: theme.textPrimary,
                fontSize: '0.8rem',
                fontWeight: '800',
                marginBottom: '0.375em'
              }}>
                Comprobante de Pago *
              </label>
              <div style={{
                border: `0.0625rem dashed ${archivoComprobante ? '#10b981' : theme.border}`,
                borderRadius: '0.5em',
                padding: '0.75em',
                textAlign: 'center',
                cursor: 'pointer',
                background: archivoComprobante
                  ? (darkMode ? 'rgba(16, 185, 129, 0.1)' : 'rgba(16, 185, 129, 0.05)')
                  : theme.inputBg,
                transition: 'all 0.3s ease'
              }}>
                <input
                  type="file"
                  accept="image/*,.pdf"
                  onChange={handleFileChange}
                  style={{ display: 'none' }}
                  id="comprobante-upload"
                  required
                />
                <label htmlFor="comprobante-upload" style={{ cursor: 'pointer', display: 'block' }}>
                  <Upload size={20} color={archivoComprobante ? '#10b981' : theme.textMuted} style={{ marginBottom: '0.25em' }} />
                  <div style={{
                    color: archivoComprobante ? '#10b981' : theme.textPrimary,
                    fontSize: '0.75rem',
                    fontWeight: '700',
                    marginBottom: '0.125em'
                  }}>
                    {archivoComprobante ? archivoComprobante.name : 'Haz clic para subir'}
                  </div>
                  <div style={{ color: theme.textMuted, fontSize: '0.65rem' }}>
                    JPG, PNG o PDF • Máx. 5MB
                  </div>
                </label>
              </div>
            </div>

            {/* Observaciones */}
            <div style={{ marginBottom: isMobile ? '0.5rem' : '0.625em', paddingBottom: isMobile ? '0.5rem' : 0 }}>
              <label style={{
                display: 'block',
                color: theme.textPrimary,
                fontSize: '0.8rem',
                fontWeight: '800',
                marginBottom: '0.25em'
              }}>
                Observaciones (Opcional)
              </label>
              <textarea
                value={observaciones}
                onChange={(e) => setObservaciones(e.target.value)}
                placeholder="Comentarios adicionales..."
                rows={2}
                style={{
                  width: '100%',
                  padding: '0.5em 0.75em',
                  background: theme.inputBg,
                  border: `0.0625rem solid ${theme.inputBorder}`,
                  borderRadius: '0.5em',
                  color: theme.textPrimary,
                  fontSize: '0.75rem',
                  resize: 'none',
                  outline: 'none',
                  lineHeight: '1.25',
                  height: '2.5rem'
                }}
              />
            </div>

            {/* Error */}
            {error && (
              <div style={{
                background: darkMode ? 'rgba(239, 68, 68, 0.15)' : 'rgba(239, 68, 68, 0.1)',
                border: `0.0625rem solid ${darkMode ? 'rgba(239, 68, 68, 0.4)' : 'rgba(239, 68, 68, 0.3)'}`,
                color: darkMode ? '#fecaca' : '#dc2626',
                padding: '0.75em',
                borderRadius: '0.5em',
                marginBottom: '0.75em',
                fontSize: '0.8rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5em',
                fontWeight: '600',
                lineHeight: '1.3'
              }}>
                <AlertCircle size={16} style={{ flexShrink: 0 }} />
                {error}
              </div>
            )}

            {/* Botones */}
            <div style={{
              display: 'flex',
              flexDirection: isMobile ? 'column-reverse' : 'row',
              gap: '0.625rem',
              justifyContent: 'flex-end',
              marginTop: '0.625rem',
              // Sticky en móvil para que siempre esté visible
              position: isMobile ? 'sticky' : 'relative',
              bottom: isMobile ? 0 : 'auto',
              background: theme.modalBg,
              padding: isMobile ? '0.75rem' : 0,
              margin: isMobile ? '0.625rem -0.75rem 0 -0.75rem' : '0.625rem 0 0 0',
              borderTop: isMobile ? `1px solid ${theme.border}` : 'none',
              zIndex: 10
            }}>
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                style={{
                  padding: isMobile ? '0.625rem' : '0.625rem 1rem',
                  background: theme.inputBg,
                  color: theme.textPrimary,
                  border: `1px solid ${theme.border}`,
                  borderRadius: '0.5rem',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  fontSize: isMobile ? '0.85rem' : '0.8rem',
                  fontWeight: '700',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => !loading && (e.currentTarget.style.background = theme.hoverBg)}
                onMouseLeave={(e) => !loading && (e.currentTarget.style.background = theme.inputBg)}
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading}
                style={{
                  padding: isMobile ? '0.75rem' : '0.625rem 1.25rem',
                  background: loading ? 'rgba(16, 185, 129, 0.5)' : 'linear-gradient(135deg, #10b981, #059669)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '0.5rem',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  fontSize: isMobile ? '0.9rem' : '0.8rem',
                  fontWeight: '700',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  boxShadow: loading ? 'none' : '0 4px 10px rgba(16, 185, 129, 0.3)',
                  transition: 'all 0.2s ease'
                }}
              >
                {loading ? (
                  <>
                    <div style={{
                      width: '0.875rem',
                      height: '0.875rem',
                      border: '2px solid rgba(255,255,255,0.3)',
                      borderTop: '2px solid #fff',
                      borderRadius: '50%',
                      animation: 'spin 1s linear infinite'
                    }} />
                    Procesando...
                  </>
                ) : (
                  <>
                    <CheckCircle size={16} strokeWidth={2.5} color="#fff" />
                    Procesar Pago
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Animación del spinner */}
          <style>{`
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
        `}</style>
        </div>
      </div >
    </EstudianteThemeWrapper >,
    document.body
  );
};

export default ModalPagoMensualidad;
