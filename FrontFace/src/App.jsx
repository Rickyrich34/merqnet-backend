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

        {/* DASHBOARDS (NO HYPHENS) */}
        <Route path="/dashboard" element={<MainDashboard />} />
        <Route path="/buyerdashboard" element={<BuyerDashboard />} />
        <Route path="/sellerdashboard" element={<SellerDashboard />} />

        {/* REQUESTS / BIDS FLOW (NO HYPHENS) */}
        <Route path="/createrequest" element={<CreateRequest />} />
        <Route path="/submitbid/:requestId" element={<SubmitBid />} />

        {/* Accept / Offers */}
        <Route path="/acceptbid/:bidId" element={<AcceptBid />} />
        <Route path="/bids/:requestId" element={<AcceptBid />} />
        <Route path="/requests/:requestId/acceptbid" element={<AcceptBid />} />

        {/* MESSAGE THREADS / Q&A (NO HYPHENS) */}
        <Route path="/answerback/:threadId" element={<AnswerBack />} />
        <Route path="/selleranswer/:threadId" element={<SellerAnswer />} />
        <Route path="/asktheseller/:requestId" element={<AskTheSeller />} />
        <Route path="/buyerthread/:threadId" element={<BuyerThread />} />

        {/* SELLER (NO HYPHENS) */}
        <Route path="/sellerproducts" element={<SellerProducts />} />
        <Route path="/sellerbids" element={<SellerBids />} />

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
