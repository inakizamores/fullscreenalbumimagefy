// Use import.meta.env to access environment variables injected by Vite
const clientId = import.meta.env.VITE_SPOTIFY_CLIENT_ID;
const redirectUri = import.meta.env.VITE_REDIRECT_URI;
const scopes = 'user-read-currently-playing';

// Log the variables to check their values in the browser console
console.log("Client ID:", clientId);
console.log("Redirect URI:", redirectUri);
console.log("All env variables:", import.meta.env);

const loginButton = document.getElementById('login-button');
const albumArt = document.getElementById('album-art');

let accessToken = null;

// 1. Spotify Authorization (Authorization Code Flow)
loginButton.addEventListener('click', () => {
    const authUrl = `https://accounts.spotify.com/authorize?client_id=${clientId}&response_type=code&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${encodeURIComponent(scopes)}&show_dialog=true`;
    window.location.href = authUrl; // Redirect to Spotify login
});

// 2. Handle Authorization Code Callback
async function handleCallback() {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');

    if (code) {
        try {
            const data = await exchangeCodeForToken(code);
            accessToken = data.access_token;
            // Store the refresh token securely in an HTTP-only cookie
            setRefreshTokenCookie(data.refresh_token); 

            loginButton.style.display = 'none'; // Hide login button
            await fetchCurrentSong();
            setInterval(fetchCurrentSong, 5000); // Refresh every 5 seconds
        } catch (error) {
            console.error('Error exchanging code for token:', error);
        }
    }
}

// 3. Exchange Authorization Code for Tokens (using Netlify Function)
async function exchangeCodeForToken(code) {
    const response = await fetch('/.netlify/functions/exchange-token', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ code })
    });

    if (!response.ok) {
        const errorData = await response.json(); // Get error details from response
        console.error("Token exchange error:", errorData);  //Log the actual error
        throw new Error(`Failed to exchange authorization code: ${response.status} - ${response.statusText}`); // Throw an error including the status
    }

    return response.json();
}

// 4. Fetch Currently Playing Song
async function fetchCurrentSong() {
    if (!accessToken) {
        try {
            await refreshAccessToken();
        } catch (error) {
            console.error('Error refreshing access token:', error);
            window.location.href = '/'; // Redirect to the main page or login
            return; // Stop execution
        }
    }

    try {
        const response = await fetch('https://api.spotify.com/v1/me/player/currently-playing', {
            headers: {
                'Authorization': `Bearer ${accessToken}`
            }
        });

        if (response.ok) {
            const data = await response.json();

            if (data && data.item && data.item.album && data.item.album.images && data.item.album.images.length > 0) {  // Enhanced checks
                const imageUrl = data.item.album.images[0].url;
                albumArt.src = imageUrl;
                albumArt.style.display = 'block';
            } else {
                albumArt.style.display = 'none';
                console.log('Nothing currently playing, no album art available, or unexpected data format.');
            }
        } else if (response.status === 401) { // Specifically handle 401 Unauthorized
            console.error('Access token expired, attempting refresh');
            try {
                await refreshAccessToken();  // Retry the refresh
                await fetchCurrentSong();  // Retry fetching the song
            } catch (refreshError) {
                console.error('Refresh token failed:', refreshError);
                window.location.href = '/'; // Redirect or handle the login again here
            }
        } else if (response.status === 429) { // Rate limiting
            console.warn("Rate limited. Waiting...");
            const retryAfter = parseInt(response.headers.get('Retry-After')) * 1000 || 5000; // Retry in specified time or 5 secs
            setTimeout(fetchCurrentSong, retryAfter);
        } else {
            console.error('Error fetching current song:', response.status, response.statusText);
        }
    } catch (error) {
        console.error('Error:', error);
    }
}

// 5. Refresh Access Token (using Netlify Function)
async function refreshAccessToken() {
    try {
        const response = await fetch('/.netlify/functions/refresh-token', {
            method: 'POST',
            credentials: 'include',  // Important for sending cookies
        });
        if (!response.ok) {  // Check if refresh failed
            console.error("Refresh token request failed:", response.status, response.statusText);
            throw new Error("Failed to refresh access token"); // Explicitly throw error
        }

        const data = await response.json();
        accessToken = data.access_token;
    } catch (error) {
        throw new Error('Error during refresh:', error); // Re-throw to be caught by caller
    }
}



// Helper function to set the refresh token in an HTTP-only cookie
function setRefreshTokenCookie(refreshToken) {
    document.cookie = `refresh_token=${refreshToken}; path=/; max-age=2592000; secure; samesite=strict; HttpOnly`; 
}

// Call handleCallback when redirected from Spotify
if (window.location.search.includes('code=')) {
    handleCallback();
}