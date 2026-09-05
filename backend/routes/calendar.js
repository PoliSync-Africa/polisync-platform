const express = require("express");
const mongoose = require("mongoose");

const router = express.Router();

const CalendarEvent = require("../models/CalendarEvent");
const User = require("../models/User");

/*
|--------------------------------------------------------------------------
| HELPERS
|--------------------------------------------------------------------------
*/

const isValidObjectId = (id) => {
  return mongoose.Types.ObjectId.isValid(id);
};

const populateEvent = (query) => {
  return query
    .populate("organizer", "fullName email role")
    .populate("createdBy", "fullName email role")
    .populate("updatedBy", "fullName email role")
    .populate("organization")
    .populate("attendees.user", "fullName email role");
};

const handleError = (res, message, error) => {
  console.error(message, error);

  return res.status(500).json({
    success: false,
    message,
    error: error.message,
  });
};


/*
|--------------------------------------------------------------------------
| GET /api/calendar
| Get calendar events
|--------------------------------------------------------------------------
*/

router.get("/", async (req, res) => {
  try {
    const {
      start,
      end,
      status,
      eventType,
      visibility,
      organization,
      organizer,
    } = req.query;

    const filter = {};

    /*
     * Optional date range filtering
     */
    if (start || end) {
      filter.startAt = {};

      if (start) {
        const startDate = new Date(start);

        if (Number.isNaN(startDate.getTime())) {
          return res.status(400).json({
            success: false,
            message: "Invalid start date.",
          });
        }

        filter.startAt.$gte = startDate;
      }

      if (end) {
        const endDate = new Date(end);

        if (Number.isNaN(endDate.getTime())) {
          return res.status(400).json({
            success: false,
            message: "Invalid end date.",
          });
        }

        filter.startAt.$lte = endDate;
      }
    }

    if (status) {
      filter.status = status;
    }

    if (eventType) {
      filter.eventType = eventType;
    }

    if (visibility) {
      filter.visibility = visibility;
    }

    if (organization) {
      if (!isValidObjectId(organization)) {
        return res.status(400).json({
          success: false,
          message: "Invalid organization ID.",
        });
      }

      filter.organization = organization;
    }

    if (organizer) {
      if (!isValidObjectId(organizer)) {
        return res.status(400).json({
          success: false,
          message: "Invalid organizer ID.",
        });
      }

      filter.organizer = organizer;
    }

    const events = await populateEvent(
      CalendarEvent.find(filter).sort({ startAt: 1 })
    );

    return res.status(200).json({
      success: true,
      count: events.length,
      events,
    });
  } catch (error) {
    return handleError(
      res,
      "Failed to retrieve calendar events.",
      error
    );
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

    const event = await populateEvent(
      CalendarEvent.findById(id)
    );

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
    return handleError(
      res,
      "Failed to retrieve calendar event.",
      error
    );
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
      createdBy,
      updatedBy,
      organization,
      country,
      region,
      constituency,
      party,
      status,
      visibility,
      recurrence,
      attendees,
      reminders,
    } = req.body;

    /*
     * Required fields
     */
    if (!title) {
      return res.status(400).json({
        success: false,
        message: "Event title is required.",
      });
    }

    if (!startAt) {
      return res.status(400).json({
        success: false,
        message: "Event start time is required.",
      });
    }

    if (!endAt) {
      return res.status(400).json({
        success: false,
        message: "Event end time is required.",
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
        message: "createdBy is required.",
      });
    }

    /*
     * Validate IDs
     */
    if (!isValidObjectId(organizer)) {
      return res.status(400).json({
        success: false,
        message: "Invalid organizer user ID.",
      });
    }

    if (!isValidObjectId(createdBy)) {
      return res.status(400).json({
        success: false,
        message: "Invalid createdBy user ID.",
      });
    }

    if (updatedBy && !isValidObjectId(updatedBy)) {
      return res.status(400).json({
        success: false,
        message: "Invalid updatedBy user ID.",
      });
    }

    if (organization && !isValidObjectId(organization)) {
      return res.status(400).json({
        success: false,
        message: "Invalid organization ID.",
      });
    }

    /*
     * Verify organizer
     */
    const organizerUser = await User.findById(organizer);

    if (!organizerUser) {
      return res.status(404).json({
        success: false,
        message: "Organizer user not found.",
      });
    }

    /*
     * Build event
     */
    const event = new CalendarEvent({
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
      createdBy,
      updatedBy: updatedBy || null,
      organization: organization || null,
      country,
      region,
      constituency,
      party,
      status,
      visibility,
      recurrence,
      attendees: attendees || [],
      reminders,
    });

    await event.save();

    const createdEvent = await populateEvent(
      CalendarEvent.findById(event._id)
    );

    return res.status(201).json({
      success: true,
      message: "Calendar event created successfully.",
      event: createdEvent,
    });
  } catch (error) {
    return handleError(
      res,
      "Failed to create calendar event.",
      error
    );
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

    const updatedData = {
      ...req.body,
    };

    /*
     * Validate updatedBy if supplied
     */
    if (
      updatedData.updatedBy &&
      !isValidObjectId(updatedData.updatedBy)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid updatedBy user ID.",
      });
    }

    /*
     * Validate organizer if supplied
     */
    if (
      updatedData.organizer &&
      !isValidObjectId(updatedData.organizer)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid organizer user ID.",
      });
    }

    /*
     * Validate organization if supplied
     */
    if (
      updatedData.organization &&
      !isValidObjectId(updatedData.organization)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid organization ID.",
      });
    }

    /*
     * Remove immutable MongoDB field if accidentally supplied
     */
    delete updatedData._id;

    const event = await CalendarEvent.findByIdAndUpdate(
      id,
      updatedData,
      {
        new: true,
        runValidators: true,
      }
    );

    if (!event) {
      return res.status(404).json({
        success: false,
        message: "Calendar event not found.",
      });
    }

    const updatedEvent = await populateEvent(
      CalendarEvent.findById(event._id)
    );

    return res.status(200).json({
      success: true,
      message: "Calendar event updated successfully.",
      event: updatedEvent,
    });
  } catch (error) {
    return handleError(
      res,
      "Failed to update calendar event.",
      error
    );
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
    return handleError(
      res,
      "Failed to delete calendar event.",
      error
    );
  }
});


