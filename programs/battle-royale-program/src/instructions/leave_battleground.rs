use crate::constants::*;
use crate::errors::*;
use crate::events::*;
use crate::state::*;
use anchor_lang::prelude::*;
use anchor_spl::associated_token::*;
use anchor_spl::token;
use anchor_spl::token::*;

pub fn leave_battleground(ctx: Context<LeaveBattleground>) -> Result<()> {
    emit!(LeaveBattlegroundEvent {
        battleground: ctx.accounts.battleground.key(),
        nft_mint: ctx.accounts.nft_mint.key(),
    });

    Ok(())
}

#[derive(Accounts)]
pub struct LeaveBattleground<'info> {
    #[account(mut)]
    pub signer: Signer<'info>,

    /// The Battle Royale state
    #[account(
        seeds = [
            BATTLE_ROYALE_STATE_SEEDS.as_bytes(),
        ],
        bump,
    )]
    pub battle_royale: Box<Account<'info, BattleRoyaleState>>,

    /// The battleground the participant is entering
    #[account(
        seeds = [
            BATTLEGROUND_STATE_SEEDS.as_bytes(),
            battleground.id.to_le_bytes().as_ref(),
        ],
        bump,
        constraint = battleground.status == BattlegroundStatus::Preparing @ BattleRoyaleError::WrongBattlegroundStatus,
    )]
    pub battleground: Box<Account<'info, BattlegroundState>>,

    /// The participant state
    #[account(
        mut,
        close = signer,
        has_one = nft_mint,
        constraint = !participant.alive
    )]
    pub participant: Account<'info, ParticipantState>,

    /// The NFT used to participate
    #[account(owner = token::ID)]
    pub nft_mint: Account<'info, Mint>,

    #[account(
        init_if_needed,
        payer = signer,
        associated_token::mint = nft_mint,
        associated_token::authority = signer,
        constraint = player_nft_token_account.amount == 1,
    )]
    pub player_nft_token_account: Box<Account<'info, TokenAccount>>,

    // Solana ecosystem program addresses
    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}
