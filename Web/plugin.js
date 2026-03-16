define([], function () {
    var apiEndpoint = null;
    var displayName = null;
    var serverGuid = null;
    var selectedRating = 0;
    var currentMediaKey = null;
    var observer = null;
    var lastInjectedItemId = null;

    function init() {
        ApiClient.getPluginConfiguration('a4b7c2d1-e5f6-4a3b-8c9d-0e1f2a3b4c5d').then(function (config) {
            apiEndpoint = config.ApiEndpoint;
            displayName = config.DisplayName;
            serverGuid = ApiClient.serverId();
            startObserver();
        }).catch(function () {
            setTimeout(init, 1000);
        });
    }

    function startObserver() {
        if (observer) observer.disconnect();
        observer = new MutationObserver(function () {
            checkAndInject();
        });
        observer.observe(document.body, { childList: true, subtree: true });

        // Poll for URL changes since Emby doesn't fire hashchange/popstate
        var lastHash = window.location.hash;
        setInterval(function () {
            var currentHash = window.location.hash;
            if (currentHash !== lastHash) {
                lastHash = currentHash;
                lastInjectedItemId = null;
                var old = document.getElementById('embycomments-section');
                if (old) old.parentNode.removeChild(old);
            }
            // Also try injecting on every tick in case MutationObserver missed it
            checkAndInject();
        }, 300);

        checkAndInject();
    }

    function checkAndInject() {
        var url = window.location.hash;
        if (!url.includes('item?id=')) return;

        var urlParams = new URLSearchParams(url.split('?')[1]);
        var itemId = urlParams.get('id');
        if (!itemId) return;

        if (lastInjectedItemId === itemId) return;

        var anchor = document.querySelector('.aboutSection');
        if (!anchor) return;

        if (document.getElementById('embycomments-section')) return;

        lastInjectedItemId = itemId;

        ApiClient.getItem(ApiClient.getCurrentUserId(), itemId).then(function (item) {
            if (!isSupported(item)) return;

            currentMediaKey = getMediaKey(item);
            selectedRating = 0;

            var section = document.createElement('div');
            section.id = 'embycomments-section';
            section.className = 'verticalSection verticalSection-cards';
            section.style.fontSize = '92%';
            section.innerHTML = buildSectionHtml();

            var freshAnchor = document.querySelector('.aboutSection');
            if (freshAnchor && freshAnchor.parentNode) {
                freshAnchor.parentNode.insertBefore(section, freshAnchor);
            }

            setupStars(section);
            setupSubmit(section, item);
            loadComments(section);
        });
    }

    function isSupported(item) {
        return item && (item.Type === 'Movie' || item.Type === 'Series' || item.Type === 'Episode');
    }

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
            '.ec-form { margin-bottom: 2em; max-width: 800px; }' +
            '.ec-stars { display:flex; gap:4px; margin:0.5em 0; cursor:pointer; }' +
            '.ec-stars span { font-size:1.5em; color:rgba(255,255,255,0.3); transition:color 0.1s; }' +
            '.ec-stars span.active { color:#f5c518; }' +
            '.ec-textarea { width:100%; min-height:80px; background:rgba(255,255,255,0.1); border:1px solid rgba(255,255,255,0.2); border-radius:4px; color:inherit; padding:0.5em; font-size:1em; resize:vertical; box-sizing:border-box; }' +
            '.ec-btn { margin-top:0.5em; padding:0.5em 1.5em; background:#00a4dc; border:none; border-radius:4px; color:white; cursor:pointer; font-size:1em; }' +
            '.ec-btn:hover { background:#0085b2; }' +
            '.ec-list { display:flex; flex-direction:column; gap:1em; max-width:800px; }' +
            '.ec-comment { background:rgba(255,255,255,0.05); border-radius:6px; padding:1em; border-left:3px solid #00a4dc; }' +
            '.ec-comment.reply { margin-left:2em; border-left-color:rgba(255,255,255,0.2); }' +
            '.ec-header { display:flex; justify-content:space-between; margin-bottom:0.5em; }' +
            '.ec-author { font-weight:bold; color:#00a4dc; }' +
            '.ec-date { font-size:0.8em; color:rgba(255,255,255,0.5); }' +
            '.ec-rating { color:#f5c518; font-size:0.9em; margin-bottom:0.25em; }' +
            '.ec-body { line-height:1.5; }' +
            '.ec-actions { display:flex; gap:1em; margin-top:0.75em; }' +
            '.ec-action { background:none; border:none; color:rgba(255,255,255,0.5); cursor:pointer; font-size:0.85em; padding:0; }' +
            '.ec-action:hover { color:#00a4dc; }' +
            '.ec-reply-form { margin-top:0.75em; display:none; }' +
            '.ec-empty { color:rgba(255,255,255,0.4); padding:1em 0; }' +
            '.ec-error { color:#ff4444; padding:0.5em; background:rgba(255,0,0,0.1); border-radius:4px; margin-bottom:1em; display:none; }' +
            '</style>' +
            '<h2 class="sectionTitle sectionTitle-cards padded-left padded-left-page padded-right">Community Comments</h2>' +
            '<div style="padding-top:0">' +
            '<div class="ec-error" id="ec-error"></div>' +
            '<div class="ec-form" style="padding-left:33.95px">' +
            '<div class="ec-stars" id="ec-stars">' +
            '<span data-value="1">\u2605</span><span data-value="2">\u2605</span><span data-value="3">\u2605</span>' +
            '<span data-value="4">\u2605</span><span data-value="5">\u2605</span><span data-value="6">\u2605</span>' +
            '<span data-value="7">\u2605</span><span data-value="8">\u2605</span><span data-value="9">\u2605</span>' +
            '<span data-value="10">\u2605</span>' +
            '</div>' +
            '<textarea class="ec-textarea" id="ec-body" placeholder="Share your thoughts..."></textarea><br>' +
            '<button class="ec-btn" id="ec-submit">Post Comment</button>' +
            '</div>' +
            '<div class="ec-list" id="ec-list" style="padding-left:33.95px"><div class="ec-empty">Loading comments...</div></div>' +
            '</div>';
    }

    function setupStars(section) {
        var stars = section.querySelectorAll('#ec-stars span');
        stars.forEach(function (star) {
            star.addEventListener('mouseover', function () {
                var val = parseInt(this.dataset.value);
                stars.forEach(function (s) { s.classList.toggle('active', parseInt(s.dataset.value) <= val); });
            });
            star.addEventListener('mouseout', function () {
                stars.forEach(function (s) { s.classList.toggle('active', parseInt(s.dataset.value) <= selectedRating); });
            });
            star.addEventListener('click', function () {
                selectedRating = parseInt(this.dataset.value);
                stars.forEach(function (s) { s.classList.toggle('active', parseInt(s.dataset.value) <= selectedRating); });
            });
        });
    }

    function setupSubmit(section, item) {
        section.querySelector('#ec-submit').addEventListener('click', function () {
            var body = section.querySelector('#ec-body').value.trim();
            if (!body) return;
            if (!displayName) { showError(section, 'Set your display name in plugin settings first.'); return; }
            fetch(apiEndpoint + '/comments', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    MediaKey: currentMediaKey,
                    MediaTitle: item.Name || '',
                    AuthorDisplayName: displayName,
                    OriginServerGuid: serverGuid,
                    Body: body,
                    StarRating: selectedRating > 0 ? selectedRating : null,
                    ParentCommentId: null
                })
            }).then(function () {
                section.querySelector('#ec-body').value = '';
                selectedRating = 0;
                section.querySelectorAll('#ec-stars span').forEach(function (s) { s.classList.remove('active'); });
                loadComments(section);
            }).catch(function (err) { showError(section, 'Failed to post: ' + err.message); });
        });
    }

    function loadComments(section) {
        if (!currentMediaKey || !apiEndpoint) return;
        fetch(apiEndpoint + '/comments?mediaKey=' + encodeURIComponent(currentMediaKey))
            .then(function (r) { return r.json(); })
            .then(function (comments) { renderComments(section, comments); })
            .catch(function (err) { showError(section, 'Failed to load: ' + err.message); });
    }

    function renderComments(section, comments) {
        var list = section.querySelector('#ec-list');
        if (!comments || comments.length === 0) {
            list.innerHTML = '<div class="ec-empty">No comments yet. Be the first!</div>';
            return;
        }
        var topLevel = comments.filter(function (c) { return !c.ParentCommentId; });
        var replies = comments.filter(function (c) { return c.ParentCommentId; });
        list.innerHTML = topLevel.map(function (c) {
            var cr = replies.filter(function (r) { return r.ParentCommentId === c.CommentId; });
            return renderComment(c) + cr.map(function (r) { return renderComment(r, true); }).join('');
        }).join('');

        list.querySelectorAll('.ec-like').forEach(function (btn) {
            btn.addEventListener('click', function () {
                var id = this.dataset.id;
                fetch(apiEndpoint + '/likes', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ CommentId: id, ServerGuid: serverGuid })
                }).then(function () { loadComments(section); });
            });
        });

        list.querySelectorAll('.ec-reply-toggle').forEach(function (btn) {
            btn.addEventListener('click', function () {
                var form = section.querySelector('#ec-rf-' + this.dataset.id);
                if (form) form.style.display = form.style.display === 'none' ? 'block' : 'none';
            });
        });

        list.querySelectorAll('.ec-reply-post').forEach(function (btn) {
            btn.addEventListener('click', function () {
                var pid = this.dataset.id;
                var body = section.querySelector('#ec-rt-' + pid).value.trim();
                if (!body) return;
                fetch(apiEndpoint + '/comments', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        MediaKey: currentMediaKey, MediaTitle: '',
                        AuthorDisplayName: displayName, OriginServerGuid: serverGuid,
                        Body: body, StarRating: null, ParentCommentId: pid
                    })
                }).then(function () {
                    section.querySelector('#ec-rt-' + pid).value = '';
                    loadComments(section);
                });
            });
        });
    }

    function renderComment(c, isReply) {
        var stars = c.StarRating ? '\u2605'.repeat(c.StarRating) + ' (' + c.StarRating + '/10)' : '';
        var date = new Date(c.CreatedAt).toLocaleDateString();
        return '<div class="ec-comment' + (isReply ? ' reply' : '') + '">' +
            '<div class="ec-header"><span class="ec-author">' + esc(c.AuthorDisplayName) + '</span>' +
            '<span class="ec-date">' + date + '</span></div>' +
            (stars ? '<div class="ec-rating">' + stars + '</div>' : '') +
            '<div class="ec-body">' + esc(c.Body) + '</div>' +
            '<div class="ec-actions">' +
            '<button class="ec-action ec-like" data-id="' + c.CommentId + '">\u2665 ' + (c.LikeCount || 0) + '</button>' +
            (!isReply ? '<button class="ec-action ec-reply-toggle" data-id="' + c.CommentId + '">\u21a9 Reply</button>' : '') +
            '</div>' +
            (!isReply ? '<div class="ec-reply-form" id="ec-rf-' + c.CommentId + '">' +
            '<textarea class="ec-textarea" id="ec-rt-' + c.CommentId + '" placeholder="Write a reply..."></textarea><br>' +
            '<button class="ec-btn ec-reply-post" data-id="' + c.CommentId + '">Post Reply</button>' +
            '</div>' : '') +
            '</div>';
    }

    function showError(section, msg) {
        var el = section.querySelector('#ec-error');
        if (el) { el.textContent = msg; el.style.display = 'block'; }
    }

    function esc(str) {
        if (!str) return '';
        return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    }

    init();

    function EmbyCommentsPlugin() {
        this.id = 'a4b7c2d1-e5f6-4a3b-8c9d-0e1f2a3b4c5d';
        this.name = 'Emby Comments';
    }

    return EmbyCommentsPlugin;
});
