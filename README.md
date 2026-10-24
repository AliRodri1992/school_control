# Aula · School Control

Sistema de control escolar para una primaria, con cuatro portales: administración, docentes, familias y alumnos.

**Stack:** Rails 8.1.4, Ruby 3.4.5, PostgreSQL 17, React 19.3.1, TypeScript, Vite y Docker Compose. Rails 8.1.4 fue verificado el 20 de octubre de 2026 en https://rubyonrails.org/2026/9/24/Rails-Version-8-1-4-has-been-released.

## Iniciar en Docker

Requisitos: Docker Desktop con Compose v2.24.4 o posterior, Git y OpenSSL. Compatible con Mac Apple Silicon; no fuerza arquitectura x86.

```bash
git clone https://github.com/AliRodri1992/school_control.git
cd school_control
./bin/setup
```

Abre **http://localhost:3002**. El script genera `.env` con contraseñas aleatorias; consulta `ADMIN_EMAIL` y `ADMIN_PASSWORD` en ese archivo. No se suben al repositorio.

Con `DEMO_SEEDS=true`, se crean datos ficticios y estos accesos, cuya contraseña es `DEMO_PASSWORD` de `.env`:

| Perfil | Correo |
| --- | --- |
| Familia | familia@school.test |
| Docente de 1A | docente@school.test |
| Alumno | alumno@school.test |

Las semillas son idempotentes: ejecutar `docker compose run --rm backend bundle exec rails db:seed` nuevamente conserva las cuentas, contraseñas y datos existentes. No usar datos demo en producción.

## Ejecutar junto con Delta POS (sin conflictos Docker)

`sale_point` utiliza en el host los puertos `3000` (Rails), `5432` (PostgreSQL) y `6379` (Redis).
School Control ejecuta **sus propios contenedores y volúmenes**: PostgreSQL y Redis no se publican en macOS; solo pueden verse dentro de la red privada del proyecto. Evita poner `container_name` compartidos o cambiar el nombre de proyecto de Compose si ya tienes datos.

Puertos externos predeterminados de School Control:

| Entorno | Interfaz web | Rails/API |
| --- | --- | --- |
| Desarrollo | http://localhost:3002 | http://localhost:3200 |
| Staging | http://localhost:8180 | http://localhost:3100 |
| Producción local (sin TLS) | http://localhost:8080 | Solo red Docker |

Los contenedores de School Control **siguen utilizando los puertos internos** de Rails (`backend:3000`), PostgreSQL (`db:5432`) y Redis (`redis:6379`). React consulta el backend a través de su proxy interno; no apuntes el proxy Vite ni Nginx a `localhost:3200` dentro de los contenedores.

Si ya existe el archivo `.env`, no necesitas regenerarlo. Los valores predeterminados se aplican automáticamente. Puedes añadir o cambiar estas variables para personalizar los puertos publicados:

```dotenv
SCHOOL_BACKEND_PORT=3200
SCHOOL_FRONTEND_PORT=3002
```

Después reinicia **solo School Control**, sin detener Delta POS y sin eliminar los volúmenes:

```bash
docker compose up -d --build
docker compose ps
docker compose port backend 3000
docker compose port frontend 5173
```

Para ver correos de desarrollo, abre **http://localhost:3200/letter_opener** (o el puerto personalizado). Los enlaces que Rails genera en desarrollo respetan `SCHOOL_BACKEND_PORT`.

El `compose.staging.yml` utiliza los puertos independientes `3100` y `8180`, y un nombre de proyecto propio (`school-staging`). No ejecutes `docker compose down -v`: ese comando elimina las bases de datos y archivos persistentes del proyecto correspondiente.

Si tu archivo `.env` ya contiene `SCHOOL_FRONTEND_PORT=5173`, cámbialo manualmente a `SCHOOL_FRONTEND_PORT=3002`; `bin/setup` nunca sobrescribe un `.env` existente.

### Error HTML en el inicio de sesión

Si la aplicación indica que recibió HTML en lugar de JSON, ingresa mediante **http://localhost:3002**. El puerto 3000 del equipo corresponde a Delta POS; la API de School Control se publica en el **3200**.

Verifica que ambos servicios respondan con `Content-Type: application/json` y un campo `csrf_token`:

```bash
docker compose ps
docker compose logs --tail=80 backend frontend
curl -i -H 'Accept: application/json' http://localhost:3002/api/session
curl -i -H 'Accept: application/json' http://localhost:3200/api/session
```

