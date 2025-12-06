import React, { useState, useEffect } from "react";
import {
  BookOpen,
  FileText,
  Award,
  TrendingUp,
  Calendar,
  ChevronDown,
  ChevronRight,
  BarChart3,
} from "lucide-react";
import { showToast } from '../../config/toastConfig';
import { useSocket } from "../../hooks/useSocket";

const API_BASE = (import.meta as any).env?.VITE_API_URL ? `${(import.meta as any).env.VITE_API_URL}/api` : 'http://localhost:3000/api';

interface Curso {
  id_curso: number;
  codigo_curso: string;
  nombre: string;
  calificacion: number;
  progreso: number;
}

interface Calificacion {
  id_calificacion: number;
  id_tarea: number;
  id_modulo?: number;
  tarea_titulo: string; // Backend devuelve 'tarea_titulo'
  nota: number; // Backend devuelve 'nota'
  nota_maxima: number;
  ponderacion?: number;
  fecha_calificacion: string;
  comentario_docente: string; // Backend devuelve 'comentario_docente'
  modulo_nombre: string;
  modulo_orden: number;
  resultado: string; // aprobado/reprobado
}

interface ModuloConPromedio {
  id_modulo: number;
  nombre: string;
  orden: number;
  promedio_ponderado: number;
  total_tareas: number;
  tareas_calificadas: number;
  promedios_publicados: boolean;
  calificaciones: Calificacion[];
}

interface CalificacionesPorCurso {
  curso: Curso;
  calificaciones: Calificacion[];
  promedio: number;
  modulos: ModuloConPromedio[];
}

