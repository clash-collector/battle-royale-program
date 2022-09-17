import * as anchor from "@project-serum/anchor";

import { mintCollection, mintToken } from "../tests/utils";

import { BN } from "bn.js";
import { BattleRoyale } from "../ts";
import { gameMaster } from "../tests/common";

export default async function main() {
  const provider = anchor.AnchorProvider.env();

  const { mint } = await mintToken(provider, gameMaster.payer, gameMaster.publicKey, 10 ** 11, 8);

  console.log(`Pot token: ${mint.toString()}`);

  const battleRoyale = new BattleRoyale(provider);
  await battleRoyale.initialize(gameMaster.publicKey, gameMaster.publicKey, 1000);

  const numberOfCollection = 2;
  for (let i = 0; i < numberOfCollection; i++) {
    const { mints, collectionMint } = await mintCollection(
      provider,
      `TEST${i}`,
      gameMaster.payer,
      [gameMaster.publicKey],
      5
    );
    console.log(`Collection mint: ${collectionMint.toString()}`);
    console.log(`Mints: ${mints.map((e) => e.toString())}`);

    await battleRoyale.createBattleground(
      { v2: { collectionMint } },
      mint,
      2,
      new BN(10 ** 7),
      10000
    );
  }
}

main();
