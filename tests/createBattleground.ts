import * as anchor from "@project-serum/anchor";
import { createMint, getOrCreateAssociatedTokenAccount } from "@solana/spl-token";
import { expect } from "chai";
import {
  Battleground,
  BattleRoyale,
  BattlegroundStatus,
  getMerkleTree,
  CollectionInfo,
} from "../ts";
import { airdropWallets, defaultProvider, smbMints } from "./common";

describe("Create a Battleground", () => {
  const nftSymbol = "DAPE";
  const { root: whitelistRoot } = getMerkleTree(smbMints);
  const gameMaster = new anchor.Wallet(anchor.web3.Keypair.generate());
  const creator = new anchor.Wallet(anchor.web3.Keypair.generate());
  let provider: anchor.AnchorProvider;
  let potMint: anchor.web3.PublicKey;
  let battleRoyale: BattleRoyale;
  let fee: number;

  before(async () => {
    provider = new anchor.AnchorProvider(defaultProvider.connection, gameMaster, {});

    await airdropWallets([gameMaster, creator], provider);

    potMint = await createMint(provider.connection, creator.payer, creator.publicKey, null, 0);
    battleRoyale = new BattleRoyale(gameMaster.publicKey, provider);

    fee = 100;
    await battleRoyale.initialize(fee);
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

      const battleground = new Battleground(
        battleRoyale,
        0,
        potMint,
        new anchor.AnchorProvider(defaultProvider.connection, creator, {})
      );
      const collectionInfo: CollectionInfo = {
        v1: {
          symbol: nftSymbol,
          verifiedCreators: creatorAddresses,
          whitelistRoot: whitelistRoot,
        },
      };
      await battleground.create(collectionInfo, participantsCap, entryFee, actionPointsPerDay);
      const state = await battleground.getBattlegroundState();

      expect(state.id.toString()).to.equal("0");
      expect(state.collectionInfo).to.deep.equal(collectionInfo);
      expect(state.actionPointsPerDay).to.equal(actionPointsPerDay);
      expect(state.participantsCap).to.equal(participantsCap);
      expect(state.entryFee.toString()).to.equal(entryFee.toString());
      expect(state.actionPointsPerDay).to.equal(actionPointsPerDay);
      expect(state.potMint.toString()).to.equal(potMint.toString());
      expect(state.status[BattlegroundStatus.Preparing]).to.exist;
    });
  });
});
