import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../users/users.service';
import { FamiliesService } from '../families/families.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private configService: ConfigService,
    private usersService: UsersService,
    private familiesService: FamiliesService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET') || 'family-assets-secret-key',
    });
  }

  async validate(payload: any) {
    const user = await this.usersService.findOne(payload.userId);
    if (!user) {
      throw new UnauthorizedException();
    }

    // Get user's family role if they have a current family
    let familyRole = null;
    if (user.familyId) {
      familyRole = await this.familiesService.getMemberRole(user.familyId, user.id);
    }

    return {
      userId: user.id,
      email: user.email,
      role: user.role,
      familyId: user.familyId,
      familyRole,
    };
  }
}
