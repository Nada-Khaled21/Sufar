const Booking = require('../models/Booking');
const Room = require('../models/Room');
const Flight = require('../models/Flight');

// =====================
// Hotel Booking
// =====================
exports.createHotelBooking = async (req, res) => {
  try {
    const { hotelId, roomId, checkIn, checkOut, guestInfo, totalGuests } = req.body;

    // التحقق إن الروم موجودة
    const room = await Room.findById(roomId);
    if (!room) {
      return res.status(404).json({ message: 'Room not found' });
    }

    const checkInDate = new Date(checkIn);
    const checkOutDate = new Date(checkOut);

    // التحقق من صحة التواريخ
    if (checkInDate >= checkOutDate) {
      return res.status(400).json({ message: 'Check-out must be after check-in' });
    }

    // ✅ Conflict Check — هل الغرفة محجوزة في التواريخ دي؟
    // بنشوف في الـ Bookings مش في الـ Room نفسها
    const conflict = await Booking.findOne({
      room: roomId,
      bookingStatus: { $ne: 'cancelled' },
      checkIn: { $lt: checkOutDate },
      checkOut: { $gt: checkInDate }
    });

    if (conflict) {
      return res.status(400).json({ message: 'Room not available for selected dates' });
    }

    // التحقق من عدد الضيوف
    if (totalGuests && totalGuests > room.capacity) {
      return res.status(400).json({ message: `Room capacity is ${room.capacity} guests only` });
    }

    // حساب عدد الليالي والسعر
    const nights = Math.ceil((checkOutDate - checkInDate) / (1000 * 60 * 60 * 24));
    const totalPrice = nights * room.pricePerNight;
    const initialPayment = totalPrice / 2;

    // إنشاء الحجز
    const booking = await Booking.create({
      user: req.user._id,
      bookingType: 'hotel',
      hotel: hotelId,
      room: roomId,
      checkIn: checkInDate,
      checkOut: checkOutDate,
      nights,
      pricePerNight: room.pricePerNight, // snapshot للسعر وقت الحجز
      totalGuests: totalGuests || 1,
      totalPrice,
      initialPayment,
      guestInfo,
      paymentStatus: 'pending',
      bookingStatus: 'pending'
    });

    res.status(201).json(booking);

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// =====================
// Flight Booking
// =====================
exports.createFlightBooking = async (req, res) => {
  try {
    const { flightId, seatClass, selectedSeats, passengers, guestInfo } = req.body;

    // التحقق إن الفلايت موجود
    const flight = await Flight.findById(flightId);
    if (!flight) {
      return res.status(404).json({ message: 'Flight not found' });
    }

    // التحقق إن الـ seats مش محجوزة
    const alreadyBooked = selectedSeats.filter(seat =>
      flight.bookedSeats.includes(seat)
    );
    if (alreadyBooked.length > 0) {
      return res.status(400).json({
        message: `Seats already booked: ${alreadyBooked.join(', ')}`
      });
    }

    // التحقق إن في مقاعد كافية
    if (flight.seats[seatClass].available < selectedSeats.length) {
      return res.status(400).json({ message: 'Not enough available seats' });
    }

    // حساب السعر
    const totalPrice = selectedSeats.length * flight.price[seatClass];
    const initialPayment = totalPrice / 2;

    // إنشاء الحجز
    const booking = await Booking.create({
      user: req.user._id,
      bookingType: 'flight',
      flight: flightId,
      seatClass,
      selectedSeats,
      passengers,
      totalPrice,
      initialPayment,
      guestInfo,
      paymentStatus: 'pending',
      bookingStatus: 'pending'
    });

    // تحديث الـ booked seats في الفلايت
    flight.bookedSeats.push(...selectedSeats);
    flight.seats[seatClass].available -= selectedSeats.length;
    await flight.save();

    res.status(201).json(booking);

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// =====================
// Payment
// =====================
exports.payBooking = async (req, res) => {
  try {
    const { cardNumber, expDate, cvv, paymentOption } = req.body;

    // ─── Validate card details ─────────────────────────
    if (!cardNumber || !expDate || !cvv) {
      return res.status(400).json({ message: 'Card number, expiry date and CVV are required' });
    }

    if (!/^\d{16}$/.test(cardNumber.replace(/\s/g, ''))) {
      return res.status(400).json({ message: 'Invalid card number' });
    }

    if (!/^(0[1-9]|1[0-2])\/\d{2}$/.test(expDate)) {
      return res.status(400).json({ message: 'Invalid expiry date. Use MM/YY format' });
    }

    // التحقق إن الكارت مش expired
    const [month, year] = expDate.split('/');
    const expiry = new Date(2000 + parseInt(year), parseInt(month) - 1, 1);
    if (expiry < new Date()) {
      return res.status(400).json({ message: 'Card has expired' });
    }

    if (!/^\d{3,4}$/.test(cvv)) {
      return res.status(400).json({ message: 'Invalid CVV' });
    }

    // ─── Validate paymentOption ────────────────────────
    if (!['partial', 'full'].includes(paymentOption)) {
      return res.status(400).json({ message: 'paymentOption must be "partial" or "full"' });
    }

    // ─── Get booking ───────────────────────────────────
    const booking = await Booking.findById(req.params.id);
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    if (booking.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    if (booking.bookingStatus === 'cancelled') {
      return res.status(400).json({ message: 'Cannot pay a cancelled booking' });
    }

    if (booking.paymentStatus === 'paid') {
      return res.status(400).json({ message: 'Booking already fully paid' });
    }

    // ─── Calculate amount ──────────────────────────────
    const amountPaid = paymentOption === 'full'
      ? booking.totalPrice
      : booking.initialPayment; // 50%

    const remainingAmount = booking.totalPrice - amountPaid;

    // ─── Simulate payment processing ──────────────────
    // هنا في المستقبل هتستبدليه بـ Stripe أو Paymob
    const paymentResult = simulatePayment(cardNumber);
    if (!paymentResult.success) {
      return res.status(402).json({ message: paymentResult.message });
    }

    // ─── Update booking ────────────────────────────────
    booking.amountPaid = amountPaid;
    booking.remainingAmount = remainingAmount;
    booking.paymentOption = paymentOption;
    booking.paymentStatus = paymentOption === 'full' ? 'paid' : 'partially_paid';
    booking.bookingStatus = 'confirmed';
    booking.paidAt = new Date();

    await booking.save();

    res.json({
      message: paymentOption === 'full'
        ? 'Payment completed successfully!'
        : 'Initial payment completed! Remaining amount due at check-in.',
      booking: {
        id: booking._id,
        bookingStatus: booking.bookingStatus,
        paymentStatus: booking.paymentStatus,
        paymentOption,
        totalPrice: booking.totalPrice,
        amountPaid,
        remainingAmount,
        paidAt: booking.paidAt
      }
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ─── Simulate Payment Helper ───────────────────────────
// بتشيك آخر رقم في الكارت عشان تعمل test cases
// 1 = success, أي رقم تاني = success, بس 0 = fail (للتيست)
const simulatePayment = (cardNumber) => {
  const lastDigit = cardNumber.replace(/\s/g, '').slice(-1);

  if (lastDigit === '0') {
    return { success: false, message: 'Payment declined. Please try another card.' };
  }

  return { success: true };
};

// =====================
// Get My Bookings
// =====================
exports.getMyBookings = async (req, res) => {
  try {
    const bookings = await Booking.find({ user: req.user._id })
      .populate('hotel', 'name location images stars rating')
      .populate('room', 'name type pricePerNight amenities')
      .populate('flight', 'flightNumber from to departureTime')
      .sort({ createdAt: -1 }); // الأحدث أولاً

    res.json(bookings);

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// =====================
// Get Single Booking
// =====================
exports.getBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate('hotel', 'name location images stars rating facilities')
      .populate('room', 'name type pricePerNight amenities beds bathrooms')
      .populate('flight', 'flightNumber from to departureTime arrivalTime');

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    // التحقق إن الـ booking بتاع اليوزر ده
    if (booking.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    res.json(booking);

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// =====================
// Cancel Booking
// =====================
exports.cancelBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    if (booking.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    // التحقق إن الـ booking مش cancelled خلاص
    if (booking.bookingStatus === 'cancelled') {
      return res.status(400).json({ message: 'Booking already cancelled' });
    }

    booking.bookingStatus = 'cancelled';
    await booking.save();

    // ✅ مش محتاجين نعمل حاجة للـ Room
    // الـ Conflict Check هيشوف status: { $ne: 'cancelled' }
    // فالغرفة هتبقى متاحة تلقائي للحجوزات الجديدة

    // لو كان Flight Booking نرجع المقاعد
    if (booking.bookingType === 'flight' && booking.flight) {
      const flight = await Flight.findById(booking.flight);
      if (flight) {
        booking.selectedSeats.forEach(seat => {
          const idx = flight.bookedSeats.indexOf(seat);
          if (idx > -1) flight.bookedSeats.splice(idx, 1);
        });
        flight.seats[booking.seatClass].available += booking.selectedSeats.length;
        await flight.save();
      }
    }

    res.json({ message: 'Booking cancelled successfully' });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// =====================
// Check Room Availability
// =====================
exports.checkAvailability = async (req, res) => {
  try {
    const { roomId, checkIn, checkOut } = req.query;

    if (!roomId || !checkIn || !checkOut) {
      return res.status(400).json({ message: 'roomId, checkIn and checkOut are required' });
    }

    const checkInDate = new Date(checkIn);
    const checkOutDate = new Date(checkOut);

    if (checkInDate >= checkOutDate) {
      return res.status(400).json({ message: 'Invalid dates' });
    }

    const conflict = await Booking.findOne({
      room: roomId,
      bookingStatus: { $ne: 'cancelled' },
      checkIn: { $lt: checkOutDate },
      checkOut: { $gt: checkInDate }
    });

    res.json({ available: !conflict });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};