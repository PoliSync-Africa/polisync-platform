const mongoose = require("mongoose");

const CalendarEvent = require("../models/CalendarEvent");
const Notification = require("../models/Notification");

/*
|--------------------------------------------------------------------------
| POLISYNC AFRICA — Smart Calendar Reminder Service
|--------------------------------------------------------------------------
|
| This service:
| 1. Finds calendar events approaching their reminder time.
| 2. Reads each event's reminder configuration.
| 3. Creates notifications for the appropriate attendees.
| 4. Prevents duplicate reminder notifications.
|
|--------------------------------------------------------------------------
*/

/*
|--------------------------------------------------------------------------
| Configuration
|--------------------------------------------------------------------------
*/

const DEFAULT_WINDOW_MINUTES = 5;


/*
|--------------------------------------------------------------------------
| Validate ObjectId
|--------------------------------------------------------------------------
*/

function isValidObjectId(id) {
  return mongoose.Types.ObjectId.isValid(id);
}


/*
|--------------------------------------------------------------------------
| Build a unique reminder key
|--------------------------------------------------------------------------
|
| This prevents the same reminder from being created repeatedly
| when the reminder service runs more than once.
|
|--------------------------------------------------------------------------
*/

function buildReminderKey(eventId, userId, minutesBefore, startAt) {
  return [
    "calendar-reminder",
    eventId.toString(),
    userId.toString(),
    minutesBefore,
    new Date(startAt).getTime(),
  ].join(":");
}


/*
|--------------------------------------------------------------------------
| Create notification for one attendee
|--------------------------------------------------------------------------
*/

async function createReminderNotification({
  event,
  attendee,
  reminder,
}) {
  if (!attendee || !attendee.user) {
    return null;
  }

  const userId = attendee.user;

  if (!isValidObjectId(userId)) {
    return null;
  }

  const minutesBefore = Number(
    reminder.minutesBefore
  );

  if (
    Number.isNaN(minutesBefore) ||
    minutesBefore < 0
  ) {
    return null;
  }

  const reminderKey = buildReminderKey(
    event._id,
    userId,
    minutesBefore,
    event.startAt
  );

  /*
  |--------------------------------------------------------------------------
  | Prevent duplicate notifications
  |--------------------------------------------------------------------------
  */

  const existingNotification =
    await Notification.findOne({
      recipient: userId,
      event: event._id,
      "metadata.reminderKey": reminderKey,
    });

  if (existingNotification) {
    return null;
  }

  const channel =
    reminder.channel || "in_app";

  const title = `Reminder: ${event.title}`;

  let message;

  if (minutesBefore === 0) {
    message = `Your calendar event "${event.title}" is starting now.`;
  } else if (minutesBefore === 1) {
    message = `Your calendar event "${event.title}" starts in 1 minute.`;
  } else {
    message = `Your calendar event "${event.title}" starts in ${minutesBefore} minutes.`;
  }

  /*
  |--------------------------------------------------------------------------
  | Create notification
  |--------------------------------------------------------------------------
  */

  const notification =
    await Notification.create({
      recipient: userId,
      event: event._id,
      type: "reminder",
      channel,
      title,
      message,
      status: "pending",
      scheduledFor: new Date(),
      metadata: {
        reminderKey,
        minutesBefore,
        eventType: event.eventType,
        timezone: event.timezone,
      },
      createdBy: event.organizer || null,
    });

  return notification;
}


/*
|--------------------------------------------------------------------------
| Process one calendar event
|--------------------------------------------------------------------------
*/

