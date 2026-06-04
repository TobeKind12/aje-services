import { Redis } from "@upstash/redis";

const kv = new Redis({
  url: process.env.KV_REST_API_URL,
  token: process.env.KV_REST_API_TOKEN,
});

const SITE_NAME = process.env.SITE_NAME || "AJE Services";

function formatOrderMessage(items, total, customerPhone) {
  let text = `🛒 *Nouvelle commande ${SITE_NAME}*\n\n`;
  items.forEach((item, i) => {
    text += `${i + 1}. ${item.name} x${item.quantity} = ${(item.price * item.quantity).toFixed(2)} FCFA\n`;
  });
  text += `\n*Total : ${total.toFixed(2)} FCFA*\n`;
  if (customerPhone) {
    text += `\n📞 Client : ${customerPhone}`;
  }
  text += `\n\n⏱ ${new Date().toLocaleString("fr-FR", { timeZone: "UTC" })}`;
  return text;
}

async function sendWhatsAppNotification(message) {
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
  const adminPhone = process.env.WHATSAPP_ADMIN_PHONE || process.env.NEXT_PUBLIC_WHATSAPP_PHONE;

  if (!phoneNumberId || !accessToken || !adminPhone) {
    console.log("WhatsApp notification skipped: missing env vars");
    return false;
  }

  const res = await fetch(
    `https://graph.facebook.com/v21.0/${phoneNumberId}/messages`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to: adminPhone,
        type: "text",
        text: { body: message },
      }),
    }
  );

  if (!res.ok) {
    const err = await res.text();
    console.error("WhatsApp API error:", err);
    return false;
  }

  return true;
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { items, total, customerPhone } = body;

    if (!items || !items.length) {
      return Response.json({ error: "Panier vide" }, { status: 400 });
    }

    const message = formatOrderMessage(items, total, customerPhone);

    if (kv) {
      const order = {
        id: Date.now(),
        items,
        total,
        customerPhone: customerPhone || null,
        status: "nouvelle",
        createdAt: new Date().toISOString(),
      };
      const orders = (await kv.get("orders")) || [];
      orders.push(order);
      await kv.set("orders", orders);
    }

    await sendWhatsAppNotification(message);

    return Response.json({ success: true });
  } catch (err) {
    console.error("Order error:", err);
    return Response.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function GET() {
  if (!kv) {
    return Response.json({ error: "Redis non configuré" }, { status: 500 });
  }
  const orders = (await kv.get("orders")) || [];
  return Response.json(orders);
}
