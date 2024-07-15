document.addEventListener("DOMContentLoaded", async () => {
  console.log("Popup script loaded");

  let currentStorageType = "localStorage";

  // Fetch and display storage items based on the initial selection
  await fetchAndDisplayStorageItems(currentStorageType);

  // Event listener for radio button changes
  document.querySelectorAll('input[name="storageType"]').forEach((radio) => {
    radio.addEventListener("change", async (event) => {
      currentStorageType = event.target.value;
      console.log(`Fetching ${currentStorageType} Items...`);
      await fetchAndDisplayStorageItems(currentStorageType);
    });
  });

  // Event listener for save new item button
  const saveNewItemBtn = document.getElementById("saveNewItem");
  if (saveNewItemBtn) {
    saveNewItemBtn.addEventListener("click", async () => {
      const newKey = document.getElementById("newKey").value;
      const newValue = document.getElementById("newValue").value;

      if (!newKey || !newValue) {
        alert("Please enter both key and value.");
        return;
      }

      await addItem(newKey, newValue);
    });
  }

  // Function to fetch and display storage items based on storage type
  async function fetchAndDisplayStorageItems(storageType) {
    let items;
    switch (storageType) {
      case "localStorage":
        items = await getLocalStorageItems();
        break;
      case "sessionStorage":
        items = await getSessionStorageItems();
        break;
      case "cookies":
        items = await getCookies();
        break;
      default:
        console.error("Unknown storage type:", storageType);
        return;
    }
    console.log(`${storageType} Items:`, items);
    displayItems(items);
  }

  // Function to add a new item
  async function addItem(key, value) {
    switch (currentStorageType) {
      case "localStorage":
        await addLocalStorageItem(key, value);
        break;
      case "sessionStorage":
        await addSessionStorageItem(key, value);
        break;
      case "cookies":
        await addCookieItem(key, value);
        break;
      default:
        console.error("Unknown storage type:", currentStorageType);
        return;
    }

    // Refresh display after adding new item
    await fetchAndDisplayStorageItems(currentStorageType);
    // Clear input fields after adding item
    document.getElementById("newKey").value = "";
    document.getElementById("newValue").value = "";
  }

  // Function to get Local Storage items
  async function getLocalStorageItems() {
    return new Promise((resolve) => {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        chrome.scripting.executeScript(
          {
            target: { tabId: tabs[0].id },
            func: () => {
              return Object.entries(localStorage).reduce(
                (acc, [key, value]) => {
                  try {
                    acc[key] = JSON.parse(value);
                  } catch (e) {
                    acc[key] = value;
                  }
                  return acc;
                },
                {}
              );
            },
          },
          (results) => {
            if (results && results[0] && results[0].result) {
              resolve(results[0].result);
            } else {
              resolve({});
            }
          }
        );
      });
    });
  }

  // Function to get Session Storage items
  async function getSessionStorageItems() {
    return new Promise((resolve) => {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        chrome.scripting.executeScript(
          {
            target: { tabId: tabs[0].id },
            func: () => {
              return Object.entries(sessionStorage).reduce(
                (acc, [key, value]) => {
                  try {
                    acc[key] = JSON.parse(value);
                  } catch (e) {
                    acc[key] = value;
                  }
                  return acc;
                },
                {}
              );
            },
          },
          (results) => {
            if (results && results[0] && results[0].result) {
              resolve(results[0].result);
            } else {
              resolve({});
            }
          }
        );
      });
    });
  }

  // Function to get Cookies
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

  // Function to display items in the table
  function displayItems(items) {
    const tableBody = document.getElementById("storageTableBody");
    const firstRow = tableBody.rows[0]; // Capture the first row
    tableBody.innerHTML = ""; // Clear previous table rows

    if (firstRow) {
      tableBody.appendChild(firstRow); // Re-append the first row
    }

    if (Object.keys(items).length === 0) {
      return;
    }

    for (const [key, value] of Object.entries(items)) {
      const row = document.createElement("tr");
      row.innerHTML = `
        <td>${key}</td>
        <td>${JSON.stringify(value)}</td>
       <td>
          <span class="edit-icon" data-key="${key}"><i class="fas fa-edit" style="color:black;font-size:16px;"></i></span>
          <span class="delete-icon" data-key="${key}"><i class="fas fa-trash-alt" style="color:red;font-size:16px;margin-left:5px;"></i></span>
        </td>
      `;
      tableBody.appendChild(row);
      // Add event listeners to delete and edit icons
      tableBody.querySelectorAll(".delete-icon").forEach((icon) => {
        icon.addEventListener("click", async () => {
          const key = icon.getAttribute("data-key");
          await deleteItem(key);
          await fetchAndDisplayStorageItems(currentStorageType); // Refresh display
        });
      });

      tableBody.querySelectorAll(".edit-icon").forEach((icon) => {
        icon.addEventListener("click", () => {
          const key = icon.getAttribute("data-key");
          openEditModal(key, items[key]);
        });
      });
    }
  }

  // Function to delete an item
  async function deleteItem(key) {
    switch (currentStorageType) {
      case "localStorage":
        await deleteLocalStorageItem(key);
        break;
      case "sessionStorage":
        await deleteSessionStorageItem(key);
        break;
      case "cookies":
        await deleteCookieItem(key);
        break;
      default:
        console.error("Unknown storage type:", currentStorageType);
        return;
    }

    // Refresh display after deletion
    await fetchAndDisplayStorageItems(currentStorageType);
  }

  // Function to delete an item from Local Storage
  async function deleteLocalStorageItem(key) {
    return new Promise((resolve) => {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        chrome.scripting.executeScript(
          {
            target: { tabId: tabs[0].id },
            func: (key) => {
              localStorage.removeItem(key);
            },
            args: [key],
          },
          () => {
            resolve();
          }
        );
      });
    });
  }

  // Function to delete an item from Session Storage
  async function deleteSessionStorageItem(key) {
    return new Promise((resolve) => {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        chrome.scripting.executeScript(
          {
            target: { tabId: tabs[0].id },
            func: (key) => {
              sessionStorage.removeItem(key);
            },
            args: [key],
          },
          () => {
            resolve();
          }
        );
      });
    });
  }

  // Function to delete a cookie item
  async function deleteCookieItem(key) {
    return new Promise((resolve) => {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        chrome.cookies.remove(
          {
            url: tabs[0].url,
            name: key,
          },
          () => {
            resolve();
          }
        );
      });
    });
  }

  // Modal functionality
  const modal = document.getElementById("editModal");
  const closeBtn = modal.querySelector(".close");
  const editKeyInput = document.getElementById("editKey");
  const editValueInput = document.getElementById("editValue");
  const saveEditBtn = document.getElementById("saveEdit");
  const cancelEditBtn = document.getElementById("cancelEdit");

  // Open modal function
  function openEditModal(key, value) {
    editKeyInput.value = key;
    editValueInput.value = JSON.stringify(value, null, 2);
    modal.style.display = "block";
  }

  // Close modal function
  closeBtn.addEventListener("click", () => {
    modal.style.display = "none";
  });

  // Save edit button functionality
  saveEditBtn.addEventListener("click", async () => {
    const key = editKeyInput.value;
    let value;
    try {
      value = JSON.parse(editValueInput.value);
    } catch (e) {
      value = editValueInput.value;
    }

    await updateItem(key, value, currentStorageType); // Update local storage
    modal.style.display = "none";
    await fetchAndDisplayStorageItems(currentStorageType); // Refresh display
  });

  // Cancel edit button functionality
  cancelEditBtn.addEventListener("click", () => {
    modal.style.display = "none";
  });

  // Close modal if clicked outside of it
  window.addEventListener("click", (event) => {
    if (event.target === modal) {
      modal.style.display = "none";
    }
  });

  // Function to update an item in local storage
  async function updateItem(key, value, storageType) {
    switch (storageType) {
      case "localStorage":
        return updateLocalStorageItem(key, value);
      case "sessionStorage":
        return updateSessionStorageItem(key, value);
      case "cookies":
        return updateCookieItem(key, value);
      default:
        console.error("Unknown storage type:", storageType);
        return;
    }
  }

  // Function to update an item in Local Storage
  async function updateLocalStorageItem(key, value) {
    return new Promise((resolve) => {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        const tab = tabs[0];
        if (!tab) {
          console.error("No active tab found.");
          resolve();
          return;
        }

        chrome.scripting.executeScript(
          {
            target: { tabId: tab.id },
            func: (key, value) => {
              localStorage[key] = JSON.stringify(value);
            },
            args: [key, value],
          },
          () => {
            resolve();
          }
        );
      });
    });
  }

  // Function to update an item in Session Storage
  async function updateSessionStorageItem(key, value) {
    return new Promise((resolve) => {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        chrome.scripting.executeScript(
          {
            target: { tabId: tabs[0].id },
            func: (key, value) => {
              sessionStorage[key] = JSON.stringify(value);
            },
            args: [key, value],
          },
          () => {
            resolve();
          }
        );
      });
    });
  }

  // Function to update an item in Cookies
  async function updateCookieItem(key, value) {
    return new Promise((resolve) => {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        chrome.cookies.set(
          {
            url: tabs[0].url,
            name: key,
            value: JSON.stringify(value),
          },
          () => {
            resolve();
          }
        );
      });
    });
  }

  // Function to add an item to local storage
  async function addLocalStorageItem(key, value) {
    return new Promise((resolve) => {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        const tab = tabs[0];
        if (!tab) {
          console.error("No active tab found.");
          resolve();
          return;
        }

        chrome.scripting.executeScript(
          {
            target: { tabId: tab.id },
            func: (key, value) => {
              localStorage[key] = JSON.stringify(value);
            },
            args: [key, value],
          },
          () => {
            resolve();
          }
        );
      });
    });
  }

  // Function to add an item to session storage
  async function addSessionStorageItem(key, value) {
    return new Promise((resolve) => {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        chrome.scripting.executeScript(
          {
            target: { tabId: tabs[0].id },
            func: (key, value) => {
              sessionStorage[key] = JSON.stringify(value);
            },
            args: [key, value],
          },
          () => {
            resolve();
          }
        );
      });
    });
  }

  // Function to add a cookie item
  async function addCookieItem(key, value) {
    return new Promise((resolve) => {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        chrome.cookies.set(
          {
            url: tabs[0].url,
            name: key,
            value: JSON.stringify(value),
          },
          () => {
            resolve();
          }
        );
      });
    });
  }
});
