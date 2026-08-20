const express = require("express");
const mongoose = require("mongoose");

const CalendarEvent = require("../models/CalendarEvent");
const User = require("../models/User");

const router = express.Router();

/*
|--------------------------------------------------------------------------
| Helper: validate MongoDB ObjectId
|--------------------------------------------------------------------------
*/
function isValidObjectId(id) {
  return mongoose.Types.ObjectId.isValid(id);
}

/*
|--------------------------------------------------------------------------
| GET /api/calendar
| Get calendar events
|--------------------------------------------------------------------------
*/
router.get("/", async (req, res) => {
  try {
    const filter = {};

    if (req.query.organizer) {
      if (!isValidObjectId(req.query.organizer)) {
        return res.status(400).json({
          success: false,
          message: "Invalid organizer ID.",
        });
      }

      filter.organizer = req.query.organizer;
    }

    if (req.query.status) {
      filter.status = req.query.status;
    }

    if (req.query.eventType) {
      filter.eventType = req.query.eventType;
    }

    if (req.query.region) {
      filter.region = req.query.region;
    }

    if (req.query.constituency) {
      filter.constituency = req.query.constituency;
    }

    if (req.query.party) {
      filter.party = req.query.party;
    }

    if (req.query.startDate || req.query.endDate) {
      filter.startAt = {};

      if (req.query.startDate) {
        filter.startAt.$gte = new Date(req.query.startDate);
      }

      if (req.query.endDate) {
        filter.startAt.$lte = new Date(req.query.endDate);
      }
    }

    const events = await CalendarEvent.find(filter)
      .populate("organizer", "fullName email role")
      .populate("createdBy", "fullName email role")
      .populate("updatedBy", "fullName email role")
      .populate("organization")
      .populate("attendees.user", "fullName email role")
      .sort({ startAt: 1 });

    return res.status(200).json({
      success: true,
      count: events.length,
      events,
    });
  } catch (error) {
    console.error("GET CALENDAR EVENTS ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to retrieve calendar events.",
      error: error.message,
    });
  }
});

/*
|--------------------------------------------------------------------------
| GET /api/calendar/:id
| Get one calendar event
|--------------------------------------------------------------------------
*/
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid calendar event ID.",
      });
    }

    const event = await CalendarEvent.findById(id)
      .populate("organizer", "fullName email role")
      .populate("createdBy", "fullName email role")
      .populate("updatedBy", "fullName email role")
      .populate("organization")
      .populate("attendees.user", "fullName email role");

    if (!event) {
      return res.status(404).json({
        success: false,
        message: "Calendar event not found.",
      });
    }

    return res.status(200).json({
      success: true,
      event,
    });
  } catch (error) {
    console.error("GET CALENDAR EVENT ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to retrieve calendar event.",
      error: error.message,
    });
  }
});

