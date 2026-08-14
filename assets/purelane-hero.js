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
    var interval = parseInt(stage.getAttribute('data-autoplay'), 10) || 2200;
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

  function initParallax(prod) {
    if (prod.__plParallax || reduce) return;
    prod.__plParallax = true;

    if (typeof prod.animate === 'function') {
      prod.animate(
        [
          { filter: 'drop-shadow(0 14px 22px rgba(0,74,66,.15))' },
          { filter: 'drop-shadow(0 20px 30px rgba(0,74,66,.22))' },
          { filter: 'drop-shadow(0 14px 22px rgba(0,74,66,.15))' },
        ],
        { duration: 7000, iterations: Infinity, easing: 'ease-in-out' }
      );
    }

    if (!window.matchMedia('(min-width: 1024px)').matches || !window.matchMedia('(pointer: fine)').matches) return;
    var raf = null, mx = 0, my = 0;
    function apply() {
      raf = null;
      prod.style.transform = 'translate3d(' + (mx * -14).toFixed(2) + 'px,' + (my * -8).toFixed(2) + 'px,0)';
    }
    window.addEventListener('mousemove', function (e) {
      var r = prod.getBoundingClientRect();
      var cx = r.left + r.width / 2, cy = r.top + r.height / 2;
      mx = Math.max(-1, Math.min(1, (e.clientX - cx) / (window.innerWidth / 2)));
      my = Math.max(-1, Math.min(1, (e.clientY - cy) / (window.innerHeight / 2)));
      if (!raf) raf = requestAnimationFrame(apply);
    }, { passive: true });
  }

  function init(root) {
    var scope = root || document;
    scope.querySelectorAll('.pl-hstage').forEach(initStage);
    scope.querySelectorAll('.pl-hero__prod').forEach(initParallax);
  }

  document.addEventListener('DOMContentLoaded', function () { init(document); });
  document.addEventListener('shopify:section:load', function (e) { init(e.target); });
})();
