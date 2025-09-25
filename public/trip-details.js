import { auth, db } from './firebase.js';
import { doc, setDoc, getDoc, collection, query, where, getDocs } from 'https://www.gstatic.com/firebasejs/10.11.1/firebase-firestore.js';

// Get trip data from URL parameters
const urlParams = new URLSearchParams(window.location.search);
const tripData = JSON.parse(decodeURIComponent(urlParams.get('trip') || '{}'));
const generatedTrip = tripData.generatedTrip || {};

// DOM Elements
const tripLocation = document.getElementById('trip-location');
const tripDuration = document.getElementById('trip-duration');
const tripBudget = document.getElementById('trip-budget');
const tripCompanion = document.getElementById('trip-companion');
const hotelOptions = document.getElementById('hotel-options');
const itineraryDays = document.getElementById('itinerary-days');
const saveTripBtn = document.getElementById('save-trip');
const newTripBtn = document.getElementById('new-trip');

const apiKey = 'AIzaSyCeCBVt-PQ7iPV163rrJfjRgLJCjlV78jY'; // Google Places API key

async function fetchPlaceId(placeName, lat, lng) {
  return new Promise((resolve) => {
    const mapElement = document.getElementById('map');
    if (!mapElement) {
      console.error('Map element not found for PlacesService');
      resolve(null);
      return;
    }
    const service = new google.maps.places.PlacesService(mapElement);

    const request = {
      query: placeName,
      fields: ['place_id'],
      locationBias: lat && lng ? new google.maps.LatLng(lat, lng) : undefined,
    };

    service.findPlaceFromQuery(request, (results, status) => {
      if (status === google.maps.places.PlacesServiceStatus.OK && results && results.length > 0) {
        resolve(results[0].place_id);
      } else {
        resolve(null);
      }
    });
  });
}

async function openGoogleMapsWithPlaceId(lat, lng, placeName) {
  if ((!lat || !lng) && !placeName) return;

  let placeId = null;
  if (placeName) {
    placeId = await fetchPlaceId(placeName, lat, lng);
  }

  let mapsUrl;
  if (placeId) {
    mapsUrl = `https://www.google.com/maps/search/?api=1&query=Google&query_place_id=${placeId}`;
  } else if (lat && lng) {
    mapsUrl = `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
  } else if (placeName) {
    mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(placeName)}`;
  } else {
    return;
  }

  window.open(mapsUrl, '_blank');
}

// Helper function to fetch place image from Google Maps Places Text Search API (new version)
// async function fetchPlaceImage(placeName, location) {
//   return new Promise((resolve) => {
//     const mapElement = document.getElementById('map');
//     if (!mapElement) {
//       console.error('Map element not found for PlacesService');
//       resolve(null);
//       return;
//     }
//     const service = new google.maps.places.PlacesService(mapElement);

//     const fetchPhotoUri = async (photoResourceName) => {
//       try {
//         const apiKey = 'AIzaSyCeCBVt-PQ7iPV163rrJfjRgLJCjlV78jY'; // Replace with your actual API key or load from config
//         const url = `https://places.googleapis.com/v1/${photoResourceName}/media?key=${apiKey}`;
//         const response = await fetch(url);
//         if (!response.ok) {
//           console.error('Place Photos API error:', response.statusText);
//           return null;
//         }
//         const data = await response.json();
//         return data.photoUri || null;
//       } catch (error) {
//         console.error('Error fetching photoUri:', error);
//         return null;
//       }
//     };

//     const searchWithBias = (query) => {
//       return new Promise((res) => {
//         const request = {
//           query,
//           fields: ['photos', 'placeId'],
//           locationBias: location ? new google.maps.LatLng(location.lat, location.lng) : undefined,
//         };
//         service.textSearch(request, async (results, status) => {
//           if (status === google.maps.places.PlacesServiceStatus.OK && results && results.length > 0) {
//             for (const result of results) {
//               if (result.photos && result.photos.length > 0) {
//                 const photoResourceName = result.photos[0].getUrl ? null : result.photos[0].name;
//                 if (photoResourceName) {
//                   const photoUri = await fetchPhotoUri(photoResourceName);
//                   if (photoUri) {
//                     res(photoUri);
//                     return;
//                   }
//                 } else {
//                   const photoUrl = result.photos[0].getUrl({ maxWidth: 400 });
//                   res(photoUrl);
//                   return;
//                 }
//               }
//             }
//           }
//           res(null);
//         });
//       });
//     };

