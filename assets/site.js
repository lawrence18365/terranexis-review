(() => {
  const pages = Array.from(document.querySelectorAll(".flyer-page"));
  const dots = Array.from(document.querySelectorAll("[data-page-target]"));
  const arrows = Array.from(document.querySelectorAll("[data-direction]"));

  if (!pages.length) {
    return;
  }

  let activeIndex = Math.max(0, Math.min(pages.length - 1, Number(document.body.dataset.initialPage || 1) - 1));
  let ticking = false;

  const setActive = (index) => {
    if (index < 0 || index >= pages.length) {
      return;
    }

    activeIndex = index;
    document.body.dataset.activePage = String(index + 1);

    dots.forEach((dot, dotIndex) => {
      if (dotIndex === index) {
        dot.setAttribute("aria-current", "page");
      } else {
        dot.removeAttribute("aria-current");
      }
    });

    arrows.forEach((arrow) => {
      const direction = Number(arrow.dataset.direction || 0);
      arrow.disabled = index + direction < 0 || index + direction >= pages.length;
    });
  };

  const nearestPageIndex = () => {
    let closestIndex = 0;
    let closestDistance = Number.POSITIVE_INFINITY;

    pages.forEach((page, index) => {
      const distance = Math.abs(page.getBoundingClientRect().top);
      if (distance < closestDistance) {
        closestDistance = distance;
        closestIndex = index;
      }
    });

    return closestIndex;
  };

  const scrollToPage = (index, behavior = "smooth") => {
    if (index < 0 || index >= pages.length) {
      return;
    }

    pages[index].scrollIntoView({ block: "start", behavior });
    setActive(index);
  };

  const jumpToPage = (index) => {
    const root = document.documentElement;
    const previousBehavior = root.style.scrollBehavior;

    root.style.scrollBehavior = "auto";
    pages[index].scrollIntoView({ block: "start" });
    root.style.scrollBehavior = previousBehavior;
    setActive(index);
  };

  const updateFromScroll = () => {
    ticking = false;
    setActive(nearestPageIndex());
  };

  dots.forEach((dot, index) => {
    dot.addEventListener("click", (event) => {
      event.preventDefault();
      scrollToPage(index);
      if (dot.hash) {
        history.replaceState(null, "", dot.hash);
      }
    });
  });

  arrows.forEach((arrow) => {
    arrow.addEventListener("click", () => {
      scrollToPage(activeIndex + Number(arrow.dataset.direction || 0));
    });
  });

  window.addEventListener(
    "scroll",
    () => {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(updateFromScroll);
      }
    },
    { passive: true }
  );

  window.addEventListener("keydown", (event) => {
    const target = event.target;
    const isTyping =
      target instanceof HTMLInputElement ||
      target instanceof HTMLTextAreaElement ||
      target instanceof HTMLSelectElement ||
      target?.isContentEditable;

    if (isTyping || event.altKey || event.ctrlKey || event.metaKey) {
      return;
    }

    if (["ArrowDown", "PageDown", " "].includes(event.key)) {
      event.preventDefault();
      scrollToPage(activeIndex + 1);
    }

    if (["ArrowUp", "PageUp"].includes(event.key)) {
      event.preventDefault();
      scrollToPage(activeIndex - 1);
    }

    if (event.key === "Home") {
      event.preventDefault();
      scrollToPage(0);
    }

    if (event.key === "End") {
      event.preventDefault();
      scrollToPage(pages.length - 1);
    }
  });

  if ("IntersectionObserver" in window) {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];

        if (visible) {
          setActive(pages.indexOf(visible.target));
        }
      },
      { threshold: [0.55, 0.7, 0.85] }
    );

    pages.forEach((page) => observer.observe(page));
  }

  const hashIndex = pages.findIndex((page) => `#${page.id}` === window.location.hash);
  const initialIndex = hashIndex >= 0 ? hashIndex : activeIndex;
  setActive(initialIndex);

  if (initialIndex > 0) {
    requestAnimationFrame(() => jumpToPage(initialIndex));
  }
})();
