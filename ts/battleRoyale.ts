import * as anchor from "@project-serum/anchor";
import { Program, SystemProgram } from "@project-serum/anchor";
import { BATTLE_ROYALE_PROGRAM_ID, BATTLE_ROYALE_STATE_SEEDS } from "./constants";
import { BattleRoyaleProgram } from "../target/types/battle_royale_program";
import BattleRoyaleIdl from "../target/idl/battle_royale_program.json";
import Battleground from "./battleground";
import { CollectionInfo } from "./types";

export interface BattleRoyaleAddresses {
  gameMaster: anchor.web3.PublicKey;
  battleRoyale: anchor.web3.PublicKey;
}

class BattleRoyale {
  provider: anchor.AnchorProvider;
  program: Program<BattleRoyaleProgram>;
  addresses: BattleRoyaleAddresses;

  constructor(gameMaster: anchor.web3.PublicKey, provider: anchor.AnchorProvider) {
    this.connect(provider);
    this.addresses = {
      gameMaster: gameMaster,
      battleRoyale: anchor.web3.PublicKey.findProgramAddressSync(
        [BATTLE_ROYALE_STATE_SEEDS, gameMaster.toBuffer()],
        BATTLE_ROYALE_PROGRAM_ID
      )[0],
    };
  }

  async initialize(fee: number) {
    if (!this.provider.publicKey.equals(this.addresses.gameMaster)) {
      throw new Error("Only the creator can initialize!");
    }

    const tx = await this.program.methods
      .initialize(fee)
      .accounts({
        gameMaster: this.addresses.gameMaster,
        battleRoyaleState: this.addresses.battleRoyale,
      })
      .rpc();
    await this.provider.connection.confirmTransaction(tx);
  }

  async createBattleground(
    collectionInfo: CollectionInfo,
    potMint: anchor.web3.PublicKey,
    participantsCap: number,
    entryFee: anchor.BN,
    actionPointsPerDay: number
  ) {
    const id = (await this.getBattleRoyaleState()).lastBattlegroundId.toNumber();
    const battleground = new Battleground(this, id, potMint, this.provider);
    await battleground.create(collectionInfo, participantsCap, entryFee, actionPointsPerDay);
    return battleground;
  }

  getBattleRoyaleStateAddress() {
    const [stateAddress] = anchor.web3.PublicKey.findProgramAddressSync(
      [BATTLE_ROYALE_STATE_SEEDS, this.addresses.gameMaster.toBuffer()],
      BATTLE_ROYALE_PROGRAM_ID
    );
    return stateAddress;
  }

  async getBattleRoyaleState() {
    return await this.program.account.battleRoyaleState.fetch(this.getBattleRoyaleStateAddress());
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

export default BattleRoyale;
