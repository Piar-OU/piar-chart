export { Gantt } from "./components/gantt/gantt";
export { ViewMode, Status } from "./types/public-types";
export { ganttDateRange, seedDates } from "./helpers/date-helper";
export {
  calculateNonWorkingPeriods,
  taskXCoordinate,
  taskYCoordinate,
} from "./helpers/bar-helper";
export type {
  GanttProps,
  Task,
  StylingOption,
  DisplayOption,
  EventOption,
  NonWorkingPeriod,
  Shift,
} from "./types/public-types";
