import SolutionTemplate from "./SolutionTemplate";
import { getSolutionData } from "./solutionData";

export default function LessonPlanner() {
  return <SolutionTemplate data={getSolutionData("Lesson Planner")} />;
}

