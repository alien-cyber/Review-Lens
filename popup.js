

let message;

window.onload = () => {

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
  
};
let session = null;

document.addEventListener('DOMContentLoaded', function () {
const chatBody = document.getElementById('chatBody');
const messageInput = document.getElementById('messageInput');
const sendMessageButton = document.getElementById('sendMessageButton');

// Function to append messages to the chat body
async function appendMessage_bot(content, sender) {
  const messageDiv = document.createElement('div');
  messageDiv.classList.add('message', sender);

  const session = await ai.languageModel.create({
    systemPrompt: "You are a product review expert.Give relevant answer to the question asked by seeing the products review"
  });
    const result = await session.promptStreaming(`
question: ${message},
reviews: ${content}
`);
messageDiv.textContent = "Generating response...";
chatBody.appendChild(messageDiv);
for await (const chunk of result) {
  messageDiv.innerText = chunk;
}

 
  
  chatBody.scrollTop = chatBody.scrollHeight; 
}

// Simulating a bot response
async function botResponse() {
     
    
    // Send the message to background.js to get relevant sentences
    const relevantSentences = await sendMessageToBackground(message);
    console.log(relevantSentences);
   

    // Display the bot's response
    
    appendMessage_bot(relevantSentences.join("<br>"), 'bot');
}

// Function to send message to background.js and get processed sentences
function sendMessageToBackground(userMessage) {
    return new Promise((resolve, reject) => {
        // Send a message to background.js with the user's message
        chrome.runtime.sendMessage({ action: 'processMessage', message: userMessage }, (response) => {
            if (chrome.runtime.lastError) {
                reject(chrome.runtime.lastError);
            } else {
                resolve(response.relevantSentences);  // The relevant sentences are in response
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
      botResponse();;  // Simulate a bot response after 1 second
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