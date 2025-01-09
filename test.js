const userSchema = new Schema({
    username: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    // Add any other relevant user fields here
  });


const roomSchema = new Schema(
    {
        topic: {type: String, required: true},
        roomType: {type: String, required: true},
        ownerId: {type: Schema.Types.ObjectId, ref: 'User'},
        speakers: {
            type: [
                {
                    type: Schema.Types.ObjectId, 
                    ref: 'User'
                }
            ],
            required: false
        }
    }
)


//how to connect 2 browsers using webrtc peer connection
//1. create a new RTCPeerConnection
//2. add local media stream to the peer connection
//3. create an offer and set it as the local description
//4. send the offer to the other peer
//5. when the other peer receives the offer, set it as the remote description
//6. create an answer and set it as the local description
//7. send the answer to the other peer
//8. when the other peer receives the answer, set it as the remote description
//9. exchange ICE candidates between the peers
//10. when an ICE candidate is received, add it to the peer connection
//11. when the peer connection has been established, the peers can exchange data
//12. when the peer connection is no longer needed, close it



//how to connect 2 browsers using webrtc peer connection
//1. create a new RTCPeerConnection
const peerConnection = new RTCPeerConnection();
//2. add data channel to the peer connection for sending and receiving data
const dataChannel = peerConnection.createDataChannel('bigDataChannel');
//Now this data Channel has a bunch of events that we can listen to like onopen, onmessage, onclose, onerror
//Now first event we'll listen to each onopen event which is fired when the data channel is opened
dataChannel.onopen = () => console.log('Data channel is open');
//Next we'll listen to the onmessage event which is fired when a message is received
dataChannel.onmessage = (event) => console.log('Message received:', event.data);
//Now we have to send our ice candidates to the other peer
//Ice candidates are used to establish a connection between the peers, it contains information about the network connection like IP address, port, and protocol collected by the ICE agent in the browser
//We'll listen to the icecandidate event on the peer connection
// peerConnection.onicecandidate = (event) => {
//     if(event.candidate) {
//         //send the ice candidate to the other peer
//     }
// }
//Local description is the session description that describes the local end of the connection in the browser and contains information about the media streams, codecs, and other settings used in the connection which is also a part of ice candidate
peerConnection.onicecandidate = (event) => console.log('New ICE candidate:', JSON.stringify(peerConnection.localDescription));
//Now we have to create an offer and set it as the local description
const offer = await peerConnection.createOffer();
//Now our offer is created but we have to set the offer as the local description of the peer connection in our browser
peerConnection.setLocalDescription(offer);
//This triggers the onicecandidate event as the local description has changed and a new ice candidate has been generated which we can send to the other peer

//Now we have to send the ice candidate generated in the offer to the other peer

//So now we create a new connection in a new browser
//1. create a new RTCPeerConnection
const peerConnection = new RTCPeerConnection();

//and then we copy the ice candidate from the first browser and set it as the offer in the second browser
//2. set the offer as the remote description
await peerConnection.setRemoteDescription(offer);
//Now we also have to generate ice candidates in the second browser to send to the first browser
//We'll listen to the icecandidate event on the peer connection
peerConnection.onicecandidate = (event) => console.log('New ICE candidate:', JSON.stringify(peerConnection.localDescription));
//Now we dont have to create a data channel in the second browser as it will be created by the first browser
//So now we have to listen to the data channel event on the peer connection
let dataChannel;
peerConnection.ondatachannel = (event) => {
    dataChannel = event.channel;
    dataChannel.onopen = () => console.log('Data channel is open');
    dataChannel.onmessage = (event) => console.log('Message received:', event.data);
}
//Now that we have setup the listeners for the data channel on second browser, we have to send the ice candidates generated in the second browser to the first browser as answer to the offer which is set in the local description of the second browser 
const answer = await peerConnection.createAnswer();
await peerConnection.setLocalDescription(answer);
//As soon as the local description is set, the onicecandidate event is triggered and we can send the ice candidate to the first browser

//We have to copy the ice candidate from the second browser and set it as the answer in the first browser
//3. set the answer as the remote description in the first browser
await peerConnection.setRemoteDescription(answer);

//Now the ice candidates have been exchanged between the peers and the connection has been established and data channel is open on both the peers
//Now the peers can exchange data using the data channel
dataChannel.send('Hello from the browser 1');







///jnfddj
import { useCallback, useEffect, useRef } from "react";
import { useStateWithCallback } from "./useStateWithCallback";
import socketInit from "../socket";
import { ACTIONS } from "../actions";
import freeice from "freeice";

