import RoomDto from "../dtos/room-dto.js";
import prisma from "../config/db.config.js";

class RoomController {
  // static async getRooms(req, res) {
  //     const rooms = await req.db.Room.findAll();
  //     res.send(rooms);
  // }

  static async createRoom(req, res) {
    const { topic, roomType } = req.body;

    const ownerId = req.user.id;

    if (!topic || !roomType) {
      return res
        .status(400)
        .json({ error: "Topic and room type are required" });
    }

    //topic, roomtype, ownerId
    // try {
    //   const room = await prisma.room.create({
    //     data: {
    //       topic,
    //       roomType,
    //       ownerId,
    //       speakers: {
    //         create: [
    //           {
    //             userId: ownerId,
    //           },
    //         ],
    //       },
    //       include: {
    //         speakers: true,
    //       },
    //     },
    //   });

    //   res.status(201).json(new RoomDto(room));
    // } catch (error) {
    //   console.error(error);
    //   res.status(500).json({ error: "Failed to create room" });
    // }

    try {
      // Create the room and the owner's speaker entry
      const room = await prisma.room.create({
        data: {
          topic,
          roomType,
          ownerId,
          speakers: {
            create: [
              {
                userId: ownerId, // Add the owner as a speaker
              },
            ],
          },
        },
      });

      // Fetch the created room with speakers included
      const roomWithSpeakers = await prisma.room.findUnique({
        where: { id: room.id },
        include: {
          speakers: true, // Include the speakers relation
        },
      });

      res.status(201).json(roomWithSpeakers);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Failed to create room" });
    }

    // try {
    //   // Connect to MongoDB
    //   const db = await connectToDatabase();

    //   // Insert a new room with the embedded `speakers` array
    //   const result = await db.collection("Room").insertOne({
    //     topic,
    //     roomType,
    //     ownerId,
    //     speakers: [ownerId], // Embedded array of user IDs
    //     createdAt: new Date(),
    //     updatedAt: new Date(),
    //   });

    //   // Fetch the newly created room (optional, for confirmation)
    //   const createdRoom = await db
    //     .collection("Room")
    //     .findOne({ _id: result.insertedId });

    //   res.status(201).json(createdRoom); // Return the created room
    // } catch (error) {
    //   console.error(error);
    //   res.status(500).json({ error: "Failed to create room" });
    // }
  }

  static async getAllRooms(req, res) {
    try {
      const rooms = await prisma.room.findMany({
        include: {
          speakers: {
            include: {
              user: true,
            }
          },
          owner: true,
        },
      });

      const formattedRooms = rooms.map((room) => ({
        ...room,
        speakers: room.speakers.map((speaker) => speaker.user),
      }));
      
      res.status(200).json({rooms: formattedRooms});
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Failed to fetch rooms" });
    }
  }
}

export default RoomController;
