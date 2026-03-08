import { EmbedBuilder } from "@fluxerjs/core";
import type { CommandSchema } from "../utils/CommandSchema";
import * as commands from "./index";

const allCommands = () => Object.values(commands) as CommandSchema[];

const CATEGORIES: { label: string; names: string[] }[] = [
  { label: "Moderation", names: ["kick", "ban", "unban", "timeout", "untimeout", "warn", "unwarn", "warnings"] },
  { label: "Economy",    names: ["balance", "daily", "give"] },
  { label: "Gambling",   names: ["coinflip"] },
  { label: "Leveling",   names: ["rank", "leaderboard"] },
  { label: "Fun",        names: ["8ball", "coin", "roll"] },
  { label: "General",    names: ["about", "ping", "help"] },
];

const command: CommandSchema = {
  name: "help",
  description: "List all commands or get info on a specific one.",
  params: "[command]",
  requireElevated: false,

  async run(params, message) {
    if (params.length === 0) {
      const cmds = allCommands();
      const embed = new EmbedBuilder()
        .setColor(0x2D8A4E)
        .setTitle("Capacitor Commands")
        .setDescription("Use `c!help <command>` for info on a specific command.");

      for (const category of CATEGORIES) {
        const lines = category.names
          .map((name) => cmds.find((c) => c.name === name))
          .filter((c): c is CommandSchema => c !== undefined)
          .map((c) => `\`c!${c.name}\` — ${c.description}`);

        if (lines.length > 0) {
          embed.addFields({ name: category.label, value: lines.join("\n") });
        }
      }

      await message.reply({ embeds: [embed] });
      return;
    }

    const name = params[0]!.toLowerCase();
    const cmd = allCommands().find((c) => c.name === name);

    if (!cmd) {
      await message.reply({
        embeds: [
          new EmbedBuilder()
            .setColor(0x2D8A4E)
            .setDescription(`No command named \`${name}\`.`),
        ],
      });
      return;
    }

    const usage = `c!${cmd.name}${cmd.params ? ` ${cmd.params}` : ""}`;
    const embed = new EmbedBuilder()
      .setColor(0x2D8A4E)
      .setTitle(`c!${cmd.name}`)
      .setDescription(cmd.description)
      .addFields({ name: "Usage", value: `\`${usage}\`` });

    if (cmd.additionalInfo) {
      embed.addFields({ name: "Info", value: cmd.additionalInfo });
    }

    await message.reply({ embeds: [embed] });
  },
};

export default command;
