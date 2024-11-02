console.log("Content script is running");
let url=window.location.href;
if (url.includes("amazon.com")||url.includes("amazon.in")){
          url=url.replace(/\/dp\//g, "/product-reviews/");
}
else if(url.includes("flipkart.com")){
  url=url.replace(/\/p\//g, "/product-reviews/");
}
// Send a message to the background script to fetch the reviews from the current page
chrome.runtime.sendMessage({ action: "fetchReviews", url: url }, (response) => {
  if (response && response.reviews) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(response.reviews, "text/html");

    // Define selectors for each website
    let reviewSelector;
    let productTitle;
    if (url.includes("amazon.in")) {
        reviewSelector = 'span[data-hook="review-body"]'; // Amazon.in selector
         productTitle = document.querySelector("#productTitle").textContent.trim();
    } else if (url.includes("amazon.com")) {
        reviewSelector = 'span[data-hook="review-body"]'; // Amazon.com selector
        productTitle = document.querySelector("#productTitle").textContent.trim();
    } else if (url.includes("flipkart.com")) {
        // Flipkart selector based on the provided HTML structure
        reviewSelector = '.ZmyHeo > div > div';
        productTitle = document.querySelector(".VU-ZEz").textContent.trim();
    } 
    // Fetch and process reviews using the selector
    const reviewContents = Array.from(doc.querySelectorAll(reviewSelector), element => 
        element.textContent.trim().replace(/\n/g, ' ')
    );
   console.log('title_write',productTitle);
    // Send the processed reviews to the background script
    chrome.runtime.sendMessage({ type: 'data', data: reviewContents, title: productTitle }, (response) => {
       
    });
  

  } else {
    console.log("No response received or no reviews found.");
  }
});
