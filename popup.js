document.addEventListener("DOMContentLoaded", async () => {
  console.log("Popup script loaded");

  // Fetch and display local storage items on load
  await fetchAndDisplayStorageItems("localStorage");

  // Event listener for radio button changes
  document.querySelectorAll('input[name="storageType"]').forEach((radio) => {
    radio.addEventListener("change", async (event) => {
      const storageType = event.target.value;
      console.log(
        `Fetching ${
          storageType.charAt(0).toUpperCase() + storageType.slice(1)
        } Items...`
      );
      await fetchAndDisplayStorageItems(storageType);
    });
  });

  // Function to fetch and display storage items
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
    }
    console.log(
      `${storageType.charAt(0).toUpperCase() + storageType.slice(1)} Items:`,
      items
    );
    displayItems(items);
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
    tableBody.innerHTML = ""; // Clear previous table rows

    if (Object.keys(items).length === 0) {
      tableBody.innerHTML = '<tr><td colspan="3">No items found.</td></tr>';
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
    }

    // Add event listeners to delete and edit icons
    tableBody.querySelectorAll(".delete-icon").forEach((icon) => {
      icon.addEventListener("click", async () => {
        const key = icon.getAttribute("data-key");
        await deleteItem(key);
      });
    });

    tableBody.querySelectorAll(".edit-icon").forEach((icon) => {
      icon.addEventListener("click", async () => {
        const key = icon.getAttribute("data-key");
        openEditModal(key, items[key]);
      });
    });
  }

  // Function to delete an item
  async function deleteItem(key) {
    const confirmDelete = confirm(
      `Are you sure you want to delete the item with key '${key}'?`
    );
    if (confirmDelete) {
      localStorage.removeItem(key); // Remove from local storage
      await fetchAndDisplayStorageItems("localStorage"); // Refresh display
    }
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
    editValueInput.value = JSON.stringify(value);
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
    localStorage.setItem(key, JSON.stringify(value)); // Update local storage
    modal.style.display = "none";
    await fetchAndDisplayStorageItems("localStorage"); // Refresh display
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
});
