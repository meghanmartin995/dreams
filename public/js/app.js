document.addEventListener('DOMContentLoaded', function () {
  const searchInput = document.querySelector('.dream-input input');
  let lastValue = ''; // Store the last value entered

  function setLoadingState(isLoading) {
      if (isLoading) {
          // Store the current value and set the input field to "Loading..."
          lastValue = searchInput.value;
          searchInput.value = 'Analyzing your dream and creating imagery... 🧚';
          searchInput.readOnly = true;
      } else {
          // Restore the input field to the last value
          searchInput.value = lastValue;
          searchInput.readOnly = false;
      }
  }

  searchInput.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' && !searchInput.readOnly) {
          e.preventDefault();
          const dreamText = searchInput.value.trim();

          // Set loading state
          setLoadingState(true);

          Promise.all([
              identifyThemes(dreamText),
              analyzeDreamWithGPT(dreamText)
          ])
          .then(([themes, analyses]) => {
              document.querySelector('.themes p').textContent = themes;
              Object.keys(analyses).forEach((psychologist) => {
                  document.querySelector(`.interpretation.${psychologist.toLowerCase()} p`).textContent = analyses[psychologist];
              });
              return generateDreamlikeImage(themes);
          })
          .then(imageUrl => {
              const dalleImageElement = document.querySelector('.dream-image');
              dalleImageElement.src = imageUrl;
              dalleImageElement.alt = 'Generated Image based on dream analysis';
          })
          .catch(error => {
              console.error('Error:', error);
          })
          .finally(() => {
              // End loading state and restore the original dream text
              setLoadingState(false);
          });
      }
  });
});


  function identifyThemes(dreamText) {
    const data = {
      prompt: `Identify the key themes and symbols present in the following dream: '${dreamText}', and explain how these might be interpreted according to dream analysis. Point out specific objects and images as symbols and analyze their potential meanings. Reference specific symbols.`,
      max_tokens: 100,
    };
    return callOpenAI(data);
  }
  
  function generateDreamlikeImage(dreamText) {
    let prompt = `Generate a dream-inspired digital art image in high-res, with serene purples and pinks that includes multiple symbols from this dream: '${dreamText}'. Include whimsical, ethereal elements and symbols in a clear, pastel-toned dreamscape`;
    return callDalleAPI(prompt).then(response => {
      // Ensure that the response is in JSON format
      if (response && response.data && response.data.length > 0 && response.data[0].url) {
        return response.data[0].url;
      } else {
        throw new Error('No image was generated.');
      }
    }).catch(error => {
      console.error('Error during image generation:', error);
      throw error;
    });
  }
  
  function callDalleAPI(prompt) {
    return fetch('/api/callDalleAPI', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ prompt: prompt, n: 1, size: "512x512" })
    })
    .then(response => {
      if (!response.ok) {
        throw new Error('Failed to generate image');
      }
      return response.json();
    })
    .then(json => {
      // No need to parse JSON again, as response.json() already does that.
      return json;
    })
    .catch(error => {
      console.error('Error during image generation:', error);
      throw error;
    });
  }
  
  
  function analyzeDreamWithGPT(dreamText) {
    const psychologists = {
      Freud: `Using Freud's theory of dreams as wish fulfillments, provide a detailed interpretation of the dream '${dreamText}'. Consider symbolic meanings and the possibility of unmet desires manifesting in the dream. Include the best most compelling explanation of what it could mean, not multiple. Pull out parts of the dream that was entered, and connect that to the analysis.`,
      Jung: `Analyze the dream '${dreamText}' with Jung's theory of the collective unconscious and archetypes. Identify any archetypal symbols and discuss what collective human experiences they may represent  Include the best most compelling explanation of what it could mean, not multiple. Pull out parts of the dream that was entered, and connect that to the analysis.`,
      Hall: `Interpret the dream '${dreamText}' by applying Hall's theory that dreams are part of our cognitive processes. Discuss how the dream elements might relate to the dreamer's waking thoughts and experiences.  Include the best most compelling explanation of what it could mean, not multiple. Pull out parts of the dream that was entered, and connect that to the analysis.`,
      Domhoff: `Examine the dream '${dreamText}' from Domhoff's viewpoint, suggesting that dreams are reflections of our waking concerns. Elucidate how the dream might reveal the dreamer's ongoing life issues or preoccupations.  Include the best most compelling explanation of what it could mean, not multiple. Pull out parts of the dream that was entered, and connect that to the analysis.`,
    };
  
    const analysesPromises = Object.entries(psychologists).map(([psychologist, prompt]) => {
      const data = {
        prompt: prompt,
        max_tokens: 150
      };
      return callOpenAI(data).then(response => ({ [psychologist]: response }));
    });
  
    return Promise.all(analysesPromises).then(analysesObjects => {
      return analysesObjects.reduce((acc, analysis) => ({ ...acc, ...analysis }), {});
    });
  }
  
//   function callOpenAI(data) {
//     // Fetch request to your Express server
//     return fetch('/api/callOpenAI', {
//       method: 'POST',
//       headers: {
//         'Content-Type': 'application/json',
//       },
//       body: JSON.stringify(data)
//     })
//     .then(response => {
//       if (!response.ok) {
//         // If the HTTP status code is not 200-299, throw an error
//         return response.text().then(text => Promise.reject(text));
//       }
//       // Assume the response will be JSON and parse it
//       return response.json();
//     })
//     .then(json => {
//       // Do something with the JSON response
//       return json.choices[0].text.trim();
//     })
//     .catch(error => {
//       // Handle errors, which could be HTTP-related or JSON parsing-related
//       console.error('Error:', error);
//     });
//   }
  

function callOpenAI(data) {
    // Fetch request to your Express server
    return fetch('/api/callOpenAI', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data)
    })
    .then(response => {
      if (!response.ok) {
        // If the HTTP status code is not 200-299, throw an error
        return response.text().then(text => Promise.reject(text));
      }
      // Assume the response will be JSON and parse it
      return response.json();
    })
    .then(json => {
      // Check if 'choices' is present and has at least one entry
      if (json.choices && json.choices.length > 0) {
        // Do something with the JSON response
        return json.choices[0].text.trim();
      } else {
        // Handle cases where 'choices' is not as expected
        throw new Error('Invalid response structure from OpenAI API');
      }
    })
    .catch(error => {
      // Handle errors, which could be HTTP-related or JSON parsing-related
      console.error('Error:', error);
      throw error; // Re-throw the error so it can be caught by subsequent '.catch' blocks
    });
  }
  