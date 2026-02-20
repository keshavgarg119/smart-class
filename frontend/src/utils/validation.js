/**
 * validates the password based on strict requirements
 * @param {string} password 
 * @returns {string|null} error message or null if valid
 */
export const validatePassword = (password) => {
    if (!password) return "Password is required";

    // 1. Length 8-15
    if (password.length < 8 || password.length > 15) {
        return "Password must be 8-15 characters long";
    }

    // 2. No whitespace
    if (/\s/.test(password)) {
        return "Password must not contain any whitespace";
    }

    // 3. At least one digit
    if (!/\d/.test(password)) {
        return "Password must contain at least one digit";
    }

    // 4. At least one uppercase
    if (!/[A-Z]/.test(password)) {
        return "Password must contain at least one uppercase letter";
    }

    // 5. At least one lowercase
    if (!/[a-z]/.test(password)) {
        return "Password must contain at least one lowercase letter";
    }

    // 6. At least one special char (!@#$%&*()-+=^)
    // escaping special regex chars: \- is minus, \^ is caret, etc.
    if (!/[!@#$%&*()\-+=^]/.test(password)) {
        return "Password must contain at least one special character (!@#$%&*()-+=^)";
    }

    return null;
};

export const PASSWORD_REQUIREMENTS_TEXT =
    "Password must be 8-15 chars, include 1 digit, 1 uppercase, 1 lowercase, 1 special char (!@#$%&*()-+=^), and no spaces.";
