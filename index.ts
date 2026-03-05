import { Client, Events } from "@fluxerjs/core";
import CommandHandler from "./utils/CommandHandler";
import { initDatabase, addXP } from "./database";
import { canEarnXP } from "./utils/leveling";

const client = new Client({
  intents: 0,
  rest: {
    // api: "https://fluxer.exeli.us/api" max come join us here (ur gonna be lonely) because fluxer fluxes up
  },
});

client.on(Events.Ready, () => console.log("Ready!"));
client.on(Events.MessageCreate, async (message) => {
  CommandHandler(message);

  // XP tracking
  if (message.author.bot) return;
  if (!message.guildId) return;
  if (message.content.length < 3) return;
  if (!canEarnXP(message.author.id)) return;

  try {
    const amount = Math.floor(Math.random() * 21) + 10; // 10–30
    const { before, after } = await addXP(message.guildId, message.author.id, amount);
    if (after > before) {
      await message.send(`GG <@${message.author.id}>, you leveled up to **Level ${after}**!`);
    }
  } catch (err) {
    console.error(`[XP] Failed for ${message.author.id} in ${message.guildId}:`, err);
  }
});

await initDatabase();
await client.login(process.env.FLUXER_BOT_TOKEN!);

// Shoutout max for the headstart

// TODO: Better "Ready!" output
// TODO: Roadmap
// TODO: Make a CONTRIBUTING.md
// TODO: idk