import * as anchor from "@project-serum/anchor";

export const BATTLE_ROYALE_PROGRAM_ID = new anchor.web3.PublicKey(
  "9zd3zSw8AGVGbsqQ2aT1vi92MCtW7Kbe8pTiuFCJUa1Z"
);

// Seeds
export const BATTLE_ROYALE_STATE_SEEDS = Buffer.from("battle-royale-state-seeds");
export const BATTLEGROUND_STATE_SEEDS = Buffer.from("battleground-state-seeds");
export const BATTLEGROUND_AUTHORITY_SEEDS = Buffer.from("battleground-authority-seeds");
export const PARTICIPANT_STATE_SEEDS = Buffer.from("participant-state-seeds");
