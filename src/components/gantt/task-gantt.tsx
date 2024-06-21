import React, { useRef, useEffect, useState, useMemo } from "react";
import { GridProps, Grid } from "../grid/grid";
import { CalendarProps, Calendar } from "../calendar/calendar";
import { TaskGanttContentProps, TaskGanttContent } from "./task-gantt-content";
import styles from "./gantt.module.css";
import { ViewMode } from "../../types/public-types";
import { calculateCurrentTimePosition } from "../../helpers/other-helper";
import Schedule from "../other/schedule";

export type TaskGanttProps = {
  gridProps: GridProps;
  calendarProps: CalendarProps;
  barProps: TaskGanttContentProps;
  ganttHeight: number;
  viewMode: ViewMode;
  isLoading?: boolean;
  columnWidth: number;
  scrollY: number;
  scrollX: number;
  dates: Date[];
  ganttSchedule: JSX.Element[];
};
export const TaskGantt: React.FC<TaskGanttProps> = ({
  gridProps,
  calendarProps,
  barProps,
  ganttHeight,
  viewMode,
  columnWidth,
  scrollY,
  scrollX,
  dates,
  isLoading,
  ganttSchedule,
}) => {
  const ganttSVGRef = useRef<SVGSVGElement>(null);
  const horizontalContainerRef = useRef<HTMLDivElement>(null);
  const verticalGanttContainerRef = useRef<HTMLDivElement>(null);
  const ganttScheduleByY = ganttSchedule.reduce((acc, schedule) => {
    const index = Math.floor(schedule.props.y / gridProps.rowHeight);
    if (!acc[index]) {
      acc[index] = [];
    }

    acc[index].push(schedule);

    return acc;
  }, {} as Record<string, JSX.Element[]>);
  const newBarProps = {
    ...barProps,
    ganttScheduleByY,
    svg: ganttSVGRef,
    viewMode,
  };

  const [currentTime, setCurrentTime] = useState(new Date());

  const currentTimePosition = useMemo(
    () =>
      calculateCurrentTimePosition(dates, currentTime, viewMode, columnWidth),
    [columnWidth, currentTime, dates, viewMode]
  );

  useEffect(() => {
    if (horizontalContainerRef.current) {
      horizontalContainerRef.current.scrollTop = scrollY;
    }
  }, [scrollY]);

  useEffect(() => {
    if (verticalGanttContainerRef.current) {
      verticalGanttContainerRef.current.scrollLeft = scrollX;
    }
  }, [scrollX]);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div
      className={styles.ganttVerticalContainer}
      ref={verticalGanttContainerRef}
      dir="ltr"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width={gridProps.svgWidth}
        height={calendarProps.headerHeight}
        fontFamily={barProps.fontFamily}
      >
        <Calendar {...calendarProps} />
      </svg>
      <div
        ref={horizontalContainerRef}
        className={styles.horizontalContainer}
        style={
          ganttHeight
            ? { height: ganttHeight, width: gridProps.svgWidth }
            : { width: gridProps.svgWidth }
        }
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width={gridProps.svgWidth}
          height={barProps.rowHeight * barProps.uneducatedTasks.length}
          fontFamily={barProps.fontFamily}
          ref={ganttSVGRef}
        >
          <Grid {...gridProps} />
          <Schedule ganttSchedule={ganttSchedule} />
          <TaskGanttContent {...newBarProps} />
          {currentTimePosition && (
            <line
              x1={currentTimePosition}
              y1={0}
              x2={currentTimePosition}
              y2={barProps.rowHeight * barProps.uneducatedTasks.length}
              stroke="red"
              strokeWidth={2}
              strokeDasharray="8 8"
            />
          )}
          {isLoading && (
            <g>
              <rect
                fill="rgba(0, 0, 0, 0.7)"
                width={gridProps.svgWidth}
                height={barProps.rowHeight * barProps.uneducatedTasks.length}
              />
            </g>
          )}
        </svg>
      </div>
    </div>
  );
};
