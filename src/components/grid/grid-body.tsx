import React, { ReactChild, useMemo } from "react";
import { Task } from "../../types/public-types";
import { addToDate } from "../../helpers/date-helper";
import styles from "./grid.module.css";
import {
  calculateNonWorkingPeriods,
  taskXCoordinate,
  taskYCoordinate,
} from "../../helpers/bar-helper";

export type GridBodyProps = {
  tasks: (Task | Task[])[];
  dates: Date[];
  hoveredIndex: number | null;
  svgWidth: number;
  isShowNonWorkingTime?: boolean;
  shifts?: {
    shiftTypes: {
      startDate: string;
      finishDate: string;
      withDayOff: boolean;
      isNextDayEnd: boolean;
    }[];
    index: number;
  }[];
  rowHeight: number;
  columnWidth: number;
  todayColor: string;
  rtl: boolean;
  setHoveredIndex: (id: number | null) => () => void;
};
export const GridBody: React.FC<GridBodyProps> = ({
  tasks,
  dates,
  hoveredIndex,
  isShowNonWorkingTime,
  shifts,
  rowHeight,
  svgWidth,
  columnWidth,
  todayColor,
  rtl,
  setHoveredIndex,
}) => {
  const convertedShifts = useMemo(() => {
    const startDate = dates[1];
    const endDate = dates[dates.length - 2];
    if (!isShowNonWorkingTime || !shifts || !startDate || !endDate) return;
    const data = shifts.map(shift => ({
      shiftTypes: calculateNonWorkingPeriods(
        shift.shiftTypes,
        startDate,
        endDate
      ).map(({ start, end }) => ({
        x1: taskXCoordinate(start, dates, columnWidth),
        x2: taskXCoordinate(end, dates, columnWidth),
        y: taskYCoordinate(shift.index, rowHeight, rowHeight),
      })),
      index: shift.index,
    }));

    return data.map(({ shiftTypes }) => shiftTypes).flat(1);
  }, [columnWidth, dates, isShowNonWorkingTime, rowHeight, shifts]);

  let y = 0;
  const gridRows: ReactChild[] = [];
  const rowLines: ReactChild[] = [
    <line
      key="RowLineFirst"
      x="0"
      y1={0}
      x2={svgWidth}
      y2={0}
      className={styles.gridRowLineFirst}
    />,
  ];
  tasks.forEach((task, index) => {
    gridRows.push(
      <rect
        onMouseMove={setHoveredIndex(index)}
        onMouseLeave={setHoveredIndex(null)}
        key={"Row" + (Array.isArray(task) ? task[0].id : task.id)}
        x="0"
        y={y}
        width={svgWidth}
        height={rowHeight}
        className={
          hoveredIndex === index ? styles.gridRowHovered : styles.gridRow
        }
      />
    );
    rowLines.push(
      <line
        key={"RowLine" + (Array.isArray(task) ? task[0].id : task.id)}
        x="0"
        y1={y + rowHeight}
        x2={svgWidth}
        y2={y + rowHeight}
        className={styles.gridRowLine}
      />
    );
    y += rowHeight;
  });

  const now = new Date();
  let tickX = 0;
  const ticks: ReactChild[] = [];
  let today: ReactChild = <rect />;
  for (let i = 0; i < dates.length; i++) {
    const date = dates[i];
    ticks.push(
      <line
        key={date.getTime()}
        x1={tickX}
        y1={0}
        x2={tickX}
        y2={y}
        className={styles.gridTick}
      />
    );
    if (
      (i + 1 !== dates.length &&
        date.getTime() < now.getTime() &&
        dates[i + 1].getTime() >= now.getTime()) ||
      // if current date is last
      (i !== 0 &&
        i + 1 === dates.length &&
        date.getTime() < now.getTime() &&
        addToDate(
          date,
          date.getTime() - dates[i - 1].getTime(),
          "millisecond"
        ).getTime() >= now.getTime())
    ) {
      today = (
        <rect
          x={tickX}
          y={0}
          width={columnWidth}
          height={y}
          fill={todayColor}
        />
      );
    }
    // rtl for today
    if (
      rtl &&
      i + 1 !== dates.length &&
      date.getTime() >= now.getTime() &&
      dates[i + 1].getTime() < now.getTime()
    ) {
      today = (
        <rect
          x={tickX + columnWidth}
          y={0}
          width={columnWidth}
          height={y}
          fill={todayColor}
        />
      );
    }
    tickX += columnWidth;
  }
  return (
    <g className="gridBody">
      <defs>
        <pattern
          id="diagonalHatch"
          patternUnits="userSpaceOnUse"
          width="16"
          height="16"
        >
          <path d="M-4,4 l8,-8 M0,16 l16,-16 M12,20 l8,-8" stroke="gray" />
        </pattern>
      </defs>
      <g className="rows">{gridRows}</g>
      <g className="rowLines">{rowLines}</g>
      <g className="ticks">{ticks}</g>
      <g className="today">{today}</g>
      {convertedShifts &&
        convertedShifts.map(period => (
          <g key={period.x1}>
            <rect
              x={period.x1}
              y={period.y}
              width={period.x2 - period.x1}
              height={rowHeight}
              fill="gray"
              fillOpacity={0.1}
            />
            <rect
              x={period.x1}
              y={period.y}
              width={period.x2 - period.x1}
              height={rowHeight}
              fill="url(#diagonalHatch)"
              stroke="#262626"
              strokeWidth={1}
            />
          </g>
        ))}
    </g>
  );
};
