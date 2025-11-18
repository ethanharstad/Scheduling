CREATE TABLE `staff_assignments` (
	`id` text PRIMARY KEY NOT NULL,
	`schedule_id` text,
	`staff_member_id` text NOT NULL,
	`staff_slot_id` text,
	`start_time` integer NOT NULL,
	`end_time` integer NOT NULL,
	`metadata` text
);
--> statement-breakpoint
CREATE TABLE `staff_constraints` (
	`id` text PRIMARY KEY NOT NULL,
	`staff_member_id` text NOT NULL,
	`start_time` integer NOT NULL,
	`end_time` integer NOT NULL,
	`preference` text NOT NULL,
	`reason` text
);
--> statement-breakpoint
CREATE TABLE `staff_slots` (
	`id` text PRIMARY KEY NOT NULL,
	`schedule_requirement_id` text,
	`name` text NOT NULL,
	`start_time` integer NOT NULL,
	`end_time` integer NOT NULL,
	`required_qualifications` text NOT NULL
);
