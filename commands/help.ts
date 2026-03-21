import { EmbedBuilder } from "@fluxerjs/core";
import type { CommandSchema } from "../utils/CommandSchema";
import { Permissions, PERM_BITS } from "../utils/CommandSchema";
import * as commands from "./index";

const allCommands = () => Object.values(commands) as CommandSchema[];

const CATEGORY_ORDER = ["Moderation", "Economy", "Leveling", "Gambling", "Fun", "General"];

const command: CommandSchema = {
  name: "help",
  category: "General",
  description: "List all commands or get info on a specific one.",
  params: "[command]",
  requireElevated: false,

  async run(params, message) {
    if (params.length === 0) {
      let userPerms = 0n;
      let botPerms = 0n;
      if (message.guildId && message.guild) {
        try {
          const [member, botMember] = await Promise.all([
            message.guild.fetchMember(message.author.id),
            message.guild.fetchMember(message.client.user!.id),
          ]);
          userPerms = member.permissions.bitfield;
          botPerms = botMember.permissions.bitfield;
        } catch {}
      }

      const hasPerms = (perms: bigint, required: Permissions[]) =>
        required.every((p) => {
          const bit = PERM_BITS[Permissions[p]];
          return bit === undefined || (perms & bit) !== 0n;
        });

      const canUse = (cmd: CommandSchema) => {
        if (cmd.requireElevated === false) return true;
        return hasPerms(userPerms, cmd.requireElevated) && hasPerms(botPerms, cmd.requireElevated);
      };

      const cmds = allCommands().filter(canUse);

      const grouped = new Map<string, CommandSchema[]>();
      for (const cmd of cmds) {
        const cat = cmd.category ?? "Other";
        if (!grouped.has(cat)) grouped.set(cat, []);
        grouped.get(cat)!.push(cmd);
      }

      const known = CATEGORY_ORDER.filter((c) => grouped.has(c));
      const extra = [...grouped.keys()].filter((c) => !CATEGORY_ORDER.includes(c)).sort();

      const embed = new EmbedBuilder()
        .setColor(0x2D8A4E)
        .setTitle("Capacitor Commands")
        .setDescription("Use `c!help <command>` for info on a specific command.");

      for (const cat of [...known, ...extra]) {
        const lines = grouped.get(cat)!.map((c) => `\`c!${c.name}\` — ${c.description}`);
        embed.addFields({ name: cat, value: lines.join("\n") });
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
