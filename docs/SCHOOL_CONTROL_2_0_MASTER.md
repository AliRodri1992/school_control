# School Control 2.0
## Propuesta maestra de arquitectura, identidad visual, UX/UI y evolución funcional

**Repositorio:** `AliRodri1992/school_control`  
**Rama exclusiva de desarrollo:** `feature/smart-dashboard`  
**Identidad visual propuesta:** Midnight Indigo  
**Enfoque:** Plataforma educativa profesional, mobile-first, internacionalizada, segura, accesible y extensible.

---

# 1. Objetivo del rediseño

Transformar School Control en una plataforma educativa moderna, inteligente y visualmente atractiva, dirigida a instituciones educativas de nivel primaria.

El sistema deberá ofrecer cuatro experiencias diferenciadas, sin duplicar innecesariamente las funcionalidades del backend.

El rediseño comprenderá:

- Arquitectura frontend y backend.
- Organización completa de módulos y submódulos.
- Cuatro portales especializados.
- RBAC dinámico complementado con Pundit.
- Identidad visual profesional.
- Recursos gráficos e iconografía SVG original.
- Componentes React reutilizables.
- Sidebar jerárquico de hasta tres niveles.
- Topbar funcional con reloj, notificaciones, idiomas y avatar.
- Breadcrumbs en todas las pantallas.
- Dashboards inteligentes con React Grid Layout.
- Formularios profesionales con validaciones individuales.
- Wizards para procesos complejos.
- Importador avanzado de datos con mapeo de columnas.
- Asistente virtual con un loro 2D.
- Internacionalización ampliable.
- Correos electrónicos institucionales personalizables.
- Tablas polimórficas reutilizables.
- Documentación completa de las API.
- Pruebas automáticas, accesibilidad y soporte multidispositivo.

La implementación no deberá eliminar funcionalidades existentes ni considerar completo un módulo únicamente porque su pantalla está diseñada.

# 2. Nueva identidad visual: Midnight Indigo

Se sustituirá el predominio del verde actual por una identidad visual basada en azul noche, azul eléctrico y violeta.

| Elemento | Color | Código |
|---|---|---|
| Azul noche | Identidad y navegación | `#111D42` |
| Azul eléctrico | Acciones principales | `#405CF5` |
| Violeta | Analítica y acentos | `#7964E8` |
| Ámbar | Elementos destacados | `#F4A340` |
| Fondo general | Superficies claras | `#F4F6FB` |
| Tarjetas | Blanco | `#FFFFFF` |
| Texto principal | Azul oscuro | `#17233F` |
| Texto secundario | Gris azulado | `#64748B` |

Se definirán variables de diseño centralizadas para colores, bordes, radios, sombras, espaciados, animaciones y tamaños.

Se implementarán temas claro y oscuro, con preferencia persistente por usuario.

La identidad de School Control convivirá con la identidad de cada escuela, permitiendo incorporar el logotipo y nombre institucional sin romper la consistencia de los componentes.

## Tipografía

- **Plus Jakarta Sans:** branding, títulos y encabezados.
- **Inter:** interfaz general, tablas, formularios, botones y contenido.
- Fuentes locales, sin dependencias CDN.
- Escala tipográfica responsive.
- Soporte futuro para alfabetos adicionales al incorporar nuevos idiomas.

Tamaños orientativos:

| Elemento | Tamaño |
|---|---|
| Título de página | 30–36 px |
| Título de sección | 22–26 px |
| Encabezado de tarjeta | 16–18 px |
| Texto principal | 16 px |
| Texto secundario | 14 px |
| Metadatos | 12–13 px |
| Botones e inputs | 14–16 px |

Los tamaños se implementarán mediante tokens y podrán ajustarse cuando el contenido o la accesibilidad lo requieran.

# 3. Identidad gráfica y recursos SVG

Se diseñará una biblioteca profesional de ilustraciones e iconografía SVG originales.

## Recursos gráficos

Se crearán ilustraciones para:

