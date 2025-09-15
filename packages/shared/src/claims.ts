import { OrgRole } from "./roles";

export interface ClerkClaims {
  sub: string;
  org_id: string;
  roles: OrgRole[];
  email?: string;
}
