import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

const InactivityLogout = ({ timeout }) => {
  const navigate = useNavigate();

  useEffect(() => {
    let timer;

    const resetTimer = () => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        const token = localStorage.getItem("token"); // ✔ CORREGIDO
        if (!token) {
          localStorage.clear();
          navigate("/login");
        }
      }, timeout);
    };

    window.onload = resetTimer;
    window.onmousemove = resetTimer;
    window.onkeypress = resetTimer;
    window.onscroll = resetTimer;

    resetTimer();

    return () => {
      clearTimeout(timer);
      window.onload = null;
      window.onmousemove = null;
      window.onkeypress = null;
      window.onscroll = null;
    };
  }, [timeout, navigate]);

  return null;
};

export default InactivityLogout;
