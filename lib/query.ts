/**
 * Advanced search query parser
 * Supports operators: tag:, p:, due:, est:
 * This is a key feature to demonstrate real parsing logic
 */

import { Task, SearchOperator, ParsedQuery } from "@/types";

// ============================================
// QUERY PARSER
// ============================================

/**
 * Parse search query into operators and free text
 * Examples:
 *   "tag:react p:high" -> { operators: [...], freeText: "" }
 *   "tag:react urgent task" -> { operators: [...], freeText: "urgent task" }
 *   "est:<60 p:high login" -> { operators: [...], freeText: "login" }
 */
export const parseQuery = (query: string): ParsedQuery => {
  const operators: SearchOperator[] = [];
  const tokens = query.trim().split(/\s+/);
  const freeTextTokens: string[] = [];

  for (const token of tokens) {
    if (token.includes(":")) {
      const [key, value] = token.split(":", 2);

      // Parse tag:value
      if (key === "tag" && value) {
        operators.push({
          type: "tag",
          value: value.toLowerCase(),
        });
        continue;
      }

      // Parse p:low/medium/high
      if (key === "p" && ["low", "medium", "high"].includes(value)) {
        operators.push({
          type: "priority",
          value: value,
        });
        continue;
      }

      // Parse due:overdue/week
      if (key === "due" && ["overdue", "week"].includes(value)) {
        operators.push({
          type: "due",
          value: value,
        });
        continue;
      }

      // Parse est:<60, est:>=120, est:60
      if (key === "est" && value) {
        const match = value.match(/^([<>=]+)?(\d+)$/);
        if (match) {
          const operator = match[1] || "=";
          const numValue = match[2];
          operators.push({
            type: "estimation",
            value: numValue,
            operator: operator as "=" | "<" | ">" | ">=" | "<=",
          });
          continue;
        }
      }
    }

    // If not an operator, add to free text
    freeTextTokens.push(token);
  }

  return {
    operators,
    freeText: freeTextTokens.join(" ").trim(),
  };
};

// ============================================
// QUERY FILTERS
// ============================================

/**
 * Apply search query to tasks array
 */
export const filterTasks = (tasks: Task[], query: string): Task[] => {
  if (!query.trim()) {
    return tasks;
  }

  const parsed = parseQuery(query);
  let filtered = [...tasks];

  // Apply operators
  for (const op of parsed.operators) {
    filtered = applyOperator(filtered, op);
  }

  // Apply free text search
  if (parsed.freeText) {
    const searchTerm = parsed.freeText.toLowerCase();
    filtered = filtered.filter((task) => {
      const titleMatch = task.titulo.toLowerCase().includes(searchTerm);
      const descMatch = task.descripcion?.toLowerCase().includes(searchTerm);
      return titleMatch || descMatch;
    });
  }

  return filtered;
};

/**
 * Apply single operator to tasks
 */
const applyOperator = (tasks: Task[], op: SearchOperator): Task[] => {
  switch (op.type) {
    case "tag":
      return tasks.filter((task) =>
        task.tags.some((tag) => tag.toLowerCase().includes(op.value.toLowerCase()))
      );

    case "priority":
      return tasks.filter((task) => task.prioridad === op.value);

    case "due":
      return filterByDue(tasks, op.value);

    case "estimation":
      return filterByEstimation(tasks, op.value, op.operator || "=");

    default:
      return tasks;
  }
};

/**
 * Filter tasks by due date
 */
const filterByDue = (tasks: Task[], value: string): Task[] => {
  const now = new Date();

  if (value === "overdue") {
    return tasks.filter((task) => {
      if (!task.fechaLimite) return false;
      const dueDate = new Date(task.fechaLimite);
      return dueDate < now && task.estado !== "done";
    });
  }

  if (value === "week") {
    const weekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    return tasks.filter((task) => {
      if (!task.fechaLimite) return false;
      const dueDate = new Date(task.fechaLimite);
      return dueDate >= now && dueDate <= weekFromNow;
    });
  }

  return tasks;
};

/**
 * Filter tasks by estimation with operators
 */
const filterByEstimation = (
  tasks: Task[],
  value: string,
  operator: "=" | "<" | ">" | ">=" | "<="
): Task[] => {
  const numValue = parseInt(value, 10);

  if (isNaN(numValue)) {
    return tasks;
  }

  return tasks.filter((task) => {
    const est = task.estimacionMin;

    switch (operator) {
      case "=":
        return est === numValue;
      case "<":
        return est < numValue;
      case ">":
        return est > numValue;
      case ">=":
        return est >= numValue;
      case "<=":
        return est <= numValue;
      default:
        return true;
    }
  });
};

// ============================================
// QUERY EXAMPLES (for UI tooltips)
// ============================================

export const QUERY_EXAMPLES = [
  {
    query: "tag:react",
    description: "Filter by tag 'react'",
  },
  {
    query: "p:high",
    description: "Filter by high priority (p:low, p:medium, p:high)",
  },
  {
    query: "due:overdue",
    description: "Show overdue tasks",
  },
  {
    query: "due:week",
    description: "Show tasks due this week",
  },
  {
    query: "est:<60",
    description: "Estimation less than 60 minutes",
  },
  {
    query: "est:>=120",
    description: "Estimation 120 minutes or more",
  },
  {
    query: "tag:bug p:high urgent",
    description: "Combine operators with free text",
  },
];
