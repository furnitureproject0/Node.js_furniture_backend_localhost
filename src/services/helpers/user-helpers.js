/**
 * Generates a random secure password that passes the Joi validation schema.
 * Requires at least 1 uppercase, 1 lowercase, 1 number, and 1 special character.
 * @param {number} length - Desired length of the password (minimum 8)
 * @returns {string} - The generated password
 */
export const generateValidPassword = (length = 10) => {
    const targetLength = Math.max(8, length);

    const lowerCase = "abcdefghijklmnopqrstuvwxyz";
    const upperCase = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    const numbers = "0123456789";
    const specialChars = "!@#$%^&*()_+~`|}{[]:;?><,./-=";

    const allChars = lowerCase + upperCase + numbers + specialChars;

    let password = "";

    password += lowerCase[Math.floor(Math.random() * lowerCase.length)];
    password += upperCase[Math.floor(Math.random() * upperCase.length)];
    password += numbers[Math.floor(Math.random() * numbers.length)];
    password += specialChars[Math.floor(Math.random() * specialChars.length)];

    for (let i = password.length; i < targetLength; i++) {
        password += allChars[Math.floor(Math.random() * allChars.length)];
    }

    const passwordArray = password.split('');
    for (let i = passwordArray.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [passwordArray[i], passwordArray[j]] = [passwordArray[j], passwordArray[i]];
    }

    return passwordArray.join('');
};