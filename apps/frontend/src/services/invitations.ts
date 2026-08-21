import { apiRequest } from "./api";

export type InvitationOrganization = {
  id: string;
  name: string;
  description: string | null;
};

export type InvitationUser = {
  id: string;
  username: string;
  email: string;
};

export type Invitation = {
  id: string;
  email: string;
  organizationId: string;
  invitedById: string;
  token: string;
  status: "PENDING" | "ACCEPTED";
  createdAt: string;
  organization: InvitationOrganization;
  invitedBy?: InvitationUser;
};

export type CreateInvitationResponse = {
  message: string;
  invitation: Invitation;
};

export type AcceptInvitationResponse = {
  message: string;
  membership: {
    id: string;
    userId: string;
    organizationId: string;
    role: "ADMIN" | "MEMBER";
  };
};

// Create organization invitation
export function createInvitation(
  organizationId: string,
  email: string
) {
  return apiRequest<CreateInvitationResponse>(
    `/organizations/${organizationId}/invitations`,
    {
      method: "POST",
      body: JSON.stringify({
        email: email.trim().toLowerCase(),
      }),
    }
  );
}

// Get invitations for logged-in user
export function getInvitations() {
  return apiRequest<Invitation[]>("/invitations");
}

// Accept invitation
export function acceptInvitation(token: string) {
  return apiRequest<AcceptInvitationResponse>(
    `/invitations/${token}/accept`,
    {
      method: "POST",
    }
  );
}