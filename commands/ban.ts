import { EmbedBuilder } from "@fluxerjs/core";
import type { CommandSchema } from "../utils/CommandSchema";
import { Permissions } from "../utils/CommandSchema";
import { parseMention } from "../utils/moderation";

const command: CommandSchema = {
  name: "ban",
  description: "Ban a member from the server.",
  params: "<@user|id> [reason...]",
  requireElevated: [Permissions.BanMembers],

  async run(params, message) {
    const userId = parseMention(params[0] ?? "");
    if (!userId) {
      await message.reply({
        embeds: [
          new EmbedBuilder()
            .setColor(0x2D8A4E)
            .setTitle("Usage")
            .setDescription("`c!ban <@user|id> [reason...]`"),
        ],
      });
      return;
    }

    const reason = params.slice(1).join(" ") || "No reason provided";
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

    if (member.user.bot) {
      await message.reply({
        embeds: [new EmbedBuilder().setColor(0x2D8A4E).setDescription("Can't ban a bot")],
      });
      return;
    }

    if (userId === message.author.id) {
      await message.reply({
        embeds: [new EmbedBuilder().setColor(0x2D8A4E).setDescription("Can't ban yourself")],
      });
      return;
    }

    await guild.ban(userId, { reason });

    await message.reply({
      embeds: [
        new EmbedBuilder()
          .setColor(0x2D8A4E)
          .setTitle(`${member.displayName} banned`)
          .setDescription(reason)
          .addFields({ name: "by", value: message.author.username, inline: true }),
      ],
    });
  },
};

export default command;