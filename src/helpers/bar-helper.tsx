import React from "react";
import { Shift, Task, ViewMode } from "../types/public-types";
import { BarTask, TaskTypeInternal } from "../types/bar-task";
import { BarMoveAction } from "../types/gantt-task-actions";

export const convertToBarTasks = (
  tasks: (Task | Task[])[],
  viewMode: ViewMode,
  dates: { dates: Date[]; indexesMap: Map<string, number> },
  columnWidth: number,
  rowHeight: number,
  taskHeight: number,
  barCornerRadius: number,
  handleWidth: number,
  rtl: boolean,
  infoProgressColor: string,
  infoProgressSelectedColor: string,
  infoBackgroundColor: string,
  infoBackgroundSelectedColor: string,
  barProgressColor: string,
  barProgressSelectedColor: string,
  barBackgroundColor: string,
  barBackgroundSelectedColor: string,
  projectProgressColor: string,
  projectProgressSelectedColor: string,
  projectBackgroundColor: string,
  projectBackgroundSelectedColor: string,
  milestoneBackgroundColor: string,
  milestoneBackgroundSelectedColor: string
) => {
  let flattenedTasks: { task: Task; groupIndex: number }[] = tasks.flatMap(
    (task, i) => {
      return Array.isArray(task)
        ? task.map(t => ({
            task: { ...t, start: new Date(t.start), end: new Date(t.end) },
            groupIndex: i,
          }))
        : [
            {
              task: {
                ...task,
                start: new Date(task.start),
                end: new Date(task.end),
              },
              groupIndex: i,
            },
          ];
    }
  );

  let barTasks: BarTask[] = flattenedTasks.map(({ task, groupIndex }) => {
    return convertToBarTask(
      task,
      viewMode,
      groupIndex,
      dates,
      columnWidth,
      rowHeight,
      taskHeight,
      barCornerRadius,
      handleWidth,
      rtl,
      infoProgressColor,
      infoProgressSelectedColor,
      infoBackgroundColor,
      infoBackgroundSelectedColor,
      barProgressColor,
      barProgressSelectedColor,
      barBackgroundColor,
      barBackgroundSelectedColor,
      projectProgressColor,
      projectProgressSelectedColor,
      projectBackgroundColor,
      projectBackgroundSelectedColor,
      milestoneBackgroundColor,
      milestoneBackgroundSelectedColor
    );
  });

  barTasks = barTasks.map(task => {
    const dependencies = task.dependencies || [];
    for (let j = 0; j < dependencies.length; j++) {
      const dependence = barTasks.findIndex(
        value => value.id === dependencies[j]
      );
      if (dependence !== -1) barTasks[dependence].barChildren.push(task);
    }
    return task;
  });

  return barTasks;
};

const convertToBarTask = (
  task: Task,
  viewMode: ViewMode,
  index: number,
  dates: { dates: Date[]; indexesMap: Map<string, number> },
  columnWidth: number,
  rowHeight: number,
  taskHeight: number,
  barCornerRadius: number,
  handleWidth: number,
  rtl: boolean,
  infoProgressColor: string,
  infoProgressSelectedColor: string,
  infoBackgroundColor: string,
  infoBackgroundSelectedColor: string,
  barProgressColor: string,
  barProgressSelectedColor: string,
  barBackgroundColor: string,
  barBackgroundSelectedColor: string,
  projectProgressColor: string,
  projectProgressSelectedColor: string,
  projectBackgroundColor: string,
  projectBackgroundSelectedColor: string,
  milestoneBackgroundColor: string,
  milestoneBackgroundSelectedColor: string
): BarTask => {
  let barTask: BarTask;
  switch (task.type) {
    case "milestone":
      barTask = convertToMilestone(
        task,
        viewMode,
        index,
        dates,
        columnWidth,
        rowHeight,
        taskHeight,
        barCornerRadius,
        handleWidth,
        milestoneBackgroundColor,
        milestoneBackgroundSelectedColor
      );
      break;
    case "project":
      barTask = convertToBar(
        task,
        viewMode,
        index,
        dates,
        columnWidth,
        rowHeight,
        taskHeight,
        barCornerRadius,
        handleWidth,
        rtl,
        infoProgressColor,
        infoProgressSelectedColor,
        infoBackgroundColor,
        infoBackgroundSelectedColor,
        projectProgressColor,
        projectProgressSelectedColor,
        projectBackgroundColor,
        projectBackgroundSelectedColor
      );
      break;
    default:
      barTask = convertToBar(
        task,
        viewMode,
        index,
        dates,
        columnWidth,
        rowHeight,
        taskHeight,
        barCornerRadius,
        handleWidth,
        rtl,
        infoProgressColor,
        infoProgressSelectedColor,
        infoBackgroundColor,
        infoBackgroundSelectedColor,
        barProgressColor,
        barProgressSelectedColor,
        barBackgroundColor,
        barBackgroundSelectedColor
      );
      break;
  }
  barTask.groupIndex = index;
  return barTask;
};

