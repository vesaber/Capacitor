import { EmbedBuilder } from "@fluxerjs/core";
import type { CommandSchema } from "../utils/CommandSchema";
import { transferBalance } from "../database";
import { parseMention } from "../utils/moderation";

const command: CommandSchema = {
  name: "give",
  description: "Give coins to another user.",
  params: "<@user|id> <amount>",
  requireElevated: false,

  async run(params, message) {
    if (!message.guildId) {
      await message.reply({
        embeds: [new EmbedBuilder().setColor(0x2D8A4E).setDescription("server only")],
      });
      return;
    }

    const targetId = parseMention(params[0] ?? "");
    if (!targetId) {
      await message.reply({
        embeds: [
          new EmbedBuilder()
            .setColor(0x2D8A4E)
            .setTitle("Usage")
            .setDescription("`c!give <@user|id> <amount>`"),
        ],
      });
      return;
    }

    if (targetId === message.author.id) {
      await message.reply({
        embeds: [new EmbedBuilder().setColor(0x2D8A4E).setDescription("can't give coins to yourself")],
      });
      return;
    }

    let targetUser;
    try {
      targetUser = await message.client.users.fetch(targetId);
    } catch {
      await message.reply({
        embeds: [new EmbedBuilder().setColor(0x2D8A4E).setDescription("user not found")],
      });
      return;
    }

    if (targetUser.bot) {
      await message.reply({
        embeds: [new EmbedBuilder().setColor(0x2D8A4E).setDescription("can't give coins to a bot")],
      });
      return;
    }

    const amount = parseInt(params[1] ?? "");
    if (isNaN(amount) || amount <= 0) {
      await message.reply({
        embeds: [new EmbedBuilder().setColor(0x2D8A4E).setDescription("invalid amount")],
      });
      return;
    }

    try {
      const { fromBalance, toBalance } = await transferBalance(
        message.guildId,
        message.author.id,
        targetId,
        amount
      );

      await message.reply({
        embeds: [
          new EmbedBuilder()
            .setColor(0x2D8A4E)
            .setTitle(`${amount} coins → ${targetUser.globalName ?? targetUser.username}`)
            .addFields(
              { name: "your balance", value: String(fromBalance), inline: true },
              { name: `${targetUser.username}`, value: String(toBalance), inline: true }
            ),
        ],
      });
    } catch (err: unknown) {
      const isInsufficient = err instanceof Error && err.message === "Insufficient balance";
      await message.reply({
        embeds: [
          new EmbedBuilder()
            .setColor(0x2D8A4E)
            .setDescription(isInsufficient ? "not enough coins" : `transfer failed: ${String(err)}`),
        ],
      });
    }
  },
};

export default command;
