import { EmbedBuilder } from "@fluxerjs/core";
import type { CommandSchema } from "../utils/CommandSchema";
import { claimDaily, getBalance, UserBalance } from "../database";
import { formatDuration } from "../utils/moderation";

const command: CommandSchema = {
  name: "daily",
  description: "Claim your daily coins (150–250, 24h cooldown).",
  params: "",
  requireElevated: false,

  async run(_params, message) {
    if (!message.guildId) {
      await message.reply({
        embeds: [new EmbedBuilder().setColor(0x2D8A4E).setDescription("server only")],
      });
      return;
    }

    const result = await claimDaily(message.guildId, message.author.id);

    if (!result) {
      const row = await UserBalance.findOne({
        where: { guild_id: message.guildId, user_id: message.author.id },
      });
      const nextDaily = new Date(row!.last_daily!.getTime() + 24 * 60 * 60 * 1000);
      const remaining = Math.max(0, nextDaily.getTime() - Date.now());

      await message.reply({
        embeds: [
          new EmbedBuilder()
            .setColor(0x2D8A4E)
            .setDescription(`already claimed — next daily in **${formatDuration(remaining)}**`),
        ],
      });
      return;
    }

    const newBalance = await getBalance(message.guildId, message.author.id);

    await message.reply({
      embeds: [
        new EmbedBuilder()
          .setColor(0x2D8A4E)
          .setTitle(`+${result.coins} coins`)
          .addFields({ name: "balance", value: String(newBalance), inline: true }),
      ],
    });
  },
};

export default command;
