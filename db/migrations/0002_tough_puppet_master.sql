PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_duplicate_leads` (
	`id` text PRIMARY KEY NOT NULL,
	`original_lead_id` text NOT NULL,
	`duplicate_lead_id` text,
	`match_criteria` text NOT NULL,
	`detected_at` integer NOT NULL,
	`rebate_claimed` integer DEFAULT false,
	`rebate_status` text,
	FOREIGN KEY (`original_lead_id`) REFERENCES `leads`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`duplicate_lead_id`) REFERENCES `leads`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_duplicate_leads`("id", "original_lead_id", "duplicate_lead_id", "match_criteria", "detected_at", "rebate_claimed", "rebate_status") SELECT "id", "original_lead_id", "duplicate_lead_id", "match_criteria", "detected_at", "rebate_claimed", "rebate_status" FROM `duplicate_leads`;--> statement-breakpoint
DROP TABLE `duplicate_leads`;--> statement-breakpoint
ALTER TABLE `__new_duplicate_leads` RENAME TO `duplicate_leads`;--> statement-breakpoint
PRAGMA foreign_keys=ON;