document.addEventListener('DOMContentLoaded', function () {
    const searchInput = document.querySelector('.dream-input input');
  
    searchInput.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') {
        e.preventDefault();
        const dreamText = e.target.value.trim();
        // searchInput.value = '';
  
        identifyThemes(dreamText).then((themes) => {
          document.querySelector('.themes p').textContent = themes;
          return generateDreamlikeImage(themes);
        })
        .then(imageUrl => {
          const dalleImageElement = document.querySelector('.dream-image');
          dalleImageElement.src = imageUrl;
          dalleImageElement.alt = 'Generated Image based on dream analysis';
        })
        .catch(error => {
          console.error('Error generating image:', error);
        });
  
        analyzeDreamWithGPT(dreamText)
          .then(analyses => {
            Object.keys(analyses).forEach((psychologist) => {
              document.querySelector(`.interpretation.${psychologist.toLowerCase()} p`).textContent =
                analyses[psychologist];
            });
          })
          .catch(error => {
            console.error('Error analyzing dream:', error);
          });
      }
    });
  });
  
  function identifyThemes(dreamText) {
    const data = {
      prompt: `Identify the key themes and symbols present in the following dream: '${dreamText}', and explain how these might be interpreted according to dream analysis.`,
      max_tokens: 100,
    };
    return callOpenAI(data);
  }
  
  function generateDreamlikeImage(dreamText) {
    let prompt = `Create a high-resolution image that reflects the dream narrative: '${dreamText}'. It should be a joyful, serene dreamscape, with purple and pink hues. The visuals should be dreamlike and ethereal, instilling happiness and tranquility in line with the dreamer's description of a perfect, peaceful realm. It should be abstract and like a painting.`;
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
      Freud: `Using Freud's theory of dreams as wish fulfillments, provide a detailed interpretation of the dream '${dreamText}'. Consider symbolic meanings and the possibility of unmet desires manifesting in the dream. Include the best most compelling explanation of what it could mean, not multiple.`,
      Jung: `Analyze the dream '${dreamText}' with Jung's theory of the collective unconscious and archetypes. Identify any archetypal symbols and discuss what collective human experiences they may represent  Include the best most compelling explanation of what it could mean, not multiple.`,
      Hall: `Interpret the dream '${dreamText}' by applying Hall's theory that dreams are part of our cognitive processes. Discuss how the dream elements might relate to the dreamer's waking thoughts and experiences.  Include the best most compelling explanation of what it could mean, not multiple.`,
      Domhoff: `Examine the dream '${dreamText}' from Domhoff's viewpoint, suggesting that dreams are reflections of our waking concerns. Elucidate how the dream might reveal the dreamer's ongoing life issues or preoccupations.  Include the best most compelling explanation of what it could mean, not multiple.`,
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
      // Do something with the JSON response
      return json.choices[0].text.trim();
    })
    .catch(error => {
      // Handle errors, which could be HTTP-related or JSON parsing-related
      console.error('Error:', error);
    });
  }
  