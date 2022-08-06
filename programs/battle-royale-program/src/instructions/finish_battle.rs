use crate::constants::*;
use crate::events::FinishBattleEvent;
use crate::state::*;
use anchor_lang::prelude::*;
use anchor_spl::associated_token::*;
use anchor_spl::token;
use anchor_spl::token::*;

pub fn finish_battle(ctx: Context<FinishBattle>) -> Result<()> {
    // Reset the battleground
    ctx.accounts.battleground_state.status = BattlegroundStatus::Preparing;
    ctx.accounts.battleground_state.last_winner = Some(ctx.accounts.winner_nft_token_account.mint);

    // Get authority signer seeds
    let authority_bump = *ctx.bumps.get("authority").unwrap();
    let authority_seeds = &[
        BATTLEGROUND_AUTHORITY_SEEDS.as_bytes(),
        &ctx.accounts.battle_royale_state.key().to_bytes(),
        &ctx.accounts.battleground_state.id.to_be_bytes(),
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
        battleground: ctx.accounts.battleground_state.key(),
        winner: ctx.accounts.participant_state.key(),
        pot_mint: ctx.accounts.battleground_state.pot_mint,
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
            battle_royale_state.game_master.as_ref(),
        ],
        bump,
    )]
    pub battle_royale_state: Box<Account<'info, BattleRoyaleState>>,

    /// CHECK: Checking correspondance with battle royale state
    #[account(
        seeds = [
            BATTLEGROUND_AUTHORITY_SEEDS.as_bytes(),
            battle_royale_state.key().as_ref(),
            battleground_state.id.to_be_bytes().as_ref(),
        ],
        bump,
    )]
    pub authority: AccountInfo<'info>,

    /// The battleground the participant is entering
    #[account(
        mut,
        seeds = [
            BATTLEGROUND_STATE_SEEDS.as_bytes(),
            battle_royale_state.key().as_ref(),
            battleground_state.id.to_be_bytes().as_ref(),
        ],
        bump,
        has_one = pot_mint,
        constraint = battleground_state.participants == 1,
        constraint = battleground_state.status == BattlegroundStatus::Ongoing,
    )]
    pub battleground_state: Box<Account<'info, BattlegroundState>>,

    #[account(
        mut,
        seeds = [
            PARTICIPANT_STATE_SEEDS.as_bytes(),
            battleground_state.key().as_ref(),
            participant_state.nft_mint.as_ref(),
        ],
        bump,
        has_one = nft_mint,
        constraint = !participant_state.dead,
    )]
    pub participant_state: Box<Account<'info, ParticipantState>>,

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