const convertToBar = (
  task: Task,
  viewMode: ViewMode,
  index: number,
  dates: { dates: Date[]; indexesMap: Map<string, number> },
  columnWidth: number,
  rowHeight: number,
  taskHeight: number,
  barCornerRadius: number,
  handleWidth: number,
  rtl: boolean,
  infoProgressColor: string,
  infoProgressSelectedColor: string,
  infoBackgroundColor: string,
  infoBackgroundSelectedColor: string,
  barProgressColor: string,
  barProgressSelectedColor: string,
  barBackgroundColor: string,
  barBackgroundSelectedColor: string
): BarTask => {
  let x1: number;
  let x2: number;
  if (rtl) {
    x2 = taskXCoordinateRTL(task.start, dates, columnWidth, viewMode);
    x1 = taskXCoordinateRTL(task.end, dates, columnWidth, viewMode);
  } else {
    x1 = taskXCoordinate(task.start, dates, columnWidth, viewMode);
    x2 = taskXCoordinate(task.end, dates, columnWidth, viewMode);
  }
  let typeInternal: TaskTypeInternal = task.type;
  if (typeInternal === "task" && x2 - x1 < handleWidth * 2) {
    typeInternal = "smalltask";
    x2 = x1 + handleWidth * 2;
  }

  const [progressWidth, progressX] = progressWithByParams(
    x1,
    x2,
    task.progress,
    rtl
  );
  const y = taskYCoordinate(index, rowHeight, taskHeight);

  const styles = {
    backgroundColor: task.isInfo ? infoBackgroundColor : barBackgroundColor,
    backgroundSelectedColor: task.isInfo
      ? infoBackgroundSelectedColor
      : barBackgroundSelectedColor,
    progressColor: task.isInfo ? infoProgressColor : barProgressColor,
    progressSelectedColor: task.isInfo
      ? infoProgressSelectedColor
      : barProgressSelectedColor,
    ...task.styles,
  };

  return {
    ...task,
    typeInternal,
    x1,
    x2,
    y,
    index,
    progressX,
    progressWidth,
    barCornerRadius,
    handleWidth,
    height: taskHeight,
    barChildren: [],
    styles,
  };
};

const convertToMilestone = (
  task: Task,
  viewMode: ViewMode,
  index: number,
  dates: { dates: Date[]; indexesMap: Map<string, number> },
  columnWidth: number,
  rowHeight: number,
  taskHeight: number,
  barCornerRadius: number,
  handleWidth: number,
  milestoneBackgroundColor: string,
  milestoneBackgroundSelectedColor: string
): BarTask => {
  const x = taskXCoordinate(task.start, dates, columnWidth, viewMode);
  const y = taskYCoordinate(index, rowHeight, taskHeight);

  const x1 = x - taskHeight * 0.5;
  const x2 = x + taskHeight * 0.5;

  const rotatedHeight = taskHeight / 1.414;
  const styles = {
    backgroundColor: milestoneBackgroundColor,
    backgroundSelectedColor: milestoneBackgroundSelectedColor,
    progressColor: "",
    progressSelectedColor: "",
    ...task.styles,
  };
  return {
    ...task,
    end: task.start,
    x1,
    x2,
    y,
    index,
    progressX: 0,
    progressWidth: 0,
    barCornerRadius,
    handleWidth,
    typeInternal: task.type,
    progress: 0,
    height: rotatedHeight,
    barChildren: [],
    styles,
  };
};

export const timeFormat = (number: number) =>
  number < 10 ? `0${number}` : number;

