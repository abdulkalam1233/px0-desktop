# px0-desktop

Run the [px0](https://px0.ai) workbench on Windows like a desktop app, with its own taskbar
icon, tabs, and a server that starts when you log in.

px0 is a local web app: `px0.exe` serves its UI on `http://127.0.0.1:7777`. You can install
that page as an Edge app, but you get one window per page and no tabs. The reason is that
px0 doesn't serve a [web app manifest](https://developer.mozilla.org/en-US/docs/Web/Manifest),
and Edge only shows a tab strip for an app whose manifest asks for one. This repo adds the
missing manifest without modifying px0.

## How it works

```
Edge app (tabbed)  ──►  px0-tabs.mjs :7778  ──►  px0.exe :7777
                        adds /manifest.webmanifest
                        and a <link rel="manifest"> to each page
```

| File | What it does |
| --- | --- |
| `px0-tabs.mjs` | A small reverse proxy written in plain Node, with no dependencies. It forwards every request to px0, serves a manifest with `"display_override": ["tabbed"]`, and adds a link to that manifest in each HTML page. WebSocket connections are passed through. |
| `px0-app.ps1` | Starts `px0.exe` and the proxy if they aren't already running, then opens the app. It's safe to run any number of times. |

### `px0-app.ps1` options

| Option | Default | Meaning |
| --- | --- | --- |
| `-ServerOnly` | off | Start px0 and the proxy without opening a window. Use this from the login shortcut. |
| `-Root <folder>` | `%USERPROFILE%` | The folder px0 starts in, which is usually where your projects live. |

## Requirements

- Windows 10 or 11, with Microsoft Edge
- [PowerShell 7](https://learn.microsoft.com/powershell/scripting/install/installing-powershell-on-windows) (`pwsh`)
- Node.js 18 or later, installed through [fnm](https://github.com/Schniz/fnm) with a default version
  set (`fnm default <version>`). If you use a different Node install, change `$node` in `px0-app.ps1`.
- `px0.exe` from [px0.ai](https://px0.ai). It isn't part of this repo.

## Setup

**1. Get the files.** Clone this repo and put `px0.exe` in the same folder:

```powershell
git clone https://github.com/<you>/px0-desktop $HOME\apps\px0
# then copy px0.exe into $HOME\apps\px0
```

**2. Start the server at login.** Create a shortcut in your Startup folder, setting `-Root` to
your projects folder:

```powershell
$dir  = "$HOME\apps\px0"
$root = "$HOME\Documents\projects"   # the folder px0 starts in
$lnk  = (New-Object -ComObject WScript.Shell).CreateShortcut("$([Environment]::GetFolderPath('Startup'))\px0 server.lnk")
$lnk.TargetPath  = (Get-Command pwsh).Source
$lnk.Arguments   = "-NoProfile -WindowStyle Hidden -ExecutionPolicy Bypass -File `"$dir\px0-app.ps1`" -ServerOnly -Root `"$root`""
$lnk.WindowStyle = 7
$lnk.Save()
```

The shortcut runs at your next login. To start the server now, run
`pwsh -File $HOME\apps\px0\px0-app.ps1 -ServerOnly -Root <your projects folder>`.
Check that it's running by opening `http://127.0.0.1:7778` in a browser.

**3. Turn on tabbed apps in Edge.** Go to `edge://flags`, set **Desktop PWA tab strips** to
*Enabled*, and restart Edge.

**4. Install the app.** Open `http://127.0.0.1:7778` (port **7778**, not 7777) in a normal
Edge tab, then choose **⋯ → Apps → Install this site as an app**. Right-click the new app's
taskbar icon and pin it. To have the window open at login as well, go to `edge://apps`,
open the app, and turn on **Auto-start on device login**.

## Troubleshooting

**Every page opens in its own window.**
- You may have installed the app from `:7777`. That port has no manifest, so the app can't
  have tabs. Uninstall it in `edge://apps` and install it again from `:7778`.
- You may be using a window opened with `msedge --app=...`. That's a plain app window, not
  the installed app, and it never has tabs. Open the app from its pinned icon instead.

**There's no tab strip.**
- Check that the Edge flag is enabled and that you restarted Edge afterwards.
- Make sure the app was installed after the proxy was running. Edge reads the manifest when
  you install the app, so an app installed earlier needs to be uninstalled and installed again.

**The app shows "px0 unreachable".** The proxy is running but px0 isn't. Run
`pwsh -File px0-app.ps1 -ServerOnly`, or check whether something else is using port 7777.

**Nothing answers on :7778.** The proxy isn't running. Check the Node path in `px0-app.ps1`,
then run `node px0-tabs.mjs` in a terminal to see the error.

## Uninstall

1. Uninstall the app in `edge://apps`.
2. Delete `px0 server.lnk` from `shell:startup`.
3. Stop the processes: `Stop-Process -Name px0`, and stop the `node` process running `px0-tabs.mjs`.
4. Delete the folder.

## Notes

- The ports are fixed at 7777 for px0 and 7778 for the proxy, in both scripts. If you change
  one, change it in both.
- Both servers only listen on `127.0.0.1`, so nothing is exposed to your network.
- Edge's tabbed app mode is experimental, so it may change or disappear in a later Edge release.
