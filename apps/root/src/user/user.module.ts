import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { User } from './user.entity';
import { AuthModule } from '../auth/auth.module';
import { KafkaModule } from '../utils/helper-modules/kafka/kafka.module';

@Module({
  imports: [TypeOrmModule.forFeature([User]), AuthModule, KafkaModule],
  controllers: [UserController],
  providers: [UserService],
  exports: [UserService, TypeOrmModule],
})
export class UserModule { }
