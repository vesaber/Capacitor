import { Client, Events, TextChannel } from "@fluxerjs/core";
import CommandHandler from "./utils/CommandHandler";
import { initDatabase, addXP, isOptedOut, getLevelChannel, getLevelRole } from "./database";
import { canEarnXP } from "./utils/leveling";
import { debugError } from "./utils/debug";

const client = new Client({
  intents: 0,
  rest: {
    // api: "https://fluxer.exeli.us/api" max come join us here (ur gonna be lonely) because fluxer fluxes up
  },
});

client.on(Events.Error, (err) => console.error("[Error]", err));
client.on(Events.Ready, () => {
  console.log(`Ready! Logged in as ${client.user?.username} (${client.user?.id})`);
  console.log(`Guilds: ${client.guilds.size}`);
  console.log(`REST API: ${(client.rest as any).options?.api ?? "default"}`);
});
client.on(Events.MessageCreate, async (message) => {
  CommandHandler(message);

  // XP tracking
  if (message.author.bot) return;
  if (!message.guildId) return;
  if (message.content.length < 3) return;
  if (!canEarnXP(message.author.id)) return;
  if (await isOptedOut(message.guildId, message.author.id)) return;

  try {
    const amount = Math.floor(Math.random() * 21) + 10; // 10–30
    const { before, after } = await addXP(message.guildId, message.author.id, amount);
    if (after > before) {
      const levelUpMsg = `GG <@${message.author.id}>, you leveled up to **Level ${after}**!`;

      const levelChannelId = await getLevelChannel(message.guildId);
      if (levelChannelId) {
        try {
          const channel = await client.channels.fetch(levelChannelId);
          if (channel instanceof TextChannel) {
            await channel.send({ content: levelUpMsg });
          } else {
            await message.send(levelUpMsg);
          }
        } catch (err) {
          debugError("XP level channel send", err);
          await message.send(levelUpMsg);
        }
      } else {
        await message.send(levelUpMsg);
      }

      const roleId = await getLevelRole(message.guildId, after);
      if (roleId) {
        try {
          const guild = await message.resolveGuild();
          if (guild) {
            const member = await guild.fetchMember(message.author.id);
            await member.roles.add(roleId);
          }
        } catch (err) {
          debugError("XP role assignment", err);
        }
      }
    }
  } catch (err) {
    debugError("XP tracking", err);
  }
});

await initDatabase();
console.log("Database ready. Connecting...");
await client.login(process.env.FLUXER_BOT_TOKEN!);
console.log("Login call returned.");

// Shoutout max for the headstart
// TODO: Roadmap