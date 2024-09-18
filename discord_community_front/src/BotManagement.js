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
import commandImage from "./img/command.png";
import ShoppingCartIcon from "@mui/icons-material/ShoppingCart";
import NotificationImportantIcon from "@mui/icons-material/NotificationImportant";
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
  Paper,
  DialogActions,
  Typography,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import CircularProgress from "@mui/material/CircularProgress";
import InfoIcon from "@mui/icons-material/Info";
import { Button, TextField, Snackbar } from "@mui/material";
import MuiAlert from "@material-ui/lab/Alert";
import ForumIcon from "@mui/icons-material/Forum";
import ContactSupportIcon from "@mui/icons-material/ContactSupport";
import AssistantPhotoIcon from '@mui/icons-material/AssistantPhoto';

const BotManagement = () => {
  const navigate = useNavigate();
  const [registeredNicknames, setRegisteredNicknames] = useState([]);
  const [showNicknameModal, setShowNicknameModal] = useState(false);
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [discordID, setDiscordID] = useState("");
  const [loading, setLoading] = useState(true);
  const [isRunning, setIsRunning] = useState(false);
  const [botLoading, setBotLoading] = useState(false);
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
  const [commands, setCommands] = useState([]);
  const [commandStatus, setCommandStatus] = useState({});
  const [menuItemsVisibility, setMenuItemsVisibility] = useState({
    logs: false,
    admin: false,
    moderator: false,
    community_events: false,
    bot_management: false,
  });

  useEffect(() => {
    checkBotStatus();
    fetchCommands();
  }, []);

  const fetchCommands = async () => {
    try {
      const response = await axios.get('http://localhost:8081/custom-commands');
      const commandNames = Object.keys(response.data.commands);
      setCommands(commandNames);
      fetchCommandStatus(commandNames);
    } catch (error) {
      console.error('Error fetching commands:', error);
    }
  };

  const fetchCommandStatus = async (commandNames) => {
    const status = {};
    for (const commandName of commandNames) {
      try {
        const response = await axios.get(`http://localhost:8081/is-disabled/${commandName}`);
        status[commandName] = response.data.isDisabled;
      } catch (error) {
        console.error(`Error fetching status for command ${commandName}:`, error);
      }
    }
    setCommandStatus(status);
  };

  const toggleCommandStatus = async (commandName) => {
    try {
      const isDisabled = commandStatus[commandName];
      if (isDisabled) {
        await axios.post(`http://localhost:8081/enable-command/${commandName}`);
      } else {
        await axios.post(`http://localhost:8081/disable-command/${commandName}`);
      }
      setCommandStatus(prevStatus => ({
        ...prevStatus,
        [commandName]: !isDisabled
      }));
    } catch (error) {
      console.error(`Error toggling status for command ${commandName}:`, error);
    }
  };

  const startBot = async () => {
    setBotLoading(true);
    try {
      await axios.get('http://localhost:8081/start-bot');
      checkBotStatus();
    } catch (error) {
      console.error('Error starting bot:', error);
    } finally {
      setBotLoading(false);
    }
  };

  const stopBot = async () => {
    setBotLoading(true);
    try {
      await axios.get('http://localhost:8081/stop-bot');
      checkBotStatus();
    } catch (error) {
      console.error('Error stopping bot:', error);
    } finally {
      setBotLoading(false);
    }
  };

  const checkBotStatus = async () => {
    try {
      const response = await axios.get('http://localhost:8081/is-running');
      setIsRunning(response.data.isRunning);
    } catch (error) {
      console.error('Error checking bot status:', error);
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

  const handleSearch = async () => {
    if (!isAdmin) {
      alert("User does not have admin permissions to save nickname.");
      return;
    }
    if (!checkAdminPermissions()) return;
    try {
      const response = await axios.get(
        `http://localhost:8081/tasks/${searchQuery.toLowerCase()}`
      );
      setSearchResults(response.data.tasks || []);

      if (!response.data.tasks || response.data.tasks.length === 0) {
        setSearchErrorMessage("Tasks of this user are empty.");
        setErrorVisible(true);

        setTimeout(() => {
          setErrorVisible(false);
        }, 3000);
      } else {
        setSearchErrorMessage("");
      }
    } catch (error) {
      console.error("Error fetching search results:");
      setSearchErrorMessage("Error fetching results. Please try again.");
      clearSearchResults();
    }
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

        if (permissions.bot_management === false) {
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
      <Typography variant="h4" gutterBottom>
        Bot Control Panel
      </Typography>
      <div>
        <span
          style={{
            ...styles.statusDot,
            ...(isRunning ? styles.running : styles.stopped),
          }}
        ></span>
        <Typography variant="body1" display="inline">
          {isRunning ? 'Bot is running' : 'Bot is not running'}
        </Typography>
        {botLoading && (
          <CircularProgress size={20} style={styles.loadingIndicator} />
        )}
      </div>
      <Button
        style={isRunning || botLoading ? styles.disabledButton : styles.button}
        onClick={startBot}
        disabled={isRunning || botLoading}
        variant="contained"
        color="primary"
      >
        Start Bot
      </Button>
      <Button
        style={!isRunning || botLoading ? styles.disabledButton : styles.button}
        onClick={stopBot}
        disabled={!isRunning || botLoading}
        variant="contained"
        color="secondary"
      >
        Stop Bot
      </Button>

      <div style={styles.commandGrid}>
        {commands.map((commandName, index) => (
          <Paper key={index} elevation={3} style={styles.commandContainer}>
            <img
              src={commandImage}
              alt={commandName}
              style={styles.commandImage}
            />
            <Typography variant="h6">{commandName}</Typography>
            <Button
              style={styles.button}
              onClick={() => toggleCommandStatus(commandName)}
              variant="contained"
              color={commandStatus[commandName] ? 'primary' : 'secondary'}
            >
              {commandStatus[commandName] ? 'Enable Command' : 'Disable Command'}
            </Button>
          </Paper>
        ))}
      </div>
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
    width: "50%",
    margin: "20px auto",
    marginBottom: "auto",
    marginTop: "5%",
    textAlign: "center",
  },
  statusDot: {
    display: "inline-block",
    width: "10px",
    height: "10px",
    borderRadius: "50%",
    marginRight: "10px",
  },
  running: {
    backgroundColor: "green",
  },
  stopped: {
    backgroundColor: "yellow",
  },
  button: {
    margin: "10px",
  },
  disabledButton: {
    margin: "10px",
    backgroundColor: "grey",
    cursor: "not-allowed",
  },
  loadingIndicator: {
    marginLeft: "10px",
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
  commandGrid: {
    display: "flex",
    flexWrap: "wrap",
    justifyContent: "space-around",
    marginTop: "20px",
  },
  commandContainer: {
    padding: "15px",
    margin: "10px",
    textAlign: "center",
    width: "40%",
  },
  commandImage: {
    width: "50px",
    height: "50px",
    marginBottom: "10px",
  },
};

export default BotManagement;
