const Flight = require('../models/Flight');

  //  SEARCH FLIGHTS
exports.searchFlights = async (req, res) => {
  try {

    const {
      from,
      to,
      date,
      class: seatClass,
      stops,
      minPrice,
      maxPrice,
      airline,
      sortBy = 'price'
    } = req.query;

    let filter = { isActive: true };

    // 🔥 use airport code instead of city regex (FAST + ACCURATE)
    if (from) filter['from.code'] = from.toUpperCase();
    if (to) filter['to.code'] = to.toUpperCase();

    // Date filter
    if (date) {
      const start = new Date(date);
      const end = new Date(date);
      end.setDate(end.getDate() + 1);

      filter.departureTime = { $gte: start, $lt: end };
    }

    if (stops !== undefined) {
      filter.stops = Number(stops);
    }

    if (airline) {
      filter['airline.name'] = { $regex: airline, $options: 'i' };
    }

    // Price filter
    if (minPrice || maxPrice) {
      const field = seatClass === 'business'
        ? 'price.business'
        : 'price.economy';

      filter[field] = {};

      if (minPrice) filter[field].$gte = Number(minPrice);
      if (maxPrice) filter[field].$lte = Number(maxPrice);
    }

    // Seat availability
    if (seatClass) {
      const seatField = seatClass === 'business'
        ? 'seats.business.available'
        : 'seats.economy.available';

      filter[seatField] = { $gt: 0 };
    }

    // Sorting
    let sort = {};

    if (sortBy === 'price') {
      sort = seatClass === 'business'
        ? { 'price.business': 1 }
        : { 'price.economy': 1 };
    }

    if (sortBy === 'duration') {
      sort = { durationMinutes: 1 };
    }

    if (sortBy === 'departure') {
      sort = { departureTime: 1 };
    }

    const flights = await Flight.find(filter)
      .sort(sort)
      .populate('agency', 'name logo');

    res.json({
      count: flights.length,
      results: flights
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/* =========================
   GET SINGLE FLIGHT
========================= */
exports.getFlight = async (req, res) => {
  try {

    const flight = await Flight.findById(req.params.id)
      .populate('agency', 'name logo phone email');

    if (!flight) {
      return res.status(404).json({ message: 'Flight not found' });
    }

    res.json(flight);

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/* =========================
   SEATS
========================= */
exports.getSeats = async (req, res) => {
  try {

    const flight = await Flight.findById(req.params.id);

    if (!flight) {
      return res.status(404).json({ message: 'Flight not found' });
    }

    res.json({
      seats: flight.seats,
      bookedSeats: flight.bookedSeats
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

  //  ADMIN CRUD
exports.createFlight = async (req, res) => {
  try {
    const flight = await Flight.create(req.body);
    res.status(201).json({ message: 'Flight created', flight });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.updateFlight = async (req, res) => {
  try {
    const flight = await Flight.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!flight) {
      return res.status(404).json({ message: 'Flight not found' });
    }

    res.json({ message: 'Updated', flight });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.deleteFlight = async (req, res) => {
  try {

    const flight = await Flight.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );

    if (!flight) {
      return res.status(404).json({ message: 'Flight not found' });
    }

    res.json({ message: 'Deleted successfully' });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};