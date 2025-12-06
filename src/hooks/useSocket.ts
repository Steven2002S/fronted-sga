import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';

const API_BASE = (import.meta as any).env?.VITE_API_URL || 'http://localhost:3000';

export const useSocket = (events: { [event: string]: (data: any) => void }, userId?: number, courseIds?: number[]) => {
  const socketRef = useRef<Socket | null>(null);
  const eventsRef = useRef(events);
  const courseIdsRef = useRef(courseIds);

  // Actualizar referencias sin causar re-renders
  useEffect(() => {
    eventsRef.current = events;
  }, [events]);

  useEffect(() => {
    courseIdsRef.current = courseIds;
  }, [courseIds]);

  // Obtener userId de sessionStorage si no se proporciona
  const getUserId = () => {
    if (userId) return userId;

    try {
      // Primero intentar obtener de auth_user
      const authUser = sessionStorage.getItem('auth_user');
      if (authUser) {
        const userData = JSON.parse(authUser);
        return userData.id_usuario;
      }

      // Si no, intentar decodificar el token JWT
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
    return null;
  };

  useEffect(() => {
    // Solo crear el socket una vez
    if (!socketRef.current) {
      socketRef.current = io(API_BASE, {
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionAttempts: 5
      });

      const socket = socketRef.current;

      socket.on('connect', () => {
        // Obtener userId y rol
        const currentUserId = getUserId();
        const token = sessionStorage.getItem('auth_token');
        let rol = 'unknown';

        if (token) {
          try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            rol = payload.rol;
          } catch (e) {
            console.error('Error decodificando rol:', e);
          }
        }

        if (currentUserId) {
          socket.emit('register', {
            userId: currentUserId,
            id_usuario: currentUserId,
            rol,
            cursos: courseIdsRef.current || []
          });
        }
      });

      socket.on('registered', (data: any) => {
        // Registro confirmado
      });

      socket.on('disconnect', () => {
        // Desconectado
      });
    }

    // Limpiar listeners anteriores antes de registrar nuevos
    const socket = socketRef.current;
    if (socket) {
      // Remover todos los listeners de eventos personalizados (no los de sistema)
      Object.keys(eventsRef.current).forEach((eventName) => {
        socket.off(eventName);
      });

      // Registrar los nuevos eventos
      const eventNames = Object.keys(events);

      eventNames.forEach((eventName) => {
        socket.on(eventName, (data: any) => {
          // Usar eventsRef.current para obtener siempre el handler más reciente
          if (eventsRef.current[eventName]) {
            eventsRef.current[eventName](data);
          }
        });
      });
    }

    // NO limpiar el socket para mantener la conexión persistente
    return () => {
      // Socket se mantiene conectado entre re-renders
    };
    // Usamos JSON.stringify para evitar re-renders por cambios de referencia en el objeto events
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(Object.keys(events))]);

  // Re-registrar usuario cuando el userId o courseIds cambien
  useEffect(() => {
    if (socketRef.current && socketRef.current.connected && userId) {
      const token = sessionStorage.getItem('auth_token');
      let rol = 'unknown';
      if (token) {
        try {
          const payload = JSON.parse(atob(token.split('.')[1]));
          rol = payload.rol;
        } catch (e) { console.error(e); }
      }

      socketRef.current.emit('register', {
        userId,
        id_usuario: userId,
        rol,
        cursos: courseIds || []
      });
    }
    // Usamos JSON.stringify para evitar re-renders por cambios de referencia en el array courseIds
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, JSON.stringify(courseIds)]);

  return socketRef.current;
};
