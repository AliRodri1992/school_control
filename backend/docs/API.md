# API de School Control

La aplicación utiliza API Rails con sesiones basadas en cookies, protección CSRF y permisos RBAC por acción. El archivo fuente del contrato inicial es [openapi/v1.json](../openapi/v1.json). Una sesión autenticada permite consultar el mismo JSON en **GET /api/docs**.

El archivo documenta las rutas existentes, sus métodos, los permisos nominales y los errores básicos. Los cuerpos de algunos endpoints aún figuran como esquemas abiertos, pendientes de completarse por operación con ejemplos y pruebas de contrato. No exponer credenciales reales en documentación ni introducir endpoints especulativos.

Las operaciones de escritura requieren el token **X-CSRF-Token** recuperado con **GET /api/session** y una cookie de sesión válida.

Se recomienda abrir el contrato con una interfaz local Swagger UI o Redoc cuando se incorpore el visor, sin CDN. La futura nomenclatura **/api/v1** deberá introducirse sin romper las rutas /api ya utilizadas por React.
