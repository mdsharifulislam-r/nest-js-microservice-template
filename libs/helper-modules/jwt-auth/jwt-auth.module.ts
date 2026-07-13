import { Global, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { AuthGuard } from 'libs/guards/auth.guard';

@Global()
@Module({
    imports: [
        JwtModule.registerAsync({
            inject: [ConfigService],
            useFactory: (config: ConfigService) => ({
                secret: config.get<string>('JWT_SECRET')!,
                signOptions: {
                    expiresIn: config.get<string>('JWT_EXPIRE_IN', '7d') as any,
                },
            }),
        }),
    ],
    providers: [AuthGuard],
    exports: [JwtModule, AuthGuard],
})
export class JwtAuthModule { }
