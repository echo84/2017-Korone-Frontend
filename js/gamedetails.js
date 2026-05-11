(function () {
    "use strict";

    if (!/^\/games\/\d+/i.test(location.pathname)) return;

    const qs = (s, r) => (r || document).querySelector(s);

    function esc(s) {
        return String(s || "").replace(/[&<>"']/g, c => ({
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#39;"
        }[c]));
    }

    function placeIdFromUrl() {
        const m = location.pathname.match(/\/games\/(\d+)/i);
        return m ? m[1] : "";
    }

    function text(sel, root) {
        const el = qs(sel, root);
        return el ? el.textContent.trim() : "";
    }

    async function playGame(placeId) {
        const res = await fetch("/game/get-join-script?placeId=" + encodeURIComponent(placeId), {
            credentials: "include"
        });

        const data = await res.json();

        const a = document.createElement("a");
        a.href = String(data.prefix || "") + String(data.joinScriptUrl || "");
        document.body.appendChild(a);
        a.click();

        setTimeout(function () {
            a.remove();
        }, 1000);
    }

    function rebuildGamePage() {
        const old = qs('[class*="gameContainer-"]');
        if (!old || document.getElementById("game-detail-page")) return false;

        const placeId = placeIdFromUrl();

        const name = text('[class*="gameName-"]', old) || document.title.replace(" - Korone", "");
        const creator = text('[class*="creatorName-"]', old) || "Unknown";
        const creatorHref = (qs('[class*="creatorName-"]', old) || {}).href || "#";

        const thumb = qs('[class*="carouselItem-"] img, [class*="thumbContainer-"] img', old);
        const thumbUrl = thumb ? thumb.src : "/img/placeholder/icon_one.png";

        const desc = text('[class*="descriptionText-"]', old);
        const stats = Array.prototype.slice.call(old.querySelectorAll('[class*="gameStat-"]')).map(function (li) {
            return {
                label: text('[class*="gameStatLabel-"]', li),
                value: text('[class*="gameStatStat-"]', li)
            };
        }).filter(function (x) {
            return x.label && x.value;
        });

        const up = text('[class*="countLeft-"] [class*="voteText-"]', old) || "0";
        const down = text('[class*="countRight-"] [class*="voteText-"]', old) || "0";
        const votePercentEl = qs('[class*="votePercentage-"]', old);
        const voteWidth = votePercentEl && votePercentEl.style.width ? votePercentEl.style.width : "0%";

        const badges = qs('[class*="badgeList-"]', old);
        const recommended = qs('[class*="recommendedGamesContainer-"]', old);
        const comments = qs('[class*="commentsContainer-"]', old);

        const page = document.createElement("div");
        page.id = "korone-2017-game-page";
        page.className = "content";

        page.innerHTML = `
<div id="game-detail-page" class="row page-content inline-social" data-place-id="${esc(placeId)}">
    <div class="col-xs-12 section-content game-main-content">
        <div class="game-thumb-container">
            <div id="carousel-game-details" class="carousel slide">
                <div class="carousel-inner" role="listbox">
                    <div class="item active">
                        <span><img class="carousel-thumb" src="${esc(thumbUrl)}"></span>
                    </div>
                </div>
            </div>
        </div>

        <div class="game-calls-to-action">
            <div class="game-title-container">
                <h2 class="game-name" title="${esc(name)}">${esc(name)}</h2>
                <div class="game-creator">
                    <span class="text-label">By</span>
                    <a class="text-name" href="${esc(creatorHref)}">${esc(creator)}</a>
                </div>
            </div>

            <div class="game-buttons-container">
                <div class="game-play-buttons" data-autoplay="false">
                    <div id="MultiplayerVisitButton" class="VisitButton VisitButtonPlayGLI" placeid="${esc(placeId)}">
                        <a class="btn-primary-lg">Play</a>
                    </div>
                </div>

                <ul class="share-rate-favorite">
                    <li class="favorite-button-container">
                        <div class="tooltip-container">
                            <a id="toggle-favorite">
                                <span class="text-favorite favoriteCount" id="result">Favorite</span>
                                <div id="favorite-icon" class="icon-favorite"></div>
                            </a>
                        </div>
                    </li>

                    <li id="voting-section" class="voting-panel body">
                        <div class="vote-summary">
                            <div class="voting-details">
                                <div class="users-vote">
                                    <div class="upvote"><span class="icon-like"></span></div>
                                    <div class="vote-details">
                                        <div class="vote-container">
                                            <div class="vote-background"></div>
                                            <div class="vote-percentage" style="width:${esc(voteWidth)}"></div>
                                            <div class="vote-mask">
                                                <div class="segment seg-1"></div>
                                                <div class="segment seg-2"></div>
                                                <div class="segment seg-3"></div>
                                                <div class="segment seg-4"></div>
                                            </div>
                                        </div>
                                        <div class="vote-numbers">
                                            <div class="count-left"><span id="vote-up-text" class="vote-text">${esc(up)}</span></div>
                                            <div class="count-right"><span id="vote-down-text" class="vote-text">${esc(down)}</span></div>
                                        </div>
                                    </div>
                                    <div class="downvote"><span class="icon-dislike"></span></div>
                                </div>
                            </div>
                        </div>
                    </li>
                </ul>
            </div>
        </div>
    </div>

    <div class="col-xs-12 rbx-tabs-horizontal">
        <ul id="horizontal-tabs" class="nav nav-tabs" role="tablist">
            <li id="tab-about" class="rbx-tab tab-about active"><a class="rbx-tab-heading" href="#about"><span class="text-lead">About</span></a></li>
            <li id="tab-store" class="rbx-tab tab-store"><a class="rbx-tab-heading" href="#store"><span class="text-lead">Store</span></a></li>
            <li id="tab-game-instances" class="rbx-tab tab-game-instances"><a class="rbx-tab-heading" href="#game-instances"><span class="text-lead">Servers</span></a></li>
        </ul>

        <div class="tab-content rbx-tab-content">
            <div class="tab-pane active" id="about">
                <div class="section game-about-container">
                    <h3>Description</h3>
                    <div class="section-content">
                        <p class="game-description linkify">${esc(desc)}</p>

                        <ul class="game-stats-container">
                            ${stats.map(function (s) {
                                return '<li class="game-stat"><p class="text-label">' + esc(s.label) + '</p><p class="text-lead">' + esc(s.value) + '</p></li>';
                            }).join("")}
                        </ul>

                        <div class="game-stat-footer">
                            <span class="game-report-abuse">
                                <a class="text-report abuse-report-modal" href="/internal/report-abuse">Report Abuse</a>
                            </span>
                        </div>
                    </div>
                </div>

                <div id="rbx-vip-servers" class="stack">
                    <div class="container-header"><h3>VIP Servers</h3></div>
                    <ul class="stack-list create-server-banner">
                        <li class="stack-row">
                            <span class="create-server-banner-text">
                                Play this game with friends and other people you invite.<br>
                                See all your VIP servers in the <a class="text-link" href="#!/game-instances">Servers</a> tab.
                            </span>
                        </li>
                    </ul>
                </div>

                ${badges ? badges.outerHTML : ""}
                ${recommended ? recommended.outerHTML : ""}
                ${comments ? '<div class="container-list games-detail"><div class="container-header"><h3>Comments</h3></div>' + comments.outerHTML + '</div>' : ""}
            </div>
        </div>
    </div>
</div>`;

        const oldOuter = old.closest('[class*="container-0-2-"]') || old;
        oldOuter.parentNode.replaceChild(page, oldOuter);

        const play = document.getElementById("MultiplayerVisitButton");
        if (play) {
            play.addEventListener("click", function () {
                playGame(placeId);
            });
        }

        return true;
    }

    let tries = 0;

    const timer = setInterval(function () {
        tries++;

        const old = qs('[class*="gameContainer-"]');
        if (!old) return false;

        if (document.getElementById("korone-2017-game-page")) return false;

        const hasTitle = old && qs('[class*="gameName-"]', old);
        const hasDescription = old && qs('[class*="descriptionText-"]', old);
        const hasStats = old && old.querySelectorAll('[class*="gameStat-"]').length >= 3;
        const hasThumb = old && qs('[class*="carouselItem-"] img, [class*="thumbContainer-"] img', old);

        if (old && hasTitle && hasDescription && hasStats && hasThumb) {
            clearInterval(timer);
            rebuildGamePage();
        }

        if (tries > 120) {
            clearInterval(timer);
            console.warn("game page rebuild timed out");
        }
    }, 250);

    window.Korone2017Game = {
        rebuildGamePage
    };
})();
