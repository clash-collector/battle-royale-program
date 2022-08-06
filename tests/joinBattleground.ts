import * as anchor from "@project-serum/anchor";
import { getAccount, getAssociatedTokenAddress } from "@solana/spl-token";
import { expect } from "chai";
import { Battleground, BattleRoyale, CollectionInfo } from "battle-royale-ts";
import { airdropWallets, defaultProvider, smbMints } from "./common";
import { mintNft, mintToken, verifyCollection } from "./utils";

describe("Join a Battleground", () => {
  const nftSymbol = "DAPE";
  // Addresses of verified creators of the NFT collection
  const creatorAddresses: anchor.web3.PublicKey[] = [...Array(5)].map(
    () => new anchor.web3.Keypair().publicKey
  );

  const gameMaster = new anchor.Wallet(anchor.web3.Keypair.generate());
  const creator = new anchor.Wallet(anchor.web3.Keypair.generate());
  const player = new anchor.Wallet(anchor.web3.Keypair.generate());
  let provider: anchor.AnchorProvider;
  let potMint: anchor.web3.PublicKey;
  let nftMint: anchor.web3.PublicKey;
  let nftMetadata: anchor.web3.PublicKey;
  let collectionMint: anchor.web3.PublicKey;
  let battleRoyale: BattleRoyale;
  let battleground: Battleground;
  let fee: number;
  let participantsCap = 100;
  let initialAmount = 10000;
  let entryFee = new anchor.BN(100);
  let actionPointsPerDay = 10;
  let collectionInfo: CollectionInfo;

  before(async () => {
    provider = new anchor.AnchorProvider(defaultProvider.connection, gameMaster, {});

    await airdropWallets([gameMaster, creator, player], provider);

    /// Create the pot token and mint some to the player
    potMint = (await mintToken(provider, creator.payer, player.publicKey, initialAmount)).mint;
    // Create the collection
    const { mint: collection } = await mintNft(
      provider,
      nftSymbol,
      gameMaster.payer,
      player.publicKey
    );
    collectionMint = collection;
    const { mint } = await mintNft(
      provider,
      nftSymbol,
      gameMaster.payer,
      player.publicKey,
      collectionMint
    );
    nftMint = mint;

    // Collection authority verifies that the NFT belongs to the collection
    await verifyCollection(provider, mint, collectionMint, gameMaster.payer);

    collectionInfo = {
      v2: {
        collectionMint,
      },
    };

    battleRoyale = new BattleRoyale(gameMaster.publicKey, provider);

    fee = 100;
    await battleRoyale.initialize(fee);
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
      .connect(new anchor.AnchorProvider(provider.connection, player, { commitment: "processed" }))
      .join(nftMint, attack, defense);
    const state = await participant.getParticipantState();

    expect(state.battleground.toString()).to.equal(
      participant.battleground.addresses.battleground.toString()
    );
    expect(state.nftMint.toString()).to.equal(participant.nft.toString());
    expect(state.attack).to.equal(100 + attack);
    expect(state.defense).to.equal(50 + defense);
    expect(state.dead).to.equal(false);
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
});
