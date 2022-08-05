import * as anchor from "@project-serum/anchor";
import { Program, SystemProgram } from "@project-serum/anchor";
import {
  BATTLEGROUND_STATE_SEEDS,
  BATTLEGROUND_AUTHORITY_SEEDS,
  BATTLE_ROYALE_PROGRAM_ID,
} from "./constants";
import { BattleRoyaleProgram } from "../target/types/battle_royale_program";
import BattleRoyaleIdl from "../target/idl/battle_royale_program.json";
import BattleRoyale, { BattleRoyaleAddresses } from "./battleRoyale";
import { CollectionInfo } from "./types";
import Participant from "./participant";
import { getAccount } from "@solana/spl-token";

export interface BattlegroundAddresses extends BattleRoyaleAddresses {
  authority: anchor.web3.PublicKey;
  battleground: anchor.web3.PublicKey;
  potMint: anchor.web3.PublicKey;
}

class Battleground {
  provider: anchor.AnchorProvider;
  program: Program<BattleRoyaleProgram>;
  battleRoyale: BattleRoyale;
  id: number;
  addresses: BattlegroundAddresses;

  constructor(
    battleRoyale: BattleRoyale,
    id: number,
    potMint: anchor.web3.PublicKey,
    provider: anchor.AnchorProvider
  ) {
    this.connect(provider);
    this.battleRoyale = battleRoyale;
    this.id = id;
    this.addresses = {
      ...battleRoyale.addresses,
      authority: anchor.web3.PublicKey.findProgramAddressSync(
        [
          BATTLEGROUND_AUTHORITY_SEEDS,
          battleRoyale.addresses.battleRoyale.toBuffer(),
          new anchor.BN(id).toBuffer("le", 8),
        ],
        BATTLE_ROYALE_PROGRAM_ID
      )[0],
      battleground: anchor.web3.PublicKey.findProgramAddressSync(
        [
          BATTLEGROUND_STATE_SEEDS,
          battleRoyale.addresses.battleRoyale.toBuffer(),
          new anchor.BN(id).toBuffer("le", 8),
        ],
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
        signer: this.provider.publicKey,
        battleRoyaleState: this.addresses.battleRoyale,
        potMint: this.addresses.potMint,
      })
      .rpc();
    await this.provider.connection.confirmTransaction(tx);
  }

  async join(
    nft: anchor.web3.PublicKey,
    attack: number,
    defense: number,
    whitelistProof: number[][] | null = null
  ) {
    const participant = new Participant(this, nft, this.provider);
    await participant.join(attack, defense, whitelistProof);
    return participant;
  }

  async start() {
    const tx = await this.program.methods
      .startBattle()
      .accounts({
        battleRoyaleState: this.addresses.battleRoyale,
        battlegroundState: this.addresses.battleground,
        clock: anchor.web3.SYSVAR_CLOCK_PUBKEY,
      })
      .rpc();
    await this.provider.connection.confirmTransaction(tx);
  }

  async getBattlegroundState() {
    return await this.program.account.battlegroundState.fetch(this.addresses.battleground);
  }

  connect(provider: anchor.AnchorProvider) {
    this.provider = new anchor.AnchorProvider(provider.connection, provider.wallet, {});
    this.program = new Program<BattleRoyaleProgram>(
      BattleRoyaleIdl as any,
      BATTLE_ROYALE_PROGRAM_ID,
      this.provider
    );
    return this;
  }
}

export default Battleground;
