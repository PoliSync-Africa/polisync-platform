const {
  processUpcomingReminders,
} = require("./reminderService");

/*
|--------------------------------------------------------------------------
| POLISYNC AFRICA — Smart Calendar Reminder Scheduler
|--------------------------------------------------------------------------
|
| Automatically checks for upcoming calendar reminders and passes them
| to the reminder service for processing.
|
|--------------------------------------------------------------------------
*/

const DEFAULT_INTERVAL_MS = 60 * 1000; // 1 minute

let schedulerInterval = null;
let isRunning = false;


/*
|--------------------------------------------------------------------------
| Run reminder check
|--------------------------------------------------------------------------
*/

async function runReminderCheck() {
  if (isRunning) {
    console.log(
      "⏳ Reminder check already running. Skipping this cycle."
    );

    return;
  }

  isRunning = true;

  try {
    const result =
      await processUpcomingReminders({
        windowMinutes: 5,
      });

    console.log(
      `🔔 Reminder check completed: ${result.eventsProcessed} event(s) processed, ${result.notificationsCreated} notification(s) created.`
    );
  } catch (error) {
    console.error(
      "❌ REMINDER SCHEDULER ERROR:",
      error.message
    );
  } finally {
    isRunning = false;
  }
}


/*
|--------------------------------------------------------------------------
| Start scheduler
|--------------------------------------------------------------------------
*/

function startReminderScheduler(
  intervalMs = DEFAULT_INTERVAL_MS
) {
  if (schedulerInterval) {
    console.log(
      "⚠️ Reminder scheduler is already running."
    );

    return schedulerInterval;
  }

  console.log(
    "📅 POLISYNC AFRICA Reminder Scheduler started."
  );

  /*
  |--------------------------------------------------------------------------
  | Run immediately when the server starts
  |--------------------------------------------------------------------------
  */

  runReminderCheck();

  /*
  |--------------------------------------------------------------------------
  | Continue checking periodically
  |--------------------------------------------------------------------------
  */

  schedulerInterval = setInterval(
    runReminderCheck,
    intervalMs
  );

  return schedulerInterval;
}


/*
|--------------------------------------------------------------------------
| Stop scheduler
|--------------------------------------------------------------------------
*/

function stopReminderScheduler() {
  if (!schedulerInterval) {
    return;
  }

  clearInterval(schedulerInterval);

  schedulerInterval = null;

  console.log(
    "🛑 POLISYNC AFRICA Reminder Scheduler stopped."
  );
}


/*
|--------------------------------------------------------------------------
| Export scheduler
|--------------------------------------------------------------------------
*/

module.exports = {
  startReminderScheduler,
  stopReminderScheduler,
  runReminderCheck,
};