Un HTTP 500 en `/api/school` se origina en el backend, no en el puerto de React. Revisa `docker compose logs --tail=100 backend` y comprueba `docker compose exec backend bundle exec rails runner 'puts School.count'`. Si la base aún no se preparó, ejecuta `docker compose exec backend bundle exec rails db:prepare db:seed`.

Si una respuesta es HTML, revisa los logs de Rails y el proxy y reconstruye únicamente los servicios de School Control con `docker compose up -d --build`. No elimines los volúmenes ni cambies el proxy de Vite de `backend:3000` a `localhost:3200`: el primer nombre es el puerto **interno** correcto entre contenedores.

## Recorrido funcional

1. **Administración** configura nombre, CCT, teléfono, domicilio y logotipo PNG/JPG/WebP; el logotipo se muestra en los portales. Crea ciclos y ventanas de inscripción/reinscripción.
2. Registra grupos de **1.º a 6.º, A y B**, con cupo. Crea materias, cuentas docentes y clases por grupo/materia con carga semanal.
3. **Una familia** crea su cuenta, registra a sus hijos con CURP y envía solicitudes de nuevo ingreso a primero. Obtiene un folio y consulta el estado y motivo de rechazo, si existe.
4. Administración aprueba y asigna grupo. Solicitud e inscripción se guardan en una transacción, con control de cupo y de duplicados. El expediente del aspirante se convierte en matrícula sin crear otra persona.
5. Administración crea un acceso de alumno y lo vincula al expediente desde **Usuarios**. El alumno solo consulta su información; las familias ven a todos sus hijos.
6. Genera el horario del grupo o agrega sesiones manualmente. Se comprueban conflictos de docente, grupo y aula. La generación es atómica; si la carga no cabe, no deja un horario incompleto.
7. Docentes registran asistencia y borradores de notas de tres trimestres; solo pueden calificar sus clases. Administración revisa y publica las notas. Las familias y alumnos consultan únicamente las notas publicadas y su retroalimentación.
8. **Expedientes → Boleta e historial** muestra el historial por ciclo y permite imprimir/guardar como PDF desde el navegador. Es una boleta de consulta, no un certificado oficial.
9. Administración cierra cada inscripción con promoción, repetición o egreso de sexto, exigiendo calificaciones publicadas de las materias en los tres trimestres. La siguiente solicitud solo acepta el grado que corresponda al resultado anterior.
10. Programa exámenes, reuniones, suspensiones y actividades, para un grupo o toda la escuela. Publica comunicados para familias, docentes, alumnos o todos.

## Diferenciadores implementados

- **Trayectoria continua:** un expediente conserva los ciclos, boletas y resultados desde la solicitud inicial hasta sexto.
- **Acompañamiento:** alertas de tres o más faltas registradas en 30 días, visibles según los permisos del portal.
- **Vista familiar:** varios hijos desde una cuenta y seguimiento de solicitudes con folio.
- **Planeación sin conflictos:** generador de horarios y validación de captura manual, con bloqueo del ciclo para serializar escrituras.
- **Identidad propia:** nombre y logotipo institucional, no un portal genérico sin personalización.
- **Permisos del servidor:** aislamiento por familia, alumno y asignación docente; no depende de ocultar botones.

## Calidad

```bash
./bin/quality
# O individualmente:
docker compose run --rm -e RAILS_ENV=test backend bundle exec rails db:prepare
docker compose run --rm -e RAILS_ENV=test -e COVERAGE=true backend bundle exec rspec
docker compose run --rm backend bundle exec rubocop
docker compose run --rm backend bundle exec brakeman --no-pager
docker compose run --rm frontend npm test
docker compose run --rm frontend npm run build
```

RSpec, FactoryBot y Shoulda Matchers cubren validaciones, permisos y flujos transaccionales. SimpleCov mide líneas y ramas sin excluir controladores o servicios de negocio. GitHub Actions ejecuta las pruebas con PostgreSQL, análisis, compilación de React y arranque Docker; publica el informe de cobertura como artifact.

## Arquitectura y seguridad

