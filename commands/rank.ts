import { EmbedBuilder } from "@fluxerjs/core";
import type { CommandSchema } from "../utils/CommandSchema";
import { parseMention } from "../utils/moderation";
import { getUserLevel, getRank, isOptedOut } from "../database";
import { generateRankCard } from "../utils/leveling";

const command: CommandSchema = {
  name: "rank",
  category: "Leveling",
  description: "Show your rank card (or another user's).",
  params: "[@user|id]",
  requireElevated: false,

  async run(params, message) {
    if (!message.guildId) {
      await message.reply({
        embeds: [
          new EmbedBuilder()
            .setColor(0x2D8A4E)
            .setDescription("This command can only be used in a server."),
        ],
      });
      return;
    }

    const targetId = params[0] ? parseMention(params[0]) : message.author.id;
    if (params[0] && !targetId) {
      await message.reply({
        embeds: [
          new EmbedBuilder()
            .setColor(0x2D8A4E)
            .setDescription("Invalid user. Usage: `c!rank [@user|id]`"),
        ],
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
    } catch (err) {
      console.error("[rank] fetchWithProfile failed:", err);
      await message.reply({
        embeds: [new EmbedBuilder().setColor(0x2D8A4E).setDescription("User not found.")],
      });
      return;
    }

    if (await isOptedOut(message.guildId, targetUser.id)) {
      const isSelf = targetUser.id === message.author.id;
      await message.reply({
        embeds: [
          new EmbedBuilder()
            .setColor(0x2D8A4E)
            .setDescription(isSelf ? "You have opted out of XP tracking in this server." : "This user has opted out of XP tracking."),
        ],
      });
      return;
    }

    const { xp, level } = await getUserLevel(message.guildId, targetUser.id);
    const rank = await getRank(message.guildId, targetUser.id);

    let result: { buffer: Buffer; animated: boolean };
    try {
      result = await generateRankCard({
        user: targetUser,
        bannerHash,
        xp,
        level,
        rank: rank === -1 ? 1 : rank,
      });
    } catch (err) {
      console.error("[rank] card generation failed:", err);
      await message.reply({
        embeds: [
          new EmbedBuilder()
            .setColor(0xff0000)
            .setTitle("Rank card failed")
            .setDescription(
              `**${targetUser.globalName ?? targetUser.username}** (@${targetUser.username})\n` +
              `Level **${level}** | XP: **${xp}** | Rank: **#${rank === -1 ? "?" : rank}**`
            )
            .setFooter({ text: String(err) }),
        ],
      });
      return;
    }

    await message.reply({
      files: [{ name: result.animated ? "rank.gif" : "rank.png", data: result.buffer }],
    });
  },
};

export default command;
