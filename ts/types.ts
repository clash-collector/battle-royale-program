import * as anchor from "@project-serum/anchor";
import { BattleRoyaleProgram } from "../target/types/battle_royale_program";

// export declare type CollectionInfo = anchor.IdlTypes<BattleRoyaleProgram>["CollectionInfo"];
export interface CollectionInfo {
  v1?: {
    verifiedCreators: anchor.web3.PublicKey[];
    symbol: string;
    whitelistRoot: number[];
  };
  v2?: {
    collectionMint: anchor.web3.PublicKey;
  };
}

export enum BattlegroundStatus {
  Preparing = "preparing",
  Ongoing = "ongoing",
  Finished = "finished",
}

export declare type ActionType = anchor.IdlTypes<BattleRoyaleProgram>["ActionType"];
// export enum ActionType {
//   Attack = "attack",
//   Heal = "heal",
// }
