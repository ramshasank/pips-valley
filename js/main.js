/* Boot. Runs last, after every activity file has registered itself. */
(function () {
  /* The app fills the part of the screen that is really visible. Phone browsers slide address and
     tool bars over the page, and "100%" does not always follow them, so measure it. */
  const root = document.documentElement, vv = window.visualViewport;
  function size() {
    const h = Math.round(vv ? vv.height : innerHeight);
    if (h > 0) root.style.setProperty('--app-h', h + 'px');
    if (root.scrollTop || document.body.scrollTop) scrollTo(0, 0);
  }
  size();
  addEventListener('resize', size); addEventListener('orientationchange', () => setTimeout(size, 250));
  if (vv) { vv.addEventListener('resize', size); vv.addEventListener('scroll', size); }

  /* A phone on its side is too short for the toys: ask for it to be turned upright. */
  const turn = document.createElement('div');
  turn.id = 'turn'; turn.setAttribute('role', 'status');
  turn.innerHTML = '<div class="turn-phone"><i></i></div><p>Turn me upright</p>';
  const mount = () => document.body.appendChild(turn);

  const start = () => { mount(); K.boot(); };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
})();
