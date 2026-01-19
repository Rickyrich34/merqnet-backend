const mongoose = require('mongoose');
const Bid = require('./models/Bid');
require('dotenv').config();

mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

console.log('⏳ Auto-bid engine running...');

const activeBids = new Map();

const startAutoBid = (bid) => {
  if (activeBids.has(bid._id.toString())) return; // already running

  const interval = setInterval(async () => {
    try {
      const current = await Bid.findById(bid._id);
      if (!current || !current.isAutoBid) {
        clearInterval(interval);
        activeBids.delete(bid._id.toString());
        return;
      }

      const nextPrice = parseFloat(current.currentPrice || current.offerPrice) - current.bidDecrease;

      if (nextPrice <= current.autoBidMin) {
        current.currentPrice = current.autoBidMin;
        current.isAutoBid = false;
        await current.save();
        clearInterval(interval);
        activeBids.delete(bid._id.toString());
        console.log(`✅ Bid ${current._id} reached minimum: ${current.autoBidMin}`);
      } else {
        current.currentPrice = nextPrice.toFixed(2);
        await current.save();
        console.log(`🔁 Bid ${current._id} lowered to ${nextPrice.toFixed(2)}`);
      }
    } catch (err) {
      console.error('Auto-bid error:', err);
      clearInterval(interval);
      activeBids.delete(bid._id.toString());
    }
  }, bid.bidFrequency * 1000);

  activeBids.set(bid._id.toString(), interval);
};

const monitorAutoBids = async () => {
  const bids = await Bid.find({ isAutoBid: true });
  bids.forEach(startAutoBid);
};

setInterval(monitorAutoBids, 10000); // check every 10s for new auto-bids
