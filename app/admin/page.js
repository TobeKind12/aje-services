"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function AdminPage() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", description: "", price: "", category: "", stock: true, featured: false, image: "" });
  const [file, setFile] = useState(null);
  const [message, setMessage] = useState("");
  const [tab, setTab] = useState("products");
  const [newCat, setNewCat] = useState("");
  const [showNewCat, setShowNewCat] = useState(false);
  const [newCatLabel, setNewCatLabel] = useState("");
  const [editingPrice, setEditingPrice] = useState(null);
  const [priceValue, setPriceValue] = useState("");
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem("admin_token");
    if (!token) {
      router.push("/admin/login");
      return;
    }
    fetchProducts();
    fetchCategories();
  }, [router]);

  async function fetchProducts() {
    const res = await fetch("/api/products");
    setProducts(await res.json());
  }

  async function fetchCategories() {
    const res = await fetch("/api/categories");
    const cats = await res.json();
    setCategories(cats);
    setForm((prev) => ({ ...prev, category: prev.category || (cats[0]?.name || "") }));
  }

  async function handleAdd(e) {
    e.preventDefault();
    let imageUrl = form.image;

    if (file) {
      const fd = new FormData();
      fd.append("file", file);
      const uploadRes = await fetch("/api/upload", { method: "POST", body: fd });
      if (uploadRes.ok) {
        const data = await uploadRes.json();
        imageUrl = data.url;
      } else {
        const err = await uploadRes.json();
        setMessage("Erreur upload : " + (err.error || "inconnue"));
        return;
      }
    }

    const res = await fetch("/api/products", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        image: imageUrl,
        price: Number.parseFloat(form.price),
      }),
    });

    if (res.ok) {
      setMessage("Produit ajouté !");
      setForm({ name: "", description: "", price: "", category: categories[0]?.name || "", featured: false, image: "" });
      setFile(null);
      setShowForm(false);
      fetchProducts();
      setTimeout(() => setMessage(""), 2000);
    }
  }

  async function handleDeleteProduct(id) {
    if (!confirm("Supprimer ce produit ?")) return;
    const res = await fetch(`/api/products/${id}`, { method: "DELETE" });
    if (res.ok) {
      setMessage("Produit supprimé");
      fetchProducts();
      setTimeout(() => setMessage(""), 2000);
    }
  }

  async function handleAddCategory(e) {
    e.preventDefault();
    if (!newCat.trim()) return;
    const res = await fetch("/api/categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ label: newCat.trim() }),
    });
    if (res.ok) {
      setNewCat("");
      fetchCategories();
      setMessage("Catégorie ajoutée !");
      setTimeout(() => setMessage(""), 2000);
    }
  }

  async function handleDeleteCategory(id) {
    if (!confirm("Supprimer cette catégorie ? Les produits associés ne seront pas supprimés.")) return;
    const res = await fetch(`/api/categories/${id}`, { method: "DELETE" });
    if (res.ok) {
      fetchCategories();
      setMessage("Catégorie supprimée");
      setTimeout(() => setMessage(""), 2000);
    }
  }

  function handleLogout() {
    localStorage.removeItem("admin_token");
    router.push("/admin/login");
  }

  return (
    <div className="container">
      <div className="admin-header">
        <div>
          <h1 className="page-title">Administration</h1>
          <p className="page-subtitle">Gérez votre catalogue</p>
        </div>
        <button className="btn btn-secondary" onClick={handleLogout}>
          Déconnexion
        </button>
      </div>

      {message && <div className="success-msg">{message}</div>}

      <div className="category-filters" style={{ marginBottom: 24 }}>
        <button className={`filter-btn ${tab === "products" ? "active" : ""}`} onClick={() => setTab("products")}>
          Produits
        </button>
        <button className={`filter-btn ${tab === "categories" ? "active" : ""}`} onClick={() => setTab("categories")}>
          Catégories
        </button>
      </div>

      {tab === "products" && (
        <>
          <button className="btn btn-primary" style={{ marginBottom: 20 }} onClick={() => setShowForm(!showForm)}>
            {showForm ? "Annuler" : "+ Nouveau produit"}
          </button>

          {showForm && (
            <div className="form-card" style={{ marginBottom: 24 }}>
              <h2 style={{ marginBottom: 16 }}>Nouveau produit</h2>
              <form onSubmit={handleAdd}>
                <div className="form-group">
                  <label>Nom du produit</label>
                  <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
                </div>
                <div className="form-group">
                  <label>Description</label>
                  <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} required />
                </div>
                <div className="form-group">
                  <label>Prix (FCFA)</label>
                  <input type="number" step="0.01" min="0" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} required />
                </div>
                <div className="form-group">
                  <label>Photo du produit</label>
                  <input type="file" accept="image/*" onChange={(e) => setFile(e.target.files[0])} />
                  {file && <img src={URL.createObjectURL(file)} alt="Aperçu" className="admin-preview" />}
                  {form.image && !file && <img src={form.image} alt="Image actuelle" className="admin-preview" />}
                </div>
                <div className="form-group">
                  <label>Catégorie</label>
                  <div style={{ display: "flex", gap: 8 }}>
                    <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} style={{ flex: 1 }}>
                      {categories.map((cat) => (
                        <option key={cat.id} value={cat.name}>{cat.label}</option>
                      ))}
                    </select>
                    <button type="button" className="btn btn-secondary" onClick={() => setShowNewCat(!showNewCat)} style={{ padding: "10px 14px" }}>+</button>
                  </div>
                  {showNewCat && (
                    <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                      <input
                        type="text"
                        value={newCatLabel}
                        onChange={(e) => setNewCatLabel(e.target.value)}
                        placeholder="Nouvelle catégorie"
                        style={{ flex: 1, padding: "8px 12px", border: "2px solid var(--cream-dark)", borderRadius: 8, fontSize: "0.9rem" }}
                      />
                      <button
                        type="button"
                        className="btn btn-primary btn-sm"
                        onClick={async () => {
                          if (!newCatLabel.trim()) return;
                          const res = await fetch("/api/categories", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ label: newCatLabel.trim() }),
                          });
                          if (res.ok) {
                            const cat = await res.json();
                            setCategories((prev) => [...prev, cat]);
                            setForm((prev) => ({ ...prev, category: cat.name }));
                            setNewCatLabel("");
                            setShowNewCat(false);
                          }
                        }}
                      >
                        Ajouter
                      </button>
                    </div>
                  )}
                </div>
                <div className="form-group">
                  <label>
                    <input type="checkbox" checked={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.checked })} style={{ width: "auto", marginRight: 8 }} />
                    En stock
                  </label>
                </div>
                <div className="form-group">
                  <label>
                    <input type="checkbox" checked={form.featured} onChange={(e) => setForm({ ...form, featured: e.target.checked })} style={{ width: "auto", marginRight: 8 }} />
                    À la une
                  </label>
                </div>
                <button type="submit" className="btn btn-primary btn-block">Ajouter le produit</button>
              </form>
            </div>
          )}

          <table className="admin-table">
            <thead>
              <tr>
                <th>Image</th>
                <th>ID</th>
                <th>Nom</th>
                <th>Catégorie</th>
                <th>Prix</th>
                <th>Stock</th>
                <th>À la une</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => (
                <tr key={p.id}>
                  <td>
                    {p.image ? (
                      <img src={p.image} alt={p.name} className="admin-thumb" />
                    ) : (
                      <span className="admin-thumb-placeholder">🌸</span>
                    )}
                  </td>
                  <td>{p.id}</td>
                  <td>{p.name}</td>
                  <td>{p.category}</td>
                  <td>
                  {editingPrice === p.id ? (
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={priceValue}
                      onChange={(e) => setPriceValue(e.target.value)}
                      onBlur={async () => {
                        const newPrice = Number.parseFloat(priceValue);
                        if (!isNaN(newPrice) && newPrice >= 0) {
                          await fetch(`/api/products/${p.id}`, {
                            method: "PUT",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ price: newPrice }),
                          });
                          fetchProducts();
                        }
                        setEditingPrice(null);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") e.target.blur();
                        if (e.key === "Escape") setEditingPrice(null);
                      }}
                      autoFocus
                      style={{ width: 80, padding: "4px 8px", border: "2px solid var(--primary)", borderRadius: 4, fontSize: "0.85rem" }}
                    />
                  ) : (
                    <span style={{ cursor: "pointer", borderBottom: "1px dashed var(--border)" }} onClick={() => { setEditingPrice(p.id); setPriceValue(p.price.toString()); }}>
                      {p.price.toFixed(2)} FCFA
                    </span>
                  )}
                </td>
                  <td>
                    <span
                      style={{ cursor: "pointer", fontWeight: 600, color: p.stock ? "var(--primary)" : "#dc2626" }}
                      onClick={async () => {
                        await fetch(`/api/products/${p.id}`, {
                          method: "PUT",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ stock: !p.stock }),
                        });
                        fetchProducts();
                      }}
                      title="Cliquer pour changer"
                    >
                      {p.stock ? "✓" : "✗"}
                    </span>
                  </td>
                  <td>{p.featured ? "⭐" : ""}</td>
                  <td className="actions">
                    <button className="btn btn-secondary btn-sm" onClick={() => router.push(`/admin/products/edit/${p.id}`)}>Modifier</button>
                    <button className="btn btn-danger btn-sm" onClick={() => handleDeleteProduct(p.id)}>Supprimer</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}

      {tab === "categories" && (
        <div className="form-card">
          <h2 style={{ marginBottom: 16 }}>Gérer les catégories</h2>
          <form onSubmit={handleAddCategory} style={{ display: "flex", gap: 12, marginBottom: 20 }}>
            <input
              type="text"
              value={newCat}
              onChange={(e) => setNewCat(e.target.value)}
              placeholder="Nouvelle catégorie"
              style={{ flex: 1, padding: "10px 14px", border: "2px solid var(--cream-dark)", borderRadius: 8, fontSize: "0.95rem" }}
              required
            />
            <button type="submit" className="btn btn-primary">Ajouter</button>
          </form>
          <table className="admin-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Nom</th>
                <th>Label</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {categories.map((cat) => (
                <tr key={cat.id}>
                  <td>{cat.id}</td>
                  <td>{cat.name}</td>
                  <td>{cat.label}</td>
                  <td className="actions">
                    <button className="btn btn-danger btn-sm" onClick={() => handleDeleteCategory(cat.id)}>Supprimer</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
