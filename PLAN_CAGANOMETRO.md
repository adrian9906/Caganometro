# Plan de Desarrollo - Caganometro

## Stack recomendado

### Cliente

- React + Vite + TypeScript
- Phaser 3 para el loop de juego 2D, movimiento, animacion y render pixel art
- CSS custom para la interfaz retro inspirada en `stitch_cagan_metro_pixel_evolution`

### Servidor

- Node.js + Express 5 + TypeScript
- JWT para sesion
- bcrypt para contrasenas

### Persistencia

- Estado actual: Prisma con PostgreSQL alojado en Neon
- El antiguo JSON se conserva solo como fuente de migracion y respaldo historico

## Por que este stack

- `Phaser 3` es el mejor encaje para un personaje humano 2D pixel art que camina, se anima y reacciona en tiempo real.
- `React` te resuelve formularios, paneles, ranking, perfil y HUD sin pelearte con UI manual.
- `Express` es suficiente para auth, ranking y acciones del juego sin sobrecargar el proyecto.
- `Prisma + PostgreSQL` ofrece un leaderboard durable y una base preparada para crecer.

## Estado actual

### Ya implementado

- Estructura monorepo con `apps/client` y `apps/server`
- UI retro pixel art con la direccion visual mint + cocoa del material base
- Creacion de usuario con:
  - nombre
  - edad
  - estatura
  - color de pelo
  - color de piel
  - contrasena
- Login por nombre y contrasena
- Escena Phaser con personaje humano 2D en pixel art
- Boton `IR AL BANO`
- Animacion de ir al bano y volver
- Logica de evolucion por caca:
  - sube `totalCacas`
  - sube `tamano`
  - sube `fuerza`
  - oscurece el color actual
  - si llega a negro casi total, reinicia a blanco claro
- Ranking mundial con medallas:
  - oro
  - plata
  - bronce

### Validado

- TypeScript del cliente y servidor
- Build del cliente
- Arranque del backend
- Flujo real:
  - registro
  - login
  - poop action
  - leaderboard update

## Fases siguientes

### Fase 1 - Cerrar MVP jugable

1. Conectar la UI de perfil con el estado real del jugador.
2. Añadir mejor feedback visual:
   - barras segmentadas de fuerza
   - nivel visual de tamano
   - mensaje de posicion actual
3. Bloquear spam con cooldown real de bano.
4. Mostrar top 10 y posicion del jugador aunque no este en top 10.

### Fase 2 - Mejorar el personaje pixel art

1. Sustituir el personaje geometrico por spritesheets pixel art hechos a mano.
2. Crear animaciones:
   - idle
   - walk
   - sit
   - celebrate
3. Variaciones reales de pelo y tonos de piel en sprites.
4. Agregar direccion corporal mas humana:
   - brazos
   - piernas
   - cabeza
   - sombra

### Fase 3 - Persistencia final de base de datos

1. [x] Activar Prisma con PostgreSQL en Neon.
2. [x] Crear tablas de cuentas, personajes e historial.
3. [x] Aplicar la migracion inicial.
4. [x] Importar los datos existentes del JSON sin sobrescribir datos remotos.
5. [x] Comprobar la conexion desde el endpoint de salud y desde CLI.

### Fase 4 - Producto real

1. Perfil de jugador con historial.
2. Ranking paginado o global.
3. Logros:
   - primeras 10 cacas
   - fuerza maxima
   - top 3
4. Sonidos retro.
5. Efectos de particulas pixel.
6. Guardado de sesion automatico.

## Orden recomendado de trabajo

1. Mantener el stack actual.
2. Mejorar el arte del personaje y sus animaciones.
3. Pasar la persistencia de JSON a Prisma + SQLite.
4. Cambiar a PostgreSQL cuando ya se vaya a desplegar.

## Nota tecnica importante

El modelo Prisma ya esta preparado en `apps/server/prisma/schema.prisma`, pero por un problema del entorno local con dependencias de Prisma no se pudo dejar operativo en esta sesion. El juego funciona ahora mismo con almacenamiento JSON local para no frenar el desarrollo.