//     const searchWithoutBias = (query) => {
//       return new Promise((res) => {
//         const request = {
//           query,
//           fields: ['photos', 'placeId'],
//         };
//         service.textSearch(request, async (results, status) => {
//           if (status === google.maps.places.PlacesServiceStatus.OK && results && results.length > 0) {
//             for (const result of results) {
//               if (result.photos && result.photos.length > 0) {
//                 const photoResourceName = result.photos[0].getUrl ? null : result.photos[0].name;
//                 if (photoResourceName) {
//                   const photoUri = await fetchPhotoUri(photoResourceName);
//                   if (photoUri) {
//                     res(photoUri);
//                     return;
//                   }
//                 } else {
//                   const photoUrl = result.photos[0].getUrl({ maxWidth: 400 });
//                   res(photoUrl);
//                   return;
//                 }
//               }
//             }
//           }
//           res(null);
//         });
//       });
//     };

//     (async () => {
//       let photo = await searchWithBias(placeName);
//       if (!photo) {
//         photo = await searchWithoutBias(placeName);
//       }
//       if (!photo && placeName.toLowerCase().includes('temple')) {
//         const modifiedQuery = placeName + ' Temple';
//         photo = await searchWithBias(modifiedQuery);
//         if (!photo) {
//           photo = await searchWithoutBias(modifiedQuery);
//         }
//       }
//       resolve(photo);
//     })();
//   });
// }

// Optimized display function with lazy loading and caching
const imageCache = new Map();
const loadingPromises = new Map();

// Optimized image fetching with caching
async function fetchPlaceImage(placeName, location) {
  const cacheKey = `${placeName}_${location?.lat || ''}_${location?.lng || ''}`;
  
  // Return cached image if available
  if (imageCache.has(cacheKey)) {
    return imageCache.get(cacheKey);
  }
  
  // Return existing promise if already fetching
  if (loadingPromises.has(cacheKey)) {
    return loadingPromises.get(cacheKey);
  }

  const fetchPromise = new Promise(async (resolve) => {
    try {
      const mapElement = document.getElementById('map');
      if (!mapElement || !window.google?.maps?.places) {
        resolve(null);
        return;
      }
      
      const service = new google.maps.places.PlacesService(mapElement);
      
      const request = {
        query: placeName,
        fields: ['photos'],
      };
      
      if (location) {
        request.locationBias = new google.maps.LatLng(location.lat, location.lng);
      }
      
      service.textSearch(request, (results, status) => {
        if (status === google.maps.places.PlacesServiceStatus.OK && results?.[0]?.photos?.[0]) {
          const photo = results[0].photos[0];
          const photoUrl = photo.getUrl({ maxWidth: 400 });
          imageCache.set(cacheKey, photoUrl);
          resolve(photoUrl);
        } else {
          resolve(null);
        }
      });
    } catch (error) {
      console.error('Error fetching place image:', error);
      resolve(null);
    }
  });
  
  loadingPromises.set(cacheKey, fetchPromise);
  const result = await fetchPromise;
  loadingPromises.delete(cacheKey);
  return result;
}

// Lazy image loading with Intersection Observer
function setupLazyLoading() {
  if (!('IntersectionObserver' in window)) {
    // Fallback for older browsers
    return;
  }

  const imageObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const img = entry.target;
        const placeName = img.dataset.placeName;
        const lat = img.dataset.lat;
        const lng = img.dataset.lng;
        
        if (placeName) {
          fetchPlaceImage(placeName, lat && lng ? { lat, lng } : null)
            .then(imageUrl => {
              if (imageUrl) {
                img.src = imageUrl;
              } else {
                img.src = 'https://via.placeholder.com/300x200?text=Image+Not+Available';
              }
            })
            .catch(() => {
              img.src = 'https://via.placeholder.com/300x200?text=Image+Not+Available';
            });
        }
        
        imageObserver.unobserve(img);
      }
    });
  }, {
    rootMargin: '50px',
    threshold: 0.1
  });

  return imageObserver;
}

