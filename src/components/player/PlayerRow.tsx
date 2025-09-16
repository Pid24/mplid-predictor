"use client";

import * as React from "react";

export type Player = {
  name?: string | null;
  player_info?: string | null;
  player_logo?: string | null;
  team?: string | null;
  pick?: number | null;
  pick_rate?: number | string | null;
};

function formatRate(r: Player["pick_rate"]) {
  if (r == null) return "-";
  if (typeof r === "number") return `${r}%`;
  return r;
}

type Props = { heroName: string; p: Player };

export default function PlayerRow({ heroName, p }: Props) {
  const alt = p.name ?? p.player_info ?? "player";

  return (
    <div className="flex items-center justify-between rounded-xl bg-gray-50 px-3 py-2">
      <div className="flex items-center gap-3">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={p.player_logo ?? ""}
          alt={alt}
          width={28}
          height={28}
          className="h-7 w-7 rounded-full object-cover"
          onError={(e: React.SyntheticEvent<HTMLImageElement>) => {
            e.currentTarget.style.display = "none";
          }}
        />
        <div className="text-sm">
          <div className="font-medium">{p.name ?? p.player_info}</div>
          {p.team ? <div className="text-gray-500">{p.team}</div> : null}
        </div>
      </div>

      <div className="text-right text-sm">
        <div className="font-semibold">{p.pick ?? 0} picks</div>
        {"pick_rate" in p ? <div className="text-gray-500">{formatRate(p.pick_rate)}</div> : null}
      </div>
    </div>
  );
}
