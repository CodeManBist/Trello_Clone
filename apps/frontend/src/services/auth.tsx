import { apiRequest } from "./api";

type AuthResponse = {
    token: string;
    user: {
        id: string;
        email: string;
        name: string;
    };
};

export function signup(
    username: string,
    email: string,
    password: string
) {
    return apiRequest<AuthResponse>("/auth/signup", {
        method: "POST",
        body: JSON.stringify({ username, email, password }),
    });
}

export function signin(email: string, password: string) {
    return apiRequest<AuthResponse>("/auth/signin", {
        method: "POST",
        body: JSON.stringify({ email, password }),
    });
}   
