const { Client, Collection, Events, GatewayIntentBits, Partials, EmbedBuilder } = require('discord.js');
const fs = require('node:fs');
const path = require('node:path');
require('dotenv').config();

// Safe config loading
let config;
try {
  config = require('./config.json');
} catch (err) {
  console.warn('config.json not found — using defaults');
  config = {
    embedColor: '#ef4444',
    botName: 'RatzBot',
    gameName: 'RATZ',
    welcomeChannelName: 'welcome',
    rulesChannelName: 'rules',
    announcementChannelName: 'announcements',
    apiPort: process.env.API_PORT || 10000,
    apiSecret: process.env.API_SECRET || 'change-this'
  };
}

const { createApiServer } = require('./api/server');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildModeration,
  ],
  partials: [Partials.Channel, Partials.Message, Partials.GuildMember],
});

// Load commands
client.commands = new Collection();
const foldersPath = path.join(__dirname, 'commands');
const commandFolders = fs.readdirSync(foldersPath);

for (const folder of commandFolders) {
  const commandsPath = path.join(foldersPath, folder);
  if (!fs.statSync(commandsPath).isDirectory()) continue;
  const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
  for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    const command = require(filePath);
    if ('data' in command && 'execute' in command) {
      client.commands.set(command.data.name, command);
    } else {
      console.log(`[WARNING] The command at ${filePath} is missing "data" or "execute".`);
    }
  }
}

// Load events
const eventsPath = path.join(__dirname, 'events');
const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith('.js'));

for (const file of eventFiles) {
  const filePath = path.join(eventsPath, file);
  const event = require(filePath);
  if (event.once) {
    client.once(event.name, (...args) => event.execute(...args, client));
  } else {
    client.on(event.name, (...args) => event.execute(...args, client));
  }
}

// Start API after bot is ready
client.once(Events.ClientReady, () => {
  const api = createApiServer(client, config);
  client.api = api;
});

// Interaction handler
client.on(Events.InteractionCreate, async interaction => {
  if (!interaction.isChatInputCommand()) return;

  const command = client.commands.get(interaction.commandName);
  if (!command) return;

  try {
    await command.execute(interaction, client, config);
  } catch (error) {
    console.error(error);
    const errorEmbed = new EmbedBuilder()
      .setColor(0xFF0000)
      .setTitle('Error')
      .setDescription('There was an error while executing this command!')
      .setTimestamp();

    if (interaction.replied || interaction.deferred) {
      await interaction.followUp({ embeds: [errorEmbed], ephemeral: true });
    } else {
      await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
    }
  }
});

client.login(process.env.DISCORD_TOKEN);
