use crate::common::*;
use anchor_lang::prelude::*;

#[account]
pub struct BattleRoyaleState {
    pub bump: u8,
    pub game_master: Pubkey,
    pub fee: u16,
    pub last_battleground_id: u64,
}

impl BattleRoyaleState {
    pub const LEN: usize = 8 + 1 + 2 + 32 + 8;
}

#[repr(u8)]
#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq)]
pub enum BattlegroundStatus {
    Preparing = 0,
    Ongoing = 1,
    Finished = 2,
}

#[repr(u8)]
#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq)]
pub enum ActionType {
    Attack = 0,
    Heal = 1,
}

#[account]
pub struct BattlegroundState {
    pub bump: u8,
    pub id: u64,
    pub collection_info: CollectionInfo,
    pub start_time: i64,
    pub action_points_per_day: u32,
    pub participants_cap: u32,
    pub participants: u32,
    pub status: BattlegroundStatus,
    pub pot_mint: Pubkey,
    pub entry_fee: u64,
}

impl BattlegroundState {
    pub const LEN: usize = 8 + 1 + 8 + (CollectionInfo::LEN) + 4 + 4 + 2 + 32 + 8;
}

#[account]
pub struct ParticipantState {
    pub bump: u8,
    pub battleground: Pubkey,
    pub nft_mint: Pubkey,
    pub attack: u32,
    pub defense: u32,
    pub health_points: u32,
    pub action_points_spent: u32,
    pub dead: bool,
}

impl ParticipantState {
    pub const LEN: usize = 8 + 1 + 2 * 32 + 4 * 4 + 1;
}
