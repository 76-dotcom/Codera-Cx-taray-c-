const { app, BrowserWindow, dialog, ipcMain, shell } = require("electron");
const { spawn } = require("node:child_process");
const fs = require("node:fs");
const path = require("node:path");

const GOODBYEDPI_RELEASES = "https://github.com/ValdikSS/GoodbyeDPI/releases";
let mainWindow;
let goodbyeDpiPath = "";
let goodbyeDpiPid = 0;
let goodbyeDpiState = "stopped";
let goodbyeDpiError = "";
let goodbyeDpiMonitor;

function getGoodbyeDpiStatus() {
  if (goodbyeDpiState === "running" && goodbyeDpiPid) {
    try {
      process.kill(goodbyeDpiPid, 0);
    } catch (error) {
      if (error.code === "ESRCH") {
        goodbyeDpiPid = 0;
        goodbyeDpiState = "stopped";
        clearInterval(goodbyeDpiMonitor);
      }
    }
  }

  return {
    state: goodbyeDpiState,
    path: goodbyeDpiPath,
    error: goodbyeDpiError
  };
}

function publishGoodbyeDpiStatus() {
  if (!mainWindow || mainWindow.isDestroyed()) return;
  mainWindow.webContents.send("goodbyedpi:status", getGoodbyeDpiStatus());
}

function isTrustedRenderer(event) {
  return mainWindow && !mainWindow.isDestroyed() && event.sender === mainWindow.webContents;
}

function runElevatedPowerShell(script, env, onOutput, onClose) {
  const encodedScript = Buffer.from(script, "utf16le").toString("base64");
  const child = spawn(
    "powershell.exe",
    ["-NoProfile", "-NonInteractive", "-EncodedCommand", encodedScript],
    {
      env: { ...process.env, ...env },
      windowsHide: true,
      stdio: ["ignore", "pipe", "pipe"]
    }
  );
  let stdout = "";
  let stderr = "";
  let closed = false;
  child.stdout.setEncoding("utf8");
  child.stderr.setEncoding("utf8");
  child.stdout.on("data", (chunk) => {
    stdout += chunk;
    onOutput(stdout);
  });
  child.stderr.on("data", (chunk) => {
    stderr += chunk;
  });
  child.on("error", (error) => {
    if (closed) return;
    closed = true;
    onClose(error, stdout, stderr);
  });
  child.on("close", (code) => {
    if (closed) return;
    closed = true;
    onClose(code === 0 ? null : new Error(stderr.trim() || "İşlem tamamlanamadı."), stdout, stderr);
  });
  return child;
}

app.on("web-contents-created", (_event, contents) => {
  if (contents.getType() !== "webview") return;

  contents.setWindowOpenHandler(({ url }) => {
    try {
      const target = new URL(url);
      if ((target.protocol === "http:" || target.protocol === "https:") && mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send("browser:new-tab", url);
      }
    } catch {
      // Ignore malformed popup URLs.
    }
    return { action: "deny" };
  });

  contents.on("will-navigate", (event, url) => {
    try {
      const target = new URL(url);
      if (target.protocol !== "http:" && target.protocol !== "https:") event.preventDefault();
    } catch {
      event.preventDefault();
    }
  });
});

app.on("before-quit", () => {
  clearInterval(goodbyeDpiMonitor);
});

ipcMain.handle("goodbyedpi:status", (event) => {
  if (!isTrustedRenderer(event)) return { state: "stopped", path: "", error: "" };
  return getGoodbyeDpiStatus();
});

ipcMain.handle("goodbyedpi:select", async (event) => {
  if (!isTrustedRenderer(event)) return { ok: false, error: "İstek reddedildi." };
  const result = await dialog.showOpenDialog(mainWindow, {
    title: "GoodbyeDPI uygulama dosyasını seç",
    properties: ["openFile"],
    filters: [{ name: "GoodbyeDPI uygulaması", extensions: ["exe"] }]
  });
  if (result.canceled) return { ok: false, canceled: true };

  const selectedPath = result.filePaths[0];
  if (!selectedPath || !/^goodbyedpi\.exe$/i.test(path.basename(selectedPath))) {
    return { ok: false, error: "Lütfen resmi paketteki goodbyedpi.exe dosyasını seç." };
  }
  try {
    if (!fs.statSync(selectedPath).isFile()) {
      return { ok: false, error: "Seçilen dosya geçerli değil." };
    }
  } catch {
    return { ok: false, error: "Seçilen dosyaya erişilemiyor." };
  }

  goodbyeDpiPath = selectedPath;
  goodbyeDpiError = "";
  publishGoodbyeDpiStatus();
  return { ok: true, ...getGoodbyeDpiStatus() };
});

ipcMain.handle("goodbyedpi:open-releases", async (event) => {
  if (!isTrustedRenderer(event)) return { ok: false, error: "İstek reddedildi." };
  await shell.openExternal(GOODBYEDPI_RELEASES);
  return { ok: true };
});

