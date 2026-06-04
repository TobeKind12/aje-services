import { Redis } from "@upstash/redis";
import nodemailer from "nodemailer";

const kv = new Redis({
  url: process.env.KV_REST_API_URL,
  token: process.env.KV_REST_API_TOKEN,
});

const SITE_NAME = process.env.SITE_NAME || "AJE Services";

function formatEmailHTML(items, total, customerPhone) {
  const rows = items.map(
    (item) => `
      <tr>
        <td style="padding:10px;border-bottom:1px solid #eee">${item.name}</td>
        <td style="padding:10px;border-bottom:1px solid #eee;text-align:center">${item.quantity}</td>
        <td style="padding:10px;border-bottom:1px solid #eee;text-align:right">${(item.price * item.quantity).toFixed(2)} FCFA</td>
      </tr>`
  ).join("");

  return `
    <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:20px">
      <h2 style="color:#b8944e;">Nouvelle commande ${SITE_NAME}</h2>
      <table style="width:100%;border-collapse:collapse;margin:16px 0">
        <thead>
          <tr style="background:#f5f3f0">
            <th style="padding:10px;text-align:left">Produit</th>
            <th style="padding:10px;text-align:center">Qté</th>
            <th style="padding:10px;text-align:right">Sous-total</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
        <tfoot>
          <tr>
            <td colspan="2" style="padding:10px;font-weight:bold;text-align:right">Total</td>
            <td style="padding:10px;font-weight:bold;text-align:right;color:#b8944e;font-size:1.1em">${total.toFixed(2)} FCFA</td>
          </tr>
        </tfoot>
      </table>
      ${customerPhone ? `<p style="color:#666">📞 Téléphone client : <strong>${customerPhone}</strong></p>` : ""}
      <p style="color:#999;font-size:0.85em">${new Date().toLocaleString("fr-FR", { timeZone: "UTC" })}</p>
    </div>`;
}

async function sendEmail(items, total, customerPhone) {
  const adminEmail = process.env.ADMIN_EMAIL;
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;

  if (!adminEmail || !smtpUser || !smtpPass) {
    console.log("Email notification skipped: missing SMTP_USER, SMTP_PASS, or ADMIN_EMAIL");
    return false;
  }

  try {
    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 465,
      secure: true,
      auth: { user: smtpUser, pass: smtpPass },
    });

    await transporter.sendMail({
      from: `${SITE_NAME} <${smtpUser}>`,
      to: adminEmail,
      subject: `Nouvelle commande ${SITE_NAME} — ${total.toFixed(2)} FCFA`,
      html: formatEmailHTML(items, total, customerPhone),
    });

    return true;
  } catch (err) {
    console.error("Email error:", err);
    return false;
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { items, total, customerPhone } = body;

    if (!items || !items.length) {
      return Response.json({ error: "Panier vide" }, { status: 400 });
    }

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

    await sendEmail(items, total, customerPhone);

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
