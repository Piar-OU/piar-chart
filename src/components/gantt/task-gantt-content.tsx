import React, { useCallback, useEffect, useMemo, useState } from "react";
import { EventOption, Task, ViewMode } from "../../types/public-types";
import { BarTask } from "../../types/bar-task";
import { Arrow } from "../other/arrow";
import { handleTaskBySVGMouseEvent } from "../../helpers/bar-helper";
import { isKeyboardEvent } from "../../helpers/other-helper";
import { TaskItem } from "../task-item/task-item";
import {
  BarMoveAction,
  GanttContentMoveAction,
  GanttEvent,
} from "../../types/gantt-task-actions";

export type TaskGanttContentProps = {
  uneducatedTasks: (Task | Task[])[];
  fieldFiltering?: Record<string, any>;
  tasks: BarTask[];
  dates: Date[];
  hoveredBarTaskId: string | null;
  viewMode: ViewMode;
  ganttEvent: GanttEvent;
  selectedTask: BarTask | undefined;
  rowHeight: number;
  columnWidth: number;
  timeStep: number;
  svg?: React.RefObject<SVGSVGElement>;
  svgWidth: number;
  taskHeight: number;
  arrowColor: string;
  arrowIndent: number;
  fontSize: string;
  fontFamily: string;
  rtl: boolean;
  setGanttEvent: (value: GanttEvent) => void;
  setFailedTask: (value: BarTask | null) => void;
  setSelectedTask: (taskId: string) => void;
  setHoveredBarTaskId: (value: React.SetStateAction<string | null>) => void;
  onArrowClick?: (taskFrom: Task, taskTo: Task) => void;
  onDependency?: (taskFrom: Task, taskTo: Task) => void;
} & EventOption;

