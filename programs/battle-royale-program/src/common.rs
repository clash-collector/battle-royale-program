use anchor_lang::prelude::*;
use mpl_token_metadata::state::Metadata;

// Collection info, required to verify if an NFT belongs to a collection
#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq, Eq)]
pub enum CollectionInfo {
    // Symbol and verified creators of the collection, for metadata accounts created by CreateMetadataAccount
    V1 {
        symbol: String,
        verified_creators: Vec<Pubkey>,
        whitelist_root: [u8; 32],
    },
    // The token mint of the collection NFT, for metadata accounts created by CreateMetadataAccountV2
    V2 {
        collection_mint: Pubkey,
    },
}

impl CollectionInfo {
    // 1 + largest variant: 1 String of 8 chars, 1 Vev<Pubkey>, 1 hash of 32 bytes
    pub const LEN: usize = 1 + (4 + 32) + (4 + (32 * 5)) + 32;
}

// Verify in the NFT belongs to the collection
pub fn verify_collection(
    metadata: &AccountInfo,
    collection_info: &CollectionInfo,
    whitelist_proof: Option<Vec<[u8; 32]>>,
) -> bool {
    let metadata = Metadata::from_account_info(metadata).unwrap();

    match collection_info {
        CollectionInfo::V1 {
            symbol,
            verified_creators,
            whitelist_root,
        } => {
            // Check if the symbol matches
            let trimmed_symbol = metadata.data.symbol.trim_matches(char::from(0));
            let valid_symbol = trimmed_symbol == symbol;

            // Check if at least one NFT creator exists in BucketState's verified creators
            let creators = metadata.data.creators.unwrap();
            let mut valid_creator = false;
            if !verified_creators.is_empty() {
                valid_creator = creators.iter().any(|creator| {
                    creator.verified
                        && verified_creators.iter().any(|additional_verified_creator| {
                            creator.address == *additional_verified_creator
                        })
                });
            }

            // Check if NFT exists in whitelist
            let leaf = anchor_lang::solana_program::keccak::hash(&metadata.mint.to_bytes()).0;
            let in_whitelist = verify_proof(whitelist_proof.unwrap(), *whitelist_root, leaf);

            valid_symbol && valid_creator && in_whitelist
        }

        CollectionInfo::V2 { collection_mint } => match metadata.collection {
            // Check that the collection field exists
            None => false,
            Some(collection) => {
                // Check that the collection mint matches, and verified is true
                collection.key == *collection_mint && collection.verified
            }
        },
    }
}

pub fn verify_proof(proof: Vec<[u8; 32]>, root: [u8; 32], leaf: [u8; 32]) -> bool {
    let mut computed_hash = leaf;
    for proof_element in proof.into_iter() {
        if computed_hash <= proof_element {
            // Hash(current computed hash + current element of the proof)
            computed_hash =
                anchor_lang::solana_program::keccak::hashv(&[&computed_hash, &proof_element]).0;
        } else {
            // Hash(current element of the proof + current computed hash)
            computed_hash =
                anchor_lang::solana_program::keccak::hashv(&[&proof_element, &computed_hash]).0;
        }
    }
    // Check if the computed hash (root) is equal to the provided root
    computed_hash == root
}

pub fn action_points_available(start: i64, now: i64, action_points_per_day: u32) -> u32 {
    let seconds_elapsed: u32 = (now - start) as u32;
    action_points_per_day * seconds_elapsed / 86400
}
