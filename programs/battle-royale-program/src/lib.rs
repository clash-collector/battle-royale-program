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

declare_id!("EnLAsghi9Yp25djXr7o7RsGHQxXz8kcCpL6LnjGRmxEQ");

#[program]
pub mod battle_royale_program {
    use crate::{common::CollectionInfo, state::ActionType};

    use super::*;

    pub fn initialize(
        ctx: Context<Initialize>,
        game_master: Pubkey,
        dev_fund: Pubkey,
        fee: u16,
    ) -> Result<()> {
        instructions::initialize(ctx, game_master, dev_fund, fee)
    }

    pub fn create_battleground(
        ctx: Context<CreateBattleground>,
        collection_info: CollectionInfo,
        participants_cap: u32,
        entry_fee: u64,
        action_points_per_day: u32,
        whitelist_root: Option<[u8; 32]>,
    ) -> Result<()> {
        instructions::create_battleground(
            ctx,
            collection_info,
            participants_cap,
            entry_fee,
            action_points_per_day,
            whitelist_root,
        )
    }

    pub fn join_battleground(
        ctx: Context<JoinBattleground>,
        attack: u32,
        defense: u32,
        collection_whitelist_root: Option<Vec<[u8; 32]>>,
        holder_whitelist_root: Option<Vec<[u8; 32]>>,
    ) -> Result<()> {
        instructions::join_battleground(
            ctx,
            attack,
            defense,
            collection_whitelist_root,
            holder_whitelist_root,
        )
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

    pub fn finish_battle(ctx: Context<FinishBattle>) -> Result<()> {
        instructions::finish_battle(ctx)
    }

    pub fn leave_battleground(ctx: Context<LeaveBattleground>) -> Result<()> {
        instructions::leave_battleground(ctx)
    }
}
