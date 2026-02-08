/**
 * Zod validation schemas
 * Used with react-hook-form for form validation
 */

import { z } from "zod";

export const taskSchema = z.object({
  titulo: z
    .string()
    .min(3, "El título debe tener al menos 3 caracteres")
    .max(100, "El título no puede exceder 100 caracteres"),

  descripcion: z
    .string()
    .max(500, "La descripción no puede exceder 500 caracteres")
    .optional()
    .or(z.literal("")),

  prioridad: z.enum(["low", "medium", "high"], {
    message: "Selecciona una prioridad",
  }),

  tags: z.string(),

  estimacionMin: z
    .number({
      message: "Debe ser un número válido",
    })
    .min(1, "La estimación debe ser al menos 1 minuto")
    .max(9999, "La estimación no puede exceder 9999 minutos"),

  fechaLimite: z
    .string()
    .optional()
    .or(z.literal("")),
});

export type TaskFormValues = z.infer<typeof taskSchema>;

/** Parse comma-separated tags string into array */
export function parseTags(tags: string): string[] {
  if (!tags.trim()) return [];
  const parsed = tags.split(",").map((t) => t.trim()).filter((t) => t.length > 0);
  return parsed.slice(0, 10);
}
