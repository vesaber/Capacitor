import { EmbedBuilder } from "@fluxerjs/core";
import type { CommandSchema } from "../utils/CommandSchema";
import { Permissions } from "../utils/CommandSchema";
import { parseMention } from "../utils/moderation";

const command: CommandSchema = {
  name: "kick",
  description: "Kick a member from the server.",
  params: "<@user|id> [reason...]",
  requireElevated: [Permissions.KickMembers],

  async run(params, message) {
    const userId = parseMention(params[0] ?? "");
    if (!userId) {
      await message.reply({
        embeds: [
          new EmbedBuilder()
            .setColor(0x2D8A4E)
            .setTitle("Usage")
            .setDescription("`c!kick <@user|id> [reason...]`"),
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
        embeds: [new EmbedBuilder().setColor(0x2D8A4E).setDescription("Can't kick a bot")],
      });
      return;
    }

    if (userId === message.author.id) {
      await message.reply({
        embeds: [new EmbedBuilder().setColor(0x2D8A4E).setDescription("Can't kick yourself")],
      });
      return;
    }

    let dmFailed = false;
    try {
      await member.user.send({
        embeds: [
          new EmbedBuilder()
            .setColor(0x2D8A4E)
            .setTitle(`You were kicked from ${guild.name}`)
            .setDescription(reason)
            .addFields({ name: "by", value: message.author.username, inline: true }),
        ],
      });
    } catch {
      dmFailed = true;
    }

    await guild.kick(userId);

    const embed = new EmbedBuilder()
      .setColor(0x2D8A4E)
      .setTitle(`${member.displayName} kicked`)
      .setDescription(reason)
      .addFields({ name: "by", value: message.author.username, inline: true });

    if (dmFailed) embed.setFooter({ text: "Couldn't DM user" });

    await message.reply({ embeds: [embed] });
  },
};

export default command;