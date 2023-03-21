# SNKRS-Monitor

SNKRS-Monitor is a Discord bot that monitors Nike's sneaker releases and restocks, providing real-time updates and alerts directly to your Discord server.

<img src="https://user-images.githubusercontent.com/37600872/180875336-56e31a86-00e5-407d-85aa-2f2209bb8d25.png" width="288">

<a href="https://github.com/aaronmansfield5/SNKRS-Monitor/issues/">![GitHub issues](https://img.shields.io/github/issues/aaronmansfield5/SNKRS-Monitor)</a>
<a href="https://github.com/aaronmansfield5/SNKRS-Monitor/stargazers">![GitHub stars](https://img.shields.io/github/stars/aaronmansfield5/SNKRS-Monitor)</a>
<a href="https://github.com/aaronmansfield5/SNKRS-Monitor/forks">![GitHub forks](https://img.shields.io/github/forks/aaronmansfield5/SNKRS-Monitor)</a>

## Table of Contents

- [Features](#features)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Usage](#usage)
- [Contributing](#contributing)

## Features

- Monitors Nike's sneaker releases and restocks in real-time
- Sends alerts with detailed information about the product
- Easy to set up and customize for your region
- Compatible with Discord

## Prerequisites

- ![Node.js](https://img.shields.io/badge/Node.js-v14.0%2B-brightgreen)
- ![npm](https://img.shields.io/badge/npm-v6.0%2B-blue)
- ![Discord Bot Token](https://img.shields.io/badge/Discord%20Bot%20Token-Required-red)

## Installation

1. Clone the repository:

```bash
git clone https://github.com/aaronmansfield5/SNKRS-Monitor.git
```

2. Install the required dependencies:

```bash
cd SNKRS-Monitor
npm install discord.js dotenv request
```

3. Create a `.env` file in the project root and add your Discord bot token:

```makefile
BOT_TOKEN=<your_bot_token>
```

4. Update the `app.js` and `modules/getNike.js` files to include your server and channel IDs.

5. Start the bot:

```bash
node app.js
```

## Usage

The bot will monitor Nike's sneaker releases and restocks and send alerts to the specified Discord channel. Alerts will include detailed information about the product, such as name, price, style code, release date, region, sizes, and more.

## Contributing

Contributions are welcome! If you have any ideas or suggestions, please feel free to open an issue or submit a pull request.

---

<b>🚀 Developed by [aaronmansfield5](https://github.com/aaronmansfield5)</b>
