class RoomDto {
    id;
    topic;
    roomType;
    ownerId;
    speakers;
    createdAt;
    // totalPeople;
    constructor(room) {
        this.id = room.id;
        this.topic = room.topic;
        this.roomType = room.roomType;
        this.ownerId = room.ownerId;
        this.speakers = room.speakers;
        this.createdAt = room.created_at;
        // this.totalPeople = room.totalPeople;
    }
}

export default RoomDto;