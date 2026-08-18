import { useCallback, useEffect, useRef, useState } from "react";

export type ColumnKey =
  | "select"
  | "created_at"
  | "name"
  | "phone"
  | "source"
  | "ad_source"
  | "status"
  | "location"
  | "sales_person"
  | "follow_up"
  | "actions";

export const DEFAULT_COLUMN_WIDTHS: Record<ColumnKey, number> = {
  select: 38,
  created_at: 95,
  name: 180,
  phone: 110,
  source: 95,
  ad_source: 105,
  status: 125,
  location: 105,
  sales_person: 140,
  follow_up: 95,
  actions: 85,
};

export const MIN_COLUMN_WIDTHS: Partial<Record<ColumnKey, number>> = {
  created_at: 70,
  name: 100,
  phone: 80,
  source: 70,
  ad_source: 80,
  status: 90,
  location: 80,
  sales_person: 100,
  follow_up: 75,
};

export const MAX_COLUMN_WIDTHS: Partial<Record<ColumnKey, number>> = {
  created_at: 200,
  name: 400,
  phone: 220,
  source: 200,
  ad_source: 220,
  status: 250,
  location: 250,
  sales_person: 300,
  follow_up: 200,
};

const STORAGE_KEY = "crm_leads_col_widths_v3";

export function useTableColumnResize() {
  const [columnWidths, setColumnWidths] = useState<Record<ColumnKey, number>>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        return { ...DEFAULT_COLUMN_WIDTHS, ...parsed };
      }
    } catch (e) {
      console.warn("Failed to load saved column widths from localStorage:", e);
    }
    return DEFAULT_COLUMN_WIDTHS;
  });

  const [resizingCol, setResizingCol] = useState<ColumnKey | null>(null);
  const startXRef = useRef(0);
  const startWidthRef = useRef(0);
  const activeColRef = useRef<ColumnKey | null>(null);
  const currentWidthsRef = useRef(columnWidths);

  useEffect(() => {
    currentWidthsRef.current = columnWidths;
  }, [columnWidths]);

  const saveWidths = useCallback((widths: Record<ColumnKey, number>) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(widths));
    } catch (e) {
      console.warn("Failed to save column widths to localStorage:", e);
    }
  }, []);

  const resetAllWidths = useCallback(() => {
    setColumnWidths(DEFAULT_COLUMN_WIDTHS);
    saveWidths(DEFAULT_COLUMN_WIDTHS);
  }, [saveWidths]);

  const resetColumnWidth = useCallback((col: ColumnKey) => {
    setColumnWidths((prev) => {
      const next = { ...prev, [col]: DEFAULT_COLUMN_WIDTHS[col] };
      saveWidths(next);
      return next;
    });
  }, [saveWidths]);

  const onMouseDownResize = useCallback((col: ColumnKey, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    activeColRef.current = col;
    startXRef.current = e.clientX;
    startWidthRef.current = currentWidthsRef.current[col] || DEFAULT_COLUMN_WIDTHS[col];
    setResizingCol(col);

    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";

    const onMouseMove = (moveEvent: MouseEvent) => {
      if (!activeColRef.current) return;
      const currentCol = activeColRef.current;
      const deltaX = moveEvent.clientX - startXRef.current;
      const minW = MIN_COLUMN_WIDTHS[currentCol] || 60;
      const maxW = MAX_COLUMN_WIDTHS[currentCol] || 500;
      const newWidth = Math.max(minW, Math.min(maxW, Math.round(startWidthRef.current + deltaX)));

      setColumnWidths((prev) => ({
        ...prev,
        [currentCol]: newWidth,
      }));
    };

    const onMouseUp = () => {
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);

      if (activeColRef.current) {
        saveWidths(currentWidthsRef.current);
      }
      activeColRef.current = null;
      setResizingCol(null);
    };

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
  }, [saveWidths]);

  return {
    columnWidths,
    resizingCol,
    onMouseDownResize,
    resetColumnWidth,
    resetAllWidths,
  };
}
