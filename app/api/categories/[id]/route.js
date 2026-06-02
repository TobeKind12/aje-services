import { Redis } from "@upstash/redis";
import { promises as fs } from "fs";
import path from "path";

const DATA_FILE = path.join(process.cwd(), "data", "categories.json");

const kv = new Redis({
  url: process.env.KV_REST_API_URL,
  token: process.env.KV_REST_API_TOKEN,
});

async function getCategories() {
  const cached = await kv.get("categories");
  if (cached) return cached;
  const data = await fs.readFile(DATA_FILE, "utf8");
  const categories = JSON.parse(data);
  await kv.set("categories", categories);
  return categories;
}

async function saveCategories(categories) {
  await kv.set("categories", categories);
}

export async function DELETE(request, { params }) {
  const { id: idStr } = await params;
  const id = Number(idStr);
  const categories = await getCategories();
  const index = categories.findIndex((c) => c.id === id);
  if (index === -1) {
    return Response.json({ error: "Catégorie non trouvée" }, { status: 404 });
  }
  categories.splice(index, 1);
  await saveCategories(categories);
  return Response.json({ message: "Catégorie supprimée" });
}