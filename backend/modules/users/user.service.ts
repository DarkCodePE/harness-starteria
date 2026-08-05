import { PrismaClient, TeamRole, TeamMemberStatus } from '@prisma/client';
import { AppError } from '../../shared/errors/AppError';
import { User, Role } from '../../shared/types';
import { UpdateProfileInput, InviteMemberInput } from './user.schemas';

export class UserService {
  constructor(private prisma: PrismaClient) {}

  async getProfile(userId: string): Promise<User> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw AppError.notFound('Usuario', 'USER_NOT_FOUND', { hint: 'Verifica el correo o el ID.' });
    }

    return user as unknown as User;
  }

  async updateProfile(userId: string, data: UpdateProfileInput): Promise<User> {
    const user = await this.prisma.user.update({
      where: { id: userId },
      data,
    });

    return user as unknown as User;
  }

  /**
   * ADR-028: asigna un rol de plataforma. Es la operación más sensible del sistema
   * porque concede privilegios, así que sólo la alcanza `requireRole('admin')` en el
   * router y además:
   *
   * - un admin NO puede cambiar su propio rol (evita la auto-degradación que dejaría
   *   el sistema sin ningún admin);
   * - al cambiarlo se revocan los refresh tokens del usuario objetivo, porque `refresh`
   *   relee `user.role` de la base y sin revocar el cambio no aterriza hasta que el
   *   usuario decida renovar.
   *
   * Queda un desfase residual: el access token en curso sigue siendo válido hasta que
   * expire (`JWT_EXPIRES_IN`, 15 min por defecto). Es la misma propiedad que ADR-004 ya
   * documentaba para cualquier cambio de rol.
   */
  async updatePlatformRole(actorId: string, targetUserId: string, role: Role): Promise<User> {
    if (actorId === targetUserId) {
      throw AppError.forbidden(
        'No puedes cambiar tu propio rol de plataforma.',
        'CANNOT_CHANGE_OWN_ROLE',
        { hint: 'Pídeselo a otro administrador.' },
      );
    }

    const target = await this.prisma.user.findUnique({ where: { id: targetUserId } });
    if (!target) {
      throw AppError.notFound('Usuario', 'USER_NOT_FOUND', { hint: 'Verifica el ID.' });
    }

    // `select` explícito, NO la fila entera: devolverla filtra `passwordHash`,
    // `googleId` y el estado de bloqueo de cuenta en la respuesta HTTP.
    const updated = await this.prisma.user.update({
      where: { id: targetUserId },
      data: { role },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        initials: true,
        skills: true,
        cohortId: true,
      },
    });

    await this.prisma.refreshToken.updateMany({
      where: { userId: targetUserId, revokedAt: null },
      data: { revokedAt: new Date() },
    });

    return updated as unknown as User;
  }

  async getTeam(projectId: string) {
    const members = await this.prisma.teamMember.findMany({
      where: { projectId },
      include: { user: { select: { id: true, name: true, email: true, initials: true } } },
    });

    return members;
  }

  async inviteMember(projectId: string, data: InviteMemberInput) {
    const existing = await this.prisma.teamMember.findFirst({
      where: { projectId, user: { email: data.email } },
    });

    if (existing) {
      throw AppError.conflict('Este usuario ya es miembro del equipo.', 'TEAM_MEMBER_ALREADY_EXISTS', { hint: 'Quizás quieras cambiar su rol en lugar de agregarlo.' });
    }

    // Find or create user
    let user = await this.prisma.user.findUnique({ where: { email: data.email } });
    if (!user) {
      const initials = (data.name || data.email)
        .split(' ')
        .map((w: string) => w[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);

      user = await this.prisma.user.create({
        data: {
          email: data.email,
          passwordHash: '',
          name: data.name || data.email.split('@')[0],
          initials,
          role: 'participante',
          skills: [],
        },
      });
    }

    const member = await this.prisma.teamMember.create({
      data: {
        projectId,
        userId: user.id,
        role: data.role as TeamRole,
        status: TeamMemberStatus.PENDING,
      },
    });

    return member;
  }

  async updateMemberRole(projectId: string, memberId: string, newRole: string) {
    const member = await this.prisma.teamMember.findFirst({
      where: { id: memberId, projectId },
    });

    if (!member) {
      throw AppError.notFound('Miembro del equipo', 'TEAM_MEMBER_NOT_FOUND', { hint: 'Verifica que el usuario sea parte del equipo.' });
    }

    const updated = await this.prisma.teamMember.update({
      where: { id: memberId },
      data: { role: newRole as TeamRole },
    });

    return updated;
  }

  async removeMember(projectId: string, memberId: string) {
    const member = await this.prisma.teamMember.findFirst({
      where: { id: memberId, projectId },
    });

    if (!member) {
      throw AppError.notFound('Miembro del equipo', 'TEAM_MEMBER_NOT_FOUND', { hint: 'Verifica que el usuario sea parte del equipo.' });
    }

    if (member.role === TeamRole.OWNER) {
      throw AppError.badRequest('No se puede eliminar al owner del proyecto.', 'CANNOT_REMOVE_OWNER', { hint: 'Transfiere primero el ownership a otro miembro.' });
    }

    await this.prisma.teamMember.delete({ where: { id: memberId } });
  }
}
