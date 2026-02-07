/**
 * LocalStorage persistence layer
 * Handles all data storage and retrieval
 */

import { AppState, Task, AuditLog, GodModeEval } from "@/types";

const STORAGE_KEY = "kanban-god-data";
const STORAGE_VERSION = "1.0";

// ============================================
// DEFAULT STATE
// ============================================

const getDefaultState = (): AppState => ({
  tasks: [],
  auditLogs: [],
  godModeEvals: [],
  godModeEnabled: false,
});

// ============================================
// LOAD FROM LOCALSTORAGE
// ============================================

export const loadState = (): AppState => {
  if (typeof window === "undefined") {
    return getDefaultState();
  }

  try {
    const serialized = localStorage.getItem(STORAGE_KEY);

    if (!serialized) {
      return getDefaultState();
    }

    const parsed = JSON.parse(serialized);

    // Validate version (for future migrations)
    if (parsed.version !== STORAGE_VERSION) {
      console.warn("Storage version mismatch, resetting to default");
      return getDefaultState();
    }

    return parsed.data as AppState;
  } catch (error) {
    console.error("Error loading state from localStorage:", error);
    return getDefaultState();
  }
};

// ============================================
// SAVE TO LOCALSTORAGE
// ============================================

export const saveState = (state: AppState): void => {
  if (typeof window === "undefined") {
    return;
  }

  try {
    const serialized = JSON.stringify({
      version: STORAGE_VERSION,
      data: state,
      lastSaved: new Date().toISOString(),
    });

    localStorage.setItem(STORAGE_KEY, serialized);
  } catch (error) {
    console.error("Error saving state to localStorage:", error);
  }
};

// ============================================
// EXPORT TO JSON FILE
// ============================================

export const exportToJSON = (state: AppState): void => {
  try {
    const dataStr = JSON.stringify(state, null, 2);
    const dataBlob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(dataBlob);

    const link = document.createElement("a");
    link.href = url;
    link.download = `kanban-backup-${new Date().toISOString().split("T")[0]}.json`;

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    URL.revokeObjectURL(url);
  } catch (error) {
    console.error("Error exporting to JSON:", error);
    throw new Error("Failed to export data");
  }
};

// ============================================
// IMPORT FROM JSON FILE
// ============================================

export interface ImportValidationError {
  field: string;
  message: string;
}

export interface ImportResult {
  success: boolean;
  errors: ImportValidationError[];
  data?: AppState;
  duplicateIdsResolved?: number;
}

const validateTask = (task: Task, index: number): ImportValidationError[] => {
  const errors: ImportValidationError[] = [];

  if (!task.id) {
    errors.push({ field: `tasks[${index}].id`, message: "Missing id" });
  }

  if (!task.titulo || task.titulo.length < 3) {
    errors.push({
      field: `tasks[${index}].titulo`,
      message: "Titulo must be at least 3 characters"
    });
  }

  if (!["low", "medium", "high"].includes(task.prioridad)) {
    errors.push({
      field: `tasks[${index}].prioridad`,
      message: "Invalid priority"
    });
  }

  if (!["todo", "doing", "done"].includes(task.estado)) {
    errors.push({
      field: `tasks[${index}].estado`,
      message: "Invalid estado"
    });
  }

  if (typeof task.estimacionMin !== "number" || task.estimacionMin < 0) {
    errors.push({
      field: `tasks[${index}].estimacionMin`,
      message: "Invalid estimation"
    });
  }

  if (!Array.isArray(task.tags)) {
    errors.push({
      field: `tasks[${index}].tags`,
      message: "Tags must be an array"
    });
  }

  return errors;
};

export const importFromJSON = (jsonString: string): ImportResult => {
  try {
    const data = JSON.parse(jsonString) as Partial<AppState>;
    const errors: ImportValidationError[] = [];

    // Validate structure
    if (!data.tasks || !Array.isArray(data.tasks)) {
      errors.push({ field: "tasks", message: "Missing or invalid tasks array" });
    }

    if (!data.auditLogs || !Array.isArray(data.auditLogs)) {
      errors.push({ field: "auditLogs", message: "Missing or invalid auditLogs array" });
    }

    if (!data.godModeEvals || !Array.isArray(data.godModeEvals)) {
      errors.push({ field: "godModeEvals", message: "Missing or invalid godModeEvals array" });
    }

    // Validate each task
    if (data.tasks) {
      data.tasks.forEach((task, index) => {
        errors.push(...validateTask(task as Task, index));
      });
    }

    // Check for duplicate IDs
    if (data.tasks) {
      const taskIds = data.tasks.map((t: Task) => t.id);
      const uniqueIds = new Set(taskIds);

      if (taskIds.length !== uniqueIds.size) {
        errors.push({
          field: "tasks",
          message: "Duplicate task IDs found - will be resolved on import"
        });
      }
    }

    if (errors.length > 0) {
      return {
        success: false,
        errors,
      };
    }

    // Resolve duplicate IDs by regenerating them
    let duplicatesResolved = 0;
    if (data.tasks) {
      const seenIds = new Set<string>();
      data.tasks = data.tasks.map((task: Task) => {
        if (seenIds.has(task.id)) {
          duplicatesResolved++;
          return { ...task, id: crypto.randomUUID() };
        }
        seenIds.add(task.id);
        return task;
      });
    }

    return {
      success: true,
      errors: [],
      data: data as AppState,
      duplicateIdsResolved: duplicatesResolved,
    };
  } catch (error) {
    return {
      success: false,
      errors: [{
        field: "root",
        message: error instanceof Error ? error.message : "Invalid JSON format"
      }],
    };
  }
};

// ============================================
// CLEAR ALL DATA
// ============================================

export const clearAllData = (): void => {
  if (typeof window === "undefined") {
    return;
  }

  localStorage.removeItem(STORAGE_KEY);
};
