-- Agregar columna publication_status a la tabla courses
ALTER TABLE courses ADD COLUMN IF NOT EXISTS publication_status TEXT DEFAULT 'draft';

-- Actualizar la columna publication_status para que coincida con is_published
UPDATE courses SET publication_status = CASE 
  WHEN is_published = true THEN 'approved'
  ELSE 'draft'
END;

-- Añadir comentario a la columna para documentar los posibles valores
COMMENT ON COLUMN courses.publication_status IS 'Posibles valores: draft, pending_review, approved, rejected';

-- Crear índice para mejorar el rendimiento de consultas por estado de publicación
CREATE INDEX IF NOT EXISTS idx_courses_publication_status ON courses(publication_status);

-- Actualizar RLS policy para reflejar el nuevo estado de publicación
-- Primero eliminamos la política existente si existe
DROP POLICY IF EXISTS "Users can view published courses" ON courses;

-- Creamos la nueva política que solo permite ver cursos aprobados
CREATE POLICY "Users can view published courses" ON courses
FOR SELECT TO authenticated
USING (
  publication_status = 'approved'
  OR auth.uid() = instructor_id
  OR EXISTS (
    SELECT 1 FROM user_roles ur 
    WHERE ur.user_id = auth.uid() 
    AND ur.role = 'admin'
  )
);