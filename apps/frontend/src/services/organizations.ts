import { apiRequest } from "./api";

export type Organization = {
    id: string;
    name: string;
    description: string;
};

export function getOrganizations() {
    return apiRequest<Organization[]>("/organizations")
}

export function createOrganization(name: string, description: string) {
    return apiRequest<Organization>("/organizations", {
        method: "POST",
        body: JSON.stringify({ name, description }),
    });
}