# Semillas y ciclo de vida académico

El conjunto de demostración se crea solo con `DEMO_SEEDS=true` en `RAILS_ENV=development`. Las fechas son ficticias, incluso los eventos de vacaciones, suspensión y consejo técnico: **no se importan ni certifican calendarios SEP**.

## Al reconstruir desde cero

```sh
git switch feature/smart-dashboard
git pull --ff-only origin feature/smart-dashboard
docker compose stop backend worker
docker compose run --rm backend bundle exec rails db:drop db:create db:migrate db:seed
docker compose up -d --build
docker compose exec backend bundle exec rails runner bin/verify_demo_seeds.rb
```

**Advertencia:** `db:drop` destruye todos los registros de desarrollo. No ejecutar en producción y no usar `docker compose down -v` por accidente.

## Escenarios sembrados

- Ciclo actual (agosto a julio): 3 trimestres, fechas de captura/revisión/entrega, cierre administrativo y archivo configurados. Avanza por `AcademicYearLifecycle` si la fecha actual lo permite. No se simula artificialmente un ciclo activo durante el receso anterior al inicio.
- Ciclo siguiente: `En preparación`, 3 trimestres completos, ventanas de convocatoria anteriores al inicio, y una solicitud de primer ingreso en **borrador**. No se activa por tener solicitudes abiertas.
- Ciclos de años anteriores: un ciclo por año, sin duplicar el usado para la reinscripción, con grupos, 10 materias, 3 calificaciones por materia y 12 evaluaciones publicadas por alumno. Las calificaciones trimestrales por campo formativo son enteras (6–10 en 1.º y 2.º, 5–10 en 3.º–6.º).
- Ciclo archivado de muestra: transiciones reales y auditadas por el servicio, sin manipulación directa de `status`.
- Calendario ficticio: suspensión, CTE y vacaciones señaladas; no se genera asistencia en esas fechas.
- Se mantienen los 12 grupos, mínimo 10 alumnos por grupo, docentes, contactos, historial y restantes módulos de demostración.

**Idempotencia:** volver a ejecutar `db:seed` no duplica ciclos, solicitudes ni transiciones, no modifica calificaciones publicadas y no escribe nuevamente las filas académicas históricas existentes.

## Verificación

`bin/verify_demo_seeds.rb` comprueba estados, trimestres, historial de transiciones, permisos temporales de inscripción, cifras mínimas, asistencia y evaluaciones. Si faltan requisitos del cierre, el ciclo permanece en `En cierre` en lugar de forzar `Cerrado`.
