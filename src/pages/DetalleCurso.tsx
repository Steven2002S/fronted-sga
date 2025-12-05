import React, { useState, useEffect } from 'react';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import {
  Sparkles,
  ArrowLeftCircle,
  Clock,
  Users,
  Award,
  Star,
  ChevronDown,
  Play,
  Check,
  BookOpen,
  Gift,
  Calendar,
  CreditCard
} from 'lucide-react';
import Footer from '../components/Footer';
import { useTheme } from '../context/ThemeContext';

// Backend API base
const API_BASE = (import.meta as any).env?.VITE_API_URL ? `${(import.meta as any).env.VITE_API_URL}/api` : 'http://localhost:3000/api';

// Interfaces para tipado
interface CursoDetalle {
  titulo: string;
  descripcion: string;
  duracion: string;
  requisitos: string[];
  malla: string[];
  promociones: string[];
  imagen: string;
  rating: number;
  estudiantes: number;
  instructor: string;
  precio: string;
  certificacion: string;
}

interface DetallesCursos {
  [key: string]: CursoDetalle;
}

interface SectionCardProps {
  children: React.ReactNode;
  variant?: 'default' | 'gold' | 'glass' | 'premium';
  delay?: number;
  icon?: React.ReactNode;
  title?: string;
  isExpandable?: boolean;
  sectionId?: string;
}

interface AnimatedButtonProps {
  children: React.ReactNode;
  href: string;
  variant?: 'primary' | 'secondary';
}

