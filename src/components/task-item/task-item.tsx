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
  isSelectdItem: boolean;
  viewMode: ViewMode;
  rtl: boolean;
  setHoveredBarTaskId: (value: React.SetStateAction<string | null>) => void;
  setProject: (value: React.SetStateAction<number | null>) => void;
  setSelectedItem: (value: React.SetStateAction<BarTask | null>) => void;
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
    rtl,
    setHoveredBarTaskId,
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
          onEventStart("mouseenter", task, e);
          setHoveredBarTaskId(task.id);
          task.projectId && setProject(task.projectId);
        }}
        onMouseLeave={e => {
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
    </g>
  );
};
