# Build notes — Purelane homepage → Shopify/Dawn

## Status
Built: Hero (`sections/purelane-hero.liquid`), Shop grid (`purelane-shop.liquid`), Best-selling
combos (`purelane-combos.liquid`), Bundles (`purelane-bundles.liquid`), Reviews rail
(`purelane-reviews.liquid`), plus a shared `snippets/card-purelane-product.liquid` used by Shop
and reused visually by Combos/Bundles. Not built: everything past the five required sections
(ingredients grid, pillars, proof/stats, full range strip, footer content, PDP) — cut per the
brief's own prioritisation, not forgotten.

**Not done**: I don't have a Shopify Partner account/dev store login for this environment, so I
could not seed products, create the `combo` metaobject in an actual store, or verify pixel output
in the real theme editor. The code below is written and reasoned through against Dawn's real
object model and Liquid syntax, but is unverified in a live store — flagging that clearly rather
than claiming a pass I couldn't run.

## What I'd flag about the original file
- Two full `<style>` blocks: a complete dark "V1" palette and a complete light "V2" palette that
  overrides every V1 token. Only V2 renders (it's declared last, wins the cascade). V1 is ~250
  lines of dead CSS that never ships — cut entirely rather than ported.
- The Shop grid (`#shop`) renders **8 cards for 4 distinct products**: the same four products
  appear twice, once via a CSS `background-image` sprite class and once via ~100 lines each of
  hand-inlined SVG bottle art. Looks like an exploration pass that was never cleaned up. I kept
  one product per card, driven by the collection, not four artworks per product.
- No sold-out, no-image, or long-title state exists anywhere in the file, despite the assignment
  explicitly requiring all three be seeded. The card snippet handles all three (disabled CTA +
  dimmed art, an icon placeholder, and `-webkit-line-clamp` on the title) since nothing in the
  source showed me the intended look for them.
- All "photography" is inline base64 SVG silhouettes baked into CSS custom properties
  (`--p-kitchen`, `--p-tap`, etc.) — fine for a prototype, but every price, discount %, review
  count, and included-product list in Hero/Shop/Combos/Bundles is hand-typed text with no
  connection to any data source. None of it can move without a developer editing HTML.
- Decorative elements (`role="img"` on empty `<span>`s with CSS background images) are not real
  images: no `alt` via markup, no `srcset`, no lazy-loading, nothing indexable.

## What I changed, and why
- **Reusable card**: Shop, Combos, and Bundles all render "image + heading + price" cards with
  different chrome. Built one `card-purelane-product` snippet instead of three copies of similar
  markup, per the brief's explicit callout that "several sections render similar cards."
- **Real data, computed savings**: nowhere in my sections is a discount percentage or "you save
  ₹X" hardcoded. Hero's bundle carousel, Combos, and Bundles all compute compare-at totals and
  savings in Liquid from the real `price` of whichever products a merchant has picked in the
  block/metaobject. Only the actual selling price (a genuine merchant/business decision, not
  derivable from catalogue data) is a manual number field.
- **`role="img"` spans → real `<img>`**: the hero's stacked product art now renders as real
  `<img>` elements with real `alt`, `width`/`height`, `srcset`, and `fetchpriority="high"` on the
  first slide only (LCP candidate), `loading="lazy"` elsewhere.
- **Metaobject for combos**: there's no native Shopify object for "a curated set of N products at
  a manual bundle price with marketing copy," so `#combos` is backed by a `combo` metaobject
  (definition documented in `metaobjects/combo.json`) wired into the section via a native
  `metaobject_list` schema setting — merchants manage combos in Content → Metaobjects, independent
  of the theme editor block model, and can reorder/add/remove without touching code.
- **Reveal-on-scroll made JS-failure-safe**: the prototype's `.rv{opacity:0}` pattern means content
  is invisible until JS runs. I inverted it to match Dawn's own `.scroll-trigger`/`--offscreen`
  pattern: content is visible by default; JS only ever *adds* the hiding class to elements it has
  actually detected below the fold, then removes it on intersection. A slow connection, blocked
  script, or missing IntersectionObserver support now degrades to "content is just visible," never
  to "content never appears."
- **Theme-editor safety**: all repeating content (badges, hero bundle slides, combo cards, tiers,
  reviews) is schema blocks or metaobject references, not fixed HTML, so adding/removing/
  reordering in the editor can't desync the JS (hero carousel and reveal script both re-scan on
  `shopify:section:load` instead of assuming a fixed count baked in at page load).
- **Reduced motion / no-hover**: kept `prefers-reduced-motion` handling for the reveal, hero
  carousel, and review marquee; `:hover` lift effects are gated behind `@media (hover: hover)` so
  they don't get stuck "on" on touch devices.

## What I'd do with more time
- Actually create the dev store, seed the 8+ products (incl. sold-out / no-image / long-title),
  create the `combo` metaobject for real, and visually diff every breakpoint from 375px against
  the prototype — right now the CSS is a careful port but has not been rendered and compared pixel
  by pixel.
- Wire a real review app's rating metafield (`product.metafields.reviews.rating`, the Judge.me/
  Loox convention) into the Shop card instead of leaving it as an optional pass-through, and do
  the same for the Reviews rail's aggregate rating.
- Build the remaining bonus sections (ingredients, pillars, proof/stats) since they share enough
  visual language with what's already built that the marginal cost is low once the token/glass/
  button system exists.
- Add `theme-check` to CI (I didn't have the CLI available in this environment to lint the Liquid
  I wrote — everything here was hand-verified by reading, not run).
- Convert the "combo" metaobject's parallel `products` / `benefit_lines` list-index alignment into
  something less fragile — Shopify metaobjects can't express a repeating (product, caption) pair
  natively, so I approximated it with two same-length lists a merchant must keep in sync. A
  second-level metaobject (`combo_item` with `product` + `caption` fields, referenced as a
  `list.metaobject_reference` from `combo`) would be the correct fix.

## AI workflow notes
- I used Claude Code directly in an editor session, not a headless pipeline — every file was
  written by the agent but read and sanity-checked by me before the next step, section by section.
- What worked well: delegating the full-file read/audit first, before any code, meant the "reuse a
  card component," "don't hardcode data," and "no-image/sold-out state" requirements were caught
  from reading the prototype rather than being reminded of them mid-build.
- Where it needed correction: the agent's first pass at scroll-reveal used the prototype's own
  "hidden until JS reveals it" pattern verbatim. I caught it by asking it to check how Dawn itself
  solves the same problem (`.scroll-trigger--offscreen`) — it found the safer default-visible
  pattern in Dawn's own `base.css` and rewrote both the CSS and JS to match. Lesson: when porting a
  prototype into a real theme, explicitly point the agent at the target theme's own conventions
  for a given problem before trusting the prototype's version of it.
- What I'd systematise for twenty more of these: a standing checklist derived from this brief's
  "bar" section (pixel-accurate / merchant-editable / real data / reusable / theme-editor-safe /
  fast / accessible) that the agent runs against its own diff before calling a section "done,"
  rather than only at final review — would have caught the `role="img"` span issue and the
  reveal-on-scroll issue earlier, in the same pass they were written rather than a follow-up pass.
- Biggest limitation hit in this environment: no Shopify Partner/dev store access and no
  `theme check` CLI, so nothing here has actually been rendered by Shopify or linted by its own
  tooling. That's real, unverified risk — flagged rather than hidden.
