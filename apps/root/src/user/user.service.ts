import { HttpStatus, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './user.entity';
import { Repository } from 'typeorm';
import { EmailService } from '../../../../libs/helper-modules/email/email.service';
import { CreateUserDto, UpdateProfileDto } from './user.dto';
import sendResponse from 'libs/helper/sendResponse';
import { ApiError } from 'libs/errors/api-error';
import generateOTP from 'libs/helper/generateOtp';
import { emailTemplate } from 'libs/shared/emailTemplate';
import { cleanObject } from 'libs/helper/cleanObject';
import TypeOrmQueryBuilder from 'libs/queryBuilder/queryBuilder';

@Injectable()
export class UserService {
  private readonly logger = new Logger(UserService.name);

  constructor(
    @InjectRepository(User) private readonly userRepo: Repository<User>,
    private readonly emailService: EmailService,
  ) { }

  async create(dto: CreateUserDto) {
    const exists = await this.userRepo.findOne({ where: { email: dto.email } });
    if (exists) {
      if (!exists.verified) {
        this.handleUnverifiedUser(dto.email);
        return sendResponse({
          statusCode: HttpStatus.OK,
          success: true,
          message: 'User with this email already exists. Please verify your email.',
        });
      }
      throw new ApiError(HttpStatus.CONFLICT, 'User with this email already exists');
    }

    const user = this.userRepo.create(dto);
    const savedUser = await this.userRepo.save(user);
    const otp = generateOTP();
    const template = emailTemplate.createAccount({
      name: savedUser.name,
      email: savedUser.email,
      otp,
    });

    // Fire and forget – don't block registration on email
    this.emailService.sendEmail(template).catch((err) =>
      this.logger.error(`Failed to send welcome email to ${savedUser.email}`, err),
    );

    await this.userRepo.update(
      { id: savedUser.id },
      {
        authentication: {
          isResetPassword: false,
          oneTimeCode: otp,
          expireAt: new Date(Date.now() + 3 * 60 * 1000),
        },
      },
    );

    const { password: _p, authentication: _a, ...result } = savedUser as any;
    return sendResponse({
      statusCode: HttpStatus.CREATED,
      data: result,
      success: true,
      message: 'Account created. Please verify your email with the OTP sent.',
    });
  }

  async getProfile(userId: string) {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) {
      throw new ApiError(HttpStatus.NOT_FOUND, 'User not found');
    }
    return sendResponse({
      statusCode: HttpStatus.OK,
      data: user,
      success: true,
      message: 'Profile fetched successfully',
    });
  }

  async updateProfile(userId: string, dto: UpdateProfileDto, imagePath?: string) {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) {
      throw new ApiError(HttpStatus.NOT_FOUND, 'User not found');
    }

    const updatePayload = cleanObject({
      ...dto,
      ...(imagePath && { image: imagePath }),
    });

    if (!Object.keys(updatePayload).length) {
      return sendResponse({
        statusCode: HttpStatus.OK,
        data: user,
        success: true,
        message: 'Nothing to update',
      });
    }

    await this.userRepo.update(userId, updatePayload);
    const updated = await this.userRepo.findOne({ where: { id: userId } });

    return sendResponse({
      statusCode: HttpStatus.OK,
      data: updated,
      success: true,
      message: 'Profile updated successfully',
    });
  }

  async getAllUsers(query: Record<string, any>) {
    const qb = new TypeOrmQueryBuilder(this.userRepo, query, 'user')
      .filter(['password', 'authentication'])
      .search(['name', 'email'])
      .sort()
      .paginate();

    const [data, pagination] = await Promise.all([
      qb.getMany(),
      qb.getPaginationInfo(),
    ]);

    return sendResponse({
      statusCode: HttpStatus.OK,
      data,
      pagination,
      success: true,
      message: 'Users fetched successfully',
    });
  }

  async handleUnverifiedUser(email: string) {
    const user = await this.userRepo.findOne({ where: { email } });
    if (!user) {
      throw new ApiError(HttpStatus.NOT_FOUND, 'User not found');
    }
    if (user.verified) {
      throw new ApiError(HttpStatus.BAD_REQUEST, 'User is already verified');
    }
    const otp = generateOTP();
    const template = emailTemplate.createAccount({
      name: user.name,
      email: user.email,
      otp,
    });
    await this.emailService.sendEmail(template);
    await this.userRepo.update(
      { id: user.id },
      {
        authentication: {
          isResetPassword: false,
          oneTimeCode: otp,
          expireAt: new Date(Date.now() + 3 * 60 * 1000),
        },
      },
    );
    return sendResponse({
      statusCode: HttpStatus.OK,
      data: null,
      success: true,
      message: 'OTP sent to your email',
    });
  }

}
