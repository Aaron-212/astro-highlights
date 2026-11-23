const copyButtonSelector = "button[data-astro-highlights-copy]";
const copyCommand = "--astro-highlights-copy";
const feedback = new WeakMap<Element, { message: string; timeout: number }>();

function getCode(button: HTMLButtonElement) {
  return button.closest(".astro-highlights-frame")?.querySelector(":scope > pre.astro-highlights > code");
}

async function copyCode(button: HTMLButtonElement, code: Element) {
  const status = button.nextElementSibling;
  if (!status) return;

  let state: "success" | "failure" = "success";
  try {
    await navigator.clipboard.writeText(code.textContent ?? "");
  } catch {
    state = "failure";
  }

  const previous = feedback.get(status);
  window.clearTimeout(previous?.timeout);
  button.dataset.astroHighlightsCopyState = state;
  let message = state === "success" ? "Copied" : "Copy failed";
  // Change repeated announcements so assistive technology can distinguish each activation.
  if (message === previous?.message) message += "\u00a0";
  status.textContent = message;
  const timeout = window.setTimeout(() => {
    delete button.dataset.astroHighlightsCopyState;
    status.textContent = "";
  }, 2000);
  feedback.set(status, { message, timeout });
}

if (typeof document !== "undefined") {
  const supportsCommands = "CommandEvent" in window && "commandForElement" in HTMLButtonElement.prototype;

  function enableCopyButtons() {
    for (const button of document.querySelectorAll<HTMLButtonElement>(`${copyButtonSelector}[hidden]`)) {
      const code = getCode(button);
      if (!code) continue;
      if (supportsCommands) {
        button.command = copyCommand;
        button.commandForElement = code;
      }
      button.hidden = false;
      const header = button.closest<HTMLElement>(".astro-highlights-header");
      if (header) header.hidden = false;
    }
  }

  if (supportsCommands) {
    document.addEventListener(
      "command",
      (event) => {
        if (
          event instanceof CommandEvent &&
          event.command === copyCommand &&
          event.source instanceof HTMLButtonElement &&
          event.target instanceof Element
        ) {
          void copyCode(event.source, event.target);
        }
      },
      true,
    );
  } else {
    document.addEventListener("click", (event) => {
      if (!(event.target instanceof Element)) return;
      const button = event.target.closest<HTMLButtonElement>(copyButtonSelector);
      if (!button) return;
      const code = getCode(button);
      if (code) void copyCode(button, code);
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", enableCopyButtons, { once: true });
  } else {
    enableCopyButtons();
  }
  document.addEventListener("astro:page-load", enableCopyButtons);
}