const Calificaciones: React.FC<{ darkMode: boolean }> = ({ darkMode: darkModeProp }) => {
  // Obtener darkMode del localStorage o usar el prop
  const [darkMode, setDarkMode] = useState(() => {
    if (darkModeProp !== undefined) return darkModeProp;
    const saved = localStorage.getItem('estudiante-dark-mode');
    return saved !== null ? JSON.parse(saved) : false;
  });

  const [cursosConCalificaciones, setCursosConCalificaciones] = useState<
    CalificacionesPorCurso[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [expandedCursos, setExpandedCursos] = useState<Record<number, boolean>>(
    {},
  );
  const [expandedModulos, setExpandedModulos] = useState<Record<string, boolean>>(
    {},
  );
  const [error, setError] = useState("");
  const [promediosGlobales, setPromediosGlobales] = useState<
    Record<number, any>
  >({});
  const [loadingPromedioGlobal, setLoadingPromedioGlobal] = useState<
    Record<number, boolean>
  >({});

  // Escuchar cambios en el tema (igual que docente)
  useEffect(() => {
    const handleStorageChange = () => {
      const saved = localStorage.getItem('estudiante-dark-mode');
      setDarkMode(saved !== null ? JSON.parse(saved) : false);
    };

    window.addEventListener('storage', handleStorageChange);

    // También escuchar cambios directos en el mismo tab
    const interval = setInterval(() => {
      const saved = localStorage.getItem('estudiante-dark-mode');
      const currentMode = saved !== null ? JSON.parse(saved) : false;
      setDarkMode(currentMode);
    }, 100);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(interval);
    };
  }, []);

  const theme = {
    textPrimary: darkMode ? "#fff" : "#1e293b",
    textSecondary: darkMode ? "rgba(255,255,255,0.8)" : "rgba(30,41,59,0.8)",
    textMuted: darkMode ? "rgba(255,255,255,0.6)" : "rgba(30,41,59,0.6)",
    border: darkMode ? "rgba(251, 191, 36, 0.2)" : "rgba(251, 191, 36, 0.3)",
    cardBg: darkMode ? "rgba(255,255,255,0.05)" : "rgba(255,255,255,0.8)",
    accent: "#fbbf24",
    success: "#10b981",
    warning: "#f59e0b",
    danger: "#ef4444",
  };

  const fetchCalificaciones = async () => {
    try {
      setLoading(true);
      const token = sessionStorage.getItem("auth_token");

      if (!token) {
        setError("No hay token de autenticación");
        return;
      }

      // Obtener cursos del estudiante
      const cursosResponse = await fetch(`${API_BASE}/estudiantes/mis-cursos`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!cursosResponse.ok) {
        throw new Error("Error al cargar los cursos");
      }

      const cursos: Curso[] = await cursosResponse.json();

      // Obtener calificaciones por curso
      const cursosConCalificacionesData: CalificacionesPorCurso[] = [];

      for (const curso of cursos) {
        try {
          const calificacionesResponse = await fetch(
            `${API_BASE}/calificaciones/estudiante/curso/${curso.id_curso}`,
            { headers: { Authorization: `Bearer ${token}` } },
          );

          if (calificacionesResponse.ok) {
            const calificacionesData = await calificacionesResponse.json();
            const calificaciones = Array.isArray(
              calificacionesData.calificaciones,
            )
              ? calificacionesData.calificaciones
              : [];

            // Calcular promedio (solo calificaciones válidas)
            const calificacionesValidas = calificaciones
              .filter(
                (cal: Calificacion) =>
                  cal.nota !== null && cal.nota !== undefined,
              )
              .map((cal: Calificacion) => ({
                ...cal,
                nota: parseFloat(cal.nota as any) || 0,
                nota_maxima: parseFloat(cal.nota_maxima as any) || 20,
              }));
            const totalNotas = calificacionesValidas.reduce(
              (sum: number, cal: Calificacion) => sum + cal.nota,
              0,
            );
            const promedio =
              calificacionesValidas.length > 0
                ? totalNotas / calificacionesValidas.length
                : 0;

            // Agrupar calificaciones por módulo y calcular promedio ponderado
            const modulos = agruparPorModulo(calificaciones);

            cursosConCalificacionesData.push({
              curso,
              calificaciones,
              promedio,
              modulos,
            });
          }
        } catch (error) {
          console.error(
            `Error cargando calificaciones para curso ${curso.id_curso}:`,
            error,
          );
        }
      }

      setCursosConCalificaciones(cursosConCalificacionesData);
    } catch (error) {
      console.error("Error al cargar calificaciones:", error);
      setError("Error al cargar las calificaciones");
    } finally {
      setLoading(false);
    }
  };

  // Escuchar eventos de WebSocket para actualizaciones en tiempo real
  useSocket({
    calificacion_actualizada: (data: any) => {
      showToast.success(`Nueva calificación disponible`, darkMode);

      // Recargar calificaciones
      fetchCalificaciones();
    },
    entrega_calificada: (data: any) => {
      showToast.success(`Tu tarea "${data.tarea_titulo || 'ha sido'}" calificada`, darkMode);

      // Recargar calificaciones
      fetchCalificaciones();
    },
    promedio_actualizado: (data: any) => {
      showToast.success(`Promedio actualizado`, darkMode);

      // Recargar calificaciones
      fetchCalificaciones();
    },
    promedios_visibilidad_actualizada: (data: any) => {
      fetchCalificaciones();
    }
  });

  useEffect(() => {
    fetchCalificaciones();
  }, []);

  const toggleCurso = async (cursoId: number) => {
    const isExpanding = !expandedCursos[cursoId];

    setExpandedCursos((prev) => ({
      ...prev,
      [cursoId]: !prev[cursoId],
    }));

    // Si se está expandiendo y no tenemos el promedio global, lo cargamos
    if (isExpanding && !promediosGlobales[cursoId]) {
      await fetchPromedioGlobal(cursoId);
    }
  };

  const toggleModulo = (cursoId: number, moduloId: number) => {
    const key = `${cursoId}-${moduloId}`;
    setExpandedModulos((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const fetchPromedioGlobal = async (cursoId: number) => {
    setLoadingPromedioGlobal((prev) => ({ ...prev, [cursoId]: true }));

    try {
      const token = sessionStorage.getItem("auth_token");
      if (!token) return;

      const response = await fetch(
        `${API_BASE}/calificaciones/promedio-global/${cursoId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      if (response.ok) {
        const data = await response.json();
        // Solo guardar el promedio si está visible (todos los módulos publicados)
        if (data.success && data.visible && data.promedio_global) {
          setPromediosGlobales((prev) => ({
            ...prev,
            [cursoId]: data.promedio_global,
          }));
        } else if (data.success && !data.visible) {
          // No guardar nada si no está visible
          console.log(
            "Promedio global oculto: No todos los módulos están publicados",
          );
        }
      }
    } catch (error) {
      console.error("Error cargando promedio global:", error);
    } finally {
      setLoadingPromedioGlobal((prev) => ({ ...prev, [cursoId]: false }));
    }
  };

  const getColorByGrade = (grade: number) => {
    if (grade >= 9) return theme.success;
    if (grade >= 7) return theme.warning;
    return theme.danger;
  };

  const getGradeLabel = (grade: number) => {
    if (grade >= 9) return "Excelente";
    if (grade >= 8) return "Muy Bueno";
    if (grade >= 7) return "Aprobado";
    if (grade >= 5) return "Regular";
    return "Insuficiente";
  };

  const getColorByGrade10 = (grade: number) => {
    if (grade >= 9) return theme.success;
    if (grade >= 7) return theme.warning;
    return theme.danger;
  };

  // Agrupar calificaciones por módulo y calcular promedio ponderado
  const agruparPorModulo = (
    calificaciones: Calificacion[],
  ): ModuloConPromedio[] => {
    const modulosMap = new Map<number, ModuloConPromedio>();

    calificaciones.forEach((cal) => {
      const idModulo = cal.id_modulo || 0;
      if (!modulosMap.has(idModulo)) {
        modulosMap.set(idModulo, {
          id_modulo: idModulo,
          nombre: cal.modulo_nombre,
          orden: cal.modulo_orden,
          promedio_ponderado: 0,
          total_tareas: 0,
          tareas_calificadas: 0,
          promedios_publicados: (cal as any).promedios_publicados || false,
          calificaciones: [],
        });
      }

      const modulo = modulosMap.get(idModulo)!;
      modulo.calificaciones.push(cal);
      modulo.tareas_calificadas++;
    });

    // Calcular promedio ponderado para cada módulo
    modulosMap.forEach((modulo) => {
      const aportes = modulo.calificaciones.map((cal) => {
        const nota = parseFloat(cal.nota as any) || 0;
        const notaMaxima = parseFloat(cal.nota_maxima as any) || 10;
        const ponderacion = cal.ponderacion || 1;
        return (nota / notaMaxima) * ponderacion;
      });

      modulo.promedio_ponderado = aportes.reduce(
        (sum, aporte) => sum + aporte,
        0,
      );
    });

    return Array.from(modulosMap.values()).sort((a, b) => a.orden - b.orden);
  };

  if (loading) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "300px",
          color: theme.textPrimary,
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "1rem",
          }}
        >
          <div
            style={{
              width: "3rem",
              height: "3rem",
              border: `4px solid ${theme.textMuted}`,
              borderTop: `4px solid ${theme.accent}`,
              borderRadius: "50%",
              animation: "spin 1s linear infinite",
            }}
          />
          <p>Cargando calificaciones...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div
        style={{
          background: darkMode
            ? "rgba(239, 68, 68, 0.1)"
            : "rgba(239, 68, 68, 0.05)",
          border: "1px solid rgba(239, 68, 68, 0.3)",
          borderRadius: "0.75rem",
          padding: "2rem",
          textAlign: "center",
        }}
      >
        <Award size={48} color="#ef4444" style={{ marginBottom: "1rem" }} />
        <h3 style={{ color: "#ef4444", margin: "0 0 0.5rem 0" }}>
          Error al cargar
        </h3>
        <p style={{ color: theme.textMuted, margin: 0 }}>{error}</p>
        <button
          onClick={fetchCalificaciones}
          style={{
            marginTop: "1rem",
            background: "#ef4444",
            color: "#fff",
            border: "none",
            borderRadius: "0.5rem",
            padding: "0.5rem 1rem",
            cursor: "pointer",
          }}
        >
          Reintentar
        </button>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: "1.25em" }}>
        <h2 style={{
          fontSize: '1.5rem',
          fontWeight: '700',
          color: theme.textPrimary,
          margin: '0 0 0.375rem 0'
        }}>
          Mis Calificaciones
        </h2>
        <p style={{ color: theme.textMuted, fontSize: '0.8125rem', margin: 0 }}>
          Revisa tu rendimiento académico en todos tus cursos
        </p>
      </div>

      {/* Estadísticas generales */}
      {cursosConCalificaciones.length > 0 && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: "0.75rem",
            marginBottom: "1rem",
          }}
        >
          <div
            style={{
              background: darkMode
                ? "rgba(59, 130, 246, 0.1)"
                : "rgba(59, 130, 246, 0.05)",
              border: "1px solid rgba(59, 130, 246, 0.3)",
              borderRadius: "0.75rem",
              padding: "1rem",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                marginBottom: "0.5rem",
              }}
            >
              <BookOpen size={18} color="#3b82f6" />
              <span style={{ color: "#3b82f6", fontWeight: "600", fontSize: "0.875rem" }}>
                Cursos
              </span>
            </div>
            <div
              style={{
                color: "#3b82f6",
                fontSize: "1.5rem",
                fontWeight: "800",
                lineHeight: 1,
              }}
            >
              {cursosConCalificaciones.length}
            </div>
          </div>

          <div
            style={{
              background: darkMode
                ? "rgba(245, 158, 11, 0.1)"
                : "rgba(245, 158, 11, 0.05)",
              border: `1px solid ${theme.warning}30`,
              borderRadius: "0.75rem",
              padding: "1rem",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                marginBottom: "0.5rem",
              }}
            >
              <FileText size={18} color={theme.warning} />
              <span style={{ color: theme.warning, fontWeight: "600", fontSize: "0.875rem" }}>
                Total Tareas
              </span>
            </div>
            <div
              style={{
                color: theme.warning,
                fontSize: "1.5rem",
                fontWeight: "800",
                lineHeight: 1,
              }}
            >
              {cursosConCalificaciones.reduce(
                (sum, c) => sum + c.calificaciones.length,
                0,
              )}
            </div>
          </div>
        </div>
      )}

      {cursosConCalificaciones.length === 0 && (
        <div
          style={{
            background: darkMode
              ? "linear-gradient(135deg, rgba(245, 158, 11, 0.15), rgba(217, 119, 6, 0.1))"
              : "linear-gradient(135deg, rgba(245, 158, 11, 0.08), rgba(217, 119, 6, 0.05))",
            border: `2px solid ${theme.warning}`,
            borderRadius: "1rem",
            padding: "2rem",
            marginBottom: "1.5rem",
            textAlign: "center",
            boxShadow: darkMode
              ? "0 8px 32px rgba(245, 158, 11, 0.2)"
              : "0 8px 32px rgba(245, 158, 11, 0.15)",
          }}
        >
          <div
            style={{
              width: "5rem",
              height: "5rem",
              background: `linear-gradient(135deg, ${theme.warning}, #d97706)`,
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 1.5rem",
              boxShadow: "0 4px 16px rgba(245, 158, 11, 0.3)",
            }}
          >
            <Award size={40} color="#fff" />
          </div>
          <h2
            style={{
              color: theme.textPrimary,
              fontSize: "1.5rem",
              fontWeight: "700",
              margin: "0 0 0.5rem 0",
            }}
          >
            Aún no tienes calificaciones
          </h2>
          <p
            style={{
              color: theme.textMuted,
              margin: 0,
              fontSize: "1rem",
              lineHeight: 1.6,
            }}
          >
            Tus calificaciones aparecerán aquí una vez que tus docentes evalúen
            tus entregas.
            <br />
            Mantente al día con tus tareas para obtener buenas notas.
          </p>
        </div>
      )}

      {/* Lista de cursos con calificaciones */}
      {cursosConCalificaciones.length === 0 ? (
        <div
          style={{
            background: theme.cardBg,
            border: `1px solid ${theme.border}`,
            borderRadius: "1rem",
            padding: "3rem",
            textAlign: "center",
          }}
        >
          <Award
            size={48}
            style={{ color: theme.textMuted, margin: "0 auto 1rem" }}
          />
          <h3 style={{ color: theme.textPrimary, margin: "0 0 0.5rem 0" }}>
            No hay calificaciones registradas
          </h3>
          <p style={{ color: theme.textMuted, margin: 0 }}>
            Aún no tienes calificaciones en tus cursos
          </p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          {cursosConCalificaciones.map(
            ({ curso, calificaciones, promedio, modulos }) => (
              <div
                key={curso.id_curso}
                style={{
                  background: darkMode ? "rgba(255,255,255,0.03)" : "#ffffff",
                  border: darkMode ? "1px solid rgba(255,255,255,0.08)" : "1px solid #e5e7eb",
                  borderRadius: "0.75rem",
                  overflow: "hidden",
                  transition: "all 0.2s ease",
                }}
              >
                {/* Header del curso */}
                <div
                  onClick={() => toggleCurso(curso.id_curso)}
                  style={{
                    padding: "1rem",
                    cursor: "pointer",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.75rem",
                      flex: 1,
                    }}
                  >
                    <div
                      style={{
                        width: "2.5rem",
                        height: "2.5rem",
                        background: `linear-gradient(135deg, ${theme.accent}, #f59e0b)`,
                        borderRadius: "0.625rem",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        boxShadow: "0 2px 8px rgba(251, 191, 36, 0.3)",
                      }}
                    >
                      <BookOpen size={18} color="#fff" strokeWidth={2.5} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <h3
                        style={{
                          color: theme.textPrimary,
                          fontSize: "0.95rem",
                          fontWeight: "700",
                          margin: 0,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {curso.nombre}
                      </h3>
                      <p
                        style={{
                          color: theme.textMuted,
                          margin: "0.125rem 0 0 0",
                          fontSize: "0.75rem",
                        }}
                      >
                        {curso.codigo_curso}
                      </p>
                    </div>
                  </div>

                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "1rem",
                    }}
                  >
                    <div style={{ textAlign: "right" }}>
                      <div
                        style={{
                          color: modulos.every(m => m.promedios_publicados) ? getColorByGrade(promedio) : theme.textMuted,
                          fontSize: "1.125rem",
                          fontWeight: "800",
                        }}
                      >
                        {modulos.every(m => m.promedios_publicados) ? promedio.toFixed(1) : "Parcial"}
                      </div>
                      <div
                        style={{
                          color: theme.textMuted,
                          fontSize: "0.7rem",
                          marginTop: "0.125rem",
                        }}
                      >
                        {modulos.every(m => m.promedios_publicados) ? getGradeLabel(promedio) : "Promedios ocultos"}
                      </div>
                    </div>
                    {expandedCursos[curso.id_curso] ? (
                      <ChevronDown
                        size={18}
                        color={theme.textMuted}
                      />
                    ) : (
                      <ChevronRight
                        size={18}
                        color={theme.textMuted}
                      />
                    )}
                  </div>
                </div>

                {/* Detalle de calificaciones */}
                {expandedCursos[curso.id_curso] && (
                  <div style={{ padding: "0 1.5rem 1.5rem" }}>
                    {/* Mostrar promedios ponderados por módulo SI ESTÁN PUBLICADOS */}
                    {modulos.filter((m) => m.promedios_publicados).length >
                      0 && (
                        <div
                          style={{ marginTop: "1rem", marginBottom: "1.5rem" }}
                        >
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "0.5rem",
                              marginBottom: "0.75rem",
                            }}
                          >
                            <BarChart3
                              size={18}
                              style={{ color: theme.accent }}
                            />
                            <h4
                              style={{
                                color: theme.textPrimary,
                                fontSize: "0.9rem",
                                fontWeight: "700",
                                margin: 0,
                                textTransform: "uppercase",
                                letterSpacing: "0.5px",
                              }}
                            >
                              Promedios por Módulo
                            </h4>
                          </div>

                          {/* PROMEDIO GLOBAL BALANCEADO */}
                          {promediosGlobales[curso.id_curso] && (
                            <div
                              style={{
                                background: darkMode
                                  ? "linear-gradient(135deg, rgba(251, 191, 36, 0.15), rgba(245, 158, 11, 0.1))"
                                  : "linear-gradient(135deg, rgba(251, 191, 36, 0.1), rgba(245, 158, 11, 0.05))",
                                border: `2px solid ${theme.accent}`,
                                borderRadius: "0.75rem",
                                padding: "1rem 1.25rem",
                                marginBottom: "1rem",
                                boxShadow: darkMode
                                  ? "0 4px 16px rgba(251, 191, 36, 0.2)"
                                  : "0 4px 16px rgba(251, 191, 36, 0.15)",
                              }}
                            >
                              <div
                                style={{
                                  display: "flex",
                                  justifyContent: "space-between",
                                  alignItems: "center",
                                }}
                              >
                                <div>
                                  <div
                                    style={{
                                      display: "flex",
                                      alignItems: "center",
                                      gap: "0.5rem",
                                      marginBottom: "0.25rem",
                                    }}
                                  >
                                    <TrendingUp
                                      size={18}
                                      style={{ color: theme.accent }}
                                    />
                                    <span
                                      style={{
                                        color: theme.accent,
                                        fontSize: "0.85rem",
                                        fontWeight: "700",
                                        textTransform: "uppercase",
                                        letterSpacing: "0.5px",
                                      }}
                                    >
                                      Promedio Global del Curso
                                    </span>
                                  </div>
                                  <div>
                                    <p
                                      style={{
                                        color: theme.textMuted,
                                        fontSize: "0.75rem",
                                        margin: "0 0 0.25rem 0",
                                      }}
                                    >
                                      Sobre 10 puntos • Cada módulo aporta{" "}
                                      {promediosGlobales[curso.id_curso]
                                        .peso_por_modulo
                                        ? promediosGlobales[
                                          curso.id_curso
                                        ].peso_por_modulo.toFixed(2)
                                        : "0.00"}{" "}
                                      puntos
                                    </p>
                                    <p
                                      style={{
                                        color: theme.textMuted,
                                        fontSize: "0.7rem",
                                        margin: 0,
                                        fontStyle: "italic",
                                      }}
                                    >
                                      {promediosGlobales[curso.id_curso]
                                        .total_modulos || 0}{" "}
                                      módulos con calificaciones
                                    </p>
                                  </div>
                                </div>
                                <div style={{ textAlign: "right" }}>
                                  <div
                                    style={{
                                      color: getColorByGrade10(
                                        promediosGlobales[curso.id_curso]
                                          .promedio_global || 0,
                                      ),
                                      fontSize: "2.5rem",
                                      fontWeight: "900",
                                      lineHeight: 1,
                                    }}
                                  >
                                    {(
                                      promediosGlobales[curso.id_curso]
                                        .promedio_global || 0
                                    ).toFixed(2)}
                                  </div>
                                  <div
                                    style={{
                                      color: theme.textMuted,
                                      fontSize: "0.8rem",
                                      marginTop: "0.25rem",
                                      fontWeight: "600",
                                    }}
                                  >
                                    / 10 puntos
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}

                          {loadingPromedioGlobal[curso.id_curso] &&
                            !promediosGlobales[curso.id_curso] && (
                              <div
                                style={{
                                  background: theme.cardBg,
                                  border: `1px solid ${theme.border}`,
                                  borderRadius: "0.75rem",
                                  padding: "1rem",
                                  marginBottom: "1rem",
                                  textAlign: "center",
                                }}
                              >
                                <span
                                  style={{
                                    color: theme.textMuted,
                                    fontSize: "0.85rem",
                                  }}
                                >
                                  Calculando promedio global...
                                </span>
                              </div>
                            )}

                          <div
                            style={{
                              display: "flex",
                              flexDirection: "column",
                              gap: "0.5rem",
                            }}
                          >
                            {modulos
                              .filter((m) => m.promedios_publicados)
                              .map((modulo) => (
                                <div
                                  key={modulo.id_modulo}
                                  style={{
                                    background: darkMode
                                      ? "rgba(59, 130, 246, 0.1)"
                                      : "rgba(59, 130, 246, 0.05)",
                                    border: `1px solid ${getColorByGrade10(modulo.promedio_ponderado)}40`,
                                    borderRadius: "0.5rem",
                                    padding: "0.75rem 1rem",
                                    display: "flex",
                                    justifyContent: "space-between",
                                    alignItems: "center",
                                  }}
                                >
                                  <div>
                                    <div
                                      style={{
                                        color: theme.textPrimary,
                                        fontWeight: "600",
                                        fontSize: "0.95rem",
                                      }}
                                    >
                                      {modulo.nombre}
                                    </div>
                                    <div
                                      style={{
                                        color: theme.textMuted,
                                        fontSize: "0.75rem",
                                        marginTop: "0.125rem",
                                      }}
                                    >
                                      {modulo.tareas_calificadas}{" "}
                                      {modulo.tareas_calificadas === 1
                                        ? "tarea calificada"
                                        : "tareas calificadas"}
                                    </div>
                                  </div>
                                  <div style={{ textAlign: "right" }}>
                                    <div
                                      style={{
                                        color: getColorByGrade10(
                                          modulo.promedio_ponderado,
                                        ),
                                        fontSize: "1.5rem",
                                        fontWeight: "900",
                                        lineHeight: 1,
                                      }}
                                    >
                                      {modulo.promedio_ponderado.toFixed(1)}
                                    </div>
                                    <div
                                      style={{
                                        color: theme.textMuted,
                                        fontSize: "0.7rem",
                                        marginTop: "0.125rem",
                                      }}
                                    >
                                      Promedio
                                    </div>
                                  </div>
                                </div>
                              ))}
                          </div>
                        </div>
                      )}

                    {calificaciones.length === 0 ? (
                      <div
                        style={{
                          background: darkMode
                            ? "rgba(245, 158, 11, 0.1)"
                            : "rgba(245, 158, 11, 0.05)",
                          border: `1px solid ${theme.warning}30`,
                          borderRadius: "0.75rem",
                          padding: "1.5rem",
                          textAlign: "center",
                          marginTop: "1rem",
                        }}
                      >
                        <Award
                          size={32}
                          color={theme.warning}
                          style={{ marginBottom: "0.5rem" }}
                        />
                        <p
                          style={{
                            color: theme.textPrimary,
                            margin: "0 0 0.25rem 0",
                            fontWeight: "600",
                          }}
                        >
                          Sin calificaciones aún
                        </p>
                        <p
                          style={{
                            color: theme.textMuted,
                            margin: 0,
                            fontSize: "0.9rem",
                          }}
                        >
                          Completa y entrega tus tareas para recibir
                          calificaciones
                        </p>
                      </div>
                    ) : (
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          gap: "0.75rem",
                          marginTop: "1rem",
                        }}
                      >
                        {/* Agrupar por módulos */}
                        {modulos.map((modulo) => {
                          const moduloKey = `${curso.id_curso}-${modulo.id_modulo}`;
                          const isModuloExpanded = expandedModulos[moduloKey] || false;

                          return (
                            <div
                              key={modulo.id_modulo}
                              style={{
                                background: darkMode
                                  ? "rgba(255,255,255,0.03)"
                                  : "rgba(0,0,0,0.02)",
                                border: `1px solid ${theme.border}`,
                                borderRadius: "0.75rem",
                                overflow: "hidden",
                                transition: "all 0.3s ease",
                              }}
                            >
                              {/* Header del Módulo */}
                              <div
                                onClick={() => toggleModulo(curso.id_curso, modulo.id_modulo)}
                                style={{
                                  padding: "1rem",
                                  cursor: "pointer",
                                  display: "flex",
                                  justifyContent: "space-between",
                                  alignItems: "center",
                                  background: darkMode
                                    ? "rgba(251, 191, 36, 0.08)"
                                    : "rgba(251, 191, 36, 0.05)",
                                  borderBottom: isModuloExpanded
                                    ? `1px solid ${theme.border}`
                                    : "none",
                                }}
                              >
                                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                                  {isModuloExpanded ? (
                                    <ChevronDown size={20} style={{ color: theme.accent }} />
                                  ) : (
                                    <ChevronRight size={20} style={{ color: theme.accent }} />
                                  )}
                                  <div>
                                    <h4
                                      style={{
                                        color: theme.textPrimary,
                                        fontSize: "1rem",
                                        fontWeight: "700",
                                        margin: 0,
                                      }}
                                    >
                                      {modulo.nombre}
                                    </h4>
                                    <p
                                      style={{
                                        color: theme.textMuted,
                                        margin: "0.25rem 0 0 0",
                                        fontSize: "0.85rem",
                                      }}
                                    >
                                      {modulo.tareas_calificadas}{" "}
                                      {modulo.tareas_calificadas === 1
                                        ? "tarea calificada"
                                        : "tareas calificadas"}
                                    </p>
                                  </div>
                                </div>
                                <div style={{ textAlign: "right" }}>
                                  {modulo.promedios_publicados ? (
                                    <>
                                      <div
                                        style={{
                                          color: getColorByGrade10(modulo.promedio_ponderado),
                                          fontSize: "1.5rem",
                                          fontWeight: "900",
                                          lineHeight: 1,
                                        }}
                                      >
                                        {modulo.promedio_ponderado.toFixed(1)}
                                      </div>
                                      <div
                                        style={{
                                          color: theme.textMuted,
                                          fontSize: "0.7rem",
                                          marginTop: "0.125rem",
                                        }}
                                      >
                                        Promedio
                                      </div>
                                    </>
                                  ) : (
                                    <div
                                      style={{
                                        display: "flex",
                                        flexDirection: "column",
                                        alignItems: "flex-end",
                                        gap: "0.25rem"
                                      }}
                                    >
                                      <div
                                        style={{
                                          background: darkMode ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.05)",
                                          borderRadius: "0.5rem",
                                          padding: "0.25rem 0.75rem",
                                          display: "flex",
                                          alignItems: "center",
                                          gap: "0.5rem"
                                        }}
                                      >
                                        <span style={{ fontSize: "0.85rem", color: theme.textMuted, fontWeight: "600" }}>
                                          Oculto
                                        </span>
                                      </div>
                                      <span style={{ fontSize: "0.65rem", color: theme.textMuted }}>
                                        Por el docente
                                      </span>
                                    </div>
                                  )}
                                </div>
                              </div>

                              {/* Tareas del Módulo (expandible) */}
                              {isModuloExpanded && (
                                <div style={{ padding: "0.5rem" }}>
                                  {modulo.calificaciones.map((calificacion) => (
                                    <div
                                      key={calificacion.id_calificacion}
                                      style={{
                                        background: darkMode
                                          ? "rgba(255,255,255,0.02)"
                                          : "rgba(255,255,255,0.5)",
                                        border: `1px solid ${theme.border}`,
                                        borderRadius: "0.5rem",
                                        padding: "0.875rem",
                                        marginBottom: "0.5rem",
                                      }}
                                    >
                                      <div
                                        style={{
                                          display: "flex",
                                          justifyContent: "space-between",
                                          alignItems: "flex-start",
                                          marginBottom: "0.5rem",
                                        }}
                                      >
                                        <div style={{ flex: 1 }}>
                                          <h5
                                            style={{
                                              color: theme.textPrimary,
                                              fontSize: "0.95rem",
                                              fontWeight: "600",
                                              margin: 0,
                                            }}
                                          >
                                            {calificacion.tarea_titulo}
                                          </h5>
                                        </div>
                                        <div
                                          style={{
                                            background:
                                              getColorByGrade(
                                                parseFloat(calificacion.nota as any) || 0,
                                              ) + "20",
                                            border: `1px solid ${getColorByGrade(parseFloat(calificacion.nota as any) || 0)}30`,
                                            borderRadius: "0.5rem",
                                            padding: "0.25rem 0.75rem",
                                            marginLeft: "0.5rem",
                                          }}
                                        >
                                          <span
                                            style={{
                                              color: getColorByGrade(
                                                parseFloat(calificacion.nota as any) || 0,
                                              ),
                                              fontWeight: "700",
                                              fontSize: "1rem",
                                            }}
                                          >
                                            {(
                                              parseFloat(calificacion.nota as any) || 0
                                            ).toFixed(1)}
                                          </span>
                                          <span
                                            style={{
                                              color: theme.textMuted,
                                              marginLeft: "0.25rem",
                                              fontSize: "0.85rem",
                                            }}
                                          >
                                            /
                                            {parseFloat(
                                              calificacion.nota_maxima as any,
                                            ) || 20}
                                          </span>
                                        </div>
                                      </div>

                                      {calificacion.comentario_docente && (
                                        <div
                                          style={{
                                            background: darkMode
                                              ? "rgba(255,255,255,0.02)"
                                              : "rgba(0,0,0,0.01)",
                                            border: `1px solid ${theme.border}`,
                                            borderRadius: "0.5rem",
                                            padding: "0.625rem",
                                            marginTop: "0.5rem",
                                          }}
                                        >
                                          <p
                                            style={{
                                              color: theme.textSecondary,
                                              margin: 0,
                                              fontStyle: "italic",
                                              fontSize: "0.85rem",
                                            }}
                                          >
                                            "{calificacion.comentario_docente}"
                                          </p>
                                        </div>
                                      )}

                                      <div
                                        style={{
                                          display: "flex",
                                          justifyContent: "space-between",
                                          alignItems: "center",
                                          marginTop: "0.625rem",
                                          paddingTop: "0.625rem",
                                          borderTop: `1px solid ${theme.border}`,
                                        }}
                                      >
                                        <div
                                          style={{
                                            display: "flex",
                                            alignItems: "center",
                                            gap: "0.5rem",
                                          }}
                                        >
                                          <Calendar
                                            size={14}
                                            color={theme.textMuted}
                                          />
                                          <span
                                            style={{
                                              color: theme.textMuted,
                                              fontSize: "0.8rem",
                                            }}
                                          >
                                            {new Date(
                                              calificacion.fecha_calificacion,
                                            ).toLocaleDateString("es-ES")}
                                          </span>
                                        </div>
                                        <div
                                          style={{
                                            background:
                                              getColorByGrade(
                                                ((parseFloat(calificacion.nota as any) ||
                                                  0) /
                                                  (parseFloat(
                                                    calificacion.nota_maxima as any,
                                                  ) || 20)) *
                                                20,
                                              ) + "20",
                                            borderRadius: "0.5rem",
                                            padding: "0.2rem 0.5rem",
                                          }}
                                        >
                                          <span
                                            style={{
                                              color: getColorByGrade(
                                                ((parseFloat(calificacion.nota as any) ||
                                                  0) /
                                                  (parseFloat(
                                                    calificacion.nota_maxima as any,
                                                  ) || 20)) *
                                                20,
                                              ),
                                              fontSize: "0.75rem",
                                              fontWeight: "600",
                                            }}
                                          >
                                            {getGradeLabel(
                                              ((parseFloat(calificacion.nota as any) ||
                                                0) /
                                                (parseFloat(
                                                  calificacion.nota_maxima as any,
                                                ) || 20)) *
                                              20,
                                            )}
                                          </span>
                                        </div>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ),
          )}
        </div>
      )}
    </div>
  );
};

export default Calificaciones;
