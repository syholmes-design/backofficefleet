import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Who Are We? | BackOfficeFleet",
  description: "Meet the people behind BackOfficeFleet and its back-office operating model for growing trucking companies.",
};

const TEAM = [
  {
    name: "Howard Ridgeway",
    title: "Trucking Executive | Fleet Operations & Transportation",
    paragraphs: [
      "Howard Ridgeway brings decades of hands-on experience in trucking and fleet operations to BackOfficeFleet. He is the founder and CEO of HRT II LLC and has operated H.R. Transport LLC, giving him direct experience with the realities of running a trucking business and managing the demands placed on fleet owners.",
      "His experience is grounded in the day-to-day realities of transportation: equipment, drivers, freight, load security, operating requirements and the practical decisions required to keep a fleet moving. His work has also included developing practical solutions to trucking problems, including innovations in load security.",
      "At BackOfficeFleet, Ridgeway brings the fleet owner's perspective to the development of an outsourced back-office model. His focus is on making sure BOF addresses the problems that actually confront trucking companies as they grow—not simply the problems that software developers imagine.",
    ],
  },
  {
    name: "Vincent G. Whitelock, PhD",
    title: "Operations & Supply Chain Management Expert",
    paragraphs: [
      "Vincent G. Whitelock, PhD, brings an academic and practical perspective in operations, procurement, supply chain management and business-process integration to BackOfficeFleet.",
      "Whitelock is an Associate Professor of Operations and Supply Chain Management at Central Michigan University. His work focuses on integrating business processes across operations, purchasing and supply-chain functions, with particular emphasis on strategic alignment, organizational performance and the way interconnected processes affect business results.",
      "He holds a PhD in Manufacturing Management and Engineering from the University of Toledo, an MBA from the University of Toledo and an MS in Industrial Administration from Carnegie Mellon University's Tepper School of Business.",
      "At BackOfficeFleet, Whitelock brings that expertise to the design of an integrated operating model in which the administrative functions behind a trucking operation work together rather than as disconnected departments. His perspective is central to BOF's goal of connecting people, processes, information and financial outcomes across the fleet.",
    ],
  },
  {
    name: "Sylvester D. Holmes",
    title: "Attorney | Compensation, Benefits & Business Operations",
    paragraphs: [
      "Sylvester D. Holmes brings extensive experience in law, executive compensation, employee benefits, tax and corporate administration to BackOfficeFleet.",
      "His corporate career has included senior legal and compensation roles with major organizations, including Parker Hannifin, Dana and Pentair, as well as earlier work in tax law. Public records also identify his role as an in-house attorney at Parker Hannifin beginning in 2016.",
      "Holmes has also served at the board level as Chair of the Compensation Committee of ProMedica Healthcare System, responsible for executive compensation and related governance matters. That experience gave him a perspective that extends beyond administering compensation programs to understanding how compensation, performance, governance and organizational strategy have to work together.",
      "At BackOfficeFleet, Holmes brings that experience to the development of an outsourced back-office model for growing transportation companies. His focus includes the people, compensation, benefits, financial and administrative responsibilities that become increasingly complex as a fleet grows.",
    ],
  },
] as const;

export default function CompanyPage() {
  return (
    <main className="bof-home-section bof-home-section--white">
      <div className="bof-mkt-container">
        <p className="bof-home-eyebrow">BackOfficeFleet</p>
        <h1 className="max-w-3xl text-5xl font-extrabold tracking-tight text-slate-950">WHO ARE WE?</h1>
        <p className="mt-5 max-w-4xl text-lg leading-8 text-slate-600">
          BackOfficeFleet brings together three different perspectives on the transportation business: the fleet
          operator, the operations and supply-chain expert, and the attorney and corporate administration expert.
        </p>
          <p className="mt-5 max-w-4xl text-lg leading-8 text-slate-600">
            Together, those perspectives shape BOF&apos;s mission: to become the back office behind growing transportation
          companies, allowing owners to keep their focus on their fleets, customers and dispatch while BOF takes
          responsibility for the work behind the operation.
        </p>
        <div className="mt-16 grid gap-14">
          {TEAM.map((person) => (
            <article key={person.name} className="max-w-4xl border-t border-slate-200 pt-8">
              <p className="bof-home-eyebrow">{person.title}</p>
              <h2 className="text-3xl font-extrabold tracking-tight text-slate-950">{person.name}</h2>
              <div className="mt-5 grid gap-4 text-lg leading-8 text-slate-600">
                {person.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
              </div>
            </article>
          ))}
        </div>
        <Link href="/book-assessment?source=company" className="mt-14 inline-flex bof-mkt-btn-enterprise bof-mkt-btn-enterprise-primary">
          Fleet Assessment
        </Link>
      </div>
    </main>
  );
}
