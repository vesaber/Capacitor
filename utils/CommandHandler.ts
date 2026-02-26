import { Message } from "@fluxerjs/core";
import * as commands from "../commands";

export async function CommandHandler(message: Message) {
  Object.keys(commands).forEach((command) => {});
}

export default CommandHandler;
