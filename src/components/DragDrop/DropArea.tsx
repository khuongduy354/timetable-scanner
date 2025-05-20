import { useDrop } from "react-dnd";
import { type TimeRange } from "../../TesseractScanner/extractTimeRange";
import { type Area, type Box, ItemTypes } from "../../types/DragDrop";
import { DraggableBox } from "./DraggableBox";

interface DropAreaProps {
  area: Area;
  onDrop: (item: any, areaId: string) => void;
  onDelete: (boxId: string) => void;
  onEdit: (boxId: string, content: TimeRange) => void;
}

export const DropArea = ({ area, onDrop, onDelete, onEdit }: DropAreaProps) => {
  const [{ isOver }, drop] = useDrop(() => ({
    accept: ItemTypes.BOX,
    drop: (item: Box, monitor) => {
      // Prevent default drop behavior
      if (monitor.didDrop()) {
        return;
      }
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
        width: 200,
        minHeight: 300,
        padding: "1rem",
        border: "1px solid #999",
        backgroundColor: isOver ? "#f0f0f0" : "white",
        margin: "1rem",
      }}
    >
      <h3>{area.id}</h3>
      {area.boxes.map((box) => (
        <DraggableBox
          key={box.id}
          box={box}
          onDrop={onDrop}
          onDelete={onDelete}
          onEdit={onEdit}
        />
      ))}
    </div>
  );
};