- Login y bienvenida.
- Dashboard administrativo.
- Dashboard docente.
- Dashboard de alumnos.
- Dashboard familiar.
- Gestión de alumnos y expedientes.
- Inscripciones y reinscripciones.
- Horarios y calendario.
- Calificaciones y asistencia.
- Documentación escolar.
- Importación de archivos.
- Reportes y estadísticas.
- Onboarding y configuración inicial.
- Estados vacíos y errores.
- Éxito de operaciones.

Las ilustraciones mantendrán un lenguaje visual consistente, con formas vectoriales, colores corporativos y detalles relacionados con el entorno escolar.

Se evitará saturar pantallas operativas con imágenes decorativas. Las ilustraciones deberán mejorar la comprensión, comunicar estados o aportar identidad.

## Iconografía SVG

Cada módulo y acción tendrá un icono semántico acorde con su significado.

Los SVG utilizarán tamaños normalizados, trazos consistentes y colores heredados del sistema de diseño.

Se integrarán con Lucide y con iconos originales cuando sea necesario.

No se usarán emojis para sustituir iconografía profesional.

Todos los recursos se almacenarán en el repositorio y serán reutilizables desde React.

# 4. Arquitectura de los cuatro portales

Los portales tendrán rutas independientes:

| Portal | Ruta |
|---|---|
| Administrativo | `/admin` |
| Docentes | `/teachers` |
| Alumnos | `/students` |
| Padres y tutores | `/tutors` |

La autenticación será centralizada mediante `/login`.

Después de iniciar sesión, el sistema identificará los portales autorizados. Cuando una cuenta tenga acceso a varios, se ofrecerá un selector de portal.

Cada portal contará con:

- Layout independiente.
- Sidebar específico.
- Dashboard especializado.
- Módulos autorizados.
- Menú de cuenta.
- Preferencias personales.
- Navegación responsive.
- Componentes visuales compartidos.

Las rutas se gestionarán mediante React Router.

Los permisos se verificarán en Rails, independientemente de lo que muestre React.

# 5. Reorganización de los módulos

## 5.1 Portal administrativo

**Inicio**
- Dashboard inteligente.
- Actividad reciente.
- Pendientes y alertas.
- Acciones rápidas.

**Gestión escolar**
- Alumnos y expedientes.
- Admisiones.
- Inscripciones y reinscripciones.
- Matrícula y trayectoria escolar.
- Revisión documental.
- Contactos, tutores y autorizados desde los expedientes.

**Gestión académica**
- Ciclos escolares.
- Grados y grupos.
- Materias y planes de estudio.
- Clases y asignaciones docentes.
- Horarios.
- Asistencia.
- Calificaciones y evaluación.
- Publicaciones y correcciones académicas.

**Aula virtual**
- Actividades.
- Materiales.
- Tareas.
- Entregas.
- Evaluación de actividades.

**Comunicación**
- Mensajería.
- Comunicados.
- Calendario escolar.
- Centro institucional de avisos.

**Reportes y análisis**
- Matrícula.
- Inscripciones.
- Calificaciones.
- Asistencia.
- Horarios.
- Auditoría autorizada.
- Exportación PDF y Excel.

**Administración del sistema**
- Usuarios.
- Roles y permisos.
- Configuración escolar.
- Identidad institucional.
- Plantillas de correo.
- Idiomas y traducciones.
- Historial de importaciones.
- Parámetros del sistema.

## 5.2 Portal docente

- Mi día.
- Mis grupos.
- Mis clases.
- Asistencia.
- Calificaciones.
- Aula virtual.
- Planeación y horarios.
- Calendario.
- Mensajes.
- Comunicados.
- Reportes autorizados.

## 5.3 Portal de alumnos

- Mi inicio.
- Mi horario.
- Mis tareas.
- Mis calificaciones.
- Mi asistencia.
- Calendario.
- Materiales.
- Mensajes.

Se diseñará una experiencia especialmente sencilla y visual para estudiantes de primaria.

## 5.4 Portal de tutores