async function processEventReminders(event) {
  if (!event) {
    return {
      notificationsCreated: 0,
    };
  }

  /*
  |--------------------------------------------------------------------------
  | Only process active calendar events
  |--------------------------------------------------------------------------
  */

  if (
    event.status &&
    !["scheduled", "ongoing"].includes(event.status)
  ) {
    return {
      notificationsCreated: 0,
    };
  }

  if (!event.startAt || !event.endAt) {
    return {
      notificationsCreated: 0,
    };
  }

  if (
    !Array.isArray(event.reminders) ||
    event.reminders.length === 0
  ) {
    return {
      notificationsCreated: 0,
    };
  }

  /*
  |--------------------------------------------------------------------------
  | Calculate event timing
  |--------------------------------------------------------------------------
  */

  const now = new Date();

  const eventStart =
    new Date(event.startAt);

  let notificationsCreated = 0;

  /*
  |--------------------------------------------------------------------------
  | Process every reminder configured for the event
  |--------------------------------------------------------------------------
  */

  for (const reminder of event.reminders) {
    if (!reminder) {
      continue;
    }

    if (reminder.minutesBefore === undefined) {
      continue;
    }

    const minutesBefore =
      Number(reminder.minutesBefore);

    if (
      Number.isNaN(minutesBefore) ||
      minutesBefore < 0
    ) {
      continue;
    }

    const reminderTime =
      new Date(
        eventStart.getTime() -
          minutesBefore * 60 * 1000
      );

    /*
    |--------------------------------------------------------------------------
    | Only trigger reminders that are due.
    |--------------------------------------------------------------------------
    |
    | We allow a small processing window so the service can safely run
    | periodically without requiring the exact millisecond.
    |
    |--------------------------------------------------------------------------
    */

    const difference =
      now.getTime() -
      reminderTime.getTime();

    const windowMilliseconds =
      DEFAULT_WINDOW_MINUTES *
      60 *
      1000;

    if (
      difference < 0 ||
      difference > windowMilliseconds
    ) {
      continue;
    }

    /*
    |--------------------------------------------------------------------------
    | Notify every attendee
    |--------------------------------------------------------------------------
    */

    for (const attendee of event.attendees || []) {
      const notification =
        await createReminderNotification({
          event,
          attendee,
          reminder,
        });

      if (notification) {
        notificationsCreated += 1;
      }
    }

    /*
    |--------------------------------------------------------------------------
    | Also notify the event organizer.
    |--------------------------------------------------------------------------
    |
    | The organizer is included separately because the organizer may
    | not necessarily appear in the attendees array.
    |
    |--------------------------------------------------------------------------
    */

    if (event.organizer) {
      const organizerAlreadyIncluded =
        (event.attendees || []).some(
          (attendee) =>
            attendee &&
            attendee.user &&
            attendee.user.toString() ===
              event.organizer.toString()
        );

      if (!organizerAlreadyIncluded) {
        const notification =
          await createReminderNotification({
            event,
            attendee: {
              user: event.organizer,
            },
            reminder,
          });

        if (notification) {
          notificationsCreated += 1;
        }
      }
    }
  }

  return {
    notificationsCreated,
  };
}


/*
|--------------------------------------------------------------------------
| Process upcoming calendar reminders
|--------------------------------------------------------------------------
|
| This is the main function that the future scheduler/cron job will call.
|
|--------------------------------------------------------------------------
*/

async function processUpcomingReminders(
  options = {}
) {
  const windowMinutes =
    Number(options.windowMinutes) ||
    DEFAULT_WINDOW_MINUTES;

  const now = new Date();

  const futureLimit =
    new Date(
      now.getTime() +
        windowMinutes * 60 * 1000
    );

  /*
  |--------------------------------------------------------------------------
  | Find events that are starting within the processing window
  |--------------------------------------------------------------------------
  */

  const events =
    await CalendarEvent.find({
      startAt: {
        $gte: new Date(
          now.getTime() -
            windowMinutes * 60 * 1000
        ),
        $lte: futureLimit,
      },
      status: {
        $in: ["scheduled", "ongoing"],
      },
    });

  let eventsProcessed = 0;
  let notificationsCreated = 0;

  /*
  |--------------------------------------------------------------------------
  | Process each event
  |--------------------------------------------------------------------------
  */

  for (const event of events) {
    const result =
      await processEventReminders(event);

    eventsProcessed += 1;

    notificationsCreated +=
      result.notificationsCreated;
  }

  return {
    success: true,
    eventsFound: events.length,
    eventsProcessed,
    notificationsCreated,
    processedAt: now,
  };
}


/*
|--------------------------------------------------------------------------
| Export Service
|--------------------------------------------------------------------------
*/

module.exports = {
  processUpcomingReminders,
  processEventReminders,
  createReminderNotification,
};
