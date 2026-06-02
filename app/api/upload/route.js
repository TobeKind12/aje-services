import { writeFile } from "fs/promises";
import path from "path";

export async function POST(request) {
  const formData = await request.formData();
  const file = formData.get("file");

  if (!file) {
    return Response.json({ error: "Aucun fichier fourni" }, { status: 400 });
  }

  const ext = file.name.split(".").pop() || "jpg";
  const filename = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  const filepath = path.join(process.cwd(), "public", "uploads", filename);
  await writeFile(filepath, buffer);

  return Response.json({ url: `/uploads/${filename}` });
}