- Inicio familiar.
- Mis hijos.
- Inscripciones y reinscripciones.
- Expedientes.
- Documentos.
- Calificaciones.
- Asistencia.
- Tareas.
- Agenda escolar.
- Mensajes.
- Avisos.

Se incorporará un selector persistente de hijo para evitar confusiones al consultar información de varios estudiantes.

# 6. Sidebar multinivel

El sidebar permitirá hasta tres niveles jerárquicos.

**Nivel 1: categoría funcional.**

Ejemplo: Gestión académica.

**Nivel 2: módulo.**

Ejemplo: Calificaciones.

**Nivel 3: función especializada.**

Ejemplo: Captura, revisión o publicación.

Características:

- Expandir y contraer categorías.
- Iconografía SVG semántica.
- Indicador de navegación activa.
- Recordar grupos abiertos.
- Modo compacto.
- Tooltips.
- Contadores de pendientes.
- Búsqueda de módulos.
- Favoritos.
- Navegación por teclado.
- Filtrado por permisos.
- Drawer responsive en móvil.

No se usarán tres niveles cuando uno o dos sean suficientes.

# 7. Topbar y breadcrumbs

El topbar deberá incorporar:

- Breadcrumbs dinámicos.
- Título y contexto de pantalla.
- Fecha y hora en tiempo real.
- Zona horaria institucional.
- Búsqueda global.
- Campana de notificaciones.
- Selector de idiomas.
- Avatar del usuario.
- Menú de cuenta.
- Cambio de portal cuando corresponda.
- Indicador de conexión cuando sea necesario.

## Breadcrumbs

Todas las pantallas tendrán breadcrumbs relacionados con la estructura real de navegación.

Ejemplos:

`Inicio / Gestión escolar / Alumnos / Nuevo alumno`

`Inicio / Gestión académica / Calificaciones / Captura`

`Inicio / Mis hijos / Expediente / Documentos`

`Inicio / Importaciones / Importar alumnos / Asociación de columnas`

Las rutas anteriores serán navegables cuando corresponda. El último elemento identificará la pantalla actual.

En móvil, los breadcrumbs se adaptarán para evitar ocupar demasiado espacio.

## Menú del avatar

- Mi perfil.
- Preferencias.
- Seguridad.
- Idioma.
- Ayuda y soporte.
- Cambio de portal autorizado.
- Cerrar sesión.

Mi perfil no aparecerá como un módulo principal del sidebar.

# 8. Dashboards inteligentes con React Grid Layout

**Se conservará React Grid Layout.**

La funcionalidad existente de personalización se ampliará, no se reemplazará.

Características:

- Widgets movibles.
- Widgets redimensionables.
- Persistencia en PostgreSQL por usuario.
- Catálogo de widgets.
- Widgets múltiples del mismo tipo.
- Gráficas mediante Recharts.
- Filtros compartidos.
- Plantillas iniciales por portal.
- Diseño responsive.
- Opciones para reordenar sin arrastrar.
- Agregar y eliminar widgets.
- Restablecer configuración.
- Guardar y recuperar preferencias.

## Widgets administrativos

- Total de alumnos.
- Matrícula activa.
- Inscripciones pendientes.
- Grupos y cupos.
- Ausentismo.
- Alertas académicas.
- Próximos eventos.
- Actividad reciente.
- Pendientes administrativos.

## Widgets docentes

- Clases de hoy.
- Asistencia pendiente.
- Tareas por revisar.
- Calificaciones pendientes.
- Mi horario.
- Próximas actividades.

## Widgets de tutores

- Resumen de hijos.
- Asistencia reciente.
- Calificaciones publicadas.
- Tareas pendientes.
- Documentos requeridos.
- Próximas reuniones.

## Widgets de alumnos

- Mi horario.
- Mis tareas.
- Próximas entregas.
- Mi progreso.
- Calendario escolar.

Los widgets respetarán los ámbitos de datos del RBAC.

# 9. Asistente inteligente Auli

Se diseñará un loro 2D adorable y profesional llamado provisionalmente **Auli**.

