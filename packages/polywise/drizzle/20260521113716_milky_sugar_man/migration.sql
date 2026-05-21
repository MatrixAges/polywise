CREATE TABLE `rewire_event` (
	`id` text PRIMARY KEY,
	`agent_id` text,
	`session_id` text,
	`stimulus_key` text NOT NULL,
	`signal` text NOT NULL,
	`role` text NOT NULL,
	`node_id` text NOT NULL,
	`strength` real DEFAULT 1 NOT NULL,
	`created_at` integer NOT NULL,
	CONSTRAINT `fk_rewire_event_agent_id_agent_id_fk` FOREIGN KEY (`agent_id`) REFERENCES `agent`(`id`) ON DELETE CASCADE,
	CONSTRAINT `fk_rewire_event_session_id_session_id_fk` FOREIGN KEY (`session_id`) REFERENCES `session`(`id`) ON DELETE SET NULL,
	CONSTRAINT `fk_rewire_event_node_id_node_id_fk` FOREIGN KEY (`node_id`) REFERENCES `node`(`id`) ON DELETE CASCADE
);
--> statement-breakpoint
ALTER TABLE `edge` ADD `state` text DEFAULT 'active' NOT NULL;
--> statement-breakpoint
ALTER TABLE `edge` ADD `stability` real DEFAULT 0 NOT NULL;
--> statement-breakpoint
ALTER TABLE `edge` ADD `rewire_score` real DEFAULT 0 NOT NULL;
--> statement-breakpoint
ALTER TABLE `edge` ADD `last_rewire_at` integer;
--> statement-breakpoint
CREATE INDEX `edge_state_idx` ON `edge` (`state`);
--> statement-breakpoint
CREATE INDEX `rewire_event_stimulus_idx` ON `rewire_event` (`stimulus_key`);
--> statement-breakpoint
CREATE INDEX `rewire_event_session_idx` ON `rewire_event` (`session_id`);
--> statement-breakpoint
CREATE INDEX `rewire_event_node_idx` ON `rewire_event` (`node_id`);
--> statement-breakpoint
CREATE INDEX `rewire_event_created_at_idx` ON `rewire_event` (`created_at`);
