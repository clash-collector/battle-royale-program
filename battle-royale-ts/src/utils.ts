import * as anchor from "@project-serum/anchor";
import { PROGRAM_ID as METADATA_PROGRAM_ID } from "@metaplex-foundation/mpl-token-metadata";

export const getTokenMetadata = (tokenMint: anchor.web3.PublicKey) => {
  const [tokenMetadataAddress, bump] = anchor.web3.PublicKey.findProgramAddressSync(
    [Buffer.from("metadata"), METADATA_PROGRAM_ID.toBuffer(), tokenMint.toBuffer()],
    METADATA_PROGRAM_ID
  );
  return tokenMetadataAddress;
};

export const getTokenEdition = (tokenMint: anchor.web3.PublicKey) => {
  const [tokenMetadataAddress, bump] = anchor.web3.PublicKey.findProgramAddressSync(
    [
      Buffer.from("metadata"),
      METADATA_PROGRAM_ID.toBuffer(),
      tokenMint.toBuffer(),
      Buffer.from("edition"),
    ],
    METADATA_PROGRAM_ID
  );
  return tokenMetadataAddress;
};
