# px0 desktop app (Windows)

Runs the [px0](https://px0.ai) workbench as an installed Edge app with tabs, and starts it at login.

- `px0-app.ps1` starts `px0.exe` on `:7777` and `px0-tabs.mjs` on `:7778` if they aren't running.
  `-ServerOnly` starts them without opening a window; `-Root` sets the folder px0 starts in.
- `px0-tabs.mjs` proxies px0 and adds a web manifest with `display_override: ["tabbed"]`,
  which px0 doesn't serve itself. No dependencies, just Node.

## Setup

1. Put `px0.exe` in this folder (it isn't committed).
2. Server at login: add a shortcut to `shell:startup` running
   `pwsh -NoProfile -WindowStyle Hidden -ExecutionPolicy Bypass -File "<this folder>\px0-app.ps1" -ServerOnly -Root "<your projects folder>"`
3. In `edge://flags`, enable **Desktop PWA tab strips** and restart Edge.
4. Open `http://127.0.0.1:7778` in Edge → **⋯ → Apps → Install this site as an app**, then pin it.
   Install from `:7778`, not `:7777`, or you get no tabs.

`px0-app.ps1` expects Node at fnm's default alias (`%APPDATA%\fnm\aliases\default\node.exe`); edit `$node` otherwise.
