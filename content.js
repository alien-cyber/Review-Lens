console.log("Content script is running");

// Send a message to the background script to fetch the reviews from the current page
chrome.runtime.sendMessage({ action: "fetchReviews", url: window.location.href }, (response) => {
  if (response && response.reviews) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(response.reviews, "text/html");

  
    // const review_data=doc.querySelectorAll('div .a-section .a-spacing-none .reviews-content .a-size-base"');
    
    const reviewContents = Array.from(doc.querySelectorAll('span[data-hook="review-body"]'), element => element.textContent.trim().replace(/\n/g, ' '));
    
      
   

      
    chrome.runtime.sendMessage({type:'data', data: reviewContents }, (response) => {
     
});
      
    

  
  } else {
    console.log("No response received or no reviews found.");
  }
});
