import { EmbedBuilder, Events } from "@fluxerjs/core";
import type { CommandSchema } from "../utils/CommandSchema";
import { getLeaderboard, getEconomyLeaderboard } from "../database";
import { generateLeaderboardCard } from "../utils/leveling";

const PAGE_SIZE = 10;

const command: CommandSchema = {
  name: "leaderboard",
  category: "Leveling",
  description: "Show the XP or economy leaderboard for this server.",
  params: "",
  requireElevated: false,

  async run(_params, message) {
    if (!message.guildId) {
      await message.reply({
        embeds: [
          new EmbedBuilder().setColor(0x2D8A4E).setDescription("server only"),
        ],
      });
      return;
    }

    const guildId = message.guildId;
    const authorId = message.author.id;
    const client = message.client;

    const selectorMsg = await message.reply({
      embeds: [
        new EmbedBuilder()
          .setColor(0x2D8A4E)
          .setTitle("Leaderboard")
          .addFields(
            { name: "📊 XP", value: "server levels", inline: true },
            { name: "💰 Coins", value: "economy", inline: true }
          )
          .setFooter({ text: "react below to choose" }),
      ],
    });

    await selectorMsg.react("📊");
    await selectorMsg.react("💰");

    const selectorTimeout = setTimeout(() => {
      client.off(Events.MessageReactionAdd, selectorListener);
      selectorMsg.delete().catch(() => {});
    }, 30_000);

    const selectorListener = async (reaction: any, user: any) => {
      if (reaction.messageId !== selectorMsg.id) return;
      if (user.id !== authorId) return;
      if (!["📊", "💰"].includes(reaction.emoji.name)) return;

      clearTimeout(selectorTimeout);
      client.off(Events.MessageReactionAdd, selectorListener);

      const mode: "xp" | "economy" = reaction.emoji.name === "💰" ? "economy" : "xp";
      try { await selectorMsg.delete(); } catch {}
      await showPage(mode, 1);
    };

    client.on(Events.MessageReactionAdd, selectorListener);

    // Renders the leaderboard image for a given page and waits for an arrow press.
    const showPage = async (mode: "xp" | "economy", page: number) => {
      let buf: Buffer;
      let totalPages: number;

      try {
        const result = await buildPage(mode, page);
        if (!result) return;
        buf = result.buf;
        totalPages = result.totalPages;
        page = result.page;
      } catch (err) {
        console.error("[leaderboard] image generation failed:", err);
        await message.send({
          embeds: [
            new EmbedBuilder()
              .setColor(0x2D8A4E)
              .setDescription(`leaderboard failed: ${String(err)}`),
          ],
        });
        return;
      }

      const imgMsg = await message.send({
        files: [{ name: "leaderboard.png", data: buf }],
      });

      await imgMsg.react("◀️");
      await imgMsg.react("▶️");

      const pageTimeout = setTimeout(() => {
        client.off(Events.MessageReactionAdd, pageListener);
        imgMsg.removeReaction("◀️", client.user!.id).catch(() => {});
        imgMsg.removeReaction("▶️", client.user!.id).catch(() => {});
      }, 60_000);

      const pageListener = async (reaction: any, user: any) => {
        if (reaction.messageId !== imgMsg.id) return;
        if (user.id !== authorId) return;
        if (!["◀️", "▶️"].includes(reaction.emoji.name)) return;

        clearTimeout(pageTimeout);
        client.off(Events.MessageReactionAdd, pageListener);

        const direction = reaction.emoji.name === "▶️" ? 1 : -1;
        const newPage = Math.min(Math.max(page + direction, 1), totalPages);
        try { await imgMsg.delete(); } catch {}
        await showPage(mode, newPage);
      };

      client.on(Events.MessageReactionAdd, pageListener);
    };

    const buildPage = async (mode: "xp" | "economy", page: number) => {
      if (mode === "economy") {
        const dbEntries = await getEconomyLeaderboard(guildId);
        if (dbEntries.length === 0) {
          await message.send({
            embeds: [
              new EmbedBuilder()
                .setColor(0x2D8A4E)
                .setDescription("no one has any coins yet"),
            ],
          });
          return null;
        }
        const totalPages = Math.ceil(dbEntries.length / PAGE_SIZE);
        const clampedPage = Math.min(Math.max(page, 1), totalPages);
        const slice = dbEntries.slice((clampedPage - 1) * PAGE_SIZE, clampedPage * PAGE_SIZE);
        const entries = (
          await Promise.all(
            slice.map(async (entry, i) => {
              try {
                const { user, globalProfile, serverProfile } =
                  await message.client.users.fetchWithProfile(entry.user_id, { guildId });
                const bannerHash =
                  serverProfile?.user_profile?.banner ??
                  globalProfile?.user_profile?.banner ??
                  null;
                if (user.bot) return null;
                return {
                  user,
                  balance: entry.balance,
                  rank: (clampedPage - 1) * PAGE_SIZE + i + 1,
                  isYou: entry.user_id === authorId,
                  bannerHash,
                };
              } catch {
                return null;
              }
            })
          )
        ).filter((e) => e !== null) as any[];

        const buf = await generateLeaderboardCard({ entries, page: clampedPage, totalPages, mode: "economy" });
        return { buf, totalPages, page: clampedPage };
      } else {
        const dbEntries = await getLeaderboard(guildId);
        if (dbEntries.length === 0) {
          await message.send({
            embeds: [
              new EmbedBuilder()
                .setColor(0x2D8A4E)
                .setDescription("no one has earned xp yet"),
            ],
          });
          return null;
        }
        const totalPages = Math.ceil(dbEntries.length / PAGE_SIZE);
        const clampedPage = Math.min(Math.max(page, 1), totalPages);
        const slice = dbEntries.slice((clampedPage - 1) * PAGE_SIZE, clampedPage * PAGE_SIZE);
        const entries = (
          await Promise.all(
            slice.map(async (entry, i) => {
              try {
                const { user, globalProfile, serverProfile } =
                  await message.client.users.fetchWithProfile(entry.user_id, { guildId });
                const bannerHash =
                  serverProfile?.user_profile?.banner ??
                  globalProfile?.user_profile?.banner ??
                  null;
                if (user.bot) return null;
                return {
                  user,
                  xp: entry.xp,
                  level: entry.level,
                  rank: (clampedPage - 1) * PAGE_SIZE + i + 1,
                  isYou: entry.user_id === authorId,
                  bannerHash,
                };
              } catch {
                return null;
              }
            })
          )
        ).filter((e) => e !== null) as any[];

        const buf = await generateLeaderboardCard({ entries, page: clampedPage, totalPages, mode: "xp" });
        return { buf, totalPages, page: clampedPage };
      }
    };
  },
};

export default command;
