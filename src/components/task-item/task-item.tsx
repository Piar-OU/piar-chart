import React, { useEffect, useRef, useState } from "react";
import { BarTask } from "../../types/bar-task";
import { GanttContentMoveAction } from "../../types/gantt-task-actions";
import { Bar } from "./bar/bar";
import { BarSmall } from "./bar/bar-small";
import { Milestone } from "./milestone/milestone";
import { Project } from "./project/project";
import style from "./task-list.module.css";
import { ViewMode } from "../../types/public-types";
import { getProgressPoint, measureTextWidth } from "../../helpers/bar-helper";
import { BarProgressHandle } from "./bar/bar-progress-handle";

export type TaskItemProps = {
  task: BarTask;
  selectedItemsIdSet: Set<string>;
  arrowIndent: number;
  action: GanttContentMoveAction;
  project: number | null;
  taskHeight: number;
  isProgressChangeable: boolean;
  hoveredBarTaskId: string | null;
  isDateChangeable: boolean;
  isDelete: boolean;
  isSelected: boolean;
  mainTask: BarTask | null;
  childTask: BarTask | null;
  isSelectdItem: boolean;
  viewMode: ViewMode;
  rtl: boolean;
  setHoveredBarTaskId: (value: React.SetStateAction<string | null>) => void;
  setProject: (value: React.SetStateAction<number | null>) => void;
  setSelectedItem: (value: React.SetStateAction<BarTask | null>) => void;
  setMainTask: (value: React.SetStateAction<BarTask | null>) => void;
  setChildTask: (value: React.SetStateAction<BarTask | null>) => void;
  setDraggingFromTop: React.Dispatch<React.SetStateAction<boolean>>;
  setIsDependency: React.Dispatch<React.SetStateAction<boolean>>;
  setMousePosition: React.Dispatch<
    React.SetStateAction<{
      x: number;
      y: number;
    }>
  >;
  onEventStart: (
    action: GanttContentMoveAction,
    selectedTask: BarTask,
    event?: React.MouseEvent | React.KeyboardEvent
  ) => any;
};

