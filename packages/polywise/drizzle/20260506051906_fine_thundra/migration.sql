ALTER TABLE `agent` ADD `order` real NOT NULL DEFAULT 0;--> statement-breakpoint
UPDATE `agent` SET `order` = `created_at` WHERE `order` = 0;--> statement-breakpoint
CREATE INDEX `agent_order_idx` ON `agent` (`order`);
