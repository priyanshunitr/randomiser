const TeamDisplay = ({
  teamName,
  players,
  gradientClass,
  titleColorClass,
  borderColorClass,
}) => (
  <div
    className={`bg-gradient-to-br ${gradientClass} to-black border ${borderColorClass} p-8 rounded-3xl shadow-2xl`}
  >
    <h2 className={`text-3xl font-black mb-6 ${titleColorClass} italic`}>
      {teamName}
    </h2>
    <ul className="space-y-3">
      {players.map((p) => (
        <li
          key={p.name}
          className="flex justify-between items-center bg-white/5 p-4 rounded-xl border border-white/10"
        >
          <span className="text-xl font-bold">{p.name}</span>
          <span className="text-xs opacity-40 uppercase tracking-widest">
            In List
          </span>
        </li>
      ))}
    </ul>
  </div>
);

export default TeamDisplay;
