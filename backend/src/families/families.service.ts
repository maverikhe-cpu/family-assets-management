import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Family } from './entities/family.entity';
import { FamilyMember, FamilyMemberRole } from './entities/family-member.entity';
import { User } from '../users/entities/user.entity';
import { CreateFamilyDto } from './dto/create-family.dto';
import { UpdateFamilyDto } from './dto/update-family.dto';
import { AddMemberDto } from './dto/add-member.dto';
import { UpdateMemberRoleDto } from './dto/update-member-role.dto';
import * as crypto from 'crypto';

@Injectable()
export class FamiliesService {
  constructor(
    @InjectRepository(Family)
    private familiesRepository: Repository<Family>,
    @InjectRepository(FamilyMember)
    private familyMembersRepository: Repository<FamilyMember>,
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  /**
   * 生成邀请码
   */
  private generateInviteCode(): string {
    return crypto.randomBytes(6).toString('hex').toUpperCase();
  }

  /**
   * 创建家庭
   */
  async create(user: User, createFamilyDto: CreateFamilyDto): Promise<Family> {
    const family = this.familiesRepository.create({
      ...createFamilyDto,
      createdBy: user.id,
      inviteCode: this.generateInviteCode(),
    });

    const savedFamily = await this.familiesRepository.save(family);

    // 创建者自动成为家庭所有者
    const ownerMember = this.familyMembersRepository.create({
      familyId: savedFamily.id,
      userId: user.id,
      role: FamilyMemberRole.OWNER,
    });
    await this.familyMembersRepository.save(ownerMember);

    // 更新用户的当前家庭
    user.familyId = savedFamily.id;
    await this.usersRepository.save(user);

    return this.findOne(savedFamily.id, user.id);
  }

  /**
   * 获取用户的所有家庭
   */
  async findAll(user: User): Promise<Family[]> {
    const memberships = await this.familyMembersRepository.find({
      where: { userId: user.id },
      relations: ['family'],
    });

    return memberships.map((m) => m.family);
  }

  /**
   * 获取家庭详情
   */
  async findOne(familyId: string, userId: string): Promise<Family> {
    const family = await this.familiesRepository.findOne({
      where: { id: familyId },
    });

    if (!family) {
      throw new NotFoundException('家庭不存在');
    }

    // 验证用户是否是该家庭成员
    const membership = await this.familyMembersRepository.findOne({
      where: { familyId, userId },
    });

    if (!membership) {
      throw new ForbiddenException('您不是该家庭成员');
    }

    // 加载成员信息
    const members = await this.familyMembersRepository.find({
      where: { familyId },
      relations: ['user'],
    });

    return { ...family, members } as any;
  }

  /**
   * 更新家庭信息
   */
  async update(
    familyId: string,
    userId: string,
    updateFamilyDto: UpdateFamilyDto,
  ): Promise<Family> {
    const family = await this.familiesRepository.findOne({
      where: { id: familyId },
    });

    if (!family) {
      throw new NotFoundException('家庭不存在');
    }

    // 只有所有者和管理员可以修改
    const membership = await this.familyMembersRepository.findOne({
      where: { familyId, userId },
    });

    if (!membership) {
      throw new ForbiddenException('您不是该家庭成员');
    }

    if (
      membership.role !== FamilyMemberRole.OWNER &&
      membership.role !== FamilyMemberRole.ADMIN
    ) {
      throw new ForbiddenException('只有所有者和管理员可以修改家庭信息');
    }

    Object.assign(family, updateFamilyDto);
    return this.familiesRepository.save(family);
  }

  /**
   * 删除家庭
   */
  async remove(familyId: string, userId: string): Promise<void> {
    const family = await this.familiesRepository.findOne({
      where: { id: familyId },
    });

    if (!family) {
      throw new NotFoundException('家庭不存在');
    }

    // 只有所有者可以删除家庭
    const membership = await this.familyMembersRepository.findOne({
      where: { familyId, userId },
    });

    if (!membership || membership.role !== FamilyMemberRole.OWNER) {
      throw new ForbiddenException('只有家庭所有者可以删除家庭');
    }

    await this.familiesRepository.remove(family);
  }

  /**
   * 添加家庭成员
   */
  async addMember(
    familyId: string,
    userId: string,
    addMemberDto: AddMemberDto,
  ): Promise<FamilyMember> {
    const family = await this.familiesRepository.findOne({
      where: { id: familyId },
    });

    if (!family) {
      throw new NotFoundException('家庭不存在');
    }

    // 验证操作者权限
    const operatorMembership = await this.familyMembersRepository.findOne({
      where: { familyId, userId },
    });

    if (!operatorMembership) {
      throw new ForbiddenException('您不是该家庭成员');
    }

    if (
      operatorMembership.role !== FamilyMemberRole.OWNER &&
      operatorMembership.role !== FamilyMemberRole.ADMIN
    ) {
      throw new ForbiddenException('只有所有者和管理员可以添加成员');
    }

    // 检查目标用户是否存在
    const targetUser = await this.usersRepository.findOne({
      where: { id: addMemberDto.userId },
    });

    if (!targetUser) {
      throw new NotFoundException('目标用户不存在');
    }

    // 检查目标用户是否已是成员
    const existingMember = await this.familyMembersRepository.findOne({
      where: { familyId, userId: addMemberDto.userId },
    });

    if (existingMember) {
      throw new ConflictException('该用户已是家庭成员');
    }

    // 添加成员
    const newMember = this.familyMembersRepository.create({
      familyId,
      userId: addMemberDto.userId,
      role: addMemberDto.role || FamilyMemberRole.MEMBER,
      invitedBy: userId,
    });

    return this.familyMembersRepository.save(newMember);
  }

  /**
   * 移除家庭成员
   */
  async removeMember(
    familyId: string,
    operatorId: string,
    targetUserId: string,
  ): Promise<void> {
    const family = await this.familiesRepository.findOne({
      where: { id: familyId },
    });

    if (!family) {
      throw new NotFoundException('家庭不存在');
    }

    const operatorMembership = await this.familyMembersRepository.findOne({
      where: { familyId, userId: operatorId },
    });

    if (!operatorMembership) {
      throw new ForbiddenException('您不是该家庭成员');
    }

    const targetMembership = await this.familyMembersRepository.findOne({
      where: { familyId, userId: targetUserId },
    });

    if (!targetMembership) {
      throw new NotFoundException('目标成员不存在');
    }

    // 所有者不能被移除
    if (targetMembership.role === FamilyMemberRole.OWNER) {
      throw new ForbiddenException('不能移除家庭所有者');
    }

    // 只有所有者可以移除管理员，管理员不能移除管理员
    if (
      operatorMembership.role !== FamilyMemberRole.OWNER &&
      targetMembership.role === FamilyMemberRole.ADMIN
    ) {
      throw new ForbiddenException('只有所有者可以移除管理员');
    }

    await this.familyMembersRepository.remove(targetMembership);
  }

  /**
   * 更新成员角色
   */
  async updateMemberRole(
    familyId: string,
    operatorId: string,
    targetUserId: string,
    updateMemberRoleDto: UpdateMemberRoleDto,
  ): Promise<FamilyMember> {
    const family = await this.familiesRepository.findOne({
      where: { id: familyId },
    });

    if (!family) {
      throw new NotFoundException('家庭不存在');
    }

    const operatorMembership = await this.familyMembersRepository.findOne({
      where: { familyId, userId: operatorId },
    });

    if (!operatorMembership) {
      throw new ForbiddenException('您不是该家庭成员');
    }

    const targetMembership = await this.familyMembersRepository.findOne({
      where: { familyId, userId: targetUserId },
    });

    if (!targetMembership) {
      throw new NotFoundException('目标成员不存在');
    }

    // 只有所有者可以修改角色
    if (operatorMembership.role !== FamilyMemberRole.OWNER) {
      throw new ForbiddenException('只有所有者可以修改成员角色');
    }

    // 不能将所有者降级
    if (
      targetMembership.role === FamilyMemberRole.OWNER &&
      updateMemberRoleDto.role !== FamilyMemberRole.OWNER
    ) {
      throw new ForbiddenException('不能修改所有者的角色');
    }

    targetMembership.role = updateMemberRoleDto.role;
    return this.familyMembersRepository.save(targetMembership);
  }

  /**
   * 通过邀请码加入家庭
   */
  async joinByInviteCode(
    user: User,
    inviteCode: string,
  ): Promise<FamilyMember> {
    const family = await this.familiesRepository.findOne({
      where: { inviteCode },
    });

    if (!family) {
      throw new NotFoundException('邀请码无效');
    }

    // 检查是否已是成员
    const existingMember = await this.familyMembersRepository.findOne({
      where: { familyId: family.id, userId: user.id },
    });

    if (existingMember) {
      throw new ConflictException('您已经是该家庭成员');
    }

    const newMember = this.familyMembersRepository.create({
      familyId: family.id,
      userId: user.id,
      role: FamilyMemberRole.MEMBER,
    });

    await this.familyMembersRepository.save(newMember);

    // 如果是用户的第一个家庭，设置为当前家庭
    if (!user.familyId) {
      user.familyId = family.id;
      await this.usersRepository.save(user);
    }

    return this.familyMembersRepository.findOne({
      where: { familyId: family.id, userId: user.id },
      relations: ['family'],
    }) as Promise<FamilyMember>;
  }

  /**
   * 切换当前家庭
   */
  async switchFamily(user: User, familyId: string): Promise<User> {
    // 验证用户是否是该家庭成员
    const membership = await this.familyMembersRepository.findOne({
      where: { familyId, userId: user.id },
    });

    if (!membership) {
      throw new ForbiddenException('您不是该家庭成员');
    }

    user.familyId = familyId;
    return this.usersRepository.save(user);
  }

  /**
   * 获取成员在家庭中的角色
   */
  async getMemberRole(
    familyId: string,
    userId: string,
  ): Promise<FamilyMemberRole | null> {
    const membership = await this.familyMembersRepository.findOne({
      where: { familyId, userId },
    });

    return membership?.role || null;
  }
}
