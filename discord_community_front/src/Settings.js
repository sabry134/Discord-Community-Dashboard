import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import nightBackground from "./img/sparkles_night.jpg";
import axios from "axios";
import ManageAccountsIcon from "@mui/icons-material/ManageAccounts";
import DashboardIcon from "@mui/icons-material/Dashboard";
import EngineeringIcon from "@mui/icons-material/Engineering";
import SettingsIcon from "@mui/icons-material/Settings";
import LockOpenIcon from "@mui/icons-material/LockOpen";
import TranslatorFavicon from "./img/icon.png";
import CircularProgress from "@mui/material/CircularProgress";
import SportsScoreIcon from "@mui/icons-material/SportsScore";
import { Button, TextField } from "@mui/material";
import GroupIcon from "@mui/icons-material/Group";
import SmartToyIcon from "@mui/icons-material/SmartToy";
import NotificationImportantIcon from "@mui/icons-material/NotificationImportant";
import ShoppingCartIcon from "@mui/icons-material/ShoppingCart";
import ForumIcon from "@mui/icons-material/Forum";
import ContactSupportIcon from "@mui/icons-material/ContactSupport";
import AssistantPhotoIcon from "@mui/icons-material/AssistantPhoto";
import { Paper, Typography, Avatar, Divider, Box } from "@mui/material";
import Snackbar from "@mui/material/Snackbar";
import Alert from "@mui/material/Alert";
import { Card, CardHeader, CardContent, CardActions } from "@mui/material";

