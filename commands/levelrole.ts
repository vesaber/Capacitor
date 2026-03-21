import { EmbedBuilder } from "@fluxerjs/core";
import type { CommandSchema } from "../utils/CommandSchema";
import { Permissions } from "../utils/CommandSchema";
import { getLevelRoles, setLevelRole, removeLevelRole } from "../database";

function parseRoleMention(str: string): string | null {
  const match = str.match(/^<@&(\d+)>$/) ?? str.match(/^(\d+)$/);
  return match?.[1] ?? null;
}

const command: CommandSchema = {
  name: "levelrole",
  category: "Leveling",
  description: "Manage roles assigned when users reach a level.",
  params: "<add <level> <@role> | remove <level> | list>",
  requireElevated: [Permissions.ManageRoles],

  async run(params, message) {
    if (!message.guildId) {
      await message.reply({
        embeds: [new EmbedBuilder().setColor(0x2D8A4E).setDescription("This command can only be used in a server.")],
      });
      return;
    }

    const sub = params[0]?.toLowerCase();

    if (sub === "list") {
      const roles = await getLevelRoles(message.guildId);
      if (roles.length === 0) {
        await message.reply({
          embeds: [new EmbedBuilder().setColor(0x2D8A4E).setDescription("No level roles configured.")],
        });
        return;
      }
      const lines = roles.map((r) => `**Level ${r.level}** → <@&${r.role_id}>`).join("\n");
      await message.reply({
        embeds: [new EmbedBuilder().setColor(0x2D8A4E).setTitle("Level Roles").setDescription(lines)],
      });
      return;
    }

    if (sub === "add") {
      const level = parseInt(params[1] ?? "");
      const roleId = parseRoleMention(params[2] ?? "");
      if (isNaN(level) || level < 1 || !roleId) {
        await message.reply({
          embeds: [new EmbedBuilder().setColor(0x2D8A4E).setDescription("Usage: `c!levelrole add <level> <@role>`")],
        });
        return;
      }
      await setLevelRole(message.guildId, level, roleId);
      await message.reply({
        embeds: [new EmbedBuilder().setColor(0x2D8A4E).setDescription(`<@&${roleId}> will be assigned when users reach **Level ${level}**.`)],
      });
      return;
    }

    if (sub === "remove") {
      const level = parseInt(params[1] ?? "");
      if (isNaN(level) || level < 1) {
        await message.reply({
          embeds: [new EmbedBuilder().setColor(0x2D8A4E).setDescription("Usage: `c!levelrole remove <level>`")],
        });
        return;
      }
      const removed = await removeLevelRole(message.guildId, level);
      await message.reply({
        embeds: [
          new EmbedBuilder()
            .setColor(0x2D8A4E)
            .setDescription(removed ? `Level role for **Level ${level}** removed.` : `No level role was set for **Level ${level}**.`),
        ],
      });
      return;
    }

    await message.reply({
      embeds: [
        new EmbedBuilder()
          .setColor(0x2D8A4E)
          .setTitle("Usage")
          .setDescription(
            "`c!levelrole add <level> <@role>` — Set a role for a level\n" +
            "`c!levelrole remove <level>` — Remove a level role\n" +
            "`c!levelrole list` — Show all configured level roles"
          ),
      ],
    });
  },
};

export default command;
