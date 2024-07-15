document.addEventListener("DOMContentLoaded", async () => {
  console.log("Popup script loaded");

  // Fetch and display local storage items on load
  await fetchAndDisplayStorageItems('localStorage');

  document.querySelectorAll('input[name="storageType"]').forEach(radio => {
    radio.addEventListener('change', async (event) => {
      const storageType = event.target.value;
      console.log(`Fetching ${storageType.charAt(0).toUpperCase() + storageType.slice(1)} Items...`);
      await fetchAndDisplayStorageItems(storageType);
    });
  });

  async function fetchAndDisplayStorageItems(storageType) {
    let items;
    switch (storageType) {
      case 'localStorage':
        items = await getLocalStorageItems();
        break;
      case 'sessionStorage':
        items = await getSessionStorageItems();
        break;
      case 'cookies':
        items = await getCookies();
        break;
    }
    console.log(`${storageType.charAt(0).toUpperCase() + storageType.slice(1)} Items:`, items);
    displayItems(items);
  }

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
