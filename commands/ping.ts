import { EmbedBuilder } from "@fluxerjs/core";
import type { CommandSchema } from "../utils/CommandSchema";

const command: CommandSchema = {
  name: "ping",
  category: "General",
  description: "Check the bot's latency.",
  requireElevated: false,

  async run(_params, message) {
    const before = Date.now();
    const pending = await message.reply({
      embeds: [
        new EmbedBuilder()
          .setColor(0x2D8A4E)
          .setDescription("Pinging..."),
      ],
    });
    const latency = Date.now() - before;

    await pending.delete();

    await message.reply({
      embeds: [
        new EmbedBuilder()
          .setColor(0x2D8A4E)
          .setTitle("Pong!")
          .setDescription(`Latency: **${latency}ms**`),
      ],
    });
  },
};

export default command;
