import type { Metadata } from "next";
import { QA_GROUPS } from "./qa-data";

export const metadata: Metadata = {
  title: "Q&A | BackOfficeFleet",
  description: "Enterprise questions and answers about the BackOfficeFleet back-office operating model.",
};

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
