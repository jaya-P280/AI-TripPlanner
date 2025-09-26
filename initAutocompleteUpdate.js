
function initAutocomplete() {
  const input = document.getElementById('autocomplete');
  if (!input) return;

  if (typeof google === 'undefined' || !google.maps || !google.maps.places) {
    console.error('Google Maps Places API is not loaded.');
    return;
  }

  const options = {
    types: ['(cities)'], // Only suggest cities
  };

  const autocomplete = new google.maps.places.Autocomplete(input, options);

  // Optional: Handle selected place
  autocomplete.addListener('place_changed', () => {
    const place = autocomplete.getPlace();
    console.log('Selected city:', place.name);
  });
}

window.initAutocomplete = initAutocomplete;

function loadGoogleMapsScript(callbackName) {
  const apiKey='__MAP_API_KEY__'; // <-- placeholder
  const script = document.createElement('script');
  script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&callback=${callbackName}`;
  script.async = true;
  script.defer = true;
  script.onerror = () => {
    console.error('Failed to load Google Maps script.');
  };
  document.head.appendChild(script);
}

window.addEventListener('load', () => {
  const apiKey='__MAP_API_KEY__';
  if (!apiKey) {
    console.error('Google Places API key is not defined.');
    return;
  }
  loadGoogleMapsScript('initAutocomplete');
});
