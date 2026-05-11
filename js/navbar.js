(function () {
    "use strict";

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

    async function apiJson(url) {
        const res = await fetch(url, { credentials: "include" });
        if (!res.ok) throw new Error(url + " failed: " + res.status);
        return res.json();
    }

    async function build2017NavAndSidebar() {
        if (document.getElementById("header") || document.getElementById("navigation")) return;

        const auth = await apiJson("/apisite/users/v1/users/authenticated");
        const currency = await apiJson("/apisite/economy/v1/users/" + auth.id + "/currency");

        const userId = auth.id;
        const username = esc(auth.name || auth.displayName || "Player");
        const robux = Number(currency.robux || 0).toLocaleString();
        const tix = Number(currency.tickets || 0).toLocaleString();

        qs('[class*="navbar-wrapper-main"]')?.remove();
        qs('[class*="container-0-2-126"]')?.remove();

        document.body.insertAdjacentHTML("afterbegin", `
<div id="header" class="navbar-fixed-top rbx-header" data-isauthenticated="true" role="navigation">
    <div class="container-fluid">
        <div class="rbx-navbar-header">
            <div data-behavior="nav-notification" class="rbx-nav-collapse" onselectstart="return false">
                <span class="icon-nav-menu"></span>
            </div>

            <div class="navbar-header">
                <a class="navbar-brand" href="/home">
                    <span class="icon-logo"></span>
                    <span class="icon-logo-r"></span>
                </a>
            </div>
        </div>

        <ul class="nav rbx-navbar hidden-xs hidden-sm col-md-4 col-lg-3">
            <li><a class="nav-menu-title" href="/games">Games</a></li>
            <li><a class="nav-menu-title" href="/catalog/">Catalog</a></li>
            <li><a class="nav-menu-title" href="/develop">Develop</a></li>
            <li><a class="buy-robux nav-menu-title" href="/My/Money.aspx">Robux</a></li>
        </ul>

        <div id="navbar-universal-search" class="navbar-left rbx-navbar-search col-xs-5 col-sm-6 col-md-3" role="search">
            <div class="input-group">
                <input id="navbar-search-input" class="form-control input-field" type="text" placeholder="Search" maxlength="120">
                <div class="input-group-btn">
                    <button id="navbar-search-btn" class="input-addon-btn" type="submit">
                        <span class="icon-nav-search"></span>
                    </button>
                </div>
            </div>

            <ul data-toggle="dropdown-menu" class="dropdown-menu" role="menu">
                <li class="rbx-navbar-search-option rbx-clickable-li selected" data-searchurl="/search/users?keyword=">
                    <a class="rbx-navbar-search-anchor" href="/search/users?keyword=">
                        <span class="rbx-navbar-search-text">Search <span class="rbx-navbar-search-string"></span> in Players</span>
                    </a>
                </li>
                <li class="rbx-navbar-search-option rbx-clickable-li" data-searchurl="/games/?Keyword=">
                    <a class="rbx-navbar-search-anchor" href="/games/?Keyword=">
                        <span class="rbx-navbar-search-text">Search <span class="rbx-navbar-search-string"></span> in Games</span>
                    </a>
                </li>
                <li class="rbx-navbar-search-option rbx-clickable-li" data-searchurl="/catalog/browse.aspx?CatalogContext=1&Keyword=">
                    <a class="rbx-navbar-search-anchor" href="/catalog/browse.aspx?CatalogContext=1&Keyword=">
                        <span class="rbx-navbar-search-text">Search <span class="rbx-navbar-search-string"></span> in Catalog</span>
                    </a>
                </li>
                <li class="rbx-navbar-search-option rbx-clickable-li" data-searchurl="/groups/search.aspx?val=">
                    <a class="rbx-navbar-search-anchor" href="/groups/search.aspx?val=">
                        <span class="rbx-navbar-search-text">Search <span class="rbx-navbar-search-string"></span> in Groups</span>
                    </a>
                </li>
                <li class="rbx-navbar-search-option rbx-clickable-li" data-searchurl="/develop/library?CatalogContext=2&Category=6&Keyword=">
                    <a class="rbx-navbar-search-anchor" href="/develop/library?CatalogContext=2&Category=6&Keyword=">
                        <span class="rbx-navbar-search-text">Search <span class="rbx-navbar-search-string"></span> in Library</span>
                    </a>
                </li>
            </ul>
        </div>

        <div class="navbar-right rbx-navbar-right">
            <ul class="nav navbar-right rbx-navbar-icon-group">
                <li id="navbar-setting" class="navbar-icon-item">
                    <a class="rbx-menu-item roblox-popover-close" data-toggle="popover" data-bind="popover-setting" data-viewport="#header">
                        <span class="icon-nav-settings roblox-popover-close" id="nav-settings"></span>
                        <span class="notification-red notification nav-setting-highlight hidden">0</span>
                    </a>

                    <div class="popover fade bottom" id="settings-popover" role="tooltip" style="top:40.6px;left:-57.2px;display:none;">
                        <div class="arrow" style="left:72.2522%;"></div>
                        <h3 class="popover-title" style="display:none;"></h3>
                        <div class="popover-content">
                            <ul class="dropdown-menu" role="menu">
                                <li><a class="rbx-menu-item" href="/My/Account">Settings</a></li>
                                <li><a class="rbx-menu-item" href="/info/help" target="_blank">Help</a></li>
                                <li><a class="rbx-menu-item logout-button">Logout</a></li>
                            </ul>
                        </div>
                    </div>
                </li>

                <li id="navbar-robux" class="navbar-icon-item">
                    <a id="nav-robux-icon" class="rbx-menu-item" href="/My/Money.aspx">
                        <span class="icon-nav-robux roblox-popover-close" id="nav-robux"></span>
                        <span class="rbx-text-navbar-right" id="nav-robux-amount">${robux}</span>
                    </a>
                </li>

                <li id="navbar-tix" class="navbar-icon-item">
                    <a id="nav-tix-icon" class="rbx-menu-item" href="/My/Money.aspx">
                        <span class="icon-nav-tix" id="nav-tix"></span>
                        <span class="rbx-text-navbar-right" id="nav-tix-amount">${tix}</span>
                    </a>
                </li>

                <li class="navbar-icon-item notification-stream">
                    <div notification-indicator=""></div>
                </li>

                <li class="rbx-navbar-right-search" data-toggle="toggle-search">
                    <a class="rbx-menu-icon rbx-menu-item">
                        <span class="icon-nav-search-white"></span>
                    </a>
                </li>
            </ul>

            <div class="xsmall age-bracket-label">
                <span class="age-bracket-label-username">${username}: </span>13+
            </div>
        </div>

        <ul class="nav rbx-navbar hidden-md hidden-lg col-xs-12">
            <li><a class="nav-menu-title" href="/games">Games</a></li>
            <li><a class="nav-menu-title" href="/catalog/">Catalog</a></li>
            <li><a class="nav-menu-title" href="/develop">Develop</a></li>
            <li><a class="buy-robux nav-menu-title" href="/My/Money.aspx">Robux</a></li>
        </ul>
    </div>
</div>

<div id="navigation" class="rbx-left-col" data-behavior="left-col">
    <ul>
        <li class="text-lead">
            <a class="text-overflow" href="/users/${userId}/profile">${username}</a>
        </li>
        <li class="rbx-divider"></li>
    </ul>

    <div class="rbx-scrollbar" data-toggle="scrollbar" onselectstart="return false">
        <ul>
            <li><a href="/home" id="nav-home"><span class="icon-nav-home"></span><span>Home</span></a></li>
            <li><a href="/users/${userId}/profile" id="nav-profile"><span class="icon-nav-profile"></span><span>Profile</span></a></li>
            <li id="navigation-messages"><a href="/My/Messages" id="nav-message" data-count="0"><span class="icon-nav-message"></span><span>Messages</span><span class="notification-blue hide" title="0"></span></a></li>
            <li id="navigation-friends"><a href="/users/${userId}/friends" id="nav-friends" data-count="0"><span class="icon-nav-friends"></span><span>Friends</span><span class="notification-blue hide" title="0"></span></a></li>
            <li><a href="/My/Avatar" id="nav-character"><span class="icon-nav-charactercustomizer"></span><span>Avatar</span></a></li>
            <li><a href="/users/${userId}/inventory" id="nav-inventory"><span class="icon-nav-inventory"></span><span>Inventory</span></a></li>
            <li><a href="/My/Trades.aspx" id="nav-trade"><span class="icon-nav-trade"></span><span>Trade</span></a></li>
            <li><a href="/My/Groups.aspx" id="nav-group"><span class="icon-nav-group"></span><span>Groups</span></a></li>
            <li><a href="/Forum/Default.aspx" id="nav-blog"><span class="icon-nav-blog"></span><span>Blog</span></a></li>
            <li><a id="nav-shop" class="roblox-shop-interstitial"><span class="icon-nav-shop"></span><span>Shop</span></a></li>
            <li class="rbx-upgrade-now"><a href="/BuildersClub/Upgrade.ashx" class="btn-secondary-md" id="upgrade-now-button">Upgrade Now</a></li>
        </ul>
    </div>
</div>
        `);

        setupSettingsPopover();
        setupSidebarToggle();
    }

    function setupSettingsPopover() {
        const button = qs("#navbar-setting > a");
        const popover = qs("#settings-popover");

        if (!button || !popover) return;

        button.addEventListener("click", function (e) {
            e.preventDefault();
            e.stopPropagation();

            const isOpen = popover.style.display === "block";

            document.querySelectorAll(".popover").forEach(p => {
                p.style.display = "none";
                p.classList.remove("in");
            });

            if (!isOpen) {
                popover.style.display = "block";
                requestAnimationFrame(() => popover.classList.add("in"));
            }
        });

        document.addEventListener("click", function (e) {
            if (!e.target.closest("#navbar-setting")) {
                popover.style.display = "none";
                popover.classList.remove("in");
            }
        });
    }

    function setupSidebarToggle() {
        const button = qs(".rbx-nav-collapse");
        const sidebar = qs("#navigation");

        if (!button || !sidebar) return;

        button.addEventListener("click", function (e) {
            e.preventDefault();
            e.stopPropagation();

            sidebar.classList.toggle("open");
            document.body.classList.toggle("nav-open");
        });
    }

    build2017NavAndSidebar();

    window.Korone2017Nav = {
        build2017NavAndSidebar,
        setupSettingsPopover,
        setupSidebarToggle
    };
})();
