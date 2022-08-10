import * as anchor from "@project-serum/anchor";
import { Program } from "@project-serum/anchor";
import {
  BATTLEGROUND_STATE_SEEDS,
  BATTLEGROUND_AUTHORITY_SEEDS,
  BATTLE_ROYALE_PROGRAM_ID,
} from "./constants";
import { BattleRoyaleProgram } from "./programTypes";
import BattleRoyaleIdl from "./idl.json";
import BattleRoyale from "./battleRoyale";
import { CollectionInfo } from "./types";
import Participant from "./participant";

class Battleground {
  program: Program<BattleRoyaleProgram>;
  battleRoyale: BattleRoyale;
  id: number;
  addresses: {
    battleRoyale: anchor.web3.PublicKey;
    authority: anchor.web3.PublicKey;
    battleground: anchor.web3.PublicKey;
    potMint: anchor.web3.PublicKey;
  };

  constructor(
    battleRoyale: BattleRoyale,
    id: number,
    potMint: anchor.web3.PublicKey,
    provider: anchor.Provider
  ) {
    this.connect(provider);
    this.battleRoyale = battleRoyale;
    this.id = id;
    this.addresses = {
      ...battleRoyale.addresses,
      authority: anchor.web3.PublicKey.findProgramAddressSync(
        [BATTLEGROUND_AUTHORITY_SEEDS, new anchor.BN(id).toBuffer("le", 8)],
        BATTLE_ROYALE_PROGRAM_ID
      )[0],
      battleground: anchor.web3.PublicKey.findProgramAddressSync(
        [BATTLEGROUND_STATE_SEEDS, new anchor.BN(id).toBuffer("le", 8)],
        BATTLE_ROYALE_PROGRAM_ID
      )[0],
      potMint,
    };
  }

  async create(
    collectionInfo: CollectionInfo,
    participantsCap: number,
    entryFee: anchor.BN,
    actionPointsPerDay: number
  ) {
    const tx = await this.program.methods
      .createBattleground(collectionInfo as any, participantsCap, entryFee, actionPointsPerDay)
      .accounts({
        signer: this.program.provider.publicKey,
        battleRoyaleState: this.addresses.battleRoyale,
        potMint: this.addresses.potMint,
      })
      .rpc();
    await this.program.provider.connection.confirmTransaction(tx);
  }

  async join(
    nft: anchor.web3.PublicKey,
    attack: number,
    defense: number,
    whitelistProof: number[][] | null = null
  ) {
    const participant = new Participant(this, nft, this.program.provider);
    await participant.join(attack, defense, whitelistProof);
    return participant;
  }

  async start() {
    const tx = await this.program.methods
      .startBattle()
      .accounts({
        battleRoyale: this.addresses.battleRoyale,
        battleground: this.addresses.battleground,
        clock: anchor.web3.SYSVAR_CLOCK_PUBKEY,
      })
      .rpc();
    await this.program.provider.connection.confirmTransaction(tx);
  }

  async getBattlegroundState() {
    return await this.program.account.battlegroundState.fetch(this.addresses.battleground);
  }

  connect(provider: anchor.Provider) {
    this.program = new Program<BattleRoyaleProgram>(
      BattleRoyaleIdl as any,
      BATTLE_ROYALE_PROGRAM_ID,
      provider
    );
    return this;
  }
}

export default Battleground;