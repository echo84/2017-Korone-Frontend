(function () {
    "use strict";

    if (location.pathname.toLowerCase() !== "/home") return;

    const qs = (s, r) => (r || document).querySelector(s);
    const qsa = (s, r) => Array.prototype.slice.call((r || document).querySelectorAll(s));

    function esc(s) {
        return String(s || "").replace(/[&<>"']/g, c => ({
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#39;"
        }[c]));
    }

    function getUserIdFromUrl(url) {
        const m = String(url || "").match(/\/users\/(\d+)\//);
        return m ? m[1] : "";
    }

    async function apiJson(url) {
        const res = await fetch(url, { credentials: "include" });
        if (!res.ok) throw new Error(url + " failed: " + res.status);
        return res.json();
    }

    async function getAvatarThumbs(ids) {
        const out = {};
        ids = ids.filter(Boolean);

        for (let i = 0; i < ids.length; i += 25) {
            const chunk = ids.slice(i, i + 25);

            try {
                const json = await apiJson(
                    "/apisite/thumbnails/v1/users/avatar?userIds=" +
                    encodeURIComponent(chunk.join(",")) +
                    "&size=420x420&format=png"
                );

                (json.data || []).forEach(item => {
                    out[String(item.targetId || item.id)] = item.imageUrl;
                });
            } catch (e) {}
        }

        return out;
    }

    async function getHeadshot(userId) {
        try {
            const json = await apiJson(
                "/apisite/thumbnails/v1/users/headshot?userIds=" +
                encodeURIComponent(userId) +
                "&size=420x420&format=png"
            );

            const item = (json.data || [])[0];
            return item ? item.imageUrl : "/img/error.png";
        } catch (e) {
            return "/img/error.png";
        }
    }

    async function getGameIcons(placeIds) {
        const out = {};
        placeIds = placeIds.filter(Boolean);

        if (!placeIds.length) return out;

        try {
            const json = await apiJson(
                "/apisite/thumbnails/v1/places/gameicons?placeIds=" +
                encodeURIComponent(placeIds.join(",")) +
                "&size=150x150&format=Png"
            );

            (json.data || []).forEach(item => {
                out[String(item.targetId)] = item.imageUrl;
            });
        } catch (e) {
            console.warn("game icons failed", e);
        }

        return out;
    }

    async function loadRecentlyPlayed() {
        const container = document.getElementById("recently-visited-places-content");
        const spinner = document.getElementById("recently-visited-places-content-spinner");

        if (!container) return console.warn("missing recently played container");

        const data = await apiJson(
            "/apisite/games/v1/games/list?sortToken=recent&maxRows=6&genre=0&keyword="
        );

        const games =
            data.games ||
            (data.data && data.data.games) ||
            data.GameData ||
            data.Items ||
            [];

        const placeIds = games.map(g => g.placeId || g.rootPlaceId || (g.rootPlace && g.rootPlace.id));
        const thumbs = await getGameIcons(placeIds);

        container.innerHTML =
            '<ul class="hlist game-cards">' +
            games.map(function (game, index) {
                const placeId = game.placeId || game.rootPlaceId || (game.rootPlace && game.rootPlace.id) || 0;

                const name = esc(game.name || "Unknown Game");
                const creator = esc(game.creatorName || (game.creator && game.creator.name) || "Unknown");
                const creatorId = game.creatorId || (game.creator && game.creator.id) || 0;

                const players = game.playerCount || 0;
                const upvotes = game.totalUpVotes || game.likes || 0;
                const downvotes = game.totalDownVotes || game.dislikes || 0;

                const totalVotes = upvotes + downvotes;
                const votePercent = totalVotes > 0 ? Math.round((upvotes / totalVotes) * 100) : 0;

                const thumb =
                    thumbs[String(placeId)] ||
                    game.iconUrl ||
                    game.imageUrl ||
                    game.thumbnailUrl ||
                    "/img/placeholder/icon_one.png";

                return `
<li class="list-item game-card">
    <div class="game-card-container">
        <a href="/games/refer?SortFilter=recent&PlaceId=${placeId}&Position=${index + 1}&PageType=Home" class="game-card-link">
            <div class="game-card-thumb-container">
                <img class="game-card-thumb" src="${esc(thumb)}" alt="${name}" thumbnail="" image-retry="">
            </div>

            <div class="text-overflow game-card-name" title="${name}" ng-non-bindable="">${name}</div>

            <div class="game-card-name-secondary">${players.toLocaleString()} Playing</div>

            <div class="game-card-experimental">
                <span class="icon-experimental-gray2"></span>
                <span class="experimental-label-long">Experimental Mode</span>
                <span class="experimental-label-short">Experimental</span>
            </div>

            <div class="game-card-vote">
                <div class="vote-bar" data-voting-processed="false">
                    <div class="vote-thumbs-up"><span class="icon-like-gray-16x16"></span></div>

                    <div class="vote-container" data-upvotes="${upvotes}" data-downvotes="${downvotes}">
                        <div class="vote-background"></div>
                        <div class="vote-percentage" style="width:${votePercent}%"></div>
                        <div class="vote-mask">
                            <div class="segment seg-1"></div>
                            <div class="segment seg-2"></div>
                            <div class="segment seg-3"></div>
                            <div class="segment seg-4"></div>
                        </div>
                    </div>

                    <div class="vote-thumbs-down"><span class="icon-dislike-gray-16x16"></span></div>
                </div>

                <div class="vote-counts">
                    <div class="vote-down-count">${downvotes.toLocaleString()}</div>
                    <div class="vote-up-count">${upvotes.toLocaleString()}</div>
                </div>
            </div>
        </a>

        <div class="game-card-footer">
            <div class="creator">
                <span class="text-label xsmall text-overflow">
                    By <a class="text-link" href="/users/${creatorId}/profile" ng-non-bindable="">${creator}</a>
                </span>
            </div>

            <div class="game-card-experimental">
                <span class="icon-experimental-gray2"></span>
                <span class="experimental-label-long">Experimental Mode</span>
            </div>
        </div>
    </div>
</li>`;
            }).join("") +
            "</ul>";

        if (spinner) spinner.remove();
    }

    async function loadFavorites() {
        const container = document.getElementById("my-favorites-games-content");
        const spinner = document.getElementById("my-favorites-games-content-spinner");

        if (!container) return console.warn("missing favorites container");

        const data = await apiJson(
            "/apisite/games/v1/games/list?sortToken=Favorited&maxRows=6&genre=0&keyword="
        );

        const games =
            data.games ||
            (data.data && data.data.games) ||
            data.GameData ||
            data.Items ||
            [];

        const placeIds = games.map(g => g.placeId || g.rootPlaceId || (g.rootPlace && g.rootPlace.id));
        const thumbs = await getGameIcons(placeIds);

        if (!games.length) {
            container.innerHTML = '<div class="empty-row">No favorites loaded.</div>';
            if (spinner) spinner.remove();
            return;
        }

        container.innerHTML =
            '<ul class="hlist game-cards">' +
            games.map(function (game, index) {
                const placeId = game.placeId || game.rootPlaceId || (game.rootPlace && game.rootPlace.id) || 0;

                const name = esc(game.name || "Unknown Game");
                const creator = esc(game.creatorName || (game.creator && game.creator.name) || "Unknown");
                const creatorId = game.creatorId || (game.creator && game.creator.id) || 0;

                const players = game.playerCount || 0;
                const upvotes = game.totalUpVotes || game.likes || 0;
                const downvotes = game.totalDownVotes || game.dislikes || 0;

                const totalVotes = upvotes + downvotes;
                const votePercent = totalVotes > 0 ? Math.round((upvotes / totalVotes) * 100) : 0;

                const thumb =
                    thumbs[String(placeId)] ||
                    game.iconUrl ||
                    game.imageUrl ||
                    game.thumbnailUrl ||
                    "/img/placeholder/icon_one.png";

                return `
    <li class="list-item game-card">
        <div class="game-card-container">
            <a href="/games/refer?SortFilter=Favorited&PlaceId=${placeId}&Position=${index + 1}&PageType=Home" class="game-card-link">
                <div class="game-card-thumb-container">
                    <img class="game-card-thumb" src="${esc(thumb)}" alt="${name}" thumbnail="" image-retry="">
                </div>

                <div class="text-overflow game-card-name" title="${name}" ng-non-bindable="">${name}</div>
                <div class="game-card-name-secondary">${players.toLocaleString()} Playing</div>

                <div class="game-card-vote">
                    <div class="vote-bar" data-voting-processed="false">
                        <div class="vote-thumbs-up"><span class="icon-like-gray-16x16"></span></div>

                        <div class="vote-container" data-upvotes="${upvotes}" data-downvotes="${downvotes}">
                            <div class="vote-background"></div>
                            <div class="vote-percentage" style="width:${votePercent}%"></div>
                            <div class="vote-mask">
                                <div class="segment seg-1"></div>
                                <div class="segment seg-2"></div>
                                <div class="segment seg-3"></div>
                                <div class="segment seg-4"></div>
                            </div>
                        </div>

                        <div class="vote-thumbs-down"><span class="icon-dislike-gray-16x16"></span></div>
                    </div>

                    <div class="vote-counts">
                        <div class="vote-down-count">${downvotes.toLocaleString()}</div>
                        <div class="vote-up-count">${upvotes.toLocaleString()}</div>
                    </div>
                </div>
            </a>

            <div class="game-card-footer">
                <div class="creator">
                    <span class="text-label xsmall text-overflow">
                        By <a class="text-link" href="/users/${creatorId}/profile" ng-non-bindable="">${creator}</a>
                    </span>
                </div>
            </div>
        </div>
    </li>`;
            }).join("") +
            "</ul>";

        if (spinner) spinner.remove();
    }

    async function rebuildHome() {
        const oldHome = qs('[class*="homeContainer-"]');
        if (!oldHome || document.getElementById("HomeContainer")) return false;

        const hello = qs('[class*="helloMessage-"]', oldHome);
        const friendsHeader = qs('[class*="friendSection-"] h3', oldHome);

        const profileUrl = hello ? hello.getAttribute("href") : "#";
        const userId = getUserIdFromUrl(profileUrl);
        const username = hello ? hello.textContent.replace("Hello,", "").replace("!", "").trim() : "Player";
        const friendCount = friendsHeader ? friendsHeader.textContent.trim() : "Friends";

        const friends = qsa('[class*="friendEntry-"]', oldHome).slice(0, 9).map(li => {
            const a = qs('a[href*="/users/"]', li);
            const img = qs("img", li);
            const name = qs('[class*="username-"]', li);
            const status = qs(".avatar-status", li);
            const href = a ? a.getAttribute("href") : "#";

            let statusClass = "";
            if (status && status.className.indexOf("icon-game") !== -1) statusClass = "icon-game";
            else if (status && status.className.indexOf("icon-online") !== -1) statusClass = "icon-online";

            return {
                id: getUserIdFromUrl(href),
                href,
                fallbackImg: img ? img.src : "/img/error.png",
                name: name ? name.textContent.trim() : (img ? img.alt : "Friend"),
                statusClass,
                title: status ? status.getAttribute("title") : ""
            };
        });

        const thumbs = await getAvatarThumbs([userId].concat(friends.map(f => f.id)));
        const avatarUrl = await getHeadshot(userId);

        const friendHtml = friends.map(f => {
            const img = thumbs[f.id] || f.fallbackImg || "/img/error.png";

            const statusHtml = f.statusClass
                ? '<span class="friend-status place-link"><span class="avatar-status ' + f.statusClass + '" title="' + esc(f.title || "Online") + '"></span></span>'
                : "";

            return '' +
                '<li class="list-item friend">' +
                    '<div class="avatar-container">' +
                        '<a href="' + esc(f.href) + '" class="avatar avatar-card-fullbody friend-link" title="' + esc(f.name) + '">' +
                            '<span class="avatar-card-link friend-avatar">' +
                                '<img alt="' + esc(f.name) + '" class="avatar-card-image" src="' + esc(img) + '">' +
                            '</span>' +
                            '<span class="text-overflow friend-name">' + esc(f.name) + '</span>' +
                        '</a>' +
                        statusHtml +
                    '</div>' +
                '</li>';
        }).join("");

        const page = document.createElement("div");
        page.className = "content k17-content";

        page.innerHTML =
            '<div id="HomeContainer" class="row home-container">' +

                '<div class="col-xs-12 home-header non-bc">' +
                    '<a href="/users/' + esc(userId) + '/profile" class="avatar avatar-headshot-lg">' +
                        '<img alt="avatar" src="' + esc(avatarUrl) + '" id="home-avatar-thumb" class="avatar-card-image">' +
                    '</a>' +
                    '<div class="home-header-content">' +
                        '<h1><a href="/users/' + esc(userId) + '/profile">Hello, ' + esc(username) + '!</a></h1>' +
                    '</div>' +
                '</div>' +

                '<div class="col-xs-12 section home-friends">' +
                    '<div class="container-header">' +
                        '<h3>' + esc(friendCount) + '</h3>' +
                        '<a href="/users/' + esc(userId) + '/friends" class="btn-secondary-xs btn-more btn-fixed-width">See All</a>' +
                    '</div>' +
                    '<div class="section-content">' +
                        '<ul class="hlist friend-list">' + friendHtml + '</ul>' +
                    '</div>' +
                '</div>' +

                '<div id="recently-visited-places" class="col-xs-12 container-list home-games">' +
                    '<div id="recently-visited-places-header" class="container-header">' +
                        '<h3>Recently Played</h3>' +
                        '<a href="/games?sortFilter=recent" class="btn-secondary-xs btn-more btn-fixed-width">See All</a>' +
                    '</div>' +
                    '<div id="recently-visited-places-list" class="game-card-list">' +
                        '<div id="recently-visited-places-content-spinner" class="loading-animated game-card-list-spinner">' +
                            '<div><div></div><div></div><div></div></div>' +
                        '</div>' +
                        '<div id="recently-visited-places-content"></div>' +
                    '</div>' +
                '</div>' +

                '<div id="my-favorites-games" class="col-xs-12 container-list home-games">' +
                    '<div id="my-favorites-games-header" class="container-header">' +
                        '<h3>My Favorites</h3>' +
                        '<a href="/users/' + esc(userId) + '/favorites#!/places" class="btn-secondary-xs btn-more btn-fixed-width">See All</a>' +
                    '</div>' +
                    '<div id="my-favorites-games-list" class="game-card-list">' +
                        '<div id="my-favorites-games-content-spinner" class="loading-animated game-card-list-spinner">' +
                            '<div><div></div><div></div><div></div></div>' +
                        '</div>' +
                        '<div id="my-favorites-games-content"></div>' +
                    '</div>' +
                '</div>' +

                '<div class="col-xs-12 col-sm-6 home-right-col">' +
                    '<div class="section">' +
                        '<div class="section-header">' +
                            '<h3>Blog News</h3>' +
                            '<a href="#" class="btn-control-xs btn-more btn-fixed-width">See More</a>' +
                        '</div>' +
                        '<div class="section-content">' +
                            '<ul class="blog-news">' +
                                '<li class="news"><span class="text-overflow news-link"><a href="#" class="text-name text-lead">Welcome to Korone</a></span></li>' +
                                '<li class="news"><span class="text-overflow news-link"><a href="#" class="text-name text-lead">New avatar and game updates</a></span></li>' +
                            '</ul>' +
                        '</div>' +
                    '</div>' +
                '</div>' +

                '<div class="col-xs-12 col-sm-6 home-left-col">' +
                    '<div class="section">' +
                        '<div class="section-header"><h3>My Feed</h3></div>' +
                        '<div class="section-content">' +
                            '<div class="form-horizontal" id="statusForm">' +
                                '<div class="form-group">' +
                                    '<input class="form-control input-field" id="txtStatusMessage" maxlength="254" placeholder="What are you up to?">' +
                                '</div>' +
                                '<a type="button" class="btn-primary-md btn-fixed-width" id="shareButton">Share</a>' +
                            '</div>' +
                            '<ul class="vlist feeds"></ul>' +
                        '</div>' +
                    '</div>' +
                '</div>' +

            '</div>';

        const oldOuter = oldHome.closest('[class*="container-0-2-"]') || oldHome;
        if (!oldOuter || !oldOuter.parentNode) return false;

        oldOuter.parentNode.replaceChild(page, oldOuter);
        return true;
    }

    let tries = 0;
    const timer = setInterval(function () {
        tries++;

        const oldHome = qs('[class*="homeContainer-"]');
        const friendCount = oldHome ? qsa('[class*="friendEntry-"]', oldHome).length : 0;

        if (oldHome && friendCount > 0) {
            clearInterval(timer);

            rebuildHome().then(function () {
                loadRecentlyPlayed();
                loadFavorites();
            });
        }

        if (tries > 80) clearInterval(timer);
    }, 250);

    window.Korone2017Home = {
        rebuildHome,
        loadRecentlyPlayed
    };
})();
