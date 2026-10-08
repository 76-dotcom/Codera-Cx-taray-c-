const tabsElement = document.querySelector("#tabs");
const contentElement = document.querySelector("#browser-content");
const addressInput = document.querySelector("#address");
const backButton = document.querySelector("#back");
const forwardButton = document.querySelector("#forward");
const reloadButton = document.querySelector("#reload");
const noticeElement = document.querySelector("#notice");
const goodbyeDpiPanel = document.querySelector("#goodbyedpi-panel");
const goodbyeDpiStateElement = document.querySelector("#goodbyedpi-state");
const goodbyeDpiPathElement = document.querySelector("#goodbyedpi-path");
const goodbyeDpiSelectButton = document.querySelector("#goodbyedpi-select");
const goodbyeDpiToggleButton = document.querySelector("#goodbyedpi-toggle");
const tabs = [];
let activeTabId = 0;
let nextTabId = 1;
let noticeTimer;

function showNotice(message) {
  noticeElement.textContent = message;
  noticeElement.classList.add("visible");
  clearTimeout(noticeTimer);
  noticeTimer = setTimeout(() => noticeElement.classList.remove("visible"), 3200);
}

function activeTab() {
  return tabs.find((tab) => tab.id === activeTabId);
}

function renderTabs() {
  tabsElement.replaceChildren();

  for (const tab of tabs) {
    const tabItem = document.createElement("div");
    tabItem.className = "tab-item";

    const tabButton = document.createElement("button");
    tabButton.className = `tab${tab.id === activeTabId ? " active" : ""}`;
    tabButton.type = "button";
    tabButton.setAttribute("role", "tab");
    tabButton.setAttribute("aria-selected", String(tab.id === activeTabId));
    tabButton.tabIndex = tab.id === activeTabId ? 0 : -1;
    tabButton.title = tab.title;
    tabButton.addEventListener("click", () => activateTab(tab.id));

    const favicon = document.createElement("span");
    favicon.className = "tab-favicon";
    favicon.setAttribute("aria-hidden", "true");
    favicon.textContent = tab.loading ? "◌" : "◉";

    const title = document.createElement("span");
    title.className = "tab-title";
    title.textContent = tab.title;

    const closeButton = document.createElement("button");
    closeButton.className = "close-tab";
    closeButton.type = "button";
    closeButton.title = "Sekmeyi kapat";
    closeButton.setAttribute("aria-label", `${tab.title} sekmesini kapat`);
    closeButton.textContent = "×";
    closeButton.addEventListener("click", () => {
      closeTab(tab.id);
    });

    tabButton.append(favicon, title);
    tabItem.append(tabButton, closeButton);
    tabsElement.append(tabItem);
  }
}

function setTabTitle(tab, title) {
  tab.title = title || "Yeni sekme";
  renderTabs();
  if (tab.id === activeTabId && tab.url) document.title = `${tab.title} - Codera CX`;
}

function updateNavigation(tab) {
  if (tab.id !== activeTabId) return;
  backButton.disabled = !tab.viewReady || !tab.view.canGoBack();
  forwardButton.disabled = !tab.viewReady || !tab.view.canGoForward();
  addressInput.value = tab.url || "";
  document.title = tab.url ? `${tab.title} - Codera CX` : "Yeni sekme - Codera CX";
}

function activateTab(id) {
  const tab = tabs.find((item) => item.id === id);
  if (!tab) return;

  activeTabId = id;
  for (const item of tabs) {
    item.panel.hidden = item.id !== id;
  }
  renderTabs();
  updateNavigation(tab);
}

