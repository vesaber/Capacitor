import { EmbedBuilder } from "@fluxerjs/core";
import type { CommandSchema } from "../utils/CommandSchema";
import { getBalance, addBalance, deleteBalance } from "../database";
import { newDeck, cardRank, fmt } from "../utils/cards";

const command: CommandSchema = {
  name: "highlow",
  description: "Guess if the next card is higher or lower.",
  params: "<amount> <high|low>",
  requireElevated: false,

  async run(params, message) {
    if (!message.guildId) {
      await message.reply({ embeds: [new EmbedBuilder().setColor(0x2D8A4E).setDescription("Server only.")] });
      return;
    }

    if (!params[0] || !params[1]) {
      await message.reply({ embeds: [new EmbedBuilder().setColor(0x2D8A4E).setDescription("Usage: `c!highlow <amount> <high|low>`")] });
      return;
    }

    const amount = Number(params[0]);
    const guess = params[1].toLowerCase();

    if (isNaN(amount) || !Number.isInteger(amount) || amount <= 0) {
      await message.reply({ embeds: [new EmbedBuilder().setColor(0x2D8A4E).setDescription("Amount must be a positive whole number.")] });
      return;
    }

    if (guess !== "high" && guess !== "low") {
      await message.reply({ embeds: [new EmbedBuilder().setColor(0x2D8A4E).setDescription("Guess must be `high` or `low`.")] });
      return;
    }

    const balance = await getBalance(message.guildId, message.author.id);
    if (amount > balance) {
      await message.reply({ embeds: [new EmbedBuilder().setColor(0x2D8A4E).setDescription(`Insufficient balance. You have **${balance}** coins.`)] });
      return;
    }

    const deck = newDeck();
    const card1 = deck.pop()!;
    const card2 = deck.pop()!;
    const r1 = cardRank(card1);
    const r2 = cardRank(card2);

    const rankLabel = (r: number) => ["", "A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"][r]!;

    let outcome: string;
    let newBalance: number;

    if (r2 === r1) {
      newBalance = balance;
      outcome = `**Tie!** Both cards are **${rankLabel(r1)}**. Your bet is returned.`;
    } else if ((guess === "high" && r2 > r1) || (guess === "low" && r2 < r1)) {
      newBalance = await addBalance(message.guildId, message.author.id, amount);
      outcome = `**Correct!** You win **${amount}** coins!`;
    } else {
      newBalance = await deleteBalance(message.guildId, message.author.id, amount);
      outcome = `**Wrong!** You lose **${amount}** coins.`;
    }

    const arrow = r2 > r1 ? "▲ Higher" : r2 < r1 ? "▼ Lower" : "= Same";

    await message.reply({
      embeds: [
        new EmbedBuilder()
          .setColor(0x2D8A4E)
          .setTitle("High Low")
          .setDescription(
            `First card: ${fmt(card1)} **(${rankLabel(r1)})**\n` +
            `Next card: ${fmt(card2)} **(${rankLabel(r2)})** — ${arrow}\n` +
            `You guessed: **${guess}**\n\n${outcome}\nBalance: **${newBalance}**`
          ),
      ],
    });
  },
};

export default command;
