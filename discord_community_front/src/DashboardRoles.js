import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import nightBackground from "./img/sparkles_night.jpg";
import TranslateIcon from "@mui/icons-material/Translate";
import axios from "axios";
import DashboardIcon from "@mui/icons-material/Dashboard";
import ManageAccountsIcon from "@mui/icons-material/ManageAccounts";
import EngineeringIcon from "@mui/icons-material/Engineering";
import SportsScoreIcon from "@mui/icons-material/SportsScore";
import TaskIcon from "@mui/icons-material/Task";
import SettingsIcon from "@mui/icons-material/Settings";
import VideoLibraryIcon from "@mui/icons-material/VideoLibrary";
import LockOpenIcon from "@mui/icons-material/LockOpen";
import TranslatorFavicon from "./img/icon.png";
import PeopleOutlineIcon from "@mui/icons-material/PeopleOutline";
import AssignmentIcon from "@mui/icons-material/Assignment";
import Snackbar from "@material-ui/core/Snackbar";
import MuiAlert from "@material-ui/lab/Alert";
import InfoIcon from "@mui/icons-material/Info";
import CircularProgress from "@mui/material/CircularProgress";
import AddTaskIcon from "@mui/icons-material/AddTask";
import EditIcon from "@mui/icons-material/Edit";
import GroupIcon from "@mui/icons-material/Group";
import ShoppingCartIcon from "@mui/icons-material/ShoppingCart";
import SmartToyIcon from "@mui/icons-material/SmartToy";
import NotificationImportantIcon from "@mui/icons-material/NotificationImportant";

import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Checkbox,
  FormControlLabel,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import Announcements from "./Announcements";
