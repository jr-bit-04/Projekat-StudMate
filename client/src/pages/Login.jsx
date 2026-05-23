import { useState } from "react";
import api from "../api/axios";

function Login() {
  const [form, setForm] = useState({
    email: "",
    password: "",
  });

  const [message, setMessage] = useState("");

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const res = await api.post("/auth/login", form);

      localStorage.setItem("token", res.data.token);
      localStorage.setItem("user", JSON.stringify(res.data.user));

      window.location.href = "/dashboard";
    } catch (error) {
      setMessage(error.response?.data?.message || "Greška pri prijavi.");
    }
  };

  return (
    <div>
      <h1>Prijava</h1>

      <form onSubmit={handleSubmit}>
        <input
          name="email"
          type="email"
          placeholder="Email"
          onChange={handleChange}
        />

        <input
          name="password"
          type="password"
          placeholder="Lozinka"
          onChange={handleChange}
        />

        <button>Prijavi se</button>
      </form>

      <p>{message}</p>
    </div>
  );
}

export default Login;