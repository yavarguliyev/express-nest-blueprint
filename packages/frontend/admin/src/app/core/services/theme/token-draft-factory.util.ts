import { CssToken, TokenDraft } from '../../interfaces/theme.interface';

export class TokenDraftFactory {
  static createOrGetDraft (token: CssToken, existingDraft: TokenDraft | null): TokenDraft {
    return (
      existingDraft || {
        id: token.id,
        tokenName: token.tokenName,
        lightModeValue: token.lightModeValue,
        darkModeValue: token.darkModeValue,
        defaultValue: token.defaultValue,
        hasChanges: false
      }
    );
  }

  static updateDraftValue (draft: TokenDraft, value: string, mode: 'light' | 'dark' | 'default', shouldUpdateBothModes: boolean = false): TokenDraft {
    const updatedDraft = { ...draft };

    if (mode === 'light') {
      updatedDraft.lightModeValue = value;
      if (shouldUpdateBothModes) updatedDraft.darkModeValue = value;
    } else if (mode === 'dark') {
      updatedDraft.darkModeValue = value;
      if (shouldUpdateBothModes) updatedDraft.lightModeValue = value;
    } else {
      updatedDraft.defaultValue = value;
      updatedDraft.lightModeValue = value;
      updatedDraft.darkModeValue = value;
    }

    return updatedDraft;
  }

  static markChanges (draft: TokenDraft, originalToken: CssToken): TokenDraft {
    return {
      ...draft,
      hasChanges:
        draft.lightModeValue !== originalToken.lightModeValue ||
        draft.darkModeValue !== originalToken.darkModeValue ||
        draft.defaultValue !== originalToken.defaultValue
    };
  }
}