const Settings = () => {
  const navigate = useNavigate();
  const [wordCount, setWordCount] = useState(0);
  const [characterCount, setCharacterCount] = useState(0);
  const [text, setText] = useState("");
  const [user, setUser] = useState(null);
  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState("success");
  const [website, setWebsite] = useState("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [hoveredItem, setHoveredItem] = useState(null);
  const [avatar, setAvatar] = useState("");

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

  useEffect(() => {
    const discordID = localStorage.getItem("discordID");
    if (discordID) {
      axios
        .get(`http://localhost:8081/user-profile/${discordID}`)
        .then((response) => {
          const profile = response.data;
          setUsername(profile.username || "");
          setBio(profile.bio || "");
          setWebsite(profile.web_link || "");
        })
        .catch((error) => {
          console.error("Error fetching profile:", error);
        });
    }
  }, []);

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
    const discordAvatar = localStorage.getItem("discordAvatar");
    setAvatar(discordAvatar);
  }, []);

  const handleSaveProfile = async () => {
    const user_id = localStorage.getItem("discordID");
    try {
      await axios.post("http://localhost:8081/user-profile", {
        user_id,
        username,
        bio,
        web_link: website,
      });
      setSnackbarMessage("Profile saved successfully.");
      setSnackbarSeverity("success");
      setSnackbarOpen(true);
    } catch (error) {
      console.error("Error saving profile:", error);
      setSnackbarMessage("Failed to save profile.");
      setSnackbarSeverity("error");
      setSnackbarOpen(true);
    }
  };

  const handleSearchMembers = async () => {
    try {
      const response = await fetch(`http://localhost:8081/search-member/${searchQuery}`);
      const result = await response.json();
  
      if (response.ok) {
        setSearchResults({
          user_id: result.user_id,
          username: result.username,
          bio: result.bio,
          web_link: result.web_link,
        });
      } else {
        console.error('Search failed:', result.message);
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  };

  const handleUsernameChange = (e) => {
    const value = e.target.value;
    const usernameRegex = /^[a-zA-Z0-9-_]+$/;

    if (usernameRegex.test(value)) {
      setUsername(value);
    } else {
      setSnackbarMessage("Username can only contain letters, numbers, hyphens, and underscores.");
      setSnackbarSeverity("error");
      setSnackbarOpen(true);
    }
  };

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

        if (mergedPermissions.announcements === false) {
          navigate("/dashboard");
        }
      } catch (error) {
        console.error("Error fetching roles and permissions:", error.message);
      }
    };

    fetchRolesAndPermissions();
  }, [navigate]);

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
      } else {
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
        localStorage.setItem("discordAvatar", response.data.user.avatar);
        document.title = "Discord Community | Settings";
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
            onClick={() => handleMenuItemClick("/recruitment")}
            onMouseEnter={() => handleMenuItemHover(18)}
            onMouseLeave={handleMenuItemLeave}
          >
            <AssistantPhotoIcon
              style={{ marginRight: "10px", marginBottom: "-6px" }}
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
      <Paper elevation={3} sx={styles.whiteContainer}>
        <Box sx={styles.centeredContent}>
          <Avatar alt="User Avatar" src={avatar} sx={styles.avatar} />
          <Typography variant="h5" color="primary" gutterBottom>
            Edit Profile
          </Typography>
        </Box>

        <Box sx={styles.section}>
          <TextField
            label="Username"
            variant="outlined"
            fullWidth
            value={username}
            onChange={handleUsernameChange}
            sx={styles.inputField}
          />

          <TextField
            label="Bio"
            variant="outlined"
            multiline
            rows={4}
            fullWidth
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            sx={styles.inputField}
          />

          <TextField
            label="Website Link"
            variant="outlined"
            fullWidth
            value={website}
            onChange={(e) => setWebsite(e.target.value)}
            sx={styles.inputField}
          />

          <Button
            variant="contained"
            color="primary"
            fullWidth
            onClick={handleSaveProfile}
            sx={styles.button}
          >
            Save Profile
          </Button>
        </Box>

        <Divider sx={{ marginBottom: "20px" }} />

        <Box sx={styles.section}>
    <Typography variant="h5" color="secondary" gutterBottom>
      Find Profiles
    </Typography>

    <TextField
      label="Search Members"
      variant="outlined"
      fullWidth
      value={searchQuery}
      onChange={(e) => setSearchQuery(e.target.value)}
      sx={styles.inputField}
    />

    <Button
      variant="contained"
      color="secondary"
      fullWidth
      onClick={handleSearchMembers}
      sx={styles.button}
    >
      Search
    </Button>

    {searchResults && (
      <Card sx={{ maxWidth: 345, marginTop: '20px' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', padding: '16px' }}>
          <Avatar
            alt="User Avatar"
            src={searchResults.avatarUrl}
            sx={{ width: 64, height: 64, marginRight: '16px' }}
          />
          <Box>
            <Typography variant="h6" color="textPrimary">
              {searchQuery}
            </Typography>
            <Typography variant="body2" color="textSecondary">
              {searchResults.user_id}
            </Typography>
          </Box>
        </Box>
        <CardContent>
          <Typography variant="body2" color="textSecondary">
            {searchResults.bio}
          </Typography>
          <br></br>
          {searchResults.web_link && (
          <Button
            variant="contained"
            color="primary"
            fullWidth
            onClick={() => window.open(searchResults.web_link, '_blank')}
          >
            Check my Website
          </Button>
        )}
        </CardContent>
      </Card>
    )}
  </Box>
      </Paper>
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={() => setSnackbarOpen(false)}
      >
        <Alert
          onClose={() => setSnackbarOpen(false)}
          severity={snackbarSeverity}
          sx={{ width: "100%" }}
        >
          {snackbarMessage}
        </Alert>
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
  textContainer: {
    width: "80%",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
  },
  countBox: {
    backgroundColor: "purple",
    padding: "10px",
    borderRadius: "10px",
    marginTop: "10px",
    color: "rgba(255, 255, 255, 0.8)",
  },
  textArea: {
    width: "100%",
    height: "200px",
    margin: "20px 0",
    borderRadius: "5px",
  },
  countButton: {
    width: "100%",
  },
  whiteContainer: {
    backgroundColor: "rgba(255, 255, 255, 0.8)",
    width: "50%",
    marginLeft: "15%",
    marginTop: "1.5%",
    marginBottom: "2%",
    padding: "20px",
    borderRadius: "10px",
    boxShadow: "0 4px 8px rgba(0, 0, 0, 0.1)",
  },
  section: {
    marginBottom: "30px",
  },
  inputField: {
    marginBottom: "20px",
  },
  button: {
    marginTop: "15px",
    padding: "10px 20px",
  },
  avatar: {
    width: "140px",
    height: "140px",
    margin: "0 auto 20px",
    border: "3px solid #3f51b5",
  },
  centeredContent: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    flexDirection: "column",
  },
};

export default Settings;
