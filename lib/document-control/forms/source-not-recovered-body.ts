export function sourceNotRecoveredBody(opts: {
  vaultTitle: string;
  recoveredSearch: string;
  impostorNote: string;
}): string {
  return `
<div class="callout">SOURCE NOT RECOVERED / REVIEW REQUIRED. The previous teal generated presentation was removed from the current Company Operations Vault surface. This sheet is an identity placeholder. It is not a policy, SOP, or compliance program.</div>
<p><span class="tag tag-review">Legal / compliance review required</span></p>
<h2>Section 1 — What was removed</h2>
<p>${opts.impostorNote}</p>
<h2>Section 2 — Search performed</h2>
<p>Recovered/, source-assets/, docs/, scripts/templates/, and the controlled roster were searched for a substantive BOF source matching <strong>${opts.vaultTitle}</strong>. ${opts.recoveredSearch}</p>
<h2>Section 3 — What this sheet is not</h2>
<ul>
  <li>Not an approved handbook, SOP, or legal opinion.</li>
  <li>Not a restatement of GDPR, FLSA, IFTA, or other statutes.</li>
  <li>Not fabricated operating rules.</li>
</ul>
<p>A missing policy on the current surface is preferable to a fabricated-looking policy. Restore content only from a recovered BOF source.</p>
`;
}
