import { forwardRef, useImperativeHandle, useState } from "react";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { type TimeRange } from "../../TesseractScanner/extractTimeRange";
import { type Area, type Box, type DragDropHandle } from "../../types/DragDrop";
import { DropArea } from "./DropArea";

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
