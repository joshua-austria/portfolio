// Preserve bookmarks without adding a history entry.
(() => {
  const { search, hash } = window.location;
  const { homeSection, homeAnchors } = document.documentElement.dataset;
  let target = hash;

  if (homeSection) {
    let anchor = hash.slice(1);
    try {
      anchor = decodeURIComponent(anchor);
    } catch {
      // Malformed fragments fall back to the matching section.
    }
    if (!homeAnchors.split(" ").includes(anchor)) target = "#" + homeSection;
  }

  window.location.replace("home.html" + search + target);
})();
