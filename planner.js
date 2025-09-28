async function generateTrip() {
  const destination = document.getElementById('autocomplete').value.trim();
  const days = document.querySelector('.days-input').value.trim();
  const budgetRaw = document.querySelector('#budget-options .option-box.selected strong')?.innerText;
  const companionRaw = document.querySelector('#companion-options .option-box.selected strong')?.innerText;

  // Extract emoji icons from selected option-box spans
  const budgetIcon = document.querySelector('#budget-options .option-box.selected .emoji')?.textContent || '';
  const companionIcon = document.querySelector('#companion-options .option-box.selected .emoji')?.textContent || '';
  const durationIcon = '📅'; // default calendar emoji for duration

  if (!destination || !days || !budgetRaw || !companionRaw) {
    const toast = document.getElementById("toast");
    toast.textContent = "Please fill all details before generating your trip!";
    toast.classList.add("show");
    setTimeout(() => toast.classList.remove("show"), 3000);
    return;
  }

  // Normalize budget and companion strings
  let budget = budgetRaw;
  if (budgetRaw.toLowerCase().includes('low')) budget = "Low Budget";
  else if (budgetRaw.toLowerCase().includes('moderate')) budget = "Moderate Budget";
  else if (budgetRaw.toLowerCase().includes('luxury')) budget = "Luxury Budget";

  let companion = companionRaw;
  if (companionRaw.toLowerCase() === 'a couple') companion = "A Couple";
  else if (companionRaw.toLowerCase() === 'just me') companion = "Just Me";
  else if (companionRaw.toLowerCase() === 'family') companion = "Family";
  else if (companionRaw.toLowerCase() === 'friends') companion = "Friends";

  if (parseInt(days) <= 0) {
    const toast = document.getElementById("toast");
    toast.textContent = "Number of days must be at least 1.";
    toast.classList.add("show");
    setTimeout(() => toast.classList.remove("show"), 3000);
    return;
  }

  const tripDetails = {
    location: destination,
    days: days,
    budget: budget,
    travelerType: companion,
    budgetIcon: budgetIcon,
    companionIcon: companionIcon,
    durationIcon: durationIcon
  };

  try {
    const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=AIzaSyAZb0W65PxP-F-EuCuhwA4TLBcyYP9dvK0', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: `Generate Travel Plan for Location: ${destination}, for ${days} Days for ${companion} with a ${budget}. 
            Provide the response in valid JSON format with the following structure:
            {
              "location": "Location Name",
              "duration": "Duration",
              "travelerType": "Traveler Type",
              "budget": "Budget Level",
              "hotelOptions": [
                {
                  "hotelName": "Hotel Name",
                  "hotelAddress": "Address",
                  "price": "Price Range",
                  "hotelImageUrl": "Image URL",
                  "geoCoordinates": { "lat": 0.0, "lng": 0.0 },
                  "rating": "Rating",
                  "description": "Description"
                }
              ],
              "itinerary": [
                {
                  "day": 1,
                  "activities": [
                    {
                      "placeName": "Place Name",
                      "placeDetails": "Details",
                      "placeImageUrl": "Image URL",
                      "geoCoordinates": { "lat": 0.0, "lng": 0.0 },
                      "ticketPricing": "Price Info",
                      "rating": "Rating",
                      "bestTimeToVisit": "Time Recommendation"
                    }
                  ]
                }
              ]
            }`
          }]
        }]
      })
    });

    if (!response.ok) {
      throw new Error(`API request failed with status ${response.status}`);
    }

    const data = await response.json();
    
    if (!data.candidates || !data.candidates[0] || !data.candidates[0].content) {
      throw new Error('No valid content returned from API');
    }

    const generatedContent = data.candidates[0].content.parts[0].text;

    // Clean the generated content to remove any markdown or code block syntax
    const cleanedContent = generatedContent.replace(/```json|```/g, '').trim();

    // Parse the JSON response
    const generatedTrip = JSON.parse(cleanedContent);

    // Redirect to trip details page with the generated trip
    window.location.href = `trip-details.html?trip=${encodeURIComponent(JSON.stringify({
      tripDetails,
      generatedTrip
    }))}`;
  } catch (error) {
    console.error('Error generating trip:', error);
    const toast = document.getElementById("toast");
    toast.textContent = "Failed to generate trip. Please try again.";
    toast.classList.add("show");
    setTimeout(() => toast.classList.remove("show"), 3000);
  }
}

function setupOptionBoxSelection(containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;
  const optionBoxes = container.querySelectorAll('.option-box');
  optionBoxes.forEach(box => {
    box.addEventListener('click', () => {
      optionBoxes.forEach(b => b.classList.remove('selected'));
      box.classList.add('selected');
    });
  });
}


document.addEventListener('DOMContentLoaded', () => {
  setupOptionBoxSelection('budget-options');
  setupOptionBoxSelection('companion-options');

  const generateTripBtn = document.querySelector('.generate-trip');
  if (generateTripBtn) {
    generateTripBtn.addEventListener('click', () => {
      console.log('Generate trip button clicked');
      import('./firebase.js').then(({ auth, onAuthStateChanged }) => {
        onAuthStateChanged(auth, (user) => {
          console.log('onAuthStateChanged callback triggered, user:', user);
          const destination = document.getElementById('autocomplete').value.trim();
          const days = document.querySelector('.days-input').value.trim();
          const budgetRaw = document.querySelector('#budget-options .option-box.selected strong')?.innerText;
          const companionRaw = document.querySelector('#companion-options .option-box.selected strong')?.innerText;

          if (!destination || !days || !budgetRaw || !companionRaw) {
            const toast = document.getElementById("toast");
            toast.innerHTML = '⚠️ Please fill all the details to generate your trip';
            toast.classList.add("show");
            setTimeout(() => toast.classList.remove("show"), 3000);
            return;
          }

          if (user) {
            console.log('User is signed in, generating trip');
            // Hide button text and add spinner icon inside button
            generateTripBtn.setAttribute('data-original-text', generateTripBtn.textContent);
            generateTripBtn.textContent = '';
            const spinnerIcon = document.createElement('i');
            spinnerIcon.className = 'fa-solid fa-spinner fa-spin';
            spinnerIcon.style.fontSize = '1.5em';
            spinnerIcon.style.color = '';
            generateTripBtn.appendChild(spinnerIcon);
            generateTrip();
          } else {
            const authDialog = document.getElementById('authDialog');
            if (authDialog) {
              console.log('Showing authDialog modal');
              authDialog.showModal();
            } else {
              console.warn('authDialog element not found');
            }
          }
        });
      });
    });
  } else {
    console.warn('Generate trip button not found');
  }
});

// Get the input and icon elements
const autocompleteInput = document.getElementById('autocomplete');
const autocompleteIcon = document.querySelector('.autocomplete-icon');

// Add event listeners for focus and blur
autocompleteInput.addEventListener('focus', () => {
  autocompleteIcon.style.display = 'none';
});

autocompleteInput.addEventListener('blur', () => {
  // Only show icon again if input is empty
  if (autocompleteInput.value === '') {
    autocompleteIcon.style.display = 'block';
  }
});

// Additional check when typing to handle cases where user clears the input
autocompleteInput.addEventListener('input', () => {
  if (autocompleteInput.value === '') {
    autocompleteIcon.style.display = 'block';
  } else {
    autocompleteIcon.style.display = 'none';
  }
});
