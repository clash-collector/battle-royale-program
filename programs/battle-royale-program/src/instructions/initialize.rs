use crate::constants::*;
use crate::state::*;
use anchor_lang::prelude::*;
use anchor_spl::associated_token::*;
use anchor_spl::token::*;

pub fn initialize(ctx: Context<Initialize>, game_master: Pubkey, fee: u16) -> Result<()> {
    *ctx.accounts.battle_royale_state = BattleRoyaleState {
        bump: *ctx.bumps.get("battle_royale_state").unwrap(),
        game_master,
        fee,
        last_battleground_id: if ctx.accounts.battle_royale_state.game_master != Pubkey::default() {
            ctx.accounts.battle_royale_state.last_battleground_id
        } else {
            0
        },
    };

    Ok(())
}

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(mut)]
    pub signer: Signer<'info>,

    #[account(
        init_if_needed,
        payer = signer,
        space = BattleRoyaleState::LEN,
        seeds = [
            BATTLE_ROYALE_STATE_SEEDS.as_bytes()
        ],
        bump,
        constraint = signer.key() == battle_royale_state.game_master || battle_royale_state.game_master == Pubkey::default()
    )]
    pub battle_royale_state: Account<'info, BattleRoyaleState>,

    // Solana ecosystem program addresses
    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}
