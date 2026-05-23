import { useState } from "react";
import api from "../api/axios";

function Register() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    faculty: "",
    dorm: "",
    index_number: "",
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
      const res = await api.post("/auth/register", {
        ...form,
        role: "student",
      });

      localStorage.setItem("token", res.data.token);
      localStorage.setItem("user", JSON.stringify(res.data.user));

      window.location.href = "/dashboard";
    } catch (error) {
      setMessage(error.response?.data?.message || "Greška pri registraciji.");
    }
  };

  return (
    <div>
      <h1>Registracija</h1>

      <form onSubmit={handleSubmit}>
        <input name="name" placeholder="Ime i prezime" onChange={handleChange} />
        <input name="email" type="email" placeholder="Email" onChange={handleChange} />
        <input name="password" type="password" placeholder="Lozinka" onChange={handleChange} />
        <input name="faculty" placeholder="Fakultet" onChange={handleChange} />
        <input name="dorm" placeholder="Dom" onChange={handleChange} />
        <input name="index_number" placeholder="Broj indeksa" onChange={handleChange} />

        <button>Registruj se</button>
      </form>

      <p>{message}</p>
    </div>
  );
}

export default Register;