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
      ref={drag as unknown as React.LegacyRef<HTMLDivElement>}
      style={{
        padding: "6px",
        backgroundColor: isDragging ? "#f0f0f0" : "#e9ecef",
        border: "1px solid #dee2e6",
        borderRadius: "4px",
        cursor: "move",
        opacity: isDragging ? 0.5 : 1,
        fontSize: "12px",
        position: "relative",
        display: "flex",
        alignItems: "center",
        gap: "4px",
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
        <div style={{ flex: 1 }}>
          {box.content.day} {box.content.start}-{box.content.end}
          <div style={{ display: "flex", gap: "4px" }}>
            <button
              onClick={() => setIsEditing(true)}
              style={{
                border: "none",
                background: "none",
                padding: "2px",
                cursor: "pointer",
                fontSize: "12px",
              }}
              title="Edit"
            >
              ✎
            </button>
            <button
              onClick={() => onDelete(box.id)}
              style={{
                border: "none",
                background: "none",
                padding: "2px",
                cursor: "pointer",
                fontSize: "12px",
                color: "#dc3545",
              }}
              title="Delete"
            >
              ×
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
