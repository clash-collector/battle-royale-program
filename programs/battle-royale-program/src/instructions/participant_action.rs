use crate::constants::*;
use crate::state::*;
use anchor_lang::prelude::*;

pub fn participant_action(
    ctx: Context<ParticipantAction>,
    action_type: ActionType,
    action_points: u8,
) -> Result<()> {
    let attack = ctx.accounts.participant_state.attack;
    let hp_left = ctx.accounts.target_participant_state.defense;

    if hp_left > attack {
        ctx.accounts.target_participant_state.defense -= attack;
    } else {
        ctx.accounts.target_participant_state.defense = 0;
        ctx.accounts.target_participant_state.dead = true;
    }

    Ok(())
}

#[derive(Accounts)]
pub struct ParticipantAction<'info> {
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
        constraint = battleground_state.participants < battleground_state.participants_cap
    )]
    pub battleground_state: Account<'info, BattlegroundState>,

    #[account(
        seeds = [
            PARTICIPANT_STATE_SEEDS.as_bytes(),
            battleground_state.key().as_ref(),
            participant_state.nft_mint.as_ref(),
        ],
        bump,
    )]
    pub participant_state: Account<'info, ParticipantState>,

    #[account(
        seeds = [
            PARTICIPANT_STATE_SEEDS.as_bytes(),
            battleground_state.key().as_ref(),
            target_participant_state.nft_mint.as_ref(),
        ],
        bump,
    )]
    pub target_participant_state: Account<'info, ParticipantState>,

    // Solana ecosystem program addresses
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}
