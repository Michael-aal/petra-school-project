import SolutionTemplate from "./SolutionTemplate";
import { getSolutionData } from "./solutionData";

export default function TeacherWorkspace() {
  return <SolutionTemplate data={getSolutionData("Teacher Workspace")} />;
}