// Optimized display function
async function displayTripDetails() {
  // Display basic trip info immediately
  tripLocation.textContent = generatedTrip.location || 'Your Trip';
  tripDuration.innerHTML = `${tripData.durationIcon || '📅'} ${generatedTrip.duration || 'N/A'}`;
  tripBudget.innerHTML = `${tripData.budgetIcon || '💰'} ${generatedTrip.budget || 'N/A'} Budget`;
  tripCompanion.innerHTML = `${tripData.companionIcon || '👤'} For ${generatedTrip.travelerType || 'N/A'}`;

  // Setup lazy loading
  const imageObserver = setupLazyLoading();

  // Display hotels with lazy loading placeholders
  if (generatedTrip.hotelOptions?.length > 0) {
    const hotelsHtml = generatedTrip.hotelOptions.map(hotel => `
      <div class="hotel-card">
        <img 
          src="https://via.placeholder.com/300x200?text=Loading..." 
          data-place-name="${hotel.hotelName}"
          data-lat="${hotel.geoCoordinates?.lat || ''}"
          data-lng="${hotel.geoCoordinates?.lng || ''}"
          data-name="${hotel.hotelName || ''}"
          alt="${hotel.hotelName}" 
          class="hotel-image lazy-image"
          style="cursor: pointer;"
          onerror="this.onerror=null;this.src='https://via.placeholder.com/300x200?text=Image+Not+Available';"
        >
        <div class="hotel-info">
          <h3 class="hotel-name">${hotel.hotelName}</h3>
          <div class="hotel-price">${hotel.price || 'Price not available'}</div>
          <div class="hotel-rating">
            <i class="fas fa-star"></i>
            <span>${hotel.rating || 'N/A'}</span>
          </div>
          <p class="hotel-description">${hotel.description || 'No description available.'}</p>
          <p><strong>Address:</strong> ${hotel.hotelAddress || 'N/A'}</p>
        </div>
      </div>
    `).join('');
    
    hotelOptions.innerHTML = hotelsHtml;
    
    // Setup lazy loading for hotel images
    document.querySelectorAll('.hotel-image.lazy-image').forEach(img => {
      imageObserver?.observe(img);
    });
  } else {
    hotelOptions.innerHTML = '<p>No hotel options available for this trip.</p>';
  }

  // Display itinerary with lazy loading
  if (generatedTrip.itinerary?.length > 0) {
    const itineraryHtml = generatedTrip.itinerary.map((day, index) => {
      const activitiesHtml = day.activities.map(activity => `
        <div class="activity">
          <img 
            src="https://via.placeholder.com/300x200?text=Loading..." 
            data-place-name="${activity.placeName}"
            data-lat="${activity.geoCoordinates?.lat || ''}"
            data-lng="${activity.geoCoordinates?.lng || ''}"
            data-name="${activity.placeName || ''}"
            alt="${activity.placeName}" 
            class="activity-image lazy-image"
            style="cursor: pointer;"
            onerror="this.onerror=null;this.src='https://via.placeholder.com/300x200?text=Image+Not+Available';"
          >
          <div class="activity-info">
            <h4 class="activity-name">${activity.placeName}</h4>
            <div class="activity-time">Best time to visit: ${activity.bestTimeToVisit || 'Anytime'}</div>
            <div class="activity-price">Ticket: ${activity.ticketPricing || 'Free'}</div>
            <div class="activity-rating">
              <i class="fas fa-star"></i>
              <span>${activity.rating || 'N/A'}</span>
            </div>
            <p class="activity-description">${activity.placeDetails || 'No details available.'}</p>
          </div>
        </div>
      `).join('');
      
      return `
        <div class="itinerary-day">
          <h3 class="day-title">Day ${index + 1}</h3>
          ${activitiesHtml}
        </div>
      `;
    }).join('');
    
    itineraryDays.innerHTML = itineraryHtml;
    
    // Setup lazy loading for activity images
    document.querySelectorAll('.activity-image.lazy-image').forEach(img => {
      imageObserver?.observe(img);
    });
  } else {
    itineraryDays.innerHTML = '<p>No itinerary available for this trip.</p>';
  }

  // Attach click event listeners using event delegation
  document.addEventListener('click', (e) => {
    if (e.target.classList.contains('hotel-image') || e.target.classList.contains('activity-image')) {
      const lat = e.target.dataset.lat;
      const lng = e.target.dataset.lng;
      const name = e.target.dataset.name;
      
      if (lat && lng) {
        openGoogleMapsWithPlaceId(lat, lng, name);
      } else if (name) {
        openGoogleMapsWithPlaceId(null, null, name);
      }
    }
  });
}

