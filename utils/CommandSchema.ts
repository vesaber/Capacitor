import { Message } from "@fluxerjs/core";
import { PermissionFlags } from "@fluxerjs/util";

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

export const PERM_BITS: Partial<Record<string, bigint>> = {
  ManageRoles:          PermissionFlags.ManageRoles,
  BanMembers:           PermissionFlags.BanMembers,
  KickMembers:          PermissionFlags.KickMembers,
  ManageNicknames:      PermissionFlags.ManageNicknames,
  ManageWebhooks:       PermissionFlags.ManageWebhooks,
  SendTTSMessages:      PermissionFlags.SendTtsMessages,
  EmbedLinks:           PermissionFlags.EmbedLinks,
  PingMentions:         PermissionFlags.MentionEveryone,
  AddReactions:         PermissionFlags.AddReactions,
  JoinVoice:            PermissionFlags.Connect,
  UseVoiceActivity:     PermissionFlags.UseVad,
  DeafenMembers:        PermissionFlags.DeafenMembers,
  ViewActivityLog:      PermissionFlags.ViewAuditLog,
  ManageChannels:       PermissionFlags.ManageChannels,
  ManageCommunity:      PermissionFlags.ManageGuild,
  CreateInviteLinks:    PermissionFlags.CreateInstantInvite,
  CreateEmojisStickers: PermissionFlags.CreateExpressions,
  ViewChannel:          PermissionFlags.ViewChannel,
  ManageMessages:       PermissionFlags.ManageMessages,
  AttachFiles:          PermissionFlags.AttachFiles,
  UseExternalEmoji:     PermissionFlags.UseExternalEmojis,
  UseExternalStickers:  PermissionFlags.UseExternalStickers,
  BypassSlowmode:       PermissionFlags.BypassSlowmode,
  Speak:                PermissionFlags.Speak,
  PrioritySpeaker:      PermissionFlags.PrioritySpeaker,
  MoveMembers:          PermissionFlags.MoveMembers,
  ChangeOwnNickname:    PermissionFlags.ChangeNickname,
  ManageEmojisStickers: PermissionFlags.ManageEmojisAndStickers,
  SendMessages:         PermissionFlags.SendMessages,
  PinMessages:          PermissionFlags.PinMessages,
  ReadMessageHistory:   PermissionFlags.ReadMessageHistory,
  ModerateMembers:      PermissionFlags.ModerateMembers,
  StreamVideo:          PermissionFlags.Stream,
  MuteMembers:          PermissionFlags.MuteMembers,
  SetVoiceRegion:       PermissionFlags.UpdateRtcRegion,
};

export type CommandSchema = {
  name: string;
  description: string;
  category: string;
  requireElevated: Permissions[] | false;
  requireOwner?: boolean;
  requireWhitelist?: boolean;
  params?: string;
  additionalInfo?: string;
  run: (params: string[], message: Message) => Promise<void>;
};
