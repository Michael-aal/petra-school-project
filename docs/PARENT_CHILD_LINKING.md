# Parent-child linking and authorization

## Relationship model

The application uses the existing Prisma relationship model:

- User has a role and optional school selection
- Parent is the authenticated parent record linked to a user
- Student is the learner record linked to a school
- StudentParent is the join table used to link a parent to one or more students
- Guardian and GuardianStudent are also supported for guardian-based access

This avoids creating a duplicate parent-child relation and reuses the project’s real database model.

## How the authenticated parent is resolved

The authenticated parent identity comes from the server-side session token, not from a frontend-supplied parentId. The request is authenticated in the protection middleware, then the backend resolves the parent record for the signed-in user and restricts the query to that parent’s student links.

## Authorization rules

Parent-facing endpoints must enforce all of the following:

1. The request has a valid authenticated user.
2. The user role is parent or guardian.
3. The student record exists.
4. The student belongs to the same school context as the parent.
5. The student is actually linked to the authenticated parent.
6. Any studentId provided in the URL is treated as untrusted and verified against the database relationship.

## Multiple children

A parent can have multiple linked students through StudentParent. The dashboard loads the authenticated parent’s real children from the backend and presents a child picker when more than one child is linked.

## Empty state

When a valid parent has no linked students, the UI shows an empty state instead of creating demo data:

No child linked to this account yet.
Please contact the school administrator to link a student to your parent account.

## Admin linking workflow

Administrators continue to create the relationship through the existing student and parent workflows. The system uses the existing StudentParent table to create and maintain the relationship when a school staff member links a parent to a child.

## Security notes

The frontend never decides which parent account is active, and it never filters a full student list client-side. Parent data is fetched from API routes such as /api/parent/children and is checked server-side before any student details are returned.
