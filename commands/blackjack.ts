import { EmbedBuilder } from "@fluxerjs/core";
import type { Message } from "@fluxerjs/core";
import type { CommandSchema } from "../utils/CommandSchema";
import { getBalance, addBalance, deleteBalance } from "../database";
import { newDeck, handValue, fmtHand, fmt, type Card } from "../utils/cards";

interface BJGame {
  deck: Card[];
  playerHand: Card[];
  dealerHand: Card[];
  bet: number;
}

const games = new Map<string, BJGame>();

function key(guildId: string, userId: string) {
  return `${guildId}:${userId}`;
}

async function resolve(k: string, game: BJGame, guildId: string, userId: string, message: Message) {
  games.delete(k);

  while (handValue(game.dealerHand) < 17)
    game.dealerHand.push(game.deck.pop()!);

  const pv = handValue(game.playerHand);
  const dv = handValue(game.dealerHand);

  let result: string;
  if (dv > 21 || pv > dv) {
    const newBalance = await addBalance(guildId, userId, game.bet);
    result = `You win **${game.bet}** coins! Balance: **${newBalance}**`;
  } else if (pv === dv) {
    const balance = await getBalance(guildId, userId);
    result = `**Push!** Your bet is returned. Balance: **${balance}**`;
  } else {
    const newBalance = await deleteBalance(guildId, userId, game.bet);
    result = `Dealer wins. You lose **${game.bet}** coins. Balance: **${newBalance}**`;
  }

  await message.reply({
    embeds: [
      new EmbedBuilder()
        .setColor(0x2D8A4E)
        .setTitle("Blackjack — Game Over")
        .setDescription(
          `**Dealer:** ${fmtHand(game.dealerHand)} **(${dv > 21 ? "Bust" : dv})**\n` +
          `**You:** ${fmtHand(game.playerHand)} **(${pv})**\n\n${result}`
        ),
    ],
  });
}

