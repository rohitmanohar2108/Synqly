import React, { useEffect, useCallback, useState, useRef } from "react";
import peer from "../service/peer";
import { useSocket } from "../context/SocketProvider";

const RoomPage = () => {
  const socket = useSocket();
  const [remoteSocketId, setRemoteSocketId] = useState(null);
  const [myStream, setMyStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [loading, setLoading] = useState(false);
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);

  const handleUserJoined = useCallback(({ email, id }) => {
    setRemoteSocketId(id);
  }, []);

  const getLocalMedia = useCallback(async () => {
    try {
      setLoading(true);
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: true,
      });
      setMyStream(stream);
    } catch (err) {
      console.error("getUserMedia error", err);
      alert("Unable to access camera/microphone.");
    } finally {
      setLoading(false);
    }
  }, []);

  const handleCallUser = useCallback(async () => {
    if (!remoteSocketId) return;
    if (!myStream) await getLocalMedia();
    const offer = await peer.getOffer();
    socket.emit("user:call", { to: remoteSocketId, offer });
  }, [remoteSocketId, socket, myStream, getLocalMedia]);

  const handleIncommingCall = useCallback(
    async ({ from, offer }) => {
      setRemoteSocketId(from);
      if (!myStream) await getLocalMedia();
      const ans = await peer.getAnswer(offer);
      socket.emit("call:accepted", { to: from, ans });
    },
    [socket, myStream, getLocalMedia]
  );

  const sendStreams = useCallback(() => {
    if (!myStream) return;
    for (const track of myStream.getTracks()) {
      try {
        peer.peer.addTrack(track, myStream);
      } catch (e) {
        // ignore duplicate track errors
      }
    }
  }, [myStream]);

  const handleCallAccepted = useCallback(
    ({ from, ans }) => {
      peer.setLocalDescription(ans);
      sendStreams();
    },
    [sendStreams]
  );

  const handleNegoNeeded = useCallback(async () => {
    const offer = await peer.getOffer();
    socket.emit("peer:nego:needed", { offer, to: remoteSocketId });
  }, [remoteSocketId, socket]);

  useEffect(() => {
    peer.peer.addEventListener("negotiationneeded", handleNegoNeeded);
    return () => {
      peer.peer.removeEventListener("negotiationneeded", handleNegoNeeded);
    };
  }, [handleNegoNeeded]);

  const handleNegoNeedIncomming = useCallback(
    async ({ from, offer }) => {
      const ans = await peer.getAnswer(offer);
      socket.emit("peer:nego:done", { to: from, ans });
    },
    [socket]
  );

  const handleNegoNeedFinal = useCallback(async ({ ans }) => {
    await peer.setLocalDescription(ans);
  }, []);

  useEffect(() => {
    const onTrack = (ev) => {
      const streams = ev.streams;
      if (streams && streams[0]) setRemoteStream(streams[0]);
    };
    peer.peer.addEventListener("track", onTrack);
    return () => peer.peer.removeEventListener("track", onTrack);
  }, []);

  useEffect(() => {
    socket.on("user:joined", handleUserJoined);
    socket.on("incomming:call", handleIncommingCall);
    socket.on("call:accepted", handleCallAccepted);
    socket.on("peer:nego:needed", handleNegoNeedIncomming);
    socket.on("peer:nego:final", handleNegoNeedFinal);

    return () => {
      socket.off("user:joined", handleUserJoined);
      socket.off("incomming:call", handleIncommingCall);
      socket.off("call:accepted", handleCallAccepted);
      socket.off("peer:nego:needed", handleNegoNeedIncomming);
      socket.off("peer:nego:final", handleNegoNeedFinal);
    };
  }, [
    socket,
    handleUserJoined,
    handleIncommingCall,
    handleCallAccepted,
    handleNegoNeedIncomming,
    handleNegoNeedFinal,
  ]);

  useEffect(() => {
    if (localVideoRef.current && myStream) {
      localVideoRef.current.srcObject = myStream;
      localVideoRef.current.play().catch(() => {});
    }
  }, [myStream]);

  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
      remoteVideoRef.current.play().catch(() => {});
    }
  }, [remoteStream]);

  return (
    <div className="room-container">
      <h1>Room</h1>
      <h4>{remoteSocketId ? "Connected" : "No one in room"}</h4>
      <div className="controls">
        <button className="btn" onClick={getLocalMedia} disabled={loading}>
          {myStream ? "Got Camera" : loading ? "Getting..." : "Start Camera"}
        </button>
        <button className="btn" onClick={sendStreams} disabled={!myStream}>
          Send Stream
        </button>
        <button className="btn" onClick={handleCallUser} disabled={!remoteSocketId}>
          Call
        </button>
      </div>

      <div className="videos">
        <div className="video-item">
          <h4>My Stream</h4>
          <video ref={localVideoRef} muted playsInline className="video-el" />
        </div>
        <div className="video-item">
          <h4>Remote Stream</h4>
          <video ref={remoteVideoRef} playsInline className="video-el" />
        </div>
      </div>
    </div>
  );
};

export default RoomPage;
