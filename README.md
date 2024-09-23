# Discord Community Dashboard

## Requirements

- **Node.js Version**: You must use Node.js version 18 or higher. To install and switch to Node.js v18, use the following commands:

```bash
nvm install
nvm use 18
```


# Getting Started

## With Docker

To start the application using Docker, run:

```bash
./start.sh
```

To stop the Docker, please run:

```bash
./stop.sh
```


## Without Docker

To start the application without Docker, open a terminal and run:

```bash
cd discord_community_front && ./start_no_docker.sh
```

In another terminal, start the backend server:

```bash
cd discord_community_server && node server.js
```


# Environment Variables

You need to create a .env file in the discord_community_server directory to configure your application. The following variables must be included in your .env file:

```env
MONGODB_URI=
DISCORD_CLIENT_ID=
DISCORD_CLIENT_SECRET=
DISCORD_BOT_TOKEN=
DEFAULT_ID=
ADMIN_DEFAULT_ID=
GUILD_ID=
DISCORD_EVERYONE_ROLE_ID=
COOKIE_SECRET=
DISCORD_REDIRECT_URI=http://localhost:8081/discord-oauth-callback
```


Make sure to fill in the values appropriately. Do not share sensitive information publicly.


# Discord setup

Besides oauth which will be explained later. Here's how you can get a few .env data.


COOKIE_SECRET:

```bash
$ node
crypto.randomUUID()
```

DEFAULT_ID & ADMIN_DEFAULT_ID: Your discord ID
GUILD_ID: Your server ID
DISCORD_EVERYONE_ROLE_ID: The ID for the @everyone role (same as your Guild ID)


# Discord Oauth setup

## Overview

To integrate Discord OAuth into your application, follow these steps to create an application in the Discord Developer Portal and obtain your credentials.

## Step 1: Create a Discord Application

1. **Go to the Discord Developer Portal**: Visit [Discord Developer Portal](https://discord.com/developers/applications).
2. **Log In**: Sign in with your Discord account.
3. **Create a New Application**:
   - Click on the "New Application" button.
   - Enter a name for your application and click "Create".

## Step 2: Set Up OAuth2

1. **Navigate to the OAuth2 Tab**:
   - Select your application from the list.
   - Click on the "OAuth2" tab in the left sidebar.
   
2. **Configure OAuth2 Settings**:
   - **Redirects**: Under "Redirects," add your redirect URI. This should be your backend endpoint that handles the OAuth callback (e.g., `http://localhost:8081/discord-oauth-callback`).
   - **Scopes**: Select the scopes your application requires. For basic user authentication, select:
     - `identify`
     - `join`
   - **Bot**: If your application requires bot functionality, you can also generate a bot token under the "Bot" tab.

3. **Generate the OAuth2 URL**:
   - Scroll down to "OAuth2 URL Generator."
   - Select the scopes you configured earlier.
   - Copy the generated URL.

## Step 3: Set Up Your `.env` File

Add the following lines to your `.env` file in the `discord_community_server` directory, filling in the placeholders with your application's values:

```env
DISCORD_CLIENT_ID=your_client_id
DISCORD_CLIENT_SECRET=your_client_secret
DISCORD_REDIRECT_URI=http://localhost:8081/discord-oauth-callback
```

# MongoDB Database Setup

To set up a MongoDB database, follow these steps:

- Create an Account on MongoDB Atlas: Go to MongoDB Atlas and sign up for an account.
- Create a New Cluster: After logging in, click on "Build a Cluster" and follow the prompts to create a new cluster.
- Connect to Your Cluster: Once your cluster is created, click on "Connect" and follow the instructions to add your IP address and create a database user.
- Get the Connection String: After setting up your user, you will be provided with a connection string. Replace the placeholder username and password in the string with your MongoDB user credentials.

# Features

Welcome to the Discord Community Dashboard! This application provides a comprehensive suite of features to manage and enhance your Discord community. Key features include:

- Moderation Panel: Tools for managing and moderating your server.
- Integrated Social Media: Connect and manage social media accounts.
- Staff Recruitment Page: A dedicated page for recruiting and managing staff.
- Bot Management: Manage and configure your Discord bots.
- Command Extensions: Add and customize commands as needed.
- Community Rules: Manage and display community guidelines.
- Community Staff List: A list of community staff members.
- Discord Server Advertising: Promote your server.
- Customization: Customize the dashboard to fit your community’s needs.
- Discord Role Shop: A system for managing roles and permissions.
- Event & Tournament Setup: Organize and manage community events and tournaments.
- Announcements: Make important announcements to your community.
- Logs: Keep track of activities and changes.
- Channel Groups: Organize channels into groups for better management.
- Developer Plugin: Extend functionality with developer plugins.
- Docker: Easy way to start the platform anywhere!

For more details on each feature, please refer to the documentation provided.

# Incoming Features
- CI/CD
- Automated bot tests
- Self-service management
- NPM developer package template and publishing guide
