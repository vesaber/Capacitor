import { Message, EmbedBuilder } from "@fluxerjs/core";
import type { CommandSchema } from "../utils/CommandSchema";

const Words = ["apple", "super", "green", "wafff", "kitty"];

const command: CommandSchema = {
  name: "wordle",
  description: "play wordle.",
  requireElevated: false,

  async run(params, message) {
    await message.reply({
      embeds: [
        new EmbedBuilder()
          .setColor(0x2d8a4e)
          .setTitle("Capacitor v0.1 beta")
          .setDescription("uhhhhhh this is just an example command for now"),
      ],
    });
  },
};

export default command;
