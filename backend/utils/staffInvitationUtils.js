export const isInvitationUsable = (invitation = {}) => {
  const status = String(invitation?.status || '').toLowerCase();
  return status === 'unused';
};

export const getInvitationError = (invitation = {}) => {
  const status = String(invitation?.status || '').toLowerCase();

  if (status === 'revoked') {
    return 'Registration code has been revoked';
  }

  if (status === 'used') {
    return 'Registration code has already been used';
  }

  return null;
};
