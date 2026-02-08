/**
 * Core types for Kanban God application
 * No 'any' types - strict TypeScript
 */

// ============================================
// TASK TYPES
// ============================================

export type TaskStatus = "todo" | "doing" | "review" | "done";

export type Priority = "low" | "medium" | "high";

export interface Task {
  id: string; // UUID v4
  titulo: string; // min 3 characters
  descripcion?: string;
  prioridad: Priority;
  tags: string[];
  estimacionMin: number; // estimation in minutes
  fechaCreacion: string; // ISO 8601
  fechaLimite?: string; // ISO 8601, optional
  estado: TaskStatus;
}

// ============================================
// AUDIT LOG TYPES
// ============================================

export type AuditAction = "CREATE" | "UPDATE" | "DELETE" | "MOVE";

export interface AuditDiff {
  field: string;
  before: string | number | string[] | undefined;
  after: string | number | string[] | undefined;
}

export interface AuditLog {
  id: string; // UUID v4
  timestamp: string; // ISO 8601
  accion: AuditAction;
  taskId: string;
  taskTitulo: string; // For easier filtering/display
  diff: AuditDiff[]; // Array of changes
  userLabel: string; // Fixed: "Alumno/a"
}

// ============================================
// GOD MODE TYPES
// ============================================

export interface RubricaCriterio {
  nombre: string;
  puntuacion: number; // 0-10
}

export interface GodModeEval {
  taskId: string;
  observaciones: string;
  criterios: RubricaCriterio[];
  rubrica: number; // Media calculada de los criterios (0-10)
  fechaEval: string; // ISO 8601
}

// ============================================
// APPLICATION STATE
// ============================================

export interface AppState {
  tasks: Task[];
  auditLogs: AuditLog[];
  godModeEvals: GodModeEval[];
  godModeEnabled: boolean;
}

// ============================================
// SEARCH QUERY TYPES
// ============================================

export interface SearchOperator {
  type: "tag" | "priority" | "due" | "estimation" | "text";
  value: string;
  operator?: "=" | "<" | ">" | ">=" | "<=";
}

export interface ParsedQuery {
  operators: SearchOperator[];
  freeText: string;
}

// ============================================
// FORM VALIDATION TYPES (for react-hook-form)
// ============================================

export interface TaskFormData {
  titulo: string;
  descripcion?: string;
  prioridad: Priority;
  tags: string;
  estimacionMin: number;
  fechaLimite?: string;
}

// ============================================
// UTILITY TYPES
// ============================================

export interface TasksByStatus {
  todo: Task[];
  doing: Task[];
  review: Task[];
  done: Task[];
}

export interface GodModeSummary {
  totalTasks: number;
  evaluatedTasks: number;
  unevaluatedTasks: number;
  averageScore: number;
}
