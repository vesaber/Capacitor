import { Sequelize, DataTypes, Model, Op } from "sequelize";

const sequelize = new Sequelize({
  dialect: "sqlite",
  storage: "./data.db",
  logging: false,
});

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

export async function initDatabase(): Promise<void> {
  await sequelize.sync();
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