export const taskXCoordinate = (
  xDate: Date,
  dates: { dates: Date[]; indexesMap: Map<string, number> },
  columnWidth: number,
  viewMode: ViewMode
) => {
  let index;

  if (viewMode === ViewMode.Hour) {
    index = dates.indexesMap.get(
      new Date(
        xDate.getFullYear(),
        xDate.getMonth(),
        xDate.getDate(),
        xDate.getHours()
      ).toISOString()
    );
  } else if (viewMode === ViewMode.Day) {
    index = dates.indexesMap.get(
      new Date(
        xDate.getFullYear(),
        xDate.getMonth(),
        xDate.getDate()
      ).toISOString()
    );
  } else {
    index = dates.dates.findIndex(d => d.getTime() >= xDate.getTime()) - 1;
  }

  const remainderMillis = xDate.getTime() - dates.dates[index].getTime();
  const percentOfInterval =
    remainderMillis /
    (dates.dates[index + 1].getTime() - dates.dates[index].getTime());
  const x = index * columnWidth + percentOfInterval * columnWidth;
  return x;
};

export const taskXCoordinateRTL = (
  xDate: Date,
  dates: { dates: Date[]; indexesMap: Map<string, number> },
  columnWidth: number,
  viewMode: ViewMode
) => {
  let x = taskXCoordinate(xDate, dates, columnWidth, viewMode);
  x += columnWidth;
  return x;
};

export const taskYCoordinate = (
  index: number,
  rowHeight: number,
  taskHeight: number
) => {
  const y = index * rowHeight + (rowHeight - taskHeight) / 2;
  return y;
};

export const progressWithByParams = (
  taskX1: number,
  taskX2: number,
  progress: number,
  rtl: boolean
) => {
  const progressWidth = (taskX2 - taskX1) * progress * 0.01;
  let progressX: number;
  if (rtl) {
    progressX = taskX2 - progressWidth;
  } else {
    progressX = taskX1;
  }
  return [progressWidth, progressX];
};

export const progressByProgressWidth = (
  progressWidth: number,
  barTask: BarTask
) => {
  const barWidth = barTask.x2 - barTask.x1;
  const progressPercent = Math.round((progressWidth * 100) / barWidth);
  if (progressPercent >= 100) return 100;
  else if (progressPercent <= 0) return 0;
  else return progressPercent;
};

const progressByX = (x: number, task: BarTask) => {
  if (x >= task.x2) return 100;
  else if (x <= task.x1) return 0;
  else {
    const barWidth = task.x2 - task.x1;
    const progressPercent = Math.round(((x - task.x1) * 100) / barWidth);
    return progressPercent;
  }
};

const progressByXRTL = (x: number, task: BarTask) => {
  if (x >= task.x2) return 0;
  else if (x <= task.x1) return 100;
  else {
    const barWidth = task.x2 - task.x1;
    const progressPercent = Math.round(((task.x2 - x) * 100) / barWidth);
    return progressPercent;
  }
};

export const getProgressPoint = (
  progressX: number,
  taskY: number,
  taskHeight: number
) => {
  const point = [
    progressX - 5,
    taskY + taskHeight,
    progressX + 5,
    taskY + taskHeight,
    progressX,
    taskY + taskHeight - 8.66,
  ];
  return point.join(",");
};

const startByX = (x: number, xStep: number, task: BarTask) => {
  if (x >= task.x2 - task.handleWidth * 2) {
    x = task.x2 - task.handleWidth * 2;
  }
  const steps = Math.round((x - task.x1) / xStep);
  const additionalXValue = steps * xStep;
  const newX = task.x1 + additionalXValue;
  return newX;
};

const endByX = (x: number, xStep: number, task: BarTask) => {
  if (x <= task.x1 + task.handleWidth * 2) {
    x = task.x1 + task.handleWidth * 2;
  }
  const steps = Math.round((x - task.x2) / xStep);
  const additionalXValue = steps * xStep;
  const newX = task.x2 + additionalXValue;
  return newX;
};

const moveByX = (x: number, xStep: number, task: BarTask) => {
  const steps = Math.round((x - task.x1) / xStep);
  const additionalXValue = steps * xStep;
  const newX1 = task.x1 + additionalXValue;
  const newX2 = newX1 + task.x2 - task.x1;
  return [newX1, newX2];
};

