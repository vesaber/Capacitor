import { Client, Events } from "@fluxerjs/core";
import CommandHandler from "./utils/CommandHandler";
import { initDatabase } from "./database";

const client = new Client({
  intents: 0,
  rest: {
    // api: "https://fluxer.exeli.us/api" max come join us here (ur gonna be lonely) because fluxer fluxes up
    api: "https://fluxer.exeli.us/api"
  },
});

client.on(Events.Ready, () => console.log("Ready!"));
client.on(Events.MessageCreate, async (message) => {
  CommandHandler(message);
});

await initDatabase();
await client.login(process.env.FLUXER_BOT_TOKEN!);

// Shoutout max for the headstart