import { useEffect, useRef, useState } from 'react';

export default function Chat({ messages, onSend }) {
  const [text, setText] = useState('');
  const endRef = useRef(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  const submit = (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    onSend(text.trim());
    setText('');
  };

  return (
    <div className="card chat">
      <h3>Chat</h3>
      <div className="chat-log">
        {messages.length === 0 && <p className="muted">Say hi to your opponent 👋</p>}
        {messages.map((m) => (
          <div key={m.id} className="chat-msg">
            <span className={`chat-name ${m.color}`}>{m.from}</span>
            <span>{m.text}</span>
          </div>
        ))}
        <div ref={endRef} />
      </div>
      <form onSubmit={submit} className="chat-form">
        <input value={text} onChange={(e) => setText(e.target.value)} placeholder="Type a message..." maxLength={200} />
        <button className="btn btn-primary btn-sm" type="submit">Send</button>
      </form>
    </div>
  );
}
