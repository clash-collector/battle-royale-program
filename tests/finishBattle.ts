import * as anchor from "@project-serum/anchor";
import {
  getAccount,
  getAssociatedTokenAddress,
  getOrCreateAssociatedTokenAccount,
  transferChecked,
} from "@solana/spl-token";
import { expect } from "chai";
import { Battleground, BattlegroundStatus, BattleRoyale, CollectionInfo, Participant } from "../ts";
import { expectRevert, mintNft, mintToken, verifyCollection } from "./utils";
import { airdropWallets, gameMaster } from "./common";

describe("Finish Battle", () => {
  const nftSymbol = "DAPE";

  const creator = new anchor.Wallet(anchor.web3.Keypair.generate());
  const player = new anchor.Wallet(anchor.web3.Keypair.generate());
  const player2 = new anchor.Wallet(anchor.web3.Keypair.generate());
  let provider: anchor.AnchorProvider;
  let potMint: anchor.web3.PublicKey;
  let nftMints: anchor.web3.PublicKey[] = [];
  let collectionMint: anchor.web3.PublicKey;
  let battleRoyale: BattleRoyale;
  let battleground: Battleground;
  let participantsCap = 2;
  let participants: Participant[] = Array(participantsCap);
  let fee: number;
  let initialAmount = 100000;
  let entryFee = new anchor.BN(1000);
  let actionPointsPerDay = 8640000;
  let collectionInfo: CollectionInfo;

  before(async () => {
    provider = new anchor.AnchorProvider(anchor.getProvider().connection, gameMaster, {});

    await airdropWallets([gameMaster, creator, player, player2], provider, 100);

    // Create the pot token and mint some to the player
    potMint = (await mintToken(provider, creator.payer, player.publicKey, initialAmount * 2, 8))
      .mint;
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
      initialAmount,
      8
    );

    // Create the collection
    const { mint: collection } = await mintNft(
      provider,
      nftSymbol,
      gameMaster.payer,
      gameMaster.publicKey
    );
    collectionMint = collection;

    // Create tokens
    for (let i = 0; i < participantsCap; i++) {
      const { mint } = await mintNft(
        provider,
        nftSymbol,
        gameMaster.payer,
        player.publicKey,
        collectionMint
      );
      nftMints.push(mint);

      // Collection authority verifies that the NFT belongs to the collection
      await verifyCollection(provider, mint, collectionMint, gameMaster.payer);
    }

    collectionInfo = {
      v2: {
        collectionMint,
      },
    };

    battleRoyale = new BattleRoyale(provider);

    // Initialize BattleRoyale
    fee = 100;
    await battleRoyale.initialize(gameMaster.publicKey, fee);
  });

  describe("There is a winner", () => {
    before(async () => {
      // Create the battleground
      battleground = await battleRoyale.createBattleground(
        collectionInfo,
        potMint,
        participantsCap,
        entryFee,
        actionPointsPerDay
      );

      // Join with all participant
      let attack = 50;
      let defense = 50;
      for (let i = 0; i < participantsCap; i++) {
        participants[i] = await battleground
          .connect(new anchor.AnchorProvider(provider.connection, player, {}))
          .join(nftMints[i], attack, defense);
      }

      // Start the battle
      await battleground
        .connect(new anchor.AnchorProvider(provider.connection, player, {}))
        .start();

      // Kill the other participant
      await new Promise((resolve) => setTimeout(() => resolve(undefined), 1000));
      await participants[0].action(participants[1], { attack: {} }, 100);
    });

    it("finish battle", async () => {
      await participants[0].finishBattle();
      let state = await battleground.getBattlegroundState();

      const winnerAccount = await getAssociatedTokenAddress(
        participants[0].addresses.potMint,
        player.publicKey,
        true
      );

      expect(state.status[BattlegroundStatus.Preparing]).exist;
      expect(state.participants).to.equal(1);
      expect(state.lastWinner?.toString()).to.equal(nftMints[0].toString());
      expect((await getAccount(provider.connection, winnerAccount)).amount.toString()).to.equal(
        (initialAmount - (participantsCap * (entryFee.toNumber() * fee)) / 10000).toString()
      );
    });
  });

  describe("There is no winner", () => {
    before(async () => {
      // Create the battleground
      battleground = await battleRoyale.createBattleground(
        collectionInfo,
        potMint,
        participantsCap,
        entryFee,
        actionPointsPerDay
      );

      // Join with all participant
      let attack = 50;
      let defense = 50;
      for (let i = 0; i < participantsCap; i++) {
        participants[i] = await battleground
          .connect(new anchor.AnchorProvider(provider.connection, player, {}))
          .join(nftMints[i], attack, defense);
      }

      // Start the battle
      await battleground
        .connect(new anchor.AnchorProvider(provider.connection, player, {}))
        .start();
    });

    it("can't be finished", async () => {
      await expectRevert(participants[0].finishBattle(), "A raw constraint was violated");
    });
  });
});