/*
|--------------------------------------------------------------------------
| POST /api/calendar
| Create a calendar event
|--------------------------------------------------------------------------
*/
router.post("/", async (req, res) => {
  try {
    const {
      title,
      description,
      eventType,
      startAt,
      endAt,
      allDay,
      timezone,
      location,
      meetingLink,
      organizer,
      attendees,
      reminders,
      status,
      visibility,
      recurrence,
      country,
      region,
      constituency,
      party,
      organization,
      createdBy,
    } = req.body;

    if (!title) {
      return res.status(400).json({
        success: false,
        message: "Event title is required.",
      });
    }

    if (!startAt || !endAt) {
      return res.status(400).json({
        success: false,
        message: "Start time and end time are required.",
      });
    }

    if (!organizer) {
      return res.status(400).json({
        success: false,
        message: "Organizer is required.",
      });
    }

    if (!createdBy) {
      return res.status(400).json({
        success: false,
        message: "CreatedBy user is required.",
      });
    }

    if (!isValidObjectId(organizer)) {
      return res.status(400).json({
        success: false,
        message: "Invalid organizer ID.",
      });
    }

    if (!isValidObjectId(createdBy)) {
      return res.status(400).json({
        success: false,
        message: "Invalid createdBy user ID.",
      });
    }

    const event = await CalendarEvent.create({
      title,
      description,
      eventType,
      startAt,
      endAt,
      allDay,
      timezone,
      location,
      meetingLink,
      organizer,
      attendees,
      reminders,
      status,
      visibility,
      recurrence,
      country,
      region,
      constituency,
      party,
      organization,
      createdBy,
    });

    const populatedEvent = await CalendarEvent.findById(event._id)
      .populate("organizer", "fullName email role")
      .populate("createdBy", "fullName email role")
      .populate("organization")
      .populate("attendees.user", "fullName email role");

    return res.status(201).json({
      success: true,
      message: "Calendar event created successfully.",
      event: populatedEvent,
    });
  } catch (error) {
    console.error("CREATE CALENDAR EVENT ERROR:", error);

    return res.status(400).json({
      success: false,
      message: "Failed to create calendar event.",
      error: error.message,
    });
  }
});

/*
|--------------------------------------------------------------------------
| POST /api/calendar/:id/invitations
| Invite users to a calendar event
|--------------------------------------------------------------------------
*/
router.post("/:id/invitations", async (req, res) => {
  try {
    const { id } = req.params;
    const { userIds = [] } = req.body;

    if (!isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid calendar event ID.",
      });
    }

    if (!Array.isArray(userIds) || userIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Provide at least one user ID.",
      });
    }

    const invalidIds = userIds.filter(
      (userId) => !isValidObjectId(userId)
    );

    if (invalidIds.length > 0) {
      return res.status(400).json({
        success: false,
        message: "One or more user IDs are invalid.",
      });
    }

    const event = await CalendarEvent.findById(id);

    if (!event) {
      return res.status(404).json({
        success: false,
        message: "Calendar event not found.",
      });
    }

    const users = await User.find({
      _id: { $in: userIds },
    }).select("fullName email role");

    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No valid users were found.",
      });
    }

    const existingUserIds = event.attendees
      .filter((attendee) => attendee.user)
      .map((attendee) => attendee.user.toString());

    const newAttendees = [];

    for (const user of users) {
      const userId = user._id.toString();

      if (userId === event.organizer.toString()) {
        continue;
      }

      if (existingUserIds.includes(userId)) {
        continue;
      }

      newAttendees.push({
        user: user._id,
        email: user.email,
        name: user.fullName,
        role: user.role,
        response: "pending",
      });
    }

    event.attendees.push(...newAttendees);

    await event.save();

    const updatedEvent = await CalendarEvent.findById(event._id)
      .populate("organizer", "fullName email role")
      .populate("attendees.user", "fullName email role");

    return res.status(200).json({
      success: true,
      message: `${newAttendees.length} invitation(s) added successfully.`,
      invitationsAdded: newAttendees.length,
      event: updatedEvent,
    });
  } catch (error) {
    console.error("INVITE ATTENDEES ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to invite attendees.",
      error: error.message,
    });
  }
});

