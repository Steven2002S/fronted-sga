import React, { useState, useEffect } from 'react';
import { CreditCard, Search, Clock, Mail, ArrowLeft, Shield, Zap, Calendar } from 'lucide-react';
import { useBreakpoints } from '../../hooks/useMediaQuery';
import '../../styles/responsive.css';

// Importar el componente de Pagos Mensuales
import PagosMenuales from './PagosMenuales';

interface ServiciosProps {
  darkMode: boolean;
}

const Servicios: React.FC<ServiciosProps> = ({ darkMode }) => {
  const { } = useBreakpoints();
  const [isVisible, setIsVisible] = useState(false);
  const [searchTerm] = useState('');
  const [showPagosMenuales, setShowPagosMenuales] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  // Función para obtener colores según el tema
  const getThemeColors = () => {
    if (darkMode) {
      return {
        cardBg: 'rgba(255, 255, 255, 0.05)',
        textPrimary: '#fff',
        textSecondary: 'rgba(255,255,255,0.8)',
        textMuted: 'rgba(255,255,255,0.7)',
        border: 'rgba(251, 191, 36, 0.1)',
        accent: '#fbbf24',
        success: '#10b981',
        warning: '#f59e0b',
        danger: '#ef4444',
        info: '#3b82f6'
      };
    } else {
      return {
        cardBg: 'rgba(255, 255, 255, 0.8)',
        textPrimary: '#1e293b',
        textSecondary: 'rgba(30,41,59,0.8)',
        textMuted: 'rgba(30,41,59,0.7)',
        border: 'rgba(251, 191, 36, 0.2)',
        accent: '#f59e0b',
        success: '#059669',
        warning: '#d97706',
        danger: '#dc2626',
        info: '#2563eb'
      };
    }
  };

  const theme = getThemeColors();

  // Solo servicio de Pagar Mensualidad
  const services = [
    {
      id: 1,
      title: 'Pagar Mensualidad',
      description: 'Gestiona y paga las mensualidades de tus cursos matriculados de forma rápida y segura',
      icon: CreditCard,
      status: 'available',
      schedule: '24/7 Online',
      contact: 'pagos@sgabelleza.edu.ec',
      action: 'Gestionar Pagos',
      features: [
        { text: 'Historial de pagos', icon: Calendar },
      ],
      isSpecial: true
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available': return theme.success;
      case 'limited': return theme.warning;
      case 'unavailable': return theme.danger;
      default: return theme.textMuted;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'available': return 'Disponible';
      case 'limited': return 'Limitado';
      case 'unavailable': return 'No disponible';
      default: return 'Desconocido';
    }
  };

  const filteredServices = services.filter(service =>
    service.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    service.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Si está en la vista de pagos, mostrar solo esa vista
  if (showPagosMenuales) {
    return (
      <div style={{
        transform: isVisible ? 'translateY(0)' : 'translateY(-1.875rem)',
        opacity: isVisible ? 1 : 0,
        transition: 'all 0.8s cubic-bezier(0.4, 0, 0.2, 1)'
      }}>
        {/* Header con botón de regresar */}
        <div style={{
          marginBottom: '0.5em'
        }}>
          <button
            onClick={() => setShowPagosMenuales(false)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              background: darkMode ? 'rgba(251, 191, 36, 0.15)' : 'rgba(251, 191, 36, 0.2)',
              border: 'none',
              color: darkMode ? '#fbbf24' : '#f59e0b',
              cursor: 'pointer',
              fontSize: '0.875rem',
              fontWeight: '700',
              padding: '0.5rem 1rem',
              borderRadius: '0.625rem',
              transition: 'all 0.2s ease',
              boxShadow: '0 2px 6px rgba(251, 191, 36, 0.2)'
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
            Volver a Servicios
          </button>
        </div>

        {/* Contenido */}
        <PagosMenuales darkMode={darkMode} />
      </div>
    );
  }

  // Vista normal de Servicios
  return (
    <div style={{
      transform: isVisible ? 'translateY(0)' : 'translateY(-1.875rem)',
      opacity: isVisible ? 1 : 0,
      transition: 'all 0.8s cubic-bezier(0.4, 0, 0.2, 1)'
    }}>
      {/* Header */}
      <div style={{ marginBottom: '1.25em' }}>
        <h2 style={{
          fontSize: '1.5rem',
          fontWeight: '700',
          color: theme.textPrimary,
          margin: '0 0 0.375rem 0'
        }}>
          Servicios Estudiantiles
        </h2>
        <p style={{ color: theme.textMuted, fontSize: '0.8125rem', margin: 0 }}>
          Accede a todos los servicios disponibles para estudiantes
        </p>
      </div>

      {/* Servicios */}
      <div className="responsive-grid-auto" style={{ gap: '0.75em' }}>
        {filteredServices.map((service) => {
          const Icon = service.icon;
          const statusColor = getStatusColor(service.status);

          return (
            <div
              key={service.id}
              style={{
                background: theme.cardBg,
                border: `1px solid ${theme.border}`,
                borderRadius: '1rem',
                padding: '1.5rem',
                backdropFilter: 'blur(10px)',
                boxShadow: darkMode
                  ? '0 4px 20px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(251, 191, 36, 0.1)'
                  : '0 4px 20px rgba(0, 0, 0, 0.06), 0 0 0 1px rgba(251, 191, 36, 0.1)',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                cursor: 'pointer',
                position: 'relative',
                overflow: 'hidden'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-4px)';
                e.currentTarget.style.boxShadow = darkMode
                  ? '0 12px 32px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(251, 191, 36, 0.2)'
                  : '0 12px 32px rgba(0, 0, 0, 0.12), 0 0 0 1px rgba(251, 191, 36, 0.2)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = darkMode
                  ? '0 4px 20px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(251, 191, 36, 0.1)'
                  : '0 4px 20px rgba(0, 0, 0, 0.06), 0 0 0 1px rgba(251, 191, 36, 0.1)';
              }}
            >
              {/* Header del servicio */}
              <div style={{ marginBottom: '1.25em' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75em', marginBottom: '0.75em' }}>
                  <div style={{
                    width: '3em',
                    height: '3em',
                    background: `linear-gradient(135deg, ${theme.accent}25, ${theme.accent}15)`,
                    borderRadius: '0.75em',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: `1px solid ${theme.accent}30`,
                    flexShrink: 0
                  }}>
                    <Icon size={20} color={theme.accent} strokeWidth={2.5} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <h3 style={{
                      fontSize: '1.125rem',
                      fontWeight: '700',
                      color: theme.textPrimary,
                      margin: '0 0 0.375em 0',
                      lineHeight: 1.2
                    }}>
                      {service.title}
                    </h3>
                    <div style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.375em',
                      padding: '0.25em 0.625em',
                      background: `${statusColor}15`,
                      borderRadius: '0.375em',
                      border: `1px solid ${statusColor}30`
                    }}>
                      <div style={{
                        width: '0.375em',
                        height: '0.375em',
                        borderRadius: '50%',
                        background: statusColor,
                        boxShadow: `0 0 6px ${statusColor}`
                      }} />
                      <span style={{
                        color: statusColor,
                        fontSize: '0.75rem',
                        fontWeight: '700'
                      }}>
                        {getStatusText(service.status)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Descripción */}
              <p style={{
                color: theme.textSecondary,
                fontSize: '0.9rem',
                margin: '0 0 0.625em 0',
                lineHeight: 1.4
              }}>
                {service.description}
              </p>

              {/* Características */}
              <div style={{ marginBottom: '1em' }}>
                <h4 style={{
                  fontSize: '0.75rem',
                  fontWeight: '700',
                  color: theme.textMuted,
                  margin: '0 0 0.75em 0',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em'
                }}>
                  Características:
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625em' }}>
                  {service.features.map((feature: any, index: number) => {
                    const FeatureIcon = feature.icon;
                    return (
                      <div key={index} style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.625em',
                        padding: '0.5em 0.75em',
                        background: darkMode ? 'rgba(251, 191, 36, 0.05)' : 'rgba(251, 191, 36, 0.08)',
                        borderRadius: '0.5em',
                        border: `1px solid ${darkMode ? 'rgba(251, 191, 36, 0.1)' : 'rgba(251, 191, 36, 0.15)'}`,
                        transition: 'all 0.2s ease'
                      }}>
                        <div style={{
                          width: '1.75em',
                          height: '1.75em',
                          background: `${theme.accent}15`,
                          borderRadius: '0.375em',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0
                        }}>
                          <FeatureIcon size={14} color={theme.accent} strokeWidth={2.5} />
                        </div>
                        <span style={{
                          color: theme.textPrimary,
                          fontSize: '0.8125rem',
                          fontWeight: '600'
                        }}>
                          {feature.text}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Información de contacto */}
              <div style={{
                background: darkMode ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)',
                borderRadius: '0.75em',
                padding: '0.875em',
                marginBottom: '1em',
                border: `1px solid ${darkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)'}`
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5em', marginBottom: '0.5em' }}>
                  <div style={{
                    width: '1.5em',
                    height: '1.5em',
                    background: darkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)',
                    borderRadius: '0.375em',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <Clock size={12} color={theme.textMuted} strokeWidth={2.5} />
                  </div>
                  <span style={{ color: theme.textSecondary, fontSize: '0.8125rem', fontWeight: '500' }}>
                    {service.schedule}
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5em' }}>
                  <div style={{
                    width: '1.5em',
                    height: '1.5em',
                    background: darkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)',
                    borderRadius: '0.375em',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <Mail size={12} color={theme.textMuted} strokeWidth={2.5} />
                  </div>
                  <span style={{ color: theme.textSecondary, fontSize: '0.8125rem', fontWeight: '500' }}>
                    {service.contact}
                  </span>
                </div>
              </div>

              {/* Botón de acción */}
              <button
                onClick={() => {
                  if ((service as any).isSpecial && service.id === 1) {
                    setShowPagosMenuales(true);
                  }
                }}
                style={{
                  width: '100%',
                  background: (service as any).isSpecial
                    ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
                    : `linear-gradient(135deg, ${theme.accent} 0%, ${theme.warning} 100%)`,
                  color: '#fff',
                  border: 'none',
                  borderRadius: '0.75em',
                  padding: '0.875em 1em',
                  fontSize: '0.875rem',
                  fontWeight: '700',
                  cursor: 'pointer',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5em',
                  boxShadow: (service as any).isSpecial
                    ? '0 4px 12px rgba(16, 185, 129, 0.3)'
                    : `0 4px 12px ${theme.accent}40`,
                  position: 'relative',
                  overflow: 'hidden'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = (service as any).isSpecial
                    ? '0 6px 20px rgba(16, 185, 129, 0.4)'
                    : `0 6px 20px ${theme.accent}50`;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = (service as any).isSpecial
                    ? '0 4px 12px rgba(16, 185, 129, 0.3)'
                    : `0 4px 12px ${theme.accent}40`;
                }}
              >
                <CreditCard size={16} strokeWidth={2.5} color="#fff" />
                {service.action}
              </button>
            </div>
          );
        })}
      </div>

      {/* Mensaje si no hay resultados */}
      {filteredServices.length === 0 && (
        <div style={{
          background: theme.cardBg,
          border: `0.0625rem solid ${theme.border}`,
          borderRadius: '0.75em',
          padding: '2em 1em',
          textAlign: 'center',
          backdropFilter: 'blur(0.625rem)',
          boxShadow: darkMode ? '0 0.75rem 1.5rem rgba(0, 0, 0, 0.25)' : '0 0.75rem 1.5rem rgba(0, 0, 0, 0.08)'
        }}>
          <Search size={24} color={theme.textMuted} style={{ marginBottom: '0.625em' }} />
          <h3 style={{
            fontSize: '1.1rem',
            fontWeight: '800',
            color: theme.textPrimary,
            margin: '0 0 0.375em 0'
          }}>
            No se encontraron servicios
          </h3>
          <p style={{
            color: theme.textSecondary,
            fontSize: '0.9rem',
            margin: 0
          }}>
            Intenta con otros términos de búsqueda
          </p>
        </div>
      )}
    </div>
  );
};

export default Servicios;
