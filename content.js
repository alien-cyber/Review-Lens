console.log("Content script is running");

// Send a message to the background script to fetch the reviews from the current page
chrome.runtime.sendMessage({ action: "fetchReviews", url: window.location.href }, (response) => {
  if (response && response.reviews) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(response.reviews, "text/html");

  
    // const review_data=doc.querySelectorAll('div .a-section .a-spacing-none .reviews-content .a-size-base"');
    const reviewTitles = Array.from(doc.querySelectorAll('div.a-section .celwidget span[data-hook="review-title"]'), element => element.textContent);
    const starRatings = Array.from(doc.querySelectorAll('i[data-hook="review-star-rating"] span.a-icon-alt'), element => element.textContent);
    const reviewContents = Array.from(doc.querySelectorAll('span[data-hook="review-body"]'), element => element.textContent);
    
      
      console.log("Review Title:",reviewTitles);
      console.log("Review Rating:", starRatings);
      console.log("Review Content:", reviewContents);
    

  
  } else {
    console.log("No response received or no reviews found.");
  }
});
