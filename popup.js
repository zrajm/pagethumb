//-*- js-indent-level: 2 -*-
// Copyright 2026 by zrajm. License: GPLv2 (code).

const getCurrentTab = () =>
  browser.tabs.query({ active: true, currentWindow: true }).then(([x]) => x);

// Load state and icons, then render
async function initPopup() {
  const tab = await getCurrentTab();
  if (!tab || !tab.url) {
    document.body.textContent = "No active tab";
    return;
  }

  // AUTO‑LIKE: if no bookmark exists, create one in "Like" folder
  let state = await browser.runtime.sendMessage({ type: "getState" });

  if (state.category === null) {
    await browser.runtime.sendMessage({ type: "setCategory", category: "up" });
    state = await browser.runtime.sendMessage({ type: "getState" });
  }

  // Helper to set button image and tooltip
  function setupButton(category, imgId, normalPath, hilitePath, labelActive, labelInactive) {
    const img = document.getElementById(imgId);
    const btn = document.getElementById(`btn-${category}`);
    const isActive = state.category === category;
    // Set the correct icon path
    img.src = isActive ? hilitePath : normalPath;
    btn.title = isActive ? labelActive : labelInactive;
    btn.addEventListener("click", async () => {
      await browser.runtime.sendMessage({ type: "setCategory", category });
      window.close(); // close popup after action
    });
  }

  setupButton("up", "img-up",
              "pic/like-normal.svg", "pic/like-hilite.svg",
              "Remove Like", "Like page");
  setupButton("down", "img-down",
              "pic/dislike-normal.svg", "pic/dislike-hilite.svg",
              "Remove Dislike", "Dislike page");
  setupButton("star", "img-star",
              "pic/star-normal.svg", "pic/star-hilite.svg",
              "Remove Bookmark", "Bookmark page");
}

initPopup();

//EOF
