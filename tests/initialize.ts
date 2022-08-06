import * as anchor from "@project-serum/anchor";
import { createMint } from "@solana/spl-token";
import { expect } from "chai";
import { BattleRoyale } from "battle-royale-ts";
import { airdropWallets, defaultProvider } from "./common";

describe("Initializing a Battle Royale", () => {
  // Configure the client to use the local cluster.
  // anchor.setProvider(provider);

  const gameMaster = new anchor.Wallet(anchor.web3.Keypair.generate());
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
    battleRoyale = new BattleRoyale(gameMaster.publicKey, provider);
  });

  it("Sets the state", async () => {
    const fee = 100;
    await battleRoyale.initialize(fee);

    const state = await battleRoyale.getBattleRoyaleState();

    expect(state.gameMaster.toString()).to.equal(gameMaster.publicKey.toString());
    expect(state.fee).to.equal(fee);
    expect(state.lastBattlegroundId.toString()).to.equal("0");
  });
});
