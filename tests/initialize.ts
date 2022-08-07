import * as anchor from "@project-serum/anchor";
import { createMint } from "@solana/spl-token";
import { expect } from "chai";
import { BattleRoyale } from "battle-royale-ts";
import { airdropWallets, defaultProvider, gameMaster } from "./common";
import { expectRevert } from "./utils";

describe("Initializing a Battle Royale", () => {
  // Configure the client to use the local cluster.
  // anchor.setProvider(provider);

  let provider: anchor.AnchorProvider;
  let potMint: anchor.web3.PublicKey;
  let battleRoyale: BattleRoyale;

  before(async () => {
    provider = new anchor.AnchorProvider(defaultProvider.connection, gameMaster, {});

    await airdropWallets([gameMaster], provider);

    potMint = await createMint(
      provider.connection,
      gameMaster.payer,
      gameMaster.publicKey,
      null,
      0
    );
    battleRoyale = new BattleRoyale(provider);
  });

  it("Sets the state", async () => {
    const fee = 200;
    let state = await battleRoyale.getBattleRoyaleState();
    const idBefore = state.lastBattlegroundId;

    await battleRoyale.initialize(gameMaster.publicKey, fee);

    state = await battleRoyale.getBattleRoyaleState();

    expect(state.gameMaster.toString()).to.equal(gameMaster.publicKey.toString());
    expect(state.fee).to.equal(fee);
    expect(state.lastBattlegroundId.toString()).to.equal(idBefore.toString());
  });

  describe("Resets the state", () => {
    it("reset the state", async () => {
      let state = await battleRoyale.getBattleRoyaleState();
      const feeBefore = state.fee;

      await battleRoyale.initialize(gameMaster.publicKey, feeBefore * 2);

      state = await battleRoyale.getBattleRoyaleState();

      expect(state.gameMaster.toString()).to.equal(gameMaster.publicKey.toString());
      expect(state.fee).to.equal(feeBefore * 2);
    });

    it("Failes when called by a stranger", async () => {
      const stranger = new anchor.Wallet(anchor.web3.Keypair.generate());
      let state = await battleRoyale.getBattleRoyaleState();
      const feeBefore = state.fee;

      expectRevert(
        battleRoyale
          .connect(new anchor.AnchorProvider(provider.connection, stranger, {}))
          .initialize(gameMaster.publicKey, feeBefore * 2)
      );
    });
  });
});
