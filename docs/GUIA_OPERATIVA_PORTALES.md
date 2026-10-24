# Guía operativa por portal

Las rutas de acceso son /admin, /teachers, /students y /tutors. El sistema determina el portal por la sesión autenticada y autoriza cada recurso en la API; modificar una URL nunca otorga privilegios nuevos.

## Administrativo

1. En Mi escuela, registra el nombre y logotipo.
2. En Ciclos escolares, registra las fechas de clases, inscripción y reinscripción.
3. En Materias, agrega una clave y nombre para cada materia.
4. En Ciclos escolares y Grupos, crea grados de primero a sexto, secciones A/B y cupos.
5. En Usuarios, registra docentes y tutores. También puedes importar cuentas con contraseña aleatoria y enlace de recuperación.
6. En Clases, asigna docente, materia y grupo; después configura horarios.
7. En Alumnos, captura CURP, nombre, nacimiento y tutor. En Ver expediente administra contactos, teléfonos, direcciones y notas.
8. En Admisiones, revisa folios y aprueba asignando un grupo o rechaza con un motivo.
9. En Calificaciones, revisa los borradores y publica cuando corresponda.
10. En Plantillas de correo, modifica el contenido y comprueba la vista previa.

## Docentes

Consulta clases y grupos asignados; pasa lista con las opciones presentes, faltas, retardos y justificadas. Captura notas trimestrales como borradores y revisa actividades del aula virtual.

## Padres y tutores

Utiliza el selector de hijo en el encabezado para consultar cada expediente autorizado. Presenta solicitudes de inscripción y reinscripción, entrega documentos y consulta calificaciones publicadas y asistencia.

## Alumnos

Consulta horario, tareas, calendario y calificaciones publicadas. Los alumnos no pueden modificar autorizaciones ni publicar evaluaciones.

## Importaciones

1. Selecciona alumnos, docentes, tutores, materias, grupos o calificaciones.
2. Adjunta un archivo CSV o XLSX de hasta 5 MB y 5,000 filas; utiliza encabezados únicos.
3. Relaciona cada encabezado con el campo de la base de datos. Puedes guardar una plantilla de mapeo propia.
4. Valida y corrige las filas con errores antes de confirmar.
5. Ejecuta la carga. El sistema registra cada fila procesada para permitir reintentos sin duplicar lo ya importado dentro del mismo lote.
6. Las calificaciones importadas permanecen en borrador hasta su revisión y publicación.

## Backfill no destructivo

Haz una copia de seguridad, aplica migraciones y ejecuta en el backend Rails el comando:

    bundle exec rake school:backfill_polymorphic

No borres las tablas heredadas sin comprobar los registros migrados y los teléfonos pendientes de normalización.

## Soporte y seguridad

La Ayuda del menú del avatar ofrece instrucciones por portal y muestra únicamente módulos permitidos. Los controles de acceso de Rails, RBAC y Pundit prevalecen sobre cualquier filtro del frontend.