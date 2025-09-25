import { auth, db } from './firebase.js';
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  orderBy,
  deleteDoc,
  doc
} from 'https://www.gstatic.com/firebasejs/10.11.1/firebase-firestore.js';

// DOM Elements
const tripsList = document.getElementById('trips-list');

// Fetch and display user's trips
async function fetchUserTrips() {
  const user = auth.currentUser;
  if (!user) {
    tripsList.innerHTML = '<div class="no-trips">Please sign in to view your saved trips.</div>';
    return;
  }

  try {
    const tripsQuery = query(
      collection(db, 'users', user.uid, 'trips'),
      orderBy('createdAt', 'desc')
    );
    const querySnapshot = await getDocs(tripsQuery);

    if (querySnapshot.empty) {
      tripsList.innerHTML = '<div class="no-trips">You have no saved trips yet.</div>';
      return;
    }

    tripsList.innerHTML = querySnapshot.docs.map(doc => {
      const trip = doc.data();
      const tripDetails = trip.tripDetails || {};
      const generatedTrip = trip.generatedTrip || {};
      
      return `
        <div class="trip-card" data-trip-id="${doc.id}">
          <div class="trip-header">
            <div class="trip-header-top">
              <h3 class="trip-location">${generatedTrip.location || 'Unknown Location'}</h3>
              <div class="trip-actions">
                <button class="trip-menu-btn"><i class="fas fa-ellipsis-v"></i></button>
                <div class="trip-menu" style="display: none;">
                  <button class="delete-trip">Remove</button>
                </div>
              </div>
            </div>
            <div class="trip-meta">
              <span>📅 ${tripDetails.days || 'N/A'} Days</span>
              <span>💰 ${tripDetails.budget || 'N/A'}</span>
              <span>👤 ${tripDetails.travelerType || 'N/A'}</span>
            </div>
            <div class="trip-dates">
              Saved on ${trip.createdAt ? new Date(trip.createdAt).toLocaleDateString() : 'Unknown date'}
            </div>
          </div>
          <a href="trip-details.html?trip=${encodeURIComponent(JSON.stringify(trip))}" class="view-trip-btn">
            View Trip Details
          </a>
        </div>
      `;
    }).join('');

    // Add click handlers for trip menu
    document.querySelectorAll('.trip-menu-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const menu = btn.nextElementSibling;
        document.querySelectorAll('.trip-menu').forEach(m => {
          if (m !== menu) m.style.display = 'none';
        });
        menu.style.display = menu.style.display === 'block' ? 'none' : 'block';
      });
    });

    // Close menus when clicking elsewhere
    document.addEventListener('click', () => {
      document.querySelectorAll('.trip-menu').forEach(menu => {
        menu.style.display = 'none';
      });
    });

    // Delete trip functionality
    document.querySelectorAll('.delete-trip').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.stopPropagation();
        const tripCard = e.target.closest('.trip-card');
        const tripId = tripCard.dataset.tripId;
        
        try {
          await deleteDoc(doc(db, 'users', auth.currentUser.uid, 'trips', tripId));
          tripCard.remove();
          
          // Show toast notification
          const toast = document.createElement('div');
          toast.className = 'toast show';
          toast.textContent = 'Trip removed successfully';
          document.body.appendChild(toast);
          setTimeout(() => toast.remove(), 3000);
        } catch (error) {
          console.error('Error deleting trip:', error);
          alert('Failed to delete trip. Please try again.');
        }
      });
    });
  } catch (error) {
    console.error('Error fetching trips:', error);
    tripsList.innerHTML = '<div class="no-trips">Failed to load trips. Please try again.</div>';
  }
}


function setupProfileDropdown() {
  const userProfile = document.getElementById('userProfile');
  const profileDropdown = document.getElementById('profileDropdown');

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
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  setupProfileDropdown();

  const userProfile = document.getElementById('userProfile');
  const userPic = document.getElementById('userPic');
  const profileDropdown = document.getElementById('profileDropdown');
  const userDropdownPic = document.getElementById('userDropdownPic');
  const userName = document.getElementById('userName');
  const userEmail = document.getElementById('userEmail');
  const logOutLink = document.getElementById('LogOutLink');
  const signInLink = document.getElementById('signInLink');

  auth.onAuthStateChanged(user => {
    fetchUserTrips();

    if (user) {
      // Show user profile and hide sign in link
      if (userProfile) userProfile.style.display = 'flex';
      if (signInLink) signInLink.style.display = 'none';

      // Set user info
      if (userPic) userPic.src = user.photoURL || 'https://www.gravatar.com/avatar/?d=mp&f=y';
      if (userDropdownPic) userDropdownPic.src = user.photoURL || 'https://www.gravatar.com/avatar/?d=mp&f=y&s=40';
      if (userName) userName.textContent = user.displayName || 'User';
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
          }).catch((error) => {
            console.error('Error signing out:', error);
          });
        });
      }
    } else {
      // Hide user profile and show sign in link
      if (userProfile) userProfile.style.display = 'none';
      if (signInLink) signInLink.style.display = 'inline-block';
      if (profileDropdown) profileDropdown.style.display = 'none';
    }
  });
});
