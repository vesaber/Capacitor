import { initDatabase, addToBlacklist, removeFromBlacklist, getBlacklist } from "../database";

await initDatabase();

const [cmd, guildId, ...rest] = process.argv.slice(2);

switch (cmd) {
  case "add": {
    if (!guildId) {
      console.error("Usage: bun run blacklist add <guild_id> [reason...]");
      process.exit(1);
    }
    const reason = rest.join(" ") || undefined;
    await addToBlacklist(guildId, reason);
    console.log(`Blacklisted ${guildId}${reason ? ` — ${reason}` : ""}`);
    break;
  }

  case "remove": {
    if (!guildId) {
      console.error("Usage: bun run blacklist remove <guild_id>");
      process.exit(1);
    }
    const removed = await removeFromBlacklist(guildId);
    if (removed) {
      console.log(`Removed ${guildId} from blacklist`);
    } else {
      console.log(`${guildId} was not in the blacklist`);
    }
    break;
  }

  case "list": {
    const entries = await getBlacklist();
    if (entries.length === 0) {
      console.log("Blacklist is empty");
    } else {
      for (const { guild_id, reason, added_at } of entries) {
        const date = added_at.toISOString().split("T")[0];
        console.log(`${guild_id}  ${date}  ${reason ?? "(no reason)"}`);
      }
    }
    break;
  }

  default: {
    console.log("Commands:");
    console.log("  bun run blacklist add <guild_id> [reason...]");
    console.log("  bun run blacklist remove <guild_id>");
    console.log("  bun run blacklist list");
    process.exit(1);
  }
}

process.exit(0);
