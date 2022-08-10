export type BattleRoyaleProgram = {
  "version": "0.1.0",
  "name": "battle_royale_program",
  "instructions": [
    {
      "name": "initialize",
      "accounts": [
        {
          "name": "signer",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "battleRoyaleState",
          "isMut": true,
          "isSigner": false,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "type": "string",
                "value": "battle-royale-state-seeds"
              }
            ]
          }
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "associatedTokenProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "rent",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "gameMaster",
          "type": "publicKey"
        },
        {
          "name": "fee",
          "type": "u16"
        }
      ]
    },
    {
      "name": "createBattleground",
      "accounts": [
        {
          "name": "signer",
          "isMut": true,
          "isSigner": true,
          "docs": [
            "The signer that will create the battleground"
          ]
        },
        {
          "name": "battleRoyaleState",
          "isMut": true,
          "isSigner": false,
          "docs": [
            "The Battle Royale State"
          ],
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "type": "string",
                "value": "battle-royale-state-seeds"
              }
            ]
          }
        },
        {
          "name": "authority",
          "isMut": false,
          "isSigner": false,
          "docs": [
            "The authority that holds the pot"
          ],
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "type": "string",
                "value": "battleground-authority-seeds"
              },
              {
                "kind": "account",
                "type": "u64",
                "account": "BattleRoyaleState",
                "path": "battle_royale_state.last_battleground_id"
              }
            ]
          }
        },
        {
          "name": "battlegroundState",
          "isMut": true,
          "isSigner": false,
          "docs": [
            "The battleground on which participants will play"
          ],
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "type": "string",
                "value": "battleground-state-seeds"
              },
              {
                "kind": "account",
                "type": "u64",
                "account": "BattleRoyaleState",
                "path": "battle_royale_state.last_battleground_id"
              }
            ]
          }
        },
        {
          "name": "potMint",
          "isMut": false,
          "isSigner": false,
          "docs": [
            "The mint of the token used to pay the entry fee"
          ]
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false,
          "docs": [
            "Solana ecosystem program addresses"
          ]
        },
        {
          "name": "rent",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "collectionInfo",
          "type": {
            "defined": "CollectionInfo"
          }
        },
        {
          "name": "participantsCap",
          "type": "u32"
        },
        {
          "name": "entryFee",
          "type": "u64"
        },
        {
          "name": "actionPointsPerDay",
          "type": "u32"
        }
      ]
    },
    {
      "name": "joinBattleground",
      "accounts": [
        {
          "name": "signer",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "gameMaster",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "battleRoyale",
          "isMut": false,
          "isSigner": false,
          "docs": [
            "The Battle Royale state"
          ],
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "type": "string",
                "value": "battle-royale-state-seeds"
              }
            ]
          }
        },
        {
          "name": "authority",
          "isMut": false,
          "isSigner": false,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "type": "string",
                "value": "battleground-authority-seeds"
              },
              {
                "kind": "account",
                "type": "u64",
                "account": "BattlegroundState",
                "path": "battleground.id"
              }
            ]
          }
        },
        {
          "name": "battleground",
          "isMut": true,
          "isSigner": false,
          "docs": [
            "The battleground the participant is entering"
          ],
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "type": "string",
                "value": "battleground-state-seeds"
              },
              {
                "kind": "account",
                "type": "u64",
                "account": "BattlegroundState",
                "path": "battleground.id"
              }
            ]
          }
        },
        {
          "name": "participant",
          "isMut": true,
          "isSigner": false,
          "docs": [
            "The participant state"
          ],
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "type": "string",
                "value": "participant-state-seeds"
              },
              {
                "kind": "account",
                "type": "publicKey",
                "account": "BattlegroundState",
                "path": "battleground"
              },
              {
                "kind": "account",
                "type": "publicKey",
                "account": "Mint",
                "path": "nft_mint"
              }
            ]
          }
        },
        {
          "name": "potMint",
          "isMut": false,
          "isSigner": false,
          "docs": [
            "The pot token mint"
          ]
        },
        {
          "name": "nftMint",
          "isMut": false,
          "isSigner": false,
          "docs": [
            "The NFT used to participate"
          ]
        },
        {
          "name": "nftMetadata",
          "isMut": false,
          "isSigner": false,
          "docs": [
            "The token metadata used to verify that the token is part of the collection"
          ]
        },
        {
          "name": "potAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "devAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "playerAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "playerNftTokenAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "associatedTokenProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "rent",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "attack",
          "type": "u32"
        },
        {
          "name": "defense",
          "type": "u32"
        },
        {
          "name": "whitelistRoot",
          "type": {
            "option": {
              "vec": {
                "array": [
                  "u8",
                  32
                ]
              }
            }
          }
        }
      ]
    },
    {
      "name": "startBattle",
      "accounts": [
        {
          "name": "battleRoyale",
          "isMut": false,
          "isSigner": false,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "type": "string",
                "value": "battle-royale-state-seeds"
              }
            ]
          }
        },
        {
          "name": "battleground",
          "isMut": true,
          "isSigner": false,
          "docs": [
            "The battleground the participant is entering"
          ],
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "type": "string",
                "value": "battleground-state-seeds"
              },
              {
                "kind": "account",
                "type": "u64",
                "account": "BattlegroundState",
                "path": "battleground.id"
              }
            ]
          }
        },
        {
          "name": "clock",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": []
    },
    {
      "name": "participantAction",
      "accounts": [
        {
          "name": "signer",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "battleRoyaleState",
          "isMut": false,
          "isSigner": false,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "type": "string",
                "value": "battle-royale-state-seeds"
              }
            ]
          }
        },
        {
          "name": "battlegroundState",
          "isMut": true,
          "isSigner": false,
          "docs": [
            "The battleground the participant is entering"
          ],
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "type": "string",
                "value": "battleground-state-seeds"
              },
              {
                "kind": "account",
                "type": "u64",
                "account": "BattlegroundState",
                "path": "battleground_state.id"
              }
            ]
          }
        },
        {
          "name": "participantState",
          "isMut": true,
          "isSigner": false,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "type": "string",
                "value": "participant-state-seeds"
              },
              {
                "kind": "account",
                "type": "publicKey",
                "account": "BattlegroundState",
                "path": "battleground_state"
              },
              {
                "kind": "account",
                "type": "publicKey",
                "account": "ParticipantState",
                "path": "participant_state.nft_mint"
              }
            ]
          }
        },
        {
          "name": "targetParticipantState",
          "isMut": true,
          "isSigner": false,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "type": "string",
                "value": "participant-state-seeds"
              },
              {
                "kind": "account",
                "type": "publicKey",
                "account": "BattlegroundState",
                "path": "battleground_state"
              },
              {
                "kind": "account",
                "type": "publicKey",
                "account": "ParticipantState",
                "path": "target_participant_state.nft_mint"
              }
            ]
          }
        },
        {
          "name": "playerNftTokenAccount",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "clock",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "actionType",
          "type": {
            "defined": "ActionType"
          }
        },
        {
          "name": "actionPoints",
          "type": "u32"
        }
      ]
    },
    {
      "name": "finishBattle",
      "accounts": [
        {
          "name": "signer",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "winner",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "battleRoyale",
          "isMut": false,
          "isSigner": false,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "type": "string",
                "value": "battle-royale-state-seeds"
              }
            ]
          }
        },
        {
          "name": "authority",
          "isMut": false,
          "isSigner": false,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "type": "string",
                "value": "battleground-authority-seeds"
              },
              {
                "kind": "account",
                "type": "u64",
                "account": "BattlegroundState",
                "path": "battleground.id"
              }
            ]
          }
        },
        {
          "name": "battleground",
          "isMut": true,
          "isSigner": false,
          "docs": [
            "The battleground the participant is entering"
          ],
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "type": "string",
                "value": "battleground-state-seeds"
              },
              {
                "kind": "account",
                "type": "u64",
                "account": "BattlegroundState",
                "path": "battleground.id"
              }
            ]
          }
        },
        {
          "name": "participant",
          "isMut": true,
          "isSigner": false,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "type": "string",
                "value": "participant-state-seeds"
              },
              {
                "kind": "account",
                "type": "publicKey",
                "account": "BattlegroundState",
                "path": "battleground"
              },
              {
                "kind": "account",
                "type": "publicKey",
                "account": "ParticipantState",
                "path": "participant.nft_mint"
              }
            ]
          }
        },
        {
          "name": "potMint",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "nftMint",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "potAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "winnerAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "winnerNftTokenAccount",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "associatedTokenProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "rent",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": []
    }
  ],
  "accounts": [
    {
      "name": "battleRoyaleState",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "bump",
            "type": "u8"
          },
          {
            "name": "gameMaster",
            "type": "publicKey"
          },
          {
            "name": "fee",
            "type": "u16"
          },
          {
            "name": "lastBattlegroundId",
            "type": "u64"
          }
        ]
      }
    },
    {
      "name": "battlegroundState",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "bump",
            "type": "u8"
          },
          {
            "name": "id",
            "type": "u64"
          },
          {
            "name": "collectionInfo",
            "type": {
              "defined": "CollectionInfo"
            }
          },
          {
            "name": "startTime",
            "type": "i64"
          },
          {
            "name": "actionPointsPerDay",
            "type": "u32"
          },
          {
            "name": "participantsCap",
            "type": "u32"
          },
          {
            "name": "participants",
            "type": "u32"
          },
          {
            "name": "status",
            "type": {
              "defined": "BattlegroundStatus"
            }
          },
          {
            "name": "potMint",
            "type": "publicKey"
          },
          {
            "name": "entryFee",
            "type": "u64"
          },
          {
            "name": "lastWinner",
            "type": {
              "option": "publicKey"
            }
          }
        ]
      }
    },
    {
      "name": "participantState",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "bump",
            "type": "u8"
          },
          {
            "name": "battleground",
            "type": "publicKey"
          },
          {
            "name": "nftMint",
            "type": "publicKey"
          },
          {
            "name": "attack",
            "type": "u32"
          },
          {
            "name": "defense",
            "type": "u32"
          },
          {
            "name": "healthPoints",
            "type": "u32"
          },
          {
            "name": "actionPointsSpent",
            "type": "u32"
          },
          {
            "name": "dead",
            "type": "bool"
          }
        ]
      }
    }
  ],
  "types": [
    {
      "name": "CollectionInfo",
      "type": {
        "kind": "enum",
        "variants": [
          {
            "name": "V1",
            "fields": [
              {
                "name": "symbol",
                "type": "string"
              },
              {
                "name": "verified_creators",
                "type": {
                  "vec": "publicKey"
                }
              },
              {
                "name": "whitelist_root",
                "type": {
                  "array": [
                    "u8",
                    32
                  ]
                }
              }
            ]
          },
          {
            "name": "V2",
            "fields": [
              {
                "name": "collection_mint",
                "type": "publicKey"
              }
            ]
          }
        ]
      }
    },
    {
      "name": "BattlegroundStatus",
      "type": {
        "kind": "enum",
        "variants": [
          {
            "name": "Preparing"
          },
          {
            "name": "Ongoing"
          },
          {
            "name": "Finished"
          }
        ]
      }
    },
    {
      "name": "ActionType",
      "type": {
        "kind": "enum",
        "variants": [
          {
            "name": "Attack"
          },
          {
            "name": "Heal"
          }
        ]
      }
    }
  ],
  "events": [
    {
      "name": "CreateBattlegroundEvent",
      "fields": [
        {
          "name": "battleground",
          "type": "publicKey",
          "index": false
        }
      ]
    },
    {
      "name": "JoinBattlegroundEvent",
      "fields": [
        {
          "name": "battleground",
          "type": "publicKey",
          "index": false
        },
        {
          "name": "nftMint",
          "type": "publicKey",
          "index": false
        },
        {
          "name": "attack",
          "type": "u32",
          "index": false
        },
        {
          "name": "defense",
          "type": "u32",
          "index": false
        }
      ]
    },
    {
      "name": "StartBattleEvent",
      "fields": [
        {
          "name": "battleground",
          "type": "publicKey",
          "index": false
        }
      ]
    },
    {
      "name": "ParticipantActionEvent",
      "fields": [
        {
          "name": "battleground",
          "type": "publicKey",
          "index": false
        },
        {
          "name": "participant",
          "type": "publicKey",
          "index": false
        },
        {
          "name": "actionType",
          "type": {
            "defined": "ActionType"
          },
          "index": false
        },
        {
          "name": "actionPointsSpent",
          "type": "u32",
          "index": false
        }
      ]
    },
    {
      "name": "FinishBattleEvent",
      "fields": [
        {
          "name": "battleground",
          "type": "publicKey",
          "index": false
        },
        {
          "name": "winner",
          "type": "publicKey",
          "index": false
        },
        {
          "name": "potMint",
          "type": "publicKey",
          "index": false
        },
        {
          "name": "potAmount",
          "type": "u64",
          "index": false
        }
      ]
    }
  ],
  "errors": [
    {
      "code": 6000,
      "name": "InvalidStatistics",
      "msg": "Invalid statistics"
    },
    {
      "code": 6001,
      "name": "CollectionSymbolInvalid",
      "msg": "Invalid collection symbol"
    },
    {
      "code": 6002,
      "name": "VerifiedCreatorsInvalid",
      "msg": "Invalid provided creators"
    },
    {
      "code": 6003,
      "name": "CollectionVerificationFailed",
      "msg": "Failed collection verification"
    },
    {
      "code": 6004,
      "name": "InsufficientActionPoints",
      "msg": "Not enough action points"
    },
    {
      "code": 6005,
      "name": "WrongBattlegroundStatus",
      "msg": "Wrong battleground status"
    }
  ]
};

