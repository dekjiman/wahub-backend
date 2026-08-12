import { db } from '../../config/database.js';
import { members, chatLogs, broadcasts, broadcastRecipients } from '../../../drizzle/schema.js';
import { sql, eq } from 'drizzle-orm';

export class AnalyticsService {
  static async getGrowth() {
    const rows = await db
      .select({
        date: sql<string>`to_char(${members.joinedAt}, 'YYYY-MM-DD')`,
        total_members: sql<number>`count(*)`,
      })
      .from(members)
      .groupBy(sql`to_char(${members.joinedAt}, 'YYYY-MM-DD')`)
      .orderBy(sql`to_char(${members.joinedAt}, 'YYYY-MM-DD')`);

    if (rows.length === 0) {
      const today = new Date().toISOString().split('T')[0];
      return [{ date: today, total_members: 0, new_members: 0 }];
    }

    let runningTotal = 0;
    return rows.map((r) => {
      const count = Number(r.total_members);
      runningTotal += count;
      return {
        date: r.date || new Date().toISOString().split('T')[0],
        total_members: runningTotal,
        new_members: count,
      };
    });
  }

  static async getSentiment() {
    const rows = await db
      .select({
        sentiment: chatLogs.sentiment,
        count: sql<number>`count(*)`,
      })
      .from(chatLogs)
      .groupBy(chatLogs.sentiment);

    const map: Record<string, number> = { positive: 0, neutral: 0, negative: 0 };
    rows.forEach((r) => {
      if (r.sentiment) map[r.sentiment] = Number(r.count);
    });

    const total = Object.values(map).reduce((a, b) => a + b, 0) || 1;

    return [
      { sentiment: 'positive', count: map.positive, percentage: Math.round((map.positive / total) * 100) },
      { sentiment: 'neutral', count: map.neutral, percentage: Math.round((map.neutral / total) * 100) },
      { sentiment: 'negative', count: map.negative, percentage: Math.round((map.negative / total) * 100) },
    ];
  }

  static async getTopics() {
    const rows = await db
      .select({
        topic: chatLogs.topic,
        count: sql<number>`count(*)`,
      })
      .from(chatLogs)
      .groupBy(chatLogs.topic)
      .orderBy(sql`count(*) desc`)
      .limit(10);

    if (rows.length === 0) {
      return [{ topic: 'General', count: 0 }];
    }

    return rows.map((r) => ({
      topic: r.topic || 'General',
      count: Number(r.count),
    }));
  }

  static async getSpam() {
    const rows = await db
      .select({
        date: sql<string>`to_char(${chatLogs.sentAt}, 'YYYY-MM-DD')`,
        spam_count: sql<number>`count(*) filter (where ${chatLogs.isSpam} = true)`,
        total_count: sql<number>`count(*)`,
      })
      .from(chatLogs)
      .groupBy(sql`to_char(${chatLogs.sentAt}, 'YYYY-MM-DD')`)
      .orderBy(sql`to_char(${chatLogs.sentAt}, 'YYYY-MM-DD')`);

    if (rows.length === 0) {
      const today = new Date().toISOString().split('T')[0];
      return [{ date: today, spam_count: 0, total_messages: 0 }];
    }

    return rows.map((r) => ({
      date: r.date || new Date().toISOString().split('T')[0],
      spam_count: Number(r.spam_count),
      total_messages: Number(r.total_count),
    }));
  }

  static async getDelivery() {
    const rows = await db
      .select({
        status: broadcastRecipients.status,
        count: sql<number>`count(*)`,
      })
      .from(broadcastRecipients)
      .groupBy(broadcastRecipients.status);

    const map: Record<string, number> = { pending: 0, sent: 0, delivered: 0, failed: 0 };
    rows.forEach((r) => {
      if (r.status) map[r.status] = Number(r.count);
    });

    const total = Object.values(map).reduce((a, b) => a + b, 0) || 1;

    return [
      { status: 'sent', count: map.sent, percentage: Math.round((map.sent / total) * 100) },
      { status: 'delivered', count: map.delivered, percentage: Math.round((map.delivered / total) * 100) },
      { status: 'pending', count: map.pending, percentage: Math.round((map.pending / total) * 100) },
      { status: 'failed', count: map.failed, percentage: Math.round((map.failed / total) * 100) },
    ];
  }

