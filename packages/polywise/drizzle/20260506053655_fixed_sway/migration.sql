CREATE TABLE `agent_session` (
	`id` text PRIMARY KEY,
	`agent_id` text NOT NULL,
	`session_id` text NOT NULL,
	`created_at` integer,
	CONSTRAINT `fk_agent_session_agent_id_agent_id_fk` FOREIGN KEY (`agent_id`) REFERENCES `agent`(`id`) ON DELETE CASCADE,
	CONSTRAINT `fk_agent_session_session_id_session_id_fk` FOREIGN KEY (`session_id`) REFERENCES `session`(`id`) ON DELETE CASCADE
);
--> statement-breakpoint
CREATE INDEX `agent_session_agent_id_idx` ON `agent_session` (`agent_id`);--> statement-breakpoint
CREATE INDEX `agent_session_session_id_idx` ON `agent_session` (`session_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `agent_session_agent_session_idx` ON `agent_session` (`agent_id`,`session_id`);