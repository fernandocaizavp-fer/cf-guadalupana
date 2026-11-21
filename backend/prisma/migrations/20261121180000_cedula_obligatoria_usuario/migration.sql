-- La cédula pasa a ser obligatoria en todas las cuentas de usuario.
--
-- 1. Los estudiantes tenían su cédula solo en la matrícula: se copia a su cuenta.
--    (Se omite si otra cuenta ya usa esa cédula, para no violar el UNIQUE; ese
--    caso lo detiene la comprobación del paso 2.)
UPDATE "Usuario" u
SET "cedula" = m."cedula"
FROM "Matricula" m
WHERE m."usuarioId" = u."id"
  AND u."cedula" IS NULL
  AND NOT EXISTS (SELECT 1 FROM "Usuario" o WHERE o."cedula" = m."cedula");

-- 2. Los administradores no tienen matrícula: su cédula debe registrarse antes de
--    aplicar esta migración. Si queda alguna cuenta sin cédula, la migración se
--    detiene aquí con un mensaje claro en lugar de fallar en el ALTER.
DO $$
DECLARE
  pendientes INTEGER;
BEGIN
  SELECT COUNT(*) INTO pendientes FROM "Usuario" WHERE "cedula" IS NULL;
  IF pendientes > 0 THEN
    RAISE EXCEPTION 'Hay % cuenta(s) de usuario sin cédula (administradores). Registre su cédula antes de aplicar esta migración.', pendientes;
  END IF;
END $$;

-- 3. La columna deja de aceptar nulos.
ALTER TABLE "Usuario" ALTER COLUMN "cedula" SET NOT NULL;
