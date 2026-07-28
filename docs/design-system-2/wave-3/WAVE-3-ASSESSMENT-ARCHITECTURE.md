# Wave 3 Assessment Architecture

## Route

The assessment system is implemented as one public page:

`/assessment/`

Deep links are query-string states on the same page:

- `/assessment/?type=aggregator`
- `/assessment/?type=private-fleet`
- `/assessment/?type=for-hire-fleet`
- `/assessment/?type=government`
- `/assessment/?type=driver`

The canonical URL remains `https://backofficefleet.com/assessment/`.

## Files

- Page shell: `Website/assessment/index.html`
- Assessment engine: `Website/assets/js/wave3-assessment.js`
- Shared Wave 3 styling: `Website/assets/css/styles.css`
- Sitemap: `Website/sitemap.xml`

## Runtime Model

The page renders a value proposition plus an empty assessment root in HTML and loads a reusable JavaScript engine. The engine owns:

- audience selection
- selected state from the `type` query parameter
- five photographic audience cards
- question rendering
- progress rendering
- previous/next navigation
- review state
- result state
- restart action
- return-to-audience links
- browser Back and Forward behavior
- focus movement to the selected assessment heading

No separate HTML pages were created for each audience assessment.

## Owner Correction Behavior

The five photographic cards are always visible on `/assessment/`. Selecting a card updates the URL, applies a selected visual state, and renders the selected assessment directly beneath the card grid. The duplicated in-question audience tab row was removed.

The progress system uses one component:

- assessment title
- `Question X of 12`
- section name and section count
- percent complete
- one accessible progress bar

## State Management

Answers are stored in browser memory only:

- no `localStorage`
- no `sessionStorage`
- no cookies
- no fetch calls
- no backend persistence
- no Supabase calls

The page creates an in-memory answers object keyed by audience type. Switching audience paths during the same page session preserves the current answers for each audience. Reloading clears in-memory answers, which is documented in the page copy.

## Query Behavior

On initial load, the engine reads `new URLSearchParams(window.location.search).get("type")`.

- Valid type: render that audience assessment in place.
- Missing type: render five audience cards.
- Unknown type: render the landing state.

Selecting an audience updates the URL with `history.pushState()` and re-renders without a full page navigation. Browser `popstate` re-reads the query and re-renders the matching state.

## Accessibility Model

- The audience selector uses real buttons inside a `role="tablist"` with `role="tab"` and `aria-selected`.
- Questions use `fieldset`, `legend`, associated radio inputs, and labels.
- Progress text is exposed through an `aria-live` region.
- Results are rendered in an `aria-live` container.
- Buttons remain keyboard-operable and visible focus comes from the shared DS2 focus styles.
- No essential content is conveyed only through imagery.

## Assessment Result

Each result includes:

- overall readiness band
- synthetic percentage score
- section-by-section percentages
- top three operational gaps
- recommended BOF modules or workflows
- recommended next step
- disclaimer

The result is directional only and is not transmitted or persisted.