export const useWebRTC = (roomId, user) => {
  console.log("roomId", roomId);
  console.log("user", user);

  const [clients, setClients] = useStateWithCallback([]); //list of all users
  const audioElements = useRef({});
  const connections = useRef({});
  const localMediaStream = useRef(null);
  const socket = useRef(null);

  useEffect(() => {
    if (!socket.current) socket.current = socketInit();
  }, []);

  const provideRef = (instance, userId) => {
    console.log("instance", instance);
    console.log("userId", userId);
    audioElements.current[userId] = instance;
  };

  // const addNewClient = useCallback((newClient, cb) => {
  //     const lookingFor = clients.find((client) => client.id === newClient.id);

  //     console.log("lookingFor", lookingFor);

  //     if (lookingFor === undefined) {
  //         setClients((existingClients) => [...existingClients, newClient], cb);
  //     }
  // }, [clients, setClients])
  const addNewClient = useCallback(
    (newClient, cb) => {
      setClients((existingClients) => {
        const clientExists = existingClients.some(
          (client) => client.id === newClient.id
        );
        if (!clientExists) {
          return [...existingClients, newClient];
        }
        return existingClients; // Return unchanged if client exists
      }, cb);
    },
    [clients, setClients]
  );

  //Capture local media stream

  useEffect(() => {
     const startCapture = async () => {
         localMediaStream.current = await navigator.mediaDevices.getUserMedia({
             audio: true
         })
     }

     startCapture().then(() => {
         addNewClient(user, () => {
             const localAudioElement = audioElements.current[user.id];

             if (localAudioElement) {
                 localAudioElement.volume = 0;
                 localAudioElement.srcObject = localMediaStream.current;
             }

             //socket emit to join room
             socket.current.emit(ACTIONS.JOIN, { roomId, user });
         })
     })

     return () => {
         if (localMediaStream.current) {
             localMediaStream.current.getTracks().forEach((track) => {
                 track.stop();
             })
         }

         socket.current.emit(ACTIONS.LEAVE, { roomId });
     }
  }, []);

  useEffect(() => {
    const handleNewPeer = async ({ peerId, createOffer, user: remoteUser }) => {
      console.log("New peer", peerId, createOffer , remoteUser);
      //if already connected to peer, return
      if (peerId in connections.current)
        return console.warn("Already connected to peer", peerId, user.name);

      connections.current[peerId] = new RTCPeerConnection({
        iceServers: freeice(),
      });

      //handle new ice candidate
      connections.current[peerId].onicecandidate = (event) => {
        if (event.candidate) {
          socket.current.emit(ACTIONS.RELAY_ICE, {
            peerId,
            iceCandidate: event.candidate,
          });
        }
      };

      //Handle on track event on this peer connection
      connections.current[peerId].ontrack = ({ streams: [remoteStream] }) => {
        addNewClient(remoteUser, () => {
         //check if audio element exists for this peer/client
          if (audioElements.current[remoteUser.id]) {
            audioElements.current[remoteUser.id].srcObject = remoteStream;
          } else {
            let settled = false;
            const interval = setInterval(() => {
              if (audioElements.current[remoteUser.id]) {
                audioElements.current[remoteUser.id].srcObject = remoteStream;
                settled = true;
              }
              if (settled) {
                clearInterval(interval);
              }
            }, 1000);
          }
        });
      };

      //Add local media stream to peer connection so that our audio is sent to the remote peer
      localMediaStream.current.getTracks().forEach((track) => {
        connections.current[peerId].addTrack(track, localMediaStream.current);
      });

      //Create offer if this peer is the initiator
      if (createOffer) {
        const offer = await connections.current[peerId].createOffer();
        connections.current[peerId].setLocalDescription(offer);

        //send offer to peer
        socket.current.emit(ACTIONS.RELAY_SDP, {
          peerId,
          sessionDescription: offer,
        });
      }
    };

    socket.current.on(ACTIONS.ADD_PEER, handleNewPeer);

    return () => {
      socket.current.off(ACTIONS.ADD_PEER, handleNewPeer);
    };
  }, []);

  //Handle incoming ice candidates
  useEffect(() => {
    const handleIce = ({ peerId, iceCandidate }) => {
      if (iceCandidate)
        connections.current[peerId].addIceCandidate(iceCandidate);
    };

    socket.current.on(ACTIONS.ICE_CANDIDATE, handleIce);

    return () => {
      socket.current.off(ACTIONS.ICE_CANDIDATE, handleIce);
    };
  }, []);

  //Handle incoming session descriptions
  useEffect(() => {
    const handleSessionDescription = async ({ peerId, sessionDescription }) => {
      await connections.current[peerId].setRemoteDescription(
        new RTCSessionDescription(sessionDescription)
      );

      if (sessionDescription.type === "offer") {
        const answer = await connections.current[peerId].createAnswer();
        connections.current[peerId].setLocalDescription(answer);

        //send answer to peer
        socket.current.emit(ACTIONS.RELAY_SDP, {
          peerId,
          sessionDescription: answer,
        });
      }
    };

    socket.current.on(ACTIONS.SESSION_DESCRIPTION, handleSessionDescription);

    return () => {
      socket.current.off(ACTIONS.SESSION_DESCRIPTION, handleSessionDescription);
    };
  }, []);

  //Handle remove peer
  useEffect(() => {
    const handleRemovePeer = async ({ peerId, userId }) => {
      if (connections.current[peerId]) {
        connections.current[peerId].close();
      }

      delete connections.current[peerId];
      delete audioElements.current[userId];
      setClients((existingClients) => {
        return existingClients.filter((client) => client.id !== userId);
      });
    };

    socket.current.on(ACTIONS.REMOVE_PEER, handleRemovePeer);
  }, []);

  return { clients, provideRef };
};




////kfmkdkdf
import { useCallback, useEffect, useRef, useState } from "react";

export const useStateWithCallback = (initialState) => {
  const [state, setState] = useState(initialState);
  // const setStateWithCallback = (value, callback) => {
  //     setState(value);
  //     callback();
  // };
  // return [state, setStateWithCallback];

  const callbackRef = useRef();

  const updateState = useCallback((newState, callback) => {
    callbackRef.current = callback;

    setState((prev) => {
      return typeof newState === "function" ? newState(prev) : newState;
    });
  }, []);

  useEffect(() => {
      if (callbackRef.current) {
        callbackRef.current(state);
        callbackRef.current = null;
      }
  },[state])
  return [state, updateState];
};

