import SolutionTemplate from "./SolutionTemplate";
import { getSolutionData } from "./solutionData";

export default function SchoolOS() {
  return <SolutionTemplate data={getSolutionData("School OS")} />;
}

