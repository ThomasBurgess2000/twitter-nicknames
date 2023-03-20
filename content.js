// TO DO:
// - Save the nicknames by username instead of by displayname (probably useing the attribute data-testid="User-Name" to select the div that contains both)
// - Make work in dark and light mode
// - Update the manifest to version 3
// - Update all the other occurences of the displayname when you edit one

// Get the nickname from local storage or return the original name if no nickname exists
async function getNickname(originalName) {
  return new Promise((resolve) => {
    chrome.storage.local.get(originalName, (result) => {
      resolve(result[originalName] || originalName);
    });
  });
}

const processedElements = new Map();
let isRunning = false;

async function changeNames() {
  if (isRunning) return;
  isRunning = true;
  const usernameElements = document.querySelectorAll(
    "#id__zakxn8bu54d > div.css-1dbjc4n.r-18u37iz.r-1wbh5a2.r-13hce6t > div > div.css-1dbjc4n.r-1wbh5a2.r-dnmrzs > a > div > span"
  );
  const nameElements = document.querySelectorAll(
    "div.css-1dbjc4n.r-1awozwy.r-18u37iz.r-1wbh5a2.r-dnmrzs > div > a > div > div.css-901oao.r-1awozwy.r-1nao33i.r-6koalj.r-37j5jr.r-a023e6.r-b88u0q.r-rjixqe.r-bcqeeo.r-1udh08x.r-3s2u2q.r-qvutc0 > span > span.css-901oao.css-16my406.r-poiln3.r-bcqeeo.r-qvutc0:not([data-changed])"
  );
  for (const nameElement of nameElements) {
    console.log(nameElement.getRootNode());
    if (!processedElements.get(nameElement)) {
      const originalName = nameElement.textContent;
      processedElements.set(nameElement.originalName, true);
      const nickname = await getNickname(originalName);
      nameElement.textContent = nickname.slice(0, 30);
      nameElement.setAttribute("data-changed", "true");
      // Add edit button
      addButton(nameElement, originalName);
    }
  }
  isRunning = false;
}

function addButton(nameElement, originalName) {
  const button = document.createElement("img");
  button.src = chrome.runtime.getURL("editbutton.svg");
  button.alt = "Edit";
  button.style.width = "16px";
  button.style.height = "16px";
  button.style.marginLeft = "4px";
  button.style.cursor = "pointer";
  button.addEventListener("click", async (event) => {
    event.stopPropagation(); // Stop the click event from propagating to the parent elements
    event.preventDefault(); // Prevent the default action of the click event

    let newNickname;
    do {
      newNickname = prompt("Enter a new nickname:", nameElement.textContent);
      if (newNickname && newNickname.length > 50) {
        alert("Nickname must be 50 characters or less.");
      }
    } while (newNickname && newNickname.length > 50);

    if (newNickname) {
      chrome.storage.local.set({ [originalName]: newNickname }, () => {
        nameElement.textContent = newNickname;
      });
    }
  });

  nameElement.parentElement.appendChild(button);
}

// Run the changeNames function when the page content is loaded
window.addEventListener("DOMContentLoaded", changeNames);

// Run the changeNames function when new content is loaded (e.g., infinite scroll)
const targetNode = document.getElementById("react-root");
const observerConfig = { childList: true, subtree: true };

const observer = new MutationObserver(() => {
  observer.disconnect(); // Disconnect the observer to avoid infinite loop
  changeNames();
  observer.observe(targetNode, observerConfig); // Reconnect the observer after making changes
});

observer.observe(targetNode, observerConfig);