El personaje tendrá un estilo SVG vectorial original, con expresiones y poses reutilizables.

## Variantes

- Bienvenida.
- Feliz.
- Explicativo.
- Pensando.
- Advertencia.
- Error.
- Éxito.
- Ayuda.

Auli podrá aparecer en login, onboarding, estados vacíos, wizards, configuración y ayuda contextual.

No bloqueará el uso normal del sistema y podrá ocultarse cuando corresponda.

Inicialmente funcionará como asistente contextual basado en reglas y documentación verificada. Las capacidades posteriores de IA deberán identificarse claramente y estar sujetas a permisos, protección de datos y revisión humana.

No se presentará una respuesta generada como un hecho confirmado cuando no exista evidencia suficiente.

# 10. Componentes profesionales React

Se creará una biblioteca reutilizable para todos los portales.

## Botones

Variantes:

- Primary.
- Secondary.
- Outline.
- Ghost.
- Danger.
- Text.
- Icon.
- Loading.

Estados obligatorios:

- Default.
- Hover.
- Active.
- Focus.
- Disabled.
- Loading.

Los estados deshabilitados conservarán legibilidad. Las operaciones en curso evitarán envíos duplicados.

## Inputs

Se establecerán controles uniformes de texto, correo, contraseña, teléfono, fechas, horas, números, búsqueda, carga de archivos y campos multilínea.

Cada input tendrá:

- Label visible.
- Placeholder.
- Mensaje de ayuda opcional.
- Indicador de obligatorio.
- Estado de error.
- Error debajo del campo.
- Estado disabled.
- Estado readonly.
- Navegación accesible por teclado.

## Dropdowns

Se preferirán dropdowns y comboboxes profesionales frente a selects visualmente básicos, sin sacrificar accesibilidad.

Incluirán búsqueda, selección múltiple cuando proceda, iconos, grupos, estado vacío, búsqueda remota y soporte para teclado.

Para determinados contextos móviles o controles simples podrá utilizarse una implementación nativa accesible bajo la misma identidad visual.

## Otros componentes

- Cards.
- Tabs.
- Modales.
- Drawers laterales.
- Tooltips.
- Popovers.
- Acordeones.
- Steppers.
- Wizards.
- Calendarios.
- File uploaders.
- Badges.
- Skeleton loading.
- Paginación.
- Estados vacíos.
- Gráficas.
- Tablas.

# 11. Validaciones uniformes en formularios

Todos los errores de campos aparecerán debajo del campo correspondiente.

**Formato obligatorio:**

`NombreCampo mensajeValidacion`

Ejemplos:

- Nombre del alumno no puede estar vacío.
- Fecha de nacimiento es obligatoria.
- CURP no tiene un formato válido.
- Correo electrónico ya se encuentra registrado.
- Contraseña debe contener al menos 12 caracteres.
- Confirmación de contraseña no coincide.
- Grupo seleccionado no es válido.

Este comportamiento será obligatorio también en login, registro, recuperación de contraseña, wizards y procesos de importación.

Rails devolverá errores estructurados por atributo. React los asociará con los controles correctos y los anunciará de forma accesible.

Los errores generales de autenticación, como credenciales incorrectas, se mostrarán sin revelar si existe una cuenta determinada.

# 12. Wizards para procesos complejos

Se incorporarán asistentes por pasos cuando el flujo lo justifique.

Aplicaciones prioritarias:

- Configuración inicial.
- Alta de alumnos.
- Inscripciones.
- Reinscripciones.
- Alta de usuarios con múltiples datos.
- Importaciones.
- Revisión documental.
- Publicación de calificaciones.
- Configuración avanzada de plantillas.

Características:

- Indicador de progreso.
- Pasos navegables según validaciones.
- Anterior y siguiente.
- Validación por paso.
- Guardado de borradores cuando proceda.
- Resumen previo a confirmación.
- Errores específicos.
- Interacción opcional con Auli.
- Diseño responsive.

Los pasos deberán responder a procesos de negocio reales, no dividir formularios artificialmente.