function createStartPage(tab) {
  const page = document.createElement("div");
  page.className = "start-page";

  const content = document.createElement("div");
  content.className = "start-content";

  const logo = document.createElement("div");
  logo.className = "start-logo";
  logo.append(document.createTextNode("Codera"), Object.assign(document.createElement("span"), { textContent: "CX" }));

  const heading = document.createElement("h1");
  heading.textContent = "Tarayıcıya hoş geldin";

  const subtitle = document.createElement("p");
  subtitle.textContent = "Aradığını bul, kendi hızında gezin.";

  const searchForm = document.createElement("form");
  searchForm.className = "start-search";
  const searchIcon = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  searchIcon.setAttribute("viewBox", "0 0 24 24");
  searchIcon.setAttribute("aria-hidden", "true");
  const searchPath = document.createElementNS("http://www.w3.org/2000/svg", "path");
  searchPath.setAttribute("d", "m20 20-4.5-4.5M18 10.5a7.5 7.5 0 1 1-15 0 7.5 7.5 0 0 1 15 0Z");
  searchIcon.append(searchPath);

  const searchInput = document.createElement("input");
  searchInput.type = "text";
  searchInput.placeholder = "Web'de ara veya adres gir";
  searchInput.setAttribute("aria-label", "Web'de ara veya adres gir");
  searchInput.autocomplete = "off";
  searchInput.spellcheck = false;
  searchForm.append(searchIcon, searchInput);
  searchForm.addEventListener("submit", (event) => {
    event.preventDefault();
    navigate(searchInput.value);
  });

  const quickLabel = document.createElement("div");
  quickLabel.className = "quick-label";
  quickLabel.textContent = "YAYINCI ARAÇLARI";

  const shortcutGroups = [
    {
      title: "Yayın ve yayın araçları",
      shortcuts: [
        { label: "OBS Studio", icon: "◉", url: "https://obsproject.com" },
        { label: "Streamlabs", icon: "▣", url: "https://streamlabs.com" },
        { label: "Twitch", icon: "▰", url: "https://www.twitch.tv" },
        { label: "YouTube Live", icon: "▶", url: "https://studio.youtube.com" },
        { label: "Kick", icon: "K", url: "https://kick.com" },
        { label: "Discord", icon: "◌", url: "https://discord.com/app" }
      ]
    },
    {
      title: "Oyun mağazaları ve platformlar",
      shortcuts: [
        { label: "Steam", icon: "S", url: "https://store.steampowered.com" },
        { label: "Epic Games", icon: "E", url: "https://store.epicgames.com" },
        { label: "Xbox", icon: "X", url: "https://www.xbox.com/play" },
        { label: "PlayStation", icon: "P", url: "https://www.playstation.com" },
        { label: "GOG", icon: "G", url: "https://www.gog.com" },
        { label: "EA", icon: "EA", url: "https://www.ea.com/ea-app" },
        { label: "Ubisoft", icon: "U", url: "https://store.ubisoft.com" },
        { label: "Battle.net", icon: "B", url: "https://battle.net" },
        { label: "Riot Games", icon: "R", url: "https://www.riotgames.com" },
        { label: "itch.io", icon: "i", url: "https://itch.io" },
        { label: "GeForce NOW", icon: "N", url: "https://play.geforcenow.com" }
      ]
    }
  ];
  const quickSections = document.createDocumentFragment();

  for (const group of shortcutGroups) {
    const groupTitle = document.createElement("div");
    groupTitle.className = "quick-group-title";
    groupTitle.textContent = group.title;

    const links = document.createElement("div");
    links.className = "quick-links";

    for (const shortcut of group.shortcuts) {
      const link = document.createElement("button");
      link.className = "quick-link";
      link.type = "button";
      link.title = `Codera CX sekmesinde ${shortcut.label} sitesini aç`;
      link.addEventListener("click", () => navigate(shortcut.url));

      const icon = document.createElement("span");
      icon.className = "quick-icon";
      icon.textContent = shortcut.icon;

      const label = document.createElement("span");
      label.textContent = shortcut.label;
      link.append(icon, label);
      links.append(link);
    }
    quickSections.append(groupTitle, links);
  }

  const footer = document.createElement("div");
  footer.className = "start-footer";
  footer.textContent = "Resmî web sitelerine kısayollar · Codera CX";
  content.append(logo, heading, subtitle, searchForm, quickLabel, quickSections, footer);
  page.append(content);
  page.addEventListener("click", (event) => {
    if (event.target === page) addressInput.focus();
  });
  tab.panel.append(page);
}

function createTab() {
  const tab = {
    id: nextTabId++,
    title: "Yeni sekme",
    url: "",
    loading: false,
    view: null,
    viewReady: false,
    panel: document.createElement("div")
  };
  tab.panel.className = "tab-panel";
  tab.panel.style.width = "100%";
  tab.panel.style.height = "100%";
  contentElement.append(tab.panel);
  tabs.push(tab);
  createStartPage(tab);
  activateTab(tab.id);
  addressInput.focus();
  addressInput.select();
}

