const express = require("express");
const app = express();
const axios = require("axios");
const cors = require("cors");
const mongoose = require("mongoose");
const rateLimit = require("express-rate-limit");
require("dotenv").config();
const querystring = require("querystring");
app.use(express.json());
const { EmbedBuilder } = require('discord.js');
const cron = require('node-cron');
const { CronJob } = require('cron');
const path = require('path');
const fs = require('fs');
const { Client, GatewayIntentBits } = require('discord.js');
const moment = require('moment');
const cookieParser = require('cookie-parser');
const config = require('./config.js');
const discord = require('./discord.js');
const storage = require('./storage.js');


app.use(cookieParser(config.COOKIE_SECRET));



let adminGlobalUser = null;
const allowedOrigin = "http://localhost:8080";
const validTokens = {};
const validUserTokens = {};
const clientId = process.env.DISCORD_CLIENT_ID;
const clientSecret = process.env.DISCORD_CLIENT_SECRET;
const redirectUri = "http://localhost:8081/callback";


const corsOptions = {
  origin: ["http://localhost:8080", "http://localhost:8081"],
  methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
  credentials: true,
  optionsSuccessStatus: 204,
};
app.use(cors(corsOptions));

app.get("/", (req, res) => {
  res.send("Hello, world!");
});

app.head("/", (req, res) => {
  res.send();
});

function allowAxios(req, res, next) {
  const userAgent = req.headers["user-agent"];

  const allowedBrowsers = [
    "Chrome",
    "Firefox",
    "Safari",
    "Edge",
    "Opera",
    "MSIE",
    "Trident",
    "Chromium",
  ];

  const isBrowserRequest = allowedBrowsers.some((browser) =>
    userAgent.includes(browser)
  );

  if (!userAgent.includes("axios") && !isBrowserRequest) {
    return res.status(403).json({ error: "Forbidden" });
  }

  next();
}

function validateOrigin(req, res, next) {
  const requestOrigin = req.headers.origin;
  const userAgent = req.headers["user-agent"];
  const allowedOrigins = [allowedOrigin, "http://localhost:8081"];

  if (
    allowedOrigins.includes(requestOrigin) ||
    (userAgent && userAgent.includes("okhttp/4.9.2"))
  ) {
    res.header("Access-Control-Allow-Origin", requestOrigin);
    res.header(
      "Access-Control-Allow-Methods",
      "GET,HEAD,PUT,PATCH,POST,DELETE"
    );
    res.header(
      "Access-Control-Allow-Headers",
      "Origin, X-Requested-With, Content-Type, Accept, Authorization"
    );
    next();
  } else {
    return res.status(403).json({ error: "Forbidden" });
  }
}
const limiter = rateLimit({
  windowMs: 60 * 1000,
  max: 150,
  message: "Too many requests from this IP, please try again later.",
});

mongoose
  .connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(async () => {
    console.log("MongoDB connected successfully");

    const defaultId = process.env.DEFAULT_ID;
    const adminDefaultId = process.env.ADMIN_DEFAULT_ID;

    try {
      const existingAccess = await AllowedAccess.findOne({ id: defaultId });
      if (!existingAccess) {
        await AllowedAccess.create({ id: defaultId });
        console.log(`Created AllowedAccess with ID: ${defaultId}`);
      } else {
        console.log(`AllowedAccess with ID: ${defaultId} already exists`);
      }

      const existingAdminAccess = await AdminWhitelist.findOne({
        id: adminDefaultId,
      });
      if (!existingAdminAccess) {
        await AdminWhitelist.create({ id: adminDefaultId });
        console.log(`Created AdminWhitelist with ID: ${adminDefaultId}`);
      } else {
        console.log(`AdminWhitelist with ID: ${adminDefaultId} already exists`);
      }
    } catch (error) {
      console.error("Error while checking or adding default IDs:", error);
    }
  })
  .catch((error) => {
    console.error("MongoDB connection error:", error);
  });

const userRoleSchema = new mongoose.Schema({
  user: {
    type: String,
    ref: "AllowedAccess",
  },
  roles: [
    {
      type: String,
    },
  ],
});

const UserRole = mongoose.model("UserRole", userRoleSchema);

const adminWhitelistSchema = new mongoose.Schema({
  id: String,
});

const AdminWhitelist = mongoose.model("AdminWhitelist", adminWhitelistSchema);

const allowedAccessSchema = new mongoose.Schema({
  id: String,
});

const AllowedAccess = mongoose.model("AllowedAccess", allowedAccessSchema);

const RolePageSchema = new mongoose.Schema({
  role: { type: String, required: true, unique: true },
  pages: {
    logs: { type: Boolean, default: false },
    admin: { type: Boolean, default: false },
    moderator: { type: Boolean, default: false },
    bot_management: { type: Boolean, default: false },
    community_events: { type: Boolean, default: false },
  },
});
const RolePage = mongoose.model("RolePage", RolePageSchema);

const AddToServerStatusSchema = new mongoose.Schema({
  status: {
    type: Boolean,
    default: false,
  },
});

const AddToServerStatus = mongoose.model(
  "AddToServerStatus",
  AddToServerStatusSchema
);

const roleSchema = new mongoose.Schema({
  role_name: { type: String, required: true, unique: true },
  price: { type: Number, required: true },
  role_id: { type: String, required: true },
});

const Role = mongoose.model("Role", roleSchema);

const UserSchema = new mongoose.Schema({
  user_id: { type: String, unique: true },
  points: { type: Number, default: 0 },
  roles: { type: [String], default: [] },
});

const User = mongoose.model("User", UserSchema);

const moderationSchema = new mongoose.Schema({
  id: Number,
  user_id: String,
  type: {
    type: String,
    enum: ['WARN', 'MUTE', 'BAN', 'KICK', 'INFO'],
    required: true
  },
  duration: String,
  reason: String,
  evidence: String,
  moderator: String,
  date: { type: Date, default: Date.now }
});

const Moderation = mongoose.model('Moderation', moderationSchema);

const counterSchema = new mongoose.Schema({
  _id: { type: String, required: true },
  seq: { type: Number, default: 0 }
});

const Counter = mongoose.model('Counter', counterSchema);

const moderationSetupSchema = new mongoose.Schema({
  muted_role: { type: String, required: true },
});

const ModerationSetup = mongoose.model('ModerationSetup', moderationSetupSchema);
const DISCORD_API_BASE_URL = 'https://discord.com/api/v10';



const DataSetupSchema = new mongoose.Schema({
  discordClientId: { type: String, required: false },
  discordClientSecret: { type: String, required: false },
  guildId: { type: String, required: false },
  staffList: { type: String, required: false },
  communityRules: { type: String, required: false },
});

const DataSetup = mongoose.model('DataSetup', DataSetupSchema);

const commandSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  route: { type: String, required: true }
});

const Command = mongoose.model('Command', commandSchema);


const disabledCommandSchema = new mongoose.Schema({
  commandName: {
    type: String,
    required: true,
    unique: true,
  },
}, { timestamps: true });

const DisabledCommand = mongoose.model('DisabledCommand', disabledCommandSchema);


const EventSetupSchema = new mongoose.Schema({
  event_announcements: {
    type: [String],
    required: true
  },
  event_waiting_zone: {
    type: Boolean,
    default: false
  },
  event_call: {
    type: Boolean,
    default: false
  },
  event_results: {
    type: Boolean,
    default: false
  },
  nb_match_channels: {
    type: Number,
    default: 0
  },
  nb_team_channels: {
    type: Number,
    default: 0
  },
  team_announcement_channel: {
    type: Boolean,
    default: false
  },
  match_announcement_channel: {
    type: Boolean,
    default: false
  },
  match_result_channel: {
    type: Boolean,
    default: false
  }
});


const EventSetup = mongoose.model('EventSetup', EventSetupSchema);


const channelGroupSchema = new mongoose.Schema({
  group_name: { type: String, required: true },
  channel_id: [{ type: String, required: true }],
  enabled: { type: Boolean, default: false },
});

const ChannelGroup = mongoose.model('ChannelGroup', channelGroupSchema);

const contentSchema = new mongoose.Schema({
  content: { type: String, required: true }
});

const StaffList = mongoose.model('StaffList', contentSchema);
const CommunityRules = mongoose.model('CommunityRules', contentSchema);

const bannedUserSchema = new mongoose.Schema({
  user_id: { type: String, required: true, unique: true },
  banned_at: { type: Date, default: Date.now },
});

const BannedUser = mongoose.model('BannedUser', bannedUserSchema);


const PostSchema = new mongoose.Schema({
  post_id: { type: Number, unique: true },
  post_title: { type: String, required: true },
  post_content: { type: String, required: true },
  post_image: { type: String, default: null },
  post_author: { type: String, required: true },
  author_image: { type: String, required: true },
}, { timestamps: true });

const Post = mongoose.model('Post', PostSchema);



const PostCounterSchema = new mongoose.Schema({
  name: { type: String, required: true },
  seq: { type: Number, default: 0 }
});

const PostCounter = mongoose.model('PostCounter', PostCounterSchema);


const positionSchema = new mongoose.Schema({
  position_id: { type: String, required: true, unique: true },
  position_name: { type: String, required: true },
  questions: [{ type: String, required: true }],
  discord_channel: { type: String, required: true },
  position_image: { type: String, default: null },
  position_description: { type: String, default: null },
  status: { type: String, enum: ['open', 'closed'], default: 'open' }
}, { timestamps: true });

const Position = mongoose.model('Position', positionSchema);

const waitingTimeSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  startTime: { type: Date, required: true },
  endTime: { type: Date, required: true }
}, { timestamps: true });

const WaitingTime = mongoose.model('WaitingTime', waitingTimeSchema);

