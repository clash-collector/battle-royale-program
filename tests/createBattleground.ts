import * as anchor from "@project-serum/anchor";
import { createMint } from "@solana/spl-token";
import { expect } from "chai";
import { Battleground, BattleRoyale, BattlegroundStatus, CollectionInfo } from "../ts";
import { airdropWallets, defaultProvider, gameMaster, smbMints } from "./common";
import { getMerkleTree, mintCollection } from "./utils";

describe("Create a Battleground", () => {
  const nftSymbol = "DAPE";
  const { root: whitelistRoot } = getMerkleTree(smbMints);
  const creator = new anchor.Wallet(anchor.web3.Keypair.generate());
  let provider: anchor.AnchorProvider;
  let potMint: anchor.web3.PublicKey;
  let battleRoyale: BattleRoyale;
  let fee: number;

  before(async () => {
    provider = new anchor.AnchorProvider(defaultProvider.connection, gameMaster, {});

    await airdropWallets([gameMaster, creator], provider);

    potMint = await createMint(provider.connection, creator.payer, creator.publicKey, null, 0);
    battleRoyale = new BattleRoyale(provider);

    // Initialize BattleRoyale
    fee = 100;
    await battleRoyale.initialize(gameMaster.publicKey, fee);
  });

  describe("For Metaplex v1.0 collections", () => {
    // Addresses of verified creators of the NFT collection
    const creatorAddresses: anchor.web3.PublicKey[] = [...Array(5)].map(
      () => new anchor.web3.Keypair().publicKey
    );

    it("creates a battleground", async () => {
      const participantsCap = 100;
      const entryFee = new anchor.BN(100);
      const actionPointsPerDay = 10;
      const collectionInfo: CollectionInfo = {
        v1: {
          symbol: nftSymbol,
          verifiedCreators: creatorAddresses,
          whitelistRoot: whitelistRoot,
        },
      };

      let battleRoyaleState = await battleRoyale.getBattleRoyaleState();
      const idBefore = battleRoyaleState.lastBattlegroundId;

      const battleground = await battleRoyale.createBattleground(
        collectionInfo,
        potMint,
        participantsCap,
        entryFee,
        actionPointsPerDay
      );
      let state = await battleground.getBattlegroundState();

      expect(state.id.toString()).to.equal(idBefore.toString());
      expect(JSON.stringify(state.collectionInfo)).to.deep.equal(JSON.stringify(collectionInfo));
      expect(state.actionPointsPerDay).to.equal(actionPointsPerDay);
      expect(state.participantsCap).to.equal(participantsCap);
      expect(state.entryFee.toString()).to.equal(entryFee.toString());
      expect(state.actionPointsPerDay).to.equal(actionPointsPerDay);
      expect(state.potMint.toString()).to.equal(potMint.toString());
      expect(state.status[BattlegroundStatus.Preparing]).to.exist;
    });
  });

  describe("For Metaplex v2.0 collections", () => {
    let collectionMint: anchor.web3.PublicKey;

    before(async () => {
      collectionMint = (
        await mintCollection(provider, nftSymbol, gameMaster.payer, [creator.publicKey], 2)
      ).collectionMint;
    });

    it("creates a battleground", async () => {
      const participantsCap = 100;
      const entryFee = new anchor.BN(100);
      const actionPointsPerDay = 10;
      const collectionInfo: CollectionInfo = {
        v2: {
          collectionMint,
        },
      };

      let battleRoyaleState = await battleRoyale.getBattleRoyaleState();
      const idBefore = battleRoyaleState.lastBattlegroundId;

      const battleground = await battleRoyale.createBattleground(
        collectionInfo,
        potMint,
        participantsCap,
        entryFee,
        actionPointsPerDay
      );
      let state = await battleground.getBattlegroundState();

      expect(state.id.toString()).to.equal(idBefore.toString());
      expect(JSON.stringify(state.collectionInfo)).to.deep.equal(JSON.stringify(collectionInfo));
      expect(state.actionPointsPerDay).to.equal(actionPointsPerDay);
      expect(state.participantsCap).to.equal(participantsCap);
      expect(state.entryFee.toString()).to.equal(entryFee.toString());
      expect(state.actionPointsPerDay).to.equal(actionPointsPerDay);
      expect(state.potMint.toString()).to.equal(potMint.toString());
      expect(state.status[BattlegroundStatus.Preparing]).to.exist;
    });
  });
});
