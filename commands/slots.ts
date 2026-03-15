import { EmbedBuilder } from "@fluxerjs/core";
import type { CommandSchema } from "../utils/CommandSchema";
import { getBalance, addBalance, deleteBalance } from "../database";

const SYMBOLS = ["🍒", "🍋", "🍊", "🍇", "⭐", "💎"];

const command: CommandSchema = {
  name: "slots",
  description: "Spin the slot machine. 3-match pays 10x, 2-match pays 1.5x.",
  params: "<amount>",
  requireElevated: false,

  async run(params, message) {
    if (!message.guildId) {
      await message.reply({ embeds: [new EmbedBuilder().setColor(0x2D8A4E).setDescription("Server only.")] });
      return;
    }

    if (!params[0]) {
      await message.reply({ embeds: [new EmbedBuilder().setColor(0x2D8A4E).setDescription("Usage: `c!slots <amount>`")] });
      return;
    }

    const amount = Number(params[0]);
    if (isNaN(amount) || !Number.isInteger(amount) || amount <= 0) {
      await message.reply({ embeds: [new EmbedBuilder().setColor(0x2D8A4E).setDescription("Amount must be a positive whole number.")] });
      return;
    }

    const balance = await getBalance(message.guildId, message.author.id);
    if (amount > balance) {
      await message.reply({ embeds: [new EmbedBuilder().setColor(0x2D8A4E).setDescription(`Insufficient balance. You have **${balance}** coins.`)] });
      return;
    }

    const r = [
      Math.floor(Math.random() * 36),
      Math.floor(Math.random() * 36),
      Math.floor(Math.random() * 36),
    ];
    const reels = r.map(v => SYMBOLS[v % SYMBOLS.length]!);

    const display = `[ ${reels.join("  ")} ]`;
    let result: string;
    let newBalance: number;

    if (r[0] === r[1] && r[1] === r[2]) {
      const win = amount * 9;
      newBalance = await addBalance(message.guildId, message.author.id, win);
      result = `🎰 **JACKPOT!** You win **${win}** coins!`;
    } else if (r[0] === r[1] || r[1] === r[2] || r[0] === r[2]) {
      const win = Math.floor(amount * 0.5);
      newBalance = await addBalance(message.guildId, message.author.id, win);
      result = `Two of a kind! You win **${win}** coins.`;
    } else {
      newBalance = await deleteBalance(message.guildId, message.author.id, amount);
      result = `No match. You lose **${amount}** coins.`;
    }

    await message.reply({
      embeds: [
        new EmbedBuilder()
          .setColor(0x2D8A4E)
          .setTitle(display)
          .setDescription(`${result}\nBalance: **${newBalance}**`),
      ],
    });
  },
};

export default command;
