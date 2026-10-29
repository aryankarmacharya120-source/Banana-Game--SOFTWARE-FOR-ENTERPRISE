import { useState } from 'react';

const COLS = 7;

export default function Board({ game, myColor, onDrop }) {
  const [hoverCol, setHoverCol] = useState(null);
  const myTurn = game.status === 'playing' && game.turn === myColor;
  const winSet = new Set(game.winningCells.map(([r, c]) => `${r}-${c}`));
  const last = game.lastMove;
  const moveCount = game.board.flat().filter(Boolean).length;

  return (
    <div className="board-wrap">
      <div className="drop-row">
        {Array.from({ length: COLS }, (_, c) => (
          <div key={c} className="drop-slot">
            {myTurn && hoverCol === c && <div className={`disc ghost ${myColor}`} />}
          </div>
        ))}
      </div>
      <div className="board" role="grid" aria-label="Connect Four board">
        {Array.from({ length: COLS }, (_, c) => (
          <button
            key={c}
            className={`column ${myTurn ? 'active' : ''}`}
            disabled={!myTurn}
            onMouseEnter={() => setHoverCol(c)}
            onMouseLeave={() => setHoverCol(null)}
            onClick={() => onDrop(c)}
            aria-label={`Drop disc in column ${c + 1}`}
          >
            {game.board.map((row, r) => {
              const color = row[c];
              const isLast = last && last.row === r && last.col === c;
              const isWin = winSet.has(`${r}-${c}`);
              return (
                <div key={r} className="cell">
                  {color && (
                    <div
                      key={isLast ? `new-${moveCount}` : 'old'}
                      className={`disc ${color} ${isLast ? 'drop' : ''} ${isWin ? 'win' : ''}`}
                      style={isLast ? { '--fall': r + 1 } : undefined}
                    />
                  )}
                </div>
              );
            })}
          </button>
        ))}
      </div>
    </div>
  );
}
