import SolutionTemplate from "./SolutionTemplate";
import { getSolutionData } from "./solutionData";

export default function Performance() {
  return <SolutionTemplate data={getSolutionData("Performance")} />;
}