# 13. Importador avanzado de datos

Se desarrollará un módulo de importaciones masivas basado en wizard.

## Flujo

**Paso 1. Seleccionar información**

Alumnos, docentes, tutores, materias, grupos, contactos o calificaciones, según las funcionalidades disponibles y los permisos.

**Paso 2. Cargar archivo**

Excel o CSV, con previsualización, validación de tamaño y formato.

**Paso 3. Detectar columnas**

Lectura de encabezados del archivo.

**Paso 4. Asociar columnas**

Mapeo mediante dropdowns profesionales.

Ejemplo:

| Columna Excel | Campo de sistema |
|---|---|
| Nombre | `Student.first_name` |
| Apellidos | `Student.last_name` |
| CURP | `Student.curp` |
| Nacimiento | `Student.birth_date` |
| Grupo | Identificador resuelto de `Group` |

El mapeo utilizará campos importables autorizados, no nombres de columnas arbitrarios enviados directamente a Active Record.

Permitirá detectar equivalencias, guardar plantillas de mapeo y evitar asignaciones incompatibles.

**Paso 5. Validación**

Comprobación de obligatorios, formatos, referencias, duplicados y reglas de negocio.

**Paso 6. Revisión y corrección**

Presentación de filas válidas, errores y advertencias.

**Paso 7. Confirmación**

Resumen final y autorización explícita.

**Paso 8. Ejecución y resultados**

Procesamiento seguro, seguimiento, auditoría, registros importados y archivo de errores.

Para archivos grandes se emplearán jobs en segundo plano, operaciones idempotentes y mecanismos de reintento sin duplicación.

# 14. Tablas polimórficas reutilizables

**Requisito estructural obligatorio.**

Se establecerán tablas polimórficas para direcciones, teléfonos, contactos y notas, evitando que cada entidad tenga sus propias columnas o tablas duplicadas para la misma información.

## 14.1 Direcciones — `addresses`

Asociación:

- `addressable_type`
- `addressable_id`

Podrá utilizarse con entidades autorizadas como escuelas, personas, usuarios y alumnos cuando el modelo de negocio lo requiera.

Campos propuestos:

- País.
- Estado o región.
- Municipio o localidad.
- Ciudad.
- Código postal.
- Calle y números.
- Colonia o barrio.
- Referencias.
- Tipo o propósito.
- Principal por tipo.
- Coordenadas geográficas.
- Estado de verificación.
- Fechas de auditoría.

Las reglas de captura y validación dependerán del país.

No se exigirán los mismos componentes postales para todos los países.

## 14.2 Teléfonos — `phone_numbers`

Asociación:

- `phoneable_type`
- `phoneable_id`

Campos propuestos:

- Número internacional normalizado.
- País.
- Tipo: móvil, fijo, trabajo, emergencia u otro.
- Extensión.
- Principal.
- Verificado.
- Etiqueta.
- Preferencia de contacto.

Se utilizará normalización internacional, preferentemente E.164, con validaciones de longitud y formato por país.

## 14.3 Contactos — `contacts`

Asociación:

- `contactable_type`
- `contactable_id`

Campos propuestos:

- Persona vinculada, cuando exista.
- Nombre de contacto.
- Relación o parentesco.
- Función del contacto.
- Contacto principal.
- Contacto de emergencia.
- Autorización para recoger al alumno.
- Prioridad.
- Estado de autorización.
- Observaciones administrativas permitidas.

Los contactos reutilizables no sustituirán la identidad ni las relaciones formales entre tutores y alumnos.

Por ejemplo, si una misma persona es tutora de dos hermanos, se conservará su identidad compartida y las relaciones autorizadas con cada estudiante, evitando crear dos usuarios independientes para la misma persona.

La autorización para recoger a un alumno será específica del alumno y no se heredará automáticamente por compartir datos de contacto.

## 14.4 Notas — `notes`

Asociación:

- `notable_type`
- `notable_id`

Campos propuestos:

