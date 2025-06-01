import { forwardRef, useImperativeHandle, useState } from "react";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import {
  dayMap,
  type TimeRange,
} from "../../TesseractScanner/extractTimeRange";
import { type Box, type Area as ImportedArea } from "../../types/DragDrop";
import { DropArea } from "./DropArea";
import { useApp } from "../../context/AppContext";

// Change Area to local interface

export interface DragDropHandle {
  addBoxToArea: (areaId: string, content: TimeRange) => void;
  getAreasState: () => ImportedArea[];
  addArea: (areaName: string) => void;
}

const DragDrop = forwardRef<DragDropHandle>((_, ref) => {
  const { areas, setAreas } = useApp();
  const [newAreaName, setNewAreaName] = useState("");
  const [selectedAreaId, setSelectedAreaId] = useState("Source");

  const addBoxToArea = (areaId: string, content: TimeRange) => {
    setAreas((prevAreas: ImportedArea[]) =>
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
    setAreas((prevAreas: ImportedArea[]) => {
      const sourceArea = prevAreas.find((area) =>
        area.boxes.some((box) => box.id === item.id)
      );
      if (!sourceArea) return prevAreas;

      // Early return with unchanged state if same area
      if (sourceArea.id === targetAreaId) {
        return prevAreas;
      }

      return prevAreas.map((area) => {
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
    });
  };

  const handleDeleteBox = (boxId: string) => {
    setAreas((prevAreas: ImportedArea[]) =>
      prevAreas.map((area) => ({
        ...area,
        boxes: area.boxes.filter((box) => box.id !== boxId),
      }))
    );
  };

  const handleEditBox = (boxId: string, newContent: TimeRange) => {
    setAreas((prevAreas: ImportedArea[]) =>
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
    const input = (form.elements.namedItem("timeSlot") as HTMLTextAreaElement)
      .value;

    // Split input into lines and process each line
    const lines = input.split("\n").filter((line) => line.trim());

    for (const line of lines) {
      const [day, timeRange] = line.trim().split(" ");
      if (!day || !timeRange) {
        alert(
          `Invalid format in line: ${line}\nPlease use format: T2 15:30-17:30`
        );
        continue;
      }

      const [start, end] = timeRange.split("-");
      if (!start || !end) {
        alert(`Invalid time range in line: ${line}\nUse format: 15:30-17:30`);
        continue;
      }

      addBoxToArea(selectedAreaId, {
        day: day.startsWith("T") ? dayMap[day] || day : day,
        start,
        end,
      });
    }
    form.reset();
  };

  const handleDeleteArea = (areaId: string) => {
    if (areaId === "Source") return;
    setAreas((prevAreas: ImportedArea[]) =>
      prevAreas.filter((area) => area.id !== areaId)
    );
  };

  useImperativeHandle(ref, () => ({
    addBoxToArea,
    getAreasState: () => areas,
    addArea: (areaName: string) => {
      setAreas((prev: ImportedArea[]) => {
        // Check if area already exists
        if (prev.some((area) => area.id === areaName)) {
          return prev;
        }
        return [...prev, { id: areaName, boxes: [] }];
      });
    },
  }));

  return (
    <DndProvider backend={HTML5Backend}>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "20px",
          maxHeight: "90vh", // Increased from 70vh
          alignItems: "center",
          width: "100%",
        }}
      >
        {/* Controls Section */}
        <div
          style={{
            padding: "15px",
            backgroundColor: "#f5f5f5",
            borderRadius: "6px",
            width: "100%",
            maxWidth: "1200px", // Increased from 800px
          }}
        >
          {/* Area Controls */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "15px",
              marginBottom: "15px",
            }}
          >
            <form
              onSubmit={handleAddArea}
              style={{ display: "flex", gap: "10px" }}
            >
              <input
                value={newAreaName}
                onChange={(e) => setNewAreaName(e.target.value)}
                placeholder="New area name"
                style={{ flex: 1 }}
              />
              <button type="submit">Add Area</button>
            </form>

            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <select
                value={selectedAreaId}
                onChange={(e) => setSelectedAreaId(e.target.value)}
                style={{ flex: 1, padding: "5px" }}
              >
                {areas.map((area) => (
                  <option key={area.id} value={area.id}>
                    {area.id}
                  </option>
                ))}
              </select>
              <button
                onClick={() => handleDeleteArea(selectedAreaId)}
                disabled={selectedAreaId === "Source"}
                style={{ padding: "5px 10px" }}
              >
                Delete Area
              </button>
            </div>
          </div>

          {/* Simplified Box Creation Form */}
          <form onSubmit={handleCreateBox}>
            <div style={{ display: "flex", gap: "10px" }}>
              <textarea
                name="timeSlot"
                placeholder="T2 15:30-17:30&#10;T3 13:30-15:30&#10;T4 07:30-09:30"
                required
                style={{
                  flex: 1,
                  padding: "5px",
                  minHeight: "80px",
                  resize: "vertical",
                }}
              />
              <button type="submit">Create Boxes</button>
            </div>
          </form>
        </div>

        {/* Drop Areas Section */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)", // Fixed 4 columns instead of auto-fit
            gap: "15px",
            padding: "10px",
            backgroundColor: "#f9f9f9",
            borderRadius: "6px",
            overflowY: "auto",
            overflowX: "hidden",
            width: "100%",
            maxWidth: "1200px",
            height: "calc(100vh - 250px)", // Use viewport height instead of fixed height
          }}
        >
          {areas.map((area) => (
            <DropArea
              key={area.id}
              area={area}
              onDrop={handleDrop}
              onDelete={handleDeleteBox}
              onEdit={handleEditBox}
              onAreaDelete={handleDeleteArea}
            />
          ))}
        </div>
      </div>
    </DndProvider>
  );
});

export type { ImportedArea as Area, Box };
export default DragDrop;
