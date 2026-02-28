import { EmbedBuilder } from "@fluxerjs/core";
import type { CommandSchema } from "../utils/CommandSchema";
import { Permissions } from "../utils/CommandSchema";
import { deleteWarn } from "../database";

const command: CommandSchema = {
  name: "unwarn",
  description: "Remove an active warning by ID.",
  params: "<warn-id>",
  requireElevated: [Permissions.ModerateMembers],

  async run(params, message) {
    const warnId = params[0] ?? "";
    if (!warnId) {
      await message.reply({
        embeds: [
          new EmbedBuilder()
            .setColor(0x2D8A4E)
            .setTitle("Usage")
            .setDescription("`c!unwarn <warn-id>` — get IDs from `c!warnings`"),
        ],
      });
      return;
    }

    const guild = message.guild!;
    const removed = await deleteWarn(guild.id, warnId);

    if (!removed) {
      await message.reply({
        embeds: [
          new EmbedBuilder()
            .setColor(0x2D8A4E)
            .setDescription("no active warning with that ID found"),
        ],
      });
      return;
    }

    await message.reply({
      embeds: [
        new EmbedBuilder()
          .setColor(0x2D8A4E)
          .setTitle("Warn removed")
          .setDescription(`\`${warnId}\``)
          .addFields({ name: "by", value: message.author.username, inline: true }),
      ],
    });
  },
};

export default command;