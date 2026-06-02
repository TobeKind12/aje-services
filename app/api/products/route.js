import { promises as fs } from "fs";
import path from "path";

const dataFile = path.join(process.cwd(), "data", "products.json");

async function getProducts() {
  const data = await fs.readFile(dataFile, "utf8");
  return JSON.parse(data);
}

async function saveProducts(products) {
  await fs.writeFile(dataFile, JSON.stringify(products, null, 2), "utf8");
}

export async function GET() {
  const products = await getProducts();
  return Response.json(products);
}

export async function POST(request) {
  const body = await request.json();
  const products = await getProducts();

  const maxId = products.reduce((max, p) => Math.max(max, p.id), 0);
  const product = {
    id: maxId + 1,
    name: body.name,
    description: body.description,
    price: Number.parseFloat(body.price),
    category: body.category,
    image: body.image || null,
    stock: body.stock !== undefined ? body.stock : true,
    featured: body.featured !== undefined ? body.featured : false,
    createdAt: new Date().toISOString(),
  };

  products.push(product);
  await saveProducts(products);

  return Response.json(product, { status: 201 });
}
