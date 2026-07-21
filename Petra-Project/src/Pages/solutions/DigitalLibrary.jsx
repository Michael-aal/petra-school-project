import SolutionTemplate from "./SolutionTemplate";
import { getSolutionData } from "./solutionData";

export default function DigitalLibrary() {
  return <SolutionTemplate data={getSolutionData("Digital Library")} />;
}