const moveByY = (y: number, yStep: number, task: BarTask) => {
  const steps = Math.round((y - task.y) / yStep);
  const additionalYValue = steps * yStep;
  const newY = task.y + additionalYValue;
  return newY;
};

const dateByX = (
  x: number,
  taskX: number,
  taskDate: Date,
  xStep: number,
  timeStep: number
) => {
  let newDate = new Date(((x - taskX) / xStep) * timeStep + taskDate.getTime());
  newDate = new Date(
    newDate.getTime() +
      (newDate.getTimezoneOffset() - taskDate.getTimezoneOffset()) * 60000
  );
  return newDate;
};

/**
 * Method handles event in real time(mousemove) and on finish(mouseup)
 */
export const handleTaskBySVGMouseEvent = (
  svgX: number,
  svgY: number,
  action: BarMoveAction,
  selectedTask: BarTask | BarTask[],
  xStep: number,
  yStep: number,
  timeStep: number,
  initEventX1Delta: number,
  initEventYDelta: number,
  rtl: boolean
): { isChanged: boolean; changedTask: BarTask | BarTask[] } => {
  const handleSingleTask = (
    task: BarTask
  ): { isChanged: boolean; changedTask: BarTask } => {
    switch (task.type) {
      case "milestone":
        return handleTaskBySVGMouseEventForMilestone(
          svgX,
          svgY,
          action,
          task,
          xStep,
          yStep,
          timeStep,
          initEventX1Delta - task.x1,
          initEventYDelta - task.y
        );
      default:
        return handleTaskBySVGMouseEventForBar(
          svgX,
          svgY,
          action,
          task,
          xStep,
          yStep,
          timeStep,
          initEventX1Delta - task.x1,
          initEventYDelta - task.y,
          rtl
        );
    }
  };

  if (Array.isArray(selectedTask)) {
    const results = selectedTask.map(handleSingleTask);
    const isChanged = results.some(result => result.isChanged);
    const changedTasks = results.map(result => result.changedTask);
    return { isChanged, changedTask: changedTasks };
  } else {
    return handleSingleTask(selectedTask);
  }
};

const handleTaskBySVGMouseEventForBar = (
  svgX: number,
  svgY: number,
  action: BarMoveAction,
  selectedTask: BarTask,
  xStep: number,
  yStep: number,
  timeStep: number,
  initEventX1Delta: number,
  initEventYDelta: number,
  rtl: boolean
): { isChanged: boolean; changedTask: BarTask } => {
  const changedTask: BarTask = { ...selectedTask };
  let isChanged = false;
  switch (action) {
    case "progress":
      if (rtl) {
        changedTask.progress = progressByXRTL(svgX, selectedTask);
      } else {
        changedTask.progress = progressByX(svgX, selectedTask);
      }
      isChanged = changedTask.progress !== selectedTask.progress;
      if (isChanged) {
        const [progressWidth, progressX] = progressWithByParams(
          changedTask.x1,
          changedTask.x2,
          changedTask.progress,
          rtl
        );
        changedTask.progressWidth = progressWidth;
        changedTask.progressX = progressX;
      }
      break;
    case "start": {
      const newX1 = startByX(svgX, xStep, selectedTask);
      changedTask.x1 = newX1;
      isChanged = changedTask.x1 !== selectedTask.x1;
      if (isChanged) {
        if (rtl) {
          changedTask.end = dateByX(
            newX1,
            selectedTask.x1,
            selectedTask.end,
            xStep,
            timeStep
          );
        } else {
          changedTask.start = dateByX(
            newX1,
            selectedTask.x1,
            selectedTask.start,
            xStep,
            timeStep
          );
        }
        const [progressWidth, progressX] = progressWithByParams(
          changedTask.x1,
          changedTask.x2,
          changedTask.progress,
          rtl
        );
        changedTask.progressWidth = progressWidth;
        changedTask.progressX = progressX;
      }
      break;
    }
    case "end": {
      const newX2 = endByX(svgX, xStep, selectedTask);
      changedTask.x2 = newX2;
      isChanged = changedTask.x2 !== selectedTask.x2;
      if (isChanged) {
        if (rtl) {
          changedTask.start = dateByX(
            newX2,
            selectedTask.x2,
            selectedTask.start,
            xStep,
            timeStep
          );
        } else {
          changedTask.end = dateByX(
            newX2,
            selectedTask.x2,
            selectedTask.end,
            xStep,
            timeStep
          );
        }
        const [progressWidth, progressX] = progressWithByParams(
          changedTask.x1,
          changedTask.x2,
          changedTask.progress,
          rtl
        );
        changedTask.progressWidth = progressWidth;
        changedTask.progressX = progressX;
      }
      break;
    }
    case "move": {
      const [newMoveX1, newMoveX2] = moveByX(
        svgX - initEventX1Delta,
        xStep,
        selectedTask
      );
      const newY = moveByY(svgY - initEventYDelta, yStep, selectedTask);

      isChanged = newMoveX1 !== selectedTask.x1 || newY !== selectedTask.y;

      if (isChanged) {
        changedTask.start = dateByX(
          newMoveX1,
          selectedTask.x1,
          selectedTask.start,
          xStep,
          timeStep
        );
        changedTask.end = dateByX(
          newMoveX2,
          selectedTask.x2,
          selectedTask.end,
          xStep,
          timeStep
        );
        changedTask.x1 = newMoveX1;
        changedTask.x2 = newMoveX2;
        changedTask.y = newY;

        const [progressWidth, progressX] = progressWithByParams(
          changedTask.x1,
          changedTask.x2,
          changedTask.progress,
          rtl
        );
        changedTask.progressWidth = progressWidth;
        changedTask.progressX = progressX;
      }
      break;
    }
  }

  return { isChanged, changedTask };
};

