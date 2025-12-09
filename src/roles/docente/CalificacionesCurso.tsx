import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Download,
  Award,
  Search,
  BarChart3,
  User,
  BookOpen,
  FileSpreadsheet,
  ArrowLeft,
  GraduationCap,
} from "lucide-react";
import { useSocket } from "../../hooks/useSocket";
import { showToast } from "../../config/toastConfig";

const API_BASE = (import.meta as any).env?.VITE_API_URL || 'http://localhost:3000';

interface ModalCalificacionesProps {
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
  identificacion?: string;
  calificaciones: { [tareaId: number]: number | null };
  promedio: number;
  promedio_global?: number;
  promedios_modulos?: { [moduloNombre: string]: number };
  modulos_detalle?: ModuloDetalle[];
}

interface ModuloDetalle {
  nombre_modulo: string;
  promedio_modulo_sobre_10: number;
  aporte_al_promedio_global: number;
}

const CalificacionesCurso: React.FC<ModalCalificacionesProps> = ({ darkMode }) => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const cursoId = parseInt(id || "0");
  const [cursoNombre, setCursoNombre] = useState<string>("");

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
  const loadImageDataUrl = (url: string): Promise<string | null> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = "Anonymous";
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          resolve(null);
          return;
        }
        ctx.drawImage(img, 0, 0);
        resolve(canvas.toDataURL("image/png"));
      };
      img.onerror = () => resolve(null);
      img.src = url;
    });
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
  const [moduloActivo, setModuloActivo] = useState<string>("todos");
  const [tareasFiltradas, setTareasFiltradas] = useState<Tarea[]>([]);

  useEffect(() => {
    if (cursoId) {
      fetchCalificaciones();
    }
  }, [cursoId]);

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

    // Ordenar estudiantes por apellido
    result.sort((a, b) => {
      const apellidoA = (a.apellido || '').trim().toUpperCase();
      const apellidoB = (b.apellido || '').trim().toUpperCase();
      return apellidoA.localeCompare(apellidoB, 'es');
    });

    setFilteredEstudiantes(result);
  }, [estudiantes, busqueda, filtro]);

  // Escuchar eventos de WebSocket para actualizaciones en tiempo real
  useSocket({
    calificacion_actualizada: (data: any) => {
      // Verificar si la calificación pertenece a este curso
      if (data.id_curso === cursoId) {
        showToast.success('Calificación actualizada', darkMode);

        // Recargar todas las calificaciones
        fetchCalificaciones();
      }
    },
    entrega_calificada: (data: any) => {
      // Verificar si la entrega pertenece a este curso
      if (data.id_curso === cursoId) {
        const nombreEstudiante = data.estudiante_nombre && data.estudiante_apellido
          ? `${data.estudiante_nombre} ${data.estudiante_apellido}`
          : 'Estudiante';

        showToast.success(`${nombreEstudiante} - Calificación registrada`, darkMode);

        // Recargar calificaciones
        fetchCalificaciones();
      }
    },
  });

  const fetchCalificaciones = async () => {
    try {
      setLoading(true);
      const token = sessionStorage.getItem("auth_token");

      // Obtener información del curso
      const cursoResponse = await fetch(
        `${API_BASE}/api/cursos/${cursoId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      if (cursoResponse.ok) {
        const cursoData = await cursoResponse.json();
        setCursoNombre(cursoData.nombre || `Curso ID: ${cursoId}`);
      }

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
          "-Error en respuesta del servidor:",
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
          const val = raw === null || raw === undefined ? 0 : Number(raw); // ← CAMBIADO: null se convierte en 0
          califs[tarea.id_tarea] = Number.isFinite(val as number)
            ? (val as number)
            : 0; // Guardar 0 

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
          identificacion: est.cedula || "N/A",
          calificaciones: califs,
          promedio: count > 0 ? suma / count : 0,
          promedio_global: parseFloat(String(promediosEst.promedio_global)) || 0,
          promedios_modulos: promediosEst.promedios_modulos,
          modulos_detalle: promediosEst.modulos_detalle || [],
        };
      });


      // Sort students alphabetically by apellido
      const sortedEstudiantes = estudiantesConCalificaciones.sort((a, b) => {
        const apellidoA = (a.apellido || '').trim().toUpperCase();
        const apellidoB = (b.apellido || '').trim().toUpperCase();
        return apellidoA.localeCompare(apellidoB, 'es');
      });

      setTareas(tareasArr);
      setEstudiantes(sortedEstudiantes);
      setTareasFiltradas(tareasArr); // Inicialmente mostrar todas
    } catch (error) {
      console.error("Error al cargar calificaciones:", error);
    } finally {
      setLoading(false);
    }
  }; const descargarPDF = async () => {
    try {
      setDownloadingPDF(true);

      const { jsPDF }: any = await import("jspdf");
      const autoTable = (await import("jspdf-autotable")).default as any;

      // SIEMPRE usar orientación horizontal para mejor visualización
      const doc = new jsPDF({ orientation: "landscape", format: "a4" });

      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();

      // ============================================
      // ENCABEZADO PROFESIONAL (NEGRO/DORADO)
      // ============================================

      // Fondo oscuro para el encabezado
      doc.setFillColor(26, 26, 26); // Negro suave #1a1a1a
      doc.rect(0, 0, pageWidth, 40, 'F');

      // Línea dorada inferior del encabezado
      doc.setDrawColor(251, 191, 36); // Dorado #fbbf24
      doc.setLineWidth(1.5);
      doc.line(0, 40, pageWidth, 40);

      // Logo de la empresa (esquina superior derecha)
      try {
        // Usar el logo de Cloudinary
        const logoUrl = "https://res.cloudinary.com/di090ggjn/image/upload/v1757037016/clbfrmifo1mbpzma5qts.png";
        const logoDataUrl = await loadImageDataUrl(logoUrl);
        if (logoDataUrl) {
          doc.addImage(logoDataUrl, "PNG", pageWidth - 45, 2, 36, 36);
        }
      } catch (e) {
        console.error("Error cargando logo:", e);
      }

      // Título principal
      doc.setTextColor(251, 191, 36); // Dorado #fbbf24
      doc.setFontSize(22);
      doc.setFont(undefined, 'bold');
      doc.text("REPORTE DE CALIFICACIONES", 14, 18);

      // Subtítulo (nombre del curso)
      doc.setTextColor(255, 255, 255); // Blanco
      doc.setFontSize(14);
      doc.setFont(undefined, 'normal');
      doc.text(String(cursoNombre || ""), 14, 28);

      // Fecha de generación
      doc.setTextColor(200, 200, 200); // Gris claro
      doc.setFontSize(9);
      const fechaActual = new Date().toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
      doc.text(`Generado el: ${fechaActual}`, 14, 35);

      // ============================================
      // TABLA DE CALIFICACIONES
      // ============================================

      // Construir encabezados
      const head = [
        [
          "Identificación",
          "Estudiante",
          "Promedio Global",
          "Estado"
        ],
      ];

      // Construir filas de datos
      const body = estudiantes.map((est, index) => {
        const promedioGlobal = parseFloat(String(est.promedio_global)) || 0;
        const estado = promedioGlobal >= 7 ? "APROBADO" : "REPROBADO";

        return [
          est.identificacion || "N/A",
          `${est.apellido}, ${est.nombre}`,
          promedioGlobal.toFixed(2),
          estado
        ];
      });

      autoTable(doc, {
        head,
        body,
        startY: 50,
        theme: 'grid',
        styles: {
          fontSize: 10,
          cellPadding: 5,
          halign: 'center',
          valign: 'middle',
          lineColor: [200, 200, 200],
          lineWidth: 0.1
        },
        headStyles: {
          fillColor: [26, 26, 26], // Negro suave
          textColor: [251, 191, 36], // Dorado
          fontStyle: 'bold',
          fontSize: 11,
          lineWidth: 0 // Sin bordes en el header para look más limpio
        },
        columnStyles: {
          0: { cellWidth: 45, halign: 'center' },
          1: { cellWidth: 'auto', halign: 'left' },
          2: { cellWidth: 40, halign: 'center' },
          3: { cellWidth: 40, halign: 'center' }
        },
        alternateRowStyles: { fillColor: [250, 250, 250] },
        didParseCell: function (data: any) {
          // Colorear la columna "Estado"
          if (data.column.index === 3 && data.section === 'body') {
            const estado = data.cell.raw;
            if (estado === 'APROBADO') {
              data.cell.styles.textColor = [22, 163, 74]; // Verde
              data.cell.styles.fontStyle = 'bold';
            } else if (estado === 'REPROBADO') {
              data.cell.styles.textColor = [220, 38, 38]; // Rojo
              data.cell.styles.fontStyle = 'bold';
            }
          }
        }
      });

      // ============================================
      // PIE DE PÁGINA
      // ============================================

      // Fondo negro
      doc.setFillColor(26, 26, 26);
      doc.rect(0, pageHeight - 12, pageWidth, 12, 'F');

      // Texto dorado
      doc.setTextColor(251, 191, 36);
      doc.setFontSize(8);
      doc.setFont(undefined, 'normal');
      doc.text(
        "Jessica Vélez - Escuela de Esteticistas | Educación Certificada",
        pageWidth / 2,
        pageHeight - 5,
        { align: 'center' }
      );

      // Guardar PDF
      doc.save(
        `Calificaciones_${cursoNombre.replace(/\s+/g, "_")}_${new Date().toISOString().split("T")[0]}.pdf`,
      );
      showToast.success('PDF descargado correctamente', darkMode);
    } catch (error) {
      console.error("Error al generar PDF:", error);
      showToast.error('Error al generar el PDF', darkMode);
    } finally {
      setDownloadingPDF(false);
    }
  }; const descargarExcel = async () => {
    try {
      setDownloadingExcel(true);

      const ExcelJS = await import('exceljs');
      const { saveAs } = await import('file-saver');

      const workbook = new ExcelJS.Workbook();

      // Función auxiliar para ajustar ancho de columnas automáticamente
      const ajustarAnchoColumnas = (worksheet: any) => {
        worksheet.columns.forEach((column: any) => {
          let maxLength = 0;
          column.eachCell({ includeEmpty: true }, (cell: any) => {
            const columnLength = cell.value ? cell.value.toString().length : 10;
            if (columnLength > maxLength) {
              maxLength = columnLength;
            }
          });
          // Añadir un poco de "aire" extra (aprox 2 caracteres)
          column.width = maxLength + 2;
        });
      };

      // ============================================
      // Hoja 1: Calificaciones por Tarea
      // ============================================
      const wsDetalle = workbook.addWorksheet('Calificaciones por Tarea', {
        pageSetup: {
          paperSize: 9, orientation: 'landscape', fitToPage: true, fitToWidth: 1, fitToHeight: 0,
          margins: { left: 0.5, right: 0.5, top: 0.75, bottom: 0.75, header: 0.3, footer: 0.3 }
        }
      });

      // 1. Preparar datos
      const tareasPorModulo: { [modulo: string]: typeof tareas } = {};
      tareas.forEach((tarea) => {
        const moduloNombre = tarea.modulo_nombre || "Sin Módulo";
        if (!tareasPorModulo[moduloNombre]) tareasPorModulo[moduloNombre] = [];
        tareasPorModulo[moduloNombre].push(tarea);
      });

      // Fila 1, 2 y 3: Encabezados
      const row1 = wsDetalle.addRow(['#', 'Apellido', 'Nombre']); // Módulos
      const row2 = wsDetalle.addRow(['', '', '']); // Tareas
      const row3 = wsDetalle.addRow(['', '', '']); // Ponderación

      // Combinar #, Apellido y Nombre (Fila 1, 2 y 3)
      wsDetalle.mergeCells(1, 1, 3, 1); // A1:A3 (#)
      wsDetalle.mergeCells(1, 2, 3, 2); // B1:B3 (Apellido)
      wsDetalle.mergeCells(1, 3, 3, 3); // C1:C3 (Nombre)

      let colIndex = 4;

      // Columnas de Tareas (Agrupadas por Módulo)
      // Usar el orden de 'modulos' (que viene del backend ordenado por ID)
      const ordenModulos = [...modulos];
      if (tareasPorModulo["Sin Módulo"]) {
        ordenModulos.push("Sin Módulo");
      }

      // Asegurar que no duplicamos y procesar solo los que tienen tareas
      const modulosConTareas = ordenModulos.filter(m => tareasPorModulo[m]);

      // Si hay módulos en 'tareasPorModulo' que no están en la lista oficial, agregarlos al final
      Object.keys(tareasPorModulo).forEach(m => {
        if (!modulosConTareas.includes(m)) {
          modulosConTareas.push(m);
        }
      });

      modulosConTareas.forEach((moduloNombre) => {
        const tareasDelModulo = tareasPorModulo[moduloNombre];

        // Escribir nombre del módulo en Fila 1
        const cellModulo = row1.getCell(colIndex);
        cellModulo.value = moduloNombre;

        // Merge horizontal para el módulo en Fila 1
        if (tareasDelModulo.length > 0) {
          wsDetalle.mergeCells(1, colIndex, 1, colIndex + tareasDelModulo.length - 1);
        }

        // Escribir nombres de tareas en Fila 2 y Ponderación en Fila 3
        tareasDelModulo.forEach((tarea) => {
          // Fila 2: Título Tarea
          const cellTarea = row2.getCell(colIndex);
          cellTarea.value = tarea.titulo;

          // Fila 3: Ponderación
          const cellPonderacion = row3.getCell(colIndex);
          cellPonderacion.value = `${tarea.ponderacion || 0} pts`;
          cellPonderacion.font = { italic: true, size: 9, color: { argb: 'FF666666' } };
          cellPonderacion.alignment = { horizontal: 'center' };

          colIndex++;
        });
      });

      // Estilos para headers
      [row1, row2, row3].forEach(row => {
        row.eachCell((cell) => {
          cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFF3F4F6' } // Gris claro
          };
          cell.border = {
            top: { style: 'thin' },
            left: { style: 'thin' },
            bottom: { style: 'thin' },
            right: { style: 'thin' }
          };
          cell.font = { bold: true };
          cell.alignment = { vertical: 'middle', horizontal: 'center' };
        });
      });

      // Columnas de Promedios por Módulo
      modulos.forEach((modulo) => {
        // Escribir en Fila 1 y combinar con Fila 2
        const cellProm = row1.getCell(colIndex);
        cellProm.value = `Promedio ${modulo}`;
        wsDetalle.mergeCells(1, colIndex, 2, colIndex);
        colIndex++;
      });

      // Columna Promedio Global
      const cellGlobal = row1.getCell(colIndex);
      cellGlobal.value = "Promedio Global (/10pts)";
      wsDetalle.mergeCells(1, colIndex, 2, colIndex);

      // 2. Estilos de Encabezados
      const estiloBaseHeader = {
        alignment: { horizontal: 'center', vertical: 'middle', wrapText: true } as any,
        border: { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } } as any
      };

      // Aplicar estilos a todo el rango de encabezados (Filas 1 y 2)
      for (let r = 1; r <= 2; r++) {
        const row = wsDetalle.getRow(r);
        row.eachCell((cell, colNumber) => {
          // Colores:
          // Apellido/Nombre (Cols 1-2): Azul Medio
          // Módulos/Tareas (Cols > 2): 
          //    - Fila 1 (Módulos): Azul Cielo
          //    - Fila 2 (Tareas): Celeste Claro
          //    - Promedios (Cols finales): Azul Cielo (porque están en Fila 1 merged)

          let fillColor = '0284C7'; // Azul cielo default

          if (colNumber <= 3) {
            fillColor = '0369A1'; // Azul medio (Apellido/Nombre)
          } else {
            // Si es fila 2 y NO es una celda combinada que viene de arriba (esto es difícil de detectar directo, pero por lógica de negocio):
            // Las celdas de tareas están en fila 2 y no tienen merge vertical.
            // Las celdas de promedios tienen merge vertical, así que "pertenecen" visualmente a la fila 1.

            // Simplificación visual:
            // Fila 1 siempre Azul Cielo (Módulos y Promedios)
            // Fila 2 (Tareas) Celeste Claro
            if (r === 2 && cell.value) { // Si tiene valor en fila 2, es una tarea
              fillColor = 'BAE6FD'; // Celeste claro
            }
            // Si es celda combinada de Promedio, usará el estilo de la celda master (Fila 1), así que este bloque no afecta.
          }

          // Corrección para texto de tareas: Azul oscuro
          const fontColor = (fillColor === 'BAE6FD') ? '0C4A6E' : 'FFFFFF';

          cell.style = {
            ...estiloBaseHeader,
            font: { bold: true, color: { argb: fontColor }, size: 11 },
            fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: fillColor } }
          };
        });
      }

      row1.height = 30;
      row2.height = 40;

      // 3. Datos de Estudiantes
      estudiantes.forEach((est, index) => {
        const rowData: any[] = [index + 1, est.apellido, est.nombre]; // Agregar índice numérico

        // Calificaciones
        Object.keys(tareasPorModulo).sort().forEach((moduloNombre) => {
          const tareasDelModulo = tareasPorModulo[moduloNombre];
          tareasDelModulo.forEach((tarea) => {
            const nota = est.calificaciones[tarea.id_tarea];
            rowData.push(nota !== null && Number.isFinite(nota) ? nota : "-");
          });
        });

        // Promedios Módulos
        modulos.forEach((modulo) => {
          const moduloDetalle = est.modulos_detalle?.find((m) => m.nombre_modulo === modulo);
          const promedioModulo = moduloDetalle ? parseFloat(String(moduloDetalle.promedio_modulo_sobre_10)) : 0;
          rowData.push(promedioModulo > 0 ? promedioModulo : "-");
        });

        // Promedio Global
        const promedioGlobal = est.promedio_global
          ? typeof est.promedio_global === "number"
            ? est.promedio_global
            : parseFloat(String(est.promedio_global))
          : 0;
        rowData.push(promedioGlobal);

        const row = wsDetalle.addRow(rowData);

        row.eachCell((cell, colNumber) => {
          cell.border = { top: { style: 'thin', color: { argb: 'E5E7EB' } }, left: { style: 'thin', color: { argb: 'E5E7EB' } }, bottom: { style: 'thin', color: { argb: 'E5E7EB' } }, right: { style: 'thin', color: { argb: 'E5E7EB' } } };
          cell.alignment = { vertical: 'middle', horizontal: colNumber === 1 ? 'center' : (colNumber <= 3 ? 'left' : 'center') };

          // Formato numérico para columna # (índice)
          if (colNumber === 1 && typeof cell.value === 'number') {
            cell.numFmt = '0'; // Número entero sin decimales
          }
          // Formato numérico para calificaciones y promedios
          else if (colNumber > 3 && typeof cell.value === 'number') {
            cell.numFmt = '0.00'; // Dos decimales
          }
        });
      });

      ajustarAnchoColumnas(wsDetalle);


      // ============================================
      // Hoja 2: Promedios por Módulo
      // ============================================
      const wsModulos = workbook.addWorksheet('Promedios por Módulo', {
        pageSetup: {
          paperSize: 9, orientation: 'landscape', fitToPage: true, fitToWidth: 1, fitToHeight: 0,
          margins: { left: 0.5, right: 0.5, top: 0.75, bottom: 0.75, header: 0.3, footer: 0.3 }
        }
      });

      const headersModulos = ['#', 'Apellido', 'Nombre', ...modulos.map(m => `${m} (/${(typeof pesoPorModulo === "number" ? pesoPorModulo : 0).toFixed(2)}pts)`), 'PROMEDIO GLOBAL (/10pts)']; const rowHeaderMod = wsModulos.addRow(headersModulos);

      rowHeaderMod.eachCell((cell) => {
        cell.style = {
          font: { bold: true, color: { argb: 'FFFFFF' }, size: 11 },
          fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: '0284C7' } },
          alignment: { horizontal: 'center', vertical: 'middle', wrapText: true }, // Wrap text activado
          border: { top: { style: 'thin' }, bottom: { style: 'thin' }, left: { style: 'thin' }, right: { style: 'thin' } }
        };
      });
      rowHeaderMod.height = 30; // Altura extra para encabezados largos

      estudiantes.forEach((est, index) => {
        const rowData = [index + 1, est.apellido, est.nombre]; // Agregar índice numérico
        modulos.forEach(modulo => {
          const moduloDetalle = est.modulos_detalle?.find((m) => m.nombre_modulo === modulo);
          const promedioModulo = moduloDetalle ? parseFloat(String(moduloDetalle.promedio_modulo_sobre_10)) : 0;
          rowData.push(promedioModulo > 0 ? promedioModulo : "-");
        });
        const promedioGlobal = est.promedio_global ? (typeof est.promedio_global === "number" ? est.promedio_global : parseFloat(String(est.promedio_global))) : 0;
        rowData.push(promedioGlobal);

        const row = wsModulos.addRow(rowData);
        row.eachCell((cell, colNumber) => {
          cell.border = { top: { style: 'thin', color: { argb: 'E5E7EB' } }, bottom: { style: 'thin', color: { argb: 'E5E7EB' } }, left: { style: 'thin', color: { argb: 'E5E7EB' } }, right: { style: 'thin', color: { argb: 'E5E7EB' } } };
          cell.alignment = { vertical: 'middle', horizontal: colNumber === 1 ? 'center' : (colNumber <= 3 ? 'left' : 'center') };

          // Formato numérico para columna # (índice)
          if (colNumber === 1 && typeof cell.value === 'number') {
            cell.numFmt = '0'; // Número entero sin decimales
          }
          // Formato numérico para promedios
          else if (colNumber > 3 && typeof cell.value === 'number') {
            cell.numFmt = '0.00'; // Dos decimales
          }
        });
      });

      ajustarAnchoColumnas(wsModulos);


      // ============================================
      // Hoja 3: Estadísticas
      // ============================================
      const wsEstadisticas = workbook.addWorksheet('Estadísticas', {
        pageSetup: {
          paperSize: 9, orientation: 'landscape', fitToPage: true, fitToWidth: 1, fitToHeight: 0,
          margins: { left: 0.5, right: 0.5, top: 0.75, bottom: 0.75, header: 0.3, footer: 0.3 }
        }
      });

      const aprobadosGlobal = estudiantes.filter((est) => (parseFloat(String(est.promedio_global)) || 0) >= 7).length;
      const reprobadosGlobal = estudiantes.length - aprobadosGlobal;
      const promedioGeneral = estudiantes.length > 0 ? (estudiantes.reduce((sum, est) => sum + est.promedio, 0) / estudiantes.length) : 0;
      const promedioGlobalCurso = estudiantes.length > 0 ? (estudiantes.reduce((sum, est) => sum + (parseFloat(String(est.promedio_global)) || 0), 0) / estudiantes.length) : 0;
      const porcentajeAprobacion = estudiantes.length > 0 ? (aprobadosGlobal / estudiantes.length) : 0;

      const datosEstadisticas = [
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
        ["Peso por Módulo", (typeof pesoPorModulo === "number" ? pesoPorModulo : 0)],
        ["", ""],
        ["Nota Mínima de Aprobación", "7.0 / 10 puntos"],
        ["Sistema de Calificación", "Todos los módulos tienen igual peso"],
      ];

      datosEstadisticas.forEach((data, index) => {
        const row = wsEstadisticas.addRow(data);
        if (index === 0) {
          row.eachCell(cell => {
            cell.style = {
              font: { bold: true, color: { argb: 'FFFFFF' }, size: 11 },
              fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: '0369A1' } },
              alignment: { horizontal: 'center', vertical: 'middle' },
              border: { top: { style: 'thin' }, bottom: { style: 'thin' }, left: { style: 'thin' }, right: { style: 'thin' } }
            };
          });
        } else {
          row.eachCell((cell, colNumber) => {
            cell.border = { top: { style: 'thin', color: { argb: 'E5E7EB' } }, bottom: { style: 'thin', color: { argb: 'E5E7EB' } }, left: { style: 'thin', color: { argb: 'E5E7EB' } }, right: { style: 'thin', color: { argb: 'E5E7EB' } } };
            cell.alignment = { vertical: 'middle', horizontal: colNumber === 1 ? 'left' : 'center' };
            if (colNumber === 1) cell.font = { bold: true };
            if (data[0] === "Porcentaje de Aprobación" && colNumber === 2) cell.numFmt = '0.0%';
            else if (typeof cell.value === 'number') cell.numFmt = '0.00';
          });
        }
      });

      ajustarAnchoColumnas(wsEstadisticas);

      const buffer = await workbook.xlsx.writeBuffer();
      const nombreCurso = cursoNombre.replace(/\s+/g, "_") || "Curso";
      const nombreArchivo = `Calificaciones_${nombreCurso}_${new Date().toISOString().split("T")[0]}.xlsx`;

      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      saveAs(blob, nombreArchivo);

    } catch (error) {
      console.error("Error generando Excel:", error);
      showToast.error('Error al generar el Excel', darkMode);
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

  // Estilos usando variables CSS del tema docente
  const theme = {
    bg: darkMode ? "rgba(0,0,0,0.6)" : "rgba(0,0,0,0.5)",
    modalBg: darkMode ? "var(--docente-card-bg)" : "#ffffff",
    textPrimary: "var(--docente-text-primary)",
    textSecondary: "var(--docente-text-secondary)",
    textMuted: "var(--docente-text-muted)",
    border: "var(--docente-border)",
    inputBg: "var(--docente-input-bg)",
    inputBorder: "var(--docente-border)",
    cardBg: "var(--docente-card-bg)",
    success: "#10b981",
    warning: "#f59e0b",
    danger: "#ef4444",
    info: "var(--docente-accent)", // Usar el color de acento del tema docente
  };

  return (
    <>
      {/* Custom scrollbar styling for module buttons */}
      <style>
        {`
          .module-buttons-scroll::-webkit-scrollbar {
            height: 6px;
          }
          .module-buttons-scroll::-webkit-scrollbar-track {
            background: transparent;
            border-radius: 10px;
          }
          .module-buttons-scroll::-webkit-scrollbar-thumb {
            background: ${darkMode ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.2)'};
            border-radius: 10px;
          }
          .module-buttons-scroll::-webkit-scrollbar-thumb:hover {
            background: ${darkMode ? 'rgba(255, 255, 255, 0.3)' : 'rgba(0, 0, 0, 0.3)'};
          }
        `}
      </style>

      <div
        style={{
          minHeight: '100%',
          backgroundColor: 'transparent',
          color: theme.textPrimary,
          padding: '0',
          paddingBottom: '0',
          paddingTop: '0'
        }}
      >
        {/* Botón Volver */}
        <div style={{ marginBottom: '0.75rem' }}>
          <button
            onClick={() => navigate('/panel/docente/calificaciones')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              background: 'rgba(59, 130, 246, 0.1)',
              border: 'none',
              color: '#3b82f6',
              fontSize: '0.875rem',
              fontWeight: '600',
              cursor: 'pointer',
              padding: '0.5rem 1rem',
              borderRadius: '0.5rem',
              transition: 'all 0.2s',
              boxShadow: '0 2px 4px rgba(59, 130, 246, 0.2)'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-1px)';
              e.currentTarget.style.background = 'rgba(59, 130, 246, 0.15)';
              e.currentTarget.style.boxShadow = '0 4px 8px rgba(59, 130, 246, 0.25)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.background = 'rgba(59, 130, 246, 0.1)';
              e.currentTarget.style.boxShadow = '0 2px 4px rgba(59, 130, 246, 0.2)';
            }}
          >
            <ArrowLeft size={16} />
            Volver a Calificaciones
          </button>
        </div>

        {/* Header */}
        <div style={{ marginBottom: '0.25rem' }}>
          <div>
            <h1 style={{ fontSize: '1.25rem', fontWeight: '800', margin: 0, color: theme.textPrimary }}>
              {cursoNombre || 'Calificaciones del Curso'}
            </h1>
            <p style={{ fontSize: '0.75rem', color: theme.textSecondary, margin: 0 }}>
              Gestiona las calificaciones y evaluaciones de los estudiantes
            </p>
          </div>
        </div>

        {/* Acciones rápidas */}
        <div style={{
          background: theme.cardBg,
          border: `1px solid ${theme.border}`,
          borderRadius: '0.625rem',
          padding: '1rem',
          marginBottom: '0.75rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div>
              <div style={{ fontSize: '0.875rem', fontWeight: '600', color: theme.textPrimary, marginBottom: '0.125rem' }}>
                Herramientas de Gestión
              </div>
              <div style={{ fontSize: '0.75rem', color: theme.textSecondary }}>
                Exportación, filtros y estadísticas disponibles
              </div>
            </div>
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
          </div>
        </div>

        {/* Estadísticas */}
        <div
          style={{
            padding: "0",
            marginBottom: "0.75rem",
          }}
        >
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))",
              gap: "0.75rem",
            }}
          >
            <div
              style={{
                background: theme.cardBg,
                border: `1px solid ${theme.border}`,
                borderRadius: "0.625rem",
                padding: "0.75rem",
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
                background: theme.cardBg,
                border: `1px solid ${theme.border}`,
                borderRadius: "0.625rem",
                padding: "0.75rem",
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
                  color: theme.info,
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
                background: theme.cardBg,
                border: `1px solid ${theme.border}`,
                borderRadius: "0.625rem",
                padding: "0.75rem",
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
                background: theme.cardBg,
                border: `1px solid ${theme.border}`,
                borderRadius: "0.625rem",
                padding: "0.75rem",
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
                  color: theme.info,
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

        {/* Título de la sección */}
        <div style={{ padding: "0", marginBottom: "1rem" }}>
          <h2 style={{
            fontSize: "1.125rem",
            fontWeight: "700",
            color: theme.textPrimary,
            margin: 0
          }}>
            Calificaciones de Estudiantes en {cursoNombre || 'Cosmetología'}
          </h2>
        </div>

        {/* Controles de filtro y búsqueda */}
        <div
          style={{
            padding: "0",
            marginBottom: "0.75rem",
          }}
        >
          <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", alignItems: "stretch" }}>
            {/* Search input - full width on mobile */}
            <div style={{ position: "relative", width: "100%", minWidth: "200px", maxWidth: "20rem", display: "flex", alignItems: "center" }}>
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
                  color: theme.textSecondary,
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
                  e.currentTarget.style.borderColor = "var(--docente-accent)";
                  e.currentTarget.style.boxShadow =
                    "0 0 0 3px rgba(34, 197, 94, 0.1)";
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = theme.inputBorder;
                  e.currentTarget.style.boxShadow = "none";
                }}
              />
            </div>

            {/* Pestañas de Módulos - Estilo chips/pills compacto con scroll horizontal */}
            <div
              style={{
                display: "flex",
                gap: "0.5rem",
                overflowX: "auto",
                alignItems: "center",
                flex: "1 1 auto",
                minWidth: "0",
                paddingBottom: "0.25rem",
                WebkitOverflowScrolling: "touch",
                scrollbarWidth: "thin",
                scrollbarColor: `${theme.border} transparent`,
              }}
              className="module-buttons-scroll"
            >
              <button
                onClick={() => setModuloActivo("todos")}
                style={{
                  padding: "0.35rem 0.75rem",
                  background:
                    moduloActivo === "todos"
                      ? "linear-gradient(135deg, #3b82f6, #2563eb)"
                      : theme.inputBg,
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
                  transition: "all 0.1s ease-out",
                }}
                onMouseEnter={(e) => {
                  if (moduloActivo !== "todos") {
                    e.currentTarget.style.background = theme.cardBg;
                    e.currentTarget.style.transform = "translateY(-1px)";
                  }
                }}
                onMouseLeave={(e) => {
                  if (moduloActivo !== "todos") {
                    e.currentTarget.style.background = theme.inputBg;
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
                    padding: "0.35rem 0.75rem",
                    background:
                      moduloActivo === modulo
                        ? "linear-gradient(135deg, #3b82f6, #2563eb)"
                        : theme.inputBg,
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
                    display: "flex",
                    alignItems: "center",
                    gap: "0.35rem",
                    transition: "all 0.1s ease-out",
                    whiteSpace: "nowrap",
                  }}
                  onMouseEnter={(e) => {
                    if (moduloActivo !== modulo) {
                      e.currentTarget.style.background = theme.cardBg;
                      e.currentTarget.style.transform = "translateY(-1px)";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (moduloActivo !== modulo) {
                      e.currentTarget.style.background = theme.inputBg;
                      e.currentTarget.style.transform = "translateY(0)";
                    }
                  }}
                >
                  {modulo}
                </button>
              ))}
            </div>

            {/* Filtros de estudiantes - wrap on mobile */}
            <div
              style={{
                display: "flex",
                gap: "0.5rem",
                alignItems: "center",
                flexWrap: "wrap",
              }}
            >
              <button
                onClick={() => setFiltro("todos")}
                style={{
                  padding: "0.35rem 0.75rem",
                  background:
                    filtro === "todos"
                      ? "linear-gradient(135deg, #3b82f6, #2563eb)"
                      : theme.inputBg,
                  border:
                    filtro === "todos"
                      ? "none"
                      : `1px solid ${theme.border}`,
                  borderRadius: "1.5rem",
                  color: filtro === "todos" ? "#fff" : theme.textSecondary,
                  cursor: "pointer",
                  fontSize: "0.75rem",
                  fontWeight: "600",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.35rem",
                  transition: "all 0.2s ease",
                  whiteSpace: "nowrap",
                }}
                onMouseEnter={(e) => {
                  if (filtro !== "todos") {
                    e.currentTarget.style.background = theme.cardBg;
                    e.currentTarget.style.transform = "translateY(-1px)";
                  }
                }}
                onMouseLeave={(e) => {
                  if (filtro !== "todos") {
                    e.currentTarget.style.background = theme.inputBg;
                    e.currentTarget.style.transform = "translateY(0)";
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
                      ? "linear-gradient(135deg, #3b82f6, #2563eb)"
                      : theme.inputBg,
                  border:
                    filtro === "aprobados"
                      ? "none"
                      : `1px solid ${theme.border}`,
                  borderRadius: "1.5rem",
                  color: filtro === "aprobados" ? "#fff" : theme.textSecondary,
                  cursor: "pointer",
                  fontSize: "0.75rem",
                  fontWeight: "600",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.35rem",
                  transition: "all 0.2s ease",
                  whiteSpace: "nowrap",
                }}
                onMouseEnter={(e) => {
                  if (filtro !== "aprobados") {
                    e.currentTarget.style.background = theme.cardBg;
                    e.currentTarget.style.transform = "translateY(-1px)";
                  }
                }}
                onMouseLeave={(e) => {
                  if (filtro !== "aprobados") {
                    e.currentTarget.style.background = theme.inputBg;
                    e.currentTarget.style.transform = "translateY(0)";
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
                      ? "linear-gradient(135deg, #3b82f6, #2563eb)"
                      : theme.inputBg,
                  border:
                    filtro === "reprobados"
                      ? "none"
                      : `1px solid ${theme.border}`,
                  borderRadius: "1.5rem",
                  color: filtro === "reprobados" ? "#fff" : theme.textSecondary,
                  cursor: "pointer",
                  fontSize: "0.75rem",
                  fontWeight: "600",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.35rem",
                  transition: "all 0.2s ease",
                  whiteSpace: "nowrap",
                }}
                onMouseEnter={(e) => {
                  if (filtro !== "reprobados") {
                    e.currentTarget.style.background = theme.cardBg;
                    e.currentTarget.style.transform = "translateY(-1px)";
                  }
                }}
                onMouseLeave={(e) => {
                  if (filtro !== "reprobados") {
                    e.currentTarget.style.background = theme.inputBg;
                    e.currentTarget.style.transform = "translateY(0)";
                  }
                }}
              >
                <BarChart3 size={14} />
                Reprobados
              </button>
            </div>
          </div>
        </div>



        {/* Content con estilo del admin */}
        <div
          style={{
            flex: 1,
            overflow: "auto",
            padding: "0",
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
                        {moduloActivo !== "todos" && tareasFiltradas.map((tarea) => (
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
                          {moduloActivo !== "todos" && tareasFiltradas.map((tarea) => {
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
                                    (parseFloat(String(estudiante.promedio_global)) ||
                                      0) >= 7
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
                                      String(estudiante.promedio_global),
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

        <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
      </div>
    </>
  );
};

export default CalificacionesCurso;
