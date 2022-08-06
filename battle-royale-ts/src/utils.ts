import * as anchor from "@project-serum/anchor";
import {
  createAssociatedTokenAccount,
  createMint,
  getAccount,
  mintTo,
  mintToChecked,
} from "@solana/spl-token";
import {
  PROGRAM_ID as METADATA_PROGRAM_ID,
  createCreateMetadataAccountV2Instruction,
  createCreateMetadataAccountInstruction,
  createCreateMasterEditionV3Instruction,
  createVerifyCollectionInstruction,
} from "@metaplex-foundation/mpl-token-metadata";
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

export const mintNft = async (
  provider: anchor.Provider,
  symbol: string,
  creator: anchor.web3.Keypair,
  destination: anchor.web3.PublicKey,
  collectionMint?: anchor.web3.PublicKey,
  v1: boolean = false
) => {
  const mint = await createMint(provider.connection, creator, creator.publicKey, null, 0);

  const tokenAccount = await createAssociatedTokenAccount(
    provider.connection,
    creator,
    mint,
    destination
  );

  await mintToChecked(provider.connection, creator, mint, tokenAccount, creator.publicKey, 1, 0);

  const transaction = new anchor.web3.Transaction();

  // Set Metadata
  const metadata = getTokenMetadata(mint);
  v1
    ? transaction.add(
        createCreateMetadataAccountInstruction(
          {
            metadata,
            mint,
            mintAuthority: creator.publicKey,
            updateAuthority: creator.publicKey,
            payer: creator.publicKey,
          },
          {
            createMetadataAccountArgs: {
              isMutable: false,
              data: {
                name: "Pretty Cool NFT",
                symbol,
                sellerFeeBasisPoints: 10,
                uri: "https://pretty-cool-nft.xyz/metadata",
                creators: [
                  {
                    address: creator.publicKey,
                    share: 100,
                    verified: true,
                  },
                ],
              },
            },
          }
        )
      )
    : transaction.add(
        createCreateMetadataAccountV2Instruction(
          {
            metadata,
            mint,
            mintAuthority: creator.publicKey,
            updateAuthority: creator.publicKey,
            payer: creator.publicKey,
          },
          {
            createMetadataAccountArgsV2: {
              isMutable: false,
              data: {
                name: "Pretty Cool NFT",
                symbol,
                sellerFeeBasisPoints: 10,
                uri: "https://pretty-cool-nft.xyz/metadata",
                creators: [
                  {
                    address: creator.publicKey,
                    share: 100,
                    verified: true,
                  },
                ],
                collection: collectionMint ? { key: collectionMint, verified: false } : null,
                uses: null,
              },
            },
          }
        )
      );

  // Create master edition
  const edition = getTokenEdition(mint);
  transaction.add(
    createCreateMasterEditionV3Instruction(
      {
        edition,
        mint,
        updateAuthority: creator.publicKey,
        mintAuthority: creator.publicKey,
        payer: creator.publicKey,
        metadata,
      },
      { createMasterEditionArgs: { maxSupply: 0 } }
    )
  );

  await provider.sendAndConfirm(transaction, [creator]);

  return { mint, metadata, edition };
};

export const mintToken = async (
  provider: anchor.Provider,
  creator: anchor.web3.Signer,
  destination: anchor.web3.PublicKey,
  initialSupply: number | bigint,
  decimals: number = 8
) => {
  const mint = await createMint(provider.connection, creator, creator.publicKey, null, decimals);

  const tokenAccount = await createAssociatedTokenAccount(
    provider.connection,
    creator,
    mint,
    destination
  );

  await mintTo(provider.connection, creator, mint, tokenAccount, creator, initialSupply);

  return { mint, tokenAccount };
};

export const verifyCollection = async (
  provider: anchor.AnchorProvider,
  nftMint: anchor.web3.PublicKey,
  collectionMint: anchor.web3.PublicKey,
  collectionAuthority: anchor.web3.Keypair
) => {
  // Setup: Verify collection of the NFT
  const transaction = new anchor.web3.Transaction();
  transaction.add(
    createVerifyCollectionInstruction({
      metadata: getTokenMetadata(nftMint),
      collectionAuthority: collectionAuthority.publicKey,
      payer: provider.wallet.publicKey,
      collectionMint: collectionMint,
      collection: getTokenMetadata(collectionMint),
      collectionMasterEditionAccount: getTokenEdition(collectionMint),
    })
  );
  return provider.sendAndConfirm(transaction, [collectionAuthority]);
};
