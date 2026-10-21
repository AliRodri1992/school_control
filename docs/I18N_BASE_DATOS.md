# Internacionalización y diseño inicial de datos

Alcance acordado el 21 de octubre de 2026, pendiente de implementación. Esta especificación no cambia migraciones ni activa traducciones automáticamente.

## Situación actual

Rails configura español como predeterminado y permite es/en. `es.yml` cubre parte de validaciones y atributos; `en.yml` solo tiene hello. React y numerosos mensajes Rails están escritos en español. No hay selector de idioma, catálogo administrable ni generación automática de traducciones.

## Diseño antes de la primera instalación

El usuario confirma que no ha creado su base de datos y autoriza modificar o añadir migraciones antes de generarla. Al implementar cada módulo, consolidar la estructura inicial cuando corresponda, regenerar `schema.rb` ejecutando migraciones y verificar instalación limpia en PostgreSQL. CI ya usa bases efímeras; esa validación sigue siendo necesaria. No borrar bases persistentes ni asumir que modificar una migración actualiza bases que ya la ejecutaron.

Diseñar juntos los siguientes dominios para evitar relaciones incompatibles:

- Escuela, sedes/turnos cuando correspondan, configuración, ciclo y preferencias regionales.
- Personas, cuentas, funciones de portal, roles, permisos y asignaciones con ámbitos.
- Alumno y vínculos con varios tutores, contactos de emergencia y autorizados de recogida.
- Periodos, criterios de evaluación, entregas de notas, revisiones, publicación, correcciones y versiones de boletas.
- Solicitudes, documentos, validaciones y movimientos escolares conservando historial.
- Idiomas, claves, traducciones, lotes de generación y versiones publicadas.
- Mensajes, confirmaciones, tareas, entregas, acompañamiento y trabajos de exportación.

Aplicar claves foráneas, índices únicos compuestos, restricciones de estados y transacciones para transiciones concurrentes. La pertenencia a escuela debe ser consistente en las asociaciones antes de activar varias instituciones. Las seeds serán idempotentes. Eliminar físicamente no sustituye cancelación, baja o archivo cuando deba conservarse la trayectoria.

## Idiomas y traducción asistida

1. Usuario con permiso crea un idioma: código validado, nombre y nombre nativo, dirección del texto y estado. Español es el idioma fuente inicial; inglés será el primer destino completo. Otros idiomas dependen de la cobertura del proveedor y de revisión.
2. El sistema identifica claves fuente sin traducción o cuyo texto fuente cambió y crea un lote en segundo plano. Crear una nueva clave o solicitar una nueva traducción genera trabajo para los idiomas destino configurados.
3. Un adaptador consulta la API configurada solo para textos de interfaz. Preservar claves, variables como `%{count}`, nombres protegidos, plurales y formato; no enviar datos de alumnos, calificaciones, documentos o conversaciones.
4. Guardar resultados como borradores con proveedor, fecha, huella del texto fuente y estado. El operador revisa/corrige y publica; nunca sobrescribir una traducción manual aprobada sin una acción explícita.
5. Generar YAML por idioma y módulo, más JSON de interfaz derivado para React. Son salidas de un catálogo versionado, no dos fuentes editables independientes.
6. Publicar un paquete validado y activar su versión de forma atómica en Rails y React. Si falla, mantener la versión anterior y permitir reintento o reversión.

Añadir idioma no significa que toda su interfaz ya esté traducida. Mostrar progreso, pendientes, errores y cobertura; si el proveedor no admite el idioma, permitir traducción manual/importación sin declarar éxito automático.

## Consumo y persistencia

