use crate::common::*;
use crate::constants::*;
use crate::errors::*;
use crate::events::*;
use crate::state::*;
use anchor_lang::prelude::*;
use anchor_spl::associated_token::*;
use anchor_spl::token;
use anchor_spl::token::*;

pub fn join_battleground(
    ctx: Context<JoinBattleground>,
    attack: u16,
    defense: u16,
    _whitelist_proof: Option<Vec<[u8; 32]>>,
) -> Result<()> {
    require!(
        attack + defense <= 100,
        BattleRoyaleError::InvalidStatistics
    );

    *ctx.accounts.participant_state = ParticipantState {
        bump: *ctx.bumps.get("participant_state").unwrap(),
        battleground: ctx.accounts.battleground_state.key(),
        nft_mint: ctx.accounts.nft_mint.key(),
        attack: 100 + attack,
        defense,
        action_points_spent: 0,
        health_points: 1000 + defense * 5,
        dead: false,
    };
    ctx.accounts.battleground_state.participants += 1;

    let entry_fee = ctx.accounts.battleground_state.entry_fee;
    let dev_fee = entry_fee * (ctx.accounts.battle_royale_state.fee as u64) / 10000;

    msg!(
        "Paying {} to the pot, {} to the dev",
        entry_fee - dev_fee,
        dev_fee
    );

    // Pay the ticket price
    let transfer_entry_fee_ctx = CpiContext::new(
        ctx.accounts.token_program.to_account_info().clone(),
        token::Transfer {
            from: ctx.accounts.player_account.to_account_info().clone(),
            to: ctx.accounts.pot_account.to_account_info().clone(),
            authority: ctx.accounts.signer.to_account_info().clone(),
        },
    );
    token::transfer(transfer_entry_fee_ctx, entry_fee - dev_fee)?;
    let transfer_dev_fee_ctx = CpiContext::new(
        ctx.accounts.token_program.to_account_info().clone(),
        token::Transfer {
            from: ctx.accounts.player_account.to_account_info().clone(),
            to: ctx.accounts.dev_account.to_account_info().clone(),
            authority: ctx.accounts.signer.to_account_info().clone(),
        },
    );
    token::transfer(transfer_dev_fee_ctx, dev_fee)?;

    emit!(JoinBattlegroundEvent {
        battleground: ctx.accounts.battleground_state.key(),
        nft_mint: ctx.accounts.nft_mint.key(),
        attack,
        defense,
    });

    Ok(())
}

#[derive(Accounts)]
#[instruction(_attack: u16, _defense: u16, whitelist_proof: Option<Vec<[u8; 32]>>)]
pub struct JoinBattleground<'info> {
    #[account(mut)]
    pub signer: Signer<'info>,

    /// CHECK: Checking correspondance with battle royale state
    #[account(mut)]
    pub game_master: AccountInfo<'info>,

    #[account(
        seeds = [
            BATTLE_ROYALE_STATE_SEEDS.as_bytes(),
            battle_royale_state.game_master.as_ref(),
        ],
        bump = battle_royale_state.bump,
        has_one = game_master,
    )]
    pub battle_royale_state: Account<'info, BattleRoyaleState>,

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
        constraint = battleground_state.participants < battleground_state.participants_cap
    )]
    pub battleground_state: Account<'info, BattlegroundState>,

    /// The participant state
    #[account(
        init,
        payer = signer,
        space = ParticipantState::LEN,
        seeds = [
            PARTICIPANT_STATE_SEEDS.as_bytes(),
            battleground_state.key().as_ref(),
            nft_mint.key().as_ref(),
        ],
        bump,
    )]
    pub participant_state: Account<'info, ParticipantState>,

    /// The pot token mint
    #[account(owner = token::ID)]
    pub pot_mint: Account<'info, Mint>,

    /// The NFT used to participate
    #[account(owner = token::ID)]
    pub nft_mint: Account<'info, Mint>,

    /// The token metadata used to verify that the token is part of the collection
    /// CHECK: Safe because there are already enough constraints
    #[account(
        address = mpl_token_metadata::pda::find_metadata_account(&nft_mint.key()).0,
        constraint = mpl_token_metadata::check_id(nft_metadata.owner),
        constraint = verify_collection(&nft_metadata, &battleground_state.collection_info, whitelist_proof) @ BattleRoyaleError::CollectionVerificationFailed
    )]
    pub nft_metadata: UncheckedAccount<'info>,

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
        associated_token::authority = game_master,
    )]
    pub dev_account: Box<Account<'info, TokenAccount>>,

    #[account(
        init_if_needed,
        payer = signer,
        associated_token::mint = pot_mint,
        associated_token::authority = signer,
    )]
    pub player_account: Box<Account<'info, TokenAccount>>,

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
