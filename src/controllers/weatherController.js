const axios = require('axios');

const bestTimeMap = {
  'cairo':             'October to April',
  'alexandria':        'April to October',
  'sharm-el-sheikh':   'March to May, September to November',
  'hurghada':          'March to May, September to November',
  'luxor':             'October to February',
  'aswan':             'October to February',
  'dubai':             'November to March',
  'abu-dhabi':         'November to March',
  'jeddah':            'November to February',
  'riyadh':            'October to March',
  'makkah':            'November to February',
  'al-madinah':        'November to February',
  'doha':              'November to February',
  'beirut':            'June to September',
  'amman':             'March to May, September to November',
  'istanbul':          'April to May, September to October',
  'london':            'June to August',
  'paris':             'June to August',
  'rome':              'April to June, September to October',
  'barcelona':         'May to June, September to October',
  'new-york':          'April to June, September to November',
  'los-angeles':       'March to May, September to November',
  'tokyo':             'March to May, September to November',
  'maldives':          'November to April',
};

const getClimateDesc = (temp) => {
  if (temp >= 30) return 'Tropical Hot';
  if (temp >= 25) return 'Warm & Sunny';
  if (temp >= 18) return 'Mild & Pleasant';
  if (temp >= 10) return 'Cool';
  return 'Cold';
};

exports.getWeather = async (req, res) => {
  try {
    const { city, slug } = req.query;

    if (!city) {
      return res.status(400).json({ message: 'city is required' });
    }

    const bestTime = bestTimeMap[slug?.toLowerCase()] ||
                     bestTimeMap[city?.toLowerCase()] ||
                     'Year-round';

    const apiKey = process.env.OPENWEATHER_API_KEY;

    if (!apiKey) {
      return res.json({
        city,
        temperature: null,
        description: 'Weather data unavailable',
        climate: '',
        bestTime,
        icon: null
      });
    }

    const response = await axios.get(
      `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&appid=${apiKey}&units=metric`
    );

    const { main, weather } = response.data;
    const temp = Math.round(main.temp);

    res.json({
      city,
      temperature: temp,
      feelsLike: Math.round(main.feels_like),
      humidity: main.humidity,
      description: weather[0].description,
      climate: getClimateDesc(temp),
      bestTime,
      icon: `https://openweathermap.org/img/wn/${weather[0].icon}@2x.png`
    });

  } catch (error) {
    if (error.response?.status === 404) {
      return res.status(404).json({ message: 'City not found' });
    }
    res.status(500).json({ message: error.message });
  }
};