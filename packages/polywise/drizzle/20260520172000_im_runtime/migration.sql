CREATE TABLE `im_account` (
	`id` text PRIMARY KEY NOT NULL,
	`platform` text NOT NULL,
	`account_id` text NOT NULL,
	`label` text,
	`enabled` integer DEFAULT true NOT NULL,
	`config_json` text,
	`status` text DEFAULT 'idle' NOT NULL,
	`last_error` text,
	`created_at` integer,
	`updated_at` integer
);
--> statement-breakpoint
CREATE UNIQUE INDEX `im_account_platform_account_idx` ON `im_account` (`platform`,`account_id`);
--> statement-breakpoint
CREATE INDEX `im_account_enabled_idx` ON `im_account` (`enabled`);
--> statement-breakpoint
CREATE INDEX `im_account_status_idx` ON `im_account` (`status`);
--> statement-breakpoint
CREATE TABLE `im_peer_state` (
	`id` text PRIMARY KEY NOT NULL,
	`platform` text NOT NULL,
	`account_id` text NOT NULL,
	`peer_key` text NOT NULL,
	`state_json` text,
	`created_at` integer,
	`updated_at` integer
);
--> statement-breakpoint
CREATE UNIQUE INDEX `im_peer_state_platform_account_peer_idx` ON `im_peer_state` (`platform`,`account_id`,`peer_key`);
--> statement-breakpoint
CREATE INDEX `im_peer_state_platform_idx` ON `im_peer_state` (`platform`);
--> statement-breakpoint
CREATE INDEX `im_peer_state_account_idx` ON `im_peer_state` (`account_id`);
