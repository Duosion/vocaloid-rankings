# ![icon](src/app/icon.ico) Vocaloid Rankings
A website that uses data from YouTube, Niconico, bilibili, and [VocaDB](https://github.com/VocaDB/vocadb) to rank the most viewed vocal synthesizer songs.

View a live version of the website at [https://vocaloid-rankings.fly.dev](https://vocaloid-rankings.fly.dev).

## Requirements
* [Node.js v20.0.0 or higher](https://nodejs.org/en/download/current)

## Installation
1. Clone the repository
```bash
git clone https://github.com/Duosion/vocaloid-rankings.git
```

2. Rename `.env.local.template` to `.env.local` and fill in the following fields:
* **YOUTUBE_API_KEY**
  - A google cloud API key with access to the [YouTube data API](https://developers.google.com/youtube/v3/getting-started).

3. Install dependencies
```bash
npm install
```

4. Run the server
```bash
npm run dev
```

## FAQ/Community
Join the Discord server [here](https://discord.gg/By7z2kKVjx).

## Special Thanks
Special thanks to [VocaDB](https://github.com/VocaDB/vocadb) for providing all non-view song data.