const express = require("express");
const mongoose = require("mongoose");

const CalendarEvent = require("../models/CalendarEvent");

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
      .populate("organization");

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
      .populate("organization");

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
      .populate("organization");

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
