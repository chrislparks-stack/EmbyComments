define([], function () {
    var apiEndpoint = null;
    var displayName = null;
    var serverGuid = null;
    var userUuid = null;
    var selectedRating = 0;
    var currentMediaKey = null;
    var lastInjectedItemId = null;
    var currentItemName = '';

    var currentPage = 0;
    var commentTotal = 0;
    var isLoading = false;
    var PAGE_SIZE = 20;
    var MAX_CHARS = 1200;

    var reactionsMap = {};
    var hiddenSet = {};
    var userModerationStatus = 'approved';
    var pendingComments = [];
    var censorExplicit = false;
    var moderationPollTimer = null;
    var moderationPollCount = 0;
    var sessionToken = null;
    var initRetries = 0;
    var MAX_INIT_RETRIES = 10;

    var THUMB_DOWN_SVG = '<svg viewBox="0 0 24 24" width="12" height="12" style="vertical-align:-1px;"><path fill="currentColor" d="M19 15h4V3h-4m-4 0H6.2c-.7 0-1.3.4-1.6 1l-2.5 5.9c-.1.2-.1.4-.1.6V12c0 1.1.9 2 2 2h6.3l-1 4.6c-.1.5.1 1 .4 1.4l.5.5 6.7-6.7c.3-.3.5-.7.5-1.1V5c0-1.1-.9-2-2-2z"/></svg>';
    var EYE_SVG = '<svg viewBox="0 0 24 24" width="14" height="14" style="vertical-align:-2px;"><path fill="currentColor" d="M12 4.5C7 4.5 2.7 7.6 1 12c1.7 4.4 6 7.5 11 7.5s9.3-3.1 11-7.5c-1.7-4.4-6-7.5-11-7.5zm0 12.5c-2.8 0-5-2.2-5-5s2.2-5 5-5 5 2.2 5 5-2.2 5-5 5zm0-8c-1.7 0-3 1.3-3 3s1.3 3 3 3 3-1.3 3-3-1.3-3-3-3z"/></svg>';
    var EYE_OFF_SVG = '<svg viewBox="0 0 24 24" width="14" height="14" style="vertical-align:-2px;"><path fill="currentColor" d="M12 7c2.8 0 5 2.2 5 5 0 .6-.1 1.3-.4 1.8l2.9 2.9c1.5-1.3 2.7-2.9 3.5-4.7-1.7-4.4-6-7.5-11-7.5-1.4 0-2.7.3-4 .7l2.2 2.2c.5-.3 1.2-.4 1.8-.4zM2 4.3l2.3 2.3.4.4C3.2 8.3 2 10 1 12c1.7 4.4 6 7.5 11 7.5 1.5 0 3-.3 4.4-.8l.4.4 3 3 1.3-1.3L3.3 3 2 4.3zm5.5 5.5l1.6 1.6c0 .2-.1.4-.1.6 0 1.7 1.3 3 3 3 .2 0 .4 0 .6-.1l1.6 1.6c-.7.3-1.4.5-2.2.5-2.8 0-5-2.2-5-5 0-.8.2-1.5.5-2.2zm4.3-.8l3.1 3.1V12c0-1.7-1.3-3-3-3h-.1z"/></svg>';
    var TRASH_SVG = '<svg viewBox="0 0 24 24" width="12" height="12" style="vertical-align:-1px;"><path fill="currentColor" d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg>';
    var WARNING_SVG = '<svg viewBox="0 0 24 24" width="14" height="14" style="vertical-align:-2px;"><path fill="currentColor" d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z"/></svg>';
    var SHIELD_SVG = '<svg viewBox="0 0 24 24" width="12" height="12" style="vertical-align:-1px;"><path fill="currentColor" d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm-1 17.93C7.05 17.74 5 14.49 5 11V6.3l7-3.11 7 3.11V11c0 3.49-2.05 6.74-6 7.93V18h-1v.93zM10 14.17l-2.59-2.58L6 13l4 4 8-8-1.41-1.42L10 14.17z"/></svg>';
    var GEAR_SVG = '<svg viewBox="0 0 24 24" width="16" height="16" style="vertical-align:-2px;"><path fill="currentColor" d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58a.49.49 0 00.12-.61l-1.92-3.32a.49.49 0 00-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54a.484.484 0 00-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.07.62-.07.94s.02.64.07.94l-2.03 1.58a.49.49 0 00-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6A3.6 3.6 0 1115.6 12 3.611 3.611 0 0112 15.6z"/></svg>';

    var avatarColors = [
        '#e74c3c', '#e67e22', '#f1c40f', '#2ecc71', '#1abc9c',
        '#3498db', '#9b59b6', '#e84393', '#00cec9', '#6c5ce7'
    ];

    function hashColor(name) {
        var hash = 0;
        for (var i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
        return avatarColors[Math.abs(hash) % avatarColors.length];
    }

    function init() {
        if (initRetries >= MAX_INIT_RETRIES) return;
        initRetries++;

        ApiClient.getJSON(ApiClient.getUrl('embycomments/config')).then(function (config) {
            apiEndpoint = config.ApiEndpoint;
            serverGuid = ApiClient.serverId();

            var userId = ApiClient.getCurrentUserId();
            var entries = config.UserDisplayNames || [];
            var match = entries.find(function (e) { return e.UserId === userId; });

            var resolveDisplayName;
            if (match && match.DisplayName) {
                displayName = match.DisplayName;
                resolveDisplayName = Promise.resolve();
            } else {
                resolveDisplayName = ApiClient.getUser(userId).then(function (user) { displayName = user.Name; });
            }

            resolveDisplayName.then(function () {
                var userKey = serverGuid + ':' + userId;
                return ApiClient.ajax({
                    type: 'POST',
                    url: ApiClient.getUrl('embycomments/init'),
                    dataType: 'json',
                    contentType: 'application/json',
                    data: JSON.stringify({ UserKey: userKey, DisplayName: displayName })
                });
            }).then(function (data) {
                if (data.error) {
                    if (data.needsAdmin) {
                        // Not provisioned yet, retry slowly
                        setTimeout(init, 5000);
                    } else if (data.provisionFailed) {
                        // Provisioning failed, stop retrying
                    }
                    return;
                }
                userUuid = data.UserUuid;
                sessionToken = data.token;
                initRetries = 0;
                startObserver();
            }).catch(function () { setTimeout(init, 3000); });
        }).catch(function () { setTimeout(init, 3000); });
    }

    function refreshToken() {
        var userId = ApiClient.getCurrentUserId();
        var userKey = serverGuid + ':' + userId;
        return ApiClient.ajax({
            type: 'POST',
            url: ApiClient.getUrl('embycomments/init'),
            dataType: 'json',
            contentType: 'application/json',
            data: JSON.stringify({ UserKey: userKey, DisplayName: displayName })
        }).then(function (data) {
            if (data.token) sessionToken = data.token;
            if (data.UserUuid) userUuid = data.UserUuid;
        });
    }

    function cfFetch(url, options) {
        options = options || {};
        options.headers = options.headers || {};
        options.headers['X-EC-Token'] = sessionToken;
        return fetch(url, options).then(function (r) {
            if (r.status === 401) {
                return refreshToken().then(function () {
                    options.headers['X-EC-Token'] = sessionToken;
                    return fetch(url, options);
                });
            }
            return r;
        });
    }

    function startObserver() {
        document.addEventListener('viewshow', function () {
            var hash = window.location.hash;
            if (!hash.includes('item?id=')) { cleanup(); return; }
            cleanup();
            var urlParams = new URLSearchParams(hash.split('?')[1]);
            waitAndInject(0, urlParams.get('id'));
        }, true);

        var hash = window.location.hash;
        if (hash.includes('item?id=')) {
            var urlParams = new URLSearchParams(hash.split('?')[1]);
            waitAndInject(0, urlParams.get('id'));
        }
    }

    function cleanup() {
        var old = document.getElementById('embycomments-section');
        if (old) old.parentNode.removeChild(old);
        lastInjectedItemId = null;
        currentPage = 0;
        commentTotal = 0;
        isLoading = false;
        reactionsMap = {};
        hiddenSet = {};
        pendingComments = [];
        userModerationStatus = 'approved';
        if (moderationPollTimer) { clearInterval(moderationPollTimer); moderationPollTimer = null; }
        moderationPollCount = 0;
    }

    function getVisibleAnchor() {
        var anchors = document.querySelectorAll('.aboutSection');
        for (var i = 0; i < anchors.length; i++) {
            if (anchors[i].offsetParent !== null) return anchors[i];
        }
        return null;
    }

    function waitAndInject(attempts, itemId) {
        var anchor = getVisibleAnchor();
        if (anchor && !document.getElementById('embycomments-section')) checkAndInject(itemId);
        else if (!anchor && attempts < 30) setTimeout(function () { waitAndInject(attempts + 1, itemId); }, 200);
    }

    function checkAndInject(itemId) {
        if (!itemId) {
            var url = window.location.hash;
            if (!url.includes('item?id=')) return;
            itemId = new URLSearchParams(url.split('?')[1]).get('id');
        }
        if (!itemId || lastInjectedItemId === itemId) return;
        var anchor = getVisibleAnchor();
        if (!anchor || document.getElementById('embycomments-section')) return;

        lastInjectedItemId = itemId;

        ApiClient.getItem(ApiClient.getCurrentUserId(), itemId).then(function (item) {
            if (!isSupported(item)) return;

            currentMediaKey = getMediaKey(item);
            currentItemName = item.Name || '';
            selectedRating = 0;
            currentPage = 0;
            commentTotal = 0;
            reactionsMap = {};
            hiddenSet = {};
            pendingComments = [];

            var section = document.createElement('div');
            section.id = 'embycomments-section';
            section.className = 'verticalSection verticalSection-cards';
            section.innerHTML = buildSectionHtml();

            var freshAnchor = getVisibleAnchor();
            if (freshAnchor && freshAnchor.parentNode) freshAnchor.parentNode.insertBefore(section, freshAnchor);
            else { lastInjectedItemId = null; return; }

            setupStars(section);
            setupSubmit(section, item);
            setupFormToggle(section);
            setupPagination(section);
            setupGear(section);

            Promise.all([fetchMyState(), fetchMyPending()]).then(function () {
                updateFormVisibility(section);
                loadComments(section);
            });
        });
    }

    function fetchMyState() {
        if (!apiEndpoint || !userUuid || !currentMediaKey) return Promise.resolve();
        return cfFetch(apiEndpoint + '/my-state?userUuid=' + encodeURIComponent(userUuid) + '&mediaKey=' + encodeURIComponent(currentMediaKey))
            .then(function (r) { return r.json(); })
            .then(function (data) {
                reactionsMap = {};
                (data.reactions || []).forEach(function (r) { reactionsMap[r.CommentId] = r.Type; });
                hiddenSet = {};
                (data.hidden || []).forEach(function (id) { hiddenSet[id] = true; });
                userModerationStatus = data.userModerationStatus || 'approved';
                censorExplicit = data.censorExplicit || false;
            })
            .catch(function () { reactionsMap = {}; hiddenSet = {}; userModerationStatus = 'approved'; censorExplicit = false; });
    }

    function fetchMyPending() {
        if (!apiEndpoint || !userUuid || !currentMediaKey) return Promise.resolve();
        return cfFetch(apiEndpoint + '/my-pending?userUuid=' + encodeURIComponent(userUuid) + '&mediaKey=' + encodeURIComponent(currentMediaKey))
            .then(function (r) { return r.json(); })
            .then(function (data) { pendingComments = data || []; })
            .catch(function () { pendingComments = []; });
    }

    function startModerationPoll(section) {
        if (moderationPollTimer) clearInterval(moderationPollTimer);
        moderationPollCount = 0;

        moderationPollTimer = setInterval(function () {
            moderationPollCount++;
            if (moderationPollCount >= 10 || !document.getElementById('embycomments-section')) {
                clearInterval(moderationPollTimer);
                moderationPollTimer = null;
                return;
            }

            fetchMyPending().then(function () {
                var stillAwaiting = pendingComments.some(function (c) { return c.ModerationStatus === 'awaiting'; });
                if (!stillAwaiting) {
                    clearInterval(moderationPollTimer);
                    moderationPollTimer = null;
                    loadComments(section, true);
                }
            });
        }, 5000);
    }

    function updateFormVisibility(section) {
        var nameWarning = section.querySelector('#ec-name-warning');
        var formToggle = section.querySelector('#ec-form-toggle');
        if (userModerationStatus === 'denied') {
            nameWarning.style.display = 'flex';
            formToggle.style.display = 'none';
        } else {
            nameWarning.style.display = 'none';
        }
        var censorToggle = section.querySelector('#ec-censor-toggle');
        if (censorToggle) censorToggle.checked = censorExplicit;
    }

    function isSupported(item) { return item && (item.Type === 'Movie' || item.Type === 'Series' || item.Type === 'Episode'); }

    function getMediaKey(item) {
        if (item.ProviderIds) {
            if (item.ProviderIds.Imdb) return 'imdb:' + item.ProviderIds.Imdb;
            if (item.ProviderIds.Tmdb) return 'tmdb:' + item.ProviderIds.Tmdb;
            if (item.ProviderIds.Tvdb) return 'tvdb:' + item.ProviderIds.Tvdb;
        }
        return 'emby:' + item.Id;
    }

    function buildSectionHtml() {
        return '<style>' +
            '#embycomments-section { font-family:inherit; }' +
            '.ec-content { padding-bottom:1.5em; }' +
            '.ec-summary { display:flex; align-items:center; gap:1em; padding:0.4em 0; margin-bottom:0.4em; flex-wrap:wrap; }' +
            '.ec-avg { display:flex; align-items:baseline; gap:0.25em; }' +
            '.ec-avg-num { font-size:1.6em; font-weight:700; color:#f5c518; line-height:1; }' +
            '.ec-avg-max { font-size:0.8em; color:rgba(255,255,255,0.35); }' +
            '.ec-avg-detail { display:flex; flex-direction:column; gap:1px; }' +
            '.ec-avg-stars { color:#f5c518; font-size:0.95em; white-space:nowrap; }' +
            '.ec-avg-stars .ec-star-empty { color:rgba(255,255,255,0.12); }' +
            '.ec-avg-stars .ec-star-partial { position:relative; display:inline-block; color:rgba(255,255,255,0.12); }' +
            '.ec-avg-stars .ec-star-fill { position:absolute; left:0; top:0; overflow:hidden; color:#f5c518; }' +
            '.ec-avg-meta { font-size:0.75em; color:rgba(255,255,255,0.4); }' +
            '.ec-spark { flex-shrink:0; } .ec-spark svg { display:block; }' +
            /* Name flagged warning */
            '.ec-name-warning { display:none; align-items:center; gap:0.5em; padding:0.6em 1em; margin-bottom:0.6em; border-radius:8px; background:rgba(231,76,60,0.1); border:1px solid rgba(231,76,60,0.25); color:#e74c3c; font-size:0.85em; }' +
            /* Form */
            '.ec-form-toggle { background:rgba(0,0,0,0.25); backdrop-filter:blur(12px); -webkit-backdrop-filter:blur(12px); border:1px solid rgba(255,255,255,0.1); border-radius:8px; color:rgba(255,255,255,0.45); cursor:pointer; font-size:0.85em; font-family:inherit; padding:0.6em 1em; margin-bottom:0.6em; display:block; width:100%; text-align:left; transition:all 0.2s; }' +
            '.ec-form-toggle:hover { background:rgba(255,255,255,0.07); border-color:rgba(255,255,255,0.2); color:rgba(255,255,255,0.7); }' +
            '.ec-form { display:none; margin-bottom:0.8em; position:relative; } .ec-form.open { display:block; }' +
            '.ec-form-close { position:absolute; top:0; right:0; background:none; border:none; color:rgba(255,255,255,0.3); cursor:pointer; font-size:1.1em; line-height:1; padding:2px 6px; border-radius:4px; transition:color 0.15s; } .ec-form-close:hover { color:rgba(255,255,255,0.7); }' +
            '.ec-form-footer { display:flex; align-items:center; gap:0.8em; margin-top:0.4em; }' +
            '.ec-stars { display:flex; gap:2px; margin:0.3em 0 0.5em 0; cursor:pointer; }' +
            '.ec-stars span { font-size:1.3em; color:rgba(255,255,255,0.15); transition:color 0.15s; } .ec-stars span.active { color:#f5c518; }' +
            '.ec-textarea { width:100%; min-height:60px; background:rgba(0,0,0,0.25); backdrop-filter:blur(12px); -webkit-backdrop-filter:blur(12px); border:1px solid rgba(255,255,255,0.1); border-radius:8px; color:inherit; padding:0.6em; font-size:0.85em; font-family:inherit; resize:vertical; box-sizing:border-box; outline:none; transition:all 0.2s; }' +
            '.ec-textarea:focus { border-color:var(--theme-accent-text-color, #00a4dc); background:rgba(255,255,255,0.08); }' +
            '.ec-spoiler-check { display:flex; align-items:center; gap:0.4em; font-size:0.78em; color:rgba(155,89,182,0.85); cursor:pointer; padding:3px 10px; border-radius:4px; border:1px solid rgba(155,89,182,0.3); transition:all 0.15s; }' +
            '.ec-spoiler-check:hover { border-color:rgba(155,89,182,0.5); color:#9b59b6; background:rgba(155,89,182,0.08); }' +
            '.ec-spoiler-check.ec-checked { background:rgba(155,89,182,0.15); border-color:rgba(155,89,182,0.5); color:#9b59b6; }' +
            '.ec-spoiler-check input { margin:0; cursor:pointer; accent-color:#9b59b6; }' +
            '.ec-btn { padding:0.45em 1.4em; background:var(--theme-accent-text-color, #00a4dc); border:none; border-radius:6px; color:white; cursor:pointer; font-size:0.85em; font-family:inherit; font-weight:500; transition:all 0.15s; }' +
            '.ec-btn:hover { filter:brightness(1.15); transform:translateY(-1px); } .ec-btn:active { transform:translateY(0); }' +
            '.ec-char-count { font-size:0.75em; color:rgba(255,255,255,0.3); margin-left:auto; } .ec-char-count.ec-over { color:#e74c3c; }' +
            /* Scroll + list */
            '.ec-scroll { max-height:365px; overflow-y:auto; overflow-x:hidden; border-radius:8px; scrollbar-width:thin; scrollbar-color:rgba(255,255,255,0.15) transparent; }' +
            '.ec-scroll::-webkit-scrollbar { width:6px; } .ec-scroll::-webkit-scrollbar-track { background:transparent; } .ec-scroll::-webkit-scrollbar-thumb { background:rgba(255,255,255,0.15); border-radius:3px; }' +
            '.ec-list { display:flex; flex-direction:column; gap:6px; padding:0.3em 0; transition:opacity 0.15s; } .ec-list.ec-fading { opacity:0.4; }' +
            /* Comment card */
            '.ec-c { display:flex; gap:0.7em; padding:0.7em 0.8em; border-radius:8px; background:rgba(0,0,0,0.25); backdrop-filter:blur(12px); -webkit-backdrop-filter:blur(12px); border:1px solid rgba(255,255,255,0.06); transition:all 0.2s; }' +
            '.ec-c:hover { background:rgba(255,255,255,0.06); border-color:rgba(255,255,255,0.08); }' +
            '.ec-c.reply { margin-left:2.8em; background:rgba(255,255,255,0.02); border-color:rgba(255,255,255,0.03); } .ec-c.reply:hover { background:rgba(255,255,255,0.04); }' +
            '.ec-c.ec-star-only { padding:0.45em 0.8em; }' +
            /* Hidden state */
            '.ec-c.ec-is-hidden { padding:0.4em 0.8em; background:rgba(255,255,255,0.01); border-color:rgba(255,255,255,0.03); }' +
            '.ec-c.ec-is-hidden .ec-c-body, .ec-c.ec-is-hidden .ec-avatar { display:none; }' +
            '.ec-hidden-bar { display:none; align-items:center; gap:0.5em; width:100%; font-size:0.78em; color:rgba(255,255,255,0.25); }' +
            '.ec-c.ec-is-hidden .ec-hidden-bar { display:flex; }' +
            '.ec-unhide-btn { background:none; border:none; color:var(--theme-accent-text-color, #00a4dc); cursor:pointer; font-size:1em; font-family:inherit; padding:0; margin-left:auto; } .ec-unhide-btn:hover { text-decoration:underline; }' +
            /* Awaiting moderation state */
            '.ec-c.ec-awaiting { opacity:0.5; }' +
            '.ec-c.ec-awaiting .ec-c-text { color:rgba(255,255,255,0.35); }' +
            '.ec-mod-badge { display:inline-flex; align-items:center; gap:3px; font-size:0.68em; padding:1px 7px; border-radius:4px; white-space:nowrap; font-weight:500; }' +
            '.ec-mod-badge.ec-awaiting-badge { background:rgba(52,152,219,0.12); color:#5dade2; }' +
            '.ec-mod-badge.ec-spoiler-badge { background:rgba(155,89,182,0.12); color:#9b59b6; }' +
            '.ec-mod-badge.ec-explicit-badge { background:rgba(243,156,18,0.12); color:#f39c12; }' +
            /* Explicit collapsed state */
            '.ec-c.ec-explicit-collapsed { background:rgba(243,156,18,0.04); border-color:rgba(243,156,18,0.1); }' +
            '.ec-c.ec-explicit-collapsed:hover { background:rgba(243,156,18,0.07); border-color:rgba(243,156,18,0.15); }' +
            '.ec-explicit-wrap { position:relative; }' +
            '.ec-explicit-wrap .ec-c-text { filter:blur(5px); user-select:none; }' +
            '.ec-explicit-overlay { position:absolute; inset:0; display:flex; align-items:center; justify-content:center; pointer-events:none; }' +
            '.ec-explicit-overlay span { font-size:0.8em; color:rgba(255,255,255,0.7); background:rgba(243,156,18,0.2); padding:4px 12px; border-radius:4px; }' +
            /* Gear icon */
            '.ec-gear-btn { background:none; border:none; color:rgba(255,255,255,0.15); cursor:pointer; padding:2px; border-radius:4px; transition:all 0.15s; margin-left:6px; vertical-align:middle; line-height:1; }' +
            '.ec-gear-btn:hover { color:rgba(255,255,255,0.4); }' +
            '.ec-gear-wrap { position:relative; display:inline-block; }' +
            '.ec-gear-menu { display:none; position:absolute; top:calc(100% + 4px); left:0; background:rgba(0,0,0,0.25); backdrop-filter:blur(12px); -webkit-backdrop-filter:blur(12px); border:1px solid rgba(255,255,255,0.08); border-radius:8px; padding:4px 0; z-index:100; box-shadow:0 4px 12px rgba(0,0,0,0.3); }' +
            '.ec-gear-menu.open { display:block; }' +
            '.ec-gear-item { display:flex; align-items:center; justify-content:space-between; gap:10px; padding:6px 12px; font-size:12px; font-weight:400; color:rgba(255,255,255,0.5); cursor:pointer; transition:background 0.1s; white-space:nowrap; }' +
            '.ec-gear-item:hover { background:rgba(255,255,255,0.04); }' +
            '.ec-toggle { position:relative; width:28px; height:16px; flex-shrink:0; }' +
            '.ec-toggle input { opacity:0; width:0; height:0; }' +
            '.ec-toggle-slider { position:absolute; inset:0; background:rgba(255,255,255,0.12); border-radius:8px; transition:background 0.2s; cursor:pointer; }' +
            '.ec-toggle-slider:before { content:""; position:absolute; width:12px; height:12px; left:2px; bottom:2px; background:rgba(255,255,255,0.6); border-radius:50%; transition:all 0.2s; }' +
            '.ec-toggle input:checked + .ec-toggle-slider { background:rgba(243,156,18,0.3); }' +
            '.ec-toggle input:checked + .ec-toggle-slider:before { transform:translateX(12px); background:#f39c12; }' +
            /* Denied state */
            '.ec-c.ec-denied { background:rgba(231,76,60,0.06); border-color:rgba(231,76,60,0.15); }' +
            '.ec-denied-body { font-size:0.8em; color:rgba(231,76,60,0.7); line-height:1.4; }' +
            '.ec-denied-reason { font-size:0.78em; color:rgba(231,76,60,0.55); margin-top:3px; font-style:italic; }' +
            /* Spoiler overlay */
            '.ec-spoiler-wrap { position:relative; cursor:pointer; }' +
            '.ec-spoiler-wrap .ec-c-text { filter:blur(5px); user-select:none; transition:filter 0.3s; }' +
            '.ec-spoiler-wrap.ec-revealed .ec-c-text { filter:none; user-select:auto; cursor:auto; }' +
            '.ec-spoiler-overlay { position:absolute; inset:0; display:flex; align-items:center; justify-content:center; transition:opacity 0.3s; pointer-events:none; }' +
            '.ec-spoiler-overlay span { font-size:0.8em; color:rgba(255,255,255,0.7); background:rgba(155,89,182,0.2); padding:4px 12px; border-radius:4px; }' +
            '.ec-spoiler-wrap.ec-revealed .ec-spoiler-overlay { opacity:0; }' +
            /* Avatar */
            '.ec-avatar { flex-shrink:0; width:32px; height:32px; border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:0.75em; font-weight:600; color:white; text-transform:uppercase; }' +
            '.ec-c.reply .ec-avatar { width:24px; height:24px; font-size:0.6em; }' +
            '.ec-c-body { flex:1; min-width:0; }' +
            '.ec-c-top { display:flex; align-items:center; gap:0.5em; line-height:1.3; }' +
            '.ec-c-author { font-weight:600; color:rgba(255,255,255,0.9); font-size:0.8em; white-space:nowrap; }' +
            '.ec-c-rating { display:inline-flex; align-items:center; gap:3px; background:rgba(245,197,24,0.12); color:#f5c518; font-size:0.7em; padding:1px 6px; border-radius:4px; white-space:nowrap; font-weight:500; }' +
            '.ec-c-date { font-size:0.7em; color:rgba(255,255,255,0.2); margin-left:auto; white-space:nowrap; }' +
            /* Hide button */
            '.ec-hide-btn { background:none; border:none; color:rgba(255,255,255,0.1); cursor:pointer; padding:1px 3px; border-radius:3px; transition:all 0.15s; margin-left:4px; line-height:1; }' +
            '.ec-c:hover .ec-hide-btn { color:rgba(255,255,255,0.25); } .ec-hide-btn:hover { color:rgba(255,255,255,0.5); background:rgba(255,255,255,0.05); }' +
            '.ec-c-text { font-size:0.85em; color:rgba(255,255,255,0.75); line-height:1.5; margin-top:3px; overflow-wrap:break-word; }' +
            '.ec-c-foot { display:flex; align-items:center; gap:0.4em; margin-top:5px; }' +
            '.ec-c-act { background:none; border:none; color:rgba(255,255,255,0.2); cursor:pointer; font-size:0.72em; font-family:inherit; padding:2px 5px; border-radius:4px; transition:all 0.15s; display:inline-flex; align-items:center; gap:3px; }' +
            '.ec-c-act:hover { background:rgba(255,255,255,0.05); }' +
            '.ec-c-act.ec-liked { color:#e74c3c; } .ec-c-act.ec-liked:hover { color:#c0392b; }' +
            '.ec-c-act.ec-disliked { color:#3498db; } .ec-c-act.ec-disliked:hover { color:#2980b9; }' +
            /* Delete button */
            '.ec-delete-btn { background:none; border:none; color:rgba(255,255,255,0.1); cursor:pointer; padding:2px 4px; border-radius:3px; transition:all 0.15s; margin-left:auto; line-height:1; display:inline-flex; align-items:center; gap:3px; font-size:0.72em; font-family:inherit; }' +
            '.ec-c:hover .ec-delete-btn { color:rgba(255,255,255,0.2); } .ec-delete-btn:hover { color:#e74c3c; background:rgba(231,76,60,0.08); }' +
            '.ec-delete-confirm { display:none; font-size:0.72em; color:#e74c3c; margin-left:auto; align-items:center; gap:4px; } .ec-delete-confirm.ec-active { display:inline-flex; }' +
            '.ec-delete-confirm-btn { background:none; border:none; color:#e74c3c; cursor:pointer; font-family:inherit; font-size:1em; font-weight:600; padding:0; text-decoration:underline; }' +
            /* Reply + Show more */
            '.ec-show-more { background:none; border:none; color:var(--theme-accent-text-color, #00a4dc); cursor:pointer; font-size:0.75em; font-family:inherit; padding:0.4em 0 0.4em 3.6em; opacity:0.8; transition:opacity 0.15s; } .ec-show-more:hover { opacity:1; text-decoration:underline; }' +
            '.ec-reply-inline { display:none; padding:0.3em 0 0.3em 3.6em; } .ec-reply-inline.open { display:flex; gap:0.4em; align-items:flex-start; }' +
            '.ec-reply-inline .ec-textarea { min-height:36px; font-size:0.8em; padding:0.4em 0.6em; flex:1; border-radius:6px; }' +
            '.ec-reply-inline .ec-btn { font-size:0.75em; padding:0.35em 0.8em; margin-top:0; white-space:nowrap; }' +
            /* Pager */
            '.ec-pager { display:flex; align-items:center; justify-content:space-between; padding:0.5em 0.2em; margin-top:0.3em; }' +
            '.ec-pager-info { font-size:0.75em; color:rgba(255,255,255,0.3); }' +
            '.ec-pager-btns { display:flex; gap:0.4em; }' +
            '.ec-pager-btn { background:rgba(255,255,255,0.06); border:1px solid rgba(255,255,255,0.08); border-radius:6px; color:rgba(255,255,255,0.55); cursor:pointer; font-size:0.75em; font-family:inherit; padding:0.35em 0.9em; transition:all 0.15s; }' +
            '.ec-pager-btn:hover:not(:disabled) { background:rgba(255,255,255,0.1); color:rgba(255,255,255,0.8); } .ec-pager-btn:disabled { opacity:0.25; cursor:default; }' +
            '.ec-empty { color:rgba(255,255,255,0.3); padding:1em 0; font-size:0.85em; }' +
            '.ec-error { color:#ff4444; padding:0.5em; background:rgba(255,0,0,0.08); border-radius:6px; margin-bottom:0.5em; display:none; font-size:0.8em; }' +
            '.ec-loading { text-align:center; padding:0.8em 0; color:rgba(255,255,255,0.2); font-size:0.8em; }' +
            '</style>' +
            '<h2 class="sectionTitle sectionTitle-cards padded-left padded-left-page padded-right">Community Comments<span class="ec-gear-wrap"><button class="ec-gear-btn" id="ec-gear" title="Settings">' + GEAR_SVG + '</button><div class="ec-gear-menu" id="ec-gear-menu"><label class="ec-gear-item">Censor explicit comments<span class="ec-toggle"><input type="checkbox" id="ec-censor-toggle"><span class="ec-toggle-slider"></span></span></label></div></span></h2>' +
            '<div class="ec-content sectionTitle-cards padded-left padded-left-page padded-right">' +
            '<div class="ec-summary" id="ec-summary" style="display:none;"></div>' +
            '<div class="ec-error" id="ec-error"></div>' +
            '<div class="ec-name-warning" id="ec-name-warning">' + WARNING_SVG + ' Your display name has been flagged as inappropriate. You cannot post comments or replies until you update your name in the plugin settings.</div>' +
            '<button class="ec-form-toggle" id="ec-form-toggle">\u270E  Write a comment...</button>' +
            '<div class="ec-form" id="ec-form">' +
            '<button class="ec-form-close" id="ec-form-close">\u2715</button>' +
            '<div class="ec-stars" id="ec-stars"><span data-value="1">\u2605</span><span data-value="2">\u2605</span><span data-value="3">\u2605</span><span data-value="4">\u2605</span><span data-value="5">\u2605</span><span data-value="6">\u2605</span><span data-value="7">\u2605</span><span data-value="8">\u2605</span><span data-value="9">\u2605</span><span data-value="10">\u2605</span></div>' +
            '<textarea class="ec-textarea" id="ec-body" placeholder="Share your thoughts..." maxlength="' + MAX_CHARS + '"></textarea>' +
            '<div class="ec-form-footer"><button class="ec-btn" id="ec-submit">Post</button><label class="ec-spoiler-check" title="Check this if your comment reveals plot points, twists, or endings"><input type="checkbox" id="ec-spoiler-cb"> Spoiler</label><span class="ec-char-count" id="ec-char-count">0 / ' + MAX_CHARS + '</span></div></div>' +
            '<div class="ec-scroll" id="ec-scroll"><div class="ec-list" id="ec-list"><div class="ec-loading">Loading...</div></div></div>' +
            '<div class="ec-pager" id="ec-pager" style="display:none;"><span class="ec-pager-info" id="ec-pager-info"></span>' +
            '<div class="ec-pager-btns"><button class="ec-pager-btn" id="ec-prev" disabled>\u2039 Prev</button><button class="ec-pager-btn" id="ec-next" disabled>Next \u203A</button></div></div></div>';
    }

    function setupFormToggle(section) {
        var form = section.querySelector('#ec-form');
        var toggle = section.querySelector('#ec-form-toggle');

        toggle.addEventListener('click', function () {
            form.classList.add('open');
            toggle.style.display = 'none';
            section.querySelector('#ec-body').focus();
        });

        section.querySelector('#ec-form-close').addEventListener('click', function () {
            form.classList.remove('open');
            toggle.style.display = 'block';
        });
    }

    function setupStars(section) {
        var stars = section.querySelectorAll('#ec-stars span');
        stars.forEach(function (star) {
            star.addEventListener('mouseover', function () { var v = parseInt(this.dataset.value); stars.forEach(function (s) { s.classList.toggle('active', parseInt(s.dataset.value) <= v); }); });
            star.addEventListener('mouseout', function () { stars.forEach(function (s) { s.classList.toggle('active', parseInt(s.dataset.value) <= selectedRating); }); });
            star.addEventListener('click', function () { selectedRating = parseInt(this.dataset.value); stars.forEach(function (s) { s.classList.toggle('active', parseInt(s.dataset.value) <= selectedRating); }); });
        });
    }

    function setupSubmit(section, item) {
        var textarea = section.querySelector('#ec-body');
        var counter = section.querySelector('#ec-char-count');

        textarea.addEventListener('input', function () {
            var len = textarea.value.length;
            counter.textContent = len + ' / ' + MAX_CHARS;
            counter.classList.toggle('ec-over', len >= MAX_CHARS);
        });

        var spoilerCb = section.querySelector('#ec-spoiler-cb');
        var spoilerLabel = section.querySelector('.ec-spoiler-check');
        spoilerCb.addEventListener('change', function () {
            spoilerLabel.classList.toggle('ec-checked', this.checked);
        });

        section.querySelector('#ec-submit').addEventListener('click', function () {
            var body = textarea.value.trim();
            if (!userUuid) return;
            if (!body && selectedRating === 0) { showError(section, 'Please write a comment or select a star rating.'); return; }
            if (body.length > MAX_CHARS) { showError(section, 'Comment exceeds ' + MAX_CHARS + ' character limit.'); return; }
            var isSpoiler = section.querySelector('#ec-spoiler-cb').checked;
            var starOnly = !body && selectedRating > 0;

            cfFetch(apiEndpoint + '/comments', { method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ MediaKey: currentMediaKey, MediaTitle: item.Name || '', UserUuid: userUuid, Body: body, StarRating: selectedRating > 0 ? selectedRating : null, ParentCommentId: null, IsSpoiler: isSpoiler, StarOnly: starOnly })
            }).then(function (r) { return r.json(); }).then(function (data) {
                if (data.nameFlagged) {
                    showError(section, 'Your display name has been flagged as inappropriate. Update your name in plugin settings to post comments and replies.');
                    return;
                }
                textarea.value = '';
                counter.textContent = '0 / ' + MAX_CHARS;
                counter.classList.remove('ec-over');
                section.querySelector('#ec-spoiler-cb').checked = false;
                spoilerLabel.classList.remove('ec-checked');
                selectedRating = 0;
                section.querySelectorAll('#ec-stars span').forEach(function (s) { s.classList.remove('active'); });
                section.querySelector('#ec-form').classList.remove('open');
                section.querySelector('#ec-form-toggle').style.display = 'block';
                currentPage = 0;
                loadComments(section, true);
                if (!starOnly) startModerationPoll(section);
            }).catch(function (err) { showError(section, 'Failed to post: ' + err.message); });
        });
    }

    function setupPagination(section) {
        section.querySelector('#ec-prev').addEventListener('click', function () { if (currentPage > 0) { currentPage--; loadComments(section); } });
        section.querySelector('#ec-next').addEventListener('click', function () { if (currentPage < Math.ceil(commentTotal / PAGE_SIZE) - 1) { currentPage++; loadComments(section); } });
    }

    function setupGear(section) {
        var gearBtn = section.querySelector('#ec-gear');
        var menu = section.querySelector('#ec-gear-menu');
        var censorToggle = section.querySelector('#ec-censor-toggle');
        if (!gearBtn || !menu || !censorToggle) return;

        gearBtn.addEventListener('click', function (e) {
            e.stopPropagation();
            menu.classList.toggle('open');
        });

        // Close menu when clicking outside
        document.addEventListener('click', function (e) {
            if (!menu.contains(e.target) && e.target !== gearBtn) {
                menu.classList.remove('open');
            }
        });

        censorToggle.addEventListener('change', function () {
            censorExplicit = this.checked;
            cfFetch(apiEndpoint + '/user-settings', {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ UserUuid: userUuid, CensorExplicit: censorExplicit })
            }).catch(function () {});
            loadComments(section, true);
        });
    }

    function updatePager(section) {
        var pager = section.querySelector('#ec-pager');
        var tp = Math.ceil(commentTotal / PAGE_SIZE);
        if (commentTotal <= PAGE_SIZE) { pager.style.display = 'none'; return; }
        pager.style.display = 'flex';
        section.querySelector('#ec-pager-info').textContent = (currentPage * PAGE_SIZE + 1) + '\u2013' + Math.min((currentPage + 1) * PAGE_SIZE, commentTotal) + ' of ' + commentTotal;
        section.querySelector('#ec-prev').disabled = (currentPage === 0);
        section.querySelector('#ec-next').disabled = (currentPage >= tp - 1);
    }

    function loadComments(section, bustCache) {
        if (!currentMediaKey || !apiEndpoint || isLoading) return;
        isLoading = true;
        var list = section.querySelector('#ec-list'), scroll = section.querySelector('#ec-scroll');
        var hasExisting = list.children.length > 0 && !list.querySelector('.ec-loading');
        if (hasExisting) list.classList.add('ec-fading'); else list.innerHTML = '<div class="ec-loading">Loading...</div>';

        var url = apiEndpoint + '/comments?mediaKey=' + encodeURIComponent(currentMediaKey) + '&limit=' + PAGE_SIZE + '&offset=' + (currentPage * PAGE_SIZE);
        if (bustCache) url += '&_t=' + Date.now();

        // Refetch pending on every load
        var pendingPromise = bustCache ? fetchMyPending() : Promise.resolve();

        Promise.all([
            cfFetch(url).then(function (r) { return r.json(); }),
            pendingPromise
        ]).then(function (results) {
            var data = results[0];
            commentTotal = data.total; isLoading = false; list.classList.remove('ec-fading'); list.innerHTML = '';

            // Render pending comments at the top (only on first page)
            if (currentPage === 0 && pendingComments.length > 0) {
                pendingComments.forEach(function (c) {
                    var el = createPendingCommentEl(c);
                    list.appendChild(el);
                });
            }

            if (data.comments.length === 0 && pendingComments.length === 0) {
                list.innerHTML = '<div class="ec-empty">No comments yet. Be the first!</div>';
                section.querySelector('#ec-summary').style.display = 'none';
                section.querySelector('#ec-pager').style.display = 'none'; return;
            }

            data.comments.forEach(function (c) { appendComment(section, list, c); });
            scroll.scrollTop = 0; updatePager(section);
            if (data.summary) renderSummary(section, data.summary, data.total);
        }).catch(function (err) { isLoading = false; list.classList.remove('ec-fading'); showError(section, 'Failed to load: ' + err.message); });
    }

    function createPendingCommentEl(c) {
        var div = document.createElement('div');
        div.className = 'ec-c';
        div.dataset.commentId = c.CommentId;

        var name = c.AuthorDisplayName || 'Anonymous';

        if (c.ModerationStatus === 'denied') {
            div.classList.add('ec-denied');
            div.innerHTML =
                '<div class="ec-avatar" style="background:' + hashColor(name) + '; opacity:0.5;">' + esc(name.charAt(0)) + '</div>' +
                '<div class="ec-c-body">' +
                '<div class="ec-c-top"><span class="ec-c-author" style="opacity:0.5;">' + esc(name) + '</span>' +
                '<span class="ec-c-date">' + formatDate(c.CreatedAt) + '</span></div>' +
                '<div class="ec-denied-body">' + WARNING_SVG + ' Comment denied</div>' +
                '<div class="ec-denied-reason">' + esc(c.DenialReason || 'Did not meet community guidelines') + '</div>' +
                '</div>';
        } else {
            // awaiting
            div.classList.add('ec-awaiting');
            div.innerHTML =
                '<div class="ec-avatar" style="background:' + hashColor(name) + ';">' + esc(name.charAt(0)) + '</div>' +
                '<div class="ec-c-body">' +
                '<div class="ec-c-top"><span class="ec-c-author">' + esc(name) + '</span>' +
                '<span class="ec-mod-badge ec-awaiting-badge">' + SHIELD_SVG + ' Awaiting Moderation</span>' +
                (c.StarRating ? '<span class="ec-c-rating">\u2605 ' + c.StarRating + '/10</span>' : '') +
                '<span class="ec-c-date">' + formatDate(c.CreatedAt) + '</span></div>' +
                (c.Body ? '<div class="ec-c-text">' + esc(c.Body) + '</div>' : '') +
                '</div>';
        }

        return div;
    }

    function buildDecimalStars(avg, outOf) {
        var html = '';
        for (var i = 1; i <= outOf; i++) {
            if (avg >= i) html += '\u2605';
            else if (avg > i - 1) { var pct = Math.round((avg - (i - 1)) * 100); html += '<span class="ec-star-partial">\u2605<span class="ec-star-fill" style="width:' + pct + '%;">\u2605</span></span>'; }
            else html += '<span class="ec-star-empty">\u2605</span>';
        }
        return html;
    }

    function buildSparkline(dist) {
        var w = 120, h = 28, pad = 2, barW = (w - pad * 2) / 10, max = 0;
        for (var k in dist) { if (dist[k] > max) max = dist[k]; }
        if (max === 0) return '';
        var bars = '';
        for (var i = 1; i <= 10; i++) {
            var c = dist[i] || 0, bH = max > 0 ? (c / max) * (h - pad * 2 - 10) : 0;
            if (c > 0 && bH < 2) bH = 2;
            var x = pad + (i - 1) * barW + 1, y = h - pad - bH - 8;
            bars += '<rect x="' + x + '" y="' + y + '" width="' + (barW - 2) + '" height="' + bH + '" rx="1.5" fill="#f5c518" opacity="' + (c > 0 ? '0.8' : '0.1') + '"/>';
            bars += '<text x="' + (x + (barW - 2) / 2) + '" y="' + (h - pad) + '" text-anchor="middle" font-size="6" fill="rgba(255,255,255,0.3)">' + i + '</text>';
        }
        return '<svg width="' + w + '" height="' + h + '" viewBox="0 0 ' + w + ' ' + h + '" xmlns="http://www.w3.org/2000/svg">' + bars + '</svg>';
    }

    function renderSummary(section, summary, total) {
        var el = section.querySelector('#ec-summary');
        if (!summary || !summary.avg) { el.style.display = 'none'; return; }
        var spark = buildSparkline(summary.distribution || {});
        el.innerHTML = '<div class="ec-avg"><span class="ec-avg-num">' + summary.avg.toFixed(1) + '</span><span class="ec-avg-max">/10</span></div>' +
            '<div class="ec-avg-detail"><div class="ec-avg-stars">' + buildDecimalStars(summary.avg, 10) + '</div>' +
            '<div class="ec-avg-meta">' + (summary.ratedCount || 0) + ' ratings \u00B7 ' + total + ' comments</div></div>' +
            (spark ? '<div class="ec-spark">' + spark + '</div>' : '');
        el.style.display = 'flex';
    }

    function appendComment(section, list, comment) {
        var el = createCommentEl(comment, false);
        list.appendChild(el); wireActions(section, list, el, comment, false);

        var isExplicitCollapsed = censorExplicit && comment.Explicit === 1;

        if (!isExplicitCollapsed) {
            (comment.Replies || []).forEach(function (r) {
                var re = createCommentEl(r, true); list.appendChild(re); wireActions(section, list, re, r, true);
            });

            if (userModerationStatus !== 'denied') {
                var replyForm = document.createElement('div');
                replyForm.className = 'ec-reply-inline'; replyForm.id = 'ec-rf-' + comment.CommentId;
                replyForm.innerHTML = '<textarea class="ec-textarea" id="ec-rt-' + comment.CommentId + '" placeholder="Reply..."></textarea><button class="ec-btn ec-reply-post" data-id="' + comment.CommentId + '">Reply</button>';
                list.appendChild(replyForm);

                replyForm.querySelector('.ec-reply-post').addEventListener('click', function () {
                    var pid = this.dataset.id, ta = section.querySelector('#ec-rt-' + pid), body = ta.value.trim();
                    if (!body || !userUuid) return;
                    cfFetch(apiEndpoint + '/comments', { method: 'POST', headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ MediaKey: currentMediaKey, MediaTitle: currentItemName, UserUuid: userUuid, Body: body, StarRating: null, ParentCommentId: pid })
                    }).then(function () { ta.value = ''; replyForm.classList.remove('open'); loadComments(section, true); startModerationPoll(section); });
                });
            }

            var remaining = (comment.ReplyCount || 0) - (comment.Replies || []).length;
            if (remaining > 0) {
                var moreBtn = document.createElement('button'); moreBtn.className = 'ec-show-more';
                moreBtn.textContent = 'Show ' + remaining + ' more ' + (remaining === 1 ? 'reply' : 'replies');
                moreBtn.addEventListener('click', function () { loadRemainingReplies(section, list, comment.CommentId, moreBtn, (comment.Replies || []).length); });
                list.appendChild(moreBtn);
            }
        }
    }

    function createCommentEl(c, isReply) {
        var div = document.createElement('div');
        div.className = 'ec-c' + (isReply ? ' reply' : '');
        div.dataset.commentId = c.CommentId;

        var name = c.AuthorDisplayName || 'Anonymous';
        var reaction = reactionsMap[c.CommentId] || null;
        var isOwn = c.AuthorUuid === userUuid;
        var isHidden = hiddenSet[c.CommentId];
        var isSpoiler = c.ModerationStatus === 'spoiler';
        var isExplicit = c.Explicit === 1;

        if (isHidden) div.classList.add('ec-is-hidden');
        if (!c.Body) div.classList.add('ec-star-only');

        // Explicit collapsed card — blurred text with overlay, delete only
        if (censorExplicit && isExplicit) {
            div.classList.add('ec-explicit-collapsed');

            var explicitDeleteHtml = isOwn ?
                '<span class="ec-delete-confirm" data-id="' + c.CommentId + '">Permanently delete' + (!isReply ? ' comment and replies' : '') + '? <button class="ec-delete-confirm-btn" data-id="' + c.CommentId + '">Yes, delete</button></span>' +
                '<button class="ec-delete-btn" data-id="' + c.CommentId + '" title="Delete comment">' + TRASH_SVG + '</button>' : '';

            var explicitTextHtml = '';
            if (c.Body) {
                explicitTextHtml =
                    '<div class="ec-explicit-wrap">' +
                    '<div class="ec-c-text">' + esc(c.Body) + '</div>' +
                    '<div class="ec-explicit-overlay"><span>This comment contains explicit language</span></div>' +
                    '</div>';
            }

            div.innerHTML =
                '<div class="ec-hidden-bar">' + EYE_OFF_SVG + ' <span>This comment has been hidden</span><button class="ec-unhide-btn" data-id="' + c.CommentId + '">Unhide</button></div>' +
                '<div class="ec-avatar" style="background:' + hashColor(name) + ';">' + esc(name.charAt(0)) + '</div>' +
                '<div class="ec-c-body">' +
                '<div class="ec-c-top"><span class="ec-c-author">' + esc(name) + '</span>' +
                '<span class="ec-mod-badge ec-explicit-badge">Explicit</span>' +
                (c.StarRating ? '<span class="ec-c-rating">\u2605 ' + c.StarRating + '/10</span>' : '') +
                '<span class="ec-c-date">' + formatDate(c.CreatedAt) + '</span>' +
                '</div>' +
                explicitTextHtml +
                '<div class="ec-c-foot">' +
                explicitDeleteHtml +
                '</div></div>';

            return div;
        }

        var deleteHtml = isOwn ?
            '<span class="ec-delete-confirm" data-id="' + c.CommentId + '">Permanently delete' + (!isReply ? ' comment and replies' : '') + '? <button class="ec-delete-confirm-btn" data-id="' + c.CommentId + '">Yes, delete</button></span>' +
            '<button class="ec-delete-btn" data-id="' + c.CommentId + '" title="Delete comment">' + TRASH_SVG + '</button>' : '';

        var spoilerBadge = isSpoiler ? '<span class="ec-mod-badge ec-spoiler-badge">Spoiler</span>' : '';

        var textHtml = '';
        if (c.Body) {
            if (isSpoiler) {
                textHtml =
                    '<div class="ec-spoiler-wrap" data-id="' + c.CommentId + '">' +
                    '<div class="ec-c-text">' + esc(c.Body) + '</div>' +
                    '<div class="ec-spoiler-overlay"><span>This comment contains spoilers \u2014 click to reveal</span></div>' +
                    '</div>';
            } else {
                textHtml = '<div class="ec-c-text">' + esc(c.Body) + '</div>';
            }
        }

        div.innerHTML =
            '<div class="ec-hidden-bar">' + EYE_OFF_SVG + ' <span>This comment has been hidden</span><button class="ec-unhide-btn" data-id="' + c.CommentId + '">Unhide</button></div>' +
            '<div class="ec-avatar" style="background:' + hashColor(name) + ';">' + esc(name.charAt(0)) + '</div>' +
            '<div class="ec-c-body">' +
            '<div class="ec-c-top"><span class="ec-c-author">' + esc(name) + '</span>' +
            spoilerBadge +
            (c.StarRating ? '<span class="ec-c-rating">\u2605 ' + c.StarRating + '/10</span>' : '') +
            '<span class="ec-c-date">' + formatDate(c.CreatedAt) + '</span>' +
            '<button class="ec-hide-btn" data-id="' + c.CommentId + '" title="Hide comment">' + EYE_SVG + '</button>' +
            '</div>' +
            textHtml +
            '<div class="ec-c-foot">' +
            '<button class="ec-c-act ec-like-btn' + (reaction === 'like' ? ' ec-liked' : '') + '" data-id="' + c.CommentId + '">' + (reaction === 'like' ? '\u2665' : '\u2661') + ' ' + (c.LikeCount || 0) + '</button>' +
            '<button class="ec-c-act ec-dislike-btn' + (reaction === 'dislike' ? ' ec-disliked' : '') + '" data-id="' + c.CommentId + '">' + THUMB_DOWN_SVG + ' ' + (c.DislikeCount || 0) + '</button>' +
            (!isReply && userModerationStatus !== 'denied' ? '<button class="ec-c-act ec-reply-toggle" data-id="' + c.CommentId + '">\u21a9 Reply</button>' : '') +
            deleteHtml +
            '</div></div>';

        return div;
    }

    function wireActions(section, list, el, comment, isReply) {
        var likeBtn = el.querySelector('.ec-like-btn');
        var dislikeBtn = el.querySelector('.ec-dislike-btn');

        if (likeBtn) likeBtn.addEventListener('click', function () { postReaction(section, comment.CommentId, 'like', el); });
        if (dislikeBtn) dislikeBtn.addEventListener('click', function () { postReaction(section, comment.CommentId, 'dislike', el); });

        if (!isReply) {
            var toggle = el.querySelector('.ec-reply-toggle');
            if (toggle) toggle.addEventListener('click', function () {
                var form = section.querySelector('#ec-rf-' + this.dataset.id);
                if (form) { form.classList.toggle('open'); if (form.classList.contains('open')) form.querySelector('textarea').focus(); }
            });
        }

        // Spoiler reveal
        var spoilerWrap = el.querySelector('.ec-spoiler-wrap');
        if (spoilerWrap) {
            spoilerWrap.addEventListener('click', function () {
                spoilerWrap.classList.add('ec-revealed');
            });
        }

        // Hide button
        var hideBtn = el.querySelector('.ec-hide-btn');
        if (hideBtn) {
            hideBtn.addEventListener('click', function () {
                var cid = comment.CommentId;
                cfFetch(apiEndpoint + '/hide', { method: 'POST', headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ UserUuid: userUuid, CommentId: cid })
                }).then(function (r) { return r.json(); }).then(function (data) {
                    if (data.hidden) { hiddenSet[cid] = true; el.classList.add('ec-is-hidden'); }
                });
            });
        }

        // Unhide button
        var unhideBtn = el.querySelector('.ec-unhide-btn');
        if (unhideBtn) {
            unhideBtn.addEventListener('click', function () {
                var cid = comment.CommentId;
                cfFetch(apiEndpoint + '/hide', { method: 'POST', headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ UserUuid: userUuid, CommentId: cid })
                }).then(function (r) { return r.json(); }).then(function (data) {
                    if (!data.hidden) { delete hiddenSet[cid]; el.classList.remove('ec-is-hidden'); }
                });
            });
        }

        // Delete (two-click with timeout)
        var deleteBtn = el.querySelector('.ec-delete-btn');
        var confirmEl = el.querySelector('.ec-delete-confirm');
        var confirmBtn = el.querySelector('.ec-delete-confirm-btn');

        if (deleteBtn && confirmEl && confirmBtn) {
            var deleteTimeout = null;

            deleteBtn.addEventListener('click', function () {
                deleteBtn.style.display = 'none';
                confirmEl.classList.add('ec-active');
                if (deleteTimeout) clearTimeout(deleteTimeout);
                deleteTimeout = setTimeout(function () {
                    confirmEl.classList.remove('ec-active');
                    deleteBtn.style.display = '';
                }, 15000);
            });

            confirmBtn.addEventListener('click', function () {
                if (deleteTimeout) clearTimeout(deleteTimeout);
                cfFetch(apiEndpoint + '/comments/' + comment.CommentId, { method: 'DELETE', headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ UserUuid: userUuid })
                }).then(function () { loadComments(section, true); });
            });
        }
    }

    function postReaction(section, commentId, type, el) {
        cfFetch(apiEndpoint + '/react', { method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ CommentId: commentId, UserUuid: userUuid, Type: type })
        }).then(function (r) { return r.json(); }).then(function (data) {
            var likeBtn = el.querySelector('.ec-like-btn'), dislikeBtn = el.querySelector('.ec-dislike-btn');
            var lc = parseInt(likeBtn.textContent.replace(/[^\d]/g, '') || '0');
            var dc = parseInt(dislikeBtn.textContent.replace(/[^\d]/g, '') || '0');
            var prev = reactionsMap[commentId] || null;

            if (data.reaction === null) {
                if (prev === 'like') lc = Math.max(0, lc - 1);
                if (prev === 'dislike') dc = Math.max(0, dc - 1);
                delete reactionsMap[commentId];
            } else if (data.reaction === 'like') {
                if (prev === 'dislike') dc = Math.max(0, dc - 1);
                if (prev !== 'like') lc++;
                reactionsMap[commentId] = 'like';
            } else if (data.reaction === 'dislike') {
                if (prev === 'like') lc = Math.max(0, lc - 1);
                if (prev !== 'dislike') dc++;
                reactionsMap[commentId] = 'dislike';
            }

            var nr = reactionsMap[commentId] || null;
            likeBtn.className = 'ec-c-act ec-like-btn' + (nr === 'like' ? ' ec-liked' : '');
            likeBtn.innerHTML = (nr === 'like' ? '\u2665' : '\u2661') + ' ' + lc;
            dislikeBtn.className = 'ec-c-act ec-dislike-btn' + (nr === 'dislike' ? ' ec-disliked' : '');
            dislikeBtn.innerHTML = THUMB_DOWN_SVG + ' ' + dc;
        });
    }

    function loadRemainingReplies(section, list, parentId, moreBtn, skipCount) {
        moreBtn.textContent = 'Loading...'; moreBtn.disabled = true;
        cfFetch(apiEndpoint + '/replies?parentId=' + encodeURIComponent(parentId) + '&offset=' + skipCount)
            .then(function (r) { return r.json(); }).then(function (replies) {
                replies.forEach(function (r) { var re = createCommentEl(r, true); list.insertBefore(re, moreBtn); wireActions(section, list, re, r, true); });
                moreBtn.remove();
            }).catch(function () { moreBtn.textContent = 'Failed. Try again.'; moreBtn.disabled = false; });
    }

    function formatDate(ds) {
        if (!ds) return '';
        var diff = Date.now() - new Date(ds), m = Math.floor(diff / 60000);
        if (m < 1) return 'now'; if (m < 60) return m + 'm';
        var h = Math.floor(m / 60); if (h < 24) return h + 'h';
        var d = Math.floor(h / 24); if (d < 30) return d + 'd';
        var mo = Math.floor(d / 30); if (mo < 12) return mo + 'mo';
        return Math.floor(mo / 12) + 'y';
    }

    function showError(section, msg) { var el = section.querySelector('#ec-error'); if (el) { el.textContent = msg; el.style.display = 'block'; } }
    function esc(str) { if (!str) return ''; return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }

    init();

    function EmbyCommentsPlugin() { this.id = 'a4b7c2d1-e5f6-4a3b-8c9d-0e1f2a3b4c5d'; this.name = 'Emby Comments'; }
    return EmbyCommentsPlugin;
});