- `backend/`: aplicación Rails, modelos, servicios, API JSON, RSpec y migraciones.
- `frontend/`: React/TypeScript, con formularios, tablas, paneles y portales responsivos; sin CDN.
- Sesiones mediante cookie HttpOnly y protección CSRF. El token se obtiene desde `/api/session`; el navegador nunca almacena contraseñas o tokens en localStorage.
- Contraseñas de al menos 12 caracteres, bcrypt, bloqueo por rol, cuentas desactivables y límite de intentos de acceso.
- PostgreSQL: claves foráneas, índices únicos y restricciones para grados, estados y calificaciones.
- Registro de auditoría de aprobaciones, calificaciones, asistencia, horarios y configuración. No guarda contraseñas ni documentos personales en el evento.
- Datos persistentes en volúmenes `postgres_data` y `school_uploads`. `docker compose down` conserva datos; **`down -v` los elimina**.

## Desarrollo y cambios

El compose predeterminado ejecuta imágenes construidas con el código actual. Tras editar, ejecuta `docker compose up -d --build`. No necesitas Ruby ni Node en tu computadora.

## Producción

`compose.production.yml` construye React y lo sirve mediante Nginx en el mismo origen que la API. Configura `.env` con `SECRET_KEY_BASE` aleatorio, `DATABASE_URL` de la base de producción y `DEMO_SEEDS=false`. Ejecuta migraciones y semillas administrativas con ese entorno. Coloca un proxy TLS delante de `127.0.0.1:8080`; debe establecer `X-Forwarded-Proto: https`. Las cookies de producción requieren HTTPS.

```bash
docker compose -f compose.yml -f compose.production.yml build
docker compose -f compose.yml -f compose.production.yml run --rm backend bundle exec rails db:prepare db:seed
docker compose -f compose.yml -f compose.production.yml up -d
```

Antes de operar con alumnos reales: configurar dominio y TLS, respaldos y restauración, monitoreo, política de privacidad y usuarios definitivos. Los respaldos deben incluir tanto PostgreSQL como los archivos subidos.

## Alcance y siguientes ampliaciones

Esta entrega implementa el circuito académico descrito. No se presenta como un producto terminado para cualquier escuela: todavía no incluye integración SEP/SIGED, boletas oficiales firmadas, pagos, biblioteca, transporte ni integración con Google Classroom. Las tareas y los avisos por correo se describen abajo; requieren sus servicios configurados. El calendario registra exámenes; no es un motor para resolver exámenes en línea.

El generador usa asignación determinista de bloques, no un optimizador con preferencias individuales. La repetición/promoción es una decisión administrativa explícita; no se presume una normativa oficial a partir del promedio. La alerta de faltas es un indicador operativo, no una evaluación psicológica ni una predicción de desempeño.

## Recuperación de acceso y sesiones

En la pantalla de acceso, **¿Olvidaste tu contraseña?** envía un enlace válido por 15 minutos. El enlace se consume al guardar una contraseña válida, requiere confirmación y cierra todas las sesiones anteriores. Las respuestas de solicitud no revelan si el correo está registrado. El token viaja en el fragmento del enlace, se retira de la barra del navegador y se envía a la API en el cuerpo de la solicitud, filtrado de los logs. La cola recibe únicamente el identificador de usuario y la versión de acceso; genera el enlace al procesar el correo.

**Mi perfil → Seguridad de tu cuenta** permite cambiar la contraseña o cerrar todas las sesiones, comprobando la contraseña actual. Cambiar el correo o desactivar una cuenta también invalida sus sesiones y enlaces anteriores; reactivarla no restaura esas sesiones. La migración de esta funcionalidad cierra las sesiones antiguas una sola vez: los usuarios deben volver a entrar.

Los correos de recuperación son transaccionales y no dependen de la preferencia de avisos. Usan Sidekiq, el nombre y logotipo escolar y la misma configuración SMTP/Letter Opener. Staging conserva el envío deshabilitado. En producción, configurar `PORTAL_URL` con el origen HTTPS de la escuela y habilitar el correo antes de ofrecer recuperación a usuarios.

## Contactos y mensajería

Contactos familiares permite a administración y a la familia responsable gestionar contactos de emergencia y autorizados de recogida por expediente. Esta lista no concede acceso al portal ni constituye por sí sola una validación de tutela legal. La mensajería interna permite contactar a administración y a los docentes/familias/alumnos vinculados por una inscripción activa. Solo el destinatario puede confirmar lectura. Los correos opcionales avisan de una actualización sin copiar el contenido del mensaje.

## Staging

Copia `.env.staging.example` a `.env.staging` y configura contraseñas y un secreto independientes. Utiliza siempre el nombre de proyecto indicado para separar los volúmenes de desarrollo y producción. El correo de staging queda deshabilitado. Se requiere un proxy TLS frente al puerto 8180.

