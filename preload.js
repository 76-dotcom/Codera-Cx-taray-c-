const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("codera", {
  goodbyeDpi: {
    status: () => ipcRenderer.invoke("goodbyedpi:status"),
    select: () => ipcRenderer.invoke("goodbyedpi:select"),
    start: () => ipcRenderer.invoke("goodbyedpi:start"),
    stop: () => ipcRenderer.invoke("goodbyedpi:stop"),
    openReleases: () => ipcRenderer.invoke("goodbyedpi:open-releases"),
    onStatus: (callback) => {
      const listener = (_event, status) => callback(status);
      ipcRenderer.on("goodbyedpi:status", listener);
      return () => ipcRenderer.removeListener("goodbyedpi:status", listener);
    }
  },
  onOpenUrl: (callback) => {
    const listener = (_event, url) => callback(url);
    ipcRenderer.on("browser:new-tab", listener);
    return () => ipcRenderer.removeListener("browser:new-tab", listener);
  }
});
