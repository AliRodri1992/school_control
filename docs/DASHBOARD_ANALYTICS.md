# Dashboard: estadísticas por portal

School Control muestra gráficas con Recharts y utiliza React Grid Layout para organizar los widgets. Los datos provienen exclusivamente de `GET /api/dashboard` y se calculan en `DashboardAnalytics` a partir de los permisos persistidos del usuario autenticado.

## Portales y plantillas

| Portal | Gráficas predeterminadas |
| --- | --- |
| Administración | Matrícula por ciclo (líneas), estudiantes por grado (barras horizontales), asistencia (anillo) y admisiones (anillo) |
| Docentes | Asistencia mensual (áreas), promedio por materia (barras horizontales), calificaciones por periodo (líneas) y distribución de calificaciones (barras) |
| Tutores | Calificaciones por periodo (líneas), asistencia (anillo), faltas/retardos mensuales (barras agrupadas) y entregas de tareas (anillo) |
| Alumnos | Conserva la plantilla propia y puede agregar gráficos permitidos del progreso individual |

Los portales también conservan el widget histórico de asistencia y los indicadores ya implementados. `Restablecer plantilla` prepara la versión predeterminada, que solo se persiste al pulsar `Guardar dashboard`. Las configuraciones personalizadas no se sobrescriben al desplegar nuevas gráficas.

## Filtros y respuesta

El Dashboard ofrece ventanas de 30, 90, 180 y 365 días; ciclo escolar; grupo (administración/docentes); e hijo seleccionado (tutores). `from` y `to` usan `YYYY-MM-DD` y están limitadas a una ventana de hasta 366 días, sin fechas futuras. Los filtros opcionales `academic_year_id`, `group_id` y `student_id` se validan contra el alcance real del usuario; los identificadores ajenos devuelven `404`.

`chart_filters` presenta los filtros efectivos; `available_years` devuelve solamente los ciclos que pueden seleccionarse sin exponer el catálogo de otros grupos o familias. Las estadísticas históricas por ciclo/periodo académico utilizan los cursos e inscripciones autorizados; la ventana por fechas aplica a series de asistencia y entregas de tareas.

El servicio envía las siguientes series agregadas:

- `enrollment_trend`: alumnos matriculados por ciclo escolar.
- `students_by_grade`: alumnos únicos por grado del ciclo seleccionado o más reciente autorizado.
- `attendance_rate` y `attendance_trend`: distribución de registros y porcentaje mensual de asistencias, usando registros efectivamente capturados como denominador.
- `admission_status`: solicitudes por estado.
- `grades_by_subject`, `grades_by_term`, `grade_distribution`: únicamente calificaciones publicadas, con escala 0–10.
- `monthly_absences`: faltas y retardos registrados por mes.
- `assignment_progress`: tareas publicadas asignadas frente a entregas existentes en el periodo.

Sin datos disponibles, las gráficas muestran una vista vacía sin cifras simuladas.

## Seguridad y pruebas

El servidor utiliza `SchoolAccess` y verifica `dashboard.show` al consultar; para las calificaciones exige además `grades.index`, para asistencia `attendances.index`, para admisiones `admissions.index` y para tareas `assignments.index`. El alcance de los tutores se limita a sus hijos y las calificaciones privadas o en borrador no se agregan a la respuesta familiar.

`DashboardPreference` admite solamente los nuevos widgets correspondientes al portal, además de los widgets históricos compatibles. La suite comprueba cálculos agregados, selección de hijos y permisos revocados (RSpec), y componentes responsivos, filtros, estados vacíos y persistencia (Vitest).

Para validar un cambio: ejecutar `bundle exec rspec` y `bundle exec rubocop` en backend, `npm test` y `npm run build` en frontend, y comprobar `Quality` y la política de commits en GitHub Actions.
