import SolutionTemplate from "./SolutionTemplate";
import { getSolutionData } from "./solutionData";

export default function Admissions() {
  return <SolutionTemplate data={getSolutionData("Admissions")} />;
}