export const IDL: BattleRoyaleProgram = {
  "version": "0.1.0",
  "name": "battle_royale_program",
  "instructions": [
    {
      "name": "initialize",
      "accounts": [
        {
          "name": "signer",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "battleRoyaleState",
          "isMut": true,
          "isSigner": false,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "type": "string",
                "value": "battle-royale-state-seeds"
              }
            ]
          }
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "associatedTokenProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "rent",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "gameMaster",
          "type": "publicKey"
        },
        {
          "name": "fee",
          "type": "u16"
        }
      ]
    },
    {
      "name": "createBattleground",
      "accounts": [
        {
          "name": "signer",
          "isMut": true,
          "isSigner": true,
          "docs": [
            "The signer that will create the battleground"
          ]
        },
        {
          "name": "battleRoyaleState",
          "isMut": true,
          "isSigner": false,
          "docs": [
            "The Battle Royale State"
          ],
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "type": "string",
                "value": "battle-royale-state-seeds"
              }
            ]
          }
        },
        {
          "name": "authority",
          "isMut": false,
          "isSigner": false,
          "docs": [
            "The authority that holds the pot"
          ],
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "type": "string",
                "value": "battleground-authority-seeds"
              },
              {
                "kind": "account",
                "type": "u64",
                "account": "BattleRoyaleState",
                "path": "battle_royale_state.last_battleground_id"
              }
            ]
          }
        },
        {
          "name": "battlegroundState",
          "isMut": true,
          "isSigner": false,
          "docs": [
            "The battleground on which participants will play"
          ],
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "type": "string",
                "value": "battleground-state-seeds"
              },
              {
                "kind": "account",
                "type": "u64",
                "account": "BattleRoyaleState",
                "path": "battle_royale_state.last_battleground_id"
              }
            ]
          }
        },
        {
          "name": "potMint",
          "isMut": false,
          "isSigner": false,
          "docs": [
            "The mint of the token used to pay the entry fee"
          ]
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false,
          "docs": [
            "Solana ecosystem program addresses"
          ]
        },
        {
          "name": "rent",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "collectionInfo",
          "type": {
            "defined": "CollectionInfo"
          }
        },
        {
          "name": "participantsCap",
          "type": "u32"
        },
        {
          "name": "entryFee",
          "type": "u64"
        },
        {
          "name": "actionPointsPerDay",
          "type": "u32"
        }
      ]
    },
    {
      "name": "joinBattleground",
      "accounts": [
        {
          "name": "signer",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "gameMaster",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "battleRoyale",
          "isMut": false,
          "isSigner": false,
          "docs": [
            "The Battle Royale state"
          ],
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "type": "string",
                "value": "battle-royale-state-seeds"
              }
            ]
          }
        },
        {
          "name": "authority",
          "isMut": false,
          "isSigner": false,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "type": "string",
                "value": "battleground-authority-seeds"
              },
              {
                "kind": "account",
                "type": "u64",
                "account": "BattlegroundState",
                "path": "battleground.id"
              }
            ]
          }
        },
        {
          "name": "battleground",
          "isMut": true,
          "isSigner": false,
          "docs": [
            "The battleground the participant is entering"
          ],
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "type": "string",
                "value": "battleground-state-seeds"
              },
              {
                "kind": "account",
                "type": "u64",
                "account": "BattlegroundState",
                "path": "battleground.id"
              }
            ]
          }
        },
        {
          "name": "participant",
          "isMut": true,
          "isSigner": false,
          "docs": [
            "The participant state"
          ],
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "type": "string",
                "value": "participant-state-seeds"
              },
              {
                "kind": "account",
                "type": "publicKey",
                "account": "BattlegroundState",
                "path": "battleground"
              },
              {
                "kind": "account",
                "type": "publicKey",
                "account": "Mint",
                "path": "nft_mint"
              }
            ]
          }
        },
        {
          "name": "potMint",
          "isMut": false,
          "isSigner": false,
          "docs": [
            "The pot token mint"
          ]
        },
        {
          "name": "nftMint",
          "isMut": false,
          "isSigner": false,
          "docs": [
            "The NFT used to participate"
          ]
        },
        {
          "name": "nftMetadata",
          "isMut": false,
          "isSigner": false,
          "docs": [
            "The token metadata used to verify that the token is part of the collection"
          ]
        },
        {
          "name": "potAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "devAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "playerAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "playerNftTokenAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "associatedTokenProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "rent",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "attack",
          "type": "u32"
        },
        {
          "name": "defense",
          "type": "u32"
        },
        {
          "name": "whitelistRoot",
          "type": {
            "option": {
              "vec": {
                "array": [
                  "u8",
                  32
                ]
              }
            }
          }
        }
      ]
    },
    {
      "name": "startBattle",
      "accounts": [
        {
          "name": "battleRoyale",
          "isMut": false,
          "isSigner": false,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "type": "string",
                "value": "battle-royale-state-seeds"
              }
            ]
          }
        },
        {
          "name": "battleground",
          "isMut": true,
          "isSigner": false,
          "docs": [
            "The battleground the participant is entering"
          ],
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "type": "string",
                "value": "battleground-state-seeds"
              },
              {
                "kind": "account",
                "type": "u64",
                "account": "BattlegroundState",
                "path": "battleground.id"
              }
            ]
          }
        },
        {
          "name": "clock",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": []
    },
    {
      "name": "participantAction",
      "accounts": [
        {
          "name": "signer",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "battleRoyaleState",
          "isMut": false,
          "isSigner": false,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "type": "string",
                "value": "battle-royale-state-seeds"
              }
            ]
          }
        },
        {
          "name": "battlegroundState",
          "isMut": true,
          "isSigner": false,
          "docs": [
            "The battleground the participant is entering"
          ],
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "type": "string",
                "value": "battleground-state-seeds"
              },
              {
                "kind": "account",
                "type": "u64",
                "account": "BattlegroundState",
                "path": "battleground_state.id"
              }
            ]
          }
        },
        {
          "name": "participantState",
          "isMut": true,
          "isSigner": false,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "type": "string",
                "value": "participant-state-seeds"
              },
              {
                "kind": "account",
                "type": "publicKey",
                "account": "BattlegroundState",
                "path": "battleground_state"
              },
              {
                "kind": "account",
                "type": "publicKey",
                "account": "ParticipantState",
                "path": "participant_state.nft_mint"
              }
            ]
          }
        },
        {
          "name": "targetParticipantState",
          "isMut": true,
          "isSigner": false,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "type": "string",
                "value": "participant-state-seeds"
              },
              {
                "kind": "account",
                "type": "publicKey",
                "account": "BattlegroundState",
                "path": "battleground_state"
              },
              {
                "kind": "account",
                "type": "publicKey",
                "account": "ParticipantState",
                "path": "target_participant_state.nft_mint"
              }
            ]
          }
        },
        {
          "name": "playerNftTokenAccount",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "clock",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "actionType",
          "type": {
            "defined": "ActionType"
          }
        },
        {
          "name": "actionPoints",
          "type": "u32"
        }
      ]
    },
    {
      "name": "finishBattle",
      "accounts": [
        {
          "name": "signer",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "winner",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "battleRoyale",
          "isMut": false,
          "isSigner": false,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "type": "string",
                "value": "battle-royale-state-seeds"
              }
            ]
          }
        },
        {
          "name": "authority",
          "isMut": false,
          "isSigner": false,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "type": "string",
                "value": "battleground-authority-seeds"
              },
              {
                "kind": "account",
                "type": "u64",
                "account": "BattlegroundState",
                "path": "battleground.id"
              }
            ]
          }
        },
        {
          "name": "battleground",
          "isMut": true,
          "isSigner": false,
          "docs": [
            "The battleground the participant is entering"
          ],
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "type": "string",
                "value": "battleground-state-seeds"
              },
              {
                "kind": "account",
                "type": "u64",
                "account": "BattlegroundState",
                "path": "battleground.id"
              }
            ]
          }
        },
        {
          "name": "participant",
          "isMut": true,
          "isSigner": false,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "type": "string",
                "value": "participant-state-seeds"
              },
              {
                "kind": "account",
                "type": "publicKey",
                "account": "BattlegroundState",
                "path": "battleground"
              },
              {
                "kind": "account",
                "type": "publicKey",
                "account": "ParticipantState",
                "path": "participant.nft_mint"
              }
            ]
          }
        },
        {
          "name": "potMint",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "nftMint",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "potAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "winnerAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "winnerNftTokenAccount",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "associatedTokenProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "rent",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": []
    }
  ],
  "accounts": [
    {
      "name": "battleRoyaleState",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "bump",
            "type": "u8"
          },
          {
            "name": "gameMaster",
            "type": "publicKey"
          },
          {
            "name": "fee",
            "type": "u16"
          },
          {
            "name": "lastBattlegroundId",
            "type": "u64"
          }
        ]
      }
    },
    {
      "name": "battlegroundState",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "bump",
            "type": "u8"
          },
          {
            "name": "id",
            "type": "u64"
          },
          {
            "name": "collectionInfo",
            "type": {
              "defined": "CollectionInfo"
            }
          },
          {
            "name": "startTime",
            "type": "i64"
          },
          {
            "name": "actionPointsPerDay",
            "type": "u32"
          },
          {
            "name": "participantsCap",
            "type": "u32"
          },
          {
            "name": "participants",
            "type": "u32"
          },
          {
            "name": "status",
            "type": {
              "defined": "BattlegroundStatus"
            }
          },
          {
            "name": "potMint",
            "type": "publicKey"
          },
          {
            "name": "entryFee",
            "type": "u64"
          },
          {
            "name": "lastWinner",
            "type": {
              "option": "publicKey"
            }
          }
        ]
      }
    },
    {
      "name": "participantState",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "bump",
            "type": "u8"
          },
          {
            "name": "battleground",
            "type": "publicKey"
          },
          {
            "name": "nftMint",
            "type": "publicKey"
          },
          {
            "name": "attack",
            "type": "u32"
          },
          {
            "name": "defense",
            "type": "u32"
          },
          {
            "name": "healthPoints",
            "type": "u32"
          },
          {
            "name": "actionPointsSpent",
            "type": "u32"
          },
          {
            "name": "dead",
            "type": "bool"
          }
        ]
      }
    }
  ],
  "types": [
    {
      "name": "CollectionInfo",
      "type": {
        "kind": "enum",
        "variants": [
          {
            "name": "V1",
            "fields": [
              {
                "name": "symbol",
                "type": "string"
              },
              {
                "name": "verified_creators",
                "type": {
                  "vec": "publicKey"
                }
              },
              {
                "name": "whitelist_root",
                "type": {
                  "array": [
                    "u8",
                    32
                  ]
                }
              }
            ]
          },
          {
            "name": "V2",
            "fields": [
              {
                "name": "collection_mint",
                "type": "publicKey"
              }
            ]
          }
        ]
      }
    },
    {
      "name": "BattlegroundStatus",
      "type": {
        "kind": "enum",
        "variants": [
          {
            "name": "Preparing"
          },
          {
            "name": "Ongoing"
          },
          {
            "name": "Finished"
          }
        ]
      }
    },
    {
      "name": "ActionType",
      "type": {
        "kind": "enum",
        "variants": [
          {
            "name": "Attack"
          },
          {
            "name": "Heal"
          }
        ]
      }
    }
  ],
  "events": [
    {
      "name": "CreateBattlegroundEvent",
      "fields": [
        {
          "name": "battleground",
          "type": "publicKey",
          "index": false
        }
      ]
    },
    {
      "name": "JoinBattlegroundEvent",
      "fields": [
        {
          "name": "battleground",
          "type": "publicKey",
          "index": false
        },
        {
          "name": "nftMint",
          "type": "publicKey",
          "index": false
        },
        {
          "name": "attack",
          "type": "u32",
          "index": false
        },
        {
          "name": "defense",
          "type": "u32",
          "index": false
        }
      ]
    },
    {
      "name": "StartBattleEvent",
      "fields": [
        {
          "name": "battleground",
          "type": "publicKey",
          "index": false
        }
      ]
    },
    {
      "name": "ParticipantActionEvent",
      "fields": [
        {
          "name": "battleground",
          "type": "publicKey",
          "index": false
        },
        {
          "name": "participant",
          "type": "publicKey",
          "index": false
        },
        {
          "name": "actionType",
          "type": {
            "defined": "ActionType"
          },
          "index": false
        },
        {
          "name": "actionPointsSpent",
          "type": "u32",
          "index": false
        }
      ]
    },
    {
      "name": "FinishBattleEvent",
      "fields": [
        {
          "name": "battleground",
          "type": "publicKey",
          "index": false
        },
        {
          "name": "winner",
          "type": "publicKey",
          "index": false
        },
        {
          "name": "potMint",
          "type": "publicKey",
          "index": false
        },
        {
          "name": "potAmount",
          "type": "u64",
          "index": false
        }
      ]
    }
  ],
  "errors": [
    {
      "code": 6000,
      "name": "InvalidStatistics",
      "msg": "Invalid statistics"
    },
    {
      "code": 6001,
      "name": "CollectionSymbolInvalid",
      "msg": "Invalid collection symbol"
    },
    {
      "code": 6002,
      "name": "VerifiedCreatorsInvalid",
      "msg": "Invalid provided creators"
    },
    {
      "code": 6003,
      "name": "CollectionVerificationFailed",
      "msg": "Failed collection verification"
    },
    {
      "code": 6004,
      "name": "InsufficientActionPoints",
      "msg": "Not enough action points"
    },
    {
      "code": 6005,
      "name": "WrongBattlegroundStatus",
      "msg": "Wrong battleground status"
    }
  ]
};
