import { Request, Response } from 'express';

import { RedisService } from '../redis/redis.service';
import { NotificationEntity } from './notifications.interfaces';
import { Injectable } from '../../core/decorators/injectable.decorator';

@Injectable()
export class NotificationStreamService {
  private clients: Map<number, Set<Response>> = new Map();

  constructor (private readonly redisService: RedisService) {
    this.init();
  }

  init (): void {
    const subscriber = this.redisService.getClient().duplicate();
    void subscriber.subscribe('notifications').catch(() => {});
    subscriber.on('message', (_channel, message) => {
      const notification = JSON.parse(message) as NotificationEntity;
      this.broadcast(notification.recipientId, notification);
    });
  }

  addClient (recipientId: number, response: Response): void {
    if (!this.clients.has(recipientId)) this.clients.set(recipientId, new Set());
    this.clients.get(recipientId)!.add(response);
  }

  handleStream (recipientId: number, req: Request, res: Response): void {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    this.addClient(recipientId, res);
    req.on('close', () => this.removeClient(recipientId, res));
  }

  removeClient (recipientId: number, response: Response): void {
    const clientSet = this.clients.get(recipientId);
    if (clientSet) {
      clientSet.delete(response);
      if (clientSet.size === 0) this.clients.delete(recipientId);
    }
  }

  broadcast (recipientId: number, notification: NotificationEntity): void {
    const clientSet = this.clients.get(recipientId);
    if (!clientSet) return;

    const data = JSON.stringify(notification);
    clientSet.forEach((response) => {
      try {
        response.write(`data: ${data}\n\n`);
      } catch {
        this.removeClient(recipientId, response);
      }
    });
  }

  broadcastToMultiple (recipientIds: number[], notification: NotificationEntity): void {
    recipientIds.forEach((recipientId) => this.broadcast(recipientId, notification));
  }
}