// Datos reales de los cursos con información actualizada
const detallesCursos: DetallesCursos = {
  cosmetologia: {
    titulo: 'Cosmetología',
    descripcion: 'Domina las técnicas profesionales de cuidado facial, corporal y estética. Un programa completo que te prepara para ser un experto en el mundo de la belleza.',
    duracion: '12 meses',
    requisitos: [
      'Edad mínima: 16 años',
      'No requiere bachillerato',
      'Pasión por la belleza y estética'
    ],
    malla: [
      'Anatomía y fisiología de la piel',
      'Técnicas de limpieza facial profunda',
      'Tratamientos hidratantes y nutritivos',
      'Masajes relajantes y terapéuticos',
      'Tratamientos corporales',
      'Prácticas supervisadas con clientes reales',
      'Emprendimiento y atención al cliente'
    ],
    promociones: [
      'Pago mensual de $90 USD',
      'Materiales y productos incluidos',
      'Certificación profesional avalada'
    ],
    imagen: 'https://res.cloudinary.com/dfczvdz7b/image/upload/v1758908042/cosme1_cjsu3k.jpg',
    rating: 4.9,
    estudiantes: 850,
    instructor: 'Especialistas Certificados',
    precio: '$90/mes',
    certificacion: 'Certificado Profesional en Cosmetología'
  },
  cosmiatria: {
    titulo: 'Cosmiatría',
    descripcion: 'Especialízate en tratamientos estéticos avanzados con equipos de última tecnología. Programa exclusivo para cosmetólogas graduadas.',
    duracion: '7 meses',
    requisitos: [
      'Edad mínima: 17 años',
      'Requisito: Ser Cosmetóloga graduada (presentar certificado)'
    ],
    malla: [
      'Equipos de alta tecnología estética',
      'Tratamientos faciales con aparatología',
      'Microdermoabrasión y peeling químico',
      'Radiofrecuencia y cavitación',
      'Mesoterapia facial',
      'Tratamientos anti-edad avanzados',
      'Prácticas con equipos profesionales',
      'Protocolos de seguridad y bioseguridad'
    ],
    promociones: [
      'Pago mensual de $90 USD',
      'Acceso a equipos de última generación',
      'Prácticas en spa profesional'
    ],
    imagen: 'https://res.cloudinary.com/dfczvdz7b/image/upload/v1758901284/cosmeto_cy3e36.jpg',
    rating: 4.8,
    estudiantes: 320,
    instructor: 'Especialistas en Cosmiatría',
    precio: '$90/mes',
    certificacion: 'Certificado Profesional en Cosmiatría'
  },
  integral: {
    titulo: 'Belleza Integral',
    descripcion: 'El programa más completo que combina cosmetología, peluquería y técnicas avanzadas de belleza. Conviértete en un profesional integral.',
    duracion: '12 meses',
    requisitos: [
      'Edad mínima recomendada: 16 años',
      'Si es menor de 14 años: autorización escrita del tutor',
      'No requiere bachillerato'
    ],
    malla: [
      'Cosmetología facial y corporal',
      'Peluquería y corte profesional',
      'Colorimetría y técnicas de tinturado',
      'Peinados y recogidos',
      'Manicure y pedicure',
      'Depilación integral',
      'Maquillaje social y profesional',
      'Tratamientos capilares',
      'Emprendimiento en belleza',
      'Atención al cliente VIP'
    ],
    promociones: [
      'Pago mensual de $90 USD',
      'Kit completo de herramientas incluido',
      'Prácticas en salón profesional'
    ],
    imagen: 'https://res.cloudinary.com/dfczvdz7b/image/upload/v1758908293/cos2_se1xyb.jpg',
    rating: 4.9,
    estudiantes: 650,
    instructor: 'Equipo Multidisciplinario',
    precio: '$90/mes',
    certificacion: 'Certificado Profesional en Belleza Integral'
  },
  unas: {
    titulo: 'Técnica de Uñas',
    descripcion: 'Especialízate en el arte del nail art y técnicas profesionales de manicure. Un programa intensivo con modalidad de pago flexible.',
    duracion: '16 clases (8 semanas)',
    requisitos: [
      'Sin límite de edad',
      'Si es menor de 14 años: autorización escrita del tutor',
      'No requiere experiencia previa'
    ],
    malla: [
      'Anatomía de las uñas',
      'Técnicas de manicure clásico',
      'Esmaltado permanente (gel)',
      'Nail art y decoración',
      'Uñas acrílicas básicas',
      'Uñas en gel',
      'Diseños creativos y tendencias',
      'Cuidado y mantenimiento',
      'Atención al cliente especializada'
    ],
    promociones: [
      'Primer pago: $50 USD',
      'Clases restantes: $15.40 cada una',
      '2 clases por semana - Horarios flexibles',
      'Kit de herramientas incluido'
    ],
    imagen: 'https://res.cloudinary.com/dfczvdz7b/image/upload/v1758902047/una_yzabr3.jpg',
    rating: 4.8,
    estudiantes: 420,
    instructor: 'Especialista en Nail Art',
    precio: '$50 matrícula + $15.40/clase',
    certificacion: 'Certificado en Técnica de Uñas'
  },
  lashista: {
    titulo: 'Lashista Profesional',
    descripcion: 'Conviértete en experta en extensiones de pestañas con las técnicas más avanzadas del mercado. Programa intensivo y práctico.',
    duracion: '6 clases (6 semanas)',
    requisitos: [
      'Edad mínima: 15 años',
      'Destreza manual',
      'Paciencia y precisión'
    ],
    malla: [
      'Anatomía del ojo y pestañas',
      'Técnicas de extensión clásica',
      'Técnica volumen ruso',
      'Selección de materiales',
      'Aplicación paso a paso',
      'Mantenimiento y retoque',
      'Cuidados post-aplicación',
      'Atención especializada al cliente'
    ],
    promociones: [
      'Primer pago: $50 USD',
      'Clases restantes: $26 cada una',
      '1 clase por semana',
      'Kit profesional incluido'
    ],
    imagen: 'https://res.cloudinary.com/dfczvdz7b/image/upload/v1758900822/lashi_vuiiiv.jpg',
    rating: 4.9,
    estudiantes: 280,
    instructor: 'Lashista Certificada Internacional',
    precio: '$50 matrícula + $26/clase',
    certificacion: 'Certificado Profesional Lashista'
  },
  maquillaje: {
    titulo: 'Maquillaje Profesional',
    descripcion: 'Domina el arte del maquillaje desde lo básico hasta técnicas avanzadas. Ideal para emprender o trabajar en el mundo de la belleza.',
    duracion: '6 meses',
    requisitos: [
      'Edad mínima: 18 años',
      'No requiere experiencia previa',
      'Certificación profesional al finalizar (según normativa vigente)'
    ],
    malla: [
      'Teoría del color aplicada',
      'Preparación de la piel',
      'Maquillaje social día y noche',
      'Técnicas de contouring y highlighting',
      'Maquillaje para fotografía',
      'Maquillaje de novias',
      'Corrección de imperfecciones',
      'Tendencias y estilos actuales',
      'Portfolio profesional'
    ],
    promociones: [
      'Pago mensual de $90 USD',
      'Kit de maquillaje profesional incluido',
      'Prácticas con modelos reales'
    ],
    imagen: 'https://res.cloudinary.com/dfczvdz7b/image/upload/v1758899626/eff_rxclz1.jpg',
    rating: 4.9,
    estudiantes: 520,
    instructor: 'Maquilladora Profesional',
    precio: '$90/mes',
    certificacion: 'Certificado Profesional en Maquillaje'
  },
  facial: {
    titulo: 'Cosmetología',
    descripcion: 'Domina las técnicas profesionales de cuidado facial, corporal y estética. Un programa completo que te prepara para ser un experto en el mundo de la belleza.',
    duracion: '12 meses',
    requisitos: [
      'Ser mayor de 16 años',
      'No requiere bachillerato',
      'Pasión por la belleza y estética'
    ],
    malla: [
      'Anatomía y fisiología de la piel',
      'Técnicas de limpieza facial profunda',
      'Tratamientos hidratantes y nutritivos',
      'Depilación con cera y técnicas avanzadas',
      'Masajes relajantes y terapéuticos',
      'Tratamientos corporales',
      'Prácticas supervisadas con clientes reales',
      'Emprendimiento y atención al cliente'
    ],
    promociones: [
      'Pago mensual de $90 USD',
      'Materiales y productos incluidos',
      'Certificación profesional avalada'
    ],
    imagen: 'https://res.cloudinary.com/dfczvdz7b/image/upload/v1755893924/cursos_xrnjuu.png',
    rating: 4.9,
    estudiantes: 850,
    instructor: 'Especialistas Certificados',
    precio: '$90/mes',
    certificacion: 'Certificado Profesional en Cosmetología'
  },
  'alta-peluqueria': {
    titulo: 'Alta Peluquería',
    descripcion: 'Formación premium en cortes avanzados, colorimetría, balayage, mechas y peinados de alta moda. Orientado a quienes buscan destacar en salones profesionales.',
    duracion: '8 meses',
    requisitos: [
      'Edad mínima: 16 años',
      'No requiere experiencia previa',
      'Pasión por el estilismo capilar'
    ],
    malla: [
      'Fundamentos de corte profesional',
      'Técnicas de colorimetría avanzada',
      'Balayage y mechas californianas',
      'Peinados de alta moda',
      'Tratamientos capilares especializados',
      'Tendencias internacionales',
      'Prácticas en salón profesional',
      'Gestión de negocio y atención al cliente'
    ],
    promociones: [
      'Pago mensual de $90 USD',
      'Kit profesional de herramientas incluido',
      'Certificación avalada internacionalmente'
    ],
    imagen: 'https://res.cloudinary.com/dfczvdz7b/image/upload/v1758920782/pelu_hvfyfn.png',
    rating: 4.9,
    estudiantes: 680,
    instructor: 'Estilista Profesional Certificado',
    precio: '$90/mes',
    certificacion: 'Certificado Profesional en Alta Peluquería'
  },
  'moldin-queen': {
    titulo: 'Moldin Queen',
    descripcion: 'Técnicas especializadas de modelado y estilizado con enfoque en precisión, simetría y acabado impecable. Ideal para elevar tu portafolio profesional.',
    duracion: '6 meses',
    requisitos: [
      'Edad mínima: 16 años',
      'Destreza manual',
      'Atención al detalle'
    ],
    malla: [
      'Fundamentos de modelado profesional',
      'Técnicas de simetría y proporción',
      'Acabados impecables',
      'Estilos contemporáneos',
      'Técnicas avanzadas de moldeado',
      'Productos profesionales especializados',
      'Prácticas supervisadas',
      'Portfolio profesional'
    ],
    promociones: [
      'Pago mensual de $90 USD',
      'Materiales especializados incluidos',
      'Certificación profesional'
    ],
    imagen: 'https://res.cloudinary.com/dfczvdz7b/image/upload/v1758915245/mold_o5qksq.png',
    rating: 4.8,
    estudiantes: 540,
    instructor: 'Especialista en Modelado',
    precio: '$90/mes',
    certificacion: 'Certificado Profesional Moldin Queen'
  }
};

