import { Message } from "@fluxerjs/core";

export enum Permissions {
  ManageRoles,
  BanMembers,
  ManageNicknames,
  ManageWebhooks,
  SendTTSMessages,
  EmbedLinks,
  PingMentions, // Use @everyone/@here and @here
  AddReactions,
  JoinVoice,
  UseVoiceActivity,
  DeafenMembers,
  ViewActivityLog,
  ManageChannels,
  CreateInviteLinks,
  CreateEmojisStickers,
  ViewChannel,
  ManageMessages,
  AttachFiles,
  UseExternalEmoji,
  BypassSlowmode,
  Speak,
  PrioritySpeaker,
  MoveMembers,
  ManageCommunity,
  KickMembers,
  ChangeOwnNickname,
  ManageEmojisStickers,
  SendMessages,
  PinMessages,
  ReadMessageHistory,
  UseExternalStickers,
  ModerateMembers,
  StreamVideo,
  MuteMembers,
  SetVoiceRegion,
}

export type CommandSchema = {
  name: string;
  description: string;
  requireElevated: Permissions[] | false;
  requireOwner?: boolean;
  requireWhitelist?: boolean;
  params?: string;
  additionalInfo?: string;
  run: (params: string[], message: Message) => Promise<void>;
};
