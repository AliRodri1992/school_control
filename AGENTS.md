# AGENTS.md — Aula / School Control (school_control)

Estas instrucciones se aplican a todo este repositorio y a cualquier agente de IA que modifique su código.

## Contexto y límites
- Proyecto: control escolar de primaria con portales de administración, docentes, familias y alumnos.
- Stack: Rails 8.1, PostgreSQL 17, Redis, React 19, TypeScript, Vite, Docker Compose, RSpec, Vitest, RuboCop, Brakeman y Overcommit.
- Rama autorizada de trabajo actual: `feature/smart-dashboard`. **No modificar `main`** sin instrucción expresa.
- Mantener experiencias mobile-first, identidad visual, accesibilidad, traducciones y permisos por rol. No sustituir las pantallas completas por modales para expedientes extensos.
- Mantener aislamiento de puertos de Docker respecto a Delta POS y preservar datos de los volúmenes existentes.
- El dashboard inteligente utiliza widgets, rejilla y persistencia de distribución; conservar esa funcionalidad al modificarla.

## Política de commits
- No existe un número mínimo de archivos por commit. Se permiten commits de uno o varios archivos cuando los cambios sean legítimos y estén relacionados.
- Mantener commits pequeños, coherentes y revisables, sin modificaciones artificiales para aumentar el número de archivos.
- Antes de confirmar, revisar `git status` y `git diff --cached`, y ejecutar las verificaciones aplicables.
- Antes de publicar, ejecutar los tests y analizadores aplicables. Tras publicar, consultar GitHub Actions y corregir fallos; nunca afirmar que todo pasó sin resultados comprobados.
- Si existe un cambio de rama concurrente, no sobrescribir trabajo de otros agentes. Nunca forzar `push` sobre una rama compartida.

## Instalación/verificación local de hooks
Overcommit mantiene las verificaciones de calidad y seguridad. Para instalarlo o renovar su firma, ejecutar `bundle exec overcommit --install` y `bundle exec overcommit --sign` desde la raíz del repositorio. No existe un hook de cantidad mínima de archivos.

## Seguridad y calidad
- No guardar claves, tokens ni datos personales en Git; revisar diffs y archivos generados.
- Conservar convenciones existentes, permisos/autorización, pruebas, accesibilidad, estilos e internacionalización.
- Si un comando no pudo ejecutarse por limitaciones del entorno, informar qué falta verificar, sin declarar éxito ficticio.

## Verificaciones específicas del proyecto
- Backend: `docker compose exec backend bundle exec rspec`, `docker compose exec backend bundle exec rubocop` y `docker compose exec backend bundle exec brakeman --no-pager`.
- Frontend: `docker compose exec frontend npm test` y `docker compose exec frontend npm run build` cuando sea pertinente; usar `./bin/quality` para validación integral si está disponible.
- Verificar los trabajos de GitHub Actions de `feature/smart-dashboard` antes de declarar un cambio completo.
