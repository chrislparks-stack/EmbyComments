define(['baseView', 'loading', 'emby-input', 'emby-button', 'emby-scroller'], function (BaseView, loading) {
    'use strict';

    var pluginId = 'a4b7c2d1-e5f6-4a3b-8c9d-0e1f2a3b4c5d';
    var MAX_NAME_LENGTH = 50;
    var POLL_INTERVAL = 5000;
    var MAX_POLL_ATTEMPTS = 10;

    var SHIELD_SVG = '<svg viewBox="0 0 24 24" width="10" height="10" style="vertical-align:-1px;"><path fill="currentColor" d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm-1 17.93C7.05 17.74 5 14.49 5 11V6.3l7-3.11 7 3.11V11c0 3.49-2.05 6.74-6 7.93V18h-1v.93zM10 14.17l-2.59-2.58L6 13l4 4 8-8-1.41-1.42L10 14.17z"/></svg>';

    function findEntry(entries, userId) {
        return (entries || []).find(function (e) { return e.UserId === userId; });
    }

    function findDisplayName(entries, userId) {
        var entry = findEntry(entries, userId);
        return entry ? entry.DisplayName : '';
    }

    function findAvatarBlob(entries, userId) {
        var entry = findEntry(entries, userId);
        return entry ? (entry.AvatarBlob || '') : '';
    }

    function getEmbyAvatarPath(user) {
        if (user.PrimaryImageTag) {
            return 'Users/' + user.Id + '/Images/Primary?maxheight=64&quality=80';
        }
        return '';
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
        var chk = instance.view.querySelector('#chkServerLocalOnly');
        if (chk && chk.checked !== !!instance.originalLocalOnly) return true;
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
        var chk = instance.view.querySelector('#chkServerLocalOnly');
        instance.originalLocalOnly = chk ? chk.checked : false;
    }

    function setNameStatus(warning, status, reason) {
        if (status === 'awaiting') {
            warning.innerHTML = SHIELD_SVG + ' Waiting for moderation';
            warning.style.color = '#3498db';
            warning.style.display = 'inline';
        } else if (status === 'approved') {
            warning.innerHTML = '\u2714 Custom name approved';
            warning.style.color = '#2ecc71';
            warning.style.display = 'inline';
        } else if (status === 'denied') {
            warning.innerHTML = '\u26A0 ' + (reason || 'This name was flagged and cannot post comments');
            warning.style.color = 'var(--theme-error-color, #e74c3c)';
            warning.style.display = 'inline';
        } else {
            warning.style.display = 'none';
        }
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

            // Avatar preview
            var avatarWrap = document.createElement('div');
            avatarWrap.style.cssText = 'flex-shrink:0; width:40px; height:40px; border-radius:50%; overflow:hidden; background:var(--theme-text-color-secondary, #888); display:flex; align-items:center; justify-content:center;';

            var storedAvatar = findAvatarBlob(entries, user.Id);
            var embyAvatar = getEmbyAvatarPath(user);
            var avatarPath = storedAvatar || embyAvatar;

            if (avatarPath) {
                var img = document.createElement('img');
                img.style.cssText = 'width:100%; height:100%; object-fit:cover;';
                img.src = ApiClient.getUrl(avatarPath);
                img.onerror = function () {
                    this.style.display = 'none';
                    var fallback = document.createElement('span');
                    fallback.style.cssText = 'color:white; font-weight:600; font-size:0.85em;';
                    fallback.textContent = user.Name.charAt(0).toUpperCase();
                    avatarWrap.appendChild(fallback);
                };
                avatarWrap.appendChild(img);
            } else {
                var fallback = document.createElement('span');
                fallback.style.cssText = 'color:white; font-weight:600; font-size:0.85em;';
                fallback.textContent = user.Name.charAt(0).toUpperCase();
                avatarWrap.appendChild(fallback);
            }

            // Store avatar path on the row for saving
            avatarWrap.dataset.userId = user.Id;
            avatarWrap.dataset.avatarPath = avatarPath;
            avatarWrap.className = 'ec-cfg-avatar';

            var label = document.createElement('div');
            label.style.cssText = 'min-width:120px; font-weight:bold; color:inherit;';
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

            var counter = document.createElement('span');
            counter.style.cssText = 'font-size:0.75em; color:var(--theme-text-color-secondary, #888);';
            var currentLen = input.value.length;
            counter.textContent = currentLen > 0 ? currentLen + ' / ' + MAX_NAME_LENGTH : '';

            var warning = document.createElement('span');
            warning.className = 'ec-cfg-name-warning';
            warning.style.cssText = 'display:none; font-size:0.75em;';
            warning.dataset.userId = user.Id;

            var statusRow = document.createElement('div');
            statusRow.style.cssText = 'display:flex; justify-content:space-between; align-items:center; margin-top:2px;';

            input.addEventListener('input', function () {
                this.value = this.value.replace(/[\x00-\x1F\x7F-\x9F\u200B-\u200F\u2028-\u202F\uFEFF]/g, '');
                var len = this.value.length;
                counter.textContent = len > 0 ? len + ' / ' + MAX_NAME_LENGTH : '';
                counter.style.color = len >= MAX_NAME_LENGTH ? 'var(--theme-error-color, #e74c3c)' : 'var(--theme-text-color-secondary, #888)';
                warning.style.display = 'none';
                saveBtn.disabled = !hasChanges(instance);
            });

            inputWrap.appendChild(input);
            statusRow.appendChild(warning);
            statusRow.appendChild(counter);
            inputWrap.appendChild(statusRow);
            row.appendChild(avatarWrap);
            row.appendChild(label);
            row.appendChild(inputWrap);
            userList.appendChild(row);
        });

        trackOriginalValues(instance);
        saveBtn.disabled = true;

        checkNameModerationStatuses(instance, users, entries);
    }

    function checkNameModerationStatuses(instance, users, entries) {
        var serverId = ApiClient.serverId();
        users.forEach(function (user) {
            var customName = findDisplayName(entries, user.Id);
            if (!customName) return;

            var userKey = serverId + ':' + user.Id;
            ApiClient.ajax({
                type: 'POST',
                url: ApiClient.getUrl('embycomments/register-name'),
                dataType: 'json',
                contentType: 'application/json',
                data: JSON.stringify({ UserKey: userKey, DisplayName: customName, CheckOnly: true })
            }).then(function (data) {
                var warning = instance.view.querySelector('.ec-cfg-name-warning[data-user-id="' + user.Id + '"]');
                if (!warning) return;

                if (data.ModerationStatus === 'denied') {
                    setNameStatus(warning, 'denied');
                } else if (data.ModerationStatus === 'approved') {
                    setNameStatus(warning, 'approved');
                } else if (data.ModerationStatus === 'awaiting') {
                    setNameStatus(warning, 'awaiting');
                }
            }).catch(function () {});
        });
    }

    function startModerationPoll(instance, inputs) {
        if (instance.pollTimer) { clearInterval(instance.pollTimer); }
        instance.pollCount = 0;
        var serverId = ApiClient.serverId();

        var pendingUsers = [];
        inputs.forEach(function (input) {
            var name = input.value.trim();
            if (name) {
                pendingUsers.push({
                    userId: input.dataset.userId,
                    userKey: serverId + ':' + input.dataset.userId,
                    displayName: name
                });
            }
        });

        if (pendingUsers.length === 0) return;

        pendingUsers.forEach(function (pu) {
            var warning = instance.view.querySelector('.ec-cfg-name-warning[data-user-id="' + pu.userId + '"]');
            if (warning) setNameStatus(warning, 'awaiting');
        });

        instance.pollTimer = setInterval(function () {
            instance.pollCount++;
            if (instance.pollCount >= MAX_POLL_ATTEMPTS || pendingUsers.length === 0) {
                clearInterval(instance.pollTimer);
                instance.pollTimer = null;
                return;
            }

            var remaining = [];
            var checksDone = 0;
            pendingUsers.forEach(function (pu) {
                ApiClient.ajax({
                    type: 'POST',
                    url: ApiClient.getUrl('embycomments/register-name'),
                    dataType: 'json',
                    contentType: 'application/json',
                    data: JSON.stringify({ UserKey: pu.userKey, DisplayName: pu.displayName, CheckOnly: true })
                }).then(function (data) {
                    var warning = instance.view.querySelector('.ec-cfg-name-warning[data-user-id="' + pu.userId + '"]');
                    if (!warning) return;

                    if (data.ModerationStatus === 'approved') {
                        setNameStatus(warning, 'approved');
                    } else if (data.ModerationStatus === 'denied') {
                        setNameStatus(warning, 'denied');
                    } else {
                        remaining.push(pu);
                    }
                }).catch(function () {
                    remaining.push(pu);
                }).finally(function () {
                    checksDone++;
                    if (checksDone === pendingUsers.length) {
                        pendingUsers = remaining;
                        if (pendingUsers.length === 0) {
                            clearInterval(instance.pollTimer);
                            instance.pollTimer = null;
                        }
                    }
                });
            });
        }, POLL_INTERVAL);
    }

    function loadConfig(instance) {
        var view = instance.view;
        setLoading(view);

        ApiClient.getCurrentUser().then(function (currentUser) {
            var isAdmin = currentUser.Policy && currentUser.Policy.IsAdministrator;

            ApiClient.ajax({ type: 'GET', url: ApiClient.getUrl('Users'), dataType: 'json' }).then(function (users) {
                ApiClient.getPluginConfiguration(pluginId).then(function (config) {
                    instance.apiEndpoint = config.ApiEndpoint;
                    var chk = view.querySelector('#chkServerLocalOnly');
                    if (chk) chk.checked = !!config.ServerLocalCommentsOnly;
                    var entries = config.UserDisplayNames || [];

                    // Auto-populate avatar paths for users that don't have one stored
                    var needsSave = false;
                    users.forEach(function (user) {
                        var entry = findEntry(entries, user.Id);
                        var embyAvatar = getEmbyAvatarPath(user);
                        if (entry && !entry.AvatarBlob && embyAvatar) {
                            entry.AvatarBlob = embyAvatar;
                            needsSave = true;
                        } else if (!entry && embyAvatar) {
                            entries.push({ UserId: user.Id, DisplayName: '', AvatarBlob: embyAvatar });
                            needsSave = true;
                        }
                    });

                    if (needsSave && isAdmin) {
                        config.UserDisplayNames = entries;
                        ApiClient.updatePluginConfiguration(pluginId, config).catch(function () {});
                    }

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
        var serverId = ApiClient.serverId();
        var promises = [];

        inputs.forEach(function (input) {
            var userId = input.dataset.userId;
            var name = input.value.trim() || input.dataset.defaultName;
            var userKey = serverId + ':' + userId;

            promises.push(
                ApiClient.ajax({
                    type: 'POST',
                    url: ApiClient.getUrl('embycomments/register-name'),
                    dataType: 'json',
                    contentType: 'application/json',
                    data: JSON.stringify({ UserKey: userKey, DisplayName: name })
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
                var userId = input.dataset.userId;
                var val = input.value.trim();
                var avatarEl = view.querySelector('.ec-cfg-avatar[data-user-id="' + userId + '"]');
                var avatarPath = avatarEl ? (avatarEl.dataset.avatarPath || '') : '';
                if (val || avatarPath) {
                    entries.push({ UserId: userId, DisplayName: val, AvatarBlob: avatarPath });
                }
            });

            ApiClient.getPluginConfiguration(pluginId).then(function (config) {
                config.UserDisplayNames = entries;
                config.ServerLocalCommentsOnly = !!view.querySelector('#chkServerLocalOnly').checked;
                return ApiClient.updatePluginConfiguration(pluginId, config);
            }).then(function () {
                return syncDisplayNamesToWorker(instance, inputs);
            }).then(function () {
                trackOriginalValues(instance);
                saveBtn.disabled = true;
                view.querySelectorAll('.ec-cfg-name-warning').forEach(function (w) {
                    var input = view.querySelector('input[data-user-id="' + w.dataset.userId + '"]');
                    if (input && !input.value.trim()) {
                        w.style.display = 'none';
                    }
                });
                showStatus(view, 'Settings saved.');
                startModerationPoll(instance, inputs);
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
        this.pollTimer = null;
        this.pollCount = 0;
        var instance = this;
        view.querySelector('form').addEventListener('submit', function (e) { onSubmit(instance, e); });
        var chkLocal = view.querySelector('#chkServerLocalOnly');
        if (chkLocal) {
            chkLocal.addEventListener('change', function () {
                var saveBtn = view.querySelector('.btnSaveAll');
                if (saveBtn) saveBtn.disabled = !hasChanges(instance);
            });
        }
    }

    Object.assign(View.prototype, BaseView.prototype);

    View.prototype.onResume = function (options) {
        BaseView.prototype.onResume.apply(this, arguments);
        loadConfig(this);
    };

    View.prototype.onPause = function () {
        BaseView.prototype.onPause.apply(this, arguments);
        if (this.pollTimer) { clearInterval(this.pollTimer); this.pollTimer = null; }
        setLoading(this.view);
        this.originalValues = {};
    };

    return View;
});