- Contenido.
- Autor.
- Tipo de nota.
- Visibilidad.
- Estado.
- Fecha de creación.
- Fecha de actualización.
- Historial de modificaciones.

Se distinguirán notas internas y notas compartidas. Las notas sensibles, como las de psicología u orientación, deberán residir en dominios protegidos con permisos, retención y auditoría específicos, no quedar expuestas por un modelo polimórfico general.

## Reglas técnicas para las cuatro tablas

- Índices compuestos para las asociaciones polimórficas.
- Validación de tipos de propietarios permitidos.
- Comprobación de pertenencia a escuela.
- Prevención de accesos cruzados.
- Restricciones para registros principales por tipo o propósito.
- Auditoría de operaciones.
- Validaciones en modelo, políticas y servicios.
- Pruebas de concurrencia donde existan restricciones de unicidad.
- Estrategia definida de eliminación, archivo y conservación.
- Migraciones y seeds idempotentes cuando corresponda.

**Consideración de integridad:** PostgreSQL no puede garantizar mediante una clave foránea convencional que `addressable_id`, `phoneable_id`, `contactable_id` o `notable_id` apunte a la tabla indicada por su campo `*_type`. Se aplicarán validaciones, servicios transaccionales y restricciones complementarias; las relaciones críticas, como las que vinculan tutores legales con alumnos, conservarán claves foráneas reales mediante tablas de asociación específicas.

Estas estructuras son parte del rediseño propuesto. El esquema actual todavía utiliza, por ejemplo, `student_contacts` con asociación directa al alumno.

# 15. RBAC dinámico + Pundit

Se conservará el RBAC existente:

- `AccessRole`
- `AccessRoleAssignment`
- `RolePermission`
- `PermissionCatalog`
- `SchoolAccess`

Pundit complementará esta implementación mediante políticas y scopes sobre recursos.

Ejemplos:

- `StudentPolicy`
- `GradePolicy`
- `AttendancePolicy`
- `AdmissionPolicy`
- `DocumentPolicy`

Las autorizaciones deberán evaluar:

- Usuario autenticado.
- Permisos efectivos.
- Acción solicitada.
- Recurso.
- Ámbito de datos.
- Institución.
- Condiciones específicas del proceso.

Las rutas React solamente mostrarán las funciones permitidas; Rails conservará la responsabilidad final de autorizar las operaciones.

La migración será gradual y contará con pruebas para evitar que los nuevos controladores por portal cambien accidentalmente los permisos actuales.

# 16. Documentación completa de la API

**Requisito obligatorio de arquitectura y mantenimiento.**

Dado que School Control utiliza React con una API Rails JSON, se generará documentación formal de los endpoints del sistema.

La documentación utilizará **OpenAPI 3.1**, con una interfaz de consulta tipo Swagger UI o Redoc, distribuida con assets locales y sin depender de CDN.

## Contenido de la documentación

Cada endpoint deberá documentar:

- Método HTTP.
- URL.
- Versión.
- Propósito.
- Parámetros de ruta y query.
- Request body.
- Response body.
- Códigos HTTP.
- Autenticación.
- CSRF y manejo de sesiones.
- Permisos RBAC necesarios.
- Ámbitos de datos.
- Validaciones.
- Errores posibles.
- Paginación y filtros.
- Ejemplos de solicitudes y respuestas.

## Grupos documentales

- Autenticación y sesiones.
- Recuperación de contraseña.
- Usuarios, perfil y seguridad.
- Roles y permisos.
- Escuela y configuración.
- Alumnos y expedientes.
- Admisiones y matrícula.
- Contactos y datos polimórficos.
- Ciclos, grupos y materias.
- Clases y horarios.
- Asistencia y calificaciones.
- Aula virtual.
- Documentos.
- Mensajes y comunicados.
- Notificaciones.
- Dashboard y widgets.
- Reportes y exportaciones.
- Plantillas de correo.
- Idiomas y traducciones.
- Importaciones masivas.

## Versionado

Se propondrá evolucionar hacia endpoints versionados, por ejemplo:

`/api/v1/students`

