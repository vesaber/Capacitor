import { EmbedBuilder } from "@fluxerjs/core";
import type { CommandSchema } from "../utils/CommandSchema";
import { Permissions } from "../utils/CommandSchema";
import { parseMention } from "../utils/moderation";

const command: CommandSchema = {
  name: "untimeout",
  description: "Remove a timeout from a member.",
  params: "<@user|id>",
  requireElevated: [Permissions.ModerateMembers],

  async run(params, message) {
    const userId = parseMention(params[0] ?? "");
    if (!userId) {
      await message.reply({
        embeds: [
          new EmbedBuilder()
            .setColor(0x2D8A4E)
            .setTitle("Usage")
            .setDescription("`c!untimeout <@user|id>`"),
        ],
      });
      return;
    }

    const guild = message.guild!;

    let member;
    try {
      member = await guild.fetchMember(userId);
    } catch {
      await message.reply({
        embeds: [
          new EmbedBuilder()
            .setColor(0x2D8A4E)
            .setDescription("Not in this server"),
        ],
      });
      return;
    }

    await member.edit({ communication_disabled_until: null });

    await message.reply({
      embeds: [
        new EmbedBuilder()
          .setColor(0x2D8A4E)
          .setTitle(`${member.displayName} untimed out`)
          .addFields({ name: "by", value: message.author.username, inline: true }),
      ],
    });
  },
};

export default command;