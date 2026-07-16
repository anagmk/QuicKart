
export function validateName(name) {
    if (!name.trim()) {
        return "Name is required";
    }

    if (name.trim().length < 3) {
        return "Name must be at least 3 characters";
    }

    if (!/^[A-Za-z ]+$/.test(name)) {
        return "Name can contain only letters";
    }

    return "";
}

export function validateEmail(email) {
    if (!email.trim()) {
        return "Email is required";
    }

    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!regex.test(email)) {
        return "Invalid email address";
    }

    return "";
}

export function validatePassword(password) {
    if (!password) {
        return "Password is required";
    }

    if (password.length < 8) {
        return "Password must be at least 8 characters";
    }

    if (!/[A-Z]/.test(password)) {
        return "Password must contain one uppercase letter";
    }

    if (!/[a-z]/.test(password)) {
        return "Password must contain one lowercase letter";
    }

    if (!/[0-9]/.test(password)) {
        return "Password must contain one number";
    }

    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
        return "Password must contain one special character";
    }

    return "";
}


export function validateConfirmPassword(password, confirmPassword) {
    if (!confirmPassword) {
        return "Confirm Password is required";
    }

    if (password !== confirmPassword) {
        return "Passwords do not match";
    }

    return "";
}

export function validateReferral(referral) {
    if (!referral) return "";

    if (!/^[A-Za-z0-9]+$/.test(referral)) {
        return "Invalid referral code";
    }

    return "";
}