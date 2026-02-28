import { EmbedBuilder } from "@fluxerjs/core";
import type { CommandSchema } from "../utils/CommandSchema";
import { Permissions } from "../utils/CommandSchema";
import { parseMention } from "../utils/moderation";
import { getActiveWarns } from "../database";

const command: CommandSchema = {
  name: "warnings",
  description: "List active warnings for a member.",
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
            .setDescription("`c!warnings <@user|id>`"),
        ],
      });
      return;
    }

    const guild = message.guild!;
    const warns = await getActiveWarns(guild.id, userId);

    if (warns.length === 0) {
      await message.reply({
        embeds: [
          new EmbedBuilder()
            .setColor(0x2D8A4E)
            .setTitle("No active warnings")
            .setDescription(`<@${userId}> has no active warnings.`),
        ],
      });
      return;
    }

    const embed = new EmbedBuilder()
      .setColor(0x2D8A4E)
      .setTitle(`Active warnings for <@${userId}>`)
      .setDescription(`${warns.length} active warning${warns.length === 1 ? "" : "s"}`);

    for (const warn of warns) {
      embed.addFields({
        name: `ID: ${warn.id}`,
        value: `**reason:** ${warn.reason}\n**expires:** <t:${Math.floor(new Date(warn.expiresAt).getTime() / 1000)}:R>\n**by:** <@${warn.moderatorId}>`,
        inline: false,
      });
    }

    await message.reply({ embeds: [embed] });
  },
};

export default command;