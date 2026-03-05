import { EmbedBuilder } from "@fluxerjs/core";
import type { CommandSchema } from "../utils/CommandSchema";
import { spawnSync } from "child_process";

const COMPOSE_FILE = "/app/docker-compose.yml";

const command: CommandSchema = {
  name: "update",
  description: "Pull the latest bot image and restart.",
  requireElevated: false,
  requireWhitelist: true,

  async run(_params, message) {
    await message.reply({
      embeds: [
        new EmbedBuilder()
          .setColor(0x2D8A4E)
          .setDescription("Pulling latest image..."),
      ],
    });

    const pull = spawnSync("docker", ["compose", "-f", COMPOSE_FILE, "pull"], {
      encoding: "utf8",
    });

    if (pull.status !== 0) {
      await message.reply({
        embeds: [
          new EmbedBuilder()
            .setColor(0xff0000)
            .setTitle("Pull failed")
            .setDescription(`\`\`\`\n${pull.stderr || pull.stdout}\n\`\`\``),
        ],
      });
      return;
    }

    await message.reply({
      embeds: [
        new EmbedBuilder()
          .setColor(0x2D8A4E)
          .setDescription("Restarting..."),
      ],
    });

    spawnSync("docker", ["compose", "-f", COMPOSE_FILE, "up", "-d"], {
      encoding: "utf8",
    });

    await message.reply({
      embeds: [
        new EmbedBuilder()
          .setColor(0x2D8A4E)
          .setDescription("Restarted!"),
      ],
    });
  },
};

export default command;