const announcementSchema = new mongoose.Schema({
  title: { type: String, required: true },
  content: { type: String, default: '' },
  image: { type: String, default: '' },
  author: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

const Announcement = mongoose.model('Announcement', announcementSchema);


const logSchema = new mongoose.Schema({
  id: { type: Number, required: true },
  moderator: { type: String, required: true },
  actionType: { type: String, required: true },
  reason: { type: String, required: false },
  details: { type: String, required: false },
  timestamp: { type: Date, default: Date.now }
});

const Log = mongoose.model('Log', logSchema);

async function getNextLogId() {
  const lastEntry = await Moderation.findOne({}, {}, { sort: { id: -1 } });
  return lastEntry && lastEntry.id ? lastEntry.id + 1 : 0;
}



app.post('/new-announcement', validateOrigin, limiter, async (req, res) => {
  const { title, content, image, author } = req.body;

  if (!title) {
    return res.status(400).json({ message: 'Title is required' });
  }

  if (!content && !image) {
    return res.status(400).json({ message: 'Either content or image must be provided' });
  }

  try {
    const newAnnouncement = new Announcement({
      title,
      content,
      image,
      author,
      createdAt: new Date()
    });
    await newAnnouncement.save();
    res.status(201).json({ message: 'Announcement created successfully', announcement: newAnnouncement });
  } catch (error) {
    console.error('Error creating announcement:', error);
    res.status(500).json({ message: 'Failed to create announcement' });
  }
});

app.get('/view-announcement', validateOrigin, limiter, async (req, res) => {
  try {
    const announcements = await Announcement.find().sort({ createdAt: -1 });
    res.status(200).json(announcements);
  } catch (error) {
    console.error('Error fetching announcements:', error);
    res.status(500).json({ message: 'Failed to fetch announcements' });
  }
});

app.delete('/delete-announcement/:id', validateOrigin, limiter, async (req, res) => {
  try {
    const { id } = req.params;
    await Announcement.findByIdAndDelete(id);
    res.status(200).json({ message: 'Announcement deleted successfully' });
  } catch (error) {
    console.error('Error deleting announcement:', error);
    res.status(500).json({ message: 'Failed to delete announcement' });
  }
});

app.put('/edit-announcement/:id', validateOrigin, limiter, async (req, res) => {
  const { id } = req.params;
  const { title, content, image, author } = req.body;

  try {
    await Announcement.findByIdAndUpdate(id, {
      title,
      content,
      image,
      author,
      createdAt: new Date()
    });
    res.status(200).json({ message: 'Announcement updated successfully' });
  } catch (error) {
    console.error('Error updating announcement:', error);
    res.status(500).json({ message: 'Failed to update announcement' });
  }
});


app.get('/linked-role', limiter, async (req, res) => {
  const { url, state } = discord.getOAuthUrl();
  res.cookie('clientState', state, { maxAge: 1000 * 60 * 5, signed: true });
  res.redirect(url);
});

app.get('/discord-oauth-callback', limiter, async (req, res) => {
  try {
    const code = req.query['code'];
    const discordState = req.query['state'];
    const { clientState } = req.signedCookies;

    if (clientState !== discordState) {
      console.error('State verification failed.');
      return res.sendStatus(403);
    }

    const tokens = await discord.getOAuthTokens(code);
    const meData = await discord.getUserData(tokens);
    const userId = meData.user.id;

    await storage.storeDiscordTokens(userId, {
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      expires_at: Date.now() + tokens.expires_in * 1000,
    });

    await updateMetadata(userId);
    res.send('You did it! Now go back to Discord.');
  } catch (e) {
    console.error(e);
    res.sendStatus(500);
  }
});

app.post('/update-metadata', limiter, async (req, res) => {
  try {
    const userId = req.body.userId;
    await updateMetadata(userId);
    res.sendStatus(204);
  } catch (e) {
    console.error(e);
    res.sendStatus(500);
  }
});

async function updateMetadata(userId) {
  try {
    const tokens = await storage.getDiscordTokens(userId);
    const metadata = {
      cookieseaten: 1483,
      allergictonuts: 0,
      firstcookiebaked: '2003-12-20',
    };
    await discord.pushMetadata(userId, tokens, metadata);
  } catch (e) {
    console.error(`Error updating metadata: ${e.message}`);
  }
}

const getNextSequence = async (name) => {
  const counter = await PostCounter.findOneAndUpdate(
    { name },
    { $inc: { seq: 1 } },
    { new: true, upsert: true }
  );
  return counter.seq;
};






app.post('/waiting-time/:username', limiter, validateOrigin, async (req, res) => {
  const { username } = req.params;
  const twoWeeks = 1000 * 60 * 60 * 24 * 14;

  try {
    const endTime = new Date(Date.now() + twoWeeks);

    await WaitingTime.findOneAndUpdate(
      { username },
      { startTime: new Date(), endTime },
      { upsert: true, new: true }
    );

    res.status(200).json({ message: 'Cooldown set', timeLeft: moment(endTime).fromNow() });
  } catch (error) {
    console.error('Error setting waiting time:', error);
    res.status(500).json({ message: 'Failed to set waiting time' });
  }
});


app.get('/waiting-time/:username', limiter, validateOrigin, async (req, res) => {
  const { username } = req.params;

  try {
    let waitingTime = await WaitingTime.findOne({ username });

    if (!waitingTime) {
      waitingTime = new WaitingTime({
        username,
        startTime: new Date(),
        endTime: new Date()
      });
      await waitingTime.save();
      return res.status(200).json({ username, timeLeft: 'No waiting time' });
    }

    const now = new Date();
    const endTime = new Date(waitingTime.endTime);
    if (endTime > now) {
      const timeLeft = moment(endTime).fromNow();
      res.status(200).json({ username, timeLeft });
    } else {
      waitingTime.endTime = new Date();
      await waitingTime.save();
      res.status(200).json({ username, timeLeft: 'No waiting time' });
    }
  } catch (error) {
    console.error('Error fetching waiting time:', error);
    res.status(500).json({ message: 'Failed to fetch waiting time' });
  }
});



app.delete('/waiting-time/:username', limiter, validateOrigin, async (req, res) => {
  const { username } = req.params;

  try {
    await WaitingTime.findOneAndDelete({ username });
    res.status(200).json({ message: 'Cooldown removed' });
  } catch (error) {
    console.error('Error removing waiting time:', error);
    res.status(500).json({ message: 'Failed to remove waiting time' });
  }
});


const job = new CronJob('* * * * *', async () => {
  try {
    const now = new Date();
    await WaitingTime.deleteMany({ endTime: { $lt: now } });
  } catch (error) {
    console.error('Error removing expired waiting times:', error);
  }
});

job.start();


app.post('/new-position', limiter, validateOrigin, async (req, res) => {
  const { position_name, questions, discord_channel, position_image, position_description, status } = req.body;

  try {
    const totalPositions = await Position.countDocuments();

    if (totalPositions >= 10) {
      return res.status(400).json({ message: 'You can only create up to 10 positions' });
    }

    const position_id = totalPositions + 1;

    const existingPosition = await Position.findOne({ position_name });

    if (existingPosition) {
      existingPosition.position_name = position_name;
      existingPosition.questions = questions;
      existingPosition.discord_channel = discord_channel;
      existingPosition.position_image = position_image || existingPosition.position_image;
      existingPosition.position_description = position_description || existingPosition.position_description;
      existingPosition.status = status || existingPosition.status;

      await existingPosition.save();

      return res.status(200).json({
        message: 'Position updated successfully',
        position: {
          position_id: existingPosition.position_id,
          position_name: existingPosition.position_name,
          questions: existingPosition.questions,
          discord_channel: existingPosition.discord_channel,
          position_image: existingPosition.position_image,
          position_description: existingPosition.position_description,
          status: existingPosition.status
        }
      });
    }

    const newPosition = new Position({
      position_id,
      position_name,
      questions,
      discord_channel,
      position_image: position_image || null,
      position_description: position_description || null,
      status: status || 'open'
    });

    await newPosition.save();

    res.status(201).json({
      message: 'Position created successfully',
      position: {
        position_id: newPosition.position_id,
        position_name: newPosition.position_name,
        questions: newPosition.questions,
        discord_channel: newPosition.discord_channel,
        position_image: newPosition.position_image,
        position_description: newPosition.position_description,
        status: newPosition.status
      }
    });
  } catch (error) {
    console.error('Error creating or updating position:', error);
    res.status(500).json({ message: 'Failed to create or update position' });
  }
});



app.get('/all-positions', limiter, validateOrigin, async (req, res) => {
  try {
    const positions = await Position.find({}, { _id: 0, __v: 0 }).lean();
    res.status(200).json(positions);
  } catch (error) {
    console.error('Error fetching positions:', error);
    res.status(500).json({ message: 'Failed to fetch positions' });
  }
});

app.get('/position-info/:positionName', limiter, validateOrigin, async (req, res) => {
  const { positionName } = req.params;

  try {
    const position = await Position.findOne({ position_name: positionName }, { _id: 0, __v: 0 }).lean();
    if (!position) {
      return res.status(404).json({ message: 'Position not found' });
    }
    res.status(200).json(position);
  } catch (error) {
    console.error('Error fetching position info:', error);
    res.status(500).json({ message: 'Failed to fetch position info' });
  }
});

app.delete('/delete-position/:position_name', limiter, validateOrigin, async (req, res) => {
  const { position_name } = req.params;

  try {
    const deletedPosition = await Position.findOneAndDelete({ position_name });

    if (!deletedPosition) {
      return res.status(404).json({ message: 'Position not found' });
    }

    res.status(200).json({ message: 'Position deleted successfully' });
  } catch (error) {
    console.error('Error deleting position:', error);
    res.status(500).json({ message: 'Failed to delete position' });
  }
});

app.post('/apply-position/:position_name', limiter, validateOrigin, async (req, res) => {
  const { position_name } = req.params;
  const { application, application_author } = req.body;

  try {
    const position = await Position.findOne({ position_name });

    if (!position) {
      return res.status(404).json({ message: 'Position not found' });
    }

    const embed = {
      title: `New application: ${position_name}`,
      description: position.questions.map((question, index) => `**${question}:** ${application[index] || 'No response'}`).join('\n'),
      color: 15158332,
      thumbnail: {
        url: position.position_image || ''
      },
      footer: {
        text: `Applied by: ${application_author || 'Anonymous'}`
      },
      timestamp: new Date().toISOString()
    };

    await axios.post(
      `https://discord.com/api/v10/channels/${position.discord_channel}/messages`,
      {
        embeds: [embed],
      },
      {
        headers: {
          Authorization: `Bot ${DISCORD_BOT_TOKEN}`,
          'Content-Type': 'application/json',
        },
      }
    );

    res.status(200).json({ message: 'Application received and sent to Discord successfully' });
  } catch (error) {
    console.error('Error applying for position:', error);
    res.status(500).json({ message: 'Failed to submit application' });
  }
});

app.delete('/delete-post/:id', limiter, validateOrigin, async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      return res.status(400).json({ message: 'Invalid post ID' });
    }

    const deletedPost = await Post.findOneAndDelete({ post_id: id });

    if (deletedPost) {
      res.status(200).json({ message: 'Post deleted successfully' });
    } else {
      res.status(404).json({ message: 'Post not found' });
    }
  } catch (error) {
    console.error('Error deleting post:', error);
    res.status(500).json({ message: 'Failed to delete post' });
  }
});




app.post('/new-post', limiter, validateOrigin, async (req, res) => {
  const { post_title, post_content, post_image, post_author, author_image } = req.body;

  if (!post_title || post_title.trim() === '') {
    return res.status(400).json({ message: 'Post title is required.' });
  }

  const hasContent = post_content && post_content.trim() !== '';
  const hasImage = post_image && post_image.trim() !== '';

  if (!(hasContent || hasImage)) {
    return res.status(400).json({ message: 'Either post content or post image is required.' });
  }

  try {
    const post_id = await getNextSequence('post_id');

    const newPost = new Post({
      post_id,
      post_title,
      post_content: hasContent ? post_content : null,
      post_image: hasImage ? post_image : null,
      post_author,
      author_image,
    });

    await newPost.save();
    const postResponse = newPost.toObject();
    delete postResponse._id;
    delete postResponse.__v;

    res.status(201).json({ message: 'Post created successfully', post: postResponse });
  } catch (error) {
    console.error('Error creating post:', error);
    res.status(500).json({ message: 'Failed to create post' });
  }
});




app.get('/all-posts', limiter, validateOrigin, async (req, res) => {
  try {
    const posts = await Post.find()
      .sort({ createdAt: -1 })
      .select('-__v');
    
    res.status(200).json(posts);
  } catch (error) {
    console.error('Error fetching posts:', error);
    res.status(500).json({ message: 'Failed to fetch posts' });
  }
});



