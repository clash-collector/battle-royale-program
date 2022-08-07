use crate::constants::*;
use crate::errors::*;
use crate::events::StartBattleEvent;
use crate::state::*;
use anchor_lang::prelude::*;

pub fn start_battle(ctx: Context<StartBattle>) -> Result<()> {
    ctx.accounts.battleground.status = BattlegroundStatus::Ongoing;
    ctx.accounts.battleground.start_time = ctx.accounts.clock.unix_timestamp;

    emit!(StartBattleEvent {
        battleground: ctx.accounts.battleground.key()
    });

    Ok(())
}

#[derive(Accounts)]
pub struct StartBattle<'info> {
    #[account(
        seeds = [
            BATTLE_ROYALE_STATE_SEEDS.as_bytes(),
        ],
        bump,
    )]
    pub battle_royale: Account<'info, BattleRoyaleState>,

    /// The battleground the participant is entering
    #[account(
        mut,
        seeds = [
            BATTLEGROUND_STATE_SEEDS.as_bytes(),
            battleground.id.to_le_bytes().as_ref(),
        ],
        bump,
        constraint = battleground.status == BattlegroundStatus::Preparing @ BattleRoyaleError::WrongBattlegroundStatus,
        constraint = battleground.participants == battleground.participants_cap,
    )]
    pub battleground: Account<'info, BattlegroundState>,

    pub clock: Sysvar<'info, Clock>,
}
