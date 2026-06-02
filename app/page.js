"use client";

import { useState, useEffect } from "react";

const DEFAULT_ICONS = {
  savons: "🧼",
  pommades: "💊",
  baumes: "💄",
  gommages: "🧴",
  huiles: "🫒",
};

function addToCart(product) {
  if (!product.stock) return;
  const cart = JSON.parse(localStorage.getItem("cart") || "[]");
  const existing = cart.find((item) => item.id === product.id);
  if (existing) {
    existing.quantity += 1;
  } else {
    cart.push({ ...product, quantity: 1 });
  }
  localStorage.setItem("cart", JSON.stringify(cart));
  window.dispatchEvent(new Event("cartUpdated"));
  window.dispatchEvent(new CustomEvent("addToCart", { detail: product.name }));
}

function ProductCard({ product, added, onAdd, icon }) {
  const outOfStock = !product.stock;
  return (
    <div className={`product-card${outOfStock ? " out-of-stock" : ""}`}>
      <div
        className="product-image"
        style={product.image ? { backgroundImage: `url(${product.image})`, backgroundSize: "cover", backgroundPosition: "center" } : {}}
      >
        {!product.image && (icon || "🌸")}
        {outOfStock && <div className="stock-badge">Rupture de stock</div>}
      </div>
      <div className="product-body">
        {product.featured && <span className="product-badge">À la une</span>}
        <span className="product-category">{product.category}</span>
        <h3 className="product-name">{product.name}</h3>
        <p className="product-desc">{product.description}</p>
        <div className="product-footer">
          <span className="product-price">{product.price.toFixed(2)} FCFA</span>
          <button
            className={`btn btn-sm ${outOfStock ? "btn-disabled" : "btn-primary"} ${added[product.id] ? "success" : ""}`}
            disabled={outOfStock}
            onClick={() => onAdd(product)}
          >
            {outOfStock ? "Indisponible" : added[product.id] ? "✓ Ajouté" : "Ajouter"}
          </button>
        </div>
      </div>
    </div>
  );
}

function FeaturedCard({ product, added, onAdd, icon }) {
  const hasImage = !!product.image;
  const outOfStock = !product.stock;
  return (
    <div
      className={`featured-card${hasImage ? " has-image" : ""}${outOfStock ? " out-of-stock" : ""}`}
      style={hasImage ? { backgroundImage: `url(${product.image})` } : {}}
    >
      {hasImage && <div className="featured-overlay" />}
      {!hasImage && (
        <div className="featured-card-icon">
          {icon || "🌸"}
        </div>
      )}
      <div className="featured-card-body">
        {outOfStock && <span className="stock-badge" style={{ position: "static", display: "inline-block", marginBottom: 8 }}>Rupture de stock</span>}
        <span className="product-category">{product.category}</span>
        <div className="featured-card-name">{product.name}</div>
        <div className="featured-card-desc">{product.description}</div>
        <div className="featured-card-price">{product.price.toFixed(2)} FCFA</div>
        <button
          className={`btn ${outOfStock ? "btn-disabled" : "btn-primary"} ${added[product.id] ? "success" : ""}`}
          disabled={outOfStock}
          onClick={() => onAdd(product)}
        >
          {outOfStock ? "Indisponible" : added[product.id] ? "✓ Ajouté" : "Ajouter au panier"}
        </button>
      </div>
    </div>
  );
}

export default function HomePage() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [category, setCategory] = useState("");
  const [added, setAdded] = useState({});
  const [featuredPage, setFeaturedPage] = useState(0);

  useEffect(() => {
    fetch("/api/products")
      .then((res) => res.json())
      .then(setProducts);
    fetch("/api/categories")
      .then((res) => res.json())
      .then(setCategories);
  }, []);

  function catIcon(name) {
    return DEFAULT_ICONS[name];
  }

  const featured = products.filter((p) => p.featured);
  const perPage = 1;
  const totalPages = Math.max(1, Math.ceil(featured.length / perPage));
  const safePage = Math.min(featuredPage, totalPages - 1);
  const pageStart = safePage * perPage;
  const pageProducts = featured.slice(pageStart, pageStart + perPage);

  useEffect(() => {
    if (totalPages <= 1) return;
    const timer = setInterval(() => {
      setFeaturedPage((prev) => (prev + 1) % totalPages);
    }, 4000);
    return () => clearInterval(timer);
  }, [totalPages]);

  const filtered = category
    ? products.filter((p) => p.category === category)
    : products;

  function handleAdd(p) {
    addToCart(p);
    setAdded((prev) => ({ ...prev, [p.id]: true }));
    setTimeout(() => setAdded((prev) => ({ ...prev, [p.id]: false })), 1200);
  }

  return (
    <div className="container">
      <h1 className="page-title">AJE Services</h1>
      <p className="page-subtitle">
        Produits de beauté naturels et artisanaux
      </p>
      <p className="welcome-text">
        Bienvenue dans l'univers de la beauté et du soin réel.
      </p>

      {featured.length > 0 && (
        <section className="featured-section">
          <h2 className="section-title">À la une</h2>
          <div className="featured-pagination">
            <button
              className="pagination-arrow"
              disabled={safePage === 0}
              onClick={() => setFeaturedPage(safePage - 1)}
            >
              ‹
            </button>
            <div className="featured-page">
              {pageProducts.map((product) => (
                <FeaturedCard
                  key={product.id}
                  product={product}
                  added={added}
                  onAdd={handleAdd}
                  icon={catIcon(product.category)}
                />
              ))}
            </div>
            <button
              className="pagination-arrow"
              disabled={safePage >= totalPages - 1}
              onClick={() => setFeaturedPage(safePage + 1)}
            >
              ›
            </button>
          </div>
          <div className="pagination-dots">
            {Array.from({ length: totalPages }, (_, i) => (
              <button
                key={i}
                className={`pagination-dot ${i === safePage ? "active" : ""}`}
                onClick={() => setFeaturedPage(i)}
              />
            ))}
          </div>
        </section>
      )}

      <h2 className="section-title">Tous nos produits</h2>

      <div className="category-filters">
        <button
          className={`filter-btn ${category === "" ? "active" : ""}`}
          onClick={() => setCategory("")}
        >
          Tous
        </button>
        {categories.map((cat) => (
          <button
            key={cat.id}
            className={`filter-btn ${category === cat.name ? "active" : ""}`}
            onClick={() => setCategory(cat.name)}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="empty-state">
          <h2>Aucun produit trouvé</h2>
          <p>Essayez de changer de catégorie.</p>
        </div>
      ) : (
        <div className="product-grid">
              {filtered.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  added={added}
                  onAdd={handleAdd}
                  icon={catIcon(product.category)}
                />
              ))}
        </div>
      )}
    </div>
  );
}
