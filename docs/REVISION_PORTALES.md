# Revisión y evolución de portales

Revisión estática del código de `main` en `ea2bf77`, realizada el 21 de octubre de 2026. Se revisaron interfaz React, rutas, modelos, controladores, presentación de datos, servicios de cierre y especificaciones de acceso. No constituye una nueva validación visual ni una prueba de uso con personas. Este documento registra alcance pendiente; no implementa las propuestas.

El portal docente se detalla en [Portal docente y evaluación](PORTAL_DOCENTE.md).

## Hallazgos transversales

| Hallazgo verificable | Consecuencia y propuesta |
| --- | --- |
| `frontend/src/App.tsx` reutiliza navegación y panel inicial; solo filtra algunas páginas administrativas. | Alumnos y familias ven conceptos como ciclos e inscripciones aunque sus necesidades sean distintas. Definir navegación y portada por perfil, conservando componentes compartidos. |
| `Student` pertenece a un único `guardian`; una cuenta sí puede tener varios hijos. | Incorporar varios tutores autorizados por alumno con cuentas y facultades independientes, sin duplicar el expediente. |
| Las notas y la boleta consultan registros guardados sin estado de publicación. | Aplicar revisión y publicación en todas las consultas, boletas, exportaciones y notificaciones, según la especificación de evaluación. |
| `User` tiene un único rol entre admin, teacher, guardian y student. | Incorporar funciones y ámbitos para dirección, coordinación y control escolar; permitir funciones múltiples explícitas sin mezclar permisos. |
| El cliente carga conjuntos de módulos completos y filtra en memoria. | Incorporar consultas por ciclo, alumno y grupo, paginación y carga por sección para mejorar el uso con muchos registros o conexión lenta. |
| El promedio de la pantalla se calcula sobre todas las notas visibles. | Mostrar promedios con contexto de alumno, materia y periodo; evitar mezclar hermanos o periodos bajo un único indicador ambiguo. |
| Hay pruebas de aislamiento por perfil y auditoría de algunas operaciones. | Ampliar pruebas al nuevo flujo; añadir consulta autorizada de auditoría e historial de valores, sin afirmar que el registro actual ya contiene cada cambio. |

## Administración, dirección y coordinación

### Disponible

Configuración de identidad escolar, ciclos y convocatorias; grupos y cupos; materias, clases y docentes; usuarios; aprobación o rechazo de solicitudes; asignación y generación de horarios; captura académica; calendario y comunicados por audiencia. El cierre de inscripción permite promoción, repetición o egreso y comprueba que existan las notas de los tres trimestres.

### Pendiente

- Bandeja de solicitudes con documentos, devoluciones, espera, responsables y fechas límite.
- Separación de permisos académicos, administrativos y técnicos; ámbitos por grupo y ciclo.
- Revisión de notas, extensiones, cierre, publicación y autorizaciones de correcciones.
- Bajas, traslados, cambios de grupo, reingresos y cierre por lotes con excepciones.
- Importaciones con vista previa, errores por fila y detección de duplicados.
- Reportes y documentos configurables, historial de emisiones y auditoría consultable.
- Seguimiento de comunicación: citatorios, confirmaciones y acuerdos pendientes.

### Diferenciación propuesta

Una portada «Qué requiere mi decisión» con responsable, vencimiento, motivo y acción para cada pendiente. Un asistente de cierre explica qué falta por grupo, permite corregirlo y muestra una vista previa antes de confirmar. Un diagnóstico de datos detecta expedientes incompletos, duplicados potenciales y asignaciones incoherentes sin hacer fusiones automáticas.

## Familias y tutores

### Disponible

Registro de cuenta familiar; alta y actualización permitida de hijos; solicitudes de ingreso y reinscripción con folio y estado; consulta de notas, asistencia, boleta interna, horarios, calendario y comunicados de su audiencia. Una cuenta puede acceder a varios hijos; no hay selector global que organice todas las secciones por hijo.

### Pendiente

- Selector de hijo persistente y resumen familiar que distinga claramente cada alumno.
- Inscripción en borrador, carga y revisión de documentos, corrección de observaciones y comprobante.
- Varios tutores con accesos independientes y permisos asignados por la escuela.
- Recuperación de cuenta, verificación e invitaciones; actualización controlada de datos.
- Solicitar justificación de una falta y consultar su resolución; no modificar directamente la asistencia oficial.
- Mensajes, citas, avisos con confirmación, autorizaciones y preferencias de notificación.
- Personas autorizadas para recoger al alumno y cambios sujetos al proceso de la escuela.
- Consulta de tareas, evidencias y acuerdos de acompañamiento compartidos con la familia.

