import { useState, useCallback, useRef } from 'react';
import toast from 'react-hot-toast';

interface ApiOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  body?: any;
  headers?: Record<string, string>;
  showSuccessToast?: boolean;
  successMessage?: string;
  showErrorToast?: boolean;
  autoRefresh?: boolean; // Auto-refresh después de operaciones exitosas
  refreshDelay?: number; // Delay antes de refrescar (ms)
}

interface UseApiWithRefreshOptions {
  onRefresh?: () => Promise<void>; // Función para refrescar datos
  baseUrl?: string;
}

interface UseApiWithRefreshReturn {
  loading: boolean;
  showLoadingModal: boolean;
  error: string | null;
  fetchData: <T = any>(endpoint: string, options?: ApiOptions) => Promise<T | null>;
  handleLoadingComplete: () => Promise<void>;
}

/**
 * Hook centralizado para manejar TODAS las peticiones al backend
 * con auto-refresh, cache y manejo de errores
 */
export const useApiWithRefresh = ({
  onRefresh,
  baseUrl = (import.meta as any).env?.VITE_API_URL || 'http://localhost:3000/api'
}: UseApiWithRefreshOptions = {}): UseApiWithRefreshReturn => {
  const [loading, setLoading] = useState(false);
  const [showLoadingModal, setShowLoadingModal] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Función principal para hacer peticiones
  const fetchData = useCallback(async <T = any>(
    endpoint: string,
    options: ApiOptions = {}
  ): Promise<T | null> => {
    const {
      method = 'GET',
      body,
      headers = {},
      showSuccessToast = true,
      successMessage,
      showErrorToast = true,
      autoRefresh = true,
      refreshDelay = 2000
    } = options;

    // Cancelar petición anterior si existe
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Crear nuevo AbortController
    abortControllerRef.current = new AbortController();

    setLoading(true);
    setError(null);

    try {
      // Obtener token de autenticación
      const token = sessionStorage.getItem('auth_token');

      // Preparar headers
      const requestHeaders: Record<string, string> = {
        'Authorization': token ? `Bearer ${token}` : '',
        ...headers
      };

      // Solo agregar Content-Type si no es FormData
      if (!(body instanceof FormData)) {
        requestHeaders['Content-Type'] = 'application/json';
      }

      // Construir URL completa
      const url = endpoint.startsWith('http') ? endpoint : `${baseUrl}${endpoint}`;

      // Hacer petición
      const response = await fetch(url, {
        method,
        headers: requestHeaders,
        body: body instanceof FormData ? body : (body ? JSON.stringify(body) : undefined),
        signal: abortControllerRef.current.signal
      });

      // Manejar respuesta
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Error desconocido' }));
        throw new Error(errorData.error || `Error ${response.status}`);
      }

      const data = await response.json();

      // Mostrar toast de éxito si es una operación de modificación
      if (showSuccessToast && ['POST', 'PUT', 'DELETE'].includes(method)) {
        const defaultMessages = {
          POST: 'Registro creado correctamente',
          PUT: 'Registro actualizado correctamente',
          DELETE: 'Registro eliminado correctamente'
        };
        toast.success(successMessage || defaultMessages[method as keyof typeof defaultMessages]);
      }

      // Auto-refresh después de operaciones (POST, PUT, DELETE, y opcionalmente GET)
      if (autoRefresh && onRefresh) {
        // Mostrar modal de carga
        setShowLoadingModal(true);
      }

      setLoading(false);
      return data as T;

    } catch (err: any) {
      // Ignorar errores de abort
      if (err.name === 'AbortError') {
        return null;
      }

      const errorMessage = err.message || 'Error en la petición';
      setError(errorMessage);

      if (showErrorToast) {
        toast.error(errorMessage);
      }

      setLoading(false);
      return null;
    }
  }, [baseUrl, onRefresh]);

  // Función que se ejecuta cuando el modal de carga termina
  const handleLoadingComplete = useCallback(async () => {
    if (onRefresh) {
      try {
        await onRefresh();
      } catch (error) {
        console.error('Error al refrescar datos:', error);
      }
    }
    setShowLoadingModal(false);
  }, [onRefresh]);

  return {
    loading,
    showLoadingModal,
    error,
    fetchData,
    handleLoadingComplete
  };
};

// Hook simplificado para operaciones CRUD comunes
export const useCrudOperations = <T = any>(
  endpoint: string,
  options: UseApiWithRefreshOptions = {}
) => {
  const api = useApiWithRefresh(options);

  return {
    ...api,
    // GET - Obtener todos
    getAll: useCallback(() =>
      api.fetchData<T[]>(endpoint, { method: 'GET', autoRefresh: false }),
      [api, endpoint]
    ),

    // GET - Obtener uno por ID
    getById: useCallback((id: number | string) =>
      api.fetchData<T>(`${endpoint}/${id}`, { method: 'GET', autoRefresh: false }),
      [api, endpoint]
    ),

    // POST - Crear
    create: useCallback((data: Partial<T>, successMessage?: string) =>
      api.fetchData<T>(endpoint, {
        method: 'POST',
        body: data,
        successMessage: successMessage || 'Registro creado correctamente'
      }),
      [api, endpoint]
    ),

    // PUT - Actualizar
    update: useCallback((id: number | string, data: Partial<T>, successMessage?: string) =>
      api.fetchData<T>(`${endpoint}/${id}`, {
        method: 'PUT',
        body: data,
        successMessage: successMessage || 'Registro actualizado correctamente'
      }),
      [api, endpoint]
    ),

    // DELETE - Eliminar
    remove: useCallback((id: number | string, successMessage?: string) =>
      api.fetchData<void>(`${endpoint}/${id}`, {
        method: 'DELETE',
        successMessage: successMessage || 'Registro eliminado correctamente'
      }),
      [api, endpoint]
    )
  };
};
