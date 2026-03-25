import { Sequelize, DataTypes, Model, Op } from "sequelize";

const sequelize = new Sequelize({
  dialect: "sqlite",
  storage: "./data/data.db",
  logging: false,
});

function xpForLevel(n: number): number {
  if (n === 0) return 0;
  return (5 * n) ** 2 + 50 * (n - 1) + 100;
}

export function computeLevel(xp: number): number {
  let lvl = 0;
  while (xp >= xpForLevel(lvl)) lvl++;
  return lvl;
}

export class Warn extends Model {
  declare id: string;
  declare guildId: string;
  declare userId: string;
  declare moderatorId: string;
  declare reason: string;
  declare expiresAt: Date;
  declare createdAt: Date;
}

Warn.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    guildId: { type: DataTypes.STRING, allowNull: false },
    userId: { type: DataTypes.STRING, allowNull: false },
    moderatorId: { type: DataTypes.STRING, allowNull: false },
    reason: { type: DataTypes.TEXT, allowNull: false },
    expiresAt: { type: DataTypes.DATE, allowNull: false },
  },
  { sequelize, modelName: "Warn" }
);

export class UserLevel extends Model {
  declare guild_id: string;
  declare user_id: string;
  declare xp: number;
  declare opted_out: boolean;
}

UserLevel.init(
  {
    guild_id: { type: DataTypes.STRING, allowNull: false },
    user_id: { type: DataTypes.STRING, allowNull: false },
    xp: { type: DataTypes.INTEGER, defaultValue: 0 },
    opted_out: { type: DataTypes.BOOLEAN, defaultValue: false },
  },
  {
    sequelize,
    modelName: "UserLevel",
    indexes: [{ unique: true, fields: ["guild_id", "user_id"] }],
  }
);

export class GuildConfig extends Model {
  declare guild_id: string;
  declare level_channel_id: string | null;
}

GuildConfig.init(
  {
    guild_id: { type: DataTypes.STRING, primaryKey: true },
    level_channel_id: { type: DataTypes.STRING, allowNull: true },
  },
  { sequelize, modelName: "GuildConfig" }
);

export class LevelRole extends Model {
  declare guild_id: string;
  declare level: number;
  declare role_id: string;
}

LevelRole.init(
  {
    guild_id: { type: DataTypes.STRING, allowNull: false },
    level: { type: DataTypes.INTEGER, allowNull: false },
    role_id: { type: DataTypes.STRING, allowNull: false },
  },
  {
    sequelize,
    modelName: "LevelRole",
    indexes: [{ unique: true, fields: ["guild_id", "level"] }],
  }
);

export class UserBalance extends Model {
  declare guild_id: string;
  declare user_id: string;
  declare balance: number;
  declare last_daily: Date | null;
}

UserBalance.init(
  {
    guild_id: { type: DataTypes.STRING, allowNull: false },
    user_id: { type: DataTypes.STRING, allowNull: false },
    balance: { type: DataTypes.INTEGER, defaultValue: 0 },
    last_daily: { type: DataTypes.DATE, allowNull: true },
  },
  {
    sequelize,
    modelName: "UserBalance",
    indexes: [{ unique: true, fields: ["guild_id", "user_id"] }],
  }
);

export class GuildBlacklist extends Model {
  declare guild_id: string;
  declare reason: string | null;
  declare added_at: Date;
}

GuildBlacklist.init(
  {
    guild_id: { type: DataTypes.STRING, primaryKey: true },
    reason: { type: DataTypes.TEXT, allowNull: true },
    added_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  },
  { sequelize, modelName: "GuildBlacklist", timestamps: false }
);

export async function initDatabase(): Promise<void> {
  await sequelize.sync();
}

export async function isBlacklisted(guildId: string): Promise<boolean> {
  const row = await GuildBlacklist.findOne({ where: { guild_id: guildId } });
  return row !== null;
}

