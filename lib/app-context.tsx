"use client"

/**
 * Global Application Context
 * Manages tasks, audit logs, god mode evaluations, and all state mutations
 */

import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from "react";
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

const MAX_HISTORY = 30;

interface AppContextType {
  state: AppState;
  createTask: (task: Omit<Task, "id" | "fechaCreacion" | "estado">, estado?: TaskStatus) => void;
  updateTask: (id: string, updates: Partial<Task>) => void;
  deleteTask: (id: string) => void;
  moveTask: (id: string, newEstado: TaskStatus) => void;
  setGodModeEnabled: (enabled: boolean) => void;
  saveGodModeEval: (evalData: Omit<GodModeEval, "fechaEval">) => void;
  exportData: () => void;
  importData: (data: AppState) => void;
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<AppState>(loadState());
  const [isInitialized, setIsInitialized] = useState(false);
  const pastRef = useRef<AppState[]>([]);
  const futureRef = useRef<AppState[]>([]);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);

  const pushHistory = useCallback((currentState: AppState) => {
    pastRef.current = [...pastRef.current.slice(-(MAX_HISTORY - 1)), currentState];
    futureRef.current = [];
    setCanUndo(true);
    setCanRedo(false);
  }, []);

  const undo = useCallback(() => {
    const past = pastRef.current;
    if (past.length === 0) return;

    const previous = past[past.length - 1];
    pastRef.current = past.slice(0, -1);
    futureRef.current = [...futureRef.current, state];

    setState(previous);
    setCanUndo(pastRef.current.length > 0);
    setCanRedo(true);
    toast.info("Acción deshecha");
  }, [state]);

  const redo = useCallback(() => {
    const future = futureRef.current;
    if (future.length === 0) return;

    const next = future[future.length - 1];
    futureRef.current = future.slice(0, -1);
    pastRef.current = [...pastRef.current, state];

    setState(next);
    setCanUndo(true);
    setCanRedo(futureRef.current.length > 0);
    toast.info("Acción rehecha");
  }, [state]);

  // Keyboard shortcuts: Ctrl+Z / Ctrl+Y
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "z" && !e.shiftKey) {
        e.preventDefault();
        undo();
      }
      if ((e.ctrlKey || e.metaKey) && (e.key === "y" || (e.key === "z" && e.shiftKey))) {
        e.preventDefault();
        redo();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [undo, redo]);

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

  const buildAuditLog = useCallback(
    (accion: AuditAction, taskId: string, taskTitulo: string, diff: AuditDiff[]): AuditLog => ({
      id: uuidv4(),
      timestamp: new Date().toISOString(),
      accion,
      taskId,
      taskTitulo,
      diff,
      userLabel: "Alumno/a",
    }),
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

      const diff: AuditDiff[] = Object.entries(newTask).map(([field, value]) => ({
        field,
        before: undefined,
        after: value,
      }));

      const log = buildAuditLog("CREATE", newTask.id, newTask.titulo, diff);

      setState((prev) => {
        pushHistory(prev);
        return {
          ...prev,
          tasks: [...prev.tasks, newTask],
          auditLogs: [...prev.auditLogs, log],
        };
      });

      toast.success(`Tarea "${newTask.titulo}" creada`);
    },
    [buildAuditLog, pushHistory]
  );

  const updateTask = useCallback(
    (id: string, updates: Partial<Task>) => {
      setState((prev) => {
        const taskIndex = prev.tasks.findIndex((t) => t.id === id);
        if (taskIndex === -1) return prev;

        pushHistory(prev);

        const oldTask = prev.tasks[taskIndex];
        const updatedTask = { ...oldTask, ...updates };

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

        const newAuditLogs = diff.length > 0
          ? [...prev.auditLogs, buildAuditLog("UPDATE", id, updatedTask.titulo, diff)]
          : prev.auditLogs;

        toast.success(`Tarea "${updatedTask.titulo}" actualizada`);

        return {
          ...prev,
          tasks: newTasks,
          auditLogs: newAuditLogs,
        };
      });
    },
    [buildAuditLog, pushHistory]
  );

  const deleteTask = useCallback(
    (id: string) => {
      setState((prev) => {
        const task = prev.tasks.find((t) => t.id === id);
        if (!task) return prev;

        pushHistory(prev);

        const diff: AuditDiff[] = Object.entries(task).map(([field, value]) => ({
          field,
          before: value,
          after: undefined,
        }));

        const log = buildAuditLog("DELETE", id, task.titulo, diff);

        toast.success(`Tarea "${task.titulo}" eliminada`);

        return {
          ...prev,
          tasks: prev.tasks.filter((t) => t.id !== id),
          godModeEvals: prev.godModeEvals.filter((e) => e.taskId !== id),
          auditLogs: [...prev.auditLogs, log],
        };
      });
    },
    [buildAuditLog, pushHistory]
  );

  const moveTask = useCallback(
    (id: string, newEstado: TaskStatus) => {
      setState((prev) => {
        const taskIndex = prev.tasks.findIndex((t) => t.id === id);
        if (taskIndex === -1) return prev;

        const oldTask = prev.tasks[taskIndex];
        if (oldTask.estado === newEstado) return prev;

        pushHistory(prev);

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

        const log = buildAuditLog("MOVE", id, updatedTask.titulo, diff);

        toast.success(`Tarea movida a ${newEstado.toUpperCase()}`);

        return {
          ...prev,
          tasks: newTasks,
          auditLogs: [...prev.auditLogs, log],
        };
      });
    },
    [buildAuditLog, pushHistory]
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
    setState((prev) => {
      pushHistory(prev);
      return data;
    });
    toast.success("Datos importados correctamente");
  }, [pushHistory]);

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
    undo,
    redo,
    canUndo,
    canRedo,
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
