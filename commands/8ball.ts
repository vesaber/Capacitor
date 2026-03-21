import { EmbedBuilder } from "@fluxerjs/core";
import type { CommandSchema } from "../utils/CommandSchema";

const responses = [
  "It is certain.",
  "It is decidedly so.",
  "Without a doubt.",
  "Yes, definitely.",
  "You may rely on it.",
  "As I see it, yes.",
  "Most likely.",
  "Outlook good.",
  "Yes.",
  "Signs point to yes.",

  "Reply hazy, try again.",
  "Ask again later.",
  "Better not tell you now.",
  "Cannot predict now.",
  "Concentrate and ask again.",

  "Don't count on it.",
  "My reply is no.",
  "My sources say no.",
  "Outlook not so good.",
  "Very doubtful.",
];

const command: CommandSchema = {
  name: "8ball",
  category: "Fun",
  description: "Ask the magic 8-ball a question.",
  params: "<question>",
  requireElevated: false,

  async run(params, message) {
    if (params.length === 0) {
      await message.reply({
        embeds: [
          new EmbedBuilder()
            .setColor(0x2D8A4E)
            .setDescription("Usage: `c!8ball <question>`"),
        ],
      });
      return;
    }

    const question = params.join(" ");
    const response = responses[Math.floor(Math.random() * responses.length)]!;

    await message.reply({
      embeds: [
        new EmbedBuilder()
          .setColor(0x2D8A4E)
          .setTitle(`🎱 ${question}`)
          .setDescription(response),
      ],
    });
  },
};

export default command;
