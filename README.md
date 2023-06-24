# ![icon](public/images/icon.svg) Vocaloid Rankings
A website that uses data from YouTube, Niconico, Bilibili, and VocaDB to rank the most viewed Vocaloid and other vocal-synth songs.

View a live version of the website at [https://vocaloid-rankings.fly.dev](https://vocaloid-rankings.fly.dev).

## Requirements
* [Node.js v20.0.0 or higher](https://nodejs.org/en/download/current)

## Installation
1. Clone the repository
```
git clone https://github.com/Duosion/vocaloid-rankings.git
```
2. Rename `.env.template` to `.env` and fill in the following fields:
* **YoutubeAPIKey**
  - A google cloud API key with access to the [YouTube data API](https://developers.google.com/youtube/v3/getting-started).
* **CookieSignatureSecret**
  - A decently-sized randomly generated string of characters and numbers.
* **PORT**
  - This is the port that the server will listen from.
* **adminUsername**
  - The username of the admin account.
  - It is recommended to delete this from the `.env` file after starting the server for the first time.
* **adminPassword**
  - The password of the admin account.
  - It is recommended to delete this from the `.env` file after starting the server for the first time.
3. Install dependencies
```
npm install
```
4. Run the server
```
${env:dotenv}='True'; node server.js
```

## FAQ/Community
Join the Discord server [here](https://discord.com/channels/1122058344241319957/1122059077846052935).