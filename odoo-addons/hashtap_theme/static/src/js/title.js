/* HashTap — backend page title rewriter.
 *
 * Odoo'nun title_service'i tab başlığını "{Action} - Odoo" biçiminde set
 * eder. Whitelist nedeniyle Python tarafından bunu değiştirmek zor;
 * MutationObserver ile <title>'ı dinleyip "Odoo"yu "HashTap" yapıyoruz.
 *
 * Aynı zamanda favicon link'lerini HashTap logosuyla değiştiriyoruz.
 */
(function () {
    "use strict";

    function rewriteTitle() {
        var el = document.querySelector("title");
        if (!el) return;
        var t = el.textContent || "";
        // " - Odoo" son eki ya da " | Odoo" varyantı
        var next = t
            .replace(/\s*[-|]\s*Odoo\s*$/i, "")
            .replace(/^Odoo\s*[-|]\s*/i, "")
            .replace(/^Odoo$/i, "HashTap");
        if (next !== t) {
            el.textContent = next;
        }
    }

    function rewriteFavicon() {
        var head = document.head;
        if (!head) return;
        // Mevcut favicon link'lerini kaldır
        head.querySelectorAll(
            'link[rel~="icon"], link[rel="apple-touch-icon"], link[rel="shortcut icon"]'
        ).forEach(function (l) {
            if (!l.dataset.hashtap) l.remove();
        });
        // HashTap SVG favicon ekle (modern tarayıcılar)
        if (!head.querySelector('link[data-hashtap="1"]')) {
            var link = document.createElement("link");
            link.rel = "icon";
            link.type = "image/svg+xml";
            link.href = "/hashtap_theme/static/src/img/favicon.svg";
            link.dataset.hashtap = "1";
            head.appendChild(link);
        }
    }

    function start() {
        rewriteTitle();
        rewriteFavicon();
        var titleEl = document.querySelector("title");
        if (titleEl) {
            new MutationObserver(rewriteTitle).observe(titleEl, {
                childList: true,
                characterData: true,
                subtree: true,
            });
        }
        // Tarayıcı title'ı head içine sonradan ekleyebilir — head'i de izle
        new MutationObserver(function () {
            rewriteTitle();
            rewriteFavicon();
        }).observe(document.head, { childList: true });
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", start);
    } else {
        start();
    }
})();
