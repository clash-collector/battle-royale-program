import * as anchor from "@project-serum/anchor";
import { readFileSync } from "fs";
import { resolve } from "path";
import smb from "./mints/smb.json";

export const gameMaster = new anchor.Wallet(
  anchor.web3.Keypair.fromSecretKey(
    Buffer.from(
      JSON.parse(readFileSync(resolve(__dirname, "./", "keypairs", "test.json"), "utf-8"))
    )
  )
);
export const defaultProvider = anchor.getProvider() as anchor.AnchorProvider;
export const smbMints = smb.map((e) => new anchor.web3.PublicKey(e));

export const airdropWallets = async (
  wallets: anchor.Wallet[],
  provider: anchor.AnchorProvider,
  solAmount: number = 10
) => {
  for (const wallet of wallets) {
    await provider.connection.confirmTransaction(
      await provider.connection.requestAirdrop(
        wallet.publicKey,
        solAmount * anchor.web3.LAMPORTS_PER_SOL
      )
    );
  }
};
