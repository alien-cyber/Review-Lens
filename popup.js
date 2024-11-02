
let message;


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
async function appendMessage_bot(content, sender) {
  const messageDiv = document.createElement('div');
  messageDiv.classList.add('message', sender);
     
      const session = await ai.languageModel.create({
        systemPrompt: `You are a product review expert.Give relevant answer to the question asked by seeing the products review.
Give the response as short as 2-3 lines.For the answers which require  large answers such as for to explain the issues or to give the list of issues,you can extend the answer  
,If you do not find the   answer from the reviews say "It is not mentioned in the reviews"
.`
      });
     
  
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

 
  
  session.destroy();
}

// Simulating a bot response
async function botResponse() {
  // Send the message to background.js to get relevant sentences
 
  const relevantSentences = await sendMessageToBackground(message);
  
  if (relevantSentences.length === 0) {
      appendMessage('It is not mentioned in the reviews', 'bot');
  } else {
      console.log(relevantSentences);

      // Display the bot's response
      appendMessage_bot(relevantSentences.join('. '), 'bot');
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






document.addEventListener('DOMContentLoaded', function (){
    const chatBody_write = document.getElementById('chatBody-write');
    const messageInput_write = document.getElementById('messageInput-write');
    const sendMessageButton_write = document.getElementById('sendMessageButton-write');

    sendMessageButton_write.addEventListener('click', function () {
        let message_write = messageInput_write.value.trim();
       if (message_write !== '') {
           appendMessage_write(message_write, 'user');
           messageInput_write.value = '';  // Clear input field
           botResponse_write(message_write);;  // Simulate a bot response after 1 second
       }
     });
            

     async function botResponse_write(message_write) {
        // Send the message to background.js to get relevant sentences
       
        if(message_write===''){
            return;
        }
         else {
        
      
            // Display the bot's response
            appendMessage_bot_write(message_write, 'bot');
        }
      }
     

    function appendMessage_write(content, sender) {
        const messageDiv = document.createElement('div');
        messageDiv.classList.add('message', sender);
        messageDiv.innerText = content;
        chatBody_write.appendChild(messageDiv);
        chatBody_write.scrollTop = chatBody_write.scrollHeight;  // Auto-scroll to the bottom
      }
    



        let session_write=null;


 async function appendMessage_bot_write(content, sender) {
    const messageDiv = document.createElement('div');
    messageDiv.classList.add('message', sender);
       
       if(!session_write){
    const session_write =  ai.languageModel.create({
        systemPrompt: write_prompt
      });}
      let title=await get_titleBackground();
      const result = await session_write.promptStreaming(`
  product Description: ${title},
  user Input: ${content}
  `);
  messageDiv.textContent = "Generating response...";
  chatBody_write.appendChild(messageDiv);
  for await (const chunk of result) {
    messageDiv.innerText = chunk;
    chatBody_write.scr}
  }
    
    
    
});


function get_titleBackground() {
    return new Promise((resolve, reject) => {
        // Send a message to background.js with the user's message
        chrome.runtime.sendMessage({ action: 'getTitle'}, (response) => {
            if (chrome.runtime.lastError) {
                reject(chrome.runtime.lastError);
            } else {
                resolve(response.title);  // The relevant sentences are in response
            }
        });
    });
}









let write_prompt=`You will be given a brief statement from a user regarding a product, along with a product description provided by the user. Your task is to analyze the input and write a usefull review

A helpful review should fulfill two main criteria:
1. Provides details about the product itself. This means mentioning specific aspects or qualities of the product, like its fit, comfort, material, durability, etc.
2. Explains the user\'s opinion. This means the user gives reasons for why they like or dislike the product, or for pricing issues they explain why the price seems fair or not.
If the review meets both of these criteria, mark it as "Helpful: Yes." Otherwise, mark it as "Helpful: No". If the review is not helpful, suggest to the user a fix for how to improve their review, and give an example review that is more helpful and applies your suggested fix. Your example review should focus solely on making the review more informative, detailed and useful to others. It should focus on the review itself, not suggest any changes to the product. If the review is helpful, leave the "Fix" and "Example" sections blank.
Adhere strictly to the following output format (absolutely do NOT change the structure):
If the user’s input provides enough information to create a helpful review, set isquestion to "No" and use review to summarize a helpful review that includes specific details about product features. Leave question blank.

If the input is too brief or lacks detail, set isquestion to "Yes" and provide a specific question to prompt the user for more information. Avoid general statements and instead ask about specific features related to the product description provided by the user.

Use the following format (do not change the structure):

isquestion: [yes/no]
question: [A clarifying question if necessary, otherwise leave blank]
review: [A helpful review based on available information, or leave blank if unable to generate one]

Examples
Example 1:
Product Description: Wireless Keyboard and Mouse Combo, 2.4 GHz, Full-Sized Typewriter Keyboard with Round Keycaps
User Input: "I hate the product."

Expected Output:

isquestion: Yes
question: Could you describe which specific features you dislike, like the design of the keyboard, key comfort, or mouse functionality?
review:

Example 2:
Product Description: OnePlus Bullets Z2 Bluetooth Earphones, with 12.4 mm drivers, 10 min charge for 20 hrs music, IP55 water resistance
User Input: "Sound quality is great, but the battery dies quickly."

Expected Output:

isquestion: No
question:
review: I like its build quality but battery dies quickly which makes me charge often.

Example 3:
Product Description: Fitness Tracker with Heart Rate Monitor, Sleep Tracking, Step Counter, and IP68 Waterproof Rating
User Input: "I like it."

Expected Output:

isquestion: Yes
question: Could you share more details on what you liked, such as the heart rate monitor, sleep tracking accuracy, or ease of use?
review:

Example 4:
Product Description: Smartwatch with AMOLED Display, Bluetooth Calling, and Metallic Build
User Input: "Great display and build quality!"

Expected Output:

isquestion: No
question:
review: I like its display and build quality.

review to write:
`;