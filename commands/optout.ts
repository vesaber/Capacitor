import { EmbedBuilder } from "@fluxerjs/core";
import type { CommandSchema } from "../utils/CommandSchema";
import { isOptedOut, setOptOut } from "../database";

const command: CommandSchema = {
  name: "optout",
  category: "Leveling",
  description: "Toggle XP tracking opt-out for yourself in this server.",
  requireElevated: false,

  async run(_params, message) {
    if (!message.guildId) {
      await message.reply({
        embeds: [new EmbedBuilder().setColor(0x2D8A4E).setDescription("This command can only be used in a server.")],
      });
      return;
    }

    const current = await isOptedOut(message.guildId, message.author.id);
    const newValue = !current;
    await setOptOut(message.guildId, message.author.id, newValue);

    const text = newValue
      ? "You have opted **out of** XP tracking in this server."
      : "You have opted **back into** XP tracking in this server.";

    await message.reply({
      embeds: [new EmbedBuilder().setColor(0x2D8A4E).setDescription(text)],
    });
  },
};

export default command;
