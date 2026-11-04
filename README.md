# MisAhorros

Aplicación de finanzas personales para registrar ingresos y gastos, consultar movimientos y administrar metas de ahorro. La interfaz está construida con React, TypeScript, Vite y Tailwind CSS 4; Supabase gestiona autenticación y datos, y Capacitor empaqueta la app para Android.

La app incluye ajustes de perfil (moneda y temas Light Purple/Dark Purple, con Light Purple como predeterminado), cambio de contraseña, privacidad visual de importes, preferencias de accesibilidad y proyecciones lineales de saldo basadas en los últimos tres meses completos. También permite administrar categorías, definir presupuestos mensuales por categoría y filtrar movimientos por texto, tipo, categoría y fechas inclusivas. En Inicio se puede tocar el saldo en USD para ver una equivalencia visual en bolívares con la tasa oficial del día; esto no modifica el saldo guardado. Las proyecciones también son orientativas y no constituyen asesoría financiera.

## Requisitos

- Node.js y npm
- Un proyecto Supabase configurado con las tablas, funciones y políticas que utiliza la app

## Configuración

Define estas variables en un archivo `.env` local:

```env
VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_SUPABASE_ANON_KEY=tu-clave-publica
```

No uses una clave `service_role` en la aplicación cliente.

## Desarrollo

```sh
npm install
npm run dev
```

## Validación y compilación

```sh
npm run lint
npm run build
```

`npm run build` ejecuta la comprobación de TypeScript y genera los recursos web en `dist/`.

## Migraciones de Supabase

Las migraciones versionadas están en `supabase/migrations/`. `20261104103000_atomic_financial_operations.sql` mueve las operaciones de saldo, movimientos y aportes a funciones transaccionales de PostgreSQL y limita las escrituras directas sobre esos datos. `20261104120000_profile_preferences_and_spending_validation.sql` valida gastos contra el saldo y permite actualizar la preferencia de moneda mediante una función segura. `20261104130000_monthly_budgets.sql` crea presupuestos por categoría y mes con restricciones de importe, propiedad, categoría de gasto y políticas RLS.

Revisa y aplica las migraciones, en orden, primero en un proyecto Supabase de prueba mediante el SQL Editor o Supabase CLI. No se aplican automáticamente al ejecutar la app. Antes de producción, confirma que las políticas y los nombres de las tablas coinciden con el proyecto de destino.

El widget de tasa consulta la API pública de [DolarAPI para Venezuela](https://dolarapi.com/docs/venezuela/) y presenta su cotización marcada como `oficial`. No requiere una función de Supabase ni una clave, y se usa solo para consulta/conversión externa: no modifica saldos, metas ni movimientos. Es un servicio externo de terceros; si deja de responder, el resto de la app sigue funcionando.

## Android

El proyecto incluye la plataforma Android de Capacitor. Después de compilar la app web, sincroniza los recursos con el proyecto nativo usando `npx cap sync android`.

En Android, habilita **Acceso rápido** desde Perfil y ajustes. **Salir y bloquear con huella** cierra el acceso actual, conserva la sesión cifrada y permite volver a entrar con biometría. **Cerrar sesión y quitar acceso rápido** elimina la sesión y el perfil biométrico del dispositivo. Las preferencias de tema, privacidad y accesibilidad también se guardan en el almacenamiento seguro del dispositivo.

### Descargar una APK de prueba

El workflow **Build Android APK** genera una APK debug instalable y la publica en GitHub Releases:

1. En **Settings → Secrets and variables → Actions**, agrega los secretos `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY` con la URL del proyecto Supabase y su clave pública `anon`/publishable. No agregues una clave `service_role`.
2. Abre **Actions → Build Android APK → Run workflow** y elige una etiqueta de release nueva (por ejemplo, `v1.0.9`).
3. Al finalizar la ejecución, descarga la APK desde **Releases**. También queda disponible como el artefacto `misahorros-debug-apk` durante 30 días.

Esta APK está firmada con la clave debug de Android y es solo para pruebas; no debe distribuirse como versión de producción.
