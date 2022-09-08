import * as anchor from "@project-serum/anchor";

import { BATTLE_ROYALE_PROGRAM_ID, PARTICIPANT_STATE_SEEDS } from "./constants";

import { ActionType } from "./types";
import BattleRoyaleIdl from "../target/idl/battle_royale_program.json";
import { BattleRoyaleProgram } from "../target/types/battle_royale_program";
import Battleground from "./battleground";
import { Program } from "@project-serum/anchor";
import { getAssociatedTokenAddress } from "@solana/spl-token";
import { getTokenMetadata } from "./utils";

class Participant {
  program: Program<BattleRoyaleProgram>;
  battleground: Battleground;
  nft: anchor.web3.PublicKey;
  nftMetadata: anchor.web3.PublicKey;
  addresses: {
    battleRoyale: anchor.web3.PublicKey;
    authority: anchor.web3.PublicKey;
    battleground: anchor.web3.PublicKey;
    potMint: anchor.web3.PublicKey;
    participant: anchor.web3.PublicKey;
  };

  constructor(battleground: Battleground, nft: anchor.web3.PublicKey, provider: anchor.Provider) {
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

  async join(
    attack: number,
    defense: number,
    collectionWhitelistProof: number[][] | null = null,
    holderWhitelistProof: number[][] | null = null
  ) {
    const gameMaster = (await this.battleground.battleRoyale.getBattleRoyaleState()).gameMaster;

    const potAccount = await getAssociatedTokenAddress(
      this.addresses.potMint,
      this.addresses.authority,
      true
    );
    const devAccount = await getAssociatedTokenAddress(this.addresses.potMint, gameMaster, true);
    const playerAccount = await getAssociatedTokenAddress(
      this.addresses.potMint,
      this.program.provider.publicKey,
      true
    );
    const playerNftTokenAccount = await getAssociatedTokenAddress(
      this.nft,
      this.program.provider.publicKey,
      true
    );

    const tx = await this.program.methods
      .joinBattleground(attack, defense, collectionWhitelistProof, holderWhitelistProof)
      .accounts({
        signer: this.program.provider.publicKey,
        gameMaster,
        battleRoyale: this.addresses.battleRoyale,
        authority: this.addresses.authority,
        battleground: this.addresses.battleground,
        participant: this.addresses.participant,
        potMint: this.addresses.potMint,
        nftMint: this.nft,
        nftMetadata: this.nftMetadata,
        potAccount,
        devAccount,
        playerAccount,
        playerNftTokenAccount,
      })
      .rpc();
    await this.program.provider.connection.confirmTransaction(tx);
  }

  async action(target: Participant, actionType: ActionType, actionPoints: number) {
    const playerNftTokenAccount = await getAssociatedTokenAddress(
      this.nft,
      this.program.provider.publicKey,
      true
    );

    const tx = await this.program.methods
      .participantAction(actionType, actionPoints)
      .accounts({
        signer: this.program.provider.publicKey,
        battleRoyaleState: this.addresses.battleRoyale,
        battlegroundState: this.addresses.battleground,
        participant: this.addresses.participant,
        targetParticipant: target.addresses.participant,
        playerNftTokenAccount,
        clock: anchor.web3.SYSVAR_CLOCK_PUBKEY,
      })
      .rpc();
    await this.program.provider.connection.confirmTransaction(tx);
  }

  async finishBattle() {
    const potAccount = await getAssociatedTokenAddress(
      this.addresses.potMint,
      this.addresses.authority,
      true
    );
    const winnerAccount = await getAssociatedTokenAddress(
      this.addresses.potMint,
      this.program.provider.publicKey,
      true
    );
    const winnerNftTokenAccount = await getAssociatedTokenAddress(
      this.nft,
      this.program.provider.publicKey,
      true
    );

    const tx = await this.program.methods
      .finishBattle()
      .accounts({
        battleRoyale: this.addresses.battleRoyale,
        battleground: this.addresses.battleground,
        authority: this.addresses.authority,
        participant: this.addresses.participant,
        winner: this.program.provider.publicKey,
        nftMint: this.nft,
        potMint: this.addresses.potMint,
        potAccount,
        winnerAccount,
        winnerNftTokenAccount,
      })
      .rpc({ skipPreflight: true });
    await this.program.provider.connection.confirmTransaction(tx);
  }

  async leave() {
    const playerNftTokenAccount = await getAssociatedTokenAddress(
      this.nft,
      this.program.provider.publicKey,
      true
    );

    const tx = await this.program.methods
      .leaveBattleground()
      .accounts({
        signer: this.program.provider.publicKey,
        battleRoyale: this.addresses.battleRoyale,
        battleground: this.addresses.battleground,
        participant: this.addresses.participant,
        nftMint: this.nft,
        playerNftTokenAccount,
      })
      .rpc({ skipPreflight: true });
    await this.program.provider.connection.confirmTransaction(tx);
  }

  async getParticipantState() {
    return await this.program.account.participantState.fetch(this.addresses.participant);
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

export default Participant;
