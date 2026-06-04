"use client";

import { useState, useEffect } from "react";

export default function CartPage() {
  const [cart, setCart] = useState([]);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [stockIssues, setStockIssues] = useState({});
  const [customerPhone, setCustomerPhone] = useState("");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    function loadCart() {
      setCart(JSON.parse(localStorage.getItem("cart") || "[]"));
    }
    loadCart();
    window.addEventListener("cartUpdated", loadCart);
    return () => window.removeEventListener("cartUpdated", loadCart);
  }, []);

  useEffect(() => {
    async function checkStock() {
      const res = await fetch("/api/products");
      const products = await res.json();
      const issues = {};
      const newCart = JSON.parse(localStorage.getItem("cart") || "[]");
      for (const item of newCart) {
        const product = products.find((p) => p.id === item.id);
        if (!product || !product.stock) {
          issues[item.id] = true;
        }
      }
      setStockIssues(issues);
    }
    checkStock();
  }, [cart]);

  function updateQuantity(id, delta) {
    const newCart = cart
      .map((item) =>
        item.id === id
          ? { ...item, quantity: Math.max(0, item.quantity + delta) }
          : item
      )
      .filter((item) => item.quantity > 0);
    setCart(newCart);
    localStorage.setItem("cart", JSON.stringify(newCart));
    window.dispatchEvent(new Event("cartUpdated"));
  }

  function removeItem(id) {
    const newCart = cart.filter((item) => item.id !== id);
    setCart(newCart);
    localStorage.setItem("cart", JSON.stringify(newCart));
    window.dispatchEvent(new Event("cartUpdated"));
    setStockIssues((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
  }

  const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const hasStockIssue = Object.keys(stockIssues).length > 0;

  async function whatsappOrder() {
    const res = await fetch("/api/products");
    const products = await res.json();
    const outOfStock = cart.filter((item) => {
      const product = products.find((p) => p.id === item.id);
      return !product || !product.stock;
    });
    if (outOfStock.length > 0) {
      setError(`Certains produits ne sont plus disponibles : ${outOfStock.map((i) => i.name).join(", ")}. Veuillez les retirer du panier.`);
      return;
    }
    setError("");
    setSending(true);

    try {
      await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: cart,
          total,
          customerPhone: customerPhone || null,
        }),
      });
    } catch (e) {
      console.error("Order notification error:", e);
    }

    const phone = process.env.NEXT_PUBLIC_WHATSAPP_PHONE || "2250749408449";
    let text = "Bonjour ! Je souhaite commander :\n\n";
    cart.forEach((item) => {
      text += `- ${item.name} x${item.quantity} = ${(item.price * item.quantity).toFixed(2)} FCFA\n`;
    });
    text += `\nTotal : ${total.toFixed(2)} FCFA\n\n`;
    if (customerPhone) text += `📞 ${customerPhone}\n\n`;
    text += "Merci !";
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(text)}`, "_blank");
    setMessage("Redirection vers WhatsApp...");
    setSending(false);
  }

  return (
    <div className="container">
      <h1 className="page-title">Votre Panier</h1>
      <p className="page-subtitle">Révisez votre commande avant de commander</p>

      {message && <div className="success-msg">{message}</div>}
      {error && <div className="error-msg">{error}</div>}

      {cart.length === 0 ? (
        <div className="empty-state">
          <h2>Votre panier est vide</h2>
          <p>Parcourez notre boutique pour ajouter des articles.</p>
        </div>
      ) : (
        <>
          <div className="cart-items">
              {cart.map((item) => (
                <div key={item.id} className={`cart-item${stockIssues[item.id] ? " stock-issue" : ""}`}>
                  <div className="cart-item-info">
                    <div className="cart-item-name">
                      {item.name}
                      {stockIssues[item.id] && <span className="stock-warning">Rupture de stock</span>}
                    </div>
                    <div className="cart-item-price">
                      {item.price.toFixed(2)} FCFA
                    </div>
                  </div>
                <div className="cart-item-qty">
                  <button className="qty-btn" onClick={() => updateQuantity(item.id, -1)}>
                    −
                  </button>
                  <span className="qty-value">{item.quantity}</span>
                  <button className="qty-btn" onClick={() => updateQuantity(item.id, 1)}>
                    +
                  </button>
                  <button className="btn btn-danger btn-sm" onClick={() => removeItem(item.id)}>
                    Supprimer
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="cart-total">
            <span className="cart-total-text">Total : {total.toFixed(2)} FCFA</span>
            <div style={{ display: "flex", flexDirection: "column", gap: 8, width: "100%" }}>
              <input
                type="tel"
                placeholder="Votre téléphone (optionnel)"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                style={{ padding: "10px 14px", border: "1px solid var(--border)", borderRadius: 6, fontSize: "0.9rem", width: "100%" }}
              />
              <button className={`btn btn-block ${hasStockIssue || sending ? "btn-disabled" : "btn-whatsapp"}`} onClick={whatsappOrder} disabled={hasStockIssue || sending}>
                {sending ? "Envoi en cours..." : hasStockIssue ? "Articles indisponibles" : "Commander via WhatsApp"}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
