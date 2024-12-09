// refresh-token.js
const { URLSearchParams } = require('url');
const fetch = require('node-fetch');

const clientId = process.env.SPOTIFY_CLIENT_ID;
const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;

exports.handler = async (event, context) => {
    try {
        // Extract refresh token from cookie. More robust parsing:
        let refreshToken = null;
        if (event.headers.cookie) {
            const cookies = event.headers.cookie.split(';');
            for (const cookie of cookies) {
                const [name, value] = cookie.trim().split('=');
                if (name === 'refresh_token') {
                    refreshToken = value;
                    break;
                }
            }
        }

        if (!refreshToken) {
            return {
                statusCode: 400,
                body: JSON.stringify({ error: 'No refresh token provided' })
            };
        }

        const authOptions = {
            method: 'POST',
            url: 'https://accounts.spotify.com/api/token',
            headers: {
                'Authorization': 'Basic ' + (Buffer.from(clientId + ':' + clientSecret).toString('base64')),
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: new URLSearchParams({
                grant_type: 'refresh_token',
                refresh_token: refreshToken
            })
        };

        const response = await fetch(authOptions.url, authOptions);
        const data = await response.json();

        if (!response.ok) {
            console.error("Refresh token request failed:", data);  // Log the detailed error response from Spotify
            return {
                statusCode: response.status,
                body: JSON.stringify({ error: 'Failed to refresh token', details: data }), // Include error details for debugging
            };
        }

         // Set-Cookie if a new refresh token is provided (optional - depends on Spotify's response):
        let headers = {};
        if (data.refresh_token) { // Check if there is a new refresh token
             const cookieString = `refresh_token=${data.refresh_token}; Path=/; Max-Age=2592000; Secure; SameSite=Strict; HttpOnly`;
             headers = { 'Set-Cookie': cookieString };
        }



        return {
            statusCode: 200,
            headers: headers,
            body: JSON.stringify({ access_token: data.access_token })
        };

    } catch (error) {
        console.error("Error in refresh-token function:", error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Server error during token refresh' })
        };
    }
};