-- AlterTable
-- Hacer product_id nullable para permitir eliminación de productos sin perder order_items
ALTER TABLE "order_items" ALTER COLUMN "product_id" DROP NOT NULL;

-- DropForeignKey
-- Eliminar la restricción antigua
ALTER TABLE "order_items" DROP CONSTRAINT "order_items_product_id_fkey";

-- AddForeignKey
-- Agregar nueva restricción con ON DELETE SET NULL
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE SET NULL ON UPDATE CASCADE;

