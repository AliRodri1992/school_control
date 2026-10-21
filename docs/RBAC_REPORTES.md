# Roles, permisos, reportes y estadísticas

Estado: alcance del nuevo desarrollo, pendiente de implementación. Revisión del código del 21 de octubre de 2026; no se debe confundir esta especificación con funcionalidad disponible.

## Estado actual

- `User.role` admite un único valor fijo: admin, teacher, guardian o student. No existen catálogos de roles/permisos, asignaciones múltiples ni una matriz configurable mediante switches.
- Los controladores validan perfiles y ámbitos básicos; React condiciona menús y acciones según el rol. No es el RBAC configurable solicitado.
- El panel presenta conteos y alertas básicas de faltas. La boleta es una consulta interna HTML con `window.print()`; guardar como PDF depende del navegador.
- No hay un centro de reportes ni generación de archivos XLSX y PDF desde el servidor.

## RBAC configurable

Roles administrables con nombre, descripción, estado y asignación a usuarios. Roles iniciales para dirección, coordinación, control escolar, docente, tutor y alumno; las funciones pueden combinarse de forma explícita. El perfil de portal y las relaciones con alumnos o clases no sustituyen la autorización.

La pantalla Roles y permisos agrupa módulos en secciones expandibles, con búsqueda, resumen y switches etiquetados, operables con teclado. Cada acción muestra su significado y las dependencias necesarias antes de guardar. Los permisos se guardan como conjunto, con confirmación de cambios, sin aplicar mutaciones por cada clic.

| Acción | Alcance |
| --- | --- |
| Acceder/listar | Mostrar el módulo y consultar sus listas autorizadas. |
| Mostrar | Consultar el detalle de un registro autorizado. |
| Crear | Dar de alta registros permitidos. |
| Editar | Modificar registros dentro de su estado y ámbito autorizado. |
| Eliminar/archivar/restaurar | Acciones separadas, solo cuando sean válidas para ese módulo; conservar historia académica. |
| Aprobar/rechazar | Resolver solicitudes del módulo correspondiente. |
| Cerrar/publicar/reabrir | Acciones académicas separadas con motivo y reglas de negocio. |
| Autorizar corrección | Resolver cambios de calificaciones según el flujo de evaluación. |
| Consultar estadísticas | Acceder a indicadores y agregaciones autorizados. |
| Exportar Excel / exportar PDF | Permisos separados por formato y reporte. |
| Administrar roles / asignar roles | Facultades distintas, con límites para evitar escalamiento de privilegios. |

Mostrar solo acciones aplicables: no todos los módulos tienen eliminación, aprobación o publicación. Separar eliminar físicamente de cancelar, dar de baja o archivar cuando el proceso exige conservar historial.

### Ámbitos y reglas

- Ámbitos: institución autorizada, grupos asignados, clases asignadas, hijos vinculados o expediente propio. Incorporar aislamiento por institución antes de habilitar varias escuelas.
- Sin permiso explícito, denegar. Un switch apagado significa que ese rol no concede la acción; otro rol puede concederla. Mostrar el permiso efectivo y de qué rol proviene.
- Combinar concesiones por acción y ámbito, no unir globalmente los ámbitos de todos los roles: un usuario docente y tutor no puede calificar a su hijo fuera de una clase asignada.
- API, interfaz, consultas, archivos y exportaciones aplican las mismas reglas. Ocultar botones no reemplaza la validación en Rails.
- Los estados académicos prevalecen: permiso de editar no permite cambiar una nota publicada ni autoaprobar una corrección.
- Guardar roles y asignaciones con auditoría, evitar retirar el último acceso de administración de permisos y evitar que un operador se conceda facultades fuera de su autoridad.
- Revocaciones efectivas en nuevas solicitudes, incluyendo trabajos de exportación y descargas; invalidar cachés de autorización.
- Migrar los cuatro roles actuales de forma explícita, preservar vínculos académicos/familiares y verificar permisos efectivos antes de habilitar la nueva matriz.

## Centro de reportes y estadísticas

Filtros por ciclo, periodo, grado, grupo, materia, docente, alumno y fechas, según cada reporte y los permisos. Permitir vista previa, selección de columnas autorizadas y exportación consistente con los mismos filtros.

| Reporte | Contenido |
| --- | --- |
| Matrícula y capacidad | Alumnos activos, ocupación por grupo, altas, bajas y traslados cuando existan esos movimientos. |
| Inscripción y reinscripción | Solicitudes por estado, pendientes documentales, lista de espera y tiempos de resolución cuando se implementen esos procesos. |
| Asistencia | Presencias, faltas, retardos, justificaciones, cobertura de captura y tendencias por fecha/grupo. |
| Calificaciones | Concentrados por materia y periodo, distribución, pendientes, observaciones autorizadas e historial de correcciones. |
| Boletas e historial | Resultados publicados por alumno y versiones emitidas; documentos internos salvo formato oficial validado. |
| Horarios y docentes | Horarios por grupo/docente y carga de clases. |
| Operación y acompañamiento | Pendientes, responsables, vencimientos, acuerdos y resoluciones cuando estén disponibles los módulos. |
| Auditoría | Cambios y autorizaciones para usuarios expresamente autorizados. |

### Archivos y cálculos

- Excel real `.xlsx`: datos tabulares con tipos correctos, encabezados, filtros y formatos; tratar entradas de usuarios como texto para evitar fórmulas inyectadas.
- PDF generado por el servidor: identidad escolar, filtros, fecha, paginación, encabezados repetidos y diseño legible para impresión. El formato visual no confiere validez oficial.
- Indicadores con definición explícita del periodo, población, numerador y denominador. Distinguir ausencia de captura de falta real y nota pendiente de cero. No promediar hermanos o periodos bajo un indicador sin contexto.
- Reportes grandes en segundo plano con estado, expiración y descarga privada. Revalidar autorización al generar y descargar, y registrar exportaciones sin copiar datos sensibles al log.
- Familias y alumnos solo reciben resultados publicados de sus expedientes; anotaciones internas y agregados de otros alumnos quedan fuera de sus reportes.

## Criterios de aceptación

- Matriz probada por perfil, módulo, acción, ámbito y estado; acceso directo a la API no evade un switch desactivado.
- Roles múltiples no amplían indebidamente el ámbito de otra acción; revocaciones se reflejan en consultas y descargas.
- Acciones académicas requieren permisos y estado válidos; no hay autoaprobación de correcciones.
- Vista previa, Excel y PDF corresponden al mismo conjunto autorizado y filtros, con totales verificables y tratamiento explícito de datos incompletos.
- Archivos vacíos y grandes, texto largo, acentos y múltiples páginas se validan; probar aislamiento de datos y valores que comiencen con caracteres de fórmula en Excel.
- Revisar permisos y resultados históricos durante la migración; conservar acceso administrativo y trazabilidad.
