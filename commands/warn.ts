import { EmbedBuilder } from "@fluxerjs/core";
import type { CommandSchema } from "../utils/CommandSchema";
import { Permissions } from "../utils/CommandSchema";
import { parseMention, parseDuration, formatDuration } from "../utils/moderation";
import { createWarn } from "../database";

const command: CommandSchema = {
  name: "warn",
  category: "Moderation",
  description: "Issue a timed warning to a member.",
  params: "<@user|id> <duration> [reason...]",
  additionalInfo: "Duration examples: `1d`, `7d`, `1h`. The warn expires after this period.",
  requireElevated: [Permissions.ModerateMembers],

  async run(params, message) {
    const userId = parseMention(params[0] ?? "");
    if (!userId) {
      await message.reply({
        embeds: [
          new EmbedBuilder()
            .setColor(0x2D8A4E)
            .setTitle("Usage")
            .setDescription("`c!warn <@user|id> <duration> [reason...]`"),
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
            .setDescription("invalid duration — try `1h`, `1d`, `7d`"),
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
            .setDescription("not in this server"),
        ],
      });
      return;
    }

    if (member.user.bot) {
      await message.reply({
        embeds: [new EmbedBuilder().setColor(0x2D8A4E).setDescription("can't warn a bot")],
      });
      return;
    }

    if (userId === message.author.id) {
      await message.reply({
        embeds: [new EmbedBuilder().setColor(0x2D8A4E).setDescription("can't warn yourself")],
      });
      return;
    }

    const durationStr = formatDuration(expiresAt.getTime() - Date.now());
    const warnId = await createWarn(guild.id, userId, message.author.id, reason, expiresAt);

    await message.reply({
      embeds: [
        new EmbedBuilder()
          .setColor(0x2D8A4E)
          .setTitle(`${member.displayName} warned`)
          .setDescription(reason)
          .addFields(
            { name: "Warn ID", value: warnId, inline: false },
            { name: "duration", value: durationStr, inline: true },
            { name: "expires", value: `<t:${Math.floor(expiresAt.getTime() / 1000)}:R>`, inline: true },
            { name: "by", value: message.author.username, inline: true },
          ),
      ],
    });
  },
};

export default command;