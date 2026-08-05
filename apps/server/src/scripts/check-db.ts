import "dotenv/config";
import { prisma } from "../lib/prisma.js";

async function checkDatabase() {
  const [accounts, characters, history] = await Promise.all([
    prisma.account.count(),
    prisma.character.count(),
    prisma.historialCaca.count()
  ]);

  console.log(`Neon conectado: cuentas=${accounts}, personajes=${characters}, historial=${history}`);
}

checkDatabase()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
