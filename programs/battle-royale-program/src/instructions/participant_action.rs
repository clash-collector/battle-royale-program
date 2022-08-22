use crate::common::action_points_available;
use crate::constants::*;
use crate::errors::*;
use crate::events::ParticipantActionEvent;
use crate::state::*;
use anchor_lang::prelude::*;
use anchor_spl::token::*;

pub fn participant_action(
    ctx: Context<ParticipantAction>,
    action_type: ActionType,
    action_points: u32,
) -> Result<()> {
    let participant = &mut ctx.accounts.participant_state;
    let target = &mut ctx.accounts.target_participant_state;

    require!(
        action_points_available(
            ctx.accounts.battleground_state.start_time,
            ctx.accounts.clock.unix_timestamp,
            ctx.accounts.battleground_state.action_points_per_day,
        ) - participant.action_points_spent
            >= action_points,
        BattleRoyaleError::InsufficientActionPoints
    );

    let spent_points: u32;

    match action_type {
        ActionType::Attack => {
            let health_left = target.health_points;
            let mut points_needed = health_left / participant.attack;
            if points_needed * participant.attack < health_left {
                points_needed += 1;
            }
            spent_points = if points_needed > action_points {
                action_points
            } else {
                points_needed
            };
            let damage = participant.attack * spent_points;

            if damage >= target.health_points {
                target.alive = false;
                target.health_points = 0;
                ctx.accounts.battleground_state.participants -= 1;
            } else {
                target.health_points -= damage;
            }
        }
        ActionType::Heal => {
            let missing_health = 750 + (target.defense + 50) * 5 - target.health_points;
            let mut points_needed = missing_health / (participant.defense / 2);
            if points_needed * participant.defense / 2 < missing_health {
                points_needed += 1;
            }
            spent_points = if points_needed > action_points {
                action_points
            } else {
                points_needed
            };
            let heal = spent_points * participant.defense / 2;
            target.health_points = if target.health_points + heal > 750 + target.defense * 5 {
                750 + target.defense * 5
            } else {
                target.health_points + heal
            };
        }
    };

    participant.action_points_spent += spent_points;

    emit!(ParticipantActionEvent {
        battleground: ctx.accounts.battleground_state.key(),
        participant: ctx.accounts.participant_state.key(),
        action_type,
        action_points_spent: action_points
    });

    Ok(())
}

#[derive(Accounts)]
pub struct ParticipantAction<'info> {
    #[account(mut)]
    pub signer: Signer<'info>,

    #[account(
        seeds = [
            BATTLE_ROYALE_STATE_SEEDS.as_bytes(),
        ],
        bump,
    )]
    pub battle_royale_state: Account<'info, BattleRoyaleState>,

    /// The battleground the participant is entering
    #[account(
        mut,
        seeds = [
            BATTLEGROUND_STATE_SEEDS.as_bytes(),
            battleground_state.id.to_le_bytes().as_ref(),
        ],
        bump,
        constraint = battleground_state.status == BattlegroundStatus::Ongoing @ BattleRoyaleError::WrongBattlegroundStatus,
    )]
    pub battleground_state: Account<'info, BattlegroundState>,

    #[account(
        mut,
        seeds = [
            PARTICIPANT_STATE_SEEDS.as_bytes(),
            battleground_state.key().as_ref(),
            participant_state.nft_mint.as_ref(),
        ],
        bump,
        constraint = participant_state.alive,
    )]
    pub participant_state: Account<'info, ParticipantState>,

    #[account(
        mut,
        seeds = [
            PARTICIPANT_STATE_SEEDS.as_bytes(),
            battleground_state.key().as_ref(),
            target_participant_state.nft_mint.as_ref(),
        ],
        bump,
        constraint = participant_state.alive,
    )]
    pub target_participant_state: Account<'info, ParticipantState>,

    #[account(
        constraint = player_nft_token_account.owner == signer.key(),
        constraint = player_nft_token_account.mint == participant_state.nft_mint,
        constraint = player_nft_token_account.amount == 1,
    )]
    pub player_nft_token_account: Box<Account<'info, TokenAccount>>,

    pub clock: Sysvar<'info, Clock>,
}