const handleTaskBySVGMouseEventForMilestone = (
  svgX: number,
  svgY: number,
  action: BarMoveAction,
  selectedTask: BarTask,
  xStep: number,
  yStep: number,
  timeStep: number,
  initEventX1Delta: number,
  initEventYDelta: number
): { isChanged: boolean; changedTask: BarTask } => {
  const changedTask: BarTask = { ...selectedTask };
  let isChanged = false;
  switch (action) {
    case "move": {
      const [newMoveX1, newMoveX2] = moveByX(
        svgX - initEventX1Delta,
        xStep,
        selectedTask
      );
      const newY = moveByY(svgY - initEventYDelta, yStep, selectedTask);
      isChanged = newMoveX1 !== selectedTask.x1 || newY !== selectedTask.y;

      if (isChanged) {
        changedTask.start = dateByX(
          newMoveX1,
          selectedTask.x1,
          selectedTask.start,
          xStep,
          timeStep
        );
        changedTask.end = changedTask.start;
        changedTask.x1 = newMoveX1;
        changedTask.x2 = newMoveX2;
        changedTask.y = newY;
      }
      break;
    }
  }
  return { isChanged, changedTask };
};

export const measureTextWidth = (text: string, font: string): number => {
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");
  if (context) {
    context.font = font;
    return context.measureText(text).width;
  }
  return 0;
};

