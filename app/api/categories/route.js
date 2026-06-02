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

export async function GET() {
  const categories = await getCategories();
  return Response.json(categories);
}

export async function POST(request) {
  const body = await request.json();
  const categories = await getCategories();
  const maxId = categories.reduce((max, c) => Math.max(max, c.id), 0);
  const name = body.label.toLowerCase().replace(/\s+/g, "-");
  const category = { id: maxId + 1, name, label: body.label };
  categories.push(category);
  await saveCategories(categories);
  return Response.json(category, { status: 201 });
}