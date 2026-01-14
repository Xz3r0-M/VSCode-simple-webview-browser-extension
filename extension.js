const vscode = require('vscode');

function activate(context) {
    const disposable = vscode.commands.registerCommand('extension.openWebview', () => {
        const panel = vscode.window.createWebviewPanel(
            'simpleBrowser',
            'Simple Browser',
            vscode.ViewColumn.One,
            {
                enableScripts: true,
                retainContextWhenHidden: true
            }
        );

        let currentUrl = 'https://www.example.com';

        function getBookmarksFromConfig() {
            const config = vscode.workspace.getConfiguration('simpleWebviewBrowser');
            const rawBookmarks = config.get('bookmarks', []);
            return rawBookmarks
                .map(item => {
                    if (typeof item !== 'string') return null;
                    const parts = item.split('|').map(s => s.trim());
                    if (parts.length !== 2) return null;
                    const [name, url] = parts;
                    if (!name || !(url.startsWith('http://') || url.startsWith('https://'))) return null;
                    return { name, url };
                })
                .filter(Boolean);
        }

        function updateWebview() {
            const bookmarks = getBookmarksFromConfig();
            panel.webview.html = getWebviewContent(currentUrl, bookmarks);
        }

        updateWebview();

        // 只有导航需要通知后端（用于更新 currentUrl 和可能的书签变更）
        panel.webview.onDidReceiveMessage(message => {
            if (message.command === 'navigate') {
                currentUrl = message.url.trim();
                if (!currentUrl.startsWith('http://') && !currentUrl.startsWith('https://')) {
                    currentUrl = 'https://' + currentUrl;
                }
                updateWebview();
            }
        });
    });

    context.subscriptions.push(disposable);
}

function getWebviewContent(url, bookmarks) {
    const bookmarkButtons = bookmarks.map(bm =>
        `<button class="bookmark-btn" data-url="${bm.url}">${bm.name}</button>`
    ).join('');

    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Simple Browser</title>
    <style>
        body {
            margin: 0;
            padding: 0;
            height: 100vh;
            display: flex;
            flex-direction: column;
            font-family: -apple-system, BlinkMacSystemFont, sans-serif;
        }
        #bookmarks-bar {
            padding: 6px 8px;
            background: #f0f0f0;
            border-bottom: 1px solid #ddd;
            display: flex;
            gap: 6px;
            flex-wrap: wrap;
        }
        .bookmark-btn {
            padding: 4px 8px;
            font-size: 13px;
            background: white;
            border: 1px solid #ccc;
            border-radius: 4px;
            cursor: pointer;
        }
        .bookmark-btn:hover {
            background: #e9e9e9;
        }
        #toolbar {
            padding: 8px;
            background: #f8f8f8;
            border-bottom: 1px solid #ddd;
            display: flex;
            gap: 8px;
        }
        #url-input {
            flex: 1;
            padding: 5px 10px;
            font-size: 14px;
            border: 1px solid #ccc;
            border-radius: 4px;
        }
        #refresh-btn {
            padding: 5px 12px;
            font-size: 14px;
            background: #007acc;
            color: white;
            border: none;
            border-radius: 4px;
            cursor: pointer;
        }
        #refresh-btn:hover {
            background: #005a9e;
        }
        iframe {
            flex: 1;
            width: 100%;
            border: none;
        }
    </style>
</head>
<body>
    <div id="bookmarks-bar">
        ${bookmarkButtons || '<span style="color:#888;font-size:12px;">无书签（请在扩展设置中添加）</span>'}
    </div>
    <div id="toolbar">
        <input type="text" id="url-input" value="${url}" />
        <button id="refresh-btn">🔄 Refresh</button>
    </div>
    <iframe id="browser-frame" src="${url}"></iframe>

    <script>
        const vscode = acquireVsCodeApi();
        const frame = document.getElementById('browser-frame');
        const urlInput = document.getElementById('url-input');

        function getCurrentCleanUrl() {
            // 移除可能存在的旧时间戳参数（_t=...）
            let url = urlInput.value.trim();
            const tsIndex = url.indexOf('_t=');
            if (tsIndex > 0) {
                // 尝试移除 &_t=... 或 ?_t=...
                url = url.replace(/[?&]_t=\\d+/, '');
                // 如果以 ? 或 & 结尾，也去掉
                url = url.replace(/[?&]$/, '');
            }
            return url;
        }

        function forceHardRefresh() {
            let cleanUrl = getCurrentCleanUrl();
            if (!cleanUrl) return;

            if (!cleanUrl.startsWith('http://') && !cleanUrl.startsWith('https://')) {
                cleanUrl = 'https://' + cleanUrl;
            }

            // Step 1: 跳转到 about:blank 中断当前加载
            frame.src = 'about:blank';

            // Step 2: 稍后加载带时间戳的新 URL（强制绕过缓存）
            setTimeout(() => {
                const sep = cleanUrl.includes('?') ? '&' : '?';
                const hardReloadUrl = cleanUrl + sep + '_t=' + Date.now();
                frame.src = hardReloadUrl;
                // 地址栏保持干净（不显示 _t 参数）
                urlInput.value = cleanUrl;
            }, 50);
        }

        document.getElementById('refresh-btn').onclick = forceHardRefresh;

        urlInput.onkeypress = (e) => {
            if (e.key === 'Enter') {
                let url = urlInput.value.trim();
                if (!url) return;
                if (!url.startsWith('http://') && !url.startsWith('https://')) {
                    url = 'https://' + url;
                }
                frame.src = url;
                // 同步 currentUrl（用于后续刷新）
                vscode.postMessage({ command: 'navigate', url: url });
            }
        };

        document.querySelectorAll('.bookmark-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const url = btn.getAttribute('data-url');
                frame.src = url;
                urlInput.value = url;
                vscode.postMessage({ command: 'navigate', url: url });
            });
        });
    </script>
</body>
</html>
    `;
}

exports.activate = activate;
exports.deactivate = () => {};