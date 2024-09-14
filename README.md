# 💻 Discord Bot for LoveStresser

A Discord bot designed for managing users and banning/unbanning them across the LoveStresser services. This bot integrates features such as user management, logging, and a permission system.

## 📋 Table of Contents
- [Features](#-features)
- [Prerequisites](#-prerequisites)
- [Installation](#-installation)
- [Configuration](#-configuration)
- [Usage](#-usage)
- [License](#-license)

## 🚀 Features

- **User Ban Management**: 
  - Ban a user from the site using the `/banp` command.
  - Unban a user from the site using the `/unbanp` command.
  - Ban a user from all LoveStresser services using the `/banall` command.
  - Unban a user from all services using the `/unbanall` command.
  
- **User Info Retrieval**: 
  - View user information from the database with the `/view` command, including Discord ID, username, email, rank, and more.

- **Logging System**: 
  - The bot logs all actions (bans/unbans) and sends them to a specified webhook for tracking.

- **Role-based Permission System**: 
  - Only users with the role `Owner` can execute ban/unban commands.

- **Automatic Notifications**: 
  - Sends an embedded message to the user when they are banned/unbanned, providing details of the action and reasons.

- **Interactive Buttons**: 
  - Use the buttons generated in the `/view` command to quickly ban/unban users directly from the panel.

## 📦 Prerequisites

Before you begin, ensure you have met the following requirements:
- **Node.js** and **npm** installed on your system.
- **Axios**, **mysql2**, and **dotenv** installed as dependencies.
- A Discord bot token and **.env** file for configuration.
- Access to the LoveStresser services with proper API credentials.

## 🛠️ Installation

1. **Clone the repository**:
    ```bash
    git clone https://github.com/yourusername/lovestresser-bot.git
    cd lovestresser-bot
    ```

2. **Install dependencies**:
    ```bash
    npm install
    ```

3. **Create a `.env` file**:
    ```bash
    touch .env
    ```

4. **Configure the `.env` file** with your bot token and database credentials:
    ```env
    DISCORD_TOKEN=your-discord-bot-token
    MYSQL_HOST=localhost
    MYSQL_USER=root
    MYSQL_PASSWORD=yourpassword
    MYSQL_DATABASE=lovestresser_db
    WEBHOOK_URL=your-webhook-url
    ```

## ⚙️ Configuration

1. **Bot Setup**: 
    - Go to the [Discord Developer Portal](https://discord.com/developers/applications) to create a new bot, and copy the bot token into the `.env` file.

2. **Database Setup**:
    - Ensure you have a MySQL database configured with the necessary tables for users and bans.

3. **Folder Structure**:
    - Ensure your project folder includes a `.env` directory and other configuration files as needed for LoveStresser services.
  
    ```
    ├── src
    │   ├── commands
    │   └── utils
    ├── .env
    └── README.md
    ```

## 🚀 Usage

1. **Start the bot**:
    ```bash
    npm start
    ```

2. **Available Commands**:
    - `/banp [user]`: Ban a user from the site.
    - `/unbanp [user]`: Unban a user from the site.
    - `/banall [user]`: Ban a user from all services.
    - `/unbanall [user]`: Unban a user from all services.
    - `/view [user]`: View user information from the database.

## 📄 License

This project is licensed under the MIT License. See the `LICENSE` file for more details.
