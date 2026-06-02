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

export async function GET(request, { params }) {
  const { id: idStr } = await params;
  const id = Number(idStr);
  const products = await getProducts();
  const product = products.find((p) => p.id === id);
  if (!product) {
    return Response.json({ error: "Produit non trouvé" }, { status: 404 });
  }
  return Response.json(product);
}

export async function PUT(request, { params }) {
  const { id: idStr } = await params;
  const id = Number(idStr);
  const body = await request.json();
  const products = await getProducts();

  const index = products.findIndex((p) => p.id === id);
  if (index === -1) {
    return Response.json({ error: "Produit non trouvé" }, { status: 404 });
  }

  products[index] = {
    ...products[index],
    name: body.name ?? products[index].name,
    description: body.description ?? products[index].description,
    price: body.price !== undefined ? Number.parseFloat(body.price) : products[index].price,
    category: body.category ?? products[index].category,
    image: body.image !== undefined ? body.image : products[index].image,
    stock: body.stock !== undefined ? body.stock : products[index].stock,
    featured: body.featured !== undefined ? body.featured : products[index].featured,
  };

  await saveProducts(products);
  return Response.json(products[index]);
}

export async function DELETE(request, { params }) {
  const { id: idStr } = await params;
  const id = Number(idStr);
  const products = await getProducts();

  const index = products.findIndex((p) => p.id === id);
  if (index === -1) {
    return Response.json({ error: "Produit non trouvé" }, { status: 404 });
  }

  products.splice(index, 1);
  await saveProducts(products);

  return Response.json({ message: "Produit supprimé" });
}
