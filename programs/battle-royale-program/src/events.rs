use anchor_lang::prelude::*;

#[event]
pub struct CreateBattlegroundEvent {
    pub battleground: Pubkey,
}

#[event]
pub struct JoinBattlegroundEvent {
    pub battleground: Pubkey,
    pub nft_mint: Pubkey,
    pub attack: u32,
    pub defense: u32,
}

#[event]
pub struct BattleStartEvent {
    pub battleground: Pubkey,
}
