# Alcance acordado y evolución

## Portal de profesores y evaluación

El portal docente existe en la entrega inicial: permite registrar y corregir calificaciones y asistencia, añadir observaciones, consultar horarios, calendario y comunicados, con acceso académico limitado a sus asignaciones. Actualmente la captura es individual y las calificaciones guardadas quedan disponibles para consulta; todavía no existe el circuito de borrador, revisión, cierre y publicación.

Se incorpora al alcance la ampliación del portal con captura por grupo, panel «Mi día», planeación, tareas, evidencias, acompañamiento y el flujo de autorización de correcciones. La especificación y sus criterios de aceptación están en [Portal docente y evaluación](PORTAL_DOCENTE.md).

## Etapas acordadas

La revisión de los portales de administración, familias y alumnos, sus faltantes y propuestas de diferenciación se conserva en [Revisión y evolución de portales](REVISION_PORTALES.md). Complementa el alcance docente y distingue funciones existentes de trabajo pendiente.

Se incorpora como base del nuevo desarrollo el [RBAC configurable y centro de reportes](RBAC_REPORTES.md): roles y permisos por módulo y acción mediante switches, ámbitos de datos, estadísticas y exportaciones reales a Excel y PDF. La versión actual solo tiene roles fijos, indicadores básicos y una boleta imprimible desde el navegador.

También se incorpora [Internacionalización y diseño inicial de datos](I18N_BASE_DATOS.md): catálogo de idiomas, traducción automática asistida al crear traducciones, generación YAML/JSON, revisión y publicación, y consolidación de migraciones iniciales antes de la primera instalación. El usuario confirma que todavía no ha creado su base de datos; esta autorización no incluye borrar una base existente de otro entorno.

| Etapa | Ampliaciones pendientes |
| --- | --- |
| Operación escolar | Expedientes documentales, varios tutores, contactos de emergencia, autorizados para recoger alumnos, inscripción guiada, correcciones de documentos, listas de espera, bajas, traslados, cambios de grupo y reingresos con historial. |
| Gestión académica | Periodos y criterios configurables, revisión y publicación, correcciones autorizadas, cierre de ciclo, promoción por lotes con excepciones y horarios con disponibilidad, recreos y sustituciones. |
| Comunicación y acceso | Recuperación de contraseña, verificación de correo, invitaciones, permisos por función, revocación de sesiones, mensajes, citatorios, avisos y confirmación de lectura. |
| Diferenciadores | Panel «Mi día» por perfil, acompañamiento con responsable y acuerdos, portafolio de progreso, reinscripción sin recaptura y propuestas explicables de formación de grupos con revisión humana. |
| Operación avanzada | Asistencia con conexión intermitente, entrega controlada de alumnos, importaciones con revisión de errores y duplicados, reportes y exportaciones. |
| Módulos opcionales | Cobros y becas, biblioteca e inventario, transporte, comedor y varias escuelas; activables según las necesidades de cada institución. |
| Puesta en operación | Recorrido integral del ciclo, concurrencia, aislamiento de permisos, respaldos y restauración probada, monitoreo, accesibilidad y validación en celulares. |

Las integraciones de correo, pagos y sistemas oficiales requieren configuración y acceso al proveedor correspondiente. Los reportes internos no se presentarán como documentos oficiales sin definir los requisitos aplicables.

## Extensiones de mayor valor

1. Recuperación de contraseña y verificación de correo con SMTP transaccional, más invitaciones seguras a tutores.
2. Expediente documental con lista de requisitos por convocatoria, carga privada y revisión de documentos.
3. Tareas, rúbricas y portafolio de evidencias que el alumno comparta con su familia.
4. Alertas configurables y planes de acompañamiento, con seguimiento de acuerdos escuela-familia.
5. Planeación de horarios con disponibilidad por docente, recreos configurables y restricciones por materia.
6. Registro de pagos/becas cuando la escuela los requiera, sin mezclar permisos financieros con calificaciones.
7. Boletas con el formato oficial solicitado por la escuela, previa definición de normativa y autorización.
8. Notificaciones por correo y, opcionalmente, mensajería con consentimiento y preferencias.
9. Recuperación de respaldos probada, monitoreo de errores y auditoría consultable por administración.

Estas son ampliaciones propuestas; no deben confundirse con funciones implementadas en la entrega inicial.

## Plataforma inteligente y mobile-first

El alcance confirmado el 21 de octubre, el estado real de la primera entrega y el orden de desarrollo están en [Plataforma inteligente](PLATAFORMA_INTELIGENTE.md). Incluye React Grid Layout, Uppy, SweetAlert2, Noticed, comunicación, Stripe/CFDI, Classroom, offline, convivencia, psicología e IA asistida.
