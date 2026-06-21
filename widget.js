(function () {
  // Trouve le script tag courant et lit client_id depuis son src
  var scripts = document.querySelectorAll('script[src*="widget.js"]');
  var currentScript = scripts[scripts.length - 1];
  if (!currentScript) return;

  var src = currentScript.getAttribute('src');
  var match = src.match(/[?&]client_id=([^&]+)/);
  if (!match) {
    console.warn('[TrustCollect] client_id manquant dans le src du script');
    return;
  }
  var clientId = match[1];

  // Crée le container où le widget sera injecté
  var container = document.createElement('div');
  container.id = 'trustcollect-widget-' + clientId;
  container.innerHTML = '<p style="color:#aaa;font-size:13px">Chargement des avis...</p>';
  currentScript.parentNode.insertBefore(container, currentScript);

  // Styles
  var style = document.createElement('style');
  style.textContent = [
    '#' + container.id + ' { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; max-width: 680px; }',
    '#' + container.id + ' .tc-header { display: flex; align-items: center; gap: 14px; margin-bottom: 20px; }',
    '#' + container.id + ' .tc-score { background: #6D5EF5; color: white; font-size: 26px; font-weight: 700; width: 56px; height: 56px; border-radius: 12px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }',
    '#' + container.id + ' .tc-stars { color: #F5C518; font-size: 20px; }',
    '#' + container.id + ' .tc-count { color: #666; font-size: 14px; margin-left: 6px; }',
    '#' + container.id + ' .tc-verified { font-size: 12px; color: #999; margin-top: 2px; }',
    '#' + container.id + ' .tc-card { background: #fff; border: 1px solid #eee; border-radius: 12px; padding: 18px 20px; margin-bottom: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.05); }',
    '#' + container.id + ' .tc-card-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }',
    '#' + container.id + ' .tc-name { font-weight: 600; color: #111; font-size: 15px; }',
    '#' + container.id + ' .tc-note { color: #F5C518; font-size: 16px; margin-left: 8px; }',
    '#' + container.id + ' .tc-date { font-size: 12px; color: #bbb; }',
    '#' + container.id + ' .tc-text { color: #444; font-size: 14px; line-height: 1.65; margin: 0; }',
    '#' + container.id + ' .tc-footer { text-align: center; margin-top: 14px; }',
    '#' + container.id + ' .tc-footer a { font-size: 11px; color: #ccc; text-decoration: none; }',
    '#' + container.id + ' .tc-footer a:hover { color: #6D5EF5; }',
  ].join('\n');
  document.head.appendChild(style);

  // Fetch avis depuis l'API
  var api = 'https://trustcollect-dashboard.vercel.app/api/dashboard?id=' + encodeURIComponent(clientId);
  fetch(api)
    .then(function (r) { return r.json(); })
    .then(function (data) {
      var avis = (data.avis || []).filter(function (a) { return a.affiche && a.avis; });

      if (avis.length === 0) {
        container.innerHTML = '';
        return;
      }

      var totalNote = avis.reduce(function (s, a) { return s + (a.note || 0); }, 0);
      var moyenne = (totalNote / avis.length).toFixed(1);
      var etoiles = '★★★★★'.slice(0, Math.round(totalNote / avis.length));

      function stars(n) {
        var s = '';
        for (var i = 1; i <= 5; i++) s += i <= n ? '★' : '☆';
        return s;
      }

      function formatDate(d) {
        if (!d) return '';
        var parts = d.split('-');
        if (parts.length === 3) return parts[2] + '/' + parts[1] + '/' + parts[0];
        return d;
      }

      var cardsHtml = avis.map(function (a) {
        return '<div class="tc-card">' +
          '<div class="tc-card-header">' +
            '<div>' +
              '<span class="tc-name">' + (a.nom || 'Anonyme') + '</span>' +
              '<span class="tc-note">' + stars(a.note || 5) + '</span>' +
            '</div>' +
            '<span class="tc-date">' + formatDate(a.date) + '</span>' +
          '</div>' +
          '<p class="tc-text">"' + a.avis + '"</p>' +
        '</div>';
      }).join('');

      container.innerHTML =
        '<div class="tc-header">' +
          '<div class="tc-score">' + moyenne + '</div>' +
          '<div>' +
            '<div><span class="tc-stars">' + '★★★★★'.substring(0, 5) + '</span><span class="tc-count">' + avis.length + ' avis vérifiés</span></div>' +
            '<div class="tc-verified">Avis collectés par TrustCollect</div>' +
          '</div>' +
        '</div>' +
        cardsHtml +
        '<div class="tc-footer"><a href="https://trustcollect.pro" target="_blank" rel="noopener">Propulsé par TrustCollect</a></div>';
    })
    .catch(function () {
      container.innerHTML = '';
    });
})();
