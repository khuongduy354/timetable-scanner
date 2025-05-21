import { useDrop } from "react-dnd";
import { DraggableBox } from "./DraggableBox";
import { type Area, type Box } from "../../types/DragDrop";

interface DropAreaProps {
  area: Area;
  onDrop: (item: Box, targetAreaId: string) => void;
  onDelete: (boxId: string) => void;
  onEdit: (boxId: string, newContent: any) => void;
  onAreaDelete?: (areaId: string) => void;
}

export function DropArea({
  area,
  onDrop,
  onDelete,
  onEdit,
  onAreaDelete,
}: DropAreaProps) {
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
        minHeight: "200px", // Increased from 100px
        maxHeight: "400px",
        overflowY: "auto",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "10px",
        }}
      >
        <h3 style={{ margin: 0 }}>{area.id}</h3>
        {area.id !== "Source" && onAreaDelete && (
          <button
            onClick={() => onAreaDelete(area.id)}
            style={{
              border: "none",
              background: "none",
              cursor: "pointer",
              fontSize: "16px",
              padding: "5px",
            }}
          >
            ×
          </button>
        )}
      </div>
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
