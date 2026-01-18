import { Express } from 'express';

export interface JwtPayload {
  userId: string;
  email: string;
  role: string;
  familyId?: string | null;
  familyRole?: string | null;
}

export interface RequestWithUser extends Express.Request {
  user: JwtPayload;
}
