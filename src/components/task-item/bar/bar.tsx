import React from "react";
import { BarDisplay } from "./bar-display";
import { TaskItemProps } from "../task-item";

export const Bar: React.FC<TaskItemProps> = ({ task, isSelected }) => {
  return (
    <g>
      <BarDisplay
        x={task.x1}
        y={task.y}
        width={task.x2 - task.x1}
        height={task.height}
        progressX={task.progressX}
        progressWidth={task.progressWidth}
        barCornerRadius={task.barCornerRadius}
        styles={task.styles}
        isSelected={isSelected}
      />
    </g>
  );
};
