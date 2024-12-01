console.log("Content script is running");
url=window.location.href;
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
let featureSelector;

if (url.includes("amazon.in")) {
    // Amazon.in selectors
    reviewSelector = 'span[data-hook="review-body"]';
    productTitle = document.querySelector("#productTitle")?.textContent.trim(); // Optional chaining for safety
    featureSelector = '#featurebullets_feature_div #feature-bullets .a-unordered-list.a-vertical > li.a-spacing-mini > span.a-list-item';

} else if (url.includes("amazon.com")) {
    // Amazon.com selectors (similar to Amazon.in)
    reviewSelector = 'span[data-hook="review-body"]';
    productTitle = document.querySelector("#productTitle")?.textContent.trim();
    featureSelector = '#feature-bullets .a-unordered-list.a-vertical > li.a-spacing-mini > span.a-list-item';

} else if (url.includes("flipkart.com")) {
    // Flipkart selectors
    reviewSelector = '.ZmyHeo > div > div';
    productTitle = document.querySelector(".VU-ZEz")?.textContent.trim();
    featureSelector = '.xFVion > ul > li._7eSDEz'; // Define if Flipkart has a feature list selector
}

// Fetch and process reviews
const reviewContents = Array.from(doc.querySelectorAll(reviewSelector), element => 
    element.textContent.trim().replace(/\n/g, ' ')
);

// Fetch and process feature list (only if featureSelector is defined)
let featureContents = [];
if (featureSelector) {
    featureContents = Array.from(document.querySelectorAll(featureSelector), element => 
        element.textContent.trim().replace(/\n/g, ' ')
    );
}

// Output the results


   
    // Send the processed reviews to the background script
    chrome.runtime.sendMessage({ type: 'data', data: reviewContents, title: productTitle,productinfo:featureContents }, (response) => {
       
    });
  

  } else {
    console.log("No response received or no reviews found.");
  }
});
