import SolutionTemplate from "./SolutionTemplate";
import { getSolutionData } from "./solutionData";

export default function LearningHub() {
  return <SolutionTemplate data={getSolutionData("Learning Hub")} />;
}

