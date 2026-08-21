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

export type OrganizationMember = {
  id: string;
  userId: string;
  organizationId: string;
  role: "ADMIN" | "MEMBER";
  user: {
    id: string;
    username: string;
    email: string;
  };
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
  return apiRequest<{ message: string }>(
    `/organizations/${id}`,
    {
      method: "DELETE",
    }
  );
}

export function getOrganizationMembers(
  organizationId: string
) {
  return apiRequest<OrganizationMember[]>(
    `/organizations/${organizationId}/members`
  );
}

export function removeOrganizationMember(
  organizationId: string,
  userId: string
) {
  return apiRequest<{ message: string }>(
    `/organizations/${organizationId}/members/${userId}`,
    {
      method: "DELETE",
    }
  );
}