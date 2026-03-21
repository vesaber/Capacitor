import { EmbedBuilder } from "@fluxerjs/core";
import type { CommandSchema } from "../utils/CommandSchema";

const MAX_DICE = 20;
const MAX_SIDES = 1000;

const command: CommandSchema = {
  name: "roll",
  category: "Fun",
  description: "Roll dice. Format: NdN (e.g. 2d6). Default: 1d6.",
  params: "[NdN]",
  requireElevated: false,

  async run(params, message) {
    let count = 1;
    let sides = 6;

    if (params.length > 0) {
      const input = params[0]!.toLowerCase();
      const match = input.match(/^(\d+)d(\d+)$/);

      if (!match) {
        await message.reply({
          embeds: [
            new EmbedBuilder()
              .setColor(0x2D8A4E)
              .setDescription("Invalid format. Usage: `c!roll [NdN]` (e.g. `c!roll 2d6`)"),
          ],
        });
        return;
      }

      count = parseInt(match[1]!);
      sides = parseInt(match[2]!);

      if (count > MAX_DICE) {
        await message.reply({
          embeds: [
            new EmbedBuilder()
              .setColor(0x2D8A4E)
              .setDescription(`Too many dice. Maximum is **${MAX_DICE}**.`),
          ],
        });
        return;
      }

      if (sides > MAX_SIDES) {
        await message.reply({
          embeds: [
            new EmbedBuilder()
              .setColor(0x2D8A4E)
              .setDescription(`Too many sides. Maximum is **${MAX_SIDES}**.`),
          ],
        });
        return;
      }

      if (count < 1 || sides < 1) {
        await message.reply({
          embeds: [
            new EmbedBuilder()
              .setColor(0x2D8A4E)
              .setDescription("Dice count and sides must be at least 1."),
          ],
        });
        return;
      }
    }

    const rolls = Array.from({ length: count }, () => Math.floor(Math.random() * sides) + 1);
    const total = rolls.reduce((sum, r) => sum + r, 0);

    let description: string;
    if (count === 1) {
      description = `Rolled a **d${sides}**: **${rolls[0]!}**`;
    } else {
      description = `Rolls: ${rolls.join(", ")}\nTotal: **${total}**`;
    }

    await message.reply({
      embeds: [
        new EmbedBuilder()
          .setColor(0x2D8A4E)
          .setTitle(`🎲 ${count}d${sides}`)
          .setDescription(description),
      ],
    });
  },
};

export default command;
