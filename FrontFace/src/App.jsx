import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

/* PAGES */
import Home from "./pages/Home";
import Login from "./pages/Login";
import Signup from "./pages/Signup";

import MainDashboard from "./pages/MainDashboard";
import BuyerDashboard from "./pages/BuyerDashboard";
import SellerDashboard from "./pages/SellerDashboard";

import CreateRequest from "./pages/CreateRequest";
import SubmitBid from "./pages/SubmitBid";
import AcceptBid from "./pages/AcceptBid";

import AnswerBack from "./pages/AnswerBack";
import SellerAnswer from "./pages/SellerAnswer";
import AskTheSeller from "./pages/AskTheSeller";
import BuyerThread from "./pages/BuyerThread";

import SellerProducts from "./pages/SellerProducts";
import SellerBids from "./pages/SellerBids";

import PaymentMethods from "./pages/PaymentMethods";

import ProfileView from "./pages/ProfileView";
import EditProfile from "./pages/EditProfile";
import ChangePassword from "./pages/ChangePassword";

import ReceiptView from "./pages/ReceiptView";

import Help from "./pages/Help";
import About from "./pages/About";
import Privacy from "./pages/Privacy";
import Terms from "./pages/Terms";
import History from "./pages/History";
import Messages from "./pages/Messages";

/* COMPONENTS */
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import InactivityLogout from "./utils/InactivityLogout";

function App() {
  return (
    <Router>
      <InactivityLogout timeout={15 * 60 * 1000} />

      <Navbar />

      <Routes>
        {/* AUTH */}
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />

        {/* DASHBOARDS */}
        <Route path="/dashboard" element={<MainDashboard />} />
        <Route path="/buyer-dashboard" element={<BuyerDashboard />} />
        <Route path="/seller-dashboard" element={<SellerDashboard />} />

        {/* REQUESTS / BIDS FLOW */}
        <Route path="/create-request" element={<CreateRequest />} />
        <Route path="/createrequest" element={<CreateRequest />} />

        <Route path="/submit-bid/:requestId" element={<SubmitBid />} />
        <Route path="/submitbid/:requestId" element={<SubmitBid />} />

        <Route path="/accept-bid/:bidId" element={<AcceptBid />} />

        {/* ✅ BuyerDashboard -> View bids */}
        <Route path="/bids/:requestId" element={<AcceptBid />} />

        {/* Existing accept flow */}
        <Route path="/requests/:requestId/acceptbid" element={<AcceptBid />} />

        {/* MESSAGE THREADS / Q&A */}
        <Route path="/answer-back/:threadId" element={<AnswerBack />} />
        <Route path="/seller-answer/:threadId" element={<SellerAnswer />} />
        <Route path="/ask-the-seller/:requestId" element={<AskTheSeller />} />
        <Route path="/buyer-thread/:threadId" element={<BuyerThread />} />

        {/* SELLER */}
        <Route path="/seller-products" element={<SellerProducts />} />
        <Route path="/seller-bids" element={<SellerBids />} />

        {/* PAYMENTS */}
        <Route path="/paymentmethods" element={<PaymentMethods />} />
        <Route path="/payment/:bidId" element={<PaymentMethods />} />

        {/* PROFILE */}
        <Route path="/profile" element={<ProfileView />} />
        <Route path="/editprofile" element={<EditProfile />} />
        <Route path="/settings" element={<EditProfile />} />
        <Route path="/changepassword" element={<ChangePassword />} />

        {/* OTHER */}
        <Route path="/receipt/:receiptId" element={<ReceiptView />} />
        <Route path="/help" element={<Help />} />
        <Route path="/about" element={<About />} />
        <Route path="/privacy" element={<Privacy />} />
        <Route path="/terms" element={<Terms />} />
        <Route path="/history" element={<History />} />

        {/* MESSAGES */}
        <Route path="/messages" element={<Messages />} />

        {/* fallback */}
        <Route path="*" element={<Home />} />
      </Routes>

      <Footer />
    </Router>
  );
}

export default App;
