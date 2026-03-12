import { EmbedBuilder } from "@fluxerjs/core";
import type { CommandSchema } from "../utils/CommandSchema";
import { getBalance, addBalance, deleteBalance } from "../database";

const command: CommandSchema = {
  name: "bet",
  description: "Roll a d6 and bet on the outcome. Correct guess pays 5x.",
  params: "<amount> <1-6>",
  requireElevated: false,

  async run(params, message) {
    if (!message.guildId) {
      await message.reply({ embeds: [new EmbedBuilder().setColor(0x2D8A4E).setDescription("Server only.")] });
      return;
    }

    if (!params[0] || !params[1]) {
      await message.reply({ embeds: [new EmbedBuilder().setColor(0x2D8A4E).setDescription("Usage: `c!bet <amount> <1-6>`")] });
      return;
    }

    const amount = Number(params[0]);
    const pick = Number(params[1]);

    if (isNaN(amount) || !Number.isInteger(amount) || amount <= 0) {
      await message.reply({ embeds: [new EmbedBuilder().setColor(0x2D8A4E).setDescription("Amount must be a positive whole number.")] });
      return;
    }

    if (isNaN(pick) || !Number.isInteger(pick) || pick < 1 || pick > 6) {
      await message.reply({ embeds: [new EmbedBuilder().setColor(0x2D8A4E).setDescription("Pick a number between **1** and **6**.")] });
      return;
    }

    const balance = await getBalance(message.guildId, message.author.id);
    if (amount > balance) {
      await message.reply({ embeds: [new EmbedBuilder().setColor(0x2D8A4E).setDescription(`Insufficient balance. You have **${balance}** coins.`)] });
      return;
    }

    const roll = Math.floor(Math.random() * 6) + 1;
    const dice = ["⚀", "⚁", "⚂", "⚃", "⚄", "⚅"];

    if (roll === pick) {
      const newBalance = await addBalance(message.guildId, message.author.id, amount * 4);
      await message.reply({
        embeds: [
          new EmbedBuilder()
            .setColor(0x2D8A4E)
            .setTitle(`${dice[roll - 1]} Rolled a ${roll} — You win!`)
            .setDescription(`You guessed **${pick}** and won **${amount * 4}** coins!\nBalance: **${newBalance}**`),
        ],
      });
    } else {
      const newBalance = await deleteBalance(message.guildId, message.author.id, amount);
      await message.reply({
        embeds: [
          new EmbedBuilder()
            .setColor(0x2D8A4E)
            .setTitle(`${dice[roll - 1]} Rolled a ${roll} — You lose.`)
            .setDescription(`You guessed **${pick}** and lost **${amount}** coins.\nBalance: **${newBalance}**`),
        ],
      });
    }
  },
};

export default command;
