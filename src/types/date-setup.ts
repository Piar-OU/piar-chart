import { ViewMode } from "./public-types";

export interface DateSetup {
  dates: { dates: Date[]; indexesMap: Map<string, number> };
  viewMode: ViewMode;
}
