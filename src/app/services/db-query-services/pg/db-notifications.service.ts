import { catchError, forkJoin, from, map, Observable, of } from 'rxjs';
import { Notification } from '@/types/Database';
import { PgApiUtilService } from '@/app/utils/pg-api.util';
import { Inject, Injectable } from '@angular/core';


@Injectable({
  providedIn: 'root',
})
export class NotificationQueries {
  constructor(
    private pgApiUtil: PgApiUtilService,
    // private handleError: ErrorHandlerService,
    @Inject('HANDLE_ERROR') private handleError: (error: any) => void,
    @Inject('GET_CURRENT_USER') private getCurrentUser: () => Promise<{ id: string } | null>
  ) {}

  async saveNotifications(domainId: string, notifications: { type: string; isEnabled: boolean }[]): Promise<void> {
    if (notifications.length === 0) return;

    const dbNotifications = notifications.map((n) => ({
      domain_id: domainId,
      notification_type: n.type,
      is_enabled: n.isEnabled,
    }));

    const query = `
      INSERT INTO notification_preferences (domain_id, notification_type, is_enabled)
      VALUES ${dbNotifications.map((_, i) => `($${i * 3 + 1}, $${i * 3 + 2}, $${i * 3 + 3})`).join(', ')}
    `;
    const params = dbNotifications.flatMap((n) => [n.domain_id, n.notification_type, n.is_enabled]);

    await this.pgApiUtil.postToPgExecutor(query, params).toPromise();
  }

  async getNotificationChannels() {
    const userId = await this.getCurrentUser().then((user) => user?.id);
    if (!userId) return null;

    const query = `SELECT notification_channels FROM user_info WHERE id = $1`;
    const params = [userId];

    const { data } = await this.pgApiUtil.postToPgExecutor(query, params).toPromise();
    return data?.[0]?.notification_channels || null;
  }

  async updateNotificationChannels(preferences: any) {
    const userId = await this.getCurrentUser().then((user) => user?.id);
    if (!userId) return false;

    const query = `
      INSERT INTO user_info (user_id, notification_channels)
      VALUES ($1, $2)
      ON CONFLICT (user_id) DO UPDATE SET notification_channels = $2
    `;
    const params = [userId, preferences];

    await this.pgApiUtil.postToPgExecutor(query, params).toPromise();
    return true;
  }

  getNotificationPreferences(): Observable<{ domain_id: string; notification_type: string; is_enabled: boolean }[]> {
    const query = `SELECT domain_id, notification_type, is_enabled FROM notification_preferences`;

    return from(this.pgApiUtil.postToPgExecutor(query)).pipe(
      map(({ data }) => data),
      catchError((error) => this.handleError(error)),
    );
  }

  updateBulkNotificationPreferences(preferences: { domain_id: string; notification_type: string; is_enabled: boolean }[]): Observable<void> {
    const updates = preferences.map((pref) => {
      const query = `
        INSERT INTO notification_preferences (domain_id, notification_type, is_enabled)
        VALUES ($1, $2, $3)
        ON CONFLICT (domain_id, notification_type) DO UPDATE SET is_enabled = $3, updated_at = NOW()
      `;
      const params = [pref.domain_id, pref.notification_type, pref.is_enabled];
      return this.pgApiUtil.postToPgExecutor(query, params);
    });

    return forkJoin(updates).pipe(
      map(() => undefined),
      catchError((error) => this.handleError(error)),
    );
  }

  getUserNotifications(limit = 25, offset = 0): Observable<{ notifications: (Notification & { domain_name: string })[]; total: number }> {
    const query = `
      SELECT n.id, n.change_type, n.message, n.sent, n.read, n.created_at, n.domain_id, d.domain_name
      FROM notifications n
      JOIN domains d ON n.domain_id = d.id
      ORDER BY n.created_at DESC
      LIMIT $1 OFFSET $2
    `;
    const params = [limit, offset];

    return from(this.pgApiUtil.postToPgExecutor(query, params)).pipe(
      map(({ data }) => ({
        notifications: (data as any).map((n) => ({
          id: n.id,
          domainId: n.domain_id,
          change_type: n.change_type,
          message: n.message,
          sent: n.sent,
          read: n.read,
          created_at: n.created_at,
          domain_name: n.domain_name,
        })),
        total: data.length,
      })),
      catchError((error) => this.handleError(error)),
    );
  }

  markNotificationReadStatus(notificationId: string, readStatus: boolean): Observable<void> {
    const query = `UPDATE notifications SET read = $1 WHERE id = $2`;
    const params = [readStatus, notificationId];

    return from(this.pgApiUtil.postToPgExecutor(query, params)).pipe(
      map(() => undefined),
      catchError((error) => this.handleError(error)),
    );
  }

  getUnreadNotificationCount(): Observable<number> {
    const query = `SELECT COUNT(*) AS count FROM notifications WHERE read = false`;

    return from(this.pgApiUtil.postToPgExecutor(query)).pipe(
      map(({ data }) => parseInt(data?.[0]?.count || '0', 10)),
      catchError((error) => this.handleError(error)),
    );
  }
}