export async function addToBlacklist(guildId: string, reason?: string): Promise<void> {
  await GuildBlacklist.upsert({ guild_id: guildId, reason: reason ?? null, added_at: new Date() });
}

export async function removeFromBlacklist(guildId: string): Promise<boolean> {
  const deleted = await GuildBlacklist.destroy({ where: { guild_id: guildId } });
  return deleted > 0;
}

export async function getBlacklist(): Promise<Array<{ guild_id: string; reason: string | null; added_at: Date }>> {
  const rows = await GuildBlacklist.findAll({ order: [["added_at", "DESC"]] });
  return rows.map((r) => ({ guild_id: r.guild_id, reason: r.reason, added_at: r.added_at }));
}

export async function getBalance(guildId: string, userId: string): Promise<number> {
  const [row] = await UserBalance.findOrCreate({
    where: { guild_id: guildId, user_id: userId },
    defaults: { balance: 0, last_daily: null },
  });
  return row.balance;
}

export async function addBalance(guildId: string, userId: string, amount: number): Promise<number> {
  const [row] = await UserBalance.findOrCreate({
    where: { guild_id: guildId, user_id: userId },
    defaults: { balance: 0, last_daily: null },
  });
  row.balance = Math.max(0, row.balance + amount);
  await row.save();
  return row.balance;
}

export async function deleteBalance(guildId: string, userId: string, amount: number): Promise<number> {
  const [row] = await UserBalance.findOrCreate({
    where: { guild_id: guildId, user_id: userId },
    defaults: { balance: 0, last_daily: null },
  });
  row.balance = Math.max(0, row.balance - amount);
  await row.save();
  return row.balance;
}

export async function transferBalance(
  guildId: string,
  fromId: string,
  toId: string,
  amount: number
): Promise<{ fromBalance: number; toBalance: number }> {
  const [fromRow] = await UserBalance.findOrCreate({
    where: { guild_id: guildId, user_id: fromId },
    defaults: { balance: 0, last_daily: null },
  });
  if (fromRow.balance < amount) {
    throw new Error("Insufficient balance");
  }
  const [toRow] = await UserBalance.findOrCreate({
    where: { guild_id: guildId, user_id: toId },
    defaults: { balance: 0, last_daily: null },
  });
  fromRow.balance -= amount;
  toRow.balance += amount;
  await Promise.all([fromRow.save(), toRow.save()]);
  return { fromBalance: fromRow.balance, toBalance: toRow.balance };
}

const DAILY_COOLDOWN_MS = 24 * 60 * 60 * 1000;

export async function claimDaily(
  guildId: string,
  userId: string
): Promise<{ coins: number; nextDaily: Date } | null> {
  const [row] = await UserBalance.findOrCreate({
    where: { guild_id: guildId, user_id: userId },
    defaults: { balance: 0, last_daily: null },
  });
  const now = new Date();
  if (row.last_daily && now.getTime() - row.last_daily.getTime() < DAILY_COOLDOWN_MS) {
    return null;
  }
  const coins = Math.floor(Math.random() * 101) + 150;
  row.balance += coins;
  row.last_daily = now;
  await row.save();
  return { coins, nextDaily: new Date(now.getTime() + DAILY_COOLDOWN_MS) };
}

export async function getEconomyLeaderboard(
  guildId: string
): Promise<Array<{ user_id: string; balance: number }>> {
  const rows = await UserBalance.findAll({
    where: { guild_id: guildId },
    order: [["balance", "DESC"]],
  });
  return rows.map((r) => ({ user_id: r.user_id, balance: r.balance }));
}

export async function getEconomyRank(guildId: string, userId: string): Promise<number> {
  const target = await UserBalance.findOne({ where: { guild_id: guildId, user_id: userId } });
  if (!target) return -1;
  const above = await UserBalance.count({
    where: { guild_id: guildId, balance: { [Op.gt]: target.balance } },
  });
  return above + 1;
}

