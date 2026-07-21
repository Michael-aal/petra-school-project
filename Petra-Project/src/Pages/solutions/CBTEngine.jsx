import SolutionTemplate from "./SolutionTemplate";
import { getSolutionData } from "./solutionData";

export default function CBTEngine() {
  return <SolutionTemplate data={getSolutionData("CBT Engine")} />;
}

