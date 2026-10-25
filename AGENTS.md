# AGENTS.md — Aula / School Control (school_control)

Estas instrucciones se aplican a todo este repositorio y a cualquier agente de IA que modifique su código.

## Contexto y límites
- Proyecto: control escolar de primaria con portales de administración, docentes, familias y alumnos.
- Stack: Rails 8.1, PostgreSQL 17, Redis, React 19, TypeScript, Vite, Docker Compose, RSpec, Vitest, RuboCop, Brakeman y Overcommit.
- Rama autorizada de trabajo actual: `feature/smart-dashboard`. **No modificar `main`** sin instrucción expresa.
- Mantener experiencias mobile-first, identidad visual, accesibilidad, traducciones y permisos por rol. No sustituir las pantallas completas por modales para expedientes extensos.
- Mantener aislamiento de puertos de Docker respecto a Delta POS y preservar datos de los volúmenes existentes.
- El dashboard inteligente utiliza widgets, rejilla y persistencia de distribución; conservar esa funcionalidad al modificarla.

## Política obligatoria de commits para agentes de IA
- **Cada commit creado por el agente debe modificar al menos 5 archivos distintos** con cambios reales, necesarios y vinculados a un objetivo técnico coherente.
- Nunca realizar commits con 1, 2, 3 o 4 archivos salvo **autorización explícita del usuario** para una excepción.
- Si una tarea legítima modifica menos de 5 archivos, **conservar los cambios sin confirmar** y continuar únicamente con tareas relacionadas antes de agruparlos. Comunicar el bloqueo si no existen cambios adicionales justificados.
- No cambiar archivos arbitrarios, generar archivos vacíos ni incluir retoques cosméticos para llegar a cinco.
- No confundir archivos cambiados con líneas: cuentan rutas de archivo diferentes, incluidas altas, cambios, renombres y bajas.
- Commits coherentes y revisables: no unir funcionalidades independientes solo por cumplir un número.
- Antes de confirmar, revisar `git status`, `git diff --cached` y ejecutar `bash bin/check-commit-min-files --staged`. El hook `MinimumCommitFiles` de Overcommit automatiza la verificación en el equipo local.
- Antes de publicar, ejecutar los tests y analizadores aplicables. Tras publicar, consultar GitHub Actions y corregir fallos; nunca afirmar que todo pasó sin resultados comprobados.
- GitHub Actions ejecuta `.github/workflows/commit-policy.yml` para verificar commits nuevos; los commits de fusión se exceptúan de esta comprobación de tamaño, no de las demás pruebas.
- Es posible eludir hooks locales con comandos especiales; eso **no concede autorización** para hacer commits pequeños.
- Si existe un cambio de rama concurrente, no sobrescribir trabajo de otros agentes. Nunca forzar `push` sobre una rama compartida.

## Instalación/verificación local del hook
Tras obtener esta configuración o cuando Overcommit lo solicite, ejecutar `bundle exec overcommit --install` y `bundle exec overcommit --sign` desde la raíz del repositorio. La verificación manual es `bash bin/check-commit-min-files --staged`; las pruebas aisladas del verificador son `bash test/commit_min_files_test.sh`.

## Seguridad y calidad
- No guardar claves, tokens ni datos personales en Git; revisar diffs y archivos generados.
- Conservar convenciones existentes, permisos/autorización, pruebas, accesibilidad, estilos e internacionalización.
- Si un comando no pudo ejecutarse por limitaciones del entorno, informar qué falta verificar, sin declarar éxito ficticio.

## Verificaciones específicas del proyecto
- Backend: `docker compose exec backend bundle exec rspec`, `docker compose exec backend bundle exec rubocop` y `docker compose exec backend bundle exec brakeman --no-pager`.
- Frontend: `docker compose exec frontend npm test` y `docker compose exec frontend npm run build` cuando sea pertinente; usar `./bin/quality` para validación integral si está disponible.
- Verificar los trabajos de GitHub Actions de `feature/smart-dashboard` antes de declarar un cambio completo.
