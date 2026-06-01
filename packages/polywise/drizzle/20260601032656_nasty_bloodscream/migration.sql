CREATE TABLE `agent` (
	`id` text PRIMARY KEY,
	`name` text NOT NULL,
	`role` text NOT NULL,
	`description` text,
	`photo` blob,
	`avatar` text,
	`tools` text DEFAULT '[]' NOT NULL,
	`prompt` text,
	`soul` text,
	`identity` text,
	`memory` text DEFAULT '',
	`is_frozen` integer DEFAULT false NOT NULL,
	`order` real NOT NULL,
	`model` text NOT NULL,
	`created_at` integer,
	`updated_at` integer
);
--> statement-breakpoint
CREATE TABLE `article` (
	`id` text PRIMARY KEY,
	`document_id` text,
	`content` text NOT NULL,
	`title` text,
	`path` text,
	`for` text NOT NULL,
	`scope_type` text DEFAULT 'global',
	`scope_id` text,
	`source` text DEFAULT 'agent',
	`hash` text,
	`metadata` text DEFAULT '{}',
	`hit_count` integer,
	`hit_at` integer,
	`is_long` integer GENERATED ALWAYS AS (length(content) > 12000) VIRTUAL,
	`is_pipelined` integer DEFAULT false NOT NULL,
	`created_at` integer,
	`updated_at` integer,
	CONSTRAINT `fk_article_document_id_document_id_fk` FOREIGN KEY (`document_id`) REFERENCES `document`(`id`) ON DELETE CASCADE
);
--> statement-breakpoint
CREATE TABLE `chunk` (
	`id` text PRIMARY KEY,
	`article_id` text,
	`content` text,
	`keywords` text NOT NULL,
	`is_body` integer DEFAULT false NOT NULL,
	`position` integer,
	`created_at` integer,
	CONSTRAINT `fk_chunk_article_id_article_id_fk` FOREIGN KEY (`article_id`) REFERENCES `article`(`id`) ON DELETE CASCADE
);
--> statement-breakpoint
CREATE TABLE `document` (
	`id` text PRIMARY KEY,
	`title` text NOT NULL,
	`description` text,
	`path` text,
	`hit_count` integer,
	`hit_at` integer,
	`is_pipelined` integer DEFAULT false NOT NULL,
	`created_at` integer,
	`updated_at` integer
);
--> statement-breakpoint
CREATE TABLE `edge` (
	`id` text PRIMARY KEY,
	`relation` text NOT NULL,
	`agent_id` text,
	`source_id` text NOT NULL,
	`target_id` text NOT NULL,
	`weight` real DEFAULT 1 NOT NULL,
	`growth` real DEFAULT 1 NOT NULL,
	`confidence` real DEFAULT 0.5 NOT NULL,
	`distance` real DEFAULT 1 NOT NULL,
	`bandwidth` real DEFAULT 1 NOT NULL,
	`active_times` integer DEFAULT 1 NOT NULL,
	`active_at` integer NOT NULL,
	`is_frozen` integer DEFAULT false NOT NULL,
	`state` text DEFAULT 'active' NOT NULL,
	`stability` real DEFAULT 0 NOT NULL,
	`rewire_score` real DEFAULT 0 NOT NULL,
	`last_rewire_at` integer,
	`created_at` integer NOT NULL,
	CONSTRAINT `fk_edge_agent_id_agent_id_fk` FOREIGN KEY (`agent_id`) REFERENCES `agent`(`id`) ON DELETE CASCADE,
	CONSTRAINT `fk_edge_source_id_node_id_fk` FOREIGN KEY (`source_id`) REFERENCES `node`(`id`) ON DELETE CASCADE,
	CONSTRAINT `fk_edge_target_id_node_id_fk` FOREIGN KEY (`target_id`) REFERENCES `node`(`id`) ON DELETE CASCADE
);
--> statement-breakpoint
CREATE TABLE `file` (
	`id` text PRIMARY KEY,
	`path` text NOT NULL,
	`created_at` integer,
	`updated_at` integer
);
--> statement-breakpoint
CREATE TABLE `group` (
	`id` text PRIMARY KEY,
	`name` text NOT NULL,
	`description` text,
	`photo` blob,
	`folders` text,
	`created_at` integer,
	`updated_at` integer
);
--> statement-breakpoint
CREATE TABLE `group_todo` (
	`id` text PRIMARY KEY,
	`group_id` text NOT NULL,
	`title` text NOT NULL,
	`description` text,
	`priority` text DEFAULT 'none',
	`status` text DEFAULT 'backlog' NOT NULL,
	`result` text,
	`error` text,
	`order` real NOT NULL,
	`assignee_agent_id` text,
	`started_by_agent_id` text,
	`completed_by_agent_id` text,
	`started_at` integer,
	`finished_at` integer,
	`created_at` integer,
	`updated_at` integer,
	CONSTRAINT `fk_group_todo_group_id_group_id_fk` FOREIGN KEY (`group_id`) REFERENCES `group`(`id`) ON DELETE CASCADE,
	CONSTRAINT `fk_group_todo_assignee_agent_id_agent_id_fk` FOREIGN KEY (`assignee_agent_id`) REFERENCES `agent`(`id`) ON DELETE SET NULL,
	CONSTRAINT `fk_group_todo_started_by_agent_id_agent_id_fk` FOREIGN KEY (`started_by_agent_id`) REFERENCES `agent`(`id`) ON DELETE SET NULL,
	CONSTRAINT `fk_group_todo_completed_by_agent_id_agent_id_fk` FOREIGN KEY (`completed_by_agent_id`) REFERENCES `agent`(`id`) ON DELETE SET NULL
);
--> statement-breakpoint
CREATE TABLE `im_account` (
	`id` text PRIMARY KEY,
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
CREATE TABLE `im_peer_state` (
	`id` text PRIMARY KEY,
	`platform` text NOT NULL,
	`account_id` text NOT NULL,
	`peer_key` text NOT NULL,
	`state_json` text,
	`created_at` integer,
	`updated_at` integer
);
--> statement-breakpoint
CREATE TABLE `link` (
	`id` text PRIMARY KEY,
	`hash` text,
	`url` text NOT NULL,
	`title` text NOT NULL,
	`favicon` blob,
	`status` text DEFAULT 'none' NOT NULL,
	`generate_at` integer,
	`created_at` integer,
	`updated_at` integer
);
--> statement-breakpoint
CREATE TABLE `message` (
	`id` text PRIMARY KEY,
	`session_id` text NOT NULL,
	`role` text NOT NULL,
	`content` text NOT NULL,
	`created_at` integer,
	`updated_at` integer,
	CONSTRAINT `fk_message_session_id_session_id_fk` FOREIGN KEY (`session_id`) REFERENCES `session`(`id`) ON DELETE CASCADE
);
--> statement-breakpoint
CREATE TABLE `node` (
	`id` text PRIMARY KEY,
	`agent_id` text,
	`name` text NOT NULL,
	`active_level` real DEFAULT 0 NOT NULL,
	`active_sens` real DEFAULT 0 NOT NULL,
	`active_times` integer DEFAULT 1 NOT NULL,
	`active_at` integer NOT NULL,
	`is_frozen` integer DEFAULT false NOT NULL,
	`created_at` integer NOT NULL,
	CONSTRAINT `fk_node_agent_id_agent_id_fk` FOREIGN KEY (`agent_id`) REFERENCES `agent`(`id`) ON DELETE CASCADE,
	CONSTRAINT `node_agent_name_unique` UNIQUE(`agent_id`,`name`)
);
--> statement-breakpoint
CREATE TABLE `notification` (
	`id` text PRIMARY KEY,
	`title` text NOT NULL,
	`description` text,
	`is_read` integer DEFAULT false NOT NULL,
	`is_pushed` integer DEFAULT false NOT NULL,
	`created_at` integer,
	`updated_at` integer
);
--> statement-breakpoint
CREATE TABLE `project` (
	`id` text PRIMARY KEY,
	`name` text NOT NULL,
	`desc` text,
	`dir` text NOT NULL,
	`order` integer NOT NULL,
	`model` text,
	`created_at` integer,
	`updated_at` integer
);
--> statement-breakpoint
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
CREATE TABLE `session` (
	`id` text PRIMARY KEY,
	`title` text NOT NULL,
	`report` text,
	`runing` integer DEFAULT false NOT NULL,
	`running_since` integer,
	`running_done` integer,
	`unread` integer,
	`key` text,
	`im` integer,
	`cron` integer,
	`created_at` integer,
	`updated_at` integer
);
--> statement-breakpoint
CREATE TABLE `skill` (
	`id` text PRIMARY KEY,
	`name` text NOT NULL,
	`desc` text NOT NULL,
	`path` text NOT NULL,
	`type` text,
	`order` real NOT NULL,
	`created_at` integer,
	`updated_at` integer
);
--> statement-breakpoint
CREATE TABLE `todo` (
	`id` text PRIMARY KEY,
	`title` text NOT NULL,
	`description` text,
	`priority` text DEFAULT 'none',
	`status` text DEFAULT 'backlog' NOT NULL,
	`result` text,
	`error` text,
	`order` real NOT NULL,
	`estimate` integer,
	`due_at` integer,
	`created_at` integer,
	`updated_at` integer
);
--> statement-breakpoint
CREATE TABLE `auth_account` (
	`id` text PRIMARY KEY,
	`account_id` text NOT NULL,
	`provider_id` text NOT NULL,
	`user_id` text NOT NULL,
	`access_token` text,
	`refresh_token` text,
	`id_token` text,
	`access_token_expires_at` integer,
	`refresh_token_expires_at` integer,
	`scope` text,
	`password` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	CONSTRAINT `fk_auth_account_user_id_auth_user_id_fk` FOREIGN KEY (`user_id`) REFERENCES `auth_user`(`id`) ON DELETE CASCADE
);
--> statement-breakpoint
CREATE TABLE `auth_session` (
	`id` text PRIMARY KEY,
	`expires_at` integer NOT NULL,
	`token` text NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`ip_address` text,
	`user_agent` text,
	`user_id` text NOT NULL,
	CONSTRAINT `fk_auth_session_user_id_auth_user_id_fk` FOREIGN KEY (`user_id`) REFERENCES `auth_user`(`id`) ON DELETE CASCADE
);
--> statement-breakpoint
CREATE TABLE `auth_user` (
	`id` text PRIMARY KEY,
	`name` text NOT NULL,
	`email` text NOT NULL,
	`email_verified` integer NOT NULL,
	`image` text,
	`username` text NOT NULL,
	`display_username` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `auth_verification` (
	`id` text PRIMARY KEY,
	`identifier` text NOT NULL,
	`value` text NOT NULL,
	`expires_at` integer NOT NULL,
	`created_at` integer,
	`updated_at` integer
);
--> statement-breakpoint
CREATE TABLE `agent_article` (
	`agent_id` text NOT NULL,
	`article_id` text NOT NULL,
	`created_at` integer,
	CONSTRAINT `agent_article_pk` PRIMARY KEY(`agent_id`, `article_id`),
	CONSTRAINT `fk_agent_article_agent_id_agent_id_fk` FOREIGN KEY (`agent_id`) REFERENCES `agent`(`id`) ON DELETE CASCADE,
	CONSTRAINT `fk_agent_article_article_id_article_id_fk` FOREIGN KEY (`article_id`) REFERENCES `article`(`id`) ON DELETE CASCADE
);
--> statement-breakpoint
CREATE TABLE `agent_document` (
	`agent_id` text NOT NULL,
	`document_id` text NOT NULL,
	`created_at` integer,
	CONSTRAINT `agent_document_pk` PRIMARY KEY(`agent_id`, `document_id`),
	CONSTRAINT `fk_agent_document_agent_id_agent_id_fk` FOREIGN KEY (`agent_id`) REFERENCES `agent`(`id`) ON DELETE CASCADE,
	CONSTRAINT `fk_agent_document_document_id_document_id_fk` FOREIGN KEY (`document_id`) REFERENCES `document`(`id`) ON DELETE CASCADE
);
--> statement-breakpoint
CREATE TABLE `agent_session` (
	`id` text PRIMARY KEY,
	`agent_id` text NOT NULL,
	`session_id` text NOT NULL,
	`created_at` integer,
	CONSTRAINT `fk_agent_session_agent_id_agent_id_fk` FOREIGN KEY (`agent_id`) REFERENCES `agent`(`id`) ON DELETE CASCADE,
	CONSTRAINT `fk_agent_session_session_id_session_id_fk` FOREIGN KEY (`session_id`) REFERENCES `session`(`id`) ON DELETE CASCADE
);
--> statement-breakpoint
CREATE TABLE `agent_skill` (
	`agent_id` text NOT NULL,
	`skill_id` text NOT NULL,
	`created_at` integer,
	CONSTRAINT `agent_skill_pk` PRIMARY KEY(`agent_id`, `skill_id`),
	CONSTRAINT `fk_agent_skill_agent_id_agent_id_fk` FOREIGN KEY (`agent_id`) REFERENCES `agent`(`id`) ON DELETE CASCADE,
	CONSTRAINT `fk_agent_skill_skill_id_skill_id_fk` FOREIGN KEY (`skill_id`) REFERENCES `skill`(`id`) ON DELETE CASCADE
);
--> statement-breakpoint
CREATE TABLE `agent_todo` (
	`agent_id` text NOT NULL,
	`todo_id` text NOT NULL,
	`created_at` integer,
	CONSTRAINT `agent_todo_pk` PRIMARY KEY(`agent_id`, `todo_id`),
	CONSTRAINT `fk_agent_todo_agent_id_agent_id_fk` FOREIGN KEY (`agent_id`) REFERENCES `agent`(`id`) ON DELETE CASCADE,
	CONSTRAINT `fk_agent_todo_todo_id_todo_id_fk` FOREIGN KEY (`todo_id`) REFERENCES `todo`(`id`) ON DELETE CASCADE
);
--> statement-breakpoint
CREATE TABLE `edge_article` (
	`edge_id` text NOT NULL,
	`article_id` text NOT NULL,
	`created_at` integer,
	CONSTRAINT `edge_article_pk` PRIMARY KEY(`edge_id`, `article_id`),
	CONSTRAINT `fk_edge_article_edge_id_edge_id_fk` FOREIGN KEY (`edge_id`) REFERENCES `edge`(`id`) ON DELETE CASCADE,
	CONSTRAINT `fk_edge_article_article_id_article_id_fk` FOREIGN KEY (`article_id`) REFERENCES `article`(`id`) ON DELETE CASCADE
);
--> statement-breakpoint
CREATE TABLE `group_agent` (
	`group_id` text NOT NULL,
	`agent_id` text NOT NULL,
	`order` real NOT NULL,
	`created_at` integer,
	CONSTRAINT `group_agent_pk` PRIMARY KEY(`group_id`, `agent_id`),
	CONSTRAINT `fk_group_agent_group_id_group_id_fk` FOREIGN KEY (`group_id`) REFERENCES `group`(`id`) ON DELETE CASCADE,
	CONSTRAINT `fk_group_agent_agent_id_agent_id_fk` FOREIGN KEY (`agent_id`) REFERENCES `agent`(`id`) ON DELETE CASCADE
);
--> statement-breakpoint
CREATE TABLE `group_session` (
	`group_id` text NOT NULL,
	`session_id` text NOT NULL,
	`created_at` integer,
	CONSTRAINT `group_session_pk` PRIMARY KEY(`group_id`, `session_id`),
	CONSTRAINT `fk_group_session_group_id_group_id_fk` FOREIGN KEY (`group_id`) REFERENCES `group`(`id`) ON DELETE CASCADE,
	CONSTRAINT `fk_group_session_session_id_session_id_fk` FOREIGN KEY (`session_id`) REFERENCES `session`(`id`) ON DELETE CASCADE
);
--> statement-breakpoint
CREATE TABLE `link_article` (
	`link_id` text NOT NULL,
	`article_id` text NOT NULL,
	`created_at` integer,
	CONSTRAINT `link_article_pk` PRIMARY KEY(`link_id`, `article_id`),
	CONSTRAINT `fk_link_article_link_id_link_id_fk` FOREIGN KEY (`link_id`) REFERENCES `link`(`id`) ON DELETE CASCADE,
	CONSTRAINT `fk_link_article_article_id_article_id_fk` FOREIGN KEY (`article_id`) REFERENCES `article`(`id`) ON DELETE CASCADE
);
--> statement-breakpoint
CREATE TABLE `node_chunk` (
	`node_id` text NOT NULL,
	`chunk_id` text NOT NULL,
	`created_at` integer NOT NULL,
	CONSTRAINT `node_chunk_pk` PRIMARY KEY(`node_id`, `chunk_id`),
	CONSTRAINT `fk_node_chunk_node_id_node_id_fk` FOREIGN KEY (`node_id`) REFERENCES `node`(`id`) ON DELETE CASCADE,
	CONSTRAINT `fk_node_chunk_chunk_id_chunk_id_fk` FOREIGN KEY (`chunk_id`) REFERENCES `chunk`(`id`) ON DELETE CASCADE
);
--> statement-breakpoint
CREATE TABLE `notification_session` (
	`notification_id` text NOT NULL,
	`session_id` text NOT NULL,
	`created_at` integer,
	CONSTRAINT `notification_session_pk` PRIMARY KEY(`notification_id`, `session_id`),
	CONSTRAINT `fk_notification_session_notification_id_notification_id_fk` FOREIGN KEY (`notification_id`) REFERENCES `notification`(`id`) ON DELETE CASCADE,
	CONSTRAINT `fk_notification_session_session_id_session_id_fk` FOREIGN KEY (`session_id`) REFERENCES `session`(`id`) ON DELETE CASCADE
);
--> statement-breakpoint
CREATE TABLE `post_article` (
	`post_id` text NOT NULL,
	`article_id` text NOT NULL,
	`created_at` integer,
	CONSTRAINT `post_article_pk` PRIMARY KEY(`post_id`, `article_id`),
	CONSTRAINT `fk_post_article_post_id_article_id_fk` FOREIGN KEY (`post_id`) REFERENCES `article`(`id`) ON DELETE CASCADE,
	CONSTRAINT `fk_post_article_article_id_article_id_fk` FOREIGN KEY (`article_id`) REFERENCES `article`(`id`) ON DELETE CASCADE
);
--> statement-breakpoint
CREATE TABLE `post_project` (
	`post_id` text NOT NULL,
	`project_id` text NOT NULL,
	`created_at` integer,
	CONSTRAINT `post_project_pk` PRIMARY KEY(`post_id`, `project_id`),
	CONSTRAINT `fk_post_project_post_id_article_id_fk` FOREIGN KEY (`post_id`) REFERENCES `article`(`id`) ON DELETE CASCADE,
	CONSTRAINT `fk_post_project_project_id_project_id_fk` FOREIGN KEY (`project_id`) REFERENCES `project`(`id`) ON DELETE CASCADE
);
--> statement-breakpoint
CREATE TABLE `post_session` (
	`post_id` text NOT NULL,
	`session_id` text NOT NULL,
	`created_at` integer,
	CONSTRAINT `fk_post_session_post_id_article_id_fk` FOREIGN KEY (`post_id`) REFERENCES `article`(`id`) ON DELETE CASCADE,
	CONSTRAINT `fk_post_session_session_id_session_id_fk` FOREIGN KEY (`session_id`) REFERENCES `session`(`id`) ON DELETE CASCADE
);
--> statement-breakpoint
CREATE TABLE `project_session` (
	`id` text PRIMARY KEY,
	`project_id` text NOT NULL,
	`session_id` text NOT NULL,
	`created_at` integer,
	CONSTRAINT `fk_project_session_project_id_project_id_fk` FOREIGN KEY (`project_id`) REFERENCES `project`(`id`) ON DELETE CASCADE,
	CONSTRAINT `fk_project_session_session_id_session_id_fk` FOREIGN KEY (`session_id`) REFERENCES `session`(`id`) ON DELETE CASCADE
);
--> statement-breakpoint
CREATE TABLE `project_todo` (
	`id` text PRIMARY KEY,
	`project_id` text NOT NULL,
	`todo_id` text NOT NULL,
	`created_at` integer,
	CONSTRAINT `fk_project_todo_project_id_project_id_fk` FOREIGN KEY (`project_id`) REFERENCES `project`(`id`) ON DELETE CASCADE,
	CONSTRAINT `fk_project_todo_todo_id_todo_id_fk` FOREIGN KEY (`todo_id`) REFERENCES `todo`(`id`) ON DELETE CASCADE
);
--> statement-breakpoint
CREATE TABLE `session_agent` (
	`session_id` text NOT NULL,
	`agent_id` text NOT NULL,
	`created_at` integer,
	CONSTRAINT `session_agent_pk` PRIMARY KEY(`session_id`, `agent_id`),
	CONSTRAINT `fk_session_agent_session_id_session_id_fk` FOREIGN KEY (`session_id`) REFERENCES `session`(`id`) ON DELETE CASCADE,
	CONSTRAINT `fk_session_agent_agent_id_agent_id_fk` FOREIGN KEY (`agent_id`) REFERENCES `agent`(`id`) ON DELETE CASCADE
);
--> statement-breakpoint
CREATE TABLE `session_todo` (
	`session_id` text NOT NULL,
	`todo_id` text NOT NULL,
	`created_at` integer,
	CONSTRAINT `session_todo_pk` PRIMARY KEY(`session_id`, `todo_id`),
	CONSTRAINT `fk_session_todo_session_id_session_id_fk` FOREIGN KEY (`session_id`) REFERENCES `session`(`id`) ON DELETE CASCADE,
	CONSTRAINT `fk_session_todo_todo_id_todo_id_fk` FOREIGN KEY (`todo_id`) REFERENCES `todo`(`id`) ON DELETE CASCADE
);
--> statement-breakpoint
CREATE TABLE `todo_session` (
	`todo_id` text NOT NULL,
	`session_id` text NOT NULL,
	`created_at` integer,
	CONSTRAINT `todo_session_pk` PRIMARY KEY(`todo_id`, `session_id`),
	CONSTRAINT `fk_todo_session_todo_id_todo_id_fk` FOREIGN KEY (`todo_id`) REFERENCES `todo`(`id`) ON DELETE CASCADE,
	CONSTRAINT `fk_todo_session_session_id_session_id_fk` FOREIGN KEY (`session_id`) REFERENCES `session`(`id`) ON DELETE CASCADE
);
--> statement-breakpoint
CREATE TABLE `todo_tag` (
	`todo_id` text NOT NULL,
	`tag` text NOT NULL,
	CONSTRAINT `todo_tag_pk` PRIMARY KEY(`todo_id`, `tag`),
	CONSTRAINT `fk_todo_tag_todo_id_todo_id_fk` FOREIGN KEY (`todo_id`) REFERENCES `todo`(`id`) ON DELETE CASCADE
);
--> statement-breakpoint
CREATE INDEX `agent_order_idx` ON `agent` (`order`);--> statement-breakpoint
CREATE INDEX `agent_created_at_idx` ON `agent` (`created_at`);--> statement-breakpoint
CREATE INDEX `agent_updated_at_idx` ON `agent` (`updated_at`);--> statement-breakpoint
CREATE INDEX `article_document_id_idx` ON `article` (`document_id`);--> statement-breakpoint
CREATE INDEX `article_for_idx` ON `article` (`for`);--> statement-breakpoint
CREATE INDEX `article_scope_idx` ON `article` (`scope_type`,`scope_id`);--> statement-breakpoint
CREATE INDEX `article_source_idx` ON `article` (`source`);--> statement-breakpoint
CREATE INDEX `article_is_pipelined_idx` ON `article` (`is_pipelined`);--> statement-breakpoint
CREATE INDEX `article_created_at_idx` ON `article` (`created_at`);--> statement-breakpoint
CREATE INDEX `article_updated_at_idx` ON `article` (`updated_at`);--> statement-breakpoint
CREATE UNIQUE INDEX `article_hash_idx` ON `article` (`hash`);--> statement-breakpoint
CREATE INDEX `chunk_article_id_idx` ON `chunk` (`article_id`);--> statement-breakpoint
CREATE INDEX `chunk_created_at_idx` ON `chunk` (`created_at`);--> statement-breakpoint
CREATE INDEX `document_is_pipelined_idx` ON `document` (`is_pipelined`);--> statement-breakpoint
CREATE INDEX `document_created_at_idx` ON `document` (`created_at`);--> statement-breakpoint
CREATE INDEX `document_updated_at_idx` ON `document` (`updated_at`);--> statement-breakpoint
CREATE INDEX `edge_agent_id_idx` ON `edge` (`agent_id`);--> statement-breakpoint
CREATE INDEX `edge_source_idx` ON `edge` (`source_id`);--> statement-breakpoint
CREATE INDEX `edge_target_idx` ON `edge` (`target_id`);--> statement-breakpoint
CREATE INDEX `edge_state_idx` ON `edge` (`state`);--> statement-breakpoint
CREATE INDEX `edge_created_at_idx` ON `edge` (`created_at`);--> statement-breakpoint
CREATE UNIQUE INDEX `edge_source_target_idx` ON `edge` (`source_id`,`target_id`);--> statement-breakpoint
CREATE INDEX `file_path_idx` ON `file` (`path`);--> statement-breakpoint
CREATE INDEX `file_created_at_idx` ON `file` (`created_at`);--> statement-breakpoint
CREATE INDEX `file_updated_at_idx` ON `file` (`updated_at`);--> statement-breakpoint
CREATE INDEX `group_name_idx` ON `group` (`name`);--> statement-breakpoint
CREATE INDEX `group_updated_at_idx` ON `group` (`updated_at`);--> statement-breakpoint
CREATE INDEX `group_todo_group_idx` ON `group_todo` (`group_id`);--> statement-breakpoint
CREATE INDEX `group_todo_status_idx` ON `group_todo` (`status`);--> statement-breakpoint
CREATE INDEX `group_todo_order_idx` ON `group_todo` (`order`);--> statement-breakpoint
CREATE INDEX `group_todo_assignee_idx` ON `group_todo` (`assignee_agent_id`);--> statement-breakpoint
CREATE INDEX `group_todo_updated_at_idx` ON `group_todo` (`updated_at`);--> statement-breakpoint
CREATE UNIQUE INDEX `im_account_platform_account_idx` ON `im_account` (`platform`,`account_id`);--> statement-breakpoint
CREATE INDEX `im_account_enabled_idx` ON `im_account` (`enabled`);--> statement-breakpoint
CREATE INDEX `im_account_status_idx` ON `im_account` (`status`);--> statement-breakpoint
CREATE UNIQUE INDEX `im_peer_state_platform_account_peer_idx` ON `im_peer_state` (`platform`,`account_id`,`peer_key`);--> statement-breakpoint
CREATE INDEX `im_peer_state_platform_idx` ON `im_peer_state` (`platform`);--> statement-breakpoint
CREATE INDEX `im_peer_state_account_idx` ON `im_peer_state` (`account_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `link_hash_idx` ON `link` (`hash`);--> statement-breakpoint
CREATE INDEX `link_status_idx` ON `link` (`status`);--> statement-breakpoint
CREATE INDEX `link_generate_at_idx` ON `link` (`generate_at`);--> statement-breakpoint
CREATE INDEX `link_created_at_idx` ON `link` (`created_at`);--> statement-breakpoint
CREATE INDEX `link_updated_at_idx` ON `link` (`updated_at`);--> statement-breakpoint
CREATE INDEX `message_session_id` ON `message` (`session_id`);--> statement-breakpoint
CREATE INDEX `message_created_at_idx` ON `message` (`created_at`);--> statement-breakpoint
CREATE INDEX `message_updated_at_idx` ON `message` (`updated_at`);--> statement-breakpoint
CREATE INDEX `node_agent_id_idx` ON `node` (`agent_id`);--> statement-breakpoint
CREATE INDEX `node_created_at_idx` ON `node` (`created_at`);--> statement-breakpoint
CREATE INDEX `notification_is_read_idx` ON `notification` (`is_read`);--> statement-breakpoint
CREATE INDEX `notification_is_pushed_idx` ON `notification` (`is_pushed`);--> statement-breakpoint
CREATE INDEX `notification_created_at_idx` ON `notification` (`created_at`);--> statement-breakpoint
CREATE INDEX `notification_updated_at_idx` ON `notification` (`updated_at`);--> statement-breakpoint
CREATE INDEX `project_name_idx` ON `project` (`name`);--> statement-breakpoint
CREATE INDEX `project_created_at_idx` ON `project` (`created_at`);--> statement-breakpoint
CREATE INDEX `project_updated_at_idx` ON `project` (`updated_at`);--> statement-breakpoint
CREATE INDEX `rewire_event_agent_idx` ON `rewire_event` (`agent_id`);--> statement-breakpoint
CREATE INDEX `rewire_event_agent_created_idx` ON `rewire_event` (`agent_id`,`created_at`);--> statement-breakpoint
CREATE INDEX `rewire_event_stimulus_idx` ON `rewire_event` (`stimulus_key`);--> statement-breakpoint
CREATE INDEX `rewire_event_session_idx` ON `rewire_event` (`session_id`);--> statement-breakpoint
CREATE INDEX `rewire_event_node_idx` ON `rewire_event` (`node_id`);--> statement-breakpoint
CREATE INDEX `rewire_event_created_at_idx` ON `rewire_event` (`created_at`);--> statement-breakpoint
CREATE INDEX `session_is_im_idx` ON `session` (`im`);--> statement-breakpoint
CREATE INDEX `session_is_cron_idx` ON `session` (`cron`);--> statement-breakpoint
CREATE INDEX `session_created_at_idx` ON `session` (`created_at`);--> statement-breakpoint
CREATE INDEX `session_updated_at_idx` ON `session` (`updated_at`);--> statement-breakpoint
CREATE UNIQUE INDEX `session_key_idx` ON `session` (`key`);--> statement-breakpoint
CREATE INDEX `skill_type_idx` ON `skill` (`type`);--> statement-breakpoint
CREATE INDEX `skill_created_at_idx` ON `skill` (`created_at`);--> statement-breakpoint
CREATE INDEX `skill_updated_at_idx` ON `skill` (`updated_at`);--> statement-breakpoint
CREATE INDEX `todo_status_idx` ON `todo` (`status`);--> statement-breakpoint
CREATE INDEX `todo_priority_idx` ON `todo` (`priority`);--> statement-breakpoint
CREATE INDEX `todo_order_idx` ON `todo` (`order`);--> statement-breakpoint
CREATE INDEX `todo_created_at_idx` ON `todo` (`created_at`);--> statement-breakpoint
CREATE INDEX `todo_updated_at_idx` ON `todo` (`updated_at`);--> statement-breakpoint
CREATE INDEX `auth_account_user_id_idx` ON `auth_account` (`user_id`);--> statement-breakpoint
CREATE INDEX `auth_account_provider_id_idx` ON `auth_account` (`provider_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `auth_account_provider_account_idx` ON `auth_account` (`provider_id`,`account_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `auth_session_token_idx` ON `auth_session` (`token`);--> statement-breakpoint
CREATE INDEX `auth_session_user_id_idx` ON `auth_session` (`user_id`);--> statement-breakpoint
CREATE INDEX `auth_session_expires_at_idx` ON `auth_session` (`expires_at`);--> statement-breakpoint
CREATE UNIQUE INDEX `auth_user_email_idx` ON `auth_user` (`email`);--> statement-breakpoint
CREATE UNIQUE INDEX `auth_user_username_idx` ON `auth_user` (`username`);--> statement-breakpoint
CREATE INDEX `auth_verification_identifier_idx` ON `auth_verification` (`identifier`);--> statement-breakpoint
CREATE INDEX `agent_article_article_id_idx` ON `agent_article` (`article_id`);--> statement-breakpoint
CREATE INDEX `agent_document_document_id_idx` ON `agent_document` (`document_id`);--> statement-breakpoint
CREATE INDEX `agent_session_agent_id_idx` ON `agent_session` (`agent_id`);--> statement-breakpoint
CREATE INDEX `agent_session_session_id_idx` ON `agent_session` (`session_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `agent_session_agent_session_idx` ON `agent_session` (`agent_id`,`session_id`);--> statement-breakpoint
CREATE INDEX `agent_skill_id_idx` ON `agent_skill` (`skill_id`);--> statement-breakpoint
CREATE INDEX `agent_todo_todo_id_idx` ON `agent_todo` (`todo_id`);--> statement-breakpoint
CREATE INDEX `edge_article_article_id_idx` ON `edge_article` (`article_id`);--> statement-breakpoint
CREATE INDEX `group_agent_group_idx` ON `group_agent` (`group_id`);--> statement-breakpoint
CREATE INDEX `group_agent_agent_idx` ON `group_agent` (`agent_id`);--> statement-breakpoint
CREATE INDEX `group_session_group_idx` ON `group_session` (`group_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `group_session_session_idx` ON `group_session` (`session_id`);--> statement-breakpoint
CREATE INDEX `link_article_article_id_idx` ON `link_article` (`article_id`);--> statement-breakpoint
CREATE INDEX `node_chunk_chunk_id_idx` ON `node_chunk` (`chunk_id`);--> statement-breakpoint
CREATE INDEX `notification_session_session_id_idx` ON `notification_session` (`session_id`);--> statement-breakpoint
CREATE INDEX `post_article_article_id_idx` ON `post_article` (`article_id`);--> statement-breakpoint
CREATE INDEX `post_project_project_id_idx` ON `post_project` (`project_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `post_session_post_id_idx` ON `post_session` (`post_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `post_session_session_id_idx` ON `post_session` (`session_id`);--> statement-breakpoint
CREATE INDEX `post_session_created_at_idx` ON `post_session` (`created_at`);--> statement-breakpoint
CREATE INDEX `project_session_project_id_idx` ON `project_session` (`project_id`);--> statement-breakpoint
CREATE INDEX `project_session_session_id_idx` ON `project_session` (`session_id`);--> statement-breakpoint
CREATE INDEX `project_todo_project_id_idx` ON `project_todo` (`project_id`);--> statement-breakpoint
CREATE INDEX `project_todo_todo_id_idx` ON `project_todo` (`todo_id`);--> statement-breakpoint
CREATE INDEX `session_agent_agent_idx` ON `session_agent` (`agent_id`);--> statement-breakpoint
CREATE INDEX `session_todo_todo_id_idx` ON `session_todo` (`todo_id`);--> statement-breakpoint
CREATE INDEX `todo_session_session_id_idx` ON `todo_session` (`session_id`);--> statement-breakpoint
CREATE INDEX `todo_tag_tag_idx` ON `todo_tag` (`tag`);