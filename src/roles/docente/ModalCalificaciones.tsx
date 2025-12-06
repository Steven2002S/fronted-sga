import React, { useState, useEffect } from "react";
import {
  X,
  Download,
  Award,
  Search,
  Filter,
  BarChart3,
  User,
  BookOpen,
  FileSpreadsheet,
} from "lucide-react";

const API_BASE = (import.meta as any).env?.VITE_API_URL || 'http://localhost:3000';

interface ModalCalificacionesProps {
  isOpen: boolean;
  onClose: () => void;
  cursoId: number;
  cursoNombre: string;
  darkMode: boolean;
}

interface Tarea {
  id_tarea: number;
  titulo: string;
  nota_maxima: number;
  id_modulo?: number;
  modulo_nombre?: string;
}

interface Estudiante {
  id_estudiante: number;
  nombre: string;
  apellido: string;
  calificaciones: { [tareaId: number]: number | null };
  promedio: number;
  promedio_global?: number;
  promedios_modulos?: { [moduloNombre: string]: number };
  modulos_detalle?: ModuloDetalle[];
}

interface ModuloInfo {
  nombre: string;
  promedio: number;
  peso: number;
}

interface ModuloDetalle {
  nombre_modulo: string;
  promedio_modulo_sobre_10: number;
  aporte_al_promedio_global: number;
}

