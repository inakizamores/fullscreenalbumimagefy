// Use import.meta.env to access environment variables injected by Vite
const clientId = import.meta.env.VITE_SPOTIFY_CLIENT_ID;
const redirectUri = import.meta.env.VITE_REDIRECT_URI;
const scopes = 'user-read-currently-playing';

const loginButton = document.getElementById('login-button');
const albumArt = document.getElementById('album-art');
const albumArtContainer = document.getElementById('album-art-container');

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
            // Store the refresh token securely (e.g., in an HTTP-only cookie)
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
        throw new Error('Failed to exchange authorization code for tokens');
    }

    return response.json();
}

// 4. Fetch Currently Playing Song
async function fetchCurrentSong() {
    if (!accessToken) {
        // Try to refresh the access token if we don't have one
        try {
            await refreshAccessToken();
        } catch (error) {
            console.error('Error refreshing access token:', error);
            // Redirect to login if refresh fails
            window.location.href = redirectUri;
            return;
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

            if (data && data.item) {
                const imageUrl = data.item.album.images[0].url;
                albumArt.src = imageUrl;
                albumArt.style.display = 'block';
            } else {
                albumArt.style.display = 'none';
                console.log('Nothing currently playing or data not available.');
            }
        } else if (response.status === 401) {
            // Access token expired, try to refresh
            console.error('Access token expired, attempting refresh');
            await refreshAccessToken();
            // Retry fetching the current song after refreshing
            await fetchCurrentSong();
        } else {
            console.error('Error fetching current song:', response.status);
        }
    } catch (error) {
        console.error('Error:', error);
    }
}

// 5. Refresh Access Token (using Netlify Function)
async function refreshAccessToken() {
    try {
        const response = await fetch('/.netlify/functions/refresh-token', {
            method: 'POST'
        });

        if (response.ok) {
            const data = await response.json();
            accessToken = data.access_token;
        } else {
            throw new Error('Failed to refresh access token');
        }
    } catch (error) {
        throw new Error('Error refreshing access token:', error);
    }
}

// Helper function to set the refresh token in an HTTP-only cookie
function setRefreshTokenCookie(refreshToken) {
    document.cookie = `refresh_token=${refreshToken}; path=/; max-age=2592000; secure; samesite=strict`; // Expires in 30 days, adjust as needed
}

// Call handleCallback when redirected from Spotify
if (window.location.search.includes('code=')) {
    handleCallback();
}