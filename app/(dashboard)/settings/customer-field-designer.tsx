"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  DndContext,
  PointerSensor,
  useDroppable,
  useDraggable,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  horizontalListSortingStrategy,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { PlusCircle, GripVertical, Trash2, Plus, Eye } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

type FieldType = "text" | "select" | "number" | "date";

interface FieldDefinition {
  id: string;
  label: string;
  defaultType: FieldType;
  isCustom?: boolean;
}

interface DesignerCell {
  id: string;
  fieldId: string;
  label: string;
  type: FieldType;
  span: 1 | 2 | 3;
}

interface DesignerRow {
  id: string;
  fields: DesignerCell[];
}

type DragData =
  | { type: "palette"; fieldId: string }
  | { type: "row"; rowId: string }
  | { type: "cell"; cellId: string; rowId: string };

type DropData =
  | { type: "row"; rowId: string }
  | { type: "cell"; cellId: string; rowId: string }
  | { type: "row-drop"; rowId: string };

const DEFAULT_FIELD_LIBRARY: FieldDefinition[] = [
  { id: "customer-name", label: "고객명", defaultType: "text" },
  { id: "customer-id", label: "고객 ID", defaultType: "text" },
  { id: "phone-number", label: "연락처", defaultType: "text" },
  { id: "email", label: "이메일", defaultType: "text" },
  { id: "customer-tier", label: "고객 등급", defaultType: "select" },
  { id: "membership-date", label: "가입일", defaultType: "date" },
  { id: "region", label: "지역", defaultType: "select" },
  { id: "last-contact", label: "최근 상담일", defaultType: "date" },
  { id: "preferred-channel", label: "선호 채널", defaultType: "select" },
];

const FIELD_TYPE_OPTIONS: { value: FieldType; label: string }[] = [
  { value: "text", label: "텍스트" },
  { value: "select", label: "선택" },
  { value: "number", label: "숫자" },
  { value: "date", label: "날짜" },
];

const SPAN_OPTIONS: { value: 1 | 2 | 3; label: string }[] = [
  { value: 1, label: "1칸" },
  { value: 2, label: "2칸" },
  { value: 3, label: "3칸" },
];

