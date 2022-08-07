import * as anchor from "@project-serum/anchor";
import { Program, SystemProgram } from "@project-serum/anchor";
import { BATTLE_ROYALE_PROGRAM_ID, BATTLE_ROYALE_STATE_SEEDS } from "./constants";
import { BattleRoyaleProgram } from "../../target/types/battle_royale_program";
import BattleRoyaleIdl from "../../target/idl/battle_royale_program.json";
import Battleground from "./battleground";
import { BattleRoyaleAccount, CollectionInfo } from "./types";

export interface BattleRoyaleAddresses {
  battleRoyale: anchor.web3.PublicKey;
}

class BattleRoyale {
  provider: anchor.AnchorProvider;
  program: Program<BattleRoyaleProgram>;
  addresses: BattleRoyaleAddresses;
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

  async initialize(gameMaster: anchor.web3.PublicKey, fee: number) {
    const tx = await this.program.methods
      .initialize(gameMaster, fee)
      .accounts({
        signer: this.provider.publicKey,
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

  async getBattleRoyaleState() {
    this.state = await this.program.account.battleRoyaleState.fetch(this.addresses.battleRoyale);
    return this.state;
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

  async fetchBattlegroundsByCollection(info: CollectionInfo) {
    if (info.v1) {
      return await this.provider.connection.getProgramAccounts(BATTLE_ROYALE_PROGRAM_ID, {
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
      return await this.provider.connection.getProgramAccounts(BATTLE_ROYALE_PROGRAM_ID, {
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
