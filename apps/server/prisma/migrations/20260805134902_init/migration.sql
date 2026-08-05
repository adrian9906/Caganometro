-- CreateTable
CREATE TABLE "accounts" (
    "id" SERIAL NOT NULL,
    "username" VARCHAR(30) NOT NULL,
    "password_hash" VARCHAR(255) NOT NULL,
    "active_character_id" INTEGER,
    "fecha_creacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "characters" (
    "id" SERIAL NOT NULL,
    "account_id" INTEGER NOT NULL,
    "nombre" VARCHAR(40) NOT NULL,
    "nickname" VARCHAR(24) NOT NULL,
    "descripcion" VARCHAR(220) NOT NULL,
    "habilidades" VARCHAR(180) NOT NULL,
    "fortalezas" VARCHAR(180) NOT NULL,
    "debilidades" VARCHAR(180) NOT NULL,
    "edad" INTEGER NOT NULL,
    "estatura" DOUBLE PRECISION NOT NULL,
    "color_pelo" VARCHAR(20) NOT NULL,
    "color_piel" VARCHAR(7) NOT NULL,
    "color_actual" VARCHAR(7) NOT NULL,
    "total_cacas" INTEGER NOT NULL DEFAULT 0,
    "tamano" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "fuerza" INTEGER NOT NULL DEFAULT 5,
    "ultima_caca" TIMESTAMP(3),
    "fecha_creacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "characters_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "historial_cacas" (
    "id" SERIAL NOT NULL,
    "personaje_id" INTEGER NOT NULL,
    "fecha_hora" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "tamano_antes" DOUBLE PRECISION NOT NULL,
    "fuerza_antes" INTEGER NOT NULL,
    "color_antes" VARCHAR(7) NOT NULL,

    CONSTRAINT "historial_cacas_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "accounts_username_key" ON "accounts"("username");

-- CreateIndex
CREATE INDEX "characters_account_id_idx" ON "characters"("account_id");

-- CreateIndex
CREATE INDEX "characters_total_cacas_fuerza_fecha_creacion_idx" ON "characters"("total_cacas" DESC, "fuerza" DESC, "fecha_creacion");

-- CreateIndex
CREATE INDEX "historial_cacas_personaje_id_idx" ON "historial_cacas"("personaje_id");

-- AddForeignKey
ALTER TABLE "characters" ADD CONSTRAINT "characters_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "historial_cacas" ADD CONSTRAINT "historial_cacas_personaje_id_fkey" FOREIGN KEY ("personaje_id") REFERENCES "characters"("id") ON DELETE CASCADE ON UPDATE CASCADE;
