"use client"

import { useState } from "react";
import { AppProvider, useApp } from "@/lib/app-context";
import { cn } from "@/lib/utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { RiDashboardLine, RiFileTextLine, RiStarLine, RiTargetLine, RiShieldStarLine } from "@remixicon/react";
import { KanbanBoard } from "@/components/kanban/kanban-board";
import { AuditTable } from "@/components/audit/audit-table";
import { GodModePanel } from "@/components/god-mode/god-mode-panel";
import { ThemeToggle } from "@/components/theme-toggle";

// Kanban Board View
function BoardView() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Kanban Board</h2>
          <p className="text-sm text-muted-foreground">
            Gestiona tus tareas con drag & drop
          </p>
        </div>
      </div>
      <KanbanBoard />
    </div>
  );
}

function AuditView() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Log de Auditoría</h2>
        <p className="text-sm text-muted-foreground">
          Historial completo de cambios con diff antes/después
        </p>
      </div>
      <AuditTable />
    </div>
  );
}

function GodModeView() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <RiShieldStarLine className="h-7 w-7 text-primary" />
        <div>
          <h2 className="text-2xl font-bold">Modo Dios</h2>
          <p className="text-sm text-muted-foreground">
            Evalúa tareas con rúbrica y observaciones
          </p>
        </div>
      </div>
      <GodModePanel />
    </div>
  );
}

function MainContent() {
  const { state, setGodModeEnabled } = useApp();
  const [activeTab, setActiveTab] = useState("board");

  // If god mode is disabled and user is on god-mode tab, switch to board
  if (!state.godModeEnabled && activeTab === "god-mode") {
    setActiveTab("board");
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <RiTargetLine className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-2xl font-bold tracking-tight">
                Kanban God
              </h1>
              <p className="text-sm text-muted-foreground">
                Advanced Task Management with Audit Logs
              </p>
            </div>
          </div>

          {/* Import/Export, God Mode Switch & Theme Toggle */}
          <div className="flex items-center gap-4">
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="god-mode-switch"
                    checked={state.godModeEnabled}
                    onCheckedChange={setGodModeEnabled}
                    aria-label="Toggle God Mode"
                  />
                  <Label
                    htmlFor="god-mode-switch"
                    className="cursor-pointer text-sm font-medium flex items-center gap-1.5"
                  >
                    <RiShieldStarLine className="h-4 w-4" />
                    God Mode
                  </Label>
                </div>
              </TooltipTrigger>
              <TooltipContent>Activa o desactiva el Modo Dios</TooltipContent>
            </Tooltip>
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Main Content with Tabs */}
      <main className="container mx-auto px-6 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="mb-6 gap-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <TabsTrigger
                  value="board"
                  className={cn(
                    "gap-2",
                    activeTab !== "board" &&
                      "hover:bg-primary/20 hover:text-foreground",
                    activeTab === "board" &&
                      "bg-primary text-primary-foreground shadow-sm ring-1 ring-primary/20"
                  )}
                >
                  <RiDashboardLine className="h-4 w-4" />
                  Board
                </TabsTrigger>
              </TooltipTrigger>
              <TooltipContent>Ver el tablero Kanban</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <TabsTrigger
                  value="audit"
                  className={cn(
                    "gap-2",
                    activeTab !== "audit" &&
                      "hover:bg-primary/20 hover:text-foreground",
                    activeTab === "audit" &&
                      "bg-primary text-primary-foreground shadow-sm ring-1 ring-primary/20"
                  )}
                >
                  <RiFileTextLine className="h-4 w-4" />
                  Auditoría
                </TabsTrigger>
              </TooltipTrigger>
              <TooltipContent>Ver el historial de cambios</TooltipContent>
            </Tooltip>
            {state.godModeEnabled && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <TabsTrigger
                    value="god-mode"
                    className={cn(
                      "gap-2",
                      activeTab !== "god-mode" &&
                        "hover:bg-primary/20 hover:text-foreground",
                      activeTab === "god-mode" &&
                        "bg-primary text-primary-foreground shadow-sm ring-1 ring-primary/20"
                    )}
                  >
                    <RiStarLine className="h-4 w-4" />
                    God Mode
                  </TabsTrigger>
                </TooltipTrigger>
                <TooltipContent>Evaluar tareas con rúbrica</TooltipContent>
              </Tooltip>
            )}
          </TabsList>

          <TabsContent value="board">
            <BoardView />
          </TabsContent>

          <TabsContent value="audit">
            <AuditView />
          </TabsContent>

          {state.godModeEnabled && (
            <TabsContent value="god-mode">
              <GodModeView />
            </TabsContent>
          )}
        </Tabs>
      </main>
    </div>
  );
}

export default function Page() {
  return (
    <AppProvider>
      <MainContent />
    </AppProvider>
  );
}
