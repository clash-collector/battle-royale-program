import * as anchor from "@project-serum/anchor";
import { BN } from "bn.js";
import { BattleRoyale } from "../ts";
import { gameMaster } from "../tests/common";
import { mintCollection, mintToken } from "../tests/utils";

export default async function main() {
  const provider = anchor.AnchorProvider.env();

  const { mint } = await mintToken(provider, gameMaster.payer, gameMaster.publicKey, 10 ** 11, 8);

  console.log(`Pot token: ${mint.toString()}`);

  const { mints, collectionMint } = await mintCollection(
    provider,
    "TEST",
    gameMaster.payer,
    [gameMaster.publicKey],
    10
  );
  console.log(`Collection mint: ${collectionMint.toString()}`);
  console.log(`Mints: ${mints.map((e) => e.toString())}`);

  const battleRoyale = new BattleRoyale(provider);
  await battleRoyale.initialize(gameMaster.publicKey, 1000);
  await battleRoyale.createBattleground({ v2: { collectionMint } }, mint, 2, new BN(10 ** 7), 1000);
}

main();
