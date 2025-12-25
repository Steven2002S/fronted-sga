import { useState, useEffect, useCallback } from "react";
import { useSocket } from "./useSocket";

export interface Notificacion {
  id: string;
  tipo: "modulo" | "tarea" | "pago" | "calificacion" | "matricula" | "general";
  titulo: string;
  mensaje: string;
  leida: boolean;
  fecha: Date;
  fechaLeida?: Date;
  link?: string;
  data?: any;
}

type RolUsuario = "admin" | "docente" | "estudiante";

export const useNotifications = (rol: RolUsuario) => {
  const [notificaciones, setNotificaciones] = useState<Notificacion[]>([]);
  const [loading, setLoading] = useState(true);

  // Helper para determinar link basado en tipo y rol
  const obtenerLinkPorTipo = (tipo: string, rol: RolUsuario): string | undefined => {
    if (rol === 'admin') {
      if (tipo === 'matricula') return '/admin/matriculas';
      if (tipo === 'pago') return '/admin/pagos';
      if (tipo === 'general') return '/admin/usuarios';
    } else if (rol === 'estudiante') {
      if (tipo === 'modulo') return '/estudiante/cursos';
      if (tipo === 'tarea' || tipo === 'calificacion') return '/estudiante/tareas';
      if (tipo === 'pago') return '/estudiante/pagos';
      if (tipo === 'matricula') return '/estudiante/cursos';
      if (tipo === 'general') return '/estudiante/perfil';
    } else if (rol === 'docente') {
      if (tipo === 'tarea') return '/docente/tareas';
    }
    return undefined;
  };

  // Función para obtener notificaciones de la API
  const fetchNotifications = useCallback(async (retryCount = 0) => {
    try {
      const token = sessionStorage.getItem('auth_token');

      if (!token) {
        if (retryCount < 3) {
          console.log(`useNotifications: Token no encontrado, reintentando (${retryCount + 1}/3)...`);
          setTimeout(() => fetchNotifications(retryCount + 1), 1000);
        }
        return;
      }

      console.log('useNotifications: Obteniendo notificaciones del servidor...');
      const response = await fetch(`${(import.meta.env.VITE_API_URL || 'http://localhost:3000')}/api/notificaciones/mis-notificaciones?t=${Date.now()}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Cache-Control': 'no-cache'
        },
        cache: 'no-store'
      });

      if (response.ok) {
        const data = await response.json();
        console.log(`useNotifications: ${data.notificaciones?.length || 0} notificaciones obtenidas`);

        if (data.success && Array.isArray(data.notificaciones)) {
          // Mapear notificaciones de la BD al formato del frontend
          const mappedNotifications: Notificacion[] = data.notificaciones.map((n: any) => ({
            id: n.id_notificacion.toString(),
            tipo: n.tipo || 'general',
            titulo: n.titulo,
            mensaje: n.mensaje,
            leida: Boolean(n.leida),
            fecha: new Date(n.fecha_creacion),
            fechaLeida: n.fecha_lectura ? new Date(n.fecha_lectura) : undefined,
            link: obtenerLinkPorTipo(n.tipo, rol), // Helper para determinar link
            data: n // Guardar datos originales por si acaso
          }));
          setNotificaciones(mappedNotifications);
        }
      } else {
        console.error('useNotifications: Error en respuesta del servidor', response.status);
      }
    } catch (error) {
      console.error("Error fetching notifications:", error);
    } finally {
      setLoading(false);
    }
  }, [rol]);

  // Cargar notificaciones al montar
  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const agregarNotificacion = useCallback(
    (notif: Omit<Notificacion, "id" | "leida" | "fecha">) => {
      const nueva: Notificacion = {
        ...notif,
        id: `${Date.now()}-${Math.random()}`,
        leida: false,
        fecha: new Date()
      };
      setNotificaciones((prev) => [nueva, ...prev].slice(0, 50));

      if ("Notification" in window && Notification.permission === "granted") {
        new Notification(notif.titulo, {
          body: notif.mensaje,
          icon: "/logo.png"
        });
      }
    },
    []
  );

  const marcarTodasLeidas = useCallback(async () => {
    // Optimistic update
    const ahora = new Date();
    setNotificaciones((prev) =>
      prev.map((n) => ({
        ...n,
        leida: true,
        fechaLeida: ahora
      }))
    );

    // Call API
    try {
      const token = sessionStorage.getItem('auth_token');
      if (token) {
        await fetch(`${(import.meta.env.VITE_API_URL || 'http://localhost:3000')}/api/notificaciones/marcar-todas-leidas`, {
          method: 'PUT',
          headers: { 'Authorization': `Bearer ${token}` }
        });
      }
    } catch (error) {
      console.error("Error marking all as read:", error);
      // Revertir si falla? Por ahora no, para no molestar al usuario
    }
  }, []);

  // Solicitar permisos de notificación
  useEffect(() => {
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }
  }, []);

  const events: { [key: string]: (data: any) => void } = {};

  if (rol === "admin") {
    events.nueva_solicitud_matricula = (data: any) =>
      agregarNotificacion({
        tipo: "matricula",
        titulo: "📋 Nueva solicitud de matrícula",
        mensaje: `${data.nombre_solicitante} ${data.apellido_solicitante} solicita ${data.curso}`,
        link: "/admin/matriculas",
        data
      });

    events.matriculas_pendientes = (data: any) =>
      agregarNotificacion({
        tipo: "matricula",
        titulo: "⏳ Matrículas pendientes",
        mensaje: data.mensaje,
        link: "/admin/matriculas",
        data
      });

    events.nuevo_pago_pendiente = (data: any) => {
      const curso = data.curso_nombre ? ` - ${data.curso_nombre}` : '';
      agregarNotificacion({
        tipo: "pago",
        titulo: "💰 Nuevo pago pendiente",
        mensaje: `${data.estudiante_nombre}${curso} - Cuota #${data.numero_cuota}`,
        link: "/admin/pagos",
        data
      });
    };

    events.cuenta_bloqueada = (data: any) => {
      agregarNotificacion({
        tipo: "general",
        titulo: "🔒 Usuario Bloqueado",
        mensaje: `El estudiante ${data.nombre_estudiante} ha sido bloqueado. Motivo: ${data.motivo}`,
        link: "/admin/usuarios",
        data
      });
    };

    events.cuenta_desbloqueada = (data: any) => {
      agregarNotificacion({
        tipo: "general",
        titulo: "🔓 Usuario Desbloqueado",
        mensaje: `El estudiante ${data.nombre_estudiante} ha sido desbloqueado.`,
        link: "/admin/usuarios",
        data
      });
    };
  } else if (rol === "docente") {
    events.tarea_entregada_docente = (data: any) => {
      const curso = data.curso_nombre ? ` - ${data.curso_nombre}` : '';
      agregarNotificacion({
        tipo: "tarea",
        titulo: "📝 Tarea entregada",
        mensaje: `${data.estudiante_nombre} entregó "${data.tarea_titulo}"${curso}`,
        link: `/docente/tareas/${data.id_tarea}`,
        data
      });
    };

    events.tareas_por_calificar = (data: any) =>
      agregarNotificacion({
        tipo: "tarea",
        titulo: "⭐ Tareas por calificar",
        mensaje: data.mensaje,
        link: `/docente/tareas/${data.id_tarea}`,
        data
      });
  } else if (rol === "estudiante") {
    events.nuevo_modulo = (data: any) => {
      const docente = data.docente_nombre ? ` (${data.docente_nombre})` : '';
      agregarNotificacion({
        tipo: "modulo",
        titulo: "📚 Nuevo módulo disponible",
        mensaje: `${data.nombre_modulo} - ${data.curso_nombre}${docente}`,
        link: `/estudiante/cursos/${data.id_curso}`,
        data
      });
    };

    events.nueva_tarea = (data: any) => {
      const fechaEntrega = new Date(data.fecha_entrega);
      const fechaFormateada = fechaEntrega.toLocaleDateString('es-ES', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
      const horaFormateada = fechaEntrega.toLocaleTimeString('es-ES', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      });

      const curso = data.curso_nombre || 'tu curso';
      const docente = data.docente_nombre ? ` (${data.docente_nombre})` : '';

      agregarNotificacion({
        tipo: "tarea",
        titulo: "📝 Nueva tarea asignada",
        mensaje: `${data.titulo_tarea} - ${curso}${docente} - Fecha límite: ${fechaFormateada} a las ${horaFormateada}`,
        link: "/estudiante/tareas",
        data
      });
    };

    events.tarea_calificada = (data: any) => {
      const curso = data.curso_nombre ? ` - ${data.curso_nombre}` : '';
      const docente = data.docente_nombre ? ` (${data.docente_nombre})` : '';
      agregarNotificacion({
        tipo: "calificacion",
        titulo: "⭐ Tarea calificada",
        mensaje: `${data.tarea_titulo}${curso}${docente} - Nota: ${data.nota}`,
        link: "/estudiante/tareas",
        data
      });
    };

    events.pago_verificado_estudiante = (data: any) => {
      const curso = data.curso_nombre ? ` - ${data.curso_nombre}` : '';
      const admin = data.admin_nombre ? ` (verificado por ${data.admin_nombre})` : '';
      agregarNotificacion({
        tipo: "pago",
        titulo: "✅ Pago verificado",
        mensaje: `Cuota #${data.numero_cuota}${curso} - Monto: S/${data.monto}${admin}`,
        link: "/estudiante/pagos",
        data
      });
    };

    events.pago_rechazado = (data: any) => {
      const curso = data.curso_nombre ? ` - ${data.curso_nombre}` : '';
      const motivo = data.observaciones?.trim() ? data.observaciones : 'Revisa el comprobante y vuelve a subirlo.';
      agregarNotificacion({
        tipo: "pago",
        titulo: "❌ Pago rechazado",
        mensaje: `Cuota #${data.numero_cuota}${curso} - Motivo: ${motivo}`,
        link: "/estudiante/pagos",
        data
      });
    };

    events.matricula_aprobada = (data: any) =>
      agregarNotificacion({
        tipo: "matricula",
        titulo: "🎉 Matrícula aprobada",
        mensaje: `¡Bienvenido a ${data.curso_nombre}!`,
        link: "/estudiante/cursos",
        data
      });

    events.recordatorio_pago = (data: any) => {
      const curso = data.curso_nombre ? ` - ${data.curso_nombre}` : '';
      const fechaVencimiento = new Date(data.fecha_vencimiento).toLocaleDateString('es-ES', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });

      agregarNotificacion({
        tipo: "pago",
        titulo: "⚠️ Recordatorio de Pago",
        mensaje: `Tu cuota #${data.numero_cuota}${curso} vence el ${fechaVencimiento}. Evita el bloqueo de tu cuenta.`,
        link: "/estudiante/pagos",
        data
      });
    };

    events.cuenta_bloqueada = (data: any) => {
      agregarNotificacion({
        tipo: "general",
        titulo: "🚫 Cuenta Bloqueada",
        mensaje: `Tu cuenta ha sido bloqueada. Motivo: ${data.motivo}. Por favor contacta a administración.`,
        link: "/estudiante/perfil",
        data
      });
    };

    events.cuenta_desbloqueada = (data: any) => {
      agregarNotificacion({
        tipo: "general",
        titulo: "✅ Cuenta Desbloqueada",
        mensaje: `Tu cuenta ha sido desbloqueada. Ya puedes acceder a todos los servicios.`,
        link: "/estudiante/perfil",
        data
      });
    };

    events.desbloqueo_temporal = (data: any) => {
      const horas = data.horas_restantes || 24;
      agregarNotificacion({
        tipo: "pago",
        titulo: "⏰ Desbloqueo Temporal Concedido",
        mensaje: `Tienes ${horas} horas para subir la evidencia de pago. Si no lo haces, tu cuenta se bloqueará automáticamente.`,
        link: "/estudiante/pagos",
        data
      });
    };
  }

  // Obtener userId del sessionStorage o token
  const getUserId = () => {
    try {
      const authUser = sessionStorage.getItem('auth_user');
      if (authUser) {
        const userData = JSON.parse(authUser);
        return userData.id_usuario;
      }

      const token = sessionStorage.getItem('auth_token');
      if (token) {
        const parts = token.split('.');
        if (parts.length === 3) {
          const payload = JSON.parse(atob(parts[1]));
          return payload.id_usuario;
        }
      }
    } catch (error) {
      console.error('Error obteniendo userId:', error);
    }
    return undefined;
  };

  // Conectar socket con los eventos definidos
  useSocket(events, getUserId());

  const noLeidas = notificaciones.filter((n) => !n.leida).length;

  return {
    notificaciones,
    noLeidas,
    marcarTodasLeidas,
    loading
  };
};
