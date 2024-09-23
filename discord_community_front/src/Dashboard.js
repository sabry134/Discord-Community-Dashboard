import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import TranslatorFavicon from "./img/icon.png";
import axios from "axios";
import DashboardIcon from "@mui/icons-material/Dashboard";
import Snackbar from "@material-ui/core/Snackbar";
import MuiAlert from "@material-ui/lab/Alert";
import ManageAccountsIcon from "@mui/icons-material/ManageAccounts";
import EngineeringIcon from "@mui/icons-material/Engineering";
import NotificationImportantIcon from "@mui/icons-material/NotificationImportant";
import SmartToyIcon from "@mui/icons-material/SmartToy";
import SettingsIcon from "@mui/icons-material/Settings";
import nightBackground from "./img/sparkles_night.jpg";
import LockOpenIcon from "@mui/icons-material/LockOpen";
import CircularProgress from "@mui/material/CircularProgress";
import GroupIcon from "@mui/icons-material/Group";
import ShoppingCartIcon from "@mui/icons-material/ShoppingCart";
import SportsScoreIcon from "@mui/icons-material/SportsScore";
import welcomeImage from "./img/welcome.png";
import { Button, Typography } from "@mui/material";
import ForumIcon from '@mui/icons-material/Forum';
import ContactSupportIcon from '@mui/icons-material/ContactSupport';
import AssistantPhotoIcon from '@mui/icons-material/AssistantPhoto';import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';

const Dashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [open, setOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [tasks, setTasks] = useState(
    JSON.parse(localStorage.getItem("tasks")) || []
  );
  const [autoDelete, setAutoDelete] = useState(
    localStorage.getItem("autoDelete") === "true" ? true : false
  );
  const [isAdmin, setIsAdmin] = useState(false);
  const [hoveredItem, setHoveredItem] = useState(null);
  const [openStaffDialog, setOpenStaffDialog] = useState(false);
  const [staffListContent, setStaffListContent] = useState('');
  const [rulesContent, setRulesContent] = useState('');
  const [openRulesDialog, setOpenRulesDialog] = useState(false);
  const [menuItemsVisibility, setMenuItemsVisibility] = useState({
    dashboard: true,
    announcements: true,
    bot_management: true,
    community_events: true,
    channel_groups: true,
    role_shop: true,
    settings: true,
    logs: false,
    admin: false,
    moderator: false,
  });
  const [openModal, setOpenModal] = useState(false);
  const [taskData, setTaskData] = useState({
    googleSheetLink: "",
    numberOfWords: "",
    proofreadMode: false,
  });

  const formatText = (text) => {
    let formattedText = text.replace(/__([^__]+)__/g, '<u>$1</u>');
  
    formattedText = formattedText.replace(/\*\*([^*]+)\*\*/g, '<b>$1</b>');
  
    formattedText = formattedText
      .replace(/^# (.+)$/gm, '<h1>$1</h1>')
      .replace(/^## (.+)$/gm, '<h2>$1</h2>')
      .replace(/^### (.+)$/gm, '<h3>$1</h3>');
  
    return formattedText;
  };

  useEffect(() => {
    if (openStaffDialog) {
      const fetchStaffList = async () => {
        try {
          const response = await axios.get('http://localhost:8081/staff-list');
          setStaffListContent(formatText(response.data.content || 'No staff list available.'));
        } catch (error) {
          console.error('Error fetching staff list:', error);
          setStaffListContent('Failed to load staff list.');
        }
      };

      fetchStaffList();
    }
  }, [openStaffDialog]);

  useEffect(() => {
    if (openRulesDialog) {
      const fetchCommunityRules = async () => {
        try {
          const response = await axios.get('http://localhost:8081/community-rules');
          setRulesContent(formatText(response.data.content || 'No community rules available.'));
        } catch (error) {
          console.error('Error fetching community rules:', error);
          setRulesContent('Failed to load community rules.');
        }
      };

      fetchCommunityRules();
    }
  }, [openRulesDialog]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/");
  };

  useEffect(() => {
    const getTokenFromUrl = () => {
      const urlSearchParams = new URLSearchParams(
        window.location.hash.split("?")[1]
      );
      return urlSearchParams.get("login_token");
    };

    const getTokenFromLocalStorage = () => {
      return localStorage.getItem("token");
    };

    const saveTokenToLocalStorage = (token) => {
      localStorage.setItem("token", token);
      const newUrl = window.location.href.split("?")[0];
      window.history.replaceState({}, document.title, newUrl);
    };

    const handleOpenStaffDialog = () => {
      setOpenStaffDialog(true);
    };
  
    const handleCloseStaffDialog = () => {
      setOpenStaffDialog(false);
    };
  
    const handleOpenRulesDialog = () => {
      setOpenRulesDialog(true);
    };
  
    const handleCloseRulesDialog = () => {
      setOpenRulesDialog(false);
    };

    const fetchUser = async () => {
      try {
        let token = getTokenFromUrl();

        if (!token) {
          token = getTokenFromLocalStorage();
        }

        if (!token) {
          navigate("/forbidden");
          localStorage.removeItem("token");
          return;
        }

        saveTokenToLocalStorage(token);
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
    const fetchRolesAndPermissions = async () => {
      try {
        const discordID = localStorage.getItem("discordID");
        const userRoleResponse = await axios.get(
          `http://localhost:8081/user-role/${discordID}`
        );
        const roles = userRoleResponse.data.roles;

        let mergedPermissions = {};

        if (roles.length === 0) {
          mergedPermissions = {

            logs: false,
            admin: false,
            moderator: false,
          };
        } else {
          for (const role of roles) {
            const pageVisibleResponse = await axios.get(
              `http://localhost:8081/page-visible/${role}`
            );
            const pagePermissions = pageVisibleResponse.data;

            for (const [page, isVisible] of Object.entries(pagePermissions)) {
              if (mergedPermissions[page] === undefined) {
                mergedPermissions[page] = isVisible;
              } else {
                mergedPermissions[page] = mergedPermissions[page] || isVisible;
              }
            }
          }
        }
      } catch (error) {
        console.error("Error fetching roles and permissions:", error.message);
      }
    };

    fetchRolesAndPermissions();
  }, [navigate]);

  const handleGetDiscordID = async () => {
    try {
      const storedToken = localStorage.getItem("token")?.trim();

      if (!storedToken) {
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
      console.error("Error fetching Discord ID:");
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

    fetchUserPermissions();
  }, []);

  const checkWhitelist = async (discordID) => {
    try {
      const whitelistResponse = await axios.get(
        "http://localhost:8081/website-admins"
      );
      const { whitelist } = whitelistResponse.data;

      if (whitelist.includes(discordID)) {
        setIsAdmin(true);
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
        document.title = "Discord Community | Dashboard";
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

  const handleMenuItemClick = (path) => {
    navigate(path);
  };

  const handleSnackbarClose = () => {
    setSnackbarOpen(false);
  };

  const handleMenuItemHover = (index) => {
    setHoveredItem(index);
  };

  const handleMenuItemLeave = () => {
    setHoveredItem(null);
  };

  const handleOpenStaffDialog = () => {
    setOpenStaffDialog(true);
  };

  const handleCloseStaffDialog = () => {
    setOpenStaffDialog(false);
  };


  const handleOpenRulesDialog = () => {
    setOpenRulesDialog(true);
  };

  const handleCloseRulesDialog = () => {
    setOpenRulesDialog(false);
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
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          marginBottom: '20px',
        }}
      >
        <img
          src={welcomeImage}
          alt="Welcome Image"
          style={{ maxWidth: '100%', height: 'auto', borderRadius: '10px' }}
        />
      </div>
      <Typography variant="h4" align="center" style={{ marginBottom: '20px' }}>
        Welcome to the Discord Community
      </Typography>

      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <Button variant="contained" color="secondary" onClick={handleOpenRulesDialog} style={{ marginBottom: '10px' }} >
          View Rules
        </Button>
        <Button variant="contained" color="primary" onClick={handleOpenStaffDialog} >
          View Staff List
        </Button>
      </div>

      {/* Staff List Dialog */}
      <Dialog open={openStaffDialog} onClose={handleCloseStaffDialog}>
        <DialogTitle>Staff List</DialogTitle>
        <DialogContent style={styles.dialog}>
          <Typography component="div" style={{ whiteSpace: 'pre-line' }} dangerouslySetInnerHTML={{ __html: staffListContent }} />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseStaffDialog} color="primary">
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* Rules Dialog */}
      <Dialog open={openRulesDialog} onClose={handleCloseRulesDialog}>
        <DialogTitle>Community Rules</DialogTitle>
        <DialogContent style={styles.dialog}>
          <Typography component="div" style={{ whiteSpace: 'pre-line' }} dangerouslySetInnerHTML={{ __html: rulesContent }} />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseRulesDialog} color="primary">
            Close
          </Button>
        </DialogActions>
      </Dialog>
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
            snackbarMessage.includes("No tasks to generate payments for.") ||
            snackbarMessage.includes(
              "Failed to generate payments. Make sure you entered a valid Zephyrus nickname in settings."
            ) ||
            snackbarMessage.includes(
              "Please set your nickname in settings first."
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
    marginBottom: "30%",
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
    width: "50%",
    marginLeft: "15%",
    marginTop: "2%",
    marginBottom: "2%",
    padding: "20px",
    borderRadius: "10px",
    boxShadow: "0 4px 8px rgba(0, 0, 0, 0.1)",
    overflowY: "auto",
  },
  dialog: {
    width: '500px',
  },
};

export default Dashboard;
