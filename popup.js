
let message='you are given the pros, cons, likes, dislikes of the product tell me why to buy it and why not';
let sourcelanguage='en';
let targetlanguage='en';
let alert=true;
let translator_input=null;
let translator_output=null;

document.addEventListener('DOMContentLoaded', function () {



    async function changeLanguage_input(lang){
        targetlanguage=lang;
        console.log('lang:started',targetlanguage);
     
          
          const canTranslate = await translation.canTranslate({sourceLanguage:lang,targetLanguage:'en'});
        
          if (canTranslate !== 'no') {
            if (canTranslate === 'readily') {
                if(translator_input==null){
              translator_input = await translation.createTranslator({sourceLanguage:lang,targetLanguage:'en'});
              translator_output = await translation.createTranslator({sourceLanguage:'en',targetLanguage:lang});
            }
            }
             else {
            translator_input = null;
              translator_output = null;
              translator = await translation.createTranslator({sourceLanguage:lang,targetLanguage:'en'});
              translator.addEventListener('downloadprogress', (e) => {
                console.log(e.loaded, e.total);
              });
              await translator.ready;
              appendMessage_bot('your language model is not present in PC/laptop','user','title','info');
            } 
          } else {
            translator_input = null;
            translator_output = null;
            appendMessage_bot('the translator is not dowloaded','user','title','info');
          }
    }
    
    
   
        
   
        
    
    

        
        

window.onload=()=>{
  

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
                setTimeout(()=>{appendMessage('why to buy this product and why not', 'user');
                  appendMessage_bot('data is currently fetched please wait','user','title','info');
                   botResponse();
                  
                  },500)
                
            });
    
        } else {
            let str='the POPUP works in a product page of the website';
            appendMessage_bot(str,'user');
         
            console.log("Content script not injected, not a product page or URL does not match.");
        }
    });


}
      

    



const chatBody = document.getElementById('chatBody');
const messageInput = document.getElementById('messageInput');
const sendMessageButton = document.getElementById('sendMessageButton');
let session=null;

// chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
//     if (request.action === "trigger") {
//         appendMessage('why to buy this product and why not', 'user');
//         appendMessage_bot('data is currently fetched please wait','user','title','info');
//          botResponse();
//     } 
    
//     });

    
  

// Function to append messages to the chat body
async function appendMessage_bot(content, sender, title, info) {
    const messageDiv = document.createElement('div');
    messageDiv.classList.add('message', 'bot');
    console.log(message,"bot content");
    
    if (sender === 'bot') {

      let text_list=["Generating response...","Generando respuesta...","応答を生成中..."]
      let text;
      switch(targetlanguage){
        case "en":text=text_list[0];
                  break;
        case "es":text=text_list[1];
                  break;
        case "ja":text=text_list[2];
                  break;
              
      }
      messageDiv.textContent =text;
  
      if (session == null) {
        session = await ai.languageModel.create({
          systemPrompt: `You are a product review expert. Give relevant answer to the question asked by seeing the product's review.
  Give the response as short as 2-3 lines. For the answers which require large answers, such as to explain the issues or to give the list of issues, you can extend the answer.
  If you do not find the answer from the reviews, say "It is not mentioned in the reviews."
  
  product-name: ${title},
  product-info: ${info},
  .`
        });
      }
  
      const result = await session.promptStreaming(`
  question: ${message},
  reviews: ${content}
  `);
      chatBody.appendChild(messageDiv);
      
  
      for await (const chunk of result) {
        
          if(translator_output!=null){
        const translatedText = await translator_output.translate(chunk);
        messageDiv.innerText = translatedText;
      }
      else{
      messageDiv.innerText = chunk;
   

      }

        chatBody.scrollTop = chatBody.scrollHeight;
      }
  
    } else {
      if(translator_output!=null){
      const translatedText = await translator_output.translate(content);
      messageDiv.textContent = translatedText;
             

      }
     else{
      messageDiv.textContent = content;

     }
      
      
      
      chatBody.appendChild(messageDiv);
    }
  }
  

// Simulating a bot response
async function botResponse() {
  // Send the message to background.js to get relevant sentences
 
  const {relevantSentences,title,info} = await sendMessageToBackground(message);
  
  if (relevantSentences.length === 0) {
    appendMessage('information is still fetching please wait', 'bot');
    if(alert){
      setTimeout(botResponse,1000);
      alert=false;

    }
  } else {
      console.log(relevantSentences);
      if(!alert){
              alert=true;
      }
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

sendMessageButton.addEventListener('click', async function () {
  if (messageInput.value.trim() !== '') {
    await appendMessage(messageInput.value.trim(), 'user');
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


const buttons = document.querySelectorAll('.language-buttons button');
const headContent = document.getElementById('head-content');

buttons.forEach(button => {
    button.addEventListener('click', () => {
        // Remove the active class from all buttons
        buttons.forEach(btn => btn.classList.remove('active'));
        
        // Add the active class to the clicked button
        button.classList.add('active');
        
        // Determine the language based on button text and call the function
        let lang;
        let headText;
        switch (button.textContent.trim()) {
            case 'English':
                lang = 'en';
                headText = 'Chat with Reviews'; // English version
                break;
            case 'Español':
                lang = 'es';
                headText = 'Chat con Reseñas'; // Spanish version
                break;
            case '日本語':
                lang = 'ja';
                headText = 'レビューとチャットする'; // Japanese version
                break;
            // Add more cases if you add more languages
        }
        
        // Update the head-content with the corresponding text
        headContent.textContent = headText;

        // Run the changeLanguage_input function with the selected language
        changeLanguage_input(lang);
    });
});







});





async function appendMessage(content, sender) {
  const messageDiv = document.createElement('div');
  messageDiv.classList.add('message', sender);
  messageDiv.innerText = content;
  chatBody.appendChild(messageDiv);
  chatBody.scrollTop = chatBody.scrollHeight;
  if(translator_input!=null){
    content=await translator_input.translate(content);
    console.log("input_trans",content);
  

}
    message=content;


    // Auto-scroll to the bottom
}








