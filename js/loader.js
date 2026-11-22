/* Small activity catalog at boot; game code arrives when a child needs it. */
(function () {
  'use strict';
  const requests = new Map();
  function script(url) {
    if (!requests.has(url)) requests.set(url, new Promise((resolve, reject) => {
      const tag = document.createElement('script');
      const timer = setTimeout(() => fail(), 20000);
      function fail() { clearTimeout(timer); tag.remove(); requests.delete(url); reject(new Error('Activity unavailable')); }
      tag.src = url;
      tag.onload = () => { clearTimeout(timer); resolve(); };
      tag.onerror = fail;
      document.head.append(tag);
    }));
    return requests.get(url);
  }
  for (const def of window.PIP_CATALOG || []) K.register(Object.assign({ lazy: true }, def));
  K.ensureActivity = async function (id) {
    let def = K.activities.find((a) => a.id === id);
    if (!def || !def.lazy) return def;
    for (const url of def.scripts) await script(url);
    def = K.activities.find((a) => a.id === id);
    if (!def || def.lazy) throw new Error('Activity did not register');
    return def;
  };
  const open = K.go;
  let request = 0;
  K.go = function (id) {
    const ticket = ++request, navigation = K.navigation;
    const def = K.activities.find((a) => a.id === id);
    if (!def || !def.lazy) return open(id);
    const overlay = document.getElementById('overlay');
    overlay.replaceChildren();
    const message = K.el('div.load-card', { role: 'status', 'aria-live': 'polite' }, K.el('p', { text: 'Opening ' + def.title + '…' }));
    overlay.append(message);
    return K.ensureActivity(id).then(() => {
      if (ticket !== request || navigation !== K.navigation) return;
      message.remove(); open(id);
    }).catch(() => {
      if (ticket !== request || navigation !== K.navigation) return;
      message.replaceChildren(K.el('p', { text: 'This game could not open. Try again when you are connected.' }),
        K.el('button.soft-btn', { text: 'Try again', onclick: () => K.go(id) }),
        K.el('button.quiet', { text: 'Back to the valley', onclick: () => K.home() }));
    });
  };
})();
