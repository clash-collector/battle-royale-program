use crate::constants::*;
use crate::state::*;
use anchor_lang::prelude::*;
use anchor_spl::associated_token::*;
use anchor_spl::token::*;

pub fn initialize(ctx: Context<Initialize>, fee: u16) -> Result<()> {
    *ctx.accounts.battle_royale_state = BattleRoyaleState {
        bump: *ctx.bumps.get("battle_royale_state").unwrap(),
        game_master: ctx.accounts.game_master.key(),
        fee,
        last_battleground_id: 0,
    };

    Ok(())
}

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(mut)]
    pub game_master: Signer<'info>,

    #[account(
        init,
        payer = game_master,
        space = BattleRoyaleState::LEN,
        seeds = [
            BATTLE_ROYALE_STATE_SEEDS.as_bytes(),
            game_master.key().as_ref(),
        ],
        bump
    )]
    pub battle_royale_state: Account<'info, BattleRoyaleState>,

    // Solana ecosystem program addresses
    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}
