import SolutionTemplate from "./SolutionTemplate";
import { getSolutionData } from "./solutionData";

export default function PetraPay() {
  return <SolutionTemplate data={getSolutionData("Petra Pay")} />;
}

