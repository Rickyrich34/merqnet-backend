import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

export default function ProfileView() {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("token");
    const userId = localStorage.getItem("userId");

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

        setUser(res.data);
      } catch (error) {
        console.log("Error cargando usuario:", error);
      }
    };

    fetchUser();
  }, []);

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center text-white bg-black">
        Cargando...
      </div>
    );
  }

  const defaultAddress =
    user.shippingAddresses?.find((a) => a.isDefault) ||
    user.shippingAddresses?.[0];

  return (
    <div
      className="min-h-screen pt-20 pb-40 px-4 md:px-6 text-white flex justify-center"
      style={{
        background:
          "linear-gradient(135deg, #0a0122 0%, #120034 50%, #1a0060 100%)",
      }}
    >
      <div
        className="
        w-full 
        max-w-xl
        bg-black/40 
        backdrop-blur-xl 
        p-8 md:p-10 
        rounded-2xl 
        shadow-[0_0_25px_#9900ff] 
        border border-purple-700
      "
      >
        {/* CABECERA */}
        <div className="flex flex-col items-start">
          <h1 className="text-3xl md:text-4xl font-bold mb-1 drop-shadow-[0_0_8px_#bb00ff]">
            {user.fullName}
          </h1>
          <p className="text-purple-300 text-base md:text-lg">{user.email}</p>
          <p className="text-purple-300 text-base md:text-lg">
            Teléfono: {user.phone}
          </p>
        </div>

        <div className="mt-10 border-t border-purple-700/40 pt-6">
          <h2 className="text-xl md:text-2xl mb-2 font-semibold text-purple-400 drop-shadow-[0_0_8px_#9d00ff]">
            Intercambio Internacional
          </h2>
          <p className="text-lg">
            {user.acceptsInternationalTrade ? "Disponible" : "Solo Local"}
          </p>

          <h2 className="text-xl md:text-2xl mt-6 mb-2 font-semibold text-purple-400 drop-shadow-[0_0_8px_#9d00ff]">
            Dirección Predeterminada
          </h2>

          {defaultAddress ? (
            <div className="bg-purple-900/30 p-5 md:p-6 rounded-xl border border-purple-700 shadow-[0_0_20px_#7c00ff] text-sm md:text-base">
              <p><strong>Calle:</strong> {defaultAddress.streetAddress}</p>
              <p><strong>Ciudad/Pueblo:</strong> {defaultAddress.city}</p>
              <p><strong>Estado/Provincia:</strong> {defaultAddress.state}</p>
              <p><strong>País:</strong> {defaultAddress.country}</p>
              <p><strong>Código Postal:</strong> {defaultAddress.postalCode}</p>
            </div>
          ) : (
            <p>No hay direcciones de envío registradas.</p>
          )}

          <h2 className="text-xl md:text-2xl mt-6 mb-2 font-semibold text-purple-400 drop-shadow-[0_0_8px_#9d00ff]">
            Información de la Cuenta
          </h2>

          <p>Creado: {new Date(user.createdAt).toLocaleString()}</p>
          <p>Actualizado: {new Date(user.updatedAt).toLocaleString()}</p>

          <div className="mt-8 flex flex-wrap gap-4">
            <button
              onClick={() => navigate("/dashboard")}
              className="px-5 py-2 rounded-xl bg-gradient-to-r from-purple-500 to-cyan-500 font-semibold hover:scale-105 transition-transform duration-200"
            >
              ← Back to Dashboard
            </button>

            <button
              onClick={() => navigate("/editprofile")}
              className="px-5 py-2 rounded-xl bg-gradient-to-r from-pink-500 to-purple-500 font-semibold hover:scale-105 transition-transform duration-200"
            >
              Editar Perfil
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