/*
|--------------------------------------------------------------------------
| PATCH /api/calendar/:id/attendees/:userId/response
| Accept, decline or mark invitation tentative
|--------------------------------------------------------------------------
*/
router.patch(
  "/:id/attendees/:userId/response",
  async (req, res) => {
    try {
      const { id, userId } = req.params;
      const { response } = req.body;

      if (!isValidObjectId(id)) {
        return res.status(400).json({
          success: false,
          message: "Invalid calendar event ID.",
        });
      }

      if (!isValidObjectId(userId)) {
        return res.status(400).json({
          success: false,
          message: "Invalid user ID.",
        });
      }

      const allowedResponses = [
        "pending",
        "accepted",
        "declined",
        "tentative",
      ];

      if (!allowedResponses.includes(response)) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid response. Use pending, accepted, declined or tentative.",
        });
      }

      const event = await CalendarEvent.findById(id);

      if (!event) {
        return res.status(404).json({
          success: false,
          message: "Calendar event not found.",
        });
      }

      const attendee = event.attendees.find(
        (item) =>
          item.user &&
          item.user.toString() === userId
      );

      if (!attendee) {
        return res.status(404).json({
          success: false,
          message: "User is not an attendee of this event.",
        });
      }

      attendee.response = response;

      await event.save();

      const updatedEvent = await CalendarEvent.findById(event._id)
        .populate("organizer", "fullName email role")
        .populate("attendees.user", "fullName email role");

      return res.status(200).json({
        success: true,
        message: `Invitation response updated to ${response}.`,
        event: updatedEvent,
      });
    } catch (error) {
      console.error("UPDATE INVITATION RESPONSE ERROR:", error);

      return res.status(500).json({
        success: false,
        message: "Failed to update invitation response.",
        error: error.message,
      });
    }
  }
);

/*
|--------------------------------------------------------------------------
| DELETE /api/calendar/:id/invitations/:userId
| Remove an attendee from an event
|--------------------------------------------------------------------------
*/
router.delete("/:id/invitations/:userId", async (req, res) => {
  try {
    const { id, userId } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid calendar event ID.",
      });
    }

    if (!isValidObjectId(userId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid user ID.",
      });
    }

    const event = await CalendarEvent.findById(id);

    if (!event) {
      return res.status(404).json({
        success: false,
        message: "Calendar event not found.",
      });
    }

    const originalLength = event.attendees.length;

    event.attendees = event.attendees.filter(
      (attendee) =>
        !attendee.user ||
        attendee.user.toString() !== userId
    );

    if (event.attendees.length === originalLength) {
      return res.status(404).json({
        success: false,
        message: "Attendee not found.",
      });
    }

    await event.save();

    return res.status(200).json({
      success: true,
      message: "Attendee removed successfully.",
    });
  } catch (error) {
    console.error("REMOVE ATTENDEE ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to remove attendee.",
      error: error.message,
    });
  }
});

/*
|--------------------------------------------------------------------------
| PUT /api/calendar/:id
| Update a calendar event
|--------------------------------------------------------------------------
*/
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid calendar event ID.",
      });
    }

    const updateData = {
      ...req.body,
      updatedBy: req.body.updatedBy || null,
    };

    if (updateData.updatedBy && !isValidObjectId(updateData.updatedBy)) {
      return res.status(400).json({
        success: false,
        message: "Invalid updatedBy user ID.",
      });
    }

    const event = await CalendarEvent.findByIdAndUpdate(
      id,
      updateData,
      {
        new: true,
        runValidators: true,
      }
    )
      .populate("organizer", "fullName email role")
      .populate("createdBy", "fullName email role")
      .populate("updatedBy", "fullName email role")
      .populate("organization")
      .populate("attendees.user", "fullName email role");

    if (!event) {
      return res.status(404).json({
        success: false,
        message: "Calendar event not found.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Calendar event updated successfully.",
      event,
    });
  } catch (error) {
    console.error("UPDATE CALENDAR EVENT ERROR:", error);

    return res.status(400).json({
      success: false,
      message: "Failed to update calendar event.",
      error: error.message,
    });
  }
});

/*
|--------------------------------------------------------------------------
| DELETE /api/calendar/:id
| Delete a calendar event
|--------------------------------------------------------------------------
*/
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid calendar event ID.",
      });
    }

    const event = await CalendarEvent.findByIdAndDelete(id);

    if (!event) {
      return res.status(404).json({
        success: false,
        message: "Calendar event not found.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Calendar event deleted successfully.",
    });
  } catch (error) {
    console.error("DELETE CALENDAR EVENT ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to delete calendar event.",
      error: error.message,
    });
  }
});

module.exports = router;
