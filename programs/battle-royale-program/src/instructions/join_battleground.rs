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
    attack: u32,
    defense: u32,
    _whitelist_proof: Option<Vec<[u8; 32]>>,
) -> Result<()> {
    require!(
        attack + defense <= 100,
        BattleRoyaleError::InvalidStatistics
    );

    *ctx.accounts.participant = ParticipantState {
        bump: *ctx.bumps.get("participant").unwrap(),
        battleground: ctx.accounts.battleground.key(),
        nft_mint: ctx.accounts.nft_mint.key(),
        attack: attack + 100,
        defense: defense + 50,
        action_points_spent: 0,
        health_points: 750 + (defense + 50) * 5,
        alive: true,
    };
    ctx.accounts.battleground.participants += 1;

    let entry_fee = ctx.accounts.battleground.entry_fee;
    let dev_fee = entry_fee * (ctx.accounts.battle_royale.fee as u64) / 10000;

    msg!(
        "Paying {} to the pot, {} to the treasury",
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
        battleground: ctx.accounts.battleground.key(),
        nft_mint: ctx.accounts.nft_mint.key(),
        attack,
        defense,
    });

    Ok(())
}

#[derive(Accounts)]
#[instruction(_attack: u32, _defense: u32, whitelist_proof: Option<Vec<[u8; 32]>>)]
pub struct JoinBattleground<'info> {
    #[account(mut)]
    pub signer: Signer<'info>,

    /// CHECK: Checking correspondance with battle royale state
    #[account(mut)]
    pub game_master: AccountInfo<'info>,

    /// The Battle Royale state
    #[account(
        seeds = [
            BATTLE_ROYALE_STATE_SEEDS.as_bytes(),
        ],
        bump,
        has_one = game_master,
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
        constraint = battleground.participants < battleground.participants_cap,
        constraint = battleground.status == BattlegroundStatus::Preparing @ BattleRoyaleError::WrongBattlegroundStatus,
    )]
    pub battleground: Box<Account<'info, BattlegroundState>>,

    /// The participant state
    /// The participant account must not be alive or must be the winner of the last battle
    /// This prevents reentering with the same NFT
    #[account(
        init_if_needed,
        payer = signer,
        space = ParticipantState::LEN,
        seeds = [
            PARTICIPANT_STATE_SEEDS.as_bytes(),
            battleground.key().as_ref(),
            nft_mint.key().as_ref(),
        ],
        bump,
        constraint = !participant.alive || Some(participant.key()) == battleground.last_winner
    )]
    pub participant: Account<'info, ParticipantState>,

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
        constraint = verify_collection(&nft_metadata, &battleground.collection_info, whitelist_proof) @ BattleRoyaleError::CollectionVerificationFailed
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
