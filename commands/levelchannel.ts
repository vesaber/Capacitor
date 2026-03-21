import { EmbedBuilder } from "@fluxerjs/core";
import type { CommandSchema } from "../utils/CommandSchema";
import { Permissions } from "../utils/CommandSchema";
import { setLevelChannel } from "../database";

function parseChannelMention(str: string): string | null {
  const match = str.match(/^<#(\d+)>$/) ?? str.match(/^(\d+)$/);
  return match?.[1] ?? null;
}

const command: CommandSchema = {
  name: "levelchannel",
  category: "Leveling",
  description: "Set or clear the channel for level-up announcements.",
  params: "[#channel | off]",
  requireElevated: [Permissions.ManageChannels],

  async run(params, message) {
    if (!message.guildId) {
      await message.reply({
        embeds: [new EmbedBuilder().setColor(0x2D8A4E).setDescription("This command can only be used in a server.")],
      });
      return;
    }

    const arg = params[0]?.toLowerCase();
    if (!arg || arg === "off") {
      await setLevelChannel(message.guildId, null);
      await message.reply({
        embeds: [new EmbedBuilder().setColor(0x2D8A4E).setDescription("Level-up announcements will be sent in the channel where the message was sent.")],
      });
      return;
    }

    const channelId = parseChannelMention(params[0]!);
    if (!channelId) {
      await message.reply({
        embeds: [new EmbedBuilder().setColor(0x2D8A4E).setDescription("Invalid channel. Usage: `c!levelchannel [#channel | off]`")],
      });
      return;
    }

    await setLevelChannel(message.guildId, channelId);
    await message.reply({
      embeds: [new EmbedBuilder().setColor(0x2D8A4E).setDescription(`Level-up announcements will now be sent to <#${channelId}>.`)],
    });
  },
};

export default command;
