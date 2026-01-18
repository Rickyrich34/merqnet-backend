import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const EditProfile = () => {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const userId = localStorage.getItem("userId");

  const [loading, setLoading] = useState(true);

  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    acceptsInternationalTrade: false,
    shippingAddresses: [],
  });

  const [editing, setEditing] = useState({
    fullName: false,
    email: false,
    phone: false,
  });

  useEffect(() => {
    if (!token || !userId) return;

    const fetchUser = async () => {
      try {
        const res = await axios.get(
          `http://localhost:5000/api/users/profile/${userId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const user = res.data;

        setFormData({
          fullName: user.fullName || "",
          email: user.email || "",
          phone: user.phone || "",
          acceptsInternationalTrade: user.acceptsInternationalTrade || false,
          shippingAddresses: user.shippingAddresses || [],
        });

        setLoading(false);
      } catch (error) {
        console.error("Error cargando perfil:", error);
        setLoading(false);
      }
    };

    fetchUser();
  }, [token, userId]);

  const toggleEdit = (field) => {
    setEditing((prev) => ({ ...prev, [field]: !prev[field] }));
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleAddressChange = (id, field, value) => {
    setFormData((prev) => ({
      ...prev,
      shippingAddresses: prev.shippingAddresses.map((addr) =>
        addr._id === id ? { ...addr, [field]: value } : addr
      ),
    }));
  };

  const addAddress = () => {
    if (formData.shippingAddresses.length >= 3) return;

    const newAddress = {
      _id: `temp-${Date.now()}`,
      streetAddress: "",
      city: "",
      state: "",
      country: "",
      postalCode: "",
      isDefault: formData.shippingAddresses.length === 0,
    };

    setFormData((prev) => ({
      ...prev,
      shippingAddresses: [...prev.shippingAddresses, newAddress],
    }));
  };

  const setDefaultAddress = (id) => {
    setFormData((prev) => ({
      ...prev,
      shippingAddresses: prev.shippingAddresses.map((addr) => ({
        ...addr,
        isDefault: addr._id === id,
      })),
    }));
  };

  const handleSubmit = async () => {
    try {
      // 🔥 FIX ABSOLUTO DEL ERROR 500 🔥
      const cleanAddresses = formData.shippingAddresses.map((addr) => {
        const copy = { ...addr };
        if (copy._id && copy._id.startsWith("temp-")) {
          delete copy._id; // Mongo genera uno nuevo SIN CRASHEAR
        }
        return copy;
      });

      const cleanPayload = {
        ...formData,
        shippingAddresses: cleanAddresses,
      };

      await axios.put(
        `http://localhost:5000/api/users/profile/${userId}`,
        cleanPayload,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      navigate("/profile");
    } catch (error) {
      console.error("Error guardando cambios:", error);
    }
  };

  const renderField = (label, fieldName, type = "text") => (
    <div className="mb-6">
      <label className="text-purple-300 flex justify-between items-center mb-1">
        {label}
        <button
          type="button"
          onClick={() => toggleEdit(fieldName)}
          className="text-sm bg-purple-700 px-3 py-1 rounded hover:bg-purple-600"
        >
          {editing[fieldName] ? "Listo" : "Editar"}
        </button>
      </label>
      <input
        type={type}
        name={fieldName}
        value={formData[fieldName]}
        disabled={!editing[fieldName]}
        onChange={handleChange}
        className={`w-full p-3 rounded bg-black/40 border border-purple-700 ${
          editing[fieldName]
            ? "opacity-100"
            : "opacity-60 cursor-not-allowed"
        }`}
      />
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-white bg-black">
        Cargando...
      </div>
    );
  }

  return (
    <div
      className="min-h-screen pt-24 px-6 pb-40 text-white flex justify-center"
      style={{
        background:
          "linear-gradient(135deg, #0a0122 0%, #120034 50%, #1a0060 100%)",
      }}
    >
      <div className="max-w-2xl w-full bg-black/40 backdrop-blur-xl p-10 rounded-2xl shadow-[0_0_30px_#9900ff] border border-purple-700 relative">

        <button
          type="button"
          onClick={() => navigate("/profile")}
          className="absolute top-4 left-4 px-4 py-2 bg-purple-900/80 hover:bg-purple-700 text-white font-bold rounded-lg shadow-[0_0_12px_#ff00ff] transition"
        >
          ← Volver
        </button>

        <h1 className="text-3xl font-bold text-center mb-8 text-purple-300 drop-shadow-[0_0_10px_#9d00ff]">
          Editar Perfil
        </h1>

        {renderField("Nombre completo", "fullName")}
        {renderField("Correo electrónico", "email", "email")}
        {renderField("Teléfono (+ prefijo)", "phone")}

        <div className="mt-6 mb-10">
          <label className="flex items-center gap-3 text-purple-300">
            <input
              type="checkbox"
              name="acceptsInternationalTrade"
              checked={formData.acceptsInternationalTrade}
              onChange={handleChange}
            />
            Disponible para intercambio internacional
          </label>
        </div>

        <h2 className="text-2xl font-semibold text-purple-400 mb-3">
          Direcciones de Envío
        </h2>

        {formData.shippingAddresses.map((addr) => (
          <div
            key={addr._id}
            className="bg-purple-900/30 p-5 rounded-xl border border-purple-700 shadow-[0_0_15px_#7c00ff] mb-5"
          >
            <div className="mb-3">
              <label className="text-purple-300">Calle</label>
              <input
                type="text"
                className="w-full p-2 rounded bg-black/40 border border-purple-700"
                value={addr.streetAddress}
                onChange={(e) =>
                  handleAddressChange(addr._id, "streetAddress", e.target.value)
                }
              />
            </div>

            <div className="mb-3">
              <label className="text-purple-300">Ciudad / Pueblo</label>
              <input
                type="text"
                className="w-full p-2 rounded bg-black/40 border border-purple-700"
                value={addr.city}
                onChange={(e) =>
                  handleAddressChange(addr._id, "city", e.target.value)
                }
              />
            </div>

            <div className="mb-3">
              <label className="text-purple-300">Estado / Provincia</label>
              <input
                type="text"
                className="w-full p-2 rounded bg-black/40 border border-purple-700"
                value={addr.state}
                onChange={(e) =>
                  handleAddressChange(addr._id, "state", e.target.value)
                }
              />
            </div>

            <div className="mb-3">
              <label className="text-purple-300">País</label>
              <input
                type="text"
                className="w-full p-2 rounded bg-black/40 border border-purple-700"
                value={addr.country}
                onChange={(e) =>
                  handleAddressChange(addr._id, "country", e.target.value)
                }
              />
            </div>

            <div className="mb-3">
              <label className="text-purple-300">Código Postal</label>
              <input
                type="text"
                className="w-full p-2 rounded bg-black/40 border border-purple-700"
                value={addr.postalCode}
                onChange={(e) =>
                  handleAddressChange(addr._id, "postalCode", e.target.value)
                }
              />
            </div>

            <label className="flex items-center gap-2 mt-2 text-purple-300">
              <input
                type="radio"
                checked={addr.isDefault}
                onChange={() => setDefaultAddress(addr._id)}
              />
              Dirección Predeterminada
            </label>
          </div>
        ))}

        <button
          type="button"
          onClick={addAddress}
          className="bg-purple-700 hover:bg-purple-600 transition px-5 py-2 rounded-lg text-white font-semibold mt-2 disabled:opacity-40"
          disabled={formData.shippingAddresses.length >= 3}
        >
          Añadir Dirección
        </button>

        <h2 className="text-2xl font-semibold text-purple-400 mt-10 mb-3">
          Cambio de Contraseña
        </h2>
        <button
          type="button"
          onClick={() => navigate("/changepassword")}
          className="bg-blue-700 hover:bg-blue-600 transition px-5 py-2 rounded-lg text-white font-semibold"
        >
          Cambiar Contraseña
        </button>

        <h2 className="text-2xl font-semibold text-purple-400 mt-10 mb-3">
          Métodos de Pago
        </h2>
        <button
          type="button"
          onClick={() => navigate("/payment-methods")}
          className="bg-green-700 hover:bg-green-600 transition px-5 py-2 rounded-lg text-white font-semibold"
        >
          Gestionar Métodos de Pago
        </button>

        <div className="flex justify-end mt-10">
          <button
            type="button"
            onClick={handleSubmit}
            className="px-6 py-3 rounded-lg font-bold text-white bg-red-700 shadow-[0_0_12px_#ff004c] hover:bg-red-600"
          >
            Guardar Cambios
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditProfile;