export const TaskItem: React.FC<TaskItemProps> = props => {
  const {
    task,
    selectedItemsIdSet,
    project,
    mainTask,
    childTask,
    arrowIndent,
    action,
    hoveredBarTaskId,
    isDateChangeable,
    isProgressChangeable,
    isDelete,
    isSelectdItem,
    taskHeight,
    isSelected,
    viewMode,
    setProject,
    setSelectedItem,
    setMainTask,
    setChildTask,
    rtl,
    setHoveredBarTaskId,
    setDraggingFromTop,
    setMousePosition,
    setIsDependency,
    onEventStart,
  } = props;
  const textRef = useRef<SVGTextElement>(null);
  const [taskItem, setTaskItem] = useState<JSX.Element>(<div />);
  const [truncatedName, setTruncatedName] = useState(task.name);

  useEffect(() => {
    switch (task.typeInternal) {
      case "milestone":
        setTaskItem(<Milestone {...props} />);
        break;
      case "project":
        setTaskItem(<Project {...props} />);
        break;
      case "smalltask":
        setTaskItem(<BarSmall {...props} />);
        break;
      default:
        setTaskItem(<Bar {...props} />);
        break;
    }
  }, [task, isSelected]);

  useEffect(() => {
    if (textRef.current) {
      const font = window.getComputedStyle(textRef.current).font;
      const maxWidth = task.x2 - task.x1;
      const textWidth = measureTextWidth(task.name, font);

      const isTextInsideCalc = textWidth < maxWidth;
      if (!isTextInsideCalc) {
        setTruncatedName(truncateText(task.name, (task.x2 - task.x1) * 0.8));
      } else {
        setTruncatedName(task.name);
      }
    }
  }, [textRef, task, viewMode]);

  const getX = () => {
    const width = task.x2 - task.x1;
    const hasChild = task.barChildren.length > 0;
    if (rtl && textRef.current) {
      return (
        task.x1 -
        textRef.current.getBBox().width -
        arrowIndent * +hasChild -
        arrowIndent * 0.2
      );
    }

    return task.x1 + width * 0.5;
  };

  const truncateText = (text: string, maxWidth: number) => {
    if (!textRef.current) return text;
    let truncated = text;
    const ellipsis = "...";
    const font = window.getComputedStyle(textRef.current).font;

    while (
      measureTextWidth(truncated + ellipsis, font) > maxWidth &&
      truncated.length > 0
    ) {
      truncated = truncated.slice(0, -1);
    }

    return truncated + ellipsis;
  };

  const isHovered = hoveredBarTaskId === task.id;
  const isSameProject = project === task.projectId;

  const progressPoint = getProgressPoint(
    +!rtl * task.progressWidth + task.progressX,
    task.y,
    task.height
  );

  const handleMouseDown = (e: React.MouseEvent, isTop: boolean) => {
    e.preventDefault();
    setMainTask(task);
    setDraggingFromTop(isTop);
    const rowsElement = document.querySelector(".rows");
    if (rowsElement) {
      const rowsRect = rowsElement.getBoundingClientRect();
      const xPosition = e.clientX - rowsRect.left;
      const yPosition = e.clientY - rowsRect.top;
      setMousePosition({
        x: xPosition,
        y: yPosition,
      });
    }
    document.body.style.cursor = "grabbing";
    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
  };

  const handleMouseMove = (e: MouseEvent) => {
    const rowsElement = document.querySelector(".rows");
    if (rowsElement) {
      const rowsRect = rowsElement.getBoundingClientRect();
      const xPosition = e.clientX - rowsRect.left;
      const yPosition = e.clientY - rowsRect.top;
      setMousePosition({
        x: xPosition,
        y: yPosition,
      });
    }
  };

  const handleMouseUp = () => {
    setIsDependency(true);
    document.body.style.cursor = "auto";
    document.removeEventListener("mousemove", handleMouseMove);
    document.removeEventListener("mouseup", handleMouseUp);
  };

  const isMainTask = mainTask?.id === task.id;
  const isChildTask = childTask?.id === task.id;

  return (
    <g className={style.barWrapper} tabIndex={0}>
      <g
        onKeyDown={e => {
          switch (e.key) {
            case "Delete": {
              if (isDelete) onEventStart("delete", task, e);
              break;
            }
          }
          e.stopPropagation();
        }}
        onMouseEnter={e => {
          if (task.isDisabled) return;
          if (mainTask && !task.isDisabled) {
            if (mainTask.id === task.id) return;
            setChildTask(task);
            return;
          }
          onEventStart("mouseenter", task, e);
          setHoveredBarTaskId(task.id);
          task.projectId && setProject(task.projectId);
        }}
        onMouseLeave={e => {
          if (task.isDisabled) return;
          if (mainTask && !task.isDisabled) {
            if (mainTask.id === task.id) return;
            setChildTask(null);
            return;
          }
          if (action === "move") return;
          onEventStart("mouseleave", task, e);
          setHoveredBarTaskId(null);
          setProject(null);
        }}
        onDoubleClick={e => {
          if (task.isDisabled) return;
          onEventStart("dblclick", task, e);
        }}
        onClick={e => {
          if (task.isDisabled) return;
          onEventStart("click", task, e);
          if (selectedItemsIdSet.has(task.id)) {
            setSelectedItem(null);
            return;
          }

          if (!task.projectId) return;
          setSelectedItem(task);
        }}
        onFocus={() => {
          if (task.isDisabled) return;
          onEventStart("select", task);
        }}
        onMouseDown={e => {
          if (!isDateChangeable || task.isDisabled) return;
          onEventStart("move", task, e);
        }}
      >
        {taskItem}
        <text
          x={getX()}
          y={task.y + taskHeight * 0.5}
          className={style.barLabel}
          ref={textRef}
        >
          {truncatedName}
        </text>
        <rect
          x={task.x1}
          y={task.y}
          ry={task.barCornerRadius}
          rx={task.barCornerRadius}
          width={task.x2 - task.x1}
          height={task.height}
          className={style.border}
        />
        {(isHovered || isSameProject || isSelectdItem) &&
          action !== "progress" && (
            <rect
              x={task.x1}
              y={task.y}
              ry={task.barCornerRadius}
              rx={task.barCornerRadius}
              width={task.x2 - task.x1}
              height={task.height}
              className={
                selectedItemsIdSet.has(task.id)
                  ? style.selectedMask
                  : style.mask
              }
            />
          )}
      </g>

      <g className="handleGroup">
        {isProgressChangeable && action !== "move" && (
          <BarProgressHandle
            progressPoint={progressPoint}
            onMouseDown={e => {
              onEventStart("progress", task, e);
            }}
          />
        )}
      </g>
      {!task.isDisabled && (
        <circle
          cx={task.x1 + 3}
          cy={task.y - 6}
          r={4}
          fill={isMainTask ? "#95de64" : isChildTask ? "#ffd666" : "#ffffff"}
          stroke="#8c8c8c"
          strokeWidth={1}
          onMouseDown={e => handleMouseDown(e, true)}
          onMouseEnter={() => {
            if (!mainTask) return;
            if (mainTask.id === task.id) return;
            setChildTask(task);
          }}
          onMouseLeave={() => {
            if (!mainTask) return;
            if (mainTask.id === task.id) return;
            setChildTask(null);
          }}
        />
      )}
      {!task.isDisabled && (
        <circle
          cx={task.x2 - 3}
          cy={task.y + task.height + 6}
          r={4}
          fill={isMainTask ? "#95de64" : isChildTask ? "#ffd666" : "#ffffff"}
          stroke="#8c8c8c"
          strokeWidth={1}
          onMouseDown={e => handleMouseDown(e, false)}
          onMouseEnter={() => {
            if (!mainTask) return;
            if (mainTask.id === task.id) return;
            setChildTask(task);
          }}
          onMouseLeave={() => {
            if (!mainTask) return;
            if (mainTask.id === task.id) return;
            setChildTask(null);
          }}
        />
      )}
    </g>
  );
};
