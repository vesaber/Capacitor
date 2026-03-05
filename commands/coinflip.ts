import { EmbedBuilder } from "@fluxerjs/core";
import type { CommandSchema } from "../utils/CommandSchema";
import { addBalance, getBalance, deleteBalance } from "../database";

const command: CommandSchema = {
    name: "coinflip",
    description: "Flip a coin.",
    params: "<amount> <side>",
    requireElevated: false,
    async run(params, message) {
        if (!message.guildId) {
            await message.reply({
                embeds: [new EmbedBuilder().setColor(0x2D8A4E).setDescription("server only")],
            });
            return;
        }

        const amount: number = Number(params[0]);
        const sides = ["heads", "tails"];
        const selectedSide = Math.floor(Math.random() * sides.length);
        const currentBalance = await getBalance(message.guildId, message.author.id);

        if (isNaN(amount)) {
            await message.reply("Amount must be a number.");
        }

        if (amount <= 0) {
            await message.reply("Amount must be greater than 0.");
            return;
        }

        if (amount > currentBalance) {
            await message.reply("Amount cannot be greater than balance.");
            return;
        }

        if (!params[1] || !sides.includes(params[1].toLowerCase())) {
            await message.reply('Please choose Heads or Tails.');
            return;
        }

        if (sides[selectedSide] == params[1].toLowerCase()) {
            await addBalance(message.guildId, message.author.id, amount);
            await message.reply({
                embeds: [new EmbedBuilder()
                    .setColor(0x2D8A4E)
                    .setTitle(`Coin landed on ${sides[selectedSide]}, you won ${amount}.`)
                    .setDescription(`New balance: ${currentBalance + amount}`)],
            });
            return;
        }

        await deleteBalance(message.guildId, message.author.id, amount);
        await message.reply({
                embeds: [new EmbedBuilder()
                    .setColor(0x2D8A4E)
                    .setTitle(`Coin landed on ${sides[selectedSide]}, you lost ${amount}.`)
                    .setDescription(`New balance: ${currentBalance - amount}`)],
            });
    }
}

export default command;