import * as anchor from "@project-serum/anchor";

import { BattleRoyale, Battleground, CollectionInfo } from "../ts";
import { airdropWallets, defaultProvider, gameMaster, smbMints } from "./common";
import {
  expectRevert,
  getMerkleProof,
  getMerkleTree,
  mintCollection,
  mintNft,
  mintToken,
  verifyCollection,
} from "./utils";
import { getAccount, getAssociatedTokenAddress } from "@solana/spl-token";

import MerkleTree from "merkletreejs";
import { expect } from "chai";
import keccak256 from "keccak256";

describe("Join a Battleground", () => {
  const nftSymbol = "DAPE";

  const creator = new anchor.Wallet(anchor.web3.Keypair.generate());
  const players = Array(2)
    .fill(0)
    .map((e) => new anchor.Wallet(anchor.web3.Keypair.generate()));
  let provider: anchor.AnchorProvider;
  let potMint: anchor.web3.PublicKey;
  let nftMints: anchor.web3.PublicKey[];
  let battleRoyale: BattleRoyale;
  let battleground: Battleground;
  let fee: number;
  let participantsCap = 2;
  let initialAmount = 10000;
  let entryFee = new anchor.BN(100);
  let creatorFee = 100;
  let actionPointsPerDay = 10;
  let collectionInfo: CollectionInfo;

  before(async () => {
    provider = new anchor.AnchorProvider(defaultProvider.connection, gameMaster, {});

    await airdropWallets([gameMaster, creator, ...players], provider);

    /// Create the pot token and mint some to the player
    potMint = (await mintToken(provider, creator.payer, players[0].publicKey, initialAmount)).mint;
    // Create the collection
    const { mints, collectionMint } = await mintCollection(
      provider,
      nftSymbol,
      gameMaster.payer,
      players.map((e) => e.publicKey),
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
    await battleRoyale.initialize(gameMaster.publicKey, gameMaster.publicKey, fee);
  });

  describe("without whitelisting holders", () => {
    creatorFee = 100;

    before(async () => {
      battleground = await battleRoyale.createBattleground(
        collectionInfo,
        potMint,
        participantsCap,
        entryFee,
        creator.publicKey,
        creatorFee,
        actionPointsPerDay
      );
    });

    it("join a battleground", async () => {
      let attack = 50;
      let defense = 50;
      const participant = await battleground
        .connect(new anchor.AnchorProvider(provider.connection, players[0], {}))
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
            await getAssociatedTokenAddress(potMint, players[0].publicKey)
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
          .connect(new anchor.AnchorProvider(provider.connection, players[0], {}))
          .join(nftMints[0], attack, defense),
        "already in use"
      );
    });

    it("fails when it's full", async () => {
      let attack = 50;
      let defense = 50;

      await battleground
        .connect(new anchor.AnchorProvider(provider.connection, players[0], {}))
        .join(nftMints[2], attack, defense);
      await expectRevert(
        battleground
          .connect(new anchor.AnchorProvider(provider.connection, players[1], {}))
          .join(nftMints[1], attack, defense),
        "ConstraintRaw"
      );
    });
  });

  describe("whitelisting holders", () => {
    let merkleTree: MerkleTree;
    const leaves = [
      players[0].publicKey,
      ...Array(10)
        .fill(0)
        .map(() => anchor.web3.Keypair.generate().publicKey),
    ].map((e) => keccak256(e.toBuffer()));

    before(async () => {
      merkleTree = new MerkleTree(leaves, keccak256, { sort: true });
      battleground = await battleRoyale.createBattleground(
        collectionInfo,
        potMint,
        participantsCap,
        entryFee,
        creator.publicKey,
        creatorFee,
        actionPointsPerDay,
        [...merkleTree.getRoot()]
      );
    });

    it("join a battleground", async () => {
      let attack = 50;
      let defense = 50;
      const leaf = keccak256(players[0].publicKey.toBuffer());
      const amountBefore = new anchor.BN(
        (
          await getAccount(
            provider.connection,
            await getAssociatedTokenAddress(potMint, players[0].publicKey)
          )
        ).amount.toString()
      ).toNumber();
      const participant = await battleground
        .connect(new anchor.AnchorProvider(provider.connection, players[0], {}))
        .join(
          nftMints[0],
          attack,
          defense,
          null,
          merkleTree.getProof(leaf).map((e) => [...e.data])
        );
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
            await getAssociatedTokenAddress(potMint, players[0].publicKey)
          )
        ).amount.toString()
      ).to.equal((amountBefore - entryFee.toNumber()).toString());

      expect((await battleground.getBattlegroundState()).participants).to.equal(1);
    });

    it("not whitelisted holder", async () => {
      let attack = 50;
      let defense = 50;
      const leaf = keccak256(players[0].publicKey.toBuffer());
      await expectRevert(
        battleground.connect(new anchor.AnchorProvider(provider.connection, players[1], {})).join(
          nftMints[0],
          attack,
          defense,
          null,
          merkleTree.getProof(leaf).map((e) => [...e.data])
        ),
        "ConstraintRaw"
      );
    });
  });
});
