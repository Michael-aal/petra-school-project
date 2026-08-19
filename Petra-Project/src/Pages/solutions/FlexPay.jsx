import SolutionTemplate from "./SolutionTemplate";
import { getSolutionData } from "./solutionData";

export default function FlexPay() {
  return <SolutionTemplate data={getSolutionData("FlexPay")} />;
}

