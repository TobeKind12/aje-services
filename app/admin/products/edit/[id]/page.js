"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";

export default function EditProductPage() {
  const [form, setForm] = useState({
    name: "",
    description: "",
    price: "",
    category: "savons",
    stock: true,
    featured: false,
    image: "",
  });
  const [categories, setCategories] = useState([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [file, setFile] = useState(null);
  const [showNewCat, setShowNewCat] = useState(false);
  const [newCatLabel, setNewCatLabel] = useState("");
  const router = useRouter();
  const params = useParams();

  useEffect(() => {
    const token = localStorage.getItem("admin_token");
    if (!token) {
      router.push("/admin/login");
      return;
    }

    fetch("/api/categories").then((r) => r.json()).then(setCategories);

    fetch(`/api/products/${params.id}`)
      .then((res) => {
        if (!res.ok) throw new Error("Not found");
        return res.json();
      })
      .then((product) => {
        setForm({
          name: product.name,
          description: product.description,
          price: product.price.toString(),
          category: product.category,
          stock: product.stock,
          featured: product.featured ?? false,
          image: product.image ?? "",
        });
        setLoading(false);
      })
      .catch(() => {
        router.push("/admin");
      });
  }, [params.id, router]);

  async function handleSubmit(e) {
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

    const res = await fetch(`/api/products/${params.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        image: imageUrl,
        price: Number.parseFloat(form.price),
      }),
    });

    if (res.ok) {
      setMessage("Produit mis à jour !");
      setTimeout(() => router.push("/admin"), 1500);
    } else {
      setMessage("Erreur lors de la mise à jour");
    }
  }

  if (loading) {
    return (
      <div className="container">
        <p>Chargement...</p>
      </div>
    );
  }

  return (
    <div className="container">
      <h1 className="page-title">Modifier le produit</h1>

      {message && (
        <div className={message.includes("Erreur") ? "error-msg" : "success-msg"}>
          {message}
        </div>
      )}

      <div className="form-card">
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Nom du produit</label>
            <input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
            />
          </div>
          <div className="form-group">
            <label>Description</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              required
            />
          </div>
          <div className="form-group">
            <label>Prix (FCFA)</label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={form.price}
              onChange={(e) => setForm({ ...form, price: e.target.value })}
              required
            />
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
            <label>Photo du produit</label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setFile(e.target.files[0])}
            />
            {file && <img src={URL.createObjectURL(file)} alt="Aperçu" className="admin-preview" />}
            {form.image && !file && <img src={form.image} alt="Image actuelle" className="admin-preview" />}
          </div>
          <div className="form-group">
            <label>
              <input
                type="checkbox"
                checked={form.featured}
                onChange={(e) => setForm({ ...form, featured: e.target.checked })}
                style={{ width: "auto", marginRight: "8px" }}
              />
              À la une
            </label>
          </div>
          <div className="form-group">
            <label>
              <input
                type="checkbox"
                checked={form.stock}
                onChange={(e) => setForm({ ...form, stock: e.target.checked })}
                style={{ width: "auto", marginRight: "8px" }}
              />
              En stock
            </label>
          </div>
          <div style={{ display: "flex", gap: "12px" }}>
            <button type="submit" className="btn btn-primary">
              Enregistrer
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => router.push("/admin")}
            >
              Annuler
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
