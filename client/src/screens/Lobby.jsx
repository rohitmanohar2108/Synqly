import React, { useState, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useSocket } from "../context/SocketProvider";

const isValidEmail = (s) => /\S+@\S+\.\S+/.test(s);

const LobbyScreen = () => {
  const [email, setEmail] = useState("");
  const [room, setRoom] = useState("");
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState("");

  const socket = useSocket();
  const navigate = useNavigate();

  const handleSubmitForm = useCallback(
    (e) => {
      e.preventDefault();
      setError("");
      if (!isValidEmail(email)) return setError("Please enter a valid email.");
      if (!room.trim()) return setError("Please enter a room id.");

      // Try to emit immediately if connected, otherwise wait for socket to connect.
      setJoining(true);
      const emitJoin = () => {
        try {
          socket.emit("room:join", { email, room });
        } catch (err) {
          setError("Failed to send join request.");
          setJoining(false);
        }
      };

      if (socket && socket.connected) {
        emitJoin();
      } else {
        const onConnect = () => {
          emitJoin();
          socket.off("connect", onConnect);
        };
        socket.on("connect", onConnect);

        // Fail fast if still not connected after 5s
        const timeout = setTimeout(() => {
          socket.off("connect", onConnect);
          setError("Unable to connect to server. Try again.");
          setJoining(false);
        }, 5000);

        // clear timeout when we receive room:join (handled below)
        const clearOnJoin = () => clearTimeout(timeout);
        socket.once("room:join", clearOnJoin);
      }
    },
    [email, room, socket]
  );

  const handleJoinRoom = useCallback(
    (data) => {
      const { room } = data;
      setJoining(false);
      navigate(`/room/${room}`);
    },
    [navigate]
  );

  useEffect(() => {
    const onConnectError = () => {
      if (joining) setError("Unable to connect to server");
    };

    socket.on("room:join", handleJoinRoom);
    socket.on("connect_error", onConnectError);
    return () => {
      socket.off("room:join", handleJoinRoom);
      socket.off("connect_error", onConnectError);
    };
  }, [socket, handleJoinRoom]);

  return (
    <div className="lobby-container">
      <h1>Welcome to SYNQLY</h1>
      <form className="lobby-form" onSubmit={handleSubmitForm} noValidate>
        <label htmlFor="email">Email</label>
        <input
          type="email"
          id="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={joining}
          required
        />

        <label htmlFor="room">Room ID</label>
        <input
          type="text"
          id="room"
          placeholder="room-123"
          value={room}
          onChange={(e) => setRoom(e.target.value)}
          disabled={joining}
          required
        />

        {error && <div className="form-error">{error}</div>}

        <button className="btn" disabled={joining || !isValidEmail(email) || !room}>
          {joining ? "Joining..." : "Join"}
        </button>
      </form>
    </div>
  );
};

export default LobbyScreen;
