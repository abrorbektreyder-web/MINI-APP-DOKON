const token = '8719208102:AAGcxrZ6CKXmHjt5yCCJpxWS2NJQQ7cIiiE';
const url = 'https://mini-app-dokon.vercel.app';

async function updateTelegramUI() {
  // 1. Set Menu Button (Creative, luxury, no question marks)
  const menuBody = {
    menu_button: {
      type: 'web_app',
      text: '🛍 LUXOR Do‘koni ✨',
      web_app: { url }
    }
  };

  const res1 = await fetch(`https://api.telegram.org/bot${token}/setChatMenuButton`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(menuBody)
  });
  const data1 = await res1.json();
  console.log('1. Menu Button:', data1);

  // 2. Set Bot Description (What new users see before pressing /start)
  const descBody = {
    description: "LUXOR rasmiy do'koni. Eng sara smart-gadjetlar va premium tovarlar. Butun O'zbekiston bo'ylab 1 kunda bepul yetkazib beramiz! ✨"
  };
  const res2 = await fetch(`https://api.telegram.org/bot${token}/setMyDescription`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(descBody)
  });
  const data2 = await res2.json();
  console.log('2. Description:', data2);

  // 3. Set Short Description
  const shortDescBody = {
    short_description: "LUXOR rasmiy online do'koni 🛍 Sifatli tovarlar va tezkor yetkazish."
  };
  const res3 = await fetch(`https://api.telegram.org/bot${token}/setMyShortDescription`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(shortDescBody)
  });
  const data3 = await res3.json();
  console.log('3. Short Description:', data3);
}

updateTelegramUI();
