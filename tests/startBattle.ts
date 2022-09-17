import * as anchor from "@project-serum/anchor";

import { BattleRoyale, Battleground, BattlegroundStatus, CollectionInfo } from "../ts";
import { airdropWallets, gameMaster } from "./common";
import { mintCollection, mintToken } from "./utils";

import { expect } from "chai";

describe("Start a Battleground", () => {
  const nftSymbol = "DAPE";

  const creator = new anchor.Wallet(anchor.web3.Keypair.generate());
  const player = new anchor.Wallet(anchor.web3.Keypair.generate());
  let provider: anchor.AnchorProvider;
  let potMint: anchor.web3.PublicKey;
  let nftMint: anchor.web3.PublicKey;
  let battleRoyale: BattleRoyale;
  let battleground: Battleground;
  let fee: number;
  let participantsCap = 1;
  let initialAmount = 10000;
  let entryFee = new anchor.BN(100);
  let creatorFee = 100;
  let actionPointsPerDay = 10;
  let collectionInfo: CollectionInfo;

  before(async () => {
    provider = new anchor.AnchorProvider(anchor.getProvider().connection, gameMaster, {});

    await airdropWallets([gameMaster, creator, player], provider);

    /// Create the pot token and mint some to the player
    potMint = (await mintToken(provider, creator.payer, player.publicKey, initialAmount)).mint;

    // Create the collection
    const { mints, collectionMint } = await mintCollection(provider, nftSymbol, gameMaster.payer, [
      player.publicKey,
    ]);
    nftMint = mints[0];

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
      creator.publicKey,
      creatorFee,
      actionPointsPerDay
    );

    // Join with one participant
    let attack = 50;
    let defense = 50;
    await battleground
      .connect(new anchor.AnchorProvider(provider.connection, player, {}))
      .join(nftMint, attack, defense);
  });

  it("start a battle", async () => {
    await battleground.start();
    const state = await battleground.getBattlegroundState();

    expect(state.startTime.toString()).to.not.equal(new anchor.BN(0).toString());
    expect(state.status[BattlegroundStatus.Ongoing]).to.exist;
  });
});
