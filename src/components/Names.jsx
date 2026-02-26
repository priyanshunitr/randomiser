import { useState, useEffect } from "react";
import io from "socket.io-client";
import PlayerSection from "./PlayerSection";
import TeamDisplay from "./TeamDisplay";

const socket = io(import.meta.env.VITE_SOCKET_URL || "http://localhost:3001");

function Names() {
  const [proPlayers, setProPlayers] = useState([]);
  const [noobPlayers, setNoobPlayers] = useState([]);
  const [teams, setTeams] = useState({ team1: [], team2: [] });
  const [lastShuffled, setLastShuffled] = useState(null);

  const isAdmin = sessionStorage.getItem("isAdmin") === "true";

  useEffect(() => {
    // Receive initial state from server
    socket.on("init_state", (state) => {
      setProPlayers(state.proPlayers);
      setNoobPlayers(state.noobPlayers);
      setTeams(state.teams);
      setLastShuffled(state.lastShuffled);
    });

    // Listen for real-time updates from other users
    socket.on("state_changed", (state) => {
      setProPlayers(state.proPlayers);
      setNoobPlayers(state.noobPlayers);
      setTeams(state.teams);
      setLastShuffled(state.lastShuffled);
    });

    // Manually request state in case we missed the connection blast
    socket.emit("get_state");

    return () => {
      socket.off("init_state");
      socket.off("state_changed");
    };
  }, []);

  // Helper to broadcast state to others
  const broadcastState = (newState) => {
    if (isAdmin) {
      socket.emit("update_state", newState);
    }
  };

  const toggleProStatus = (name) => {
    if (!isAdmin) return;
    const newList = proPlayers.map((p) =>
      p.name === name ? { ...p, status: p.status === "in" ? "out" : "in" } : p,
    );
    setProPlayers(newList);
    broadcastState({ proPlayers: newList, noobPlayers, teams, lastShuffled });
  };

  const toggleNoobStatus = (name) => {
    if (!isAdmin) return;
    const newList = noobPlayers.map((p) =>
      p.name === name ? { ...p, status: p.status === "in" ? "out" : "in" } : p,
    );
    setNoobPlayers(newList);
    broadcastState({ proPlayers, noobPlayers: newList, teams, lastShuffled });
  };

  const generateTeams = () => {
    if (!isAdmin) return;
    const activePros = proPlayers.filter((p) => p.status === "in");
    const activeNoobs = noobPlayers.filter((p) => p.status === "in");

    // Shuffle both lists separately for balance
    const shuffledPros = [...activePros].sort(() => Math.random() - 0.5);
    const shuffledNoobs = [...activeNoobs].sort(() => Math.random() - 0.5);

    const team1 = [];
    const team2 = [];

    // Distribute Pros
    shuffledPros.forEach((p, i) => {
      if (i % 2 === 0) team1.push(p);
      else team2.push(p);
    });

    // Distribute Noobs
    shuffledNoobs.forEach((p, i) => {
      if (i % 2 === 0) team2.push(p);
      else team1.push(p);
    });

    const now = new Date().toLocaleTimeString();
    const newTeams = { team1, team2 };
    setTeams(newTeams);
    setLastShuffled(now);
    broadcastState({
      proPlayers,
      noobPlayers,
      teams: newTeams,
      lastShuffled: now,
    });
  };

  return (
    <div className="p-10 min-h-screen text-white bg-[#0a0a0a]">
      <div className="max-w-8xl mx-auto space-y-12">
        {isAdmin && (
          <div className="bg-yellow-500/20 border border-yellow-500/50 p-4 rounded-xl text-yellow-400 font-bold text-center mb-8">
            ADMIN MODE: You can toggle status and shuffle teams.
          </div>
        )}

        <PlayerSection
          title="PRO PLAYERS"
          players={proPlayers}
          onToggle={toggleProStatus}
          isAdmin={isAdmin}
        />

        <PlayerSection
          title="NOOB PLAYERS"
          players={noobPlayers}
          onToggle={toggleNoobStatus}
          isAdmin={isAdmin}
        />

        {/* Randomize Button */}
        {isAdmin && (
          <div className="flex justify-center pt-8">
            <button
              onClick={generateTeams}
              className="bg-yellow-500 hover:bg-yellow-400 text-black font-black px-12 py-4 rounded-2xl text-xl uppercase tracking-tighter shadow-[0_0_30px_rgba(234,179,8,0.3)] transition-all hover:shadow-[0_0_50px_rgba(234,179,8,0.5)] active:scale-90"
            >
              Generate Balanced Teams
            </button>
          </div>
        )}

        {/* Last Shuffled Time */}
        {lastShuffled && (
          <div className="text-center text-white font-mono text-lg uppercase tracking-[0.3em] py-4">
            Last Shuffled:{" "}
            <span className="text-yellow-400">{lastShuffled}</span>
          </div>
        )}

        {/* Teams Display */}
        {(teams.team1.length > 0 || teams.team2.length > 0) && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4">
            <TeamDisplay
              teamName="TEAM BLUE"
              players={teams.team1}
              gradientClass="from-blue-900/40"
              titleColorClass="text-blue-400"
              borderColorClass="border-blue-500/30"
            />
            <TeamDisplay
              teamName="TEAM RED"
              players={teams.team2}
              gradientClass="from-red-900/40"
              titleColorClass="text-red-500"
              borderColorClass="border-red-500/30"
            />
          </div>
        )}
      </div>
    </div>
  );
}

export default Names;