const DetalleCurso: React.FC = () => {
  const { theme } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const params = new URLSearchParams(location.search);
  const cursoKey = params.get('curso') || 'facial';
  const cursoId = params.get('id_curso');

  const [curso, setCurso] = useState<CursoDetalle | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  // Cargar datos del curso desde el backend
  useEffect(() => {
    const fetchCurso = async () => {
      try {
        if (cursoId) {
          // Si tenemos ID específico, obtener del backend
          const response = await fetch(`${API_BASE}/cursos/${cursoId}`);
          if (response.ok) {
            const cursoData = await response.json();
            setCurso({
              titulo: cursoData.nombre,
              descripcion: cursoData.tipo_descripcion || 'Curso profesional de belleza estética',
              duracion: `${Math.ceil((new Date(cursoData.fecha_fin).getTime() - new Date(cursoData.fecha_inicio).getTime()) / (1000 * 60 * 60 * 24 * 30))} meses`,
              requisitos: ['Ser mayor de 16 años', 'Secundaria completa', 'Entrevista personal'],
              malla: ['Módulo 1: Fundamentos', 'Módulo 2: Técnicas básicas', 'Módulo 3: Técnicas avanzadas', 'Módulo 4: Práctica supervisada', 'Módulo 5: Certificación'],
              promociones: ['10% de descuento por pago al contado', 'Matrícula gratis hasta fin de mes'],
              imagen: 'https://images.unsplash.com/photo-1515378791036-0648a3ef77b2?auto=format&fit=crop&w=600&q=80',
              rating: 4.8,
              estudiantes: 850,
              instructor: 'Instructor Profesional',
              precio: `$${cursoData.precio_base?.toLocaleString() || '2,500'}`,
              certificacion: 'Certificado Profesional'
            });
          } else {
            // Fallback a datos locales
            setCurso(detallesCursos[cursoKey] || detallesCursos['facial']);
          }
        } else {
          // Usar datos locales
          setCurso(detallesCursos[cursoKey] || detallesCursos['facial']);
        }
      } catch (error) {
        console.error('Error cargando curso:', error);
        setCurso(detallesCursos[cursoKey] || detallesCursos['facial']);
      } finally {
        setLoading(false);
      }
    };

    fetchCurso();
  }, [cursoKey, cursoId]);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  const handleSectionClick = (section: string) => {
    setActiveSection(activeSection === section ? null : section);
  };

  const SectionCard: React.FC<SectionCardProps> = ({
    children,
    variant = 'default',
    delay = 0,
    icon,
    title,
    isExpandable = false,
    sectionId
  }) => {
    const baseStyle: React.CSSProperties = {
      borderRadius: '24px',
      marginBottom: '32px',
      padding: '32px',
      cursor: isExpandable ? 'pointer' : 'default',
      transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
      transform: isVisible ? 'translateY(0) scale(1)' : 'translateY(50px) scale(0.95)',
      opacity: isVisible ? 1 : 0,
      transitionDelay: `${delay}ms`,
      position: 'relative',
      overflow: 'hidden'
    };

    const variants: Record<string, React.CSSProperties> = {
      default: {
        ...baseStyle,
        background: theme === 'dark' ? 'linear-gradient(135deg, rgba(0,0,0,0.9) 0%, rgba(26,26,26,0.9) 100%)' : 'rgba(255, 255, 255, 0.97)',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(251, 191, 36, 0.2)',
        boxShadow: theme === 'dark' ? '0 20px 40px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(251, 191, 36, 0.1)' : '0 10px 28px rgba(0, 0, 0, 0.1), 0 0 0 1px rgba(209, 160, 42, 0.2)',
        color: theme === 'dark' ? '#fff' : '#1f2937'
      },
      gold: {
        ...baseStyle,
        background: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)',
        boxShadow: '0 20px 40px rgba(251, 191, 36, 0.3), 0 0 60px rgba(251, 191, 36, 0.2)',
        color: '#000',
        border: 'none'
      },
      glass: {
        ...baseStyle,
        background: theme === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(255, 255, 255, 0.9)',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(255, 255, 255, 0.2)',
        boxShadow: theme === 'dark' ? '0 20px 40px rgba(0, 0, 0, 0.3)' : '0 10px 28px rgba(0, 0, 0, 0.12)',
        color: theme === 'dark' ? '#fff' : '#1f2937'
      },
      premium: {
        ...baseStyle,
        background: theme === 'dark' ? 'linear-gradient(135deg, rgba(0,0,0,0.9) 0%, rgba(26,26,26,0.9) 100%)' : 'rgba(255, 255, 255, 0.97)',
        backdropFilter: 'blur(20px)',
        border: '2px solid #fbbf24',
        boxShadow: '0 20px 40px rgba(251, 191, 36, 0.2), inset 0 1px 0 rgba(255,255,255,0.1)',
        color: theme === 'dark' ? '#fff' : '#1f2937'
      }
    };

    const [isHovered, setIsHovered] = useState(false);

    const hoverStyle: React.CSSProperties = variant === 'default' ? {
      transform: 'translateY(-5px) scale(1.02)',
      boxShadow: '0 25px 50px rgba(251, 191, 36, 0.15), 0 0 0 1px rgba(251, 191, 36, 0.2)'
    } : variant === 'gold' ? {
      transform: 'translateY(-5px) scale(1.02)',
      boxShadow: '0 25px 50px rgba(251, 191, 36, 0.4), 0 0 80px rgba(251, 191, 36, 0.3)'
    } : {
      transform: 'translateY(-5px) scale(1.02)',
      boxShadow: '0 25px 50px rgba(251, 191, 36, 0.3)'
    };

    const currentStyle = isHovered ? { ...variants[variant], ...hoverStyle } : variants[variant];

    return (
      <div
        className="section-card"
        style={currentStyle}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onClick={isExpandable && sectionId ? () => handleSectionClick(sectionId) : undefined}
      >
        {/* Efecto de brillo animado */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: '-100%',
          width: '100%',
          height: '100%',
          background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)',
          animation: isVisible ? 'shimmer 3s ease-in-out infinite' : 'none',
          animationDelay: `${delay + 1000}ms`
        }} />

        <div style={{ position: 'relative', zIndex: 1 }}>
          {title && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '20px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                {icon}
                <h2 style={{
                  fontSize: '1.6rem',
                  fontWeight: '700',
                  margin: 0,
                  background: variant === 'premium' ? 'linear-gradient(135deg, #fbbf24, #f59e0b)' : 'inherit',
                  WebkitBackgroundClip: variant === 'premium' ? 'text' : 'inherit',
                  WebkitTextFillColor: variant === 'premium' ? 'transparent' : 'inherit',
                  color: variant === 'gold' ? '#111' : 'inherit'
                }}>
                  {title}
                </h2>
              </div>
              {isExpandable && (
                <div style={{
                  transition: 'transform 0.3s ease',
                  transform: activeSection === sectionId ? 'rotate(180deg)' : 'rotate(0deg)'
                }}>
                  <ChevronDown size={24} />
                </div>
              )}
            </div>
          )}

          <div style={{
            maxHeight: isExpandable && activeSection !== sectionId ? '0px' : '1000px',
            overflow: 'hidden',
            transition: 'max-height 0.5s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.5s',
            opacity: isExpandable && activeSection !== sectionId ? 0 : 1
          }}>
            {children}
          </div>
        </div>
      </div>
    );
  };

  const AnimatedButton: React.FC<AnimatedButtonProps> = ({ children, href, variant = 'primary' }) => {
    const [isHovered, setIsHovered] = useState(false);

    const baseStyle: React.CSSProperties = {
      display: 'inline-flex',
      alignItems: 'center',
      gap: '12px',
      padding: '16px 32px',
      borderRadius: '50px',
      fontWeight: '700',
      fontSize: '1.1rem',
      textDecoration: 'none',
      border: 'none',
      cursor: 'pointer',
      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      position: 'relative',
      overflow: 'hidden',
      marginTop: '20px'
    };

    const variants: Record<string, React.CSSProperties> = {
      primary: {
        ...baseStyle,
        background: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)',
        color: '#000',
        boxShadow: '0 8px 32px rgba(251, 191, 36, 0.3)'
      },
      secondary: {
        ...baseStyle,
        background: theme === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(255, 255, 255, 0.9)',
        color: '#fbbf24',
        border: '2px solid #fbbf24',
        backdropFilter: 'blur(10px)'
      }
    };

    const hoverStyle: React.CSSProperties = {
      transform: 'translateY(-2px) scale(1.05)',
      boxShadow: variant === 'primary' ?
        '0 12px 40px rgba(251, 191, 36, 0.4)' :
        '0 12px 40px rgba(251, 191, 36, 0.2)'
    };

    const currentStyle = isHovered ? { ...variants[variant], ...hoverStyle } : variants[variant];

    return (
      <Link
        to={href}
        style={currentStyle}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div style={{
          position: 'absolute',
          top: 0,
          left: isHovered ? '100%' : '-100%',
          width: '100%',
          height: '100%',
          background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)',
          transition: 'left 0.6s ease'
        }} />
        {children}
      </Link>
    );
  };

  if (loading) {
    return (
      <div style={{
        paddingTop: 120,
        textAlign: 'center',
        color: '#fbbf24',
        minHeight: '100vh',
        background: theme === 'dark'
          ? 'linear-gradient(135deg, #000 0%, #1a1a1a 50%, #000 100%)'
          : 'linear-gradient(135deg, #ffffff 0%, #f3f4f6 50%, #ffffff 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div>
          <Sparkles size={40} color="#fbbf24" style={{ animation: 'pulse 2s infinite' }} />
          <h2 style={{ marginTop: 20 }}>Cargando curso...</h2>
        </div>
      </div>
    );
  }

  if (!curso) {
    return (
      <div style={{
        paddingTop: 120,
        textAlign: 'center',
        color: '#fbbf24',
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #000 0%, #1a1a1a 50%, #000 100%)'
      }}>
        <h2>Curso no encontrado</h2>
        <Link
          to="/"
          style={{
            background: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)',
            color: '#000',
            padding: '12px 32px',
            borderRadius: '30px',
            textDecoration: 'none',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            fontWeight: '700',
            boxShadow: '0 8px 32px rgba(251,191,36,0.3)',
            transition: 'all 0.3s ease'
          }}
        >
          <Sparkles size={16} />
          Volver al inicio
        </Link>
        <Footer />
      </div>
    );
  }

  return (
    <>
      <style>
        {`
          @keyframes shimmer {
            0% { left: -100%; }
            100% { left: 100%; }
          }
          
          @keyframes fadeInUp {
            from {
              opacity: 0;
              transform: translateY(30px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
          
          @keyframes pulse {
            0%, 100% { transform: scale(1); }
            50% { transform: scale(1.05); }
          }
          
          .floating-particles {
            position: absolute;
            width: 100%;
            height: 100%;
            overflow: hidden;
            pointer-events: none;
          }
          
          .particle {
            position: absolute;
            background: #fbbf24;
            border-radius: 50%;
            opacity: 0.1;
            animation: float 6s ease-in-out infinite;
          }
          
          @keyframes float {
            0%, 100% {
              transform: translateY(0px) rotate(0deg);
              opacity: 0.1;
            }
            50% {
              transform: translateY(-20px) rotate(180deg);
              opacity: 0.3;
            }
          }
          
          .gradient-text {
            background: linear-gradient(135deg, #fbbf24, #f59e0b);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
          }

          /* Responsive Styles */
          @media (max-width: 768px) {
            .header-content {
              flex-direction: column !important;
              text-align: center !important;
              gap: 24px !important;
            }
            
            .header-image {
              width: 120px !important;
              height: 120px !important;
            }
            
            .header-title {
              font-size: 2rem !important;
            }
            
            .header-description {
              font-size: 1.1rem !important;
            }
            
            .metrics-container {
              justify-content: center !important;
              gap: 16px !important;
            }
            
            .duration-grid {
              grid-template-columns: 1fr !important;
              gap: 16px !important;
            }
            
            .duration-content {
              flex-direction: column !important;
              text-align: center !important;
            }
            
            .duration-image {
              width: 120px !important;
              height: 120px !important;
              margin: 0 auto !important;
            }
            
            .requisitos-grid {
              grid-template-columns: 1fr !important;
            }
            
            .malla-grid {
              grid-template-columns: 1fr !important;
            }
            
            .promociones-grid {
              grid-template-columns: 1fr !important;
            }
            
            .section-card {
              margin-bottom: 24px !important;
              padding: 24px 20px !important;
            }
          }

          @media (max-width: 480px) {
            .header-title {
              font-size: 1.8rem !important;
            }
            
            .header-description {
              font-size: 1rem !important;
            }
            
            .section-card {
              padding: 20px 16px !important;
              margin-bottom: 20px !important;
            }
            
            .duration-card, .requisito-card, .malla-card, .promocion-card {
              padding: 16px !important;
            }
          }
        `}
      </style>

      <div style={{
        minHeight: '100vh',
        background: theme === 'dark'
          ? 'linear-gradient(135deg, #000 0%, #1a1a1a 50%, #000 100%)'
          : 'linear-gradient(135deg, #ffffff 0%, #f3f4f6 50%, #ffffff 100%)',
        position: 'relative',
        overflow: 'hidden',
        fontFamily: "'Inter', 'Segoe UI', sans-serif",
        paddingTop: 110,
        paddingBottom: 0
      }}>
        {/* Partículas flotantes de fondo */}
        <div className="floating-particles">
          {[...Array(15)].map((_, i) => (
            <div
              key={i}
              className="particle"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                width: `${Math.random() * 4 + 1}px`,
                height: `${Math.random() * 4 + 1}px`,
                animationDelay: `${Math.random() * 6}s`,
                animationDuration: `${Math.random() * 3 + 4}s`
              }}
            />
          ))}
        </div>

        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px', position: 'relative', zIndex: 1 }}>
          {/* Botón volver mejorado */}
          <button
            onClick={() => navigate(-1)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              background: theme === 'dark' ? 'rgba(0,0,0,0.8)' : 'rgba(255,255,255,0.95)',
              border: '1px solid rgba(251, 191, 36, 0.3)',
              borderRadius: '50px',
              padding: '12px 24px',
              cursor: 'pointer',
              boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
              color: '#fbbf24',
              margin: '24px 0 40px 0',
              backdropFilter: 'blur(10px)',
              transition: 'all 0.3s ease',
              fontWeight: '600',
              fontSize: '1.1rem'
            }}
            onMouseEnter={(e) => {
              const target = e.currentTarget as HTMLElement;
              target.style.transform = 'translateX(-5px)';
              target.style.boxShadow = '0 12px 40px rgba(251, 191, 36, 0.2)';
            }}
            onMouseLeave={(e) => {
              const target = e.currentTarget as HTMLElement;
              target.style.transform = 'translateX(0)';
              target.style.boxShadow = '0 8px 32px rgba(0,0,0,0.3)';
            }}
          >
            <ArrowLeftCircle size={24} />
            Volver
          </button>

          {/* Header del curso mejorado */}
          <div className="header-content" style={{
            display: 'flex',
            alignItems: 'center',
            gap: 40,
            marginBottom: 60,
            padding: '40px',
            background: 'rgba(255, 255, 255, 0.05)',
            borderRadius: '32px',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            backdropFilter: 'blur(20px)',
            transform: isVisible ? 'translateY(0)' : 'translateY(30px)',
            opacity: isVisible ? 1 : 0,
            transition: 'all 0.8s cubic-bezier(0.4, 0, 0.2, 1)',
            position: 'relative',
            overflow: 'hidden'
          }}>
            <div style={{
              position: 'relative',
              borderRadius: '24px',
              overflow: 'hidden',
              boxShadow: '0 20px 40px rgba(251, 191, 36, 0.3)'
            }}>
              <img
                src={curso.imagen}
                alt={curso.titulo}
                className="header-image"
                style={{
                  width: 180,
                  height: 180,
                  objectFit: 'cover',
                  transition: 'transform 0.3s ease'
                }}
                onMouseEnter={(e) => {
                  const target = e.currentTarget as HTMLImageElement;
                  target.style.transform = 'scale(1.1)';
                }}
                onMouseLeave={(e) => {
                  const target = e.currentTarget as HTMLImageElement;
                  target.style.transform = 'scale(1)';
                }}
              />
            </div>
            <div style={{ flex: 1 }}>
              <h1 className="gradient-text header-title" style={{
                fontSize: '3rem',
                fontWeight: '800',
                marginBottom: 16,
                lineHeight: 1.2
              }}>
                {curso.titulo}
              </h1>
              <p className="header-description" style={{
                color: theme === 'dark' ? 'rgba(255, 255, 255, 0.8)' : 'rgba(31, 41, 55, 0.8)',
                fontSize: '1.3rem',
                marginBottom: 24,
                lineHeight: 1.6
              }}>
                {curso.descripcion}
              </p>

              {/* Métricas del curso */}
              <div className="metrics-container" style={{
                display: 'flex',
                gap: 32,
                alignItems: 'center',
                flexWrap: 'wrap'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Star size={20} fill="#fbbf24" color="#fbbf24" />
                  <span style={{ color: '#fbbf24', fontWeight: '600' }}>{curso.rating}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Users size={20} color="#fff" />
                  <span style={{ color: theme === 'dark' ? '#fff' : '#1f2937' }}>{curso.estudiantes} estudiantes</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Award size={20} color="#fbbf24" />
                  <span style={{ color: theme === 'dark' ? '#fff' : '#1f2937' }}>{curso.certificacion}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Sección Duración */}
          <SectionCard
            variant="default"
            delay={200}
            icon={<Clock size={28} color="#fbbf24" />}
            title="Duración del Curso"
          >
            <div className="duration-content" style={{ display: 'flex', alignItems: 'center', gap: 32 }}>
              <div style={{ flex: 1 }}>
                <div className="duration-grid" style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                  gap: 24,
                  marginBottom: 24
                }}>
                  <div className="duration-card" style={{
                    padding: '20px',
                    background: 'rgba(251, 191, 36, 0.1)',
                    borderRadius: '16px',
                    border: '1px solid rgba(251, 191, 36, 0.2)'
                  }}>
                    <Calendar size={24} color="#fbbf24" style={{ marginBottom: 8 }} />
                    <div style={{ fontWeight: '600', color: theme === 'dark' ? '#fff' : '#1f2937', fontSize: '1.2rem' }}>
                      {curso.duracion}
                    </div>
                    <div style={{ color: theme === 'dark' ? 'rgba(255, 255, 255, 0.7)' : 'rgba(31, 41, 55, 0.7)', fontSize: '0.9rem' }}>Duración total</div>
                  </div>
                  <div className="duration-card" style={{
                    padding: '20px',
                    background: 'rgba(251, 191, 36, 0.1)',
                    borderRadius: '16px',
                    border: '1px solid rgba(251, 191, 36, 0.2)'
                  }}>
                    <BookOpen size={24} color="#fbbf24" style={{ marginBottom: 8 }} />
                    <div style={{ fontWeight: '600', color: theme === 'dark' ? '#fff' : '#1f2937', fontSize: '1.2rem' }}>
                      Modalidad Mixta
                    </div>
                    <div style={{ color: theme === 'dark' ? 'rgba(255, 255, 255, 0.7)' : 'rgba(31, 41, 55, 0.7)', fontSize: '0.9rem' }}>Presencial + Virtual</div>
                  </div>
                </div>
                <p style={{ color: theme === 'dark' ? 'rgba(255, 255, 255, 0.8)' : 'rgba(31, 41, 55, 0.8)', fontSize: '1.1rem', lineHeight: 1.6 }}>
                  Nuestro programa está diseñado para ofrecerte una experiencia de aprendizaje completa
                  y flexible, combinando la práctica presencial con recursos digitales de vanguardia.
                </p>
              </div>
              <img
                src={curso.imagen}
                alt="Duración"
                className="duration-image"
                style={{
                  width: 160,
                  height: 160,
                  borderRadius: 20,
                  objectFit: 'cover',
                  boxShadow: '0 12px 32px rgba(251, 191, 36, 0.2)'
                }}
              />
            </div>
            <AnimatedButton href={`/pago?curso=${cursoKey}`}>
              <Sparkles size={18} />
              Inscríbete Ahora
            </AnimatedButton>
          </SectionCard>

          {/* Sección Requisitos */}
          <SectionCard
            variant="gold"
            delay={400}
            icon={<Check size={28} color="#000" />}
            title="Requisitos de Ingreso"
          >
            <div className="requisitos-grid" style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
              gap: 24,
              marginBottom: 24
            }}>
              {curso.requisitos.map((req, idx) => (
                <div key={idx} className="requisito-card" style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 16,
                  padding: '16px 20px',
                  background: 'rgba(0, 0, 0, 0.1)',
                  borderRadius: '16px',
                  border: '1px solid rgba(0, 0, 0, 0.1)'
                }}>
                  <div style={{
                    width: 40,
                    height: 40,
                    borderRadius: '50%',
                    background: 'rgba(0, 0, 0, 0.2)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}>
                    <Check size={20} color="#000" />
                  </div>
                  <span style={{
                    fontSize: '1.1rem',
                    fontWeight: '500',
                    color: '#000'
                  }}>
                    {req}
                  </span>
                </div>
              ))}
            </div>
            <p style={{
              color: 'rgba(0, 0, 0, 0.7)',
              fontSize: '1rem',
              fontStyle: 'italic',
              marginBottom: 0
            }}>
              Todos los requisitos son flexibles y evaluamos cada caso de manera individual.
            </p>
            <AnimatedButton href={`/pago?curso=${cursoKey}`} variant="primary">
              <Sparkles size={18} />
              Consultar Admisión
            </AnimatedButton>
          </SectionCard>

          {/* Sección Malla Curricular */}
          <SectionCard
            variant="premium"
            delay={600}
            icon={<BookOpen size={28} color="#fbbf24" />}
            title="Malla Curricular"
            isExpandable={true}
            sectionId="malla"
          >
            <div className="malla-grid" style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
              gap: 24
            }}>
              {curso.malla.map((modulo, idx) => (
                <div
                  key={idx}
                  className="malla-card"
                  style={{
                    padding: '24px',
                    background: 'rgba(251, 191, 36, 0.1)',
                    borderRadius: '16px',
                    border: '1px solid rgba(251, 191, 36, 0.3)',
                    transition: 'all 0.3s ease',
                    cursor: 'pointer'
                  }}
                  onMouseEnter={(e) => {
                    const target = e.currentTarget as HTMLElement;
                    target.style.transform = 'translateY(-4px)';
                    target.style.boxShadow = '0 12px 32px rgba(251, 191, 36, 0.2)';
                  }}
                  onMouseLeave={(e) => {
                    const target = e.currentTarget as HTMLElement;
                    target.style.transform = 'translateY(0)';
                    target.style.boxShadow = 'none';
                  }}
                >
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 16,
                    marginBottom: 12
                  }}>
                    <div style={{
                      width: 32,
                      height: 32,
                      borderRadius: '50%',
                      background: 'linear-gradient(135deg, #fbbf24, #f59e0b)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#000',
                      fontWeight: '700',
                      fontSize: '0.9rem'
                    }}>
                      {idx + 1}
                    </div>
                    <Play size={16} color="#fbbf24" />
                  </div>
                  <h3 style={{
                    color: theme === 'dark' ? '#fff' : '#1f2937',
                    fontSize: '1.2rem',
                    fontWeight: '600',
                    margin: 0,
                    lineHeight: 1.4
                  }}>
                    {modulo}
                  </h3>
                </div>
              ))}
            </div>
            <AnimatedButton href={`/pago?curso=${cursoKey}`}>
              <BookOpen size={18} />
              Ver Programa Completo
            </AnimatedButton>
          </SectionCard>

          {/* Sección Plan de Pago y Modalidad */}
          <SectionCard
            variant="glass"
            delay={800}
            icon={<CreditCard size={28} color="#fbbf24" />}
            title="Plan de Pago y Modalidad"
          >
            <div className="promociones-grid" style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
              gap: 24,
              marginBottom: 24
            }}>
              {curso.promociones.map((promo, idx) => (
                <div key={idx} className="promocion-card" style={{
                  padding: '24px',
                  background: 'rgba(251, 191, 36, 0.1)',
                  borderRadius: '20px',
                  border: '2px solid rgba(251, 191, 36, 0.3)',
                  position: 'relative',
                  overflow: 'hidden'
                }}>
                  <div style={{
                    position: 'absolute',
                    top: 16,
                    right: 16,
                    background: 'linear-gradient(135deg, #fbbf24, #f59e0b)',
                    borderRadius: '50%',
                    width: 40,
                    height: 40,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    animation: 'pulse 2s infinite'
                  }}>
                    <Gift size={20} color="#000" />
                  </div>
                  <h4 style={{
                    color: '#fbbf24',
                    fontSize: '1.3rem',
                    fontWeight: '700',
                    marginBottom: 12,
                    paddingRight: 60
                  }}>
                    Oferta Especial {idx + 1}
                  </h4>
                  <p style={{
                    color: theme === 'dark' ? 'rgba(255, 255, 255, 0.9)' : 'rgba(31, 41, 55, 0.9)',
                    fontSize: '1.1rem',
                    margin: 0,
                    lineHeight: 1.5
                  }}>
                    {promo}
                  </p>
                </div>
              ))}
            </div>
            <div style={{
              padding: '24px',
              background: 'linear-gradient(135deg, rgba(251, 191, 36, 0.2), rgba(245, 158, 11, 0.2))',
              borderRadius: '20px',
              border: '1px solid rgba(251, 191, 36, 0.4)',
              textAlign: 'center'
            }}>
              <h3 className="gradient-text" style={{
                fontSize: '1.8rem',
                fontWeight: '700',
                marginBottom: 12
              }}>
                {curso.precio}
              </h3>
              <p style={{
                color: theme === 'dark' ? 'rgba(255, 255, 255, 0.8)' : 'rgba(31, 41, 55, 0.8)',
                fontSize: '1rem',
                margin: 0
              }}>
                Precio especial por tiempo limitado
              </p>
            </div>
            <AnimatedButton href={`/pago?curso=${cursoKey}`}>
              <Gift size={18} />
              Aprovechar Promoción
            </AnimatedButton>
          </SectionCard>

          {/* Sección de llamada a la acción final */}
          <SectionCard
            variant="gold"
            delay={1000}
          >
            <div style={{ textAlign: 'center' }}>
              <h2 style={{
                fontSize: '2.5rem',
                fontWeight: '800',
                color: '#000',
                marginBottom: 20
              }}>
                ¡Transforma tu Futuro Hoy!
              </h2>
              <p style={{
                fontSize: '1.3rem',
                color: 'rgba(0, 0, 0, 0.8)',
                marginBottom: 32,
                lineHeight: 1.6
              }}>
                Únete a los miles de profesionales que han cambiado sus vidas con nuestros cursos.
                <br />
                Tu nueva carrera en belleza te está esperando.
              </p>

              <div style={{
                display: 'flex',
                gap: 20,
                justifyContent: 'center',
                flexWrap: 'wrap'
              }}>
                <AnimatedButton href={`/pago?curso=${cursoKey}`}>
                  <Sparkles size={20} />
                  Inscribirme Ahora
                </AnimatedButton>
                <Link
                  to="/contacto"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '16px 32px',
                    borderRadius: '50px',
                    fontWeight: '700',
                    fontSize: '1.1rem',
                    textDecoration: 'none',
                    background: 'rgba(0, 0, 0, 0.2)',
                    color: '#000',
                    border: '2px solid rgba(0, 0, 0, 0.3)',
                    transition: 'all 0.3s ease',
                    marginTop: '20px'
                  }}
                  onMouseEnter={(e) => {
                    const target = e.currentTarget as HTMLElement;
                    target.style.background = 'rgba(0, 0, 0, 0.3)';
                    target.style.transform = 'translateY(-2px)';
                  }}
                  onMouseLeave={(e) => {
                    const target = e.currentTarget as HTMLElement;
                    target.style.background = 'rgba(0, 0, 0, 0.2)';
                    target.style.transform = 'translateY(0)';
                  }}
                >
                  <Users size={18} />
                  Más Información
                </Link>
              </div>
            </div>
          </SectionCard>
        </div>

        <Footer />
      </div>
    </>
  );
};

export default DetalleCurso;