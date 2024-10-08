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
import AssistantPhotoIcon from '@mui/icons-material/AssistantPhoto';import { Box, Paper } from "@mui/material";
import AddCircleIcon from '@mui/icons-material/AddCircle';
import RemoveCircleIcon from '@mui/icons-material/RemoveCircle';

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
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import CircularProgress from '@mui/material/CircularProgress';
import InfoIcon from "@mui/icons-material/Info";
import {
  Button,
  TextField,
  Snackbar,
} from "@mui/material";
import MuiAlert from "@material-ui/lab/Alert";

const ShopSetup = () => {
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
  const [roles, setRoles] = useState([]);
  const [newRole, setNewRole] = useState({ role_name: '', price: '', role_id: '' });
  const [openAddPoints, setOpenAddPoints] = useState(false);
  const [openRemovePoints, setOpenRemovePoints] = useState(false);
  const [pointsChange, setPointsChange] = useState({ user_id: '', points: 0 });
  const [menuItemsVisibility, setMenuItemsVisibility] = useState({

    logs: false,
    admin: false,
    moderator: false,
    community_events: false,
    bot_management: false
  });

  useEffect(() => {
    fetchRoles();
  }, []);

  const fetchRoles = async () => {
    try {
      const response = await axios.get('http://localhost:8081/shop-setup');
      setRoles(response.data);
    } catch (error) {
      console.error('Error fetching roles:', error);
    }
  };

  const handleInputChange = (e, index) => {
    const { name, value } = e.target;
    const updatedRoles = [...roles];
    updatedRoles[index][name] = value;
    setRoles(updatedRoles);
  };

  const handleNewRoleChange = (e) => {
    const { name, value } = e.target;
    setNewRole((prev) => ({ ...prev, [name]: value }));
  };

  const handleSaveRole = async () => {
    try {
      await axios.post('http://localhost:8081/shop-setup', newRole);
      fetchRoles();
      setNewRole({ role_name: '', price: '', role_id: '' });
    } catch (error) {
      console.error('Error saving new role:', error);
    }
  };

  const handleDeleteRole = async (role_name) => {
    try {
      await axios.delete('http://localhost:8081/shop-setup', { data: { role_name } });
      fetchRoles();
    } catch (error) {
      console.error('Error deleting role:', error);
    }
  };

  const handleOpenAddPoints = () => setOpenAddPoints(true);
  const handleCloseAddPoints = () => setOpenAddPoints(false);

  const handleOpenRemovePoints = () => setOpenRemovePoints(true);
  const handleCloseRemovePoints = () => setOpenRemovePoints(false);

  const handleAddPoints = async () => {
    try {
      await axios.post('http://localhost:8081/add-points', pointsChange);
      setPointsChange({ user_id: '', points: 0 });
      handleCloseAddPoints();
      alert('Points added successfully');
    } catch (error) {
      console.error('Error adding points:', error);
    }
  };

  const handleRemovePoints = async () => {
    try {
      await axios.post('http://localhost:8081/remove-points', pointsChange);
      setPointsChange({ user_id: '', points: 0 });
      handleCloseRemovePoints();
      alert('Points removed successfully');
    } catch (error) {
      console.error('Error removing points:', error);
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
          community_events: false,
          bot_management: false
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
      navigate("/dashboard");    }
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
      <Paper elevation={3} style={{ padding: '20px', marginTop: '20px' }}>
      <Typography variant="h6" gutterBottom>
        Role Management Panel
      </Typography>

      {roles.map((role, index) => (
        <Box key={index} display="flex" alignItems="center" mb={2}>
          <TextField
            label="Role Name"
            name="role_name"
            value={role.role_name}
            onChange={(e) => handleInputChange(e, index)}
            style={{ marginRight: '10px' }}
            fullWidth
          />
          <TextField
            label="Price"
            name="price"
            value={role.price}
            onChange={(e) => handleInputChange(e, index)}
            style={{ marginRight: '10px' }}
            fullWidth
          />
          <TextField
            label="Role ID"
            name="role_id"
            value={role.role_id}
            onChange={(e) => handleInputChange(e, index)}
            style={{ marginRight: '10px' }}
            fullWidth
          />
          <IconButton onClick={() => handleDeleteRole(role.role_name)}>
            <DeleteIcon color="error" />
          </IconButton>
        </Box>
      ))}

      <Box display="flex" alignItems="center" mt={2}>
        <TextField
          label="Role Name"
          name="role_name"
          value={newRole.role_name}
          onChange={handleNewRoleChange}
          style={{ marginRight: '10px' }}
          fullWidth
        />
        <TextField
          label="Price"
          name="price"
          value={newRole.price}
          onChange={handleNewRoleChange}
          style={{ marginRight: '10px' }}
          fullWidth
        />
        <TextField
          label="Role ID"
          name="role_id"
          value={newRole.role_id}
          onChange={handleNewRoleChange}
          style={{ marginRight: '10px' }}
          fullWidth
        />
        <Button
          variant="contained"
          color="primary"
          onClick={handleSaveRole}
        >
          Save
        </Button>
      </Box>

      <Button
        variant="contained"
        color="success"
        onClick={handleOpenAddPoints}
        startIcon={<AddCircleIcon />}
        style={{ marginTop: '20px' }}
      >
        Add Points
      </Button>

      <Button
        variant="contained"
        color="error"
        onClick={handleOpenRemovePoints}
        startIcon={<RemoveCircleIcon />}
        style={{ marginTop: '20px', marginLeft: '10px' }}
      >
        Remove Points
      </Button>

      <Dialog open={openAddPoints} onClose={handleCloseAddPoints}>
        <DialogTitle>Add Points</DialogTitle>
        <DialogContent>
          <TextField
            label="User ID"
            fullWidth
            value={pointsChange.user_id}
            onChange={(e) => setPointsChange({ ...pointsChange, user_id: e.target.value })}
            style={{ marginBottom: '10px' }}
          />
          <TextField
            label="Points"
            type="number"
            fullWidth
            value={pointsChange.points}
            onChange={(e) => setPointsChange({ ...pointsChange, points: Number(e.target.value) })}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseAddPoints} color="primary">
            Cancel
          </Button>
          <Button onClick={handleAddPoints} color="primary">
            Add Points
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={openRemovePoints} onClose={handleCloseRemovePoints}>
        <DialogTitle>Remove Points</DialogTitle>
        <DialogContent>
          <TextField
            label="User ID"
            fullWidth
            value={pointsChange.user_id}
            onChange={(e) => setPointsChange({ ...pointsChange, user_id: e.target.value })}
            style={{ marginBottom: '10px' }}
          />
          <TextField
            label="Points"
            type="number"
            fullWidth
            value={pointsChange.points}
            onChange={(e) => setPointsChange({ ...pointsChange, points: Number(e.target.value) })}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseRemovePoints} color="primary">
            Cancel
          </Button>
          <Button onClick={handleRemovePoints} color="primary">
            Remove Points
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
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

export default ShopSetup;