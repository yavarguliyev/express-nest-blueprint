import { ForbiddenException, InternalServerErrorException, JwtPayload, UserRoles, KAFKA_TOPICS, KafkaService } from '@config/libs';

import { UserResponseDto } from '@modules/users/dtos/user-response.dto';

export class UpdateHelper {
  constructor (private readonly kafkaService: KafkaService) {}

  validateSecurityContext (currentUser?: JwtPayload): void {
    if (!currentUser) throw new InternalServerErrorException('Security Context Missing');
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

  async notifyUpdate (currentUser: JwtPayload, id: string | number, data: Partial<UserResponseDto>, updatedUser: UserResponseDto): Promise<void> {
    if (currentUser.role !== UserRoles.GLOBAL_ADMIN) return;

    await this.kafkaService.produce({
      topic: KAFKA_TOPICS.USER.topic,
      key: `${updatedUser.id || id}_${currentUser.sub}`,
      value: {
        type: KAFKA_TOPICS.USER.type,
        title: KAFKA_TOPICS.USER.title,
        message: `${updatedUser.email || 'User'} updated`,
        metadata: { changes: data, updatedBy: currentUser?.email },
        entityId: updatedUser.id || id,
        entityType: 'user',
        recipientIds: [currentUser.sub],
        timestamp: new Date().toISOString()
      }
    });
  }
}
