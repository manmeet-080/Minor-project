'use client';

import { DndContext, DragEndEvent, closestCorners } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface KanbanItem {
  id: string;
  title: string;
  subtitle?: string;
  priority?: string;
  assignee?: string;
}

interface KanbanColumn {
  id: string;
  title: string;
  color: string;
  items: KanbanItem[];
}

interface KanbanBoardProps {
  columns: KanbanColumn[];
  onDragEnd: (itemId: string, newColumnId: string) => void;
}

function KanbanCard({ item }: { item: KanbanItem }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: item.id });
  const style = { transform: CSS.Transform.toString(transform), transition };

  const priorityColors: Record<string, string> = {
    LOW: 'bg-muted text-muted-foreground',
    MEDIUM: 'bg-accent/20 text-accent-foreground',
    HIGH: 'bg-warning/20 text-warning',
    URGENT: 'bg-destructive/10 text-destructive',
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <Card className="rounded-lg cursor-grab active:cursor-grabbing hover:shadow-md transition-shadow">
        <CardContent className="p-3 space-y-2">
          <p className="text-sm font-medium leading-tight">{item.title}</p>
          {item.subtitle && <p className="text-xs text-muted-foreground">{item.subtitle}</p>}
          <div className="flex items-center justify-between">
            {item.priority && (
              <Badge variant="secondary" className={cn('text-[10px]', priorityColors[item.priority])}>
                {item.priority}
              </Badge>
            )}
            {item.assignee && (
              <span className="text-[10px] text-muted-foreground">{item.assignee}</span>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export function KanbanBoard({ columns, onDragEnd }: KanbanBoardProps) {
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;

    const itemId = active.id as string;
    const overColumn = columns.find((col) => col.items.some((item) => item.id === over.id));
    if (overColumn) {
      onDragEnd(itemId, overColumn.id);
    }
  };

  return (
    <DndContext collisionDetection={closestCorners} onDragEnd={handleDragEnd}>
      <div className="flex gap-4 overflow-x-auto pb-4">
        {columns.map((column) => (
          <div key={column.id} className="min-w-[280px] flex-1">
            <div className="flex items-center gap-2 mb-3">
              <div className="h-2 w-2 rounded-full" style={{ backgroundColor: column.color }} />
              <h3 className="text-sm font-medium">{column.title}</h3>
              <Badge variant="secondary" className="text-[10px]">
                {column.items.length}
              </Badge>
            </div>
            <SortableContext items={column.items.map((i) => i.id)} strategy={verticalListSortingStrategy}>
              <div className="space-y-2 min-h-[200px] rounded-xl bg-muted/30 p-2">
                {column.items.map((item) => (
                  <KanbanCard key={item.id} item={item} />
                ))}
              </div>
            </SortableContext>
          </div>
        ))}
      </div>
    </DndContext>
  );
}
