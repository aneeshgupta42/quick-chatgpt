// background.js (MV3 service worker)

// Track pending navigations so we only inject once per created tab.
const pending = new Map(); // tabId -> { query, targetUrl }

/**
 * Injects a function into the page to find ChatGPT's input, paste query, and try to submit.
 */
async function injectFillAndSubmit(tabId, query) {
  
  try {
    const result = await chrome.scripting.executeScript({
      target: { tabId },
      world: "MAIN",
      func: async (q) => {
        
        // ---------- Utilities ----------
        const sleep = (ms) => new Promise(r => setTimeout(r, ms));

        const setTextIntoField = (inputEl, text) => {
          if (!inputEl) return;
          
          inputEl.focus();
            const prompt = document.createElement('p');
            // Set the inner text of the <p> element
            prompt.innerText = text;
            inputEl.replaceChildren(prompt);

            const event1 = new Event('input', { bubbles: true, cancelable: true });
            inputEl.dispatchEvent(event1);
        };


        // Updated selectors for current ChatGPT interface
        const candidateInputSelectors = [
          // Current ChatGPT selectors
          // <div contenteditable="true" translate="no" class="ProseMirror" id="prompt-textarea" data-virtualkeyboard="true" spellcheck="false" aria-label="To enrich screen reader interactions, please activate Accessibility in Grammarly extension settings"><p data-placeholder="Ask anything" class="placeholder"><br class="ProseMirror-trailingBreak"></p></div>
          'div[id="prompt-textarea"]',
        ];

        const findInput = () => {
          for (const sel of candidateInputSelectors) {
            const el = document.querySelector(sel);
            if (el) {
              return el;
            }
          }
          console.log(`[DEBUG] No input found with any selector`);
          return null;
        };

        const findSendButtonNear = (inputEl) => {
          const submitButton = inputEl.closest("form");
          if (submitButton) {
            return submitButton;
          }
          console.log(`[DEBUG] No send button found`);
          return null;
        };

        const waitForInput = async (timeoutMs = 20000) => {
          let el = findInput();
          if (el) return el;

          console.log(`[DEBUG] Input not found within timeout`);
          return null;
        };

        // 1) Wait for the input to exist
        const inputEl = await waitForInput(25000); // Increased timeout

        if (!inputEl) {
          // Could be on login/redirect page; at least copy text to clipboard as a fallback
          console.log(`[DEBUG] Input not found, copying to clipboard as fallback`);
          try {
            await navigator.clipboard.writeText(q);
          } catch (e) {
            console.log(`[DEBUG] Failed to copy to clipboard:`, e);
          }
          return { ok: false, reason: "input_not_found" };
        }
                
        setTextIntoField(inputEl, q);

        // 3) Try to submit
        // Prefer clicking an explicit send button, otherwise press Enter.
        const submitButton = findSendButtonNear(inputEl);
        if (submitButton) {
        const submitEvent = new Event('submit', { bubbles: true, cancelable: true });
        setTimeout(() => {
          submitButton.dispatchEvent(submitEvent);
        }, 150);
        return { ok: true, submitted: true };
      }

        // If no button works, try Enter key (ChatGPT usually submits on Enter; Shift+Enter inserts newline)
        console.log(`[DEBUG] No send button found, trying Enter key`);
        
        
        // Try multiple approaches for Enter key
        const enterEvents = [
          new KeyboardEvent("keydown", {
            key: "Enter",
            code: "Enter",
            keyCode: 13,
            which: 13,
            bubbles: true,
            cancelable: true
          }),
          new KeyboardEvent("keypress", {
            key: "Enter",
            code: "Enter",
            keyCode: 13,
            which: 13,
            bubbles: true,
            cancelable: true
          }),
          new KeyboardEvent("keyup", {
            key: "Enter",
            code: "Enter",
            keyCode: 13,
            which: 13,
            bubbles: true,
            cancelable: true
          })
        ];
        
        // Dispatch all Enter events
        for (const event of enterEvents) {
          inputEl.dispatchEvent(event);
          await sleep(100); // Small delay between events
        }
        
        // Also try submitting the form directly if the input is in a form
        const form = inputEl.closest('form');
        if (form) {
          console.log(`[DEBUG] Trying to submit form directly`);
          try {
            form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
          } catch (e) {
            console.log(`[DEBUG] Form submit failed:`, e);
          }
        }
        
        // Try pressing Enter on the document as a fallback
        console.log(`[DEBUG] Trying Enter on document as fallback`);
        document.dispatchEvent(new KeyboardEvent("keydown", {
          key: "Enter",
          code: "Enter",
          keyCode: 13,
          which: 13,
          bubbles: true,
          cancelable: true
        }));

        console.log(`[DEBUG] Injection completed successfully`);
        return { ok: true, submitted: false };
      },
      args: [query]
    });
    
    console.log(`[DEBUG] Injection result:`, result);
    return result;
  } catch (e) {
    // If injection fails (e.g., permissions, CSP), just ignore.
    console.warn("Injection failed:", e);
    return { ok: false, error: e.message };
  }
}

/**
 * Open ChatGPT and inject once the tab is loaded.
 */
async function openAndInject(query) {
  
  // Prefer chatgpt.com; fallback later if needed
  const targetUrl = "https://chatgpt.com/";

  // Get the current active tab in the current window
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (tab && tab.id) {
    await chrome.tabs.update(tab.id, { url: targetUrl });
    pending.set(tab.id, { query, targetUrl });
  } else {
    console.warn("[DEBUG] No active tab found to update.");
  }

  // Listen for load completion for just this tabId
  const handleUpdate = async (tabId, changeInfo, updatedTab) => {
    if (!pending.has(tabId)) return;

    // Wait for page to be complete (or at least DOMInteractive)
    if (changeInfo.status === "complete") {
      const { query } = pending.get(tabId) || {};
      pending.delete(tabId);

      // Add a small delay to ensure the page is fully ready
      setTimeout(async () => {
        // Try injection
        const result = await injectFillAndSubmit(tabId, query);
        console.log(`[DEBUG] Injection result for tab ${tabId}:`, result);
      }, 1000);

      // If domain isn't chatgpt.com (due to redirect), it still works because host perms include both domains.
      chrome.tabs.onUpdated.removeListener(handleUpdate);
    }
  };

  chrome.tabs.onUpdated.addListener(handleUpdate);
}

// Omnibox handler: when user presses Enter after typing `c <query>`
chrome.omnibox.onInputEntered.addListener(async (text, disposition) => {
  const query = (text || "").trim();

  // If user entered nothing after 'c', just open ChatGPT
  await openAndInject(query);
});

// (Optional) Provide minimal suggestions while typing
chrome.omnibox.onInputChanged.addListener((text, suggest) => {
  const q = text.trim();
  if (!q) {
    suggest([
      { content: "Hi ChatGPT! Can you help me out?", description: "Open ChatGPT" }
    ]);
  } else {
    suggest([
      { content: q, description: `Ask ChatGPT: ${q}` }
    ]);
  }
});
