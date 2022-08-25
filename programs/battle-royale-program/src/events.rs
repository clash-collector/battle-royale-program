use anchor_lang::prelude::*;

use crate::state::ActionType;

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
pub struct LeaveBattlegroundEvent {
    pub battleground: Pubkey,
    pub nft_mint: Pubkey,
}

#[event]
pub struct StartBattleEvent {
    pub battleground: Pubkey,
}

#[event]
pub struct ParticipantActionEvent {
    pub battleground: Pubkey,
    pub participant: Pubkey,
    pub action_type: ActionType,
    pub action_points_spent: u32,
}

#[event]
pub struct FinishBattleEvent {
    pub battleground: Pubkey,
    pub winner: Pubkey,
    pub pot_mint: Pubkey,
    pub pot_amount: u64,
}
