# Identidad de contactos familiares

Los formularios de alta y edición capturan **primer nombre, segundo nombre (opcional), apellido paterno, apellido materno (opcional) y CURP**. El nombre visible se compone en el modelo.

La CURP se valida estructuralmente (18 caracteres, entidad, fecha calendario, dígito verificador). Del código se derivan internamente fecha de nacimiento y sexo **codificado en la CURP** (H/M); no implica verificación de identidad ante RENAPO ni identidad de género autopercibida. La API no permite asignar fecha de nacimiento ni sexo; tampoco los incluye en las respuestas del endpoint de contactos familiares.

Migración aditiva: backend/db/migrate/20261031070000_extend_family_contact_identity.rb. Ejecutar `bundle exec rails db:migrate` en el backend o el comando equivalente en Docker. **No hay que borrar la base de datos.** Para los contactos antiguos se conserva `name` sin inventar división de apellidos ni CURP: al editarlos se pide completar los campos.

Semillas: con `DEMO_SEEDS=true` en entorno de desarrollo, backend/db/demo_bulk.rb genera contactos familiares con nombres plausibles y **CURP sintéticas, no emitidas ni verificadas por RENAPO**. Las fechas y el marcador de sexo almacenados proceden exclusivamente del código. No usar estos datos de ejemplo como identidad real.

## Comprobación de persistencia y actualización local

El formulario de Contactos familiares utiliza:
1. GET /api/student_contacts/:id al abrir edición: lee las cuatro partes del nombre desde la base de datos.
2. PATCH /api/student_contacts/:id al guardar.
3. Un segundo GET para confirmar que el servidor conservó first_name, middle_name, paternal_surname, maternal_surname y curp y generó name. Ante un desacuerdo, el formulario no se cierra ni muestra éxito.

El nombre completo se calcula en el modelo y en la vista previa de la interfaz; solo incluye los componentes que se capturaron (sin espacios dobles). Los registros anteriores mantienen el nombre original hasta que se complete su estructura, sin inventar apellidos.

Desde la raíz de school_control, en la rama feature/smart-dashboard, en una instalación existente:

    git pull --ff-only origin feature/smart-dashboard
    docker compose up -d --build --force-recreate backend frontend worker
    docker compose exec backend bundle exec rails db:migrate

Verificación sin divulgar ningún dato personal:

    docker compose exec backend bundle exec rails runner 'abort "Migración de contactos pendiente" unless %w[first_name middle_name paternal_surname maternal_surname curp birth_date sex].all? { |column| StudentContact.column_names.include?(column) }; puts "Columnas de identidad instaladas"'

No es necesario borrar la base de datos. Si el backend no tiene la versión nueva o la migración está pendiente, la interfaz mostrará un error en lugar de presentar como guardados campos ignorados.
