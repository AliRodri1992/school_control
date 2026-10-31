# Ciclo de vida académico automático

El campo `academic_years.status` es de solo lectura en formularios y no se acepta en el controlador. El servicio `AcademicYearLifecycle` es el único escritor autorizado. Las transiciones son transaccionales, idempotentes y cuentan con un historial inmutable (`academic_year_status_transitions`) y eventos de auditoría.

| Estado actual | Siguiente | Requisitos |
|---|---|---|
| En preparación (`draft`) | Activo | Inicio alcanzado, tres trimestres, cuatro campos formativos disponibles, escuela creada, ningún otro ciclo activo |
| Activo | En cierre | Fecha de fin de clases alcanzada |
| En cierre | Cerrado | Fecha de cierre administrativo y finalización de matrículas, solicitudes, calificaciones, evaluaciones formativas y rectificaciones |
| Cerrado | Archivado | Fecha de archivo histórico y ausencia de rectificaciones pendientes |

El cierre administrativo por omisión se fija 30 días después de acabar clases; el archivo por omisión, cinco años después. Son plazos de gestión interna, no periodos legales de destrucción de documentos. Archivar no elimina información.

Los grupos sin configurar se consideran advertencia; no impiden la activación. **Las inscripciones y reinscripciones se rigen por sus ventanas propias**, también si el ciclo siguiente sigue en preparación. No se exigirán alumnos inscritos para activar un ciclo.

## Ejecución

El trabajador Sidekiq ejecuta la evaluación al arrancar y programa la siguiente ejecución a las 00:10 del día siguiente (zona de la escuela: Mexico City). En caso de un incidente de ejecución, se puede reanudar con:

```sh
docker compose exec backend bin/rails school:lifecycle:advance
```

Las publicaciones de calificaciones y el cierre de una inscripción también disparan una comprobación del ciclo actual. En la pantalla de detalle se muestra el siguiente estado, la fecha, los bloqueos y las últimas 30 transiciones.

## Protección de datos

Los ciclos cerrados/archivados bloquean las operaciones ordinarias sobre calificaciones, evaluaciones, matrículas, solicitudes, asistencia, grupos, cursos y calendario. Las calificaciones publicadas requieren el flujo de rectificación administrativa existente con razón y auditoría; el ciclo no se reabre. Con expedientes vinculados, no se permite reescribir fechas académicas establecidas desde un formulario ordinario; sí se permite completar fechas de trimestres que estaban vacías durante la reconstrucción histórica.

La versión actual administra una sola escuela. El índice único `index_academic_years_one_active` garantiza **un activo por instalación**. Antes de habilitar multiinstitución es necesario introducir `school_id` en el calendario y en los registros relacionados, y sustituir este índice por uno parcial compuesto por escuela y calendario académico.

No se usa una fecha de vacaciones, un día festivo ni un consejo técnico para cambiar el estatus del ciclo: únicamente su calendario general y las condiciones de negocio.

## Importación histórica

La migración normaliza los valores `active` heredados (que antes eran el valor predeterminado) antes de crear la restricción única. Las futuras importaciones históricas necesitan su propio flujo autorizado; no deben falsificar el historial de transiciones automatizadas.
