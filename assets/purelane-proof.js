/**
 * Auto-cycling product rotator in the Proof section. Slide count/order
 * comes from however many "Rotator product" blocks the merchant has, so
 * it survives reordering/add/remove in the theme editor.
 */
(function () {
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function initRot(rot) {
    if (rot.__plInit) return;
    rot.__plInit = true;

    var imgs = [].slice.call(rot.querySelectorAll('.pl-rot__img'));
    var dots = [].slice.call(rot.querySelectorAll('.pl-rot__dots i'));
    var capB = rot.querySelector('.pl-rot__cap b');
    var capS = rot.querySelector('.pl-rot__cap span');
    if (imgs.length < 2) return;

    var i = 0, timer = null;
    function step() {
      imgs[i].classList.remove('pl-rot__img--on');
      if (dots[i]) dots[i].classList.remove('pl-rot__on');
      i = (i + 1) % imgs.length;
      imgs[i].classList.add('pl-rot__img--on');
      if (dots[i]) dots[i].classList.add('pl-rot__on');
      if (capB) capB.textContent = imgs[i].getAttribute('data-name');
      if (capS) capS.textContent = imgs[i].getAttribute('data-note');
    }

    if (reduce || !('IntersectionObserver' in window)) return;
    new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting && !timer) timer = setInterval(step, 2900);
        else if (!e.isIntersecting && timer) { clearInterval(timer); timer = null; }
      });
    }, { threshold: 0.25 }).observe(rot);
  }

  function init(root) {
    (root || document).querySelectorAll('.pl-rot').forEach(initRot);
  }

  document.addEventListener('DOMContentLoaded', function () { init(document); });
  document.addEventListener('shopify:section:load', function (e) { init(e.target); });
})();
