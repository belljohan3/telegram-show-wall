import TelegramBot from "node-telegram-bot-api";
import axios from "axios";
import fs from "fs";
import path from "path";
import { PhotoItem } from "./types.js";

type BotDeps = {
  token: string;
  addPending: (item: PhotoItem) => void;
  publicBaseUrl: string;
};

export function initBot({ token, addPending, publicBaseUrl }: BotDeps) {
  const bot = new TelegramBot(token, { polling: true });

  bot.on("photo", async (msg) => {
    try {
      const chatId = msg.chat.id;
      const photos = msg.photo;
      if (!photos || photos.length === 0) return;

      // On prend la meilleure résolution (la dernière)
      const best = photos[photos.length - 1];
      const fileId = best.file_id;

      const fileLink = await bot.getFileLink(fileId);
      const filename = `${Date.now()}_${fileId}.jpg`;
      const uploadDir = path.join(process.cwd(), "uploads");
      if (!fs.existsSync(uploadDir))
        fs.mkdirSync(uploadDir, { recursive: true });
      const filePath = path.join(uploadDir, filename);

      const writer = fs.createWriteStream(filePath);
      const resp = await axios.get(fileLink, { responseType: "stream" });
      resp.data.pipe(writer);
      await new Promise<void>((resolve, reject) => {
        writer.on("finish", () => resolve());
        writer.on("error", reject);
      });

      const item: PhotoItem = {
        id: `${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
        filename,
        url: `${publicBaseUrl}/uploads/${filename}`,
        caption: msg.caption || undefined,
        uploader:
          `${msg.from?.first_name || ""} ${msg.from?.last_name || ""}`.trim() ||
          msg.from?.username ||
          String(chatId),
        createdAt: Date.now(),
      };

      addPending(item);

      await bot.sendMessage(
        chatId,
        "📸 Merci ! Ta photo a été reçue et attend une approbation."
      );
    } catch (err) {
      console.error("Erreur réception photo:", err);
    }
  });

  bot.onText(/\/start/, (msg) => {
    bot.sendMessage(
      msg.chat.id,
      "Bienvenue ! Envoie simplement une photo à ce bot pour la proposer à l'affichage."
    );
  });

  return bot;
}