function goHome() {
  const tab = activeTab();
  if (!tab) return;
  tab.view = null;
  tab.viewReady = false;
  tab.url = "";
  tab.title = "Yeni sekme";
  tab.loading = false;
  tab.panel.replaceChildren();
  createStartPage(tab);
  renderTabs();
  updateNavigation(tab);
}

function ensureWebView(tab) {
  if (tab.view) return tab.view;

  const view = document.createElement("webview");
  view.className = "page-view";
  view.setAttribute("allowpopups", "false");
  view.setAttribute("partition", "persist:gx-browser");
  view.setAttribute("webpreferences", "contextIsolation=yes,nodeIntegration=no,sandbox=yes");
  view.setAttribute("aria-label", "Web sayfası");
  view.addEventListener("dom-ready", () => {
    tab.viewReady = true;
    updateNavigation(tab);
  });
  view.addEventListener("did-start-loading", () => {
    tab.loading = true;
    renderTabs();
  });
  view.addEventListener("did-stop-loading", () => {
    tab.loading = false;
    renderTabs();
    updateNavigation(tab);
  });
  view.addEventListener("page-title-updated", (event) => {
    setTabTitle(tab, event.title);
  });
  view.addEventListener("did-navigate", (event) => {
    tab.url = event.url;
    updateNavigation(tab);
  });
  view.addEventListener("did-navigate-in-page", (event) => {
    tab.url = event.url;
    updateNavigation(tab);
  });
  view.addEventListener("did-fail-load", (event) => {
    if (event.errorCode !== -3 && tab.id === activeTabId) {
      showNotice(`Sayfa yüklenemedi: ${event.errorDescription}`);
    }
  });
  tab.panel.replaceChildren(view);
  tab.view = view;
  return view;
}

function resolveAddress(input) {
  const value = input.trim();
  if (!value) return { error: "Bir adres veya arama terimi gir." };
  if (/\s/.test(value)) {
    return { url: `https://www.google.com/search?q=${encodeURIComponent(value)}` };
  }

  let parsed;
  try {
    parsed = new URL(value.includes("://") ? value : `https://${value}`);
  } catch {
    return { url: `https://www.google.com/search?q=${encodeURIComponent(value)}` };
  }

  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    return { error: "Güvenlik nedeniyle yalnızca HTTP ve HTTPS adreslerine gidilebilir." };
  }
  return { url: parsed.href };
}

function navigate(input) {
  const result = resolveAddress(input);
  if (result.error) {
    showNotice(result.error);
    return;
  }

  const tab = activeTab();
  const view = ensureWebView(tab);
  tab.url = result.url;
  tab.title = new URL(result.url).hostname;
  updateNavigation(tab);
  view.src = result.url;
}

function openUrlInNewTab(url) {
  const result = resolveAddress(url);
  if (result.error) return;
  createTab();
  navigate(result.url);
}

function closeTab(id) {
  const index = tabs.findIndex((tab) => tab.id === id);
  if (index < 0) return;

  const [tab] = tabs.splice(index, 1);
  tab.panel.remove();
  if (tabs.length === 0) {
    createTab();
    return;
  }
  if (activeTabId === id) {
    activateTab(tabs[Math.min(index, tabs.length - 1)].id);
  } else {
    renderTabs();
  }
}

document.querySelector("#address-form").addEventListener("submit", (event) => {
  event.preventDefault();
  navigate(addressInput.value);
});

document.querySelector("#new-tab").addEventListener("click", createTab);
document.querySelector("#home").addEventListener("click", goHome);
document.querySelector("#bookmark").addEventListener("click", () => {
  showNotice("Yer imleri henüz desteklenmiyor.");
});
backButton.addEventListener("click", () => {
  const tab = activeTab();
  const view = tab?.viewReady ? tab.view : null;
  if (view?.canGoBack()) view.goBack();
});
forwardButton.addEventListener("click", () => {
  const tab = activeTab();
  const view = tab?.viewReady ? tab.view : null;
  if (view?.canGoForward()) view.goForward();
});
reloadButton.addEventListener("click", () => {
  const tab = activeTab();
  if (tab.viewReady) tab.view.reload();
  else addressInput.focus();
});

