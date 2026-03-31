/**
 * Centralized role constants for the CREATECH platform.
 * Use these instead of raw strings to prevent typos and enable refactoring.
 */
export const ROLES = {
    CREATOR: 'creator',
    CLIENT: 'client',
    ADMIN: 'admin',
};

export const ROLE_LABELS = {
    [ROLES.CREATOR]: 'Creator',
    [ROLES.CLIENT]: 'Client',
    [ROLES.ADMIN]: 'Administrator',
};
