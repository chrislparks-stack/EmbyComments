define([], function () {
    var apiEndpoint = null;
    var displayName = null;
    var userAvatarBlob = null;
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
    var reportedSet = {};
    var userModerationStatus = 'approved';
    var pendingComments = [];
    var hasPendingActivity = false;
    var censorExplicit = false;
    var currentSort = 'newest';
    var languageFilter = [];
    var LANGUAGES = ['English', 'Español', 'Français', 'Deutsch', 'Português', 'Italiano', 'Nederlands', 'Русский', '日本語', '한국어', '中文', 'العربية', 'हिन्दी', 'Türkçe', 'Polski', 'Svenska'];
    var moderationPollTimer = null;
    var moderationPollCount = 0;
    var sessionToken = null;
    var initResolve = null;
    var initReady = new Promise(function (resolve) { initResolve = resolve; });
    var serverLocalOnly = false;
    var banInfo = null;
    var initRetries = 0;
    var MAX_INIT_RETRIES = 10;

    var THUMB_DOWN_SVG = '<svg viewBox="0 0 24 24" width="12" height="12" style="vertical-align:-1px;"><path fill="currentColor" d="M19 15h4V3h-4m-4 0H6.2c-.7 0-1.3.4-1.6 1l-2.5 5.9c-.1.2-.1.4-.1.6V12c0 1.1.9 2 2 2h6.3l-1 4.6c-.1.5.1 1 .4 1.4l.5.5 6.7-6.7c.3-.3.5-.7.5-1.1V5c0-1.1-.9-2-2-2z"/></svg>';
    var EYE_SVG = '<svg viewBox="0 0 24 24" width="14" height="14" style="vertical-align:-2px;"><path fill="currentColor" d="M12 4.5C7 4.5 2.7 7.6 1 12c1.7 4.4 6 7.5 11 7.5s9.3-3.1 11-7.5c-1.7-4.4-6-7.5-11-7.5zm0 12.5c-2.8 0-5-2.2-5-5s2.2-5 5-5 5 2.2 5 5-2.2 5-5 5zm0-8c-1.7 0-3 1.3-3 3s1.3 3 3 3 3-1.3 3-3-1.3-3-3-3z"/></svg>';
    var EYE_OFF_SVG = '<svg viewBox="0 0 24 24" width="14" height="14" style="vertical-align:-2px;"><path fill="currentColor" d="M12 7c2.8 0 5 2.2 5 5 0 .6-.1 1.3-.4 1.8l2.9 2.9c1.5-1.3 2.7-2.9 3.5-4.7-1.7-4.4-6-7.5-11-7.5-1.4 0-2.7.3-4 .7l2.2 2.2c.5-.3 1.2-.4 1.8-.4zM2 4.3l2.3 2.3.4.4C3.2 8.3 2 10 1 12c1.7 4.4 6 7.5 11 7.5 1.5 0 3-.3 4.4-.8l.4.4 3 3 1.3-1.3L3.3 3 2 4.3zm5.5 5.5l1.6 1.6c0 .2-.1.4-.1.6 0 1.7 1.3 3 3 3 .2 0 .4 0 .6-.1l1.6 1.6c-.7.3-1.4.5-2.2.5-2.8 0-5-2.2-5-5 0-.8.2-1.5.5-2.2zm4.3-.8l3.1 3.1V12c0-1.7-1.3-3-3-3h-.1z"/></svg>';
    var TRASH_SVG = '<svg viewBox="0 0 24 24" width="12" height="12" style="vertical-align:-1px;"><path fill="currentColor" d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg>';
    var WARNING_SVG = '<svg viewBox="0 0 24 24" width="14" height="14" style="vertical-align:-2px;"><path fill="currentColor" d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z"/></svg>';
    var SHIELD_SVG = '<svg viewBox="0 0 24 24" width="12" height="12" style="vertical-align:-1px;"><path fill="currentColor" d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm-1 17.93C7.05 17.74 5 14.49 5 11V6.3l7-3.11 7 3.11V11c0 3.49-2.05 6.74-6 7.93V18h-1v.93zM10 14.17l-2.59-2.58L6 13l4 4 8-8-1.41-1.42L10 14.17z"/></svg>';
    var FLAG_SVG = '<svg viewBox="0 0 24 24" width="12" height="12" style="vertical-align:-1px;"><path fill="currentColor" d="M14.4 6l-.4-2H5v17h2v-7h5.6l.4 2H19V6h-4.6z"/></svg>';


    var avatarColors = [
        '#e74c3c', '#e67e22', '#f1c40f', '#2ecc71', '#1abc9c',
        '#3498db', '#9b59b6', '#e84393', '#00cec9', '#6c5ce7'
    ];

    function hashColor(name) {
        var hash = 0;
        for (var i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
        return avatarColors[Math.abs(hash) % avatarColors.length];
    }

    function renderAvatar(name, avatarUrl, extraStyle) {
        var style = 'background:' + hashColor(name) + ';' + (extraStyle || '');
        var letter = esc(name.charAt(0));
        if (avatarUrl) {
            var resolvedUrl = (avatarUrl.indexOf('data:') === 0 || avatarUrl.indexOf('http') === 0) ? avatarUrl : ApiClient.getUrl(avatarUrl);
            return '<div class="ec-avatar" style="' + style + '">' + letter + '<img src="' + esc(resolvedUrl) + '" onerror="this.style.display=\'none\'"></div>';
        }
        return '<div class="ec-avatar" style="' + style + '">' + letter + '</div>';
    }

    function init() {
        if (initRetries >= MAX_INIT_RETRIES) return;
        initRetries++;

        ApiClient.getJSON(ApiClient.getUrl('embycomments/config')).then(function (config) {
            apiEndpoint = config.ApiEndpoint;
            serverLocalOnly = !!config.ServerLocalCommentsOnly;
            serverGuid = ApiClient.serverId();

            var userId = ApiClient.getCurrentUserId();
            var entries = config.UserDisplayNames || [];
            var configEntry = entries.find(function (e) { return e.UserId === userId; });

            if (configEntry && configEntry.DisplayName) {
                displayName = configEntry.DisplayName;
            }

            var resolveDisplayName;
            if (!displayName) {
                resolveDisplayName = ApiClient.getUser(userId).then(function (user) { displayName = user.Name; });
            } else {
                resolveDisplayName = Promise.resolve();
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
                userAvatarBlob = data.AvatarBlob || null;
                initRetries = 0;
                initResolve();
            }).catch(function () { setTimeout(init, 3000); });
        }).catch(function () { setTimeout(init, 3000); });
    }

    function refreshConfig() {
        return ApiClient.getJSON(ApiClient.getUrl('embycomments/config')).then(function (config) {
            serverLocalOnly = !!config.ServerLocalCommentsOnly;
        }).catch(function () { /* keep existing value */ });
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
            if (data.AvatarBlob) userAvatarBlob = data.AvatarBlob;
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
        hasPendingActivity = false;
        userModerationStatus = 'approved';
        banInfo = null;
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
        if (anchor && !document.getElementById('embycomments-section')) { checkAndInject(itemId); return; }
        if (attempts >= 50) return;

        // Use MutationObserver for instant detection, fall back to polling
        var observer = new MutationObserver(function () {
            var a = getVisibleAnchor();
            if (a && !document.getElementById('embycomments-section')) {
                observer.disconnect();
                checkAndInject(itemId);
            }
        });
        observer.observe(document.body, { childList: true, subtree: true });

        // Safety timeout to disconnect observer if anchor never appears
        setTimeout(function () { observer.disconnect(); }, 10000);
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

        // Inject skeleton section immediately — before any API calls
        var section = document.createElement('div');
        section.id = 'embycomments-section';
        section.className = 'verticalSection verticalSection-cards';
        section.innerHTML = buildSectionHtml();
        anchor.parentNode.insertBefore(section, anchor);

        ApiClient.getItem(ApiClient.getCurrentUserId(), itemId).then(function (item) {
            if (!isSupported(item)) {
                section.remove();
                lastInjectedItemId = null;
                return;
            }

            currentMediaKey = getMediaKey(item);
            currentItemName = item.Name || '';
            selectedRating = 0;
            currentPage = 0;
            commentTotal = 0;
            reactionsMap = {};
            hiddenSet = {};
            pendingComments = [];

            setupStars(section);
            setupSubmit(section, item);
            setupFormToggle(section);
            setupPagination(section);
            setupToolbar(section);

            initReady.then(function () {
                return Promise.all([fetchMyState(), fetchMyPending(), refreshConfig()]);
            }).then(function () {
                updateFormVisibility(section);
                applyToolbarState(section);
                loadComments(section);
            });
        }).catch(function () {
            section.remove();
            lastInjectedItemId = null;
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
                reportedSet = {};
                (data.reported || []).forEach(function (id) { reportedSet[id] = true; });
                userModerationStatus = data.userModerationStatus || 'approved';
                censorExplicit = data.censorExplicit || false;
                currentSort = data.sortPreference || 'newest';
                languageFilter = data.languageFilter || [];
                banInfo = data.ban || null;
            })
            .catch(function () { reactionsMap = {}; hiddenSet = {}; reportedSet = {}; userModerationStatus = 'approved'; censorExplicit = false; banInfo = null; });
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
            if (moderationPollCount >= 6 || !document.getElementById('embycomments-section')) {
                clearInterval(moderationPollTimer);
                moderationPollTimer = null;
                return;
            }

            var awaitingSnapshot = {};
            pendingComments
                .filter(function (c) { return c.ModerationStatus === 'awaiting'; })
                .forEach(function (c) { awaitingSnapshot[c.CommentId] = { AuthorDisplayName: c.AuthorDisplayName, Body: c.Body, CreatedAt: c.CreatedAt, StarRating: c.StarRating, AvatarBlob: c.AvatarBlob, ParentCommentId: c.ParentCommentId }; });
            var awaitingIds = Object.keys(awaitingSnapshot);

            fetchMyPending().then(function () {
                var list = section.querySelector('#ec-list');
                if (!list) return;

                awaitingIds.forEach(function (id) {
                    var el = list.querySelector('.ec-c[data-comment-id="' + id + '"]');
                    if (!el) return;

                    var pending = pendingComments.find(function (c) { return c.CommentId === id; });

                    if (!pending) {
                        transitionToApproved(el, awaitingSnapshot[id], section, list);
                    } else if (pending.ModerationStatus === 'denied') {
                        transitionToDenied(el, pending);
                    }
                });

                var stillAwaiting = pendingComments.some(function (c) { return c.ModerationStatus === 'awaiting'; });
                if (!stillAwaiting) {
                    clearInterval(moderationPollTimer);
                    moderationPollTimer = null;
                }
            });
        }, 8000);
    }

    function updateFormVisibility(section) {
        var nameWarning = section.querySelector('#ec-name-warning');
        var banWarning = section.querySelector('#ec-ban-warning');
        var formToggle = section.querySelector('#ec-form-toggle');
        if (banInfo) {
            nameWarning.style.display = 'none';
            if (banInfo.banType === 'permanent') {
                banWarning.innerHTML = WARNING_SVG + ' Your account has been permanently banned from posting comments due to repeated violations.';
            } else {
                var expiry = new Date(banInfo.expiresAt);
                banWarning.innerHTML = WARNING_SVG + ' You are temporarily banned from posting comments until ' + expiry.toLocaleTimeString() + '. Reason: ' + esc(banInfo.reason);
            }
            banWarning.style.display = 'flex';
            formToggle.style.display = 'none';
        } else if (userModerationStatus === 'denied') {
            banWarning.style.display = 'none';
            nameWarning.style.display = 'flex';
            formToggle.style.display = 'none';
        } else {
            banWarning.style.display = 'none';
            nameWarning.style.display = 'none';
        }
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
            '#embycomments-section { font-family:inherit; color:inherit; position:relative; z-index:10; }' +
            '.ec-content { padding-bottom:1.5em; }' +
            '.ec-summary { display:flex; align-items:center; gap:1em; padding:0.4em 0; margin-bottom:0.4em; flex-wrap:wrap; }' +
            '.ec-avg { display:flex; align-items:baseline; gap:0.25em; }' +
            '.ec-avg-num { font-size:1.6em; font-weight:700; color:#f5c518; line-height:1; }' +
            '.ec-avg-max { font-size:0.8em; opacity:0.5; }' +
            '.ec-avg-detail { display:flex; flex-direction:column; gap:1px; }' +
            '.ec-avg-stars { color:#f5c518; font-size:0.95em; white-space:nowrap; }' +
            '.ec-avg-stars .ec-star-empty {color: color-mix(in srgb, currentColor 35%, transparent);}' +
            '.ec-avg-stars .ec-star-partial {position:relative;display:inline-block;color: color-mix(in srgb, currentColor 35%, transparent);}' +
            '.ec-avg-stars .ec-star-fill { position:absolute; left:0; top:0; overflow:hidden; color:#f5c518; opacity:1; }' +
            '.ec-avg-meta { font-size:0.75em; opacity:0.55; }' +
            '.ec-spark { flex-shrink:0; } .ec-spark svg { display:block; }' +
            '.ec-name-warning { display:none; align-items:center; gap:0.5em; padding:0.6em 1em; margin-bottom:0.6em; border-radius:8px; background:rgba(231,76,60,0.1); border:1px solid rgba(231,76,60,0.25); color:#e74c3c; font-size:0.85em; }' +
            '.ec-ban-warning { display:none; align-items:center; gap:0.5em; padding:0.6em 1em; margin-bottom:0.6em; border-radius:8px; background:rgba(231,76,60,0.1); border:1px solid rgba(231,76,60,0.25); color:#e74c3c; font-size:0.85em; }' +
            '.ec-form-toggle { background:color-mix(in srgb, currentColor 5%, transparent); border:1px solid color-mix(in srgb, currentColor 10%, transparent); border-radius:8px; color:inherit; opacity:0.5; cursor:pointer; font-size:0.85em; font-family:inherit; padding:0.6em 1em; margin-bottom:0.6em; display:block; width:100%; text-align:left; transition:all 0.2s; backdrop-filter:blur(10px); -webkit-backdrop-filter:blur(10px); }' +
            '.ec-form-toggle:hover { opacity:0.7; background:color-mix(in srgb, currentColor 8%, transparent); }' +
            '.ec-form { display:none; margin-bottom:0.8em; position:relative; } .ec-form.open { display:block; }' +
            '.ec-form-head { display:flex; align-items:center; justify-content:space-between; gap:0.75em; margin-bottom:0.35em; }' +
            '.ec-form-close { background:none; border:none; color:inherit; opacity:0.3; cursor:pointer; font-size:1.1em; line-height:1; padding:2px 6px; border-radius:4px; transition:opacity 0.15s, background 0.15s; flex-shrink:0; } .ec-form-close:hover { opacity:0.7; background:color-mix(in srgb, currentColor 5%, transparent); }' +
            '.ec-form-footer { display:flex; align-items:center; gap:0.8em; margin-top:0.4em; }' +
            '.ec-stars { display:flex; gap:2px; margin:0; cursor:pointer; flex-wrap:wrap; }' +            
            '.ec-stars span { font-size:1.3em; color: color-mix(in srgb, currentColor 25%, transparent); transition:color 0.15s, opacity 0.15s; } .ec-stars span.active { color:#f5c518; opacity:1; }' +
            '.ec-textarea { width:100%; min-height:60px; background:color-mix(in srgb, currentColor 5%, transparent); border:1px solid color-mix(in srgb, currentColor 10%, transparent); border-radius:8px; color:inherit; padding:0.6em; font-size:0.85em; font-family:inherit; resize:vertical; box-sizing:border-box; outline:none; transition:all 0.2s; backdrop-filter:blur(10px); -webkit-backdrop-filter:blur(10px); }' +
            '.ec-textarea:focus { border-color:var(--theme-accent-text-color, #00a4dc); background:color-mix(in srgb, currentColor 8%, transparent); }' +
            '.ec-spoiler-check { display:flex; align-items:center; gap:0.4em; font-size:0.78em; color:color-mix(in srgb, #9b59b6 80%, currentColor); cursor:pointer; padding:3px 10px; border-radius:4px; border:1px solid color-mix(in srgb, #9b59b6 35%, transparent); transition:all 0.15s; }' +
            '.ec-spoiler-check:hover { border-color:color-mix(in srgb, #9b59b6 55%, transparent); color:#9b59b6; background:color-mix(in srgb, #9b59b6 12%, transparent); }' +
            '.ec-spoiler-check.ec-checked { background:color-mix(in srgb, #9b59b6 20%, transparent); border-color:color-mix(in srgb, #9b59b6 55%, transparent); color:#9b59b6; }' +
            '.ec-spoiler-check input { position:absolute; opacity:0; pointer-events:none }' +
            '.ec-btn { padding:0.45em 1.4em; background:var(--theme-accent-text-color, #00a4dc); border:none; border-radius:6px; color:white; cursor:pointer; font-size:0.85em; font-family:inherit; font-weight:500; transition:all 0.15s; }' +
            '.ec-btn:hover { filter:brightness(1.15); transform:translateY(-1px); } .ec-btn:active { transform:translateY(0); }' +
            '.ec-char-count { font-size:0.75em; opacity:0.3; margin-left:auto; } .ec-char-count.ec-over { color:#e74c3c; opacity:1; }' +
            '.ec-scroll { max-height:365px; overflow-y:auto; overflow-x:hidden; border-radius:8px; scrollbar-width:thin; scrollbar-color:color-mix(in srgb, currentColor 15%, transparent) transparent; }' +
            '.ec-scroll::-webkit-scrollbar { width:6px; } .ec-scroll::-webkit-scrollbar-track { background:transparent; } .ec-scroll::-webkit-scrollbar-thumb { background:color-mix(in srgb, currentColor 15%, transparent); border-radius:3px; }' +
            '.ec-list { display:flex; flex-direction:column; gap:6px; padding:0.3em 0; transition:opacity 0.15s; } .ec-list.ec-fading { opacity:0.4; }' +
            '.ec-c { display:flex; gap:0.7em; padding:0.7em 0.8em; border-radius:8px; background:color-mix(in srgb, currentColor 5%, transparent); border:1px solid color-mix(in srgb, currentColor 6%, transparent); transition:all 0.2s; backdrop-filter:blur(12px); -webkit-backdrop-filter:blur(12px); }' +
            '.ec-c:hover { background:color-mix(in srgb, currentColor 8%, transparent); }' +
            '.ec-removing { opacity:0 !important; pointer-events:none; }' +
            '.ec-c.reply { margin-left:2.8em; background:color-mix(in srgb, currentColor 3%, transparent); backdrop-filter:blur(10px); -webkit-backdrop-filter:blur(10px); } .ec-c.reply:hover { background:color-mix(in srgb, currentColor 6%, transparent); }' +
            '.ec-c.ec-star-only { padding:0.45em 0.8em; }' +
            '.ec-c.ec-is-hidden { padding:0.4em 0.8em; background:transparent; }' +
            '.ec-c.ec-is-hidden .ec-c-body, .ec-c.ec-is-hidden .ec-avatar { display:none; }' +
            '.ec-hidden-bar { display:none; align-items:center; gap:0.5em; width:100%; font-size:0.78em; opacity:0.25; }' +
            '.ec-c.ec-is-hidden .ec-hidden-bar { display:flex; }' +
            '.ec-unhide-btn { background:none; border:none; color:var(--theme-accent-text-color, #00a4dc); cursor:pointer; font-size:1em; font-family:inherit; padding:0; margin-left:auto; } .ec-unhide-btn:hover { text-decoration:underline; }' +
            '.ec-c.ec-awaiting { opacity:0.5; }' +
            '.ec-c.ec-awaiting .ec-c-text { opacity:0.5; }' +
            '.ec-mod-badge { display:inline-flex; align-items:center; gap:3px; font-size:0.68em; padding:1px 7px; border-radius:4px; white-space:nowrap; font-weight:500; }' +
            '.ec-mod-badge.ec-awaiting-badge { background:rgba(52,152,219,0.12); color:#5dade2; }' +
            '.ec-mod-badge.ec-approved-badge { background:rgba(46,204,113,0.12); color:#2ecc71; }' +
            '.ec-mod-badge.ec-spoiler-badge { background:rgba(155,89,182,0.12); color:#9b59b6; }' +
            '.ec-mod-badge.ec-explicit-badge { background:rgba(243,156,18,0.12); color:#f39c12; }' +
            '.ec-c.ec-explicit-collapsed { background:rgba(243,156,18,0.04); border-color:rgba(243,156,18,0.1); }' +
            '.ec-c.ec-explicit-collapsed:hover { background:rgba(243,156,18,0.07); border-color:rgba(243,156,18,0.15); }' +
            '.ec-explicit-wrap { position:relative; }' +
            '.ec-explicit-wrap .ec-c-text { filter:blur(5px); user-select:none; }' +
            '.ec-explicit-overlay { position:absolute; inset:0; display:flex; align-items:center; justify-content:center; pointer-events:none; }' +
            '.ec-explicit-overlay span { font-size:0.8em; opacity:0.7; background:rgba(243,156,18,0.2); padding:4px 12px; border-radius:4px; }' +
            '.ec-toggle { position:relative; width:28px; height:16px; flex-shrink:0; }' +
            '.ec-toggle input { opacity:0; width:0; height:0; }' +
            '.ec-toggle-slider { position:absolute; inset:0; background:color-mix(in srgb, currentColor 15%, transparent); border-radius:8px; transition:background 0.2s; cursor:pointer; }' +
            '.ec-toggle-slider:before { content:""; position:absolute; width:12px; height:12px; left:2px; bottom:2px; background:currentColor; opacity:0.5; border-radius:50%; transition:all 0.2s; }' +
            '.ec-toggle input:checked + .ec-toggle-slider { background:rgba(243,156,18,0.3); }' +
            '.ec-toggle input:checked + .ec-toggle-slider:before { transform:translateX(12px); background:#f39c12; opacity:1; }' +
            '.ec-c.ec-denied { background:rgba(231,76,60,0.06); border-color:rgba(231,76,60,0.15); }' +
            '.ec-denied-body { font-size:0.8em; color:rgba(231,76,60,0.7); line-height:1.4; }' +
            '.ec-denied-reason { font-size:0.78em; color:rgba(231,76,60,0.55); margin-top:3px; font-style:italic; }' +
            '.ec-spoiler-wrap { position:relative; cursor:pointer; }' +
            '.ec-spoiler-wrap .ec-c-text { filter:blur(5px); user-select:none; transition:filter 0.3s; }' +
            '.ec-spoiler-wrap.ec-revealed .ec-c-text { filter:none; user-select:auto; cursor:auto; }' +
            '.ec-spoiler-overlay { position:absolute; inset:0; display:flex; align-items:center; justify-content:center; transition:opacity 0.3s; pointer-events:none; }' +
            '.ec-spoiler-overlay span { font-size:0.8em; opacity:0.7; background:rgba(155,89,182,0.2); padding:4px 12px; border-radius:4px; }' +
            '.ec-spoiler-wrap.ec-revealed .ec-spoiler-overlay { opacity:0; }' +
            '.ec-avatar { flex-shrink:0; width:32px; height:32px; border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:0.75em; font-weight:600; color:white; text-transform:uppercase; overflow:hidden; position:relative; }' +
            '.ec-avatar img { position:absolute; inset:0; width:100%; height:100%; object-fit:cover; }' +
            '.ec-c.reply .ec-avatar { width:24px; height:24px; font-size:0.6em; }' +
            '.ec-c-body { flex:1; min-width:0; }' +
            '.ec-c-top { display:flex; align-items:center; gap:0.5em; line-height:1.3; }' +
            '.ec-c-author { font-weight:600; font-size:0.8em; white-space:nowrap; opacity:0.9; }' +
            '.ec-c-rating { display:inline-flex; align-items:center; gap:3px; background:rgba(245,197,24,0.12); color:#f5c518; font-size:0.7em; padding:1px 6px; border-radius:4px; white-space:nowrap; font-weight:500; }' +
            '.ec-c-date { font-size:0.7em; opacity:0.2; margin-left:auto; white-space:nowrap; }' +
            '.ec-hide-btn { background:none; border:none; color:inherit; opacity:0.1; cursor:pointer; padding:1px 3px; border-radius:3px; transition:all 0.15s; margin-left:4px; line-height:1; }' +
            '.ec-c:hover .ec-hide-btn { opacity:0.25; } .ec-hide-btn:hover { opacity:0.5; background:color-mix(in srgb, currentColor 5%, transparent); }' +
            '.ec-c-text { font-size:0.85em; opacity:0.75; line-height:1.5; margin-top:3px; overflow-wrap:break-word; }' +
            '.ec-c-foot { display:flex; align-items:center; gap:0.4em; margin-top:5px; }' +
            '.ec-c-act { background:none; border:none; color:inherit; opacity:0.5; cursor:pointer; font-size:0.72em; font-family:inherit; padding:2px 5px; border-radius:4px; transition:all 0.15s; display:inline-flex; align-items:center; gap:3px; }' +
            '.ec-c-act:hover { background:color-mix(in srgb, currentColor 5%, transparent); opacity:0.7; }' +
            '.ec-c-act.ec-liked { color:#e74c3c; opacity:1; } .ec-c-act.ec-liked:hover { color:#c0392b; }' +
            '.ec-c-act.ec-disliked { color:#3498db; opacity:1; } .ec-c-act.ec-disliked:hover { color:#2980b9; }' +
            '.ec-report-btn { background:none; border:none; color:#e74c3c; opacity:0.35; cursor:pointer; padding:2px 4px; border-radius:3px; transition:all 0.15s; margin-left:auto; line-height:1; display:inline-flex; align-items:center; gap:3px; font-size:0.72em; font-family:inherit; }' +
            '.ec-report-btn:hover { opacity:1; background:rgba(231,76,60,0.12); }' +
            '.ec-report-btn.ec-reported { opacity:0.5; cursor:default; } .ec-report-btn.ec-reported:hover { opacity:0.5; background:none; }' +
            '.ec-report-picker { position:fixed; z-index:10000; background:color-mix(in srgb, currentColor 8%, transparent); backdrop-filter:blur(16px); -webkit-backdrop-filter:blur(16px); border:1px solid color-mix(in srgb, currentColor 12%, transparent); border-radius:8px; padding:6px; box-shadow:0 4px 16px rgba(0,0,0,0.25); min-width:150px; }' +
            '.ec-report-title { font-size:0.75em; opacity:0.5; padding:3px 8px 5px; }' +
            '.ec-report-reason { display:block; width:100%; background:none; border:none; color:inherit; font-family:inherit; font-size:0.8em; padding:6px 10px; border-radius:4px; cursor:pointer; text-align:left; opacity:0.6; transition:all 0.12s; }' +
            '.ec-report-reason:hover { opacity:1; background:rgba(231,76,60,0.15); color:#e74c3c; }' +
            '.ec-report-other { display:flex; gap:4px; padding:4px 6px; border-top:1px solid color-mix(in srgb, currentColor 8%, transparent); margin-top:4px; padding-top:8px; }' +
            '.ec-report-other-input { flex:1; min-width:0; background:color-mix(in srgb, currentColor 5%, transparent); border:1px solid color-mix(in srgb, currentColor 10%, transparent); border-radius:4px; color:inherit; font-family:inherit; font-size:0.75em; padding:4px 6px; outline:none; }' +
            '.ec-report-other-input:focus { border-color:color-mix(in srgb, currentColor 20%, transparent); }' +
            '.ec-report-other-submit { background:rgba(231,76,60,0.15); border:1px solid rgba(231,76,60,0.25); border-radius:4px; color:#e74c3c; font-family:inherit; font-size:0.72em; padding:4px 8px; cursor:pointer; white-space:nowrap; transition:all 0.12s; }' +
            '.ec-report-other-submit:hover { background:rgba(231,76,60,0.25); }' +
            '.ec-c.ec-user-reported { background:rgba(231,76,60,0.06); border-color:rgba(231,76,60,0.15); }' +
            '.ec-c.ec-user-reported:hover { background:rgba(231,76,60,0.09); border-color:rgba(231,76,60,0.2); }' +
            '.ec-c.ec-user-reported .ec-c-text { display:none; }' +
            '.ec-c.ec-user-reported .ec-spoiler-wrap { display:none; }' +
            '.ec-reported-bar { display:none; align-items:center; gap:0.5em; font-size:0.78em; color:#e74c3c; opacity:0.7; padding:2px 0; }' +
            '.ec-c.ec-user-reported .ec-reported-bar { display:flex; }' +
            '.ec-delete-btn { background:none; border:none; color:inherit; opacity:0.1; cursor:pointer; padding:2px 4px; border-radius:3px; transition:all 0.15s; margin-left:auto; line-height:1; display:inline-flex; align-items:center; gap:3px; font-size:0.72em; font-family:inherit; }' +
            '.ec-c:hover .ec-delete-btn { opacity:0.2; } .ec-delete-btn:hover { color:#e74c3c; opacity:1; background:rgba(231,76,60,0.08); }' +
            '.ec-delete-confirm { display:none; font-size:0.72em; color:#e74c3c; margin-left:auto; align-items:center; gap:4px; } .ec-delete-confirm.ec-active { display:inline-flex; }' +
            '.ec-delete-confirm-btn { background:none; border:none; color:#e74c3c; cursor:pointer; font-family:inherit; font-size:1em; font-weight:600; padding:0; text-decoration:underline; }' +
            '.ec-show-more { background:none; border:none; color:var(--theme-accent-text-color, #00a4dc); cursor:pointer; font-size:0.75em; font-family:inherit; padding:0.4em 0 0.4em 3.6em; opacity:0.8; transition:opacity 0.15s; } .ec-show-more:hover { opacity:1; text-decoration:underline; }' +
            '.ec-reply-inline { display:none; padding:0.3em 0.4em 0.3em 3.6em; } .ec-reply-inline.open { display:flex; gap:0.4em; align-items:flex-start; }' +            '.ec-reply-main { display:flex; flex-direction:column; gap:0.22em; flex:1; min-width:0; }' +
            '.ec-reply-inline .ec-textarea { min-height:46px; height:46px; font-size:0.8em; line-height:1.35; padding:0.4em 0.6em; flex:none; border-radius:6px; overflow-y:hidden; resize:none; box-sizing:border-box; }' +            '.ec-reply-char-count { font-size:0.72em; opacity:0.3; text-align:right; padding-right:2px; line-height:1; }' +
            '.ec-reply-char-count.ec-over { color:#e74c3c; opacity:1; }' +
            '.ec-reply-actions { display:flex; flex-direction:column; gap:0.35em; flex-shrink:0; }' +
            '.ec-reply-inline .ec-btn { font-size:0.75em; padding:0.35em 0.8em; margin-top:0; white-space:nowrap; }' +            '.ec-reply-cancel { background:none; border:1px solid color-mix(in srgb, currentColor 10%, transparent); color:inherit; opacity:0.45; cursor:pointer; border-radius:6px; font-size:0.72em; font-family:inherit; padding:0.32em 0.8em; transition:all 0.15s; }' +
            '.ec-reply-cancel:hover { opacity:0.75; background:color-mix(in srgb, currentColor 5%, transparent); }' +            '.ec-pager { display:flex; align-items:center; justify-content:space-between; padding:0.5em 0.2em; margin-top:0.3em; }' +
            '.ec-pager-info { font-size:0.75em; opacity:0.3; }' +
            '.ec-pager-btns { display:flex; gap:0.4em; }' +
            '.ec-pager-btn { background:color-mix(in srgb, currentColor 6%, transparent); border:1px solid color-mix(in srgb, currentColor 8%, transparent); border-radius:6px; opacity:0.55; cursor:pointer; font-size:0.75em; font-family:inherit; padding:0.35em 0.9em; transition:all 0.15s; color:inherit; backdrop-filter:blur(8px); -webkit-backdrop-filter:blur(8px); }' +            '.ec-pager-btn:hover:not(:disabled) { background:color-mix(in srgb, currentColor 10%, transparent); opacity:0.8; } .ec-pager-btn:disabled { opacity:0.15; cursor:default; }' +
            '.ec-empty { opacity:0.3; padding:1em 0; font-size:0.85em; }' +
            '.ec-error { color:#ff4444; padding:0.5em; background:rgba(255,0,0,0.08); border-radius:6px; margin-bottom:0.5em; display:none; font-size:0.8em; }' +
            '.ec-loading { text-align:center; padding:0.8em 0; opacity:0.2; font-size:0.8em; }' +
            '@keyframes ec-shimmer { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }' +
            '.ec-skel { display:flex; gap:0.7em; padding:0.7em 0.8em; border-radius:8px; background:color-mix(in srgb, currentColor 5%, transparent); border:1px solid color-mix(in srgb, currentColor 6%, transparent); }' +
            '.ec-skel-bone { border-radius:4px; background:linear-gradient(90deg, color-mix(in srgb, currentColor 6%, transparent) 25%, color-mix(in srgb, currentColor 10%, transparent) 50%, color-mix(in srgb, currentColor 6%, transparent) 75%); background-size:200% 100%; animation:ec-shimmer 1.5s ease-in-out infinite; }' +
            '.ec-skel-avatar { width:32px; height:32px; border-radius:50%; flex-shrink:0; }' +
            '.ec-skel-body { flex:1; display:flex; flex-direction:column; gap:6px; }' +
            '.ec-skel-line { height:10px; }' +
            '.ec-skel-line.w60 { width:60%; } .ec-skel-line.w80 { width:80%; } .ec-skel-line.w45 { width:45%; } .ec-skel-line.w70 { width:70%; } .ec-skel-line.w35 { width:35%; }' +
            '.ec-toolbar { display:flex; align-items:center; gap:0.8em; padding:0.5em 0; margin-bottom:0.4em; border-bottom:1px solid color-mix(in srgb, currentColor 6%, transparent); flex-wrap:wrap; }' +
            '.ec-toolbar-group { display:flex; align-items:center; gap:0.35em; }' +
            '.ec-toolbar-label { font-size:0.72em; opacity:0.35; white-space:nowrap; }' +
            '.ec-toolbar-btn { background:color-mix(in srgb, currentColor 5%, transparent); border:1px solid color-mix(in srgb, currentColor 8%, transparent); border-radius:6px; color:inherit; font-size:0.72em; font-family:inherit; padding:0.3em 0.5em; cursor:pointer; opacity:0.7; transition:all 0.15s; line-height:1.4; text-align:left; white-space:nowrap; }' +
            '.ec-toolbar-btn:hover { opacity:0.9; background:color-mix(in srgb, currentColor 8%, transparent); }' +
            '.ec-drop-wrap { position:relative; }' +
            '.ec-dropdown { display:none; position:absolute; top:calc(100% + 4px); left:0; min-width:100%; background:color-mix(in srgb, currentColor 8%, transparent); backdrop-filter:blur(16px); -webkit-backdrop-filter:blur(16px); border:1px solid color-mix(in srgb, currentColor 10%, transparent); border-radius:8px; padding:4px 0; z-index:1000; box-shadow:0 4px 12px rgba(0,0,0,0.15); max-height:240px; overflow-y:auto; overflow-x:hidden; }' +
            '.ec-dropdown.open { display:block; }' +
            '.ec-drop-item { display:flex; align-items:center; gap:6px; padding:4px 10px; font-size:0.72em; opacity:0.55; cursor:pointer; white-space:nowrap; transition:background 0.1s; }' +
            '.ec-drop-item:hover { background:color-mix(in srgb, currentColor 5%, transparent); opacity:0.75; }' +
            '.ec-drop-item.selected { opacity:0.9; }' +
            '.ec-drop-item input[type="checkbox"] { margin:0; accent-color:var(--theme-accent-text-color, #00a4dc); }' +
            '.ec-censor-btn { background:color-mix(in srgb, currentColor 5%, transparent); border:1px solid color-mix(in srgb, currentColor 8%, transparent); border-radius:6px; color:inherit; font-size:0.72em; font-family:inherit; padding:0.3em 0.5em; cursor:pointer; opacity:0.7; transition:all 0.15s; line-height:1.4; white-space:nowrap; margin-left:auto; display:flex; align-items:center; gap:5px; }' +
            '.ec-censor-btn:hover { opacity:0.9; background:color-mix(in srgb, currentColor 8%, transparent); }' +
            '.ec-censor-btn.active { background:rgba(243,156,18,0.15); border-color:rgba(243,156,18,0.3); opacity:0.9; }' +
            '.ec-censor-btn.active:hover { background:rgba(243,156,18,0.25); }' +
            '</style>' +
            '<h2 class="sectionTitle sectionTitle-cards padded-left padded-left-page padded-right">Community Comments</h2>' +
            '<div class="ec-content sectionTitle-cards padded-left padded-left-page padded-right">' +
            '<div class="ec-summary" id="ec-summary" style="display:none;"></div>' +
            '<div class="ec-error" id="ec-error"></div>' +
            '<div class="ec-name-warning" id="ec-name-warning">' + WARNING_SVG + ' Your display name has been flagged as inappropriate. You cannot post comments or replies until you update your name in the plugin settings.</div>' +
            '<div class="ec-ban-warning" id="ec-ban-warning"></div>' +
            '<button class="ec-form-toggle" id="ec-form-toggle">\u270E  Write a comment...</button>' +
            '<div class="ec-form" id="ec-form">' +
            '<div class="ec-form-head">' +
            '<div class="ec-stars" id="ec-stars"><span data-value="1">\u2605</span><span data-value="2">\u2605</span><span data-value="3">\u2605</span><span data-value="4">\u2605</span><span data-value="5">\u2605</span><span data-value="6">\u2605</span><span data-value="7">\u2605</span><span data-value="8">\u2605</span><span data-value="9">\u2605</span><span data-value="10">\u2605</span></div>' +
            '<button class="ec-form-close" id="ec-form-close" title="Close">\u2715</button>' +
            '</div>' +            
            '<textarea class="ec-textarea" id="ec-body" placeholder="Share your thoughts..." maxlength="' + MAX_CHARS + '"></textarea>' +
            '<div class="ec-form-footer"><button class="ec-btn" id="ec-submit">Post</button><label class="ec-spoiler-check" title="Click this tag if your comment reveals plot points, twists, or endings"><input type="checkbox" id="ec-spoiler-cb"> Spoiler</label><span class="ec-char-count" id="ec-char-count">0 / ' + MAX_CHARS + '</span></div></div>' +
            '<div class="ec-toolbar" id="ec-toolbar">' +
            '<div class="ec-toolbar-group"><label class="ec-toolbar-label">Sort</label><div class="ec-drop-wrap"><button class="ec-toolbar-btn" id="ec-sort-btn">Newest \u25be</button><div class="ec-dropdown" id="ec-sort-dropdown"></div></div></div>' +
            '<div class="ec-toolbar-group"><label class="ec-toolbar-label">Language</label><div class="ec-drop-wrap"><button class="ec-toolbar-btn" id="ec-lang-btn">All Languages \u25be</button><div class="ec-dropdown" id="ec-lang-dropdown"></div></div></div>' +
            '<button class="ec-censor-btn" id="ec-censor-toggle" type="button">' + WARNING_SVG + ' Censor explicit</button>' +
            '</div>' +
            '<div class="ec-scroll" id="ec-scroll"><div class="ec-list" id="ec-list">' +
            '<div class="ec-skel"><div class="ec-skel-bone ec-skel-avatar"></div><div class="ec-skel-body"><div class="ec-skel-bone ec-skel-line w45" style="height:8px;margin-bottom:2px"></div><div class="ec-skel-bone ec-skel-line w80"></div><div class="ec-skel-bone ec-skel-line w60"></div></div></div>' +
            '<div class="ec-skel"><div class="ec-skel-bone ec-skel-avatar"></div><div class="ec-skel-body"><div class="ec-skel-bone ec-skel-line w45" style="height:8px;margin-bottom:2px"></div><div class="ec-skel-bone ec-skel-line w70"></div><div class="ec-skel-bone ec-skel-line w45"></div></div></div>' +
            '<div class="ec-skel"><div class="ec-skel-bone ec-skel-avatar"></div><div class="ec-skel-body"><div class="ec-skel-bone ec-skel-line w45" style="height:8px;margin-bottom:2px"></div><div class="ec-skel-bone ec-skel-line w60"></div><div class="ec-skel-bone ec-skel-line w35"></div></div></div>' +
            '<div class="ec-skel"><div class="ec-skel-bone ec-skel-avatar"></div><div class="ec-skel-body"><div class="ec-skel-bone ec-skel-line w45" style="height:8px;margin-bottom:2px"></div><div class="ec-skel-bone ec-skel-line w80"></div><div class="ec-skel-bone ec-skel-line w70"></div></div></div>' +
            '<div class="ec-skel"><div class="ec-skel-bone ec-skel-avatar"></div><div class="ec-skel-body"><div class="ec-skel-bone ec-skel-line w45" style="height:8px;margin-bottom:2px"></div><div class="ec-skel-bone ec-skel-line w45"></div><div class="ec-skel-bone ec-skel-line w60"></div></div></div>' +
            '</div></div>' +
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
            section.querySelector('#ec-body').value = '';
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
                if (data.banned) {
                    banInfo = { banType: data.banType, reason: data.banReason, expiresAt: data.banExpiresAt };
                    updateFormVisibility(section);
                    return;
                }
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
                hasPendingActivity = true;
                loadComments(section, true);
                if (!starOnly) startModerationPoll(section);
            }).catch(function (err) { showError(section, 'Failed to post: ' + err.message); });
        });
    }

    function setupPagination(section) {
        section.querySelector('#ec-prev').addEventListener('click', function () { if (currentPage > 0) { currentPage--; loadComments(section); } });
        section.querySelector('#ec-next').addEventListener('click', function () { if (currentPage < Math.ceil(commentTotal / PAGE_SIZE) - 1) { currentPage++; loadComments(section); } });
    }
    function saveUserSettings(settings) {
        cfFetch(apiEndpoint + '/user-settings', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(Object.assign({ UserUuid: userUuid }, settings))
        }).catch(function () {});
    }

    function updateLangBtnLabel(btn) {
        if (languageFilter.length === 0) {
            btn.textContent = 'All Languages \u25be';
        } else if (languageFilter.length === 1) {
            btn.textContent = languageFilter[0] + ' \u25be';
        } else {
            btn.textContent = languageFilter.length + ' selected \u25be';
        }
    }

    var SORT_OPTIONS = [
        { value: 'newest', label: 'Newest' },
        { value: 'oldest', label: 'Oldest' },
        { value: 'best', label: 'Best Rating' },
        { value: 'worst', label: 'Worst Rating' },
        { value: 'popular', label: 'Most Popular' },
        { value: 'most_replied', label: 'Most Replied' }
    ];

    function getSortLabel(val) {
        for (var i = 0; i < SORT_OPTIONS.length; i++) {
            if (SORT_OPTIONS[i].value === val) return SORT_OPTIONS[i].label;
        }
        return 'Newest';
    }

    function setupToolbar(section) {
        var sortBtn = section.querySelector('#ec-sort-btn');
        var sortDropdown = section.querySelector('#ec-sort-dropdown');
        var langBtn = section.querySelector('#ec-lang-btn');
        var langDropdown = section.querySelector('#ec-lang-dropdown');
        var censorToggle = section.querySelector('#ec-censor-toggle');

        // Build sort dropdown items
        SORT_OPTIONS.forEach(function (opt) {
            var item = document.createElement('div');
            item.className = 'ec-drop-item' + (opt.value === currentSort ? ' selected' : '');
            item.dataset.value = opt.value;
            item.textContent = opt.label;
            item.addEventListener('click', function () {
                currentSort = opt.value;
                sortBtn.textContent = opt.label + ' \u25be';
                sortDropdown.classList.remove('open');
                var items = sortDropdown.querySelectorAll('.ec-drop-item');
                for (var i = 0; i < items.length; i++) {
                    items[i].classList.toggle('selected', items[i].dataset.value === currentSort);
                }
                currentPage = 0;
                saveUserSettings({ SortPreference: currentSort });
                loadComments(section, true);
            });
            sortDropdown.appendChild(item);
        });

        // Build language dropdown checkboxes
        LANGUAGES.forEach(function (lang) {
            var item = document.createElement('label');
            item.className = 'ec-drop-item';
            var cb = document.createElement('input');
            cb.type = 'checkbox';
            cb.value = lang;
            cb.addEventListener('change', function () {
                if (this.checked) {
                    if (languageFilter.indexOf(lang) === -1) languageFilter.push(lang);
                } else {
                    var idx = languageFilter.indexOf(lang);
                    if (idx !== -1) languageFilter.splice(idx, 1);
                }
                updateLangBtnLabel(langBtn);
                currentPage = 0;
                saveUserSettings({ LanguageFilter: languageFilter });
                loadComments(section, true);
            });
            item.appendChild(cb);
            item.appendChild(document.createTextNode(lang));
            langDropdown.appendChild(item);
        });

        // Toggle sort dropdown
        sortBtn.addEventListener('click', function (e) {
            e.stopPropagation();
            langDropdown.classList.remove('open');
            sortDropdown.classList.toggle('open');
        });

        // Toggle language dropdown
        langBtn.addEventListener('click', function (e) {
            e.stopPropagation();
            sortDropdown.classList.remove('open');
            langDropdown.classList.toggle('open');
        });

        // Close all dropdowns when clicking outside
        document.addEventListener('click', function (e) {
            if (!sortDropdown.contains(e.target) && e.target !== sortBtn) {
                sortDropdown.classList.remove('open');
            }
            if (!langDropdown.contains(e.target) && e.target !== langBtn) {
                langDropdown.classList.remove('open');
            }
        });

        // Censor explicit toggle (button)
        censorToggle.addEventListener('click', function () {
            censorExplicit = !censorExplicit;
            this.classList.toggle('active', censorExplicit);
            saveUserSettings({ CensorExplicit: censorExplicit });
            loadComments(section, true);
        });
    }

    function applyToolbarState(section) {
        var sortBtn = section.querySelector('#ec-sort-btn');
        var sortDropdown = section.querySelector('#ec-sort-dropdown');
        var langBtn = section.querySelector('#ec-lang-btn');
        var langDropdown = section.querySelector('#ec-lang-dropdown');
        var censorToggle = section.querySelector('#ec-censor-toggle');

        if (sortBtn) sortBtn.textContent = getSortLabel(currentSort) + ' \u25be';
        if (sortDropdown) {
            var items = sortDropdown.querySelectorAll('.ec-drop-item');
            for (var i = 0; i < items.length; i++) {
                items[i].classList.toggle('selected', items[i].dataset.value === currentSort);
            }
        }
        if (censorToggle) censorToggle.classList.toggle('active', censorExplicit);

        // Sync language checkboxes
        if (langDropdown) {
            var checkboxes = langDropdown.querySelectorAll('input[type="checkbox"]');
            checkboxes.forEach(function (cb) {
                cb.checked = languageFilter.indexOf(cb.value) !== -1;
            });
        }
        if (langBtn) updateLangBtnLabel(langBtn);
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

    function buildSkeletons(count) {
        var widths = ['w80', 'w60', 'w45', 'w70', 'w35'];
        var html = '';
        for (var i = 0; i < count; i++) {
            html += '<div class="ec-skel">' +
                '<div class="ec-skel-bone ec-skel-avatar"></div>' +
                '<div class="ec-skel-body">' +
                '<div class="ec-skel-bone ec-skel-line w45" style="height:8px;margin-bottom:2px;"></div>' +
                '<div class="ec-skel-bone ec-skel-line ' + widths[i % widths.length] + '"></div>' +
                '<div class="ec-skel-bone ec-skel-line ' + widths[(i + 2) % widths.length] + '"></div>' +
                '</div></div>';
        }
        return html;
    }

    function loadComments(section, bustCache) {
        if (!currentMediaKey || !apiEndpoint || isLoading) return;
        isLoading = true;
        var list = section.querySelector('#ec-list'), scroll = section.querySelector('#ec-scroll');
        var hasExisting = list.children.length > 0 && !list.querySelector('.ec-skel');
        if (hasExisting) list.classList.add('ec-fading'); else list.innerHTML = buildSkeletons(5);

        var url = apiEndpoint + '/comments?mediaKey=' + encodeURIComponent(currentMediaKey) + '&limit=' + PAGE_SIZE + '&offset=' + (currentPage * PAGE_SIZE) + '&sort=' + currentSort;
        if (serverLocalOnly && serverGuid) url += '&serverGuid=' + encodeURIComponent(serverGuid);
        if (languageFilter.length > 0) url += '&language=' + encodeURIComponent(languageFilter.join(','));
        if (bustCache) url += '&_t=' + Date.now();

        // Only refetch pending if user has posted something this session
        var pendingPromise = hasPendingActivity ? fetchMyPending() : Promise.resolve();

        Promise.all([
            cfFetch(url).then(function (r) { return r.json(); }),
            pendingPromise
        ]).then(function (results) {
            var data = results[0];
            commentTotal = data.total; isLoading = false; list.classList.remove('ec-fading'); list.innerHTML = '';

            // Render pending comments at the top (only on first page)
            if (currentPage === 0 && pendingComments.length > 0) {
                pendingComments
                    .filter(function (c) { return !c.ParentCommentId; })
                    .forEach(function (c) {
                        var el = createPendingCommentEl(c, false);
                        list.appendChild(el);
                    });
            }

            if (data.summary) renderSummary(section, data.summary, data.total);

            if (data.comments.length === 0 && pendingComments.length === 0) {
                list.innerHTML = '<div class="ec-empty">No comments in this view. Try adjusting your filters.</div>';
                section.querySelector('#ec-pager').style.display = 'none'; return;
            }

            data.comments.forEach(function (c) { appendComment(section, list, c); });
            scroll.scrollTop = 0; updatePager(section);
        }).catch(function (err) { isLoading = false; list.classList.remove('ec-fading'); showError(section, 'Failed to load: ' + err.message); });
    }

    function createPendingCommentEl(c, isReply) {
        var div = document.createElement('div');
        div.className = 'ec-c' + (isReply ? ' reply' : '');
        div.dataset.commentId = c.CommentId;

        var name = c.AuthorDisplayName || 'Anonymous';

        if (c.ModerationStatus === 'denied') {
            div.classList.add('ec-denied');
            div.innerHTML =
                renderAvatar(name, c.AvatarBlob, 'opacity:0.5;') +
                '<div class="ec-c-body">' +
                '<div class="ec-c-top"><span class="ec-c-author" style="opacity:0.5;">' + esc(name) + '</span>' +
                (c.StarRating ? '<span class="ec-c-rating">\u2605 ' + c.StarRating + '/10</span>' : '') +
                '<span class="ec-c-date">' + formatDate(c.CreatedAt) + '</span></div>' +
                '<div class="ec-denied-body">' + WARNING_SVG + ' Comment denied</div>' +
                '<div class="ec-denied-reason">' + esc(c.DenialReason || 'Did not meet community guidelines') + '</div>' +
                '</div>';
        } else {
            div.classList.add('ec-awaiting');
            div.innerHTML =
                renderAvatar(name, c.AvatarBlob) +
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
            bars += '<rect x="' + x + '" y="' + y + '" width="' + (barW - 2) + '" height="' + bH + '" rx="1.5" fill="#f5c518" fill="' + (c > 0 ? 'color-mix(in srgb, #f5c518 85%, transparent)': 'color-mix(in srgb, currentColor 20%, transparent)') + '"/>';
            bars += '<text x="' + (x + (barW - 2) / 2) + '" y="' + (h - pad) + '" text-anchor="middle" font-size="6" fill="color-mix(in srgb, currentColor 60%, transparent)">' + i + '</text>';
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

    function autoGrowTextarea(textarea) {
        if (!textarea) return;

        var minHeight = 46;

        if (!textarea.value) {
            textarea.style.height = minHeight + 'px';
            return;
        }

        textarea.style.height = 'auto';
        var nextHeight = Math.max(minHeight, textarea.scrollHeight);

        if (Math.abs(nextHeight - textarea.offsetHeight) > 1) {
            textarea.style.height = nextHeight + 'px';
        }
    }

    function appendComment(section, list, comment) {
        var el = createCommentEl(comment, false);
        list.appendChild(el);
        wireActions(section, list, el, comment, false);

        var isExplicitCollapsed = censorExplicit && comment.Explicit === 1;

        if (!isExplicitCollapsed) {
            var pendingReplies = pendingComments.filter(function (c) {
                return c.ParentCommentId === comment.CommentId;
            });

            (comment.Replies || []).forEach(function (r) {
                var re = createCommentEl(r, true);
                list.appendChild(re);
                wireActions(section, list, re, r, true);
            });

            pendingReplies.forEach(function (r) {
                var re = createPendingCommentEl(r, true);
                list.appendChild(re);
            });

            if (userModerationStatus !== 'denied') {
                var replyForm = document.createElement('div');
                replyForm.className = 'ec-reply-inline';
                replyForm.id = 'ec-rf-' + comment.CommentId;
                replyForm.innerHTML =
                    '<div class="ec-reply-main">' +
                    '<textarea class="ec-textarea" id="ec-rt-' + comment.CommentId + '" placeholder="Reply..." maxlength="' + MAX_CHARS + '"></textarea>' +
                    '<div class="ec-reply-char-count" id="ec-rc-' + comment.CommentId + '">0 / ' + MAX_CHARS + '</div>' +
                    '</div>' +
                    '<div class="ec-reply-actions">' +
                    '<button class="ec-btn ec-reply-post" data-id="' + comment.CommentId + '">Reply</button>' +
                    '<button class="ec-reply-cancel" data-id="' + comment.CommentId + '" type="button">Cancel</button>' +
                    '</div>';
                list.appendChild(replyForm);

                var replyTextarea = replyForm.querySelector('#ec-rt-' + comment.CommentId);
                var replyCounter = replyForm.querySelector('#ec-rc-' + comment.CommentId);
                var replyPostBtn = replyForm.querySelector('.ec-reply-post');
                var cancelBtn = replyForm.querySelector('.ec-reply-cancel');

                function resetReplyForm() {
                    if (replyTextarea) {
                        replyTextarea.value = '';
                        replyTextarea.style.height = '46px';
                    }
                    if (replyCounter) {
                        replyCounter.textContent = '0 / ' + MAX_CHARS;
                        replyCounter.classList.remove('ec-over');
                    }
                    replyForm.classList.remove('open');
                }

                if (replyTextarea) {
                    replyTextarea.maxLength = MAX_CHARS;
                    autoGrowTextarea(replyTextarea);

                    replyTextarea.addEventListener('input', function () {
                        var len = this.value.length;

                        if (len > MAX_CHARS) {
                            this.value = this.value.substring(0, MAX_CHARS);
                            len = this.value.length;
                        }

                        if (replyCounter) {
                            replyCounter.textContent = len + ' / ' + MAX_CHARS;
                            replyCounter.classList.toggle('ec-over', len >= MAX_CHARS);
                        }

                        autoGrowTextarea(this);
                    });
                }

                if (replyPostBtn) {
                    replyPostBtn.addEventListener('click', function () {
                        var pid = this.dataset.id;
                        var ta = section.querySelector('#ec-rt-' + pid);
                        var body = ta ? ta.value.trim() : '';

                        if (!body || !userUuid) return;

                        if (body.length > MAX_CHARS) {
                            showError(section, 'Reply exceeds ' + MAX_CHARS + ' character limit.');
                            return;
                        }

                        cfFetch(apiEndpoint + '/comments', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                MediaKey: currentMediaKey,
                                MediaTitle: currentItemName,
                                UserUuid: userUuid,
                                Body: body,
                                StarRating: null,
                                ParentCommentId: pid
                            })
                        }).then(function (r) { return r.json(); }).then(function (data) {
                            if (data.banned) {
                                banInfo = { banType: data.banType, reason: data.banReason, expiresAt: data.banExpiresAt };
                                updateFormVisibility(section);
                                return;
                            }
                            if (data.nameFlagged) {
                                showError(section, 'Your display name has been flagged. Update your name in plugin settings.');
                                return;
                            }
                            var replyBody = body;
                            resetReplyForm();

                            var pendingReply = {
                                CommentId: data.CommentId,
                                AuthorDisplayName: displayName,
                                Body: replyBody,
                                CreatedAt: new Date().toISOString(),
                                ModerationStatus: 'awaiting',
                                ParentCommentId: pid,
                                StarRating: null,
                                AvatarBlob: userAvatarBlob
                            };
                            pendingComments.push(pendingReply);

                            var pendingEl = createPendingCommentEl(pendingReply, true);
                            var rf = section.querySelector('#ec-rf-' + pid);
                            if (rf) {
                                list.insertBefore(pendingEl, rf);
                            }

                            hasPendingActivity = true;
                            startModerationPoll(section);
                        }).catch(function (err) {
                            showError(section, 'Failed to post reply: ' + err.message);
                        });
                    });
                }

                if (cancelBtn) {
                    cancelBtn.addEventListener('click', function () {
                        resetReplyForm();
                    });
                }
            }

            var approvedReplyCount = (comment.Replies || []).length;
            var pendingReplyCount = pendingReplies.length;
            var remaining = (comment.ReplyCount || 0) - approvedReplyCount - pendingReplyCount;

            if (remaining > 0) {
                var moreBtn = document.createElement('button');
                moreBtn.className = 'ec-show-more';
                moreBtn.textContent = 'Show ' + remaining + ' more ' + (remaining === 1 ? 'reply' : 'replies');
                moreBtn.addEventListener('click', function () {
                    loadRemainingReplies(section, list, comment.CommentId, moreBtn, approvedReplyCount);
                });
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
        if (reportedSet[c.CommentId]) div.classList.add('ec-user-reported');
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
                renderAvatar(name, c.AvatarBlob) +
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
            renderAvatar(name, c.AvatarBlob) +
            '<div class="ec-c-body">' +
            '<div class="ec-c-top"><span class="ec-c-author">' + esc(name) + '</span>' +
            spoilerBadge +
            (c.StarRating ? '<span class="ec-c-rating">\u2605 ' + c.StarRating + '/10</span>' : '') +
            '<span class="ec-c-date">' + formatDate(c.CreatedAt) + '</span>' +
            '<button class="ec-hide-btn" data-id="' + c.CommentId + '" title="Hide comment">' + EYE_SVG + '</button>' +
            '</div>' +
            textHtml +
            '<div class="ec-reported-bar">' + FLAG_SVG + ' This comment has been reported and is awaiting moderator review</div>' +
            '<div class="ec-c-foot">' +
            '<button class="ec-c-act ec-like-btn' + (reaction === 'like' ? ' ec-liked' : '') + '" data-id="' + c.CommentId + '">' + (reaction === 'like' ? '\u2665' : '\u2661') + ' ' + (c.LikeCount || 0) + '</button>' +
            '<button class="ec-c-act ec-dislike-btn' + (reaction === 'dislike' ? ' ec-disliked' : '') + '" data-id="' + c.CommentId + '">' + THUMB_DOWN_SVG + ' ' + (c.DislikeCount || 0) + '</button>' +
            (!isReply && userModerationStatus !== 'denied' && !banInfo ? '<button class="ec-c-act ec-reply-toggle" data-id="' + c.CommentId + '">\u21a9 Reply</button>' : '') +
            (!isOwn ? '<button class="ec-report-btn' + (reportedSet[c.CommentId] ? ' ec-reported' : '') + '" data-id="' + c.CommentId + '" title="Report comment">' + FLAG_SVG + (reportedSet[c.CommentId] ? ' Reported' : '') + '</button>' : '') +
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
                if (form) {
                    form.classList.toggle('open');
                    if (form.classList.contains('open')) {
                        var ta = form.querySelector('textarea');
                        if (ta) {
                            autoGrowTextarea(ta);
                            ta.focus();
                        }
                    }
                }
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

        // Report button with reason picker
        var reportBtn = el.querySelector('.ec-report-btn');
        if (reportBtn && !reportBtn.classList.contains('ec-reported')) {
            reportBtn.addEventListener('click', function () {
                // Remove any existing picker
                var existing = document.querySelector('.ec-report-picker');
                if (existing) { existing.remove(); return; }

                var picker = document.createElement('div');
                picker.className = 'ec-report-picker';
                var reasons = [
                    { value: 'spam', label: 'Spam' },
                    { value: 'harassment', label: 'Harassment' },
                    { value: 'unmarked_spoiler', label: 'Unmarked Spoiler' },
                    { value: 'off_topic', label: 'Off-topic' },
                    { value: 'inappropriate', label: 'Inappropriate' }
                ];
                picker.innerHTML = '<div class="ec-report-title">Report reason:</div>' +
                    reasons.map(function (r) { return '<button class="ec-report-reason" data-reason="' + r.value + '">' + r.label + '</button>'; }).join('') +
                    '<div class="ec-report-other"><input class="ec-report-other-input" type="text" placeholder="Other reason..." maxlength="100"><button class="ec-report-other-submit">Submit</button></div>';

                function submitReport(reason) {
                    cfFetch(apiEndpoint + '/report', {
                        method: 'POST', headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ CommentId: comment.CommentId, UserUuid: userUuid, Reason: reason })
                    }).then(function (r) { return r.json(); }).then(function (data) {
                        if (data.ok) {
                            reportedSet[comment.CommentId] = true;
                            reportBtn.classList.add('ec-reported');
                            reportBtn.innerHTML = FLAG_SVG + ' Reported';
                            el.classList.add('ec-user-reported');
                        }
                        picker.remove();
                    }).catch(function () { picker.remove(); });
                }

                // Position fixed relative to button
                document.body.appendChild(picker);
                var rect = reportBtn.getBoundingClientRect();
                var pickerH = picker.offsetHeight;
                var spaceAbove = rect.top;
                var spaceBelow = window.innerHeight - rect.bottom;

                picker.style.left = Math.min(rect.right - picker.offsetWidth, window.innerWidth - picker.offsetWidth - 8) + 'px';
                if (spaceAbove > pickerH || spaceAbove > spaceBelow) {
                    picker.style.top = (rect.top - pickerH - 4) + 'px';
                } else {
                    picker.style.top = (rect.bottom + 4) + 'px';
                }

                picker.querySelectorAll('.ec-report-reason').forEach(function (btn) {
                    btn.addEventListener('click', function () { submitReport(btn.dataset.reason); });
                });

                var otherInput = picker.querySelector('.ec-report-other-input');
                var otherSubmit = picker.querySelector('.ec-report-other-submit');
                otherSubmit.addEventListener('click', function () {
                    var text = otherInput.value.trim();
                    if (text) submitReport('other:' + text);
                });
                otherInput.addEventListener('keydown', function (e) {
                    if (e.key === 'Enter') { var text = otherInput.value.trim(); if (text) submitReport('other:' + text); }
                });

                // Close picker when clicking outside or scrolling
                function removePicker() {
                    picker.remove();
                    document.removeEventListener('click', closePicker);
                    window.removeEventListener('scroll', closeOnScroll, true);
                }
                function closePicker(e) {
                    if (!picker.contains(e.target) && e.target !== reportBtn) removePicker();
                }
                function closeOnScroll() { removePicker(); }
                setTimeout(function () {
                    document.addEventListener('click', closePicker);
                    window.addEventListener('scroll', closeOnScroll, true);
                }, 0);
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
                }).then(function () {
                    var toRemove;
                    var countToSubtract;

                    if (isReply) {
                        toRemove = [el];
                        countToSubtract = 1;
                    } else {
                        toRemove = collectCommentGroup(el);
                        countToSubtract = 1 + (comment.ReplyCount || 0);
                    }

                    removeCommentElements(toRemove, function () {
                        commentTotal = Math.max(0, commentTotal - countToSubtract);
                        updatePager(section);

                        var metaEl = section.querySelector('.ec-avg-meta');
                        if (metaEl) {
                            metaEl.textContent = metaEl.textContent.replace(/\d+ comments?/, commentTotal + ' comment' + (commentTotal !== 1 ? 's' : ''));
                        }

                        var remaining = list.querySelectorAll('.ec-c');
                        if (remaining.length === 0) {
                            list.innerHTML = '<div class="ec-empty">No comments yet. Be the first!</div>';
                            section.querySelector('#ec-summary').style.display = 'none';
                            section.querySelector('#ec-pager').style.display = 'none';
                        }
                    });
                });
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
        var repliesUrl = apiEndpoint + '/replies?parentId=' + encodeURIComponent(parentId) + '&offset=' + skipCount;
        if (serverLocalOnly && serverGuid) repliesUrl += '&serverGuid=' + encodeURIComponent(serverGuid);
        cfFetch(repliesUrl)
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

    function transitionToApproved(el, snapshot, section, list) {
        var isReply = el.classList.contains('reply');
        var commentId = el.dataset.commentId;
        var commentObj = {
            CommentId: commentId,
            AuthorDisplayName: snapshot.AuthorDisplayName,
            Body: snapshot.Body,
            CreatedAt: snapshot.CreatedAt,
            StarRating: snapshot.StarRating,
            AvatarBlob: snapshot.AvatarBlob,
            AuthorUuid: userUuid,
            LikeCount: 0,
            DislikeCount: 0,
            ModerationStatus: 'approved',
            Explicit: 0,
            ReplyCount: 0
        };
        var newEl = createCommentEl(commentObj, isReply);

        // Add temporary approved badge
        var topRow = newEl.querySelector('.ec-c-top');
        if (topRow) {
            var badge = document.createElement('span');
            badge.className = 'ec-mod-badge ec-approved-badge';
            badge.innerHTML = '&#10003; Approved';
            topRow.insertBefore(badge, topRow.children[1] || null);
            setTimeout(function () {
                badge.classList.add('ec-removing');
                setTimeout(function () { if (badge.parentNode) badge.remove(); }, 250);
            }, 3000);
        }

        if (el.parentNode) el.parentNode.replaceChild(newEl, el);
        wireActions(section, list, newEl, commentObj, isReply);
    }

    function transitionToDenied(el, pending) {
        var isReply = el.classList.contains('reply');
        var newEl = createPendingCommentEl(pending, isReply);
        if (el.parentNode) el.parentNode.replaceChild(newEl, el);
    }

    function showError(section, msg) { var el = section.querySelector('#ec-error'); if (el) { el.textContent = msg; el.style.display = 'block'; } }
    function esc(str) { if (!str) return ''; return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }

    function collectCommentGroup(el) {
        var elements = [el];
        var sib = el.nextElementSibling;
        while (sib) {
            if (sib.classList.contains('ec-c') && !sib.classList.contains('reply')) break;
            elements.push(sib);
            sib = sib.nextElementSibling;
        }
        return elements;
    }

    function removeCommentElements(elements, callback) {
        elements.forEach(function (node) { node.classList.add('ec-removing'); });
        setTimeout(function () {
            elements.forEach(function (node) { if (node.parentNode) node.parentNode.removeChild(node); });
            if (callback) callback();
        }, 250);
    }

    init();
    startObserver();

    function EmbyCommentsPlugin() { this.id = 'a4b7c2d1-e5f6-4a3b-8c9d-0e1f2a3b4c5d'; this.name = 'Emby Comments'; }
    return EmbyCommentsPlugin;
});