define(['baseView', 'loading', 'emby-input', 'emby-button', 'emby-scroller'], function (BaseView, loading) {
    'use strict';

    var pluginId = 'a4b7c2d1-e5f6-4a3b-8c9d-0e1f2a3b4c5d';
    var MAX_NAME_LENGTH = 30;

    function findDisplayName(entries, userId) {
        var match = (entries || []).find(function (e) { return e.UserId === userId; });
        return match ? match.DisplayName : '';
    }

    function setLoading(view) {
        view.querySelector('.embyCommentsUserList').innerHTML =
            '<p style="color:var(--theme-text-color-secondary,#aaa);">Loading users...</p>';
        view.querySelector('.btnSaveAll').disabled = true;
    }

    function setError(view, msg) {
        view.querySelector('.embyCommentsUserList').innerHTML =
            '<p style="color:var(--theme-error-color,#e74c3c);">' + msg + '</p>';
    }

    function showStatus(view, msg, isError) {
        var el = view.querySelector('.embyCommentsStatus');
        el.textContent = msg;
        el.style.color = isError ? 'var(--theme-error-color, #e74c3c)' : 'var(--theme-success-color, #2ecc71)';
        el.style.display = 'block';
        setTimeout(function () { el.style.display = 'none'; }, 3000);
    }

    function hasChanges(instance) {
        var inputs = instance.view.querySelectorAll('input[data-user-id]');
        for (var i = 0; i < inputs.length; i++) {
            if (inputs[i].value.trim() !== (instance.originalValues[inputs[i].dataset.userId] || '')) return true;
        }
        return false;
    }

    function trackOriginalValues(instance) {
        instance.originalValues = {};
        instance.view.querySelectorAll('input[data-user-id]').forEach(function (input) {
            instance.originalValues[input.dataset.userId] = input.value.trim();
        });
    }

    function renderUsers(instance, users, entries, isAdmin) {
        var view = instance.view;
        var userList = view.querySelector('.embyCommentsUserList');
        var saveBtn = view.querySelector('.btnSaveAll');
        userList.innerHTML = '';

        if (!isAdmin) {
            userList.innerHTML = '<p style="color:var(--theme-text-color-secondary,#aaa);">Only server administrators can modify display names.</p>';
            saveBtn.style.display = 'none';
            return;
        }

        saveBtn.style.display = '';

        users.forEach(function (user) {
            var row = document.createElement('div');
            row.style.cssText = 'display:flex; align-items:center; gap:1em; margin-bottom:1em;';

            var label = document.createElement('div');
            label.style.cssText = 'min-width:160px; font-weight:bold; color:var(--theme-text-color,#fff);';
            label.textContent = user.Name;

            var inputWrap = document.createElement('div');
            inputWrap.className = 'inputContainer';
            inputWrap.style.cssText = 'flex:1; margin:0;';

            var input = document.createElement('input');
            input.type = 'text';
            input.className = 'emby-input';
            input.placeholder = user.Name + ' (default)';
            input.maxLength = MAX_NAME_LENGTH;
            input.value = findDisplayName(entries, user.Id);
            input.dataset.userId = user.Id;
            input.dataset.defaultName = user.Name;

            var counter = document.createElement('div');
            counter.style.cssText = 'font-size:0.75em; text-align:right; margin-top:2px; color:var(--theme-text-color-secondary, #888);';
            var currentLen = input.value.length;
            counter.textContent = currentLen > 0 ? currentLen + ' / ' + MAX_NAME_LENGTH : '';

            input.addEventListener('input', function () {
                // Strip anything that isn't alphanumeric, spaces, hyphens, underscores, or periods
                this.value = this.value.replace(/[^a-zA-Z0-9 _\-\.]/g, '');
                var len = this.value.length;
                counter.textContent = len > 0 ? len + ' / ' + MAX_NAME_LENGTH : '';
                counter.style.color = len >= MAX_NAME_LENGTH ? 'var(--theme-error-color, #e74c3c)' : 'var(--theme-text-color-secondary, #888)';
                saveBtn.disabled = !hasChanges(instance);
            });

            inputWrap.appendChild(input);
            inputWrap.appendChild(counter);
            row.appendChild(label);
            row.appendChild(inputWrap);
            userList.appendChild(row);
        });

        trackOriginalValues(instance);
        saveBtn.disabled = true;
    }

    function loadConfig(instance) {
        var view = instance.view;
        setLoading(view);

        ApiClient.getCurrentUser().then(function (currentUser) {
            var isAdmin = currentUser.Policy && currentUser.Policy.IsAdministrator;

            ApiClient.ajax({ type: 'GET', url: ApiClient.getUrl('Users'), dataType: 'json' }).then(function (users) {
                ApiClient.getPluginConfiguration(pluginId).then(function (config) {
                    instance.apiEndpoint = config.ApiEndpoint;
                    var entries = config.UserDisplayNames || [];
                    renderUsers(instance, users, entries, isAdmin);
                    loading.hide();
                });
            });
        }).catch(function (err) {
            console.error('[EmbyComments] loadConfig failed:', err);
            setError(view, 'Failed to load: ' + (err.message || JSON.stringify(err)));
        });
    }

    function syncDisplayNamesToWorker(instance, inputs) {
        if (!instance.apiEndpoint) return Promise.resolve();
        var serverId = ApiClient.serverId();
        var promises = [];

        inputs.forEach(function (input) {
            var userId = input.dataset.userId;
            var name = input.value.trim() || input.dataset.defaultName;
            var userKey = serverId + ':' + userId;

            promises.push(
                fetch(instance.apiEndpoint + '/register', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ UserKey: userKey, DisplayName: name })
                }).catch(function () { /* best effort */ })
            );
        });

        return Promise.all(promises);
    }

    function onSubmit(instance, e) {
        e.preventDefault();
        var view = instance.view;
        var saveBtn = view.querySelector('.btnSaveAll');
        if (saveBtn.disabled) return;

        ApiClient.getCurrentUser().then(function (currentUser) {
            if (!currentUser.Policy || !currentUser.Policy.IsAdministrator) {
                showStatus(view, 'Only administrators can save settings.', true);
                return;
            }

            var entries = [];
            var inputs = view.querySelectorAll('input[data-user-id]');
            inputs.forEach(function (input) {
                var val = input.value.trim();
                if (val) entries.push({ UserId: input.dataset.userId, DisplayName: val });
            });

            ApiClient.getPluginConfiguration(pluginId).then(function (config) {
                config.UserDisplayNames = entries;
                return ApiClient.updatePluginConfiguration(pluginId, config);
            }).then(function () {
                // Sync to Cloudflare worker
                return syncDisplayNamesToWorker(instance, inputs);
            }).then(function () {
                trackOriginalValues(instance);
                saveBtn.disabled = true;
                showStatus(view, 'Settings saved.');
            }).catch(function (err) {
                console.error('[EmbyComments] save failed:', err);
                showStatus(view, 'Save failed: ' + (err.message || JSON.stringify(err)), true);
            });
        });
    }

    function View(view, params) {
        BaseView.apply(this, arguments);
        this.originalValues = {};
        this.apiEndpoint = null;
        var instance = this;
        view.querySelector('form').addEventListener('submit', function (e) { onSubmit(instance, e); });
    }

    Object.assign(View.prototype, BaseView.prototype);

    View.prototype.onResume = function (options) {
        BaseView.prototype.onResume.apply(this, arguments);
        loadConfig(this);
    };

    View.prototype.onPause = function () {
        BaseView.prototype.onPause.apply(this, arguments);
        setLoading(this.view);
        this.originalValues = {};
    };

    return View;
});