"use client"

/**
 * Global Application Context
 * Manages tasks, audit logs, god mode evaluations, and all state mutations
 */

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { v4 as uuidv4 } from "uuid";
import { toast } from "sonner";
import {
  AppState,
  Task,
  AuditLog,
  GodModeEval,
  TaskStatus,
  AuditDiff,
  AuditAction,
} from "@/types";
import { loadState, saveState } from "./storage";

interface AppContextType {
  state: AppState;
  createTask: (task: Omit<Task, "id" | "fechaCreacion" | "estado">, estado?: TaskStatus) => void;
  updateTask: (id: string, updates: Partial<Task>) => void;
  deleteTask: (id: string) => void;
  moveTask: (id: string, newEstado: TaskStatus) => void;
  setGodModeEnabled: (enabled: boolean) => void;
  saveGodModeEval: (eval: Omit<GodModeEval, "fechaEval">) => void;
  exportData: () => void;
  importData: (data: AppState) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<AppState>(loadState());
  const [isInitialized, setIsInitialized] = useState(false);

  // Load state on mount (client-side only)
  useEffect(() => {
    setState(loadState());
    setIsInitialized(true);
  }, []);

  // Save state to localStorage whenever it changes
  useEffect(() => {
    if (isInitialized) {
      saveState(state);
    }
  }, [state, isInitialized]);

  // ============================================
  // AUDIT LOG HELPER
  // ============================================

  const createAuditLog = useCallback(
    (accion: AuditAction, taskId: string, taskTitulo: string, diff: AuditDiff[]) => {
      const log: AuditLog = {
        id: uuidv4(),
        timestamp: new Date().toISOString(),
        accion,
        taskId,
        taskTitulo,
        diff,
        userLabel: "Alumno/a",
      };

      setState((prev) => ({
        ...prev,
        auditLogs: [...prev.auditLogs, log],
      }));
    },
    []
  );

  // ============================================
  // TASK OPERATIONS
  // ============================================

  const createTask = useCallback(
    (taskData: Omit<Task, "id" | "fechaCreacion" | "estado">, estado: TaskStatus = "todo") => {
      const newTask: Task = {
        ...taskData,
        id: uuidv4(),
        fechaCreacion: new Date().toISOString(),
        estado,
      };

      setState((prev) => ({
        ...prev,
        tasks: [...prev.tasks, newTask],
      }));

      // Create audit log
      const diff: AuditDiff[] = Object.entries(newTask).map(([field, value]) => ({
        field,
        before: undefined,
        after: value,
      }));

      createAuditLog("CREATE", newTask.id, newTask.titulo, diff);

      toast.success(`Tarea "${newTask.titulo}" creada`);
    },
    [createAuditLog]
  );

  const updateTask = useCallback(
    (id: string, updates: Partial<Task>) => {
      setState((prev) => {
        const taskIndex = prev.tasks.findIndex((t) => t.id === id);
        if (taskIndex === -1) return prev;

        const oldTask = prev.tasks[taskIndex];
        const updatedTask = { ...oldTask, ...updates };

        // Calculate diff
        const diff: AuditDiff[] = [];
        for (const key of Object.keys(updates) as (keyof Task)[]) {
          if (JSON.stringify(oldTask[key]) !== JSON.stringify(updates[key])) {
            diff.push({
              field: key,
              before: oldTask[key],
              after: updates[key],
            });
          }
        }

        const newTasks = [...prev.tasks];
        newTasks[taskIndex] = updatedTask;

        // Create audit log
        if (diff.length > 0) {
          createAuditLog("UPDATE", id, updatedTask.titulo, diff);
        }

        toast.success(`Tarea "${updatedTask.titulo}" actualizada`);

        return {
          ...prev,
          tasks: newTasks,
        };
      });
    },
    [createAuditLog]
  );

  const deleteTask = useCallback(
    (id: string) => {
      setState((prev) => {
        const task = prev.tasks.find((t) => t.id === id);
        if (!task) return prev;

        // Create audit log before deleting
        const diff: AuditDiff[] = Object.entries(task).map(([field, value]) => ({
          field,
          before: value,
          after: undefined,
        }));

        createAuditLog("DELETE", id, task.titulo, diff);

        toast.success(`Tarea "${task.titulo}" eliminada`);

        return {
          ...prev,
          tasks: prev.tasks.filter((t) => t.id !== id),
          godModeEvals: prev.godModeEvals.filter((e) => e.taskId !== id),
        };
      });
    },
    [createAuditLog]
  );

  const moveTask = useCallback(
    (id: string, newEstado: TaskStatus) => {
      setState((prev) => {
        const taskIndex = prev.tasks.findIndex((t) => t.id === id);
        if (taskIndex === -1) return prev;

        const oldTask = prev.tasks[taskIndex];
        if (oldTask.estado === newEstado) return prev;

        const updatedTask = { ...oldTask, estado: newEstado };

        const diff: AuditDiff[] = [
          {
            field: "estado",
            before: oldTask.estado,
            after: newEstado,
          },
        ];

        const newTasks = [...prev.tasks];
        newTasks[taskIndex] = updatedTask;

        // Create audit log
        createAuditLog("MOVE", id, updatedTask.titulo, diff);

        toast.success(`Tarea movida a ${newEstado.toUpperCase()}`);

        return {
          ...prev,
          tasks: newTasks,
        };
      });
    },
    [createAuditLog]
  );

  // ============================================
  // GOD MODE OPERATIONS
  // ============================================

  const setGodModeEnabled = useCallback((enabled: boolean) => {
    setState((prev) => ({ ...prev, godModeEnabled: enabled }));
    toast.info(enabled ? "Modo Dios activado" : "Modo Dios desactivado");
  }, []);

  const saveGodModeEval = useCallback((evalData: Omit<GodModeEval, "fechaEval">) => {
    const newEval: GodModeEval = {
      ...evalData,
      fechaEval: new Date().toISOString(),
    };

    setState((prev) => {
      const existingIndex = prev.godModeEvals.findIndex(
        (e) => e.taskId === newEval.taskId
      );

      let updatedEvals;
      if (existingIndex >= 0) {
        updatedEvals = [...prev.godModeEvals];
        updatedEvals[existingIndex] = newEval;
      } else {
        updatedEvals = [...prev.godModeEvals, newEval];
      }

      return {
        ...prev,
        godModeEvals: updatedEvals,
      };
    });

    toast.success("Evaluación guardada");
  }, []);

  // ============================================
  // IMPORT/EXPORT
  // ============================================

  const exportData = useCallback(() => {
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

      toast.success("Datos exportados correctamente");
    } catch (error) {
      toast.error("Error al exportar datos");
      console.error(error);
    }
  }, [state]);

  const importData = useCallback((data: AppState) => {
    setState(data);
    toast.success("Datos importados correctamente");
  }, []);

  const value: AppContextType = {
    state,
    createTask,
    updateTask,
    deleteTask,
    moveTask,
    setGodModeEnabled,
    saveGodModeEval,
    exportData,
    importData,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useApp = (): AppContextType => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useApp must be used within AppProvider");
  }
  return context;
};
