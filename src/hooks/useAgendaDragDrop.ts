import { useState, useCallback } from "react";
import { format } from "date-fns";
import { Visit } from "@/data/mock-data";

export interface PendingDrop {
  visitId: string;
  newDate: string;
  day: Date;
}

export function useAgendaDragDrop(visits: Visit[]) {
  const [draggedVisitId, setDraggedVisitId] = useState<string | null>(null);
  const [dragOverDay, setDragOverDay] = useState<string | null>(null);
  const [hasDragged, setHasDragged] = useState(false);
  const [pendingDrop, setPendingDrop] = useState<PendingDrop | null>(null);

  const handleDragStart = useCallback((e: React.DragEvent, visitId: string) => {
    setDraggedVisitId(visitId);
    setHasDragged(true);
    e.dataTransfer.effectAllowed = "move";
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent, dayStr: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOverDay(dayStr);
  }, []);

  const handleDragLeave = useCallback(() => {
    setDragOverDay(null);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent, day: Date) => {
      e.preventDefault();
      setDragOverDay(null);
      if (!draggedVisitId) return;
      const newDate = format(day, "yyyy-MM-dd");
      const visit = visits.find((v) => v.id === draggedVisitId);
      if (!visit || visit.date === newDate) {
        setDraggedVisitId(null);
        return;
      }
      setPendingDrop({ visitId: draggedVisitId, newDate, day });
      setDraggedVisitId(null);
    },
    [draggedVisitId, visits],
  );

  const handleDragEnd = useCallback(() => {
    setDraggedVisitId(null);
    setDragOverDay(null);
  }, []);

  const clearPendingDrop = useCallback(() => {
    setPendingDrop(null);
  }, []);

  const consumeDrag = useCallback(() => {
    if (hasDragged) {
      setHasDragged(false);
      return true; // was dragged — caller should skip click
    }
    return false;
  }, [hasDragged]);

  return {
    draggedVisitId,
    dragOverDay,
    pendingDrop,
    handleDragStart,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    handleDragEnd,
    clearPendingDrop,
    consumeDrag,
  };
}