export const TaskGanttContent: React.FC<TaskGanttContentProps> = ({
  tasks,
  fieldFiltering,
  dates,
  viewMode,
  hoveredBarTaskId,
  ganttEvent,
  selectedTask,
  rowHeight,
  columnWidth,
  timeStep,
  svg,
  taskHeight,
  arrowColor,
  arrowIndent,
  fontFamily,
  fontSize,
  rtl,
  setGanttEvent,
  setFailedTask,
  setHoveredBarTaskId,
  setSelectedTask,
  onDateChange,
  onProgressChange,
  onDoubleClick,
  onClick,
  onDelete,
  onArrowClick,
  onDependency,
}) => {
  const point = svg?.current?.createSVGPoint();
  const [xStep, setXStep] = useState(0);
  const [initEventX1Delta, setInitEventX1Delta] = useState(0);
  const [initEventYDelta, setInitEventYDelta] = useState(0);
  const [isMoving, setIsMoving] = useState(false);
  const [project, setProject] = useState<number | null>(null);
  const [selectedItem, setSelectedItem] = useState<BarTask | null>(null);
  const [mainTask, setMainTask] = useState<BarTask | null>(null);
  const [childTask, setChildTask] = useState<BarTask | null>(null);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [draggingFromTop, setDraggingFromTop] = useState(false);
  const [isDependency, setIsDependency] = useState(false);

  const tasksMap = useMemo(
    () => new Map(tasks.map(task => [task.id, task])),
    [tasks]
  );

  // create xStep
  useEffect(() => {
    const dateDelta =
      dates[1].getTime() -
      dates[0].getTime() -
      dates[1].getTimezoneOffset() * 60 * 1000 +
      dates[0].getTimezoneOffset() * 60 * 1000;
    const newXStep = (timeStep * columnWidth) / dateDelta;
    setXStep(newXStep);
  }, [columnWidth, dates, timeStep]);

  useEffect(() => {
    const handleMouseMove = async (event: MouseEvent) => {
      if (!ganttEvent.changedTask || !point || !svg?.current) return;
      event.preventDefault();

      point.x = event.clientX;
      point.y = event.clientY;

      const cursor = point.matrixTransform(
        svg?.current.getScreenCTM()?.inverse()
      );

      const { isChanged, changedTask } = handleTaskBySVGMouseEvent(
        cursor.x,
        cursor.y,
        ganttEvent.action as BarMoveAction,
        ganttEvent.changedTask,
        xStep,
        rowHeight,
        timeStep,
        initEventX1Delta,
        initEventYDelta,
        rtl
      );
      if (isChanged) {
        setGanttEvent({ action: ganttEvent.action, changedTask });
      }
    };

    const handleMouseUp = async (event: MouseEvent) => {
      const { action, originalSelectedTask, changedTask } = ganttEvent;
      if (!changedTask || !point || !svg?.current || !originalSelectedTask)
        return;
      event.preventDefault();

      point.x = event.clientX;
      point.y = event.clientY;

      const cursor = point.matrixTransform(
        svg?.current.getScreenCTM()?.inverse()
      );

      const { changedTask: newChangedTask } = handleTaskBySVGMouseEvent(
        cursor.x,
        cursor.y,
        action as BarMoveAction,
        changedTask,
        xStep,
        rowHeight,
        timeStep,
        initEventX1Delta,
        initEventYDelta,
        rtl
      );

      const isNotLikeOriginal = (originalTask: BarTask, newTask: BarTask) =>
        originalTask.start !== newTask.start ||
        originalTask.end !== newTask.end ||
        originalTask.progress !== newTask.progress ||
        originalTask.y !== newTask.y;

      // remove listeners
      svg.current.removeEventListener("mousemove", handleMouseMove);
      svg.current.removeEventListener("mouseup", handleMouseUp);
      setGanttEvent({ action: "move-finished" });
      setIsMoving(false);

      // custom operation start
      let operationSuccess = true;

      const handleChange = async (task: BarTask, originalTask: BarTask) => {
        if (
          (action === "move" || action === "end" || action === "start") &&
          onDateChange &&
          isNotLikeOriginal(originalTask, task)
        ) {
          try {
            const index = Math.floor(task.y / rowHeight);

            const isChangedY =
              !task.allowedIndexes ||
              (task.allowedIndexes[0] <= index &&
                task.allowedIndexes[1] >= index) ||
              (task.allowedIndexes[2] <= index &&
                task.allowedIndexes[3] >= index);

            if (!isChangedY) {
              throw new Error();
            }
            const result = await onDateChange(task, task.barChildren);
            if (result !== undefined) {
              operationSuccess = result;
            }
          } catch (error) {
            operationSuccess = false;
          }
        } else if (onProgressChange && isNotLikeOriginal(originalTask, task)) {
          try {
            const result = await onProgressChange(task, task.barChildren);
            if (result !== undefined) {
              operationSuccess = result;
            }
          } catch (error) {
            operationSuccess = false;
          }
        }
      };

      if (
        Array.isArray(newChangedTask) &&
        Array.isArray(originalSelectedTask)
      ) {
        for (let i = 0; i < newChangedTask.length; i++) {
          await handleChange(newChangedTask[i], originalSelectedTask[i]);
        }
      } else if (
        !Array.isArray(newChangedTask) &&
        !Array.isArray(originalSelectedTask)
      ) {
        await handleChange(newChangedTask, originalSelectedTask);
      }

      // If operation is failed - return old state
      if (!operationSuccess && !Array.isArray(originalSelectedTask)) {
        setFailedTask(originalSelectedTask);
      }
    };

    if (
      !isMoving &&
      (ganttEvent.action === "move" ||
        ganttEvent.action === "end" ||
        ganttEvent.action === "start" ||
        ganttEvent.action === "progress") &&
      svg?.current
    ) {
      svg.current.addEventListener("mousemove", handleMouseMove);
      svg.current.addEventListener("mouseup", handleMouseUp);
      setIsMoving(true);
    }
  }, [
    ganttEvent,
    xStep,
    rowHeight,
    initEventX1Delta,
    onProgressChange,
    timeStep,
    onDateChange,
    svg,
    isMoving,
    point,
    rtl,
    setFailedTask,
    setGanttEvent,
    initEventYDelta,
  ]);

  /**
   * Method is Start point of task change
   */
  const handleBarEventStart = async (
    action: GanttContentMoveAction,
    task: BarTask,
    event?: React.MouseEvent | React.KeyboardEvent
  ) => {
    if (!event) {
      if (action === "select") {
        setSelectedTask(task.id);
      }
    }
    // Keyboard events
    else if (isKeyboardEvent(event)) {
      if (action === "delete") {
        if (onDelete) {
          try {
            const result = await onDelete(task);
            if (result !== undefined && result) {
              setGanttEvent({ action, changedTask: task });
            }
          } catch (error) {
            console.error("Error on Delete. " + error);
          }
        }
      }
    }
    // Mouse Events
    else if (action === "mouseenter") {
      setGanttEvent({
        action,
        changedTask: task,
        originalSelectedTask: task,
      });
    } else if (action === "mouseleave") {
      if (ganttEvent.action === "mouseenter") {
        setGanttEvent({ action: "" });
        return;
      }
    } else if (action === "dblclick") {
      !!onDoubleClick && onDoubleClick(task);
    } else if (action === "click") {
      !!onClick && onClick(task);
    }
    // Change task event start
    else if (action === "move") {
      if (!svg?.current || !point) return;
      point.x = event.clientX;
      point.y = event.clientY;
      const cursor = point.matrixTransform(
        svg.current.getScreenCTM()?.inverse()
      );
      setInitEventX1Delta(cursor.x);
      setInitEventYDelta(cursor.y);
      setGanttEvent({
        action,
        changedTask:
          !!fieldFiltering && Object.keys(fieldFiltering)[0]
            ? tasks.filter(
                task =>
                  task[Object.keys(fieldFiltering)[0]] ===
                  Object.values(fieldFiltering)[0]
              )
            : task,
        originalSelectedTask:
          !!fieldFiltering && Object.keys(fieldFiltering)[0]
            ? tasks.filter(
                task =>
                  task[Object.keys(fieldFiltering)[0]] ===
                  Object.values(fieldFiltering)[0]
              )
            : task,
      });
    } else {
      setGanttEvent({
        action,
        changedTask: task,
        originalSelectedTask: task,
      });
    }
  };

  const getSelectedItemsIdSet = useCallback(() => {
    const collectBarChildrenIds = (item: BarTask, idSet: Set<string>) => {
      if (!item) return;

      idSet.add(item.id);

      if (item.barChildren?.length) {
        item.barChildren.forEach(child => collectBarChildrenIds(child, idSet));
      }
    };

    const collectDependencies = (
      item: BarTask,
      idSet: Set<string>,
      tasksMap: Map<string, BarTask>
    ) => {
      if (!item) return;

      if (item.dependencies?.length) {
        item.dependencies.forEach(dependencyId => {
          if (!idSet.has(dependencyId)) {
            idSet.add(dependencyId);
            const dependencyItem = tasksMap.get(dependencyId);
            if (dependencyItem) {
              collectDependencies(dependencyItem, idSet, tasksMap);
            }
          }
        });
      }
    };

    if (!selectedItem) return new Set() as Set<string>;

    const selectedItemsIdSet: Set<string> = new Set();

    collectBarChildrenIds(selectedItem, selectedItemsIdSet);

    collectDependencies(selectedItem, selectedItemsIdSet, tasksMap);

    return selectedItemsIdSet as Set<string>;
  }, [selectedItem, tasksMap]);

  const selectedItemsIdSet = useMemo(
    () => getSelectedItemsIdSet(),
    [getSelectedItemsIdSet]
  );

  const getArrows = () => {
    const arrowElements = (
      (project && ganttEvent.action !== "progress") ||
      (selectedItem?.projectId && ganttEvent.action !== "progress") ||
      ganttEvent.action === "move"
        ? tasks
        : []
    ).reduce(
      (acc, task) => {
        task.barChildren.forEach(child => {
          const childTask = tasksMap.get(child.id);

          if (
            !childTask ||
            !task.projectId ||
            (task.projectId !== project &&
              task.projectId !== selectedItem?.projectId)
          )
            return;

          const arrowElement = (
            <Arrow
              key={`Arrow from ${task.id} to ${childTask.id}`}
              taskFrom={task}
              isSelectedItem={selectedItemsIdSet.has(task.id)}
              taskTo={childTask}
              rowHeight={rowHeight}
              taskHeight={taskHeight}
              arrowIndent={arrowIndent}
              rtl={rtl}
              onArrowClick={onArrowClick}
            />
          );

          if (selectedItemsIdSet.has(task.id)) {
            acc.selected.push(arrowElement);
          } else {
            acc.normal.push(arrowElement);
          }
        });

        return acc;
      },
      { normal: [] as React.ReactNode[], selected: [] as React.ReactNode[] }
    );

    return [...arrowElements.normal, ...arrowElements.selected];
  };

  useEffect(() => {
    if (!isDependency) return;
    if (!mainTask || !childTask || !onDependency) {
      setMainTask(null);
      setChildTask(null);
      setIsDependency(false);
      return;
    }

    onDependency(mainTask, childTask);

    setMainTask(null);
    setChildTask(null);
    setIsDependency(false);
  }, [childTask, isDependency, mainTask, onDependency]);

  return (
    <g className="content">
      <defs>
        <marker
          id="arrow"
          markerWidth="10"
          markerHeight="10"
          refX="5"
          refY="5"
          orient="auto"
          markerUnits="strokeWidth"
        >
          <path d="M0,0 L0,10 L10,5 Z" fill="black" />
        </marker>
      </defs>
      <g className="bar" fontFamily={fontFamily} fontSize={fontSize}>
        {tasks.map(task => {
          return (
            <TaskItem
              task={task}
              selectedItemsIdSet={selectedItemsIdSet}
              arrowIndent={arrowIndent}
              hoveredBarTaskId={hoveredBarTaskId}
              project={project}
              action={ganttEvent.action}
              taskHeight={taskHeight}
              isProgressChangeable={!!onProgressChange && !task.isDisabled}
              isDateChangeable={!!onDateChange && !task.isDisabled}
              isDelete={!task.isDisabled}
              onEventStart={handleBarEventStart}
              key={task.id}
              viewMode={viewMode}
              rowHeight={rowHeight}
              mainTask={mainTask}
              childTask={childTask}
              setMousePosition={setMousePosition}
              isSelectdItem={
                !!selectedItem?.projectId &&
                !!task.projectId &&
                task.projectId === selectedItem.projectId
              }
              isSelected={!!selectedTask && task.id === selectedTask.id}
              setHoveredBarTaskId={setHoveredBarTaskId}
              setProject={setProject}
              setSelectedItem={setSelectedItem}
              setMainTask={setMainTask}
              setDraggingFromTop={setDraggingFromTop}
              setChildTask={setChildTask}
              setIsDependency={setIsDependency}
              rtl={rtl}
            />
          );
        })}
      </g>
      <g className="arrows" fill={arrowColor} stroke={arrowColor}>
        {getArrows()}
      </g>
      {mainTask && (
        <line
          x1={draggingFromTop ? mainTask.x1 + 3 : mainTask.x2 - 3}
          y1={
            draggingFromTop ? mainTask.y - 6 : mainTask.y + mainTask.height + 6
          }
          x2={mousePosition.x}
          y2={mousePosition.y}
          stroke="black"
          strokeDasharray="4"
          markerEnd="url(#arrow)"
        />
      )}
    </g>
  );
};
