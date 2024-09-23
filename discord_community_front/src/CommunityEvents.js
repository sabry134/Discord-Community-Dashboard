import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import nightBackground from "./img/sparkles_night.jpg";
import TranslateIcon from "@mui/icons-material/Translate";
import axios from "axios";
import DashboardIcon from "@mui/icons-material/Dashboard";
import ManageAccountsIcon from "@mui/icons-material/ManageAccounts";
import EngineeringIcon from "@mui/icons-material/Engineering";
import TaskIcon from "@mui/icons-material/Task";
import SportsScoreIcon from "@mui/icons-material/SportsScore";
import SettingsIcon from "@mui/icons-material/Settings";
import LockOpenIcon from "@mui/icons-material/LockOpen";
import TranslatorFavicon from "./img/icon.png";
import VideoLibraryIcon from "@mui/icons-material/VideoLibrary";
import PeopleOutlineIcon from "@mui/icons-material/PeopleOutline";
import AddTaskIcon from "@mui/icons-material/AddTask";
import AssignmentIcon from "@mui/icons-material/Assignment";
import SmartToyIcon from "@mui/icons-material/SmartToy";
import GroupIcon from "@mui/icons-material/Group";
import ShoppingCartIcon from "@mui/icons-material/ShoppingCart";
import NotificationImportantIcon from "@mui/icons-material/NotificationImportant";
import ForumIcon from "@mui/icons-material/Forum";
import ContactSupportIcon from "@mui/icons-material/ContactSupport";
import AssistantPhotoIcon from '@mui/icons-material/AssistantPhoto';
import {
  TextField,
  Typography,
  FormControlLabel,
  Checkbox,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  LinearProgress,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import CircularProgress from "@mui/material/CircularProgress";
import InfoIcon from "@mui/icons-material/Info";
import { Snackbar } from "@mui/material";
import MuiAlert from "@material-ui/lab/Alert";

const CommunityEvents = () => {
  const navigate = useNavigate();
  const [registeredNicknames, setRegisteredNicknames] = useState([]);
  const [showNicknameModal, setShowNicknameModal] = useState(false);
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [discordID, setDiscordID] = useState("");
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [whitelistedIDs, setWhitelistedIDs] = useState([]);
  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [hoveredItem, setHoveredItem] = useState(null);
  const [waitingZone, setWaitingZone] = useState(false);
  const [eventCallEnabled, setEventCallEnabled] = useState(false);
  const [eventResultsEnabled, setEventResultsEnabled] = useState(false);
  const [numMatchesChannels, setNumMatchesChannels] = useState(0);
  const [numTeamChannels, setNumTeamChannels] = useState(0);
  const [teamAnnouncement, setTeamAnnouncement] = useState(false);
  const [matchAnnouncement, setMatchAnnouncement] = useState(false);
  const [matchResults, setMatchResults] = useState(false);
  const [openDialog, setOpenDialog] = useState(false);
  const [eventAnnouncementId, setEventAnnouncementId] = useState("");
  const [announcementTitle, setAnnouncementTitle] = useState("");
  const [announcementMessage, setAnnouncementMessage] = useState("");
  const [embedColor, setEmbedColor] = useState("#FF0000");
  const [eventLoading, setEventLoading] = useState(false);
  const [menuItemsVisibility, setMenuItemsVisibility] = useState({
    logs: false,
    admin: false,
    moderator: false,
    community_events: false,
    bot_management: false,
  });

  const [loadingState, setLoadingState] = useState({
    setTournament: false,
    deleteTournament: false,
    setEvent: false,
    deleteEvent: false,
  });
  const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  const handleSnackbarClose = () => {
    setSnackbarOpen(false);
  };

  const handleWhitelistedIDs = async () => {
    try {
      const response = await axios.get("http://localhost:8081/allowed-access");
      const fetchedWhitelistedIDs = response.data.whitelist || [];

      const whitelistedIDsWithNicknames = await Promise.all(
        fetchedWhitelistedIDs.map(async (id) => {
          try {
            const userResponse = await axios.get(
              `http://localhost:8081/get-discord-username`,
              {
                params: { id },
              }
            );

            if (
              userResponse &&
              userResponse.data &&
              userResponse.data.username
            ) {
              const discordUsername = userResponse.data.username;
              return `${id} (${discordUsername})`;
            } else {
              return `${id} (Unknown)`;
            }
          } catch (error) {
            return `${id} (Unknown)`;
          }
        })
      );

      setWhitelistedIDs(whitelistedIDsWithNicknames);
    } catch (error) {
      console.error("Error fetching whitelisted IDs:");
    }
  };

  useEffect(() => {
    const fetchUser = async () => {
      try {
        let token = localStorage.getItem("token");

        if (!token) {
          token = localStorage.getItem("token");
        }

        if (!token) {
          navigate("/forbidden");
          localStorage.removeItem("token");
          return;
        }
      } catch (error) {
        console.error("Error fetching user information:");
        navigate("/error");
      }
    };

    fetchUser();
  }, [navigate]);

  useEffect(() => {
    validateToken(localStorage.getItem("token"));
  }, []);

  const handleGetDiscordID = async () => {
    try {
      const storedToken = localStorage.getItem("token").trim();

      if (storedToken == null || !storedToken) {
        navigate("/forbidden");
        return;
      }

      const response = await axios.get(
        `http://localhost:8081/get-discord-id?token=${storedToken}`
      );

      const discordID = response.data.discordId;
      localStorage.setItem("discordID", discordID);

      await checkWhitelist(discordID);
    } catch (error) {
      navigate("/forbidden");
      localStorage.removeItem("token");
    }
  };

  useEffect(() => {
    const fetchUserPermissions = async () => {
      const storedToken = localStorage.getItem("token")?.trim();

      if (!storedToken) {
        navigate("/forbidden");
        return;
      }
      const response = await axios.get(
        `http://localhost:8081/get-discord-id?token=${storedToken}`
      );

      const discordID = response.data.discordId;
      if (!discordID) {
        return;
      }

      try {
        const userRolesResponse = await axios.get(
          `http://localhost:8081/user-role/${discordID}`
        );
        const userRoles = userRolesResponse.data.roles;

        const permissions = {
          logs: false,
          admin: false,
          moderator: false,
          community_events: false,
          bot_management: false,
        };

        for (const role of userRoles) {
          const rolePermissionsResponse = await axios.get(
            `http://localhost:8081/page-visible/${role}`
          );
          const rolePermissions = rolePermissionsResponse.data;

          for (const [key, value] of Object.entries(rolePermissions)) {
            if (value === true) {
              permissions[key] = true;
            }
          }
        }

        if (permissions.community_events === false) {
                    navigate("/dashboard");
        }

        setMenuItemsVisibility(permissions);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching user roles or permissions:");
      }
    };

    fetchUserPermissions();
  }, []);

  const checkWhitelist = async (discordID) => {
    try {
      const whitelistResponse = await axios.get(
        "http://localhost:8081/website-admins"
      );
      const { whitelist } = whitelistResponse.data;

      const isAdmin = whitelist.includes(discordID);

      setIsAdmin(isAdmin);
      if (isAdmin === false) {
        navigate("/dashboard");
      }
    } catch (error) {
      console.error("Error checking whitelist:");
      navigate("/dashboard");
    }
  };

  useEffect(() => {
    handleGetDiscordID();
    handleWhitelistedIDs();
  }, []);

  const validateToken = async (token) => {
    try {
      const response = await axios.post(
        "http://localhost:8081/validate-token",
        { token: token }
      );

      if (response.data.valid) {
        setUser(response.data.user);
        document.title = "Discord Community | Admin";
        const favicon = document.querySelector('link[rel="icon"]');
        favicon.href = TranslatorFavicon;
      } else {
        navigate("/forbidden");
        localStorage.removeItem("token");
      }
    } catch (error) {
      console.error("Error validating token:");
      navigate("/error");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/");
  };

  const handleMenuItemClick = (path) => {
    navigate(path);
  };

  const handleMenuItemHover = (index) => {
    setHoveredItem(index);
  };

  const handleMenuItemLeave = () => {
    setHoveredItem(null);
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get("http://localhost:8081/event-setup");
        const data = response.data[0] || {};

        setEventAnnouncementId(
          data.event_announcements ? data.event_announcements[0] : ""
        );

        setNumMatchesChannels(data.nb_match_channels || 0);
        setNumTeamChannels(data.nb_team_channels || 0);
        setTeamAnnouncement(!!data.team_announcement_channel);
        setMatchAnnouncement(!!data.match_announcement_channel);
        setMatchResults(!!data.match_result_channel);
        setWaitingZone(!!data.event_waiting_zone);
        setEventCallEnabled(!!data.event_call);
        setEventResultsEnabled(!!data.event_results);
      } catch (error) {
        console.error("Error fetching event setup data:", error);
      }
    };

    fetchData();
  }, []);

  const handleSetTournament = async () => {
    setLoadingState({ ...loadingState, setTournament: true });
    try {
      await axios.post("http://localhost:8081/set-teams", {
      });
      await delay(100);
      await axios.post("http://localhost:8081/set-match", {
      });
      await delay(100);
      await axios.post("http://localhost:8081/set-roles", {
      });
    } catch (error) {
      console.error("Error setting up tournament:", error);
    } finally {
      setLoadingState({ ...loadingState, setTournament: false });
    }
  };

  const handleDeleteTournament = async () => {
    setLoadingState({ ...loadingState, deleteTournament: true });
    try {
      await axios.post("http://localhost:8081/delete-team", {
        /* Data for team deletion */
      });
      await delay(100);
      await axios.post("http://localhost:8081/delete-match", {
        /* Data for match deletion */
      });
      await delay(100);
      await axios.post("http://localhost:8081/delete-roles", {
        /* Data for roles deletion */
      });
    } catch (error) {
      console.error("Error deleting tournament:", error);
    } finally {
      setLoadingState({ ...loadingState, deleteTournament: false });
    }
  };

  const handleSubmit = async () => {
    const payload = {
      event_announcements: [eventAnnouncementId],
      nb_match_channels: numMatchesChannels,
      nb_team_channels: numTeamChannels,
      team_announcement_channel: teamAnnouncement,
      match_announcement_channel: matchAnnouncement,
      match_result_channel: matchResults,
      event_waiting_zone: waitingZone,
      event_call: eventCallEnabled,
      event_results: eventResultsEnabled,
    };

    try {
      await axios.post("http://localhost:8081/event-setup", payload);
      alert("Data submitted successfully");
    } catch (error) {
      console.error("Error submitting data:", error);
    }
  };

  const handleSetEvent = async () => {
    setLoadingState({ ...loadingState, setEvent: true });
    try {
      await axios.post("http://localhost:8081/set-event", {
        /* Data for event setup */
      });
    } catch (error) {
      console.error("Error setting up event:", error);
    } finally {
      setLoadingState({ ...loadingState, setEvent: false });
    }
  };

  const handleDeleteEvent = async () => {
    setLoadingState({ ...loadingState, deleteEvent: true });
    try {
      await axios.post("http://localhost:8081/delete-event", {
        /* Data for event deletion */
      });
    } catch (error) {
      console.error("Error deleting event:", error);
    } finally {
      setLoadingState({ ...loadingState, deleteEvent: false });
    }
  };

  const handleAnnouncementSubmit = async () => {
    try {
      await axios.post("http://localhost:8081/event-announcement", {
        event_title: announcementTitle,
        event_message: announcementMessage,
        embed_color: embedColor,
      });
      handleCloseDialog();
    } catch (error) {
      console.error("Error submitting announcement:", error);
    }
  };

  const handleOpenDialog = () => {
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setAnnouncementMessage("");
    setAnnouncementTitle("");
    setEmbedColor("#FF0000");
  };

  if (loading) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
        }}
      >
        <CircularProgress />
      </div>
    );
  }

  return (
    <div style={{ ...styles.container }}>
      {user && (
        <div style={styles.userContainer}>
          <div style={styles.userInfoContainer}>
            <div style={styles.userImageContainer}>
              <img
                src={user.avatar}
                alt={user.username}
                style={styles.userImage}
              />
            </div>
            <div style={styles.userInfo}>
              <p style={styles.userName}>{user.username}</p>

              <button
                onClick={handleLogout}
                variant="contained"
                color="primary"
                style={styles.logoutButton}
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      )}
      <div style={styles.menu}>
        <ul style={styles.menuList}>
          <li
            style={
              hoveredItem === 0
                ? { ...styles.menuItem, backgroundColor: "black" }
                : styles.menuItem
            }
            onClick={() => handleMenuItemClick("/dashboard")}
            onMouseEnter={() => handleMenuItemHover(0)}
            onMouseLeave={handleMenuItemLeave}
          >
            <DashboardIcon
              style={{ marginRight: "10px", marginBottom: "-6px" }}
            />{" "}
            Dashboard
          </li>
          <li
            style={
              hoveredItem === 1
                ? { ...styles.menuItem, backgroundColor: "black" }
                : styles.menuItem
            }
            onClick={() => handleMenuItemClick("/announcements")}
            onMouseEnter={() => handleMenuItemHover(1)}
            onMouseLeave={handleMenuItemLeave}
          >
            <NotificationImportantIcon
              style={{ marginRight: "10px", marginBottom: "-6px" }}
            />{" "}
            Announcements
          </li>
          <li
            style={
              hoveredItem === 16
                ? { ...styles.menuItem, backgroundColor: "black" }
                : styles.menuItem
            }
            onClick={() => handleMenuItemClick("/community")}
            onMouseEnter={() => handleMenuItemHover(16)}
            onMouseLeave={handleMenuItemLeave}
          >
            <ForumIcon style={{ marginRight: "10px", marginBottom: "-6px" }} />{" "}
            Community
          </li>
          <li
            style={
              hoveredItem === 18
                ? { ...styles.menuItem, backgroundColor: "black" }
                : styles.menuItem
            }
            onClick={() => handleMenuItemClick("/recruitment")}            onMouseEnter={() => handleMenuItemHover(18)}
            onMouseLeave={handleMenuItemLeave}
          >
            <AssistantPhotoIcon              style={{ marginRight: "10px", marginBottom: "-6px" }}
            />{" "}
            Recruitment
          </li>

          <li
            style={
              hoveredItem === 15
                ? { ...styles.menuItem, backgroundColor: "black" }
                : styles.menuItem
            }
            onClick={() => handleMenuItemClick("/role_shop")}
            onMouseEnter={() => handleMenuItemHover(15)}
            onMouseLeave={handleMenuItemLeave}
          >
            <ShoppingCartIcon
              style={{ marginRight: "10px", marginBottom: "-6px" }}
            />{" "}
            Role Shop
          </li>
          <li
            style={
              hoveredItem === 17
                ? { ...styles.menuItem, backgroundColor: "black" }
                : styles.menuItem
            }
            onClick={() => handleMenuItemClick("/self_services")}
            onMouseEnter={() => handleMenuItemHover(17)}
            onMouseLeave={handleMenuItemLeave}
          >
            <ContactSupportIcon
              style={{ marginRight: "10px", marginBottom: "-6px" }}
            />{" "}
            Self-Services
          </li>
          <li
            style={
              hoveredItem === 7
                ? { ...styles.menuItem, backgroundColor: "black" }
                : styles.menuItem
            }
            onClick={() => handleMenuItemClick("/settings")}
            onMouseEnter={() => handleMenuItemHover(7)}
            onMouseLeave={handleMenuItemLeave}
          >
            <SettingsIcon
              style={{ marginRight: "10px", marginBottom: "-6px" }}
            />{" "}
            Settings
          </li>
          {menuItemsVisibility.bot_management && (
            <li
              style={
                hoveredItem === 10
                  ? { ...styles.menuItem, backgroundColor: "black" }
                  : styles.menuItem
              }
              onClick={() => handleMenuItemClick("/bot_management")}
              onMouseEnter={() => handleMenuItemHover(10)}
              onMouseLeave={handleMenuItemLeave}
            >
              <SmartToyIcon
                style={{ marginRight: "10px", marginBottom: "-6px" }}
              />{" "}
              Bot Management
            </li>
          )}
          {menuItemsVisibility.community_events && (
            <li
              style={
                hoveredItem === 11
                  ? { ...styles.menuItem, backgroundColor: "black" }
                  : styles.menuItem
              }
              onClick={() => handleMenuItemClick("/community_events")}
              onMouseEnter={() => handleMenuItemHover(11)}
              onMouseLeave={handleMenuItemLeave}
            >
              <SportsScoreIcon
                style={{ marginRight: "10px", marginBottom: "-6px" }}
              />{" "}
              Community Events
            </li>
          )}

          {menuItemsVisibility.logs && (
            <li
              style={
                hoveredItem === 3
                  ? { ...styles.menuItem, backgroundColor: "black" }
                  : styles.menuItem
              }
              onClick={() => handleMenuItemClick("/logs")}
              onMouseEnter={() => handleMenuItemHover(3)}
              onMouseLeave={handleMenuItemLeave}
            >
              <LockOpenIcon
                style={{ marginRight: "10px", marginBottom: "-6px" }}
              />{" "}
              Logs
            </li>
          )}
          {menuItemsVisibility.moderator && (
            <li
              style={
                hoveredItem === 9
                  ? { ...styles.menuItem, backgroundColor: "black" }
                  : styles.menuItem
              }
              onClick={() => handleMenuItemClick("/moderator")}
              onMouseEnter={() => handleMenuItemHover(9)}
              onMouseLeave={handleMenuItemLeave}
            >
              <ManageAccountsIcon
                style={{ marginRight: "10px", marginBottom: "-6px" }}
              />{" "}
              Moderator
            </li>
          )}
          {menuItemsVisibility.admin && (
            <li
              style={
                hoveredItem === 8
                  ? { ...styles.menuItem, backgroundColor: "black" }
                  : styles.menuItem
              }
              onClick={() => handleMenuItemClick("/admin")}
              onMouseEnter={() => handleMenuItemHover(8)}
              onMouseLeave={handleMenuItemLeave}
            >
              <EngineeringIcon
                style={{ marginRight: "10px", marginBottom: "-6px" }}
              />{" "}
              Admin
            </li>
          )}
        </ul>
      </div>

      <div style={styles.whiteContainer}>
        <Typography variant="h4" gutterBottom>
          Community Events Settings
        </Typography>

        <div style={styles.buttonContainer}>
          <div style={styles.buttonWrapper}>
            {loadingState.setTournament && (
              <CircularProgress size={24} style={styles.loadingIcon} />
            )}
            <Button
              variant="contained"
              color="primary"
              onClick={handleSetTournament}
              style={styles.button}
            >
              Set Tournament
            </Button>
          </div>
          <div style={styles.buttonWrapper}>
            {loadingState.setEvent && (
              <CircularProgress size={24} style={styles.loadingIcon} />
            )}
            <Button
              variant="contained"
              color="primary"
              onClick={handleSetEvent}
              style={styles.button}
            >
              Set Event
            </Button>
          </div>
          <div style={styles.buttonWrapper}>
            {loadingState.deleteTournament && (
              <CircularProgress size={24} style={styles.loadingIcon} />
            )}
            <Button
              variant="contained"
              color="primary"
              onClick={handleDeleteTournament}
              style={styles.button}
            >
              Delete Tournament
            </Button>
          </div>
          <div style={styles.buttonWrapper}>
            {loadingState.deleteEvent && (
              <CircularProgress size={24} style={styles.loadingIcon} />
            )}
            <Button
              variant="contained"
              color="primary"
              onClick={handleDeleteEvent}
              style={styles.button}
            >
              Delete Event
            </Button>
          </div>
          <Button
            variant="contained"
            color="primary"
            onClick={handleOpenDialog}
            style={styles.button}
          >
            New Announcement
          </Button>
        </div>
        <br></br>
        <Typography><strong>Info:</strong> If the process of creating/deleting a tournament didn't fully complete, you may press the button again for it to finish proceeding.</Typography>
        <br></br>

        <TextField
          label="Event Announcement Channel ID"
          variant="outlined"
          value={eventAnnouncementId}
          onChange={(e) => setEventAnnouncementId(e.target.value)}
          fullWidth
          style={{ marginTop: "16px" }}
        />

        <TextField
          label="Number of matches channels"
          variant="outlined"
          type="number"
          value={numMatchesChannels}
          onChange={(e) => {
            const value =
              e.target.value === "" ? "" : parseInt(e.target.value, 10);
            if (value === "" || (!isNaN(value) && value >= 0 && value <= 15)) {
              setNumMatchesChannels(value);
            }
          }}
          inputProps={{ min: 0, max: 15, inputMode: "numeric" }}
          fullWidth
          style={{ marginTop: "16px" }}
        />

        <TextField
          label="Number of team channels"
          variant="outlined"
          type="number"
          value={numTeamChannels}
          onChange={(e) => {
            const value =
              e.target.value === "" ? "" : parseInt(e.target.value, 10);
            if (value === "" || (!isNaN(value) && value >= 0 && value <= 15)) {
              setNumTeamChannels(value);
            }
          }}
          inputProps={{ min: 0, max: 15, inputMode: "numeric" }}
          fullWidth
          style={{ marginTop: "16px" }}
        />

        <FormControlLabel
          control={
            <Checkbox
              checked={teamAnnouncement}
              onChange={(e) => setTeamAnnouncement(e.target.checked)}
            />
          }
          label="Team Announcement channel"
          style={{ marginTop: "16px" }}
        />

        <FormControlLabel
          control={
            <Checkbox
              checked={matchAnnouncement}
              onChange={(e) => setMatchAnnouncement(e.target.checked)}
            />
          }
          label="Match Announcement channel"
          style={{ marginTop: "16px" }}
        />

        <FormControlLabel
          control={
            <Checkbox
              checked={matchResults}
              onChange={(e) => setMatchResults(e.target.checked)}
            />
          }
          label="Match Results channel"
          style={{ marginTop: "16px" }}
        />

        <FormControlLabel
          control={
            <Checkbox
              checked={waitingZone}
              onChange={(e) => setWaitingZone(e.target.checked)}
            />
          }
          label="Waiting Zone"
          style={{ marginTop: "16px" }}
        />

        <FormControlLabel
          control={
            <Checkbox
              checked={eventCallEnabled}
              onChange={(e) => setEventCallEnabled(e.target.checked)}
            />
          }
          label="Event Call"
          style={{ marginTop: "16px" }}
        />

        <FormControlLabel
          control={
            <Checkbox
              checked={eventResultsEnabled}
              onChange={(e) => setEventResultsEnabled(e.target.checked)}
            />
          }
          label="Event Results Channel"
          style={{ marginTop: "16px" }}
        />
        <br></br>

        <Button
          variant="contained"
          color="primary"
          onClick={handleSubmit}
          style={{ marginTop: "16px" }}
        >
          Set
        </Button>

        {/* Event Announcement Dialog */}
        <Dialog open={openDialog} onClose={handleCloseDialog}>
          <DialogTitle>Event Announcement</DialogTitle>
          <DialogContent>
            <TextField
              label="Event Title"
              variant="outlined"
              value={announcementTitle}
              onChange={(e) => setAnnouncementTitle(e.target.value)}
              fullWidth
              style={{ marginBottom: "16px" }}
            />
            <TextField
              label="Event Message"
              variant="outlined"
              value={announcementMessage}
              onChange={(e) => setAnnouncementMessage(e.target.value)}
              fullWidth
              multiline
              rows={4}
              style={{ marginBottom: "16px" }}
            />
            <TextField
              label="Embed Color (hex)"
              variant="outlined"
              value={embedColor}
              onChange={(e) => setEmbedColor(e.target.value)}
              fullWidth
              style={{ marginBottom: "16px" }}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={handleAnnouncementSubmit} color="primary">
              Submit
            </Button>
            <Button onClick={handleCloseDialog} color="primary">
              Close
            </Button>
          </DialogActions>
        </Dialog>
      </div>
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <MuiAlert
          elevation={6}
          variant="filled"
          onClose={handleSnackbarClose}
          severity={
            snackbarMessage.includes(
              "You can only submit one bug report per week."
            ) ||
            snackbarMessage.includes(
              "You can only submit one bug report per day."
            ) ||
            snackbarMessage.includes("Please fill out all fields") ||
            snackbarMessage.includes(
              "An error occurred while creating the issue"
            ) ||
            snackbarMessage.includes("Please enter a valid YouTube link")
              ? "error"
              : "success"
          }
        >
          {snackbarMessage}
        </MuiAlert>
      </Snackbar>
    </div>
  );
};

