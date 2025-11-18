CREATE TABLE `schedule_requirements` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text,
	`schedule_start` integer NOT NULL,
	`schedule_end` integer NOT NULL,
	`staff_slots` text NOT NULL,
	`metadata` text
);
--> statement-breakpoint
CREATE TABLE `schedules` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text,
	`schedule_start` integer NOT NULL,
	`schedule_end` integer NOT NULL,
	`assignments` text NOT NULL,
	`unfilled_slots` text NOT NULL,
	`source_requirement_id` text,
	`metadata` text
);
