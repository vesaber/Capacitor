import { EmbedBuilder } from "@fluxerjs/core";
import type { CommandSchema } from "../utils/CommandSchema";
import { getLeaderboard } from "../database";
import { generateLeaderboardCard } from "../utils/leveling";

const PAGE_SIZE = 10;

const command: CommandSchema = {
  name: "leaderboard",
  description: "Show the XP leaderboard for this server.",
  params: "[page]",
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

    const dbEntries = await getLeaderboard(message.guildId);
    if (dbEntries.length === 0) {
      await message.reply({
        embeds: [
          new EmbedBuilder()
            .setColor(0x2D8A4E)
            .setDescription("No one has earned XP in this server yet."),
        ],
      });
      return;
    }

    const totalPages = Math.ceil(dbEntries.length / PAGE_SIZE);
    const page = Math.min(Math.max(parseInt(params[0] ?? "1") || 1, 1), totalPages);
    const slice = dbEntries.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

    const entries = (
      await Promise.all(
        slice.map(async (entry, i) => {
          try {
            const { user, globalProfile, serverProfile } = await message.client.users.fetchWithProfile(
              entry.user_id,
              { guildId: message.guildId! }
            );
            const bannerHash =
              serverProfile?.user_profile?.banner ??
              globalProfile?.user_profile?.banner ??
              null;
            return {
              user,
              xp: entry.xp,
              level: entry.level,
              rank: (page - 1) * PAGE_SIZE + i + 1,
              isYou: entry.user_id === message.author.id,
              bannerHash,
            };
          } catch {
            return null;
          }
        })
      )
    ).filter((e) => e !== null);

    let imageBuffer: Buffer;
    try {
      imageBuffer = await generateLeaderboardCard({ entries, page, totalPages });
    } catch (err) {
      console.error("[leaderboard] image generation failed:", err);
      await message.reply({
        embeds: [
          new EmbedBuilder()
            .setColor(0xff0000)
            .setTitle("Leaderboard failed")
            .setDescription(`\`\`\`\n${String(err)}\n\`\`\``),
        ],
      });
      return;
    }

    await message.reply({
      files: [{ name: "leaderboard.png", data: imageBuffer }],
    });
  },
};

export default command;
