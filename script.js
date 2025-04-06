const weatherDiv = document.getElementById('weather');
const adviceDiv = document.getElementById('advice');
const messagesDiv = document.getElementById('messages');
const languageSelect = document.getElementById('language');

const weatherApiKey = '63c8e4de1de2beab898c54fdf97ad3a1'; // <-- Replace this with your own OpenWeatherMap API key

// Fetch Weather
async function fetchWeather() {
  if (!navigator.geolocation) {
    weatherDiv.textContent = 'Geolocation not supported.';
    return;
  }

  navigator.geolocation.getCurrentPosition(async (position) => {
    const { latitude, longitude } = position.coords;
    try {
      const res = await fetch(
        `https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&units=metric&appid=${weatherApiKey}`
      );
      const data = await res.json();
      const temp = data.main.temp;
      const condition = data.weather[0].main;
      weatherDiv.textContent = `Current Temp: ${temp}°C, Condition: ${condition}`;
      adviceDiv.innerHTML = temp > 30
        ? '💧 <strong>Please water the crops today.</strong>'
        : '🌿 <strong>No need to water today.</strong>';
    } catch (err) {
      weatherDiv.textContent = 'Failed to fetch weather.';
      console.error(err);
    }
  }, () => {
    weatherDiv.textContent = 'Location permission denied.';
  });
}

fetchWeather();

// Append message to chat
function appendMessage(role, text) {
  const div = document.createElement('div');
  div.textContent = `${role === 'user' ? 'You' : 'Bot'}: ${text}`;
  messagesDiv.appendChild(div);
  messagesDiv.scrollTop = messagesDiv.scrollHeight;
}

// Send message to Flask backend
async function sendMessage() {
  const input = document.getElementById('userInput');
  const message = input.value;
  const lang = languageSelect.value;

  if (!message) return;

  appendMessage('user', message);
  input.value = '';

  let translatedPrompt = message;
  if (lang !== 'en') {
    translatedPrompt = await translateText(message, lang, 'en');
  }

  try {
    const res = await fetch('http://127.0.0.1:5000/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ message: translatedPrompt })
    });

    if (!res.ok) throw new Error(`Backend error: ${res.status}`);

    const data = await res.json();
    let reply = data.reply;

    if (lang !== 'en') {
      reply = await translateText(reply, 'en', lang);
    }

    appendMessage('bot', reply);
  } catch (err) {
    console.error('Chatbot error:', err);
    appendMessage('bot', '❌ Failed to get response from server.');
  }
}

// Voice input
function startVoice() {
  const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
  recognition.lang = 'en-US';
  recognition.start();

  recognition.onresult = (event) => {
    const transcript = event.results[0][0].transcript;
    document.getElementById('userInput').value = transcript;
    sendMessage();
  };
}

// Translate text
async function translateText(text, from, to) {
  try {
    const res = await fetch(`https://translate.googleapis.com/translate_a/single?client=gtx&sl=${from}&tl=${to}&dt=t&q=${encodeURIComponent(text)}`);
    const data = await res.json();
    return data[0].map(item => item[0]).join('');
  } catch (err) {
    console.error('Translation error:', err);
    return text;
  }
}
