ALTER TABLE `session` ADD `cron` integer;--> statement-breakpoint
CREATE INDEX `session_is_cron_idx` ON `session` (`cron`);