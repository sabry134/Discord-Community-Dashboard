import React, { useEffect, useState } from "react";
import axios from "axios";
import sabryIcon from "./img/icon.png";
import AppBar from "@mui/material/AppBar";
import { useNavigate } from "react-router-dom";
import Toolbar from "@mui/material/Toolbar";
import MenuItem from "@mui/material/MenuItem";
import DiamondIcon from "@mui/icons-material/Diamond";
import MobileFriendlyIcon from "@mui/icons-material/MobileFriendly";
import SignalWifiStatusbar4BarIcon from "@mui/icons-material/SignalWifiStatusbar4Bar";
import BadgeIcon from "@mui/icons-material/Badge";
import HelpIcon from '@mui/icons-material/Help';
import BookIcon from '@mui/icons-material/Book';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import { Button } from "@mui/material";
import nightBackground from "./img/sparkles_night.jpg";

const Home = () => {
  const [guildId, setGuildId] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    document.title = "Discord Community | Login";
    const favicon = document.querySelector('link[rel="icon"]');
    favicon.href = sabryIcon;

    const fetchGuildId = async () => {
      try {
        const response = await axios.get("http://localhost:8081/data-setup");
        setGuildId(response.data.guildId || "");
      } catch (error) {
        console.error("Error fetching guild ID:", error);
      }
    };

    fetchGuildId();
  }, []);

  const handleGoToLogin = () => {
    window.location.href = "http://localhost:8081/login";
  };

  const handleMenuItemClick = (menuItem) => {
    switch (menuItem) {
      case "Get Started":
        window.location.href = "/community_dashboard/#/";
        break;
      case "Mobile":
        window.location.href = "/community_dashboard/#/mobile";
        break;
      case "Swagger":
        window.location.href = "https://project-request-server.onrender.com/swagger-ui.html";
        break;
      case "Status":
        window.location.href = "https://stats.uptimerobot.com/oCBYa1wVQh";
        break;
      case "About":
        window.location.href = "/community_dashboard/#/about";
        break;
      case "Help":
        window.location.href = "/community_dashboard/#/help";
        break;
      case "Wiki":
        window.location.href = "https://sabry134.github.io/website-requests-wiki";
        break;
      case "Policy":
        window.location.href = "/community_dashboard/#/policy";
        break;
      case "Admin":
        window.location.href = "http://localhost:8081/admin";
        break;
      default:
        break;
    }
  };

  return (
    <div style={styles.mainContainer}>
      <AppBar position="static" style={styles.menuBar}>
        <Toolbar>
          <MenuItem
            style={styles.menuItem}
            onClick={() => handleMenuItemClick("Get Started")}
          >
            <DiamondIcon style={{ marginRight: "10px" }} /> Get Started
          </MenuItem>
          <MenuItem
            style={styles.menuItem}
            onClick={() => handleMenuItemClick("Mobile")}
          >
            <MobileFriendlyIcon style={{ marginRight: "10px" }} /> Mobile
          </MenuItem>
          <MenuItem
            style={styles.menuItem}
            onClick={() => handleMenuItemClick("Status")}
          >
            <SignalWifiStatusbar4BarIcon style={{ marginRight: "10px" }} />{" "}
            Status
          </MenuItem>
          <MenuItem
            style={styles.menuItem}
            onClick={() => handleMenuItemClick("About")}
          >
            <BadgeIcon style={{ marginRight: "10px" }} /> About
          </MenuItem>
          <MenuItem
            style={styles.menuItem}
            onClick={() => handleMenuItemClick("Help")}
          >
            <HelpIcon style={{ marginRight: "10px" }} /> Help
          </MenuItem>
          <MenuItem
            style={styles.menuItem}
            onClick={() => handleMenuItemClick("Wiki")}
          >
            <BookIcon style={{ marginRight: "10px" }} /> Wiki
          </MenuItem>
          <MenuItem
            style={styles.menuItem}
            onClick={() => handleMenuItemClick("Admin")}
          >
            <AdminPanelSettingsIcon style={{ marginRight: "10px" }} /> Admin
          </MenuItem>
        </Toolbar>
      </AppBar>

      <div style={styles.grayContainer}>
        <div style={styles.textContent}>
          <h2 style={styles.title}>Welcome to the Community!</h2>
          <p style={styles.subtitle}>Join our Discord community and get involved.</p>
          <Button
            variant="contained"
            style={styles.loginButton}
            onClick={handleGoToLogin}
          >
            Start now
          </Button>
        </div>
        {guildId && (
          <iframe
            src={`https://discord.com/widget?id=${guildId}&theme=dark`}
            width="350"
            height="500"
            allowtransparency="true"
            frameBorder="0"
            sandbox="allow-popups allow-popups-to-escape-sandbox allow-same-origin allow-scripts"
            style={styles.discordWidget}
            title="Discord Widget"
          ></iframe> 
        )}
      </div>
    </div>
  );
};

const styles = {
  menuBar: {
    backgroundColor: "black",
  },
  mainContainer: {
    minHeight: "100vh",
    backgroundImage: `url(${nightBackground})`,
    backgroundSize: "cover",
    backgroundPosition: "center",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
  },
  grayContainer: {
    marginTop: "5%",
    backgroundColor: "#444",
    padding: "30px",
    borderRadius: "10px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    textAlign: "center",
    marginBottom: "5%",
    width: "50%",
  },
  textContent: {
    flex: 1,
    textAlign: "left",
    marginRight: "20px",
  },
  title: {
    color: "#fff",
    fontSize: "28px",
    marginBottom: "20px",
  },
  subtitle: {
    color: "#bbb",
    fontSize: "18px",
    marginBottom: "30px",
  },
  discordWidget: {
    borderRadius: "5px",
  },
  loginButton: {
    backgroundColor: "#7289da",
    color: "#fff",
    padding: "10px 20px",
    fontSize: "16px",
    borderRadius: "5px",
    cursor: "pointer",
    transition: "background-color 0.3s ease",
  },
  menuItem: {
    marginLeft: "40px",
    color: "#fff",
    fontSize: "16px",
    cursor: "pointer",
    flex: 1,
    textAlign: "center",
  },
};

export default Home;
