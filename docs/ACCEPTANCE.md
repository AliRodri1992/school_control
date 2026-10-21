# Verificación manual

Ejecutar después de `bin/setup`, además de las pruebas de CI.

- Entrar como administrador, cambiar nombre y logotipo; recargar y comprobar persistencia.
- Abrir Ciclos escolares y cerrar temporalmente la inscripción; comprobar que el servidor rechace solicitudes fuera de fecha.
- Crear familia desde registro público, registrar hijo y solicitar primero.
- Aprobar desde administración asignando 1A; verificar matrícula y boleta en portal familiar.
- Intentar aprobar por segunda vez, llenar un grupo e intentar exceder cupo.
- Crear cuenta de alumno vinculada al expediente y comprobar que no muestre otros alumnos.
- Como docente de 1A, capturar asistencia y calificación; intentar acceder a datos de un grupo ajeno desde la API.
- Agregar sesiones que coincidan en docente o aula; verificar rechazo sin escrituras parciales.
- Crear exámenes por grupo y comunicados por audiencia; verificar visibilidad en los portales.
- Registrar tres trimestres de todas las clases, cerrar ciclo con promoción y solicitar el grado siguiente en el ciclo nuevo.
- Probar teléfono móvil: menú, formularios y consulta de tablas.
- Imprimir la boleta de consulta y comprobar el historial de ciclos.
- Ejecutar dos veces las semillas y verificar que no crezca el número de registros.
