-- Eliminar el constraint único actual que causa problemas con valores null
ALTER TABLE "order_items" DROP CONSTRAINT IF EXISTS "order_items_order_id_product_id_key";

-- Eliminar el índice único si existe
DROP INDEX IF EXISTS "order_items_order_id_product_id_key";

-- Crear un índice único parcial que solo se aplica cuando product_id no es null
-- Esto permite múltiples filas con product_id = null pero mantiene la unicidad cuando product_id tiene valor
CREATE UNIQUE INDEX "order_items_order_id_product_id_key" 
ON "order_items" ("order_id", "product_id") 
WHERE "product_id" IS NOT NULL;

