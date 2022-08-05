import * as anchor from "@project-serum/anchor";
import { Program } from "@project-serum/anchor";
import { BATTLE_ROYALE_PROGRAM_ID, PARTICIPANT_STATE_SEEDS } from "./constants";
import { BattleRoyaleProgram } from "../target/types/battle_royale_program";
import BattleRoyaleIdl from "../target/idl/battle_royale_program.json";
import {
  ASSOCIATED_TOKEN_PROGRAM_ID,
  getAccount,
  getAssociatedTokenAddress,
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import Battleground, { BattlegroundAddresses } from "./battleground";
import { getMerkleProof, getTokenMetadata } from "./utils";
import { ActionType } from "./types";

export interface ParticipantAddresses extends BattlegroundAddresses {
  participant: anchor.web3.PublicKey;
}

class Participant {
  provider: anchor.AnchorProvider;
  program: Program<BattleRoyaleProgram>;
  battleground: Battleground;
  nft: anchor.web3.PublicKey;
  nftMetadata: anchor.web3.PublicKey;
  addresses: ParticipantAddresses;

  constructor(
    battleground: Battleground,
    nft: anchor.web3.PublicKey,
    provider: anchor.AnchorProvider
  ) {
    this.connect(provider);
    this.battleground = battleground;
    this.nft = nft;
    this.nftMetadata = getTokenMetadata(this.nft);
    this.addresses = {
      ...battleground.addresses,
      participant: anchor.web3.PublicKey.findProgramAddressSync(
        [PARTICIPANT_STATE_SEEDS, battleground.addresses.battleground.toBuffer(), nft.toBuffer()],
        BATTLE_ROYALE_PROGRAM_ID
      )[0],
    };
  }

  async join(attack: number, defense: number, whitelistProof: number[][] | null = null) {
    const potAccount = await getAssociatedTokenAddress(
      this.addresses.potMint,
      this.addresses.authority,
      true
    );
    const devAccount = await getAssociatedTokenAddress(
      this.addresses.potMint,
      this.addresses.gameMaster,
      true
    );
    const playerAccount = await getAssociatedTokenAddress(
      this.addresses.potMint,
      this.provider.publicKey,
      true
    );
    const playerNftTokenAccount = await getAssociatedTokenAddress(
      this.nft,
      this.provider.publicKey,
      true
    );

    const tx = await this.program.methods
      .joinBattleground(attack, defense, whitelistProof)
      .accounts({
        signer: this.provider.publicKey,
        gameMaster: this.addresses.gameMaster,
        battleRoyaleState: this.addresses.battleRoyale,
        battlegroundState: this.addresses.battleground,
        potMint: this.addresses.potMint,
        nftMint: this.nft,
        nftMetadata: this.nftMetadata,
        potAccount,
        devAccount,
        playerAccount,
        playerNftTokenAccount,
      })
      .rpc();
    await this.provider.connection.confirmTransaction(tx);
  }

  async action(target: Participant, actionType: ActionType, actionPoints: number) {
    const playerNftTokenAccount = await getAssociatedTokenAddress(
      this.nft,
      this.provider.publicKey,
      true
    );

    const tx = await this.program.methods
      .participantAction(actionType, actionPoints)
      .accounts({
        signer: this.provider.publicKey,
        battleRoyaleState: this.addresses.battleRoyale,
        battlegroundState: this.addresses.battleground,
        participantState: this.addresses.participant,
        targetParticipantState: target.addresses.participant,
        playerNftTokenAccount,
        clock: anchor.web3.SYSVAR_CLOCK_PUBKEY,
      })
      .rpc();
    await this.provider.connection.confirmTransaction(tx);
  }

  async getParticipantState() {
    return await this.program.account.participantState.fetch(this.addresses.participant);
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

export default Participant;