const ModalCalificaciones: React.FC<ModalCalificacionesProps> = ({
  isOpen,
  onClose,
  cursoId,
  cursoNombre,
  darkMode,
}) => {
  // Utilidad: convertir un SVG público a PNG dataURL para insertarlo en jsPDF
  const loadSvgAsPngDataUrl = async (
    url: string,
    width = 64,
    height = 64,
  ): Promise<string | null> => {
    try {
      const res = await fetch(url);
      const svgText = await res.text();
      const svgBlob = new Blob([svgText], { type: "image/svg+xml" });
      const img = new Image();
      const objectUrl = URL.createObjectURL(svgBlob);
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = reject;
        img.src = objectUrl;
      });
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) return null;
      ctx.drawImage(img, 0, 0, width, height);
      URL.revokeObjectURL(objectUrl);
      return canvas.toDataURL("image/png");
    } catch {
      return null;
    }
  };

  const [tareas, setTareas] = useState<Tarea[]>([]);
  const [estudiantes, setEstudiantes] = useState<Estudiante[]>([]);
  const [filteredEstudiantes, setFilteredEstudiantes] = useState<Estudiante[]>(
    [],
  );
  const [loading, setLoading] = useState(false);
  const [downloadingPDF, setDownloadingPDF] = useState(false);
  const [downloadingExcel, setDownloadingExcel] = useState(false);
  const [busqueda, setBusqueda] = useState("");
  const [filtro, setFiltro] = useState<"todos" | "aprobados" | "reprobados">(
    "todos",
  );
  const [modulos, setModulos] = useState<string[]>([]);
  const [pesoPorModulo, setPesoPorModulo] = useState<number>(0);
  const [modulosInfo, setModulosInfo] = useState<ModuloDetalle[]>([]);
  const [moduloActivo, setModuloActivo] = useState<string>("todos");
  const [tareasFiltradas, setTareasFiltradas] = useState<Tarea[]>([]);

  useEffect(() => {
    if (isOpen) {
      fetchCalificaciones();
    }
  }, [isOpen, cursoId]);

  // Filtrar tareas cuando cambia el módulo activo
  useEffect(() => {
    if (moduloActivo === "todos") {
      setTareasFiltradas(tareas);
    } else {
      // Filtrar tareas del módulo seleccionado
      const tareasDelModulo = tareas.filter((tarea) => {
        return tarea.modulo_nombre === moduloActivo;
      });
      setTareasFiltradas(tareasDelModulo);
    }
  }, [moduloActivo, tareas]);

  useEffect(() => {
    // Aplicar filtros y búsqueda
    let result = [...estudiantes];

    // Aplicar búsqueda
    if (busqueda) {
      const term = busqueda.toLowerCase();
      result = result.filter(
        (est) =>
          est.nombre.toLowerCase().includes(term) ||
          est.apellido.toLowerCase().includes(term),
      );
    }
    // Aplicar filtro
    if (filtro === "aprobados") {
      result = result.filter((est) => (parseFloat(String(est.promedio_global)) || 0) >= 7); // Nota mínima de aprobación: 7.0/10
    } else if (filtro === "reprobados") {
      result = result.filter((est) => (parseFloat(String(est.promedio_global)) || 0) < 7);
    }

    setFilteredEstudiantes(result);
  }, [estudiantes, busqueda, filtro]);

  const fetchCalificaciones = async () => {
    try {
      setLoading(true);
      const token = sessionStorage.getItem("auth_token");

      // Obtener tareas del curso
      const tareasResponse = await fetch(
        `${API_BASE}/api/cursos/${cursoId}/tareas`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      let tareasArr: Tarea[] = [];
      if (tareasResponse.ok) {
        try {
          const tareasJson = await tareasResponse.json();
          tareasArr = Array.isArray(tareasJson)
            ? tareasJson
            : tareasJson?.tareas || [];
        } catch (_) {
          tareasArr = [];
        }
      }

      // Obtener estudiantes del curso
      const estudiantesResponse = await fetch(
        `${API_BASE}/api/cursos/${cursoId}/estudiantes`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      let estudiantesArr: any[] = [];
      if (estudiantesResponse.ok) {
        try {
          const estudiantesJson = await estudiantesResponse.json();
          estudiantesArr = Array.isArray(estudiantesJson)
            ? estudiantesJson
            : estudiantesJson?.estudiantes || [];
        } catch (_) {
          estudiantesArr = [];
        }
      }

      // Obtener calificaciones
      const calificacionesResponse = await fetch(
        `${API_BASE}/api/cursos/${cursoId}/calificaciones`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      let calificacionesArr: any[] = [];
      if (calificacionesResponse.ok) {
        try {
          const calificacionesJson = await calificacionesResponse.json();
          calificacionesArr = Array.isArray(calificacionesJson)
            ? calificacionesJson
            : calificacionesJson?.calificaciones || [];
        } catch (_) {
          calificacionesArr = [];
        }
      }

      // Obtener calificaciones completas con promedios por módulo y global
      const calificacionesCompletasResponse = await fetch(
        `${API_BASE}/api/calificaciones/curso/${cursoId}/completo`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      let datosCompletos: any = {
        estudiantes: [],
        modulos: [],
        peso_por_modulo: 0,
      };
      if (calificacionesCompletasResponse.ok) {
        try {
          datosCompletos = await calificacionesCompletasResponse.json();
          if (datosCompletos.success) {
            setModulos(datosCompletos.modulos || []);
            setPesoPorModulo(datosCompletos.peso_por_modulo || 0);
          }
        } catch (err) {
          console.error("Error parseando calificaciones completas:", err);
        }
      } else {
        console.error(
          "Error en respuesta del servidor:",
          calificacionesCompletasResponse.status,
        );
      }

      // Crear un mapa de estudiantes con sus promedios
      const mapaPromedios = new Map();
      if (datosCompletos.success && datosCompletos.estudiantes) {
        datosCompletos.estudiantes.forEach((est: any) => {
          mapaPromedios.set(est.id_estudiante, {
            promedio_global: parseFloat(est.promedio_global) || 0,
            promedios_modulos: est.promedios_modulos,
            modulos_detalle: est.modulos_detalle || [],
          });
        });
      }

      // Procesar estudiantes con calificaciones
      const estudiantesConCalificaciones = estudiantesArr.map((est: any) => {
        const califs: { [tareaId: number]: number | null } = {};
        let suma = 0;
        let count = 0;

        tareasArr.forEach((tarea: Tarea) => {
          const calif = calificacionesArr.find(
            (c: any) =>
              c.id_estudiante === est.id_estudiante &&
              c.id_tarea === tarea.id_tarea,
          );
          const raw = calif ? calif.nota_obtenida : null;
          const val = raw === null || raw === undefined ? 0 : Number(raw); // ← CAMBIADO
          califs[tarea.id_tarea] = Number.isFinite(val as number)
            ? (val as number)
            : 0;

          // Siempre sumar y contar, incluso si es 0
          suma += val as number;
          count++;
        });

        // Obtener promedios del mapa
        const promediosEst = mapaPromedios.get(est.id_estudiante) || {
          promedio_global: 0,
          promedios_modulos: {},
        };

        return {
          id_estudiante: est.id_estudiante,
          nombre: est.nombre,
          apellido: est.apellido,
          calificaciones: califs,
          promedio: count > 0 ? suma / count : 0,
          promedio_global: parseFloat(promediosEst.promedio_global) || 0,
          promedios_modulos: promediosEst.promedios_modulos,
          modulos_detalle: promediosEst.modulos_detalle || [],
        };
      });

      // Extraer información de módulos del primer estudiante
      if (
        estudiantesConCalificaciones.length > 0 &&
        estudiantesConCalificaciones[0].modulos_detalle
      ) {
        setModulosInfo(estudiantesConCalificaciones[0].modulos_detalle);
      }

      setTareas(tareasArr);
      setEstudiantes(estudiantesConCalificaciones);
      setTareasFiltradas(tareasArr); // Inicialmente mostrar todas
    } catch (error) {
      console.error("Error al cargar calificaciones:", error);
    } finally {
      setLoading(false);
    }
  };

  const descargarPDF = async () => {
    try {
      setDownloadingPDF(true);

      const { jsPDF }: any = await import("jspdf");
      const autoTable = (await import("jspdf-autotable")).default as any;

      const orientation = tareas.length > 6 ? "landscape" : "portrait";
      const doc = new jsPDF({ orientation });

      // Encabezado
      doc.setFontSize(14);
      doc.text("Calificaciones del Curso", 14, 14);
      doc.setFontSize(11);
      doc.text(String(cursoNombre || ""), 14, 22);

      // Logo (opcional) desde /public/vite.svg
      try {
        const pageWidth = doc.internal.pageSize.getWidth();
        const logoDataUrl = await loadSvgAsPngDataUrl("/vite.svg", 24, 24);
        if (logoDataUrl) {
          doc.addImage(logoDataUrl, "PNG", pageWidth - 14 - 24, 10, 24, 24);
        }
      } catch { }

      // Construir head y body
      const head = [
        [
          "Estudiante",
          ...tareas.map((t) => `${t.titulo} (/${t.nota_maxima})`),
          "Promedio",
        ],
      ];
      const body = estudiantes.map((est) => [
        `${est.nombre} ${est.apellido}`,
        ...tareas.map((t) => {
          const v = est.calificaciones[t.id_tarea];
          return v !== null && Number.isFinite(v)
            ? (v as number).toFixed(1)
            : "-";
        }),
        est.promedio.toFixed(1),
      ]);

      autoTable(doc, {
        head,
        body,
        startY: 28,
        styles: { fontSize: 8 },
        headStyles: { fillColor: [59, 130, 246], textColor: 255 },
        alternateRowStyles: { fillColor: [245, 247, 250] },
      });

      doc.save(
        `Calificaciones_${cursoNombre}_${new Date().toISOString().split("T")[0]}.pdf`,
      );
    } catch (error) {
      console.error("Error al generar PDF:", error);
    } finally {
      setDownloadingPDF(false);
    }
  };

  const descargarExcel = async () => {
    try {
      setDownloadingExcel(true);

      const ExcelJS = await import("exceljs");
      const { saveAs } = await import("file-saver");
      // Hoja 1: Detalle de calificaciones por tarea
      const datosDetalle = estudiantes.map((est) => {
        const fila: any = {
          Apellido: est.apellido,
          Nombre: est.nombre,
        };

        tareas.forEach((tarea) => {
          const nota = est.calificaciones[tarea.id_tarea];
          fila[tarea.titulo] =
            nota !== null && Number.isFinite(nota) ? nota.toFixed(1) : "-";
        });

        // Agregar columnas de promedio por módulo
        modulos.forEach((modulo) => {
          const moduloDetalle = est.modulos_detalle?.find(
            (m) => m.nombre_modulo === modulo,
          );
          const promedioModulo = moduloDetalle
            ? parseFloat(String(moduloDetalle.promedio_modulo_sobre_10))
            : 0;
          fila[`Promedio ${modulo}`] =
            promedioModulo > 0 ? promedioModulo.toFixed(2) : "-";
        });

        // Agregar promedio global
        fila["Promedio Global (/10pts)"] = est.promedio_global
          ? typeof est.promedio_global === "number"
            ? est.promedio_global.toFixed(2)
            : parseFloat(est.promedio_global).toFixed(2)
          : "0.00";

        return fila;
      });

      // Debug: Verificar datos antes de crear Excel
      console.log("Generando Excel...");
      console.log("Total estudiantes:", estudiantes.length);
      console.log("Módulos disponibles:", modulos);
      console.log("Peso por módulo:", pesoPorModulo);

      // Hoja 2: Promedios por Módulo (sobre 10 puntos)
      const datosModulos = estudiantes.map((est) => {
        const fila: any = {
          Apellido: est.apellido,
          Nombre: est.nombre,
        };

        // Agregar promedio de cada módulo
        modulos.forEach((modulo) => {
          const moduloDetalle = est.modulos_detalle?.find(
            (m) => m.nombre_modulo === modulo,
          );
          const promedioModulo = moduloDetalle
            ? parseFloat(String(moduloDetalle.promedio_modulo_sobre_10))
            : 0;
          const pesoModulo =
            typeof pesoPorModulo === "number" ? pesoPorModulo : 0;
          fila[`${modulo} (/${pesoModulo.toFixed(2)}pts)`] =
            promedioModulo > 0 ? promedioModulo.toFixed(2) : "-";
        });

        // Agregar promedio global
        fila["PROMEDIO GLOBAL (/10pts)"] = est.promedio_global
          ? typeof est.promedio_global === "number"
            ? est.promedio_global.toFixed(2)
            : parseFloat(est.promedio_global).toFixed(2)
          : "0.00";

        return fila;
      });

      // Hoja 3: Estadísticas del curso (SIMPLES Y RELEVANTES)
      const aprobadosGlobal = estudiantes.filter(
        (est) => (parseFloat(String(est.promedio_global)) || 0) >= 7,
      ).length;
      const reprobadosGlobal = estudiantes.length - aprobadosGlobal;

      const promedioGeneral =
        estudiantes.length > 0
          ? (
            estudiantes.reduce((sum, est) => sum + est.promedio, 0) /
            estudiantes.length
          ).toFixed(2)
          : "0.00";

      const promedioGlobalCurso =
        estudiantes.length > 0
          ? (
            estudiantes.reduce(
              (sum, est) => sum + (parseFloat(String(est.promedio_global)) || 0),
              0,
            ) / estudiantes.length
          ).toFixed(2)
          : "0.00";

      const porcentajeAprobacion =
        estudiantes.length > 0
          ? ((aprobadosGlobal / estudiantes.length) * 100).toFixed(1) + "%"
          : "0%";

      const datosEstadisticas = [
        { Métrica: "Total de Estudiantes", Valor: estudiantes.length },
        { Métrica: "Estudiantes Aprobados (≥7/10)", Valor: aprobadosGlobal },
        { Métrica: "Estudiantes Reprobados (<7/10)", Valor: reprobadosGlobal },
        { Métrica: "Porcentaje de Aprobación", Valor: porcentajeAprobacion },
        { Métrica: "", Valor: "" },
        {
          Métrica: "Promedio Global del Curso (/10pts)",
          Valor: promedioGlobalCurso,
        },
        {
          Métrica: "Promedio General (tareas)",
          Valor: promedioGeneral,
        },
        { Métrica: "", Valor: "" },
        { Métrica: "Total de Tareas Evaluadas", Valor: tareas.length },
        { Métrica: "Total de Módulos en el Curso", Valor: modulos.length },
        {
          Métrica: "Peso por Módulo",
          Valor: pesoPorModulo.toFixed(2) + " pts",
        },
        { Métrica: "", Valor: "" },
        { Métrica: "Nota Mínima de Aprobación", Valor: "7.0 / 10 puntos" },
        {
          Métrica: "Sistema de Calificación",
          Valor: "Todos los módulos tienen igual peso",
        },
      ];

      // Crear libro de Excel
      const workbook = new ExcelJS.Workbook();

      // HOJA 1: Detalle de calificaciones por tarea
      const wsDetalle = workbook.addWorksheet("Calificaciones por Tarea");
      if (datosDetalle.length > 0) {
        wsDetalle.addRow(Object.keys(datosDetalle[0]));
        datosDetalle.forEach((fila) => {
          wsDetalle.addRow(Object.values(fila));
        });
      }

      // HOJA 2: Promedios por Módulo
      const wsModulos = workbook.addWorksheet("Promedios por Módulo");
      if (datosModulos.length > 0) {
        wsModulos.addRow(Object.keys(datosModulos[0]));
        datosModulos.forEach((fila) => {
          wsModulos.addRow(Object.values(fila));
        });
      } else {
        wsModulos.addRow(["Apellido", "Nombre", "PROMEDIO GLOBAL (/10pts)"]);
        wsModulos.addRow(["-", "-", "0.00"]);
      }

      // HOJA 3: Estadísticas
      const wsEstadisticas = workbook.addWorksheet("Estadísticas");
      const estadisticasArray = [
        ["Métrica", "Valor"],
        ["Total de Estudiantes", estudiantes.length],
        ["Estudiantes Aprobados (≥7/10)", aprobadosGlobal],
        ["Estudiantes Reprobados (<7/10)", reprobadosGlobal],
        ["Porcentaje de Aprobación", porcentajeAprobacion],
        ["", ""],
        ["Promedio Global del Curso (/10pts)", promedioGlobalCurso],
        ["Promedio General (tareas)", promedioGeneral],
        ["", ""],
        ["Total de Tareas Evaluadas", tareas.length],
        ["Total de Módulos en el Curso", modulos.length],
        ["Peso por Módulo", pesoPorModulo.toFixed(2) + " pts"],
        ["", ""],
        ["Nota Mínima de Aprobación", "7.0 / 10 puntos"],
        ["Sistema de Calificación", "Todos los módulos tienen igual peso"],
      ];
      estadisticasArray.forEach((fila) => {
        wsEstadisticas.addRow(fila);
      });

      // Generar y descargar archivo
      const buffer = await workbook.xlsx.writeBuffer();
      const nombreCurso = cursoNombre.replace(/\s+/g, "_") || "Curso";
      const nombreArchivo = `Calificaciones_${nombreCurso}_${new Date().toISOString().split("T")[0]}.xlsx`;

      const blob = new Blob([buffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      saveAs(blob, nombreArchivo);
    } catch (error) {
      console.error("Error generando Excel:", error);
    } finally {
      setDownloadingExcel(false);
    }
  };

  // Calcular estadísticas
  const calcularEstadisticas = () => {
    if (filteredEstudiantes.length === 0)
      return { total: 0, aprobados: 0, reprobados: 0, promedioGeneral: 0 };

    const aprobados = filteredEstudiantes.filter(
      (est) => (parseFloat(String(est.promedio_global)) || 0) >= 7,
    ).length;
    const reprobados = filteredEstudiantes.length - aprobados;
    const promedioGeneral =
      filteredEstudiantes.reduce((sum, est) => sum + est.promedio, 0) /
      filteredEstudiantes.length;

    return {
      total: filteredEstudiantes.length,
      aprobados,
      reprobados,
      promedioGeneral: parseFloat(promedioGeneral.toFixed(2)),
    };
  };

  const stats = calcularEstadisticas();

  if (!isOpen) return null;

  // Estilos consistentes con el admin
  const theme = {
    bg: darkMode ? "rgba(0,0,0,0.6)" : "rgba(0,0,0,0.5)",
    modalBg: darkMode ? "#1a1a2e" : "#ffffff",
    textPrimary: darkMode ? "#ffffff" : "#1e293b",
    textSecondary: darkMode ? "rgba(255,255,255,0.7)" : "rgba(30,41,59,0.7)",
    textMuted: darkMode ? "rgba(255,255,255,0.5)" : "rgba(100,116,139,0.8)",
    border: darkMode ? "rgba(255,255,255,0.1)" : "#e2e8f0",
    inputBg: darkMode ? "rgba(255,255,255,0.05)" : "#f8fafc",
    inputBorder: darkMode ? "rgba(255,255,255,0.1)" : "#cbd5e1",
    cardBg: darkMode ? "rgba(255,255,255,0.03)" : "#ffffff",
    success: "#10b981",
    warning: "#f59e0b",
    danger: "#ef4444",
    info: "#60a5fa", // Cambiado a celeste/azul claro
  };

  return (
    <div
      className="modal-overlay"
      onClick={onClose}
    >
      <div
        className="modal-content responsive-modal"
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: "75rem"
        }}
      >
        {/* Header con estilo del admin */}
        <div
          style={{
            padding: "1rem",
            borderBottom: `1px solid ${theme.border}`,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            background: darkMode
              ? "rgba(255,255,255,0.02)"
              : "rgba(0,0,0,0.02)",
          }}
        >
          <div>
            <h3
              style={{
                color: theme.textPrimary,
                fontSize: "1.1rem",
                fontWeight: "700",
                margin: 0,
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
              }}
            >
              <BarChart3 size={20} color={theme.info} />
              Calificaciones del Curso
            </h3>
            <p
              style={{
                color: theme.textSecondary,
                fontSize: "0.85rem",
                margin: "0.25rem 0 0 0",
              }}
            >
              {cursoNombre}
            </p>
          </div>
          <div style={{ display: "flex", gap: "0.5rem" }}>
            <button
              onClick={descargarExcel}
              disabled={downloadingExcel || loading}
              style={{
                background: downloadingExcel
                  ? "rgba(34, 197, 94, 0.5)"
                  : darkMode
                    ? "rgba(34, 197, 94, 0.15)"
                    : "rgba(34, 197, 94, 0.1)",
                border: `1px solid ${downloadingExcel ? "rgba(34, 197, 94, 0.5)" : "rgba(34, 197, 94, 0.3)"}`,
                borderRadius: "0.5rem",
                padding: "0.5rem 0.75rem",
                color: downloadingExcel ? "#fff" : "#22c55e",
                cursor: downloadingExcel || loading ? "not-allowed" : "pointer",
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                transition: "all 0.2s ease",
                fontSize: "0.875rem",
                fontWeight: "600",
              }}
              onMouseEnter={(e) => {
                if (!downloadingExcel && !loading) {
                  e.currentTarget.style.background = darkMode
                    ? "rgba(34, 197, 94, 0.25)"
                    : "rgba(34, 197, 94, 0.15)";
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = downloadingExcel
                  ? "rgba(34, 197, 94, 0.5)"
                  : darkMode
                    ? "rgba(34, 197, 94, 0.15)"
                    : "rgba(34, 197, 94, 0.1)";
              }}
            >
              <FileSpreadsheet size={18} />
              {downloadingExcel ? "Generando..." : "Excel"}
            </button>

            <button
              onClick={descargarPDF}
              disabled={downloadingPDF || loading}
              style={{
                background: downloadingPDF
                  ? "rgba(59, 130, 246, 0.5)"
                  : darkMode
                    ? "rgba(59, 130, 246, 0.15)"
                    : "rgba(59, 130, 246, 0.1)",
                border: `1px solid ${downloadingPDF ? "rgba(59, 130, 246, 0.5)" : "rgba(59, 130, 246, 0.3)"}`,
                borderRadius: "0.5rem",
                padding: "0.5rem 0.75rem",
                color: downloadingPDF ? "#fff" : "#3b82f6",
                cursor: downloadingPDF || loading ? "not-allowed" : "pointer",
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                transition: "all 0.2s ease",
                fontSize: "0.875rem",
                fontWeight: "600",
              }}
              onMouseEnter={(e) => {
                if (!downloadingPDF && !loading) {
                  e.currentTarget.style.background = darkMode
                    ? "rgba(59, 130, 246, 0.25)"
                    : "rgba(59, 130, 246, 0.15)";
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = downloadingPDF
                  ? "rgba(59, 130, 246, 0.5)"
                  : darkMode
                    ? "rgba(59, 130, 246, 0.15)"
                    : "rgba(59, 130, 246, 0.1)";
              }}
            >
              <Download size={18} />
              {downloadingPDF ? "Generando..." : "PDF"}
            </button>

            <button
              onClick={onClose}
              style={{
                background: darkMode
                  ? "rgba(239, 68, 68, 0.15)"
                  : "rgba(239, 68, 68, 0.1)",
                border: `1px solid ${darkMode ? "rgba(239, 68, 68, 0.3)" : "rgba(239, 68, 68, 0.2)"}`,
                borderRadius: "0.5rem",
                padding: "0.5rem",
                color: "#ef4444",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transition: "all 0.2s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = darkMode
                  ? "rgba(239, 68, 68, 0.25)"
                  : "rgba(239, 68, 68, 0.15)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = darkMode
                  ? "rgba(239, 68, 68, 0.15)"
                  : "rgba(239, 68, 68, 0.1)";
              }}
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Estadísticas con estilo del admin */}
        <div
          style={{
            padding: "0.75rem 1rem",
            borderBottom: `1px solid ${theme.border}`,
            background: darkMode
              ? "rgba(255,255,255,0.01)"
              : "rgba(0,0,0,0.01)",
          }}
        >
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))",
              gap: "0.5rem",
            }}
          >
            <div
              style={{
                background: darkMode
                  ? "rgba(96, 165, 250, 0.1)"
                  : "rgba(96, 165, 250, 0.05)", // Celeste
                border: `1px solid ${darkMode ? "rgba(96, 165, 250, 0.2)" : "rgba(96, 165, 250, 0.15)"}`,
                borderRadius: "0.375rem",
                padding: "0.5rem",
                textAlign: "center",
              }}
            >
              <User
                size={16}
                color={theme.info}
                style={{ margin: "0 auto 0.125rem" }}
              />
              <div
                style={{
                  color: theme.info, // Celeste para el número
                  fontSize: "1rem",
                  fontWeight: "600",
                }}
              >
                {stats.total}
              </div>
              <div
                style={{
                  color: theme.textSecondary,
                  fontSize: "0.65rem",
                }}
              >
                Estudiantes
              </div>
            </div>

            <div
              style={{
                background: darkMode
                  ? "rgba(96, 165, 250, 0.1)"
                  : "rgba(96, 165, 250, 0.05)", // Celeste
                border: `1px solid ${darkMode ? "rgba(96, 165, 250, 0.2)" : "rgba(96, 165, 250, 0.15)"}`,
                borderRadius: "0.375rem",
                padding: "0.5rem",
                textAlign: "center",
              }}
            >
              <Award
                size={16}
                color={theme.info}
                style={{ margin: "0 auto 0.125rem" }}
              />
              <div
                style={{
                  color: theme.info, // Celeste para el número
                  fontSize: "1rem",
                  fontWeight: "600",
                }}
              >
                {stats.aprobados}
              </div>
              <div
                style={{
                  color: theme.textSecondary,
                  fontSize: "0.65rem",
                }}
              >
                Aprobados
              </div>
            </div>

            <div
              style={{
                background: darkMode
                  ? "rgba(96, 165, 250, 0.1)"
                  : "rgba(96, 165, 250, 0.05)", // Celeste
                border: `1px solid ${darkMode ? "rgba(96, 165, 250, 0.2)" : "rgba(96, 165, 250, 0.15)"}`,
                borderRadius: "0.375rem",
                padding: "0.5rem",
                textAlign: "center",
              }}
            >
              <BarChart3
                size={16}
                color={theme.info}
                style={{ margin: "0 auto 0.125rem" }}
              />
              <div
                style={{
                  color: theme.info, // Celeste para el número
                  fontSize: "1rem",
                  fontWeight: "600",
                }}
              >
                {stats.reprobados}
              </div>
              <div
                style={{
                  color: theme.textSecondary,
                  fontSize: "0.65rem",
                }}
              >
                Reprobados
              </div>
            </div>

            <div
              style={{
                background: darkMode
                  ? "rgba(96, 165, 250, 0.1)"
                  : "rgba(96, 165, 250, 0.05)", // Celeste
                border: `1px solid ${darkMode ? "rgba(96, 165, 250, 0.2)" : "rgba(96, 165, 250, 0.15)"}`,
                borderRadius: "0.375rem",
                padding: "0.5rem",
                textAlign: "center",
              }}
            >
              <BookOpen
                size={16}
                color={theme.info}
                style={{ margin: "0 auto 0.125rem" }}
              />
              <div
                style={{
                  color: theme.info, // Celeste para el número
                  fontSize: "1rem",
                  fontWeight: "600",
                }}
              >
                {stats.promedioGeneral}
              </div>
              <div
                style={{
                  color: theme.textSecondary,
                  fontSize: "0.65rem",
                }}
              >
                Promedio General
              </div>
            </div>
          </div>
        </div>

        {/* Controles de filtro y búsqueda con estilo del admin */}
        <div
          style={{
            padding: "0.5rem 1rem",
            paddingBottom: "0.75rem",
            borderBottom: `1px solid ${theme.border}`,
            background: darkMode
              ? "rgba(255,255,255,0.01)"
              : "rgba(0,0,0,0.01)",
          }}
        >
          <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", alignItems: "center" }}>
            <div style={{ position: "relative", width: "17.5rem", maxWidth: "20rem", display: "flex", alignItems: "center" }}>
              <Search
                size={16}
                style={{
                  position: "absolute",
                  left: "0.875rem",
                  top: "0",
                  bottom: "0",
                  margin: "auto",
                  display: "flex",
                  alignItems: "center",
                  color: darkMode ? "rgba(255,255,255,0.7)" : "rgba(71,85,105,1)",
                  zIndex: 1,
                  pointerEvents: "none",
                  height: "fit-content",
                }}
              />
              <input
                type="text"
                placeholder="Buscar estudiante..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                style={{
                  width: "100%",
                  paddingLeft: "2.5rem",
                  paddingRight: "0.875rem",
                  paddingTop: "0.5rem",
                  paddingBottom: "0.5rem",
                  background: theme.inputBg,
                  border: `1px solid ${theme.inputBorder}`,
                  borderRadius: "1.5rem",
                  color: theme.textPrimary,
                  fontSize: "0.875rem",
                  outline: "none",
                  lineHeight: "1.4",
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = "#3b82f6";
                  e.currentTarget.style.boxShadow =
                    "0 0 0 3px rgba(59, 130, 246, 0.1)";
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = theme.inputBorder;
                  e.currentTarget.style.boxShadow = "none";
                }}
              />
            </div>

            {/* Pestañas de Módulos - Estilo chips/pills compacto */}
            <div
              style={{
                display: "flex",
                gap: "0.5rem",
                overflowX: "auto",
                alignItems: "center",
              }}
            >
              <button
                onClick={() => setModuloActivo("todos")}
                style={{
                  padding: "0.5rem 0.875rem",
                  background:
                    moduloActivo === "todos"
                      ? "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)"
                      : darkMode
                        ? "rgba(255, 255, 255, 0.05)"
                        : "rgba(0, 0, 0, 0.05)",
                  border:
                    moduloActivo === "todos"
                      ? "none"
                      : `1px solid ${theme.border}`,
                  borderRadius: "1.5rem",
                  color:
                    moduloActivo === "todos" ? "#fff" : theme.textSecondary,
                  cursor: "pointer",
                  fontSize: "0.75rem",
                  fontWeight: "600",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.35rem",
                  transition: "all 0.2s ease",
                  whiteSpace: "nowrap",
                  boxShadow:
                    moduloActivo === "todos"
                      ? "0 2px 8px rgba(59, 130, 246, 0.3)"
                      : "none",
                  height: "fit-content",
                }}
                onMouseEnter={(e) => {
                  if (moduloActivo !== "todos") {
                    e.currentTarget.style.background = darkMode
                      ? "rgba(255, 255, 255, 0.08)"
                      : "rgba(0, 0, 0, 0.08)";
                    e.currentTarget.style.transform = "translateY(-1px)";
                  }
                }}
                onMouseLeave={(e) => {
                  if (moduloActivo !== "todos") {
                    e.currentTarget.style.background = darkMode
                      ? "rgba(255, 255, 255, 0.05)"
                      : "rgba(0, 0, 0, 0.05)";
                    e.currentTarget.style.transform = "translateY(0)";
                  }
                }}
              >
                <BookOpen size={13} />
                Todos
              </button>

              {modulos.map((modulo, idx) => (
                <button
                  key={`tab-${idx}`}
                  onClick={() => setModuloActivo(modulo)}
                  style={{
                    padding: "0.5rem 0.875rem",
                    background:
                      moduloActivo === modulo
                        ? "linear-gradient(135deg, #60a5fa 0%, #3b82f6 100%)"
                        : darkMode
                          ? "rgba(255, 255, 255, 0.05)"
                          : "rgba(0, 0, 0, 0.05)",
                    border:
                      moduloActivo === modulo
                        ? "none"
                        : `1px solid ${theme.border}`,
                    borderRadius: "1.5rem",
                    color:
                      moduloActivo === modulo ? "#fff" : theme.textSecondary,
                    cursor: "pointer",
                    fontSize: "0.75rem",
                    fontWeight: "600",
                    transition: "all 0.2s ease",
                    whiteSpace: "nowrap",
                    boxShadow:
                      moduloActivo === modulo
                        ? "0 2px 8px rgba(59, 130, 246, 0.3)"
                        : "none",
                    height: "fit-content",
                  }}
                  onMouseEnter={(e) => {
                    if (moduloActivo !== modulo) {
                      e.currentTarget.style.background = darkMode
                        ? "rgba(255, 255, 255, 0.08)"
                        : "rgba(0, 0, 0, 0.08)";
                      e.currentTarget.style.transform = "translateY(-1px)";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (moduloActivo !== modulo) {
                      e.currentTarget.style.background = darkMode
                        ? "rgba(255, 255, 255, 0.05)"
                        : "rgba(0, 0, 0, 0.05)";
                      e.currentTarget.style.transform = "translateY(0)";
                    }
                  }}
                >
                  {modulo}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Content con estilo del admin */}
        <div
          style={{
            flex: 1,
            overflow: "auto",
            padding: "1rem",
            maxHeight: "calc(90vh - 200px)",
          }}
        >
          {loading ? (
            <div style={{ textAlign: "center", padding: "3rem" }}>
              <div
                style={{
                  width: "2.5rem",
                  height: "2.5rem",
                  border: "3px solid rgba(59, 130, 246, 0.2)",
                  borderTop: "3px solid #3b82f6",
                  borderRadius: "50%",
                  animation: "spin 1s linear infinite",
                  margin: "0 auto 1rem",
                }}
              />
              <p style={{ color: theme.textSecondary, fontSize: "0.875rem" }}>
                Cargando calificaciones...
              </p>
            </div>
          ) : (
            <div>
              {/* Filtros de estudiantes arriba de la tabla */}
              <div
                style={{
                  marginBottom: "1rem",
                  display: "flex",
                  gap: "0.375rem",
                  justifyContent: "flex-end",
                }}
              >
                <button
                  onClick={() => setFiltro("todos")}
                  style={{
                    padding: "0.35rem 0.75rem",
                    background:
                      filtro === "todos"
                        ? darkMode
                          ? "rgba(59, 130, 246, 0.15)"
                          : "rgba(59, 130, 246, 0.1)"
                        : "transparent",
                    border: `1px solid ${filtro === "todos" ? "#3b82f6" : theme.inputBorder}`,
                    borderRadius: "0.375rem",
                    color: filtro === "todos" ? "#3b82f6" : theme.textSecondary,
                    cursor: "pointer",
                    fontSize: "0.75rem",
                    fontWeight: "600",
                    display: "flex",
                    alignItems: "center",
                    gap: "0.35rem",
                    transition: "all 0.2s ease",
                  }}
                  onMouseEnter={(e) => {
                    if (filtro !== "todos") {
                      e.currentTarget.style.background = darkMode
                        ? "rgba(59, 130, 246, 0.08)"
                        : "rgba(59, 130, 246, 0.05)";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (filtro !== "todos") {
                      e.currentTarget.style.background = "transparent";
                    }
                  }}
                >
                  <User size={14} />
                  Todos
                </button>

                <button
                  onClick={() => setFiltro("aprobados")}
                  style={{
                    padding: "0.35rem 0.75rem",
                    background:
                      filtro === "aprobados"
                        ? darkMode
                          ? "rgba(16, 185, 129, 0.15)"
                          : "rgba(16, 185, 129, 0.1)"
                        : "transparent",
                    border: `1px solid ${filtro === "aprobados" ? "#10b981" : theme.inputBorder}`,
                    borderRadius: "0.375rem",
                    color:
                      filtro === "aprobados" ? "#10b981" : theme.textSecondary,
                    cursor: "pointer",
                    fontSize: "0.75rem",
                    fontWeight: "600",
                    display: "flex",
                    alignItems: "center",
                    gap: "0.35rem",
                    transition: "all 0.2s ease",
                  }}
                  onMouseEnter={(e) => {
                    if (filtro !== "aprobados") {
                      e.currentTarget.style.background = darkMode
                        ? "rgba(16, 185, 129, 0.08)"
                        : "rgba(16, 185, 129, 0.05)";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (filtro !== "aprobados") {
                      e.currentTarget.style.background = "transparent";
                    }
                  }}
                >
                  <Award size={14} />
                  Aprobados
                </button>

                <button
                  onClick={() => setFiltro("reprobados")}
                  style={{
                    padding: "0.35rem 0.75rem",
                    background:
                      filtro === "reprobados"
                        ? darkMode
                          ? "rgba(239, 68, 68, 0.15)"
                          : "rgba(239, 68, 68, 0.1)"
                        : "transparent",
                    border: `1px solid ${filtro === "reprobados" ? "#ef4444" : theme.inputBorder}`,
                    borderRadius: "0.375rem",
                    color:
                      filtro === "reprobados" ? "#ef4444" : theme.textSecondary,
                    cursor: "pointer",
                    fontSize: "0.75rem",
                    fontWeight: "600",
                    display: "flex",
                    alignItems: "center",
                    gap: "0.35rem",
                    transition: "all 0.2s ease",
                  }}
                  onMouseEnter={(e) => {
                    if (filtro !== "reprobados") {
                      e.currentTarget.style.background = darkMode
                        ? "rgba(239, 68, 68, 0.08)"
                        : "rgba(239, 68, 68, 0.05)";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (filtro !== "reprobados") {
                      e.currentTarget.style.background = "transparent";
                    }
                  }}
                >
                  <BarChart3 size={14} />
                  Reprobados
                </button>
              </div>

              {/* Tabla de calificaciones con estilo del admin */}
              {filteredEstudiantes.length === 0 ? (
                <div
                  style={{
                    textAlign: "center",
                    padding: "3rem 1rem",
                    background: theme.cardBg,
                    borderRadius: "0.5rem",
                    border: `1px solid ${theme.border}`,
                  }}
                >
                  <Award
                    size={32}
                    color={theme.textMuted}
                    style={{ margin: "0 auto 1rem" }}
                  />
                  <p style={{ color: theme.textSecondary, margin: 0 }}>
                    No hay estudiantes que coincidan con los filtros
                  </p>
                </div>
              ) : (
                <div
                  style={{
                    overflowX: "auto",
                    background: theme.cardBg,
                    borderRadius: "0.5rem",
                    border: `1px solid ${theme.border}`,
                  }}
                >
                  <table
                    style={{
                      width: "100%",
                      borderCollapse: "collapse",
                      fontSize: "0.875rem",
                    }}
                  >
                    <thead>
                      <tr
                        style={{
                          background: darkMode
                            ? "rgba(255,255,255,0.05)"
                            : "rgba(0,0,0,0.02)",
                          borderBottom: `2px solid ${theme.border}`,
                        }}
                      >
                        <th
                          style={{
                            padding: "0.75rem 1rem",
                            textAlign: "left",
                            color: theme.textPrimary,
                            fontWeight: "600",
                            background: darkMode
                              ? "rgba(255, 255, 255, 0.05)"
                              : "rgba(0, 0, 0, 0.02)",
                            position: "sticky",
                            left: 0,
                            zIndex: 10,
                          }}
                        >
                          Estudiante
                        </th>
                        {tareasFiltradas.map((tarea) => (
                          <th
                            key={tarea.id_tarea}
                            style={{
                              padding: "0.75rem 1rem",
                              textAlign: "center",
                              color: theme.textPrimary,
                              fontWeight: "600",
                              minWidth: "80px",
                            }}
                          >
                            <div style={{ marginBottom: "0.25rem" }}>
                              {tarea.titulo}
                            </div>
                            <div
                              style={{
                                fontSize: "0.75rem",
                                color: theme.textMuted,
                                fontWeight: "500",
                              }}
                            >
                              /{tarea.nota_maxima}
                            </div>
                          </th>
                        ))}
                        {/* Columna de Promedio del Módulo Activo (si no es "todos") */}
                        {moduloActivo !== "todos" && (
                          <th
                            style={{
                              padding: "0.75rem 1rem",
                              textAlign: "center",
                              color: theme.textPrimary,
                              fontWeight: "600",
                              background: darkMode
                                ? "rgba(245, 158, 11, 0.1)"
                                : "rgba(245, 158, 11, 0.05)",
                              minWidth: "100px",
                            }}
                          >
                            <div style={{ marginBottom: "0.25rem" }}>
                              Promedio {moduloActivo}
                            </div>
                            <div
                              style={{
                                fontSize: "0.7rem",
                                color: theme.textMuted,
                                fontWeight: "500",
                              }}
                            >
                              /
                              {typeof pesoPorModulo === "number"
                                ? pesoPorModulo.toFixed(2)
                                : "0.00"}{" "}
                              pts
                            </div>
                          </th>
                        )}
                        {/* Columnas de Promedio por Módulo (solo si está en vista "todos") */}
                        {moduloActivo === "todos" &&
                          modulos.map((modulo, idx) => (
                            <th
                              key={`modulo-${idx}`}
                              style={{
                                padding: "0.75rem 1rem",
                                textAlign: "center",
                                color: theme.textPrimary,
                                fontWeight: "600",
                                background: darkMode
                                  ? "rgba(245, 158, 11, 0.1)"
                                  : "rgba(245, 158, 11, 0.05)",
                                minWidth: "100px",
                              }}
                            >
                              <div style={{ marginBottom: "0.25rem" }}>
                                {modulo}
                              </div>
                              <div
                                style={{
                                  fontSize: "0.7rem",
                                  color: theme.textMuted,
                                  fontWeight: "500",
                                }}
                              >
                                /
                                {typeof pesoPorModulo === "number"
                                  ? pesoPorModulo.toFixed(2)
                                  : "0.00"}{" "}
                                pts
                              </div>
                            </th>
                          ))}
                        {/* Columna Promedio Global (solo en vista "todos") */}
                        {moduloActivo === "todos" && (
                          <th
                            style={{
                              padding: "0.75rem 1rem",
                              textAlign: "center",
                              color: theme.textPrimary,
                              fontWeight: "600",
                              background: darkMode
                                ? "rgba(96, 165, 250, 0.15)"
                                : "rgba(96, 165, 250, 0.1)",
                              minWidth: "100px",
                            }}
                          >
                            <div style={{ marginBottom: "0.25rem" }}>
                              Promedio Global
                            </div>
                            <div
                              style={{
                                fontSize: "0.75rem",
                                color: theme.textMuted,
                                fontWeight: "500",
                              }}
                            >
                              /10 pts
                            </div>
                          </th>
                        )}
                      </tr>
                    </thead>
                    <tbody>
                      {filteredEstudiantes.map((estudiante, idx) => (
                        <tr
                          key={estudiante.id_estudiante}
                          style={{
                            borderBottom: `1px solid ${theme.border}`,
                            background:
                              idx % 2 === 0
                                ? darkMode
                                  ? "rgba(255,255,255,0.02)"
                                  : "transparent"
                                : darkMode
                                  ? "rgba(255,255,255,0.03)"
                                  : "rgba(0,0,0,0.01)",
                          }}
                        >
                          <td
                            style={{
                              padding: "0.75rem 1rem",
                              color: theme.textPrimary,
                              fontWeight: "500",
                              position: "sticky",
                              left: 0,
                              background:
                                idx % 2 === 0
                                  ? darkMode
                                    ? "rgba(255,255,255,0.02)"
                                    : "transparent"
                                  : darkMode
                                    ? "rgba(255,255,255,0.03)"
                                    : "rgba(0,0,0,0.01)",
                              zIndex: 9,
                            }}
                          >
                            {estudiante.apellido}, {estudiante.nombre}
                          </td>
                          {tareasFiltradas.map((tarea) => {
                            const notaVal =
                              estudiante.calificaciones[tarea.id_tarea];
                            const nota =
                              notaVal === null || notaVal === undefined
                                ? null
                                : typeof notaVal === "number"
                                  ? notaVal
                                  : Number(notaVal);
                            const porcentaje =
                              nota !== null && Number.isFinite(nota)
                                ? (nota / tarea.nota_maxima) * 100
                                : 0;
                            const color =
                              nota === null
                                ? theme.textMuted
                                : porcentaje >= 70
                                  ? theme.success
                                  : porcentaje >= 50
                                    ? theme.warning
                                    : theme.danger;

                            return (
                              <td
                                key={tarea.id_tarea}
                                style={{
                                  padding: "0.75rem 1rem",
                                  textAlign: "center",
                                }}
                              >
                                <div
                                  style={{
                                    display: "inline-block",
                                    padding: "0.25rem 0.5rem",
                                    borderRadius: "0.375rem",
                                    background: `${color}20`,
                                    color: color,
                                    fontWeight: "600",
                                    fontSize: "0.875rem",
                                  }}
                                >
                                  {nota !== null && Number.isFinite(nota)
                                    ? nota.toFixed(1)
                                    : "-"}
                                </div>
                              </td>
                            );
                          })}
                          {/* Celda de Promedio del Módulo Activo (si no es "todos") */}
                          {moduloActivo !== "todos" &&
                            (() => {
                              const moduloDetalle =
                                estudiante.modulos_detalle?.find(
                                  (m) => m.nombre_modulo === moduloActivo,
                                );
                              const promedioModulo = moduloDetalle
                                ? parseFloat(
                                  String(
                                    moduloDetalle.promedio_modulo_sobre_10,
                                  ),
                                )
                                : 0;
                              const aprobado = promedioModulo >= 7;

                              return (
                                <td
                                  style={{
                                    padding: "0.75rem 1rem",
                                    textAlign: "center",
                                    background: darkMode
                                      ? "rgba(245, 158, 11, 0.05)"
                                      : "rgba(245, 158, 11, 0.02)",
                                  }}
                                >
                                  <div
                                    style={{
                                      display: "inline-block",
                                      padding: "0.25rem 0.5rem",
                                      borderRadius: "0.375rem",
                                      background: aprobado
                                        ? "rgba(16, 185, 129, 0.2)"
                                        : "rgba(239, 68, 68, 0.2)",
                                      color: aprobado
                                        ? theme.success
                                        : theme.danger,
                                      fontWeight: "700",
                                      fontSize: "0.875rem",
                                    }}
                                  >
                                    {promedioModulo > 0
                                      ? promedioModulo.toFixed(2)
                                      : "-"}
                                  </div>
                                </td>
                              );
                            })()}
                          {/* Celdas de Promedio por Módulo (solo en vista "todos") */}
                          {moduloActivo === "todos" &&
                            modulos.map((modulo, idx) => {
                              const moduloDetalle =
                                estudiante.modulos_detalle?.find(
                                  (m) => m.nombre_modulo === modulo,
                                );
                              const promedioModulo = moduloDetalle
                                ? parseFloat(
                                  String(
                                    moduloDetalle.promedio_modulo_sobre_10,
                                  ),
                                )
                                : 0;
                              const aprobado = promedioModulo >= 7;

                              return (
                                <td
                                  key={`modulo-${idx}-${estudiante.id_estudiante}`}
                                  style={{
                                    padding: "0.75rem 1rem",
                                    textAlign: "center",
                                    background: darkMode
                                      ? "rgba(245, 158, 11, 0.05)"
                                      : "rgba(245, 158, 11, 0.02)",
                                  }}
                                >
                                  <div
                                    style={{
                                      display: "inline-block",
                                      padding: "0.25rem 0.5rem",
                                      borderRadius: "0.375rem",
                                      background: aprobado
                                        ? "rgba(16, 185, 129, 0.2)"
                                        : "rgba(239, 68, 68, 0.2)",
                                      color: aprobado
                                        ? theme.success
                                        : theme.danger,
                                      fontWeight: "700",
                                      fontSize: "0.875rem",
                                    }}
                                  >
                                    {promedioModulo > 0
                                      ? promedioModulo.toFixed(2)
                                      : "-"}
                                  </div>
                                </td>
                              );
                            })}
                          {/* Celda Promedio Global (solo en vista "todos") */}
                          {moduloActivo === "todos" && (
                            <td
                              style={{
                                padding: "0.75rem 1rem",
                                textAlign: "center",
                                background: darkMode
                                  ? "rgba(96, 165, 250, 0.08)"
                                  : "rgba(96, 165, 250, 0.05)",
                              }}
                            >
                              <div
                                style={{
                                  display: "inline-block",
                                  padding: "0.25rem 0.75rem",
                                  borderRadius: "0.375rem",
                                  background:
                                    (parseFloat(String(estudiante.promedio_global)) || 0) >= 7
                                      ? "rgba(16, 185, 129, 0.2)"
                                      : "rgba(239, 68, 68, 0.2)",
                                  color:
                                    (parseFloat(String(estudiante.promedio_global)) ||
                                      0) >= 7
                                      ? theme.success
                                      : theme.danger,
                                  fontWeight: "800",
                                  fontSize: "1rem",
                                }}
                              >
                                {estudiante.promedio_global
                                  ? typeof estudiante.promedio_global ===
                                    "number"
                                    ? estudiante.promedio_global.toFixed(2)
                                    : parseFloat(
                                      estudiante.promedio_global,
                                    ).toFixed(2)
                                  : "0.00"}
                              </div>
                            </td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ModalCalificaciones;
