document.getElementById('fetchReviews').addEventListener('click', () => {
  // Get the active tab
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const activeTab = tabs[0];

    // Inject the content script into the active tab
    chrome.scripting.executeScript({
      target: { tabId: activeTab.id },
      files: ['content.js']
    }, () => {
      console.log("Content script injected");
    });
  });
});
