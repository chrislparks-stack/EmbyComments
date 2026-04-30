define(['baseView', 'loading', 'emby-input', 'emby-button', 'emby-scroller'], function (BaseView, loading) {
    'use strict';

    var pluginId = 'a4b7c2d1-e5f6-4a3b-8c9d-0e1f2a3b4c5d';
    var MAX_NAME_LENGTH = 50;
    var POLL_INTERVAL = 5000;
    var MAX_POLL_ATTEMPTS = 10;
    var FEED_REFRESH_INTERVAL = 60000;

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
        view.querySelector('.communityCommentsUserList').innerHTML =
            '<p style="color:var(--theme-text-color-secondary,#aaa);">Loading users...</p>';
        view.querySelector('.btnSaveAll').disabled = true;
    }

    function setError(view, msg) {
        var container = view.querySelector('.communityCommentsUserList');
        container.innerHTML = '';
        var p = document.createElement('p');
        p.style.color = 'var(--theme-error-color,#e74c3c)';
        p.textContent = msg;
        container.appendChild(p);
    }

    function showStatus(view, msg, isError) {
        var el = view.querySelector('.communityCommentsStatus');
        el.textContent = msg;
        el.style.color = isError ? 'var(--theme-error-color, #e74c3c)' : 'var(--theme-success-color, #2ecc71)';
        el.style.display = 'block';
        setTimeout(function () { el.style.display = 'none'; }, 3000);
    }

    function hasChanges(instance) {
        var chk = instance.view.querySelector('#chkServerLocalOnly');
        if (chk && chk.checked !== !!instance.originalLocalOnly) return true;
        var hostEl = instance.view.querySelector('#txtPublicHost');
        if (hostEl && hostEl.value.trim() !== (instance.originalPublicHost || '')) return true;
        var portEl = instance.view.querySelector('#txtPublicPort');
        if (portEl && (parseInt(portEl.value, 10) || 0) !== (instance.originalPublicPort || 0)) return true;
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
        var hostEl = instance.view.querySelector('#txtPublicHost');
        instance.originalPublicHost = hostEl ? hostEl.value.trim() : '';
        var portEl = instance.view.querySelector('#txtPublicPort');
        instance.originalPublicPort = portEl ? (parseInt(portEl.value, 10) || 0) : 0;
    }

    function setNameStatus(warning, status, reason) {
        if (status === 'awaiting') {
            warning.innerHTML = SHIELD_SVG;
            warning.appendChild(document.createTextNode(' Waiting for moderation'));
            warning.style.color = '#3498db';
            warning.style.display = 'inline';
        } else if (status === 'approved') {
            warning.textContent = '\u2714 Custom name approved';
            warning.style.color = '#2ecc71';
            warning.style.display = 'inline';
        } else if (status === 'denied') {
            warning.textContent = '\u26A0 ' + (reason || 'This name was flagged and cannot post comments');
            warning.style.color = 'var(--theme-error-color, #e74c3c)';
            warning.style.display = 'inline';
        } else {
            warning.style.display = 'none';
        }
    }

    function renderUsers(instance, users, entries, isAdmin) {
        var view = instance.view;
        var userList = view.querySelector('.communityCommentsUserList');
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

            var label = document.createElement('label');
            label.style.cssText = 'min-width:120px; font-weight:bold; color:inherit;';
            label.textContent = user.Name;
            label.htmlFor = 'ec-user-name-' + user.Id;

            var inputWrap = document.createElement('div');
            inputWrap.className = 'inputContainer';
            inputWrap.style.cssText = 'flex:1; margin:0;';

            var input = document.createElement('input');
            input.type = 'text';
            input.id = 'ec-user-name-' + user.Id;
            input.name = 'ec-user-name-' + user.Id;
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
                url: ApiClient.getUrl('communitycomments/register-name'),
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
                    url: ApiClient.getUrl('communitycomments/register-name'),
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

    var FEED_LABELS = {
        'mod.ban.auto':              { icon: '🚫', text: 'Auto-ban' },
        'admin.ban_user':            { icon: '🔒', text: 'Admin ban' },
        'admin.unban_user':          { icon: '🔓', text: 'Unbanned' },
        'moderation.comment_denied': { icon: '❌', text: 'Comment denied' },
        'moderation.comment_approved': { icon: '✅', text: 'Comment approved' },
        'comment.report':            { icon: '⚠️', text: 'Report threshold' },
        'admin.server_ban':          { icon: '🔴', text: 'Server banned' },
        'admin.server_unban':        { icon: '🟢', text: 'Server reinstated' }
    };

    function formatFeedTime(iso) {
        var d = new Date(iso);
        return d.toLocaleDateString() + ' ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }

    function renderFeedEvent(ev) {
        var detail = {};
        try { detail = JSON.parse(ev.Detail || '{}'); } catch (_) {}
        var label = FEED_LABELS[ev.Action] || { icon: '•', text: ev.Action };

        // AffectedUserName = the user the event is about (the banned/moderated user)
        var displayName = ev.AffectedUserName || ev.ActorName || null;
        var nameHtml = displayName
            ? '<strong>' + escHtml(displayName) + '</strong>'
            : '<em style="color:var(--theme-text-color-secondary,#aaa);">unknown user</em>';

        var subtext = '';
        var rowBorderLeft = '';
        if (ev.Action === 'mod.ban.auto' || ev.Action === 'admin.ban_user') {
            var banSuffix = '';
            if (detail.banType === 'permanent') {
                banSuffix = ' (permanent)';
            } else if (detail.expiresAt) {
                var exp = new Date(detail.expiresAt);
                var created = new Date(ev.CreatedAt);
                var mins = Math.round((exp - created) / 60000);
                var durationStr = mins >= 1440 ? Math.round(mins / 1440) + 'd' : mins >= 60 ? Math.round(mins / 60) + 'h' : mins + 'm';
                banSuffix = ' (' + durationStr + ', until ' + exp.toLocaleDateString() + ' ' + exp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ')';
            }
            subtext = escHtml(detail.reason || '') + banSuffix;
        } else if (ev.Action === 'moderation.comment_denied') {
            subtext = escHtml(detail.reason || '');
        } else if (ev.Action === 'moderation.comment_approved') {
            subtext = detail.finalStatus === 'spoiler' ? 'marked as spoiler' : '';
        } else if (ev.Action === 'comment.report') {
            subtext = (detail.newReportCount || 3) + ' reports' + (detail.reason ? ' — ' + escHtml(detail.reason) : '');
        } else if (ev.Action === 'admin.server_ban') {
            var block = document.createElement('div');
            block.style.cssText = 'background:rgba(231,76,60,0.15); border-left:4px solid #e74c3c; border-radius:4px; padding:0.75em 1em; margin:0.4em 0;';
            block.innerHTML =
                '<div style="display:flex; align-items:center; gap:0.5em;">' +
                  '<span>🔴</span>' +
                  '<strong style="color:#e74c3c; font-size:0.95em;">SERVER BANNED</strong>' +
                  (detail.reason ? '<span style="color:var(--theme-text-color-secondary,#aaa); font-size:0.85em;"> — ' + escHtml(detail.reason) + '</span>' : '') +
                '</div>' +
                '<div style="font-size:0.75em; color:var(--theme-text-color-secondary,#aaa); margin-top:0.4em;">' + formatFeedTime(ev.CreatedAt) + '</div>';
            return block;
        } else if (ev.Action === 'admin.server_unban') {
            var unbanBlock = document.createElement('div');
            unbanBlock.style.cssText = 'background:rgba(46,204,113,0.08); border-left:4px solid #2ecc71; border-radius:4px; padding:0.6em 1em; margin:0.4em 0;';
            unbanBlock.innerHTML =
                '<div style="display:flex; align-items:center; gap:0.5em;">' +
                  '<span>🟢</span>' +
                  '<strong style="color:#2ecc71; font-size:0.9em;">Server reinstated</strong>' +
                  (detail.message ? '<span style="color:var(--theme-text-color-secondary,#aaa); font-size:0.85em;"> — ' + escHtml(detail.message) + '</span>' : '') +
                '</div>' +
                '<div style="font-size:0.75em; color:var(--theme-text-color-secondary,#aaa); margin-top:0.3em;">' + formatFeedTime(ev.CreatedAt) + '</div>';
            return unbanBlock;
        }

        var previewHtml = ev.CommentPreview
            ? '<div style="font-size:0.8em; color:var(--theme-text-color-secondary,#aaa); margin-top:3px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">' + escHtml(ev.CommentPreview) + '</div>'
            : '';

        var row = document.createElement('div');
        row.style.cssText = 'display:flex; align-items:flex-start; gap:0.75em; padding:0.6em 0.8em; border-bottom:1px solid var(--theme-border-color,#333);' + (rowBorderLeft ? 'border-left:' + rowBorderLeft + ';' : '');
        var nameSeparator = nameHtml ? ' — ' + nameHtml : '';
        row.innerHTML =
            '<span style="font-size:1.1em; flex-shrink:0; margin-top:1px;">' + label.icon + '</span>' +
            '<div style="flex:1; min-width:0;">' +
              '<div style="font-size:0.88em;">' +
                '<span style="color:var(--theme-text-color-secondary,#aaa);">' + escHtml(label.text) + '</span>' +
                nameSeparator +
                (subtext ? '<span style="color:var(--theme-text-color-secondary,#aaa);"> — ' + subtext + '</span>' : '') +
              '</div>' +
              previewHtml +
              '<div style="font-size:0.75em; color:var(--theme-text-color-secondary,#aaa); margin-top:2px;">' + formatFeedTime(ev.CreatedAt) + '</div>' +
            '</div>';
        return row;
    }

    function escHtml(str) {
        return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    }

    function loadServerBanStatus(instance) {
        var view = instance.view;
        var banner = view.querySelector('.ecServerBanBanner');
        if (!banner) return;

        ApiClient.ajax({ type: 'GET', url: ApiClient.getUrl('communitycomments/server-ban-status'), dataType: 'json' })
            .then(function (data) {
                if (data.error || !data.banned) {
                    banner.style.display = 'none';
                    return;
                }
                renderServerBanBanner(instance, data);
            })
            .catch(function () {
                banner.style.display = 'none';
            });
    }

    var BAN_INFO_HTML =
        '<div class="ecSrvBanInfoPanel" style="display:none;margin-top:0.65em;font-size:0.83em;' +
        'color:var(--theme-text-color-secondary,#aaa);background:rgba(0,0,0,0.18);' +
        'border-radius:4px;padding:0.6em 0.75em;line-height:1.5;">' +
        'While suspended, <strong style="color:#e0e0e0">all users on this server are unable to post comments, reply, or interact</strong> with ' +
        'any content in the Community Comments network. Additionally, all existing comments from this server\'s users ' +
        'are hidden network-wide — users on other servers will not see them. ' +
        'The suspension reason above describes the specific violation that led to this action. ' +
        'Submit an appeal below if you believe this action was made in error.' +
        '</div>';

    function makeBanInfoToggle() {
        var btn = document.createElement('button');
        btn.textContent = '▸ What does this mean?';
        btn.style.cssText = 'display:block;background:none;border:none;color:rgba(180,180,180,0.65);cursor:pointer;font-size:0.8em;padding:0;margin-top:0.5em;text-align:left;';
        btn.addEventListener('click', function () {
            var panel = btn.parentElement.querySelector('.ecSrvBanInfoPanel');
            if (panel) {
                var open = panel.style.display !== 'none';
                panel.style.display = open ? 'none' : 'block';
                btn.textContent = (open ? '▸' : '▾') + ' What does this mean?';
            }
        });
        return btn;
    }

    function renderServerBanBanner(instance, status) {
        var view = instance.view;
        var banner = view.querySelector('.ecServerBanBanner');
        if (!banner) return;

        var appealStatus = status.appealStatus || null;
        var appealResponse = status.appealResponse || null;
        var banReason = status.banReason || 'No reason provided';

        if (appealStatus === 'pending') {
            banner.style.background = 'rgba(230,126,34,0.12)';
            banner.style.border = '1px solid rgba(230,126,34,0.4)';
            var pendingDiv = document.createElement('div');
            pendingDiv.innerHTML =
                '<div style="display:flex;align-items:flex-start;gap:0.75em;">' +
                '<span style="font-size:1.1em;flex-shrink:0;">⚠️</span>' +
                '<div style="flex:1">' +
                '<strong style="color:rgba(230,126,34,0.95)">This server has been suspended.</strong>' +
                '<div style="font-size:0.88em;color:rgba(230,126,34,0.8);margin-top:0.25em">' +
                'Reason: ' + escHtml(banReason) + '</div>' +
                '<div style="font-size:0.85em;color:rgba(230,126,34,0.75);margin-top:0.5em">' +
                '⏳ Appeal submitted — awaiting moderator review</div>' +
                BAN_INFO_HTML +
                '</div></div>';
            pendingDiv.querySelector('.ecSrvBanInfoPanel').before(makeBanInfoToggle());
            banner.innerHTML = '';
            banner.appendChild(pendingDiv);
            banner.style.display = 'block';
        } else if (appealStatus === 'denied') {
            banner.style.background = 'rgba(192,57,43,0.12)';
            banner.style.border = '1px solid rgba(192,57,43,0.4)';
            var deniedDiv = document.createElement('div');
            deniedDiv.innerHTML =
                '<div style="display:flex;align-items:flex-start;gap:0.75em;">' +
                '<span style="font-size:1.1em;flex-shrink:0;">🚫</span>' +
                '<div style="flex:1">' +
                '<strong style="color:rgba(231,76,60,0.95)">This server has been suspended.</strong>' +
                '<div style="font-size:0.88em;color:rgba(231,76,60,0.8);margin-top:0.25em">' +
                'Reason: ' + escHtml(banReason) + '</div>' +
                (appealResponse
                    ? '<div style="font-size:0.85em;color:rgba(231,76,60,0.75);margin-top:0.5em">' +
                      'Appeal denied: ' + escHtml(appealResponse) + '</div>'
                    : '<div style="font-size:0.85em;color:rgba(231,76,60,0.7);margin-top:0.5em">Your appeal was denied.</div>') +
                BAN_INFO_HTML +
                '</div></div>';
            deniedDiv.querySelector('.ecSrvBanInfoPanel').before(makeBanInfoToggle());
            banner.innerHTML = '';
            banner.appendChild(deniedDiv);
            banner.style.display = 'block';
        } else {
            // No appeal submitted yet
            banner.style.background = 'rgba(192,57,43,0.12)';
            banner.style.border = '1px solid rgba(192,57,43,0.4)';
            var noAppealDiv = document.createElement('div');
            noAppealDiv.innerHTML =
                '<div style="display:flex;align-items:flex-start;gap:0.75em;">' +
                '<span style="font-size:1.1em;flex-shrink:0;">🚫</span>' +
                '<div style="flex:1">' +
                '<strong style="color:rgba(231,76,60,0.95)">This server has been suspended.</strong>' +
                '<div style="font-size:0.88em;color:rgba(231,76,60,0.8);margin-top:0.25em">' +
                'Reason: ' + escHtml(banReason) + '</div>' +
                BAN_INFO_HTML +
                '<div style="margin-top:0.75em">' +
                '<button class="ecSrvBanAppealBtn" style="background:none;border:1px solid rgba(155,89,182,0.5);border-radius:4px;color:rgba(178,133,216,0.9);cursor:pointer;font-size:0.82rem;padding:0.25rem 0.75rem;">' +
                '↗ Appeal</button>' +
                '</div>' +
                '<div class="ecSrvBanAppealForm" style="display:none;margin-top:0.75em">' +
                '<textarea class="ecSrvBanAppealTextarea" placeholder="Explain why this suspension should be lifted…" maxlength="1000" ' +
                'style="width:100%;background:rgba(0,0,0,0.2);border:1px solid rgba(155,89,182,0.3);border-radius:6px;color:#e0e0e0;font-size:0.85rem;padding:0.5rem;resize:none;height:72px;box-sizing:border-box;"></textarea>' +
                '<div style="display:flex;gap:0.5em;margin-top:0.5em;">' +
                '<button class="ecSrvBanAppealSubmit" style="background:rgba(155,89,182,0.2);border:1px solid rgba(155,89,182,0.5);border-radius:4px;color:rgba(178,133,216,0.9);cursor:pointer;font-size:0.82rem;padding:0.3rem 0.9rem;">Submit Appeal</button>' +
                '<button class="ecSrvBanAppealCancel" style="background:rgba(0,0,0,0.2);border:1px solid rgba(255,255,255,0.15);border-radius:4px;color:#aaa;cursor:pointer;font-size:0.82rem;padding:0.3rem 0.75rem;">Cancel</button>' +
                '<span class="ecSrvBanAppealMsg" style="font-size:0.82rem;align-self:center;"></span>' +
                '</div></div>' +
                '</div></div>';
            noAppealDiv.querySelector('.ecSrvBanInfoPanel').before(makeBanInfoToggle());
            banner.innerHTML = '';
            banner.appendChild(noAppealDiv);
            banner.style.display = 'block';

            // Wire buttons
            var appealBtn = banner.querySelector('.ecSrvBanAppealBtn');
            var appealForm = banner.querySelector('.ecSrvBanAppealForm');
            var submitBtn = banner.querySelector('.ecSrvBanAppealSubmit');
            var cancelBtn = banner.querySelector('.ecSrvBanAppealCancel');
            var msgEl = banner.querySelector('.ecSrvBanAppealMsg');

            appealBtn.addEventListener('click', function () {
                appealForm.style.display = appealForm.style.display === 'none' ? 'block' : 'none';
            });
            cancelBtn.addEventListener('click', function () {
                appealForm.style.display = 'none';
            });
            submitBtn.addEventListener('click', function () {
                var reason = banner.querySelector('.ecSrvBanAppealTextarea').value.trim();
                if (!reason) { msgEl.textContent = 'Please provide a reason.'; msgEl.style.color = '#e74c3c'; return; }
                submitBtn.disabled = true;
                submitBtn.textContent = 'Submitting…';
                msgEl.textContent = '';
                ApiClient.ajax({
                    type: 'POST',
                    url: ApiClient.getUrl('communitycomments/server-ban-appeal'),
                    dataType: 'json',
                    contentType: 'application/json',
                    data: JSON.stringify({ Reason: reason })
                }).then(function (data) {
                    if (data.ok) {
                        status.appealStatus = 'pending';
                        renderServerBanBanner(instance, status);
                    } else {
                        submitBtn.disabled = false;
                        submitBtn.textContent = 'Submit Appeal';
                        msgEl.textContent = data.error || 'Failed to submit.';
                        msgEl.style.color = '#e74c3c';
                    }
                }).catch(function () {
                    submitBtn.disabled = false;
                    submitBtn.textContent = 'Submit Appeal';
                    msgEl.textContent = 'Network error. Please try again.';
                    msgEl.style.color = '#e74c3c';
                });
            });
        }
    }

    function loadActivityFeed(instance, cursor, append) {
        var view = instance.view;
        var feedEl = view.querySelector('.ecActivityFeed');
        var loadMoreBtn = view.querySelector('.btnLoadMoreActivity');
        var updatedEl = view.querySelector('.ecActivityFeedUpdated');

        if (!append && !instance.feedLoaded) {
            feedEl.innerHTML = '<p style="color:var(--theme-text-color-secondary,#aaa);padding:1em;margin:0;">Loading activity...</p>';
        }

        var url = ApiClient.getUrl('communitycomments/activity-feed') + '?limit=25' + (cursor ? '&cursor=' + encodeURIComponent(cursor) : '');
        ApiClient.ajax({ type: 'GET', url: url, dataType: 'json' }).then(function (data) {
            if (!append) feedEl.innerHTML = '';
            instance.feedLoaded = true;

            if (data.error) {
                if (!append) feedEl.innerHTML = '<p style="color:var(--theme-error-color,#e74c3c);padding:1em;margin:0;">' + escHtml(data.error) + '</p>';
                return;
            }

            var events = data.Events || data.events || [];
            var nextCursor = data.NextCursor || data.nextCursor || null;
            if (events.length === 0 && !append) {
                feedEl.innerHTML = '<p style="color:var(--theme-text-color-secondary,#aaa);padding:1em;margin:0;">No moderation events yet.</p>';
            } else {
                events.forEach(function (ev) {
                    feedEl.appendChild(renderFeedEvent(ev));
                });
            }

            instance.feedCursor = nextCursor;
            if (loadMoreBtn) loadMoreBtn.style.display = nextCursor ? '' : 'none';
            if (updatedEl) updatedEl.textContent = 'Updated ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        }).catch(function (err) {
            if (!append) feedEl.innerHTML = '<p style="color:var(--theme-error-color,#e74c3c);padding:1em;margin:0;">Failed to load activity feed.</p>';
            console.error('[CommunityComments] activity feed error:', err);
        });
    }

    function startFeedRefresh(instance) {
        stopFeedRefresh(instance);
        instance.feedTimer = setInterval(function () {
            loadActivityFeed(instance, null, false);
            loadServerBanStatus(instance);
        }, FEED_REFRESH_INTERVAL);
    }

    function stopFeedRefresh(instance) {
        if (instance.feedTimer) { clearInterval(instance.feedTimer); instance.feedTimer = null; }
    }

    function startBanNotifySocket(instance, userUuid, token) {
        stopBanNotifySocket(instance);
        if (!instance.apiEndpoint) return;

        // Exchange token for a short-lived WS ticket so the long-lived token never
        // appears in URLs, browser history, or proxy logs.
        fetch(instance.apiEndpoint + '/ws-ticket', {
            method: 'POST',
            headers: { 'X-EC-Token': token }
        }).then(function (r) { return r.json(); }).then(function (data) {
            if (!data || !data.ticket) throw new Error('no ticket');
            var wsUrl = instance.apiEndpoint.replace(/^https:\/\//, 'wss://').replace(/^http:\/\//, 'ws://')
                + '/ban-ws?userUuid=' + encodeURIComponent(userUuid)
                + '&ticket=' + encodeURIComponent(data.ticket);
            var ws = new WebSocket(wsUrl);
            ws.onmessage = function (event) {
                try {
                    var msg = JSON.parse(event.data);
                    if (Object.prototype.hasOwnProperty.call(msg, 'serverBan')) {
                        loadServerBanStatus(instance);
                        loadActivityFeed(instance, null, false);
                    }
                } catch (_) {}
            };
            ws.onclose = function () {
                if (instance.banNotifySocket === ws) {
                    instance.banNotifySocket = null;
                    setTimeout(function () {
                        if (!instance.banNotifySocket) startBanNotifySocket(instance, userUuid, token);
                    }, 5000);
                }
            };
            instance.banNotifySocket = ws;
        }).catch(function () {
            // Reconnect later if ticket fetch failed
            setTimeout(function () {
                if (!instance.banNotifySocket) startBanNotifySocket(instance, userUuid, token);
            }, 5000);
        });
    }

    function stopBanNotifySocket(instance) {
        if (instance.banNotifySocket) {
            var ws = instance.banNotifySocket;
            instance.banNotifySocket = null;
            ws.onclose = null;
            ws.close();
        }
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
                    var hostEl = view.querySelector('#txtPublicHost');
                    if (hostEl) hostEl.value = config.PublicHost || '';
                    var portEl = view.querySelector('#txtPublicPort');
                    if (portEl) portEl.value = config.PublicPort ? String(config.PublicPort) : '';
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

                    if (isAdmin) {
                        var feedSection = view.querySelector('.ecActivityFeedSection');
                        if (feedSection) feedSection.style.display = '';
                        loadActivityFeed(instance, null, false);
                        loadServerBanStatus(instance);
                        startFeedRefresh(instance);

                        // Open WebSocket so ban status updates instantly when an appeal is resolved
                        var serverId = ApiClient.serverId();
                        var userKey = serverId + ':' + currentUser.Id;
                        var displayName = currentUser.Name;
                        ApiClient.ajax({
                            type: 'POST',
                            url: ApiClient.getUrl('communitycomments/init'),
                            dataType: 'json',
                            contentType: 'application/json',
                            data: JSON.stringify({ UserKey: userKey, DisplayName: displayName })
                        }).then(function (tokenData) {
                            var userUuid = tokenData && (tokenData.UserUuid || tokenData.userUuid);
                            if (userUuid && tokenData.token) {
                                startBanNotifySocket(instance, userUuid, tokenData.token);
                            }
                        }).catch(function () {});
                    }

                    loading.hide();
                });
            });
        }).catch(function (err) {
            console.error('[CommunityComments] loadConfig failed:', err);
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
                    url: ApiClient.getUrl('communitycomments/register-name'),
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

            var hostInput = view.querySelector('#txtPublicHost');
            var portInput = view.querySelector('#txtPublicPort');
            var publicHost = hostInput ? hostInput.value.trim() : '';
            var publicPortRaw = portInput ? parseInt(portInput.value, 10) : 0;
            var publicPort = (isFinite(publicPortRaw) && publicPortRaw > 0 && publicPortRaw <= 65535) ? publicPortRaw : 0;

            ApiClient.getPluginConfiguration(pluginId).then(function (config) {
                config.UserDisplayNames = entries;
                config.ServerLocalCommentsOnly = !!view.querySelector('#chkServerLocalOnly').checked;
                config.PublicHost = publicHost;
                config.PublicPort = publicPort;
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
                console.error('[CommunityComments] save failed:', err);
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
        this.feedTimer = null;
        this.feedCursor = null;
        this.feedLoaded = false;
        this.banNotifySocket = null;
        var instance = this;
        view.querySelector('form').addEventListener('submit', function (e) { onSubmit(instance, e); });
        var chkLocal = view.querySelector('#chkServerLocalOnly');
        if (chkLocal) {
            chkLocal.addEventListener('change', function () {
                var saveBtn = view.querySelector('.btnSaveAll');
                if (saveBtn) saveBtn.disabled = !hasChanges(instance);
            });
        }
        ['#txtPublicHost', '#txtPublicPort'].forEach(function (sel) {
            var el = view.querySelector(sel);
            if (el) {
                el.addEventListener('input', function () {
                    var saveBtn = view.querySelector('.btnSaveAll');
                    if (saveBtn) saveBtn.disabled = !hasChanges(instance);
                });
            }
        });
        var loadMoreBtn = view.querySelector('.btnLoadMoreActivity');
        if (loadMoreBtn) {
            loadMoreBtn.addEventListener('click', function () {
                if (instance.feedCursor) loadActivityFeed(instance, instance.feedCursor, true);
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
        stopFeedRefresh(this);
        stopBanNotifySocket(this);
        this.feedCursor = null;
        this.feedLoaded = false;
        setLoading(this.view);
        this.originalValues = {};
    };

    return View;
});