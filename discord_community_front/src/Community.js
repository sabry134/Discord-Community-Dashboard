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
import {
  Card,
  CardContent,
  CardHeader,
  CardMedia,
  Typography,
  Avatar,
} from "@mui/material";
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';

const Community = () => {
  const navigate = useNavigate();
  const [wordCount, setWordCount] = useState(0);
  const [characterCount, setCharacterCount] = useState(0);
  const [text, setText] = useState("");
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [posts, setPosts] = useState([]);
  const [postTitle, setPostTitle] = useState("");
  const [postContent, setPostContent] = useState("");
  const [postImage, setPostImage] = useState("");
  const [postAuthor, setPostAuthor] = useState("");
  const [authorImage, setAuthorImage] = useState("");
  const [responseMessage, setResponseMessage] = useState("");
  const [snackbarOpen, setSnackbarOpen] = useState(false);
const [snackbarMessage, setSnackbarMessage] = useState('');
const [snackbarSeverity, setSnackbarSeverity] = useState('success');
  const [hoveredItem, setHoveredItem] = useState(null);
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

  const handleSubmit = async () => {
    try {
      const response = await axios.post("http://localhost:8081/new-post", {
        post_title: postTitle,
        post_content: postContent,
        post_image: postImage,
        post_author: user.username,
        author_image: user.avatar,
      });
  
      setSnackbarMessage(response.data.message);
      setSnackbarSeverity('success');
      setSnackbarOpen(true);
  
      setPostTitle("");
      setPostContent("");
      setPostImage("");
      fetchPosts();
    } catch (error) {
      console.error("Error creating post:", error);
      setSnackbarMessage("Failed to create post");
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    }
  };
  
  
  

  const fetchPosts = async () => {
    try {
      const response = await axios.get("http://localhost:8081/all-posts");
      setPosts(response.data);
    } catch (error) {
      console.error("Error fetching posts:", error);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  const deletePost = async (id) => {
    try {
      await axios.delete(`http://localhost:8081/delete-post/${id}`);
      setPosts(posts.filter((post) => post._id !== id));
      fetchPosts();
    } catch (error) {
      console.error("Error deleting post:", error);
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

  const countWordsAndCharacters = () => {
    const words = text.trim().split(/\s+/).filter(Boolean).length;
    const characters = text.length;

    setWordCount(words);
    setCharacterCount(characters);
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
        document.title = "Discord Community | Word Counter";
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
      <div style={styles.whiteContainer}>
        {posts.length > 0 ? (
          posts.map((post, index) => (
            <Card key={index} style={{ marginBottom: "20px" }}>
              <CardHeader
                avatar={
                  <Avatar src={post.author_image} alt={post.post_author} />
                }
                title={post.post_author}
                action={
                  (user?.username === post.post_author || 
                  menuItemsVisibility.moderator || 
                  menuItemsVisibility.admin) && (
                    <Button onClick={() => deletePost(post.post_id)}>
                      Delete Post
                    </Button>
                  )
                }
              />
              {post.post_image && (
                <CardMedia
                  component="img"
                  height="200"
                  image={post.post_image}
                  alt="Post image"
                />
              )}
              <CardContent>
                <Typography variant="h5">{post.post_title}</Typography>
                <Typography variant="body2" color="text.secondary">
                  {post.post_content}
                </Typography>
              </CardContent>
            </Card>
          ))
        ) : (
          <p>No posts available</p>
        )}

        <Card>
          <CardContent>
            <Typography variant="h6">Create a New Post</Typography>
            <TextField
              label="Post Title"
              value={postTitle}
              onChange={(e) => setPostTitle(e.target.value)}
              fullWidth
              margin="normal"
            />
            <TextField
              label="Post Content"
              value={postContent}
              onChange={(e) => setPostContent(e.target.value)}
              fullWidth
              margin="normal"
              multiline
              rows={4}
            />
            <TextField
              label="Post Image URL"
              value={postImage}
              onChange={(e) => setPostImage(e.target.value)}
              fullWidth
              margin="normal"
            />
            <Button variant="contained" color="primary" onClick={handleSubmit}>
              Submit Post
            </Button>
            {responseMessage && <Typography>{responseMessage}</Typography>}
          </CardContent>
        </Card>
      </div>
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={() => setSnackbarOpen(false)}
      >
        <Alert onClose={() => setSnackbarOpen(false)} severity={snackbarSeverity} sx={{ width: '100%' }}>
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
    marginTop: "2%",
    marginBottom: "2%",
    padding: "20px",
    borderRadius: "10px",
    boxShadow: "0 4px 8px rgba(0, 0, 0, 0.1)",
  },
};

export default Community;
