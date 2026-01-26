import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

const InactivityLogout = ({ timeout = 15 * 60 * 1000 }) => {
  const navigate = useNavigate();

  useEffect(() => {
    let timer;

    const logout = () => {
      localStorage.removeItem("token");
      localStorage.removeItem("userToken");
      localStorage.removeItem("userId");
      localStorage.removeItem("userEmail");
      navigate("/login");
    };

    const resetTimer = () => {
      clearTimeout(timer);

      timer = setTimeout(() => {
        const token =
          localStorage.getItem("userToken") || localStorage.getItem("token");

        if (token) {
          logout();
        }
      }, timeout);
    };

    const events = ["load", "mousemove", "keydown", "scroll", "click"];

    events.forEach((event) =>
      window.addEventListener(event, resetTimer)
    );

    resetTimer();

    return () => {
      clearTimeout(timer);
      events.forEach((event) =>
        window.removeEventListener(event, resetTimer)
      );
    };
  }, [timeout, navigate]);

  return null;
};

export default InactivityLogout;
