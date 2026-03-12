import { EmbedBuilder } from "@fluxerjs/core";
import type { CommandSchema } from "../utils/CommandSchema";
import { getBalance, addBalance, deleteBalance } from "../database";

// European roulette red numbers
const RED = new Set([1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36]);

const HELP =
  "Bet types:\n" +
  "• `0`–`36` — single number (pays **35x**)\n" +
  "• `red` / `black` — colour (pays **2x**)\n" +
  "• `odd` / `even` — parity (pays **2x**)\n" +
  "• `low` (1–18) / `high` (19–36) — range (pays **2x**)";

const command: CommandSchema = {
  name: "roulette",
  description: "Spin the roulette wheel.",
  params: "<amount> <bet>",
  requireElevated: false,
  additionalInfo: HELP,

  async run(params, message) {
    if (!message.guildId) {
      await message.reply({ embeds: [new EmbedBuilder().setColor(0x2D8A4E).setDescription("Server only.")] });
      return;
    }

    if (!params[0] || !params[1]) {
      await message.reply({ embeds: [new EmbedBuilder().setColor(0x2D8A4E).setDescription(`Usage: \`c!roulette <amount> <bet>\`\n\n${HELP}`)] });
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

    const bet = params[1].toLowerCase();
    const spin = Math.floor(Math.random() * 37);
    const spinColor = spin === 0 ? "🟢" : RED.has(spin) ? "🔴" : "⚫";

    type BetType = "number" | "red" | "black" | "odd" | "even" | "low" | "high";
    let betType: BetType;
    let betNum: number | null = null;

    if (["red", "black", "odd", "even", "low", "high"].includes(bet)) {
      betType = bet as BetType;
    } else {
      const n = Number(bet);
      if (isNaN(n) || !Number.isInteger(n) || n < 0 || n > 36) {
        await message.reply({ embeds: [new EmbedBuilder().setColor(0x2D8A4E).setDescription(`Invalid bet type.\n\n${HELP}`)] });
        return;
      }
      betType = "number";
      betNum = n;
    }

    let won = false;
    let payout = 0;

    if (betType === "number") {
      won = spin === betNum;
      payout = 35;
    } else if (betType === "red") {
      won = spin !== 0 && RED.has(spin);
      payout = 1;
    } else if (betType === "black") {
      won = spin !== 0 && !RED.has(spin);
      payout = 1;
    } else if (betType === "odd") {
      won = spin !== 0 && spin % 2 === 1;
      payout = 1;
    } else if (betType === "even") {
      won = spin !== 0 && spin % 2 === 0;
      payout = 1;
    } else if (betType === "low") {
      won = spin >= 1 && spin <= 18;
      payout = 1;
    } else if (betType === "high") {
      won = spin >= 19 && spin <= 36;
      payout = 1;
    }

    let result: string;
    let newBalance: number;

    if (won) {
      newBalance = await addBalance(message.guildId, message.author.id, amount * payout);
      result = `You win **${amount * payout}** coins!`;
    } else {
      newBalance = await deleteBalance(message.guildId, message.author.id, amount);
      result = `You lose **${amount}** coins.`;
    }

    await message.reply({
      embeds: [
        new EmbedBuilder()
          .setColor(0x2D8A4E)
          .setTitle(`Roulette — ${spinColor} ${spin}`)
          .setDescription(`Your bet: **${bet}**\n${result}\nBalance: **${newBalance}**`),
      ],
    });
  },
};

export default command;
