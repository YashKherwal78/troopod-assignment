/**
 * Hero bundle-size carousel (1 -> 2 -> 3 products). Data-driven: slide
 * count comes from however many "Bundle size" blocks the merchant has
 * added/reordered in the theme editor, not a hardcoded count.
 */
(function () {
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function initStage(stage) {
    if (stage.__plInit) return;
    stage.__plInit = true;

    var wrap = stage.closest('.pl-hero__prod');
    var dotsWrap = wrap ? wrap.querySelector('.pl-hdots') : null;
    var slides = [].slice.call(stage.querySelectorAll('.pl-hslide'));
    var dots = dotsWrap ? [].slice.call(dotsWrap.querySelectorAll('button')) : [];
    var interval = parseInt(stage.getAttribute('data-autoplay'), 10) || 3800;
    var i = 0;
    var timer = null;

    function go(n) {
      i = (n + slides.length) % slides.length;
      slides.forEach(function (s, idx) { s.classList.toggle('pl-hslide--on', idx === i); });
      dots.forEach(function (d, idx) {
        d.classList.toggle('pl-hdots__on', idx === i);
        d.setAttribute('aria-selected', idx === i ? 'true' : 'false');
      });
    }
    function play() {
      if (!timer && !reduce && slides.length > 1) {
        timer = setInterval(function () { go(i + 1); }, interval);
      }
    }
    function stop() {
      if (timer) { clearInterval(timer); timer = null; }
    }

    dots.forEach(function (d, idx) {
      d.addEventListener('click', function () { stop(); go(idx); play(); });
    });
    stage.addEventListener('mouseenter', stop);
    stage.addEventListener('mouseleave', play);
    stage.addEventListener('focusin', stop);
    stage.addEventListener('focusout', play);

    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (entries) {
        entries.forEach(function (e) { e.isIntersecting ? play() : stop(); });
      }, { threshold: 0.2 }).observe(stage);
    } else {
      play();
    }
  }

  function init(root) {
    (root || document).querySelectorAll('.pl-hstage').forEach(initStage);
  }

  document.addEventListener('DOMContentLoaded', function () { init(document); });
  document.addEventListener('shopify:section:load', function (e) { init(e.target); });
})();
