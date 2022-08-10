import * as anchor from "@project-serum/anchor";

export const BATTLE_ROYALE_PROGRAM_ID = new anchor.web3.PublicKey(
  "EnLAsghi9Yp25djXr7o7RsGHQxXz8kcCpL6LnjGRmxEQ"
);

// Seeds
export const BATTLE_ROYALE_STATE_SEEDS = Buffer.from("battle-royale-state-seeds");
export const BATTLEGROUND_STATE_SEEDS = Buffer.from("battleground-state-seeds");
export const BATTLEGROUND_AUTHORITY_SEEDS = Buffer.from("battleground-authority-seeds");
export const PARTICIPANT_STATE_SEEDS = Buffer.from("participant-state-seeds");
