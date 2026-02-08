"use client"

import { useState, useMemo } from "react";
import { format, isAfter, isBefore, startOfDay, endOfDay } from "date-fns";
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
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
  RiFileCopyLine,
  RiFilterLine,
  RiRefreshLine,
  RiArrowUpLine,
  RiArrowDownLine,
  RiArrowLeftSLine,
  RiArrowRightSLine,
  RiExpandUpDownLine,
  RiArrowDownSLine,
  RiArrowRightSFill,
  RiCalendarLine,
  RiCloseLine,
} from "@remixicon/react";

const ITEMS_PER_PAGE = 20;

const actionColors: Record<AuditAction, string> = {
  CREATE: "bg-green-100 text-green-800 hover:bg-green-200 dark:bg-green-950 dark:text-green-300",
  UPDATE: "bg-blue-100 text-blue-800 hover:bg-blue-200 dark:bg-blue-950 dark:text-blue-300",
  DELETE: "bg-red-100 text-red-800 hover:bg-red-200 dark:bg-red-950 dark:text-red-300",
  MOVE: "bg-purple-100 text-purple-800 hover:bg-purple-200 dark:bg-purple-950 dark:text-purple-300",
};

const actionLabels: Record<AuditAction, string> = {
  CREATE: "Crear",
  UPDATE: "Actualizar",
  DELETE: "Eliminar",
  MOVE: "Mover",
};

const statusDiffColors: Record<string, string> = {
  todo: "text-blue-600",
  doing: "text-yellow-600",
  review: "text-orange-600",
  done: "text-green-600",
};

type SortField = "timestamp" | "accion" | "taskTitulo";
type SortDirection = "asc" | "desc";

