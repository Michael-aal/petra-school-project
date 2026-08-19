import SolutionTemplate from "./SolutionTemplate";
import { getSolutionData } from "./solutionData";

export default function AIStudyApp() {
  return <SolutionTemplate data={getSolutionData("AI Study App")} />;
}

