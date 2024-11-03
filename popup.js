
let message='mention the good,bad, pros,cons  likes,dislikes of the product';


window.onload = () => {
   

  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const activeTab = tabs[0];
    const url = activeTab.url;
    let shouldInjectScript = false;

    // Check if the URL is a product page for each specific domain
    if ((url.includes("amazon.in") || url.includes("amazon.com")) && url.includes("/dp/")) {
        shouldInjectScript = true;
    } else if (url.includes("flipkart.com") && url.includes("/p/")) {
        shouldInjectScript = true;
    } 

    // Inject content script only if the flag is set to true
    if (shouldInjectScript) {
        chrome.scripting.executeScript({
            target: { tabId: activeTab.id },
            files: ['content.js']
        }, () => {
            console.log("Content script injected on product page");
        });
    } else {
        console.log("Content script not injected, not a product page or URL does not match.");
    }
});

  

   
};



document.addEventListener('DOMContentLoaded', function () {
const chatBody = document.getElementById('chatBody');
const messageInput = document.getElementById('messageInput');
const sendMessageButton = document.getElementById('sendMessageButton');
let session=null;



  

// Function to append messages to the chat body
async function appendMessage_bot(content, sender,title,info) {
  const messageDiv = document.createElement('div');
  messageDiv.classList.add('message', sender);
     if(session==null){
        
        session = await ai.languageModel.create({
        systemPrompt: `You are a product review expert.Give relevant answer to the question asked by seeing the products review.
Give the response as short as 2-3 lines.For the answers which require  large answers such as for to explain the issues or to give the list of issues,you can extend the answer  
,If you do not find the   answer from the reviews say "It is not mentioned in the reviews"

product-name:${title},
product-info:${info},
.`
      });}
     
  
    const result = await session.promptStreaming(`
question: ${message},
reviews: ${content}
`);
messageDiv.textContent = "Generating response...";
chatBody.appendChild(messageDiv);
for await (const chunk of result) {
  messageDiv.innerText = chunk;
  chatBody.scrollTop = chatBody.scrollHeight;

}

 
  
  
}

// Simulating a bot response
async function botResponse() {
  // Send the message to background.js to get relevant sentences
 
  const {relevantSentences,title,info} = await sendMessageToBackground(message);
  
  if (relevantSentences.length === 0) {
      appendMessage('It is not mentioned in the reviews', 'bot');
  } else {
      console.log(relevantSentences);

      // Display the bot's response
      appendMessage_bot(relevantSentences.join('.'), 'bot',title,info);
  }
}


// Function to send message to background.js and get processed sentences
function sendMessageToBackground(userMessage) {
    return new Promise((resolve, reject) => {
        // Send a message to background.js with the user's message
        chrome.runtime.sendMessage({ action: 'processMessage', message: userMessage }, (response) => {
            if (chrome.runtime.lastError) {
                reject(chrome.runtime.lastError);
            } else {
                resolve(response); 
            }
        });
    });
}


// Event listener for sending a message
sendMessageButton.addEventListener('click', function () {
   message = messageInput.value.trim();
  if (message !== '') {
      appendMessage(message, 'user');
      messageInput.value = '';  // Clear input field
      botResponse();  // Simulate a bot response after 1 second
  }
});

// Send message on pressing 'Enter' key
messageInput.addEventListener('keydown', function (e) {
  if (e.key === 'Enter') {
      sendMessageButton.click();
  }
});
});





function appendMessage(content, sender) {
  const messageDiv = document.createElement('div');
  messageDiv.classList.add('message', sender);
  messageDiv.innerText = content;
  chatBody.appendChild(messageDiv);
  chatBody.scrollTop = chatBody.scrollHeight;  // Auto-scroll to the bottom
}



const tabButtons = document.querySelectorAll('.tab-button');
const tabContents = document.querySelectorAll('.chat-container');

tabButtons.forEach(button => {
    button.addEventListener('click', () => {
        const targetTab = button.getAttribute('data-tab');

        // Deactivate all buttons and contents
        tabButtons.forEach(btn => btn.classList.remove('active'));
        tabContents.forEach(content => content.classList.remove('active'));

        // Activate the selected button and tab content
        button.classList.add('active');
        document.getElementById(targetTab).classList.add('active');
    });
});







