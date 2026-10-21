# Portal docente y proceso de evaluación

Estado: alcance acordado pendiente de implementación, salvo la base existente descrita a continuación. Este documento no modifica el comportamiento de la aplicación.

## Base existente

- Cuenta docente con acceso a sus clases, grupos y alumnos asignados.
- Captura y actualización individual de calificaciones de tres trimestres, con retroalimentación.
- Asistencia diaria: presente, falta, retardo o justificada, con observaciones.
- Consulta de horarios, calendario, comunicados y alertas básicas de asistencia.
- Restricciones en la API y registro de auditoría de las capturas.

Actualmente el administrador también puede capturar notas, no hay estados de revisión/publicación y las notas guardadas son consultables por las familias y alumnos autorizados. Los permisos y la publicación descritos abajo son comportamiento objetivo, no garantías de la versión actual.

## Organización del portal

| Sección | Comportamiento objetivo |
| --- | --- |
| Mi día | Clases del día, asistencia pendiente, fechas de entrega y registros devueltos a corregir. |
| Mis grupos y alumnos | Listas de grupos asignados y consulta del expediente académico autorizado. |
| Asistencia | Captura de la lista completa por grupo y fecha, correcciones trazables y observaciones; posterior soporte sin conexión con sincronización visible. |
| Calificaciones | Selección de ciclo, grupo, materia y periodo; captura por teclado de toda la lista, validaciones por alumno, borrador y envío a revisión. |
| Solicitudes de corrección | Propuesta de cambio, motivo, evidencia cuando corresponda y seguimiento de la resolución. |
| Planeación y actividades | Planeación, tareas, evidencias y retroalimentación vinculadas a las clases. |
| Acompañamiento | Alertas verificables, casos asignados, acuerdos con familias y seguimiento, sin diagnósticos automáticos. |
| Horario, calendario y comunicación | Sesiones, exámenes, reuniones, avisos y mensajes según permisos. |

## Configuración de periodos

Dirección define periodos por ciclo, grupos incluidos, apertura y cierre de captura, fecha límite de revisión, fecha de publicación, escala, precisión, criterios y ponderaciones, cuando se utilicen. Se asigna un responsable de revisión. La publicación exige aprobación explícita; el vencimiento de una fecha no publica registros incompletos.

Las reglas aplicadas quedan asociadas al periodo y no se modifican retroactivamente al configurar ciclos posteriores. Se debe definir una transición explícita para las calificaciones de los tres trimestres existentes, conservando su historial y visibilidad actual sin presumir aprobaciones que nunca ocurrieron.

## Permisos objetivo

| Función | Acciones |
| --- | --- |
| Docente asignado | Capturar borradores, corregir devoluciones, enviar a revisión y solicitar correcciones de sus clases. |
| Coordinación académica | Revisar, devolver con observaciones y aprobar dentro de su ámbito autorizado. |
| Dirección | Configurar, conceder extensiones, cerrar, publicar y resolver correcciones según permisos. |
| Administración escolar | Consultar avances y emitir documentos; no recibe permiso académico de edición por ser administrador técnico. |
| Familia y alumno | Consultar sus resultados publicados; no consultar borradores ni evidencias internas de revisión. |

Una persona puede tener varias funciones. Los permisos deben validarse en el servidor, incluidas consultas, exportaciones y archivos. Una persona no puede aprobar su propia solicitud de corrección.

## Estados y cierre

El periodo tiene un estado general independiente del avance de cada clase. Cada clase pasa por: pendiente, en captura, en revisión, devuelta, aprobada y publicada.

- En captura: el docente guarda avances; las notas faltantes no se convierten en cero.
- En revisión: la entrega queda bloqueada; la revisión permite aprobar o devolver con observaciones.
- Devuelta: el docente corrige dentro de la ventana permitida; si venció, necesita una extensión autorizada.
- Aprobada: queda bloqueada hasta la publicación o una devolución explícita y auditada antes de publicar.
- Publicada: familias y alumnos pueden consultar; los cambios pasan por solicitud de corrección.

Enviar a revisión comprueba escala, ponderaciones, pertenencia de alumnos a la clase, autorización vigente del docente y evaluación completa o motivo permitido de pendiente. Al vencer la captura se bloquean las escrituras. Las extensiones llevan motivo, nueva fecha y ámbito de clase; no reabren toda la escuela. Dirección consulta pendientes por grupo y clase antes de cerrar y publicar.

## Corrección posterior a publicación

1. El docente selecciona la nota y solicita una corrección con valor propuesto, motivo y evidencia cuando corresponda.
2. La nota vigente permanece visible mientras la solicitud está pendiente.
3. Un responsable distinto y autorizado aprueba o rechaza, dejando observaciones.
4. La aprobación comprueba que la nota vigente conserve la versión revisada y aplica el cambio y la auditoría en una misma transacción.
5. Se conserva el valor anterior, solicitante, autorizador, motivos y fechas; se emite una nueva versión de la boleta y un aviso a la familia por los canales configurados.

Se impiden solicitudes pendientes duplicadas y la aplicación repetida de una aprobación. Si la nota cambió mientras se revisaba, la solicitud requiere una nueva revisión. Un rechazo conserva la nota vigente. Las versiones de boletas anteriores quedan identificadas para no confundirlas con la vigente.

## Criterios de aceptación para la implementación

- Un docente ajeno no puede consultar ni modificar la clase mediante interfaz, API o exportación.
- Guardar un borrador no lo publica a familias ni alumnos, ni lo incluye en su boleta.
- El docente puede capturar una lista con errores señalados por alumno y guardar avances sin perder datos.
- Cierre y guardado simultáneos no permiten una escritura fuera de la autorización vigente.
- Revisiones, devoluciones y extensiones conservan responsable, motivo y fechas.
- Dos aprobaciones simultáneas de una corrección producen un único cambio y una única versión nueva.
- Una solicitud desactualizada o autoaprobada se rechaza sin cambios parciales.
- Las cuentas desactivadas o docentes reasignados pierden acceso de acuerdo con la asignación vigente.
- La asistencia por grupo evita duplicados y los conflictos de sincronización se resuelven de forma visible.
- Los cuatro portales respetan la publicación y los permisos; el recorrido completo se valida en móvil y escritorio.
