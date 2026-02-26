import { useState, useEffect } from "react";
import { doc, onSnapshot, updateDoc, setDoc } from "firebase/firestore";
import { db } from "../firebase";
import PlayerSection from "./PlayerSection";
import TeamDisplay from "./TeamDisplay";

const DEFAULT_PROS = [
  { name: "Priyanshu", status: "in" },
  { name: "Mrigank", status: "in" },
  { name: "Rajat", status: "in" },
  { name: "Anuj", status: "in" },
];

const DEFAULT_NOOBS = [
  { name: "Agarwala", status: "in" },
  { name: "Dhonde", status: "in" },
  { name: "Samarth", status: "in" },
  { name: "Kiran", status: "in" },
  { name: "Sambit", status: "in" },
  { name: "Swarup", status: "in" },
  { name: "Anand", status: "in" },
];

function Names() {
  const [proPlayers, setProPlayers] = useState([]);
  const [noobPlayers, setNoobPlayers] = useState([]);
  const [teams, setTeams] = useState({ team1: [], team2: [] });
  const [lastShuffled, setLastShuffled] = useState(null);
  const [error, setError] = useState(null);

  const isAdmin = sessionStorage.getItem("isAdmin") === "true";
  const gameDocRef = doc(db, "gameData", "state");

  useEffect(() => {
    console.log("Connecting to Firestore...");

    const unsubscribe = onSnapshot(
      gameDocRef,
      async (docSnap) => {
        if (docSnap.exists()) {
          const state = docSnap.data();
          console.log("Real-time data received:", state);

          // If document exists but is missing players, fill them (Self-healing)
          if (isAdmin && (!state.proPlayers || state.proPlayers.length === 0)) {
            console.log("Database found but empty. Initializing players...");
            await updateDoc(gameDocRef, {
              proPlayers: DEFAULT_PROS,
              noobPlayers: DEFAULT_NOOBS,
            });
          }

          setProPlayers(state.proPlayers || []);
          setNoobPlayers(state.noobPlayers || []);
          setTeams(state.teams || { team1: [], team2: [] });
          setLastShuffled(state.lastShuffled || null);
        } else {
          console.log("No database document found.");
          if (isAdmin) {
            console.log("Admin detected. Creating initial state...");
            try {
              await setDoc(gameDocRef, {
                proPlayers: DEFAULT_PROS,
                noobPlayers: DEFAULT_NOOBS,
                teams: { team1: [], team2: [] },
                lastShuffled: null,
              });
            } catch (err) {
              console.error("Critical failure creating initial state:", err);
              setError(
                "Firebase Error: Make sure your Firestore Rules are set to 'Test Mode'.",
              );
            }
          } else {
            setError("Waiting for Admin to initialize the game list...");
          }
        }
      },
      (err) => {
        console.error("Firestore Subscribe Error:", err);
        setError("Connection Error. Check your console (F12) for details.");
      },
    );

    return () => unsubscribe();
  }, [isAdmin]);

  const broadcastState = async (newState) => {
    if (isAdmin) {
      try {
        await updateDoc(gameDocRef, newState);
      } catch (error) {
        console.error("Error updating document: ", error);
      }
    }
  };

  const toggleProStatus = (name) => {
    if (!isAdmin) return;
    const newList = proPlayers.map((p) =>
      p.name === name ? { ...p, status: p.status === "in" ? "out" : "in" } : p,
    );
    setProPlayers(newList);
    broadcastState({ proPlayers: newList });
  };

  const toggleNoobStatus = (name) => {
    if (!isAdmin) return;
    const newList = noobPlayers.map((p) =>
      p.name === name ? { ...p, status: p.status === "in" ? "out" : "in" } : p,
    );
    setNoobPlayers(newList);
    broadcastState({ noobPlayers: newList });
  };

  const generateTeams = () => {
    if (!isAdmin) return;
    const activePros = proPlayers.filter((p) => p.status === "in");
    const activeNoobs = noobPlayers.filter((p) => p.status === "in");

    const shuffledPros = [...activePros].sort(() => Math.random() - 0.5);
    const shuffledNoobs = [...activeNoobs].sort(() => Math.random() - 0.5);

    const team1 = [];
    const team2 = [];

    shuffledPros.forEach((p, i) => {
      if (i % 2 === 0) team1.push(p);
      else team2.push(p);
    });

    shuffledNoobs.forEach((p, i) => {
      if (i % 2 === 0) team2.push(p);
      else team1.push(p);
    });

    const now = new Date().toLocaleTimeString();
    const newTeams = { team1, team2 };

    setTeams(newTeams);
    setLastShuffled(now);

    broadcastState({
      teams: newTeams,
      lastShuffled: now,
    });
  };

  return (
    <div className="p-10 min-h-screen text-white bg-[#0a0a0a]">
      <div className="max-w-8xl mx-auto space-y-12">
        {error && (
          <div className="bg-red-500/20 border border-red-500/50 p-4 rounded-xl text-red-400 font-bold text-center mb-8">
            {error}
          </div>
        )}

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

        {lastShuffled && (
          <div className="text-center text-white font-mono text-lg uppercase tracking-[0.3em] py-4">
            Last Shuffled:{" "}
            <span className="text-yellow-400">{lastShuffled}</span>
          </div>
        )}

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
