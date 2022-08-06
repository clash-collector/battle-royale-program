import * as anchor from "@project-serum/anchor";
import { PROGRAM_ID as METADATA_PROGRAM_ID } from "@metaplex-foundation/mpl-token-metadata";
import keccak256 from "keccak256";
import MerkleTree from "merkletreejs";

export const getMerkleTree = (mints: anchor.web3.PublicKey[]) => {
  const leaves = mints.map((x) => keccak256(x.toBuffer()));
  const tree = new MerkleTree(leaves, keccak256, { sort: true });
  const root = tree.getRoot();
  return { root: [...root], tree };
};

export const getMerkleProof = (tree: MerkleTree, mint: anchor.web3.PublicKey) => {
  const leaf = keccak256(mint.toBuffer());
  const proof: Buffer[] = tree.getProof(leaf).map((x) => x.data);
  return proof.map((x) => [...x]);
};

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
