const { URLSearchParams } = require('url');
const fetch = require('node-fetch');

const clientId = process.env.SPOTIFY_CLIENT_ID;
const clientSecret = process.env.SPOTIFY_CLIENT_SECRET; // Used only in this function

exports.handler = async (event, context) => {
    // Extract refresh token from cookie
    const refreshToken = event.headers.cookie?.split(';').find(c => c.trim().startsWith('refresh_token='))?.split('=')[1];

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

    try {
        const response = await fetch(authOptions.url, authOptions);
        const data = await response.json();

        if (response.ok) {
            // If a new refresh token is provided, update the cookie
            if (data.refresh_token) {
                const cookieString = `refresh_token=${data.refresh_token}; path=/; max-age=2592000; secure; samesite=strict`;
                return {
                    statusCode: 200,
                    headers: {
                        'Set-Cookie': cookieString
                    },
                    body: JSON.stringify({ access_token: data.access_token })
                };
            }

            return {
                statusCode: 200,
                body: JSON.stringify({ access_token: data.access_token })
            };
        } else {
            return {
                statusCode: response.status,
                body: JSON.stringify({ error: 'Failed to refresh token' })
            };
        }
    } catch (error) {
        return {
            statusCode: 500,
            body: JSON.stringify({ error: error.message })
        };
    }
};