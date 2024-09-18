const fetch = require('node-fetch');
const config = require('./config.js');

/**
 * Register the metadata to be stored by Discord. This should be a one time action.
 * Note: uses a Bot token for authentication, not a user token.
 */
const url = `https://discord.com/api/v10/applications/${config.DISCORD_CLIENT_ID}/role-connections/metadata`;

const body = [
  {
    key: 'cookieseaten',
    name: 'Cookies Eaten',
    description: 'Cookies Eaten Greater Than',
    type: 2,
  },
  {
    key: 'allergictonuts',
    name: 'Allergic To Nuts',
    description: 'Is Allergic To Nuts',
    type: 7,
  },
  {
    key: 'bakingsince',
    name: 'Baking Since',
    description: 'Days since baking their first cookie',
    type: 6,
  },
];

async function registerMetadata() {
  try {
    const response = await fetch(url, {
      method: 'PUT',
      body: JSON.stringify(body),
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bot ${config.DISCORD_TOKEN}`,
      },
    });

    if (response.ok) {
      const data = await response.json();
    } else {
      const data = await response.text();
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

registerMetadata();