// Save trip to Firebase

function showToast(message) {
  const toast = document.getElementById('toast');
  toast.textContent = message;
  toast.classList.add('show');
  setTimeout(() => {
    toast.classList.remove('show');
  }, 3000);
}

async function saveTripToFirebase() {
  const user = auth.currentUser;
  if (!user) {
    showToast('Please sign in to save your trip.');
    return;
  }

  try {
    const tripRef = doc(collection(db, 'users', user.uid, 'trips'));
    const tripToSave = {
      ...tripData,
      generatedTrip,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    await setDoc(tripRef, tripToSave);
    showToast('Trip saved successfully!');
    saveTripBtn.textContent = 'Saved!';
    saveTripBtn.disabled = true;
  } catch (error) {
    console.error('Error saving trip:', error);
    showToast('Failed to save trip. Please try again.');
  }
}

newTripBtn.addEventListener('click', () => {
  window.location.href = 'planner.html';
});

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  displayTripDetails();

  const saveTripBtn = document.getElementById('save-trip');
  if (saveTripBtn) {
    saveTripBtn.addEventListener('click', saveTripToFirebase);
  }
  
  const userProfile = document.getElementById('userProfile');
  const userPic = document.getElementById('userPic');
  const profileDropdown = document.getElementById('profileDropdown');
  const userDropdownPic = document.getElementById('userDropdownPic');
  const userName = document.getElementById('userName');
  const userEmail = document.getElementById('userEmail');
  const logOutLink = document.getElementById('LogOutLink');
  const signInLink = document.getElementById('signInLink');

  // Check if user is logged in to enable save button and show user profile
  auth.onAuthStateChanged(user => {
    if (user) {
      saveTripBtn.disabled = false;

      // Show user profile and hide sign in link
      if (userProfile) userProfile.style.display = 'flex';
      if (signInLink) signInLink.style.display = 'none';

      // Set user info
      if (userPic) userPic.src = user.photoURL || 'https://www.gravatar.com/avatar/?d=mp&f=y';
      if (userDropdownPic) userDropdownPic.src = user.photoURL || 'https://www.gravatar.com/avatar/?d=mp&f=y&s=40';
      if (userName) userName.textContent = user.displayName || (user.email ? user.email.split('@')[0] : 'User');
      if (userEmail) userEmail.textContent = user.email || '';

      // Toggle dropdown on user profile click
      if (userProfile && profileDropdown) {
        userProfile.addEventListener('click', () => {
          if (profileDropdown.style.display === 'none' || profileDropdown.style.display === '') {
            profileDropdown.style.display = 'block';
          } else {
            profileDropdown.style.display = 'none';
          }
        });

        // Hide dropdown when clicking outside
        document.addEventListener('click', (event) => {
          if (!userProfile.contains(event.target) && !profileDropdown.contains(event.target)) {
            profileDropdown.style.display = 'none';
          }
        });
      }

      // Logout handler
      if (logOutLink) {
        logOutLink.addEventListener('click', (e) => {
          e.preventDefault();
          auth.signOut().then(() => {
            // Hide user profile and show sign in link
            if (userProfile) userProfile.style.display = 'none';
            if (signInLink) signInLink.style.display = 'inline-block';
            if (profileDropdown) profileDropdown.style.display = 'none';
            saveTripBtn.disabled = true;
          }).catch((error) => {
            console.error('Error signing out:', error);
          });
        });
      }
    } else {
      saveTripBtn.disabled = true;
      if (userProfile) userProfile.style.display = 'none';
      if (signInLink) signInLink.style.display = 'inline-block';
      if (profileDropdown) profileDropdown.style.display = 'none';
    }
  });
});
