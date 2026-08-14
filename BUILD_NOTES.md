# Build notes — Purelane homepage → Shopify/Dawn

## Status
**The 5 required sections are built, live-verified, and error-free**: Hero (`purelane-hero.liquid`),
Shop grid (`purelane-shop.liquid`), Best-selling combos (`purelane-combos.liquid`), Bundles
(`purelane-bundles.liquid`), Reviews rail (`purelane-reviews.liquid`) — plus a shared
`snippets/card-purelane-product.liquid` used by Shop and visually echoed by Combos/Bundles.

Beyond the required five, also built: the full-page animated background scene system + scroll
progress rail (`purelane-scenes.liquid`), an announcement ticker (`purelane-ticker.liquid`,
replaces Dawn's default announcement bar), sticky mobile CTA (`purelane-sticky-cta.liquid`),
Ingredients (`purelane-ingredients.liquid`), Pillars/"how it works" (`purelane-pillars.liquid`),
Proof/stats with an auto-cycling product rotator (`purelane-proof.liquid`), Why-bundles
(`purelane-whybundles.liquid`), a trust bar (`purelane-trust.liquid`), the bundle-categories grid
(`purelane-categories.liquid`), and a newsletter signup panel (`purelane-signup.liquid`). That
covers everything in the prototype except a fully custom footer (Dawn's own footer is in place,
re-skinned via CSS to match, with real link-list navigation wired in) and the PDP (product detail
page) — cut for time, not forgotten.

**Verified live, with real store data**: pushed to a real Shopify **development store** (Partner-org
linked), `q9hdic-gg-uidnykeq.myshopify.com`, theme ID `155748860096` (the live theme on this store).
Editor: `https://q9hdic-gg-uidnykeq.myshopify.com/admin/themes/155748860096/editor` (storefront
password: `gaodre`). `shopify theme check` passes clean (0 errors, 11 pre-existing warnings, all in
stock Dawn files I didn't touch).

An earlier store (`q9hdic-gg.myshopify.com`) was a regular/trial store, not Partner-linked — that
turned out to block proper Admin API scope approval for a custom app, so it was abandoned in favour
of a real development store partway through. See "AI workflow notes" for the full story; only the
new store is current.

**Real data is seeded and live**, not just placeholder/empty states:
- **12 products**, created and published to the Online Store channel via the Admin GraphQL API
  (`productSet` + `productCreateMedia` + `publishablePublish`), covering the required edge cases:
  one **sold out** (Copper, Bronze & Brass Cleaner — tracked inventory, 0 on hand, deny-oversell),
  one with **no image** (Fabric Conditioner & Softener — falls back to the generic placeholder
  bottle, same code path as an empty collection), and one with a deliberately **long title**
  (clamped to 2 lines via the card's `-webkit-line-clamp`). The other 9 carry real prices,
  compare-at prices, and product photography (the reference's own extracted SVG art, uploaded via
  the GitHub-hosted raw file URL as the media source).
- **6 collections** (Bestsellers, Full range, and 4 category collections) tying the Shop grid, Range
  shelf, and Bundle categories sections to real curated product sets instead of "all products."
- **The `combo` metaobject type is created** in the store (Content → Metaobjects → Combo), with its
  full field schema (`metaobjects/combo.json`), and **5 real combo entries** — the reference's own
  Kitchen essentials / Laundry care bundle / Complete home bundle / Bathroom deep clean / Hard water
  solution kit — each computing its "you save ₹X" from the real prices of the products it
  references, live, in Liquid.
- Hero's bundle-size carousel, the Bundles tier cards, the Shop grid, the Range shelf, and Bundle
  categories are all wired in `templates/index.json` to these real products/collections/combos.

Getting here needed the Admin API access documented as blocked in earlier drafts of this file to
actually get resolved — see "AI workflow notes" for what that took and what it caught along the way
(including a real, previously-invisible CSS bug that only real product photography could surface).

## What I'd flag about the original file
- Two full `<style>` blocks: a complete dark "V1" palette and a complete light "V2" palette that
  overrides every V1 token. Only V2 renders (declared last, wins the cascade). V1 is ~250 lines of
  dead CSS that never ships — cut entirely rather than ported.
- The Shop grid (`#shop`) renders **8 cards for 4 distinct products**: the same four products
  appear twice, once via a CSS `background-image` sprite class and once via ~100 lines each of
  hand-inlined SVG bottle art. Looks like an exploration pass never cleaned up. Kept one product
  per card, driven by the collection.
- No sold-out, no-image, or long-title state exists anywhere in the file, despite the assignment
  explicitly requiring all three be seeded. The card snippet handles all three (disabled CTA +
  dimmed art, an icon placeholder, `-webkit-line-clamp` on the title).
- All "photography" is inline base64 SVG silhouettes baked into CSS custom properties — fine for a
  prototype, but every price, discount %, review count, and included-product list in Hero/Shop/
  Combos/Bundles is hand-typed text with no connection to any data source.
- Decorative elements (`role="img"` on empty `<span>`s with CSS background images) aren't real
  images: no markup `alt`, no `srcset`, no lazy-loading, nothing indexable.
- The animated background (4 crossfading gradient "scenes" + feTurbulence SVG water/bubble layers)
  is driven by hardcoded `data-scene="1|2|3|4"` attributes on each section — brittle the moment a
  section is added, removed, or reordered, which is exactly what a Shopify theme editor lets a
  merchant do.

## What I changed, and why
- **Reusable card**: Shop, Combos, and Bundles all render "image + heading + price" cards with
  different chrome. Built one `card-purelane-product` snippet instead of duplicating markup, per
  the brief's callout that "several sections render similar cards."
- **Real data, computed savings**: no discount percentage or "you save ₹X" is hardcoded anywhere.
  Hero's bundle carousel, Combos, and Bundles all compute compare-at totals and savings in Liquid
  from the real `price` of whichever products a merchant has picked. Only the actual selling price
  (a genuine business decision, not derivable from catalogue data) is a manual field.
- **`role="img"` spans → real `<img>`**: the hero's stacked product art renders as real `<img>`
  elements with real `alt`, `width`/`height`, `srcset`, and `fetchpriority="high"` on the first
  slide only (LCP candidate), `loading="lazy"` elsewhere.
- **Metaobject for combos**: no native Shopify object fits "a curated set of N products at a manual
  bundle price with marketing copy," so `#combos` is backed by a `combo` metaobject
  (`metaobjects/combo.json`) wired in via a native `metaobject_list` schema setting — merchants
  manage combos in Content → Metaobjects, independent of the theme editor.
- **Reveal-on-scroll made JS-failure-safe**: the prototype's `.rv{opacity:0}` pattern means content
  is invisible until JS runs. Inverted it to match Dawn's own `.scroll-trigger`/`--offscreen`
  pattern: visible by default, JS only ever *adds* the hiding class to elements it has actually
  detected below the fold. A slow connection or blocked script now degrades to "always visible,"
  never to "never appears."
- **Background scene system rebuilt around runtime zone detection, not hardcoded numbers**:
  `purelane-scenes.js` reads however many `[data-scene-zone]` sections exist on the page at
  runtime and distributes the 4-stage crossfade proportionally across them — add, remove, or
  reorder sections in the editor and it just redistributes, instead of desyncing like the
  original's fixed `data-scene="N"` attributes would.
- **Deliberately did not port the feTurbulence SVG water/bubble animation layers** behind the
  scenes — expensive to paint/repaint on scroll and a real Core Web Vitals cost on low-end mobile
  for a background detail. Kept the 4-stage gradient crossfade (same visual intent: background
  gets progressively deeper as you scroll) at a fraction of the paint cost.
- **Icon mismatches caught and fixed twice**: Dawn ships its own `icon-leaf.svg`,
  `icon-checkmark.svg`, `icon-fire.svg`, `icon-return.svg`, `icon-discount.svg`, `icon-box.svg` —
  all in a different (mostly fill-based) visual style than the prototype's simple stroke icons. Used
  a few of these by mistake initially (caught via a real screenshot from the live store), then
  built 9 dedicated SVG assets (`icon-leaf-outline`, `icon-shield-check`, `icon-no-chemicals`,
  `icon-savings`, `icon-flat-price`, `icon-star-outline`, `icon-shipping`, `icon-recycle-box`,
  `icon-globe`) using the prototype's exact paths instead of assuming Dawn's icon with a similar
  name would look the same.
- **A real bug caught from a live screenshot, not guessed**: `split: newline` was used in three
  places assuming Shopify Liquid has a built-in `newline` variable — it doesn't, it resolves to
  blank, and splitting a string on an empty delimiter splits it character-by-character. This broke
  the Hero heading, promise badges, and Bundle feature lists (rendered one letter per line). Fixed
  by using the real `newline_to_br` filter and splitting on its `<br />` output instead. Left in as
  a concrete example of why "renders without error" isn't the same as "renders correctly" — this
  bug produced zero Liquid errors and looked structurally fine in raw HTML, only visible rendered.
- **Theme-editor safety**: all repeating content is schema blocks, metaobject references, or
  runtime-detected zones — never fixed HTML or hardcoded counts — so the theme editor's add/
  remove/reorder can't desync the JS.
- **Reduced motion / no-hover**: `prefers-reduced-motion` respected throughout (reveal, hero
  carousel, review marquee, scene crossfade); `:hover` lift effects gated behind
  `@media (hover: hover)` so they don't stick "on" on touch devices.

## Completed in latest session (Full range shelf, Categories, Newsletter signup, Purelane custom footer)
- **Full range shelf (`purelane-range.liquid`, `section-purelane-range.css`)**:
  Ported `#range` ("The full range / Every room, one shelf") with horizontal scrollable shelf (`.pl-range__stripwrap` > `.pl-range__row`). Binds dynamically to `collection` / `product_list` with graceful fallback empty state.
- **Bundle categories (`purelane-categories.liquid`, `section-purelane-categories.css`)**:
  Ported `#categories` ("Bundle categories / Find the right bundle for you") with 4 glass category cards. Binds to native Shopify `collection` objects (`collection.title`, `collection.image`, `collection.url`), with title/subtitle/image overrides and fallback empty state.
- **Newsletter signup panel (`purelane-signup.liquid`, `section-purelane-signup.css`)**:
  Ported `#signup` ("Join the Purelane Club / Get ₹100 off your first bundle") with Shopify native `{% form 'customer' %}` subscription handling, pill input styling, and primary button CTA.
- **Custom Purelane footer (`purelane-footer.liquid`, `section-purelane-footer.css`)**:
  Ported prototype footer with Purelane logo mark, brand description, 2 dynamic link columns wired to Shopify `link_list` navigation menus (`menu_1`, `menu_2`), contact details, and bottom legal bar with dynamic policy links and copyright.
- **Full homepage section alignment (`templates/index.json`)**:
  Ordered all 15 sections in the exact prototype DOM sequence: Scenes → Hero → Reviews → Ingredients → Pillars → Proof → Combos → Bundles → Shop → Range → Why Bundles → Categories → Trust → Signup → Sticky CTA.
- **Footer group configuration (`sections/footer-group.json`)**:
  Replaced stock Dawn footer with `purelane-footer`.
- **CSS specificity & `div:empty` resilience**:
  Applied compound selectors (e.g. `.purelane .pl-range.pl-glass`, `.purelane .pl-cat.pl-glass`) and explicit `display: block` declarations across all new sections to prevent stylesheet load-order collisions and Dawn `div:empty` collapse.
- **Linting & 4-viewport visual verification**:
  `npx shopify theme check --fail-level=error` passing with 0 errors. Verified live across all 4
  standard viewports: 1440×900, 1280×800, 1024×768, and 390×844. (Store since moved to a proper
  Partner-linked development store, `q9hdic-gg-uidnykeq.myshopify.com` — see "Status" at the top.)

## What I'd do with more time
- Wire a real review app's rating metafield (`product.metafields.reviews.rating`, the Judge.me/
  Loox convention) into the Shop card instead of leaving it optional.
- Port the PDP (product detail page) layout from `reference/purelane-homepage.html` into `main-product.liquid` / dedicated Purelane product template.
- Convert the `combo` metaobject's parallel `products` / `benefit_lines` list-index alignment into
  something less fragile — Shopify metaobjects can't express a repeating (product, caption) pair
  natively, so it's approximated with two same-length lists a merchant must keep in sync. A
  second-level `combo_item` metaobject referenced as a `list.metaobject_reference` would be correct.
- Add `theme-check` as a CI step now that it's proven to catch real issues cheaply (it caught a
  schema name length violation in under a second that I'd have otherwise only found by trial and
  error against the live store).

## AI workflow notes
- Worked in Claude Code directly in an editor session against a real repo and a real (if
  password-protected) dev store — not a one-shot generation. Every section was written, pushed,
  and checked before moving to the next, then re-verified in a second, much longer pass described
  below.
- **What worked well early**: reading and auditing the full prototype file before writing any code
  meant the "reuse a card component," "don't hardcode data," and "no-image/sold-out state"
  requirements were caught from the source rather than needing reminders mid-build. Getting
  `shopify theme check` installed and running early turned "did I write valid Liquid" from a guess
  into a 10-second automated check — it caught a schema error immediately that would otherwise have
  taken a manual `theme push` round-trip to discover.
- **The real turning point was a dedicated screenshot-compare-fix loop**, once it became clear
  "renders without error" and "looks like the reference" are different claims. Set up Playwright to
  open the live theme and `reference/purelane-homepage.html` side by side at matching viewports and
  scroll positions, then for every visual mismatch, used `page.evaluate()` to walk
  `document.styleSheets` and find the actual matching CSS rule rather than guessing at a fix. That
  process, repeated section by section, found real bugs static analysis and theme-check could never
  have caught:
  - Two **CSS specificity bugs** from careless selector authorship: `.purelane .pl-sec` (descendant
    combinator — can never match an element that must carry both classes at once) instead of
    `.purelane.pl-sec` (compound selector), which silently zeroed out vertical padding on 12 of 13
    sections theme-wide; and the same descendant/compound mixup on `.pl-hero__badges.pl-glass-2`,
    where an unrelated rule with equal specificity was winning the cascade by load order.
  - Two collisions with **Dawn's own base CSS conventions** I didn't know to check for up front:
    `div:empty{display:none}` and `a:empty{display:none}`, which silently hid the entire
    JS-populated background scene system and the scroll-progress rail (both start as intentionally
    empty elements that JS fills in) — neither produced a JS error, they just never became visible.
  - A `split: newline` bug (Liquid has no `newline` variable; splitting on a blank delimiter splits
    character-by-character), which rendered three separate pieces of text one letter per line, with
    zero Liquid syntax errors and structurally fine raw HTML.
  - Placeholder/fallback logic bugs that only showed up as "wrong count" or "missing content" when
    actually looked at: a hero bottle fallback nested inside a `for product in products` loop that
    could never fire when the list was empty; a hardcoded `(1..4)` placeholder count instead of
    reading the real `products_to_show` setting; and, most recently, a combos empty-state that only
    showed 3 sample cards where the reference has 5 — caught by the user, not by me, which is a
    real miss: I'd already built the exact same "count mismatch" bug once (Shop grid) and didn't
    generalize the lesson to check every other placeholder loop for the same class of bug at the
    same time.
  - Generic, repeated placeholder art (one bottle shape reused everywhere) instead of the
    reference's actual varied product silhouettes — not a functional bug, but a fidelity gap only
    visible in a screenshot, fixed by extracting all 14 real inline-SVG assets from the reference
    file via a small Python/regex/base64 script and wiring them in contextually.
- **The Admin API blocker eventually got resolved, and it took several real environment problems,
  not one**: the first store (`q9hdic-gg.myshopify.com`) was created directly rather than through a
  Shopify Partner organization, and a custom app's scope grants on that kind of store never actually
  took effect — the app showed the configured scopes in its own settings, but every scoped GraphQL
  field (`products`, `metaobjectDefinitions`) kept returning `ACCESS_DENIED` with an empty
  `accessScopes` list from the API's own introspection, regardless of what the Dev Dashboard showed.
  That diagnosis (config vs. actually-granted are different things, and the API's own
  `currentAppInstallation.accessScopes` is the source of truth, not the dashboard) is what led to
  abandoning that store for a real Partner-linked development store instead of continuing to debug a
  structurally broken setup. On the new store, the same client-credentials flow worked immediately.
  Two more scope gaps surfaced only by trying the real calls and reading the exact error, not by
  reading docs up front: `read_metaobject_definitions`/`write_metaobject_definitions` are separate
  from `read_metaobjects`/`write_metaobjects` (one manages the type/schema, the other the entries —
  granting one does not imply the other), and products created via `productSet` are **not**
  automatically published to the Online Store sales channel — they need an explicit
  `publishablePublish` call per product/collection, which itself needs `read_publications`/
  `write_publications`, a scope nothing earlier in the flow suggested was necessary. Each of these
  was a several-minute detour that a single upfront "here is the full scope list you'll eventually
  need" would have collapsed into one round trip instead of three.
- **A third real bug, only findable with real product data**: once real products existed with actual
  `srcset`/`sizes` attributes (the placeholder `<img>` never had these), the shared product card's
  CSS (`width: auto` on `.pl-card__shot img`) broke completely — per spec, the `sizes` attribute
  drives an image's used width whenever CSS width computes to `auto`, which silently overrides
  `max-height`/`object-fit` and blows the photo out of its fixed-height card. This is the same shape
  of bug as the `:empty` and specificity bugs above (renders with zero errors, only wrong once you
  actually look at it) but a new *category* — one that specifically required real, published product
  data to ever trigger, meaning no amount of placeholder-state screenshot review could have caught
  it. That's a limit worth naming plainly: a build verified only against its own empty/placeholder
  states is not fully verified, no matter how many of those screenshots you take.
- **What I'd systematise for twenty more of these**: (1) get Admin API access working *first*, before
  writing any product-dependent code, and specifically verify it by reading
  `currentAppInstallation.accessScopes` from the API directly rather than trusting a dashboard's
  scope-configuration screen — the two can disagree; (2) request the full scope list needed for the
  whole job up front (products, metaobjects *and* metaobject definitions, files, publications) rather
  than discovering each one by hitting its specific `ACCESS_DENIED` error in turn; (3) run the
  screenshot-compare loop *continuously*, one section at a time as it's built, rather than as a
  separate later pass — several bugs (padding, `:empty` collisions) were introduced early and sat
  undetected across many sections until a dedicated visual pass finally caught them; (4) whenever a
  bug is found in one placeholder/fallback code path, immediately grep for the same pattern in every
  other section's fallback path — the combos 3-vs-5 bug was a repeat of a class of bug already fixed
  once elsewhere in the same file set; (5) treat "verified against placeholder state" and "verified
  against real data" as two different claims — the `sizes`/`width:auto` bug only existed in the gap
  between them, and no amount of placeholder-only testing would have found it; (6) keep `theme check`
  in the loop throughout — it's free and catches a different, complementary class of error
  (structural/schema) than screenshots do (visual/computed-style).
