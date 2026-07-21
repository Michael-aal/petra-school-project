import SolutionTemplate from "./SolutionTemplate";
import { getSolutionData } from "./solutionData";

export default function SchoolOS() {
  const data = getSolutionData("School OS");
  data.heroImage = "https://acceede.com/assets/school-dashboard-DC-zEyOT.png";
  return <SolutionTemplate data={data} />;
}
