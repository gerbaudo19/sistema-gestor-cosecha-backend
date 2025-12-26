import { LotAuthGuard } from './lot-auth.guard';
import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import * as jwt from 'jsonwebtoken';

jest.mock('jsonwebtoken');

describe('LotAuthGuard', () => {
  let guard: LotAuthGuard;

  const mockExecutionContext = (headers: any) =>
    ({
      switchToHttp: () => ({
        getRequest: () => ({
          headers,
        }),
      }),
    } as ExecutionContext);

  beforeEach(() => {
    process.env.LOT_SECRET = 'test-secret';
    guard = new LotAuthGuard();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should allow access with valid lot token', () => {
    (jwt.verify as jest.Mock).mockReturnValue({
      lotId: 'lotId123',
      type: 'LOT',
    });

    const context = mockExecutionContext({
      authorization: 'Bearer valid-token',
    });

    const result = guard.canActivate(context);

    expect(result).toBe(true);
  });

  it('should throw error if authorization header is missing', () => {
    const context = mockExecutionContext({});

    expect(() => guard.canActivate(context)).toThrow(
      UnauthorizedException,
    );
  });

  it('should throw error if token format is invalid', () => {
    const context = mockExecutionContext({
      authorization: 'InvalidToken',
    });

    expect(() => guard.canActivate(context)).toThrow(
      UnauthorizedException,
    );
  });

  it('should throw error if token type is not LOT', () => {
    (jwt.verify as jest.Mock).mockReturnValue({
      lotId: 'lotId',
      type: 'USER',
    });

    const context = mockExecutionContext({
      authorization: 'Bearer token',
    });

    expect(() => guard.canActivate(context)).toThrow(
      UnauthorizedException,
    );
  });

  it('should throw error if jwt.verify fails', () => {
    (jwt.verify as jest.Mock).mockImplementation(() => {
      throw new Error('invalid');
    });

    const context = mockExecutionContext({
      authorization: 'Bearer invalid-token',
    });

    expect(() => guard.canActivate(context)).toThrow(
      UnauthorizedException,
    );
  });
});
