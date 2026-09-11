import SolutionTemplate from "./SolutionTemplate";
import { getSolutionData } from "./solutionData";

export default function FinancialManagement() {
  return <SolutionTemplate data={getSolutionData("Financial Management")} />;
}

