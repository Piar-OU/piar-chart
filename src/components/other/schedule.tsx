import React from "react";

type Props = {
  ganttSchedule: JSX.Element[];
};

const Schedule: React.FC<Props> = ({ ganttSchedule }) => {
  return <g className="ganttSchedule">{ganttSchedule}</g>;
};

export default React.memo(Schedule, (prevProps, nextProps) => {
  return prevProps.ganttSchedule.length === nextProps.ganttSchedule.length;
});
