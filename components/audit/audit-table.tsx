"use client"

import { useState, useMemo } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { useApp } from "@/lib/app-context";
import { AuditAction, AuditLog } from "@/types";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { RiFileCopyLine, RiFilterLine, RiRefreshLine } from "@remixicon/react";

const actionColors: Record<AuditAction, string> = {
  CREATE: "bg-green-100 text-green-800 hover:bg-green-200",
  UPDATE: "bg-blue-100 text-blue-800 hover:bg-blue-200",
  DELETE: "bg-red-100 text-red-800 hover:bg-red-200",
  MOVE: "bg-purple-100 text-purple-800 hover:bg-purple-200",
};

const actionLabels: Record<AuditAction, string> = {
  CREATE: "Crear",
  UPDATE: "Actualizar",
  DELETE: "Eliminar",
  MOVE: "Mover",
};

export function AuditTable() {
  const { state } = useApp();
  const [filterAction, setFilterAction] = useState<AuditAction | "ALL">("ALL");
  const [filterTaskId, setFilterTaskId] = useState("");

  // Filter audit logs
  const filteredLogs = useMemo(() => {
    let filtered = [...state.auditLogs].reverse(); // Most recent first

    if (filterAction !== "ALL") {
      filtered = filtered.filter((log) => log.accion === filterAction);
    }

    if (filterTaskId.trim()) {
      filtered = filtered.filter((log) =>
        log.taskId.toLowerCase().includes(filterTaskId.toLowerCase()) ||
        log.taskTitulo.toLowerCase().includes(filterTaskId.toLowerCase())
      );
    }

    return filtered;
  }, [state.auditLogs, filterAction, filterTaskId]);

  const handleCopySummary = () => {
    const summary = filteredLogs
      .map((log) => {
        const timestamp = format(new Date(log.timestamp), "dd/MM/yyyy HH:mm:ss", { locale: es });
        const diffStr = log.diff
          .map((d) => `  - ${d.field}: ${JSON.stringify(d.before)} → ${JSON.stringify(d.after)}`)
          .join("\n");

        return `[${timestamp}] ${log.accion} - ${log.taskTitulo}\n${diffStr}`;
      })
      .join("\n\n");

    navigator.clipboard.writeText(summary);
    toast.success("Resumen copiado al portapapeles");
  };

  const handleResetFilters = () => {
    setFilterAction("ALL");
    setFilterTaskId("");
  };

  const formatDate = (dateStr: string) => {
    try {
      return format(new Date(dateStr), "dd/MM/yyyy HH:mm:ss", { locale: es });
    } catch {
      return dateStr;
    }
  };

  const renderDiff = (log: AuditLog) => {
    if (log.diff.length === 0) return <span className="text-muted-foreground">Sin cambios</span>;

    return (
      <div className="space-y-1 text-sm">
        {log.diff.map((d, idx) => (
          <div key={idx} className="font-mono">
            <span className="font-semibold">{d.field}:</span>{" "}
            <span className="text-red-600">{JSON.stringify(d.before)}</span>
            {" → "}
            <span className="text-green-600">{JSON.stringify(d.after)}</span>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap items-end gap-4 rounded-lg border bg-card p-4">
        <div className="flex items-center gap-2">
          <RiFilterLine className="h-5 w-5 text-muted-foreground" />
          <span className="font-semibold">Filtros</span>
        </div>

        <div className="flex-1 space-y-2">
          <Label htmlFor="filter-action">Acción</Label>
          <Select value={filterAction} onValueChange={(v) => setFilterAction(v as AuditAction | "ALL")}>
            <SelectTrigger id="filter-action" className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Todas</SelectItem>
              <SelectItem value="CREATE">Crear</SelectItem>
              <SelectItem value="UPDATE">Actualizar</SelectItem>
              <SelectItem value="MOVE">Mover</SelectItem>
              <SelectItem value="DELETE">Eliminar</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex-1 space-y-2">
          <Label htmlFor="filter-task">Tarea (ID o Título)</Label>
          <Input
            id="filter-task"
            placeholder="Buscar por ID o título..."
            value={filterTaskId}
            onChange={(e) => setFilterTaskId(e.target.value)}
          />
        </div>

        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleResetFilters}>
            <RiRefreshLine className="h-4 w-4" />
            Limpiar
          </Button>
          <Button variant="default" size="sm" onClick={handleCopySummary}>
            <RiFileCopyLine className="h-4 w-4" />
            Copiar Resumen
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="flex gap-4 text-sm text-muted-foreground">
        <span>Total de logs: {state.auditLogs.length}</span>
        <span>•</span>
        <span>Logs filtrados: {filteredLogs.length}</span>
      </div>

      {/* Table */}
      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[180px]">Fecha/Hora</TableHead>
              <TableHead className="w-[120px]">Acción</TableHead>
              <TableHead className="w-[200px]">Tarea</TableHead>
              <TableHead>Cambios (Diff)</TableHead>
              <TableHead className="w-[100px]">Usuario</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredLogs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center">
                  <div className="text-muted-foreground">
                    {state.auditLogs.length === 0
                      ? "No hay logs de auditoría todavía"
                      : "No se encontraron logs con los filtros aplicados"}
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              filteredLogs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell className="font-mono text-xs">
                    {formatDate(log.timestamp)}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={actionColors[log.accion]}>
                      {actionLabels[log.accion]}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="max-w-[200px] truncate font-medium">
                      {log.taskTitulo}
                    </div>
                    <div className="text-xs text-muted-foreground font-mono">
                      {log.taskId.slice(0, 8)}...
                    </div>
                  </TableCell>
                  <TableCell>{renderDiff(log)}</TableCell>
                  <TableCell className="text-sm">{log.userLabel}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