import ForumIcon from '@mui/icons-material/Forum';
import ContactSupportIcon from '@mui/icons-material/ContactSupport';
import AssistantPhotoIcon from '@mui/icons-material/AssistantPhoto';
const DashboardRoles = () => {
  const navigate = useNavigate();
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [open, setOpen] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [roleIds, setRoleIds] = useState([]);
  const [roleName, setRoleName] = useState("");
  const [selectedPages, setSelectedPages] = useState({});
  const [roles, setRoles] = useState([]);
  const [whitelistedIDs, setWhitelistedIDs] = useState([]);
  const [user, setUser] = useState(null);
  const [userRoles, setUserRoles] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [hoveredItem, setHoveredItem] = useState(null);
  const [editRole, setEditRole] = useState(null);
  const [editRoleName, setEditRoleName] = useState("");
  const [editSelectedPages, setEditSelectedPages] = useState({});
  const [loading, setLoading] = useState(true);
  const [menuItemsVisibility, setMenuItemsVisibility] = useState({
    logs: false,
    admin: false,
    moderator: false,
    bot_management: false,
    community_events: false,
  });

  const fetchUserPermissions = async () => {
    const discordID = localStorage.getItem("discordID");
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
        bot_management: false,
        community_events: false,
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

      setMenuItemsVisibility(permissions);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching user roles or permissions:");
    }
  };

  useEffect(() => {
    fetchUserPermissions();
  }, []);

  const handleEditRole = (role) => {
    setEditRole(role);
    setEditRoleName(role.name);

    const initialSelectedPages = {};

    for (const page of pages) {
      initialSelectedPages[page] = !!role.pages[pageMappings[page]];
    }

    setEditSelectedPages(initialSelectedPages);
    setEditDialogOpen(true);
  };

  const handleEditDialogClose = () => {
    setEditDialogOpen(false);
    setEditRole(null);
    setEditRoleName("");
    setEditSelectedPages({});
  };

  const handleEditSave = async () => {
    try {
      const snakeCaseRoleName = editRoleName.toLowerCase().replace(/\s+/g, "_");

      const editedPages = {};
      pages.forEach((page) => {
        const snakeCasePage = page.toLowerCase().replace(/\s+/g, "_");
        editedPages[snakeCasePage] = editSelectedPages[page] || false;
      });

      const editedRole = {
        role: snakeCaseRoleName,
        pages: editedPages,
      };

      const responseEditRole = await axios.post(
        "http://localhost:8081/edit-role",
        editedRole
      );

      if (responseEditRole.status !== 200) {
        throw new Error("Failed to update role");
      }

      const updatedRoles = roles.map((role) => {
        if (role.name === editRoleName) {
          return {
            name: editRoleName,
            pages: editedPages,
          };
        }
        return role;
      });

      setRoles(updatedRoles);

      handleClose();
      setEditRoleName("");
      setEditSelectedPages({});
      setEditDialogOpen(false);
      fetchUserPermissions();
    } catch (error) {
      console.error("Error updating role:");
    }
  };

  const handleEditRoleCheckbox = (event) => {
    setEditSelectedPages({
      ...editSelectedPages,
      [event.target.name]: event.target.checked,
    });
  };

  const pageMappings = {
    Logs: "logs",
    Admin: "admin",
    Moderator: "moderator",
    "Bot Management": "bot_management",
    "Community Events": "community_events",
  };

  const pages = Object.keys(pageMappings);

  const handleClickOpen = () => {
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setRoleName("");
    setSelectedPages({});
  };

  useEffect(() => {
    fetchRoleIds();
  }, []);

  const fetchRoleIds = async () => {
    try {
      const response = await fetch("http://localhost:8081/available-roles");
      if (!response.ok) {
        throw new Error("Failed to fetch available roles");
      }
      const { roles } = await response.json();
      setRoleIds(roles.map((role) => role.name));
    } catch (error) {
      console.error("Error fetching available roles:");
    }
  };

  const handleRedirectToBan = () => {
    navigate("/user_management");
  };

  const fetchUserRoles = async (searchQuery) => {
    setUserRoles([]);
    try {
      const response = await axios.get(
        `http://localhost:8081/user-role/${searchQuery}`
      );
      if (Array.isArray(response.data.roles)) {
        setUserRoles(response.data.roles);
      } else {
        setUserRoles([]);
      }
    } catch (error) {
      console.error("Error fetching user roles:");
    }
  };

  const handleSearchQueryChange = (event) => {
    setSearchQuery(event.target.value);
    if (event.target.value) {
      fetchUserRoles(event.target.value);
    } else {
      setUserRoles([]);
    }
  };


  const handleCheckboxChange = (role) => async (event) => {
    try {
      const currentSearchQuery = searchQuery;
      let updatedUserRoles;
  
      if (event.target.checked) {
        updatedUserRoles = [...userRoles, role];
        setUserRoles(updatedUserRoles);
  
        const postData = { roles: updatedUserRoles.map((r) => r.toLowerCase().split(" ").join("_")) };
  
  
        const response = await axios.post(`http://localhost:8081/add-roles/${currentSearchQuery}`, postData);
  
  
      } else {
        const normalizedRole = role.toLowerCase().split(" ").join("_");
        updatedUserRoles = userRoles.filter((userRole) => userRole.toLowerCase().split(" ").join("_") !== normalizedRole);
        setUserRoles(updatedUserRoles);
  
        const postData = { roles: [normalizedRole] };
  
  
        const response = await axios.delete(`http://localhost:8081/remove-role/${currentSearchQuery}`, {
          data: postData,
        });
  
  
        await fetchUserPermissions();
  
        if (updatedUserRoles.length === 0) {
          const removeResponse = await axios.delete('http://localhost:8081/website-admins', {
            data: { id: currentSearchQuery },
          });
        }
      }
  
    } catch (error) {
      console.error("Error updating roles:", error.response ? error.response.data : error.message);
    }
  };
  
  

  const handleAssignRole = async () => {
    try {
      const validUserRoles = userRoles.filter((role) => role);
      const formattedRoles = validUserRoles.map((role) =>
        role.toLowerCase().split(" ").join("_")
      );
  
      const postData = {
        roles: formattedRoles,
      };
  
      const response = await axios.post(
        `http://localhost:8081/add-roles/${searchQuery}`,
        postData
      );
  
      if (validUserRoles.length > 0) {
        await axios.post('http://localhost:8081/website-admins', {
          id: searchQuery,
        });
      }
  
      handleDialogClose();
      setSearchQuery("");
      fetchUserPermissions();
    } catch (error) {
      console.error("Error assigning roles:", error);
    }
  };

  const handleDialogOpen = async () => {
    setDialogOpen(true);

    try {
      const response = await fetch("http://localhost:8081/available-roles");
      if (!response.ok) {
        throw new Error("Failed to fetch available roles");
      }
      const { roles } = await response.json();
      setRoleIds(roles);
    } catch (error) {
      console.error("Error fetching available roles:");
    }
  };

  const handleDialogClose = () => {
    setDialogOpen(false);
    setUserRoles([]);
    setSearchQuery("");
  };

  const handleRoleCheckbox = (e) => {
    const { name, checked } = e.target;
    setSelectedPages((prevSelected) => ({
      ...prevSelected,
      [name]: checked,
    }));
  };

  const handleRedirectToRecruitment = () => {
    navigate("/recruitment_admin");
  };

  useEffect(() => {
    const fetchRolesAndPages = async () => {
      try {
        const responseRoles = await fetch(
          "http://localhost:8081/available-roles"
        );
        if (!responseRoles.ok) {
          throw new Error("Failed to fetch roles");
        }
        const { roles: rolesList } = await responseRoles.json();
        const rolesData = await Promise.all(
          rolesList.map(async (roleName) => {
            const responsePages = await fetch(
              `http://localhost:8081/page-visible/${roleName}`
            );
            if (!responsePages.ok) {
              throw new Error(
                `Failed to fetch page visibility for role: ${roleName}`
              );
            }
            const pagesVisibility = await responsePages.json();
            return {
              name: toTitleCase(roleName.replace(/_/g, " ")),
              pages: pagesVisibility,
            };
          })
        );

        setRoles(rolesData);
      } catch (error) {
        console.error("Error fetching roles:");
      }
    };

    fetchRolesAndPages();
  }, []);

  const toTitleCase = (snakeCaseStr) => {
    return snakeCaseStr.replace(/\w\S*/g, (txt) => {
      return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
    });
  };

  const handleSave = async () => {
    const snakeCaseRoleName = roleName.toLowerCase().replace(/\s+/g, "_");

    const newPages = {};
    pages.forEach((page) => {
      const snakeCasePage = page.toLowerCase().replace(/\s+/g, "_");
      newPages[snakeCasePage] = selectedPages[page] || false;
    });

    const newRole = {
      name: roleName,
      pages: newPages,
    };

    const updatedRoles = roles.concat(newRole);
    setRoles(updatedRoles);

    setSelectedPages({});
    setRoleName("");
    handleClose();

    try {
      const responseNewRole = await fetch("http://localhost:8081/new-role", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          role: snakeCaseRoleName,
        }),
      });

      if (!responseNewRole.ok) {
        throw new Error("Failed to create new role");
      }
    } catch (error) {
      console.error("Error creating new role:");
    }

    try {
      const responseVisible = await fetch(
        `http://localhost:8081/page-visible/${snakeCaseRoleName}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(newRole.pages),
        }
      );

      if (!responseVisible.ok) {
        throw new Error("Failed to update page visibility");
      }
    } catch (error) {
      console.error("Error updating page visibility:");
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

  useEffect(() => {
    const interval = setInterval(() => {}, 10000);

    return () => clearInterval(interval);
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
          bot_management: false,
          community_events: false,
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

        if (permissions.admin === false) {
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
        document.title = "Discord Community | Dashboard Roles";
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

  const handleSnackbarClose = () => {
    setSnackbarOpen(false);
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

  const handleDelete = async (roleName) => {
    const snakeCaseRoleName = roleName.toLowerCase().replace(/\s+/g, "_");

    setRoles(roles.filter((role) => role.name !== roleName));

    try {
      const responseDeleteRole = await fetch(
        `http://localhost:8081/delete-role/${snakeCaseRoleName}`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (!responseDeleteRole.ok) {
        throw new Error("Failed to delete role");
      }

      fetchUserPermissions();
    } catch (error) {
      console.error("Error deleting role:");
    }
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
        <Button
          style={styles.roleButton}
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleClickOpen}
        >
          New Role
        </Button>
        <Button
          style={styles.roleButton}
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleDialogOpen}
        >
          Assign Role
        </Button>
        <Button
          style={styles.roleButton}
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleRedirectToBan}
        >
          User Management
        </Button>
        <Button
          style={styles.roleButton}
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleRedirectToRecruitment}
        >
          Recruitment
        </Button>
        <Dialog open={open} onClose={handleClose}>
          <DialogTitle>Create New Role</DialogTitle>
          <DialogContent>
            <TextField
              autoFocus
              margin="dense"
              label="Role Name"
              fullWidth
              value={roleName}
              onChange={(e) => setRoleName(e.target.value)}
            />
            {pages.map((page) => (
              <FormControlLabel
                key={page}
                control={
                  <Checkbox
                    checked={!!selectedPages[page]}
                    onChange={handleRoleCheckbox}
                    name={page}
                  />
                }
                label={page}
              />
            ))}
          </DialogContent>
          <DialogActions>
            <Button onClick={handleClose} color="primary">
              Cancel
            </Button>
            <Button onClick={handleSave} color="primary">
              Save
            </Button>
          </DialogActions>
        </Dialog>
        <Dialog open={dialogOpen} onClose={handleDialogClose}>
          <DialogTitle>Assign Roles</DialogTitle>
          <DialogContent>
            <TextField
              autoFocus
              margin="dense"
              id="searchQuery"
              label="Discord ID"
              fullWidth
              value={searchQuery}
              onChange={handleSearchQueryChange}
            />
            <div>
              <br />
              {roleIds.map((role, index) => (
                <FormControlLabel
                  key={index}
                  control={
                    <Checkbox
                      checked={userRoles.includes(role)}
                      onChange={handleCheckboxChange(role)}
                      color="primary"
                    />
                  }
                  label={role}
                />
              ))}
            </div>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleDialogClose} color="primary">
              Cancel
            </Button>
            <Button onClick={handleAssignRole} color="primary">
              Save
            </Button>
          </DialogActions>
        </Dialog>
        <Dialog open={editDialogOpen} onClose={handleEditDialogClose}>
          <DialogTitle>Edit Role</DialogTitle>
          <DialogContent>
            <TextField
              autoFocus
              margin="dense"
              label="Role Name"
              fullWidth
              value={editRoleName}
              onChange={(e) => setEditRoleName(e.target.value)}
            />
            {pages.map((page) => (
              <FormControlLabel
                key={page}
                control={
                  <Checkbox
                    checked={!!editSelectedPages[page]}
                    onChange={handleEditRoleCheckbox}
                    name={page}
                  />
                }
                label={page}
              />
            ))}
          </DialogContent>
          <DialogActions>
            <Button onClick={handleEditDialogClose} color="primary">
              Cancel
            </Button>
            <Button onClick={handleEditSave} color="primary">
              Save
            </Button>
          </DialogActions>
        </Dialog>
        <TableContainer component={Paper} style={{ marginTop: "20px" }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Role Name</TableCell>
                <TableCell>Accessible Pages</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {roles.map((role, index) => (
                <TableRow key={index}>
                  <TableCell>{role.name}</TableCell>
                  <TableCell>
                    {Object.keys(role.pages)
                      .filter((page) => role.pages[page])
                      .map((page) =>
                        Object.keys(pageMappings).find(
                          (key) => pageMappings[key] === page
                        )
                      )
                      .join(", ")}
                  </TableCell>
                  <TableCell>
                    <IconButton onClick={() => handleEditRole(role)}>
                      <EditIcon />
                    </IconButton>
                    <IconButton onClick={() => handleDelete(role.name)}>
                      <DeleteIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </div>
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={handleSnackbarClose}
      >
        <MuiAlert
          elevation={6}
          variant="filled"
          onClose={handleSnackbarClose}
          severity={
            snackbarMessage.includes(
              "Invalid Github token format. Please try again."
            )
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
    marginTop: "8%",
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
  },
  modalContent: {
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
  roleButton: {
    marginLeft: "10px",
  },
  textField: {
    width: "400px",
  },
};

export default DashboardRoles;
