import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { FamiliesService } from './families.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CreateFamilyDto } from './dto/create-family.dto';
import { UpdateFamilyDto } from './dto/update-family.dto';
import { AddMemberDto } from './dto/add-member.dto';
import { UpdateMemberRoleDto } from './dto/update-member-role.dto';
import type { RequestWithUser } from '../types/request.types';

@Controller('families')
@UseGuards(JwtAuthGuard)
export class FamiliesController {
  constructor(private readonly familiesService: FamiliesService) {}

  /**
   * 创建家庭
   * POST /families
   */
  @Post()
  async create(@Request() req: RequestWithUser, @Body() createFamilyDto: CreateFamilyDto) {
    const family = await this.familiesService.create(req.user.userId, createFamilyDto);
    return {
      id: family.id,
      name: family.name,
      description: family.description,
      inviteCode: family.inviteCode,
      createdAt: family.createdAt,
    };
  }

  /**
   * 获取我的家庭列表
   * GET /families
   */
  @Get()
  async findAll(@Request() req: RequestWithUser) {
    const families = await this.familiesService.findAll(req.user.userId);
    return families.map((f) => ({
      id: f.id,
      name: f.name,
      description: f.description,
      createdAt: f.createdAt,
    }));
  }

  /**
   * 获取家庭详情
   * GET /families/:id
   */
  @Get(':id')
  async findOne(@Param('id') id: string, @Request() req: RequestWithUser) {
    const family = await this.familiesService.findOne(id, req.user.userId);
    return family;
  }

  /**
   * 更新家庭信息
   * PUT /families/:id
   */
  @Put(':id')
  async update(
    @Param('id') id: string,
    @Request() req: RequestWithUser,
    @Body() updateFamilyDto: UpdateFamilyDto,
  ) {
    const family = await this.familiesService.update(
      id,
      req.user.userId,
      updateFamilyDto,
    );
    return {
      id: family.id,
      name: family.name,
      description: family.description,
      updatedAt: family.updatedAt,
    };
  }

  /**
   * 删除家庭
   * DELETE /families/:id
   */
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string, @Request() req: RequestWithUser) {
    await this.familiesService.remove(id, req.user.userId);
  }

  /**
   * 添加家庭成员
   * POST /families/:id/members
   */
  @Post(':id/members')
  async addMember(
    @Param('id') id: string,
    @Request() req: RequestWithUser,
    @Body() addMemberDto: AddMemberDto,
  ) {
    const member = await this.familiesService.addMember(
      id,
      req.user.userId,
      addMemberDto,
    );
    return member;
  }

  /**
   * 移除家庭成员
   * DELETE /families/:id/members/:userId
   */
  @Delete(':id/members/:userId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async removeMember(
    @Param('id') id: string,
    @Param('userId') userId: string,
    @Request() req: RequestWithUser,
  ) {
    await this.familiesService.removeMember(id, req.user.userId, userId);
  }

  /**
   * 更新成员角色
   * PUT /families/:id/members/:userId/role
   */
  @Put(':id/members/:userId/role')
  async updateMemberRole(
    @Param('id') id: string,
    @Param('userId') userId: string,
    @Request() req: RequestWithUser,
    @Body() updateMemberRoleDto: UpdateMemberRoleDto,
  ) {
    const member = await this.familiesService.updateMemberRole(
      id,
      req.user.userId,
      userId,
      updateMemberRoleDto,
    );
    return member;
  }

  /**
   * 通过邀请码加入家庭
   * POST /families/join/:inviteCode
   */
  @Post('join/:inviteCode')
  async joinByInviteCode(
    @Param('inviteCode') inviteCode: string,
    @Request() req: RequestWithUser,
  ) {
    const member = await this.familiesService.joinByInviteCode(
      req.user.userId,
      inviteCode,
    );
    return {
      familyId: member.familyId,
      role: member.role,
    };
  }

  /**
   * 切换当前家庭
   * POST /families/:id/switch
   */
  @Post(':id/switch')
  async switchFamily(@Param('id') id: string, @Request() req: RequestWithUser) {
    const user = await this.familiesService.switchFamily(req.user.userId, id);
    return {
      familyId: user.familyId,
    };
  }

  /**
   * 重新生成邀请码
   * POST /families/:id/regenerate-invite-code
   */
  @Post(':id/regenerate-invite-code')
  async regenerateInviteCode(@Param('id') id: string, @Request() req: RequestWithUser) {
    const inviteCode = await this.familiesService.regenerateInviteCode(id, req.user.userId);
    return {
      inviteCode,
    };
  }
}
