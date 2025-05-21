import { useDrop } from "react-dnd";
import { DraggableBox } from "./DraggableBox";
import { type Area, type Box } from "../../types/DragDrop";

interface DropAreaProps {
  area: Area;
  onDrop: (item: Box, targetAreaId: string) => void;
  onDelete: (boxId: string) => void;
  onEdit: (boxId: string, newContent: any) => void;
}

export function DropArea({ area, onDrop, onDelete, onEdit }: DropAreaProps) {
  const [{ isOver }, drop] = useDrop(() => ({
    accept: "box",
    drop: (item: Box) => {
      onDrop(item, area.id);
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
    }),
  }));

  return (
    <div
      ref={drop}
      style={{
        padding: "8px",
        backgroundColor: isOver ? "#f0f0f0" : "white",
        border: "1px solid #ccc",
        borderRadius: "4px",
        minHeight: "100px",
      }}
    >
      <h3 style={{ margin: "0 0 8px 0", fontSize: "14px" }}>{area.id}</h3>
      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
        {area.boxes.map((box) => (
          <DraggableBox
            key={box.id}
            box={box}
            onDelete={onDelete}
            onEdit={onEdit}
          />
        ))}
      </div>
    </div>
  );
}