export function CustomerFieldDesigner() {
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));
  const [rows, setRows] = useState<DesignerRow[]>([{ id: "row-1", fields: [] }]);
  const [fieldLibrary, setFieldLibrary] = useState<FieldDefinition[]>(DEFAULT_FIELD_LIBRARY);
  const [availableFieldIds, setAvailableFieldIds] = useState<string[]>(() =>
    fieldLibrary.map((field) => field.id),
  );
  const rowCounterRef = useRef(2);
  const customFieldCounterRef = useRef(1);

  const fieldMap = useMemo(() => {
    const map = new Map<string, FieldDefinition>();
    fieldLibrary.forEach((field) => map.set(field.id, field));
    return map;
  }, [fieldLibrary]);

  useEffect(() => {
    if (!rows.length) {
      setRows([{ id: "row-1", fields: [] }]);
    }
  }, [rows.length]);

  const addRow = useCallback(() => {
    setRows((prev) => [...prev, { id: `row-${rowCounterRef.current++}`, fields: [] }]);
  }, []);

  const removeRow = useCallback((rowId: string) => {
    setRows((prev) => {
      if (prev.length <= 1) return prev;
      const target = prev.find((row) => row.id === rowId);
      if (!target || target.fields.length > 0) return prev;
      return prev.filter((row) => row.id !== rowId);
    });
  }, []);

  const normalizeRows = useCallback(
    (draft: DesignerRow[]) => {
      const next = draft.map((row) => ({ ...row, fields: [...row.fields] }));
      for (let i = 0; i < next.length; i += 1) {
        const row = next[i];
        let spanTotal = row.fields.reduce((total, cell) => total + cell.span, 0);
        while (spanTotal > 3) {
          const overflow = row.fields.pop();
          if (!overflow) break;
          if (!next[i + 1]) {
            next.splice(i + 1, 0, { id: `row-${rowCounterRef.current++}`, fields: [] });
          }
          next[i + 1].fields.unshift(overflow);
          spanTotal = row.fields.reduce((total, cell) => total + cell.span, 0);
        }
      }
      const filtered = next.filter((row, index) => row.fields.length > 0 || index === 0 || next[index - 1].fields.length > 0);
      if (!filtered.length) {
        return [{ id: `row-${rowCounterRef.current++}`, fields: [] }];
      }
      return filtered;
    },
    [],
  );

  const handleAddField = useCallback(
    (fieldId: string, targetRowId: string, position?: number) => {
      let added = false;
      setRows((prev) => {
        const fieldDefinition = fieldMap.get(fieldId);
        if (!fieldDefinition) return prev;
        const alreadyUsed = prev.some((row) =>
          row.fields.some((cell) => cell.fieldId === fieldId),
        );
        if (alreadyUsed) return prev;

        const next = prev.map((row) => ({ ...row, fields: [...row.fields] }));
        const targetRow = next.find((row) => row.id === targetRowId);
        if (!targetRow) return prev;

        const insertIndex = position === undefined ? targetRow.fields.length : position;
        const newCell: DesignerCell = {
          id: fieldId,
          fieldId,
          label: fieldDefinition.label,
          type: fieldDefinition.defaultType,
          span: 1,
        };
        targetRow.fields.splice(insertIndex, 0, newCell);
        added = true;
        return normalizeRows(next);
      });

      if (added) {
        setAvailableFieldIds((ids) => ids.filter((id) => id !== fieldId));
      }
    },
    [fieldMap, normalizeRows],
  );

  const handleRemoveField = useCallback((rowId: string, cellId: string) => {
    setRows((prev) => {
      const next = prev.map((row) => ({ ...row, fields: [...row.fields] }));
      const row = next.find((candidate) => candidate.id === rowId);
      if (!row) return prev;
      const index = row.fields.findIndex((cell) => cell.id === cellId);
      if (index === -1) return prev;
      const [removed] = row.fields.splice(index, 1);
      setAvailableFieldIds((ids) =>
        ids.includes(removed.fieldId) ? ids : [...ids, removed.fieldId],
      );
      
      // 커스텀 필드인 경우 필드 라이브러리에서도 삭제
      const fieldDef = fieldLibrary.find(f => f.id === removed.fieldId);
      if (fieldDef?.isCustom) {
        setFieldLibrary((prev) => prev.filter((f) => f.id !== removed.fieldId));
      }
      
      const cleaned = normalizeRows(next);
      return cleaned.length ? cleaned : [{ id: `row-${rowCounterRef.current++}`, fields: [] }];
    });
  }, [normalizeRows, fieldLibrary]);

  const handleUpdateCellType = useCallback((rowId: string, cellId: string, type: FieldType) => {
    setRows((prev) => {
      const next = prev.map((row) => ({ ...row, fields: [...row.fields] }));
      const row = next.find((candidate) => candidate.id === rowId);
      if (!row) return prev;
      const cell = row.fields.find((candidate) => candidate.id === cellId);
      if (!cell) return prev;
      cell.type = type;
      return next;
    });
  }, []);

  const handleUpdateCellSpan = useCallback(
    (rowId: string, cellId: string, span: 1 | 2 | 3) => {
      setRows((prev) => {
        const next = prev.map((row) => ({ ...row, fields: [...row.fields] }));
        const row = next.find((candidate) => candidate.id === rowId);
        if (!row) return prev;
        const cell = row.fields.find((candidate) => candidate.id === cellId);
        if (!cell) return prev;
        cell.span = span;
        return normalizeRows(next);
      });
    },
    [normalizeRows],
  );

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      if (!over) return;

      const activeData = active.data.current as DragData | undefined;
      const overData = over.data.current as DropData | undefined;
      if (!activeData || !overData) return;

      if (activeData.type === "row" && overData.type === "row" && active.id !== over.id) {
        setRows((prev) => {
          const oldIndex = prev.findIndex((row) => row.id === activeData.rowId);
          const newIndex = prev.findIndex((row) => row.id === overData.rowId);
          if (oldIndex === -1 || newIndex === -1) return prev;
          return arrayMove(prev, oldIndex, newIndex);
        });
        return;
      }

      if (activeData.type === "cell") {
        const sourceRowId = activeData.rowId;
        const targetRowId = overData.rowId;
        if (!targetRowId) return;

        setRows((prev) => {
          const next = prev.map((row) => ({ ...row, fields: [...row.fields] }));
          const sourceRow = next.find((row) => row.id === sourceRowId);
          const targetRow = next.find((row) => row.id === targetRowId);
          if (!sourceRow || !targetRow) return prev;

          const fromIndex = sourceRow.fields.findIndex((field) => field.id === activeData.cellId);
          if (fromIndex === -1) return prev;
          const [moved] = sourceRow.fields.splice(fromIndex, 1);

          let toIndex: number;
          if (overData.type === "cell") {
            toIndex = targetRow.fields.findIndex((field) => field.id === overData.cellId);
            if (toIndex === -1) {
              toIndex = targetRow.fields.length;
            }
            if (sourceRow === targetRow && toIndex > fromIndex) {
              toIndex -= 1;
            }
          } else {
            toIndex = targetRow.fields.length;
          }

          targetRow.fields.splice(toIndex, 0, moved);
          return normalizeRows(next);
        });
        return;
      }

      if (activeData.type === "palette") {
        const targetRowId = overData.rowId;
        if (!targetRowId) return;

        let insertPosition: number | undefined;
        if (overData.type === "cell") {
          const targetRow = rows.find((candidate) => candidate.id === targetRowId);
          if (targetRow) {
            const position = targetRow.fields.findIndex(
              (field) => field.id === overData.cellId,
            );
            insertPosition = position === -1 ? targetRow.fields.length : position;
          }
        }
        handleAddField(activeData.fieldId, targetRowId, insertPosition);
      }
    },
    [handleAddField, normalizeRows, rows],
  );

  const handleAddFieldInline = useCallback(
    (fieldId: string) => {
      const targetRow = rows[rows.length - 1]?.id ?? "row-1";
      handleAddField(fieldId, targetRow);
    },
    [handleAddField, rows],
  );
  
  const handleAddCustomField = useCallback((label: string, type: FieldType) => {
    const fieldId = `custom-field-${customFieldCounterRef.current++}`;
    const newField: FieldDefinition = {
      id: fieldId,
      label,
      defaultType: type,
      isCustom: true,
    };
    setFieldLibrary((prev) => [...prev, newField]);
    setAvailableFieldIds((prev) => [...prev, fieldId]);
  }, []);

  const rowsForSortable = rows.map((row) => row.id);

  return (
    <>
      <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
        <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
          <FieldPalette
            availableFieldIds={availableFieldIds}
            fieldLibrary={fieldLibrary}
            onAddField={handleAddFieldInline}
            onAddCustomField={handleAddCustomField}
          />
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">필드 구성</h3>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsPreviewOpen(true)}
                  className="gap-2"
                >
                  <Eye className="size-4" aria-hidden="true" /> 미리보기
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addRow}
                  className="gap-2"
                >
                  <PlusCircle className="size-4" aria-hidden="true" /> 행 추가
                </Button>
              </div>
            </div>
          <SortableContext items={rowsForSortable} strategy={verticalListSortingStrategy}>
            <div className="space-y-3">
              {rows.map((row, index) => (
                <DesignerRowCard
                  key={row.id}
                  row={row}
                  index={index}
                  onRemoveRow={removeRow}
                  onRemoveField={handleRemoveField}
                  onUpdateFieldType={handleUpdateCellType}
                  onUpdateFieldSpan={handleUpdateCellSpan}
                />
              ))}
            </div>
          </SortableContext>
        </div>
      </div>
    </DndContext>

    <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>고객정보필드 미리보기</DialogTitle>
          <DialogDescription>
            구성된 필드가 실제로 어떻게 표시되는지 미리 확인할 수 있습니다.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          {rows.map((row, rowIndex) => (
            <div key={row.id} className="grid grid-cols-3 gap-3">
              {row.fields.map((field) => {
                const spanClass = field.span === 3 ? "col-span-3" : field.span === 2 ? "col-span-2" : "col-span-1";
                return (
                  <div key={field.id} className={spanClass}>
                    <Label htmlFor={`preview-${field.id}`} className="text-sm font-medium">
                      {field.label}
                    </Label>
                    {field.type === "text" && (
                      <Input
                        id={`preview-${field.id}`}
                        type="text"
                        placeholder={`${field.label} 입력`}
                        className="mt-1"
                      />
                    )}
                    {field.type === "number" && (
                      <Input
                        id={`preview-${field.id}`}
                        type="number"
                        placeholder="0"
                        className="mt-1"
                      />
                    )}
                    {field.type === "date" && (
                      <Input
                        id={`preview-${field.id}`}
                        type="date"
                        className="mt-1"
                      />
                    )}
                    {field.type === "select" && (
                      <Select>
                        <SelectTrigger id={`preview-${field.id}`} className="mt-1">
                          <SelectValue placeholder="선택하세요" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="option1">옵션 1</SelectItem>
                          <SelectItem value="option2">옵션 2</SelectItem>
                          <SelectItem value="option3">옵션 3</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
          {(rows.length === 0 || rows.every(row => row.fields.length === 0)) && (
            <div className="text-center py-12 text-muted-foreground">
              아직 구성된 필드가 없습니다.
            </div>
          )}
        </div>
        <DialogFooter>
          <Button onClick={() => setIsPreviewOpen(false)}>닫기</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
    </>
  );
}

interface FieldPaletteProps {
  availableFieldIds: string[];
  fieldLibrary: FieldDefinition[];
  onAddField: (fieldId: string) => void;
  onAddCustomField: (label: string, type: FieldType) => void;
}

function FieldPalette({ availableFieldIds, fieldLibrary, onAddField, onAddCustomField }: FieldPaletteProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [customFieldLabel, setCustomFieldLabel] = useState("");
  const [customFieldType, setCustomFieldType] = useState<FieldType>("text");
  
  const availableFields = fieldLibrary.filter((field) =>
    availableFieldIds.includes(field.id),
  );

  const handleCreateCustomField = () => {
    if (customFieldLabel.trim()) {
      onAddCustomField(customFieldLabel.trim(), customFieldType);
      setCustomFieldLabel("");
      setCustomFieldType("text");
      setIsDialogOpen(false);
    }
  };

  return (
    <div className="rounded-lg border bg-card p-4 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-base font-semibold">필드 라이브러리</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            원하는 필드를 끌어 행에 배치하거나 클릭해 추가하세요.
          </p>
        </div>
      </div>
      
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm" className="w-full mb-3">
            <Plus className="mr-2 h-4 w-4" />
            커스텀 필드 추가
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>커스텀 필드 추가</DialogTitle>
            <DialogDescription>
              새로운 필드를 만들어 라이브러리에 추가합니다.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="field-label">필드 이름</Label>
              <Input
                id="field-label"
                value={customFieldLabel}
                onChange={(e) => setCustomFieldLabel(e.target.value)}
                placeholder="예: 주소"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="field-type">필드 유형</Label>
              <Select value={customFieldType} onValueChange={(value) => setCustomFieldType(value as FieldType)}>
                <SelectTrigger id="field-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {FIELD_TYPE_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              취소
            </Button>
            <Button onClick={handleCreateCustomField} disabled={!customFieldLabel.trim()}>
              추가
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      <div className="grid gap-2">
        {availableFields.length === 0 ? (
          <div className="rounded-md border border-dashed p-4 text-center text-sm text-muted-foreground">
            모든 필드를 배치했습니다.
          </div>
        ) : (
          availableFields.map((field) => (
            <PaletteItem key={field.id} field={field} onAddField={onAddField} />
          ))
        )}
      </div>
    </div>
  );
}

function PaletteItem({
  field,
  onAddField,
}: {
  field: FieldDefinition;
  onAddField: (fieldId: string) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `palette-${field.id}`,
    data: { type: "palette", fieldId: field.id } satisfies DragData,
  });

  const style = {
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0.6 : undefined,
  };

  return (
    <button
      type="button"
      ref={setNodeRef}
      style={style}
      className="flex items-center justify-between rounded-md border bg-background px-3 py-2 text-sm hover:bg-muted"
      onClick={() => onAddField(field.id)}
      {...listeners}
      {...attributes}
    >
      <span className="font-medium">{field.label}</span>
      <div className="flex items-center gap-2">
        {field.isCustom && (
          <span className="text-xs px-1.5 py-0.5 rounded bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400">
            커스텀
          </span>
        )}
        <span className="text-xs text-muted-foreground">기본 {field.defaultType}</span>
      </div>
    </button>
  );
}

interface DesignerRowCardProps {
  row: DesignerRow;
  index: number;
  onRemoveRow: (rowId: string) => void;
  onRemoveField: (rowId: string, cellId: string) => void;
  onUpdateFieldType: (rowId: string, cellId: string, type: FieldType) => void;
  onUpdateFieldSpan: (rowId: string, cellId: string, span: 1 | 2 | 3) => void;
}

function DesignerRowCard({
  row,
  index,
  onRemoveRow,
  onRemoveField,
  onUpdateFieldType,
  onUpdateFieldSpan,
}: DesignerRowCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: row.id, data: { type: "row", rowId: row.id } satisfies DragData });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.75 : undefined,
  };
  
  // Row의 총 span 계산
  const totalSpan = row.fields.reduce((sum, field) => sum + field.span, 0);
  const isRowFull = totalSpan >= 3;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="space-y-3 rounded-lg border bg-background p-4 shadow-sm"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-medium">
          <button
            type="button"
            className="flex size-7 items-center justify-center rounded-md border bg-muted text-muted-foreground"
            {...listeners}
            {...attributes}
            aria-label={`Row ${index + 1} 이동`}
          >
            <GripVertical className="size-4" aria-hidden="true" />
          </button>
          <span>Row {index + 1}</span>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          disabled={row.fields.length > 0}
          onClick={() => onRemoveRow(row.id)}
          aria-label="행 삭제"
        >
          <Trash2 className="size-4" aria-hidden="true" />
        </Button>
      </div>
      <SortableContext items={row.fields.map((field) => field.id)} strategy={horizontalListSortingStrategy}>
        <div className="grid grid-cols-3 gap-3">
          {row.fields.map((cell) => (
            <DesignerCellCard
              key={cell.id}
              rowId={row.id}
              cell={cell}
              onRemoveField={onRemoveField}
              onUpdateFieldType={onUpdateFieldType}
              onUpdateFieldSpan={onUpdateFieldSpan}
            />
          ))}
          {!isRowFull && <RowDropZone rowId={row.id} />}
        </div>
      </SortableContext>
    </div>
  );
}

function DesignerCellCard({
  rowId,
  cell,
  onRemoveField,
  onUpdateFieldType,
  onUpdateFieldSpan,
}: {
  rowId: string;
  cell: DesignerCell;
  onRemoveField: (rowId: string, cellId: string) => void;
  onUpdateFieldType: (rowId: string, cellId: string, type: FieldType) => void;
  onUpdateFieldSpan: (rowId: string, cellId: string, span: 1 | 2 | 3) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: cell.id, data: { type: "cell", cellId: cell.id, rowId } satisfies DragData });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.8 : undefined,
  };

  const spanClass = cell.span === 3 ? "col-span-3" : cell.span === 2 ? "col-span-2" : "col-span-1";

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`${spanClass} flex flex-col rounded-md border bg-card p-3 shadow-sm`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="flex size-7 items-center justify-center rounded-md border bg-muted text-muted-foreground"
            {...listeners}
            {...attributes}
            aria-label={`${cell.label} 이동`}
          >
            <GripVertical className="size-4" aria-hidden="true" />
          </button>
          <span className="text-sm font-semibold">{cell.label}</span>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={() => onRemoveField(rowId, cell.id)}
          aria-label={`${cell.label} 삭제`}
        >
          <Trash2 className="size-4" aria-hidden="true" />
        </Button>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <span className="text-xs font-medium text-muted-foreground">필드 유형</span>
          <Select
            value={cell.type}
            onValueChange={(value) => onUpdateFieldType(rowId, cell.id, value as FieldType)}
          >
            <SelectTrigger className="h-9">
              <SelectValue placeholder="유형 선택" />
            </SelectTrigger>
            <SelectContent>
              {FIELD_TYPE_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <span className="text-xs font-medium text-muted-foreground">칸 폭</span>
          <Select
            value={String(cell.span)}
            onValueChange={(value) =>
              onUpdateFieldSpan(rowId, cell.id, Number(value) as 1 | 2 | 3)
            }
          >
            <SelectTrigger className="h-9">
              <SelectValue placeholder="칸 선택" />
            </SelectTrigger>
            <SelectContent>
              {SPAN_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={String(option.value)}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}

function RowDropZone({ rowId }: { rowId: string }) {
  const { isOver, setNodeRef } = useDroppable({
    id: `row-drop-${rowId}`,
    data: { type: "row-drop", rowId } satisfies DropData,
  });

  return (
    <div
      ref={setNodeRef}
      className={`col-span-3 flex h-16 items-center justify-center rounded-md border border-dashed text-sm text-muted-foreground transition ${
        isOver ? "border-primary bg-primary/5 text-primary" : "border-border/60"
      }`}
    >
      필드를 여기로 끌어 놓거나 추가하세요
    </div>
  );
}