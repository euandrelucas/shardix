import { ExecutionContext, Guard, Injectable } from '@shardix/common';

@Injectable()
export class AdminGuard implements Guard {
  canActivate(context: ExecutionContext): boolean {
    const payload = context.getPayload();
    // Simulate checking admin permissions
    return Boolean(payload);
  }
}