app.post('/ban-user', limiter, validateOrigin, async (req, res) => {
  const { userId } = req.body;

  if (!userId) {
    return res.status(400).json({ error: 'User ID is required' });
  }

  try {
    const bannedUser = new BannedUser({ user_id: userId });
    await bannedUser.save();
    res.status(201).json({ message: 'User banned successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to ban user' });
  }
});




app.post('/unban-user', limiter, validateOrigin, async (req, res) => {
  const { userId } = req.body;

  if (!userId) {
    return res.status(400).json({ error: 'User ID is required' });
  }

  try {
    await BannedUser.deleteOne({ user_id: userId });
    res.status(200).json({ message: 'User unbanned successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to unban user' });
  }
});

app.get('/banned-users', limiter, validateOrigin, async (req, res) => {
  try {
    const bannedUsers = await BannedUser.find({});
    res.status(200).json(bannedUsers.map(user => user.user_id));
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch banned users' });
  }
});

const GUILD_ID = process.env.GUILD_ID;
const DISCORD_BOT_TOKEN = process.env.DISCORD_BOT_TOKEN;

const getNextId = async () => {
  try {
    const counter = await Counter.findByIdAndUpdate(
      { _id: 'moderationId' },
      { $inc: { seq: 1 } },
      { new: true, upsert: true }
    );

    return counter.seq;
  } catch (error) {
    console.error('Error getting next ID:', error);
    throw new Error('Internal Server Error');
  }
};


let botClient;

const customCommands = new Map();
const commandsDirectory = path.join(__dirname, 'custom_commands');

fs.readdirSync(commandsDirectory).forEach(file => {
  if (file.endsWith('.js')) {
    const command = require(path.join(commandsDirectory, file));
    customCommands.set(command.name, command);
  }
});


app.post('/staff-list', limiter, validateOrigin, async (req, res) => {
  const { content } = req.body;

  if (!content) {
    return res.status(400).json({ error: 'Content is required' });
  }

  try {
    const newStaffList = new StaffList({ content });
    await newStaffList.save();
    res.status(201).json({ message: 'Staff list updated successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update staff list' });
  }
});

app.get('/staff-list', limiter, validateOrigin, async (req, res) => {
  try {
    const staffList = await StaffList.findOne().sort({ _id: -1 });
    if (!staffList) {
      return res.status(404).json({ message: 'No staff list found' });
    }
    res.status(200).json(staffList);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch staff list' });
  }
});


app.post('/community-rules', limiter, validateOrigin, async (req, res) => {
  const { content } = req.body;

  if (!content) {
    return res.status(400).json({ error: 'Content is required' });
  }

  try {
    const newCommunityRules = new CommunityRules({ content });
    await newCommunityRules.save();
    res.status(201).json({ message: 'Community rules updated successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update community rules' });
  }
});

app.get('/community-rules', limiter, validateOrigin, async (req, res) => {
  try {
    const communityRules = await CommunityRules.findOne().sort({ _id: -1 });
    if (!communityRules) {
      return res.status(404).json({ message: 'No community rules found' });
    }
    res.status(200).json(communityRules);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch community rules' });
  }
});

const deleteWithRateLimit = async (url, method, headers, data = null) => {
  try {
    await axios({ url, method, headers, data });
    await new Promise(resolve => setTimeout(resolve, 200));
  } catch (error) {
    console.error(`Error with ${method} request to ${url}:`, error.response ? error.response.data : error);
    throw error;
  }
};

