export const COURSE_LEVELS = {
  "básico": 1,
  "intermedio": 2,
  "avanzado": 3,
  "experto": 4,
  "único": 99, // Cursos especiales fuera de la currícula estándar
};

/**
 * Determina si un usuario tiene acceso a un curso basado en el nivel de su plan activo.
 * 
 * Reglas de la Opción A (Acceso Progresivo por Niveles):
 * - Los planes otorgan acceso a los cursos de su mismo nivel y todos los inferiores.
 * - Si un plan no tiene nivel asociado (null/undefined/none), se asume que da acceso a TODOS los cursos de cualquier nivel (excepto Único, a menos que se especifique lo contrario, pero por defecto un "All Access" da todo).
 * - Si un curso es nivel "único", SOLO los planes marcados específicamente como nivel "único" dan acceso, a menos que el plan sea un "All Access" (sin nivel). *Nota: Por requerimiento, el nivel único es para cursos que no tienen que ver con los niveles. Si se quiere que un plan All Access no dé acceso a Únicos, podemos ajustar esto, pero típicamente el Admin/All-Access da todo.
 * 
 * @param courseLevel El nivel del curso a validar (básico, intermedio, etc)
 * @param planLevel El nivel asociado al plan activo del usuario (null si es acceso total)
 * @returns boolean indicando si el usuario debe tener Pase VIP
 */
export function hasVipAccess(courseLevel: string, planLevel: string | null | undefined): boolean {
  // Si el plan no tiene un nivel delimitador, asumimos que es un "Acceso Completo/Premium"
  if (!planLevel || planLevel === "none" || planLevel.trim() === "") {
    return true; 
  }

  // Normalizar strings para evitar errores de case
  const courseLvl = courseLevel?.toLowerCase() || "básico";
  const planLvl = planLevel?.toLowerCase() || "básico";

  // Regla especial para los cursos y planes "Únicos"
  // Un curso único solo es accesible por un plan único, y un plan único solo da acceso a cursos únicos.
  // (El acceso total arriba con planLevel=null sí da acceso a únicos por defecto, al ser premium root)
  if (courseLvl === "único" || planLvl === "único") {
    return courseLvl === "único" && planLvl === "único";
  }

  // Fallback seguro: obtener el valor numérico jerárquico. 
  // Si un nivel no existe en el mapa (ej. error de tipado), da un valor alto para curso (restrictivo) o bajo para plan.
  const courseValue = COURSE_LEVELS[courseLvl as keyof typeof COURSE_LEVELS] ?? 999;
  const planValue = COURSE_LEVELS[planLvl as keyof typeof COURSE_LEVELS] ?? 0;

  // El plan es VIP si su nivel jerárquico es MAYOR o IGUAL al nivel del curso.
  // Ej: Plan Intermedio (2) >= Curso Básico (1) -> true
  return planValue >= courseValue;
}
