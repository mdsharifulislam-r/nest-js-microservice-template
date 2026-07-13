import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { ResetToken, User } from '../user/user.entity';
import { EmailModule } from '../../../../libs/helper-modules/email/email.module';
import { JwtAuthModule } from 'libs/helper-modules/jwt-auth/jwt-auth.module';


@Module({
  imports: [
    TypeOrmModule.forFeature([User, ResetToken]),
    EmailModule,
    JwtAuthModule
  ],
  controllers: [AuthController],
  providers: [AuthService],
  exports: [],
})
export class AuthModule { }
