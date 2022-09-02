import * as anchor from "@project-serum/anchor";
import { getAccount, getAssociatedTokenAddress } from "@solana/spl-token";
import { expect } from "chai";
import { Battleground, BattleRoyale, CollectionInfo } from "../ts";
import { airdropWallets, defaultProvider, gameMaster, smbMints } from "./common";
import { expectRevert, mintCollection, mintNft, mintToken, verifyCollection } from "./utils";

describe("Join a Battleground", () => {
  const nftSymbol = "DAPE";
  // Addresses of verified creators of the NFT collection
  const creatorAddresses: anchor.web3.PublicKey[] = [...Array(5)].map(
    () => new anchor.web3.Keypair().publicKey
  );

  const creator = new anchor.Wallet(anchor.web3.Keypair.generate());
  const player = new anchor.Wallet(anchor.web3.Keypair.generate());
  const player2 = new anchor.Wallet(anchor.web3.Keypair.generate());
  let provider: anchor.AnchorProvider;
  let potMint: anchor.web3.PublicKey;
  let nftMints: anchor.web3.PublicKey[];
  let battleRoyale: BattleRoyale;
  let battleground: Battleground;
  let fee: number;
  let participantsCap = 2;
  let initialAmount = 10000;
  let entryFee = new anchor.BN(100);
  let actionPointsPerDay = 10;
  let collectionInfo: CollectionInfo;

  before(async () => {
    provider = new anchor.AnchorProvider(defaultProvider.connection, gameMaster, {});

    await airdropWallets([gameMaster, creator, player, player2], provider);

    /// Create the pot token and mint some to the player
    potMint = (await mintToken(provider, creator.payer, player.publicKey, initialAmount)).mint;
    // Create the collection
    const { mints, collectionMint } = await mintCollection(
      provider,
      nftSymbol,
      gameMaster.payer,
      [player.publicKey, player2.publicKey],
      4
    );
    nftMints = mints;

    collectionInfo = {
      v2: {
        collectionMint,
      },
    };

    battleRoyale = new BattleRoyale(provider);

    // Initialize BattleRoyale
    fee = 100;
    await battleRoyale.initialize(gameMaster.publicKey, fee);
    battleground = await battleRoyale.createBattleground(
      collectionInfo,
      potMint,
      participantsCap,
      entryFee,
      actionPointsPerDay
    );
  });

  it("join a battleground", async () => {
    let attack = 50;
    let defense = 50;
    const participant = await battleground
      .connect(new anchor.AnchorProvider(provider.connection, player, {}))
      .join(nftMints[0], attack, defense);
    const state = await participant.getParticipantState();

    expect(state.battleground.toString()).to.equal(participant.addresses.battleground.toString());
    expect(state.nftMint.toString()).to.equal(participant.nft.toString());
    expect(state.attack).to.equal(100 + attack);
    expect(state.defense).to.equal(50 + defense);
    expect(state.alive).to.equal(true);
    expect(
      (
        await getAccount(
          provider.connection,
          await getAssociatedTokenAddress(potMint, player.publicKey)
        )
      ).amount.toString()
    ).to.equal((initialAmount - (initialAmount * fee) / 10000).toString());

    expect((await battleground.getBattlegroundState()).participants).to.equal(1);
  });

  it("fails when reentering with the same token", async () => {
    let attack = 50;
    let defense = 50;
    await expectRevert(
      battleground
        .connect(new anchor.AnchorProvider(provider.connection, player, {}))
        .join(nftMints[0], attack, defense),
      "already in use"
    );
  });

  it("fails when it's full", async () => {
    let attack = 50;
    let defense = 50;

    await battleground
      .connect(new anchor.AnchorProvider(provider.connection, player, {}))
      .join(nftMints[2], attack, defense);
    await expectRevert(
      battleground
        .connect(new anchor.AnchorProvider(provider.connection, player2, {}))
        .join(nftMints[1], attack, defense),
      "ConstraintRaw"
    );
  });
});
