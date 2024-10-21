console.log("Background script is running");

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log("Received message:", request);
  if (request.action === "fetchReviews") {
    fetch(request.url, {
      method: "GET",
      headers: {
        "User-Agent": "Chrome/117.0.5938.132"
      }
    })
      .then(response => response.text())
      .then(data => {
        console.log(data);
        sendResponse({ reviews:String(data) });
      })
      .catch(error => {
        console.error("Error fetching reviews:", error);
        sendResponse({ error: "Failed to fetch reviews." });
      });
  
    // Return true to indicate sendResponse will be called asynchronously
    return true;
  }
  
});
