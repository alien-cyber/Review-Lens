importScripts('libs/tf.es2017.js'); 
importScripts('libs/universal-sentence-encoder@1.3.3.js'); 


let data = [];
let title='';
let model = null;
let info='';

console.log("Background script is running");



// Load the Universal Sentence Encoder model
async function loadModel() {
    try {
        model = await use.load();
        console.log('Model loaded');
        
    } catch (error) {
        console.error('Error loading model:', error);
    }
}

// Function to embed a sentence or text using Universal Sentence Encoder
async function embedText(text) {
    try {
        const embeddings = await model.embed([text]);
        return embeddings.arraySync();
    } catch (error) {
        console.error('Error embedding text:', error);
        return [];
    }
}

// Function to compute cosine similarity between two vectors
function cosineSimilarity(A, B) {
    const dotProduct = A.map((val, idx) => val * B[idx]).reduce((a, b) => a + b, 0);
    const magnitudeA = Math.sqrt(A.map(val => val * val).reduce((a, b) => a + b, 0));
    const magnitudeB = Math.sqrt(B.map(val => val * val).reduce((a, b) => a + b, 0));
    return dotProduct / (magnitudeA * magnitudeB);
}

let precomputedEmbeddings = []; // Store computed embeddings progressively
let embeddingInProgress = false;
const batchSize = 10; // Define batch size

async function getRelevantSentences(prompt) {
    if (!model) {
        await loadModel();
    }

    console.log('model started', prompt);
    const promptEmbedding = await embedText(prompt); // Embed prompt only once
    console.log('embedded text');

    if (!promptEmbedding.length) return [];

    // Initialize embedding process if not started
    if (!embeddingInProgress && precomputedEmbeddings.length < data.length) {
        embeddingInProgress = true;
        precomputeInBatches(data, batchSize); // Start embedding in batches
    }

    // Wait for initial embeddings to be ready
    await waitForInitialEmbeddings(batchSize);

    // Calculate similarities using available embeddings
    let similarities = precomputedEmbeddings.map(({ sentence, embedding }) => {
        const similarity = cosineSimilarity(promptEmbedding[0], embedding[0]);
        return { sentence, similarity };
    });

    // Sort the sentences by similarity score and get top results
    similarities.sort((a, b) => b.similarity - a.similarity);
    console.log(similarities.slice(0, 4).map(item => item.sentence));

    // Return top 4 relevant sentences
    return similarities.slice(0, 4).map(item => item.sentence);
}

// Batch embedding function that progressively adds embeddings to the array
async function precomputeInBatches(data, batchSize) {
    for (let i = precomputedEmbeddings.length; i < data.length; i += batchSize) {
        const batch = data.slice(i, i + batchSize).filter(sentence => sentence!==undefined && sentence!=='');
        const embeddedBatch = await Promise.all(
            batch.map(async (sentence) => ({
                sentence,
                embedding: await embedText(sentence)
            }))
        );

        precomputedEmbeddings.push(...embeddedBatch);
        console.log(`Precomputed ${precomputedEmbeddings.length} embeddings`);

        // If enough embeddings are ready, stop and continue in background
        if (precomputedEmbeddings.length >= batchSize) break;
    }

    embeddingInProgress = false; // Mark as complete if all data is embedded
}

// Wait function to ensure at least one batch is available for processing
async function waitForInitialEmbeddings(batchSize) {
    while (precomputedEmbeddings.length < batchSize && embeddingInProgress) {
        await new Promise(resolve => setTimeout(resolve, 50)); // Short wait
    }
}


// Unified message listener
chrome.runtime.onMessage.addListener(async (request, sender, sendResponse) => {
    if (request.action === "fetchReviews") {
        precomputedEmbeddings=[];
        console.log('Fetching reviews from:', request.url);
        
        let headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/117.0.5938.132 Safari/537.36",
            "Accept-Language": "en-US,en;q=0.9"
        };
        
        // Customize headers based on domain
        if (request.url.includes("amazon.in")) {
            headers["Referer"] = "https://www.amazon.in/";
        } else if (request.url.includes("amazon.com")) {
            headers["Referer"] = "https://www.amazon.com/";
        } else if (request.url.includes("flipkart.com")) {
            headers["Referer"] = "https://www.flipkart.com/";
        }
        
        // Fetch multiple pages of reviews
        async function fetchMultiplePages(url, maxPages = 5) {
            let allReviews = ''; // Accumulate reviews in text format
            let pageParam = ''; // Parameter for pagination

            // Determine pagination parameter based on domain
            if (url.includes("amazon")) {
                pageParam = "pageNumber";
            } else if (url.includes("flipkart")) {
                pageParam = "page";
            }

            for (let page = 1; page <= maxPages; page++) {
                const pageUrl = `${url}&${pageParam}=${page}`;
                console.log(`Fetching page ${page} from: ${pageUrl}`);
                
                try {
                    const response = await fetch(pageUrl, {
                        method: "GET",
                        headers: headers
                    });
                    
                    if (!response.ok) {
                        throw new Error(`HTTP error! Status: ${response.status}`);
                    }
                    
                    const reviewData = await response.text();
                    console.log(`Fetched review data for page ${page}:`, reviewData);
                    allReviews += reviewData; // Append review data to allReviews
                    
                    // Check if the next page exists
                    if (!nextPageExists(reviewData)) {
                        console.log(`No more pages after page ${page}.`);
                        break;
                    }
                } catch (error) {
                    console.error(`Error fetching page ${page} reviews:`, error);
                    break; // Stop fetching if there’s an error
                }
            }
            return allReviews;
        }

        // Function to check if a next page exists in the HTML content
        function nextPageExists(htmlContent) {
            // Adjust this condition to match each website's "Next" button or pagination element
            if (request.url.includes("amazon") && htmlContent.includes("Next")) {
                return true; // Example condition for Amazon
            } else if (request.url.includes("flipkart") && htmlContent.includes("NEXT")) {
                return true; // Example condition for Flipkart
            }
            return false; // Default: assume no more pages
        }
        

        // Fetch the pages and send the response
        const reviews = await fetchMultiplePages(request.url);
        sendResponse({ reviews: reviews });

        return true; // Indicate asynchronous response
    }
    if (request.action === 'processMessage') {
        const prompt = request.message;
        


        try {
            const relevantSentences = await getRelevantSentences(prompt);
            sendResponse({ relevantSentences,title,info });
        } catch (error) {
            console.error('Error processing the message:', error);
            sendResponse({ relevantSentences: [] });
        }
        
    }
    if(request.action==='getTitle'){
        
        
       

        try {
             console.log('rec',title);
           
            sendResponse({ title });
        } catch (error) {
            console.error('Error processing the message:', error);
            sendResponse({ title: '' });
        }
    }

    return true; // Indicate asynchronous response
});


async function embed_check() {
    if (!model) {
        await loadModel();
    }
    if (!embeddingInProgress && precomputedEmbeddings.length < data.length) {
        embeddingInProgress = true;
        precomputeInBatches(data, batchSize); // Start embedding in batches
    }

}

// Initialize the model on script load
loadModel();
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === "data") {
      data=request.data;
      title=request.title;
      info=request.productinfo;
      console.log('info',info);
      embed_check();
      
  } 
  return true;
  });