app.post('/delete-event', limiter, validateOrigin, async (req, res) => {
  try {
    const guildId = process.env.GUILD_ID;
    const botToken = process.env.DISCORD_BOT_TOKEN;
    const discordApiUrl = `https://discord.com/api/v10/guilds/${guildId}/channels`;
    const rolesApiUrl = `https://discord.com/api/v10/guilds/${guildId}/roles`;

    const headers = {
      Authorization: `Bot ${botToken}`,
      'Content-Type': 'application/json',
    };

    const { data: existingChannels } = await axios.get(discordApiUrl, { headers });
    const { data: existingRoles } = await axios.get(rolesApiUrl, { headers });

    const eventCategory = existingChannels.find(channel => channel.name === 'Events' && channel.type === 4);
    if (eventCategory) {
      const channelsInCategory = existingChannels.filter(channel => channel.parent_id === eventCategory.id);

      for (const channel of channelsInCategory) {
        await deleteWithRateLimit(`https://discord.com/api/v10/channels/${channel.id}`, 'DELETE', headers);
      }

      await deleteWithRateLimit(`https://discord.com/api/v10/channels/${eventCategory.id}`, 'DELETE', headers);
    }

    const rolesToDelete = existingRoles.filter(role => role.name.startsWith('Team '));
    for (const role of rolesToDelete) {
      await deleteWithRateLimit(`https://discord.com/api/v10/guilds/${guildId}/roles/${role.id}`, 'DELETE', headers);
    }

    res.status(200).json({ message: 'Event channels, categories, and roles deleted successfully' });
  } catch (error) {
    console.error('Error in /delete-event route:', error.response ? error.response.data : error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.post('/delete-team', limiter, validateOrigin, async (req, res) => {
  try {
    const guildId = process.env.GUILD_ID;
    const botToken = process.env.DISCORD_BOT_TOKEN;
    const discordApiUrl = `https://discord.com/api/v10/guilds/${guildId}/channels`;

    const headers = {
      Authorization: `Bot ${botToken}`,
      'Content-Type': 'application/json',
    };

    const { data: existingChannels } = await axios.get(discordApiUrl, { headers });

    const teamsCategory = existingChannels.find(channel => channel.name === 'Teams' && channel.type === 4);
    if (teamsCategory) {
      const channelsInTeamsCategory = existingChannels.filter(channel => channel.parent_id === teamsCategory.id);

      for (const channel of channelsInTeamsCategory) {
        await deleteWithRateLimit(`https://discord.com/api/v10/channels/${channel.id}`, 'DELETE', headers);
      }

      await deleteWithRateLimit(`https://discord.com/api/v10/channels/${teamsCategory.id}`, 'DELETE', headers);
    }

    res.status(200).json({ message: 'Team channels deleted successfully' });
  } catch (error) {
    console.error('Error in /delete-team route:', error.response ? error.response.data : error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});


app.post('/delete-roles', limiter, validateOrigin, async (req, res) => {
  try {
    const guildId = process.env.GUILD_ID;
    const botToken = process.env.DISCORD_BOT_TOKEN;
    const rolesApiUrl = `https://discord.com/api/v10/guilds/${guildId}/roles`;

    const headers = {
      Authorization: `Bot ${botToken}`,
      'Content-Type': 'application/json',
    };

    const { data: existingRoles } = await axios.get(rolesApiUrl, { headers });

    const rolesToDelete = existingRoles.filter(role => role.name.startsWith('Team '));
    for (const role of rolesToDelete) {
      await deleteWithRateLimit(`https://discord.com/api/v10/guilds/${guildId}/roles/${role.id}`, 'DELETE', headers);
    }

    res.status(200).json({ message: 'Team roles deleted successfully' });
  } catch (error) {
    console.error('Error in /delete-roles route:', error.response ? error.response.data : error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});



app.post('/delete-match', limiter, validateOrigin, async (req, res) => {
  try {
    const guildId = process.env.GUILD_ID;
    const botToken = process.env.DISCORD_BOT_TOKEN;
    const discordApiUrl = `https://discord.com/api/v10/guilds/${guildId}/channels`;

    const headers = {
      Authorization: `Bot ${botToken}`,
      'Content-Type': 'application/json',
    };

    const { data: existingChannels } = await axios.get(discordApiUrl, { headers });

    const matchesCategory = existingChannels.find(channel => channel.name === 'Matches' && channel.type === 4);
    if (matchesCategory) {
      const channelsInMatchesCategory = existingChannels.filter(channel => channel.parent_id === matchesCategory.id);

      for (const channel of channelsInMatchesCategory) {
        await deleteWithRateLimit(`https://discord.com/api/v10/channels/${channel.id}`, 'DELETE', headers);
      }

      await deleteWithRateLimit(`https://discord.com/api/v10/channels/${matchesCategory.id}`, 'DELETE', headers);
    }

    res.status(200).json({ message: 'Match channels deleted successfully' });
  } catch (error) {
    console.error('Error in /delete-match route:', error.response ? error.response.data : error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});


app.post('/set-teams', limiter, validateOrigin, async (req, res) => {
  try {
    const updatedTournamentSetup = await EventSetup.findOne({}).lean();

    if (!updatedTournamentSetup) {
      return res.status(404).json({ error: 'No tournament setup found' });
    }

    const guildId = process.env.GUILD_ID;
    const botToken = process.env.DISCORD_BOT_TOKEN;
    const discordApiUrl = `https://discord.com/api/v10/guilds/${guildId}/channels`;
    const rolesApiUrl = `https://discord.com/api/v10/guilds/${guildId}/roles`;

    const headers = {
      Authorization: `Bot ${botToken}`,
      'Content-Type': 'application/json',
    };

    const { data: existingChannels } = await axios.get(discordApiUrl, { headers });
    const { data: existingRoles } = await axios.get(rolesApiUrl, { headers });

    let teamsCategory = existingChannels.find(channel => channel.name === 'Teams' && channel.type === 4);
    if (!teamsCategory) {
      const { data: createdCategory } = await axios.post(
        discordApiUrl,
        { name: 'Teams', type: 4, reason: 'Teams category created' },
        { headers }
      );
      teamsCategory = createdCategory;
    }

    const channelsToCreate = [];

    for (let i = 1; i <= updatedTournamentSetup.nb_team_channels; i++) {
      const roleName = `Team ${i}`;
      let role = existingRoles.find(r => r.name === roleName);

      if (!role) {
        role = { id: null };
      }

      channelsToCreate.push({
        name: `team-${i}`,
        type: 0,
        parent_id: teamsCategory.id,
        permission_overwrites: [
          { id: role.id || guildId, allow: (1 << 10).toString() },
          { id: guildId, deny: (1 << 10).toString() },
        ],
        reason: `Team ${i} channel created`,
      });
    }

    if (updatedTournamentSetup.team_announcement_channel) {
      channelsToCreate.push({
        name: 'team-announcements',
        type: 5,
        parent_id: teamsCategory.id,
        reason: 'Team announcement channel created',
      });
    }

    const channelsToActuallyCreate = channelsToCreate.filter(
      channelData => !existingChannels.some(existingChannel => existingChannel.name === channelData.name && existingChannel.parent_id === channelData.parent_id)
    );

    const createdChannels = await Promise.all(
      channelsToActuallyCreate.map(channelData =>
        axios.post(discordApiUrl, channelData, { headers })
      )
    );

    res.status(200).json({
      message: 'Team channels created successfully',
      channels: createdChannels.map(response => response.data),
    });
  } catch (error) {
    console.error('Error in /set-teams route:', error.response ? error.response.data : error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});




app.post('/set-roles', limiter, validateOrigin, async (req, res) => {
  try {
    const updatedTournamentSetup = await EventSetup.findOne({}).lean();

    if (!updatedTournamentSetup) {
      return res.status(404).json({ error: 'No tournament setup found' });
    }

    const guildId = process.env.GUILD_ID;
    const botToken = process.env.DISCORD_BOT_TOKEN;
    const rolesApiUrl = `https://discord.com/api/v10/guilds/${guildId}/roles`;
    const channelsApiUrl = `https://discord.com/api/v10/guilds/${guildId}/channels`;

    const headers = {
      Authorization: `Bot ${botToken}`,
      'Content-Type': 'application/json',
    };

    const { data: existingRoles } = await axios.get(rolesApiUrl, { headers });
    const { data: existingChannels } = await axios.get(channelsApiUrl, { headers });

    const rolesToCreate = [];
    for (let i = 1; i <= updatedTournamentSetup.nb_team_channels; i++) {
      const roleName = `Team ${i}`;
      let role = existingRoles.find(r => r.name === roleName);

      if (!role) {
        const { data: createdRole } = await axios.post(
          rolesApiUrl,
          { name: roleName, reason: `Role ${i} created for Team ${i}` },
          { headers }
        );
        role = createdRole;
      }

      rolesToCreate.push(role);
    }

    const channelsToUpdatePermissions = [];
    for (let i = 1; i <= updatedTournamentSetup.nb_team_channels; i++) {
      const teamChannel = existingChannels.find(channel => channel.name === `team-${i}`);
      if (teamChannel) {
        const role = existingRoles.find(r => r.name === `Team ${i}`);
        
        if (role) {
          channelsToUpdatePermissions.push({
            channelId: teamChannel.id,
            permissionOverwrites: [
              { id: role.id, allow: (1 << 10).toString() },
              { id: guildId, deny: (1 << 10).toString() },
            ],
          });
        }
      }
    }

    const updatePermissionsPromises = channelsToUpdatePermissions.map(({ channelId, permissionOverwrites }) =>
      axios.patch(
        `https://discord.com/api/v10/channels/${channelId}`,
        { permission_overwrites: permissionOverwrites },
        { headers }
      )
    );

    await Promise.all(updatePermissionsPromises);

    res.status(200).json({
      message: 'Roles created and permissions updated successfully',
      roles: rolesToCreate,
    });
  } catch (error) {
    console.error('Error in /set-roles route:', error.response ? error.response.data : error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});






app.post('/set-match', limiter, validateOrigin, async (req, res) => {
  try {
    const updatedTournamentSetup = await EventSetup.findOne({}).lean();

    if (!updatedTournamentSetup) {
      return res.status(404).json({ error: 'No tournament setup found' });
    }

    const guildId = process.env.GUILD_ID;
    const botToken = process.env.DISCORD_BOT_TOKEN;
    const discordApiUrl = `https://discord.com/api/v10/guilds/${guildId}/channels`;

    const headers = {
      Authorization: `Bot ${botToken}`,
      'Content-Type': 'application/json',
    };

    const { data: existingChannels } = await axios.get(discordApiUrl, { headers });

    let matchesCategory = existingChannels.find(channel => channel.name === 'Matches' && channel.type === 4);
    if (!matchesCategory) {
      const { data: createdCategory } = await axios.post(
        discordApiUrl,
        { name: 'Matches', type: 4, reason: 'Matches category created' },
        { headers }
      );
      matchesCategory = createdCategory;
    }

    const channelsToCreate = [];

    if (updatedTournamentSetup.match_announcement_channel) {
      channelsToCreate.push({
        name: 'match-announcements',
        type: 5,
        parent_id: matchesCategory.id,
        reason: 'Match announcement channel created',
      });
    }

    if (updatedTournamentSetup.match_result_channel) {
      channelsToCreate.push({
        name: 'match-result',
        type: 0,
        parent_id: matchesCategory.id,
        reason: 'Match result channel created',
      });
    }

    for (let i = 1; i <= updatedTournamentSetup.nb_match_channels; i++) {
      channelsToCreate.push({
        name: `match-${i}`,
        type: 0,
        parent_id: matchesCategory.id,
        reason: `Match ${i} channel created`,
      });
    }

    const channelsToActuallyCreate = channelsToCreate.filter(
      channelData => !existingChannels.some(existingChannel => existingChannel.name === channelData.name && existingChannel.parent_id === channelData.parent_id)
    );

    const createdChannels = await Promise.all(
      channelsToActuallyCreate.map(channelData =>
        axios.post(discordApiUrl, channelData, { headers })
      )
    );

    res.status(200).json({
      message: 'Match channels created successfully',
      channels: createdChannels.map(response => response.data),
    });
  } catch (error) {
    console.error('Error in /set-match route:', error.response ? error.response.data : error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});




app.post('/set-event', limiter, validateOrigin, async (req, res) => {
  try {
    const updatedEventSetup = await EventSetup.findOne({}).lean();

    if (!updatedEventSetup) {
      return res.status(404).json({ error: 'No event setup found' });
    }

    const guildId = process.env.GUILD_ID;
    const botToken = process.env.DISCORD_BOT_TOKEN;
    const discordApiUrl = `https://discord.com/api/v10/guilds/${guildId}/channels`;

    const headers = {
      Authorization: `Bot ${botToken}`,
      'Content-Type': 'application/json',
    };

    const existingChannelsResponse = await axios.get(discordApiUrl, { headers });
    const existingChannels = existingChannelsResponse.data;

    let category = existingChannels.find(channel => channel.name === 'Events' && channel.type === 4);

    if (!category) {
      const categoryData = {
        name: 'Events',
        type: 4,
        reason: 'Events category created',
      };

      const categoryResponse = await axios.post(discordApiUrl, categoryData, { headers });
      category = categoryResponse.data;
    }

    const categoryId = category.id;

    const channelsToCreate = [];
    const existingChannelNames = existingChannels.map(channel => channel.name);

    if (updatedEventSetup.event_call) {
      if (!existingChannelNames.includes('Event Call')) {
        channelsToCreate.push({
          name: 'Event Call',
          type: 2,
          parent_id: categoryId,
          reason: 'Event Call channel created',
        });
      } else {
        console.log('Event Call channel already exists');
      }
    }

    if (updatedEventSetup.event_results) {
      if (!existingChannelNames.includes('event-results')) {
        channelsToCreate.push({
          name: 'event-results',
          type: 0,
          parent_id: categoryId,
          reason: 'Event Results channel created',
        });
      } else {
        console.log('event-results channel already exists');
      }
    }

    if (updatedEventSetup.event_waiting_zone) {
      if (!existingChannelNames.includes('Waiting Zone')) {
        channelsToCreate.push({
          name: 'Waiting Zone',
          type: 2,
          parent_id: categoryId,
          reason: 'Waiting Zone channel created',
        });
      } else {
        console.log('Waiting Zone channel already exists');
      }
    }

    if (channelsToCreate.length === 0) {
      return res.status(200).json({ message: 'All channels already exist' });
    }

    const createdChannels = await Promise.all(
      channelsToCreate.map((channelData) =>
        axios.post(discordApiUrl, channelData, { headers })
      )
    );

    res.status(200).json({
      message: 'Channels created successfully',
      channels: createdChannels.map(response => response.data),
    });
  } catch (error) {
    console.error('Error in /set-event route:', error.response ? error.response.data : error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});
app.post('/event-announcement', limiter, validateOrigin, async (req, res) => {
  try {
    const { event_title, event_message, embed_color } = req.body;

    if (!event_title || !event_message || !embed_color) {
      return res.status(200).json({ error: 'Missing required fields' });
    }

    const eventSetup = await EventSetup.findOne({});
    if (!eventSetup || !eventSetup.event_announcements) {
      return res.status(404).json({ error: 'No event announcements found' });
    }

    const channelIds = eventSetup.event_announcements;
    for (const channelId of channelIds) {
      await sendDiscordAnnouncement(channelId, event_title, event_message, embed_color);
    }

    res.status(200).json({ success: 'Announcements sent' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

const sendDiscordAnnouncement = async (channelId, eventTitle, eventMessage, embedColor) => {
  const botToken = process.env.DISCORD_BOT_TOKEN;

  const payload = {
    embeds: [
      {
        title: eventTitle,
        description: eventMessage,
        color: parseInt(embedColor.replace('#', ''), 16),
        thumbnail: {
          url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/13/Circle-icons-megaphone.svg/2048px-Circle-icons-megaphone.svg.png'
        }
      },
    ],
  };

  await fetch(`https://discord.com/api/v10/channels/${channelId}/messages`, {
    method: 'POST',
    headers: {
      'Authorization': `Bot ${botToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });
};







app.post('/event-setup', limiter, validateOrigin, async (req, res) => {
  const {
    event_announcements,
    event_waiting_zone,
    event_call,
    event_results,
    nb_match_channels,
    nb_team_channels,
    team_announcement_channel,
    match_announcement_channel,
    match_result_channel
  } = req.body;

  console.log("Received /event-setup POST request with data:", req.body);

  try {
    if (!Array.isArray(event_announcements)) {
      console.error("Invalid input received:", req.body);
      return res.status(400).json({ error: 'Invalid input' });
    }

    console.log("Updating EventSetup with:", {
      event_announcements,
      event_waiting_zone,
      event_call,
      event_results,
      nb_match_channels,
      nb_team_channels,
      team_announcement_channel,
      match_announcement_channel,
      match_result_channel
    });

    const updatedEventSetup = await EventSetup.findOneAndUpdate(
      {},
      {
        event_announcements,
        event_waiting_zone,
        event_call,
        event_results,
        nb_match_channels,
        nb_team_channels,
        team_announcement_channel,
        match_announcement_channel,
        match_result_channel
      },
      { new: true, upsert: true }
    );

    console.log("Event setup updated successfully:", updatedEventSetup);

    res.status(200).json({ message: 'Event setup updated successfully', data: updatedEventSetup });
  } catch (error) {
    console.error("Error updating event setup:", error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});


app.get('/event-setup', limiter, validateOrigin, async (req, res) => {
  try {
    const eventSetups = await EventSetup.find({}).lean();

    const formattedEventSetups = eventSetups.map(({ _id, __v, ...rest }) => rest);

    res.json(formattedEventSetups);
  } catch (error) {
    console.error('Error retrieving event setups:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});





app.get('/is-disabled/:commandName', limiter, validateOrigin, async (req, res) => {
  const { commandName } = req.params;

  try {
    const disabledCommand = await DisabledCommand.findOne({ commandName });

    if (disabledCommand) {
      return res.json({ isDisabled: true });
    } else {
      return res.json({ isDisabled: false });
    }
  } catch (error) {
    console.error(`Error checking if command is disabled:`, error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.get('/is-running', limiter, validateOrigin, (req, res) => {
  if (botClient && botClient.isReady()) {
    return res.json({ isRunning: true, message: 'Bot is running.' });
  } else {
    return res.json({ isRunning: false, message: 'Bot is not running.' });
  }
});

app.get('/start-bot', limiter, validateOrigin, async (req, res) => {
  if (botClient && botClient.isReady()) {
    return res.json({ message: 'Bot is already running.' });
  }

  botClient = new Client({
    intents: [
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildMessages,
      GatewayIntentBits.MessageContent,
    ],
  });

  botClient.once('ready', () => {
    console.log(`Logged in as ${botClient.user.tag}!`);
    res.json({ message: 'Bot started successfully.' });
  });

  botClient.on('messageCreate', async (message) => {
    if (message.author.bot) return;

    const prefix = '!';
    if (!message.content.startsWith(prefix)) return;

    const args = message.content.slice(prefix.length).trim().split(/ +/);
    const commandName = args.shift().toLowerCase();

    const disabledCommand = await DisabledCommand.findOne({ commandName });
    if (disabledCommand) {
        message.reply('This command is currently disabled.');
        return;
    }

    if (customCommands.has(commandName)) {
        const command = customCommands.get(commandName);
        try {
            command.execute(message, args);
        } catch (error) {
            console.error(`Error executing command ${commandName}:`, error);
            message.reply('There was an error executing that command!');
        }
    }
});

  botClient.on('error', (error) => {
    console.error('Bot encountered an error:', error);
  });

  try {
    await botClient.login(process.env.DISCORD_BOT_TOKEN);
  } catch (error) {
    console.error('Failed to login:', error);
    res.status(500).json({ error: 'Failed to start bot.' });
  }
});

app.get('/stop-bot', limiter, validateOrigin, (req, res) => {
  if (!botClient || !botClient.isReady()) {
    return res.json({ message: 'Bot is not running.' });
  }

  botClient.destroy();
  botClient = null;
  console.log('Bot stopped.');
  res.json({ message: 'Bot stopped successfully.' });
});

app.post('/disable-command/:commandName', limiter, validateOrigin, async (req, res) => {
  const commandName = req.params.commandName.toLowerCase();
  
  if (!customCommands.has(commandName)) {
    return res.status(404).json({ error: 'Command not found' });
  }

  const existingCommand = await DisabledCommand.findOne({ commandName });
  if (existingCommand) {
    return res.json({ message: `Command ${commandName} is already disabled.` });
  }

  const newDisabledCommand = new DisabledCommand({ commandName });
  await newDisabledCommand.save();

  res.json({ message: `Command ${commandName} disabled.` });
});

app.get('/disable-command/:commandName', limiter, validateOrigin, async (req, res) => {
  const commandName = req.params.commandName.toLowerCase();
  
  const existingCommand = await DisabledCommand.findOne({ commandName });
  if (existingCommand) {
    return res.json({ message: `Command ${commandName} is already disabled.` });
  }

  if (!customCommands.has(commandName)) {
    return res.status(404).json({ error: 'Command not found' });
  }

  const newDisabledCommand = new DisabledCommand({ commandName });
  await newDisabledCommand.save();

  res.json({ message: `Command ${commandName} disabled.` });
});

app.post('/enable-command/:commandName', limiter, validateOrigin, async (req, res) => {
  const commandName = req.params.commandName.toLowerCase();
  
  if (!customCommands.has(commandName)) {
    return res.status(404).json({ error: 'Command not found' });
  }

  const disabledCommand = await DisabledCommand.findOne({ commandName });
  if (!disabledCommand) {
    return res.json({ message: `Command ${commandName} is already enabled.` });
  }

  await DisabledCommand.deleteOne({ commandName });

  res.json({ message: `Command ${commandName} enabled.` });
});

app.get('/enable-command/:commandName', limiter, validateOrigin, async (req, res) => {
  const commandName = req.params.commandName.toLowerCase();
  
  if (!customCommands.has(commandName)) {
    return res.status(404).json({ error: 'Command not found' });
  }

  const disabledCommand = await DisabledCommand.findOne({ commandName });
  if (!disabledCommand) {
    return res.json({ message: `Command ${commandName} is already enabled.` });
  }

  await DisabledCommand.deleteOne({ commandName });

  res.json({ message: `Command ${commandName} enabled.` });
});


app.get('/custom-commands', limiter, validateOrigin, async (req, res) => {
  const commandsDirectory = path.join(__dirname, 'custom_commands');

  try {
    const files = fs.readdirSync(commandsDirectory);

    const commands = {};

    for (const file of files) {
      if (file.endsWith('.js')) {
        const commandName = path.basename(file, '.js');
        const route = `POST /custom-commands/${commandName}`;

        let command = await Command.findOne({ name: commandName });

        if (!command) {
          command = new Command({ name: commandName, route });
          await command.save();
        }

        commands[commandName] = route;
      }
    }

    res.json({ commands });
  } catch (error) {
    console.error('Error reading custom commands directory:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.get('/discord-username/:id', limiter, validateOrigin, async (req, res) => {
  const userId = req.params.id;
  
  try {
    const response = await axios.get(`https://discord.com/api/v10/users/${userId}`, {
      headers: {
        'Authorization': `Bot ${DISCORD_BOT_TOKEN}`
      }
    });
    
    res.json({ username: response.data.username });
  } catch (error) {
    console.error(`Error fetching username for user ID ${userId}:`, error);

    if (error.response) {
      console.error(`Discord API responded with status ${error.response.status}:`, error.response.data);

      if (error.response.status === 404) {
        res.status(404).json({ error: 'User not found' });
      } else {
        res.status(500).json({ error: 'Internal Server Error' });
      }
    } else {
      console.error('Unexpected error:', error.message);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  }
});


app.get('/audit-logs', limiter, validateOrigin, async (req, res) => {
  try {
    const response = await axios.get(`https://discord.com/api/v10/guilds/${GUILD_ID}/audit-logs`, {
      headers: {
        'Authorization': `Bot ${DISCORD_BOT_TOKEN}`
      }
    });

    res.status(200).json(response.data);
  } catch (error) {
    console.error('Error fetching audit logs:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.get('/data-setup', limiter, validateOrigin, async (req, res) => {
  try {
    const data = await DataSetup.findOne();

    if (!data) {
      return res.status(404).json({ error: 'Data setup not found' });
    }

    const response = data.toObject();
    delete response._id;
    delete response.__v;

    res.status(200).json(response);
  } catch (error) {
    console.error('Error retrieving data setup:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.post('/data-setup', limiter, validateOrigin, async (req, res) => {
  const {
    discordClientId = '',
    discordClientSecret = '',
    guildId = '',
    staffList = '',
    communityRules = ''
  } = req.body;

  try {
    let dataSetup = await DataSetup.findOne();

    if (dataSetup) {
      dataSetup.discordClientId = discordClientId;
      dataSetup.discordClientSecret = discordClientSecret;
      dataSetup.guildId = guildId;
      dataSetup.staffList = staffList;
      dataSetup.communityRules = communityRules;
    } else {
      dataSetup = new DataSetup({
        discordClientId,
        discordClientSecret,
        guildId,
        staffList,
        communityRules
      });
    }

    await dataSetup.save();

    const response = dataSetup.toObject();
    delete response._id;
    delete response.__v;

    res.status(201).json({
      message: 'Data setup saved successfully',
      setup: response,
    });
  } catch (error) {
    console.error('Error saving data setup:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.post('/is-valid-id', limiter, validateOrigin, async (req, res) => {
  const { user_id } = req.body;

  if (!user_id) {
    return res.status(400).json({ isValid: false, message: 'user_id is required' });
  }

  if (!/^\d{17,19}$/.test(user_id)) {
    return res.status(200).json({ isValid: false, message: 'Invalid ID format' });
  }

  try {
    const response = await axios.get(`https://discord.com/api/v10/users/${user_id}`, {
      headers: {
        Authorization: `Bot ${process.env.DISCORD_BOT_TOKEN}`,
      },
    });

    if (response.status === 200) {
      return res.status(200).json({ isValid: true });
    }
  } catch (error) {
    if (error.response && error.response.status === 404) {
      return res.status(200).json({ isValid: false, message: 'User not found' });
    }
    console.error('Error validating user ID:', error);
    return res.status(500).json({ isValid: false, message: 'Internal Server Error' });
  }
});




cron.schedule('0 * * * *', async () => {
  try {
    const now = new Date();

    const expiredMutes = await Moderation.find({
      type: 'MUTE',
      status: 'active',
      duration: { $lt: now }
    });

    for (const mute of expiredMutes) {
      await axios.delete(
        `https://discord.com/api/v10/guilds/${process.env.GUILD_ID}/members/${mute.user_id}/roles/${(await ModerationSetup.findOne()).muted_role}`,
        {
          headers: {
            Authorization: `Bot ${process.env.DISCORD_BOT_TOKEN}`,
          },
        }
      );

      await Moderation.updateMany({ _id: mute._id }, { $set: { status: 'expired' } });
    }

    const expiredBans = await Moderation.find({
      type: 'BAN',
      status: 'active',
      duration: { $lt: now }
    });

    for (const ban of expiredBans) {
      await axios.delete(
        `https://discord.com/api/v10/guilds/${process.env.GUILD_ID}/bans/${ban.user_id}`,
        {
          headers: {
            Authorization: `Bot ${process.env.DISCORD_BOT_TOKEN}`,
          },
        }
      );

      await Moderation.updateMany({ _id: ban._id }, { $set: { status: 'expired' } });
    }

    console.log('Expired mutes and bans processed successfully.');
  } catch (error) {
    console.error('Error processing expired mutes and bans:', error);
  }
});

app.get('/moderation-setup', limiter, validateOrigin, async (req, res) => {
  try {
    const setup = await ModerationSetup.findOne();
    if (!setup) {
      return res.status(404).json({ error: 'Moderation setup not found' });
    }

    const response = setup.toObject();
    delete response._id;
    delete response.__v;

    res.status(200).json(response);
  } catch (error) {
    console.error('Error retrieving moderation setup:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.post('/moderation-setup', limiter, validateOrigin, async (req, res) => {
  const { muted_role } = req.body;

  if (!muted_role) {
    return res.status(400).json({ error: 'muted_role is required' });
  }

  try {
    let setup = await ModerationSetup.findOne();
    
    if (setup) {
      setup.muted_role = muted_role;
    } else {
      setup = new ModerationSetup({ muted_role });
    }

    await setup.save();

    const response = setup.toObject();
    delete response._id;
    delete response.__v;

    res.status(201).json({
      message: 'Moderation setup saved successfully',
      setup: response,
    });
  } catch (error) {
    console.error('Error saving moderation setup:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});


async function sendDM(user_id, action, reason) {
  const embed = new EmbedBuilder()
    .setColor(0xff0000)
    .setTitle(`You have been **${action}**`)
    .setDescription(`Reason: ${reason}`)
    .setTimestamp();

  try {
    const dmChannelResponse = await axios.post(
      'https://discord.com/api/v9/users/@me/channels',
      {
        recipient_id: user_id
      },
      {
        headers: {
          Authorization: `Bot ${process.env.DISCORD_BOT_TOKEN}`,
          'Content-Type': 'application/json'
        }
      }
    );

    const dmChannelId = dmChannelResponse.data.id;

    await axios.post(
      `https://discord.com/api/v9/channels/${dmChannelId}/messages`,
      {
        embeds: [embed.toJSON()]
      },
      {
        headers: {
          Authorization: `Bot ${process.env.DISCORD_BOT_TOKEN}`,
          'Content-Type': 'application/json'
        }
      }
    );

  } catch (error) {
    console.error(`Failed to send DM to user ${user_id}:`, error.response ? error.response.data : error.message);
  }
}


app.get('/logs', validateOrigin, limiter, async (req, res) => {
  try {
    const logs = await Log.find().sort({ timestamp: -1 });
    const formattedLogs = logs.map(log => ({
      title: `Log #${log.id}`,
      moderator: log.moderator,
      actionType: log.actionType,
      reason: log.reason || 'N/A',
      details: log.details || 'N/A',
      timestamp: log.timestamp,
    }));

    res.status(200).json(formattedLogs);
  } catch (error) {
    console.error('Error fetching logs:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});



app.post('/warn-user', limiter, validateOrigin, async (req, res) => {
  const { user_id, reason, evidence, moderator } = req.body;

  if (!user_id || !reason || !moderator) {
    return res.status(400).json({ error: 'user_id, reason, and moderator are required' });
  }

  try {
    const nextId = await getNextId();
    if (isNaN(nextId)) {
      return res.status(500).json({ error: 'Failed to generate next ID' });
    }

    const newModeration = new Moderation({
      id: nextId,
      user_id,
      type: 'WARN',
      reason,
      evidence,
      moderator,
    });

    await newModeration.save();
    
    const logId = await getNextLogId();
    if (isNaN(logId)) {
      return res.status(500).json({ error: 'Failed to generate log ID' });
    }

    const logEntry = new Log({
      id: logId,
      moderator,
      actionType: 'WARN',
      reason,
      details: evidence || null,
    });

    await logEntry.save();

    await sendDM(user_id, 'warned', reason);

    const response = newModeration.toObject();
    delete response._id;
    delete response.__v;

    res.status(201).json({
      message: 'WARN action recorded successfully',
      moderation: response,
    });
  } catch (error) {
    console.error('Error recording WARN action:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});



app.post('/mute-user', limiter, validateOrigin, async (req, res) => {
  const { user_id, duration, reason, evidence, moderator } = req.body;

  if (!user_id || !duration || !reason || !moderator) {
    return res.status(400).json({ error: 'user_id, duration, reason, and moderator are required' });
  }

  try {
    const nextId = await getNextId();

    const newModeration = new Moderation({
      id: nextId,
      user_id,
      type: 'MUTE',
      duration,
      reason,
      evidence,
      moderator,
    });

    await newModeration.save();
    
    const logId = await getNextLogId();
    const logEntry = new Log({
      id: logId,
      moderator,
      actionType: 'MUTE',
      reason,
      details: `Duration: ${duration}, Evidence: ${evidence || 'N/A'}`,
    });

    await logEntry.save();

    await sendDM(user_id, 'muted', `for the following reason: ${reason}. Duration: ${duration}`);

    const setup = await ModerationSetup.findOne();
    const guildId = process.env.GUILD_ID;
    if (setup && setup.muted_role) {
      await axios.patch(
        `https://discord.com/api/v10/guilds/${guildId}/members/${user_id}`,
        {
          roles: [setup.muted_role]
        },
        {
          headers: {
            Authorization: `Bot ${process.env.DISCORD_BOT_TOKEN}`,
            'Content-Type': 'application/json'
          },
        }
      );
    }

    const response = newModeration.toObject();
    delete response._id;
    delete response.__v;

    res.status(201).json({
      message: 'MUTE action recorded successfully',
      moderation: response,
    });
  } catch (error) {
    console.error('Error recording MUTE action:', error.response ? error.response.data : error.message);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});




app.post('/kick-user', limiter, validateOrigin, async (req, res) => {
  const { user_id, reason, evidence, moderator } = req.body;

  if (!user_id || !reason || !moderator) {
    return res.status(400).json({ error: 'user_id, reason, and moderator are required' });
  }

  try {
    const nextId = await getNextId();

    const newModeration = new Moderation({
      id: nextId,
      user_id,
      type: 'KICK',
      reason,
      evidence,
      moderator,
    });

    await newModeration.save();
    
    const logId = await getNextLogId();
    const logEntry = new Log({
      id: logId,
      moderator,
      actionType: 'KICK',
      reason,
      details: evidence || null,
    });

    await logEntry.save();

    await sendDM(user_id, 'kicked', reason);
    const guildId = process.env.GUILD_ID;

    await axios.delete(
      `https://discord.com/api/v10/guilds/${guildId}/members/${user_id}`,
      {
        headers: {
          Authorization: `Bot ${process.env.DISCORD_BOT_TOKEN}`,
        },
      }
    );

    const response = newModeration.toObject();
    delete response._id;
    delete response.__v;

    res.status(201).json({
      message: 'KICK action recorded successfully',
      moderation: response,
    });
  } catch (error) {
    console.error('Error recording KICK action:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.post('/unmute-user', limiter, validateOrigin, async (req, res) => {
  const { user_id, moderator } = req.body;

  if (!user_id || !moderator) {
    return res.status(400).json({ error: 'user_id and moderator are required' });
  }

  try {
    const setup = await ModerationSetup.findOne();
    const guildId = process.env.GUILD_ID;

    if (setup && setup.muted_role) {
      await axios.delete(
        `https://discord.com/api/v10/guilds/${guildId}/members/${user_id}/roles/${setup.muted_role}`,
        {
          headers: {
            Authorization: `Bot ${process.env.DISCORD_BOT_TOKEN}`,
          },
        }
      );

      await Moderation.updateMany({ user_id, type: 'MUTE' }, { $set: { status: 'unmuted' } });

      const logId = await getNextLogId();
      const logEntry = new Log({
        id: logId,
        moderator,
        actionType: 'UNMUTE',
        user_id,
      });

      await logEntry.save();

      res.status(200).json({ message: 'User has been unmuted successfully' });
    } else {
      res.status(404).json({ error: 'Muted role not found' });
    }
  } catch (error) {
    console.error('Error unmuting user:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});


app.post('/discord-ban-user', limiter, validateOrigin, async (req, res) => {
  const { user_id, duration, reason, evidence, moderator } = req.body;

  if (!user_id || !duration || !reason || !moderator) {
    return res.status(400).json({ error: 'user_id, duration, reason, and moderator are required' });
  }

  try {
    const nextId = await getNextId();

    const newModeration = new Moderation({
      id: nextId,
      user_id,
      type: 'BAN',
      duration,
      reason,
      evidence,
      moderator,
    });

    await newModeration.save();
    
    const logId = await getNextLogId();
    const logEntry = new Log({
      id: logId,
      moderator,
      actionType: 'BAN',
      reason,
      details: `Duration: ${duration}, Evidence: ${evidence || 'N/A'}`,
    });

    await logEntry.save();

    await sendDM(user_id, 'banned', `Reason: ${reason}, Duration: ${duration}`);
    const guildId = process.env.GUILD_ID;

    await axios.put(
      `https://discord.com/api/v10/guilds/${guildId}/bans/${user_id}`,
      { delete_message_days: 7, reason: `${reason} (Duration: ${duration})` },
      {
        headers: {
          Authorization: `Bot ${process.env.DISCORD_BOT_TOKEN}`,
        },
      }
    );

    const response = newModeration.toObject();
    delete response._id;
    delete response.__v;

    res.status(201).json({
      message: 'BAN action recorded successfully',
      moderation: response,
    });
  } catch (error) {
    console.error('Error recording BAN action:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});



app.post('/discord-unban-user', limiter, validateOrigin, async (req, res) => {
  const { user_id, moderator } = req.body;

  if (!user_id || !moderator) {
    return res.status(400).json({ error: 'user_id and moderator are required' });
  }

  try {
    const guildId = process.env.GUILD_ID;

    await axios.delete(
      `https://discord.com/api/v10/guilds/${guildId}/bans/${user_id}`,
      {
        headers: {
          Authorization: `Bot ${process.env.DISCORD_BOT_TOKEN}`,
        },
      }
    );

    await Moderation.updateMany({ user_id, type: 'BAN' }, { $set: { status: 'unbanned' } });

    const logId = await getNextLogId();
    const logEntry = new Log({
      id: logId,
      moderator,
      actionType: 'UNBAN',
      reason: 'User unbanned by moderator',
      details: `User ID: ${user_id}`,
    });

    await logEntry.save();

    res.status(200).json({ message: 'User has been unbanned successfully' });
  } catch (error) {
    console.error('Error unbanning user:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});




app.get('/user-history/:userId', limiter, validateOrigin, async (req, res) => {
  const { userId } = req.params;

  if (!userId) {
    return res.status(400).json({ error: 'userId is required' });
  }

  try {
    const history = await Moderation.find({ user_id: userId }).sort({ date: -1 });

    if (!history.length) {
      const nextId = await getNextId();
      const newRecord = new Moderation({
        id: nextId,
        user_id: userId,
        type: 'INFO',
        duration: null,
        reason: 'No history found; user added to database.',
        evidence: null,
        moderator: 'system',
        date: new Date()
      });

      await newRecord.save();

      const placeholderRecord = {
        id: nextId,
        user_id: userId,
        type: 'INFO',
        duration: null,
        reason: 'No history found; user added to database.',
        evidence: null,
        moderator: 'system',
        date: new Date().toISOString()
      };

      return res.status(200).json({ history: [placeholderRecord] });
    }

    const cleanHistory = history.map(record => {
      const obj = record.toObject();
      delete obj._id;
      delete obj.__v;
      return obj;
    });

    res.status(200).json({ history: cleanHistory });
  } catch (error) {
    console.error('Error retrieving user history:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});




app.post('/buy-role', limiter, validateOrigin, async (req, res) => {
  const { user_id, role_name } = req.body;

  if (!user_id || !role_name) {
    return res.status(400).json({ error: 'user_id and role_name are required' });
  }

  try {
    const allRoles = await Role.find({}, { role_name: 1, _id: 0 });

    const role = await Role.findOne({ role_name });
    if (!role) {
      console.error('Role not found in the database:', role_name);
      return res.status(404).json({ error: 'Role not found' });
    }


    const user = await User.findOne({ user_id });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }


    if (user.points < role.price) {
      return res.status(200).json({ error: 'Not enough points to buy this role' });
    }

    const guildMemberUrl = `https://discord.com/api/v10/guilds/${GUILD_ID}/members/${user_id}`;
    let memberCheckResponse;
    try {
      memberCheckResponse = await axios.get(guildMemberUrl, {
        headers: {
          Authorization: `Bot ${DISCORD_BOT_TOKEN}`
        }
      });
    } catch (err) {
      console.error('Error fetching user roles from Discord:', err.response?.data || err.message);
      return res.status(500).json({ error: 'Failed to fetch user roles from Discord' });
    }

    if (memberCheckResponse.status === 200) {
      const memberRoles = memberCheckResponse.data.roles || [];
      const userHasRole = memberRoles.includes(role.role_id);

      if (userHasRole) {
        return res.status(200).json({ error: 'User already has this role on Discord' });
      }

      user.points -= role.price;
      user.roles.push(role.role_id);
      await user.save();

      const roleAssignmentUrl = `https://discord.com/api/v10/guilds/${GUILD_ID}/members/${user_id}/roles/${role.role_id}`;
      try {
        await axios.put(roleAssignmentUrl, {}, {
          headers: {
            Authorization: `Bot ${DISCORD_BOT_TOKEN}`
          }
        });
      } catch (err) {
        console.error('Error assigning role on Discord:', err.response?.data || err.message);
        return res.status(500).json({ error: 'Failed to assign role on Discord' });
      }

      try {
        const dmChannelResponse = await axios.post(
          `https://discord.com/api/v9/users/@me/channels`,
          {
            recipient_id: user_id
          },
          {
            headers: {
              Authorization: `Bot ${DISCORD_BOT_TOKEN}`,
              'Content-Type': 'application/json'
            }
          }
        );

        const dmChannelId = dmChannelResponse.data.id;

        await axios.post(
          `https://discord.com/api/v9/channels/${dmChannelId}/messages`,
          {
            embed: {
              title: 'Purchase successful',
              description: `Thank you for your purchase! The role "**${role_name}**" has been added!`,
              color: 0xff0000,
              footer: {
                text: new Date().toISOString()
              }
            }
          },
          {
            headers: {
              Authorization: `Bot ${DISCORD_BOT_TOKEN}`,
              'Content-Type': 'application/json'
            }
          }
        );

      } catch (err) {
        console.error('Error sending DM with embed:', err.response?.data || err.message);
        return res.status(500).json({ error: 'Failed to send DM with embed' });
      }

      return res.status(200).json({ message: 'Role purchased and assigned successfully', role: role_name });
    } else {
      return res.status(404).json({ error: 'User is not in the server' });
    }
  } catch (error) {
    console.error('Error purchasing role:', error.response?.data || error.message);
    const statusCode = error.response?.status || 500;
    const errorMessage = error.response?.data?.message || 'Internal Server Error';
    return res.status(statusCode).json({ error: errorMessage });
  }
});

















app.get("/user-roles/:userId", limiter, validateOrigin, async (req, res) => {
  const userId = req.params.userId;

  try {
    const user = await User.findOne({ user_id: userId }, { roles: 1, _id: 0 });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.status(200).json({ user_id: userId, roles: user.roles });
  } catch (error) {
    console.error("Error retrieving user roles:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.get("/points/:userId", limiter, validateOrigin, async (req, res) => {
  const { userId } = req.params;

  if (!userId) {
    return res.status(400).json({ error: "userId is required" });
  }

  try {
    let user = await User.findOne(
      { user_id: userId },
      { user_id: 1, points: 1 }
    );

    if (!user) {
      user = new User({ user_id: userId, points: 0 });
      await user.save();
    }

    res.status(200).json({ user_id: user.user_id, points: user.points });
  } catch (error) {
    console.error("Error retrieving user points:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});





app.post("/add-points", limiter, validateOrigin, async (req, res) => {
  const { user_id, points } = req.body;

  if (!user_id || typeof points !== "number") {
    return res.status(400).json({ error: "user_id and points are required" });
  }

  try {
    const user = await User.findOneAndUpdate(
      { user_id },
      { $inc: { points: points } },
      {
        new: true,
        upsert: true,
        fields: { _id: 0, __v: 0, user_id: 1, points: 1 },
      }
    );

    res.status(200).json({ message: "Points added successfully", user });
  } catch (error) {
    console.error("Error adding points:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.post("/remove-points", limiter, validateOrigin, async (req, res) => {
  const { user_id, points } = req.body;

  if (!user_id || typeof points !== "number") {
    return res.status(400).json({ error: "user_id and points are required" });
  }

  try {
    const user = await User.findOne({ user_id });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    user.points = Math.max(0, user.points - points);
    await user.save();

    res
      .status(200)
      .json({
        message: "Points removed successfully",
        user_id: user.user_id,
        points: user.points,
      });
  } catch (error) {
    console.error("Error removing points:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.get("/shop-setup", limiter, validateOrigin, async (req, res) => {
  try {
    const roles = await Role.find({}, { _id: 0, __v: 0 });
    res.status(200).json(roles);
  } catch (error) {
    console.error("Error retrieving roles:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.get('/all-roles', limiter, validateOrigin, async (req, res) => {
  try {
    const roles = await Role.find({}, { _id: 0, __v: 0 });
    res.status(200).json(roles);
  } catch (error) {
    console.error('Error retrieving roles:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.post("/shop-setup", limiter, validateOrigin, async (req, res) => {
  const { role_name, price, role_id } = req.body;

  if (!role_name || !price || !role_id) {
    return res.status(400).json({ error: "role_name, price, and role_id are required" });
  }

  try {
    const existingRole = await Role.findOne({ role_name });
    if (existingRole) {
      return res.status(400).json({ error: "Role name already exists" });
    }

    const guildRolesUrl = `https://discord.com/api/v10/guilds/${GUILD_ID}/roles`;

    let guildRolesResponse;
    try {
      guildRolesResponse = await axios.get(guildRolesUrl, {
        headers: {
          Authorization: `Bot ${DISCORD_BOT_TOKEN}`,
        },
      });
    } catch (err) {
      console.error("Error fetching roles from Discord:", err.response?.data || err.message);
      return res.status(500).json({ error: "Failed to validate role_id with Discord" });
    }

    const roleExists = guildRolesResponse.data.some((role) => role.id === role_id);
    if (!roleExists) {
      return res.status(400).json({ error: "Invalid role_id. The specified role does not exist in the Discord server." });
    }

    const newRole = new Role({ role_name, price, role_id });
    await newRole.save();

    const responseRole = newRole.toObject();
    delete responseRole._id;
    delete responseRole.__v;

    res.status(201).json({ message: "Role added successfully", role: responseRole });
  } catch (error) {
    console.error("Error adding role:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});


app.delete("/shop-setup", limiter, validateOrigin, async (req, res) => {
  const { role_name } = req.body;

  if (!role_name) {
    return res.status(400).json({ error: "role_name is required" });
  }

  try {
    const deletedRole = await Role.findOneAndDelete(
      { role_name },
      { _id: 0, __v: 0 }
    );
    if (deletedRole) {
      res
        .status(200)
        .json({ message: "Role deleted successfully", role: deletedRole });
    } else {
      res.status(404).json({ error: "Role not found" });
    }
  } catch (error) {
    console.error("Error deleting role:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.get("/add-to-server", limiter, validateOrigin, async (req, res) => {
  try {
    let statusDoc = await AddToServerStatus.findOne();

    if (!statusDoc) {
      statusDoc = await AddToServerStatus.create({ status: false });
    }

    res.status(200).json({ status: statusDoc.status });
  } catch (error) {
    console.error("Error fetching add-to-server status:", error);
    res.status(500).json({ error: "Server error" });
  }
});

app.post("/add-to-server", limiter, validateOrigin, async (req, res) => {
  try {
    const { status } = req.body;

    if (typeof status !== "boolean") {
      return res.status(400).json({ error: "Status must be a boolean value" });
    }

    let statusDoc = await AddToServerStatus.findOne();

    if (statusDoc) {
      statusDoc.status = status;
      await statusDoc.save();
    } else {
      statusDoc = await AddToServerStatus.create({ status });
    }

    res.status(200).json({ status: statusDoc.status });
  } catch (error) {
    console.error("Error updating add-to-server status:", error);
    res.status(500).json({ error: "Server error" });
  }
});

app.get("/login", limiter, async (req, res) => {
  try {
    const statusDoc = await AddToServerStatus.findOne();
    const addToServer = statusDoc && statusDoc.status;

    let scope = "identify";
    if (addToServer) {
      scope += " guilds.join";
    }

    const discordOAuthUrl = `https://discord.com/api/oauth2/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(
      redirectUri
    )}&response_type=code&scope=${encodeURIComponent(scope)}`;

    res.redirect(discordOAuthUrl);
  } catch (error) {
    console.error("Error checking add-to-server status:", error);
    res.status(500).send("Internal Server Error");
  }
});

app.post('/new-group', limiter, validateOrigin, async (req, res) => {
  const { group_name, channel_id } = req.body;

  if (!group_name || !Array.isArray(channel_id)) {
    return res.status(400).json({ error: 'Invalid group data' });
  }

  try {
    const newGroup = new ChannelGroup({ group_name, channel_id, enabled: false });
    await newGroup.save();
    res.status(201).json({ message: 'Group created successfully', group: newGroup });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create group' });
  }
});

app.get('/all-groups', limiter, validateOrigin, async (req, res) => {
  try {
    const groups = await ChannelGroup.find({});
    res.status(200).json(groups);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch groups' });
  }
});



const VIEW_CHANNEL = 1024;
const READ_MESSAGE_HISTORY = 65536;
const SEND_MESSAGES = 2048;

async function updateChannelPermissions(channelId, makeVisible) {
  const everyoneRoleId = process.env.DISCORD_EVERYONE_ROLE_ID;
  
  if (!everyoneRoleId) {
    throw new Error('DISCORD_EVERYONE_ROLE_ID is not set in environment variables');
  }

  const url = `https://discord.com/api/v10/channels/${channelId}/permissions/${everyoneRoleId}`;

  const data = {
    allow: makeVisible ? (VIEW_CHANNEL | READ_MESSAGE_HISTORY | SEND_MESSAGES).toString() : '0',
    deny: makeVisible ? '0' : (VIEW_CHANNEL | READ_MESSAGE_HISTORY | SEND_MESSAGES).toString(),
    type: 0,
  };

  try {
    await axios.put(url, data, {
      headers: {
        Authorization: `Bot ${process.env.DISCORD_BOT_TOKEN}`,
        'Content-Type': 'application/json',
      },
    });
    console.log(`Updated permissions for channel ${channelId}`);
  } catch (error) {
    console.error(`Failed to update permissions for channel ${channelId}`, error);
    throw error;
  }
}

app.put('/enable-group/:groupName', limiter, validateOrigin, async (req, res) => {
  const { groupName } = req.params;

  try {
    const group = await ChannelGroup.findOne({ group_name: groupName });
    if (!group) {
      return res.status(404).json({ error: 'Group not found' });
    }

    for (const channelId of group.channel_id) {
      await updateChannelPermissions(channelId, true);
    }

    group.enabled = true;
    await group.save();
    res.status(200).json({ message: `Group ${groupName} enabled successfully` });
  } catch (error) {
    res.status(500).json({ error: 'Failed to enable group' });
  }
});

app.put('/disable-group/:groupName', limiter, validateOrigin, async (req, res) => {
  const { groupName } = req.params;

  try {
    const group = await ChannelGroup.findOne({ group_name: groupName });
    if (!group) {
      return res.status(404).json({ error: 'Group not found' });
    }

    for (const channelId of group.channel_id) {
      await updateChannelPermissions(channelId, false);
    }

    group.enabled = false;
    await group.save();
    res.status(200).json({ message: `Group ${groupName} disabled successfully` });
  } catch (error) {
    res.status(500).json({ error: 'Failed to disable group' });
  }
});




app.post('/find-channel-name', limiter, validateOrigin, async (req, res) => {
  const { channel_id } = req.body;

  if (!channel_id) {
    return res.status(400).json({ error: 'Channel ID is required' });
  }

  try {
    const botToken = process.env.DISCORD_BOT_TOKEN;

    const response = await axios.get(`https://discord.com/api/v10/channels/${channel_id}`, {
      headers: {
        Authorization: `Bot ${botToken}`,
      },
    });

    const channelName = response.data.name;

    res.status(200).json({ channel_name: channelName });
  } catch (error) {
    console.error('Error fetching channel name:', error.response ? error.response.data : error.message);
    res.status(500).json({ error: 'Failed to fetch channel name', details: error.message });
  }
});


app.delete('/delete-group', limiter, validateOrigin, async (req, res) => {
  const { group_name } = req.body;

  if (!group_name) {
    return res.status(400).json({ error: 'Group name is required' });
  }

  try {
    const deletedGroup = await ChannelGroup.findOneAndDelete({ group_name });
    if (!deletedGroup) {
      return res.status(404).json({ error: 'Group not found' });
    }

    res.status(200).json({ message: 'Group deleted successfully' });
  } catch (error) {
    console.error('Error deleting group:', error);
    res.status(500).json({ error: 'Failed to delete group', details: error.message });
  }
});


app.get("/callback", limiter, async (req, res) => {
  const code = req.query.code;
  const error = req.query.error;

  if (error) {
    return res.redirect("http://localhost:8080/community_dashboard/#/");
  }

  const tokenParams = {
    client_id: clientId,
    client_secret: clientSecret,
    code: code,
    grant_type: "authorization_code",
    redirect_uri: redirectUri,
    scope: "identify",
  };

  try {
    const tokenResponse = await axios.post(
      "https://discord.com/api/oauth2/token",
      querystring.stringify(tokenParams),
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      }
    );

    const loginToken = tokenResponse.data.access_token;

    const userResponse = await axios.get("https://discord.com/api/users/@me", {
      headers: {
        Authorization: `Bearer ${loginToken}`,
      },
    });

    const { id } = userResponse.data;

    const bannedUser = await BannedUser.findOne({ user_id: id });
    if (bannedUser) {
      return res.redirect("http://localhost:8080/community_dashboard/#/banned");
    }

    validTokens[loginToken] = userResponse.data;

    const statusDoc = await AddToServerStatus.findOne();
    const addToServer = statusDoc && statusDoc.status;

    if (addToServer) {
      const guildId = process.env.GUILD_ID;
      try {
        await axios.put(
          `https://discord.com/api/guilds/${guildId}/members/${id}`,
          {
            access_token: loginToken,
          },
          {
            headers: {
              Authorization: `Bot ${process.env.DISCORD_BOT_TOKEN}`,
            },
          }
        );
      } catch (error) {
        console.error(
          "Error adding user to server:",
          error.response ? error.response.data : error.message
        );
      }
    }

    const redirectUrlWithToken = `http://localhost:8080/community_dashboard/#/dashboard?login_token=${loginToken}`;
    res.redirect(redirectUrlWithToken);
  } catch (error) {
    console.error(
      "Error:",
      error.response ? error.response.data : error.message
    );
    res.status(500).send("Internal Server Error");
  }
});



app.get("/allowed-access", limiter, validateOrigin, async (req, res) => {
  try {
    const allowedAccess = await AllowedAccess.find();
    const whitelist = allowedAccess.map((entry) => entry.id);
    res.json({ whitelist });
  } catch (error) {
    console.error("Error retrieving allowed access:");
    res.status(500).json({ error: "Server error" });
  }
});

app.post("/allowed-access", limiter, validateOrigin, async (req, res) => {
  const { id } = req.body;
  if (!id) {
    return res.status(200).json({ error: "ID is required" });
  }

  try {
    const existingAccess = await AllowedAccess.findOne({ id });
    if (!existingAccess) {
      await AllowedAccess.create({ id });
      const allowedAccess = await AllowedAccess.find();
      const whitelist = allowedAccess.map((entry) => entry.id);
      res.json({ whitelist });
    } else {
      return res
        .status(200)
        .json({ error: "ID already exists in allowed access" });
    }
  } catch (error) {
    console.error("Error adding allowed access:");
    res.status(500).json({ error: "Server error" });
  }
});

app.post("/validate-token", limiter, async (req, res) => {
  const { token } = req.body;
  if (!token) {
    return res.status(200).json({ error: "Token is required" });
  }

  const user = validTokens[token];
  if (user) {
    try {
      const response = await axios.get("https://discord.com/api/users/@me", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const { id, username, avatar } = response.data;

      const userInfo = {
        id,
        username,
        avatar: `https://cdn.discordapp.com/avatars/${id}/${avatar}.png`,
        token,
      };

      res.json({ valid: true, user: userInfo });
    } catch (error) {
      console.error("Error fetching Discord user information:");
      res.status(500).json({ error: "Internal server error" });
    }
  } else {
    res.json({ valid: false });
  }
});

app.get("/page-visible/:role", validateOrigin, limiter, async (req, res) => {
  const role = req.params.role;

  try {
    const rolePage = await RolePage.findOne({ role });

    if (!rolePage) {
      return res.status(200).json({ message: "Role not found" });
    }

    res.status(200).json(rolePage.pages);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

app.post("/page-visible/:role", validateOrigin, limiter, async (req, res) => {
  const role = req.params.role;
  const newPages = req.body;

  try {
    let rolePage = await RolePage.findOne({ role });

    if (!rolePage) {
      return res.status(200).json({ message: "Role not found" });
    }

    rolePage.pages = newPages;

    await rolePage.save();

    res.status(200).json({ message: "Pages updated successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

app.post("/new-role", validateOrigin, limiter, async (req, res) => {
  const { role } = req.body;

  try {
    let existingRole = await RolePage.findOne({ role });

    if (existingRole) {
      return res.status(400).json({ message: "Role already exists" });
    }

    const newRole = new RolePage({ role, pages: [] });

    await newRole.save();

    res.status(201).json({ message: "Role created successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

app.post("/edit-role", validateOrigin, limiter, async (req, res) => {
  const { role, pages } = req.body;

  try {
    let existingRole = await RolePage.findOne({ role });

    if (existingRole) {
      existingRole.pages = pages;
      await existingRole.save();
      return res.status(200).json({ message: "Role updated successfully" });
    } else {
      const newRole = new RolePage({ role, pages });
      await newRole.save();
      return res.status(201).json({ message: "Role created successfully" });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

app.get("/available-roles", validateOrigin, limiter, async (req, res) => {
  try {
    const rolePages = await RolePage.find().lean();

    let availableRoles = [];
    rolePages.forEach((rolePage) => {
      availableRoles.push(rolePage.role);
    });

    res.status(200).json({ roles: availableRoles });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

app.get("/get-discord-id", limiter, validateOrigin, (req, res) => {
  const token = req.query.token;

  if (!token) {
    return res.status(200).json({ error: "Token is required" });
  }

  const user = validTokens[token];

  if (user) {
    res.json({ discordId: user.id });
  } else {
    res.status(200).json({ error: "Invalid or expired token" });
  }
});

app.get("/get-discord-username", allowAxios, limiter, async (req, res) => {
  const { id } = req.query;

  if (!id) {
    return res.status(400).json({ message: "Discord ID is required" });
  }

  try {
    const userResponse = await axios.get(
      `https://discord.com/api/v10/users/${id}`,
      {
        headers: {
          Authorization: `Bot ${process.env.DISCORD_BOT_TOKEN}`,
        },
      }
    );

    if (userResponse && userResponse.data && userResponse.data.username) {
      const discordUsername = userResponse.data.username;
      res.status(200).json({ id, username: discordUsername });
    } else {
      console.error(`Unexpected user response for ID ${id}:`, userResponse);
      res.status(200).json({ message: "User not found" });
    }
  } catch (error) {
    res.status(500).json({ message: "Internal Server Error" });
  }
});

app.post("/add-roles/:id", validateOrigin, limiter, async (req, res) => {
  const id = req.params.id;
  const { roles } = req.body;

  try {
    let userRole = await UserRole.findOne({ user: id });

    if (!userRole) {
      userRole = new UserRole({ user: id, roles });
    } else {
      roles.forEach((role) => {
        if (!userRole.roles.includes(role)) {
          userRole.roles.push(role);
        }
      });
    }

    await userRole.save();

    res.status(200).json({ message: "Roles added successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

app.get("/user-role/:id", validateOrigin, limiter, async (req, res) => {
  const id = req.params.id;

  const idPattern = /^[0-9]{15,}$/;
  if (!idPattern.test(id)) {
    return res.status(200).json({ message: "Invalid ID format" });
  }

  try {
    let userRoles = await UserRole.findOne({ user: id });

    if (!userRoles) {
      userRoles = new UserRole({
        user: id,
        roles: [],
      });
      await userRoles.save();
    }

    res.status(200).json({ roles: userRoles.roles });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

app.delete(
  "/delete-role/:roleName",
  validateOrigin,
  limiter,
  async (req, res) => {
    const { roleName } = req.params;

    try {
      const roleNames = roleName.split(",").map((name) => name.trim());

      const session = await mongoose.startSession();
      session.startTransaction();

      try {
        await RolePage.deleteMany({ role: { $in: roleNames } }).session(
          session
        );

        const usersToUpdate = await UserRole.find({
          roles: { $in: roleNames },
        }).session(session);

        for (const userRole of usersToUpdate) {
          userRole.roles = userRole.roles.filter(
            (role) => !roleNames.includes(role)
          );
          await userRole.save({ session });
        }

        await session.commitTransaction();
        session.endSession();

        res.json({ message: "Role(s) deleted successfully" });
      } catch (error) {
        await session.abortTransaction();
        session.endSession();
        throw error;
      }
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Internal Server Error" });
    }
  }
);

app.delete("/remove-role/:id", validateOrigin, limiter, async (req, res) => {
  const id = req.params.id;
  const { roles } = req.body;


  try {
    let userRole = await UserRole.findOne({ user: id });

    if (!userRole) {
      return res.status(200).json({ message: "User roles not found" });
    }

    roles.forEach((role) => {
      const index = userRole.roles.indexOf(role);
      if (index !== -1) {
        userRole.roles.splice(index, 1);
      } else {
        console.log(`Role ${role} not found in user's roles`);
      }
    });

    await userRole.save();

    res
      .status(200)
      .json({
        message: "Roles removed successfully",
        updatedRoles: userRole.roles,
      });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

app
  .route("/website-admins")
  .get(validateOrigin, limiter, async (req, res) => {
    try {
      const whitelist = await AdminWhitelist.find({}, { _id: 0, id: 1 });
      res.json({ whitelist: whitelist.map((entry) => entry.id) });
    } catch (error) {
      console.error("Error:");
      res.status(500).json({ error: "Internal Server Error" });
    }
  })
  .post(validateOrigin, limiter, async (req, res) => {
    const { id } = req.body;
    if (!id) {
      return res.status(200).json({ error: "ID is required" });
    }

    try {
      const existingEntry = await AdminWhitelist.findOne({ id });
      if (!existingEntry) {
        await AdminWhitelist.create({ id });
        return res.json({ message: "ID added to admin whitelist", id });
      } else {
        return res
          .status(200)
          .json({ error: "ID already exists in admin whitelist" });
      }
    } catch (error) {
      console.error("Error:");
      res.status(500).json({ error: "Internal Server Error" });
    }
  })
  .delete(validateOrigin, limiter, async (req, res) => {
    const { id } = req.body;
    if (!id) {
      return res.status(200).json({ error: "ID is required" });
    }

    try {
      const deletedEntry = await AdminWhitelist.findOneAndDelete({ id });
      if (deletedEntry) {
        return res.json({ message: "ID removed from admin whitelist", id });
      } else {
        return res
          .status(200)
          .json({ error: "ID not found in admin whitelist" });
      }
    } catch (error) {
      console.error("Error:");
      res.status(500).json({ error: "Internal Server Error" });
    }
  });

const PORT = process.env.PORT || 8081;
app.listen(PORT, () => {
  console.log(`Server is listening on port ${PORT}`);
});
