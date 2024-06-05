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
  draggingFromTop: boolean;
  isProgressChangeable: boolean;
  hoveredBarTaskId: string | null;
  isDateChangeable: boolean;
  mousePosition: {
    x: number;
    y: number;
  };
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
    draggingFromTop,
    arrowIndent,
    action,
    hoveredBarTaskId,
    isDateChangeable,
    isProgressChangeable,
    mousePosition,
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
      const isShowText =
        viewMode !== ViewMode.Month &&
        viewMode !== ViewMode.QuarterYear &&
        viewMode !== ViewMode.Week &&
        viewMode !== ViewMode.Year;
      if (!isShowText) {
        setTruncatedName("");
        return;
      }
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
      setMousePosition({
        x: e.clientX - rowsRect.left + getX(),
        y: e.clientY - rowsRect.top,
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
      setMousePosition({
        x: e.clientX - rowsRect.left + getX(),
        y: e.clientY - rowsRect.top,
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
          onEventStart("dblclick", task, e);
        }}
        onClick={e => {
          onEventStart("click", task, e);
          if (selectedItemsIdSet.has(task.id)) {
            setSelectedItem(null);
            return;
          }

          if (!task.projectId) return;
          setSelectedItem(task);
        }}
        onFocus={() => {
          onEventStart("select", task);
        }}
        onMouseDown={e => {
          if (!isDateChangeable) return;
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
          cx={getX()}
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
          cx={getX()}
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
      {isMainTask && (
        <line
          x1={getX()}
          y1={task.y + (draggingFromTop ? -6 : task.height + 6)}
          x2={mousePosition.x - getX()}
          y2={mousePosition.y}
          stroke="black"
          strokeDasharray="4"
          markerEnd="url(#arrow)"
        />
      )}
    </g>
  );
};
