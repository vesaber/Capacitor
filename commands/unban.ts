import { EmbedBuilder } from "@fluxerjs/core";
import type { CommandSchema } from "../utils/CommandSchema";
import { Permissions } from "../utils/CommandSchema";
import { parseMention } from "../utils/moderation";

const command: CommandSchema = {
  name: "unban",
  category: "Moderation",
  description: "Unban a user from the server.",
  params: "<user-id>",
  requireElevated: [Permissions.BanMembers],

  async run(params, message) {
    const userId = parseMention(params[0] ?? "");
    if (!userId) {
      await message.reply({
        embeds: [
          new EmbedBuilder()
            .setColor(0x2D8A4E)
            .setTitle("Usage")
            .setDescription("`c!unban <user-id>`"),
        ],
      });
      return;
    }

    const guild = message.guild!;

    try {
      await guild.unban(userId);
    } catch {
      await message.reply({
        embeds: [
          new EmbedBuilder()
            .setColor(0x2D8A4E)
            .setDescription("That user isn't banned or doesn't exist"),
        ],
      });
      return;
    }

    await message.reply({
      embeds: [
        new EmbedBuilder()
          .setColor(0x2D8A4E)
          .setTitle(`<@${userId}> unbanned`)
          .addFields({ name: "by", value: message.author.username, inline: true }),
      ],
    });
  },
};

export default command;