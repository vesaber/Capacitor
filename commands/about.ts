import { Message, EmbedBuilder } from "@fluxerjs/core";
import type { CommandSchema } from "../utils/CommandSchema";

const command: CommandSchema = {
  name: "about",
  description: "About Capacitor",
  requireElevated: false,

  async run(params, message) {
    await message.reply({
      embeds: [
        new EmbedBuilder()
          .setColor(0x2D8A4E)
          .setTitle("Capacitor v0.1 beta")
          .setDescription("uhhhhhh this is just an example command for now"),
      ],
    });
  },
};

export default command;
