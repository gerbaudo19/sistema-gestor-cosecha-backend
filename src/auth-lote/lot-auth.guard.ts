import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import * as jwt from 'jsonwebtoken';

@Injectable()
export class LotAuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest();

    // Usar header Authorization: Bearer <token>
    const authHeader = req.headers['authorization'];
    if (!authHeader) {
      throw new UnauthorizedException('Token de lote requerido');
    }

    const [bearer, token] = authHeader.split(' ');
    if (bearer !== 'Bearer' || !token) {
      throw new UnauthorizedException('Formato de token inválido');
    }

    try {
      const payload = jwt.verify(token, process.env.LOT_SECRET!) as {
        lotId: string;
        type: string;
      };

      if (payload.type !== 'LOT') {
        throw new UnauthorizedException('Token inválido');
      }

      req.lot = payload;
      return true;
    } catch {
      throw new UnauthorizedException('Token de lote inválido o expirado');
    }
  }
}
