import "./App.css";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

import Home from "./pages/Home";
import Login from "./pages/Login";
import Signup from "./pages/Signup";

import MainDashboard from "./pages/MainDashboard";
import BuyerDashboard from "./pages/BuyerDashboard";
import BuyerThread from "./pages/BuyerThread";
import AskTheSeller from "./pages/AskTheSeller";

import SellerDashboard from "./pages/SellerDashboard";
import SellerProducts from "./pages/SellerProducts";
import SellerBids from "./pages/SellerBids";
import SellerAnswer from "./pages/SellerAnswer";
import SubmitBid from "./pages/SubmitBid";

import CreateRequest from "./pages/CreateRequest";
import AcceptBid from "./pages/AcceptBid";

import PaymentMethods from "./pages/PaymentMethods";

import ProfileView from "./pages/ProfileView";
import EditProfile from "./pages/EditProfile";
import ChangePassword from "./pages/ChangePassword";

import ReceiptView from "./pages/ReceiptView";
import Help from "./pages/Help";
import About from "./pages/About";
import History from "./pages/History";
import Messages from "./pages/Messages";

import Terms from "./pages/Terms";
import Privacy from "./pages/Privacy";

import Navbar from "./components/Navbar";
import Footer from "./components/Footer";

function App() {
  return (
    <Router>
      <Navbar />

      <Routes>
        {/* PUBLIC */}
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />

        {/* LEGAL */}
        <Route path="/terms" element={<Terms />} />
        <Route path="/privacy" element={<Privacy />} />

        {/* DASHBOARD */}
        <Route path="/dashboard" element={<MainDashboard />} />
        <Route path="/buyerdashboard" element={<BuyerDashboard />} />
        <Route path="/buyerthread/:id" element={<BuyerThread />} />
        <Route path="/asktheseller/:id" element={<AskTheSeller />} />

        {/* SELLER */}
        <Route path="/sellerdashboard" element={<SellerDashboard />} />
        <Route path="/sellerproducts" element={<SellerProducts />} />
        <Route path="/sellerbids" element={<SellerBids />} />
        <Route path="/selleranswer/:id" element={<SellerAnswer />} />
        <Route path="/submitbid/:id" element={<SubmitBid />} />

        {/* PAYMENT METHODS */}
        <Route path="/payment-methods" element={<PaymentMethods />} />

        {/* PAYMENT FLOW WITH BID ID */}
        <Route path="/payment/:bidId" element={<PaymentMethods />} />

        {/* ACCEPT BID */}
        <Route path="/requests/:requestId/acceptbid" element={<AcceptBid />} />

        {/* REQUESTS */}
        <Route path="/createrequest" element={<CreateRequest />} />

        {/* PROFILE */}
        <Route path="/profile" element={<ProfileView />} />
        <Route path="/editprofile" element={<EditProfile />} />
        <Route path="/changepassword" element={<ChangePassword />} />

        {/* OTHER */}
        <Route path="/receipt/:receiptId" element={<ReceiptView />} />
        <Route path="/help" element={<Help />} />
        <Route path="/about" element={<About />} />
        <Route path="/history" element={<History />} />

        {/* MESSAGES */}
        <Route path="/messages" element={<Messages />} />

        {/* ✅ FIX ONLY: fallback route to avoid blank/load fail */}
        <Route path="*" element={<Home />} />
      </Routes>

      <Footer />
    </Router>
  );
}

export default App;
