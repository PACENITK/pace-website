import React, { useState } from "react";
import { Buildings } from "@phosphor-icons/react";
import useNetworkGameStore from "./store/useNetworkGameStore.js";

function JoinScreen() {
  const [code, setCode] = useState("");
  const joinError = useNetworkGameStore((s) => s.joinError);
  const join = useNetworkGameStore((s) => s.join);

  function handleSubmit(e) {
    e.preventDefault();
    if (code.trim()) join(code.trim());
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[color:var(--game-paper)]">
      <form
        onSubmit={handleSubmit}
        className="flex flex-col items-center gap-4 p-8 bg-[color:var(--game-paper-2)] border border-[color:var(--game-rule)] rounded-sm w-[320px]"
      >
        <div className="w-11 h-11 border-[1.5px] border-[color:var(--game-ink)] rounded-sm bg-[color:var(--game-slate)] flex items-center justify-center text-[color:var(--game-paper)]">
          <Buildings size={22} weight="duotone" />
        </div>
        <div className="text-center">
          <div className="text-lg font-bold">Urban Mayhem</div>
          <div className="text-[10px] font-semibold tracking-[0.2em] uppercase text-[color:var(--game-mute)]">
            Enter your team code
          </div>
        </div>
        <input
          type="text"
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          placeholder="ABCD"
          maxLength={4}
          autoFocus
          className="w-full text-center text-2xl font-bold tracking-[0.3em] uppercase py-2.5 rounded-sm border border-[color:var(--game-rule)] bg-white"
        />
        {joinError && <div className="text-sm text-[#8f1e18]">{joinError}</div>}
        <button
          type="submit"
          disabled={!code.trim()}
          className="w-full py-2.5 rounded-sm bg-[color:var(--game-slate)] text-[color:var(--game-paper)] font-semibold disabled:opacity-50"
        >
          Join
        </button>
      </form>
    </div>
  );
}

export default JoinScreen;
