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

Abre **http://localhost:5173**. El script genera `.env` con contraseñas aleatorias; consulta `ADMIN_EMAIL` y `ADMIN_PASSWORD` en ese archivo. No se suben al repositorio.

Con `DEMO_SEEDS=true`, se crean datos ficticios y estos accesos, cuya contraseña es `DEMO_PASSWORD` de `.env`:

| Perfil | Correo |
| --- | --- |
| Familia | familia@school.test |
| Docente de 1A | docente@school.test |
| Alumno | alumno@school.test |

Las semillas son idempotentes: ejecutar `docker compose run --rm backend bundle exec rails db:seed` nuevamente conserva las cuentas, contraseñas y datos existentes. No usar datos demo en producción.

## Recorrido funcional

1. **Administración** configura nombre, CCT, teléfono, domicilio y logotipo PNG/JPG/WebP; el logotipo se muestra en los portales. Crea ciclos y ventanas de inscripción/reinscripción.
2. Registra grupos de **1.º a 6.º, A y B**, con cupo. Crea materias, cuentas docentes y clases por grupo/materia con carga semanal.
3. **Una familia** crea su cuenta, registra a sus hijos con CURP y envía solicitudes de nuevo ingreso a primero. Obtiene un folio y consulta el estado y motivo de rechazo, si existe.
4. Administración aprueba y asigna grupo. Solicitud e inscripción se guardan en una transacción, con control de cupo y de duplicados. El expediente del aspirante se convierte en matrícula sin crear otra persona.
5. Administración crea un acceso de alumno y lo vincula al expediente desde **Usuarios**. El alumno solo consulta su información; las familias ven a todos sus hijos.
6. Genera el horario del grupo o agrega sesiones manualmente. Se comprueban conflictos de docente, grupo y aula. La generación es atómica; si la carga no cabe, no deja un horario incompleto.
7. Docentes registran y corrigen asistencia diaria y notas de tres trimestres; solo pueden calificar sus clases. Las familias y alumnos consultan su horario, asistencia, notas y retroalimentación.
8. **Expedientes → Boleta e historial** muestra el historial por ciclo y permite imprimir/guardar como PDF desde el navegador. Es una boleta de consulta, no un certificado oficial.
9. Administración cierra cada inscripción con promoción, repetición o egreso de sexto, exigiendo calificaciones de las materias en los tres trimestres. La siguiente solicitud solo acepta el grado que corresponda al resultado anterior.
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

Esta entrega implementa el circuito académico descrito. No se presenta como un producto terminado para cualquier escuela: todavía no incluye integración SEP/SIGED, boletas oficiales firmadas, pagos, biblioteca, transporte, tareas/entregas, recuperación de contraseña por correo ni notificaciones externas. El calendario registra exámenes; no es un motor para resolver exámenes en línea.

El generador usa asignación determinista de bloques, no un optimizador con preferencias individuales. La repetición/promoción es una decisión administrativa explícita; no se presume una normativa oficial a partir del promedio. La alerta de faltas es un indicador operativo, no una evaluación psicológica ni una predicción de desempeño.
