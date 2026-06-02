import { promises as fs } from "fs";
import path from "path";

const dataFile = path.join(process.cwd(), "data", "categories.json");

async function getCategories() {
  const data = await fs.readFile(dataFile, "utf8");
  return JSON.parse(data);
}

async function saveCategories(categories) {
  await fs.writeFile(dataFile, JSON.stringify(categories, null, 2), "utf8");
}

export async function GET() {
  const categories = await getCategories();
  return Response.json(categories);
}

export async function POST(request) {
  const body = await request.json();
  const categories = await getCategories();

  const maxId = categories.reduce((max, c) => Math.max(max, c.id), 0);
  const category = {
    id: maxId + 1,
    name: body.name.toLowerCase().replace(/\s+/g, "-"),
    label: body.label,
  };

  categories.push(category);
  await saveCategories(categories);

  return Response.json(category, { status: 201 });
}