  static async getMessageActivity(period = '30d') {
    const days = period === '7d' ? 7 : period === '90d' ? 90 : 30;

    const rows = await db
      .select({
        date: sql<string>`to_char(${chatLogs.sentAt}, 'YYYY-MM-DD')`,
        inbound: sql<number>`count(*) filter (where ${chatLogs.direction} = 'inbound')`,
        outbound: sql<number>`count(*) filter (where ${chatLogs.direction} = 'outbound')`,
        total: sql<number>`count(*)`,
      })
      .from(chatLogs)
      .where(sql`${chatLogs.sentAt} >= NOW() - (${days} || ' days')::INTERVAL`)
      .groupBy(sql`to_char(${chatLogs.sentAt}, 'YYYY-MM-DD')`)
      .orderBy(sql`to_char(${chatLogs.sentAt}, 'YYYY-MM-DD')`);

    if (rows.length === 0) {
      const today = new Date().toISOString().split('T')[0];
      return [{ date: today, inbound: 0, outbound: 0, total: 0 }];
    }

    return rows.map((r) => ({
      date: r.date || new Date().toISOString().split('T')[0],
      inbound: Number(r.inbound),
      outbound: Number(r.outbound),
      total: Number(r.total),
    }));
  }

  static async getHeatmaps() {
    const rows = await db
      .select({
        day_of_week: sql<number>`extract(dow from ${chatLogs.sentAt})`,
        hour: sql<number>`extract(hour from ${chatLogs.sentAt})`,
        message_count: sql<number>`count(*)`,
      })
      .from(chatLogs)
      .groupBy(
        sql`extract(dow from ${chatLogs.sentAt})`,
        sql`extract(hour from ${chatLogs.sentAt})`
      );

    return rows.map((r) => ({
      day_of_week: Number(r.day_of_week),
      hour: Number(r.hour),
      message_count: Number(r.message_count),
    }));
  }

  static async getModerationSummary() {
    const { moderationAlerts } = await import('../../../drizzle/schema.js');
    const rows = await db
      .select({
        status: moderationAlerts.status,
        alertType: moderationAlerts.alertType,
        count: sql<number>`count(*)`,
      })
      .from(moderationAlerts)
      .groupBy(moderationAlerts.status, moderationAlerts.alertType);

    const statusMap: Record<string, number> = { pending: 0, approved: 0, rejected: 0, executed: 0 };
    const typeMap: Record<string, number> = { spam: 0, flood: 0, toxic: 0, link: 0, other: 0 };

    rows.forEach((r) => {
      if (r.status && statusMap[r.status] !== undefined) {
        statusMap[r.status] += Number(r.count);
      }
      if (r.alertType && typeMap[r.alertType] !== undefined) {
        typeMap[r.alertType] += Number(r.count);
      }
    });

    const totalAlerts = Object.values(statusMap).reduce((a, b) => a + b, 0);

    return {
      total_alerts: totalAlerts,
      by_status: statusMap,
      by_type: typeMap,
    };
  }

  static async exportMembersCsv() {
    const rows = await db.select().from(members);
    const header = 'ID,WhatsApp Number,Display Name,Role,Status,Joined At,Last Active At\n';
    const body = rows
      .map(
        (m) =>
          `"${m.id}","${m.whatsappNumber || ''}","${(m.displayName || '').replace(/"/g, '""')}","${(m as any).role || 'member'}","${m.status || 'active'}","${m.joinedAt ? m.joinedAt.toISOString() : ''}","${m.lastActiveAt ? m.lastActiveAt.toISOString() : ''}"`
      )
      .join('\n');

    return header + body;
  }

  static async exportMessagesCsv() {
    const rows = await db.select().from(chatLogs).limit(5000);
    const header = 'ID,Group ID,Member ID,Direction,Content,Type,Sentiment,Is Spam,Sent At\n';
    const body = rows
      .map(
        (m) =>
          `"${m.id}","${m.groupId || ''}","${m.memberId || ''}","${m.direction}","${(m.content || '').replace(/"/g, '""')}","${m.messageType || 'text'}","${m.sentiment || 'neutral'}","${m.isSpam ? 'true' : 'false'}","${m.sentAt ? m.sentAt.toISOString() : ''}"`
      )
      .join('\n');

    return header + body;
  }

  static async exportModerationCsv() {
    const { moderationAlerts } = await import('../../../drizzle/schema.js');
    const rows = await db.select().from(moderationAlerts);
    const header = 'ID,Group ID,Member ID,Alert Type,Severity,Description,Status,Reviewed By,Created At\n';
    const body = rows
      .map(
        (a) =>
          `"${a.id}","${a.groupId || ''}","${a.memberId || ''}","${a.alertType || ''}","${a.severity || ''}","${(a.description || '').replace(/"/g, '""')}","${a.status || 'pending'}","${a.reviewedBy || ''}","${a.createdAt ? a.createdAt.toISOString() : ''}"`
      )
      .join('\n');

    return header + body;
  }
}