```bash
docker compose --project-name school-staging --env-file .env.staging -f compose.yml -f compose.staging.yml build
docker compose --project-name school-staging --env-file .env.staging -f compose.yml -f compose.staging.yml run --rm backend bundle exec rails db:prepare db:seed
docker compose --project-name school-staging --env-file .env.staging -f compose.yml -f compose.staging.yml up -d
```

## Hooks locales

Con Ruby y Bundler instalados, ejecuta `bundle install` desde la raíz y `bundle exec overcommit --install`. Revisa los hooks de `.git-hooks` y firma su versión con `bundle exec overcommit --sign`. PreCommit ejecuta RuboCop y compilación TypeScript/React; PrePush ejecuta `bin/quality`, incluida la suite de backend y frontend. Requieren Docker y el entorno preparado con `bin/setup`. CI sigue siendo la validación independiente de los hooks locales.

## Aula, avisos y correo

Aula virtual permite publicar tareas por clase, entregar texto desde el portal del alumno, registrar entregas tardías y revisar con calificación y retroalimentación. Una entrega revisada queda protegida; las notas de tareas no sustituyen las notas trimestrales. La integración con Google Classroom y los adjuntos de tareas siguen pendientes.

El centro de notificaciones usa Noticed y muestra avisos persistentes, contador de no leídos y enlaces al módulo. Perfil permite elegir si se reciben correos. Administración edita la plantilla de avisos; incluye nombre y logotipo de la escuela. En desarrollo, los correos se consultan en `http://localhost:3200/letter_opener` (o el puerto de `SCHOOL_BACKEND_PORT`). En producción se requiere configurar SMTP, `MAIL_FROM`, `PORTAL_URL` y `ENABLE_EMAIL_DELIVERY=true`; staging conserva el envío deshabilitado.

Sidekiq procesa las entregas mediante el servicio `worker`. Redis persiste su cola en `redis_data` con AOF, sin publicar su puerto al host. Los avisos se crean junto al registro de auditoría, y los trabajos esperan al cierre de la transacción. Esto no sustituye un respaldo ni promete entrega externa exactamente una vez.

## Revisión, publicación y corrección de calificaciones

Las nuevas notas se guardan como **Borrador**. Administración las marca como **Revisada** y después **Publicada** desde Calificaciones. Editar una nota revisada la devuelve a borrador y elimina la revisión anterior. Una nota publicada no puede sobrescribirse desde la captura ordinaria.

Las familias y alumnos solo ven notas publicadas, tanto en el listado como en Boleta e historial. No reciben avisos por borradores ni revisiones internas. Los docentes consultan en las boletas únicamente las materias que tienen asignadas.

Administración puede **Corregir** una nota publicada con motivo obligatorio. Se conservan valor y retroalimentación anteriores y nuevos, autor y fecha en un historial inmutable desde la aplicación. Las correcciones se permiten después del cierre, sin modificar automáticamente la decisión de promoción o egreso. El guardado rechaza pantallas desactualizadas; la actualización, el historial y la auditoría son una sola transacción. Las familias reciben el aviso de publicación o corrección, sin el motivo administrativo interno.

La migración conserva como publicadas las notas anteriores, que ya eran visibles antes de este flujo. Las notas nuevas requieren revisión y publicación antes de cerrar el ciclo.


### Solicitudes de corrección docente

Desde una nota publicada, **Solicitudes de corrección** permite al docente de la materia proponer nota, retroalimentación y motivo. Administración también puede solicitar cambios, pero otra persona administradora debe aprobarlos o rechazarlos con un motivo. El servidor impide resolver la propia solicitud. No se modifica la nota vigente mientras esté pendiente.

Solo se admite una solicitud pendiente por nota, con un índice único en PostgreSQL y bloqueo de la inscripción compartido con los otros cambios académicos. La aprobación comprueba la versión original y guarda nota, historial, resolución y auditoría en una transacción. Una solicitud desactualizada puede rechazarse y volver a capturarse; no sobrescribe una nota posterior. La corrección administrativa directa queda bloqueada mientras exista una solicitud pendiente. No cambia automáticamente la promoción o egreso.

Las solicitudes y sus motivos son internos: solo administración y el docente asignado pueden consultarlos. Noticed avisa a administración de solicitudes nuevas y al solicitante de su resolución. Familias y alumnos reciben el aviso habitual únicamente cuando la corrección se aprueba y cambia la nota publicada. Los roles configurables y permisos delegados continúan pendientes; la resolución utiliza por ahora el rol administrador existente.
