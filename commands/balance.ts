import { EmbedBuilder } from "@fluxerjs/core";
import type { CommandSchema } from "../utils/CommandSchema";
import { getBalance, getEconomyRank } from "../database";
import { parseMention } from "../utils/moderation";
import { generateBalanceCard } from "../utils/leveling";

const command: CommandSchema = {
  name: "balance",
  description: "Show a balance card (or another user's).",
  params: "[@user|id]",
  requireElevated: false,

  async run(params, message) {
    if (!message.guildId) {
      await message.reply({
        embeds: [new EmbedBuilder().setColor(0x2D8A4E).setDescription("server only")],
      });
      return;
    }

    const targetId = params[0] ? parseMention(params[0]) : message.author.id;
    if (params[0] && !targetId) {
      await message.reply({
        embeds: [new EmbedBuilder().setColor(0x2D8A4E).setDescription("invalid user. Usage: `c!balance [@user|id]`")],
      });
      return;
    }

    let targetUser;
    let bannerHash: string | null = null;
    try {
      const { user, globalProfile, serverProfile } = await message.client.users.fetchWithProfile(
        targetId!,
        { guildId: message.guildId }
      );
      targetUser = user;
      bannerHash =
        serverProfile?.user_profile?.banner ??
        globalProfile?.user_profile?.banner ??
        null;
    } catch {
      await message.reply({
        embeds: [new EmbedBuilder().setColor(0x2D8A4E).setDescription("user not found")],
      });
      return;
    }

    const [balance, rank] = await Promise.all([
      getBalance(message.guildId, targetUser.id),
      getEconomyRank(message.guildId, targetUser.id),
    ]);

    let result: { buffer: Buffer; animated: boolean };
    try {
      result = await generateBalanceCard({ user: targetUser, bannerHash, balance, rank });
    } catch (err) {
      console.error("[balance] card generation failed:", err);
      await message.reply({
        embeds: [
          new EmbedBuilder()
            .setColor(0x2D8A4E)
            .setTitle(`${targetUser.globalName ?? targetUser.username}`)
            .addFields(
              { name: "balance", value: String(balance), inline: true },
              { name: "rank", value: rank === -1 ? "unranked" : `#${rank}`, inline: true }
            )
            .setFooter({ text: String(err) }),
        ],
      });
      return;
    }

    await message.reply({
      files: [{ name: result.animated ? "balance.gif" : "balance.png", data: result.buffer }],
    });
  },
};

export default command;
