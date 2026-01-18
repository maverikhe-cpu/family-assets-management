import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { FamilyMemberRole } from '../../families/entities/family-member.entity';
import type { RequestWithUser } from '../../types/request.types';

/**
 * 验证用户是否是家庭成员的 Guard
 */
@Injectable()
export class FamilyGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<RequestWithUser>();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('未授权访问');
    }

    if (!user.familyId) {
      throw new ForbiddenException('请先加入或创建一个家庭');
    }

    return true;
  }
}

/**
 * 验证用户是否至少是家庭管理员 (ADMIN 或 OWNER)
 */
@Injectable()
export class FamilyAdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<RequestWithUser>();
    const user = request.user;

    if (!user || !user.familyId) {
      throw new ForbiddenException('未授权访问');
    }

    const familyRole = (user as any).familyRole as string;
    if (
      familyRole !== FamilyMemberRole.ADMIN &&
      familyRole !== FamilyMemberRole.OWNER
    ) {
      throw new ForbiddenException('需要家庭管理员权限');
    }

    return true;
  }
}

/**
 * 验证用户是否是家庭所有者
 */
@Injectable()
export class FamilyOwnerGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<RequestWithUser>();
    const user = request.user;

    if (!user || !user.familyId) {
      throw new ForbiddenException('未授权访问');
    }

    const familyRole = (user as any).familyRole as string;
    if (familyRole !== FamilyMemberRole.OWNER) {
      throw new ForbiddenException('只有家庭所有者可以执行此操作');
    }

    return true;
  }
}

/**
 * 验证用户是否可以编辑 (OWNER, ADMIN, 或 MEMBER)
 * VIEWER 不能编辑
 */
@Injectable()
export class FamilyEditorGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<RequestWithUser>();
    const user = request.user;

    if (!user || !user.familyId) {
      throw new ForbiddenException('未授权访问');
    }

    const familyRole = (user as any).familyRole as string;
    if (familyRole === FamilyMemberRole.VIEWER) {
      throw new ForbiddenException('查看者不能编辑数据');
    }

    return true;
  }
}
