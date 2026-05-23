function Dashboard() {
  const user = JSON.parse(localStorage.getItem("user"));

  return (
    <div>
      <h1>StudMate</h1>
      <p>Dobrodošla, {user?.name}</p>
    </div>
  );
}

export default Dashboard;