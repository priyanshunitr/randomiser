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
  { name: "Kiran", status: "in" },
  { name: "Sambit", status: "in" },
];

const DEFAULT_NOOBS = [
  { name: "Agarwala", status: "in" },
  { name: "Dhonde", status: "in" },
  { name: "Samarth", status: "in" },
  { name: "Swarup", status: "in" },
  { name: "Anand", status: "in" },
  { name: "Satya", status: "in" },
];

function Names() {
  const [proPlayers, setProPlayers] = useState(DEFAULT_PROS); // Show defaults by default
  const [noobPlayers, setNoobPlayers] = useState(DEFAULT_NOOBS); // Show defaults by default
  const [teams, setTeams] = useState({ team1: [], team2: [] });
  const [lastShuffled, setLastShuffled] = useState(null);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const isAdmin = sessionStorage.getItem("isAdmin") === "true";
  const gameDocRef = doc(db, "gameData", "state");

  useEffect(() => {
    console.log("Firebase Connection Initialized. Admin Status:", isAdmin);

    // Listen to real-time database
    const unsubscribe = onSnapshot(
      gameDocRef,
      async (docSnap) => {
        setIsLoading(false);

        if (docSnap.exists()) {
          const state = docSnap.data();
          console.log("Data loaded from Firebase:", state);

          // Safety function to transform data if it's just a list of strings
          const normalizePlayers = (list) => {
            if (!Array.isArray(list)) return [];
            return list.map((item) =>
              typeof item === "string" ? { name: item, status: "in" } : item,
            );
          };

          const firebasePros = normalizePlayers(state.proPlayers || state.pros);
          const firebaseNoobs = normalizePlayers(
            state.noobPlayers || state.noobs,
          );

          if (firebasePros.length > 0) {
            console.log("Setting Pros from Firebase:", firebasePros);
            setProPlayers(firebasePros);
          } else if (state.proPlayers || state.pros) {
            // Handle case where field exists but is empty
            setProPlayers([]);
          }

          if (firebaseNoobs.length > 0) {
            setNoobPlayers(firebaseNoobs);
          } else if (state.noobPlayers || state.noobs) {
            setNoobPlayers([]);
          }

          setTeams(state.teams || { team1: [], team2: [] });
          setLastShuffled(state.lastShuffled || null);
          setError(null);
        } else {
          console.log("Database is currently empty.");
          if (isAdmin) {
            console.log(
              "Admin detected. Initializing database with defaults...",
            );
            try {
              await setDoc(gameDocRef, {
                proPlayers: DEFAULT_PROS,
                noobPlayers: DEFAULT_NOOBS,
                teams: { team1: [], team2: [] },
                lastShuffled: null,
              });
            } catch (err) {
              console.error("Firebase Setup Error:", err);
              setError(
                "Firebase Error: Check project settings and CORS rules.",
              );
            }
          }
        }
      },
      (err) => {
        console.error("Firebase Sync Error:", err);
        setIsLoading(false);
        setError(
          "Connecting to server failed. You are viewing a local backup. Please check your internet or Firebase rules.",
        );
      },
    );

    return () => unsubscribe();
  }, [isAdmin]);

  const broadcastState = async (newState) => {
    if (isAdmin) {
      try {
        await updateDoc(gameDocRef, newState);
      } catch (err) {
        console.error("Broadcast failed:", err);
        // If update failed because doc doesn't exist, use setDoc
        await setDoc(
          gameDocRef,
          { proPlayers, noobPlayers, teams, lastShuffled, ...newState },
          { merge: true },
        );
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

  const resetToDefaults = async () => {
    if (!isAdmin) return;
    if (
      !window.confirm(
        "ARE YOU SURE? This will overwrite the database with the default names and reset all teams.",
      )
    )
      return;

    try {
      const resetState = {
        proPlayers: DEFAULT_PROS,
        noobPlayers: DEFAULT_NOOBS,
        teams: { team1: [], team2: [] },
        lastShuffled: null,
      };
      await setDoc(gameDocRef, resetState);
      // Local state will be updated automatically by onSnapshot
      alert("Database has been reset to defaults!");
    } catch (err) {
      console.error("Reset failed:", err);
      alert("Failed to reset database. Check console for errors.");
    }
  };

  const generateTeams = () => {
    if (!isAdmin) return;
    const activePros = proPlayers.filter((p) => p.status === "in");
    const activeNoobs = noobPlayers.filter((p) => p.status === "in");

    const shuffledPros = [...activePros].sort(() => Math.random() - 0.5);
    const shuffledNoobs = [...activeNoobs].sort(() => Math.random() - 0.5);

    const team1 = [];
    const team2 = [];

    // Distribute Pros: T1, T2, T1, T2...
    shuffledPros.forEach((p, i) => {
      if (i % 2 === 0) team1.push(p);
      else team2.push(p);
    });

    // Distribute Noobs: T2, T1, T2, T1...
    // We reverse the order for noobs to balance out the counts if Pros were uneven
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
    <div className="p-4 md:p-10 min-h-screen text-white bg-[#0a0a0a]">
      <div className="max-w-7xl mx-auto space-y-12">
        {error && (
          <div className="bg-red-500/20 border border-red-500/50 p-4 rounded-xl text-red-400 font-bold text-center mb-8">
            {error}
          </div>
        )}

        {isAdmin && (
          <div className="bg-yellow-500/20 border border-yellow-500/50 p-4 rounded-xl text-yellow-400 font-bold text-center mb-8 animate-pulse">
            ADMIN MODE ACTIVE
          </div>
        )}

        {isLoading && !proPlayers.length && (
          <div className="flex justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-500"></div>
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
          <div className="flex flex-col md:flex-row justify-center items-center gap-4 pt-8">
            <button
              onClick={generateTeams}
              className="w-full md:w-auto bg-yellow-500 hover:bg-yellow-400 text-black font-black px-12 py-4 rounded-2xl text-xl uppercase tracking-tighter shadow-[0_0_30px_rgba(234,179,8,0.3)] transition-all hover:shadow-[0_0_50px_rgba(234,179,8,0.5)] active:scale-95"
            >
              Shuffle Teams
            </button>
            <button
              onClick={resetToDefaults}
              className="w-full md:w-auto bg-red-600/20 hover:bg-red-600/40 text-red-500 border border-red-500/50 font-bold px-8 py-4 rounded-2xl text-sm uppercase tracking-widest transition-all active:scale-95"
            >
              Reset Database to Defaults
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
