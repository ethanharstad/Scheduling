PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_staff_slots` (
	`id` text PRIMARY KEY NOT NULL,
	`schedule_requirement_id` text NOT NULL,
	`name` text NOT NULL,
	`start_time` integer NOT NULL,
	`end_time` integer NOT NULL,
	`required_qualifications` text NOT NULL
);
--> statement-breakpoint
INSERT INTO `__new_staff_slots`("id", "schedule_requirement_id", "name", "start_time", "end_time", "required_qualifications") SELECT "id", "schedule_requirement_id", "name", "start_time", "end_time", "required_qualifications" FROM `staff_slots`;--> statement-breakpoint
DROP TABLE `staff_slots`;--> statement-breakpoint
ALTER TABLE `__new_staff_slots` RENAME TO `staff_slots`;--> statement-breakpoint
PRAGMA foreign_keys=ON;