CREATE INDEX `rewire_event_agent_idx` ON `rewire_event` (`agent_id`);
--> statement-breakpoint
CREATE INDEX `rewire_event_agent_created_idx` ON `rewire_event` (`agent_id`,`created_at`);
