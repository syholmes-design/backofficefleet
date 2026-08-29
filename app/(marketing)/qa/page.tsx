import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Q&A | BackOfficeFleet",
  description: "Enterprise questions and answers about the BackOfficeFleet back-office operating model.",
};

type QaItem = { question: string; answer: string };
type QaGroup = { title: string; items: readonly QaItem[] };

const QA_GROUPS: readonly QaGroup[] = [
  {
    title: "Drivers",
    items: [
      {
        question: "Does BOF add more burden to me?",
        answer: "No. BOF is designed to reduce unnecessary administrative burden while increasing accountability. It may ask drivers to complete or confirm information in certain areas, while keeping credential requirements and expiration dates visible, making records available to the driver, carrying the driver's BOF account when they leave a company, simplifying pre-trip documentation, streamlining POD and lumper processes, and improving visibility into performance incentives and opportunities. BOF does not promise that the job itself becomes easier.",
      },
      {
        question: "What happens to my BOF account if I leave my company?",
        answer: "The driver account can remain with the driver and keep important records and documents organized for the next employer. The account is intended to preserve the driver's usable record rather than disappear with one company's internal files.",
      },
      {
        question: "What information does BOF ask a driver to keep current?",
        answer: "BOF can organize credential, qualification, training, pre-trip, delivery-proof, and related driver records. Missing, expiring, or overdue items become visible follow-up rather than a surprise at release time.",
      },
    ],
  },
  {
    title: "Fleet Owners",
    items: [
      {
        question: "Do I have to keep hiring people as my fleet grows?",
        answer: "No. BOF is designed to become the back office behind your fleet. As the fleet grows, BOF can take over the back-office responsibilities that would otherwise require additional internal staff. The fleet can keep dispatch in-house while BOF takes responsibility for the work behind the operation.",
      },
      {
        question: "What does BOF actually take off my plate?",
        answer: "The back office: qualification and credential follow-up, document control, HR support, settlements, financial administration, maintenance administration, procurement coordination, and exception follow-up. BOF organizes the records, owners, deadlines, and next actions required to keep the fleet operating.",
      },
      {
        question: "Do I have to give up control of my fleet?",
        answer: "No. The owner retains control of the fleet and can keep dispatch in-house while BOF operates the back office. BOF's role is to take responsibility for administrative work and make the operating record more usable.",
      },
      {
        question: "What would a 20-30 truck fleet have to build internally?",
        answer: "It would need a repeatable way to coordinate driver records, qualification, documents, safety and compliance follow-up, settlement support, invoicing, cash visibility, maintenance administration, vendor activity, and unresolved exceptions. BOF can take responsibility for that administrative operating layer without promising to eliminate every internal role.",
      },
    ],
  },
  {
    title: "Dispatch",
    items: [
      {
        question: "Does BOF replace dispatch?",
        answer: "No. The BOF model is keep dispatch in-house and outsource the back office. BOF supports dispatch by keeping readiness, documents, proof, exceptions, and settlement context connected to the work dispatch is managing.",
      },
      {
        question: "How does BOF support a release decision?",
        answer: "BOF connects the driver, qualification, credential, equipment, load, document, and exception records that inform readiness. It makes missing evidence and next actions visible so the responsible operating team can make a better-informed release decision.",
      },
    ],
  },
  {
    title: "Customers",
    items: [
      {
        question: "Will BOF change how we receive proof?",
        answer: "No. BOF organizes required proof and documentation behind the move so records are easier to see, review, and follow through. Customer-facing requirements remain part of the operating record.",
      },
      {
        question: "Why should a customer care whether a carrier uses BOF?",
        answer: "BOF can provide greater visibility into readiness, execution, exceptions, proof, and required documentation. That makes the carrier's administrative follow-through easier to review without turning BOF into a freight marketplace.",
      },
    ],
  },
  {
    title: "Compliance & Safety",
    items: [
      {
        question: "How does BOF handle compliance responsibility?",
        answer: "BOF can take responsibility for administrative monitoring, documentation, expiration tracking, requests, follow-up, exception identification, next-action assignment, resolution tracking, and record maintenance. Qualified people remain responsible for regulated judgments and final operating decisions.",
      },
      {
        question: "What happens when a credential or safety item is missing?",
        answer: "BOF identifies the missing, expiring, conflicting, or overdue item, links it to the affected driver, equipment, or operation, assigns a next action, and keeps the issue visible until resolution is verified.",
      },
    ],
  },
  {
    title: "Finance",
    items: [
      {
        question: "How does BOF connect finance to operations?",
        answer: "Settlement information connects to drivers and loads. Delivery proof supports invoices. Invoices and receivables inform factoring and cash-flow review. Deductions and operating exceptions stay attached to the record instead of being reconciled later from separate spreadsheets and email.",
      },
      {
        question: "Does BOF provide financial or tax advice?",
        answer: "No. BOF can organize financial administration, recurring records, deadlines, proof, approvals, and follow-up. It does not claim to be a bank, lender, accounting firm, payroll provider, tax advisor, or factoring company.",
      },
    ],
  },
  {
    title: "Procurement",
    items: [
      {
        question: "Can BOF help a smaller fleet organize purchasing?",
        answer: "BOF can organize purchasing needs, vendor relationships, program requirements, pricing information, fuel activity, approvals, receipts, and cost follow-up. Where available, it may help provide access to vendor programs or purchasing leverage, but it does not promise a specific discount or savings result.",
      },
      {
        question: "Does BOF make purchasing decisions for the fleet?",
        answer: "No. BOF can make the request, vendor, pricing, approval, delivery, invoice, and cost record visible. Actual purchasing decisions and vendor terms remain subject to fleet approval.",
      },
    ],
  },
  {
    title: "Operating Record / Technology",
    items: [
      {
        question: "Is BOF a fleet tracker?",
        answer: "No. BOF is the back-office operating layer for readiness, qualification, documents, HR support, safety and compliance administration, settlements, financial administration, maintenance administration, procurement coordination, and exception follow-up.",
      },
      {
        question: "What happens when something falls through the cracks?",
        answer: "BOF identifies the issue, makes the next action visible, assigns responsibility, and keeps the issue in the operating record until resolved. The record preserves the evidence, status, owner, and history needed for follow-through.",
      },
      {
        question: "How does BOF connect separate back-office responsibilities?",
        answer: "People and HR connect to driver records, qualification, readiness, and dispatch. Operations and compliance connect dispatch to delivery, proof, exceptions, and settlement. Finance connects settlement to invoice, receivable, and cash. Procurement connects vendors, equipment, supplies, and fuel to cost and fleet operations.",
      },
    ],
  },
];

