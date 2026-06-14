import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './strategies/jwt.strategy';
import { LocalStrategy } from './strategies/local.strategy';
import { MfaService } from '../mfa/mfa.service';
import type { AppConfig } from '../../../config/configuration';

@Module({
  imports: [
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService<AppConfig>) => {
        const jwtConfig = configService.get<AppConfig['jwt']>('jwt');
        const privateKey = jwtConfig?.privateKey;
        const expiresIn = jwtConfig?.expiresIn ?? '15m';

        if (privateKey) {
          return { privateKey, signOptions: { algorithm: 'RS256', expiresIn } };
        }
        return { secret: 'dev-secret', signOptions: { expiresIn } };
      },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, MfaService, JwtStrategy, LocalStrategy],
  exports: [AuthService],
})
export class AuthModule {}
