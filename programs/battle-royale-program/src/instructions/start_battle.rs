use crate::constants::*;
use crate::state::*;
use anchor_lang::prelude::*;

pub fn start_battle(ctx: Context<StartBattle>) -> Result<()> {
    ctx.accounts.battleground_state.status = BattlegroundStatus::Ongoing;
    ctx.accounts.battleground_state.start_time = ctx.accounts.clock.unix_timestamp;

    Ok(())
}

#[derive(Accounts)]
pub struct StartBattle<'info> {
    #[account(mut)]
    pub signer: Signer<'info>,

    #[account(
        seeds = [
            BATTLE_ROYALE_STATE_SEEDS.as_bytes(),
            battle_royale_state.game_master.as_ref(),
        ],
        bump,
    )]
    pub battle_royale_state: Account<'info, BattleRoyaleState>,

    /// The battleground the participant is entering
    #[account(
        mut,
        seeds = [
            BATTLEGROUND_STATE_SEEDS.as_bytes(),
            battle_royale_state.key().as_ref(),
            battleground_state.id.to_be_bytes().as_ref(),
        ],
        bump,
        constraint = battleground_state.participants == battleground_state.participants_cap
    )]
    pub battleground_state: Account<'info, BattlegroundState>,

    pub clock: Sysvar<'info, Clock>,
}