export async function getUserLevel(
  guildId: string,
  userId: string
): Promise<{ xp: number; level: number }> {
  const [row] = await UserLevel.findOrCreate({
    where: { guild_id: guildId, user_id: userId },
    defaults: { xp: 0 },
  });
  const xp = row.xp;
  return { xp, level: computeLevel(xp) };
}

export async function addXP(
  guildId: string,
  userId: string,
  amount: number
): Promise<{ before: number; after: number }> {
  const [row] = await UserLevel.findOrCreate({
    where: { guild_id: guildId, user_id: userId },
    defaults: { xp: 0 },
  });
  const before = computeLevel(row.xp);
  row.xp += amount;
  await row.save();
  const after = computeLevel(row.xp);
  return { before, after };
}

export async function getLeaderboard(
  guildId: string
): Promise<Array<{ user_id: string; xp: number; level: number }>> {
  const rows = await UserLevel.findAll({
    where: { guild_id: guildId, opted_out: false },
    order: [["xp", "DESC"]],
  });
  return rows.map((r) => ({ user_id: r.user_id, xp: r.xp, level: computeLevel(r.xp) }));
}

export async function getRank(guildId: string, userId: string): Promise<number> {
  const target = await UserLevel.findOne({ where: { guild_id: guildId, user_id: userId } });
  if (!target) return -1;
  const above = await UserLevel.count({
    where: { guild_id: guildId, xp: { [Op.gt]: target.xp }, opted_out: false },
  });
  return above + 1;
}

export async function createWarn(
  guildId: string,
  userId: string,
  moderatorId: string,
  reason: string,
  expiresAt: Date
): Promise<string> {
  const warn = await Warn.create({ guildId, userId, moderatorId, reason, expiresAt });
  return warn.id;
}

export async function getActiveWarns(guildId: string, userId: string): Promise<Warn[]> {
  return Warn.findAll({
    where: {
      guildId,
      userId,
      expiresAt: { [Op.gt]: new Date() },
    },
    order: [["createdAt", "ASC"]],
  });
}

export async function deleteWarn(guildId: string, warnId: string): Promise<boolean> {
  const deleted = await Warn.destroy({ where: { id: warnId, guildId } });
  return deleted > 0;
}

export async function setOptOut(guildId: string, userId: string, value: boolean): Promise<void> {
  const [row] = await UserLevel.findOrCreate({
    where: { guild_id: guildId, user_id: userId },
    defaults: { xp: 0, opted_out: value },
  });
  row.opted_out = value;
  await row.save();
}

export async function isOptedOut(guildId: string, userId: string): Promise<boolean> {
  const row = await UserLevel.findOne({ where: { guild_id: guildId, user_id: userId } });
  return row?.opted_out ?? false;
}

export async function getLevelChannel(guildId: string): Promise<string | null> {
  const row = await GuildConfig.findOne({ where: { guild_id: guildId } });
  return row?.level_channel_id ?? null;
}

export async function setLevelChannel(guildId: string, channelId: string | null): Promise<void> {
  await GuildConfig.upsert({ guild_id: guildId, level_channel_id: channelId });
}

export async function getLevelRole(guildId: string, level: number): Promise<string | null> {
  const row = await LevelRole.findOne({ where: { guild_id: guildId, level } });
  return row?.role_id ?? null;
}

export async function setLevelRole(guildId: string, level: number, roleId: string): Promise<void> {
  await LevelRole.upsert({ guild_id: guildId, level, role_id: roleId });
}

export async function removeLevelRole(guildId: string, level: number): Promise<boolean> {
  const deleted = await LevelRole.destroy({ where: { guild_id: guildId, level } });
  return deleted > 0;
}

export async function getLevelRoles(guildId: string): Promise<Array<{ level: number; role_id: string }>> {
  const rows = await LevelRole.findAll({
    where: { guild_id: guildId },
    order: [["level", "ASC"]],
  });
  return rows.map((r) => ({ level: r.level, role_id: r.role_id }));
}
