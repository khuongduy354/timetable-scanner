import { useState } from "react";
import { useDrag } from "react-dnd";
import { type TimeRange } from "../../TesseractScanner/extractTimeRange";
import { type Box, ItemTypes, formatTimeRange } from "../../types/DragDrop";

interface DraggableBoxProps {
  box: Box;
  onDrop: (item: any, areaId: string) => void;
  onDelete: (boxId: string) => void;
  onEdit: (boxId: string, content: TimeRange) => void;
}

export const DraggableBox = ({
  box,
  onDrop,
  onDelete,
  onEdit,
}: DraggableBoxProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState(box.content);
  const [{ isDragging }, drag] = useDrag(() => ({
    type: ItemTypes.BOX,
    item: box,
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  }));

  const handleSave = () => {
    onEdit(box.id, editedContent);
    setIsEditing(false);
  };

  return (
    <div
      ref={drag}
      style={{
        opacity: isDragging ? 0.5 : 1,
        padding: "1rem",
        margin: "0.5rem",
        backgroundColor: "white",
        border: "1px solid #ddd",
        cursor: "move",
        wordWrap: "break-word",
        whiteSpace: "pre-wrap",
        maxWidth: "100%",
        overflow: "hidden",
      }}
    >
      {isEditing ? (
        <div>
          <input
            type="text"
            value={editedContent.day}
            onChange={(e) =>
              setEditedContent({ ...editedContent, day: e.target.value })
            }
            placeholder="Day"
          />
          <input
            type="text"
            value={editedContent.start}
            onChange={(e) =>
              setEditedContent({ ...editedContent, start: e.target.value })
            }
            placeholder="Start time"
          />
          <input
            type="text"
            value={editedContent.end}
            onChange={(e) =>
              setEditedContent({ ...editedContent, end: e.target.value })
            }
            placeholder="End time"
          />
          <button onClick={handleSave}>Save</button>
          <button onClick={() => setIsEditing(false)}>Cancel</button>
        </div>
      ) : (
        <div>
          {formatTimeRange(box.content)}
          <div>
            <button onClick={() => setIsEditing(true)}>Edit</button>
            <button onClick={() => onDelete(box.id)}>Delete</button>
          </div>
        </div>
      )}
    </div>
  );
};
