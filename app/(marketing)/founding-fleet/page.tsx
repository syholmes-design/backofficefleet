import type { Metadata } from "next";
import FoundingFleetProgramPage from "@/components/marketing/FoundingFleetProgramPage";

export const metadata: Metadata = {
  title: "Founding Fleet Program | BackOfficeFleet",
  description:
    "Join the BackOfficeFleet Founding Fleet Program and help shape an enforcement-driven operating system for trucking back-office operations.",
};

export default FoundingFleetProgramRoute;

function FoundingFleetProgramRoute() {
  return <FoundingFleetProgramPage />;
}
