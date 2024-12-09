// exchange-token.js
const { URLSearchParams } = require('url');
const fetch = require('node-fetch');

const clientId = process.env.SPOTIFY_CLIENT_ID;
const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;
const redirectUri = process.env.REDIRECT_URI;

exports.handler = async (event, context) => {
    try {
        const { code } = JSON.parse(event.body);  // Make sure event.body exists

        const authOptions = {
            method: 'POST',
            url: 'https://accounts.spotify.com/api/token',
            headers: {
                'Authorization': 'Basic ' + (Buffer.from(clientId + ':' + clientSecret).toString('base64')),
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: new URLSearchParams({
                code: code,
                redirect_uri: redirectUri,
                grant_type: 'authorization_code'
            })
        };

        const response = await fetch(authOptions.url, authOptions);
        const data = await response.json();

        if (!response.ok) {
            console.error("Error exchanging token:", data); // Log the error details from Spotify
            return {
                statusCode: response.status,
                body: JSON.stringify({ error: 'Failed to exchange token', details: data }) // Include details in response
            };
        }

        // Set the refresh token as an HttpOnly cookie *in the response*
        const cookieString = `refresh_token=${data.refresh_token}; Path=/; Max-Age=2592000; Secure; SameSite=Strict; HttpOnly`; // 30 days

        return {
            statusCode: 200,
            headers: {  // Include 'Set-Cookie' in the response headers
                'Set-Cookie': cookieString
            },
            body: JSON.stringify({ access_token: data.access_token })
        };
    } catch (error) {
        console.error("Error in exchange-token function:", error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Server error during token exchange' })
        };
    }
};