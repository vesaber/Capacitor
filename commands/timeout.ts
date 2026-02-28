import { EmbedBuilder } from "@fluxerjs/core";
import type { CommandSchema } from "../utils/CommandSchema";
import { Permissions } from "../utils/CommandSchema";
import { parseMention, parseDuration, formatDuration } from "../utils/moderation";

const command: CommandSchema = {
  name: "timeout",
  description: "Temporarily time out a member.",
  params: "<@user|id> <duration> [reason...]",
  additionalInfo: "Duration examples: `10m`, `1h`, `2h30m`, `1d`",
  requireElevated: [Permissions.ModerateMembers],

  async run(params, message) {
    const userId = parseMention(params[0] ?? "");
    if (!userId) {
      await message.reply({
        embeds: [
          new EmbedBuilder()
            .setColor(0x2D8A4E)
            .setTitle("Usage")
            .setDescription("`c!timeout <@user|id> <duration> [reason...]`"),
        ],
      });
      return;
    }

    const expiresAt = parseDuration(params[1] ?? "");
    if (!expiresAt) {
      await message.reply({
        embeds: [
          new EmbedBuilder()
            .setColor(0x2D8A4E)
            .setDescription("invalid duration — try `10m`, `1h`, `2h30m`, `1d`"),
        ],
      });
      return;
    }

    const reason = params.slice(2).join(" ") || "No reason provided";
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
        embeds: [new EmbedBuilder().setColor(0x2D8A4E).setDescription("Can't timeout a bot")],
      });
      return;
    }

    if (userId === message.author.id) {
      await message.reply({
        embeds: [new EmbedBuilder().setColor(0x2D8A4E).setDescription("Can't timeout yourself")],
      });
      return;
    }

    const durationMs = expiresAt.getTime() - Date.now();
    const durationStr = formatDuration(durationMs);

    let dmFailed = false;
    try {
      await member.user.send({
        embeds: [
          new EmbedBuilder()
            .setColor(0x2D8A4E)
            .setTitle(`You were timed out in ${guild.name}`)
            .setDescription(reason)
            .addFields(
              { name: "duration", value: durationStr, inline: true },
              { name: "by", value: message.author.username, inline: true },
            ),
        ],
      });
    } catch {
      dmFailed = true;
    }

    await member.edit({
      communication_disabled_until: expiresAt.toISOString(),
      timeout_reason: reason,
    });

    const embed = new EmbedBuilder()
      .setColor(0x2D8A4E)
      .setTitle(`${member.displayName} timed out`)
      .setDescription(reason)
      .addFields(
        { name: "duration", value: durationStr, inline: true },
        { name: "expires", value: `<t:${Math.floor(expiresAt.getTime() / 1000)}:R>`, inline: true },
        { name: "by", value: message.author.username, inline: true },
      );

    if (dmFailed) embed.setFooter({ text: "Couldn't DM user" });

    await message.reply({ embeds: [embed] });
  },
};

export default command;