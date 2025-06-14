import { FastifyRequest, FastifyReply } from 'fastify';
import { IAdmin } from '../interface/admin.interface';

export const permissions = {
  highAdmin: [
    'manageUsers',
    'manageCategories',
    'approveMods',
    'viewAll'
  ],
  lowAdmin: [
    'manageCategories',
    'approveMods',
    'viewAll'
  ],
  moderator: [
    'approveMods'
  ],
} as const;

export type Permission = (typeof permissions)[keyof typeof permissions][number];

interface PermissionOptions {
  permission: Permission;
  categoryIdParam?: string;
}

export function checkPermission(options: PermissionOptions) {
  return async function (request: FastifyRequest<{Body: {user: IAdmin}}>, reply: FastifyReply) {
    const admin = request.body.user as IAdmin;

    if (!admin) {
      return reply.status(401).send({ message: 'Unauthorized' });
    }

    const rolePermissions = permissions[admin.role];
    if (!rolePermissions.includes(options.permission)) {
      return reply.status(403).send({ message: 'Forbidden: insufficient role permissions' });
    }

    if (admin.role === 'moderator' && options.categoryIdParam) {
      const params = request.params as Record<string, string>;
      const categoryId = params[options.categoryIdParam];
      if (!admin.allowedCategoryIds?.includes(categoryId)) {
        return reply.status(403).send({ message: 'Forbidden: no access to this category' });
      }
    }

    return;
  };
}
