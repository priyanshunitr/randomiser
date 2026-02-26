const PlayerCard = ({ player, onToggle, isAdmin }) => (
  <li
    className={`flex items-center gap-3 bg-yellow-500/10 border border-yellow-500/20 px-6 py-3 rounded-xl font-bold text-white transition-all 
      ${isAdmin ? "cursor-pointer hover:bg-yellow-500/20 active:scale-95" : "cursor-default grayscale-[0.5]"}`}
    onClick={() => isAdmin && onToggle(player.name)}
  >
    <span>{player.name}</span>
    <span
      className={`text-sm tracking-widest uppercase ${
        player.status === "in" ? "text-green-400" : "text-red-400"
      }`}
    >
      {player.status}
    </span>
  </li>
);

export default PlayerCard;
