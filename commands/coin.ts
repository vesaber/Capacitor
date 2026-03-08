import { EmbedBuilder } from "@fluxerjs/core";
import type { CommandSchema } from "../utils/CommandSchema";

const command: CommandSchema = {
  name: "coin",
  description: "Flip a coin.",
  requireElevated: false,

  async run(_params, message) {
    const result = Math.random() < 0.5 ? "Heads" : "Tails";

    await message.reply({
      embeds: [
        new EmbedBuilder()
          .setColor(0x2D8A4E)
          .setTitle("Coin Flip")
          .setDescription(`The coin landed on **${result}**!`),
      ],
    });
  },
};

export default command;
