import React from "react";
import { Laptop, Buildings } from "@phosphor-icons/react";

// Full-viewport block for phones/narrow windows -- the board, drag/drop
// and hover tooltips genuinely don't work at phone width, so rather
// than ship a broken cramped layout, refuse cleanly and say why.
function UnsupportedDeviceScreen() {
  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-[#e9e5db] px-6 text-center">
      <div className="max-w-[360px] flex flex-col items-center gap-4">
        <div className="w-12 h-12 rounded-md bg-[#2b4c6f] flex items-center justify-center text-[#f4f1ea]">
          <Buildings size={26} weight="duotone" />
        </div>
        <h1 className="text-lg font-bold text-[#201e1d]">Urban Mayhem needs a laptop</h1>
        <p className="text-sm leading-relaxed text-[#5c5548]">
          This screen isn't optimized for phones or small windows — the city grid, drag-and-drop
          placement, and hover details all need more room than this display gives them.
        </p>
        <div className="flex items-center gap-2 text-xs font-semibold text-[#2b4c6f] mt-1">
          <Laptop size={16} weight="duotone" />
          Please switch to a laptop to play.
        </div>
      </div>
    </div>
  );
}

export default UnsupportedDeviceScreen;
