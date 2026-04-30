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
    var showOverallRatings = false;
    var LANGUAGES = ['English', 'Español', 'Français', 'Deutsch', 'Português', 'Italiano', 'Nederlands', 'Русский', '日本語', '한국어', '中文', 'العربية', 'हिन्दी', 'Türkçe', 'Polski', 'Svenska'];
    var LANG_ENGLISH_MAP = { 'Español': 'Spanish', 'Français': 'French', 'Deutsch': 'German', 'Português': 'Portuguese', 'Italiano': 'Italian', 'Nederlands': 'Dutch', 'Русский': 'Russian', '日本語': 'Japanese', '한국어': 'Korean', '中文': 'Chinese', 'العربية': 'Arabic', 'हिन्दी': 'Hindi', 'Türkçe': 'Turkish', 'Polski': 'Polish', 'Svenska': 'Swedish' };
    var LANG_TO_CODE = {'English':'en','Español':'es','Français':'fr','Deutsch':'de','Português':'pt','Italiano':'it','Nederlands':'nl','Русский':'ru','日本語':'ja','한국어':'ko','中文':'zh','العربية':'ar','हिन्दी':'hi','Türkçe':'tr','Polski':'pl','Svenska':'sv','Spanish':'es','French':'fr','German':'de','Portuguese':'pt','Italian':'it','Dutch':'nl','Russian':'ru','Japanese':'ja','Korean':'ko','Chinese':'zh','Arabic':'ar','Hindi':'hi','Turkish':'tr','Polish':'pl','Swedish':'sv'};
    var CODE_TO_LANG = {};
    Object.keys(LANG_TO_CODE).forEach(function(k) { CODE_TO_LANG[LANG_TO_CODE[k]] = k; });
    var userLangCode = (navigator.language || 'en').split('-')[0].toLowerCase();
    if (!CODE_TO_LANG[userLangCode]) userLangCode = 'en';
    var sessionToken = null;
    var initResolve = null;
    var initReject = null;
    var initReady = new Promise(function (resolve, reject) { initResolve = resolve; initReject = reject; });
    var serverLocalOnly = false;
    var banInfo = null;
    var serverBanInfo = null;
    var banAppealStatus = null;    // null | { appealStatus: 'pending'|'denied', adminResponse: string|null }
    var banLiftPendingAck = null;  // null | { reversalMessage: string|null } — set when ban lifted by appeal, cleared after user clicks OK
    var needsGuidelinesAcceptance = false;
    var guidelinesPostBan = false;
    var serviceError = false;
    var pendingRefresh = null;
    var banSocket = null;
    var banSocketRetries = 0;
    var initRetries = 0;
    var MAX_INIT_RETRIES = 5;
    var tokenExpiresAt = null;
    var tokenRefreshTimer = null;

    var THUMB_DOWN_SVG = '<svg viewBox="0 0 24 24" width="12" height="12" style="vertical-align:-1px;"><path fill="currentColor" d="M19 15h4V3h-4m-4 0H6.2c-.7 0-1.3.4-1.6 1l-2.5 5.9c-.1.2-.1.4-.1.6V12c0 1.1.9 2 2 2h6.3l-1 4.6c-.1.5.1 1 .4 1.4l.5.5 6.7-6.7c.3-.3.5-.7.5-1.1V5c0-1.1-.9-2-2-2z"/></svg>';
    var EYE_SVG = '<svg viewBox="0 0 24 24" width="14" height="14" style="vertical-align:-2px;"><path fill="currentColor" d="M12 4.5C7 4.5 2.7 7.6 1 12c1.7 4.4 6 7.5 11 7.5s9.3-3.1 11-7.5c-1.7-4.4-6-7.5-11-7.5zm0 12.5c-2.8 0-5-2.2-5-5s2.2-5 5-5 5 2.2 5 5-2.2 5-5 5zm0-8c-1.7 0-3 1.3-3 3s1.3 3 3 3 3-1.3 3-3-1.3-3-3-3z"/></svg>';
    var EYE_OFF_SVG = '<svg viewBox="0 0 24 24" width="14" height="14" style="vertical-align:-2px;"><path fill="currentColor" d="M12 7c2.8 0 5 2.2 5 5 0 .6-.1 1.3-.4 1.8l2.9 2.9c1.5-1.3 2.7-2.9 3.5-4.7-1.7-4.4-6-7.5-11-7.5-1.4 0-2.7.3-4 .7l2.2 2.2c.5-.3 1.2-.4 1.8-.4zM2 4.3l2.3 2.3.4.4C3.2 8.3 2 10 1 12c1.7 4.4 6 7.5 11 7.5 1.5 0 3-.3 4.4-.8l.4.4 3 3 1.3-1.3L3.3 3 2 4.3zm5.5 5.5l1.6 1.6c0 .2-.1.4-.1.6 0 1.7 1.3 3 3 3 .2 0 .4 0 .6-.1l1.6 1.6c-.7.3-1.4.5-2.2.5-2.8 0-5-2.2-5-5 0-.8.2-1.5.5-2.2zm4.3-.8l3.1 3.1V12c0-1.7-1.3-3-3-3h-.1z"/></svg>';
    var TRASH_SVG = '<svg viewBox="0 0 24 24" width="12" height="12" style="vertical-align:-1px;"><path fill="currentColor" d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg>';
    var WARNING_SVG = '<svg viewBox="0 0 24 24" width="14" height="14" style="vertical-align:-2px;"><path fill="currentColor" d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z"/></svg>';
    var SHIELD_SVG = '<svg viewBox="0 0 24 24" width="12" height="12" style="vertical-align:-1px;"><path fill="currentColor" d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm-1 17.93C7.05 17.74 5 14.49 5 11V6.3l7-3.11 7 3.11V11c0 3.49-2.05 6.74-6 7.93V18h-1v.93zM10 14.17l-2.59-2.58L6 13l4 4 8-8-1.41-1.42L10 14.17z"/></svg>';
    var FLAG_SVG = '<svg viewBox="0 0 24 24" width="12" height="12" style="vertical-align:-1px;"><path fill="currentColor" d="M14.4 6l-.4-2H5v17h2v-7h5.6l.4 2H19V6h-4.6z"/></svg>';
    var GLOBE_SVG = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 117.17 122.88" width="14" height="14" style="vertical-align:-2px;"><path fill="currentColor" fill-rule="evenodd" d="M23.46,98.8l24-7.22-4.24,7.8c8.69,7.36,17.64,9.33,27.58,5.08-9.36,14.77-23.85,16.47-36,10.47l-4.33,7.95-7-24.08ZM23,35.33h9.93V32.77a.33.33,0,0,1,.33-.33H37.8a.33.33,0,0,1,.33.33v2.56h10a.33.33,0,0,1,.33.33v4.75a.32.32,0,0,1-.33.32H46.27a21.5,21.5,0,0,1-.91,4,25,25,0,0,1-1.73,4A32,32,0,0,1,41.55,52c-.72,1-1.51,2-2.35,3a40.33,40.33,0,0,0,4.63,4.61l0,0a55.4,55.4,0,0,0,5.82,4.28.32.32,0,0,1,.1.45l-2.35,3.68a.35.35,0,0,1-.46.1,60.53,60.53,0,0,1-6.24-4.58,44.58,44.58,0,0,1-5-4.9c-1.29,1.23-2.65,2.43-4.07,3.58-1.61,1.29-3.29,2.54-5,3.73a.33.33,0,0,1-.46-.08l-2.47-3.59a.31.31,0,0,1,.08-.45c1.69-1.17,3.34-2.4,4.91-3.68,1.39-1.13,2.72-2.3,3.95-3.51a39.71,39.71,0,0,1-3.15-5.61,44.72,44.72,0,0,1-2.43-6.63.34.34,0,0,1,.23-.4l4.21-1.18a.32.32,0,0,1,.4.23,39.2,39.2,0,0,0,1.92,5.38,37.33,37.33,0,0,0,2.32,4.39c.55-.69,1.07-1.37,1.55-2.06s1.06-1.64,1.51-2.48a19.68,19.68,0,0,0,1.29-2.91,18.87,18.87,0,0,0,.69-2.69H23a.32.32,0,0,1-.33-.32V35.66a.33.33,0,0,1,.33-.33Zm49.5,4.26h32.38a12.38,12.38,0,0,1,12.33,12.34V78a12.38,12.38,0,0,1-12.33,12.34h-1l-.66,9.89a2.62,2.62,0,0,1-4.19,2L83.25,90.35H63.18A12.38,12.38,0,0,1,50.86,78.53H38.67L20.35,93A4.57,4.57,0,0,1,13,89l.8-10.55a14.92,14.92,0,0,1-9.38-4.35l-.28-.3A14.94,14.94,0,0,1,0,63.56V35.71a15,15,0,0,1,15-15H57.49a14.91,14.91,0,0,1,10.57,4.39l.28.29a15,15,0,0,1,4.12,10.28v3.88Zm31.69-14.72L79.31,28.23l5.41-7c-7.42-8.63-16-12-26.43-9.35C69.85-1.26,84.43-.67,95.52,7.17L101,0l3.11,24.87ZM91.58,70.09h-8l-1.48,5H74.89c2.4-6.37,5.18-14,7.59-20.4.87-2.3,1.86-6.12,5-6.12s4.36,3.5,5.27,5.92l7.71,20.71H93.1l-1.52-5.14Zm-1.21-4.9-2.79-8.78-2.8,8.78ZM15,25.32H57.49A10.43,10.43,0,0,1,67.88,35.71V63.56A10.42,10.42,0,0,1,57.49,74H37.09L17.53,89.37,18.69,74H15A10.41,10.41,0,0,1,4.58,63.56V35.71A10.42,10.42,0,0,1,15,25.32Z"/></svg>';


    var avatarColors = [
        '#e74c3c', '#e67e22', '#f1c40f', '#2ecc71', '#1abc9c',
        '#3498db', '#9b59b6', '#e84393', '#00cec9', '#6c5ce7'
    ];

    function hashColor(name) {
        var hash = 0;
        for (var i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
        return avatarColors[Math.abs(hash) % avatarColors.length];
    }

    var SAFE_DATA_URL_RE = /^data:image\/(jpeg|jpg|png|gif|webp);base64,[A-Za-z0-9+/=]+$/i;
    var SAFE_HTTP_URL_RE = /^https?:\/\//i;

    function isSafeAvatarUrl(u) {
        if (!u || typeof u !== 'string') return false;
        if (u.length > 200000) return false;
        if (u.indexOf('data:') === 0) return SAFE_DATA_URL_RE.test(u);
        if (SAFE_HTTP_URL_RE.test(u)) return true;
        // Relative URL — will be passed through ApiClient.getUrl, treated as safe path on Emby host
        return /^[A-Za-z0-9_\-./]+$/.test(u);
    }

    function renderAvatar(name, avatarUrl, extraStyle) {
        var style = 'background:' + hashColor(name) + ';' + (extraStyle || '');
        var letter = esc(name.charAt(0));
        if (avatarUrl && isSafeAvatarUrl(avatarUrl)) {
            var resolvedUrl = (avatarUrl.indexOf('data:') === 0 || SAFE_HTTP_URL_RE.test(avatarUrl)) ? avatarUrl : ApiClient.getUrl(avatarUrl);
            return '<div class="ec-avatar" style="' + style + '">' + letter + '<img src="' + esc(resolvedUrl) + '" onerror="this.style.display=\'none\'"></div>';
        }
        return '<div class="ec-avatar" style="' + style + '">' + letter + '</div>';
    }

    function init() {
        if (initRetries >= MAX_INIT_RETRIES) {
            if (initReject) {
                var err = new Error('init permanently failed');
                err.isServiceError = true;
                initReject(err);
            }
            return;
        }
        if (!ApiClient.getCurrentUserId()) {
            setTimeout(init, 1000);
            return;
        }
        initRetries++;

        ApiClient.getJSON(ApiClient.getUrl('communitycomments/config')).then(function (config) {
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
                    url: ApiClient.getUrl('communitycomments/init'),
                    dataType: 'json',
                    contentType: 'application/json',
                    data: JSON.stringify({ UserKey: userKey, DisplayName: displayName })
                });
            }).then(function (data) {
                if (data.error) {
                    if (data.needsAdmin) {
                        // Plugin not yet provisioned — retry slowly waiting for an admin to log in
                        setTimeout(init, 5000);
                    } else {
                        // Emby responded but the worker failed (CF down, rate-limited, etc.)
                        // No point retrying — reject immediately so the service error shows now
                        if (initReject) {
                            var e = new Error('worker error');
                            e.isServiceError = true;
                            initReject(e);
                        }
                    }
                    return;
                }
                userUuid = data.UserUuid;
                sessionToken = data.token;
                tokenExpiresAt = data.expiresAt || null;
                userAvatarBlob = data.AvatarBlob || null;
                initRetries = 0;
                initResolve();
                scheduleTokenRefresh();
            }).catch(function () { setTimeout(init, 3000); });
        }).catch(function (err) {
            var status = err && (err.status || err.statusCode);
            if (status === 401) {
                var userId = ApiClient.getCurrentUserId();
                ApiClient.getCurrentUser(userId).then(function () {
                    setTimeout(init, 3000);
                }).catch(function () {
                    initRetries = 0;
                });
            } else {
                setTimeout(init, 3000);
            }
        });
    }

    function refreshConfig() {
        return ApiClient.getJSON(ApiClient.getUrl('communitycomments/config')).then(function (config) {
            serverLocalOnly = !!config.ServerLocalCommentsOnly;
        }).catch(function () { /* keep existing value */ });
    }

    function scheduleTokenRefresh() {
        if (tokenRefreshTimer) clearTimeout(tokenRefreshTimer);
        if (!tokenExpiresAt) return;
        var msUntilExpiry = new Date(tokenExpiresAt).getTime() - Date.now();
        var msUntilRefresh = Math.max(msUntilExpiry - 5 * 60 * 1000, 60 * 1000);
        tokenRefreshTimer = setTimeout(function () {
            refreshToken().then(function () {
                scheduleTokenRefresh();
            }).catch(function () {
                tokenRefreshTimer = setTimeout(scheduleTokenRefresh, 5 * 60 * 1000);
            });
        }, msUntilRefresh);
    }

    function refreshToken() {
        var userId = ApiClient.getCurrentUserId();
        var userKey = serverGuid + ':' + userId;
        return ApiClient.ajax({
            type: 'POST',
            url: ApiClient.getUrl('communitycomments/init'),
            dataType: 'json',
            contentType: 'application/json',
            data: JSON.stringify({ UserKey: userKey, DisplayName: displayName })
        }).then(function (data) {
            if (data.token) sessionToken = data.token;
            if (data.UserUuid) userUuid = data.UserUuid;
            if (data.AvatarBlob) userAvatarBlob = data.AvatarBlob;
            if (data.expiresAt) { tokenExpiresAt = data.expiresAt; scheduleTokenRefresh(); }
        });
    }

    function cfFetch(url, options) {
        options = options || {};
        options.headers = options.headers || {};
        options.headers['X-EC-Token'] = sessionToken;
        function doFetch() {
            return fetch(url, options).catch(function () {
                var err = new Error('network error');
                err.isServiceError = true;
                throw err;
            });
        }
        return doFetch().then(function (r) {
            if (r.status === 401) {
                return refreshToken().then(function () {
                    options.headers['X-EC-Token'] = sessionToken;
                    return doFetch();
                });
            }
            if (r.status === 503) {
                return r.json().catch(function () { return {}; }).then(function (data) {
                    if (data.emergency) {
                        var err = new Error('emergency');
                        err.isEmergency = true;
                        err.emergencyMessage = data.message || null;
                        throw err;
                    }
                    var err = new Error('service unavailable');
                    err.isServiceError = true;
                    throw err;
                });
            }
            if (r.status === 429) {
                var err = new Error('rate limited');
                err.isServiceError = true;
                throw err;
            }
            return r;
        });
    }

    // Exchange the long-lived session token for a short-lived single-use WebSocket
    // ticket. Tickets are sent in the WS URL query string; tokens are not, because
    // WS URLs leak via Referer, browser history, and proxy logs.
    function fetchWsTicket() {
        if (!apiEndpoint || !sessionToken) return Promise.reject(new Error('no session'));
        return cfFetch(apiEndpoint + '/ws-ticket', { method: 'POST' })
            .then(function (r) { return r.json(); })
            .then(function (data) {
                if (!data || !data.ticket) throw new Error('no ticket');
                return data.ticket;
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

    function isUserWriting(section) {
        var mainTextarea = section.querySelector('#ec-body');
        if (mainTextarea && mainTextarea.value.trim().length > 0) return true;
        var replyTextareas = section.querySelectorAll('.ec-reply-inline textarea');
        for (var i = 0; i < replyTextareas.length; i++) {
            if (replyTextareas[i].value.trim().length > 0) return true;
        }
        return false;
    }

    function loadCommentsOrDefer(section, bustCache) {
        if (isUserWriting(section)) {
            pendingRefresh = { bustCache: bustCache };
        } else {
            loadComments(section, bustCache);
        }
    }

    function cleanup() {
        var old = document.getElementById('communitycomments-section');
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
        serverBanInfo = null;
        banAppealStatus = null;
        banLiftPendingAck = null;
        needsGuidelinesAcceptance = false;
        guidelinesPostBan = false;
        serviceError = false;
        stopBanListener();
        stopModerationListener();
        stopFeedListener();
        banSocketRetries = 0;
        moderationSocketRetries = 0;
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
        if (anchor && !document.getElementById('communitycomments-section')) { checkAndInject(itemId); return; }
        if (attempts >= 50) return;

        // Use MutationObserver for instant detection, fall back to polling
        var observer = new MutationObserver(function () {
            var a = getVisibleAnchor();
            if (a && !document.getElementById('communitycomments-section')) {
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
        if (!anchor || document.getElementById('communitycomments-section')) return;

        lastInjectedItemId = itemId;

        // Inject skeleton section immediately — before any API calls
        var section = document.createElement('div');
        section.id = 'communitycomments-section';
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
                return warmupListeners();
            }).then(function () {
                startBanListener(section);
                startModerationListener(section);
                startFeedListener(section);
            }).catch(function (err) {
                if (err && err.isEmergency) {
                    showServiceError(section, err.emergencyMessage);
                } else if (err && err.isServiceError) {
                    showServiceError(section, null);
                }
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
                banAppealStatus = data.banAppeal || null;
                banLiftPendingAck = data.banLiftAckPending || null;
                serverBanInfo = data.serverBan || null;
                needsGuidelinesAcceptance = data.needsGuidelinesAcceptance || false;
                guidelinesPostBan = data.guidelinesPostBan || false;
            })
            .catch(function (err) {
                if (err && (err.isEmergency || err.isServiceError)) throw err;
                reactionsMap = {}; hiddenSet = {}; reportedSet = {}; userModerationStatus = 'approved'; censorExplicit = false; banInfo = null; banAppealStatus = null; banLiftPendingAck = null; serverBanInfo = null; needsGuidelinesAcceptance = false; guidelinesPostBan = false;
            });
    }

    function fetchMyPending() {
        if (!apiEndpoint || !userUuid || !currentMediaKey) return Promise.resolve();
        return cfFetch(apiEndpoint + '/my-pending?userUuid=' + encodeURIComponent(userUuid) + '&mediaKey=' + encodeURIComponent(currentMediaKey))
            .then(function (r) { return r.json(); })
            .then(function (data) { pendingComments = data || []; })
            .catch(function () { pendingComments = []; });
    }

    function showServiceError(section, message) {
        serviceError = true;
        stopModerationListener();
        stopFeedListener();
        var errorEl = section.querySelector('#ec-service-error');
        var contentEl = section.querySelector('#ec-content');
        if (errorEl) {
            if (message) {
                var msgEl = errorEl.querySelector('#ec-se-msg');
                if (msgEl) msgEl.textContent = message;
            }
            errorEl.style.display = 'flex';
        }
        if (contentEl) contentEl.style.display = 'none';
    }

    function clearServiceError(section) {
        serviceError = false;
        var errorEl = section.querySelector('#ec-service-error');
        var contentEl = section.querySelector('#ec-content');
        if (errorEl) errorEl.style.display = 'none';
        if (contentEl) contentEl.style.display = '';
        fetchMyState().then(function () {
            updateFormVisibility(section);
            loadCommentsOrDefer(section, false);
            startBanListener(section);
            startModerationListener(section);
            startFeedListener(section);
        }).catch(function (err) {
            if (err && (err.isEmergency || err.isServiceError)) {
                showServiceError(section, err.emergencyMessage || null);
            }
        });
    }

    function handleBanChange(section, previousBan) {
        var changed = (!previousBan && !banInfo) ? false
            : (!previousBan || !banInfo) ? true
            : previousBan.banType !== banInfo.banType || previousBan.expiresAt !== (banInfo.expiresAt || null);
        if (!changed) return;

        updateFormVisibility(section);

        if (banInfo) {
            // Close main comment form if open
            var mainForm = section.querySelector('#ec-form');
            if (mainForm) mainForm.classList.remove('open');
            var toggles = section.querySelectorAll('.ec-reply-toggle');
            for (var i = 0; i < toggles.length; i++) toggles[i].style.display = 'none';
            var openReplies = section.querySelectorAll('.ec-reply-inline.open');
            for (var j = 0; j < openReplies.length; j++) openReplies[j].classList.remove('open');
        } else if (previousBan && !banLiftPendingAck) {
            // Only restore comments (and reply toggles) after the user has acknowledged the lift
            loadCommentsOrDefer(section, false);
        }
    }

    function warmupListeners() {
        if (!apiEndpoint || !sessionToken) return Promise.resolve();
        return fetchWsTicket().then(function (ticket) {
            var url = apiEndpoint + '/ws-warmup?ticket=' + encodeURIComponent(ticket)
                + (currentMediaKey ? '&mediaKey=' + encodeURIComponent(currentMediaKey) : '');
            return cfFetch(url);
        }).catch(function () {});
    }

    function startBanListener(section) {
        if (banSocket && banSocket.readyState === WebSocket.OPEN) return;
        stopBanListener();
        if (!apiEndpoint || !userUuid || !sessionToken) return;

        fetchWsTicket().then(function (ticket) {
            if (banSocket && banSocket.readyState === WebSocket.OPEN) return;
            var wsUrl = apiEndpoint.replace('https://', 'wss://').replace('http://', 'ws://')
                + '/ban-ws?userUuid=' + encodeURIComponent(userUuid)
                + '&ticket=' + encodeURIComponent(ticket);
            connectBanSocket(section, wsUrl);
        }).catch(function () { /* will retry via reconnect logic on next event */ });
    }

    function connectBanSocket(section, wsUrl) {
        banSocket = new WebSocket(wsUrl);
        banSocket.onopen = function () {
            banSocketRetries = 0;
            if (serviceError) {
                clearServiceError(section);
            }
        };

        banSocket.onmessage = function (event) {
            try {
                var msg = JSON.parse(event.data);
                if (Object.prototype.hasOwnProperty.call(msg, 'emergency')) {
                    if (msg.emergency) {
                        showServiceError(section, msg.message || null);
                    } else {
                        clearServiceError(section);
                    }
                    return;
                }
                if (Object.prototype.hasOwnProperty.call(msg, 'serverBan')) {
                    var prevServerBan = serverBanInfo;
                    serverBanInfo = msg.serverBan || null;
                    // Server unban: guidelines must be re-accepted
                    if (msg.needsGuidelinesAcceptance) {
                        needsGuidelinesAcceptance = true;
                        guidelinesPostBan = true;
                    }
                    var serverBanChanged = (!!prevServerBan) !== (!!serverBanInfo);
                    if (serverBanChanged) {
                        updateFormVisibility(section);
                        loadCommentsOrDefer(section, true);
                    }
                } else {
                    var prev = banInfo;
                    banInfo = msg.ban || null;
                    if (msg.needsGuidelinesAcceptance !== undefined) {
                        needsGuidelinesAcceptance = !!msg.needsGuidelinesAcceptance;
                    }
                    if (msg.guidelinesPostBan !== undefined) {
                        guidelinesPostBan = !!msg.guidelinesPostBan;
                    } else if (!banInfo && prev && needsGuidelinesAcceptance) {
                        guidelinesPostBan = true; // fallback inference for older worker versions
                    }
                    if (msg.liftedByAppeal) {
                        banLiftPendingAck = { reversalMessage: msg.reversalMessage || null };
                        banAppealStatus = null;
                    } else if (msg.banAppealDenied) {
                        banAppealStatus = { appealStatus: 'denied', adminResponse: msg.denialReason || null };
                        // banInfo itself didn't change (ban still active), so handleBanChange will no-op — force the UI update directly
                        updateFormVisibility(section);
                        return;
                    }
                    handleBanChange(section, prev);
                }
            } catch (e) {}
        };

        banSocket.onclose = function () {
            banSocket = null;
            if (!document.getElementById('communitycomments-section')) return;
            if (!serviceError && banSocketRetries < 3) {
                banSocketRetries++;
                setTimeout(function () { startBanListener(section); }, 2000 * banSocketRetries);
            } else if (!serviceError) {
                showServiceError(section, null);
            } else {
                // Ban WS closed while in service error — retry slowly to detect recovery
                setTimeout(function () {
                    if (serviceError && document.getElementById('communitycomments-section')) {
                        startBanListener(section);
                    }
                }, 30000);
            }
        };
    }

    function stopBanListener() {
        if (banSocket) { banSocket.close(); banSocket = null; }
    }

    var moderationSocket = null;
    var moderationSocketRetries = 0;

    var feedSocket = null;
    var feedSocketRetries = 0;

    function animateRemoveComment(el) {
        var toRemove = [el];
        var sib = el.nextElementSibling;
        while (sib && !(sib.classList.contains('ec-c') && !sib.classList.contains('reply'))) {
            toRemove.push(sib);
            sib = sib.nextElementSibling;
        }
        toRemove.forEach(function(n) { n.classList.add('ec-fading-into'); });
        el.addEventListener('animationend', function() {
            toRemove.forEach(function(n) { if (n.parentNode) n.parentNode.removeChild(n); });
        }, { once: true });
    }

    function animateCountChange(btn, newCount, iconHtml) {
        var current = parseInt(btn.textContent.replace(/[^\d]/g, '') || '0');
        if (current === newCount) return;
        btn.innerHTML = iconHtml + ' ' + newCount;
        btn.classList.remove('ec-count-bumping');
        void btn.offsetWidth;
        btn.classList.add('ec-count-bumping');
        btn.addEventListener('animationend', function() {
            btn.classList.remove('ec-count-bumping');
        }, { once: true });
    }

    function applyFeedUpdate(section, list, freshData) {
        if (currentPage !== 0 || currentSort !== 'newest') {
            loadCommentsOrDefer(section, true);
            return;
        }
        var freshComments = freshData.comments || [];

        var currentMap = {};
        list.querySelectorAll('.ec-c:not(.reply):not(.ec-awaiting)').forEach(function(el) {
            var id = el.dataset.commentId;
            if (id) currentMap[id] = el;
        });

        var freshMap = {};
        freshComments.forEach(function(c) { freshMap[c.CommentId] = c; });

        // 1. Remove comments no longer present
        var removingIds = Object.keys(currentMap).filter(function(id) { return !freshMap[id]; });
        removingIds.forEach(function(id) { animateRemoveComment(currentMap[id]); });

        // 2. Insert new top-level comments at the position dictated by fresh data
        // order. Existing comments serve as positional anchors so a comment bumped
        // up from a later page (e.g., after a delete reduces total below page-0
        // capacity) lands at the bottom rather than the top.
        if (freshComments.length > 0) {
            var emptyEl = list.querySelector('.ec-empty');
            if (emptyEl) emptyEl.remove();
        }
        var insertRef = list.querySelector('.ec-c:not(.reply):not(.ec-awaiting)');
        var lastAnchorEnd = null;
        freshComments.forEach(function(c) {
            var existing = currentMap[c.CommentId];
            if (existing) {
                var endEl = existing;
                var sib = existing.nextElementSibling;
                while (sib && !(sib.classList.contains('ec-c') && !sib.classList.contains('reply'))) {
                    endEl = sib;
                    sib = sib.nextElementSibling;
                }
                lastAnchorEnd = endEl;
                return;
            }
            // Capture refNode BEFORE appendComment — appendComment appends to the
            // end of the list, so reading lastAnchorEnd.nextElementSibling after
            // would point to one of the just-appended elements.
            var refNode = lastAnchorEnd ? lastAnchorEnd.nextElementSibling : insertRef;
            var preCount = list.childElementCount;
            appendComment(section, list, c);
            var newEls = [];
            for (var i = preCount; i < list.childElementCount; i++) newEls.push(list.children[i]);
            newEls.forEach(function(ne) { list.insertBefore(ne, refNode); });
            lastAnchorEnd = newEls[newEls.length - 1];
            if (newEls[0]) {
                newEls[0].classList.add('ec-inserting');
                newEls[0].addEventListener('animationend', function() {
                    newEls[0].classList.remove('ec-inserting');
                }, { once: true });
            }
        });

        // 3. Update counts in-place for existing comments
        freshComments.forEach(function(c) {
            var el = currentMap[c.CommentId];
            if (!el) return;
            var likeBtn = el.querySelector('.ec-like-btn');
            var dislikeBtn = el.querySelector('.ec-dislike-btn');
            var userReaction = reactionsMap[c.CommentId] || null;
            if (likeBtn) animateCountChange(likeBtn, c.LikeCount, userReaction === 'like' ? '\u2665' : '\u2661');
            if (dislikeBtn) animateCountChange(dislikeBtn, c.DislikeCount, THUMB_DOWN_SVG);
        });

        // 4. Animate new/removed replies for existing parent comments
        freshComments.forEach(function(c) {
            var parentEl = currentMap[c.CommentId];
            if (!parentEl || !c.Replies) return;
            var freshReplies = c.Replies;

            var existingReplyIds = {};
            var lastReplyEl = null;
            var sib = parentEl.nextElementSibling;
            while (sib && !(sib.classList.contains('ec-c') && !sib.classList.contains('reply'))) {
                if (sib.classList.contains('ec-c') && sib.classList.contains('reply')) {
                    var rid = sib.dataset.commentId;
                    if (rid) existingReplyIds[rid] = sib;
                    lastReplyEl = sib;
                }
                sib = sib.nextElementSibling;
            }

            freshReplies.forEach(function(r) {
                if (existingReplyIds[r.CommentId]) return;
                var replyEl = createCommentEl(r, true);
                var afterEl = lastReplyEl || parentEl.nextElementSibling;
                var nextSib = afterEl ? afterEl.nextElementSibling : null;
                insertWithAnimation(list, replyEl, nextSib);
                wireActions(section, list, replyEl, r, true);
                lastReplyEl = replyEl;
            });

            Object.keys(existingReplyIds).forEach(function(rid) {
                var hasReply = freshReplies.some(function(r) { return r.CommentId === rid; });
                if (!hasReply) {
                    var replyEl = existingReplyIds[rid];
                    replyEl.classList.add('ec-fading-into');
                    replyEl.addEventListener('animationend', function() {
                        if (replyEl.parentNode) replyEl.parentNode.removeChild(replyEl);
                    }, { once: true });
                }
            });
        });

        if (freshData.total !== undefined) {
            commentTotal = freshData.total;
            updatePager(section);
        }
        if (freshData.summary !== undefined) {
            renderSummary(section, freshData.summary, freshData.overallSummary, freshData.total, freshData.overallTotal);
        }
        // If the fresh data has no comments, show empty state once removal animations finish
        if (freshComments.length === 0 && !list.querySelector('.ec-empty')) {
            var hasFilters = languageFilter.length > 0 || serverLocalOnly;
            var globalTotal = (freshData.overallTotal != null) ? freshData.overallTotal : freshData.total;
            var emptyMsg = (hasFilters && globalTotal > 0)
                ? 'No comments in this view. Try adjusting your filters.'
                : 'No comments yet. Be the first!';
            if (removingIds.length > 0) {
                // Wait for the last fade-out animation (0.8s) before inserting the empty state
                var lastRemoving = currentMap[removingIds[removingIds.length - 1]];
                lastRemoving.addEventListener('animationend', function () {
                    if (!list.querySelector('.ec-c:not(.ec-awaiting)') && !list.querySelector('.ec-empty')) {
                        list.innerHTML = '<div class="ec-empty">' + emptyMsg + '</div>';
                    }
                }, { once: true });
            } else {
                // Nothing was being removed — already empty, just ensure the placeholder is there
                list.innerHTML = '<div class="ec-empty">' + emptyMsg + '</div>';
            }
        }
    }

    function fetchAndDiffFeed(section) {
        if (isLoading) return;
        if (isUserWriting(section)) { pendingRefresh = { bustCache: true }; return; }
        var list = section.querySelector('#ec-list');
        if (!list) return;
        var url = apiEndpoint + '/comments?mediaKey=' + encodeURIComponent(currentMediaKey)
            + '&limit=' + PAGE_SIZE + '&offset=0&sort=' + currentSort
            + '&_t=' + Date.now();
        if (serverLocalOnly && serverGuid) url += '&serverGuid=' + encodeURIComponent(serverGuid);
        if (languageFilter.length > 0) url += '&language=' + encodeURIComponent(languageFilter.join(','));
        cfFetch(url).then(function(r) { return r.json(); })
            .then(function(data) { applyFeedUpdate(section, list, data); })
            .catch(function() {});
    }

    function startFeedListener(section) {
        stopFeedListener();
        if (!apiEndpoint || !currentMediaKey || !sessionToken) return;

        fetchWsTicket().then(function (ticket) {
            if (!currentMediaKey) return;
            var wsUrl = apiEndpoint.replace('https://', 'wss://').replace('http://', 'ws://')
                + '/feed-ws?mediaKey=' + encodeURIComponent(currentMediaKey)
                + '&ticket=' + encodeURIComponent(ticket);

            feedSocket = new WebSocket(wsUrl);
            feedSocket.onopen = function () { feedSocketRetries = 0; };

            feedSocket.onmessage = function () {
                fetchAndDiffFeed(section);
            };

            feedSocket.onclose = function () {
                feedSocket = null;
                if (!document.getElementById('communitycomments-section')) return;
                if (feedSocketRetries < 3) {
                    feedSocketRetries++;
                    setTimeout(function () { startFeedListener(section); }, 2000 * feedSocketRetries);
                }
            };
        }).catch(function () { /* retry via reconnect logic */ });
    }

    function stopFeedListener() {
        if (feedSocket) { feedSocket.close(); feedSocket = null; }
    }

    function startModerationListener(section) {
        stopModerationListener();
        if (!apiEndpoint || !userUuid || !sessionToken) return;

        fetchWsTicket().then(function (ticket) {
            var wsUrl = apiEndpoint.replace('https://', 'wss://').replace('http://', 'ws://')
                + '/moderation-ws?userUuid=' + encodeURIComponent(userUuid)
                + '&ticket=' + encodeURIComponent(ticket);

            moderationSocket = new WebSocket(wsUrl);
            moderationSocket.onopen = function () { moderationSocketRetries = 0; };

            moderationSocket.onmessage = function (event) {
                try {
                    var msg = JSON.parse(event.data);
                    handleModerationPush(section, msg);
                } catch (e) {}
            };

            moderationSocket.onclose = function () {
                moderationSocket = null;
                if (!document.getElementById('communitycomments-section')) return;
                if (moderationSocketRetries < 3) {
                    moderationSocketRetries++;
                    setTimeout(function () { startModerationListener(section); }, 2000 * moderationSocketRetries);
                }
            };
        }).catch(function () { /* retry via reconnect logic */ });
    }

    function stopModerationListener() {
        if (moderationSocket) { moderationSocket.close(); moderationSocket = null; }
    }

    function handleModerationPush(section, msg) {
        var commentId = msg.commentId;
        if (!commentId) return;

        var pendingIdx = -1;
        for (var i = 0; i < pendingComments.length; i++) {
            if (pendingComments[i].CommentId === commentId) { pendingIdx = i; break; }
        }
        if (pendingIdx === -1) {
            var list0 = section.querySelector('#ec-list');
            var el0 = list0 ? list0.querySelector('.ec-c[data-comment-id="' + commentId + '"]') : null;
            if (msg.status === 'denied' && el0) {
                // Admin denied an approved comment visible in the main feed.
                // Fetch the now-pending data and transition the element in-place.
                fetchMyPending().then(function () {
                    var fresh = null;
                    for (var i = 0; i < pendingComments.length; i++) {
                        if (pendingComments[i].CommentId === commentId) { fresh = pendingComments[i]; break; }
                    }
                    if (!fresh) return;
                    var freshEl = list0 ? list0.querySelector('.ec-c[data-comment-id="' + commentId + '"]') : null;
                    if (!freshEl) return;
                    if (msg.denialReason) fresh.DenialReason = msg.denialReason;
                    transitionToDenied(freshEl, fresh);
                    var deniedEl = list0.querySelector('.ec-c[data-comment-id="' + commentId + '"]');
                    var scroll0 = section.querySelector('#ec-scroll');
                    if (deniedEl && scroll0) highlightWhenVisible(deniedEl, scroll0, true);
                });
            } else if (!el0 && msg.status === 'approved') {
                // Admin approved a previously dismissed comment — reload to surface it.
                loadCommentsOrDefer(section, true);
            }
            // Cross-media push or element already gone: no action needed.
            return;
        }

        var pending = pendingComments[pendingIdx];
        var list = section.querySelector('#ec-list');
        var scroll = section.querySelector('#ec-scroll');
        if (!list) return;
        var el = list.querySelector('.ec-c[data-comment-id="' + commentId + '"]');
        if (!el) {
            // Pending element was removed (e.g., list rebuilt while awaiting moderation)
            if (msg.status === 'approved') loadCommentsOrDefer(section, true);
            pendingComments.splice(pendingIdx, 1);
            return;
        }

        var isReply = !!pending.ParentCommentId;
        var avatarSrc = pending.AvatarBlob || userAvatarBlob;
        if (!avatarSrc) {
            var existingImg = el.querySelector('.ec-avatar img');
            if (existingImg) avatarSrc = existingImg.src;
        }

        if (msg.status === 'denied') {
            pending.ModerationStatus = 'denied';
            pending.DenialReason = msg.denialReason || 'Comment did not meet community guidelines';
            transitionToDenied(el, pending);
            var deniedEl = list.querySelector('.ec-c[data-comment-id="' + commentId + '"]');
            if (deniedEl && scroll) highlightWhenVisible(deniedEl, scroll, true);
        } else if (msg.status === 'appeal_denied') {
            // Admin reviewed and denied the appeal — reset to dismissable state
            pending.AppealStatus = 'denied';
            pending.AdminResponse = msg.denialReason || null;
            var newEl = createPendingCommentEl(pending, isReply);
            if (el.parentNode) el.parentNode.replaceChild(newEl, el);
            var updatedEl = list.querySelector('.ec-c[data-comment-id="' + commentId + '"]');
            if (updatedEl && scroll) highlightWhenVisible(updatedEl, scroll, true);
        } else {
            var snapshot = {
                AuthorDisplayName: pending.AuthorDisplayName || displayName,
                Body: pending.Body,
                CreatedAt: pending.CreatedAt,
                StarRating: pending.StarRating,
                AvatarBlob: avatarSrc,
                ParentCommentId: pending.ParentCommentId
            };
            transitionToApproved(el, snapshot, section, list);

            var newEl = list.querySelector('.ec-c[data-comment-id="' + commentId + '"]');
            if (newEl && scroll) {
                if (isReply) {
                    repositionReply(newEl, list, pending.ParentCommentId, scroll);
                    highlightWhenVisible(newEl, scroll, false);
                } else {
                    var refNode = findSortInsertionPoint(list, snapshot);
                    repositionElement(newEl, list, refNode, scroll);
                    highlightWhenVisible(newEl, scroll, false);
                }
            }
        }
        pendingComments.splice(pendingIdx, 1);
    }

    function showGuidelinesModal(section) {
        var ACCEPT_LABEL = 'I Acknowledge and Accept the Community Comments Guidelines';
        var isPostBan = guidelinesPostBan; // capture at open time
        var overlay = document.createElement('div');
        overlay.className = 'ec-gl-overlay';
        overlay.innerHTML =
            '<div class="ec-gl-modal">' +
            '<div class="ec-gl-header"><h2>\uD83D\uDCCB Community Comments Guidelines</h2><button class="ec-gl-close" title="Close">\u2715</button></div>' +
            '<div class="ec-gl-body">' +

            (isPostBan
                ? '<div class="ec-gl-intro" style="background:rgba(231,76,60,0.12);border-color:rgba(231,76,60,0.35);color:#e74c3c">\u26A0\uFE0F Your posting access was suspended. Re-read these guidelines before you can post again, then accept them at the bottom.</div>'
                : '<div class="ec-gl-intro">\uD83D\uDC47 Scroll through all guidelines to enable the accept button</div>') +

            '<h3>\uD83C\uDF10 Before You Post</h3>' +
            '<div class="ec-gl-notice">' +
            '<p><strong>Posts are public across the entire network.</strong> Every comment and reply you submit is visible to every Community Comments user on every participating Emby server \u2014 not just users on your own server.</p>' +
            '<p><strong>You see the whole community by default.</strong> The comments you read here are drawn from across all participating servers, unless your server administrator has enabled local-only mode for your server.</p>' +
            '<p><strong>Every post is moderated.</strong> Comments and replies are screened by AI and reviewed by the Community Comments moderation team. Content that violates these guidelines will be denied and may trigger a ban.</p>' +
            '<p style="margin-bottom:0"><strong>Once submitted, your comment lives in the ecosystem.</strong> The moment you post, the content is transmitted to the Community Comments servers, may be cached, and is retained for moderation review. Treat every submission as permanent \u2014 post with care.</p>' +
            '</div>' +

            '<h3>\uD83E\uDD1D Community Standards</h3>' +
            '<p>Community Comments is a space for discussing movies and TV shows. By posting you agree to keep conversations respectful and on-topic.</p>' +

            '<h3>\uD83D\uDEAB Prohibited Content</h3>' +
            '<div class="ec-gl-rules-grid">' +
            '<span class="ec-gl-rule">\u274C Hate speech &amp; slurs</span>' +
            '<span class="ec-gl-rule">\u274C Harassment &amp; threats</span>' +
            '<span class="ec-gl-rule">\u274C Explicit or graphic content</span>' +
            '<span class="ec-gl-rule">\u274C Spam &amp; unsolicited advertising</span>' +
            '<span class="ec-gl-rule">\u274C AI manipulation (prompt injection)</span>' +
            '<span class="ec-gl-rule">\u274C Sharing others\u2019 personal information</span>' +
            '</div>' +
            '<p>Denied comments are visible only to you. Repeated violations escalate to a ban.</p>' +

            '<h3>\u26A1 User Bans</h3>' +
            '<div class="ec-gl-ban-cards">' +
            '<div class="ec-gl-ban-card hourly"><strong>\u23F1 Hourly Ban \u2014 Temporary</strong>Multiple denied comments within one hour triggers a temporary ban. You cannot post, reply, or interact until it expires automatically.</div>' +
            '<div class="ec-gl-ban-card permanent"><strong>\uD83D\uDD34 Permanent Ban \u2014 Requires Appeal</strong>Accumulating too many total denied comments results in a permanent ban. It does not expire on its own and requires an approved appeal to be removed.</div>' +
            '</div>' +

            '<h3>\uD83C\uDF10 Server Bans</h3>' +
            '<div class="ec-gl-ban-cards">' +
            '<div class="ec-gl-ban-card server"><strong>\uD83D\uDED1 Server-Level Suspension</strong>If your Emby server is suspended from Community Comments \u2014 due to policy violations or abuse originating from the server \u2014 <em>all users on that server</em> lose the ability to post, reply, or interact. Comments from suspended servers are hidden network-wide. Contact your server administrator if this affects you.</div>' +
            '</div>' +

            '<h3>\u2696\uFE0F Appeals</h3>' +
            '<p>If you believe a user ban was applied in error, tap the <strong>Appeal</strong> button in the ban notice. Appeals are reviewed by the Community Comments administration. The moderator\u2019s decision is final unless reversed by the admin.</p>' +
            '<p>After any ban is lifted \u2014 whether expired automatically or approved via appeal \u2014 you must re-read and re-accept these guidelines before posting again.</p>' +

            '<h3>\uD83D\uDEE0 Tools</h3>' +
            '<p><strong>Explicit Filter:</strong> Toggle <em>Censor explicit</em> in the toolbar to hide explicit language in comments.</p>' +
            '<p><strong>Reporting:</strong> Use the \uD83D\uDEA9 flag button on any comment to report it. Comments with enough reports are automatically escalated for moderator review.</p>' +

            '<h3>\u26A0\uFE0F Moderator Rights</h3>' +
            '<div class="ec-gl-callout">The Community Comments administration reserves the right to remove any comment, revoke commenting privileges, and ban any user or server at any time and for any reason \u2014 with or without prior notice and without obligation to provide an explanation. <strong>Participation in Community Comments is a privilege, not a right.</strong></div>' +

            '</div>' +
            '<div class="ec-gl-footer">' +
            '<div class="ec-gl-scroll-hint" id="ec-gl-hint">\u2193 Scroll to read all guidelines</div>' +
            '<button class="ec-gl-accept-btn" disabled>' + ACCEPT_LABEL + '</button>' +
            '</div>' +
            '</div>';

        document.body.appendChild(overlay);

        var glBody = overlay.querySelector('.ec-gl-body');
        var acceptBtn = overlay.querySelector('.ec-gl-accept-btn');
        var scrollHint = overlay.querySelector('#ec-gl-hint');

        function checkBottom() {
            if (glBody.scrollTop + glBody.clientHeight >= glBody.scrollHeight - 28) {
                acceptBtn.disabled = false;
                scrollHint.style.opacity = '0';
            }
        }
        glBody.addEventListener('scroll', checkBottom);
        setTimeout(checkBottom, 80); // unlock immediately if content fits

        overlay.querySelector('.ec-gl-close').addEventListener('click', function () {
            document.body.removeChild(overlay);
        });
        overlay.addEventListener('click', function (e) {
            if (e.target === overlay) document.body.removeChild(overlay);
        });

        acceptBtn.addEventListener('click', function () {
            acceptBtn.disabled = true;
            acceptBtn.textContent = 'Saving\u2026';
            cfFetch(apiEndpoint + '/accept-guidelines', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' }
            }).then(function (r) { return r.json(); }).then(function (data) {
                if (data.ok) {
                    needsGuidelinesAcceptance = false;
                    guidelinesPostBan = false;
                    document.body.removeChild(overlay);
                    updateFormVisibility(section);
                    loadCommentsOrDefer(section, false);
                } else {
                    acceptBtn.disabled = false;
                    acceptBtn.textContent = ACCEPT_LABEL;
                }
            }).catch(function () {
                acceptBtn.disabled = false;
                acceptBtn.textContent = ACCEPT_LABEL;
            });
        });
    }

    function updateFormVisibility(section) {
        var nameWarning = section.querySelector('#ec-name-warning');
        var banWarning = section.querySelector('#ec-ban-warning');
        var serverBanWarning = section.querySelector('#ec-server-ban-warning');
        var guidelinesGate = section.querySelector('#ec-guidelines-gate');
        var formToggle = section.querySelector('#ec-form-toggle');
        if (serverBanInfo) {
            nameWarning.style.display = 'none';
            banWarning.style.display = 'none';
            guidelinesGate.style.display = 'none';
            serverBanWarning.innerHTML =
                '<div style="display:flex;align-items:center;gap:0.5em;">' +
                '\uD83D\uDEAB <strong>YOUR SERVER IS CURRENTLY BANNED</strong>' +
                '</div>' +
                '<div style="margin-top:0.35em;font-size:0.9em;opacity:0.85;line-height:1.4;">' +
                'You cannot post comments, replies, or interact with content. Contact your server administrator for more information.' +
                '</div>';
            serverBanWarning.style.display = 'flex';
            formToggle.style.display = 'none';
        } else if (banLiftPendingAck) {
            // Ban was lifted by appeal — require acknowledgment before enabling form
            nameWarning.style.display = 'none';
            serverBanWarning.style.display = 'none';
            guidelinesGate.style.display = 'none';
            banWarning.classList.add('ec-ban-warning-lifted');
            banWarning.innerHTML =
                '<div style="display:flex;flex-direction:column;gap:0.4rem;width:100%">' +
                '<strong>\u2705 Your ban has been lifted.</strong>' +
                '<span>Please respect the community guidelines going forward.</span>' +
                (banLiftPendingAck.reversalMessage ? '<em style="opacity:0.85">' + esc(banLiftPendingAck.reversalMessage) + '</em>' : '') +
                '<button class="ec-ban-lift-ok" style="align-self:flex-start;margin-top:0.25rem">I Understand</button>' +
                '</div>';
            banWarning.style.display = 'flex';
            formToggle.style.display = 'none';
        } else if (banInfo) {
            nameWarning.style.display = 'none';
            serverBanWarning.style.display = 'none';
            guidelinesGate.style.display = 'none';
            banWarning.classList.remove('ec-ban-warning-lifted');
            if (banInfo.banType === 'permanent') {
                // Build ban message text
                var banMsgText = banInfo.isAdmin
                    ? WARNING_SVG + ' You have been permanently banned by a comments admin. Reason: ' + esc(banInfo.reason)
                    : WARNING_SVG + ' Your account has been permanently banned from posting comments due to repeated violations.';
                // Inline appeal state badge/button
                var appealBadge = '';
                var appealForm = '';
                if (banAppealStatus && banAppealStatus.appealStatus === 'pending') {
                    appealBadge = '<span class="ec-appeal-pending" style="flex-shrink:0" title="Your appeal is under review by a moderator.">\u23f3 Appeal submitted</span>';
                } else if (banAppealStatus && banAppealStatus.appealStatus === 'denied') {
                    var denialText = banAppealStatus.adminResponse
                        ? 'Appeal denied: ' + esc(banAppealStatus.adminResponse)
                        : 'Appeal denied.';
                    appealBadge = '<span class="ec-ban-appeal-denied-badge">' + denialText + '</span>';
                } else {
                    appealBadge = '<button class="ec-ban-appeal-btn" style="flex-shrink:0" title="Disagree with this decision? Submit an appeal for moderator review.">\u2197 Appeal</button>';
                    appealForm =
                        '<div class="ec-ban-appeal-form" id="ec-ban-af" style="display:none">' +
                        '<textarea class="ec-ban-appeal-textarea" placeholder="Describe why you believe this ban should be lifted\u2026" maxlength="1000"></textarea>' +
                        '<div class="ec-appeal-form-actions">' +
                        '<button class="ec-appeal-submit">Submit Appeal</button>' +
                        '<button class="ec-appeal-cancel">Cancel</button>' +
                        '</div></div>';
                }
                banWarning.innerHTML =
                    '<div style="display:flex;flex-direction:column;gap:0.25rem;width:100%">' +
                    '<div style="display:flex;align-items:center;gap:0.5rem">' +
                    '<span style="flex:1;line-height:1.4">' + banMsgText + '</span>' +
                    appealBadge +
                    '</div>' +
                    appealForm +
                    '</div>';
            } else if (banInfo.isAdmin) {
                var expiry = new Date(banInfo.expiresAt);
                banWarning.innerHTML = WARNING_SVG + ' You have been banned by a comments admin until ' + expiry.toLocaleTimeString() + '. Reason: ' + esc(banInfo.reason);
            } else {
                var expiry = new Date(banInfo.expiresAt);
                banWarning.innerHTML = WARNING_SVG + ' You are temporarily banned from posting comments until ' + expiry.toLocaleTimeString() + '. Reason: ' + esc(banInfo.reason);
            }
            banWarning.style.display = 'flex';
            formToggle.style.display = 'none';
        } else if (userModerationStatus === 'denied') {
            banWarning.style.display = 'none';
            serverBanWarning.style.display = 'none';
            guidelinesGate.style.display = 'none';
            nameWarning.style.display = 'flex';
            formToggle.style.display = 'none';
        } else if (needsGuidelinesAcceptance) {
            banWarning.style.display = 'none';
            serverBanWarning.style.display = 'none';
            nameWarning.style.display = 'none';
            guidelinesGate.style.display = 'flex';
            formToggle.style.display = 'none';
            var gateMsg = guidelinesGate.querySelector('#ec-gl-gate-msg');
            if (gateMsg) gateMsg.innerHTML = guidelinesPostBan
                ? '\u26A0\uFE0F Due to receiving a ban, you must re-read and re-accept the <strong>Community Comments guidelines</strong> before posting again.'
                : '\uD83D\uDCCB Before you can post, you must read and accept the <strong>Community Comments guidelines</strong>.';
            var openBtn = guidelinesGate.querySelector('#ec-guidelines-open');
            if (openBtn && !openBtn.dataset.wired) {
                openBtn.dataset.wired = '1';
                openBtn.addEventListener('click', function () { showGuidelinesModal(section); });
            }
        } else {
            banWarning.style.display = 'none';
            serverBanWarning.style.display = 'none';
            nameWarning.style.display = 'none';
            guidelinesGate.style.display = 'none';
            formToggle.style.display = '';
        }

        // Wire ban-warning dynamic buttons (re-wired each time innerHTML changes)
        var liftOkBtn = banWarning.querySelector('.ec-ban-lift-ok');
        if (liftOkBtn) {
            liftOkBtn.addEventListener('click', function () {
                liftOkBtn.disabled = true;
                cfFetch(apiEndpoint + '/ban-lift-ack', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ UserUuid: userUuid })
                }).finally(function () {
                    banLiftPendingAck = null;
                    banWarning.classList.remove('ec-ban-warning-lifted');
                    updateFormVisibility(section);
                    loadCommentsOrDefer(section, false);
                });
            });
        }
        var banAppealBtn = banWarning.querySelector('.ec-ban-appeal-btn');
        if (banAppealBtn) {
            banAppealBtn.addEventListener('click', function () {
                var form = banWarning.querySelector('#ec-ban-af');
                if (form) form.style.display = form.style.display === 'none' ? 'block' : 'none';
            });
        }
        var banAppealCancelBtn = banWarning.querySelector('#ec-ban-af .ec-appeal-cancel');
        if (banAppealCancelBtn) {
            banAppealCancelBtn.addEventListener('click', function () {
                var form = banWarning.querySelector('#ec-ban-af');
                if (form) form.style.display = 'none';
            });
        }
        var banAppealSubmitBtn = banWarning.querySelector('#ec-ban-af .ec-appeal-submit');
        if (banAppealSubmitBtn) {
            banAppealSubmitBtn.addEventListener('click', function () {
                var form = banWarning.querySelector('#ec-ban-af');
                var reason = form ? form.querySelector('.ec-ban-appeal-textarea').value.trim() : '';
                if (!reason) { if (form) form.querySelector('.ec-ban-appeal-textarea').focus(); return; }
                banAppealSubmitBtn.disabled = true;
                cfFetch(apiEndpoint + '/ban-appeal', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ UserUuid: userUuid, reason: reason })
                }).then(function (r) { return r.json(); }).then(function (data) {
                    if (data.ok) {
                        banAppealStatus = { appealStatus: 'pending', adminResponse: null };
                        updateFormVisibility(section);
                    } else {
                        banAppealSubmitBtn.disabled = false;
                        alert(data.error || 'Failed to submit appeal. Please try again.');
                    }
                }).catch(function () { banAppealSubmitBtn.disabled = false; });
            });
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
            '#communitycomments-section { font-family:inherit; color:inherit; position:relative; }' +
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
            '.ec-scope-row { padding:0 0 0.4em; }' +
            '.ec-scope-pill { display:inline-flex; border-radius:10px; border:1px solid color-mix(in srgb, currentColor 12%, transparent); overflow:hidden; }' +
            '.ec-scope-opt { background:none; border:none; color:inherit; font-family:inherit; font-size:0.7em; padding:1px 10px; cursor:pointer; opacity:0.4; transition:all 0.2s; line-height:1.5; white-space:nowrap; min-width:52px; text-align:center; }' +
            '.ec-scope-opt:hover { opacity:0.65; }' +
            '.ec-scope-opt.active { background:color-mix(in srgb, currentColor 10%, transparent); opacity:0.85; }' +
            '.ec-no-ratings { font-size:0.82em; opacity:0.4; padding:0.3em 0; font-style:italic; display:flex; align-items:center; gap:0.6em; }' +
            '.ec-loading-state .ec-form-toggle, .ec-loading-state .ec-toolbar, .ec-loading-state .ec-summary, .ec-loading-state .ec-scope-row { pointer-events:none; opacity:0.3; }' +
            '.ec-spark { flex-shrink:0; } .ec-spark svg { display:block; }' +
            '.ec-name-warning { display:none; align-items:center; gap:0.5em; padding:0.6em 1em; margin-bottom:0.6em; border-radius:8px; background:rgba(231,76,60,0.1); border:1px solid rgba(231,76,60,0.25); color:#e74c3c; font-size:0.85em; }' +
            '.ec-ban-warning { display:none; align-items:center; gap:0.5em; padding:0.6em 1em; margin-bottom:0.6em; border-radius:8px; background:rgba(231,76,60,0.1); border:1px solid rgba(231,76,60,0.25); color:#e74c3c; font-size:0.85em; }' +
            '.ec-server-ban-warning { display:none; flex-direction:column; padding:0.85em 1em; margin-bottom:0.6em; border-radius:8px; background:rgba(231,76,60,0.15); border:1px solid rgba(231,76,60,0.4); border-left:4px solid #e74c3c; color:#e74c3c; font-size:0.85em; }' +
            '.ec-guidelines-gate { display:none; flex-direction:column; gap:0.6em; padding:0.9em 1em; margin-bottom:0.6em; border-radius:8px; background:rgba(52,152,219,0.08); border:1px solid rgba(52,152,219,0.3); border-left:4px solid #3498db; font-size:0.85em; }' +
            '.ec-guidelines-gate p { margin:0; color:var(--theme-text-color,#e0e0e0); line-height:1.4; }' +
            '.ec-guidelines-open-btn { align-self:flex-start; background:rgba(52,152,219,0.15); border:1px solid rgba(52,152,219,0.4); border-radius:5px; color:#3498db; cursor:pointer; font-size:0.85em; padding:0.35em 0.9em; }' +
            '.ec-guidelines-open-btn:hover { background:rgba(52,152,219,0.25); }' +
            '.ec-gl-overlay { position:fixed; inset:0; z-index:9999; background:rgba(0,0,0,0.8); display:flex; align-items:center; justify-content:center; padding:1rem; }' +
            '.ec-gl-modal { background:#161625; border:1px solid rgba(255,255,255,0.1); border-radius:10px; display:flex; flex-direction:column; font-size:15px; max-height:90vh; max-width:680px; width:100%; box-shadow:0 8px 40px rgba(0,0,0,0.6); }' +
            '.ec-gl-header { align-items:center; background:rgba(52,152,219,0.08); border-bottom:1px solid rgba(255,255,255,0.08); border-radius:10px 10px 0 0; display:flex; justify-content:space-between; padding:0.9rem 1.25rem; }' +
            '.ec-gl-header h2 { color:#e0e0e0; font-size:1em; margin:0; }' +
            '.ec-gl-close { background:none; border:none; color:#888; cursor:pointer; font-size:1.1em; line-height:1; padding:0; }' +
            '.ec-gl-close:hover { color:#ccc; }' +
            '.ec-gl-body { color:#b8b8c8; font-size:1em; line-height:1.6; overflow-y:auto; padding:1.15rem 1.25rem; }' +
            '.ec-gl-body h3 { align-items:center; border-bottom:1px solid rgba(255,255,255,0.06); color:#ddd; display:flex; font-size:0.87em; gap:0.4em; letter-spacing:0.06em; margin:1.25em 0 0.55em; padding-bottom:0.25em; text-transform:uppercase; }' +
            '.ec-gl-body h3:first-child { margin-top:0; }' +
            '.ec-gl-body p { margin:0 0 0.55em; }' +
            '.ec-gl-body strong { color:#e0e0e0; }' +
            '.ec-gl-intro { background:rgba(52,152,219,0.07); border:1px solid rgba(52,152,219,0.2); border-radius:6px; color:#7aade0; font-size:0.93em; margin-bottom:1.1em; padding:0.55em 0.9em; text-align:center; }' +
            '.ec-gl-rules-grid { display:flex; flex-wrap:wrap; gap:0.4em; margin:0.35em 0 0.75em; }' +
            '.ec-gl-rule { background:rgba(231,76,60,0.07); border:1px solid rgba(231,76,60,0.18); border-radius:20px; color:#c0a0a0; display:inline-flex; font-size:0.9em; padding:0.25em 0.7em; }' +
            '.ec-gl-ban-cards { display:flex; flex-direction:column; gap:0.45em; margin:0.35em 0 0.2em; }' +
            '.ec-gl-ban-card { border-radius:6px; font-size:0.93em; line-height:1.5; padding:0.6em 0.85em; }' +
            '.ec-gl-ban-card strong { display:block; margin-bottom:0.2em; }' +
            '.ec-gl-ban-card.hourly { background:rgba(230,126,34,0.07); border:1px solid rgba(230,126,34,0.22); border-left:3px solid #e67e22; }' +
            '.ec-gl-ban-card.hourly strong { color:#e67e22; }' +
            '.ec-gl-ban-card.permanent { background:rgba(231,76,60,0.07); border:1px solid rgba(231,76,60,0.22); border-left:3px solid #e74c3c; }' +
            '.ec-gl-ban-card.permanent strong { color:#e74c3c; }' +
            '.ec-gl-ban-card.server { background:rgba(155,89,182,0.07); border:1px solid rgba(155,89,182,0.22); border-left:3px solid #9b59b6; }' +
            '.ec-gl-ban-card.server strong { color:#b07cd4; }' +
            '.ec-gl-callout { background:rgba(231,76,60,0.06); border:1px solid rgba(231,76,60,0.18); border-left:3px solid #e74c3c; border-radius:6px; font-size:0.93em; line-height:1.5; margin:0.35em 0 0; padding:0.65em 0.9em; }' +
            '.ec-gl-notice { background:rgba(243,156,18,0.06); border:1px solid rgba(243,156,18,0.22); border-left:3px solid #f39c12; border-radius:6px; font-size:0.93em; line-height:1.5; margin:0.35em 0 0.75em; padding:0.65em 0.9em; }' +
            '.ec-gl-notice p { margin:0 0 0.55em; }' +
            '.ec-gl-notice p:last-child { margin-bottom:0; }' +
            '.ec-gl-footer { border-top:1px solid rgba(255,255,255,0.08); padding:0.85rem 1.25rem; }' +
            '.ec-gl-scroll-hint { color:rgba(150,150,170,0.6); font-size:0.87em; margin-bottom:0.5em; text-align:center; transition:opacity 0.4s; }' +
            '.ec-gl-accept-btn { background:rgba(46,204,113,0.07); border:1px solid rgba(46,204,113,0.2); border-radius:6px; color:#4a8a5e; cursor:not-allowed; font-size:0.93em; padding:0.55em 1.25em; transition:background 0.2s,border-color 0.2s,color 0.2s; width:100%; }' +
            '.ec-gl-accept-btn:not(:disabled) { background:rgba(46,204,113,0.15); border-color:rgba(46,204,113,0.45); color:#2ecc71; cursor:pointer; }' +
            '.ec-gl-accept-btn:not(:disabled):hover { background:rgba(46,204,113,0.25); }' +
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
            '.ec-appeal-btn { background:none; border:1px solid rgba(155,89,182,0.5); border-radius:4px; color:rgba(155,89,182,0.85); cursor:pointer; font-size:0.72rem; padding:0.15rem 0.45rem; white-space:nowrap; flex-shrink:0; line-height:1; box-sizing:border-box; }' +
            '.ec-appeal-btn:hover { border-color:rgba(155,89,182,0.9); color:rgba(155,89,182,1); }' +
            '.ec-ban-appeal-btn { background:none; border:1px solid rgba(155,89,182,0.5); border-radius:4px; color:rgba(155,89,182,0.85); cursor:pointer; font-size:0.78rem; padding:0.2rem 0.6rem; white-space:nowrap; line-height:1; box-sizing:border-box; }' +
            '.ec-ban-appeal-btn:hover { border-color:rgba(155,89,182,0.9); color:rgba(155,89,182,1); }' +
            '.ec-ban-appeal-denied-badge { font-size:0.78rem; color:rgba(231,76,60,0.75); font-style:italic; flex-shrink:0; }' +
            '.ec-ban-appeal-form { margin-top:0.35rem; padding:0.5rem; background:rgba(0,0,0,0.2); border:1px solid rgba(155,89,182,0.25); border-radius:6px; box-sizing:border-box; }' +
            '.ec-ban-appeal-textarea { width:100%; max-width:100%; background:rgba(0,0,0,0.3); border:1px solid rgba(155,89,182,0.4); border-radius:4px; color:inherit; font-size:0.82rem; padding:0.3rem 0.4rem; resize:none; height:56px; font-family:inherit; box-sizing:border-box; }' +
            '.ec-ban-warning-lifted { background:rgba(52,152,219,0.1) !important; border-color:rgba(52,152,219,0.3) !important; color:rgba(52,152,219,0.95) !important; }' +
            '.ec-ban-lift-ok { background:rgba(52,152,219,0.15); border:1px solid rgba(52,152,219,0.4); border-radius:4px; color:rgba(52,152,219,0.9); cursor:pointer; font-size:0.82rem; padding:0.25rem 0.9rem; }' +
            '.ec-ban-lift-ok:hover { background:rgba(52,152,219,0.25); }' +
            '.ec-dismiss-denial { background:none; border:1px solid rgba(231,76,60,0.4); border-radius:4px; color:rgba(231,76,60,0.7); cursor:pointer; font-size:0.72rem; padding:0.15rem 0.4rem; white-space:nowrap; flex-shrink:0; line-height:1; box-sizing:border-box; }' +
            '.ec-dismiss-denial:hover { border-color:rgba(231,76,60,0.7); color:rgba(231,76,60,1); }' +
            '.ec-appeal-pending { font-size:0.72rem; color:rgba(155,89,182,0.8); white-space:nowrap; flex-shrink:0; }' +
            '.ec-appeal-form { margin-top:0.5rem; display:none; box-sizing:border-box; overflow:hidden; }' +
            '.ec-appeal-form.open { display:block; }' +
            '.ec-appeal-form textarea { width:100%; max-width:100%; background:rgba(0,0,0,0.3); border:1px solid rgba(155,89,182,0.4); border-radius:4px; color:inherit; font-size:0.78rem; padding:0.3rem 0.4rem; resize:none; height:52px; font-family:inherit; box-sizing:border-box; }' +
            '.ec-appeal-form-actions { display:flex; gap:0.4rem; margin-top:0.3rem; }' +
            '.ec-appeal-submit { background:rgba(155,89,182,0.2); border:1px solid rgba(155,89,182,0.5); border-radius:4px; color:rgba(155,89,182,0.9); cursor:pointer; font-size:0.78rem; padding:0.25rem 0.7rem; }' +
            '.ec-appeal-cancel { background:none; border:1px solid rgba(255,255,255,0.15); border-radius:4px; color:rgba(255,255,255,0.5); cursor:pointer; font-size:0.78rem; padding:0.25rem 0.7rem; }' +
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
            '.ec-interaction-banned { opacity:0.15 !important; cursor:not-allowed !important; pointer-events:none; }' +
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
            '.ec-translate-btn { background:none; border:none; color:#5dade2; opacity:0.45; cursor:pointer; display:inline-flex; align-items:center; gap:3px; font-size:0.72em; font-family:inherit; padding:2px 4px; border-radius:3px; transition:all 0.15s; }' +
            '.ec-translate-btn:hover { opacity:0.9; background:rgba(52,152,219,0.08); } .ec-translate-btn.ec-translating { opacity:0.2; pointer-events:none; }' +
            '.ec-show-original-btn { background:none; border:none; color:#5dade2; opacity:0.45; cursor:pointer; font-size:0.72em; font-family:inherit; padding:2px 4px; border-radius:3px; transition:all 0.15s; display:none; }' +
            '.ec-show-original-btn:hover { opacity:0.9; }' +
            '.ec-show-original-btn svg { transform:scaleX(-1); }' +
            '.ec-translated-note { font-size:0.8em; opacity:0.45; font-style:italic; }' +
            '.ec-show-more { background:none; border:none; color:var(--theme-accent-text-color, #00a4dc); cursor:pointer; font-size:0.75em; font-family:inherit; padding:0.4em 0.5em; opacity:0.8; transition:opacity 0.15s; width:fit-content; align-self:center; } .ec-show-more:hover { opacity:1; text-decoration:underline; }' +
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
            '@keyframes ec-slide-in { from { opacity:0; transform:translateY(-8px); } to { opacity:1; transform:translateY(0); } }' +
            '.ec-inserting { animation:ec-slide-in 0.6s ease-out; } .ec-inserting.ec-awaiting { animation:ec-slide-in 0.6s ease-out; opacity:0.5; }' +
            '@keyframes ec-count-bump { 0%,100%{transform:scale(1)} 50%{transform:scale(1.3)} }' +
            '.ec-count-bumping { animation:ec-count-bump 0.35s ease; display:inline-block; }' +
            '.ec-c.ec-highlight, .ec-c.reply.ec-highlight { background:rgba(46,204,113,0.12) !important; border-left:3px solid rgba(46,204,113,0.6); transition:background 1s ease-out, border-left-color 1s ease-out; }' +
            '.ec-c.ec-highlight-denied, .ec-c.reply.ec-highlight-denied { background:rgba(231,76,60,0.12) !important; border-left:3px solid rgba(231,76,60,0.6); transition:background 1s ease-out, border-left-color 1s ease-out; }' +
            '.ec-c.ec-highlight-fade { background:transparent !important; border-left-color:transparent !important; }' +
            '.ec-repositioning { box-shadow:0 2px 12px rgba(0,0,0,0.15); z-index:1; position:relative; }' +
            '.ec-show-more { position:relative; overflow:visible; } .ec-new-chip { position:absolute; top:-4px; right:-12px; width:10px; height:10px; background:#2ecc71; border-radius:50%; pointer-events:none; box-shadow:0 0 4px rgba(46,204,113,0.6); }' +
            '@keyframes ec-fade-into { from { opacity:1; transform:translateY(0); } to { opacity:0; transform:translateY(8px); } }' +
            '.ec-fading-into { animation:ec-fade-into 0.8s ease-in forwards; pointer-events:none; }' +
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
            '.ec-dropdown { display:none; position:fixed; background:color-mix(in srgb, currentColor 8%, transparent); backdrop-filter:blur(16px); -webkit-backdrop-filter:blur(16px); border:1px solid color-mix(in srgb, currentColor 10%, transparent); border-radius:8px; padding:4px 0; z-index:10000; box-shadow:0 4px 12px rgba(0,0,0,0.15); max-height:240px; overflow-y:auto; overflow-x:hidden; }' +
            '.ec-dropdown.open { display:block; }' +
            '.ec-drop-item { display:flex; align-items:center; gap:6px; padding:4px 10px; font-size:0.72em; opacity:0.55; cursor:pointer; white-space:nowrap; transition:background 0.1s; }' +
            '.ec-drop-item:hover { background:color-mix(in srgb, currentColor 5%, transparent); opacity:0.75; }' +
            '.ec-drop-item.selected { opacity:0.9; }' +
            '.ec-drop-item input[type="checkbox"] { margin:0; accent-color:var(--theme-accent-text-color, #00a4dc); }' +
            '.ec-censor-btn { background:color-mix(in srgb, currentColor 5%, transparent); border:1px solid color-mix(in srgb, currentColor 8%, transparent); border-radius:6px; color:inherit; font-size:0.72em; font-family:inherit; padding:0.3em 0.5em; cursor:pointer; opacity:0.7; transition:all 0.15s; line-height:1.4; white-space:nowrap; margin-left:auto; display:flex; align-items:center; gap:5px; }' +
            '.ec-censor-btn:hover { opacity:0.9; background:color-mix(in srgb, currentColor 8%, transparent); }' +
            '.ec-censor-btn.active { background:rgba(243,156,18,0.15); border-color:rgba(243,156,18,0.3); opacity:0.9; }' +
            '.ec-censor-btn.active:hover { background:rgba(243,156,18,0.25); }' +
            '.ec-service-error { align-items:center; display:flex; flex-direction:column; gap:0.6em; padding:2.5em 1.5em; text-align:center; }' +
            '.ec-se-icon { font-size:2em; opacity:0.6; }' +
            '.ec-se-title { color:var(--theme-text-color,#e0e0e0); font-size:1em; font-weight:600; opacity:0.8; }' +
            '.ec-se-msg { color:var(--theme-text-color,#e0e0e0); font-size:0.85em; max-width:380px; opacity:0.55; line-height:1.5; }' +
            '</style>' +
            '<h2 class="sectionTitle sectionTitle-cards padded-left padded-left-page padded-right">Community Comments</h2>' +
            '<div class="ec-service-error sectionTitle-cards padded-left padded-left-page padded-right" id="ec-service-error" style="display:none">' +
            '<div class="ec-se-icon">\u26A0\uFE0F</div>' +
            '<div class="ec-se-title" id="ec-se-title">Comments Unavailable</div>' +
            '<div class="ec-se-msg" id="ec-se-msg">Community Comments is experiencing technical difficulties. Please try again later.</div>' +
            '</div>' +
            '<div id="ec-content" class="ec-content ec-loading-state sectionTitle-cards padded-left padded-left-page padded-right">' +
            '<div class="ec-summary" id="ec-summary" style="display:none;"></div>' +
            '<div class="ec-scope-row" id="ec-scope-row" style="display:none;"></div>' +
            '<div class="ec-error" id="ec-error"></div>' +
            '<div class="ec-name-warning" id="ec-name-warning">' + WARNING_SVG + ' Your display name has been flagged as inappropriate. You cannot post comments or replies until you update your name in the plugin settings.</div>' +
            '<div class="ec-server-ban-warning" id="ec-server-ban-warning"></div>' +
            '<div class="ec-ban-warning" id="ec-ban-warning"></div>' +
            '<div class="ec-guidelines-gate" id="ec-guidelines-gate">' +
            '<p id="ec-gl-gate-msg">\uD83D\uDCCB Before you can post, you must read and accept the <strong>Community Comments guidelines</strong>.</p>' +
            '<button class="ec-guidelines-open-btn" id="ec-guidelines-open">View Guidelines \u2192</button>' +
            '</div>' +
            '<button class="ec-form-toggle" id="ec-form-toggle">\u270E  Write a comment...</button>' +
            '<div class="ec-form" id="ec-form">' +
            '<div class="ec-form-head">' +
            '<div class="ec-stars" id="ec-stars"><span data-value="1">\u2605</span><span data-value="2">\u2605</span><span data-value="3">\u2605</span><span data-value="4">\u2605</span><span data-value="5">\u2605</span><span data-value="6">\u2605</span><span data-value="7">\u2605</span><span data-value="8">\u2605</span><span data-value="9">\u2605</span><span data-value="10">\u2605</span></div>' +
            '<button class="ec-form-close" id="ec-form-close" title="Close">\u2715</button>' +
            '</div>' +            
            '<textarea class="ec-textarea" id="ec-body" placeholder="Share your thoughts..." maxlength="' + MAX_CHARS + '"></textarea>' +
            '<div class="ec-form-footer"><button class="ec-btn" id="ec-submit">Post</button><label class="ec-spoiler-check" title="Click this tag if your comment reveals plot points, twists, or endings"><input type="checkbox" id="ec-spoiler-cb"> Spoiler</label><span class="ec-char-count" id="ec-char-count">0 / ' + MAX_CHARS + '</span></div></div>' +
            '<div class="ec-toolbar" id="ec-toolbar">' +
            '<div class="ec-toolbar-group"><span class="ec-toolbar-label">Sort</span><div class="ec-drop-wrap"><button class="ec-toolbar-btn" id="ec-sort-btn">Newest \u25be</button><div class="ec-dropdown" id="ec-sort-dropdown"></div></div></div>' +
            '<div class="ec-toolbar-group"><span class="ec-toolbar-label">Language</span><div class="ec-drop-wrap"><button class="ec-toolbar-btn" id="ec-lang-btn">All Languages \u25be</button><div class="ec-dropdown" id="ec-lang-dropdown"></div></div></div>' +
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
            if (pendingRefresh) { var r = pendingRefresh; pendingRefresh = null; loadComments(section, r.bustCache); }
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
                if (data.serverBanned) {
                    showError(section, data.error || 'Your server has been suspended. Please contact your server administrator.');
                    return;
                }
                if (data.banned) {
                    banInfo = { banType: data.banType, reason: data.banReason, expiresAt: data.banExpiresAt, isAdmin: data.isAdmin || false };
                    updateFormVisibility(section);
                    var bToggles = section.querySelectorAll('.ec-reply-toggle');
                    for (var bi = 0; bi < bToggles.length; bi++) bToggles[bi].style.display = 'none';
                    var bReplies = section.querySelectorAll('.ec-reply-inline.open');
                    for (var bj = 0; bj < bReplies.length; bj++) bReplies[bj].classList.remove('open');
                    return;
                }
                if (data.nameFlagged) {
                    showError(section, 'Your display name has been flagged as inappropriate. Update your name in plugin settings to post comments and replies.');
                    return;
                }
                var postedRating = selectedRating > 0 ? selectedRating : null;
                textarea.value = '';
                counter.textContent = '0 / ' + MAX_CHARS;
                counter.classList.remove('ec-over');
                section.querySelector('#ec-spoiler-cb').checked = false;
                spoilerLabel.classList.remove('ec-checked');
                selectedRating = 0;
                section.querySelectorAll('#ec-stars span').forEach(function (s) { s.classList.remove('active'); });
                section.querySelector('#ec-form').classList.remove('open');
                section.querySelector('#ec-form-toggle').style.display = 'block';
                pendingRefresh = null; // user finished writing — no deferred refresh needed
                hasPendingActivity = true;

                if (starOnly) {
                    currentPage = 0;
                    loadComments(section, true);
                } else {
                    var pendingComment = {
                        CommentId: data.CommentId,
                        AuthorDisplayName: displayName,
                        Body: body,
                        CreatedAt: new Date().toISOString(),
                        ModerationStatus: 'awaiting',
                        ParentCommentId: null,
                        StarRating: postedRating,
                        AvatarBlob: userAvatarBlob
                    };
                    pendingComments.push(pendingComment);
                    var list = section.querySelector('#ec-list');
                    var empty = list.querySelector('.ec-empty');
                    if (empty) empty.remove();
                    var pendingEl = createPendingCommentEl(pendingComment, false);
                    insertWithAnimation(list, pendingEl, list.firstChild);
                }
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
                showOverallRatings = false;
                currentPage = 0;
                saveUserSettings({ LanguageFilter: languageFilter });
                loadComments(section, true);
            });
            item.appendChild(cb);
            item.appendChild(document.createTextNode(lang));
            langDropdown.appendChild(item);
        });

        var sortWrap = sortBtn.parentElement;
        var langWrap = langBtn.parentElement;

        var activeDropdown = null;
        var activeBtn = null;
        var scrollRaf = null;

        function positionDropdown() {
            if (!activeDropdown || !activeBtn) return;
            var rect = activeBtn.getBoundingClientRect();
            activeDropdown.style.top = (rect.bottom + 4) + 'px';
            activeDropdown.style.left = rect.left + 'px';
            activeDropdown.style.minWidth = rect.width + 'px';
        }

        function onScrollReposition() {
            if (!scrollRaf) {
                scrollRaf = requestAnimationFrame(function () {
                    scrollRaf = null;
                    positionDropdown();
                });
            }
        }

        var resizeObs = new ResizeObserver(function () {
            if (activeDropdown) positionDropdown();
        });

        function openDropdown(dropdown, btn) {
            document.body.appendChild(dropdown);
            dropdown.classList.add('open');
            activeDropdown = dropdown;
            activeBtn = btn;
            positionDropdown();
            window.addEventListener('scroll', onScrollReposition, true);
            resizeObs.observe(section);
        }

        function closeDropdown(dropdown, wrap) {
            if (activeDropdown === dropdown) {
                window.removeEventListener('scroll', onScrollReposition, true);
                resizeObs.disconnect();
                activeDropdown = null;
                activeBtn = null;
            }
            dropdown.classList.remove('open');
            dropdown.style.top = '';
            dropdown.style.left = '';
            dropdown.style.minWidth = '';
            if (dropdown.parentElement !== wrap) wrap.appendChild(dropdown);
        }

        // Toggle sort dropdown
        sortBtn.addEventListener('click', function (e) {
            e.stopPropagation();
            closeDropdown(langDropdown, langWrap);
            if (sortDropdown.classList.contains('open')) {
                closeDropdown(sortDropdown, sortWrap);
            } else {
                openDropdown(sortDropdown, sortBtn);
            }
        });

        // Toggle language dropdown
        langBtn.addEventListener('click', function (e) {
            e.stopPropagation();
            closeDropdown(sortDropdown, sortWrap);
            if (langDropdown.classList.contains('open')) {
                closeDropdown(langDropdown, langWrap);
            } else {
                openDropdown(langDropdown, langBtn);
            }
        });

        // Close all dropdowns when clicking outside
        document.addEventListener('click', function (e) {
            if (!sortDropdown.contains(e.target) && e.target !== sortBtn) {
                closeDropdown(sortDropdown, sortWrap);
            }
            if (!langDropdown.contains(e.target) && e.target !== langBtn) {
                closeDropdown(langDropdown, langWrap);
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
        var content = section.querySelector('.ec-content');
        if (content) content.classList.add('ec-loading-state');
        var list = section.querySelector('#ec-list'), scroll = section.querySelector('#ec-scroll');
        var hasExisting = list.children.length > 0 && !list.querySelector('.ec-skel');
        if (hasExisting) list.classList.add('ec-fading'); else list.innerHTML = buildSkeletons(5);

        var url = apiEndpoint + '/comments?mediaKey=' + encodeURIComponent(currentMediaKey) + '&limit=' + PAGE_SIZE + '&offset=' + (currentPage * PAGE_SIZE) + '&sort=' + currentSort;
        if (serverLocalOnly && serverGuid) url += '&serverGuid=' + encodeURIComponent(serverGuid);
        if (languageFilter.length > 0) {
            var expanded = [];
            languageFilter.forEach(function (lang) {
                expanded.push(lang);
                if (LANG_ENGLISH_MAP[lang]) expanded.push(LANG_ENGLISH_MAP[lang]);
            });
            url += '&language=' + encodeURIComponent(expanded.join(','));
        }
        if (bustCache) url += '&_t=' + Date.now();

        // Only refetch pending if user has posted something this session
        var pendingPromise = hasPendingActivity ? fetchMyPending() : Promise.resolve();

        Promise.all([
            cfFetch(url).then(function (r) { return r.json(); }),
            pendingPromise
        ]).then(function (results) {
            var data = results[0];
            commentTotal = data.total; isLoading = false; list.classList.remove('ec-fading'); list.innerHTML = '';
            var content = section.querySelector('.ec-content');
            if (content) content.classList.remove('ec-loading-state');

            // Render pending comments at the top (only on first page)
            if (currentPage === 0 && pendingComments.length > 0) {
                pendingComments
                    .filter(function (c) { return !c.ParentCommentId; })
                    .forEach(function (c) {
                        var el = createPendingCommentEl(c, false);
                        list.appendChild(el);
                    });
            }

            renderSummary(section, data.summary, data.overallSummary, data.total, data.overallTotal);

            if (data.comments.length === 0 && pendingComments.length === 0) {
                var hasFilters = languageFilter.length > 0 || serverLocalOnly;
                var globalTotal = (data.overallTotal != null) ? data.overallTotal : data.total;
                var emptyMsg = (hasFilters && globalTotal > 0)
                    ? 'No comments in this view. Try adjusting your filters.'
                    : 'No comments yet. Be the first!';
                list.innerHTML = '<div class="ec-empty">' + emptyMsg + '</div>';
                section.querySelector('#ec-pager').style.display = 'none'; return;
            }

            data.comments.forEach(function (c) { appendComment(section, list, c); });
            scroll.scrollTop = 0; updatePager(section);
        }).catch(function (err) {
            isLoading = false; list.classList.remove('ec-fading');
            var content = section.querySelector('.ec-content');
            if (content) content.classList.remove('ec-loading-state');
            showError(section, 'Failed to load: ' + err.message);
        });
    }

    function createPendingCommentEl(c, isReply) {
        var div = document.createElement('div');
        div.className = 'ec-c' + (isReply ? ' reply' : '');
        div.dataset.commentId = c.CommentId;

        var name = c.AuthorDisplayName || 'Anonymous';

        if (c.ModerationStatus === 'denied') {
            div.classList.add('ec-denied');
            var appealPending  = c.AppealStatus === 'pending';
            var appealDenied   = c.AppealStatus === 'denied';
            // Buttons row: differs by appeal state
            var buttonsHtml;
            if (appealPending) {
                buttonsHtml = '<span class="ec-appeal-pending" title="Your appeal is under review by a moderator. You\u2019ll be notified of the decision.">\u23f3 Appeal submitted</span>';
            } else {
                buttonsHtml =
                    (appealDenied ? '' :
                        '<button class="ec-appeal-btn" data-id="' + esc(c.CommentId) + '" title="Disagree with this decision? Submit an appeal and a moderator will review your comment.">\u2197 Appeal</button> ') +
                    '<button class="ec-dismiss-denial" data-id="' + esc(c.CommentId) + '" title="Remove this notification from your feed">\u00d7 Dismiss</button>';
            }
            var deniedBadgeTitle = appealDenied
                ? 'A moderator reviewed your appeal and upheld the original decision.'
                : 'This comment was flagged and did not meet community guidelines.';
            var deniedBadgeHtml = appealDenied
                ? '<div class="ec-denied-body" title="' + deniedBadgeTitle + '">' + WARNING_SVG + ' Appeal denied' +
                  (c.AdminResponse ? '<span class="ec-denied-reason" style="margin-left:0.5rem;font-style:italic">' + esc(c.AdminResponse) + '</span>' : '') +
                  '</div>'
                : '<div class="ec-denied-body" title="' + deniedBadgeTitle + '">' + WARNING_SVG + ' Comment denied</div>';
            div.innerHTML =
                renderAvatar(name, c.AvatarBlob, 'opacity:0.5;') +
                '<div class="ec-c-body">' +
                '<div class="ec-c-top"><span class="ec-c-author" style="opacity:0.5;">' + esc(name) + '</span>' +
                (c.StarRating ? '<span class="ec-c-rating">\u2605 ' + c.StarRating + '/10</span>' : '') +
                '<span class="ec-c-date">' + formatDate(c.CreatedAt) + '</span></div>' +
                deniedBadgeHtml +
                '<div style="display:flex;align-items:center;gap:0.5rem;margin-top:0.2rem">' +
                '<span class="ec-denied-reason" style="flex:1;margin-top:0">' + esc(c.DenialReason || 'Did not meet community guidelines') + '</span>' +
                buttonsHtml +
                '</div>' +
                (appealPending ? '' :
                    '<div class="ec-appeal-form" id="ec-af-' + esc(c.CommentId) + '">' +
                    '<textarea class="ec-appeal-textarea" placeholder="Describe why you believe this comment should be approved\u2026" maxlength="1000"></textarea>' +
                    '<div class="ec-appeal-form-actions">' +
                    '<button class="ec-appeal-submit" data-id="' + esc(c.CommentId) + '">Submit Appeal</button>' +
                    '<button class="ec-appeal-cancel" data-id="' + esc(c.CommentId) + '">Cancel</button>' +
                    '</div></div>') +
                '</div>';

            // Dismiss button
            var dismissBtn = div.querySelector('.ec-dismiss-denial');
            if (dismissBtn) {
                dismissBtn.addEventListener('click', function () {
                    var commentId = this.dataset.id;
                    var card = this.closest('.ec-c');
                    if (card) card.remove();
                    pendingComments = pendingComments.filter(function (p) { return p.CommentId !== commentId; });
                    cfFetch(apiEndpoint + '/dismiss/' + encodeURIComponent(commentId), {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ UserUuid: userUuid })
                    }).then(function () {
                        var sec = card ? card.closest('.ec-section') : null;
                        if (sec) loadComments(sec, true);
                    }).catch(function () {});
                });
            }

            // Appeal button — toggle the inline form
            var appealBtn = div.querySelector('.ec-appeal-btn');
            if (appealBtn) {
                appealBtn.addEventListener('click', function () {
                    var formEl = document.getElementById('ec-af-' + this.dataset.id);
                    if (formEl) formEl.classList.toggle('open');
                });
            }

            // Appeal cancel
            var appealCancelBtn = div.querySelector('.ec-appeal-cancel');
            if (appealCancelBtn) {
                appealCancelBtn.addEventListener('click', function () {
                    var formEl = document.getElementById('ec-af-' + this.dataset.id);
                    if (formEl) formEl.classList.remove('open');
                });
            }

            // Appeal submit
            var appealSubmitBtn = div.querySelector('.ec-appeal-submit');
            if (appealSubmitBtn) {
                appealSubmitBtn.addEventListener('click', function () {
                    var commentId = this.dataset.id;
                    var formEl = document.getElementById('ec-af-' + commentId);
                    if (!formEl) return;
                    var reason = formEl.querySelector('.ec-appeal-textarea').value.trim();
                    if (!reason) { formEl.querySelector('.ec-appeal-textarea').focus(); return; }
                    var btn = this;
                    btn.disabled = true;
                    cfFetch(apiEndpoint + '/appeal/' + encodeURIComponent(commentId), {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ UserUuid: userUuid, reason: reason })
                    }).then(function (r) { return r.json(); }).then(function (data) {
                        if (data.ok) {
                            // Update local pending state and re-render
                            var updatedPending = null;
                            for (var i = 0; i < pendingComments.length; i++) {
                                if (pendingComments[i].CommentId === commentId) {
                                    pendingComments[i].AppealStatus = 'pending';
                                    updatedPending = pendingComments[i];
                                    break;
                                }
                            }
                            var card = div;
                            var newEl = createPendingCommentEl(
                                updatedPending || Object.assign({}, c, { AppealStatus: 'pending' }),
                                isReply
                            );
                            if (card.parentNode) card.parentNode.replaceChild(newEl, card);
                        } else {
                            btn.disabled = false;
                            alert(data.error || 'Failed to submit appeal. Please try again.');
                        }
                    }).catch(function () {
                        btn.disabled = false;
                    });
                });
            }
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

    function highlightWhenVisible(el, scroll, isDenied) {
        var cls = isDenied ? 'ec-highlight-denied' : 'ec-highlight';
        var elapsed = 0;
        var started = false;
        var enterTime = 0;
        var done = false;
        var observer = new IntersectionObserver(function (entries) {
            if (done) return;
            var entry = entries[0];
            if (entry.isIntersecting) {
                if (!started) {
                    el.classList.add(cls);
                    started = true;
                }
                enterTime = Date.now();
            } else if (started && enterTime > 0) {
                elapsed += Date.now() - enterTime;
                enterTime = 0;
                if (elapsed >= 5000) {
                    done = true;
                    observer.disconnect();
                    el.classList.add('ec-highlight-fade');
                    setTimeout(function () {
                        el.classList.remove(cls, 'ec-highlight-fade');
                    }, 1200);
                }
            }
        }, { root: scroll, threshold: 0.5 });
        observer.observe(el);
        // Also check periodically while in view to trigger fade
        var checkInterval = setInterval(function () {
            if (done) { clearInterval(checkInterval); return; }
            if (enterTime > 0) {
                var total = elapsed + (Date.now() - enterTime);
                if (total >= 5000) {
                    done = true;
                    clearInterval(checkInterval);
                    observer.disconnect();
                    el.classList.add('ec-highlight-fade');
                    setTimeout(function () {
                        el.classList.remove(cls, 'ec-highlight-fade');
                    }, 1200);
                }
            }
        }, 1000);
    }

    function getReplyBlock(list, parentCommentId) {
        var rf = list.querySelector('#ec-rf-' + parentCommentId);
        var replies = [];
        var moreBtn = null;
        if (!rf) return { replies: replies, moreBtn: null, afterBlock: null };
        var sib = rf.nextElementSibling;
        while (sib) {
            if (sib.classList.contains('ec-c') && !sib.classList.contains('reply')) break;
            if (sib.classList.contains('ec-show-more')) { moreBtn = sib; }
            else if (sib.classList.contains('ec-c') && sib.classList.contains('reply') && !sib.classList.contains('ec-awaiting')) {
                replies.push(sib);
            }
            sib = sib.nextElementSibling;
        }
        return { replies: replies, moreBtn: moreBtn, afterBlock: sib };
    }

    function findSortInsertionPoint(list, commentObj) {
        var items = list.querySelectorAll('.ec-c:not(.reply):not(.ec-denied):not(.ec-awaiting)');
        for (var i = 0; i < items.length; i++) {
            var c = items[i];
            if (currentSort === 'newest') return c;
            if (currentSort === 'oldest') continue;
            if (currentSort === 'best' && commentObj.StarRating) {
                var rating = parseInt((c.querySelector('.ec-c-rating') || {}).textContent || '0') || 0;
                if (commentObj.StarRating >= rating) return c;
            }
            if (currentSort === 'worst' && commentObj.StarRating) {
                var rating = parseInt((c.querySelector('.ec-c-rating') || {}).textContent || '0') || 0;
                if (commentObj.StarRating <= rating) return c;
            }
        }
        return null;
    }

    function insertWithAnimation(list, el, referenceNode) {
        el.classList.add('ec-inserting');
        list.insertBefore(el, referenceNode || null);
        el.addEventListener('animationend', function handler() {
            el.classList.remove('ec-inserting');
            el.removeEventListener('animationend', handler);
        });
    }

    function repositionElement(el, list, refNode, scroll) {
        if (el.nextSibling === refNode) return;

        var elRect = el.getBoundingClientRect();
        var scrollRect = scroll.getBoundingClientRect();
        var isVisible = elRect.top < scrollRect.bottom && elRect.bottom > scrollRect.top;

        if (!isVisible) {
            list.insertBefore(el, refNode || null);
            return;
        }

        // Delay so the user sees the approved state before it moves
        setTimeout(function () {
            var first = el.getBoundingClientRect();
            el.classList.add('ec-repositioning');
            list.insertBefore(el, refNode || null);
            var last = el.getBoundingClientRect();
            var deltaY = first.top - last.top;
            if (Math.abs(deltaY) < 2) {
                el.classList.remove('ec-repositioning');
                return;
            }

            el.style.transform = 'translateY(' + deltaY + 'px)';
            el.style.transition = 'none';
            el.offsetHeight;
            el.style.transition = 'transform 2.5s cubic-bezier(0.22, 0.61, 0.36, 1)';
            el.style.transform = '';
            el.addEventListener('transitionend', function handler(e) {
                if (e.propertyName !== 'transform') return;
                el.style.transition = '';
                el.classList.remove('ec-repositioning');
                el.removeEventListener('transitionend', handler);
            });
        }, 1000);
    }

    function repositionReply(el, list, parentCommentId, scroll) {
        var block = getReplyBlock(list, parentCommentId);
        var moreBtn = block.moreBtn;
        var visibleReplies = block.replies;
        // Check if show-more is expanded (button was removed by loadRemainingReplies)
        var isExpanded = !moreBtn;

        // Determine target position based on sort
        var targetRefNode;
        if (currentSort === 'newest') {
            // Newest: new reply goes first among visible replies
            var rf = list.querySelector('#ec-rf-' + parentCommentId);
            targetRefNode = visibleReplies.length > 0 ? visibleReplies[0] : (rf ? rf.nextElementSibling : block.afterBlock);
        } else {
            // Oldest and other sorts: new reply goes at the end
            targetRefNode = moreBtn || block.afterBlock;
        }

        if (el.nextSibling === targetRefNode) return;

        var elRect = el.getBoundingClientRect();
        var scrollRect = scroll.getBoundingClientRect();
        var isVisible = elRect.top < scrollRect.bottom && elRect.bottom > scrollRect.top;

        if (isExpanded || !moreBtn) {
            // Show-more expanded or doesn't exist — normal reposition
            if (!isVisible) {
                list.insertBefore(el, targetRefNode || null);
                return;
            }
            setTimeout(function () {
                var first = el.getBoundingClientRect();
                el.classList.add('ec-repositioning');
                list.insertBefore(el, targetRefNode || null);
                var last = el.getBoundingClientRect();
                var deltaY = first.top - last.top;
                if (Math.abs(deltaY) < 2) { el.classList.remove('ec-repositioning'); return; }
                el.style.transform = 'translateY(' + deltaY + 'px)';
                el.style.transition = 'none';
                el.offsetHeight;
                el.style.transition = 'transform 2.5s cubic-bezier(0.22, 0.61, 0.36, 1)';
                el.style.transform = '';
                el.addEventListener('transitionend', function handler(e) {
                    if (e.propertyName !== 'transform') return;
                    el.style.transition = '';
                    el.classList.remove('ec-repositioning');
                    el.removeEventListener('transitionend', handler);
                });
            }, 1000);
            return;
        }

        // Show-more exists and is collapsed — determine if reply belongs in visible or hidden section
        var belongsInVisible;
        if (currentSort === 'newest') {
            // Newest: new reply is newest, so it belongs at the top of visible
            belongsInVisible = true;
        } else if (currentSort === 'oldest') {
            // Oldest: new reply is newest, so it goes after all older ones — into the hidden section
            belongsInVisible = false;
        } else {
            // Other sorts (rating, popular, etc.): new reply has no metrics, goes to end — hidden
            belongsInVisible = false;
        }

        if (belongsInVisible) {
            // Reply belongs in the visible section
            // Bump the last visible reply past the show-more (into the hidden section)
            setTimeout(function () {
                if (visibleReplies.length > 0) {
                    var lastVisible = visibleReplies[visibleReplies.length - 1];
                    // Remove last visible reply from DOM — it'll be re-fetched via show-more
                    lastVisible.remove();
                    // Update show-more count text
                    var count = parseInt(moreBtn.textContent.match(/\d+/)) || 0;
                    count++;
                    var moreTxt = 'Show ' + count + ' more ' + (count === 1 ? 'reply' : 'replies');
                    // Preserve chip if present
                    var existingChip = moreBtn.querySelector('.ec-new-chip');
                    moreBtn.textContent = moreTxt;
                    if (existingChip) moreBtn.appendChild(existingChip);
                }

                // Now reposition the new reply to its target
                var first = el.getBoundingClientRect();
                el.classList.add('ec-repositioning');
                list.insertBefore(el, targetRefNode || null);
                var last = el.getBoundingClientRect();
                var deltaY = first.top - last.top;
                if (Math.abs(deltaY) < 2) { el.classList.remove('ec-repositioning'); return; }
                el.style.transform = 'translateY(' + deltaY + 'px)';
                el.style.transition = 'none';
                el.offsetHeight;
                el.style.transition = 'transform 2.5s cubic-bezier(0.22, 0.61, 0.36, 1)';
                el.style.transform = '';
                el.addEventListener('transitionend', function handler(e) {
                    if (e.propertyName !== 'transform') return;
                    el.style.transition = '';
                    el.classList.remove('ec-repositioning');
                    el.removeEventListener('transitionend', handler);
                });
            }, 1000);
        } else {
            // Reply belongs in the hidden/show-more section — animate into the button
            setTimeout(function () {
                if (!isVisible) {
                    el.remove();
                } else {
                    // Animate the reply fading down into the show-more button
                    el.classList.add('ec-fading-into');
                    el.addEventListener('animationend', function () {
                        el.remove();
                    });
                }
                // Track this reply ID for highlighting when expanded
                var ids = (moreBtn.dataset.highlightIds || '').split(',').filter(Boolean);
                if (el.dataset.commentId && ids.indexOf(el.dataset.commentId) === -1) {
                    ids.push(el.dataset.commentId);
                }
                moreBtn.dataset.highlightIds = ids.join(',');
                // Update show-more count (preserve chip)
                var count = parseInt(moreBtn.textContent.match(/\d+/)) || 0;
                count++;
                var moreTxt = 'Show ' + count + ' more ' + (count === 1 ? 'reply' : 'replies');
                var existingChip = moreBtn.querySelector('.ec-new-chip');
                moreBtn.textContent = moreTxt;
                // Add green dot chip (stays until expanded)
                if (existingChip) {
                    moreBtn.appendChild(existingChip);
                } else {
                    var chip = document.createElement('span');
                    chip.className = 'ec-new-chip';
                    moreBtn.appendChild(chip);
                }
            }, 1000);
        }
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

    var cachedFilteredSummary = null;
    var cachedOverallSummary = null;
    var cachedTotal = 0;
    var cachedOverallTotal = null;

    function renderSummary(section, filteredSummary, overallSummary, total, overallTotal) {
        var el = section.querySelector('#ec-summary');
        cachedFilteredSummary = filteredSummary;
        cachedOverallSummary = overallSummary;
        cachedTotal = total;
        if (overallTotal !== undefined) cachedOverallTotal = overallTotal;

        var hasLangFilter = languageFilter.length > 0;
        var active = (hasLangFilter && showOverallRatings) ? overallSummary : filteredSummary;

        var scopeRow = section.querySelector('#ec-scope-row');

        function buildScopePill() {
            return '<div class="ec-scope-pill">' +
                '<button class="ec-scope-opt' + (showOverallRatings ? ' active' : '') + '" data-scope="overall" title="Ratings from all languages">Overall</button>' +
                '<button class="ec-scope-opt' + (!showOverallRatings ? ' active' : '') + '" data-scope="filtered" title="Ratings from selected languages only">Filtered</button>' +
                '</div>';
        }

        function renderScopeRow() {
            if (hasLangFilter && overallSummary) {
                scopeRow.innerHTML = buildScopePill();
                scopeRow.style.display = '';
                scopeRow.querySelectorAll('.ec-scope-opt').forEach(function (opt) {
                    opt.addEventListener('click', function () {
                        showOverallRatings = opt.dataset.scope === 'overall';
                        renderSummary(section, cachedFilteredSummary, cachedOverallSummary, cachedTotal, cachedOverallTotal);
                    });
                });
            } else {
                scopeRow.innerHTML = '';
                scopeRow.style.display = 'none';
            }
        }

        // No ratings for active view
        if (!active || !active.avg) {
            if (hasLangFilter && overallSummary && overallSummary.avg) {
                el.innerHTML = '<div class="ec-no-ratings">No ratings for selected language' + (languageFilter.length > 1 ? 's' : '') + '</div>';
                el.style.display = 'flex';
                renderScopeRow();
                return;
            }
            el.innerHTML = '';
            el.style.display = 'none';
            scopeRow.innerHTML = '';
            scopeRow.style.display = 'none';
            return;
        }

        var spark = buildSparkline(active.distribution || {});

        var avgDisplay = active.avg % 1 === 0 ? String(Math.round(active.avg)) : active.avg.toFixed(1);
        el.innerHTML = '<div class="ec-avg"><span class="ec-avg-num">' + avgDisplay + '</span><span class="ec-avg-max">/10</span></div>' +
            '<div class="ec-avg-detail"><div class="ec-avg-stars">' + buildDecimalStars(active.avg, 10) + '</div>' +
            '<div class="ec-avg-meta">' + (active.ratedCount || 0) + ' ratings \u00B7 ' + ((hasLangFilter && showOverallRatings && cachedOverallTotal != null) ? cachedOverallTotal : total) + ' comments</div></div>' +
            (spark ? '<div class="ec-spark">' + spark + '</div>' : '');
        el.style.display = 'flex';
        renderScopeRow();
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

            var replyForm = null;
            if (userModerationStatus !== 'denied') {
                replyForm = document.createElement('div');
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
            }

            (comment.Replies || []).forEach(function (r) {
                var re = createCommentEl(r, true);
                list.appendChild(re);
                wireActions(section, list, re, r, true);
            });

            pendingReplies.forEach(function (r) {
                var re = createPendingCommentEl(r, true);
                list.appendChild(re);
            });

            if (replyForm) {

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
                            if (data.serverBanned) {
                                showError(section, data.error || 'Your server has been suspended. Please contact your server administrator.');
                                return;
                            }
                            if (data.banned) {
                                banInfo = { banType: data.banType, reason: data.banReason, expiresAt: data.banExpiresAt, isAdmin: data.isAdmin || false };
                                updateFormVisibility(section);
                                var bToggles = section.querySelectorAll('.ec-reply-toggle');
                                for (var bi = 0; bi < bToggles.length; bi++) bToggles[bi].style.display = 'none';
                                var bReplies = section.querySelectorAll('.ec-reply-inline.open');
                                for (var bj = 0; bj < bReplies.length; bj++) bReplies[bj].classList.remove('open');
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
                            pendingRefresh = null; // user finished writing — no deferred refresh needed
                        }).catch(function (err) {
                            showError(section, 'Failed to post reply: ' + err.message);
                        });
                    });
                }

                if (cancelBtn) {
                    cancelBtn.addEventListener('click', function () {
                        resetReplyForm();
                        if (pendingRefresh && !isUserWriting(section)) { var r = pendingRefresh; pendingRefresh = null; loadComments(section, r.bustCache); }
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
            (!isReply && userModerationStatus !== 'denied' && !banInfo && !banLiftPendingAck && !serverBanInfo && !needsGuidelinesAcceptance ? '<button class="ec-c-act ec-reply-toggle" data-id="' + c.CommentId + '">\u21a9 Reply</button>' : '') +
            (c.Body && c.Language && LANG_TO_CODE[c.Language] && LANG_TO_CODE[c.Language] !== userLangCode ? '<button class="ec-translate-btn" data-id="' + c.CommentId + '">' + GLOBE_SVG + '<span class="ec-translate-label"> Translate</span></button><button class="ec-show-original-btn" data-id="' + c.CommentId + '">' + GLOBE_SVG + ' Show original</button>' : '') +
            (!isOwn ? '<button class="ec-report-btn' + (reportedSet[c.CommentId] ? ' ec-reported' : '') + '" data-id="' + c.CommentId + '" title="Report comment">' + FLAG_SVG + (reportedSet[c.CommentId] ? ' Reported' : '') + '</button>' : '') +
            deleteHtml +
            '</div></div>';

        return div;
    }

    function wireActions(section, list, el, comment, isReply) {
        var likeBtn = el.querySelector('.ec-like-btn');
        var dislikeBtn = el.querySelector('.ec-dislike-btn');

        if (serverBanInfo) {
            if (likeBtn) likeBtn.classList.add('ec-interaction-banned');
            if (dislikeBtn) dislikeBtn.classList.add('ec-interaction-banned');
            var repBtn = el.querySelector('.ec-report-btn');
            if (repBtn) repBtn.classList.add('ec-interaction-banned');
        }

        if (likeBtn) likeBtn.addEventListener('click', function () { if (serverBanInfo) return; postReaction(section, comment.CommentId, 'like', el); });
        if (dislikeBtn) dislikeBtn.addEventListener('click', function () { if (serverBanInfo) return; postReaction(section, comment.CommentId, 'dislike', el); });

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
                if (serverBanInfo) return;
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
                    '<div class="ec-report-other"><input class="ec-report-other-input" type="text" name="ec-report-other" placeholder="Other reason..." maxlength="100"><button class="ec-report-other-submit">Submit</button></div>';

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

        // Translate / Show original
        var translateBtn = el.querySelector('.ec-translate-btn');
        var showOriginalBtn = el.querySelector('.ec-show-original-btn');

        if (translateBtn) {
            translateBtn.addEventListener('click', function () {
                var lbl = translateBtn.querySelector('.ec-translate-label');
                translateBtn.classList.add('ec-translating');
                if (lbl) lbl.textContent = ' Translating\u2026';
                cfFetch(apiEndpoint + '/translate', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ commentId: comment.CommentId, targetLang: userLangCode })
                }).then(function (r) { return r.json(); }).then(function (data) {
                    if (data.error) {
                        translateBtn.classList.remove('ec-translating');
                        if (lbl) lbl.textContent = ' Translate';
                        return;
                    }
                    var textEl = el.querySelector('.ec-c-text');
                    if (!textEl) return;
                    // Store the original body as plain text so revert can re-render via esc()
                    // rather than blindly re-injecting prior innerHTML.
                    textEl.dataset.originalBody = comment.Body || '';
                    textEl.innerHTML = esc(data.translatedBody) + ' <span class="ec-translated-note">(translated)</span>';
                    translateBtn.style.display = 'none';
                    if (showOriginalBtn) showOriginalBtn.style.display = 'inline';
                }).catch(function () {
                    translateBtn.classList.remove('ec-translating');
                    if (lbl) lbl.textContent = ' Translate';
                });
            });
        }

        if (showOriginalBtn) {
            showOriginalBtn.addEventListener('click', function () {
                var textEl = el.querySelector('.ec-c-text');
                if (textEl && textEl.dataset.originalBody !== undefined) {
                    textEl.innerHTML = esc(textEl.dataset.originalBody);
                    delete textEl.dataset.originalBody;
                }
                showOriginalBtn.style.display = 'none';
                if (translateBtn) {
                    translateBtn.classList.remove('ec-translating');
                    var lbl = translateBtn.querySelector('.ec-translate-label');
                    if (lbl) lbl.textContent = ' Translate';
                    translateBtn.style.display = '';
                }
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
        var highlightIds = (moreBtn.dataset.highlightIds || '').split(',').filter(Boolean);
        moreBtn.textContent = 'Loading...'; moreBtn.disabled = true;
        var repliesUrl = apiEndpoint + '/replies?parentId=' + encodeURIComponent(parentId) + '&offset=' + skipCount + '&sort=' + encodeURIComponent(currentSort);
        if (serverLocalOnly && serverGuid) repliesUrl += '&serverGuid=' + encodeURIComponent(serverGuid);
        cfFetch(repliesUrl)
            .then(function (r) { return r.json(); }).then(function (replies) {
                var scroll = section.querySelector('#ec-scroll');
                replies.forEach(function (r) {
                    var re = createCommentEl(r, true);
                    list.insertBefore(re, moreBtn);
                    wireActions(section, list, re, r, true);
                    if (scroll && highlightIds.indexOf(r.CommentId) !== -1) {
                        highlightWhenVisible(re, scroll, false);
                    }
                });
                moreBtn.remove();
            }).catch(function () { moreBtn.textContent = 'Failed. Try again.'; moreBtn.disabled = false; });
    }

    function formatDate(ds) {
        if (!ds) return '';
        var date = new Date(ds);
        var diff = Date.now() - date, m = Math.floor(diff / 60000);
        if (m < 1) return 'now';
        if (m < 60) return m + 'm';
        var h = Math.floor(m / 60); if (h < 24) return h + 'h';
        var d = Math.floor(h / 24); if (d < 7) return d + 'd';
        return date.toLocaleDateString();
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

    function CommunityCommentsPlugin() { this.id = 'a4b7c2d1-e5f6-4a3b-8c9d-0e1f2a3b4c5d'; this.name = 'Community Comments'; }
    return CommunityCommentsPlugin;
});