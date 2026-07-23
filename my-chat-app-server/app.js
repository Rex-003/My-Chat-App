require("dotenv").config();
const express = require("express");
const bcryptjs = require("bcryptjs");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const cors = require("cors");

const app = express();

require("./db/connections");
const Users = require("./models/Users");
const Conversations = require("./models/Conversations");
const Messages = require("./models/Messages");

const port = process.env.PORT || 8000;

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(
  cors({
    origin: process.env.CLIENT_URI || "http://localhost:5173",
    credentials: true,
  }),
);

const isValidId = (id) => mongoose.Types.ObjectId.isValid(id);

app.get("/", (req, res) => {
  res.send("Welcome");
});

app.post("/api/register", async (req, res) => {
  try {
    const { fullName, email, password } = req.body;

    if (!fullName || !email || !password) {
      return res.status(400).send("Please fill all the required fields");
    }

    const isAlreadyExist = await Users.findOne({ email });
    if (isAlreadyExist) {
      return res.status(400).send("User Already Exist");
    }

    const newUser = new Users({ fullName, email });

    bcryptjs.hash(password, 10, async (err, hashedPassword) => {
      if (err) return res.status(500).send("Error hashing password");
      newUser.set("password", hashedPassword);
      await newUser.save();
      const payload = {
        userId: newUser._id,
        email: newUser.email,
      };

      const JWT_SECRET_KEY = process.env.JWT_SECRET_KEY;

      jwt.sign(
        payload,
        JWT_SECRET_KEY,
        { expiresIn: 84600 },
        async (err, token) => {
          if (err) return res.status(500).send("Error generating token");
          await Users.updateOne({ _id: newUser._id }, { $set: { token } });
          return res.status(200).json({
            user: {
              _id: newUser._id,
              fullName: newUser.fullName,
              email: newUser.email,
            },
            token,
          });
        },
      );
    });
  } catch (error) {
    console.log(error);
    res.status(500).send("Internal server error");
  }
});

app.post("/api/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).send("Please fill all the required fields");
    }

    const user = await Users.findOne({ email });
    if (!user) {
      return res.status(400).send("User email or password is incorrect");
    }

    const isMatch = await bcryptjs.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).send("User email or password is incorrect");
    }

    const payload = {
      userId: user._id,
      email: user.email,
    };

    const JWT_SECRET_KEY =
      process.env.JWT_SECRET_KEY || "THIS_IS_A_JWT_SECRET_KEY";

    jwt.sign(
      payload,
      JWT_SECRET_KEY,
      { expiresIn: 84600 },
      async (err, token) => {
        if (err) return res.status(500).send("Error generating token");
        await Users.updateOne({ _id: user._id }, { $set: { token } });
        return res.status(200).json({
          user: { _id: user._id, fullName: user.fullName, email: user.email },
          token,
        });
      },
    );
  } catch (error) {
    console.log(error);
    res.status(500).send("Internal server error");
  }
});

app.post("/api/conversation", async (req, res) => {
  try {
    const { senderId, receiverId } = req.body;

    if (!isValidId(senderId) || !isValidId(receiverId)) {
      return res.status(400).json({ error: "Invalid user ID format" });
    }

    const newConversation = new Conversations({
      members: [senderId, receiverId],
    });
    await newConversation.save();
    res.status(200).send("Conversation created Successfully");
  } catch (error) {
    console.log(error);
    res.status(500).send("Internal server error");
  }
});

app.get("/api/conversation/:userId", async (req, res) => {
  try {
    const userId = req.params.userId;

    if (!isValidId(userId)) {
      return res.status(400).json({ error: "Invalid user ID format" });
    }

    const conversations = await Conversations.find({
      members: { $in: [userId] },
    });

    const conversationUserData = await Promise.all(
      conversations.map(async (conversation) => {
        const receiverId = conversation.members.find(
          (member) => member != userId,
        );

        if (!isValidId(receiverId)) return null;

        const user = await Users.findById(receiverId);
        return {
          user: {
            receiverId: user._id,
            email: user.email,
            fullName: user.fullName,
          },
          conversationId: conversation._id,
        };
      }),
    );

    res.status(200).json(conversationUserData.filter(Boolean));
  } catch (error) {
    console.log(error);
    res.status(500).send("Internal server error");
  }
});

