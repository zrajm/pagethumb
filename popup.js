const categories = ["up", "down", "star"];

// Helper to get current tab
async function getCurrentTab() {
  const tabs = await browser.tabs.query({ active: true, currentWindow: true });
  return tabs[0];
}

// Load state and icons, then render
async function initPopup() {
  const tab = await getCurrentTab();
  if (!tab || !tab.url) {
    document.body.textContent = "No active tab";
    return;
  }

  // ---- AUTO‑LIKE: if no bookmark exists, create one in "Like" folder ----
  // Get current state from background
  let state = await browser.runtime.sendMessage({ type: "getState" });

  if (state.category === null) {
    // No bookmark – create it now
    await browser.runtime.sendMessage({
      type: "setCategory",
      category: "up"
    });
    // Fetch updated state
    state = await browser.runtime.sendMessage({ type: "getState" });
  }

  // Get all icon data URLs
  const icons = await browser.runtime.sendMessage({ type: "getIcons" });

  // Helper to set button image and tooltip
  function setupButton(category, imgId, btnId, normalName, hiliteName, labelActive, labelInactive) {
    const img = document.getElementById(imgId);
    const btn = document.getElementById(btnId);
    const isActive = state.category === category;
    const iconKey = isActive ? hiliteName : normalName;
    img.src = icons[iconKey];
    btn.title = isActive ? labelActive : labelInactive;
    btn.addEventListener("click", async () => {
      await browser.runtime.sendMessage({ type: "setCategory", category });
      window.close(); // close popup after action
    });
  }

  setupButton("up", "img-up", "btn-up",
              "like-normal", "like-hilite",
              "Remove Like", "Like page");
  setupButton("down", "img-down", "btn-down",
              "dislike-normal", "dislike-hilite",
              "Remove Dislike", "Dislike page");
  setupButton("star", "img-star", "btn-star",
              "star-normal", "hilite-star",
              "Remove Bookmark", "Bookmark page");
}

initPopup();

//EOF
