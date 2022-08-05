use anchor_lang::prelude::*;

#[event]
pub struct CreateBattlegroundEvent {
    pub battleground: Pubkey,
}

#[event]
pub struct JoinBattlegroundEvent {
    pub battleground: Pubkey,
    pub nft_mint: Pubkey,
    pub attack: u16,
    pub defense: u16,
}
