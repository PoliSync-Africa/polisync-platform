const express = require("express");
const mongoose = require("mongoose");

const router = express.Router();

const Notification = require("../models/Notification");
const User = require("../models/User");
const CalendarEvent = require("../models/CalendarEvent");

/*
|--------------------------------------------------------------------------
| HELPERS
|--------------------------------------------------------------------------
*/

const isValidObjectId = (id) => {
  return mongoose.Types.ObjectId.isValid(id);
};

const populateNotification = (query) => {
  return query
    .populate("recipient", "fullName email role")
    .populate("createdBy", "fullName email role")
    .populate("event", "title startAt endAt eventType location");
};


/*
|--------------------------------------------------------------------------
| GET /api/notifications
| Get notifications for a user
|--------------------------------------------------------------------------
*/

router.get("/", async (req, res) => {
  try {
    const {
      recipient,
      read,
      status,
      type,
      channel,
      limit = 50,
      page = 1,
    } = req.query;

    const filter = {};

    if (!recipient) {
      return res.status(400).json({
        success: false,
        message: "Recipient user ID is required.",
      });
    }

    if (!isValidObjectId(recipient)) {
      return res.status(400).json({
        success: false,
        message: "Invalid recipient user ID.",
      });
    }

    filter.recipient = recipient;

    if (read !== undefined) {
      filter.read = read === "true";
    }

    if (status) {
      filter.status = status;
    }

    if (type) {
      filter.type = type;
    }

    if (channel) {
      filter.channel = channel;
    }

    const safeLimit = Math.min(
      Math.max(parseInt(limit, 10) || 50, 1),
      100
    );

    const safePage = Math.max(
      parseInt(page, 10) || 1,
      1
    );

    const skip = (safePage - 1) * safeLimit;

    const [notifications, total] = await Promise.all([
      populateNotification(
        Notification.find(filter)
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(safeLimit)
      ),

      Notification.countDocuments(filter),
    ]);

    return res.status(200).json({
      success: true,
      count: notifications.length,
      total,
      page: safePage,
      pages: Math.ceil(total / safeLimit),
      notifications,
    });
  } catch (error) {
    console.error(
      "GET NOTIFICATIONS ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Failed to retrieve notifications.",
      error: error.message,
    });
  }
});


/*
|--------------------------------------------------------------------------
| GET /api/notifications/unread/:userId
| Get unread notifications
|--------------------------------------------------------------------------
*/

router.get("/unread/:userId", async (req, res) => {
  try {
    const { userId } = req.params;

    if (!isValidObjectId(userId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid user ID.",
      });
    }

    const notifications = await populateNotification(
      Notification.find({
        recipient: userId,
        read: false,
      }).sort({ createdAt: -1 })
    );

    return res.status(200).json({
      success: true,
      count: notifications.length,
      notifications,
    });
  } catch (error) {
    console.error(
      "GET UNREAD NOTIFICATIONS ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Failed to retrieve unread notifications.",
      error: error.message,
    });
  }
});


/*
|--------------------------------------------------------------------------
| GET /api/notifications/count/:userId
| Get unread notification count
|--------------------------------------------------------------------------
*/

router.get("/count/:userId", async (req, res) => {
  try {
    const { userId } = req.params;

    if (!isValidObjectId(userId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid user ID.",
      });
    }

    const count = await Notification.countDocuments({
      recipient: userId,
      read: false,
    });

    return res.status(200).json({
      success: true,
      count,
    });
  } catch (error) {
    console.error(
      "GET NOTIFICATION COUNT ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Failed to retrieve notification count.",
      error: error.message,
    });
  }
});


/*
|--------------------------------------------------------------------------
| GET /api/notifications/:id
| Get one notification
|--------------------------------------------------------------------------
*/

router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid notification ID.",
      });
    }

    const notification = await populateNotification(
      Notification.findById(id)
    );

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: "Notification not found.",
      });
    }

    return res.status(200).json({
      success: true,
      notification,
    });
  } catch (error) {
    console.error(
      "GET NOTIFICATION ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Failed to retrieve notification.",
      error: error.message,
    });
  }
});


/*
|--------------------------------------------------------------------------
| POST /api/notifications
| Create a notification
|--------------------------------------------------------------------------
*/

