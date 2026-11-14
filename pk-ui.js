/* Palkkaran shared UI: loading screen, illustrated error/empty states, offline bar. No dependencies. */
(function () {
  var s = document.currentScript, IMG = (s && s.getAttribute('data-img')) || 'img/';
  if (!/\/$/.test(IMG)) IMG += '/';
  var css = '' +
    '#pk-splash{position:fixed;inset:0;z-index:99999;background:radial-gradient(ellipse at 50% 44%,#6c1cab 0,#611a9c 30%,#55148c 70%,#4a1079 100%);display:flex;flex-direction:column;align-items:center;justify-content:center;transition:opacity .5s ease,visibility .5s}' +
    '#pk-splash.pk-off{opacity:0;visibility:hidden}' +
    '#pk-splash .hd{width:min(92vw,520px);-webkit-mask-image:linear-gradient(to bottom,transparent,#000 12%,#000 93%,transparent),linear-gradient(to right,transparent,#000 5%,#000 95%,transparent);-webkit-mask-composite:source-in;mask-image:linear-gradient(to bottom,transparent,#000 12%,#000 93%,transparent),linear-gradient(to right,transparent,#000 5%,#000 95%,transparent);mask-composite:intersect;margin-top:-4vh}' +
    '#pk-splash .hd img{display:block;width:100%;height:auto}' +
    '#pk-splash .sp{width:30px;height:30px;margin-top:14px;border:3px solid rgba(255,255,255,.28);border-top-color:#fff;border-radius:50%;animation:pkspin .8s linear infinite}' +
    '#pk-splash .ft{position:absolute;left:0;right:0;bottom:0;line-height:0}#pk-splash .ft img{width:100%;height:auto;max-height:34vh;object-fit:cover;object-position:bottom}' +
    '@keyframes pkspin{to{transform:rotate(360deg)}}' +
    '@media (prefers-reduced-motion:reduce){#pk-splash .sp{animation-duration:2.4s}#pk-splash{transition:none}}' +
    '.pk-err{display:flex;flex-direction:column;align-items:center;text-align:center;padding:36px 20px;grid-column:1/-1}' +
    '.pk-err img{width:min(300px,78vw);height:auto;margin-bottom:10px}' +
    '.pk-err h3{font:700 24px Fredoka,system-ui,sans-serif;color:#3b1e6e;margin:0 0 6px}' +
    '.pk-err p{margin:0 0 16px;max-width:420px;color:#7b75a0;line-height:1.5}' +
    '.pk-err .pk-btn{display:inline-flex;align-items:center;justify-content:center;border:0;border-radius:999px;padding:11px 22px;font:700 15px/1 system-ui,sans-serif;background:#6c5cf5;color:#fff;cursor:pointer;text-decoration:none}' +
    '.pk-err .pk-btn:hover{background:#5a48e8}.pk-err .pk-d{font-size:13px;margin-top:-8px}' +
    '#pk-off{position:fixed;top:0;left:0;right:0;z-index:99998;background:#3b1e6e;color:#fff;text-align:center;padding:9px 14px;font:600 14px system-ui,sans-serif;transform:translateY(-110%);transition:transform .3s}#pk-off.on{transform:none}';
  var st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);

  /* ---------- loading screen: once per browser session ---------- */
  var seen = false; try { seen = sessionStorage.getItem('pk_splash') === '1'; } catch (e) {}
  var sp = null;
  if (!seen && !/[?&]nosplash/.test(location.search)) {
    sp = document.createElement('div'); sp.id = 'pk-splash'; sp.setAttribute('role', 'status'); sp.setAttribute('aria-label', 'Loading');
    sp.innerHTML = '<div class="hd"><img src="' + IMG + 'splash-head.webp" alt="Palkkaran" width="724" height="350"></div><div class="sp"></div><div class="ft"><img src="' + IMG + 'splash-foot.webp" alt="" width="724" height="164"></div>';
    document.documentElement.appendChild(sp);
    var t0 = Date.now(), done = false;
    var hide = function () {
      if (done) return; done = true;
      var wait = Math.max(0, 800 - (Date.now() - t0));
      setTimeout(function () { sp.classList.add('pk-off'); try { sessionStorage.setItem('pk_splash', '1'); } catch (e) {} setTimeout(function () { if (sp.parentNode) sp.parentNode.removeChild(sp); }, 700); }, wait);
    };
    if (document.readyState === 'complete') hide(); else window.addEventListener('load', hide);
    setTimeout(hide, 4000); /* never trap the visitor behind the splash */
  }

  /* ---------- error / empty states ---------- */
  var TXT = {
    offline: ['No Internet Connection', "You're offline. Please check your internet connection and try again.", 'err-offline'],
    notfound: ['Page Not Found', "Oops! The page you're looking for doesn't exist.", 'err-404'],
    denied: ['Access Denied', "You don't have permission to access this page.", 'err-denied'],
    server: ['Server Error', 'Our servers are facing an issue right now. Please try again later.', 'err-server'],
    generic: ['Something Went Wrong', 'Oops! Something went wrong. Please try again.', 'err-generic'],
    empty: ['Nothing here yet', '', 'err-empty']
  };
  function esc(v) { return String(v == null ? '' : v).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  /* kind from an Error (e.kind / e.status), falling back to navigator.onLine */
  window.pkKind = function (e) {
    if (e && e.kind && TXT[e.kind]) return e.kind;
    var c = e && e.status;
    if (typeof navigator !== 'undefined' && navigator.onLine === false) return 'offline';
    if (c === 404) return 'notfound'; if (c === 401 || c === 403) return 'denied'; if (c >= 500) return 'server';
    return 'generic';
  };
  /* returns HTML. opts: {title, message, detail, retry:'js to run on click', href, label} */
  window.pkError = function (kind, opts) {
    opts = opts || {}; var t = TXT[kind] || TXT.generic;
    var h = '<div class="pk-err"><img src="' + IMG + t[2] + '.webp" alt="" loading="lazy">' +
      '<h3>' + esc(opts.title || t[0]) + '</h3>' + ((opts.message || t[1]) ? '<p>' + esc(opts.message || t[1]) + '</p>' : '');
    if (opts.detail) h += '<p class="pk-d">' + esc(opts.detail) + '</p>';
    if (opts.retry) h += '<button class="pk-btn" type="button" onclick="' + esc(opts.retry) + '">' + esc(opts.label || 'Try again') + '</button>';
    else if (opts.href) h += '<a class="pk-btn" href="' + esc(opts.href) + '">' + esc(opts.label || 'Go home') + '</a>';
    return h + '</div>';
  };
  window.pkEmpty = function (message, opts) { opts = opts || {}; opts.message = message; return window.pkError('empty', opts); };

  /* ---------- offline bar ---------- */
  function bar() {
    var b = document.getElementById('pk-off');
    if (!b) { b = document.createElement('div'); b.id = 'pk-off'; b.setAttribute('role', 'status'); b.textContent = "You're offline. Check your internet connection."; (document.body || document.documentElement).appendChild(b); }
    return b;
  }
  window.addEventListener('offline', function () { bar().classList.add('on'); });
  window.addEventListener('online', function () { bar().classList.remove('on'); });
  document.addEventListener('DOMContentLoaded', function () { if (navigator.onLine === false) bar().classList.add('on'); });
})();
