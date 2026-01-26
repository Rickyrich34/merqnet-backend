// src/pages/SellerProducts.jsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const API = import.meta.env.VITE_API_URL;

const SellerProducts = () => {
  const [products, setProducts] = useState([]);
  const navigate = useNavigate();
  const sellerId = localStorage.getItem("userId");

  useEffect(() => {
    fetch(`${API}/api/products?clientID=${sellerId}`)
      .then((res) => res.json())
      .then((data) => setProducts(data))
      .catch((err) => console.error("Error fetching products:", err));
  }, []);

  return (
    <div className="text-white p-8">
      <button
        onClick={() => navigate("/sellerdashboard")}
        className="bg-gray-700 px-3 py-2 rounded mb-4"
      >
        ← Back
      </button>

      <h1 className="text-3xl font-bold mb-4">My Products</h1>

      <button
        onClick={() => navigate("/seller/products/new")}
        className="bg-green-600 px-4 py-2 rounded mb-6"
      >
        + Add Product
      </button>

      {products.length === 0 && <p>No products found.</p>}

      {products.map((p) => (
        <div key={p._id} className="bg-gray-800 p-4 rounded mb-3">
          <h2 className="text-xl font-bold">{p.productName}</h2>
          <p>{p.category}</p>
          <p>Condition: {p.condition}</p>
          <p>Quantity: {p.quantity}</p>

          <button
            className="bg-red-600 px-3 py-1 rounded mt-2"
            onClick={() => {
              fetch(`${API}/api/products/${p._id}`, {
                method: "DELETE",
              }).then(() => window.location.reload());
            }}
          >
            Delete
          </button>
        </div>
      ))}
    </div>
  );
};

export default SellerProducts;
