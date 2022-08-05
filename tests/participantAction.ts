import * as anchor from "@project-serum/anchor";
import {
  createMint,
  getAccount,
  getAssociatedTokenAddress,
  getOrCreateAssociatedTokenAccount,
  mintTo,
  mintToChecked,
  TokenInstruction,
  transfer,
  transferChecked,
} from "@solana/spl-token";
import { expect } from "chai";
import MerkleTree from "merkletreejs";
import {
  ActionType,
  Battleground,
  BattlegroundStatus,
  BattleRoyale,
  CollectionInfo,
  mintNft,
  mintToken,
  Participant,
  verifyCollection,
} from "../ts";
import { airdropWallets, defaultProvider, smbMints } from "./common";

describe("Participant action", () => {
  const nftSymbol = "DAPE";

  const gameMaster = new anchor.Wallet(anchor.web3.Keypair.generate());
  const creator = new anchor.Wallet(anchor.web3.Keypair.generate());
  const player = new anchor.Wallet(anchor.web3.Keypair.generate());
  const player2 = new anchor.Wallet(anchor.web3.Keypair.generate());
  let provider: anchor.AnchorProvider;
  let potMint: anchor.web3.PublicKey;
  let nftMints: anchor.web3.PublicKey[];
  let collectionMint: anchor.web3.PublicKey;
  let battleRoyale: BattleRoyale;
  let battleground: Battleground;
  let participant1: Participant;
  let participant2: Participant;
  let fee: number;
  let participantsCap = 2;
  let initialAmount = new anchor.BN(10000);
  let entryFee = new anchor.BN(100);
  let attack = 50;
  let defense = 50;
  let actionPointsPerDay = 86400;
  let collectionInfo: CollectionInfo;

  before(async () => {
    provider = new anchor.AnchorProvider(anchor.getProvider().connection, gameMaster, {});

    await airdropWallets([gameMaster, creator, player, player2], provider);

    // Create the pot token and mint some to the player
    potMint = (await mintToken(provider, creator.payer, player.publicKey, initialAmount, 8)).mint;
    // Give half to the other player
    await transferChecked(
      provider.connection,
      player.payer,
      await getAssociatedTokenAddress(potMint, player.publicKey),
      potMint,
      (
        await getOrCreateAssociatedTokenAccount(
          provider.connection,
          player2.payer,
          potMint,
          player2.publicKey
        )
      ).address,
      player.publicKey,
      initialAmount.toNumber() / 2,
      8
    );

    // Create the collection
    const { mint: collection } = await mintNft(
      provider,
      nftSymbol,
      gameMaster.payer,
      player.publicKey
    );
    collectionMint = collection;

    // Create tokens
    const { mint: mint1 } = await mintNft(
      provider,
      nftSymbol,
      gameMaster.payer,
      player.publicKey,
      collectionMint
    );
    const { mint: mint2 } = await mintNft(
      provider,
      nftSymbol,
      gameMaster.payer,
      player2.publicKey,
      collectionMint
    );
    nftMints = [mint1, mint2];

    // Collection authority verifies that the NFT belongs to the collection
    await verifyCollection(provider, mint1, collectionMint, gameMaster.payer);
    await verifyCollection(provider, mint2, collectionMint, gameMaster.payer);

    collectionInfo = {
      v2: {
        collectionMint,
      },
    };

    battleRoyale = new BattleRoyale(gameMaster.publicKey, provider);

    // Initialize BattleRoyale
    fee = 100;
    await battleRoyale.initialize(fee);

    // Create the battleground
    battleground = await battleRoyale.createBattleground(
      collectionInfo,
      potMint,
      participantsCap,
      entryFee,
      actionPointsPerDay
    );

    // Join with one participant
    participant1 = await battleground
      .connect(new anchor.AnchorProvider(provider.connection, player, {}))
      .join(nftMints[0], attack, defense);
    participant2 = await battleground
      .connect(new anchor.AnchorProvider(provider.connection, player2, {}))
      .join(nftMints[1], attack, defense);

    // Start the battle
    await battleground.start();
  });

  it("does all actions", async () => {
    const pointsSpent = 1;
    await participant1.action(participant2, { attack: {} }, pointsSpent);
    let state1 = await participant1.getParticipantState();
    let state2 = await participant2.getParticipantState();

    expect(state1.actionPointsSpent).to.equal(pointsSpent);
    expect(state2.healthPoints).to.equal(750 + 5 * (defense + 50) - (100 + attack) * pointsSpent);

    const pointsSpent2 = 2;
    await participant1.action(participant2, { heal: {} }, pointsSpent2);
    state2 = await participant2.getParticipantState();

    expect(state2.healthPoints).to.equal(
      750 + 5 * (defense + 50) - (100 + attack) * pointsSpent + ((defense + 50) * pointsSpent2) / 2
    );
  });
});