export default function QaPage() {
  return (
    <main className="bof-service-page bof-qa-page">
      <div className="bof-mkt-container">
        <header className="bof-service-page__hero">
          <p className="bof-home-eyebrow">BackOfficeFleet</p>
          <h1>Q&amp;A</h1>
          <p>
            BOF becomes the back office behind growing transportation companies. Keep dispatch in-house while BOF
            takes responsibility for the administrative work behind the operation.
          </p>
        </header>
        <section className="bof-qa-page__intro">
          <h2>Grow the fleet. Not the back office.</h2>
          <p>
            The answers below explain what BOF can take over, what records it maintains, how exceptions move forward,
            and where fleet owners, drivers, dispatch teams, customers, and partners keep control.
          </p>
        </section>
        <div className="bof-qa-page__groups">
          {QA_GROUPS.map((group) => (
            <section key={group.title} className="bof-qa-page__group" aria-labelledby={`qa-${group.title}`}>
              <h2 id={`qa-${group.title}`}>{group.title}</h2>
              <div className="bof-home-faq">
                {group.items.map((item) => (
                  <details key={item.question}>
                    <summary>{item.question}</summary>
                    <p>{item.answer}</p>
                  </details>
                ))}
              </div>
            </section>
          ))}
        </div>
        <section className="bof-qa-page__closing">
          <h2>Ready to see how BOF would operate behind your fleet?</h2>
          <a href="/dashboard" className="bof-mkt-btn-enterprise bof-mkt-btn-enterprise-primary">SEE BOF IN ACTION</a>
        </section>
      </div>
    </main>
  );
}
