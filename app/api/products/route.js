import { Redis } from "@upstash/redis";
import { promises as fs } from "fs";
import path from "path";

const DATA_FILE = path.join(process.cwd(), "data", "products.json");

const kv = new Redis({
  url: process.env.KV_REST_API_URL,
  token: process.env.KV_REST_API_TOKEN,
});

async function getProducts() {
  const cached = await kv.get("products");
  if (cached) return cached;
  const data = await fs.readFile(DATA_FILE, "utf8");
  const products = JSON.parse(data);
  await kv.set("products", products);
  return products;
}

async function saveProducts(products) {
  await kv.set("products", products);
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