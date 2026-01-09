CREATE TABLE `duplicate_leads` (
	`id` text PRIMARY KEY NOT NULL,
	`original_lead_id` text NOT NULL,
	`duplicate_lead_id` text NOT NULL,
	`match_criteria` text NOT NULL,
	`detected_at` integer NOT NULL,
	`rebate_claimed` integer DEFAULT false,
	`rebate_status` text,
	FOREIGN KEY (`original_lead_id`) REFERENCES `leads`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`duplicate_lead_id`) REFERENCES `leads`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `leads` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`address_line1` text,
	`address_line2` text,
	`city` text,
	`state` text,
	`postal_code` text,
	`source` text NOT NULL,
	`description` text,
	`category` text,
	`urgency` text,
	`correlation_id` text,
	`al_account_id` text,
	`status` text DEFAULT 'pending' NOT NULL,
	`converted` integer DEFAULT false,
	`received_at` integer NOT NULL,
	`processed_at` integer,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `leads_correlation_id_unique` ON `leads` (`correlation_id`);--> statement-breakpoint
CREATE TABLE `messages` (
	`id` text PRIMARY KEY NOT NULL,
	`lead_id` text NOT NULL,
	`channel` text NOT NULL,
	`direction` text NOT NULL,
	`from_address` text NOT NULL,
	`to_address` text NOT NULL,
	`subject` text,
	`body` text NOT NULL,
	`status` text DEFAULT 'draft' NOT NULL,
	`external_id` text,
	`created_at` integer NOT NULL,
	`sent_at` integer,
	`delivered_at` integer,
	`read_at` integer,
	FOREIGN KEY (`lead_id`) REFERENCES `leads`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` text PRIMARY KEY NOT NULL,
	`email` text,
	`phone` text,
	`first_name` text,
	`last_name` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_email_unique` ON `users` (`email`);--> statement-breakpoint
CREATE UNIQUE INDEX `users_phone_unique` ON `users` (`phone`);