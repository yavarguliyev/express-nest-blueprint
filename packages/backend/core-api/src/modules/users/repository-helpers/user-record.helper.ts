export const hasProfileImageUrl = (item: unknown): item is { profileImageUrl?: string } => {
  return typeof item === 'object' && item !== null && 'profileImageUrl' in item;
};