const command: CommandSchema = {
  name: "blackjack",
  category: "Gambling",
  description: "Play blackjack against the dealer.",
  params: "<amount | hit | stand | double>",
  requireElevated: false,

  async run(params, message) {
    if (!message.guildId) {
      await message.reply({ embeds: [new EmbedBuilder().setColor(0x2D8A4E).setDescription("Server only.")] });
      return;
    }

    const guildId = message.guildId;
    const userId = message.author.id;
    const k = key(guildId, userId);
    const action = params[0]?.toLowerCase();

    if (!action) {
      await message.reply({ embeds: [new EmbedBuilder().setColor(0x2D8A4E).setDescription("Usage: `c!blackjack <amount>` to start, then `hit`, `stand`, or `double`.")] });
      return;
    }

    if (action === "hit" || action === "stand" || action === "double") {
      const game = games.get(k);
      if (!game) {
        await message.reply({ embeds: [new EmbedBuilder().setColor(0x2D8A4E).setDescription("No active game. Start one with `c!blackjack <amount>`.")] });
        return;
      }

      if (action === "hit") {
        game.playerHand.push(game.deck.pop()!);
        const pv = handValue(game.playerHand);

        if (pv > 21) {
          games.delete(k);
          const newBalance = await deleteBalance(guildId, userId, game.bet);
          await message.reply({
            embeds: [
              new EmbedBuilder()
                .setColor(0x2D8A4E)
                .setTitle("Blackjack — Bust!")
                .setDescription(`**You:** ${fmtHand(game.playerHand)} **(${pv})**\nYou lose **${game.bet}** coins. Balance: **${newBalance}**`),
            ],
          });
          return;
        }

        if (pv === 21) {
          await resolve(k, game, guildId, userId, message);
          return;
        }

        await message.reply({
          embeds: [
            new EmbedBuilder()
              .setColor(0x2D8A4E)
              .setTitle("Blackjack")
              .setDescription(
                `**Dealer:** ${fmt(game.dealerHand[0]!)} + \`??\`\n` +
                `**You:** ${fmtHand(game.playerHand)} **(${pv})**\n\n` +
                `Use \`c!blackjack hit\`, \`stand\`, or \`double\`.`
              ),
          ],
        });
        return;
      }

      if (action === "stand") {
        await resolve(k, game, guildId, userId, message);
        return;
      }

      if (action === "double") {
        const newBet = game.bet * 2;
        const balance = await getBalance(guildId, userId);
        if (balance < newBet) {
          await message.reply({ embeds: [new EmbedBuilder().setColor(0x2D8A4E).setDescription(`You need **${newBet}** coins to double down. Balance: **${balance}**`)] });
          return;
        }
        game.bet = newBet;
        game.playerHand.push(game.deck.pop()!);
        const pv = handValue(game.playerHand);

        if (pv > 21) {
          games.delete(k);
          const newBalance = await deleteBalance(guildId, userId, game.bet);
          await message.reply({
            embeds: [
              new EmbedBuilder()
                .setColor(0x2D8A4E)
                .setTitle("Blackjack — Bust! (Doubled)")
                .setDescription(`**You:** ${fmtHand(game.playerHand)} **(${pv})**\nYou lose **${game.bet}** coins. Balance: **${newBalance}**`),
            ],
          });
          return;
        }

        await resolve(k, game, guildId, userId, message);
        return;
      }
    }

    const amount = Number(action);
    if (isNaN(amount) || !Number.isInteger(amount) || amount <= 0) {
      await message.reply({ embeds: [new EmbedBuilder().setColor(0x2D8A4E).setDescription("Amount must be a positive whole number.")] });
      return;
    }

    if (games.has(k)) {
      await message.reply({ embeds: [new EmbedBuilder().setColor(0x2D8A4E).setDescription("You already have an active game. Use `hit`, `stand`, or `double`.")] });
      return;
    }

    const balance = await getBalance(guildId, userId);
    if (amount > balance) {
      await message.reply({ embeds: [new EmbedBuilder().setColor(0x2D8A4E).setDescription(`Insufficient balance. You have **${balance}** coins.`)] });
      return;
    }

    const deck = newDeck();
    const playerHand: Card[] = [deck.pop()!, deck.pop()!];
    const dealerHand: Card[] = [deck.pop()!, deck.pop()!];
    const pv = handValue(playerHand);
    const dv = handValue(dealerHand);

    if (pv === 21 || dv === 21) {
      let result: string;
      if (pv === 21 && dv === 21) {
        result = "Both have Blackjack — **Push!** Your bet is returned.";
      } else if (pv === 21) {
        const win = Math.floor(amount * 1.5);
        const newBalance = await addBalance(guildId, userId, win);
        result = `**Blackjack!** You win **${win}** coins! Balance: **${newBalance}**`;
      } else {
        const newBalance = await deleteBalance(guildId, userId, amount);
        result = `Dealer has Blackjack. You lose **${amount}** coins. Balance: **${newBalance}**`;
      }
      await message.reply({
        embeds: [
          new EmbedBuilder()
            .setColor(0x2D8A4E)
            .setTitle("Blackjack — Game Over")
            .setDescription(
              `**Dealer:** ${fmtHand(dealerHand)} **(${dv})**\n` +
              `**You:** ${fmtHand(playerHand)} **(${pv})**\n\n${result}`
            ),
        ],
      });
      return;
    }

    games.set(k, { deck, playerHand, dealerHand, bet: amount });

    await message.reply({
      embeds: [
        new EmbedBuilder()
          .setColor(0x2D8A4E)
          .setTitle("Blackjack")
          .setDescription(
            `**Dealer:** ${fmt(dealerHand[0]!)} + \`??\`\n` +
            `**You:** ${fmtHand(playerHand)} **(${pv})**\n\n` +
            `Use \`c!blackjack hit\`, \`stand\`, or \`double\`.`
          ),
      ],
    });
  },
};

export default command;
