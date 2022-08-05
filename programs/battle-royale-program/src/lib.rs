mod common;
mod constants;
mod errors;
mod events;
mod instructions;
mod state;

use crate::common::*;
use crate::instructions::*;
use crate::state::*;
use anchor_lang::prelude::*;

declare_id!("9zd3zSw8AGVGbsqQ2aT1vi92MCtW7Kbe8pTiuFCJUa1Z");

#[program]
pub mod battle_royale_program {
    use crate::{common::CollectionInfo, state::ActionType};

    use super::*;

    pub fn initialize(ctx: Context<Initialize>, fee: u16) -> Result<()> {
        instructions::initialize(ctx, fee)
    }

    pub fn create_battleground(
        ctx: Context<CreateBattleground>,
        collection_info: CollectionInfo,
        participants_cap: u32,
        entry_fee: u64,
        action_points_per_day: u32,
    ) -> Result<()> {
        instructions::create_battleground(
            ctx,
            collection_info,
            participants_cap,
            entry_fee,
            action_points_per_day,
        )
    }

    pub fn join_battleground(
        ctx: Context<JoinBattleground>,
        attack: u32,
        defense: u32,
        whitelist_root: Option<Vec<[u8; 32]>>,
    ) -> Result<()> {
        instructions::join_battleground(ctx, attack, defense, whitelist_root)
    }

    pub fn start_battle(ctx: Context<StartBattle>) -> Result<()> {
        instructions::start_battle(ctx)
    }

    pub fn participant_action(
        ctx: Context<ParticipantAction>,
        action_type: ActionType,
        action_points: u32,
    ) -> Result<()> {
        instructions::participant_action(ctx, action_type, action_points)
    }
}
