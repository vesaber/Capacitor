import { Message, EmbedBuilder } from "@fluxerjs/core";
import * as commands from "../commands";
import type { CommandSchema } from "./CommandSchema";
import { Permissions, PERM_BITS } from "./CommandSchema";

const PREFIX = "c!";

export async function CommandHandler(message: Message) {
  if (message.author.bot) return;
  if (!message.content.startsWith(PREFIX)) return;

  const args = message.content.slice(PREFIX.length).trim().split(/\s+/);
  const commandName = args.shift()?.toLowerCase();
  if (!commandName) return;

  const command = Object.values(commands).find(
    (cmd) => (cmd as CommandSchema).name === commandName
  ) as CommandSchema | undefined;

  if (!command) {
    await message.reply({
      embeds: [
        new EmbedBuilder()
          .setColor(0x2D8A4E)
          .setTitle("Unknown command")
          .setDescription(`No command named \`${commandName}\`. Try \`c!help\`.`),
      ],
    });
    return;
  }

  if (command.requireElevated !== false && command.requireElevated.length > 0) {
    const guild = message.guild;
    if (!guild) {
      await message.reply({
        embeds: [
          new EmbedBuilder()
            .setColor(0x2D8A4E)
            .setTitle("Server only")
            .setDescription("This command can only be used in a server."),
        ],
      });
      return;
    }
    const member = await guild.fetchMember(message.author.id);
    const perms = member.permissions.bitfield;
    const missing = command.requireElevated.filter((p) => {
      const bit = PERM_BITS[Permissions[p]];
      return bit !== undefined && (perms & bit) === 0n;
    });
    if (missing.length > 0) {
      await message.reply({
        embeds: [
          new EmbedBuilder()
            .setColor(0x2D8A4E)
            .setTitle("Permission denied")
            .setDescription(
              `You need: ${missing.map((p) => Permissions[p]).join(", ")}`
            ),
        ],
      });
      return;
    }
  }

  try {
    await command.run(args, message);
  } catch (err) {
    console.error(`[cmd:${commandName}]`, err);
    await message.reply({
      embeds: [
        new EmbedBuilder()
          .setColor(0xff0000)
          .setTitle(`Error in \`c!${commandName}\``)
          .setDescription(`\`\`\`\n${String(err)}\n\`\`\``),
      ],
    });
  }
}

export default CommandHandler;
