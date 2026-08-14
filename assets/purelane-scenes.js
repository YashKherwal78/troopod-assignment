/**
 * Drives the fixed background scene crossfade and builds/syncs the
 * right-hand scroll progress rail. Reads [data-scene-zone] sections at
 * runtime (rather than assuming a fixed count/order), so it survives
 * sections being added, removed, or reordered in the theme editor.
 */
(function () {
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var SCENE_COUNT = 4;

  function init() {
    var stage = document.getElementById('PlScenes');
    var rail = document.getElementById('PlRail');
    if (!stage && !rail) return;

    var zones = [].slice.call(document.querySelectorAll('[data-scene-zone]'));
    if (!zones.length) return;

    var scenes = stage ? [].slice.call(stage.querySelectorAll('.pl-scene')) : [];

    if (rail && !rail.__plBuilt) {
      rail.__plBuilt = true;
      rail.innerHTML = zones
        .map(function (z, i) {
          var label = z.getAttribute('data-scene-label') || 'Section ' + (i + 1);
          var id = z.id || '';
          return '<a href="' + (id ? '#' + id : '#') + '" aria-label="' + label + '"' + (i === 0 ? ' class="pl-rail__on"' : '') + '></a>';
        })
        .join('');
    }
    var railLinks = rail ? [].slice.call(rail.querySelectorAll('a')) : [];

    var current = 0;
    function setScene(n) {
      if (stage) stage.setAttribute('data-d', String(n));
      if (n === current || !scenes.length) { current = n; return; }
      current = n;
      scenes.forEach(function (s, i) { s.classList.toggle('pl-scene--on', i === n - 1); });
    }

    function sceneForZoneIndex(i) {
      return Math.min(SCENE_COUNT, 1 + Math.floor((i * SCENE_COUNT) / zones.length));
    }

    // water layers drift with scroll depth + (desktop) mouse position, each
    // at its own factor -- same values/order (a,b,c,s) as the reference.
    var waterLayers = stage ? [].slice.call(stage.querySelectorAll('.pl-wl')) : [];
    var waterDepths = [0.05, 0.09, 0.03, 0.02];
    var mx = 0, my = 0;

    var raf = null;
    function frame() {
      raf = null;
      var y = window.scrollY || window.pageYOffset;
      var focus = y + window.innerHeight * 0.42;
      var idx = 0;
      zones.forEach(function (z, i) {
        if (z.getBoundingClientRect().top + y <= focus) idx = i;
      });
      setScene(sceneForZoneIndex(idx));
      railLinks.forEach(function (a, i) { a.classList.toggle('pl-rail__on', i === idx); });

      if (!reduce) {
        waterLayers.forEach(function (wl, i) {
          var d = waterDepths[i] || 0.05;
          wl.style.setProperty('--pl-wl-px', (mx * d * 130).toFixed(1) + 'px');
          wl.style.setProperty('--pl-wl-py', (-y * d + my * d * 90).toFixed(1) + 'px');
        });
      }
    }
    function onScroll() { if (!raf) raf = requestAnimationFrame(frame); }

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    frame();

    if (!reduce && window.matchMedia('(min-width: 1024px)').matches) {
      window.addEventListener('mousemove', function (e) {
        mx = (e.clientX / window.innerWidth - 0.5) * 2;
        my = (e.clientY / window.innerHeight - 0.5) * 2;
        onScroll();
      }, { passive: true });
    }

    if (!reduce) {
      // keep in sync as blocks/sections animate in and shift layout
      new MutationObserver(onScroll).observe(document.body, { childList: true, subtree: true });
    }
  }

  document.addEventListener('DOMContentLoaded', init);
  document.addEventListener('shopify:section:load', init);
})();
