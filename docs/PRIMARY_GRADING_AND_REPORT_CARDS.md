# Evaluación, acreditación y boletas de primaria — School Control

Alcance: educación primaria, ramas `feature/smart-dashboard`. Referencia normativa federal: Acuerdo 10/09/23, https://sidof.segob.gob.mx/notas/docFuente/5703099. El PDF emitido por esta aplicación es **de consulta escolar** y no sustituye la boleta electrónica certificada por la autoridad educativa.

## Reglas y cierre

- Tres trimestres × cuatro campos formativos = 12 calificaciones oficiales publicadas por inscripción. Las calificaciones trimestrales son **enteras**: 6–10 en primero y segundo, 5–10 en tercero a sexto. Los instrumentos internos admiten decimales.
- Los promedios por campo solo existen cuando sus tres calificaciones se publican. El promedio general del grado solo existe cuando los cuatro campos están completos. La ausencia de captura es `null`, nunca cero.
- Las reglas de cálculo y su referencia se guardan en el ciclo escolar: `grading_rule_version`, `average_decimal_mode` (`truncate`/`round_half_up`) y `grading_rule_reference`. El valor predeterminado usa truncamiento, **no implica que la SEP haya fijado universalmente ese método**; la autoridad escolar debe comprobarlo y configurar la disposición aplicable. Una vez registradas evaluaciones no se permite cambiar esa versión mediante edición ordinaria.
- La acreditación automática es **propuesta**, no autorización. En primero se propone acreditar el grado cursado. En segundo a sexto se revisan los promedios finales de los cuatro campos. El cierre exige las 12 valoraciones publicadas y registra responsable, fecha, resultado y motivo de cualquier excepción. Las calificaciones internas por materia, si existen, mantienen sus requisitos de publicación.
- El promedio de seis grados se presenta únicamente con los seis ciclos completos, sin duplicación de grado.
- Correcciones a evaluaciones publicadas: API autorizada `POST /api/formative_evaluations/:id/correct` exige motivo de 10–2000 caracteres y `lock_version`; registra auditoría. Los resultados se recalculan al consultar.
- Para un traslado se registra origen `transfer`, escuela y referencia documental de la evaluación; no se inventan trimestres faltantes.

## Evidencias internas

`FormativeEvidence` almacena proyectos, tareas, exámenes, actividades, observaciones y rúbricas con su peso por alumno/campo/trimestre. El promedio ponderado es **solo orientativo** y se muestra cuando la suma de pesos es exactamente 100%. No actualiza automáticamente una calificación oficial. API `/api/formative_evidences` con permisos existentes de calificaciones; cambios auditados.

## Emisión y consulta de boletas

`POST /api/students/:id/issue_report_card` (institucional, inscripción y trimestre o 0 para final) crea PDF de consulta con fotografía inmutable en `PrimaryReportCardIssue`, versión sucesiva, SHA-256 y Active Storage. La boleta final exige las doce evaluaciones publicadas. Una emisión posterior crea una versión nueva y no sustituye la anterior.

`GET /api/students/:id/report_card_issues` consulta las emisiones autorizadas; `GET /api/students/:id/report_cards/:issue_id/download` descarga una versión previamente emitida. `POST /api/students/:id/report_cards/:issue_id/acknowledge` registra el acuse del tutor vinculado sin modificar acreditación ni promoción.

La boleta contiene identificadores escolares, CCT, alumno, CURP, grado, ciclo, tres periodos por campo, promedios finales disponibles, observaciones, asistencias informativas y resultado administrativo separado de la propuesta. No afirma autorización SEP.

## Actualización y comprobación

```bash
git checkout feature/smart-dashboard
git pull --ff-only origin feature/smart-dashboard
docker compose up -d --build --force-recreate backend frontend worker
docker compose exec backend bundle exec rails db:migrate
docker compose exec backend bundle exec rspec spec/services/primary_school_grading_spec.rb spec/requests/primary_report_cards_spec.rb spec/models/formative_evidence_spec.rb
```

No borrar la base de datos. Verificar la autoridad educativa local antes de usar documentos para decisiones oficiales.

## Boleta visual basada en SEP (DGAIR primaria 2025-2026)

Referencia oficial utilizada para la presentación: https://dgair.sep.gob.mx/storage/recursos/CE/primaria_autografas_26.pdf (firma autógrafa), y https://dgair.sep.gob.mx/storage/recursos/CE/primaria_electronicas_26.pdf (firma electrónica). A fecha 2026-10-31 no se comprobó una publicación DGAIR de diseños 2026-2027. La versión visual de la aplicación se mantiene explícitamente identificada como **formato referencial** de 2025-2026; no supone vigencia ni aprobación para otro ciclo.

`POST /api/students/:id/issue_report_card` recibe `layout: "school"` (predeterminado) o `layout: "sep_reference"`. La variante SEP muestra horizontalmente tabla de cuatro campos × tres trimestres y final, nombre, CURP, CCT, grupo, turno, lengua indígena, asistencia, promedio, folio pendiente, observaciones por periodo y espacios para firmas. En primer grado **no** presenta los apartados de promovida/no promovida; de segundo a sexto sí, marcados solo a partir del resultado de cierre autorizado. La versión visual, campos institucionales y PDF íntegro quedan congelados en el snapshot y SHA-256 al emitir.

Los campos opcionales `federal_entity`, `shift`, `director_name`, `indigenous_language`, `issue_place` se registran en **Mi escuela**, y nunca se inventan cuando faltan. No se falsifican escudos ni logotipos oficiales, QR de validación, sellos, firma electrónica ni folios de la SEP. Las líneas de firma permanecen como espacios para sus firmas reales; el documento siempre dice **SIN VALIDEZ OFICIAL**. El objetivo es permitir la revisión visual y operativa antes de integrar la expedición a una plataforma oficial autorizada.