/*
|--------------------------------------------------------------------------
| POST /api/calendar/:id/invitations
| Invite attendees to an event
|--------------------------------------------------------------------------
*/

router.post("/:id/invitations", async (req, res) => {
  try {
    const { id } = req.params;
    const { userIds } = req.body;

    if (!isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid calendar event ID.",
      });
    }

    if (!Array.isArray(userIds) || userIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: "userIds must be a non-empty array.",
      });
    }

    /*
     * Validate user IDs
     */
    for (const userId of userIds) {
      if (!isValidObjectId(userId)) {
        return res.status(400).json({
          success: false,
          message: `Invalid user ID: ${userId}`,
        });
      }
    }

    const event = await CalendarEvent.findById(id);

    if (!event) {
      return res.status(404).json({
        success: false,
        message: "Calendar event not found.",
      });
    }

    /*
     * Get users
     */
    const users = await User.find({
      _id: { $in: userIds },
    });

    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No valid users found.",
      });
    }

    /*
     * Existing attendee IDs
     */
    const existingUserIds = event.attendees
      .filter((attendee) => attendee.user)
      .map((attendee) => attendee.user.toString());

    const newAttendees = [];

    for (const user of users) {
      const userId = user._id.toString();

      /*
       * Organizer should not be added as an attendee
       */
      if (
        event.organizer &&
        userId === event.organizer.toString()
      ) {
        continue;
      }

      /*
       * Avoid duplicate invitations
       */
      if (existingUserIds.includes(userId)) {
        continue;
      }

      newAttendees.push({
        user: user._id,
        email: user.email || "",
        name: user.fullName || "",
        role: user.role || "",
        response: "pending",
      });
    }

    if (newAttendees.length === 0) {
      return res.status(400).json({
        success: false,
        message: "All selected users are already attendees or are the organizer.",
      });
    }

    event.attendees.push(...newAttendees);

    await event.save();

    const updatedEvent = await populateEvent(
      CalendarEvent.findById(event._id)
    );

    return res.status(200).json({
      success: true,
      message: `${newAttendees.length} invitation(s) added successfully.`,
      invitationsAdded: newAttendees.length,
      event: updatedEvent,
    });
  } catch (error) {
    return handleError(
      res,
      "Failed to invite attendees.",
      error
    );
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

      const updatedEvent = await populateEvent(
        CalendarEvent.findById(event._id)
      );

      return res.status(200).json({
        success: true,
        message: `Invitation response updated to ${response}.`,
        event: updatedEvent,
      });
    } catch (error) {
      return handleError(
        res,
        "Failed to update invitation response.",
        error
      );
    }
  }
);