ipcMain.handle("goodbyedpi:start", (event) => {
  if (!isTrustedRenderer(event)) return { ok: false, error: "İstek reddedildi." };
  if (process.platform !== "win32") return { ok: false, error: "GoodbyeDPI Windows içindir." };
  if (!goodbyeDpiPath) return { ok: false, error: "Önce goodbyedpi.exe dosyasını seç." };
  if (goodbyeDpiState === "starting" || goodbyeDpiState === "running") {
    return { ok: false, error: "GoodbyeDPI zaten çalışıyor veya başlatılıyor." };
  }

  goodbyeDpiState = "starting";
  goodbyeDpiError = "";
  publishGoodbyeDpiStatus();

  const startScript = [
    "$ErrorActionPreference = 'Stop'",
    "$process = Start-Process -FilePath $env:CODERACX_GOODBYEDPI_PATH -ArgumentList '-9' -Verb RunAs -PassThru",
    "$process.Id"
  ].join("\n");

  runElevatedPowerShell(
    startScript,
    { CODERACX_GOODBYEDPI_PATH: goodbyeDpiPath },
    (output) => {
      const match = output.match(/(?:^|\r?\n)\s*(\d+)\s*(?:\r?\n|$)/);
      if (match && goodbyeDpiState === "starting") {
        goodbyeDpiPid = Number(match[1]);
        goodbyeDpiState = "running";
        goodbyeDpiMonitor = setInterval(() => {
          const status = getGoodbyeDpiStatus();
          publishGoodbyeDpiStatus();
          if (status.state !== "running") clearInterval(goodbyeDpiMonitor);
        }, 2000);
        publishGoodbyeDpiStatus();
      }
    },
    (error) => {
      if (error) {
        goodbyeDpiPid = 0;
        goodbyeDpiState = "stopped";
        goodbyeDpiError = `Başlatılamadı: ${error.message}`;
      }
      publishGoodbyeDpiStatus();
    }
  );

  return { ok: true, ...getGoodbyeDpiStatus() };
});

ipcMain.handle("goodbyedpi:stop", (event) => {
  if (!isTrustedRenderer(event)) return { ok: false, error: "İstek reddedildi." };
  if (goodbyeDpiState !== "running" || !goodbyeDpiPid) {
    return { ok: false, error: "Çalışan bir GoodbyeDPI süreci yok." };
  }

  const pid = goodbyeDpiPid;
  goodbyeDpiState = "stopping";
  publishGoodbyeDpiStatus();
  const stopScript = [
    "$ErrorActionPreference = 'Stop'",
    "$process = Get-Process -Id ([int]$env:CODERACX_GOODBYEDPI_PID)",
    "if ($process.Path -ne $env:CODERACX_GOODBYEDPI_PATH) { throw 'İşlem kimliği doğrulanamadı.' }",
    "Stop-Process -Id $process.Id -Force"
  ].join("\n");
  const elevateStopScript = [
    "$ErrorActionPreference = 'Stop'",
    "$process = Start-Process -FilePath 'powershell.exe' -Verb RunAs -Wait -PassThru -ArgumentList @('-NoProfile', '-NonInteractive', '-EncodedCommand', $env:CODERACX_STOP_COMMAND)",
    "if ($process.ExitCode -ne 0) { exit $process.ExitCode }"
  ].join("\n");

  runElevatedPowerShell(
    elevateStopScript,
    {
      CODERACX_GOODBYEDPI_PID: String(pid),
      CODERACX_GOODBYEDPI_PATH: goodbyeDpiPath,
      CODERACX_STOP_COMMAND: Buffer.from(stopScript, "utf16le").toString("base64")
    },
    () => {},
    (error) => {
      if (error) {
        goodbyeDpiState = "running";
        goodbyeDpiError = `Durdurulamadı: ${error.message}`;
      } else {
        goodbyeDpiPid = 0;
        goodbyeDpiState = "stopped";
        goodbyeDpiError = "";
        clearInterval(goodbyeDpiMonitor);
      }
      publishGoodbyeDpiStatus();
    }
  );

  return { ok: true, ...getGoodbyeDpiStatus() };
});

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1440,
    height: 920,
    minWidth: 800,
    minHeight: 600,
    backgroundColor: "#101014",
    title: "Codera CX",
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      webviewTag: true,
      preload: path.join(__dirname, "preload.js")
    }
  });

  mainWindow.loadFile(path.join(__dirname, "index.html")).catch((error) => {
    const message = `Codera CX arayüzü yüklenemedi: ${error.message}`;
    console.error(message);
    dialog.showErrorBox("Codera CX başlatılamadı", message);
  });

  mainWindow.webContents.setWindowOpenHandler(() => ({ action: "deny" }));
}

app.whenReady().then(() => {
  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
