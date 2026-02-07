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
    required_error: "Selecciona una prioridad",
  }),

  tags: z
    .string()
    .transform((val) => {
      if (!val.trim()) return [];
      return val
        .split(",")
        .map((tag) => tag.trim())
        .filter((tag) => tag.length > 0);
    })
    .pipe(z.array(z.string()).max(10, "Máximo 10 tags")),

  estimacionMin: z
    .number({
      required_error: "La estimación es requerida",
      invalid_type_error: "Debe ser un número",
    })
    .min(1, "La estimación debe ser al menos 1 minuto")
    .max(9999, "La estimación no puede exceder 9999 minutos"),

  fechaLimite: z
    .string()
    .optional()
    .or(z.literal("")),
});

export type TaskFormValues = z.infer<typeof taskSchema>;
