import { useState, useEffect, useCallback } from 'react';
import './App.css';

function App() {
  const [digits, setDigits] = useState(1); // 位數
  const [number, setNumber] = useState(null); // 當前題目數字
  const [input, setInput] = useState(''); // 使用者輸入
  const [feedback, setFeedback] = useState({ message: '', type: '' }); // 提示
  const [feedbackKey, setFeedbackKey] = useState(0); // FeedbackMessage 的 key
  const [audioSrc, setAudioSrc] = useState(''); // 語音 URL (保留但未使用)
  const [isSubmitting, setIsSubmitting] = useState(false); // 控制提交狀態
  const [language, setLanguage] = useState('ja-JP'); // 語言：ja-JP, ko-KR
  const [voices, setVoices] = useState([]); // 過濾後的語音清單
  const [selectedVoice, setSelectedVoice] = useState(''); // 選中的語音 name

  console.log('Debug: App rendered', { digits, number, input, language, selectedVoice });

  // 載入並過濾語音清單
  useEffect(() => {
    const loadVoices = () => {
      const availableVoices = window.speechSynthesis.getVoices();
      // 過濾自然語音：Google, Kyoko, Yuna
      const filteredVoices = availableVoices.filter((voice) =>
        ['Google', 'Kyoko', 'Yuna', 'Hattori', 'O-Ren'].some((name) => voice.name.includes(name)) &&
        voice.lang === language
      );
      console.log('Debug: Filtered voices', filteredVoices);
      setVoices(filteredVoices);
      // 預設選擇第一個語音
      const defaultVoice = filteredVoices[0];
      if (defaultVoice) {
        setSelectedVoice(defaultVoice.name);
      } else {
        console.warn('Debug: No natural voices found for', language);
      }
    };
    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;
    return () => {
      window.speechSynthesis.onvoiceschanged = null;
    };
  }, [language]); // 語言改變時重新過濾

  const generateNumber = (digits) => {
    const min = digits === 1 ? 0 : Math.pow(10, digits - 1);
    const max = Math.pow(10, digits) - 1;
    const newNumber = Math.floor(Math.random() * (max - min + 1)) + min;
    console.log('Debug: generateNumber', { digits, newNumber });
    return newNumber;
  };

  const playAudio = useCallback(() => {
    console.log('Debug: playAudio called', { number, language, selectedVoice });
    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(number);
      utterance.lang = language;
      const voice = voices.find((voice) => voice.name === selectedVoice);
      if (voice) {
        utterance.voice = voice;
      } else {
        console.warn('Debug: Selected voice not found', selectedVoice);
        setFeedback({ message: '無自然語音可用，使用預設語音', type: 'error' });
        setFeedbackKey((prev) => prev + 1);
      }
      window.speechSynthesis.speak(utterance);
    } catch (error) {
      console.error('Debug: playAudio error', error);
      setFeedback({ message: '語音生成失敗，請重試', type: 'error' });
      setFeedbackKey((prev) => prev + 1);
    }
  }, [number, language, selectedVoice, voices]);

  useEffect(() => {
    console.log('Debug: digits effect', { digits });
    const newNumber = generateNumber(digits);
    setNumber(newNumber);
  }, [digits]);

  useEffect(() => {
    if (number !== null) {
      console.log('Debug: number effect', { number });
      playAudio();
    }
  }, [number, playAudio]);

  const handleSubmit = () => {
    console.log('Debug: handleSubmit', { input, number, isSubmitting });
    if (isSubmitting) return;
    setIsSubmitting(true);
    if (!input || isNaN(parseInt(input))) {
      setFeedback({ message: '請輸入有效數字', type: 'error' });
      setFeedbackKey((prev) => prev + 1);
    } else if (parseInt(input) === number) {
      setFeedback({ message: '正確！已生成新題目', type: 'success' });
      setFeedbackKey((prev) => prev + 1);
      const newNumber = generateNumber(digits);
      setNumber(newNumber);
      setInput('');
    } else {
      setFeedback({ message: '錯誤，請再試一次', type: 'error' });
      setFeedbackKey((prev) => prev + 1);
    }
    setTimeout(() => setIsSubmitting(false), 500);
  };

  const handleShowAnswer = () => {
    console.log('Debug: handleShowAnswer', { number });
    setFeedback({ message: `答案是：${number}`, type: 'info' });
    setFeedbackKey((prev) => prev + 1);
  };

  const handleNext = () => {
    console.log('Debug: handleNext');
    const newNumber = generateNumber(digits);
    setNumber(newNumber);
    setInput('');
    setFeedback({ message: '', type: '' });
    setFeedbackKey((prev) => prev + 1);
  };

  return (
    <div className="max-w-md mx-auto p-6 bg-gray-100 rounded-lg shadow-md mt-10">
      <h1 className="text-2xl font-bold text-center mb-6">數字聽力練習</h1>
      <div className="mb-4">
        <div className="flex gap-4 mb-4">
          <div className="flex-1">
            <label className="block text-sm font-medium mb-1">選擇語言：</label>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="w-full p-2 border rounded"
            >
              <option value="ja-JP">日文</option>
              <option value="ko-KR">韓文</option>
            </select>
          </div>
          <div className="flex-1">
            <label className="block text-sm font-medium mb-1">選擇位數：</label>
            <select
              value={digits}
              onChange={(e) => setDigits(parseInt(e.target.value))}
              className="w-full p-2 border rounded"
            >
              {[1, 2, 3, 4, 5].map((d) => (
                <option key={d} value={d}>
                  {d} 位數
                </option>
              ))}
            </select>
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">選擇語音：</label>
          <select
            value={selectedVoice}
            onChange={(e) => setSelectedVoice(e.target.value)}
            className="w-full p-2 border rounded"
            disabled={voices.length === 0}
          >
            {voices.length === 0 ? (
              <option value="">無自然語音可用</option>
            ) : (
              voices.map((voice) => (
                <option key={voice.name} value={voice.name}>
                  {voice.name} ({voice.lang})
                </option>
              ))
            )}
          </select>
        </div>
      </div>
      <div className="mb-4">
        <button
          onClick={playAudio}
          className="w-full bg-blue-500 text-white p-2 rounded hover:bg-blue-600"
        >
          播放
        </button>
      </div>
      <div className="mb-4">
        <input
          type="number"
          min="0"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleSubmit();
          }}
          placeholder="輸入數字"
          className="w-full p-2 border rounded"
        />
      </div>
      <div className="flex justify-between mb-4 gap-2">
        <button
          onClick={handleSubmit}
          className="flex-1 bg-green-500 text-white p-2 rounded hover:bg-green-600"
        >
          送出
        </button>
        <button
          onClick={handleShowAnswer}
          className="flex-1 bg-blue-600 text-white p-2 rounded hover:bg-blue-700"
        >
          顯示答案
        </button>
        <button
          onClick={handleNext}
          className="flex-1 bg-yellow-500 text-white p-2 rounded hover:bg-yellow-600"
        >
          下一題
        </button>
      </div>
      <FeedbackMessage
        key={feedbackKey}
        message={feedback.message}
        type={feedback.type}
      />
      {audioSrc && <audio src={audioSrc} style={{ display: 'none' }} />}
    </div>
  );
}

function FeedbackMessage({ message, type }) {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    console.log('Debug: FeedbackMessage', { message, type, visible });
    if (message) {
      setVisible(true);
      const timer = setTimeout(() => setVisible(false), 3000);
      return () => clearTimeout(timer);
    } else {
      setVisible(false);
    }
  }, [message]);
  return visible ? (
    <div
      className={`text-center transition-opacity duration-300 ${type === 'success'
          ? 'text-green-600'
          : type === 'error'
            ? 'text-red-600'
            : 'text-blue-600'
        }`}
    >
      {message}
    </div>
  ) : null;
}

export default App;