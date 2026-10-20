import type { Queryable } from '../db';
import type { ActivityEvent, User } from '../../shared/types';

type NewActivity = Pick<ActivityEvent, 'groupId' | 'type' | 'targetTitle' | 'description'> &
  Partial<Pick<ActivityEvent, 'targetId' | 'descriptionKm' | 'metadata'>>;

/** Append an entry to a group's activity log, attributed to `actor`. */
export async function logActivity(db: Queryable, actor: User, event: NewActivity) {
  await db.query(
    `INSERT INTO activity_events
       (group_id, type, actor_id, actor_name, target_id, target_title, description, description_km, metadata)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
    [
      event.groupId,
      event.type,
      actor.id,
      actor.name,
      event.targetId ?? null,
      event.targetTitle,
      event.description,
      event.descriptionKm ?? null,
      event.metadata ? JSON.stringify(event.metadata) : null,
    ]
  );
}
