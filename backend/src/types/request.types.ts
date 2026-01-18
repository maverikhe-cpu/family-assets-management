import { Express } from 'express';
import { User } from '../users/entities/user.entity';

export interface RequestWithUser extends Express.Request {
  user: User;
}
