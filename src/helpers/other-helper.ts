import { BarTask } from "../types/bar-task";
import { Task, ViewMode } from "../types/public-types";

export const calculateVisibleDateIndices = (
  scrollX: number,
  columnWidth: number,
  containerWidth: number
) => {
  const startIndex = Math.floor(scrollX / columnWidth);
  const endIndex = Math.ceil((scrollX + containerWidth) / columnWidth);
  return {
    startIndex,
    endIndex,
  };
};

export function isKeyboardEvent(
  event: React.MouseEvent | React.KeyboardEvent | React.FocusEvent
): event is React.KeyboardEvent {
  return (event as React.KeyboardEvent).key !== undefined;
}

export function isMouseEvent(
  event: React.MouseEvent | React.KeyboardEvent | React.FocusEvent
): event is React.MouseEvent {
  return (event as React.MouseEvent).clientX !== undefined;
}

export function isBarTask(task: Task | BarTask): task is BarTask {
  return (task as BarTask).x1 !== undefined;
}

export const removeHiddenTasks = (tasks: (Task | Task[])[]) => {
  let flattenedTasks: Task[] = tasks.flatMap(task =>
    Array.isArray(task) ? task : [task]
  );

  const groupedTasks = flattenedTasks.filter(
    t => t.hideChildren && t.type === "project"
  );

  if (groupedTasks.length > 0) {
    for (let i = 0; groupedTasks.length > i; i++) {
      const groupedTask = groupedTasks[i];
      const children = getChildren(flattenedTasks, groupedTask);
      flattenedTasks = flattenedTasks.filter(t => children.indexOf(t) === -1);
    }
  }

  return flattenedTasks;
};

function getChildren(taskList: Task[], task: Task) {
  let tasks: Task[] = [];
  if (task.type !== "project") {
    tasks = taskList.filter(
      t => t.dependencies && t.dependencies.indexOf(task.id) !== -1
    );
  } else {
    tasks = taskList.filter(t => t.project && t.project === task.id);
  }
  var taskChildren: Task[] = [];
  tasks.forEach(t => {
    taskChildren.push(...getChildren(taskList, t));
  });
  tasks = tasks.concat(tasks, taskChildren);
  return tasks;
}

export const sortTasks = (taskA: Task, taskB: Task) => {
  const orderA = taskA.displayOrder || Number.MAX_VALUE;
  const orderB = taskB.displayOrder || Number.MAX_VALUE;
  if (orderA > orderB) {
    return 1;
  } else if (orderA < orderB) {
    return -1;
  } else {
    return 0;
  }
};

export const calculateCurrentTimePosition = (
  dates: Date[],
  currentTime: Date,
  viewMode: ViewMode,
  columnWidth: number
) => {
  if (
    dates.length === 0 ||
    viewMode === ViewMode.Week ||
    viewMode === ViewMode.Month ||
    viewMode === ViewMode.QuarterYear ||
    viewMode === ViewMode.Year
  )
    return;

  let lineX;

  dates.forEach((date, i) => {
    const tickX = i * columnWidth;
    let start, end;

    switch (viewMode) {
      case ViewMode.Hour:
        start = new Date(date).setMinutes(0, 0, 0);
        end = new Date(date).setMinutes(59, 59, 999);
        break;
      case ViewMode.QuarterDay:
        start = new Date(date).setHours(
          Math.floor(date.getHours() / 6) * 6,
          0,
          0,
          0
        );
        end = new Date(start).setHours(new Date(start).getHours() + 6);
        break;
      case ViewMode.HalfDay:
        start = new Date(date).setHours(
          Math.floor(date.getHours() / 12) * 12,
          0,
          0,
          0
        );
        end = new Date(start).setHours(new Date(start).getHours() + 12);
        break;
      case ViewMode.Day:
        start = new Date(date).setHours(0, 0, 0, 0);
        end = new Date(date).setHours(23, 59, 59, 999);
        break;
    }

    if (currentTime >= start && currentTime < end) {
      //@ts-ignore
      const secondsSinceStart = (currentTime - start) / 1000;
      const totalSeconds = (end - start) / 1000;
      const progress = secondsSinceStart / totalSeconds;
      lineX = tickX + progress * columnWidth;
    }
  });

  return lineX;
};

export function combineArraysFromSchedule(
  schedule: Record<string, JSX.Element[]>,
  startIndex: number,
  endIndex: number
) {
  let resultArray = [] as JSX.Element[];

  for (let key in schedule) {
    if (schedule.hasOwnProperty(key)) {
      const keyNum = parseInt(key, 10);

      if (keyNum >= startIndex && keyNum <= endIndex) {
        resultArray = resultArray.concat(schedule[key]);
      }
    }
  }

  return resultArray;
}