`/api/v1/grades`

`/api/v1/imports`

`/api/v1/languages`

No se cambiarán abruptamente las rutas existentes. Se planificará una transición compatible desde los endpoints actuales `/api/...`.

## Archivos y acceso a documentación

Estructura propuesta:

```text
backend/
├── app/
│   └── controllers/api/
├── openapi/
│   └── v1.yaml
├── spec/
│   ├── requests/
│   └── contracts/
└── docs/
    └── api/
```

Se habilitará una ruta de documentación como `/api/docs` para entornos y usuarios autorizados.

La documentación no debe revelar secretos, credenciales reales ni información sensible de estudiantes.

Se generará y validará el contrato OpenAPI como parte del proceso de CI.

Las pruebas de contrato comprobarán que los endpoints y sus respuestas mantienen la estructura documentada.

Cuando una API se modifique, su contrato y ejemplos deberán actualizarse en el mismo desarrollo.

También se incluirán instrucciones de uso mediante herramientas como cURL y clientes de API, así como documentación para integraciones futuras.

# 17. Sistema profesional de notificaciones y SweetAlert2

Se unificará el diseño de mensajes, confirmaciones y estados.

Tipos:

- Éxito.
- Error.
- Información.
- Advertencia.
- Confirmación.
- Carga.
- Resultado parcial.

Los mensajes utilizarán los SVG y tokens del sistema de diseño.

Las confirmaciones destructivas deberán identificar claramente la operación y sus consecuencias.

Las validaciones de formularios aparecerán bajo los campos y no dependerán de SweetAlert2.

Las notificaciones persistentes usarán Noticed y la campana del topbar.

Todos los textos estarán internacionalizados.

# 18. Correos electrónicos institucionales

Se ampliará `EmailTemplate` para convertirlo en un gestor de plantillas almacenadas y versionadas en PostgreSQL.

Se contemplarán:

- Plantilla por evento.
- Idioma.
- Asunto.
- Encabezado.
- Cuerpo HTML.
- Versión texto plano.
- Variables autorizadas.
- Colores institucionales.
- Logotipo y nombre de la escuela.
- Vista previa.
- Envío de prueba.
- Estados borrador/publicada.
- Historial de versiones.
- Auditoría.

Los correos serán responsive y mantendrán una identidad visual coherente con School Control.

No se permitirá ejecutar código arbitrario desde las plantillas de base de datos.

Se conservará Letter Opener para desarrollo y se usarán jobs y colas para los envíos cuando corresponda.

# 19. Internacionalización ampliable

Idiomas iniciales:

- Español mexicano (`es`).
- Inglés (`en`).

El sistema permitirá administrar idiomas adicionales en el futuro mediante un catálogo persistente.

Las traducciones deberán cubrir:

- Login.
- Registro.
- Recuperación.
- Portales.
- Sidebars.
- Breadcrumbs.
- Dashboards.
- Formularios.
- Validaciones.
- SweetAlert2.
- Notificaciones.
- Correos.
- Reportes.
- Documentación de ayuda.

Se implementará un proceso de traducción asistida, revisión, publicación y versionado.

El idioma seleccionado se conservará por usuario y también podrá elegirse antes del inicio de sesión.

Las traducciones no se realizarán enviando datos personales o expedientes escolares a proveedores externos.

# 20. Experiencia responsive y accesibilidad

Todos los componentes y pantallas serán diseñados mobile-first.

El comportamiento se adaptará a:

- Teléfonos.
- Tablets.
- Laptops.
- Monitores de escritorio.
- Pantallas amplias.

Las tablas extensas dispondrán de alternativas móviles cuando sea apropiado.

Los modales, wizards, dropdowns, sidebars, calendarios y dashboards tendrán comportamientos adaptativos.

Se tomarán como referencia los criterios WCAG 2.2 AA.

También se respetarán preferencias de movimiento reducido, navegación por teclado y lectores de pantalla.

# 21. Organización técnica del proyecto

## Frontend

