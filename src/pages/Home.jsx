import { useState } from "react";
import { useNavigate } from "react-router-dom";

function Home() {
  const [code, setCode] = useState("");
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    if (code === "1111") {
      sessionStorage.setItem("isAdmin", "true");
      navigate("/about");
    } else if (code === "0000") {
      sessionStorage.setItem("isAdmin", "false");
      navigate("/about");
    } else {
      alert("Invalid Server Code");
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] text-center p-6">
      <h1 className="text-3xl font-bold mb-6 text-white">Enter Server Code</h1>
      <form
        onSubmit={handleSubmit}
        className="bg-white p-8 rounded-2xl shadow-xl space-y-4"
      >
        <input
          type="text"
          placeholder="Enter code..."
          value={code}
          onChange={(e) => setCode(e.target.value)}
          className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-blue-500 transition-colors"
        />
        <button
          type="submit"
          className="w-full bg-blue-600 text-white py-2 rounded-lg font-semibold hover:bg-blue-700 transition-all transform active:scale-95"
        >
          Join Server
        </button>
      </form>
    </div>
  );
}

export default Home;
