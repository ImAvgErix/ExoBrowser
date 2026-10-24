// The page under the Bar: tells the browser when it may slide up under the Bar's glass (scrolled at least a Bar's
// height, so nothing of the page's own top is hidden there) and when it must sit below it again (back near the top, or
// a fixed or sticky header across the top that the Bar would cover). It reads layout only, never content.
// It runs in every page, so scrolling costs it next to nothing: the scroll position alone decides near the top, and
// whether a header is pinned (a hit test and a few computed styles) is read at most every 150 ms while the page
// scrolls, and once more when it stops. Read on every frame, that took a third of a millisecond of each frame's main
// thread on a fast PC, in every page.
(() => {
  if (window.top !== window || !window.chrome || !window.chrome.webview || window.__exoEdge) return;
  window.__exoEdge = true;
  const post = window.chrome.webview.postMessage.bind(window.chrome.webview);
  const BAR = 52, EVERY = 150;
  let sent = null, pinned = false, readAt = -Infinity, later = 0;
  // A header pinned to the top: something fixed or sticky whose box touches the top of the window across most of it.
  const pinnedTop = () => {
    for (const x of [0.25, 0.5, 0.75]) {
      for (let el = document.elementFromPoint(innerWidth * x, 4); el && el !== document.documentElement; el = el.parentElement) {
        const style = getComputedStyle(el);
        if ((style.position === 'fixed' || style.position === 'sticky') && el.getBoundingClientRect().top <= 1) return true;
      }
    }
    return false;
  };
  const check = (now) => {
    const y = window.scrollY;
    let under = false;
    // Under from two Bar heights (sliding under scrolls the page back by one, so it stays under), back below under half
    // a Bar's height.
    if (sent ? y >= BAR / 2 : y >= BAR * 2) {
      const t = performance.now();
      if (now || t - readAt >= EVERY) { pinned = pinnedTop(); readAt = t; }
      else if (!later) later = setTimeout(() => { later = 0; check(true); }, EVERY - (t - readAt));
      under = !pinned;
    }
    // Back below at the very top (Home, a jump to the top): "t", so the browser shows the page's top instead of keeping
    // the view where it was.
    if (under !== sent) { sent = under; try { post('exo-edge\t' + (under ? '1' : y === 0 ? '0t' : '0')); } catch (_) { /* chrome.webview taken away */ } }
  };
  addEventListener('scroll', () => check(false), { passive: true });
  addEventListener('scrollend', () => check(true), { passive: true });
  addEventListener('resize', () => check(true), { passive: true });
  addEventListener('pageshow', () => check(true));
  requestAnimationFrame(() => check(true));
})();
