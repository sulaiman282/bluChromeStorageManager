document.addEventListener("DOMContentLoaded", () => {
  console.log("Popup script loaded");

  document.getElementById("localStorageBtn").addEventListener("click", async () => {
    console.log("Fetching Local Storage Items...");
    const localStorageItems = await getLocalStorageItems();
    console.log("Local Storage Items:", localStorageItems);
    displayItems(localStorageItems);
  });

  document.getElementById("sessionStorageBtn").addEventListener("click", async () => {
    console.log("Fetching Session Storage Items...");
    const sessionStorageItems = await getSessionStorageItems();
    console.log("Session Storage Items:", sessionStorageItems);
    displayItems(sessionStorageItems);
  });

  document.getElementById("cookiesBtn").addEventListener("click", async () => {
    console.log("Fetching Cookies...");
    const cookies = await getCookies();
    console.log("Cookies:", cookies);
    displayItems(cookies);
  });

  async function getLocalStorageItems() {
    let localStorageData = {};

    return new Promise((resolve) => {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        chrome.scripting.executeScript(
          {
            target: { tabId: tabs[0].id },
            func: () => Object.entries(localStorage).reduce((acc, [key, value]) => {
              try {
                acc[key] = JSON.parse(value);
              } catch (e) {
                acc[key] = value;
              }
              return acc;
            }, {}),
          },
          (results) => {
            if (results && results[0] && results[0].result) {
              localStorageData = results[0].result;
            }
            resolve(localStorageData);
          }
        );
      });
    });
  }

  async function getSessionStorageItems() {
    let sessionStorageData = {};

    return new Promise((resolve) => {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        chrome.scripting.executeScript(
          {
            target: { tabId: tabs[0].id },
            func: () => Object.entries(sessionStorage).reduce((acc, [key, value]) => {
              try {
                acc[key] = JSON.parse(value);
              } catch (e) {
                acc[key] = value;
              }
              return acc;
            }, {}),
          },
          (results) => {
            if (results && results[0] && results[0].result) {
              sessionStorageData = results[0].result;
            }
            resolve(sessionStorageData);
          }
        );
      });
    });
  }

  async function getCookies() {
    return new Promise((resolve) => {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        chrome.cookies.getAll({ url: tabs[0].url }, (cookies) => {
          const cookieMap = cookies.reduce((map, cookie) => {
            try {
              map[cookie.name] = JSON.parse(cookie.value);
            } catch (e) {
              map[cookie.name] = cookie.value;
            }
            return map;
          }, {});
          resolve(cookieMap);
        });
      });
    });
  }

  function displayItems(items) {
    const output = document.getElementById("output");
    output.innerHTML = ""; // Clear previous output

    if (Object.keys(items).length === 0) {
      output.textContent = "No items found.";
      return;
    }

    for (const [key, value] of Object.entries(items)) {
      const itemDiv = document.createElement("div");
      itemDiv.textContent = `${key}: ${JSON.stringify(value, null, 2)}`; // Stringify for display
      output.appendChild(itemDiv);
    }
  }
});