document.addEventListener("keydown", (event) => {
  const shortcut = event.ctrlKey || event.metaKey;
  if (shortcut && event.key.toLowerCase() === "l") {
    event.preventDefault();
    addressInput.focus();
    addressInput.select();
  } else if (shortcut && event.key.toLowerCase() === "t") {
    event.preventDefault();
    createTab();
  } else if (shortcut && event.key.toLowerCase() === "w") {
    event.preventDefault();
    closeTab(activeTabId);
  } else if (shortcut && event.key.toLowerCase() === "r") {
    event.preventDefault();
    const tab = activeTab();
    if (tab.viewReady) tab.view.reload();
  } else if (event.altKey && event.key === "ArrowLeft") {
    const tab = activeTab();
    if (tab?.viewReady && tab.view.canGoBack()) tab.view.goBack();
  } else if (event.altKey && event.key === "ArrowRight") {
    const tab = activeTab();
    if (tab?.viewReady && tab.view.canGoForward()) tab.view.goForward();
  }
});

createTab();

function renderGoodbyeDpiStatus(status) {
  goodbyeDpiPathElement.textContent = status.path ? status.path.split(/[\\/]/).pop() : "Uygulama seçilmedi";
  goodbyeDpiToggleButton.disabled = status.state === "starting" || status.state === "stopping" || (!status.path && status.state !== "running");
  goodbyeDpiToggleButton.textContent = status.state === "running" ? "Durdur" : status.state === "starting" ? "Başlatılıyor…" : status.state === "stopping" ? "Durduruluyor…" : "Başlat";
  goodbyeDpiStateElement.dataset.state = status.state;
  goodbyeDpiStateElement.textContent = status.error || ({
    stopped: "Kapalı",
    starting: "Yönetici izni bekleniyor…",
    running: "Çalışıyor",
    stopping: "Durduruluyor…"
  })[status.state] || "Bilinmeyen durum";
}

document.querySelector("#goodbyedpi-open").addEventListener("click", async () => {
  goodbyeDpiPanel.hidden = false;
  try {
    renderGoodbyeDpiStatus(await window.codera.goodbyeDpi.status());
  } catch (error) {
    showNotice(`GoodbyeDPI durumu alınamadı: ${error.message}`);
  }
});
document.querySelector("#goodbyedpi-close").addEventListener("click", () => {
  goodbyeDpiPanel.hidden = true;
});
goodbyeDpiPanel.addEventListener("click", (event) => {
  if (event.target === goodbyeDpiPanel) goodbyeDpiPanel.hidden = true;
});
goodbyeDpiSelectButton.addEventListener("click", async () => {
  try {
    const result = await window.codera.goodbyeDpi.select();
    if (result.ok) renderGoodbyeDpiStatus(result);
    else if (!result.canceled) showNotice(result.error);
  } catch (error) {
    showNotice(`GoodbyeDPI seçilemedi: ${error.message}`);
  }
});
goodbyeDpiToggleButton.addEventListener("click", async () => {
  try {
    const status = await window.codera.goodbyeDpi.status();
    const action = status.state === "running" ? "stop" : "start";
    const result = await window.codera.goodbyeDpi[action]();
    if (!result.ok) showNotice(result.error);
    renderGoodbyeDpiStatus(await window.codera.goodbyeDpi.status());
  } catch (error) {
    showNotice(`GoodbyeDPI işlemi başarısız: ${error.message}`);
  }
});
document.querySelector("#goodbyedpi-download").addEventListener("click", async () => {
  try {
    await window.codera.goodbyeDpi.openReleases();
  } catch (error) {
    showNotice(`Resmî sürüm sayfası açılamadı: ${error.message}`);
  }
});

window.codera.goodbyeDpi.onStatus(renderGoodbyeDpiStatus);
window.codera.onOpenUrl(openUrlInNewTab);

const licensePanel = document.querySelector("#license-panel");
document.querySelector("#license-open").addEventListener("click", () => {
  goodbyeDpiPanel.hidden = true;
  licensePanel.hidden = false;
});
document.querySelector("#license-close").addEventListener("click", () => {
  licensePanel.hidden = true;
});
licensePanel.addEventListener("click", (event) => {
  if (event.target === licensePanel) licensePanel.hidden = true;
});
