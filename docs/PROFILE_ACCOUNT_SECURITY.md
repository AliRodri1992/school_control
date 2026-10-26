# Perfil, identidad y seguridad de cuenta

## Alcance

School Control almacena la fotografía de perfil mediante Active Storage. Solo admite
PNG, JPG y WebP (máximo 2 MB), comprueba el tipo real del archivo con Marcel,
sirve el contenido únicamente a la cuenta autenticada y prohíbe caché pública.
El teléfono personal usa el modelo polimórfico PhoneNumber con formato E.164.

Los cambios de correo no se aplican en el formulario básico: requieren la
contraseña actual y la confirmación del enlace firmado enviado a la nueva dirección.
El enlace vence en 15 minutos, comprueba la identidad del usuario y su versión de
sesión, y una confirmación correcta invalida las sesiones anteriores. Las pruebas
no deben depender de entregas de correo reales; use el adaptador Active Job de test.
En entornos de entrega, configure PORTAL_URL, MAIL_FROM y el proveedor de correo.

## Sesiones por dispositivo

La sesión web usa dos identificadores: session_version para invalidación global
y un token aleatorio en la cookie cuyo hash SHA-256 se almacena en user_login_sessions.
No se almacena el token sin cifrar en base de datos. Revocar un dispositivo
marca exclusivamente ese token; revocar todas las sesiones incrementa
session_version y marca todos los tokens como revocados. La lista muestra
únicamente los dispositivos de la cuenta autenticada y su última actividad.
Revocar requiere la contraseña actual y la petición está protegida por CSRF.

**Importante tras este despliegue:** las cookies de sesiones emitidas antes de
la migración no tienen el identificador de dispositivo y deberán iniciar sesión
de nuevo. No elimine los volúmenes de Docker para aplicar la migración.

## Segundo factor TOTP

La activación requiere la contraseña actual, una clave individual creada con
SecureRandom y la confirmación de un TOTP de seis dígitos (RFC 6238, SHA-1,
intervalos de 30 segundos). La clave se almacena cifrada y nunca se incluye
en la respuesta de estado una vez activada. Los pasos usados no se pueden
reutilizar. Se generan ocho códigos de recuperación con hashes vinculados
al secreto del servidor; se revelan una sola vez y cada código se consume.

Un usuario con TOTP activo obtiene una sesión provisional tras comprobar su
contraseña; no puede acceder a expedientes o perfil hasta completar el
segundo factor mediante POST /api/session/verify_otp. El reto provisional
vence después de cinco minutos y está sujeto a un límite de intentos.
La desactivación exige contraseña y código autenticador o de recuperación
válido, y revoca las sesiones.

## Preferencias y límites

El interruptor principal de correo sigue en User.email_notifications; las
categorías por actividad escolar se almacenan en UserPreference y filtrarán
los eventos por tipo. La página de Preferencias continúa siendo responsable
del idioma, apariencia, densidad de tablas y ajustes generales del portal.

El panel de perfil no permite modificar datos académicos, roles, relaciones
familiares ni permisos. Esa información procede de los módulos autorizados.

## Validación

Ejecutar en CI:
- request specs de profile_extended, profile_email_change, profile_devices,
  account_security y two_factor;
- tests frontend de Profile, ProfileDevices, ProfileTwoFactor,
  ProfileEmailChange, ProfileNotificationSettings y Login;
- suite completa RSpec, RuboCop, compilación TypeScript y pruebas de contenedor.
No declarar el flujo validado sin las verificaciones correspondientes.
