import React, { useEffect, useRef, useState } from "react";
import { BarTask } from "../../types/bar-task";
import { GanttContentMoveAction } from "../../types/gantt-task-actions";
import { Bar } from "./bar/bar";
import { BarSmall } from "./bar/bar-small";
import { Milestone } from "./milestone/milestone";
import { Project } from "./project/project";
import style from "./task-list.module.css";
import { ViewMode } from "../../types/public-types";
import { measureTextWidth } from "../../helpers/bar-helper";

export type TaskItemProps = {
  task: BarTask;
  arrowIndent: number;
  taskHeight: number;
  isProgressChangeable: boolean;
  isDateChangeable: boolean;
  isDelete: boolean;
  isSelected: boolean;
  viewMode: ViewMode;
  rtl: boolean;
  setHoveredBarTaskId: (value: React.SetStateAction<string | null>) => void;
  onEventStart: (
    action: GanttContentMoveAction,
    selectedTask: BarTask,
    event?: React.MouseEvent | React.KeyboardEvent
  ) => any;
};

export const TaskItem: React.FC<TaskItemProps> = props => {
  const {
    task,
    arrowIndent,
    isDelete,
    taskHeight,
    isSelected,
    viewMode,
    rtl,
    setHoveredBarTaskId,
    onEventStart,
  } = props;
  const textRef = useRef<SVGTextElement>(null);
  const [taskItem, setTaskItem] = useState<JSX.Element>(<div />);
  const [isTextInside, setIsTextInside] = useState(true);
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
      setIsTextInside(isTextInsideCalc);
      if (!isTextInsideCalc) {
        setTruncatedName(truncateText(task.name, (task.x2 - task.x1) * 0.8));
      } else {
        setTruncatedName(task.name);
      }
    }
  }, [textRef, task.name, viewMode]);

  const getX = () => {
    const width = task.x2 - task.x1;
    const hasChild = task.barChildren.length > 0;
    if (isTextInside) {
      return task.x1 + width * 0.5;
    }
    if (rtl && textRef.current) {
      return (
        task.x1 -
        textRef.current.getBBox().width -
        arrowIndent * +hasChild -
        arrowIndent * 0.2
      );
    } else {
      return task.x1 * 1.2;
    }
  };

  const truncateText = (text: string, maxWidth: number) => {
    if (!textRef.current) return text;
    let truncated = text;
    const ellipsis = "...";
    const font = window.getComputedStyle(textRef.current).font;
    let textWidth = measureTextWidth(task.name, font);

    while (textWidth > maxWidth && truncated.length > 0) {
      truncated = truncated.slice(0, -1);
      textRef.current.textContent = truncated + ellipsis;
      textWidth = measureTextWidth(task.name, font);
    }

    return truncated + ellipsis;
  };

  return (
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
      }}
      onMouseLeave={e => {
        onEventStart("mouseleave", task, e);
        setHoveredBarTaskId(null);
      }}
      onDoubleClick={e => {
        onEventStart("dblclick", task, e);
      }}
      onClick={e => {
        onEventStart("click", task, e);
      }}
      onFocus={() => {
        onEventStart("select", task);
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
    </g>
  );
};
