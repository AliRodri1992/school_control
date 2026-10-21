# Plataforma escolar: alcance confirmado y estado

Fecha: 21 de octubre de 2026. Complementa ROADMAP, PORTAL_DOCENTE, REVISION_PORTALES, RBAC_REPORTES e I18N_BASE_DATOS. La palabra «pendiente» implica que todavía no se ofrece la función al usuario.

## Primera entrega de desarrollo

- React Grid Layout: catálogo extensible de indicadores, gráficas de asistencia y solicitudes, avisos, calendario y acompañamiento. Se pueden añadir instancias con títulos propios y eliminarlas (hasta 24 por usuario).
- Configuración persistida en PostgreSQL por usuario con posición y tamaño para cuatro rangos de pantalla. Restricciones del servidor, autenticación, aislamiento de preferencias y control de concurrencia optimista. No se ejecutan consultas ni código arbitrarios desde un widget.
- Diseño mobile-first: una columna en móviles, edición explícita, controles táctiles y alternativa de movimiento con botones. Los datos conservan los ámbitos del portal; no se copian expedientes en la configuración.
- SweetAlert2 con estilo propio para inicio, registro y cierre de sesión confirmado por el servidor.
- Uppy para selección y vista previa del logotipo, integrado en el guardado multipart existente. La validación del servidor se conserva. No implica que ya exista el expediente documental completo ni carga reanudable.

## Alcance pendiente por implementar

| Módulo | Requisitos y criterio de terminación |
| --- | --- |
| Identidad y personas | Perfil, preferencias, ayuda; separar persona de aspirante y alumno; familiares compartidos por hermanos, parentesco, tutor legal, emergencia y autorizados de recogida. Direcciones, notas y teléfonos en tablas polimórficas, propósito, principal por tipo y autorización de cada propietario. |
| Escuela | CCT, nombre, logotipo, domicilio estructurado, nivel, sostenimiento, zona escolar/área, turnos, fundación, teléfonos y ubicación Mapbox confirmable. |
| Admisión | Borrador, enviada, revisión, correcciones, aprobada, confirmada, rechazada, cancelada y espera. Transiciones autorizadas, historial y transacciones. Confirmar ingreso crea alumno e inscripción; reinscripción reutiliza alumno y crea inscripción del ciclo, sin duplicados. Actualmente el modelo Student ya existe antes de aprobar: requiere refactor, no se da por resuelto. |
| Documentos | Uppy, requisitos por convocatoria, validación real de archivos, almacenamiento privado, revisión, acceso autorizado y descarga; progreso y reintentos. |
| Noticed y correo | Noticed para notificaciones persistentes, leído/no leído, contador, enlaces y destinatarios autorizados. Colas, preferencias, deduplicación y reintentos. Tabla de plantillas de correo con identidad de escuela; diseño profesional y Letter Opener en desarrollo. SweetAlert2 para acciones de UI. |
| Mensajería | Canal institucional único, conversaciones y participantes autorizados, confirmación de lectura por destinatario y auditoría. Push mediante suscripciones por dispositivo, revocación y permiso del usuario; WhatsApp corporativo mediante proveedor y plantillas autorizadas. |
| Alertas de entrada | Hora esperada por turno, margen configurable y calendario. Ausencia de registro de entrada debe diferenciarse de una falta confirmada. Evitar alertas erróneas durante desconexión; deduplicar y revalidar antes del envío al tutor. |
| Dashboard avanzado | Constructor de gráficas con métricas permitidas, filtros de ciclo/grado/grupo, preferencias por usuario, accesibilidad, exportación y recomendaciones explicables. El dashboard actual usa datos de los ámbitos existentes; no implementa aún todos estos filtros. |
| IA | Reportes de desempeño basados en datos verificables, con periodo, evidencia y revisión docente. Alertas de riesgo de abandono con motivos, incertidumbre y evaluación de calidad; nunca etiquetar un alumno ni tomar decisiones automáticas de admisión. No utilizar expedientes psicológicos o denuncias confidenciales como datos para estas predicciones. |
| Pagos | Stripe: tarjeta, transferencias y métodos de efectivo admitidos por la cuenta. Obligaciones, becas, pagos parciales, conciliación, reversos y devoluciones; webhooks firmados, idempotencia y estados pendientes. No marcar pagado al emitir una referencia o regresar del checkout. |
| Facturación | CFDI mediante PAC y configuración fiscal, datos del receptor, timbrado, reintentos, cancelaciones y conciliación. Un recibo de Stripe no sustituye CFDI. Separar estado del pago, emisión fiscal y permisos académicos. La petición de condicionar calificaciones al pago requiere definición aplicable antes de habilitar esa política; no activar un bloqueo global por defecto. |
| Aula híbrida / LMS | Tareas, materiales y entregas; integración Google Classroom mediante OAuth, permisos mínimos, mapeo de clases, sincronización incremental, manejo de conflictos y revocación. Definir fuente autoritativa por dato; no duplicar calificaciones sin revisión. |
| Conectividad limitada | PWA y operaciones explícitamente habilitadas offline, cola con UUID, sincronización idempotente, versión y resolución de conflictos. Indicador de conexión y pendientes. No almacenar expedientes psicológicos o denuncias en caché offline. |
| Convivencia | Bitácora de incidentes, acuerdos, responsables y seguimiento. Buzón confidencial con opción anónima, folio de seguimiento y acceso restringido; no prometer anonimato absoluto sin evaluar logs y metadatos. Protección frente a abuso y protocolo de atención humana. |
| Psicología | Expediente separado de lo académico, permisos exclusivos por caso, cifrado, auditoría de accesos, retención y acceso de emergencia controlado. Administrar usuarios no concede lectura clínica automática. |
| Idiomas | Español mexicano con clave es e inglés. LibreTranslate configurable, traducción propuesta, revisión y publicación YAML/JSON. No traducir datos personales ni enviar secretos a servicios externos. Configurar instancia, límites y credenciales; no asumir servicio público gratuito ilimitado. |

## Orden de ejecución

1. Dashboard, sesión y primera integración Uppy (esta rama).
2. Identidad/personas, escuela, RBAC configurable, admisión y tablas compartidas.
3. Noticed, colas, plantillas, mensajería, push y alertas verificadas.
4. Cobranza, webhooks, conciliación y facturación fiscal.
5. Aula híbrida, Classroom y sincronización offline delimitada.
6. Convivencia y expedientes psicológicos con autorización y auditoría propias.
7. Reportes asistidos y evaluación de modelos de riesgo con revisión humana.

Cada etapa debe incluir pruebas de permisos, aislamiento, fallos y concurrencia donde corresponda. Las integraciones externas permanecen deshabilitadas hasta contar con configuración y pruebas de proveedor. Mantener los módulos académicos existentes y las metas de calidad; no declarar completas las etapas por agregar dependencias o tablas.
