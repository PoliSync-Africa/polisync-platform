const mongoose = require("mongoose");

/*
 * ============================================================
 * ATTENDEE SCHEMA
 * ============================================================
 */

const AttendeeSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    email: {
      type: String,
      lowercase: true,
      trim: true,
      required: true,
    },

    name: {
      type: String,
      trim: true,
      default: "",
    },

    role: {
      type: String,
      trim: true,
      default: "",
    },

    response: {
      type: String,
      enum: ["pending", "accepted", "declined", "tentative"],
      default: "pending",
    },

    respondedAt: {
      type: Date,
      default: null,
    },

    isRequired: {
      type: Boolean,
      default: true,
    },
  },
  {
    _id: false,
  }
);


/*
 * ============================================================
 * REMINDER SCHEMA
 * ============================================================
 */

const ReminderSchema = new mongoose.Schema(
  {
    minutesBefore: {
      type: Number,
      required: true,
      min: 0,
    },

    channel: {
      type: String,
      enum: ["in_app", "email", "sms"],
      default: "in_app",
    },
  },
  {
    _id: false,
  }
);


/*
 * ============================================================
 * CALENDAR EVENT SCHEMA
 * ============================================================
 */

const CalendarEventSchema = new mongoose.Schema(
  {
    /*
     * --------------------------------------------------------
     * BASIC INFORMATION
     * --------------------------------------------------------
     */

    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },

    description: {
      type: String,
      trim: true,
      default: "",
      maxlength: 5000,
    },

    eventType: {
      type: String,
      enum: [
        "meeting",
        "election",
        "campaign",
        "research",
        "training",
        "deadline",
        "reminder",
        "other",
      ],
      default: "meeting",
    },


    /*
     * --------------------------------------------------------
     * SCHEDULING
     * --------------------------------------------------------
     */

    startAt: {
      type: Date,
      required: true,
    },

    endAt: {
      type: Date,
      required: true,
    },

    allDay: {
      type: Boolean,
      default: false,
    },

    timezone: {
      type: String,
      trim: true,
      default: "Africa/Accra",
    },

    location: {
      type: String,
      trim: true,
      default: "",
    },

    meetingLink: {
      type: String,
      trim: true,
      default: "",
    },


    /*
     * --------------------------------------------------------
     * ORGANIZATION / OWNERSHIP
     * --------------------------------------------------------
     */

    organization: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      default: null,
    },

    party: {
      type: String,
      trim: true,
      default: "",
    },

    country: {
      type: String,
      trim: true,
      default: "Ghana",
    },

    region: {
      type: String,
      trim: true,
      default: "",
    },

    constituency: {
      type: String,
      trim: true,
      default: "",
    },


    /*
     * --------------------------------------------------------
     * ORGANIZER
     * --------------------------------------------------------
     */

    organizer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },


    /*
     * --------------------------------------------------------
     * ATTENDEES
     * --------------------------------------------------------
     */

    attendees: {
      type: [AttendeeSchema],
      default: [],
    },


    /*
     * --------------------------------------------------------
     * REMINDERS
     * --------------------------------------------------------
     */

    reminders: {
      type: [ReminderSchema],
      default: [
        {
          minutesBefore: 15,
          channel: "in_app",
        },
      ],
    },


    /*
     * --------------------------------------------------------
     * STATUS
     * --------------------------------------------------------
     */

    status: {
      type: String,
      enum: [
        "scheduled",
        "ongoing",
        "completed",
        "cancelled",
      ],
      default: "scheduled",
    },


    /*
     * --------------------------------------------------------
     * VISIBILITY
     * --------------------------------------------------------
     */

    visibility: {
      type: String,
      enum: [
        "private",
        "organization",
        "party",
        "public",
      ],
      default: "organization",
    },


    /*
     * --------------------------------------------------------
     * RECURRING MEETINGS / EVENTS
     * --------------------------------------------------------
     */

    recurrence: {
      enabled: {
        type: Boolean,
        default: false,
      },

      frequency: {
        type: String,
        enum: [
          "daily",
          "weekly",
          "monthly",
          "yearly",
        ],
        default: null,
      },

      interval: {
        type: Number,
        min: 1,
        default: 1,
      },

      daysOfWeek: {
        type: [Number],
        default: [],
      },

      dayOfMonth: {
        type: Number,
        min: 1,
        max: 31,
        default: null,
      },

      until: {
        type: Date,
        default: null,
      },

      count: {
        type: Number,
        min: 1,
        default: null,
      },
    },


    /*
     * --------------------------------------------------------
     * PARENT EVENT
     * Used when an event is generated from a recurring event.
     * --------------------------------------------------------
     */

    parentEvent: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "CalendarEvent",
      default: null,
    },


    /*
     * --------------------------------------------------------
     * EXTERNAL CALENDAR IDENTIFIERS
     * --------------------------------------------------------
     */

    externalId: {
      type: String,
      trim: true,
      default: "",
    },

    externalCalendar: {
      type: String,
      enum: [
        "none",
        "google",
        "outlook",
        "apple",
        "other",
      ],
      default: "none",
    },


    /*
     * --------------------------------------------------------
     * SOFT DELETE
     * --------------------------------------------------------
     */

    isDeleted: {
      type: Boolean,
      default: false,
    },

    deletedAt: {
      type: Date,
      default: null,
    },

    deletedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  {
    timestamps: true,
  }
);


/*
 * ============================================================
 * VALIDATION
 * ============================================================
 *
 * Prevent events where the ending time occurs before or at
 * the starting time.
 * ============================================================
 */

CalendarEventSchema.pre("validate", function (next) {
  if (this.endAt <= this.startAt) {
    return next(
      new Error(
        "Calendar event end time must be after the start time."
      )
    );
  }

  next();
});


/*
 * ============================================================
 * RECURRENCE VALIDATION
 * ============================================================
 */

CalendarEventSchema.pre("validate", function (next) {
  if (!this.recurrence || !this.recurrence.enabled) {
    return next();
  }

  if (!this.recurrence.frequency) {
    return next(
      new Error(
        "Recurring events must specify a recurrence frequency."
      )
    );
  }

  if (
    this.recurrence.until &&
    this.recurrence.until <= this.startAt
  ) {
    return next(
      new Error(
        "Recurrence end date must be after the event start date."
      )
    );
  }

  next();
});


/*
 * ============================================================
 * INDEXES
 * ============================================================
 *
 * These improve calendar searches and event filtering.
 * ============================================================
 */

CalendarEventSchema.index({
  organization: 1,
  startAt: 1,
});

CalendarEventSchema.index({
  organizer: 1,
  startAt: 1,
});

CalendarEventSchema.index({
  "attendees.user": 1,
  startAt: 1,
});

CalendarEventSchema.index({
  eventType: 1,
  startAt: 1,
});

CalendarEventSchema.index({
  status: 1,
  startAt: 1,
});

CalendarEventSchema.index({
  country: 1,
  region: 1,
  constituency: 1,
  startAt: 1,
});

CalendarEventSchema.index({
  isDeleted: 1,
  startAt: 1,
});


/*
 * ============================================================
 * EXPORT
 * ============================================================
 */

module.exports = mongoose.model(
  "CalendarEvent",
  CalendarEventSchema
);
