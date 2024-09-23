import React from 'react';
import { HashRouter as Router, Route, Routes } from 'react-router-dom';
import Home from './Home';
import Error from './Error';
import Dashboard from './Dashboard';
import Announcements from './Announcements';
import Admin from './Admin';
import DashboardRoles from './DashboardRoles';
import BotManagement from './BotManagement';
import ChannelGroups from './ChannelGroups';
import CommunityEvents from './CommunityEvents';
import RoleShop from './RoleShop';
import Logs from './Logs';
import Moderator from './Moderator';
import Settings from './Settings';
import Community from './Community';
import SelfService from './SelfService';
import ShopSetup from './ShopSetup';
import DiscordSetup from './DiscordSetup';
import UserManagement from './UserManagement';
import Api from './Api';
import Recruitment from './Recruitment';
import PositionInfo from './PositionInfo';
import RecruitmentAdmin from './RecruitmentAdmin';
import Forbidden from './Forbidden';
import AnnouncementSetup from './AnnouncementSetup';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="*" element={<Error />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/announcements" element={<Announcements />} />
        <Route path="/admin" element={<Admin />} />
        <Route path="/dashboard_roles" element={<DashboardRoles />} />
        <Route path="/bot_management" element={<BotManagement />} />
        <Route path="/channel_groups" element={<ChannelGroups />} />
        <Route path="/community_events" element={<CommunityEvents />} />
        <Route path="/role_shop" element={<RoleShop />} />
        <Route path="/logs" element={<Logs />} />
        <Route path="/moderator" element={<Moderator />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/community" element={<Community />} />
        <Route path="/self_services" element={<SelfService />} />
        <Route path="/shop_setup" element={<ShopSetup />} />
        <Route path="/discord_setup" element={<DiscordSetup />} />
        <Route path="/user_management" element={<UserManagement />} />
        <Route path="/api" element={<Api />} />
        <Route path="/recruitment" element={<Recruitment />} />
        <Route path="/position_info" element={<PositionInfo />} />
        <Route path="/recruitment_admin" element={<RecruitmentAdmin />} />
        <Route path="/forbidden" element={<Forbidden />} />
        <Route path="/announcement_setup" element={<AnnouncementSetup />} />
      </Routes>
    </Router>
  );
}

export default App;