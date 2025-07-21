// ---- Keep-Alive Web Server for Render ----
const express = require("express");
const app = express();
const PORT = process.env.PORT || 3000;

app.get("/", (req, res) => {
  res.send("🌐 Guess The Number Bot is Alive!");
});

app.listen(PORT, () => {
  console.log(`🌐 Keep-alive server running on port ${PORT}`);
});

require("dotenv").config();
const { Client, GatewayIntentBits, Partials, Events, SlashCommandBuilder, Collection } = require("discord.js");
const { REST, Routes } = require("discord.js");
const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent],
  partials: [Partials.Channel],
});

let gameData = {
  isActive: false,
  number: null,
  min: null,
  max: null,
};

// Slash commands setup
const commands = [
  new SlashCommandBuilder()
    .setName("start")
    .setDescription("🎲 Start a new game with random number")
    .addIntegerOption(option => option.setName("minimum").setDescription("Minimum number").setRequired(true))
    .addIntegerOption(option => option.setName("maximum").setDescription("Maximum number").setRequired(true)),

  new SlashCommandBuilder()
    .setName("manual")
    .setDescription("✍️ Start a game with your chosen number")
    .addIntegerOption(option => option.setName("minimum").setDescription("Minimum number").setRequired(true))
    .addIntegerOption(option => option.setName("maximum").setDescription("Maximum number").setRequired(true))
    .addIntegerOption(option => option.setName("number").setDescription("Number to guess").setRequired(true)),

  new SlashCommandBuilder()
    .setName("restart")
    .setDescription("🔁 Restart game with same limits"),
];

const rest = new REST({ version: "10" }).setToken(process.env.TOKEN);

client.once(Events.ClientReady, async () => {
  console.log(`✅ Logged in as ${client.user.tag}`);
  try {
    await rest.put(
      Routes.applicationCommands(client.user.id),
      { body: commands }
    );
    console.log("✅ Slash commands registered");
  } catch (err) {
    console.error(err);
  }
});

client.on(Events.InteractionCreate, async interaction => {
  if (!interaction.isChatInputCommand()) return;

  const cmd = interaction.commandName;

  if (cmd === "start") {
    const min = interaction.options.getInteger("minimum");
    const max = interaction.options.getInteger("maximum");

    const randomNum = Math.floor(Math.random() * (max - min + 1)) + min;
    gameData = { isActive: true, number: randomNum, min, max };

    await interaction.reply(`🎯 **Game Started!**\n━━━━━━━━━━━━━━━\nGuess the number between **${min}** and **${max}**!\nType your guess in the chat!\n━━━━━━━━━━━━━━━`);
  }

  if (cmd === "manual") {
    const min = interaction.options.getInteger("minimum");
    const max = interaction.options.getInteger("maximum");
    const chosen = interaction.options.getInteger("number");

    if (chosen < min || chosen > max) {
      return interaction.reply({ content: "❌ Chosen number must be between the minimum and maximum!", ephemeral: true });
    }

    gameData = { isActive: true, number: chosen, min, max };

    await interaction.reply(`📝 **Manual Game Started!**\n━━━━━━━━━━━━━━━\nGuess the number between **${min}** and **${max}**!\nType your guess in the chat!\n━━━━━━━━━━━━━━━`);
  }

  if (cmd === "restart") {
    if (!gameData.min || !gameData.max) {
      return interaction.reply("❌ No previous game limits found. Use `/start` first.");
    }

    const newNum = Math.floor(Math.random() * (gameData.max - gameData.min + 1)) + gameData.min;
    gameData.number = newNum;
    gameData.isActive = true;

    await interaction.reply(`🔁 **Game Restarted!**\n━━━━━━━━━━━━━━━\nGuess the number between **${gameData.min}** and **${gameData.max}**!\n━━━━━━━━━━━━━━━`);
  }
});

client.on("messageCreate", async msg => {
  if (msg.author.bot || !gameData.isActive) return;

  const guess = parseInt(msg.content);
  if (isNaN(guess)) return;

  if (guess === gameData.number) {
    gameData.isActive = false;
    msg.channel.send(`🎉 **${msg.author} WON!** The number was **${gameData.number}**!\n━━━━━━━━━━━━━━━`);
  }
});

client.login(process.env.TOKEN);
