/**
 * Scroll-reveal for .pl-rv elements.
 *
 * Content is visible by default (see .pl-rv in purelane-base.css). This
 * script only ever ADDS the hiding class (pl-rv--offscreen) to elements it
 * has confirmed are below the fold, then removes it on intersection — so a
 * JS failure, a slow connection, or reduced-motion never leaves content
 * stuck invisible. Re-scans on Shopify section load/reorder so the theme
 * editor never leaves a newly added block permanently hidden.
 */
(function () {
  // guard against re-running if multiple sections each include this asset
  if (window.__plRevealInit) return;
  window.__plRevealInit = true;

  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var designMode = window.Shopify && window.Shopify.designMode;
  var observer = null;

  function observe(root) {
    if (reduce || designMode || !('IntersectionObserver' in window)) return;
    var scope = root || document;
    var els = scope.querySelectorAll('.pl-rv:not([data-pl-observed])');
    if (!els.length) return;

    if (!observer) {
      observer = new IntersectionObserver(
        function (entries) {
          entries.forEach(function (entry) {
            if (entry.isIntersecting) {
              entry.target.classList.remove('pl-rv--offscreen');
              observer.unobserve(entry.target);
            }
          });
        },
        { rootMargin: '0px 0px -12% 0px', threshold: 0.12 }
      );
    }
    els.forEach(function (el) {
      el.setAttribute('data-pl-observed', 'true');
      // only hide once we're actually able to observe + reveal it
      el.classList.add('pl-rv--offscreen');
      observer.observe(el);
    });
  }

  document.addEventListener('DOMContentLoaded', function () { observe(document); });
  document.addEventListener('shopify:section:load', function (e) { observe(e.target); });
})();
