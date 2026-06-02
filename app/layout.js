"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import "./globals.css";

function NavBar() {
  const [cartCount, setCartCount] = useState(0);
  const pathname = usePathname();

  useEffect(() => {
    function update() {
      const cart = JSON.parse(localStorage.getItem("cart") || "[]");
      setCartCount(cart.reduce((sum, item) => sum + item.quantity, 0));
    }
    update();
    window.addEventListener("cartUpdated", update);
    return () => window.removeEventListener("cartUpdated", update);
  }, []);

  function isActive(href) {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  }

  return (
    <nav className="navbar">
      <div className="navbar-inner">
        <Link href="/" className="navbar-brand">
          <img src="/logo.png" alt="AJE Services" className="navbar-logo" />
        </Link>
        <ul className="navbar-links">
          <li><Link href="/" className={isActive("/") ? "active" : ""}>Boutique</Link></li>
          <li><Link href="/panier" className={isActive("/panier") ? "active" : ""}>Panier {cartCount > 0 && <span className="cart-badge">{cartCount}</span>}</Link></li>
          <li><Link href="/contact" className={isActive("/contact") ? "active" : ""}>Contact</Link></li>
          <li><Link href="/admin" className={isActive("/admin") ? "active" : ""}>Admin</Link></li>
        </ul>
      </div>
    </nav>
  );
}

function Toast({ message, visible }) {
  return (
    <div className={`toast ${visible ? "toast-visible" : ""}`}>
      <span className="toast-icon">🛒</span>
      <span>{message}</span>
    </div>
  );
}

export default function RootLayout({ children }) {
  const [toast, setToast] = useState({ message: "", visible: false });

  const showToast = useCallback((productName) => {
    setToast({ message: `${productName} ajouté au panier`, visible: true });
    setTimeout(() => setToast((prev) => ({ ...prev, visible: false })), 2500);
  }, []);

  useEffect(() => {
    window.addEventListener("addToCart", (e) => showToast(e.detail));
    return () => window.removeEventListener("addToCart", showToast);
  }, [showToast]);

  return (
    <html lang="fr">
      <head>
        <title>AJE Services</title>
        <meta name="description" content="Produits de beauté naturels et artisanaux" />
      </head>
      <body>
        <NavBar />
        {children}
        <Toast message={toast.message} visible={toast.visible} />
      </body>
    </html>
  );
}
