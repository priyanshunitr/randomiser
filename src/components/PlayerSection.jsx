import PlayerCard from "./PlayerCard";

const PlayerSection = ({ title, players, onToggle, isAdmin }) => (
  <section>
    <h1 className="text-2xl font-black mb-6 text-yellow-400 tracking-widest uppercase">
      {title}
    </h1>
    <ul className="flex flex-wrap gap-4">
      {players.map((player) => (
        <PlayerCard
          key={player.name}
          player={player}
          onToggle={onToggle}
          isAdmin={isAdmin}
        />
      ))}
    </ul>
  </section>
);

export default PlayerSection;
