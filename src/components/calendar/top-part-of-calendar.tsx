import React from "react";
import styles from "./calendar.module.css";

type TopPartOfCalendarProps = {
  value: string;
  xText: number;
  yText: number;
};

export const TopPartOfCalendar: React.FC<TopPartOfCalendarProps> = ({
  value,
  xText,
  yText,
}) => {
  return (
    <g className="calendarTop">
      <text
        key={value + "text"}
        y={yText}
        x={xText}
        className={styles.calendarTopText}
      >
        {value}
      </text>
    </g>
  );
};
