import { apiRequest } from "./api";

export type Organization = {
  id: string;
  name: string;
  description: string;
};

export type OrganizationMembership = {
  id: string;
  role: "ADMIN" | "MEMBER";
  organization: Organization;
};

export function getOrganizations() {
  return apiRequest<OrganizationMembership[]>("/organizations");
}

export function createOrganization(
  name: string,
  description: string
) {
  return apiRequest<Organization>("/organizations", {
    method: "POST",
    body: JSON.stringify({
      name,
      description,
    }),
  });
}

export function updateOrganization(
  id: string,
  name: string,
  description: string
) {
  return apiRequest<Organization>(`/organizations/${id}`, {
    method: "PUT",
    body: JSON.stringify({
      name,
      description,
    }),
  });
}

export function deleteOrganization(id: string) {
  return apiRequest<{ message: string }>(`/organizations/${id}`, {
    method: "DELETE",
  });
}