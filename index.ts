import { Client, Events } from "@fluxerjs/core";
import CommandHandler from "./utils/CommandHandler";

const client = new Client({ intents: 0 });

client.on(Events.Ready, () => console.log("Ready!"));
client.on(Events.MessageCreate, async (message) => {
  CommandHandler(message);
});

await client.login(process.env.FLUXER_BOT_TOKEN!);
