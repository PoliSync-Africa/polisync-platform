const mongoose = require("mongoose");

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
  { _id: false }
);

const AttendeeSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    email: {
      type: String,
      lowercase: true,
      trim: true,
    },

    name: {
      type: String,
      trim: true,
    },

    role: {
      type: String,
      trim: true,
    },

    response: {
      type: String,
      enum: ["pending", "accepted", "declined", "tentative"],
      default: "pending",
    },
  },
  { _id: false }
);

const CalendarEventSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },

    description: {
      type: String,
      trim: true,
      default: "",
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
      default: "Africa/Accra",
      trim: true,
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

    organizer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    attendees: {
      type: [AttendeeSchema],
      default: [],
    },

    reminders: {
      type: [ReminderSchema],
      default: [
        {
          minutesBefore: 15,
          channel: "in_app",
        },
      ],
    },

    status: {
      type: String,
      enum: ["scheduled", "ongoing", "completed", "cancelled"],
      default: "scheduled",
    },

    visibility: {
      type: String,
      enum: ["private", "organization", "party", "public"],
      default: "organization",
    },

    recurrence: {
      enabled: {
        type: Boolean,
        default: false,
      },

      frequency: {
        type: String,
        enum: ["daily", "weekly", "monthly", "yearly"],
        default: null,
      },

      interval: {
        type: Number,
        default: 1,
        min: 1,
      },

      until: {
        type: Date,
        default: null,
      },
    },

    country: {
      type: String,
      default: "Ghana",
      trim: true,
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

    party: {
      type: String,
      trim: true,
      default: "",
    },

    organization: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      default: null,
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
  },
  {
    timestamps: true,
  }
);

/*
 * Prevent invalid events where the ending time
 * occurs before or at the starting time.
 */
CalendarEventSchema.pre("validate", function (next) {
  if (this.endAt <= this.startAt) {
    return next(
      new Error("Calendar event end time must be after the start time.")
    );
  }

  next();
});

module.exports = mongoose.model("CalendarEvent", CalendarEventSchema);
