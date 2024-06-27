export enum ViewMode {
  Hour = "Hour",
  QuarterDay = "Quarter Day",
  HalfDay = "Half Day",
  Day = "Day",
  /** ISO-8601 week */
  Week = "Week",
  Month = "Month",
  QuarterYear = "QuarterYear",
  Year = "Year",
}

export enum Status {
  pending,
  inProgress,
  done,
  warning,
  overdue,
}

export type TaskType = "task" | "milestone" | "project";
export interface Task {
  id: string;
  type: TaskType;
  name: string;
  start: Date;
  end: Date;
  status?: Status;
  /**
   * From 0 to 100
   */
  progress: number;
  styles?: {
    backgroundColor?: string;
    backgroundSelectedColor?: string;
    progressColor?: string;
    progressSelectedColor?: string;
  };
  isDisabled?: boolean;
  isInfo?: boolean;
  project?: string;
  dependencies?: string[];
  hideChildren?: boolean;
  displayOrder?: number;
  allowedIndexes?: number[];
  isOverlapping?: boolean;
}

export interface EventOption {
  /**
   * Time step value for date changes.
   */
  timeStep?: number;
  /**
   * Invokes on bar select on unselect.
   */
  onSelect?: (task: Task, isSelected: boolean) => void;
  /**
   * Invokes on bar double click.
   */
  onDoubleClick?: (task: Task) => void;
  /**
   * Invokes on bar click.
   */
  onClick?: (task: Task) => void;
  /**
   * Invokes on end and start time change. Chart undoes operation if method return false or error.
   */
  onDateChange?: (
    task: Task,
    children: Task[]
  ) => void | boolean | Promise<void> | Promise<boolean>;
  /**
   * Invokes on progress change. Chart undoes operation if method return false or error.
   */
  onProgressChange?: (
    task: Task,
    children: Task[]
  ) => void | boolean | Promise<void> | Promise<boolean>;
  /**
   * Invokes on delete selected task. Chart undoes operation if method return false or error.
   */
  onDelete?: (task: Task) => void | boolean | Promise<void> | Promise<boolean>;
  /**
   * Invokes on expander on task list
   */
  onExpanderClick?: (task: Task) => void;
}

export interface DisplayOption {
  viewMode?: ViewMode;
  viewDate?: Date;
  preStepsCount?: number;
  /**
   * Specifies the month name language. Able formats: ISO 639-2, Java Locale
   */
  locale?: string;
  rtl?: boolean;
}

export interface StylingOption {
  headerHeight?: number;
  columnWidth?: number;
  listCellWidth?: string;
  rowHeight?: number;
  ganttHeight?: number;
  barCornerRadius?: number;
  handleWidth?: number;
  fontFamily?: string;
  fontSize?: string;
  /**
   * How many of row width can be taken by task.
   * From 0 to 100
   */
  barFill?: number;
  barProgressColor?: string;
  barProgressSelectedColor?: string;
  barBackgroundColor?: string;
  barBackgroundSelectedColor?: string;
  infoProgressColor?: string;
  infoProgressSelectedColor?: string;
  infoBackgroundColor?: string;
  infoBackgroundSelectedColor?: string;
  projectProgressColor?: string;
  projectProgressSelectedColor?: string;
  projectBackgroundColor?: string;
  projectBackgroundSelectedColor?: string;
  milestoneBackgroundColor?: string;
  milestoneBackgroundSelectedColor?: string;
  arrowColor?: string;
  arrowIndent?: number;
  todayColor?: string;
  TooltipContent?: React.FC<{
    task: Task;
    fontSize: string;
    fontFamily: string;
  }>;
  TaskListHeader?: React.FC<{
    headerHeight: number;
    rowWidth: string;
    fontFamily: string;
    fontSize: string;
  }>;
  TaskListTable?: React.FC<{
    rowHeight: number;
    rowWidth: string;
    fontFamily: string;
    fontSize: string;
    locale: string;
    tasks: Task[];
    hoveredIndex: number | null;
    selectedTaskId: string;
    /**
     * Sets selected task by id
     */
    setSelectedTask: (taskId: string) => void;
    setHoveredIndex: (id: number | null) => () => void;
    onExpanderClick: (task: Task) => void;
  }>;
}

export interface Shift {
  startDate: string;
  finishDate: string;
  withDayOff: boolean;
  isNextDayEnd: boolean;
}

export interface NonWorkingPeriod {
  x1: number;
  x2: number;
  y: number;
}

export interface IGanttOrder {
  projectId: number;
  start: string;
}

export interface GanttProps extends EventOption, DisplayOption, StylingOption {
  tasks: (Task | Task[])[];
  fieldFiltering?: Record<string, any>;
  onArrowClick?: (taskFrom: Task, taskTo: Task) => void;
  onDependency?: (taskFrom: Task, taskTo: Task) => void;
  trigger?: boolean;
  isLoading?: boolean;
  ganttSchedule: Record<string, JSX.Element[]>;
  selectedProject: IGanttOrder | null;
  isOverdueMode?: boolean;
  isBehindScheduleMode?: boolean;
}
