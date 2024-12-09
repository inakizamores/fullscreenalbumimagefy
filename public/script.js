// Use import.meta.env to access environment variables injected by Vite
const clientId = import.meta.env.VITE_SPOTIFY_CLIENT_ID;
const redirectUri = import.meta.env.VITE_REDIRECT_URI;
const scopes = 'user-read-currently-playing';

// Log environment variables for debugging (in deployed site)
console.log("Client ID:", clientId);
console.log("Redirect URI:", redirectUri);
console.log('All env variables:', import.meta.env);

const loginButton = document.getElementById('login-button');
const albumArt = document.getElementById('album-art');

let accessToken = null;

// 1. Spotify Authorization (Authorization Code Flow)
loginButton.addEventListener('click', () => {
    const authUrl = `https://accounts.spotify.com/authorize?client_id=${clientId}&response_type=code&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${encodeURIComponent(scopes)}&show_dialog=true`;
    window.location.href = authUrl;
});

// 2. Handle Authorization Code Callback
async function handleCallback() {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');

    if (code) {
        try {
            const data = await exchangeCodeForToken(code);
            accessToken = data.access_token;
            setRefreshTokenCookie(data.refresh_token); // Securely store refresh token

            loginButton.style.display = 'none';
            await fetchCurrentSong();
            setInterval(fetchCurrentSong, 5000);
        } catch (error) {
            console.error('Callback error:', error); // More specific error message
        }
    }
}

// 3. Exchange Authorization Code for Tokens
async function exchangeCodeForToken(code) {
    try {
        const response = await fetch('/.netlify/functions/exchange-token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ code })
        });

        if (!response.ok) {
            const errorData = await response.json();
            console.error("Token exchange failed:", errorData); // Log details
            throw new Error(`HTTP error ${response.status}`); // Throw for clarity
        }

        return response.json();
    } catch (error) {
        console.error("Error during token exchange:", error); // Catch and log fetch errors
        throw error; // Re-throw to handle in handleCallback
    }
}

// 4. Fetch Currently Playing Song
async function fetchCurrentSong() {
    if (!accessToken) {
        try {
            await refreshAccessToken();
        } catch (error) {
            console.error('Refresh error:', error);
            window.location.href = '/';  // Redirect to root on error
            return; // Stop further execution
        }
    }

    try {
        const response = await fetch('https://api.spotify.com/v1/me/player/currently-playing', {
            headers: {
                Authorization: `Bearer ${accessToken}`
            }
        });

        if (response.ok) {
            const data = await response.json();
            // Check if data is valid and has image
            if (data?.item?.album?.images?.[0]?.url) {
                albumArt.src = data.item.album.images[0].url;
                albumArt.style.display = 'block';
            } else {
                albumArt.style.display = 'none'; // Hide if no image or error
                console.log('No song playing, no image, or incorrect data format.'); // More info
            }
        } else if (response.status === 401) {
            console.error("401: Trying to refresh token.")
            try {
                await refreshAccessToken();
                await fetchCurrentSong();
            } catch (refreshError) {
                console.error("Refresh also failed, redirecting.", refreshError)
                window.location.href = '/';
            }

        } else {
            console.error(`Error ${response.status}:`, await response.text()); // Log status and body
        }
    } catch (error) {
        console.error('Fetch song error:', error); // Separate error
    }
}



// 5. Refresh Access Token
async function refreshAccessToken() {

    try {
        const response = await fetch('/.netlify/functions/refresh-token', {
            method: 'POST',
            credentials: 'include', // CRITICAL: Include cookies
        });

        if (!response.ok) {
            const errorData = await response.json();
            console.error("Refresh failed:", errorData); // Log details
            throw new Error(`HTTP Error ${response.status}`); // Throw for clarity
        }
        const data = await response.json();
        accessToken = data.access_token;
    } catch (error) {
        console.error("Error in refreshAccessToken:", error)
        throw error; // Rethrow to be caught and handled by fetchCurrentSong
    }
}

// Helper function to set refresh token
function setRefreshTokenCookie(refreshToken) {
    document.cookie = `refresh_token=${refreshToken}; path=/; max-age=2592000; Secure; SameSite=Strict; HttpOnly`;
}

if (window.location.search.includes('code=')) {
    handleCallback();
}