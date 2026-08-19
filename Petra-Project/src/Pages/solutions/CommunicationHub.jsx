import SolutionTemplate from "./SolutionTemplate";
import { getSolutionData } from "./solutionData";

export default function CommunicationHub() {
  return <SolutionTemplate data={getSolutionData("Communication Hub")} />;
}

