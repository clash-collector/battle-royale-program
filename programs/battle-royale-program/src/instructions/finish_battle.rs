use crate::constants::*;
use crate::errors::*;
use crate::events::FinishBattleEvent;
use crate::state::*;
use anchor_lang::prelude::*;
use anchor_spl::associated_token::*;
use anchor_spl::token;
use anchor_spl::token::*;

pub fn finish_battle(ctx: Context<FinishBattle>) -> Result<()> {
    // Reset the battleground
    ctx.accounts.battleground.status = BattlegroundStatus::Preparing;
    ctx.accounts.battleground.last_winner = Some(ctx.accounts.winner_nft_token_account.mint);

    // Reset the participant
    ctx.accounts.participant.action_points_spent = 0;
    ctx.accounts.participant.health_points = 750 + (ctx.accounts.participant.defense + 50) * 5;

    // Get authority signer seeds
    let authority_bump = *ctx.bumps.get("authority").unwrap();
    let authority_seeds = &[
        BATTLEGROUND_AUTHORITY_SEEDS.as_bytes(),
        &ctx.accounts.battleground.id.to_le_bytes(),
        &[authority_bump],
    ];
    let authority_signer_seeds = &[&authority_seeds[..]];

    // Transfer the pot to the winner
    let transfer_nft_ctx = CpiContext::new_with_signer(
        ctx.accounts.token_program.to_account_info().clone(),
        token::Transfer {
            from: ctx.accounts.pot_account.to_account_info().clone(),
            to: ctx.accounts.winner_account.to_account_info().clone(),
            authority: ctx.accounts.authority.to_account_info().clone(),
        },
        authority_signer_seeds,
    );
    token::transfer(transfer_nft_ctx, ctx.accounts.pot_account.amount)?;

    emit!(FinishBattleEvent {
        battleground: ctx.accounts.battleground.key(),
        winner: ctx.accounts.participant.key(),
        pot_mint: ctx.accounts.battleground.pot_mint,
        pot_amount: ctx.accounts.pot_account.amount,
    });

    Ok(())
}

#[derive(Accounts)]
pub struct FinishBattle<'info> {
    #[account(mut)]
    pub signer: Signer<'info>,

    /// CHECK: We check that this account owns the token
    pub winner: UncheckedAccount<'info>,

    #[account(
        seeds = [
            BATTLE_ROYALE_STATE_SEEDS.as_bytes(),
        ],
        bump,
    )]
    pub battle_royale: Box<Account<'info, BattleRoyaleState>>,

    /// CHECK: Checking correspondance with battle royale state
    #[account(
        seeds = [
            BATTLEGROUND_AUTHORITY_SEEDS.as_bytes(),
            battleground.id.to_le_bytes().as_ref(),
        ],
        bump,
    )]
    pub authority: AccountInfo<'info>,

    /// The battleground the participant is entering
    #[account(
        mut,
        seeds = [
            BATTLEGROUND_STATE_SEEDS.as_bytes(),
            battleground.id.to_le_bytes().as_ref(),
        ],
        bump,
        has_one = pot_mint,
        constraint = battleground.participants == 1,
        constraint = battleground.status == BattlegroundStatus::Ongoing @ BattleRoyaleError::WrongBattlegroundStatus,
    )]
    pub battleground: Box<Account<'info, BattlegroundState>>,

    #[account(
        mut,
        seeds = [
            PARTICIPANT_STATE_SEEDS.as_bytes(),
            battleground.key().as_ref(),
            participant.nft_mint.as_ref(),
        ],
        bump,
        has_one = nft_mint,
        constraint = participant.alive,
    )]
    pub participant: Box<Account<'info, ParticipantState>>,

    #[account(owner = token::ID)]
    pub pot_mint: Account<'info, Mint>,

    #[account(owner = token::ID)]
    pub nft_mint: Account<'info, Mint>,

    #[account(
        init_if_needed,
        payer = signer,
        associated_token::mint = pot_mint,
        associated_token::authority = authority,
    )]
    pub pot_account: Box<Account<'info, TokenAccount>>,

    #[account(
        init_if_needed,
        payer = signer,
        associated_token::mint = pot_mint,
        associated_token::authority = winner,
    )]
    pub winner_account: Box<Account<'info, TokenAccount>>,

    #[account(
        associated_token::mint = nft_mint,
        associated_token::authority = winner,
        constraint = winner_nft_token_account.amount == 1,
    )]
    pub winner_nft_token_account: Box<Account<'info, TokenAccount>>,

    // Solana ecosystem program addresses
    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}
