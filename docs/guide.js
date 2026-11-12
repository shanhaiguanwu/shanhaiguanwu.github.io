const contents = document.querySelector(".guide-toc");
const chapters = [...contents.querySelectorAll("a[href^='#']")].map(link => ({
  link,
  heading: document.getElementById(link.hash.slice(1)),
}));
let activeChapter;
let jumpTarget;
let frame;

function updateCurrentChapter() {
  const scroller = document.scrollingElement;
  const bottom = Math.max(0, scroller.scrollHeight - scroller.clientHeight);
  const scroll = scroller.scrollTop;
  const offset = parseFloat(getComputedStyle(chapters[0].heading).scrollMarginBlockStart) || 0;
  const readingLine = Math.max(contents.getBoundingClientRect().bottom + 12, offset + 1);
  let chapter;

  if (jumpTarget) {
    const destination = Math.min(bottom, Math.max(0, scroll + jumpTarget.heading.getBoundingClientRect().top - offset));
    // A heading near the end can share the same scroll position as a later one.
    if (Math.abs(scroll - destination) <= 2) chapter = jumpTarget;
    else jumpTarget = undefined;
  }

  if (!chapter) {
    chapter = chapters[0];
    for (const candidate of chapters) {
      if (candidate.heading.getBoundingClientRect().top <= readingLine) chapter = candidate;
    }

    const last = chapters[chapters.length - 1];
    if (bottom > 0 && bottom - scroll <= 2 && last.heading.getBoundingClientRect().top < innerHeight) {
      chapter = last;
    }
  }

  if (chapter !== activeChapter) {
    activeChapter?.link.removeAttribute("aria-current");
    chapter.link.setAttribute("aria-current", "location");
    activeChapter = chapter;
  }
}

function scheduleUpdate() {
  if (frame) return;
  frame = requestAnimationFrame(() => {
    frame = undefined;
    updateCurrentChapter();
  });
}

function updateFromHash() {
  jumpTarget = chapters.find(({ link }) => link.hash === location.hash);
  scheduleUpdate();
}

contents.addEventListener("click", event => {
  if (event.defaultPrevented || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
  const chapter = chapters.find(({ link }) => link === event.target.closest("a"));
  if (!chapter) return;
  jumpTarget = chapter;
  scheduleUpdate();
});

window.addEventListener("scroll", scheduleUpdate, { passive: true });
window.addEventListener("resize", scheduleUpdate);
window.addEventListener("hashchange", updateFromHash);
window.addEventListener("pageshow", updateFromHash);
document.fonts?.ready.then(scheduleUpdate);
updateFromHash();