const styles = {
  container: {
    display: "flex",
    minHeight: "100vh",
    backgroundImage: `url(${nightBackground})`,
  },
  logoutButton: {
    backgroundColor: "#4CAF50",
    color: "white",
    padding: "10px 15px",
    border: "none",
    borderRadius: "5px",
    cursor: "pointer",
    transition: "background-color 0.3s",
    boxShadow: "0 4px 8px rgba(0, 0, 0, 0.1)",
    fontSize: "16px",
    marginTop: "10px",
  },

  menu: {
    width: "11%",
    backgroundColor: "#333",
    padding: "20px",
    color: "#fff",
  },
  menuList: {
    listStyle: "none",
    padding: 0,
  },
  menuItem: {
    padding: "10px",
    position: "relative",
    marginBottom: "10px",
    cursor: "pointer",
    fontSize: "16px",
    marginTop: "30px",
    transition: "background-color 0.3s",
  },
  userContainer: {
    position: "absolute",
    top: "10px",
    right: "10px",
  },
  userInfoContainer: {
    backgroundColor: "white",
    padding: "20px",
    width: "200px",
    borderRadius: "10px",
    boxShadow: "0 4px 8px rgba(0, 0, 0, 0.1)",
    marginBottom: "20px",
    display: "flex",
    alignItems: "center",
  },
  userImageContainer: {
    marginRight: "10px",
    marginBottom: "24%",
  },
  userImage: {
    width: "30px",
    height: "30px",
    borderRadius: "50%",
  },
  userInfo: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
  },
  userName: {
    marginTop: "10%",
  },
  whiteContainer: {
    backgroundColor: "rgba(255, 255, 255, 0.8)",
    padding: "20px",
    borderRadius: "10px",
    boxShadow: "0 4px 8px rgba(0, 0, 0, 0.1)",
    width: "40%",
    margin: "20px auto",
    marginBottom: "auto",
    marginTop: "5%",
  },
  searchBar: {
    display: "flex",
    alignItems: "center",
    marginBottom: "20px",
  },
  taskItem: {
    border: "1px solid #ccc",
    borderRadius: "8px",
    padding: "10px",
    marginBottom: "10px",
    backgroundColor: "rgba(255, 255, 255, 0.7)",
  },
  modal: {
    position: "fixed",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    background: "rgba(0, 0, 0, 0.5)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    overflowY: "auto",
    zIndex: 1000,
  },
  modalContent: {
    marginTop: "15%",
    marginBottom: "5%",
    background: "white",
    padding: "20px",
    borderRadius: "8px",
    textAlign: "center",
  },
  input: {
    borderRadius: "4px",
    border: "1px solid #ccc",
    fontSize: "16px",
    width: "200px",
    marginBottom: "10px",
  },

  modalButton: {
    padding: "8px",
    borderRadius: "4px",
    backgroundColor: "orange",
    color: "white",
    cursor: "pointer",
    fontSize: "16px",
    border: "none",
    marginLeft: "5px",
  },
  modalOpen: {},
  errorMessageModal: {
    color: "white",
    fontSize: "14px",
    backgroundColor: "red",
    padding: "8px",
    borderRadius: "4px",
  },
  registeredButton: {
    position: "fixed",
    top: "2%",
    right: "210px",
    padding: "10px",
    cursor: "pointer",
    fontSize: "14px",
    borderRadius: "50px",
    backgroundColor: "orange",
    border: "none",
    color: "white",
  },
  addUserButton: {
    position: "fixed",
    top: "2%",
    right: "390px",
    padding: "10px",
    cursor: "pointer",
    fontSize: "14px",
    borderRadius: "50px",
    backgroundColor: "orange",
    border: "none",
    color: "white",
  },
  whitelistedButton: {
    padding: "8px",
    borderRadius: "4px",
    backgroundColor: "orange",
    color: "white",
    cursor: "pointer",
    fontSize: "16px",
    border: "none",
    marginLeft: "5px",
  },
  formField: {
    margin: "10px 0",
  },
  buttonContainer: {
    display: "flex",
    flexWrap: "wrap",
    gap: "16px",
  },
  buttonWrapper: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },
  button: {
    flexShrink: 0,
  },
  loadingIcon: {
    marginLeft: "8px",
  },
};

export default CommunityEvents;
