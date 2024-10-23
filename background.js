importScripts('libs/tfjs/tf.es2017.js');
importScripts('libs/use/use.min.js');


let data=[];

  loadModel();  


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
        sendResponse({ reviews:data });
      })
      .catch(error => {
        console.error("Error fetching reviews:", error);
        sendResponse({ error: "Failed to fetch reviews." });
      });
  
    // Return true to indicate sendResponse will be called asynchronously
    return true;
  }
  
});


chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === "data") {
      data=request.data;
      console.log(data);
      
  } 
  return true;
  });
  
  let model;

  // Load the Universal Sentence Encoder model
  async function loadModel() {
      model = await use.load();
      console.log('Model loaded');
  }
  
  // Function to embed a sentence or text using Universal Sentence Encoder
  async function embedText(text) {
      const embeddings = await model.embed([text]);
      return embeddings.arraySync();
  }
  
  // Function to compute cosine similarity between two vectors
  function cosineSimilarity(A, B) {
      const dotProduct = A.map((val, idx) => val * B[idx]).reduce((a, b) => a + b, 0);
      const magnitudeA = Math.sqrt(A.map(val => val * val).reduce((a, b) => a + b, 0));
      const magnitudeB = Math.sqrt(B.map(val => val * val).reduce((a, b) => a + b, 0));
      return dotProduct / (magnitudeA * magnitudeB);
  }
  
  // Function to collect text input and return relevant sentences
  async function getRelevantSentences(prompt) {
      const promptEmbedding = await embedText(prompt);
      let similarities = [];
  
      for (const sentence of data) {
          const sentenceEmbedding = await embedText(sentence);
          const similarity = cosineSimilarity(promptEmbedding[0], sentenceEmbedding[0]);
          similarities.push({ sentence, similarity });
      }
  
      // Sort the sentences by their similarity score
      similarities.sort((a, b) => b.similarity - a.similarity);
  
      // Return the top 3 relevant sentences
      return similarities.slice(0, 3).map(item => item.sentence);
  }

  chrome.runtime.onMessage.addListener(async (request, sender, sendResponse) => {
    if (request.action === 'processMessage') {
        const prompt = request.prompt;

        try {
            // Get the relevant sentences using the prompt
            const relevantSentences = await getRelevantSentences(prompt);
            
            // Send the relevant sentences back to popup.js
            sendResponse({ relevantSentences });
        } catch (error) {
            console.error('Error processing the message:', error);
            sendResponse({ relevantSentences: [] });
        }
    }

    // Returning true to indicate the response is asynchronous
    return true;
});