export const calculateNonWorkingPeriods = (
  shifts: Shift[],
  startDate: Date,
  endDate: Date,
  dates: { dates: Date[]; indexesMap: Map<string, number> },
  viewMode: ViewMode,
  columnWidth: number,
  rowHeight: number,
  index: number,
  fill: string
) => {
  function convertToDate(timeStr: string, date: Date, addDay = 0) {
    const [hours, minutes] = timeStr.split(":").map(Number);
    return new Date(
      date.getFullYear(),
      date.getMonth(),
      date.getDate() + addDay,
      hours,
      minutes
    );
  }

  function isWeekend(date: Date) {
    const day = date.getDay();
    return day === 0 || day === 6;
  }

  function isSaturday(date: Date) {
    const day = date.getDay();
    return day === 6;
  }

  function getDailyNonWorkingPeriods(shifts: Shift[], date: Date) {
    let intervals = [] as JSX.Element[];
    let times = [] as any[];
    let nextDayShiftEnd = null as Date | null;

    shifts.forEach(shift => {
      const startTime = convertToDate(shift.startDate, date);
      let endTime = convertToDate(shift.finishDate, date);
      if (shift.isNextDayEnd) {
        endTime.setDate(endTime.getDate() + 1);
        nextDayShiftEnd = endTime;
      }

      times.push({ time: startTime, type: "start" });
      times.push({ time: endTime, type: "end" });
    });

    times.sort((a, b) => a.time - b.time);

    let nonWorkingStart = nextDayShiftEnd
      ? new Date(
          date.getFullYear(),
          date.getMonth(),
          date.getDate(),
          nextDayShiftEnd.getHours(),
          nextDayShiftEnd.getMinutes()
        )
      : new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0);
    const nonWorkingEnd = new Date(
      date.getFullYear(),
      date.getMonth(),
      date.getDate(),
      23,
      59,
      59
    );

    let lastEnd = nonWorkingStart;
    let openIntervals = 0;

    times.forEach(time => {
      if (time.type === "start") {
        if (openIntervals === 0 && time.time > lastEnd) {
          const x1 = taskXCoordinate(lastEnd, dates, columnWidth, viewMode);
          const x2 = taskXCoordinate(time.time, dates, columnWidth, viewMode);
          const y = taskYCoordinate(index, rowHeight, rowHeight);
          intervals.push(
            <rect
              key={`${x1} ${x2} ${y}`}
              x={x1}
              y={y}
              width={x2 - x1}
              height={rowHeight}
              fill={fill}
              fillOpacity={0.1}
            />
          );
        }
        openIntervals += 1;
      } else if (time.type === "end") {
        openIntervals -= 1;
        if (openIntervals === 0) {
          lastEnd = time.time;
        }
      }
    });

    if (lastEnd < nonWorkingEnd) {
      const x1 = taskXCoordinate(lastEnd, dates, columnWidth, viewMode);
      const x2 = taskXCoordinate(nonWorkingEnd, dates, columnWidth, viewMode);
      const y = taskYCoordinate(index, rowHeight, rowHeight);
      intervals.push(
        <rect
          key={`${x1} ${x2} ${y}`}
          x={x1}
          y={y}
          width={x2 - x1}
          height={rowHeight}
          fill={fill}
          fillOpacity={0.1}
        />
      );
    }

    return intervals;
  }

  const start = new Date(startDate);
  const end = new Date(endDate);
  let nonWorkingPeriods = [] as JSX.Element[];

  const nightShift = shifts.find(shift => shift.isNextDayEnd);

  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    if (isWeekend(d)) {
      if (shifts.some(shift => shift.withDayOff)) {
        const dailyNonWorkingPeriods = getDailyNonWorkingPeriods(
          shifts,
          new Date(d)
        );
        nonWorkingPeriods = nonWorkingPeriods.concat(dailyNonWorkingPeriods);
      } else if (nightShift && isSaturday(d)) {
        const [hours, minutes] = nightShift.finishDate.split(":").map(Number);

        const x1 = taskXCoordinate(
          new Date(d.getFullYear(), d.getMonth(), d.getDate(), hours, minutes),
          dates,
          columnWidth,
          viewMode
        );
        const x2 = taskXCoordinate(
          new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59),
          dates,
          columnWidth,
          viewMode
        );
        const y = taskYCoordinate(index, rowHeight, rowHeight);

        nonWorkingPeriods.push(
          <rect
            key={`${x1} ${x2} ${y}`}
            x={x1}
            y={y}
            width={x2 - x1}
            height={rowHeight}
            fill={fill}
            fillOpacity={0.1}
          />
        );
      } else {
        const x1 = taskXCoordinate(
          new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0),
          dates,
          columnWidth,
          viewMode
        );
        const x2 = taskXCoordinate(
          new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59),
          dates,
          columnWidth,
          viewMode
        );
        const y = taskYCoordinate(index, rowHeight, rowHeight);
        nonWorkingPeriods.push(
          <rect
            key={`${x1} ${x2} ${y}`}
            x={x1}
            y={y}
            width={x2 - x1}
            height={rowHeight}
            fill={fill}
            fillOpacity={0.1}
          />
        );
      }
    } else {
      const dailyNonWorkingPeriods = getDailyNonWorkingPeriods(
        shifts,
        new Date(d)
      );
      nonWorkingPeriods = nonWorkingPeriods.concat(dailyNonWorkingPeriods);
    }
  }

  return nonWorkingPeriods;
};
