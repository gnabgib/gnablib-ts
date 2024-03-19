/*! Copyright 2023-2024 the gnablib contributors MPL-1.1 */
import { DateTimeUtc } from '../../datetime/dt.js';

export enum LogLevel {
	Debug,
	Info,
	Warn,
	Error,
}

/**
 * An entry to log
 */
export interface ILogEntry {
	/** When this entry was generated */
	get when(): DateTimeUtc;
	/** Log level */
	get level(): LogLevel;
	/** Log message */
	get message(): string;
	/** Related log fields */
	get fields(): Record<string, unknown>;
	/** Render level/when/message in a single string, with color if `inColor` */
	toString(inColor: boolean): string;
}

/**
 * A target to send entries to on log
 */
export interface ILogTarget {
	/**
	 * Whether this target supports color
	 */
	supportColor: boolean;
	/**
	 * Log an entry, note a target may choose to filter/ignore some entries
	 * @param entry
	 */
	log(entry: ILogEntry): void;
}

export interface ILogOracle {
	/**
	 * Set a new log target, by default we log nowhere.  A log-target change
	 * is logged as an (unfilterable) warning
	 */
	set target(log: ILogTarget | undefined);

	/**
	 * Whether the log supports color
	 */
	get supportColor(): boolean;

	/**
	 * Log a debug message.
	 *
	 * Debug messages are to aid developers and troubleshooters.  They typically should
	 * not be logged in production, there may be performance implications.  Examples
	 * include:
	 *
	 * - Database queries (be careful of PII in `fields`)
	 * - Details of API calls (be careful of PII in `fields`)
	 * - Settings or versions of components used
	 *
	 * @param fields Any related data
	 */
	debug(message: string, fields?: Record<string, unknown>): void;

	/**
	 * Log an informational message.
	 *
	 * Info messages are for business purpose showing normal operation or
	 * notable changes.  Examples include:
	 *
	 * - Configuration setup/changes
	 * - Operational state changes
	 * - Jobs/tasks/method events that have started or stopped and no direct feedback
	 *  is visible in UI or output.
	 *
	 * @param fields Any related data
	 */
	info(message: string, fields?: Record<string, unknown>): void;

	/**
	 * Log a warning message.
	 *
	 * Warning messages are unexpected/potentially dangerous, but the application can
	 * continue.  Someone may need to address warnings to prevent escalating issues.
	 * Examples include:
	 *
	 * - Resource consumption nearing thresholds
	 * - Recoverable errors
	 * - Configuration changes that may compromise security (or logging)
	 * - Outdate/deprecated component use
	 * - Response times nearing acceptable thresholds
	 *
	 * @param fields Any related data
	 */
	warn(message: string, fields?: Record<string, unknown>): void;

	/**
	 * Log an error message.
	 *
	 * Error messages are unexpected and hinder application execution.  It may be
	 * possible for an application to continue, but the error needs to be reviewed.
	 * Examples include:
	 *
	 * - Dependency failure (database, api, filesystem, service)
	 * - Access failure
	 * - Failed parsing/serializing/deserializing of data
	 *
	 * @param fields Any related data
	 */
	error(message: string, fields?: Record<string, unknown>): void;
}
