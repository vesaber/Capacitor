import { EmbedBuilder } from "@fluxerjs/core";
import type { CommandSchema } from "../utils/CommandSchema";
import { parseMention } from "../utils/moderation";
import { addToWhitelist, removeFromWhitelist, getWhitelist } from "../database";

const command: CommandSchema = {
  name: "whitelist",
  description: "Manage the whitelist for elevated commands in this server.",
  params: "<add|remove|list> [<@user|id>]",
  requireElevated: false,

  async run(params, message) {
    const guild = message.guild ?? (message.guildId != null ? await message.resolveGuild() : null);
    const isOwner =
      message.author.id === process.env.OWNER_ID ||
      guild?.ownerId === message.author.id;

    if (!guild || !isOwner) {
      await message.reply({
        embeds: [
          new EmbedBuilder()
            .setColor(0x2D8A4E)
            .setTitle("Permission denied")
            .setDescription("Only the server owner can manage the whitelist."),
        ],
      });
      return;
    }

    const sub = params[0]?.toLowerCase();

    if (sub === "list") {
      const ids = await getWhitelist(guild.id);
      await message.reply({
        embeds: [
          new EmbedBuilder()
            .setColor(0x2D8A4E)
            .setTitle("Whitelist")
            .setDescription(ids.length ? ids.map((id) => `<@${id}>`).join("\n") : "Empty"),
        ],
      });
      return;
    }

    const userId = parseMention(params[1] ?? "") || params[1];
    if ((sub !== "add" && sub !== "remove") || !userId) {
      await message.reply({
        embeds: [
          new EmbedBuilder()
            .setColor(0x2D8A4E)
            .setTitle("Usage")
            .setDescription("`c!whitelist <add|remove|list> [<@user|id>]`"),
        ],
      });
      return;
    }

    if (sub === "add") {
      await addToWhitelist(guild.id, userId);
      await message.reply({
        embeds: [
          new EmbedBuilder()
            .setColor(0x2D8A4E)
            .setDescription(`<@${userId}> added to whitelist.`),
        ],
      });
    } else {
      const removed = await removeFromWhitelist(guild.id, userId);
      await message.reply({
        embeds: [
          new EmbedBuilder()
            .setColor(0x2D8A4E)
            .setDescription(removed ? `<@${userId}> removed from whitelist.` : "User not in whitelist."),
        ],
      });
    }
  },
};

export default command;
