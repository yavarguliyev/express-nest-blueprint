import { ForbiddenException, InternalServerErrorException, JwtPayload, UserRoles } from '@config/libs';

import { UserResponseDto } from '@modules/users/dtos/user-response.dto';

export class ValidationHelper {
  validateSecurityContext (currentUser?: JwtPayload): void {
    if (!currentUser) throw new InternalServerErrorException('Security Context Missing');
  }

  validateSelfDeletion (currentUser: JwtPayload, id: string | number): void {
    if (String(currentUser.sub) === String(id)) throw new ForbiddenException('Forbidden self-deletion');
  }

  validateAdminRole (currentUser: JwtPayload): void {
    if (currentUser.role !== UserRoles.GLOBAL_ADMIN) throw new ForbiddenException('Admin required for deletion');
  }

  validateSelfUpdate (currentUser: JwtPayload, id: string | number, data: Partial<UserResponseDto>): void {
    if (String(currentUser.sub) !== String(id)) return;
    const restrictedFields = ['isactive', 'is_active', 'isemailverified', 'is_email_verified', 'role'];
    const hasRestrictedField = Object.keys(data).some(field => restrictedFields.some(restricted => field.toLowerCase() === restricted.toLowerCase()));
    if (hasRestrictedField) throw new ForbiddenException('Forbidden account update');
  }

  validateSensitiveFields (currentUser: JwtPayload, data: Partial<UserResponseDto>): void {
    const sensitiveFields = ['isActive', 'isEmailVerified'];
    const hasSensitiveField = Object.keys(data).some(field => sensitiveFields.some(sensitive => field.toLowerCase() === sensitive.toLowerCase()));
    if (hasSensitiveField && currentUser.role !== UserRoles.GLOBAL_ADMIN) throw new ForbiddenException('Admin required for sensitive fields');
  }

  validateRoleUpdate (currentUser: JwtPayload, data: Partial<UserResponseDto>): void {
    if (data.role !== undefined && currentUser.role !== UserRoles.GLOBAL_ADMIN) throw new ForbiddenException('Admin required for role update');
  }
}
