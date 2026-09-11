import SolutionTemplate from "./SolutionTemplate";
import { getSolutionData } from "./solutionData";

export default function AssessmentTools() {
  return <SolutionTemplate data={getSolutionData("Assessment Tools")} />;
}

