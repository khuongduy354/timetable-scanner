import { useDrag, useDrop } from "react-dnd";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { useState, forwardRef, useImperativeHandle } from "react";
import { type TimeRange } from "../TesseractScanner/extractTimeRange";

interface Box {
  id: string;
  content: TimeRange;
}

interface Area {
  id: string;
  boxes: Box[];
}

// Define drag item types
const ItemTypes = {
  BOX: "box",
};

const formatTimeRange = (timeRange: TimeRange) => {
  return `${timeRange.day} ${timeRange.start}-${timeRange.end}`;
};

const DraggableBox = ({
  box,
  onDrop,
  onDelete,
  onEdit,
}: {
  box: Box;
  onDrop: (item: any, areaId: string) => void;
  onDelete: (boxId: string) => void;
  onEdit: (boxId: string, content: TimeRange) => void;
}) => {
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

const DropArea = ({
  area,
  onDrop,
  onDelete,
  onEdit,
}: {
  area: Area;
  onDrop: (item: any, areaId: string) => void;
  onDelete: (boxId: string) => void;
  onEdit: (boxId: string, content: TimeRange) => void;
}) => {
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

interface DragDropHandle {
  addBoxToArea: (areaId: string, content: TimeRange) => void;
  getAreasState: () => Area[];
}

const DragDrop = forwardRef<DragDropHandle>((_, ref) => {
  const [areas, setAreas] = useState<Area[]>([
    {
      id: "Source",
      boxes: [],
    },
  ]);

  const [newAreaName, setNewAreaName] = useState("");
  const [selectedAreaId, setSelectedAreaId] = useState("Source");

  const addBoxToArea = (areaId: string, content: TimeRange) => {
    setAreas((prevAreas) =>
      prevAreas.map((area) => {
        if (area.id === areaId) {
          return {
            ...area,
            boxes: [
              ...area.boxes,
              {
                id: `${Date.now()}-${Math.random()}`, // more unique id
                content: content,
              },
            ],
          };
        }
        return area;
      })
    );
  };

  // Example usage:
  // addBoxToArea("Source", "New Box Content");

  const handleAddArea = (e: React.FormEvent) => {
    e.preventDefault();
    if (newAreaName.trim()) {
      setAreas([...areas, { id: newAreaName, boxes: [] }]);
      setNewAreaName("");
    }
  };

  const handleDrop = (item: Box, targetAreaId: string) => {
    setAreas((prevAreas) => {
      const sourceArea = prevAreas.find((area) =>
        area.boxes.some((box) => box.id === item.id)
      );
      if (!sourceArea) return prevAreas;

      // Early return with unchanged state if same area
      if (sourceArea.id === targetAreaId) {
        return prevAreas;
      }

      const newAreas = prevAreas.map((area) => {
        if (area.id === sourceArea.id) {
          return {
            ...area,
            boxes: area.boxes.filter((box) => box.id !== item.id),
          };
        }
        if (area.id === targetAreaId) {
          // Prevent duplicate boxes in the same area
          if (area.boxes.some((box) => box.id === item.id)) {
            return area;
          }
          return {
            ...area,
            boxes: [...area.boxes, item],
          };
        }
        return area;
      });

      return newAreas;
    });
  };

  const handleDeleteBox = (boxId: string) => {
    setAreas((prevAreas) =>
      prevAreas.map((area) => ({
        ...area,
        boxes: area.boxes.filter((box) => box.id !== boxId),
      }))
    );
  };

  const handleEditBox = (boxId: string, newContent: TimeRange) => {
    setAreas((prevAreas) =>
      prevAreas.map((area) => ({
        ...area,
        boxes: area.boxes.map((box) =>
          box.id === boxId ? { ...box, content: newContent } : box
        ),
      }))
    );
  };

  const handleCreateBox = (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const day = (form.elements.namedItem("day") as HTMLInputElement).value;
    const start = (form.elements.namedItem("start") as HTMLInputElement).value;
    const end = (form.elements.namedItem("end") as HTMLInputElement).value;

    if (day && start && end) {
      addBoxToArea(selectedAreaId, { day, start, end });
      form.reset();
    }
  };

  useImperativeHandle(ref, () => ({
    addBoxToArea,
    getAreasState: () => areas,
  }));

  return (
    <DndProvider backend={HTML5Backend}>
      <div>
        <div style={{ margin: "1rem" }}>
          <form onSubmit={handleAddArea} style={{ marginBottom: "1rem" }}>
            <input
              value={newAreaName}
              onChange={(e) => setNewAreaName(e.target.value)}
              placeholder="New area name"
            />
            <button type="submit">Add Area</button>
          </form>

          <select
            value={selectedAreaId}
            onChange={(e) => setSelectedAreaId(e.target.value)}
          >
            {areas.map((area) => (
              <option key={area.id} value={area.id}>
                {area.id}
              </option>
            ))}
          </select>

          <form onSubmit={handleCreateBox} style={{ marginTop: "1rem" }}>
            <input name="day" placeholder="Day" required />
            <input name="start" placeholder="Start time" required />
            <input name="end" placeholder="End time" required />
            <button type="submit">Create Box</button>
          </form>
        </div>

        <div style={{ display: "flex", justifyContent: "center" }}>
          {areas.map((area) => (
            <DropArea
              key={area.id}
              area={area}
              onDrop={handleDrop}
              onDelete={handleDeleteBox}
              onEdit={handleEditBox}
            />
          ))}
        </div>
      </div>
    </DndProvider>
  );
});

export type { Area, Box, DragDropHandle };
export default DragDrop;
