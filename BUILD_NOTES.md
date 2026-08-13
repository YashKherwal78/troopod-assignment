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
(`purelane-whybundles.liquid`), and a trust bar (`purelane-trust.liquid`). That covers everything
in the prototype except: the bundle-categories grid, the newsletter signup panel, a fully custom
footer (Dawn's own footer is in place, unstyled to match), and the PDP (product detail page) —
cut for time, not forgotten.

**Verified live**: pushed to a real Shopify dev store (`q9hdic-gg.myshopify.com`, theme ID
`157758488731`, via the Theme Access app + Shopify CLI) and confirmed by fetching the rendered
page — all sections render, zero Liquid errors, `shopify theme check` passes clean (0 errors, 12
pre-existing warnings, all in stock Dawn files I didn't touch). Editor:
`https://q9hdic-gg.myshopify.com/admin/themes/157758488731/editor` (storefront password: `yiwiso`).

**Still not done, and why**:
- **No products seeded yet.** I don't have Admin API write access to the store — the Theme Access
  token I was given only covers theme files. `shopify store auth`/`store execute` (the CLI's own
  Admin GraphQL passthrough) is set up in the repo's workflow but the OAuth device-approval step
  needs a human in a browser, which stalled across several attempts (browser not opening reliably
  in a non-interactive shell, then a genuine "Unauthorized Access" error on the target store —
  likely because it isn't linked to a Partner organization the CLI recognizes). **Next step**:
  either fix the store's Partner-org linkage and re-run `shopify store auth --store <domain>
  --scopes read_products,write_products,read_metaobjects,write_metaobjects,read_files,write_files`,
  or paste products in manually — ask for the seed list if needed.
- Because there are no products, the hero bundle carousel, Combos, Bundles' compare-at totals, and
  the Proof rotator all render their correct **empty states** rather than real content right now.
  That's intentional fallback behaviour, not a bug — confirm by checking for Liquid errors (there
  are none) rather than assuming "looks empty" means "broken."
- The `combo` metaobject definition (`metaobjects/combo.json`) is documented but not yet created in
  the store's Content → Metaobjects — needs the same Admin API access as product seeding.
- No pixel-by-pixel breakpoint diff against the prototype has been done with a real browser (this
  environment has no browser/screenshot tool) — verification so far is "renders without server
  errors + correct DOM structure," not "looks visually identical." Do that pass once products
  exist and there's something to actually look at.

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

## What I'd do with more time
- Seed the 8+ products (incl. sold-out / no-image / long-title) and create the `combo` metaobject
  entries for real, once Admin API access is sorted — see "Still not done" above.
- Do an actual visual, breakpoint-by-breakpoint diff against the prototype from 375px up — this
  environment has no browser, so everything so far has been verified structurally (renders, no
  Liquid errors, correct DOM) rather than visually.
- Wire a real review app's rating metafield (`product.metafields.reviews.rating`, the Judge.me/
  Loox convention) into the Shop card instead of leaving it optional.
- Build the bundle-categories grid, newsletter signup panel, and a Purelane-styled footer (Dawn's
  stock footer is functional but unstyled to match right now).
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
  and checked before moving to the next.
- **What worked well**: reading and auditing the full prototype file before writing any code meant
  the "reuse a card component," "don't hardcode data," and "no-image/sold-out state" requirements
  were caught from the source rather than needing reminders mid-build. Getting `shopify theme
  check` installed and running early turned "did I write valid Liquid" from a guess into a
  10-second automated check — it caught a schema error immediately that would otherwise have taken
  a manual `theme push` round-trip to discover.
- **Where it needed correction, twice, from the same root cause**: I initially assumed things about
  Shopify's environment instead of checking — once assuming Dawn's own icons would visually match
  the prototype (they didn't, caught from a real screenshot the user sent), and once assuming
  Shopify Liquid has a `newline` global variable (it doesn't, also caught from a screenshot showing
  text rendered one letter per line). Both bugs produced *zero* Liquid syntax errors and looked
  fine in raw markup — they were only visible once actually rendered and looked at. Lesson: for a
  visual build like this, "the code runs without error" and "the code is correct" are different
  claims, and only a real screenshot closes that gap — theme-check and curl-based smoke tests
  couldn't have caught either issue.
- **A real environment blocker, not a code problem**: getting Admin API write access without a
  pre-existing custom app took several attempts — `shopify store auth`'s OAuth flow needs a human
  to approve in a real browser, which doesn't work smoothly from a non-interactive shell (auto-open
  silently failed more than once, then a genuine store/Partner-org linkage error). This is the
  actual remaining blocker on product seeding, not a scope or code decision.
- **What I'd systematise for twenty more of these**: (1) get `theme check` running before writing
  the first section, not after several are done — it's free and catches real errors in seconds;
  (2) build a small local smoke-test habit (push → curl the rendered page → grep for the section's
  own class names and for `Liquid error`) as a matter of course after every push, since it's cheap
  and catches structural regressions immediately; (3) for anything visual, get a real screenshot
  before declaring a section "done" — static analysis alone missed two real, user-visible bugs that
  a two-second look at a rendered page caught instantly; (4) resolve store/Admin-API access *first*,
  before writing product-dependent code, so seeding isn't the long pole at the end.
