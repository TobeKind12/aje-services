export async function POST(request) {
  const body = await request.json();
  const adminPassword = process.env.ADMIN_PASSWORD || "admin123";

  if (body.password === adminPassword) {
    const token = Buffer.from(`admin:${adminPassword}`).toString("base64");

    return Response.json({ success: true, token });
  }

  return Response.json({ success: false }, { status: 401 });
}
