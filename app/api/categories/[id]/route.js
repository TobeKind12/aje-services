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