app.post("/api/message", async (req, res) => {
  try {
    const { conversationId, senderId, message, receiverId = "" } = req.body;
    if (!isValidId(senderId)) {
      return res.status(400).json({ error: "Invalid sender ID format" });
    }
    if (!senderId || !message)
      return res.status(400).send("Please fill all required fields");
    if (conversationId === "new" && receiverId) {
      const newConversation = new Conversations({
        members: [senderId, receiverId],
      });
      await newConversation.save();
      const newMessage = new Messages({
        conversationId: newConversation._id,
        senderId,
        message,
      });
      await newMessage.save();
      return res.status(200).send("Message sent succesfully");
    } else if (!conversationId && !receiverId) {
      return res.status(400).send("please fill all the required fields");
    }

    const newMessage = new Messages({ conversationId, senderId, message });
    await newMessage.save();
    res.status(200).send("Message sent successfully");
  } catch (error) {
    console.log(error);
    res.status(500).send("Internal server error");
  }
});

app.get("/api/message/:conversationId", async (req, res) => {
  try {
    const conversationId = req.params.conversationId;

    const checkMessages = async (conversationId) => {
      const messages = await Messages.find({ conversationId });
      const messageUserData = await Promise.all(
        messages.map(async (message) => {
          if (!isValidId(message.senderId)) return null;
          const user = await Users.findById(message.senderId);
          return {
            user: { id: user._id, email: user.email, fullName: user.fullName },
            message: message.message,
          };
        }),
      );
      res.status(200).json(messageUserData.filter(Boolean));
    };

    if (conversationId === "new") {
      const checkConversation = await Conversations.find({
        members: { $all: [req.query.senderId, req.query.receiverId] },
      });
      if (checkConversation.length > 0) {
        checkMessages(checkConversation[0]._id);
      } else {
        return res.status(200).json([]);
      }
    } else {
      if (!isValidId(conversationId)) {
        return res
          .status(400)
          .json({ error: "Invalid conversation ID format" });
      }
      checkMessages(conversationId);
    }
  } catch (error) {
    console.log(error);
    res.status(500).send("Internal server error");
  }
});

app.get("/api/users/:userId", async (req, res) => {
  try {
    const userId = req.params.userId;
    const users = await Users.find({ _id: { $ne: userId } });
    const usersData = await Promise.all(
      users.map(async (user) => {
        return {
          userId: user?._id,
          user: {
            email: user.email,
            fullName: user.fullName,
            receiverId: user._id,
          },
        };
      }),
    );
    res.status(200).json(await usersData);
  } catch (error) {
    console.log(error);
  }
});

const server = app.listen(port, () => {
  console.log(`Server running on ${port}`);
});

const io = require("socket.io")(server, {
  cors: {
    origin: process.env.CLIENT_URI,
    methods: ["GET", "POST"],
  },
});

// Socket.io
let users = [];

io.on("connection", (socket) => {
  socket.on("addUser", (userId) => {
    const existingUser = users.find((u) => u.userId === userId);
    if (existingUser) {
      existingUser.socketId = socket.id; // refresh to the new connection
    } else {
      users.push({ userId, socketId: socket.id });
    }
    io.emit("getUsers", users);
  });

  socket.on(
    "sendMessage",
    async ({ senderId, receiverId, message, conversationId }) => {
      try {
        const receiver = users.find((u) => u.userId === receiverId);
        const sender = users.find((u) => u.userId === senderId);
        const user = await Users.findById(senderId);
        if (!user) return;

        const payload = {
          senderId,
          message,
          conversationId,
          receiverId,
          user: {
            id: user._id,
            fullName: user.fullName,
            email: user.email,
          },
        };

        if (receiver) io.to(receiver.socketId).emit("getMessage", payload);
      } catch (err) {
        console.error("sendMessage error:", err);
      }
    },
  );
  socket.on("disconnect", () => {
    users = users.filter((user) => user.socketId !== socket.id);
    io.emit("getUsers", users);
  });
});
