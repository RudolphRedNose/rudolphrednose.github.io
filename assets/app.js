(function () {
  "use strict";

  var DATA_URL = "data/offers.json";
  var STORAGE_KEY = "job-dashboard-status-v1";

  var state = {
    offers: [],
    generatedAt: null,
    filter: "new",
    localStatus: loadLocalStatus(),
  };

  function loadLocalStatus() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
    } catch (e) {
      return {};
    }
  }

  function saveLocalStatus() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state.localStatus));
  }

  function effectiveStatus(offer) {
    return state.localStatus[offer.id] || offer.status || "new";
  }

  function setStatus(offerId, status) {
    if (status === "new") {
      delete state.localStatus[offerId];
    } else {
      state.localStatus[offerId] = status;
    }
    saveLocalStatus();
    render();
  }

  function fmtDate(iso) {
    if (!iso) return "—";
    try {
      var d = new Date(iso);
      return d.toLocaleString("pl-PL", {
        day: "2-digit", month: "2-digit", year: "numeric",
        hour: "2-digit", minute: "2-digit",
      });
    } catch (e) {
      return iso;
    }
  }

  function escapeHtml(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  function badgeLabel(status) {
    return { new: "Nowa", accepted: "Zaakceptowana", dismissed: "Odrzucona" }[status] || status;
  }

  function cardHtml(offer) {
    var status = effectiveStatus(offer);
    var metaParts = [];
    if (offer.company) metaParts.push(escapeHtml(offer.company));
    if (offer.location) metaParts.push("📍 " + escapeHtml(offer.location));
    if (offer.salary) metaParts.push("💰 " + escapeHtml(offer.salary));
    if (offer.work_mode) metaParts.push(escapeHtml(offer.work_mode));

    var notesHtml = offer.match_notes
      ? '<div class="card-notes">' + escapeHtml(offer.match_notes) + "</div>"
      : "";

    var coverLetterHtml = offer.cover_letter
      ? '<details class="card-notes"><summary>List motywacyjny / notatki do CV (dopasowane)</summary>' +
        '<pre class="cover-letter" id="cover-' + escapeHtml(offer.id) + '">' + escapeHtml(offer.cover_letter) + "</pre>" +
        '<button class="btn ghost" data-action="copy" data-id="' + escapeHtml(offer.id) + '">📋 Kopiuj</button>' +
        "</details>"
      : "";

    var actions = "";
    if (status !== "accepted") {
      actions += '<button class="btn primary" data-action="accept" data-id="' + escapeHtml(offer.id) + '">Akceptuj</button>';
    }
    if (status !== "dismissed") {
      actions += '<button class="btn danger" data-action="dismiss" data-id="' + escapeHtml(offer.id) + '">Odrzuć</button>';
    }
    if (status !== "new") {
      actions += '<button class="btn ghost" data-action="reset" data-id="' + escapeHtml(offer.id) + '">Cofnij</button>';
    }
    if (offer.url) {
      actions += '<a class="btn" href="' + escapeHtml(offer.url) + '" target="_blank" rel="noopener">Oferta ↗</a>';
    }
    if (offer.draft_gmail_url) {
      actions += '<a class="btn primary" href="' + escapeHtml(offer.draft_gmail_url) + '" target="_blank" rel="noopener">Otwórz szkic w Gmail ↗</a>';
    }

    return (
      '<article class="card ' + (status === "dismissed" ? "dismissed" : "") + '" data-id="' + escapeHtml(offer.id) + '">' +
        '<div class="card-head">' +
          '<div>' +
            '<h3 class="card-title">' +
              (offer.url ? '<a href="' + escapeHtml(offer.url) + '" target="_blank" rel="noopener">' + escapeHtml(offer.title || "Bez tytułu") + "</a>" : escapeHtml(offer.title || "Bez tytułu")) +
            "</h3>" +
            '<div class="card-company">' + metaParts.join(" · ") + "</div>" +
          "</div>" +
          '<span class="badge ' + status + '">' + badgeLabel(status) + "</span>" +
        "</div>" +
        notesHtml +
        coverLetterHtml +
        '<div class="card-meta">' +
          (offer.source_email_date ? "<span>Alert z: " + escapeHtml(offer.source_email_date) + "</span>" : "") +
          (offer.cv_tailored ? "<span>✅ CV dopasowane</span>" : "<span>⏳ CV jeszcze nie dopasowane</span>") +
        "</div>" +
        '<div class="card-actions">' + actions + "</div>" +
      "</article>"
    );
  }

  function render() {
    var counts = { new: 0, accepted: 0, dismissed: 0, all: state.offers.length };
    state.offers.forEach(function (o) {
      var s = effectiveStatus(o);
      if (counts[s] != null) counts[s]++;
    });
    document.getElementById("count-new").textContent = counts.new;
    document.getElementById("count-accepted").textContent = counts.accepted;
    document.getElementById("count-dismissed").textContent = counts.dismissed;
    document.getElementById("count-all").textContent = counts.all;

    var visible = state.offers.filter(function (o) {
      if (state.filter === "all") return true;
      return effectiveStatus(o) === state.filter;
    });

    // newest first
    visible = visible.slice().sort(function (a, b) {
      return (b.source_email_date || "").localeCompare(a.source_email_date || "");
    });

    var container = document.getElementById("offers");
    var empty = document.getElementById("empty-state");
    if (visible.length === 0) {
      container.innerHTML = "";
      empty.classList.remove("hidden");
    } else {
      empty.classList.add("hidden");
      container.innerHTML = visible.map(cardHtml).join("");
    }
  }

  function handleClick(e) {
    var btn = e.target.closest("button[data-action]");
    if (btn) {
      var id = btn.getAttribute("data-id");
      var action = btn.getAttribute("data-action");
      if (action === "accept") setStatus(id, "accepted");
      else if (action === "dismiss") setStatus(id, "dismissed");
      else if (action === "reset") setStatus(id, "new");
      else if (action === "copy") {
        var pre = document.getElementById("cover-" + id);
        if (pre && navigator.clipboard) {
          navigator.clipboard.writeText(pre.textContent).then(function () {
            var original = btn.textContent;
            btn.textContent = "✅ Skopiowano";
            setTimeout(function () { btn.textContent = original; }, 1500);
          });
        }
      }
      return;
    }
    var tab = e.target.closest(".tab");
    if (tab) {
      document.querySelectorAll(".tab").forEach(function (t) { t.classList.remove("active"); });
      tab.classList.add("active");
      state.filter = tab.getAttribute("data-filter");
      render();
    }
  }

  function updateSetupBanner(offers) {
    var banner = document.getElementById("setup-banner");
    var text = document.getElementById("setup-banner-text");
    if (offers.length === 0) {
      banner.classList.remove("hidden");
      text.textContent = " Brak jeszcze żadnych ofert — sprawdź README, aby założyć alert e-mail na pracuj.pl i uzupełnić cv/base-cv.md oraz config/criteria.json.";
    } else {
      banner.classList.add("hidden");
    }
  }

  function init() {
    document.body.addEventListener("click", handleClick);
    fetch(DATA_URL, { cache: "no-store" })
      .then(function (r) { return r.json(); })
      .then(function (data) {
        state.offers = data.offers || [];
        state.generatedAt = data.generated_at;
        document.getElementById("generated-at").textContent = state.generatedAt
          ? "Ostatnia aktualizacja: " + fmtDate(state.generatedAt)
          : "Jeszcze nie uruchomiono";
        updateSetupBanner(state.offers);
        render();
      })
      .catch(function (err) {
        document.getElementById("generated-at").textContent = "Błąd wczytywania danych";
        console.error(err);
      });
  }

  document.addEventListener("DOMContentLoaded", init);
})();
