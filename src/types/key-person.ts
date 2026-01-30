import { KeyPerson, TAR, User } from "@prisma/client";

/**
 * KeyPerson with User relation
 */
export type KeyPersonWithUser = KeyPerson & {
  user: Pick<User, 'id' | 'name' | 'email'>;
};

/**
 * KeyPerson with all relations
 */
export type KeyPersonWithRelations = KeyPerson & {
  user: Pick<User, 'id' | 'name' | 'email'>;
  tars: Pick<TAR, 'id' | 'description' | 'status' | 'bigRockId'>[];
};

/**
 * KeyPerson list item (minimal data for list views)
 */
export type KeyPersonListItem = Pick<
  KeyPerson,
  'id' | 'firstName' | 'lastName' | 'role' | 'contact' | 'createdAt'
> & {
  _count?: {
    tars: number;
  };
};

/**
 * KeyPerson form data (for create/edit)
 */
export interface KeyPersonFormData {
  firstName: string;
  lastName: string;
  role?: string | null;
  contact?: string | null;
}

/**
 * KeyPerson for selector (dropdown/multi-select)
 */
export type KeyPersonOption = Pick<
  KeyPerson,
  'id' | 'firstName' | 'lastName' | 'role'
>;

/**
 * Helper to get full name
 */
export function getKeyPersonFullName(person: Pick<KeyPerson, 'firstName' | 'lastName'>): string {
  return `${person.firstName} ${person.lastName}`;
}
