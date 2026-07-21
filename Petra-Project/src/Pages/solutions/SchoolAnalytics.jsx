import SolutionTemplate from "./SolutionTemplate";
import { getSolutionData } from "./solutionData";

export default function SchoolAnalytics() {
  return <SolutionTemplate data={getSolutionData("School Analytics")} />;
}