export function AuditTable() {
  const { state } = useApp();
  const [filterAction, setFilterAction] = useState<AuditAction | "ALL">("ALL");
  const [filterTaskId, setFilterTaskId] = useState("");
  const [dateFrom, setDateFrom] = useState<Date | undefined>();
  const [dateTo, setDateTo] = useState<Date | undefined>();
  const [sortField, setSortField] = useState<SortField>("timestamp");
  const [sortDir, setSortDir] = useState<SortDirection>("desc");
  const [page, setPage] = useState(0);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  // Filter & sort audit logs
  const filteredLogs = useMemo(() => {
    let filtered = [...state.auditLogs];

    if (filterAction !== "ALL") {
      filtered = filtered.filter((log) => log.accion === filterAction);
    }

    if (filterTaskId.trim()) {
      const q = filterTaskId.toLowerCase();
      filtered = filtered.filter(
        (log) =>
          log.taskId.toLowerCase().includes(q) ||
          log.taskTitulo.toLowerCase().includes(q)
      );
    }

    if (dateFrom) {
      const from = startOfDay(dateFrom);
      filtered = filtered.filter((log) => isAfter(new Date(log.timestamp), from));
    }

    if (dateTo) {
      const to = endOfDay(dateTo);
      filtered = filtered.filter((log) => isBefore(new Date(log.timestamp), to));
    }

    // Sort
    filtered.sort((a, b) => {
      let cmp = 0;
      if (sortField === "timestamp") {
        cmp = new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
      } else if (sortField === "accion") {
        cmp = a.accion.localeCompare(b.accion);
      } else {
        cmp = a.taskTitulo.localeCompare(b.taskTitulo);
      }
      return sortDir === "asc" ? cmp : -cmp;
    });

    return filtered;
  }, [state.auditLogs, filterAction, filterTaskId, dateFrom, dateTo, sortField, sortDir]);

  // Reset page when filters change
  const paginatedLogs = useMemo(() => {
    const start = page * ITEMS_PER_PAGE;
    return filteredLogs.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredLogs, page]);

  const totalPages = Math.max(1, Math.ceil(filteredLogs.length / ITEMS_PER_PAGE));

  // Clamp page if filters reduce results
  if (page >= totalPages && page > 0) {
    setPage(totalPages - 1);
  }

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir(sortDir === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDir(field === "timestamp" ? "desc" : "asc");
    }
    setPage(0);
  };

  const toggleRow = (id: string) => {
    setExpandedRows((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

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
    setDateFrom(undefined);
    setDateTo(undefined);
    setSortField("timestamp");
    setSortDir("desc");
    setPage(0);
    setExpandedRows(new Set());
  };

  const formatDateCell = (dateStr: string) => {
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
        {log.diff.map((d, idx) => {
          const isStatus = d.field === "estado";
          const beforeKey = String(d.before);
          const afterKey = String(d.after);
          const beforeClass = isStatus
            ? statusDiffColors[beforeKey] ?? "text-muted-foreground"
            : "text-red-600 dark:text-red-400";
          const afterClass = isStatus
            ? statusDiffColors[afterKey] ?? "text-muted-foreground"
            : "text-green-600 dark:text-green-400";

          return (
            <div key={idx} className="font-mono text-xs">
              <span className="font-semibold">{d.field}:</span>{" "}
              <span className={beforeClass}>{JSON.stringify(d.before)}</span>
              {" → "}
              <span className={afterClass}>{JSON.stringify(d.after)}</span>
            </div>
          );
        })}
      </div>
    );
  };

  const diffSummary = (log: AuditLog) => {
    if (log.diff.length === 0) return "Sin cambios";
    if (log.diff.length === 1) return `${log.diff[0].field} modificado`;
    return `${log.diff.length} campos modificados`;
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <RiExpandUpDownLine className="h-3.5 w-3.5 text-muted-foreground/50" />;
    return sortDir === "asc"
      ? <RiArrowUpLine className="h-3.5 w-3.5 text-primary" />
      : <RiArrowDownLine className="h-3.5 w-3.5 text-primary" />;
  };

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap items-end gap-4 rounded-lg border bg-card p-4">
        <div className="flex items-center gap-2">
          <RiFilterLine className="h-5 w-5 text-muted-foreground" />
          <span className="font-semibold">Filtros</span>
        </div>

        <div className="space-y-2">
          <Label htmlFor="filter-action">Accion</Label>
          <Select value={filterAction} onValueChange={(v) => { setFilterAction(v as AuditAction | "ALL"); setPage(0); }}>
            <SelectTrigger id="filter-action" className="w-[150px]">
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

        <div className="space-y-2">
          <Label htmlFor="filter-task">Tarea</Label>
          <Input
            id="filter-task"
            placeholder="Buscar..."
            value={filterTaskId}
            onChange={(e) => { setFilterTaskId(e.target.value); setPage(0); }}
            className="w-[160px]"
          />
        </div>

        {/* Date from */}
        <div className="space-y-2">
          <Label>Desde</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className={`w-[140px] justify-start text-left font-normal ${!dateFrom ? "text-muted-foreground" : ""}`}>
                <RiCalendarLine className="mr-2 h-4 w-4" />
                {dateFrom ? format(dateFrom, "dd/MM/yyyy") : "Inicio"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={dateFrom}
                onSelect={(d) => { setDateFrom(d ?? undefined); setPage(0); }}
                locale={es}
              />
              {dateFrom && (
                <div className="border-t p-2">
                  <Button type="button" variant="ghost" size="sm" className="w-full text-muted-foreground" onClick={() => setDateFrom(undefined)}>
                    Quitar fecha
                  </Button>
                </div>
              )}
            </PopoverContent>
          </Popover>
        </div>

        {/* Date to */}
        <div className="space-y-2">
          <Label>Hasta</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className={`w-[140px] justify-start text-left font-normal ${!dateTo ? "text-muted-foreground" : ""}`}>
                <RiCalendarLine className="mr-2 h-4 w-4" />
                {dateTo ? format(dateTo, "dd/MM/yyyy") : "Fin"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={dateTo}
                onSelect={(d) => { setDateTo(d ?? undefined); setPage(0); }}
                locale={es}
              />
              {dateTo && (
                <div className="border-t p-2">
                  <Button type="button" variant="ghost" size="sm" className="w-full text-muted-foreground" onClick={() => setDateTo(undefined)}>
                    Quitar fecha
                  </Button>
                </div>
              )}
            </PopoverContent>
          </Popover>
        </div>

        <div className="flex gap-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="outline" size="default" onClick={handleResetFilters}>
                <RiRefreshLine className="h-4 w-4" />
                Limpiar
              </Button>
            </TooltipTrigger>
            <TooltipContent>Restablecer los filtros</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="default" size="default" onClick={handleCopySummary}>
                <RiFileCopyLine className="h-4 w-4" />
                Copiar
              </Button>
            </TooltipTrigger>
            <TooltipContent>Copiar el resumen al portapapeles</TooltipContent>
          </Tooltip>
        </div>
      </div>

      {/* Stats + Pagination top */}
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>
          {filteredLogs.length} log{filteredLogs.length !== 1 ? "s" : ""} de {state.auditLogs.length} total
        </span>
        <div className="flex items-center gap-2">
          <span>Pagina {page + 1} de {totalPages}</span>
          <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => setPage(page - 1)} disabled={page === 0}>
            <RiArrowLeftSLine className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => setPage(page + 1)} disabled={page >= totalPages - 1}>
            <RiArrowRightSLine className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-lg border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50 hover:bg-muted/50">
              <TableHead className="w-8" />
              <TableHead className="w-[170px]">
                <button onClick={() => toggleSort("timestamp")} className="flex items-center gap-1.5 hover:text-foreground transition-colors">
                  Fecha/Hora <SortIcon field="timestamp" />
                </button>
              </TableHead>
              <TableHead className="w-[110px]">
                <button onClick={() => toggleSort("accion")} className="flex items-center gap-1.5 hover:text-foreground transition-colors">
                  Accion <SortIcon field="accion" />
                </button>
              </TableHead>
              <TableHead className="w-[200px]">
                <button onClick={() => toggleSort("taskTitulo")} className="flex items-center gap-1.5 hover:text-foreground transition-colors">
                  Tarea <SortIcon field="taskTitulo" />
                </button>
              </TableHead>
              <TableHead>Cambios</TableHead>
              <TableHead className="w-[90px]">Usuario</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedLogs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center">
                  <div className="text-muted-foreground">
                    {state.auditLogs.length === 0
                      ? "No hay logs de auditoria todavia"
                      : "No se encontraron logs con los filtros aplicados"}
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              paginatedLogs.map((log, idx) => {
                const isExpanded = expandedRows.has(log.id);
                const isEven = idx % 2 === 0;

                return (
                  <TableRow
                    key={log.id}
                    className={`cursor-pointer transition-colors ${isEven ? "bg-muted/20" : ""} hover:bg-muted/40`}
                    onClick={() => toggleRow(log.id)}
                  >
                    <TableCell className="px-2">
                      {isExpanded
                        ? <RiArrowDownSLine className="h-4 w-4 text-muted-foreground" />
                        : <RiArrowRightSFill className="h-4 w-4 text-muted-foreground/50" />
                      }
                    </TableCell>
                    <TableCell className="font-mono text-xs">
                      {formatDateCell(log.timestamp)}
                    </TableCell>
                    <TableCell>
                      <Badge variant="default" className={actionColors[log.accion]}>
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
                    <TableCell>
                      {isExpanded ? renderDiff(log) : (
                        <span className="text-xs text-muted-foreground">{diffSummary(log)}</span>
                      )}
                    </TableCell>
                    <TableCell className="text-sm">{log.userLabel}</TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination bottom */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setPage(0)} disabled={page === 0}>
            Primera
          </Button>
          <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setPage(page - 1)} disabled={page === 0}>
            <RiArrowLeftSLine className="h-4 w-4" />
          </Button>
          <span className="text-sm px-3">
            {page + 1} / {totalPages}
          </span>
          <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setPage(page + 1)} disabled={page >= totalPages - 1}>
            <RiArrowRightSLine className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={() => setPage(totalPages - 1)} disabled={page >= totalPages - 1}>
            Ultima
          </Button>
        </div>
      )}
    </div>
  );
}
