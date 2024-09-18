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
import VideoLibraryIcon from '@mui/icons-material/VideoLibrary';
import PeopleOutlineIcon from "@mui/icons-material/PeopleOutline";
import AddTaskIcon from '@mui/icons-material/AddTask';
import AssignmentIcon from "@mui/icons-material/Assignment";
import SmartToyIcon from '@mui/icons-material/SmartToy';
import GroupIcon from '@mui/icons-material/Group';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import NotificationImportantIcon from '@mui/icons-material/NotificationImportant';
import ForumIcon from '@mui/icons-material/Forum';
import ContactSupportIcon from '@mui/icons-material/ContactSupport';
import AssistantPhotoIcon from '@mui/icons-material/AssistantPhoto';import {
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
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import CircularProgress from '@mui/material/CircularProgress';
import InfoIcon from "@mui/icons-material/Info";
import {
  Button,
  TextField,
  Snackbar,
  Paper,
  Divider,
} from "@mui/material";
import MuiAlert from "@material-ui/lab/Alert";

const Logs = () => {
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
  const [users, setUsers] = useState([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [hoveredItem, setHoveredItem] = useState(null);
  const [error, setError] = useState("");
  const [logs, setLogs] = useState([]);
  const [menuItemsVisibility, setMenuItemsVisibility] = useState({

          logs: false,
          admin: false,
          moderator: false,
  });

  useEffect(() => {
    const fetchAuditLogs = async () => {
      try {
        const response = await axios.get("http://localhost:8081/audit-logs");
  
        const usernameCache = {};
        const userIdsToFetch = new Set();
  
        response.data.audit_log_entries.forEach((log) => {
          if (!usernameCache[log.user_id] && !userIdsToFetch.has(log.user_id)) {
            userIdsToFetch.add(log.user_id);
          }
        });
  
        const fetchUsernames = Array.from(userIdsToFetch).map(async (userId) => {
          try {
            const userResponse = await axios.get(`http://localhost:8081/discord-username/${userId}`);
            const username = userResponse?.data?.username || "Unknown User";
            usernameCache[userId] = username;
          } catch (error) {
            console.error(`Failed to fetch username for user ID ${userId}:`, error);
            usernameCache[userId] = "Unknown User";
          }
        });
  
        await Promise.all(fetchUsernames);
  
        const logsWithUsernames = response.data.audit_log_entries.map((log) => {
          return { ...log, username: usernameCache[log.user_id] || "Unknown User" };
        });
  
        setLogs(logsWithUsernames);
      } catch (err) {
        setError("Failed to fetch audit logs");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
  
    fetchAuditLogs();
  }, []);
  
  
  

  const formatLogEntry = (log) => {
    const user = log.username || "Unknown User";
    const target = log.target_id ? users.find((user) => user.id === log.target_id) : null;

    let actionText = "";

    switch (log.action_type) {
      case 1:
        actionText = `${user} enabled the widget.`;
        break;
      case 10:
        actionText = `${user} created a new channel: ${log.target_name}.`;
        break;
      case 11:
        actionText = `${user} updated the channel ${log.target_name}.`;
        break;
      case 12:
        actionText = `${user} deleted the channel ${log.target_name}.`;
        break;
      case 20:
        actionText = `${user} created a new role: ${log.target_name}.`;
        break;
      case 21:
        actionText = `${user} updated the role ${log.target_name} with changes: ${log.changes
          .map((change) => `${change.key}: ${change.new_value}`)
          .join(", ")}.`;
        break;
      case 22:
        actionText = `${user} deleted the role ${log.target_name}.`;
        break;
      case 23:
        actionText = `${user} added ${log.changes
          .map((change) => change.new_value.map((item) => item.name).join(", "))
          .join(", ")} to role ${log.target_name}.`;
        break;
      // case 24:
      //   actionText = `${user} removed ${log.changes
      //     .map((change) => change.old_value.map((item) => item.name).join(", "))
      //     .join(", ")} from role ${log.target_name}.`;
      //   break;
      case 25:
        actionText = `${user} ${log.changes
          .map((change) => {
            const action = change.key === "$add" ? "added" : "removed";
            return `${action} ${change.new_value.map((item) => item.name).join(", ")}`;
          })
          .join(", ")}.`;
        break;
      case 30:
        actionText = `${user} updated the role ${target?.username || "Unknown Role"} with changes: ${log.changes
          .map((change) => `${change.key}: ${change.new_value}`)
          .join(", ")}.`;
        break;
      case 31:
        actionText = `${user} renamed the role ${target?.username || "Unknown Role"} from "${
          log.changes.find((change) => change.key === "old_value")?.old_value || "Unknown"
        }" to "${log.changes.find((change) => change.key === "new_value")?.new_value || "Unknown"}".`;
        break;
      case 32:
        actionText = `${user} updated the guild settings with changes: ${log.changes
          .map((change) => `${change.key}: ${change.new_value}`)
          .join(", ")}.`;
        break;
      case 40:
        actionText = `${user} kicked ${target?.username || "Unknown User"} from the server.`;
        break;
      case 41:
        actionText = `${user} banned ${target?.username || "Unknown User"} from the server.`;
        break;
      case 42:
        actionText = `${user} unbanned ${target?.username || "Unknown User"} from the server.`;
        break;
      case 43:
        actionText = `${user} updated the server settings with changes: ${log.changes
          .map((change) => `${change.key}: ${change.new_value}`)
          .join(", ")}.`;
        break;
      case 44:
        actionText = `${user} updated a user's permissions with changes: ${log.changes
          .map((change) => `${change.key}: ${change.new_value}`)
          .join(", ")}.`;
        break;
      default:
        actionText = `Unknown action type ${log.action_type}.`;
    }

    return actionText;
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
        navigate("/dashboard");        return false;
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

  const handleDelete = async () => {
    if (!isAdmin) {
      alert("User does not have admin permissions to save nickname.");
      return;
    }
    if (!checkAdminPermissions()) return;
    try {
      const apiUrl = `http://localhost:8081/tasks/${searchQuery.toLowerCase()}`;

      await axios.delete(apiUrl);

      setSearchResults([]);
    } catch (error) {
      console.error(`Error deleting tasks:`);
    }
  };

  const handleDeleteNickname = (nickname) => {
    axios
      .delete(`http://localhost:8081/nickname/${nickname}`)
      .then((response) => {
        setSnackbarMessage("Nickname deleted successfully");
        setSnackbarOpen(true);
        setRegisteredNicknames(
          registeredNicknames.filter((n) => n !== nickname)
        );
      })
      .catch((error) => {
        console.error("Error deleting nickname:");
      });
  };

  const handleRegisteredNicknames = async () => {
    if (!isAdmin) {
      alert("User does not have admin permissions to save nickname.");
      return;
    }
    if (!checkAdminPermissions()) return;
    try {
      const response = await axios.get("http://localhost:8081/nickname");
      const nicknames = response.data.nicknames || [];
      setShowNicknameModal(true);
      setRegisteredNicknames(nicknames.map((nickname) => nickname.nickname));
    } catch (error) {
      console.error("Error fetching registered nicknames:");
    }
  };

  const handleAddUser = () => {
    if (!isAdmin) {
      alert("User does not have admin permissions to save nickname.");
      return;
    }
    if (!checkAdminPermissions()) return;
    setShowAddUserModal(true);
  };

  const handleClearNickname = () => {
    if (!isAdmin) {
      alert("User does not have admin permissions to save nickname.");
      return;
    }
    if (!checkAdminPermissions()) return;
    axios
      .delete("http://localhost:8081/nickname")
      .then((response) => {
        setRegisteredNicknames([]);
      })
      .catch((error) => {
        console.error("Error clearing nickname:");
      });
  };

  const handleSaveNickname = async () => {
    try {
      if (!isAdmin) {
        alert("User does not have admin permissions to save nickname.");
        return;
      }
      if (!checkAdminPermissions()) return;
      const response = await axios.post("http://localhost:8081/nickname", {
        nickname: newNickname,
      });
      setRegisteredNicknames((prevNicknames) => [
        ...prevNicknames,
        newNickname,
      ]);

      setNewNickname("");
    } catch (error) {
      console.error("Error saving nickname:");
    }
  };

  const handleSaveUser = async () => {
    if (!isAdmin) {
      alert("User does not have admin permissions to save nickname.");
      return;
    }
    if (!checkAdminPermissions()) return;
    const isValidDiscordID = /^\d{1,20}$/.test(discordID);

    if (!isValidDiscordID) {
      alert("Error. Make sure to only enter numbers and up to 20 characters.");
      return;
    }

    try {
      const response = await axios.get("http://localhost:8081/allowed-access");
      const { whitelist } = response.data;

      if (whitelist.includes(discordID)) {
        alert("This user is already whitelisted.");
        return;
      }

      const data = {
        id: discordID,
      };

      await axios.post("http://localhost:8081/allowed-access", data);

      setShowAddUserModal(false);
      setDiscordID("");
      window.location.reload();
    } catch (error) {
      console.error("Error saving user:");
    }
  };

  const handleDeleteUser = async () => {
    if (!isAdmin) {
      alert("User does not have admin permissions to save nickname.");
      return;
    }
    if (!checkAdminPermissions()) return;
    const isValidDiscordID = /^\d{1,20}$/.test(discordID);

    if (!isValidDiscordID) {
      alert("Error. Make sure to only enter numbers and up to 20 characters.");
      return;
    }
    if (discordID === "495265351270137883") {
      alert("This user cannot be removed from the whitelist.");
      return;
    }

    try {
      const response = await axios.delete(
        "http://localhost:8081/allowed-access",
        {
          data: { id: discordID },
        }
      );

      window.location.reload();
      if (response.data.message) {
        setWhitelistedIDs((prevIDs) =>
          prevIDs.filter((id) => id !== discordID)
        );
        alert("User removed from whitelist");
        setDiscordID("");
        setShowAddUserModal(false);
      }
    } catch (error) {
      if (error.response && error.response.status === 404) {
        alert("User isn't whitelisted");
        setDiscordID("");
        setShowAddUserModal(false);
      } else {
        console.error("Error deleting user:");
        alert("An error occurred while deleting user");
        setShowAddUserModal(false);
      }
    }
  };

  const handleUserClose = () => {
    setShowAddUserModal(false);
  };

  const handleClose = () => {
    setShowNicknameModal(false);
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

        if (permissions.logs === false) {
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
        navigate("/dashboard");      }
    } catch (error) {
      console.error("Error checking whitelist:");
      navigate("/dashboard");    }
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
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
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
            <ForumIcon
              style={{ marginRight: "10px", marginBottom: "-6px" }}
            />{" "}
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
        Audit Logs
      </Typography>
      {loading && <Typography>Loading...</Typography>}
      {error && <Typography color="error">{error}</Typography>}
      {!loading && !error && (
        <Paper style={styles.logsContainer}>
          {logs.map((log, index) => (
            <div key={index} style={styles.logEntry}>
              <Typography variant="body2">{formatLogEntry(log)}</Typography>
              <Divider style={styles.divider} />
            </div>
          ))}
        </Paper>
      )}
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
  logsContainer: {
    marginTop: "5px",
    padding: "10px",
    height: "700px",           
    overflowY: "auto",
    border: "1px solid #ccc",
    borderRadius: "8px",
  },
  logEntry: {
    padding: "10px",
    marginBottom: "10px",
    backgroundColor: "#f9f9f9",
    borderRadius: "4px",
  },
  divider: {
    marginTop: "10px",
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
};

export default Logs;