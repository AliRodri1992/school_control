# Identidad de contactos familiares

Los formularios de alta y edición capturan **primer nombre, segundo nombre (opcional), apellido paterno, apellido materno (opcional) y CURP**. El nombre visible se compone en el modelo.

La CURP se valida estructuralmente (18 caracteres, entidad, fecha calendario, dígito verificador). Del código se derivan internamente fecha de nacimiento y sexo **codificado en la CURP** (H/M); no implica verificación de identidad ante RENAPO ni identidad de género autopercibida. La API no permite asignar fecha de nacimiento ni sexo; tampoco los incluye en las respuestas del endpoint de contactos familiares.

Migración aditiva: backend/db/migrate/20261031070000_extend_family_contact_identity.rb. Ejecutar `bundle exec rails db:migrate` en el backend o el comando equivalente en Docker. **No hay que borrar la base de datos.** Para los contactos antiguos se conserva `name` sin inventar división de apellidos ni CURP: al editarlos se pide completar los campos.

Semillas: con `DEMO_SEEDS=true` en entorno de desarrollo, backend/db/demo_bulk.rb genera contactos familiares con nombres plausibles y **CURP sintéticas, no emitidas ni verificadas por RENAPO**. Las fechas y el marcador de sexo almacenados proceden exclusivamente del código. No usar estos datos de ejemplo como identidad real.
