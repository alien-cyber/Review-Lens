console.log("Content script is running");

// Send a message to the background script to fetch the reviews from the current page
chrome.runtime.sendMessage({ action: "fetchReviews", url: window.location.href }, (response) => {
  if (response && response.reviews) {
    console.log("Received reviews HTML:", response.reviews); // Log the HTML response for debugging

  
  } else {
    console.log("No response received or no reviews found.");
  }
});
