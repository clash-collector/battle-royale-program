import * as anchor from "@project-serum/anchor";

import { BATTLE_ROYALE_PROGRAM_ID, BATTLE_ROYALE_STATE_SEEDS } from "./constants";
import { BattleRoyaleAccount, CollectionInfo } from "./types";

import BattleRoyaleIdl from "../target/idl/battle_royale_program.json";
import { BattleRoyaleProgram } from "../target/types/battle_royale_program";
import Battleground from "./battleground";
import { Program } from "@project-serum/anchor";

class BattleRoyale {
  program: Program<BattleRoyaleProgram>;
  addresses: {
    battleRoyale: anchor.web3.PublicKey;
  };
  state?: BattleRoyaleAccount;

  constructor(provider: anchor.AnchorProvider) {
    this.connect(provider);
    this.addresses = {
      battleRoyale: anchor.web3.PublicKey.findProgramAddressSync(
        [BATTLE_ROYALE_STATE_SEEDS],
        BATTLE_ROYALE_PROGRAM_ID
      )[0],
    };
  }

  async initialize(gameMaster: anchor.web3.PublicKey, devFund: anchor.web3.PublicKey, fee: number) {
    const tx = await this.program.methods
      .initialize(gameMaster, devFund, fee)
      .accounts({
        signer: this.program.provider.publicKey,
        battleRoyaleState: this.addresses.battleRoyale,
      })
      .rpc();
    await this.program.provider.connection.confirmTransaction(tx);
  }

  async createBattleground(
    collectionInfo: CollectionInfo,
    potMint: anchor.web3.PublicKey,
    participantsCap: number,
    entryFee: anchor.BN,
    actionPointsPerDay: number,
    whitelistRoot: number[] | null = null
  ) {
    const id = (await this.getBattleRoyaleState()).lastBattlegroundId.toNumber();
    const battleground = new Battleground(this, id, potMint, this.program.provider);
    await battleground.create(
      collectionInfo,
      participantsCap,
      entryFee,
      actionPointsPerDay,
      whitelistRoot
    );
    return battleground;
  }

  async getBattleRoyaleState() {
    this.state = await this.program.account.battleRoyaleState.fetch(this.addresses.battleRoyale);
    return this.state;
  }

  connect(provider: anchor.AnchorProvider) {
    this.program = new Program<BattleRoyaleProgram>(
      BattleRoyaleIdl as any,
      BATTLE_ROYALE_PROGRAM_ID,
      provider
    );
    return this;
  }

  async fetchBattlegroundsByCollection(info: CollectionInfo) {
    if (info.v1) {
      return await this.program.provider.connection.getProgramAccounts(BATTLE_ROYALE_PROGRAM_ID, {
        filters: [
          {
            memcmp: {
              offset: 17,
              bytes: anchor.web3.PublicKey.decode(Buffer.from(info.v1.whitelistRoot)).toString(),
            },
          },
        ],
      });
    } else {
      return await this.program.provider.connection.getProgramAccounts(BATTLE_ROYALE_PROGRAM_ID, {
        filters: [
          {
            memcmp: {
              offset: 17,
              bytes: info.v2.collectionMint.toString(),
            },
          },
        ],
      });
    }
  }
}

export default BattleRoyale;
