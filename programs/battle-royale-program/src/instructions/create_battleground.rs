use crate::common::*;
use crate::constants::*;
use crate::errors::*;
use crate::events::*;
use crate::state::*;
use anchor_lang::prelude::*;
use anchor_spl::token;
use anchor_spl::token::*;

pub fn create_battleground(
    ctx: Context<CreateBattleground>,
    collection_info: CollectionInfo,
    participants_cap: u32,
    entry_fee: u64,
    action_points_per_day: u32,
    whitelist_root: Option<[u8; 32]>,
) -> Result<()> {
    match collection_info {
        CollectionInfo::V1 {
            ref symbol,
            ref verified_creators,
            whitelist_root: _,
        } => {
            // Check if symbol is too long
            require!(
                // Max string length is 8, so UTF-8 encoded max byte length is 32
                symbol.len() <= 8 * 4,
                BattleRoyaleError::CollectionSymbolInvalid
            );

            // Check if there are 1-5 verified creators
            require!(
                !verified_creators.is_empty() && verified_creators.len() <= 5,
                BattleRoyaleError::VerifiedCreatorsInvalid
            )
        }
        CollectionInfo::V2 { collection_mint: _ } => {}
    };

    // Initialize the battleground account
    *ctx.accounts.battleground_state = BattlegroundState {
        bump: *ctx.bumps.get("battleground_state").unwrap(),
        id: ctx.accounts.battle_royale_state.last_battleground_id,
        collection_info,
        start_time: 0,
        action_points_per_day,
        participants_cap,
        participants: 0,
        status: BattlegroundStatus::Preparing,
        pot_mint: ctx.accounts.pot_mint.key(),
        entry_fee,
        last_winner: None,
        whitelist_root,
    };

    ctx.accounts.battle_royale_state.last_battleground_id += 1;

    emit!(CreateBattlegroundEvent {
        battleground: ctx.accounts.battleground_state.key()
    });

    Ok(())
}

#[derive(Accounts)]
pub struct CreateBattleground<'info> {
    /// The signer that will create the battleground
    #[account(mut)]
    pub signer: Signer<'info>,

    /// The Battle Royale State
    #[account(
        mut,
        seeds = [
            BATTLE_ROYALE_STATE_SEEDS.as_bytes(),
        ],
        bump,
    )]
    pub battle_royale_state: Account<'info, BattleRoyaleState>,

    /// The authority that holds the pot
    /// CHECK: Checking correspondance with battle royale state
    #[account(
        seeds = [
            BATTLEGROUND_AUTHORITY_SEEDS.as_bytes(),
            battle_royale_state.last_battleground_id.to_le_bytes().as_ref()
        ],
        bump,
    )]
    pub authority: AccountInfo<'info>,

    /// The battleground on which participants will play
    #[account(
        init,
        payer = signer,
        space = BattlegroundState::LEN,
        seeds = [
            BATTLEGROUND_STATE_SEEDS.as_bytes(),
            battle_royale_state.last_battleground_id.to_le_bytes().as_ref()
        ],
        bump,
    )]
    pub battleground_state: Account<'info, BattlegroundState>,

    /// The mint of the token used to pay the entry fee
    #[account(owner = token::ID)]
    pub pot_mint: Account<'info, Mint>,

    /// Solana ecosystem program addresses
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}
