import React, {
  useState,
  useEffect
} from 'react';
import { useNavigate } from 'react-router-dom';
import AOS from 'aos';
import 'aos/dist/aos.css';
import {
  Eye,
  EyeOff,
  Shield,
  CheckCircle,
  ArrowRight,
  GraduationCap,
  BookOpen,
  User,
  Lock
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import LoadingModal from '../components/LoadingModal';

const API_BASE = (import.meta as any).env?.VITE_API_URL ? `${(import.meta as any).env.VITE_API_URL}/api` : 'http://localhost:3000/api';

const AulaVirtual = () => {
  const { theme } = useTheme();
  const navigate = useNavigate();
  const [isVisible, setIsVisible] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    identifier: '', // usuario o correo
    password: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    setIsVisible(true);
    AOS.init({ duration: 1000, once: true, easing: 'ease-out-back' });
    // En caso de contenido dinámico
    setTimeout(() => AOS.refresh(), 0);
  }, []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg(null);

    // Función para forzar un retraso mínimo
    const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
    try {
      const isEmail = formData.identifier.includes('@');
      const payload = isEmail
        ? { email: formData.identifier.trim(), password: formData.password }
        : { username: formData.identifier.trim(), password: formData.password };
      // Ejecutar la petición y el retraso en paralelo
      const [res] = await Promise.all([
        fetch(`${API_BASE}/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        }),
        delay(1000) // Forzar 1 segundo de espera
      ]);

      // Manejar errores de autenticación
      if (!res.ok) {
        let errorMessage = 'Credenciales inválidas';

        try {
          const errorData = await res.json();
          if (errorData.error) {
            errorMessage = errorData.error;
          } else if (errorData.bloqueada) {
            errorMessage = errorData.motivo || 'Su cuenta ha sido bloqueada. Por favor, contacte con el área administrativa.';
          }
        } catch {
          // Si no se puede parsear como JSON, usar el mensaje por defecto
        }

        throw new Error(errorMessage);
      }
      const data = await res.json();
      if (!data?.token || !data?.user) throw new Error('Respuesta inválida del servidor');
      // Guardar token y usuario en sessionStorage para que al cerrar la pestaña se cierre la sesión
      sessionStorage.setItem('auth_token', data.token);
      sessionStorage.setItem('auth_user', JSON.stringify(data.user));

      // Redirección según rol
      if (data.user.rol === 'superadmin') {
        navigate('/panel/superadmin');
        return;
      }
      if (data.user.rol === 'administrativo') {
        navigate('/panel/administrativo');
        return;
      }
      if (data.user.rol === 'estudiante') {
        navigate('/panel/estudiante');
        return;
      }
      if (data.user.rol === 'docente') {
        navigate('/panel/docente');
        return;
      }
      // Otros roles: mostrar éxito y quedar en la página
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 1500);
    } catch (err: any) {
      setErrorMsg(err.message || 'No se pudo iniciar sesión');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: name === 'identifier' ? value.toLowerCase() : value
    });
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  if (showSuccess) {
    return (
      <div style={{
        minHeight: '100vh',
        background: theme === 'dark'
          ? 'rgba(0, 0, 0, 0.95)'
          : 'linear-gradient(135deg, #ffffff 0%, #f3f4f6 50%, #ffffff 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        paddingTop: 110,
        fontFamily: "'Cormorant Garamond', 'Playfair Display', 'Georgia', serif"
      }}>
        <div
          style={{
            background: 'rgba(255, 255, 255, 0.95)',
            borderRadius: '32px',
            padding: '60px',
            textAlign: 'center',
            maxWidth: '500px',
            margin: '0 24px',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(251, 191, 36, 0.3)',
            boxShadow: '0 10px 25px rgba(251, 191, 36, 0.1)'
          }}
          data-aos="fade-up"
          data-aos-delay="60"
        >
          <div
            style={{
              width: '80px',
              height: '80px',
              background: 'linear-gradient(135deg, #10b981, #059669)',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 24px',
              animation: 'pulse 2s infinite'
            }}
          >
            <CheckCircle size={40} color="#fff" />
          </div>
          <h2
            style={{
              fontSize: '2.5rem',
              fontWeight: '800',
              color: '#1a1a1a',
              marginBottom: '16px',
              fontFamily: "'Cormorant Garamond', serif"
            }}
          >
            ¡Bienvenida!
          </h2>
          <p
            style={{
              color: '#666',
              fontSize: '1.2rem',
              marginBottom: '32px',
              lineHeight: 1.6,
              fontFamily: "'Crimson Text', serif"
            }}
          >
            Has ingresado exitosamente al Aula Virtual.
            Redirigiendo al panel de estudiante...
          </p>
          <div
            style={{
              background: 'rgba(251, 191, 36, 0.1)',
              padding: '20px',
              borderRadius: '16px',
              marginBottom: '24px'
            }}
          >
            <p style={{
              color: '#b45309',
              fontWeight: '600',
              margin: 0,
              fontFamily: "'Montserrat', sans-serif"
            }}>
              Accediendo a tu panel de estudiante...
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <style>
        {`
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
          
          @keyframes shimmer {
            0% { left: -100%; }
            100% { left: 100%; }
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
          
          @keyframes pulse {
            0%, 100% { transform: scale(1); }
            50% { transform: scale(1.05); }
          }
          
          @keyframes twinkle {
            0%, 100% { opacity: 0.3; transform: scale(1); }
            50% { opacity: 1; transform: scale(1.2); }
          }
          
          @keyframes gradientShift {
            0% { background-position: 0% 50%; }
            50% { background-position: 100% 50%; }
            100% { background-position: 0% 50%; }
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
          
          .gradient-text {
            background: linear-gradient(45deg, #fbbf24, #f59e0b, #fbbf24, #d97706);
            background-size: 300% 300%;
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            display: inline-block;
            animation: gradientShift 3s ease-in-out infinite;
          }
          
          .login-container {
            min-height: 100vh;
            background: ${theme === 'dark'
            ? 'rgba(0, 0, 0, 0.95)'
            : 'linear-gradient(135deg, #ffffff 0%, #f3f4f6 50%, #ffffff 100%)'};
            position: relative;
            overflow: hidden;
            font-family: 'Montserrat', system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif;
            padding-top: 0; /* sin separación extra con el navbar */
            display: flex;
            align-items: center;
          }
          
          .main-content {
            max-width: none; /* permitir ancho completo para imagen half-bleed */
            margin: 0;
            padding: 0; /* sin padding para que la imagen llegue al borde */
            position: relative;
            z-index: 1;
            width: 100vw; /* asegurar ocupar todo el viewport */
          }
          
          .login-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 0;
            align-items: stretch;
            min-height: 100vh;
            position: relative;
          }
          
          .image-section {
            position: relative;
            display: flex;
            justify-content: center;
            align-items: center;
            background: linear-gradient(135deg, rgba(251, 191, 36, 0.05) 0%, rgba(245, 158, 11, 0.05) 100%);
            overflow: hidden;
          }
          
          .image-section::before {
            content: '';
            position: absolute;
            top: 0;
            right: 0;
            width: 0; /* sin sombra entre imagen y login */
            height: 100%;
            background: transparent;
            z-index: 2;
          }
          
          .hero-image {
            width: 100%;
            height: 100%;
            object-fit: cover;
            object-position: center;
            filter: brightness(0.85) contrast(1.1) saturate(1.05);
            transition: all 0.6s cubic-bezier(0.4, 0, 0.2, 1);
          }
          
          .hero-image:hover {
            filter: brightness(0.9) contrast(1.15) saturate(1.1);
            transform: scale(1.02);
          }
          
          .login-section {
            display: flex;
            flex-direction: column;
            justify-content: center;
            padding: 92px 48px 52px; /* ajustar para que quepa sin scroll en desktop */
            background: ${theme === 'dark'
            ? 'rgba(0, 0, 0, 0.95)'
            : 'rgba(255, 255, 255, 0.97)'};
            position: relative;
          }
          
          .login-section::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: radial-gradient(ellipse at left center, rgba(251, 191, 36, 0.03) 0%, transparent 70%);
            z-index: 0;
          }
          
          .login-header {
            text-align: center;
            margin-top: 0; /* manejado por el padding-top del contenedor */
            margin-bottom: 24px; /* menos espacio entre textos y tarjeta */
            position: relative;
            z-index: 1;
          }
          
          .badge {
            display: inline-flex;
            align-items: center;
            border-radius: 24px;
            padding: 10px 20px;
            margin-bottom: 12px;
            backdrop-filter: blur(15px);
            font-family: 'Montserrat', 'Inter', 'Helvetica', sans-serif;
            font-weight: 600;
            letter-spacing: 0.5px;
            gap: 8px;
          }
          
          .badge svg {
            color: #fbbf24;
          }
          
          .badge span {
            font-size: 1rem;
            font-weight: 500;
          }
          
          .main-title {
            font-size: 3.05rem;
            font-weight: 800;
            color: theme === 'dark' ? '#fff' : '#1f2937';
            margin-bottom: 12px;
            line-height: 1.1;

            font-family: 'Montserrat', system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif;
            letter-spacing: -0.01em;
            text-align: center;
          }
          
          .subtitle {
            font-size: 1.05rem;
            color: theme === 'dark' ? 'rgba(255, 255, 255, 0.86)' : 'rgba(31, 41, 55, 0.8)';
            margin-bottom: 16px; /* reducir separación con la tarjeta */
            line-height: 1.6;

            font-family: 'Montserrat', system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif;
            font-weight: 500;
            text-align: center;
          }
          
          .login-form {
            background: ${theme === 'dark'
            ? 'linear-gradient(135deg, rgba(255, 255, 255, 0.08), rgba(255, 255, 255, 0.02))'
            : '#ffffff'};
            backdrop-filter: blur(24px);
            -webkit-backdrop-filter: blur(24px);
            border: 1px solid ${theme === 'dark' ? 'rgba(255, 255, 255, 0.12)' : 'rgba(209, 160, 42, 0.2)'};
            border-radius: 28px;
            padding: 32px; /* más compacto para doble columna */
            box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
            position: relative;
            z-index: 1;
            max-width: 640px; /* más ancho para acomodar dos columnas */
            margin: 0 auto;
            color: theme === 'dark' ? '#fff' : '#1f2937';
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 32px;
            align-items: start;
          }
          
          .login-form::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            height: 1px;
            background: linear-gradient(90deg, transparent, rgba(251, 191, 36, 0.3), transparent);
          }
          
          .login-form-section {
            display: flex;
            flex-direction: column;
          }
          
          .form-inputs {
            display: flex;
            flex-direction: column;
          }
          .form-group {
            margin-bottom: 16px; /* compactar verticalmente */
          }
          
          .form-label {
            display: block;
            margin-bottom: 8px;
            font-weight: 600;
            color: ${theme === 'dark' ? 'rgba(255,255,255,0.95)' : 'rgba(31, 41, 55, 0.9)'};
            font-size: 1rem;
            font-family: 'Montserrat', sans-serif;
          }
          
          .input-wrapper {
            position: relative;
          }
          
          .form-input {
            width: 100%;
            padding: 16px 48px 16px 48px;
            border: 1.5px solid ${theme === 'dark' ? 'rgba(255, 255, 255, 0.15)' : 'rgba(251, 191, 36, 0.5)'};
            border-radius: 14px;
            font-size: 1.05rem;
            transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
            background: ${theme === 'dark' ? 'rgba(255, 255, 255, 0.08)' : 'rgba(255, 255, 255, 0.95)'};
            color: ${theme === 'dark' ? '#fff' : '#1f2937'};
            font-family: 'Montserrat', sans-serif;
            font-weight: 500;
          }
          .form-input::placeholder { color: ${theme === 'dark' ? 'rgba(255,255,255,0.65)' : 'rgba(107, 114, 128, 0.7)'}; }
          
          .form-input:focus {
            outline: none;
            border-color: rgba(251, 191, 36, 0.7);
            box-shadow: 0 0 0 2px rgba(251, 191, 36, 0.1);
            transform: translateY(-2px);
          }
          
          .input-icon {
            position: absolute;
            left: 16px;
            top: 50%;
            transform: translateY(-50%);
            color: ${theme === 'dark' ? 'rgba(255,255,255,0.7)' : 'rgba(107, 114, 128, 0.6)'};
            transition: all 0.3s ease;
            z-index: 1;
          }
          
          .form-input:focus + .input-icon,
          .form-input:not(:placeholder-shown) + .input-icon {
            color: #fbbf24;
            transform: translateY(-50%) scale(1.1);
          }
          
          .password-toggle {
            position: absolute;
            right: 16px;
            top: 50%;
            transform: translateY(-50%);
            background: none;
            border: none;
            cursor: pointer;
            color: ${theme === 'dark' ? 'rgba(255,255,255,0.75)' : 'rgba(107, 114, 128, 0.7)'};
            transition: all 0.3s ease;
            padding: 4px;
            border-radius: 8px;
          }
          
          .password-toggle:hover {
            color: #fbbf24;
            background: rgba(251, 191, 36, 0.1);
          }
          
          .login-button {
            width: 100%;
            background: linear-gradient(45deg, #fbbf24, #f59e0b, #fbbf24);
            background-size: 200% 200%;
            color: black;
            padding: 16px 28px;
            border-radius: 50px;
            font-size: 1.1rem;
            font-weight: 700;
            border: none;
            cursor: pointer;
            transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
            box-shadow: 0 6px 20px rgba(251, 191, 36, 0.15);
            font-family: 'Montserrat', 'Inter', 'Helvetica', sans-serif;
            letter-spacing: 0.8px;
            text-transform: uppercase;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 12px;
            margin-top: 16px; /* menos aire debajo del formulario */
            position: relative;
            overflow: hidden;
          }
          
          .login-button:hover:not(:disabled) {
            transform: translateY(-3px) scale(1.02);
            box-shadow: 0 8px 25px rgba(251, 191, 36, 0.2);
          }
          
          .login-button:disabled {
            opacity: 0.7;
            cursor: not-allowed;
            transform: none;
          }
          
          .features-list {
            margin-top: 0;
            padding-top: 0;
            border-top: none;
            padding-left: 0;
          }
          
          .features-title {
            font-size: 1.1rem;
            font-weight: 600;
            color: ${theme === 'dark' ? 'rgba(255, 255, 255, 0.95)' : 'rgba(31, 41, 55, 0.9)'};
            margin-bottom: 16px;
            font-family: 'Montserrat', sans-serif;
          }
          
          .feature-item {
            display: flex;
            align-items: center;
            gap: 12px;
            margin-bottom: 12px;
            color: ${theme === 'dark' ? 'rgba(255,255,255,0.75)' : 'rgba(75, 85, 99, 0.8)'};
            font-size: 0.9rem;
            font-family: 'Montserrat', sans-serif;
          }
          
          .loading-spinner {
            width: 24px;
            height: 24px;
            border: 3px solid rgba(0, 0, 0, 0.3);
            border-radius: 50%;
            border-top-color: transparent;
            animation: spin 1s ease-in-out infinite;
          }
          
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
          
          /* RESPONSIVE DESIGN */
          @media (max-width: 768px) {
            .login-container {
              padding-top: 0;
            }
            
            .main-content {
              padding: 0;
            }
            
            .login-grid {
              grid-template-columns: 1fr;
              gap: 0;
              min-height: 100vh;
            }
            
            .image-section {
              height: 40vh;
              min-height: 300px;
            }
            
            .image-section::before {
              width: 100%;
              height: 80px;
              top: auto;
              bottom: 0;
              right: auto;
              left: 0;
              background: linear-gradient(0deg, rgba(0, 0, 0, 0.95) 0%, transparent 100%);
            }
            
            .hero-image {
              height: 100%;
            }
            
            .login-section {
              padding: 40px 20px;
              min-height: 60vh;
            }
            
            .main-title {
              font-size: 2.5rem;
            }
            
            .subtitle {
              font-size: 1.1rem;
            }
            
            .login-form {
              padding: 32px 24px;
              border-radius: 24px;
            }
            
            .form-input {
              padding: 14px 44px 14px 44px;
              font-size: 1rem;
            }
            
            .login-button {
              font-size: 1.1rem;
              padding: 16px 28px;
            }
          }
          
          @media (max-width: 480px) {
            .image-section {
              height: 35vh;
              min-height: 250px;
            }
            
            .login-section {
              padding: 30px 16px;
            }
            
            .badge {
              padding: 8px 16px;
              font-size: 0.85rem;
            }
            
            .main-title {
              font-size: 2rem;
            }
            
            .login-form {
              padding: 24px 20px;
              border-radius: 20px;
            }
          }
          
          @media (min-width: 769px) and (max-width: 1024px) {
            .login-section {
              padding: 60px 40px;
            }
            
            .login-form {
              padding: 45px;
            }
          }
          
          @media (min-width: 1400px) {
            .login-section {
              padding: 104px 64px 64px; /* balance entre navbar y evitar scroll */
            }
            
            .login-form {
              padding: 36px; /* más chata en pantallas grandes */
              max-width: 680px;
              gap: 36px;
            }
            .badge {
              padding: 12px 22px; /* un poco más grande para que se aprecie */
              border-width: 1.25px;
            }
            .badge span { font-size: 1.05rem; }
            .main-title { font-size: 3rem; }
            .subtitle { margin-bottom: 14px; }
            .features-list { margin-top: 0; padding-top: 0; }
          }
          
          /* Responsive: una columna en móvil */
          @media (max-width: 991px) {
            .login-form {
              grid-template-columns: 1fr;
              gap: 24px;
              max-width: 480px;
              padding: 32px;
            }
            .features-list {
              border-top: 1px solid rgba(251, 191, 36, 0.2);
              padding-top: 16px;
              margin-top: 16px;
            }
          }

          /* Ajustes para pantallas HD pequeñas (1366x768, etc.) */
          @media (min-width: 1200px) and (max-height: 800px) {
            .login-section {
              padding: 100px 48px 30px; /* más padding-top para evitar solapamiento con navbar */
            }
            .main-title {
              font-size: 2.6rem; /* más pequeño en pantallas bajas */
              margin-bottom: 8px;
            }
            .subtitle {
              font-size: 0.95rem;
              margin-bottom: 12px;
            }
            .login-form {
              padding: 28px;
              gap: 28px;
              max-width: 600px;
            }
            .features-title {
              font-size: 1rem;
              margin-bottom: 12px;
            }
            .feature-item {
              font-size: 0.85rem;
              margin-bottom: 10px;
            }
            .form-group {
              margin-bottom: 14px;
            }
            .login-button {
              padding: 14px 24px;
              font-size: 1rem;
              margin-top: 12px;
            }
          }

          /* Evitar scroll vertical solo en pantallas grandes con altura suficiente */
          @media (min-width: 1200px) and (min-height: 900px) {
            .login-grid { height: 100vh; }
            .login-container { overflow-y: hidden; }
          }
        `}
      </style>

      <div className="login-container">
        {/* Efectos de fondo con partículas animadas - Igual que Inicio.js */}
        <div className="floating-particles">
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className="particle"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                width: `${Math.random() * 4 + 2}px`,
                height: `${Math.random() * 4 + 2}px`,
                animationDelay: `${Math.random() * 6}s`,
                animationDuration: `${Math.random() * 3 + 4}s`
              }}
            />
          ))}
        </div>

        <div className="main-content">
          <div className="login-grid">
            {/* Sección de imagen (izquierda) */}
            <div
              className="image-section"
              data-aos="zoom-in"
              data-aos-offset="140"
              style={{
                transform: isVisible ? 'translateX(0)' : 'translateX(-50px)',
                opacity: isVisible ? 1 : 0,
                transition: 'all 0.8s cubic-bezier(0.4, 0, 0.2, 1)'
              }}
            >
              {/* Aquí va tu imagen - Por ahora uso una placeholder */}
              <img
                src="https://res.cloudinary.com/dfczvdz7b/image/upload/v1759544229/aula_qzzpke.jpg"
                alt="Aula Virtual - Jessica Vélez Escuela de Esteticistas"
                className="hero-image"
              />
            </div>

            {/* Sección de login (derecha) */}
            <div
              className="login-section"
              data-aos="zoom-in-up"
              data-aos-delay="120"
              data-aos-offset="140"
              style={{
                transform: isVisible ? 'translateX(0)' : 'translateX(50px)',
                opacity: isVisible ? 1 : 0,
                transition: 'all 0.8s cubic-bezier(0.4, 0, 0.2, 1)',
                transitionDelay: '200ms'
              }}
            >
              <div className="login-header">
                {/* Badge */}
                <div className="badge" style={{
                  backgroundColor: theme === 'dark' ? 'rgba(251, 191, 36, 0.28)' : 'rgba(255, 255, 255, 0.95)',
                  border: '1px solid rgba(251, 191, 36, 0.55)',
                  boxShadow: '0 4px 12px rgba(251, 191, 36, 0.08)',
                  color: theme === 'dark' ? '#fff' : '#000'
                }}>
                  <Eye size={16} color="#fbbf24" />
                  <span>Plataforma Virtual de Aprendizaje</span>
                </div>

                {/* Título Principal */}
                <h1 className="main-title">
                  Aula
                  <span className="gradient-text"> Virtual</span>
                </h1>

                {/* Subtítulo */}
                <p className="subtitle">
                  Accede a tu plataforma de aprendizaje personalizada.
                  Continúa tu formación profesional desde cualquier lugar.
                </p>
              </div>

              {/* Formulario de Login */}
              <form
                onSubmit={handleSubmit}
                className="login-form"
                data-aos="fade-up"
                data-aos-delay="200"
              >
                {/* Columna izquierda: Características */}
                <div className="login-form-section">
                  <h3 className="features-title">¿Por qué elegir nuestro Aula Virtual?</h3>
                  <div className="features-list">
                    <div className="feature-item">
                      <Shield size={16} color="#10b981" />
                      <span>Acceso seguro y encriptado</span>
                    </div>
                    <div className="feature-item">
                      <BookOpen size={16} color="#3b82f6" />
                      <span>Material de estudio actualizado</span>
                    </div>
                    <div className="feature-item">
                      <GraduationCap size={16} color="#8b5cf6" />
                      <span>Seguimiento de progreso académico</span>
                    </div>
                    <div className="feature-item">
                      <User size={16} color="#ef4444" />
                      <span>Soporte personalizado 24/7</span>
                    </div>
                  </div>
                </div>

                {/* Columna derecha: Formulario */}
                <div className="login-form-section">
                  <div className="form-inputs">
                    <div className="form-group">
                      <label htmlFor="identifier" className="form-label">
                        Usuario
                      </label>
                      <div className="input-wrapper">
                        <input
                          type="text"
                          id="identifier"
                          name="identifier"
                          value={formData.identifier}
                          onChange={handleChange}
                          className="form-input"
                          placeholder="tu usuario (o correo si eres admin)"
                          required
                        />
                        <User size={20} className="input-icon" />
                      </div>
                    </div>

                    <div className="form-group">
                      <label htmlFor="password" className="form-label">
                        Contraseña
                      </label>
                      <div className="input-wrapper">
                        <input
                          type={showPassword ? 'text' : 'password'}
                          id="password"
                          name="password"
                          value={formData.password}
                          onChange={handleChange}
                          className="form-input"
                          placeholder="••••••••"
                          required
                        />
                        <Lock size={20} className="input-icon" />
                        <button
                          type="button"
                          onClick={togglePasswordVisibility}
                          className="password-toggle"
                        >
                          {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                        </button>
                      </div>
                    </div>

                    {errorMsg && (
                      <div
                        style={{
                          background: 'rgba(239, 68, 68, 0.15)',
                          border: '1px solid rgba(239, 68, 68, 0.35)',
                          color: '#fecaca',
                          padding: '10px 14px',
                          borderRadius: 12,
                          marginBottom: 10
                        }}
                      >
                        {errorMsg}
                      </div>
                    )}

                    <button
                      type="submit"
                      className="login-button"
                      disabled={isLoading}
                    >
                      <>
                        Ingresar
                        <ArrowRight size={18} />
                      </>
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>

      </div>

      {/* Modal de carga */}
      <LoadingModal
        isOpen={isLoading}
        message="Iniciando sesión..."
        darkMode={theme === 'dark'}
        colorTheme="yellow"
        duration={2000}
        onComplete={() => {
          // No hacer nada aquí, el estado se maneja en el handleSubmit
        }}
      />
    </>
  );
};

export default AulaVirtual;