router.post("/", async (req, res) => {
  try {
    const {
      recipient,
      event,
      type,
      channel,
      title,
      message,
      status,
      scheduledFor,
      metadata,
      createdBy,
    } = req.body;

    if (!recipient) {
      return res.status(400).json({
        success: false,
        message: "Recipient is required.",
      });
    }

    if (!isValidObjectId(recipient)) {
      return res.status(400).json({
        success: false,
        message: "Invalid recipient user ID.",
      });
    }

    const recipientUser = await User.findById(
      recipient
    );

    if (!recipientUser) {
      return res.status(404).json({
        success: false,
        message: "Recipient user not found.",
      });
    }

    if (event && !isValidObjectId(event)) {
      return res.status(400).json({
        success: false,
        message: "Invalid calendar event ID.",
      });
    }

    if (event) {
      const calendarEvent =
        await CalendarEvent.findById(event);

      if (!calendarEvent) {
        return res.status(404).json({
          success: false,
          message: "Calendar event not found.",
        });
      }
    }

    if (createdBy && !isValidObjectId(createdBy)) {
      return res.status(400).json({
        success: false,
        message: "Invalid createdBy user ID.",
      });
    }

    if (!title || !message) {
      return res.status(400).json({
        success: false,
        message: "Notification title and message are required.",
      });
    }

    const notification =
      await Notification.create({
        recipient,
        event: event || null,
        type: type || "system",
        channel: channel || "in_app",
        title,
        message,
        status: status || "pending",
        scheduledFor:
          scheduledFor || null,
        metadata: metadata || {},
        createdBy:
          createdBy || null,
      });

    const createdNotification =
      await populateNotification(
        Notification.findById(
          notification._id
        )
      );

    return res.status(201).json({
      success: true,
      message: "Notification created successfully.",
      notification: createdNotification,
    });
  } catch (error) {
    console.error(
      "CREATE NOTIFICATION ERROR:",
      error
    );

    return res.status(400).json({
      success: false,
      message: "Failed to create notification.",
      error: error.message,
    });
  }
});


/*
|--------------------------------------------------------------------------
| PATCH /api/notifications/:id/read
| Mark one notification as read
|--------------------------------------------------------------------------
*/

router.patch("/:id/read", async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid notification ID.",
      });
    }

    const notification =
      await Notification.findByIdAndUpdate(
        id,
        {
          read: true,
          readAt: new Date(),
        },
        {
          new: true,
          runValidators: true,
        }
      );

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: "Notification not found.",
      });
    }

    const updatedNotification =
      await populateNotification(
        Notification.findById(
          notification._id
        )
      );

    return res.status(200).json({
      success: true,
      message: "Notification marked as read.",
      notification: updatedNotification,
    });
  } catch (error) {
    console.error(
      "MARK NOTIFICATION READ ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Failed to mark notification as read.",
      error: error.message,
    });
  }
});


/*
|--------------------------------------------------------------------------
| PATCH /api/notifications/:id/unread
| Mark one notification as unread
|--------------------------------------------------------------------------
*/

router.patch("/:id/unread", async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid notification ID.",
      });
    }

    const notification =
      await Notification.findByIdAndUpdate(
        id,
        {
          read: false,
          readAt: null,
        },
        {
          new: true,
          runValidators: true,
        }
      );

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: "Notification not found.",
      });
    }

    const updatedNotification =
      await populateNotification(
        Notification.findById(
          notification._id
        )
      );

    return res.status(200).json({
      success: true,
      message: "Notification marked as unread.",
      notification: updatedNotification,
    });
  } catch (error) {
    console.error(
      "MARK NOTIFICATION UNREAD ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Failed to mark notification as unread.",
      error: error.message,
    });
  }
});


/*
|--------------------------------------------------------------------------
| PATCH /api/notifications/user/:userId/read-all
| Mark all user notifications as read
|--------------------------------------------------------------------------
*/

router.patch(
  "/user/:userId/read-all",
  async (req, res) => {
    try {
      const { userId } = req.params;

      if (!isValidObjectId(userId)) {
        return res.status(400).json({
          success: false,
          message: "Invalid user ID.",
        });
      }

      const result =
        await Notification.updateMany(
          {
            recipient: userId,
            read: false,
          },
          {
            $set: {
              read: true,
              readAt: new Date(),
            },
          }
        );

      return res.status(200).json({
        success: true,
        message:
          "All notifications marked as read.",
        modifiedCount: result.modifiedCount,
      });
    } catch (error) {
      console.error(
        "MARK ALL NOTIFICATIONS READ ERROR:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Failed to mark all notifications as read.",
        error: error.message,
      });
    }
  }
);


/*
|--------------------------------------------------------------------------
| DELETE /api/notifications/:id
| Delete one notification
|--------------------------------------------------------------------------
*/

router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid notification ID.",
      });
    }

    const notification =
      await Notification.findByIdAndDelete(id);

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: "Notification not found.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Notification deleted successfully.",
    });
  } catch (error) {
    console.error(
      "DELETE NOTIFICATION ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Failed to delete notification.",
      error: error.message,
    });
  }
});


/*
|--------------------------------------------------------------------------
| DELETE /api/notifications/user/:userId
| Delete all notifications for a user
|--------------------------------------------------------------------------
*/

router.delete(
  "/user/:userId",
  async (req, res) => {
    try {
      const { userId } = req.params;

      if (!isValidObjectId(userId)) {
        return res.status(400).json({
          success: false,
          message: "Invalid user ID.",
        });
      }

      const result =
        await Notification.deleteMany({
          recipient: userId,
        });

      return res.status(200).json({
        success: true,
        message:
          "User notifications deleted successfully.",
        deletedCount: result.deletedCount,
      });
    } catch (error) {
      console.error(
        "DELETE USER NOTIFICATIONS ERROR:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Failed to delete user notifications.",
        error: error.message,
      });
    }
  }
);


/*
|--------------------------------------------------------------------------
| EXPORT ROUTER
|--------------------------------------------------------------------------
*/

module.exports = router;
