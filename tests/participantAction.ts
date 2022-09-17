import * as anchor from "@project-serum/anchor";

import { BattleRoyale, Battleground, CollectionInfo, Participant } from "../ts";
import { airdropWallets, gameMaster } from "./common";
import {
  getAssociatedTokenAddress,
  getOrCreateAssociatedTokenAccount,
  transferChecked,
} from "@solana/spl-token";
import { mintNft, mintToken, verifyCollection } from "./utils";

import { expect } from "chai";

describe("Participant action", () => {
  const nftSymbol = "DAPE";

  const creator = new anchor.Wallet(anchor.web3.Keypair.generate());
  const players = Array(2)
    .fill(0)
    .map((e) => new anchor.Wallet(anchor.web3.Keypair.generate()));
  let provider: anchor.AnchorProvider;
  let potMint: anchor.web3.PublicKey;
  let nftMints: anchor.web3.PublicKey[];
  let collectionMint: anchor.web3.PublicKey;
  let battleRoyale: BattleRoyale;
  let battleground: Battleground;
  let participants: Participant[] = Array(2);
  let fee: number;
  let participantsCap = 2;
  let initialAmount = 10000;
  let entryFee = new anchor.BN(100);
  let attack = 50;
  let defense = 50;
  let actionPointsPerDay = 8640000;
  let collectionInfo: CollectionInfo;

  before(async () => {
    provider = new anchor.AnchorProvider(anchor.getProvider().connection, gameMaster, {});

    await airdropWallets([gameMaster, creator, ...players], provider);

    // Create the pot token and mint some to the player
    potMint = (await mintToken(provider, creator.payer, players[0].publicKey, initialAmount, 8))
      .mint;
    // Give half to the other player
    await transferChecked(
      provider.connection,
      players[0].payer,
      await getAssociatedTokenAddress(potMint, players[0].publicKey),
      potMint,
      (
        await getOrCreateAssociatedTokenAccount(
          provider.connection,
          players[1].payer,
          potMint,
          players[1].publicKey
        )
      ).address,
      players[0].publicKey,
      initialAmount / 2,
      8
    );

    // Create the collection
    const { mint: collection } = await mintNft(
      provider,
      nftSymbol,
      gameMaster.payer,
      players[0].publicKey
    );
    collectionMint = collection;

    // Create tokens
    const { mint: mint1 } = await mintNft(
      provider,
      nftSymbol,
      gameMaster.payer,
      players[0].publicKey,
      collectionMint
    );
    const { mint: mint2 } = await mintNft(
      provider,
      nftSymbol,
      gameMaster.payer,
      players[1].publicKey,
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

    battleRoyale = new BattleRoyale(provider);

    // Initialize BattleRoyale
    fee = 100;
    await battleRoyale.initialize(gameMaster.publicKey, gameMaster.publicKey, fee);

    // Create the battleground
    battleground = await battleRoyale.createBattleground(
      collectionInfo,
      potMint,
      participantsCap,
      entryFee,
      actionPointsPerDay
    );

    // Join with one participant
    participants[0] = await battleground
      .connect(new anchor.AnchorProvider(provider.connection, players[0], {}))
      .join(nftMints[0], attack, defense);
    participants[1] = await battleground
      .connect(new anchor.AnchorProvider(provider.connection, players[1], {}))
      .join(nftMints[1], attack, defense);

    // Start the battle
    await battleground.start();
    await new Promise((resolve) => setTimeout(() => resolve(undefined), 1000));
  });

  it("does all actions", async () => {
    const pointsSpent = 1;
    await participants[0].action(participants[1], { attack: {} }, pointsSpent);
    let state1 = await participants[0].getParticipantState();
    let state2 = await participants[1].getParticipantState();

    expect(state1.actionPointsSpent).to.equal(pointsSpent);
    expect(state2.healthPoints).to.equal(750 + 5 * (defense + 50) - (100 + attack) * pointsSpent);

    const pointsSpent2 = 2;
    await participants[0].action(participants[1], { heal: {} }, pointsSpent2);
    state2 = await participants[1].getParticipantState();

    expect(state2.healthPoints).to.equal(
      750 + 5 * (defense + 50) - (100 + attack) * pointsSpent + ((defense + 50) * pointsSpent2) / 2
    );
  });
});
