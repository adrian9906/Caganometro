# Caganometro

Juego web 2D pixel art con una estetica retro brutalista. El jugador crea su personaje, lo manda al bano con una animacion en tiempo real y compite en un ranking global.

## Stack recomendado

- Frontend: React + Vite + Phaser 3 + TypeScript
- Backend: Node.js + Express 5 + TypeScript
- Base de datos: Prisma ORM con SQLite en desarrollo y PostgreSQL en produccion
- Autenticacion: JWT + bcrypt

## Estructura

- `apps/client`: interfaz React y escena Phaser
- `apps/server`: API Express, Prisma y logica de juego
- `stitch_cagan_metro_pixel_evolution`: referencia visual original

## Arranque rapido

1. `pnpm install`
2. `Copy-Item apps/server/.env.example apps/server/.env`
3. `pnpm db:generate`
4. `pnpm db:migrate`
5. `pnpm dev`

Cliente: `http://localhost:5173`

API: `http://localhost:3000`

## Flujo del juego

1. Crear personaje con nombre, edad, estatura, pelo y color de piel.
2. Iniciar sesion.
3. Pulsar `IR AL BANO`.
4. El personaje camina al bano, se sienta, aparece el efecto y vuelve.
5. El backend registra la caca, aumenta fuerza, tamano y color, y refresca el ranking.

## Notas de producto

- Se preserva la direccion visual mint + cocoa del material `stitch_cagan_metro_pixel_evolution`.
- En esta version el backend usa persistencia local JSON para evitar un bloqueo del entorno con Prisma.
- El esquema Prisma sigue preparado para cambiar a SQLite/PostgreSQL en la siguiente fase.
- Plan detallado: `PLAN_CAGANOMETRO.md`
