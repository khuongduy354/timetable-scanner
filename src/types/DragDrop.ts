import { type TimeRange } from "../TesseractScanner/extractTimeRange";

export interface Box {
  id: string;
  content: TimeRange;
}

export interface Area {
  id: string;
  boxes: Box[];
}

export interface DragDropHandle {
  addBoxToArea: (areaId: string, content: TimeRange) => void;
  getAreasState: () => Area[];
}

export const ItemTypes = {
  BOX: "box",
};

export const formatTimeRange = (timeRange: TimeRange) => {
  return `${timeRange.day} ${timeRange.start}-${timeRange.end}`;
};
