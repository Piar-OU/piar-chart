export { Gantt } from "./components/gantt/gantt";
export { ViewMode } from "./types/public-types";
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
} from "./types/public-types";
