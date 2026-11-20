export interface MockUser {
  id: string;
  name: string;
  email: string;
  role: 'owner' | 'admin' | 'editor';
}

export interface MockOrganization {
  id: string;
  name: string;
  members: MockUser[];
}

export const mockOrganization: MockOrganization = {
  id: 'org_1',
  name: 'Northwind Labs',
  members: [
    {
      id: 'user_alex',
      name: 'Alex Morgan',
      email: 'alex@northwindlabs.example',
      role: 'owner',
    },
    {
      id: 'user_sam',
      name: 'Sam Patel',
      email: 'sam@northwindlabs.example',
      role: 'admin',
    },
    {
      id: 'user_jamie',
      name: 'Jamie Lee',
      email: 'jamie@northwindlabs.example',
      role: 'editor',
    },
  ],
};

export const currentUser = mockOrganization.members[0];

export const mockOrganizations = [mockOrganization];