```text
frontend/src/
├── app/
│   ├── router/
│   ├── auth/
│   ├── providers/
│   └── layouts/
├── portals/
│   ├── admin/
│   ├── teachers/
│   ├── students/
│   └── tutors/
├── features/
│   ├── students/
│   ├── admissions/
│   ├── attendance/
│   ├── grades/
│   ├── classroom/
│   ├── dashboard/
│   ├── imports/
│   ├── messaging/
│   └── notifications/
├── shared/
│   ├── components/
│   ├── design-system/
│   ├── icons/
│   ├── illustrations/
│   ├── hooks/
│   └── services/
└── i18n/
```

## Backend

```text
backend/
├── app/
│   ├── controllers/
│   │   └── api/
│   │       ├── admin/
│   │       ├── teachers/
│   │       ├── students/
│   │       └── tutors/
│   ├── models/
│   ├── policies/
│   ├── services/
│   ├── jobs/
│   ├── mailers/
│   └── serializers/
├── config/
├── db/
├── openapi/
├── docs/
└── spec/
```

Los namespaces especializados se utilizarán cuando el flujo de cada portal lo justifique, sin duplicar controladores y servicios comunes innecesariamente.

# 22. Estrategia de implementación

| Fase | Alcance |
|---|---|
| 1 | Sistema de diseño, tipografía, paleta, componentes e ilustraciones SVG |
| 2 | Arquitectura de rutas y cuatro portales |
| 3 | Pundit y consolidación del RBAC |
| 4 | Sidebar multinivel, topbar, breadcrumbs, idiomas y avatar |
| 5 | Modelos y migraciones polimórficas |
| 6 | Reorganización de módulos, formularios, dropdowns y tablas |
| 7 | Dashboards inteligentes con React Grid Layout |
| 8 | Wizards, importaciones y mapeo de columnas |
| 9 | Asistente Auli y ayuda contextual |
| 10 | SweetAlert2, Noticed y correos institucionales |
| 11 | Internacionalización completa y catálogo ampliable |
| 12 | Documentación API OpenAPI/Swagger y pruebas de contrato |
| 13 | Validación responsive, accesibilidad, seguridad y CI |

El orden de implementación podrá ajustarse para atender dependencias técnicas. Los modelos de datos y las API deberán diseñarse antes de construir formularios que dependan de ellos.

# 23. Criterios finales de calidad

La implementación deberá:

1. Mantener las funcionalidades existentes.
2. Trabajar exclusivamente en `feature/smart-dashboard`.
3. Conservar una identidad visual homogénea.
4. Utilizar SVG profesionales y recursos locales.
5. Tener cuatro experiencias de portal diferenciadas.
6. Proteger rutas y operaciones mediante RBAC/Pundit.
7. Usar componentes React compartidos.
8. Disponer de breadcrumbs y navegación multinivel.
9. Conservar y evolucionar React Grid Layout.
10. Mostrar validaciones debajo de cada campo.
11. Ofrecer importación guiada con mapeo y validación previa.
12. Utilizar tablas polimórficas para datos reutilizables.
13. Documentar todas las API mediante OpenAPI.
14. Mantener las plantillas de correo en PostgreSQL.
15. Incorporar español e inglés con posibilidad de añadir idiomas.
16. Funcionar en móvil, tablet y escritorio.
17. Cumplir los criterios de accesibilidad establecidos.
18. Ejecutar las pruebas y herramientas de calidad correspondientes.
19. Validar GitHub Actions después de publicar los cambios.
20. No declarar módulos completos sin comprobar sus flujos funcionales.

---

## Resultado esperado

School Control 2.0 debe convertirse en una plataforma escolar de nivel profesional, con una identidad reconocible, cuatro portales especializados, arquitectura modular, datos consistentes y una experiencia de usuario sencilla pese a la complejidad de sus procesos internos.

El objetivo no es únicamente mejorar su apariencia, sino construir una base técnica y visual sólida sobre la que puedan desarrollarse los futuros módulos de gestión académica, comunicación, finanzas, convivencia, orientación e inteligencia asistida.