### Diferenciación propuesta

Una «Agenda familiar» reúne acciones de todos los hijos, con nombre, fecha y siguiente paso. La reinscripción confirma datos y pide solo cambios. Cada trámite tiene una línea de seguimiento que distingue «la escuela está revisando» de «necesitamos que corrijas algo», con instrucciones concretas. Un resumen periódico reúne avisos y acuerdos para reducir mensajes repetidos, sin prometer atención inmediata permanente.

## Alumnos

### Disponible

Cuenta vinculada a su expediente; consulta de notas y retroalimentación, asistencia, horario, calendario, comunicados y boleta interna. La interfaz es compartida con otros perfiles y no existe todavía un espacio propio de actividades o entregas.

### Pendiente

- Portada y navegación adaptadas a primaria, con textos breves y objetivos claros.
- Tareas, materiales, fechas, entregas y confirmación de recepción.
- Retroalimentación por actividad, oportunidad de corregir y consultar entregas anteriores.
- Portafolio de evidencias y metas individuales acordadas con el docente.
- Canal «Necesito ayuda» dirigido al docente o personal autorizado, con seguimiento.
- Uso accesible por teclado, etiquetas claras, contraste y buen comportamiento en móvil.
- Acceso de alumnos sin correo propio mediante identificador escolar y recuperación supervisada, conservando cuentas separadas de sus tutores.

### Diferenciación propuesta

«Mi día de aprendizaje» muestra clases, materiales y próximas actividades. «Mi progreso» compara evidencias del propio alumno en distintos momentos y explica el siguiente paso; no utiliza rankings públicos entre compañeros. Ofrecer una presentación guiada para primeros grados y mayor autonomía en grados superiores, sin duplicar el expediente ni exponer información administrativa o confidencial de acompañamiento.

## Integración entre portales

Una acción debe poder completarse de principio a fin. Ejemplo de acompañamiento: falta registrada por el docente; familia envía explicación; responsable la revisa; se registra resolución; si requiere seguimiento se abre un acuerdo con responsable y fecha. La explicación familiar no cambia automáticamente la asistencia.

Ejemplo de evaluación: docente entrega; coordinación revisa; dirección publica; familia y alumno consultan. Una corrección posterior conserva el historial y actualiza la versión de la boleta mediante el circuito autorizado.

Los permisos distinguen anotaciones internas de información compartida. El vínculo con un alumno debe verificarse antes de conceder acceso a un nuevo tutor; no basta conocer su CURP. Los archivos, exportaciones y notificaciones respetan los mismos ámbitos que la interfaz.

## Prioridad y comprobación

1. Publicación y permisos académicos, varios tutores, acceso recuperable y navegación propia por perfil.
2. Trámites familiares y bandejas administrativas con estados, responsables y devoluciones.
3. Actividades, entregas, portafolio y acompañamiento integrado.
4. Funcionamiento con conectividad limitada y módulos opcionales del roadmap.

Criterios mínimos: ningún hijo o periodo se confunde al cambiar filtros; borradores no aparecen en consultas familiares; un tutor revocado pierde acceso; un cambio de grupo conserva la historia; acciones reintentadas no duplican entregas o solicitudes; cada trámite tiene estado y siguiente paso; archivos y exportaciones no permiten saltarse permisos. Validar tareas reales con docentes, dirección, familias y alumnos, además de pruebas automáticas.

Medir la propuesta mediante tiempo para completar trámites, recapturas evitadas, pendientes vencidos, solicitudes resueltas y facilidad de uso. No afirmar mejoras de aprendizaje sin evidencia.

## Referencias de mercado

Se consultaron páginas oficiales el 21 de octubre de 2026:

- [Fedena: acceso de alumnos y familias](https://fedena.com/feature-tour/students-parents-login): consulta académica, comunicación, actividades y calendario.
- [Classter: gestión escolar y portales](https://www.classter.com/product/functionalities/school-management-system/): consulta de clases, tareas, calificaciones y asistencia; calendario, reuniones y pagos para familias.

Esas funciones son referencias de mercado, no ventajas exclusivas de este proyecto. Las propuestas anteriores buscan diferenciar la experiencia para primaria y la resolución completa de pendientes; no se afirma que ningún competidor las ofrezca.
