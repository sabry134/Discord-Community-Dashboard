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
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  Paper,
  InputLabel,
  Select,
  MenuItem,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import CircularProgress from "@mui/material/CircularProgress";
import InfoIcon from "@mui/icons-material/Info";
import { Button, TextField, Snackbar } from "@mui/material";
import MuiAlert from "@material-ui/lab/Alert";

const Moderator = () => {
  const navigate = useNavigate();
  const [registeredNicknames, setRegisteredNicknames] = useState([]);
  const [showNicknameModal, setShowNicknameModal] = useState(false);
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [discordID, setDiscordID] = useState("");
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [whitelistedIDs, setWhitelistedIDs] = useState([]);
  const [searchResults, setSearchResults] = useState([]);
  const [searchErrorMessage, setSearchErrorMessage] = useState("");
  const [errorVisible, setErrorVisible] = useState(false);
  const [newNickname, setNewNickname] = useState("");
  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [hoveredItem, setHoveredItem] = useState(null);
  const [userId, setUserId] = useState("");
  const [isSearchClicked, setIsSearchClicked] = useState(false);
  const [isWarnDialogOpen, setIsWarnDialogOpen] = useState(false);
  const [isMuteDialogOpen, setIsMuteDialogOpen] = useState(false);
  const [isKickDialogOpen, setIsKickDialogOpen] = useState(false);
  const [isBanDialogOpen, setIsBanDialogOpen] = useState(false);
  const [muteDuration, setMuteDuration] = useState("");
  const [banDuration, setBanDuration] = useState("");
  const [customMuteDuration, setCustomMuteDuration] = useState("");
  const [customBanDuration, setCustomBanDuration] = useState("");
  const [customDurationType, setCustomDurationType] = useState("minute");
  const [reason, setReason] = useState("");
  const [userHistory, setUserHistory] = useState([]);
  const [isViewPunishmentsDialogOpen, setIsViewPunishmentsDialogOpen] =
    useState(false);
  const [unbanReason, setUnbanReason] = useState("");
  const [unmuteReason, setUnmuteReason] = useState("");
  const [isUnbanDialogOpen, setIsUnbanDialogOpen] = useState(false);
  const [isUnmuteDialogOpen, setIsUnmuteDialogOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [isIdValid, setIsIdValid] = useState(true);
  const [menuItemsVisibility, setMenuItemsVisibility] = useState({
    logs: false,
    admin: false,
    moderator: false,
    community_events: false,
    bot_management: false,
  });

  const handleUnmuteDialogOpen = () => setIsUnmuteDialogOpen(true);
  const handleUnmuteDialogClose = () => setIsUnmuteDialogOpen(false);

  const handleUnbanDialogOpen = () => setIsUnbanDialogOpen(true);
  const handleUnbanDialogClose = () => setIsUnbanDialogOpen(false);

  const handleUnmute = async () => {
    try {
      await axios.post("http://localhost:8081/unmute-user", {
        user_id: userId,
      });
      setIsUnmuteDialogOpen(false);
    } catch (error) {
      console.error("Failed to unmute user", error);
    }
  };

  const handleUnban = async () => {
    try {
      await axios.post("http://localhost:8081/unban-user", {
        user_id: userId,
      });
      setIsUnbanDialogOpen(false);
    } catch (error) {
      console.error("Failed to unban user", error);
    }
  };

  const handleUserIdChange = async (e) => {
    const newUserId = e.target.value;
    setUserId(newUserId);

    if (newUserId === "") {
      setIsIdValid(false);
      setIsSearchClicked(false);
      setErrorMessage("");
      return;
    }

    if (!/^\d+$/.test(newUserId)) {
      setErrorMessage("User ID must be numeric.");
      setIsIdValid(false);
      setIsSearchClicked(false);
      return;
    }

    try {
      const response = await axios.post("http://localhost:8081/is-valid-id", {
        user_id: newUserId,
      });

      if (response.data.isValid) {
        setIsIdValid(true);
        setIsSearchClicked(true);
        setErrorMessage("");
      } else {
        setIsIdValid(false);
        setErrorMessage(response.data.message || "Invalid Discord ID.");
        setIsSearchClicked(false);
      }
    } catch (error) {
      console.error("Error validating ID", error);
      setIsIdValid(false);
      setErrorMessage("Error validating ID. Please try again.");
      setIsSearchClicked(false);
    }
  };

  const handleViewPunishments = async () => {
    try {
      const response = await axios.get(
        `http://localhost:8081/user-history/${userId}`
      );
      setUserHistory(response.data.history);
      setIsViewPunishmentsDialogOpen(true);
    } catch (error) {
      console.error("Error fetching user history:", error);
    }
  };

  const handleWarnDialogOpen = () => setIsWarnDialogOpen(true);
  const handleWarnDialogClose = () => setIsWarnDialogOpen(false);

  const handleMuteDialogOpen = () => setIsMuteDialogOpen(true);
  const handleMuteDialogClose = () => setIsMuteDialogOpen(false);

  const handleKickDialogOpen = () => setIsKickDialogOpen(true);
  const handleKickDialogClose = () => setIsKickDialogOpen(false);

  const handleBanDialogOpen = () => setIsBanDialogOpen(true);
  const handleBanDialogClose = () => setIsBanDialogOpen(false);

  const handleWarn = async () => {
    const moderator = localStorage.getItem("discordID");
    try {
      await axios.post("http://localhost:8081/warn-user", {
        user_id: userId,
        reason,
        moderator,
      });
      handleWarnDialogClose();
    } catch (error) {
      console.error("Error warning user:", error);
    }
  };

  const handleMute = async () => {
    const moderator = localStorage.getItem("discordID");
    const duration =
      muteDuration === "custom"
        ? `${customMuteDuration} ${customDurationType}`
        : muteDuration;
    try {
      await axios.post("http://localhost:8081/mute-user", {
        user_id: userId,
        duration,
        reason,
        moderator,
      });
      handleMuteDialogClose();
    } catch (error) {
      console.error("Error muting user:", error);
    }
  };

  const handleKick = async () => {
    const moderator = localStorage.getItem("discordID");
    try {
      await axios.post("http://localhost:8081/kick-user", {
        user_id: userId,
        reason,
        moderator,
      });
      handleKickDialogClose();
    } catch (error) {
      console.error("Error kicking user:", error);
    }
  };

  const handleBan = async () => {
    const moderator = localStorage.getItem("discordID");
    const duration =
      banDuration === "custom"
        ? `${customBanDuration} ${customDurationType}`
        : banDuration;
    try {
      await axios.post("http://localhost:8081/ban-user", {
        user_id: userId,
        duration,
        reason,
        moderator,
      });
      handleBanDialogClose();
    } catch (error) {
      console.error("Error banning user:", error);
    }
  };

  const checkAdminPermissions = async () => {
    if (!isAdmin) {
      alert("User does not have admin permissions.");
      return false;
    }

    try {
      const storedToken = localStorage.getItem("token").trim();
      const whitelistResponse = await axios.get(
        "http://localhost:8081/website-admins"
      );
      const response = await axios.get(
        `http://localhost:8081/get-discord-id?token=${storedToken}`
      );

      const discordID = response.data.discordId;

      const { whitelist } = whitelistResponse.data;

      if (!whitelist.includes(discordID)) {
        setIsAdmin(false);
        navigate("/dashboard");
        return false;
      }

      return true;
    } catch (error) {
      console.error("Error checking admin permissions:");
      return false;
    }
  };

  const handleSnackbarClose = () => {
    setSnackbarOpen(false);
  };

  const clearSearchResults = () => {
    setSearchResults([]);
    setSearchErrorMessage("");
    setSearchQuery("");
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
        let mergedPermissions = {};

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

        if (permissions.moderator === false) {
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
            onClick={() => handleMenuItemClick("/support")}
            onMouseEnter={() => handleMenuItemHover(17)}
            onMouseLeave={handleMenuItemLeave}
          >
            <ContactSupportIcon
              style={{ marginRight: "10px", marginBottom: "-6px" }}
            />{" "}
            Support
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
        <Paper elevation={3} style={{ padding: "20px" }}>
          <TextField
            label="User ID"
            variant="outlined"
            value={userId}
            onChange={handleUserIdChange}
            fullWidth
            margin="normal"
          />

          {isIdValid && userId && (
            <div style={{ marginTop: "20px" }}>
              <Button
                variant="contained"
                color="secondary"
                onClick={handleViewPunishments}
                style={{ marginRight: "10px" }}
              >
                Past Punishments
              </Button>
              <Button
                variant="contained"
                color="warning"
                onClick={handleWarnDialogOpen}
                style={{ marginRight: "10px" }}
              >
                Warn
              </Button>
              <Button
                variant="contained"
                color="info"
                onClick={handleMuteDialogOpen}
                style={{ marginRight: "10px" }}
              >
                Mute
              </Button>
              <Button
                variant="contained"
                color="success"
                onClick={handleUnmuteDialogOpen}
                style={{ marginRight: "10px" }}
              >
                Unmute
              </Button>
              <Button
                variant="contained"
                color="error"
                onClick={handleKickDialogOpen}
                style={{ marginRight: "10px" }}
              >
                Kick
              </Button>
              <Button
                variant="contained"
                color="error"
                onClick={handleBanDialogOpen}
                style={{ marginRight: "10px" }}
              >
                Ban
              </Button>
              <Button
                variant="contained"
                color="success"
                onClick={handleUnbanDialogOpen}
              >
                Unban
              </Button>
            </div>
          )}

          {errorMessage && (
            <div style={{ marginTop: "20px", color: "red" }}>
              {errorMessage}
            </div>
          )}
        </Paper>

        <Dialog
          PaperProps={{
            style: {
              width: "600px",
              maxWidth: "90vw",
            },
          }}
          open={isWarnDialogOpen}
          onClose={handleWarnDialogClose}
        >
          <DialogTitle>Warn User</DialogTitle>
          <DialogContent>
            <TextField
              label="User ID"
              value={userId}
              variant="outlined"
              fullWidth
              disabled
              margin="normal"
            />
            <TextField
              label="Reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              variant="outlined"
              fullWidth
              margin="normal"
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={handleWarnDialogClose} color="primary">
              Cancel
            </Button>
            <Button onClick={handleWarn} color="primary">
              Warn
            </Button>
          </DialogActions>
        </Dialog>

        <Dialog
          PaperProps={{
            style: {
              width: "600px",
              maxWidth: "90vw",
            },
          }}
          open={isMuteDialogOpen}
          onClose={handleMuteDialogClose}
        >
          <DialogTitle>Mute User</DialogTitle>
          <DialogContent>
            <TextField
              label="User ID"
              value={userId}
              variant="outlined"
              fullWidth
              disabled
              margin="normal"
            />
            <InputLabel>Duration</InputLabel>
            <Select
              value={muteDuration}
              onChange={(e) => setMuteDuration(e.target.value)}
              fullWidth
              variant="outlined"
              margin="normal"
            >
              <MenuItem value="5 minutes">5 minutes</MenuItem>
              <MenuItem value="1 hour">1 hour</MenuItem>
              <MenuItem value="1 day">1 day</MenuItem>
              <MenuItem value="1 week">1 week</MenuItem>
              <MenuItem value="1 year">1 year</MenuItem>
              <MenuItem value="custom">Custom</MenuItem>
            </Select>

            {muteDuration === "custom" && (
              <div style={{ display: "flex", marginTop: "10px" }}>
                <TextField
                  label="Custom Duration"
                  type="number"
                  value={customMuteDuration}
                  onChange={(e) => setCustomMuteDuration(e.target.value)}
                  variant="outlined"
                  fullWidth
                  margin="normal"
                />
                <Select
                  value={customDurationType}
                  onChange={(e) => setCustomDurationType(e.target.value)}
                  variant="outlined"
                  style={{ marginLeft: "10px" }}
                  fullWidth
                  margin="normal"
                >
                  <MenuItem value="minute">Minute</MenuItem>
                  <MenuItem value="hour">Hour</MenuItem>
                  <MenuItem value="day">Day</MenuItem>
                  <MenuItem value="month">Month</MenuItem>
                  <MenuItem value="year">Year</MenuItem>
                </Select>
              </div>
            )}

            <TextField
              label="Reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              variant="outlined"
              fullWidth
              margin="normal"
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={handleMuteDialogClose} color="primary">
              Cancel
            </Button>
            <Button onClick={handleMute} color="primary">
              Mute
            </Button>
          </DialogActions>
        </Dialog>

        <Dialog
          PaperProps={{
            style: {
              width: "600px",
              maxWidth: "90vw",
            },
          }}
          open={isUnmuteDialogOpen}
          onClose={handleUnmuteDialogClose}
        >
          <DialogTitle>Unmute User</DialogTitle>
          <DialogContent>
            <TextField
              label="User ID"
              value={userId}
              variant="outlined"
              fullWidth
              disabled
              margin="normal"
            />
            <TextField
              label="Reason"
              value={unmuteReason}
              onChange={(e) => setUnmuteReason(e.target.value)}
              variant="outlined"
              fullWidth
              margin="normal"
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={handleUnmuteDialogClose} color="primary">
              Cancel
            </Button>
            <Button onClick={handleUnmute} color="primary">
              Unmute
            </Button>
          </DialogActions>
        </Dialog>

        <Dialog
          PaperProps={{
            style: {
              width: "600px",
              maxWidth: "90vw",
            },
          }}
          open={isKickDialogOpen}
          onClose={handleKickDialogClose}
        >
          <DialogTitle>Kick User</DialogTitle>
          <DialogContent>
            <TextField
              label="User ID"
              value={userId}
              variant="outlined"
              fullWidth
              disabled
              margin="normal"
            />
            <TextField
              label="Reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              variant="outlined"
              fullWidth
              margin="normal"
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={handleKickDialogClose} color="primary">
              Cancel
            </Button>
            <Button onClick={handleKick} color="primary">
              Kick
            </Button>
          </DialogActions>
        </Dialog>

        <Dialog
          PaperProps={{
            style: {
              width: "600px",
              maxWidth: "90vw",
            },
          }}
          open={isBanDialogOpen}
          onClose={handleBanDialogClose}
        >
          <DialogTitle>Ban User</DialogTitle>
          <DialogContent>
            <TextField
              label="User ID"
              value={userId}
              variant="outlined"
              fullWidth
              disabled
              margin="normal"
            />
            <InputLabel>Duration</InputLabel>
            <Select
              value={banDuration}
              onChange={(e) => setBanDuration(e.target.value)}
              fullWidth
              variant="outlined"
              margin="normal"
            >
              <MenuItem value="1 day">1 day</MenuItem>
              <MenuItem value="1 week">1 week</MenuItem>
              <MenuItem value="1 month">1 month</MenuItem>
              <MenuItem value="1 year">1 year</MenuItem>
              <MenuItem value="permanent">Permanent</MenuItem>
              <MenuItem value="custom">Custom</MenuItem>
            </Select>

            {banDuration === "custom" && (
              <div style={{ display: "flex", marginTop: "10px" }}>
                <TextField
                  label="Custom Duration"
                  type="number"
                  value={customBanDuration}
                  onChange={(e) => setCustomBanDuration(e.target.value)}
                  variant="outlined"
                  fullWidth
                  margin="normal"
                />
                <Select
                  value={customDurationType}
                  onChange={(e) => setCustomDurationType(e.target.value)}
                  variant="outlined"
                  style={{ marginLeft: "10px" }}
                  fullWidth
                  margin="normal"
                >
                  <MenuItem value="minute">Minute</MenuItem>
                  <MenuItem value="hour">Hour</MenuItem>
                  <MenuItem value="day">Day</MenuItem>
                  <MenuItem value="month">Month</MenuItem>
                  <MenuItem value="year">Year</MenuItem>
                </Select>
              </div>
            )}

            <TextField
              label="Reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              variant="outlined"
              fullWidth
              margin="normal"
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={handleBanDialogClose} color="primary">
              Cancel
            </Button>
            <Button onClick={handleBan} color="primary">
              Ban
            </Button>
          </DialogActions>
        </Dialog>

        <Dialog
          PaperProps={{
            style: {
              width: "600px",
              maxWidth: "90vw",
            },
          }}
          open={isUnbanDialogOpen}
          onClose={handleUnbanDialogClose}
        >
          <DialogTitle>Unban User</DialogTitle>
          <DialogContent>
            <TextField
              label="User ID"
              value={userId}
              variant="outlined"
              fullWidth
              disabled
              margin="normal"
            />
            <TextField
              label="Reason"
              value={unbanReason}
              onChange={(e) => setUnbanReason(e.target.value)}
              variant="outlined"
              fullWidth
              margin="normal"
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={handleUnbanDialogClose} color="primary">
              Cancel
            </Button>
            <Button onClick={handleUnban} color="primary">
              Unban
            </Button>
          </DialogActions>
        </Dialog>

        <Dialog
          open={isViewPunishmentsDialogOpen}
          onClose={() => setIsViewPunishmentsDialogOpen(false)}
          PaperProps={{
            style: {
              width: "600px",
              maxWidth: "90vw",
            },
          }}
        >
          <DialogTitle>Past Punishments</DialogTitle>
          <DialogContent>
            {userHistory.length > 0 ? (
              <ul>
                {userHistory.map((punishment) => (
                  <li key={punishment.id}>
                    <strong>Type:</strong> {punishment.type}
                    <br />
                    <strong>Reason:</strong> {punishment.reason}
                    <br />
                    {punishment.duration && (
                      <>
                        <strong>Duration:</strong> {punishment.duration}
                        <br />
                      </>
                    )}
                    {punishment.evidence && (
                      <>
                        <strong>Evidence: </strong>
                        <a
                          href={punishment.evidence}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          View Evidence
                        </a>
                        <br />
                      </>
                    )}
                    <strong>Moderator:</strong> {punishment.moderator}
                    <br />
                    <strong>Date:</strong>{" "}
                    {new Date(punishment.date).toLocaleString()}
                    <br />
                    <strong>Punishment ID:</strong> {punishment.id}
                  </li>
                ))}
              </ul>
            ) : (
              <p>No past punishments found.</p>
            )}
          </DialogContent>
          <DialogActions>
            <Button
              onClick={() => setIsViewPunishmentsDialogOpen(false)}
              color="primary"
            >
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
};

export default Moderator;