- Preferencia por usuario, idioma predeterminado por escuela y selección de idioma antes de iniciar sesión. Solo aceptar códigos activos y válidos; aislar locale por petición para evitar contaminación entre usuarios.
- Rails usa traducciones para validaciones, servicios, correo y reportes. React consume solo su catálogo público de interfaz, con adaptación explícita de interpolación y pluralización; no cargar archivos Rails completos en el navegador.
- Fecha, hora, números, zona horaria y PDF respetan configuración regional; verificar fuentes que cubran los alfabetos habilitados y soporte de derecha a izquierda cuando aplique.
- Español como fallback definido para claves faltantes, manteniendo el seguimiento de faltantes. No traducir códigos de estado, llaves de permisos ni identificadores persistidos.
- Guardar catálogo y paquetes generados en almacenamiento persistente/versionado. Los YAML no deben depender de escribir en el filesystem efímero del contenedor ni de un nuevo despliegue para sobrevivir.
- Paquetes descargables para respaldo y versionado; revisión de YAML mediante parser seguro, sin claves duplicadas, rutas arbitrarias o alias no permitidos. Un único nodo raíz de idioma por archivo.
- No consultar el proveedor durante navegación normal. Los contenedores cargan la versión publicada y refrescan cachés por versión.

## Proveedores y límites

Diseñar proveedor intercambiable, timeout, cuota, backoff, reintentos limitados, deduplicación y reanudación del lote. No convertir respuestas de error o cuota agotada en traducciones válidas.

- LibreTranslate puede autoalojarse como API de software libre; requiere recursos de servidor y no equivale a infraestructura gratis. Su servicio público libretranslate.com requiere una clave de pago.
- MyMemory es candidato para una API externa de uso gratuito limitado. La especificación oficial consultada indica máximo de 500 bytes por solicitud; validar cuota y condiciones actuales antes de seleccionarlo como predeterminado. No se pudo consultar directamente la página oficial de cuotas en esta revisión (403); no fijar cifras sin confirmarlas.
- No prometer disponibilidad gratuita ilimitada ni traducción a cualquier idioma. El funcionamiento del sistema no depende de que el proveedor esté disponible una vez publicados los paquetes.

Referencias consultadas el 21 de octubre de 2026: [LibreTranslate FAQ](https://docs.libretranslate.com/guides/faq/), [API MyMemory](https://mymemory.translated.net/doc/spec.php), [cuotas MyMemory](https://mymemory.translated.net/doc/usagelimits.php).

## Aspectos adicionales para todos los portales

- Acceso recuperable, MFA para funciones privilegiadas, sesiones revocables y cambio de función explícito para usuarios con varios roles.
- Reemplazos docentes temporales con fechas de inicio/fin y trazabilidad; revocación al concluir la sustitución.
- Documentos privados con validación de formato/tamaño, permisos de descarga, política de conservación y revisión de archivos antes de compartirlos.
- Centro de notificaciones con preferencias de canal/horario, estados de entrega, reintentos y control de duplicados.
- Calendario escolar y días lectivos como base de asistencia y estadísticas; no tratar días sin clase ni falta de captura como inasistencias.
- Formularios accesibles, móvil, estados de guardado visibles y recuperación de borradores; gestionar conflictos al sincronizar sin conexión.
- Respaldo de datos, adjuntos y traducciones; restauración comprobada, monitoreo y gestión de trabajos fallidos.
- Bitácora de cambios relevantes, reglas de conservación y distinción entre observaciones internas y datos compartidos con familias/alumnos.

## Criterios de aceptación

- Instalación limpia, migraciones, schema, seeds repetibles y suite completas en CI.
- Cambio de idioma en los cuatro portales, validaciones, correos y reportes, sin cambiar datos académicos.
- Claves duplicadas, faltantes e interpolaciones incompatibles detectadas antes de publicar; correcciones manuales conservadas.
- Lotes reintentables tras interrupción o cuota, sin duplicados ni pérdida del progreso; español permanece disponible.
- Versión publicada durable tras recrear contenedores; Rails y React consumen el mismo paquete y permiten rollback.
- Textos largos, plurales, formatos regionales, alfabetos y dirección RTL se verifican para cada idioma habilitado.
