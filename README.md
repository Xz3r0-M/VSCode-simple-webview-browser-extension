## VS Code简易网页(webview2)扩展
- 网址栏
- 网页刷新按钮
- 可配置(扩展配置页)的网页收藏栏

---
## 安装
下载仓库中的`simple-webview-browser-x.x.x.vsix` → 进入VS Code的扩展侧边栏 → 右上角更多按钮 → 从 VSIX 安装

---
这是我为了直接在VS Code中打开ComfyUI网页测试我的节点代码而做的

个人备注:
- 扩展设置 添加自定义书签`ComfyUI-Xz3r0-Nodes|http://127.0.0.1:8099`
- 搜索扩展 `Quick-Command-Buttons` (https://github.com/KubrickCode/quick-command-buttons)
- Quick-Command-Buttons 添加单行命令 (Terminal), 如:`cd "D:\ComfyUI_windows_portable"; .\run_nvidia_gpu.bat`
  - 用于直接在VS Code终端(Powershell)启动ComfyUI
- Quick-Command-Buttons 添加单行命令 (VS Code API) `extension.openWebview`
- 点击 Apply changes 按钮保存