/*
|--------------------------------------------------------------------------
| DELETE /api/calendar/:id/invitations/:userId
| Remove an attendee from an event
|--------------------------------------------------------------------------
*/

router.delete(
  "/:id/invitations/:userId",
  async (req, res) => {
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
      return handleError(
        res,
        "Failed to remove attendee.",
        error
      );
    }
  }
);


/*
|--------------------------------------------------------------------------
| GET /api/calendar/user/:userId
| Get events where a user is organizer or attendee
|--------------------------------------------------------------------------
*/

router.get("/user/:userId", async (req, res) => {
  try {
    const { userId } = req.params;

    if (!isValidObjectId(userId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid user ID.",
      });
    }

    const events = await populateEvent(
      CalendarEvent.find({
        $or: [
          { organizer: userId },
          { "attendees.user": userId },
        ],
      }).sort({ startAt: 1 })
    );

    return res.status(200).json({
      success: true,
      count: events.length,
      events,
    });
  } catch (error) {
    return handleError(
      res,
      "Failed to retrieve user's calendar events.",
      error
    );
  }
});


/*
|--------------------------------------------------------------------------
| GET /api/calendar/organization/:organizationId
| Get organization calendar events
|--------------------------------------------------------------------------
*/

router.get(
  "/organization/:organizationId",
  async (req, res) => {
    try {
      const { organizationId } = req.params;

      if (!isValidObjectId(organizationId)) {
        return res.status(400).json({
          success: false,
          message: "Invalid organization ID.",
        });
      }

      const events = await populateEvent(
        CalendarEvent.find({
          organization: organizationId,
        }).sort({ startAt: 1 })
      );

      return res.status(200).json({
        success: true,
        count: events.length,
        events,
      });
    } catch (error) {
      return handleError(
        res,
        "Failed to retrieve organization calendar events.",
        error
      );
    }
  }
);


/*
|--------------------------------------------------------------------------
| PATCH /api/calendar/:id/status
| Change event status
|--------------------------------------------------------------------------
*/

router.patch("/:id/status", async (req, res) => {
  try {
    const { id } = req.params;
    const { status, updatedBy } = req.body;

    if (!isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid calendar event ID.",
      });
    }

    const allowedStatuses = [
      "scheduled",
      "ongoing",
      "completed",
      "cancelled",
    ];

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid status. Use scheduled, ongoing, completed or cancelled.",
      });
    }

    if (updatedBy && !isValidObjectId(updatedBy)) {
      return res.status(400).json({
        success: false,
        message: "Invalid updatedBy user ID.",
      });
    }

    const updateData = {
      status,
    };

    if (updatedBy) {
      updateData.updatedBy = updatedBy;
    }

    const event = await CalendarEvent.findByIdAndUpdate(
      id,
      updateData,
      {
        new: true,
        runValidators: true,
      }
    );

    if (!event) {
      return res.status(404).json({
        success: false,
        message: "Calendar event not found.",
      });
    }

    const updatedEvent = await populateEvent(
      CalendarEvent.findById(event._id)
    );

    return res.status(200).json({
      success: true,
      message: "Calendar event status updated successfully.",
      event: updatedEvent,
    });
  } catch (error) {
    return handleError(
      res,
      "Failed to update calendar event status.",
      error
    );
  }
});


/*
|--------------------------------------------------------------------------
| EXPORT ROUTER
|--------------------------------------------------------------------------
*/

module.exports = router;
