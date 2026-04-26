const Flight = require('../models/Flight');

// =====================
// Search Flights
// =====================
exports.searchFlights = async (req, res) => {
  try {
    const { from, to, date, class: seatClass } = req.query;

    let filter = {};

    if (from) {
      filter['from.city'] = { $regex: from, $options: 'i' };
    }
    if (to) {
      filter['to.city'] = { $regex: to, $options: 'i' };
    }
    if (date) {
      const startDate = new Date(date);
      const endDate = new Date(date);
      endDate.setDate(endDate.getDate() + 1);
      filter.departureTime = { $gte: startDate, $lt: endDate };
    }

    const flights = await Flight.find(filter);
    res.json(flights);

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// =====================
// Get Single Flight
// =====================
exports.getFlight = async (req, res) => {
  try {
    const flight = await Flight.findById(req.params.id);
    if (!flight) {
      return res.status(404).json({ message: 'Flight not found' });
    }
    res.json(flight);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// =====================
// Create Flight (Admin)
// =====================
exports.createFlight = async (req, res) => {
  try {
    const flight = await Flight.create(req.body);
    res.status(201).json(flight);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// =====================
// Get Available Seats
// =====================
exports.getSeats = async (req, res) => {
  try {
    const flight = await Flight.findById(req.params.id);
    if (!flight) {
      return res.status(404).json({ message: 'Flight not found' });
    }

    res.json({
      totalSeats: flight.seats,
      bookedSeats: flight.bookedSeats
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};